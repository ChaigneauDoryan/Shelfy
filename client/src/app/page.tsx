import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold">
          Bienvenue sur votre plateforme de lecture collaborative
        </h1>

        <p className="mt-3 text-2xl">
          Gérez votre bibliothèque, partagez vos avis et lisez en groupe.
        </p>

        <div className="flex flex-wrap items-center justify-around max-w-4xl mt-6 sm:w-full">
          <Link href="/auth/login" className="p-6 mt-6 text-left border w-96 rounded-xl hover:text-blue-600 focus:text-blue-600">
            <h3 className="text-2xl font-bold">Connexion &rarr;</h3>
            <p className="mt-4 text-xl">
              Connectez-vous à votre compte.
            </p>
          </Link>

          <Link href="/auth/signup" className="p-6 mt-6 text-left border w-96 rounded-xl hover:text-blue-600 focus:text-blue-600">
            <h3 className="text-2xl font-bold">Inscription &rarr;</h3>
            <p className="mt-4 text-xl">
              Créez un nouveau compte.
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}