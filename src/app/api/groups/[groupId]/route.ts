
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth'; // Assumant que vous aurez un helper pour la session
import { deleteGroup, updateGroup } from '@/lib/group-utils';
import { prisma } from '@/lib/prisma';

// GET /api/groups/[groupId] - Récupérer les détails d'un groupe
export async function GET(request: Request, { params }: { params: { groupId: string } }) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { groupId } = params;

  try {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    }

    // Vérifier si l'utilisateur est membre du groupe pour pouvoir le voir
    const isMember = group.members.some((member) => member.user_id === session.user.id);
    if (!isMember) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const adminCount = group.members.filter(member => member.role === 'ADMIN').length;
    const memberCount = group.members.length;

    return NextResponse.json({ ...group, adminCount, memberCount });
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json({ message: 'Failed to fetch group' }, { status: 500 });
  }
}

// DELETE /api/groups/[groupId] - Supprimer un groupe
export async function DELETE(request: Request, { params }: { params: { groupId: string } }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { groupId } = params;

  try {
    
    await deleteGroup(groupId, userId);
    return NextResponse.json({ message: 'Groupe supprimé avec succès.' });
  } catch (error: any) {
    console.error('Error deleting group:', error.message);
    return NextResponse.json({ message: error.message }, { status: 403 });
  }
}

// PATCH /api/groups/[groupId] - Mettre à jour un groupe
export async function PATCH(request: Request, { params }: { params: { groupId: string } }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { groupId } = params;
  const updateGroupDto = await request.json();

  try {
    
    const group = await updateGroup(groupId, updateGroupDto, userId);
    return NextResponse.json(group);
  } catch (error: any) {
    console.error('Error updating group:', error.message);
    return NextResponse.json({ message: 'Failed to update group.' }, { status: 500 });
  }
}
