
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth'; // Assumant que vous aurez un helper pour la session
import { deleteGroup, updateGroup } from '@/lib/group-utils';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  groupId: string;
}

interface PatchRequestBody {
  name?: string;
  description?: string;
  avatar_url?: string;
}

// GET /api/groups/[groupId] - Récupérer les détails d'un groupe
export async function GET(
  request: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const resolvedParams = await context.params;
  const { groupId } = resolvedParams;

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
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const resolvedParams = await context.params;
  const { groupId } = resolvedParams;

  try {
    
    await deleteGroup(groupId, userId);
    return NextResponse.json({ message: 'Groupe supprimé avec succès.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting group:', message);
    return NextResponse.json({ message }, { status: 403 });
  }
}

// PATCH /api/groups/[groupId] - Mettre à jour un groupe
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const resolvedParams = await context.params;
  const { groupId } = resolvedParams;
  const updateGroupDto: PatchRequestBody = await request.json();

  try {
    
    const group = await updateGroup(groupId, updateGroupDto, userId);
    return NextResponse.json(group);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating group:', message);
    return NextResponse.json({ message: 'Failed to update group.' }, { status: 500 });
  }
}
