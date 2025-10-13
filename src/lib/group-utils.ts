
import { prisma } from '@/lib/prisma';

function generateCode(length: number) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createGroup(createGroupDto: { name: string; description?: string; avatar_url?: string }, userId: string) {
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
        role: 'admin',
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

  if (!member || member.role !== 'admin') {
    throw new Error('User is not an admin of this group.');
  }

  // Prisma gère la suppression en cascade (définie dans le schéma), 
  // donc supprimer le groupe supprimera automatiquement les GroupMember.
  await prisma.group.delete({
    where: { id: groupId },
  });
}

export async function updateGroup(groupId: string, updateGroupDto: { name?: string; description?: string; avatar_url?: string }) {
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
      role: 'member',
    },
  });

  return { message: 'Groupe rejoint avec succès !' };
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

  if (!member || (member.role !== 'admin' && member.role !== 'owner')) {
    throw new Error('Unauthorized: User is not an admin or owner of this group.');
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
