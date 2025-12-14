import 'server-only';
import { prisma } from './prisma';
import { FREE_PLAN_ID, PREMIUM_PLAN_ID } from './subscription-constants';

import type { User } from '@prisma/client';

export async function getUserSubscription(userId: string) {
  // Récupérer l'abonnement le plus récent de l'utilisateur, quel que soit son statut.
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: userId,
    },
    orderBy: {
      startDate: 'desc',
    },
  });

  // Si aucun abonnement n'existe, cela peut être un nouvel utilisateur.
  // La logique de création d'un abonnement gratuit initial devrait être gérée à l'inscription.
  // Pour l'instant, on renvoie ce qu'on trouve, ou null.
  return subscription;
}

export function isPremium(subscription: { planId: string } | null) {
  return subscription?.planId === PREMIUM_PLAN_ID;
}

export function isFree(subscription: { planId: string } | null) {
  return !subscription || subscription.planId === FREE_PLAN_ID;
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
