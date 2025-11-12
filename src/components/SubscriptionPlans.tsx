'use client';

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionPlans() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Nos Plans d'Abonnement</h2>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Choisissez le plan qui correspond le mieux à vos besoins de lecture en groupe.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-1 lg:grid-cols-2 lg:gap-12 mt-12">
          {/* Carte du Plan Gratuit */}
          <Card className="flex flex-col justify-between p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-3xl font-bold text-blue-600">Plan Gratuit</CardTitle>
              <p className="text-gray-600">Idéal pour les petits groupes et la découverte.</p>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center"><CheckCircle2 className="text-orange-500 mr-2" /> Gestion de groupes : Jusqu'à 2</li>
                <li className="flex items-center"><CheckCircle2 className="text-orange-500 mr-2" /> Membres par groupe : Jusqu'à 5</li>
                <li className="flex items-center"><CheckCircle2 className="text-orange-500 mr-2" /> Livres personnels : Jusqu'à 10</li>
                <li className="flex items-center"><CheckCircle2 className="text-green-500 mr-2" /> Sondages : De base</li>
                <li className="flex items-center"><CheckCircle2 className="text-green-500 mr-2" /> Suivi de lecture et commentaires</li>
                <li className="flex items-center"><CheckCircle2 className="text-green-500 mr-2" /> Statistiques : Personnelles de base</li>
                <li className="flex items-center"><CheckCircle2 className="text-green-500 mr-2" /> Recommandations : Basiques</li>
                <li className="flex items-center"><XCircle className="text-red-500 mr-2" /> Rôles de membres personnalisés</li>
                <li className="flex items-center"><XCircle className="text-red-500 mr-2" /> Personnalisation du groupe</li>
                <li className="flex items-center"><XCircle className="text-red-500 mr-2" /> Notes privées sur les livres</li>
                <li className="flex items-center"><CheckCircle2 className="text-green-500 mr-2" /> Support : Standard</li>
              </ul>
              <div className="text-2xl font-bold text-gray-800 mt-6">0€ / mois</div>
            </CardContent>
            <div className="mt-6">
              <Link href="/auth/signup" passHref>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-3">
                  Commencer
                </Button>
              </Link>
            </div>
          </Card>

          {/* Carte du Plan Premium */}
          <Card className="flex flex-col justify-between p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-blue-600">
            <CardHeader className="pb-4">
              <CardTitle className="text-3xl font-bold text-blue-600">Plan Premium</CardTitle>
              <p className="text-gray-600">Pour les lecteurs passionnés et les grands groupes.</p>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center"><CheckCircle2 className="text-green-500 mr-2" /> Gestion de groupes : Illimités</li>
                <li className="flex items-center"><CheckCircle2 className="text-green-500 mr-2" /> Membres par groupe : Illimités</li>
                <li className="flex items-center"><CheckCircle2 className="text-green-500 mr-2" /> Livres personnels : Illimités</li>
                <li className="flex items-center"><CheckCircle2 className="text-green-500 mr-2" /> Sondages : Avancés</li>
                <li className="flex items-center"><CheckCircle2 className="text-green-500 mr-2" /> Suivi de lecture et commentaires</li>
                <li className="flex items-center"><CheckCircle2 className="text-green-500 mr-2" /> Statistiques : Détaillées et avancées</li>
                <li className="flex items-center"><CheckCircle2 className="text-green-500 mr-2" /> Recommandations : Intelligentes</li>
                <li className="flex items-center"><CheckCircle2 className="text-green-500 mr-2" /> Rôles de membres personnalisés</li>
                <li className="flex items-center"><CheckCircle2 className="text-green-500 mr-2" /> Personnalisation du groupe</li>
                <li className="flex items-center"><CheckCircle2 className="text-green-500 mr-2" /> Notes privées sur les livres</li>
                <li className="flex items-center"><CheckCircle2 className="text-green-500 mr-2" /> Support : Prioritaire</li>
              </ul>
              <div className="text-2xl font-bold text-gray-800 mt-6">9.99€ / mois</div>
            </CardContent>
            <div className="mt-6">
              <Link href="/auth/signup" passHref>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-3">
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
