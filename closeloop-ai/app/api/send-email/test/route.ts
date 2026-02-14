import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { EMAIL_CONFIG } from '@/config/email.config';

export async function GET() {
  console.log('=== TESTING SMTP EMAIL ===');
  console.log('SMTP Config:', {
    host: EMAIL_CONFIG.smtp.host,
    port: EMAIL_CONFIG.smtp.port,
    secure: EMAIL_CONFIG.smtp.secure,
    user: EMAIL_CONFIG.smtp.auth.user,
    hasPassword: !!EMAIL_CONFIG.smtp.auth.pass,
  });

  try {
    // Create transporter
    const transporter = nodemailer.createTransport(EMAIL_CONFIG.smtp);

    // Verify SMTP connection
    await transporter.verify();
    console.log('SMTP connection verified successfully');

    // Send test email
    const result = await transporter.sendMail({
      from: EMAIL_CONFIG.from,
      to: EMAIL_CONFIG.smtp.auth.user, // Send to yourself for testing
      subject: 'Test Email from CloseLoop AI - SMTP',
      html: '<h1>SMTP Test Email</h1><p>This is a test to verify SMTP is working. If you see this, email delivery works!</p>',
    });

    console.log('Email send result:', result);

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully via SMTP!',
      result: {
        messageId: result.messageId,
        accepted: result.accepted,
        rejected: result.rejected,
      },
      config: {
        host: EMAIL_CONFIG.smtp.host,
        port: EMAIL_CONFIG.smtp.port,
        from: EMAIL_CONFIG.from,
        to: EMAIL_CONFIG.smtp.auth.user,
      },
    });
  } catch (error: any) {
    console.error('SMTP test error:', error);
    return NextResponse.json(
      {
        error: 'Failed to send test email',
        message: error.message,
        details: error,
        config: {
          host: EMAIL_CONFIG.smtp.host,
          port: EMAIL_CONFIG.smtp.port,
          userSet: !!EMAIL_CONFIG.smtp.auth.user,
          passwordSet: !!EMAIL_CONFIG.smtp.auth.pass,
        },
      },
      { status: 500 }
    );
  }
}
