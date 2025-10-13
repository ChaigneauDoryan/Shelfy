
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const { name, bio, image } = await request.json();

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name,
        bio: bio,
        image: image, // Correspond à avatar_url dans l'ancien schéma
      },
      select: { id: true, name: true, email: true, image: true, bio: true }, // Retourne les champs mis à jour
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ message: 'Failed to update profile' }, { status: 500 });
  }
}
