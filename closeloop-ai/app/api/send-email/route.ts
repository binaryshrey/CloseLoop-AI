import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { EMAIL_CONFIG, getEmailRecipients } from '@/config/email.config';

// Create SMTP transporter
const transporter = nodemailer.createTransport(EMAIL_CONFIG.smtp);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      campaignName,
      productUrl,
      productAboutUrl,
      productPricingUrl,
      campaignDescription,
      emailSubject,
      emailBody,
      recipients, // Optional: override default recipients
    } = body;

    // Validate required fields
    if (!campaignName) {
      return NextResponse.json(
        { error: 'Campaign name is required' },
        { status: 400 }
      );
    }

    // Get recipients (use provided or default)
    const emailRecipients = recipients && recipients.length > 0
      ? recipients
      : getEmailRecipients();

    // Generate default email content if not provided
    const subject = emailSubject || generateEmailSubject(campaignName);
    const htmlBody = emailBody || generateEmailBody({
      campaignName,
      productUrl,
      productAboutUrl,
      productPricingUrl,
      campaignDescription,
    });

    // Log email sending attempt
    console.log('Attempting to send emails to:', emailRecipients);
    console.log('From:', EMAIL_CONFIG.from);
    console.log('Subject:', subject);

    // Send email to all recipients using SMTP
    const emailPromises = emailRecipients.map((recipient: string) =>
      transporter.sendMail({
        from: EMAIL_CONFIG.from,
        to: recipient,
        subject,
        html: htmlBody,
      })
    );

    const results = await Promise.allSettled(emailPromises);

    // Check for any failures
    const failures = results.filter((result) => result.status === 'rejected');
    const successes = results.filter((result) => result.status === 'fulfilled');

    if (failures.length > 0) {
      console.error('Some emails failed to send:', JSON.stringify(failures, null, 2));

      // Extract error messages from failures
      const errorMessages = failures.map((f: any) => {
        if (f.status === 'rejected') {
          return f.reason?.message || f.reason?.toString() || 'Unknown error';
        }
        return 'Unknown error';
      });

      return NextResponse.json(
        {
          success: false,
          message: `${failures.length} out of ${emailRecipients.length} emails failed to send`,
          errors: errorMessages,
          details: failures,
          successes: successes.length,
        },
        { status: 207 } // Multi-Status
      );
    }

    return NextResponse.json({
      success: true,
      message: `Email sent successfully to ${emailRecipients.length} recipient(s)`,
      recipients: emailRecipients,
      results,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      {
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Helper function to generate email subject
function generateEmailSubject(campaignName: string): string {
  return `${EMAIL_CONFIG.templates.campaignNotification.subjectPrefix}${campaignName} Campaign Created`;
}

// Helper function to generate email body
function generateEmailBody(data: {
  campaignName: string;
  productUrl?: string;
  productAboutUrl?: string;
  productPricingUrl?: string;
  campaignDescription?: string;
}): string {
  const {
    campaignName,
    productUrl,
    productAboutUrl,
    productPricingUrl,
    campaignDescription,
  } = data;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            background: #f9fafb;
            padding: 30px 20px;
            border: 1px solid #e5e7eb;
            border-top: none;
          }
          .section {
            background: white;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
          }
          .section h2 {
            margin-top: 0;
            color: #667eea;
            font-size: 18px;
          }
          .info-row {
            margin: 12px 0;
          }
          .label {
            font-weight: 600;
            color: #4b5563;
            display: inline-block;
            width: 140px;
          }
          .value {
            color: #1f2937;
          }
          .link {
            color: #667eea;
            text-decoration: none;
            word-break: break-all;
          }
          .link:hover {
            text-decoration: underline;
          }
          .footer {
            background: #1f2937;
            color: #9ca3af;
            padding: 20px;
            border-radius: 0 0 8px 8px;
            text-align: center;
            font-size: 14px;
          }
          .badge {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🚀 New Campaign Created</h1>
          <div class="badge">CloseLoop AI</div>
        </div>

        <div class="content">
          <div class="section">
            <h2>Campaign Details</h2>
            <div class="info-row">
              <span class="label">Campaign Name:</span>
              <span class="value">${campaignName}</span>
            </div>
            ${campaignDescription ? `
              <div class="info-row">
                <span class="label">Description:</span>
                <span class="value">${campaignDescription}</span>
              </div>
            ` : ''}
          </div>

          ${productUrl || productAboutUrl || productPricingUrl ? `
            <div class="section">
              <h2>Product Information</h2>
              ${productUrl ? `
                <div class="info-row">
                  <span class="label">Product URL:</span>
                  <a href="${productUrl}" class="link" target="_blank">${productUrl}</a>
                </div>
              ` : ''}
              ${productAboutUrl ? `
                <div class="info-row">
                  <span class="label">About Page:</span>
                  <a href="${productAboutUrl}" class="link" target="_blank">${productAboutUrl}</a>
                </div>
              ` : ''}
              ${productPricingUrl ? `
                <div class="info-row">
                  <span class="label">Pricing:</span>
                  <a href="${productPricingUrl}" class="link" target="_blank">${productPricingUrl}</a>
                </div>
              ` : ''}
            </div>
          ` : ''}

          <div class="section">
            <h2>Next Steps</h2>
            <p style="margin: 0;">
              Your campaign has been successfully created and is ready for review.
              You can now proceed with lead sourcing and outreach configuration.
            </p>
          </div>
        </div>

        <div class="footer">
          <p style="margin: 0;">This email was sent by CloseLoop AI Campaign Manager</p>
          <p style="margin: 5px 0 0 0; font-size: 12px;">
            Automated notification - Do not reply to this email
          </p>
        </div>
      </body>
    </html>
  `;
}
