
import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          // L'utilisateur n'existe pas ou s'est inscrit via un provider OAuth (ex: Google)
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

        // Retourne l'objet utilisateur complet pour la session
        return user;
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  session: {
    strategy: 'jwt', // Utilise la stratégie JWT pour les sessions
  },
  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: '/auth/login', // Page de connexion personnalisée
    // signOut: '/auth/logout',
    // error: '/auth/error', // Page d'erreur
    // verifyRequest: '/auth/verify-request', // Page de vérification (pour les emails)
    // newUser: '/auth/new-user' // Page pour les nouveaux utilisateurs
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      if (token.name) {
        session.user.name = token.name as string;
      }
      if (token.email) {
        session.user.email = token.email as string;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      console.log('signIn callback', { user, account, profile });
      if (account.provider === 'google') {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { accounts: true }, // Include accounts to check for existing OAuth links
        });

        if (existingUser) {
          // If user exists, check if the Google account is already linked
          const googleAccount = existingUser.accounts.find(
            (acc) => acc.provider === 'google' && acc.providerAccountId === account.providerAccountId
          );

          if (googleAccount) {
            return true; // Google account already linked, allow sign in
          } else {
            // User exists but Google account is not linked. Link it.
            try {
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  refresh_token: account.refresh_token,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                  session_state: account.session_state,
                },
              });
              return true; // Account linked, allow sign in
            } catch (error) {
              console.error('Error linking account:', error);
              return false; // Prevent sign in
            }
          }
        } else {
          // If user does not exist, create a new user and link the account
          try {
            await prisma.user.create({
              data: {
                name: user.name,
                email: user.email,
                image: user.image,
                emailVerified: new Date(),
                accounts: {
                  create: {
                    type: account.type,
                    provider: account.provider,
                    providerAccountId: account.providerAccountId,
                    refresh_token: account.refresh_token, // Ensure all fields are included
                    access_token: account.access_token,
                    expires_at: account.expires_at,
                    token_type: account.token_type,
                    scope: account.scope,
                    id_token: account.id_token,
                    session_state: account.session_state,
                  },
                },
              },
            });
            return true;
          } catch (error) {
            console.error('Error creating user and linking account:', error);
            return false; // Prevent sign in
          }
        }
      }
      return true; // For other providers, allow sign in
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
