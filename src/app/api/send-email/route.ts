import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    // 1. Get data from the frontend
    const body = await request.json();
    const { to, subject, message } = body;

    // 2. Configure the SMTP server details
    // It's best to keep passwords in your .env file
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com', // e.g., smtp.gmail.com
      port: Number(process.env.SMTP_PORT) || 465,      // 465 for secure, 587 for unsecure
      secure: true, 
      auth: {
        user: process.env.Email || process.env.SMTP_USER, // your email address
        pass: process.env.APP_PASSWORD || process.env.SMTP_PASS, // your email password or app password
      },
    });

    // 3. Set up the email data
    const mailOptions = {
      from: process.env.Email || process.env.SMTP_USER, // sender address
      to: to,                      // receiver
      subject: subject,
      text: message,               // plain text body
      html: `<p>${message}</p>`,   // html body (optional)
    };

    // 4. Send the email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Email sent successfully!' });

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send email' },
      { status: 500 }
    );
  }
}
