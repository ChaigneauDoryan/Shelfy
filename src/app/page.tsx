import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FaBookReader, FaUsers, FaSearch, FaQuoteLeft } from 'react-icons/fa';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shelfy - Home',
};

export default async function HomePage() {

  return (
    <div className="bg-white text-gray-800">
      {/* Hero Section */}
      <section className="text-center py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
            Bienvenue sur Shelfy
          </h1>
          <p className="mt-4 text-2xl text-gray-600">
            Votre Univers de Lecture Collaborative
          </p>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-500">
            Plongez dans des mondes littéraires, partagez vos passions et découvrez votre prochaine grande lecture au sein d'une communauté de passionnés.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/auth/signup" className="w-full sm:w-auto">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300 w-full">
                Rejoindre la communauté
              </Button>
            </Link>
            <Link href="/auth/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300 border-gray-300 hover:bg-gray-100 w-full mt-2 sm:mt-0">
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

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-12">Nos Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="p-8 border border-gray-200 rounded-lg shadow-lg flex flex-col">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Plan Gratuit</h3>
              <p className="text-5xl font-extrabold text-blue-600 mb-6">0€<span className="text-lg font-medium text-gray-500">/mois</span></p>
              <ul className="text-left text-gray-600 space-y-3 flex-grow">
                <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>Clubs de lecture illimités</li>
                <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>Bibliothèque personnelle</li>
                <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>Découverte de livres</li>
                <li className="flex items-center text-gray-400"><svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>Statistiques avancées</li>
                <li className="flex items-center text-gray-400"><svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>Support prioritaire</li>
              </ul>
              <Link href="/auth/signup" className="mt-8 w-full">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300 w-full">
                  Commencer Gratuitement
                </Button>
              </Link>
            </div>

            {/* Premium Plan */}
            <div className="p-8 border-2 border-blue-600 rounded-lg shadow-xl flex flex-col relative">
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">Populaire</div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Plan Premium</h3>
              <p className="text-5xl font-extrabold text-blue-600 mb-6">4.99€<span className="text-lg font-medium text-gray-500">/mois</span></p>
              <ul className="text-left text-gray-600 space-y-3 flex-grow">
                <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>Toutes les fonctionnalités du plan Gratuit</li>
                <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>Statistiques avancées</li>
                <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>Support prioritaire</li>
                <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>Accès anticipé aux nouvelles fonctionnalités</li>
              </ul>
              <Link href="/auth/signup" className="mt-8 w-full">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300 w-full">
                  Passer au Premium
                </Button>
              </Link>
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
              <p className="text-lg text-gray-600 italic relative z-10">"Shelfy a transformé ma manière de lire. J'ai découvert des pépites et rencontré des gens formidables dans mon club de science-fiction. C'est devenu mon rendez-vous littéraire incontournable !"</p>
              <p className="mt-6 font-semibold text-gray-800">- Marie D., Membre depuis 2024</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}