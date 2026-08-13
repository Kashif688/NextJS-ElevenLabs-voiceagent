import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { readFileSync } from 'fs';
import path from 'path';

// Initialize Resend with the API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email_address } = await request.json();

    if (!email_address) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    console.log(`Preparing to send Publishing Plans to: ${email_address}`);

    // Path to the PDF in the public folder
    const pdfPath = path.join(process.cwd(), 'public', 'Publishing Plans.pdf');
    const pdfBuffer = readFileSync(pdfPath);

    // Send the email using Resend
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // Default sender for testing. Update this when you have a verified domain on Resend.
      to: email_address,
      subject: 'Your Publishing Plans - Marketing And Publishing House LLC',
      text: 'Hi there,\n\nThank you for speaking with Emma today! As requested, please find attached our Publishing Plans.\n\nBest regards,\nMarketing And Publishing House LLC',
      attachments: [
        {
          filename: 'Publishing Plans.pdf',
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error('Resend API error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Email sent successfully:', data);
    return NextResponse.json({ success: true, message: 'Email sent successfully', data });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
