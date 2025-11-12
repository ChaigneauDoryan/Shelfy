import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import ContactEmail from '@/emails/ContactEmail';
import { render } from '@react-email/render';

const resend = new Resend(process.env.RESEND_API_KEY);
const toEmail = process.env.CONTACT_EMAIL_TO || 'doryan.chaigneau@hotmail.fr';
const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@shelfy.fr';

export async function POST(request: Request) {
  try {
    const { name, email, subject, message, plan } = await request.json();

    if (!name || !email || !subject || !message || !plan) {
      return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
    }

    const emailHtml = await render(
      ContactEmail({
        name,
        email,
        subject,
        message,
        plan,
      })
    );

    await resend.emails.send({
      from: `Shelfy Contact Form <${fromEmail}>`,
      to: toEmail,
      subject: `Nouveau Message: ${subject}`,
      reply_to: email,
      html: emailHtml,
    });

    return NextResponse.json({ message: 'Email sent successfully.' });
  } catch (error) {
    console.error('Failed to send contact email:', error);
    return NextResponse.json({ message: 'An internal error occurred.' }, { status: 500 });
  }
}
