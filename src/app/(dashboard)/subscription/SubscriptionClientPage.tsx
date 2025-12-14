'use client';

import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useSession } from 'next-auth/react';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { FREE_PLAN_ID, PREMIUM_PLAN_ID } from '@/lib/subscription-constants';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

// Assurez-vous que ces variables d'environnement sont définies
const STRIPE_PREMIUM_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID;
const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export default function SubscriptionPage() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();
  const { data: subscription, isLoading: isLoadingUserSubscription } = useUserSubscription(userId);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('success')) {
      toast({
        title: 'Abonnement réussi !',
        description: 'Votre abonnement Premium est maintenant actif.',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['userSubscription', userId] });
    }
    if (searchParams.get('canceled')) {
      toast({
        title: 'Abonnement annulé',
        description: 'Votre processus d\'abonnement a été annulé.',
        variant: 'destructive',
      });
    }
  }, [searchParams, toast, queryClient, userId]);

  const handleUpgradeToPremium = async () => {
    if (!STRIPE_PREMIUM_PRICE_ID || !STRIPE_PUBLISHABLE_KEY) {
      toast({
        title: 'Erreur de configuration',
        description: 'Les clés Stripe ne sont pas configurées correctement.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId: STRIPE_PREMIUM_PRICE_ID }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Échec de la création de la session de paiement.');
      }

      const { url } = await response.json();
      router.push(url);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      toast({
        title: 'Erreur de paiement',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleDowngradeToFree = async () => {
    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Échec de l\'annulation de l\'abonnement.');
      }

      const { message } = await response.json();
      toast({
        title: 'Annulation programmée',
        description: message,
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['userSubscription', userId] });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Échec de la création de la session du portail.');
      }

      const { url } = await response.json();
      router.push(url);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const isUserCurrentlyPremium = subscription?.planId === PREMIUM_PLAN_ID && subscription?.status === 'active';
  const isPremiumCancellationPending = subscription?.planId === PREMIUM_PLAN_ID && subscription?.status === 'canceled_at_period_end';
  const isUserCurrentlyFree = subscription?.planId === FREE_PLAN_ID && subscription?.status === 'active';

  // Si le chargement est en cours, ou si l'utilisateur n'est pas connecté
  if (isLoadingUserSubscription || !userId) {
    return <div>Chargement de l'abonnement...</div>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 bg-gray-50">
      <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 text-gray-800">
        Nos Plans d'Abonnement
      </h1>
      <p className="text-lg md:text-xl text-center text-muted-foreground mb-12 max-w-2xl">
        Choisissez le plan qui correspond le mieux à vos besoins de lecture en groupe.
      </p>

      {isPremiumCancellationPending && subscription?.endDate && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-8 w-full max-w-5xl" role="alert">
          <p className="font-bold">Information sur votre abonnement</p>
          <p>Votre abonnement Premium est programmé pour être annulé le {new Date(subscription.endDate).toLocaleDateString('fr-FR')}.</p>
          <p>À cette date, vous basculerez automatiquement vers le plan Gratuit.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl w-full">
        {/* Carte du Plan Gratuit */}
        <Card className={`relative flex flex-col justify-between p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 ${isUserCurrentlyFree ? 'border-2 border-blue-600' : ''}`}>
          {isUserCurrentlyFree && (
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
              Plan Actuel
            </div>
          )}
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
            {isUserCurrentlyPremium || isPremiumCancellationPending ? (
              isPremiumCancellationPending ? (
                <Button variant="outline" className="w-full text-lg py-3 cursor-not-allowed" disabled>
                  Annulation programmée
                </Button>
              ) : (
                <Button onClick={handleDowngradeToFree} variant="outline" className="w-full text-lg py-3">
                  Revenir au plan Gratuit
                </Button>
              )
            ) : (
              <Button className="w-full bg-gray-300 text-gray-800 text-lg py-3 cursor-not-allowed" disabled>
                Plan Actuel
              </Button>
            )}
          </div>
        </Card>

        {/* Carte du Plan Premium */}
        <Card className={`relative flex flex-col justify-between p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 ${isUserCurrentlyPremium || isPremiumCancellationPending ? 'border-2 border-blue-600' : ''}`}>
          {(isUserCurrentlyPremium || isPremiumCancellationPending) && (
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
              Plan Actuel
            </div>
          )}
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
            {isUserCurrentlyPremium ? (
              <Button onClick={handleManageSubscription} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-3">
                Gérer l'abonnement
              </Button>
            ) : isPremiumCancellationPending ? (
              <Button className="w-full bg-gray-300 text-gray-800 text-lg py-3 cursor-not-allowed" disabled>
                Annulation programmée
              </Button>
            ) : (
              <Button onClick={handleUpgradeToPremium} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-3">
                Passer au Premium
              </Button>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}
