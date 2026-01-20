import type { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';

import { prisma } from '@/lib/prisma';

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.password) {
          throw new Error('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isPasswordValid) {
          throw new Error('Invalid credentials');
        }
        if (!user.emailVerified) {
          throw new Error('Email not verified');
        }
        return user;
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.image = user.image;
      }
      if (trigger === 'update' && session) {
        if (session.name) {
          token.name = session.name;
        }
        if (session.image) {
          token.image = session.image;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      if (session.user && token.name) {
        session.user.name = token.name as string;
      }
      if (session.user && token.email) {
        session.user.email = token.email as string;
      }
      if (session.user && token.image) {
        session.user.image = token.image as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const accountType = account.type ?? 'oauth';
        const providerAccountId = account.providerAccountId ?? null;
        const userEmail = user.email ?? null;
        if (!providerAccountId || !userEmail) {
          console.error('Google sign-in missing identifiers or email.');
          return false;
        }
        const existingUser = await prisma.user.findUnique({
          where: { email: userEmail },
          include: { accounts: true },
        });
        if (existingUser) {
          const googleAccount = existingUser.accounts.find(
            (acc) =>
              acc.provider === 'google' &&
              acc.providerAccountId === providerAccountId
          );
          if (googleAccount) {
            return true;
          }
          try {
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: accountType,
                provider: account.provider,
                providerAccountId,
                refresh_token: account.refresh_token ?? null,
                access_token: account.access_token ?? null,
                expires_at: account.expires_at ?? null,
                token_type: account.token_type ?? null,
                scope: account.scope ?? null,
                id_token: account.id_token ?? null,
                session_state: account.session_state ?? null,
              },
            });
            return true;
          } catch (error) {
            console.error('Error linking account:', error);
            return false;
          }
        }
        try {
          await prisma.user.create({
            data: {
              name: user.name ?? null,
              email: userEmail,
              image: user.image ?? null,
              emailVerified: new Date(),
              accounts: {
                create: {
                  type: accountType,
                  provider: account.provider,
                  providerAccountId,
                  refresh_token: account.refresh_token ?? null,
                  access_token: account.access_token ?? null,
                  expires_at: account.expires_at ?? null,
                  token_type: account.token_type ?? null,
                  scope: account.scope ?? null,
                  id_token: account.id_token ?? null,
                  session_state: account.session_state ?? null,
                },
              },
            },
          });
          return true;
        } catch (error) {
          console.error('Error creating user and linking account:', error);
          return false;
        }
      }
      if (user?.email) {
        const userInDb = await prisma.user.findUnique({
          where: { email: user.email },
          include: { subscriptions: true },
        });
        if (userInDb && userInDb.subscriptions.length === 0) {
          await prisma.subscription.create({
            data: {
              userId: userInDb.id,
              planId: 'free',
              status: 'active',
            },
          });
        }
      }
      return true;
    },
  },
};
