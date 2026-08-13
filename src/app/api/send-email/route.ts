import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

/**
 * Formats plain text AI/Voice agent messages into a premium, luxury HTML email template.
 */
function generateExecutiveEmailHtml(message: string, hasAttachment: boolean): string {
  const year = new Date().getFullYear();

  // Split lines and parse content intelligently
  const rawLines = (message || '').split('\n').map(l => l.trim()).filter(Boolean);
  
  let bodyContentHtml = '';
  let signatureHtml = '';

  rawLines.forEach(line => {
    // Check if line looks like a signature
    if (line.toLowerCase().includes('warm regards') || line.toLowerCase().includes('best regards') || line.toLowerCase().includes('sincerely')) {
      signatureHtml += `<div style="margin-top: 25px; padding-top: 15px; border-top: 1px dashed #cbd5e1; color: #475569; font-size: 14px; font-weight: 500;">${line}</div>`;
    } else if (line.toLowerCase().includes('author relations team') || line.toLowerCase().includes('marketing and publishing house')) {
      signatureHtml += `<div style="color: #1e293b; font-weight: 700; font-size: 15px;">${line}</div>`;
    } 
    // Check if line is a numbered plan option (e.g. "1. Global Publishing Plan...", "2. Nationwide...")
    else if (/^\d+\.\s+/.test(line) || line.toLowerCase().includes('publishing plan') || line.toLowerCase().includes('publishing kit')) {
      // Highlight prices if present (e.g. $1,299 or $899)
      const highlightedLine = line.replace(/(\$\d[\d,]*)/g, '<strong style="color: #059669; font-size: 16px; background: #ecfdf5; padding: 2px 6px; border-radius: 4px;">$1</strong>');
      bodyContentHtml += `
        <div style="background: #f8fafc; border-left: 4px solid #4f46e5; border-radius: 6px; padding: 16px 20px; margin: 16px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="color: #1e293b; font-size: 15px; line-height: 1.6; font-weight: 500;">
            ${highlightedLine}
          </div>
        </div>
      `;
    } else {
      // Regular paragraph
      bodyContentHtml += `<p style="margin-bottom: 14px; line-height: 1.7; color: #334155; font-size: 15px;">${line}</p>`;
    }
  });

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Marketing & Publishing House</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 30px 15px; -webkit-font-smoothing: antialiased;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%); padding: 36px 32px; text-align: center; border-bottom: 4px solid #f59e0b;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); width: 48px; height: 48px; border-radius: 12px; line-height: 48px; font-size: 24px; color: #ffffff; margin-bottom: 12px;">
                      📚
                    </div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; text-transform: uppercase;">
                      Marketing & Publishing House
                    </h1>
                    <p style="margin: 6px 0 0 0; color: #cbd5e1; font-size: 13px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase;">
                      Author Relations & Premium Publishing Services
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Area -->
          <tr>
            <td style="padding: 36px 32px; background-color: #ffffff;">
              ${bodyContentHtml}

              <!-- Signature Block -->
              ${signatureHtml}

              <!-- Attachment Callout Box -->
              ${hasAttachment ? `
                <div style="margin-top: 32px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 18px 20px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td width="40" valign="middle">
                        <div style="background: #2563eb; color: #ffffff; width: 36px; height: 36px; border-radius: 8px; text-align: center; line-height: 36px; font-size: 18px;">
                          📄
                        </div>
                      </td>
                      <td style="padding-left: 14px;" valign="middle">
                        <div style="font-weight: 700; color: #1e40af; font-size: 14px; margin-bottom: 2px;">
                          Attached File: Publishing Plans.pdf
                        </div>
                        <div style="color: #3b82f6; font-size: 12px;">
                          Please find your complete publishing proposal attached to this email.
                        </div>
                      </td>
                    </tr>
                  </table>
                </div>
              ` : ''}
            </td>
          </tr>

          <!-- Footer Area -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px; font-weight: 600;">
                Marketing And Publishing House LLC
              </p>
              <p style="margin: 0 0 12px 0; color: #94a3b8; font-size: 12px; line-height: 1.5;">
                Providing end-to-end author services, professional editing, custom cover designs & worldwide distribution.
              </p>
              <p style="margin: 0; color: #cbd5e1; font-size: 11px;">
                © ${year} Marketing And Publishing House. All rights reserved.
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
    // 1. Get data from the request
    const body = await request.json();
    const { to, subject, message } = body;

    // 2. Configure the SMTP transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true, 
      auth: {
        user: process.env.Email || process.env.SMTP_USER,
        pass: process.env.APP_PASSWORD || process.env.SMTP_PASS,
      },
    });

    // 3. Check for PDF attachment dynamically
    const pdfPath = path.join(process.cwd(), 'public', 'Publishing Plans.pdf');
    const hasAttachment = fs.existsSync(pdfPath);
    const attachments = [];

    if (hasAttachment) {
      attachments.push({
        filename: 'Publishing Plans.pdf',
        path: pdfPath,
      });
    }

    // 4. Build luxury executive HTML template
    const htmlTemplate = generateExecutiveEmailHtml(message, hasAttachment);

    // 5. Configure mail options
    const mailOptions = {
      from: `"Marketing & Publishing House" <${process.env.Email || process.env.SMTP_USER}>`,
      to: to,
      subject: subject || 'Your Book Publishing Plans - Marketing And Publishing House',
      text: message,               // Fallback plain text
      html: htmlTemplate,          // Premium Executive HTML Template
      attachments: attachments,   // Dynamic PDF Attachment
    };

    // 6. Send the email via SMTP
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ 
      success: true, 
      message: 'Email sent successfully with executive HTML design & attachment!' 
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send email' },
      { status: 500 }
    );
  }
}
