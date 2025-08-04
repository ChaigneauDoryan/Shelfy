import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-gray-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-white hover:text-gray-300 transition duration-300">
          Codex
        </Link>
        <div>
          <Link href="/auth/login" className="text-white hover:text-gray-300 px-4 py-2 rounded-md transition duration-300">
            Connexion
          </Link>
          <Link href="/auth/signup" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 ml-4">
            Inscription
          </Link>
        </div>
      </div>
    </nav>
  );
}