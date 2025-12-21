'use client';

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionPlans() {
  return (
    <section className="w-full bg-muted/20 py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Nos Plans d'Abonnement</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Choisissez le plan qui correspond le mieux à vos besoins de lecture en groupe.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-1 lg:grid-cols-2 lg:gap-12 mt-12">
          {/* Carte du Plan Gratuit */}
          <Card className="flex flex-col justify-between bg-card p-6 text-card-foreground shadow-lg transition-shadow duration-300 hover:shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-3xl font-bold text-primary">Plan Gratuit</CardTitle>
              <p className="text-muted-foreground">Idéal pour les petits groupes et la découverte.</p>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center"><CheckCircle2 className="mr-2 text-primary" /> Gestion de groupes : Jusqu'à 2</li>
                <li className="flex items-center"><CheckCircle2 className="mr-2 text-primary" /> Membres par groupe : Jusqu'à 5</li>
                <li className="flex items-center"><CheckCircle2 className="mr-2 text-primary" /> Livres personnels : Jusqu'à 10</li>
                <li className="flex items-center"><CheckCircle2 className="mr-2 text-primary" /> Sondages : De base</li>
                <li className="flex items-center"><CheckCircle2 className="mr-2 text-primary" /> Suivi de lecture et commentaires</li>
                <li className="flex items-center"><CheckCircle2 className="mr-2 text-primary" /> Statistiques : Personnelles de base</li>
                <li className="flex items-center"><CheckCircle2 className="mr-2 text-primary" /> Recommandations : Basiques</li>
                <li className="flex items-center"><XCircle className="mr-2 text-destructive" /> Rôles de membres personnalisés</li>
                <li className="flex items-center"><XCircle className="mr-2 text-destructive" /> Personnalisation du groupe</li>
                <li className="flex items-center"><XCircle className="mr-2 text-destructive" /> Notes privées sur les livres</li>
                <li className="flex items-center"><CheckCircle2 className="mr-2 text-primary" /> Support : Standard</li>
              </ul>
              <div className="mt-6 text-2xl font-bold text-foreground">0€ / mois</div>
            </CardContent>
            <div className="mt-6">
              <Link href="/auth/signup" passHref>
                <Button className="w-full text-lg py-3">
                  Commencer
                </Button>
              </Link>
            </div>
          </Card>

          {/* Carte du Plan Premium */}
          <Card className="flex flex-col justify-between border-2 border-primary bg-card p-6 text-card-foreground shadow-lg transition-shadow duration-300 hover:shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-3xl font-bold text-primary">Plan Premium</CardTitle>
              <p className="text-muted-foreground">Pour les lecteurs passionnés et les grands groupes.</p>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center"><CheckCircle2 className="mr-2 text-primary" /> Gestion de groupes : Illimités</li>
                <li className="flex items-center"><CheckCircle2 className="mr-2 text-primary" /> Membres par groupe : Illimités</li>
                <li className="flex items-center"><CheckCircle2 className="mr-2 text-primary" /> Livres personnels : Illimités</li>
                <li className="flex items-center"><CheckCircle2 className="mr-2 text-primary" /> Sondages : Avancés</li>
                <li className="flex items-center"><CheckCircle2 className="mr-2 text-primary" /> Suivi de lecture et commentaires</li>
                <li className="flex items-center"><CheckCircle2 className="mr-2 text-primary" /> Statistiques : Détaillées et avancées</li>
                <li className="flex items-center"><CheckCircle2 className="mr-2 text-primary" /> Recommandations : Intelligentes</li>
                <li className="flex items-center"><CheckCircle2 className="mr-2 text-primary" /> Rôles de membres personnalisés</li>
                <li className="flex items-center"><CheckCircle2 className="mr-2 text-primary" /> Personnalisation du groupe</li>
                <li className="flex items-center"><CheckCircle2 className="mr-2 text-primary" /> Notes privées sur les livres</li>
                <li className="flex items-center"><CheckCircle2 className="mr-2 text-primary" /> Support : Prioritaire</li>
              </ul>
              <div className="mt-6 text-2xl font-bold text-foreground">9.99€ / mois</div>
            </CardContent>
            <div className="mt-6">
              <Link href="/auth/signup" passHref>
                <Button className="w-full text-lg py-3">
                  Choisir Premium
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
