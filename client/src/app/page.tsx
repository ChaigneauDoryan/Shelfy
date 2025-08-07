
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FaBookReader, FaUsers, FaSearch, FaQuoteLeft } from 'react-icons/fa';

export default function HomePage() {
  return (
    <div className="bg-white text-gray-800">
      {/* Hero Section */}
      <section className="text-center py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
            Bienvenue sur Codex
          </h1>
          <p className="mt-4 text-2xl text-gray-600">
            Votre Univers de Lecture Collaborative
          </p>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-500">
            Plongez dans des mondes littéraires, partagez vos passions et découvrez votre prochaine grande lecture au sein d'une communauté de passionnés.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300">
                Rejoindre la communauté
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300 border-gray-300 hover:bg-gray-100">
                J'ai déjà un compte
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-2">Une plateforme, des possibilités infinies</h2>
          <p className="text-lg text-gray-600 mb-12">Tout ce dont vous avez besoin pour une expérience de lecture enrichie.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="feature-card p-6">
              <div className="p-4 bg-blue-100 rounded-full inline-block mb-4">
                <FaUsers className="text-5xl text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">Clubs de Lecture Dynamiques</h3>
              <p className="text-gray-500">Créez ou rejoignez des groupes pour discuter de vos œuvres préférées, organiser des lectures communes et partager vos analyses.</p>
            </div>
            <div className="feature-card p-6">
              <div className="p-4 bg-blue-100 rounded-full inline-block mb-4">
                <FaBookReader className="text-5xl text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">Bibliothèque Personnelle</h3>
              <p className="text-gray-500">Suivez vos lectures, notez vos livres, et gardez une trace de votre parcours littéraire. Votre historique de lecture, toujours à portée de main.</p>
            </div>
            <div className="feature-card p-6">
              <div className="p-4 bg-blue-100 rounded-full inline-block mb-4">
                <FaSearch className="text-5xl text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">Découverte Intelligente</h3>
              <p className="text-gray-500">Trouvez votre prochain coup de cœur grâce à notre puissant moteur de recherche et à des suggestions basées sur vos goûts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-12">Comment ça marche ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="p-6 bg-white rounded-lg shadow-lg border-t-4 border-blue-500">
              <span className="text-3xl font-bold text-blue-600">1.</span>
              <h3 className="text-xl font-semibold mt-2">Inscrivez-vous</h3>
              <p className="text-gray-500 mt-1">Créez votre profil en quelques secondes et personnalisez votre espace.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-lg border-t-4 border-green-500">
              <span className="text-3xl font-bold text-green-600">2.</span>
              <h3 className="text-xl font-semibold mt-2">Explorez</h3>
              <p className="text-gray-500 mt-1">Rejoignez un groupe de lecture existant ou créez le vôtre. Ajoutez des livres à votre bibliothèque.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-lg border-t-4 border-purple-500">
              <span className="text-3xl font-bold text-purple-600">3.</span>
              <h3 className="text-xl font-semibold mt-2">Partagez</h3>
              <p className="text-gray-500 mt-1">Lisez, discutez, et partagez vos avis avec des membres qui partagent vos passions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-12">Ils parlent de nous</h2>
          <div className="max-w-3xl mx-auto">
            <div className="bg-gray-100 p-8 rounded-xl shadow-lg relative">
              <FaQuoteLeft className="absolute top-4 left-4 text-5xl text-blue-200 opacity-50" />
              <p className="text-lg text-gray-600 italic relative z-10">"Codex a transformé ma manière de lire. J'ai découvert des pépites et rencontré des gens formidables dans mon club de science-fiction. C'est devenu mon rendez-vous littéraire incontournable !"</p>
              <p className="mt-6 font-semibold text-gray-800">- Marie D., Membre depuis 2024</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-10">
        <div className="container mx-auto px-4 text-center">
          <p className="text-2xl font-bold mb-2">Codex</p>
          <p className="mb-4">Votre aventure littéraire commence ici.</p>
          <div className="flex justify-center space-x-6 mb-6">
            {/* Add social media links here */}
          </div>
          <p className="text-gray-400 text-sm">&copy; {new Date().getFullYear()} Codex. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
