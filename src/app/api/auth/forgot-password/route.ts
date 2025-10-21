
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import PasswordResetEmail from '@/emails/PasswordResetEmail';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Don't reveal that the user doesn't exist
      return NextResponse.json({ message: 'Si un compte avec cette adresse e-mail existe, un lien de réinitialisation de mot de passe a été envoyé.' });
    }

    const passwordResetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken,
        passwordResetExpires,
      },
    });

    const resetLink = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${passwordResetToken}`;

    await resend.emails.send({
      from: `Shelfy <${process.env.RESEND_FROM_EMAIL}>` || 'noreply@example.com',
      to: email,
      subject: 'Reset your password',
      react: PasswordResetEmail({ resetLink }),
    });

    return NextResponse.json({ message: 'Si un compte avec cette adresse e-mail existe, un lien de réinitialisation de mot de passe a été envoyé.' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Une erreur est survenue lors de l\'envoi de l\'e-mail de réinitialisation de mot de passe.' }, { status: 500 });
  }
}
