import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import * as nodemailer from 'nodemailer'; // Assuming nodemailer is installed

export async function POST(request: Request) {
  const supabase = createClient(cookies());

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { groupId, groupName, invitedEmails } = await request.json();

  // Basic validation
  if (!groupId || !groupName || !invitedEmails || !Array.isArray(invitedEmails) || invitedEmails.length === 0) {
    return NextResponse.json({ message: 'Missing required fields: groupId, groupName, invitedEmails' }, { status: 400 });
  }

  const inviterName = session.user.email; // Or fetch user's name from profile if available

  // Configure Nodemailer transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  try {
    for (const email of invitedEmails) {
      // Generate invitation link (adjust as per your client-side routing for joining groups)
      const invitationLink = `${process.env.NEXT_PUBLIC_BASE_URL}/groups/join?code=${groupId}`; // Using groupId as a placeholder for invitation code

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: `Invitation à rejoindre le club de lecture ${groupName} sur Codex`, 
        html: `
          <p>Bonjour,</p>
          <p>${inviterName} vous a invité(e) à rejoindre le club de lecture <strong>${groupName}</strong> sur Codex.</p>
          <p>Pour accepter l'invitation, veuillez cliquer sur le lien ci-dessous :</p>
          <p><a href="${invitationLink}">Rejoindre le club ${groupName}</a></p>
          <p>Si vous n'avez pas de compte Codex, vous serez invité(e) à en créer un avant de rejoindre le club.</p>
          <p>À bientôt sur Codex !</p>
          <p>L'équipe Codex</p>
        `,
      };

      await transporter.sendMail(mailOptions);
    }
    return NextResponse.json({ message: 'Invitations envoyées avec succès !' });
  } catch (error: any) {
    console.error('Error sending invitation emails:', error);
    return NextResponse.json({ message: 'Failed to send invitation emails.' }, { status: 500 });
  }
}
