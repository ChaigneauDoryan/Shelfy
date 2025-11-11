'use client';

import { useState } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"; // Pour les messages toast

export default function SubscriptionPage() {
  const { toast } = useToast();

  const handleUpgradeToPremium = () => {
    // Logique pour gérer l'abonnement Premium
    // Ici, on peut rediriger vers un portail de paiement ou appeler une API
    toast({
      title: 'Fonctionnalité en développement',
      description: 'La souscription au plan Premium est en cours de développement.',
    });
    // Exemple: router.push('/checkout/premium');
  };

  const handleDowngradeToFree = () => {
    // Logique pour gérer le passage au plan Gratuit
    toast({
      title: 'Fonctionnalité en développement',
      description: 'Le passage au plan Gratuit est en cours de développement.',
    });
    // Exemple: router.push('/settings/downgrade');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 bg-gray-50">
      <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 text-gray-800">
        Nos Plans d'Abonnement
      </h1>
      <p className="text-lg md:text-xl text-center text-muted-foreground mb-12 max-w-2xl">
        Choisissez le plan qui correspond le mieux à vos besoins de lecture en groupe.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl w-full">
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
              <li className="flex items-center"><CheckCircle2 className="text-orange-500 mr-2" /> Livres personnels : Jusqu'à 20</li>
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
            <Button className="w-full bg-gray-300 text-gray-800 text-lg py-3 cursor-not-allowed" disabled>
              Plan Actuel
            </Button>
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
            <Button onClick={handleUpgradeToPremium} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-3">
              Passer au Premium
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
