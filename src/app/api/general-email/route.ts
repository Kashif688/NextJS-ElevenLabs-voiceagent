import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

/**
 * Generates a clean, professional, branded HTML email template 
 * for any general message sent by the AI agent.
 */
function generateGeneralEmailHtml(messageBody: string): string {
  const year = new Date().getFullYear();
  
  // Format the message body by converting newlines to <br> for HTML rendering
  const formattedMessage = messageBody.replace(/\n/g, '<br>');

  return `
    <!DOCTYPE html>
    <html lang="en">
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px 10px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background: #0b0f19; padding: 24px; text-align: center; border-bottom: 4px solid #f59e0b;">
              <h1 style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                Marketing & Publishing House
              </h1>
            </td>
          </tr>

          <!-- Dynamic Agent Message -->
          <tr>
            <td style="padding: 32px 24px; color: #334155; line-height: 1.6; font-size: 15px;">
              ${formattedMessage}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; color: #64748b;">
              <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 600;">
                Marketing And Publishing House LLC
              </p>
              <a href="tel:2295226307" style="color: #f59e0b; text-decoration: none; font-size: 13px; font-weight: 700;">
                📞 (229) 522-6307
              </a>
              <p style="margin: 10px 0 0 0; font-size: 11px;">
                © ${year} All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, subject, message, fromName } = body;

    // Validation
    if (!to || !subject || !message) {
      return NextResponse.json(
        { success: false, message: 'Recipient email ("to"), "subject", and "message" are all required.' },
        { status: 400 }
      );
    }

    // SMTP Configuration
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT) || 465;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.APP_PASSWORD || process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.error('SMTP Error: Missing SMTP environment variables.');
      return NextResponse.json(
        { success: false, message: 'SMTP server settings are missing in environment configuration.' },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const senderName = fromName || 'Marketing & Publishing House';
    const htmlTemplate = generateGeneralEmailHtml(message);

    const mailOptions = {
      from: \`"\${senderName}" <\${smtpUser}>\`,
      to: to,
      subject: subject,
      text: message, // Plain text fallback
      html: htmlTemplate, // Branded HTML
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: 'General email sent successfully!'
    });

  } catch (error) {
    console.error('Error sending general email:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send email', error: String(error) },
      { status: 500 }
    );
  }
}
