import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import ContactEmail from '@/emails/ContactEmail';
import { render } from '@react-email/render';
import { z } from 'zod';

const resendApiKey = process.env.RESEND_API_KEY;
const contactRecipient = process.env.CONTACT_EMAIL_TO ?? 'doryan.chaigneau@hotmail.fr';
const contactSender = process.env.RESEND_FROM_EMAIL ?? 'noreply@shelfy.fr';

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  subject: z.string().min(1),
  message: z.string().min(1),
  plan: z.string().min(1),
});

export async function POST(request: Request) {
  if (!resendApiKey) {
    console.error('RESEND_API_KEY is not configured');
    return NextResponse.json({ message: 'Email service unavailable.' }, { status: 500 });
  }

  try {
    const json = await request.json();
    const result = contactSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json({ message: 'Invalid payload.', issues: result.error.issues }, { status: 400 });
    }

    const resend = new Resend(resendApiKey);
    const emailHtml = await render(ContactEmail(result.data));

    await resend.emails.send({
      from: `Shelfy Contact Form <${contactSender}>`,
      to: contactRecipient,
      subject: `Nouveau Message: ${result.data.subject}`,
      replyTo: result.data.email,
      html: emailHtml,
    });

    return NextResponse.json({ message: 'Email sent successfully.' });
  } catch (error) {
    console.error('Failed to send contact email:', error);
    return NextResponse.json({ message: 'An internal error occurred.' }, { status: 500 });
  }
}
