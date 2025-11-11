// src/app/api/cron/send-reminders/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendReadingReminderEmail } from '@/lib/email-utils';

export async function GET() {
  try {
    const groupBooks = await prisma.groupBook.findMany({
      where: {
        reading_end_date: {
          not: null,
        },
      },
    });

    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    for (const groupBook of groupBooks) {
      if (groupBook.reading_end_date) {
        const endDate = new Date(groupBook.reading_end_date);

        // Logique pour le rappel de 24 heures
        // Si la date de fin est dans les prochaines 24 heures (mais pas encore dans les 2 dernières heures)
        // et que le rappel de 24h n'a pas été envoyé
        if (
          endDate > twoHoursFromNow && // La date de fin est après les 2 prochaines heures
          endDate <= twentyFourHoursFromNow && // La date de fin est dans les 24 prochaines heures
          !groupBook.reminder_sent // Le rappel de 24h n'a pas été envoyé
        ) {
          console.log(`Sending 24-hour reminder for groupBookId: ${groupBook.id}`);
          await sendReadingReminderEmail(groupBook.id); // La fonction sendReadingReminderEmail doit être adaptée pour prendre un type de rappel si nécessaire
          await prisma.groupBook.update({
            where: { id: groupBook.id },
            data: { reminder_sent: true },
          });
        }

        // Logique pour le rappel de 2 heures
        // Si la date de fin est dans les prochaines 2 heures
        // et que le rappel de 2h n'a pas été envoyé
        if (
          endDate > now && // La date de fin est dans le futur
          endDate <= twoHoursFromNow && // La date de fin est dans les 2 prochaines heures
          !groupBook.two_hour_reminder_sent // Le rappel de 2h n'a pas été envoyé
        ) {
          console.log(`Sending 2-hour reminder for groupBookId: ${groupBook.id}`);
          // Vous pouvez adapter sendReadingReminderEmail pour envoyer un message différent pour le rappel de 2h
          await sendReadingReminderEmail(groupBook.id);
          await prisma.groupBook.update({
            where: { id: groupBook.id },
            data: { two_hour_reminder_sent: true },
          });
        }
      }
    }

    return NextResponse.json({ message: 'Rappels de lecture traités.' }, { status: 200 });
  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json({ message: 'Erreur lors du traitement des rappels.' }, { status: 500 });
  }
}