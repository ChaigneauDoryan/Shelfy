'use client';

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle2, Clock } from 'lucide-react';
import { useSession } from 'next-auth/react';

import { useUserSubscription } from '@/hooks/useUserSubscription';
import { FREE_PLAN_ID, PREMIUM_PLAN_ID } from '@/lib/subscription-constants';

const PLAN_FEATURES = {
  [FREE_PLAN_ID]: [
    "Groupes illimités pendant la bêta",
    "Membres illimités",
    "Bibliothèque personnelle complète",
    "Sondages et discussions intégrés",
    "Statistiques basiques et suivi de lecture",
    "Support standard",
  ],
  [PREMIUM_PLAN_ID]: [
    "Automatisation des suggestions avancées",
    "Statistiques détaillées",
    "Rôles personnalisés",
    "Personnalisation visuelle du groupe",
    "Support prioritaire",
  ],
};

export default function SubscriptionPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const { data: subscription } = useUserSubscription(userId);

  const plans = [
    {
      id: FREE_PLAN_ID,
      title: "Plan Gratuit Illimité",
      description: "Toutes les fonctionnalités actuelles sont offertes pendant la bêta publique.",
      price: "0€ / mois",
      badge: "Plan appliqué automatiquement",
      cta: "Inclus automatiquement",
      isComingSoon: false,
    },
    {
      id: PREMIUM_PLAN_ID,
      title: "Plan Premium (à venir)",
      description: "Fonctionnalités avancées en préparation pour optimiser l'expérience de vos clubs de lecture.",
      price: "Bientôt disponible",
      badge: "En cours de développement",
      cta: "Arrive bientôt",
      isComingSoon: true,
    },
  ];

  return (
    <main className="flex min-h-screen flex-col items-center justify-start gap-10 p-6 md:p-16 bg-gray-50">
      <section className="text-center max-w-3xl space-y-4">
        <p className="text-sm uppercase tracking-wide text-blue-600 font-semibold">Bêta publique</p>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Abonnements Shelfy</h1>
        <p className="text-lg text-gray-600">
          Shelfy est actuellement gratuit et illimité pour tout le monde. Nous préparons un plan Premium pour plus tard.
        </p>
      </section>

      <div className="w-full max-w-4xl rounded-xl border border-blue-200 bg-blue-50 p-6 text-center shadow-sm">
        <div className="flex flex-col items-center space-y-3">
          <Clock className="text-blue-600" size={32} />
          <p className="text-xl font-semibold text-blue-900">Fonctionnalité premium en chantier</p>
          <p className="text-blue-800 max-w-3xl">
            L'abonnement payant sera proposé plus tard. En attendant, aucun paiement n'est requis et aucune action n'est nécessaire de votre part.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl w-full">
        {plans.map((plan) => {
          const isCurrentPlan = subscription?.planId === plan.id || (!subscription && plan.id === FREE_PLAN_ID);
          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col justify-between p-6 shadow-lg bg-white ${
                isCurrentPlan ? 'border-2 border-blue-600' : 'border border-gray-200'
              }`}
            >
              <CardHeader className="pb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-3xl font-bold text-gray-900">{plan.title}</CardTitle>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${plan.isComingSoon ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                    {plan.badge}
                  </span>
                </div>
                <p className="text-gray-600">{plan.description}</p>
                <p className="text-2xl font-bold text-gray-800">{plan.price}</p>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <ul className="space-y-2 text-gray-700">
                  {PLAN_FEATURES[plan.id as keyof typeof PLAN_FEATURES]?.map((feature) => (
                    <li key={`${plan.id}-${feature}`} className="flex items-center">
                      <CheckCircle2 className="text-green-500 mr-2 h-5 w-5" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.isComingSoon ? 'default' : 'outline'}
                  className={`w-full text-lg py-3 ${plan.isComingSoon ? 'bg-gray-300 text-gray-800 cursor-not-allowed' : 'cursor-not-allowed'}`}
                  disabled
                >
                  {isCurrentPlan && !plan.isComingSoon ? 'Plan appliqué automatiquement' : plan.cta}
                </Button>
              </CardContent>
              {isCurrentPlan && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  Plan actuel
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </main>
  );
}
