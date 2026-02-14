import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  console.log('=== TESTING RESEND EMAIL ===');
  console.log('API Key exists:', !!process.env.RESEND_API_KEY);
  console.log('API Key prefix:', process.env.RESEND_API_KEY?.substring(0, 10));

  try {
    // Send to both your emails
    const results = await Promise.all([
      resend.emails.send({
        from: 'onboarding@resend.dev',
        to: 'shreyansh.saurabh0107@gmail.com',
        subject: 'Test Email from CloseLoop AI - Email 1',
        html: '<h1>Test Email</h1><p>This is a test to verify Resend is working. If you see this, email delivery works!</p>',
      }),
      resend.emails.send({
        from: 'onboarding@resend.dev',
        to: 'binaryshrey@gmail.com',
        subject: 'Test Email from CloseLoop AI - Email 2',
        html: '<h1>Test Email</h1><p>This is a test to verify Resend is working. If you see this, email delivery works!</p>',
      }),
    ]);

    console.log('Email send results:', JSON.stringify(results, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Test emails sent!',
      results,
      details: {
        apiKeySet: !!process.env.RESEND_API_KEY,
        recipients: ['shreyansh.saurabh0107@gmail.com', 'binaryshrey@gmail.com'],
      },
    });
  } catch (error: any) {
    console.error('Email send error:', error);
    return NextResponse.json(
      {
        error: 'Failed to send test email',
        message: error.message,
        details: error,
        apiKeySet: !!process.env.RESEND_API_KEY,
      },
      { status: 500 }
    );
  }
}
