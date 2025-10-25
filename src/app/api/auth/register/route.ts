
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import EmailVerificationEmail from '@/emails/EmailVerificationEmail';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.emailVerified) {
      return NextResponse.json({ message: 'User already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationTokenExpires = new Date(Date.now() + 24 * 3600 * 1000); // 24 hours

    if (existingUser) {
      await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          emailVerificationToken,
          emailVerificationTokenExpires,
        },
      });
    } else {
      await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          emailVerificationToken,
          emailVerificationTokenExpires,
        },
      });
    }

    const verificationLink = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${emailVerificationToken}`;

    await resend.emails.send({
      from: `Shelfy <${process.env.RESEND_FROM_EMAIL}>`,
      to: email,
      subject: 'Vérifiez votre adresse e-mail',
      react: EmailVerificationEmail({ validationLink: verificationLink }),
    });

    return NextResponse.json({ message: 'Un e-mail de vérification a été envoyé.' }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
