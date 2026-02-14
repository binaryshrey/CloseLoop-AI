import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

export async function POST(request: NextRequest) {
  try {
    const { to } = await request.json();

    if (!to) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Initialize Twilio client
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      console.error('Missing Twilio credentials:', {
        hasAccountSid: !!accountSid,
        hasAuthToken: !!authToken,
        hasTwilioNumber: !!twilioPhoneNumber,
      });
      return NextResponse.json(
        { 
          error: 'Twilio credentials not configured',
          details: 'Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER in environment variables'
        },
        { status: 500 }
      );
    }

    const client = twilio(accountSid, authToken);

    // Determine the webhook URL
    const host = request.headers.get('host') || '';
    const isLocalDev = host.includes('localhost') || host.includes('127.0.0.1');
    
    // Get the configured URL
    const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;
    
    // Use the configured URL, but warn if it's production and we're running locally
    const baseUrl = configuredUrl || `https://${host}`;
    const webhookUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

    // If running locally but pointing to production URL, warn the user
    if (isLocalDev && configuredUrl && !configuredUrl.includes('localhost') && !configuredUrl.includes('ngrok')) {
      console.warn('⚠️  Local development detected but NEXT_PUBLIC_APP_URL points to production');
      console.warn(`Host: ${host}`);
      console.warn(`Configured URL: ${configuredUrl}`);
      return NextResponse.json(
        { 
          error: 'Configuration mismatch',
          message: 'Running locally but NEXT_PUBLIC_APP_URL points to production. Real calls only work when deployed.',
          suggestion: 'Use "Demo Mode" to test locally, or deploy to production to make real calls.',
          details: {
            currentHost: host,
            configuredUrl: configuredUrl,
          }
        },
        { status: 400 }
      );
    }

    // Check if using localhost (won't work with Twilio webhooks)
    if (webhookUrl.includes('localhost') || webhookUrl.includes('127.0.0.1')) {
      console.warn('⚠️  Using localhost URL - Twilio webhooks will not work!');
      console.warn('For real calls, use ngrok or deploy to production');
      return NextResponse.json(
        { 
          error: 'Local development detected',
          message: 'Twilio requires a public URL for webhooks.',
          suggestion: 'Use "Demo Mode" to test locally, or deploy to production for real calls.'
        },
        { status: 400 }
      );
    }

    console.log('\n========================================');
    console.log('📞 INITIATING OUTBOUND CALL');
    console.log('========================================');
    console.log('🌐 Webhook Base URL:', webhookUrl);
    console.log('📱 From Number:', twilioPhoneNumber);
    console.log('📱 To Number:', to);
    console.log('🔗 Voice URL:', `${webhookUrl}/api/twilio/voice`);
    console.log('🔗 Status Callback URL:', `${webhookUrl}/api/twilio/status`);
    console.log('========================================\n');

    const callStartTime = Date.now();

    // Make the outbound call
    const call = await client.calls.create({
      to: to,
      from: twilioPhoneNumber,
      url: `${webhookUrl}/api/twilio/voice`,
      statusCallback: `${webhookUrl}/api/twilio/status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    });

    const callDuration = Date.now() - callStartTime;

    console.log('\n✅ CALL INITIATED SUCCESSFULLY');
    console.log('========================================');
    console.log('📞 Call SID:', call.sid);
    console.log('📊 Initial Status:', call.status);
    console.log('⏱️  API Call Duration:', callDuration + 'ms');
    console.log('📱 To:', call.to);
    console.log('📱 From:', call.from);
    console.log('========================================\n');

    return NextResponse.json({
      success: true,
      callSid: call.sid,
      status: call.status,
      to: call.to,
      from: call.from,
    });
  } catch (error: any) {
    console.error('Error making call:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      moreInfo: error.moreInfo,
    });
    
    return NextResponse.json(
      {
        error: 'Failed to initiate call',
        message: error.message,
        code: error.code,
        details: error.moreInfo || 'Check server logs for more information',
      },
      { status: 500 }
    );
  }
}
