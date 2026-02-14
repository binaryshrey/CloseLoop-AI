import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, campaignData } = await request.json();

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      return NextResponse.json(
        { error: 'Twilio credentials not configured' },
        { status: 500 }
      );
    }

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const client = twilio(accountSid, authToken);

    // Strip trailing slash from base URL to avoid double-slash in paths
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/+$/, '');

    // Initiate the call
    const call = await client.calls.create({
      url: `${baseUrl}/api/twilio/voice`,
      to: phoneNumber,
      from: twilioPhoneNumber,
      statusCallback: `${baseUrl}/api/twilio/status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST',
      record: true,
      recordingStatusCallback: `${baseUrl}/api/twilio/recording`,
      recordingStatusCallbackMethod: 'POST',
    });

    return NextResponse.json({
      success: true,
      callSid: call.sid,
      status: call.status,
      message: 'Call initiated successfully',
    });
  } catch (error: any) {
    console.error('Error initiating call:', error);
    return NextResponse.json(
      {
        error: 'Failed to initiate call',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
