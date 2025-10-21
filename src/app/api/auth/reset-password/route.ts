import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();

  if (!token || !password) {
    return NextResponse.json({ error: 'Le jeton et le mot de passe sont requis' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { passwordResetToken: token },
    });

    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      return NextResponse.json({ error: 'Jeton de réinitialisation de mot de passe invalide ou expiré' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return NextResponse.json({ message: 'Le mot de passe a été réinitialisé avec succès.' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Une erreur est survenue lors de la réinitialisation du mot de passe.' }, { status: 500 });
  }
}