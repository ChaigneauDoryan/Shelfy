import Link from 'next/link';

const features = [
  {
    title: "Gérez votre bibliothèque",
    description: "Organisez vos livres, suivez vos lectures et découvrez de nouveaux titres.",
    icon: "📚",
  },
  {
    title: "Partagez vos avis",
    description: "Échangez avec d'autres lecteurs, notez et commentez vos livres préférés.",
    icon: "💬",
  },
  {
    title: "Lisez en groupe",
    description: "Créez des clubs de lecture, participez à des discussions et lisez ensemble.",
    icon: "👥",
  },
  {
    title: "Découvrez de nouveaux horizons",
    description: "Explorez des genres variés et trouvez votre prochaine lecture coup de cœur.",
    icon: "✨",
  },
];

export default function Home() {
  // Trigger Tailwind JIT re-scan
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-purple-700 text-white py-20 md:py-32 flex items-center justify-center">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6 animate-fade-in-up">
            Bienvenue sur Codex : Votre Univers de Lecture Collaborative
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto opacity-0 animate-fade-in delay-200">
            Gérez votre bibliothèque, partagez vos avis et lisez en groupe. Connectez-vous pour explorer un monde de livres.
          </p>
          <div className="flex justify-center gap-4 opacity-0 animate-fade-in delay-400">
            <Link href="/auth/signup" className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-full text-lg transition duration-300 shadow-lg">
              S'inscrire maintenant
            </Link>
            <Link href="/auth/login" className="border border-white text-white hover:bg-white hover:text-blue-600 font-bold py-3 px-8 rounded-full text-lg transition duration-300">
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Découvrez nos fonctionnalités
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-lg p-8 text-center transform transition duration-300 hover:scale-105 hover:shadow-xl"
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-blue-600 text-white py-16 md:py-24 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Prêt à commencer votre aventure littéraire ?
          </h2>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            Rejoignez des milliers de lecteurs passionnés et transformez votre expérience de lecture.
          </p>
          <Link href="/auth/signup" className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-full text-lg transition duration-300 shadow-lg">
            S'inscrire gratuitement
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 text-center">
        <div className="container mx-auto px-4">
          <p>&copy; 2024 Codex. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}