import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RoleInGroup } from '@prisma/client';
import { z } from 'zod';

interface RouteParams {
  groupId: string;
}

const createPollSchema = z.object({
  groupBookIds: z.array(z.string().min(1)).min(2, { message: 'Veuillez sélectionner au moins deux livres pour le sondage.' }),
  endDate: z.string().min(1, { message: 'Veuillez définir une date butoir pour le sondage.' }),
});

export async function POST(
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

  const json = await request.json();
  const parsed = createPollSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  }

  const { groupBookIds, endDate } = parsed.data;
  const endDateValue = new Date(endDate);
  if (Number.isNaN(endDateValue.getTime())) {
    return NextResponse.json({ message: 'Date de fin invalide.' }, { status: 400 });
  }

  try {
    // Vérifier si l'utilisateur est administrateur du groupe
    const member = await prisma.groupMember.findUnique({
      where: { group_id_user_id: { group_id: groupId, user_id: userId } },
    });

    if (!member || member.role !== RoleInGroup.ADMIN) {
      return NextResponse.json({ message: 'Forbidden: Seuls les administrateurs peuvent créer des sondages.' }, { status: 403 });
    }

    // Vérifier que les groupBookIds existent et appartiennent bien à ce groupe
    const existingGroupBooks = await prisma.groupBook.findMany({
      where: {
        id: { in: groupBookIds },
        group_id: groupId,
        status: 'SUGGESTED', // S'assurer que ce sont des suggestions
      },
    });

    if (existingGroupBooks.length !== groupBookIds.length) {
      return NextResponse.json({ message: 'Certains livres sélectionnés ne sont pas des suggestions valides pour ce groupe.' }, { status: 400 });
    }

    // Créer le sondage
    const newPoll = await prisma.poll.create({
      data: {
        group_id: groupId,
        end_date: endDateValue,
        options: {
          create: groupBookIds.map((gbId: string) => ({
            group_book_id: gbId,
          })),
        },
      },
    });

    // Mettre à jour le statut des GroupBook sélectionnés de 'SUGGESTED' à 'POLL_OPTION' ou similaire si nécessaire
    // Pour l'instant, nous les laissons en 'SUGGESTED' pour qu'ils puissent être réutilisés dans d'autres sondages ou devenir le livre du mois.
    // Si un livre est dans un sondage, il ne devrait plus être une "suggestion" simple.
    // Une option serait de changer leur statut ou de les lier au sondage.
    // Pour l'instant, je vais les laisser en 'SUGGESTED' et le frontend devra filtrer les suggestions déjà dans un sondage actif.

    return NextResponse.json(newPoll, { status: 201 });
  } catch (error) {
    console.error('Error creating poll:', error);
    return NextResponse.json({ message: 'Failed to create poll.', error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const resolvedParams = await context.params;
  const { groupId } = resolvedParams;

  try {
    const polls = await prisma.poll.findMany({
      where: {
        group_id: groupId,
      },
      include: {
        options: {
          include: {
            groupBook: {
              include: {
                book: true,
              },
            },
            votes: true,
          },
        },
      },
      orderBy: {
        end_date: 'desc', // Trier par date de fin, les plus récents en premier
      },
    });

    return NextResponse.json(polls);
  } catch (error) {
    console.error('Error fetching polls:', error);
    return NextResponse.json({ message: 'Failed to fetch polls.', error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
