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
      return NextResponse.json(
        { error: 'Twilio credentials not configured' },
        { status: 500 }
      );
    }

    const client = twilio(accountSid, authToken);

    // Use production URL for Twilio webhooks (Twilio can't reach localhost)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get('host')}`;
    const webhookUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

    console.log('Using webhook URL:', webhookUrl);

    // Make the outbound call
    const call = await client.calls.create({
      to: to,
      from: twilioPhoneNumber,
      url: `${webhookUrl}/api/twilio/voice`,
      statusCallback: `${webhookUrl}/api/twilio/status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    });

    console.log('Call initiated:', call.sid);

    return NextResponse.json({
      success: true,
      callSid: call.sid,
      status: call.status,
      to: call.to,
      from: call.from,
    });
  } catch (error: any) {
    console.error('Error making call:', error);
    return NextResponse.json(
      {
        error: 'Failed to initiate call',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
