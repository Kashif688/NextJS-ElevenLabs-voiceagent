import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { renderContractPdfBuffer } from '../../../../lib/contracts/renderContract';
import { ContractProps } from '../../../../components/contracts/ContractDocument';
import { formatPrice } from '../../../../lib/utils/formatPrice';

function getTimestampString(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clientName = searchParams.get('clientName') || searchParams.get('name') || 'Ron Boucher';
    const planName = searchParams.get('planName') || 'Global Publishing Plan';
    const price = formatPrice(searchParams.get('price'), '$1,699');
    const date = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date());

    const contractData: ContractProps = {
      clientName,
      planName,
      price,
      date,
    };

    const pdfBuffer = await renderContractPdfBuffer(contractData);
    const timestamp = getTimestampString();
    const safeName = clientName.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `document_${safeName}_${timestamp}.pdf`;

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating React-PDF contract:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate contract PDF' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      clientName,
      name,
      email,
      to,
      planName,
      price,
      sendEmail = false,
    } = body;

    const authorName = (clientName || name || 'Valued Author').trim();
    const recipientEmail = (email || to || '').trim();
    const finalPlanName = planName || 'Global Publishing Plan';
    const finalPrice = formatPrice(price, '$1,699');
    const date = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date());

    const contractData: ContractProps = {
      clientName: authorName,
      planName: finalPlanName,
      price: finalPrice,
      date,
      scopeOfServices: [
        'Professional Editing',
        'Professional Formatting according to International Publishing Standards',
        'Typesetting: e-book, Paperback and Hardcover',
        'Professional Proofreading & Final Revision',
        'Authors Central Page: Author Intro on the Platform for Branding',
        'Book Profile & Summary Discussion',
        'Print-on-demand services - No limit of purchase',
        'Book Categorization & Optimization',
        'Keyword Enhancement, Integration, and Optimization',
        'Publishing on 10 Platforms (Barnes & Noble, Amazon, IngramSpark, Google Books, Apple Books, Books Express, KOBO, Draft2Digital, Chapters Indigo, Walmart)',
        'Customized Cover Design (front, spine and back)',
        'Multiple Book Formats: eBook, Paperback & Hardcover',
        'Unlimited Revisions',
        'ISBN and Barcode Assignment',
        'Dedicated Project Manager Support',
        'Copyright Registration'
      ]
    };

    // 1. Generate the PDF buffer using React-PDF JSX
    const pdfBuffer = await renderContractPdfBuffer(contractData);
    const timestamp = getTimestampString();
    const safeName = authorName.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `document_${safeName}_${timestamp}.pdf`;
    const refId = 'MPH-CTR-' + Date.now().toString(36).toUpperCase();

    // Save the PDF physically only in local development (Vercel is read-only)
    if (process.env.NODE_ENV !== 'production') {
      try {
        const fs = require('fs');
        const path = require('path');
        const outputDir = path.join(process.cwd(), 'generated_contracts');
        const publicDir = path.join(process.cwd(), 'public', 'contracts');

        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
        if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

        fs.writeFileSync(path.join(outputDir, filename), pdfBuffer);
        fs.writeFileSync(path.join(publicDir, filename), pdfBuffer);
        
        // Also update latest standard document.pdf pointer
        fs.writeFileSync(path.join(process.cwd(), 'document.pdf'), pdfBuffer);
        fs.writeFileSync(path.join(process.cwd(), 'public', 'document.pdf'), pdfBuffer);
      } catch (fsErr) {
        console.error('Failed to save PDF physically:', fsErr);
      }
    }

    // 2. Optionally email the contract directly
    let emailSent = false;
    if (sendEmail && recipientEmail) {
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = Number(process.env.SMTP_PORT) || 465;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.APP_PASSWORD || process.env.SMTP_PASS;

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

      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0; overflow: hidden;">
          <div style="background: #ec8526; padding: 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 20px; letter-spacing: 0.5px;">MARKETING & PUBLISHING HOUSE</h1>
            <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.95;">Official Publishing Service Contract & NDA</p>
          </div>
          <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
            <p style="font-size: 15px;">Dear <strong>${authorName}</strong>,</p>
            <p>Thank you for choosing Marketing & Publishing House LLC. Attached to this email is your official <strong>${finalPlanName} Service Contract & Non-Disclosure Agreement (NDA)</strong> [Ref: <code>${refId}</code>].</p>
            <div style="background: #f8fafc; border-left: 4px solid #ec8526; padding: 14px 18px; margin: 18px 0; border-radius: 4px;">
              <p style="margin: 0; font-weight: 600; font-size: 14px;">Contract Summary:</p>
              <ul style="margin: 8px 0 0 0; padding-left: 18px; font-size: 13px; color: #475569;">
                <li><strong>Author:</strong> ${authorName}</li>
                <li><strong>Plan:</strong> ${finalPlanName}</li>
                <li><strong>Total Investment:</strong> ${finalPrice}</li>
                <li><strong>Dated:</strong> ${date}</li>
              </ul>
            </div>
            <p style="font-size: 13px; color: #64748b;">Please review the attached PDF document. If you have any questions, reply directly to this email or call our direct line at (229) 355-4499.</p>
            <p style="margin-top: 24px; font-size: 14px;">Warm regards,<br><strong>Emma</strong><br>Marketing & Publishing House LLC</p>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: `"Marketing & Publishing House" <${smtpUser}>`,
        to: recipientEmail,
        ...(process.env.CC_EMAIL ? { cc: process.env.CC_EMAIL } : {}),
        subject: `Your Book Publishing Service Contract - ${authorName} [${refId}]`,
        html: emailHtml,
        attachments: [
          {
            filename: filename,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });

      emailSent = true;
    }

    return NextResponse.json({
      success: true,
      refId,
      contract: {
        clientName: authorName,
        planName: finalPlanName,
        price: finalPrice,
        date,
        filename,
      },
      emailSent,
      downloadUrl: `/api/contracts/global?clientName=${encodeURIComponent(authorName)}&price=${encodeURIComponent(finalPrice)}&planName=${encodeURIComponent(finalPlanName)}`,
      pdfBase64: pdfBuffer.toString('base64'),
    });
  } catch (error: any) {
    console.error('Error handling contract API request:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
