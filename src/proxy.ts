
// export { default } from "next-auth/middleware";

import { withAuth } from "next-auth/middleware"

export default withAuth(
  // `withAuth` étend votre `Request` avec l'objet `user`.
  // Vous pouvez faire des vérifications de rôle ici.
  function proxy(req) {
    // console.log(req.nextauth.token)
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // Si un token existe, l'utilisateur est autorisé
        return !!token
      },
    },
    pages: {
        signIn: '/auth/login', // Page de connexion personnalisée
    }
  }
)


// Spécifie les routes à protéger
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/discover/:path*',
    '/library/:path*',
    '/groups/:path*',
    '/profile/:path*',
    '/reviews/:path*',
  ],
};
