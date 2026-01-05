import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FaBookReader, FaUsers, FaSearch, FaQuoteLeft } from 'react-icons/fa';
import { Metadata } from 'next';
import SubscriptionPlans from "@/components/SubscriptionPlans";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  pageTitle: 'Accueil',
  description:
    'Shelfy accompagne les lecteurs francophones avec une bibliothèque intelligente, des clubs de lecture dynamiques et des recommandations personnalisées.',
  path: '/',
  keywords: ['plateforme de lecture', 'clubs de lecture', 'bibliothèque intelligente'],
});

export default async function HomePage() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-20 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-extrabold leading-tight text-foreground md:text-6xl">
            Bienvenue sur Shelfy
          </h1>
          <p className="mt-4 text-2xl text-muted-foreground">
            Votre Univers de Lecture Collaborative
          </p>
          <p className="mt-6 mx-auto max-w-2xl text-lg text-muted-foreground">
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
          <h2 className="mb-2 text-4xl font-bold">Une plateforme, des possibilités infinies</h2>
          <p className="mb-12 text-lg text-muted-foreground">Tout ce dont vous avez besoin pour une expérience de lecture enrichie.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="feature-card rounded-2xl bg-card p-6 shadow-lg">
              <div className="mb-4 inline-block rounded-full bg-primary/15 p-4">
                <FaUsers className="text-5xl text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">Clubs de Lecture Dynamiques</h3>
              <p className="text-muted-foreground">Créez ou rejoignez des groupes pour discuter de vos œuvres préférées, organiser des lectures communes et partager vos analyses.</p>
            </div>
            <div className="feature-card rounded-2xl bg-card p-6 shadow-lg">
              <div className="mb-4 inline-block rounded-full bg-primary/15 p-4">
                <FaBookReader className="text-5xl text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">Bibliothèque Personnelle</h3>
              <p className="text-muted-foreground">Suivez vos lectures, notez vos livres, et gardez une trace de votre parcours littéraire. Votre historique de lecture, toujours à portée de main.</p>
            </div>
            <div className="feature-card rounded-2xl bg-card p-6 shadow-lg">
              <div className="mb-4 inline-block rounded-full bg-primary/15 p-4">
                <FaSearch className="text-5xl text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">Découverte Intelligente</h3>
              <p className="text-muted-foreground">Trouvez votre prochain coup de cœur grâce à notre puissant moteur de recherche et à des suggestions basées sur vos goûts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-muted/20 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-12 text-4xl font-bold">Comment ça marche ?</h2>
          <div className="grid grid-cols-1 gap-8 text-left md:grid-cols-3">
            <div className="rounded-lg border-t-4 border-primary bg-card p-6 shadow-lg">
              <span className="text-3xl font-bold text-primary">1.</span>
              <h3 className="text-xl font-semibold mt-2">Inscrivez-vous</h3>
              <p className="text-muted-foreground mt-1">Créez votre profil en quelques secondes et personnalisez votre espace.</p>
            </div>
            <div className="rounded-lg border-t-4 border-primary/60 bg-card p-6 shadow-lg">
              <span className="text-3xl font-bold text-primary/70">2.</span>
              <h3 className="text-xl font-semibold mt-2">Explorez</h3>
              <p className="text-muted-foreground mt-1">Rejoignez un groupe de lecture existant ou créez le vôtre. Ajoutez des livres à votre bibliothèque.</p>
            </div>
            <div className="rounded-lg border-t-4 border-primary/40 bg-card p-6 shadow-lg">
              <span className="text-3xl font-bold text-primary/50">3.</span>
              <h3 className="text-xl font-semibold mt-2">Partagez</h3>
              <p className="text-muted-foreground mt-1">Lisez, discutez, et partagez vos avis avec des membres qui partagent vos passions.</p>
            </div>
          </div>
        </div>
      </section>

      <SubscriptionPlans />

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-12 text-4xl font-bold">Ils parlent de nous</h2>
          <div className="max-w-3xl mx-auto">
            <div className="relative rounded-xl bg-card p-8 shadow-lg">
              <FaQuoteLeft className="absolute top-4 left-4 text-5xl text-primary/20 opacity-50" />
              <p className="relative z-10 text-lg italic text-muted-foreground">"Shelfy a transformé ma manière de lire. J'ai découvert des pépites et rencontré des gens formidables dans mon club de science-fiction. C'est devenu mon rendez-vous littéraire incontournable !"</p>
              <p className="mt-6 font-semibold text-foreground">- Marie D., Membre depuis 2024</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
