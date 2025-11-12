import { prisma } from '@/lib/prisma';
import { RoleInGroup } from '@prisma/client';
import { canCreateMoreGroups } from './subscription-utils';
import { SubscriptionLimitError } from './errors';

function generateCode(length: number) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createGroup(createGroupDto: { name: string; description?: string; avatar_url?: string }, userId: string) {
  // Vérifier la limite d'abonnement
  const canCreate = await canCreateMoreGroups(userId);
  if (!canCreate) {
    throw new SubscriptionLimitError('Vous avez atteint la limite de création de groupes pour votre plan d\'abonnement.');
  }

  const { name, description, avatar_url } = createGroupDto;

  const invitation_code = generateCode(10);

  // Utilise une transaction pour s'assurer que la création du groupe ET l'ajout du membre admin réussissent ou échouent ensemble
  const group = await prisma.$transaction(async (tx) => {
    const newGroup = await tx.group.create({
      data: {
        name,
        description,
        avatar_url,
        created_by_id: userId,
        invitation_code,
      },
    });

    await tx.groupMember.create({
      data: {
        group_id: newGroup.id,
        user_id: userId,
        role: RoleInGroup.ADMIN,
        invited_by_id: userId,
      },
    });

    return newGroup;
  });

  return group;
}


export async function deleteGroup(groupId: string, userId: string): Promise<void> {
  const member = await prisma.groupMember.findUnique({
    where: {
      group_id_user_id: {
        group_id: groupId,
        user_id: userId,
      },
    },
    select: {
      role: true,
    },
  });

  if (!member || member.role !== RoleInGroup.ADMIN) {
    throw new Error('User is not an admin of this group.');
  }

  // Prisma gère la suppression en cascade (définie dans le schéma), 
  // donc supprimer le groupe supprimera automatiquement les GroupMember.
  await prisma.group.delete({
    where: { id: groupId },
  });
}

export async function updateGroup(groupId: string, updateGroupDto: { name?: string; description?: string; avatar_url?: string }, userId: string) {
  const member = await prisma.groupMember.findUnique({
    where: {
      group_id_user_id: {
        group_id: groupId,
        user_id: userId,
      },
    },
    select: {
      role: true,
    },
  });

  if (!member || member.role !== RoleInGroup.ADMIN) {
    throw new Error('User is not an admin of this group.');
  }

  const updatedGroup = await prisma.group.update({
    where: { id: groupId },
    data: updateGroupDto,
  });

  return updatedGroup;
}

export async function joinGroup(invitationCode: string, userId: string) {
  const group = await prisma.group.findUnique({
    where: { invitation_code: invitationCode },
    select: { id: true },
  });

  if (!group) {
    throw new Error("Code d'invitation invalide ou expiré.");
  }

  const existingMember = await prisma.groupMember.findUnique({
    where: {
      group_id_user_id: {
        group_id: group.id,
        user_id: userId,
      },
    },
  });

  if (existingMember) {
    throw new Error('Vous êtes déjà membre de ce groupe.');
  }

  await prisma.groupMember.create({
    data: {
      group_id: group.id,
      user_id: userId,
      role: RoleInGroup.MEMBER,
      invited_by_id: inviterId || group.created_by_id,
    },
  });

  return { message: 'Groupe rejoint avec succès !', inviterId: inviterId || group.created_by_id };
}

export async function leaveGroup(groupId: string, userId: string) {
  const existingMember = await prisma.groupMember.findUnique({
    where: {
      group_id_user_id: {
        group_id: groupId,
        user_id: userId,
      },
    },
  });

  if (!existingMember) {
    throw new Error("Vous n'êtes pas membre de ce groupe ou le groupe n'existe pas.");
  }

  if (existingMember.role === RoleInGroup.ADMIN) {
    const adminCount = await prisma.groupMember.count({
      where: {
        group_id: groupId,
        role: RoleInGroup.ADMIN,
      },
    });

    if (adminCount === 1) {
      const memberCount = await prisma.groupMember.count({
        where: {
          group_id: groupId,
        },
      });

      if (memberCount === 1) {
        throw new Error("Vous êtes le dernier membre et l'administrateur de ce groupe. Vous ne pouvez pas le quitter.");
      }
    }
  }

  await prisma.groupMember.delete({
    where: {
      id: existingMember.id,
    },
  });

  return { message: 'Vous avez quitté le groupe avec succès.' };
}

export async function regenerateInvitationCode(groupId: string, userId: string) {
  const member = await prisma.groupMember.findUnique({
    where: {
      group_id_user_id: {
        group_id: groupId,
        user_id: userId,
      },
    },
    select: { role: true },
  });

  if (!member || member.role !== RoleInGroup.ADMIN) {
    throw new Error('Unauthorized: User is not an admin of this group.');
  }

  const newCode = generateCode(10);

  const updatedGroup = await prisma.group.update({
    where: { id: groupId },
    data: { invitation_code: newCode },
    select: {
      invitation_code: true,
    },
  });

  return updatedGroup;
}

export async function getGroup(groupId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });

  if (!group) {
    throw new Error('Group not found.');
  }

  return group;
}