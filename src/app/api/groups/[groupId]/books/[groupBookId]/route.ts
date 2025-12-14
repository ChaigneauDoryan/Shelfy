import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RoleInGroup } from '@prisma/client';

interface RouteParams {
  groupId: string;
  groupBookId: string;
}

interface PatchRequestBody {
  reading_end_date?: string | null;
  rating?: number;
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ groupId: string; groupBookId: string; }> }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { groupId, groupBookId } = await context.params;
  const { reading_end_date, rating }: PatchRequestBody = await request.json(); // Accepter rating

  // Logique de mise à jour de la date de fin de lecture (pour les admins)
  if (reading_end_date !== undefined) { // Vérifier si reading_end_date est présent dans la requête
    let parsedDate: Date | null = null;
    if (reading_end_date) {
      try {
        parsedDate = new Date(reading_end_date);
        if (isNaN(parsedDate.getTime())) {
          return NextResponse.json({ message: 'Date de fin de lecture invalide.' }, { status: 400 });
        }
      } catch (e) {
        return NextResponse.json({ message: 'Format de date invalide.' }, { status: 400 });
      }
    }

    try {
      // 1. Vérifier si l'utilisateur est membre du groupe et a le rôle ADMIN
      const groupMember = await prisma.groupMember.findUnique({
        where: { group_id_user_id: { group_id: groupId, user_id: userId } },
      });

      if (!groupMember || groupMember.role !== RoleInGroup.ADMIN) {
        return NextResponse.json({ message: 'Forbidden: Seuls les administrateurs peuvent modifier cette date.' }, { status: 403 });
      }

      // 2. Vérifier si le groupBook existe et appartient à ce groupe
      const groupBook = await prisma.groupBook.findUnique({
        where: { id: groupBookId, group_id: groupId },
      });

      if (!groupBook) {
        return NextResponse.json({ message: 'Livre du groupe non trouvé.' }, { status: 404 });
      }

      // 3. Mettre à jour la date de fin de lecture
      const updatedGroupBook = await prisma.groupBook.update({
        where: { id: groupBookId },
        data: {
          reading_end_date: parsedDate,
        },
      });

      return NextResponse.json({ message: 'Date de fin de lecture mise à jour avec succès.', groupBook: updatedGroupBook });
    } catch (error) {
      console.error('Error updating reading end date:', error);
      return NextResponse.json({ message: 'Échec de la mise à jour de la date de fin de lecture.', error: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
  }

  // Logique de mise à jour de la note (pour tous les membres)
  if (rating !== undefined) { // Vérifier si rating est présent dans la requête
    if (typeof rating !== 'number' || rating < 0.5 || rating > 5 || rating % 0.5 !== 0) {
      return NextResponse.json({ message: 'La note doit être un nombre entre 0.5 et 5, par paliers de 0.5.' }, { status: 400 });
    }

    try {
      // 1. Vérifier si l'utilisateur est membre du groupe
      const groupMember = await prisma.groupMember.findUnique({
        where: { group_id_user_id: { group_id: groupId, user_id: userId } },
      });

      if (!groupMember) {
        return NextResponse.json({ message: 'Forbidden: Vous n\'êtes pas membre de ce groupe.' }, { status: 403 });
      }

      // 2. Vérifier si le groupBook existe et appartient à ce groupe
      const groupBook = await prisma.groupBook.findUnique({
        where: { id: groupBookId, group_id: groupId },
      });

      if (!groupBook) {
        return NextResponse.json({ message: 'Livre du groupe non trouvé.' }, { status: 404 });
      }

      // 3. Mettre à jour la note dans GroupMemberReadingProgress
      const updatedProgress = await prisma.groupMemberReadingProgress.upsert({
        where: {
          groupMemberId_groupBookId: {
            groupMemberId: groupMember.id,
            groupBookId: groupBook.id,
          },
        },
        update: {
          rating: rating,
        },
        create: {
          groupMemberId: groupMember.id,
          groupBookId: groupBook.id,
          rating: rating,
          currentPage: 0, // Valeur par défaut si la progression n'existait pas
        },
      });

      return NextResponse.json({ message: 'Note mise à jour avec succès.', progress: updatedProgress });
    } catch (error) {
      console.error('Error updating rating:', error);
      return NextResponse.json({ message: 'Échec de la mise à jour de la note.', error: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
  }

  return NextResponse.json({ message: 'Aucune donnée valide fournie pour la mise à jour.' }, { status: 400 });
}
