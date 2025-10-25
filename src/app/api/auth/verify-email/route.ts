
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return new NextResponse('Missing token', { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });

    if (!user || !user.emailVerificationTokenExpires || user.emailVerificationTokenExpires < new Date()) {
      return new NextResponse('Invalid or expired verification token', { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerificationToken: null,
        emailVerificationTokenExpires: null,
      },
    });

    return NextResponse.redirect(new URL('/auth/login?message=EmailVerified', request.url));
  } catch (error) {
    console.error('Email verification error:', error);
    return new NextResponse('An unexpected error occurred.', { status: 500 });
  }
}
