
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
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (existingUser) {
          return true; // User exists, sign in is allowed
        }

        // If user does not exist, create a new user
        try {
          await prisma.user.create({
            data: {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
              emailVerified: new Date(),
            },
          });
          return true;
        } catch (error) {
          console.error('Error creating user:', error);
          return false; // Prevent sign in
        }
      }
      return true; // For other providers, allow sign in
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
