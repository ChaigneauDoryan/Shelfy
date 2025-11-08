import { prisma } from './prisma';
import { User } from '@prisma/client';

export const FREE_PLAN_ID = 'free';
export const PREMIUM_PLAN_ID = 'premium';

export async function getUserSubscription(userId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: userId,
      status: 'active', // Ou tout autre statut indiquant un abonnement valide
    },
    orderBy: {
      startDate: 'desc', // Récupérer l'abonnement le plus récent
    },
  });

  if (!subscription) {
    // Si aucun abonnement actif n'est trouvé, l'utilisateur est sur le plan gratuit
    // Créer un abonnement gratuit par défaut si l'utilisateur n'en a pas
    const freeSubscription = await prisma.subscription.upsert({
      where: {
        userId_planId: {
          userId: userId,
          planId: FREE_PLAN_ID,
        },
      },
      update: {}, // Ne rien faire si l'abonnement gratuit existe déjà
      create: {
        userId: userId,
        planId: FREE_PLAN_ID,
        status: 'active',
        startDate: new Date(),
      },
    });
    return freeSubscription;
  }

  return subscription;
}

export function isPremium(subscription: { planId: string }) {
  return subscription.planId === PREMIUM_PLAN_ID;
}

export function isFree(subscription: { planId: string }) {
  return subscription.planId === FREE_PLAN_ID;
}

// Fonctions pour vérifier les limites
export async function canCreateMoreGroups(userId: string) {
  const subscription = await getUserSubscription(userId);
  if (isPremium(subscription)) {
    return true; // Les utilisateurs premium peuvent créer un nombre illimité de groupes
  }

  const groupCount = await prisma.group.count({
    where: { created_by_id: userId },
  });
  return groupCount < 2; // Limite de 2 groupes pour le plan gratuit
}

export async function canAddMoreMembers(groupId: string, userId: string) {
  const subscription = await getUserSubscription(userId);
  if (isPremium(subscription)) {
    return true; // Les utilisateurs premium peuvent ajouter un nombre illimité de membres
  }

  const memberCount = await prisma.groupMember.count({
    where: { group_id: groupId },
  });
  return memberCount < 5; // Limite de 5 membres pour le plan gratuit
}

export async function canAddMorePersonalBooks(userId: string) {
  const subscription = await getUserSubscription(userId);
  if (isPremium(subscription)) {
    return true; // Les utilisateurs premium peuvent ajouter un nombre illimité de livres
  }

  const personalBookCount = await prisma.userBook.count({
    where: { user_id: userId },
  });
  return personalBookCount < 10; // Limite de 10 livres pour le plan gratuit
}
