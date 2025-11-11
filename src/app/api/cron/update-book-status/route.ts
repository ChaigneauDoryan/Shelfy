// src/app/api/cron/update-book-status/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();

    // Find all current books where the end date has passed
    const booksToFinish = await prisma.groupBook.findMany({
      where: {
        status: 'CURRENT',
        reading_end_date: {
          not: null,
          lt: now, // 'lt' means less than
        },
      },
    });

    if (booksToFinish.length === 0) {
      return NextResponse.json({ message: 'Aucun livre à terminer.' }, { status: 200 });
    }

    // Update the status of each book
    for (const groupBook of booksToFinish) {
      await prisma.groupBook.update({
        where: { id: groupBook.id },
        data: {
          status: 'FINISHED',
          finished_at: groupBook.reading_end_date, // Set finished_at to the end date
        },
      });
      console.log(`Le livre de groupe ${groupBook.id} a été marqué comme "TERMINÉ".`);
    }

    return NextResponse.json({
      message: `${booksToFinish.length} livre(s) ont été marqués comme terminés.`,
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur dans le cron job de mise à jour du statut des livres:', error);
    return NextResponse.json({ message: 'Erreur lors de la mise à jour du statut des livres.' }, { status: 500 });
  }
}
