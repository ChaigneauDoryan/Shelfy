import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import ReadingReminderEmail from '@/emails/ReadingReminderEmail';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendReadingReminderEmail(groupBookId: string) {
  try {
    const groupBook = await prisma.groupBook.findUnique({
      where: { id: groupBookId },
      include: {
        book: true,
        group: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!groupBook || !groupBook.reading_end_date) {
      console.log(`No group book found or no reading end date for groupBookId: ${groupBookId}`);
      return;
    }

    const now = new Date();
    const twentyFourHoursBeforeEndDate = new Date(groupBook.reading_end_date.getTime() - 24 * 60 * 60 * 1000);

    // Vérifier si nous sommes dans la fenêtre de 24 heures avant la date de fin
    // et que la date de fin n'est pas déjà passée
    if (now < twentyFourHoursBeforeEndDate || now > groupBook.reading_end_date) {
      console.log(`Not within 24 hours window or end date already passed for groupBookId: ${groupBookId}`);
      return;
    }

    const groupName = groupBook.group.name;
    const bookTitle = groupBook.book.title;
    const formattedEndDate = format(groupBook.reading_end_date, 'dd MMMM yyyy à HH:mm', { locale: fr });
    const groupLink = `${process.env.NEXTAUTH_URL}/dashboard/groups/${groupBook.group.id}`; // Assurez-vous que NEXTAUTH_URL est défini

    const memberEmails = groupBook.group.members
      .map(member => member.user.email)
      .filter((email): email is string => !!email); // Filtrer les emails null ou undefined

    if (memberEmails.length === 0) {
      console.log(`No members with emails found for group: ${groupName}`);
      return;
    }

    const { data, error } = await resend.emails.send({
      from: `Shelfy <${process.env.RESEND_FROM_EMAIL}>`,
      to: memberEmails,
      subject: `Rappel de lecture : Il ne reste que 24 heures pour finir ${bookTitle} !`,
      react: ReadingReminderEmail({ groupName, bookTitle, readingEndDate: formattedEndDate, groupLink }),
    });

    if (error) {
      console.error('Error sending reading reminder email:', error);
      return { success: false, error };
    }

    console.log(`Reading reminder email sent successfully for groupBookId: ${groupBookId} to ${memberEmails.length} members.`, data);
    return { success: true, data };

  } catch (error) {
    console.error('Unexpected error in sendReadingReminderEmail:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
