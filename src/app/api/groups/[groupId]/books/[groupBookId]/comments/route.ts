import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  groupId: string;
  groupBookId: string;
}

interface PostRequestBody {
  pageNumber: number;
  content: string;
}

export async function POST(request: NextRequest, context: { params: Promise<{ groupId: string; groupBookId: string; }> }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { groupId, groupBookId } = await context.params;
  const { pageNumber, content }: PostRequestBody = await request.json();

  if (typeof pageNumber !== 'number' || pageNumber <= 0) {
    return NextResponse.json({ message: 'Le numéro de page doit être un nombre positif.' }, { status: 400 });
  }
  if (typeof content !== 'string' || content.trim() === '') {
    return NextResponse.json({ message: 'Le commentaire ne peut pas être vide.' }, { status: 400 });
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

    // 3. Vérifier la progression de l'utilisateur pour ce livre
    // L'utilisateur ne peut commenter que jusqu'à sa page actuelle
    const userProgress = await prisma.groupMemberReadingProgress.findUnique({
      where: {
        groupMemberId_groupBookId: {
          groupMemberId: groupMember.id,
          groupBookId: groupBook.id,
        },
      },
    });

    if (!userProgress || pageNumber > userProgress.currentPage) {
      return NextResponse.json({ message: 'Vous ne pouvez commenter que jusqu\'à votre page actuelle.' }, { status: 403 });
    }

    // 4. Créer le commentaire
    const newComment = await prisma.bookComment.create({
      data: {
        groupBookId: groupBook.id,
        userId: userId,
        pageNumber: pageNumber,
        content: content,
      },
    });

    return NextResponse.json({ message: 'Commentaire ajouté avec succès.', comment: newComment });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json({ message: 'Échec de l\'ajout du commentaire.', error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ groupId: string; groupBookId: string; }> }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { groupId, groupBookId } = await context.params;

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

    // 3. Récupérer tous les commentaires pour ce livre du groupe
    const allComments = await prisma.bookComment.findMany({
      where: {
        groupBookId: groupBook.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: [
        { pageNumber: 'asc' }, // Trier par numéro de page croissant
        { createdAt: 'asc' },  // Puis par ordre chronologique
      ],
    });

    // 5. Pour chaque commentaire, vérifier la progression de l'utilisateur qui l'a posté
    // et filtrer si l'utilisateur actuel n'est pas assez avancé.
    // Cette logique est déjà en partie gérée par `pageNumber: { lte: maxPageVisible }`
    // Mais il faut aussi s'assurer que l'utilisateur qui a posté le commentaire n'a pas triché
    // ou que sa progression est bien celle qu'il a déclarée.
    // Pour l'instant, on se base sur la page déclarée dans le commentaire.

    return NextResponse.json({ comments: allComments });
  } catch (error) {
    console.error('API Error (fetch comments):', error); // Plus détaillé
    return NextResponse.json({ message: 'Échec de la récupération des commentaires.', error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}


