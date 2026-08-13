import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

export async function POST(request: Request) {
  try {
    // 1. Get data from the frontend
    const body = await request.json();
    const { to, subject, message } = body;

    // 2. Configure the SMTP server details
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com', // e.g., smtp.gmail.com
      port: Number(process.env.SMTP_PORT) || 465,      // 465 for secure, 587 for unsecure
      secure: true, 
      auth: {
        user: process.env.Email || process.env.SMTP_USER, // your email address
        pass: process.env.APP_PASSWORD || process.env.SMTP_PASS, // your email password or app password
      },
    });

    // 3. Format plain text into clean HTML paragraphs and lists
    const formattedHtmlMessage = message
      ? message
          .split('\n')
          .filter((line: string) => line.trim() !== '')
          .map((line: string) => `<p style="margin-bottom: 14px; line-height: 1.6; color: #2c3e50; font-size: 15px;">${line}</p>`)
          .join('')
      : '';

    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px; }
            .card { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
            .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 28px 24px; text-align: center; color: #ffffff; }
            .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; color: #f8fafc; }
            .content { padding: 32px 28px; background: #ffffff; }
            .footer { background: #f8fafc; padding: 18px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; }
            .attachment-badge { display: inline-block; background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; padding: 8px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h1>Marketing & Publishing House</h1>
            </div>
            <div class="content">
              ${formattedHtmlMessage}
              <div class="attachment-badge">
                📎 Attached: Publishing Plans.pdf
              </div>
            </div>
            <div class="footer">
              <p style="margin: 0;">© ${new Date().getFullYear()} Marketing & Publishing House. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // 4. Dynamic attachment path using process.cwd() (works locally and on Vercel without hardcoding base path)
    const pdfPath = path.join(process.cwd(), 'public', 'Publishing Plans.pdf');
    const attachments = [];

    if (fs.existsSync(pdfPath)) {
      attachments.push({
        filename: 'Publishing Plans.pdf',
        path: pdfPath,
      });
    }

    // 5. Set up the email data
    const mailOptions = {
      from: `"Marketing & Publishing House" <${process.env.Email || process.env.SMTP_USER}>`,
      to: to,
      subject: subject || 'Publishing Plans - Marketing And Publishing House',
      text: message,               // plain text fallback
      html: htmlTemplate,          // beautifully formatted HTML
      attachments: attachments,   // attached PDF
    };

    // 6. Send the email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Email sent successfully with attachment!' });

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send email' },
      { status: 500 }
    );
  }
}

