import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

export async function POST(request: NextRequest) {
  try {
    const { to } = await request.json();

    console.log('=== TESTING TWILIO CALL ===');
    console.log('Target number:', to || '+13472229576');

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    console.log('Account SID:', accountSid);
    console.log('Twilio Number:', twilioPhoneNumber);
    console.log('Auth Token exists:', !!authToken);

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      return NextResponse.json(
        {
          error: 'Twilio credentials not configured',
          details: {
            accountSid: !!accountSid,
            authToken: !!authToken,
            twilioPhoneNumber: !!twilioPhoneNumber,
          }
        },
        { status: 500 }
      );
    }

    const client = twilio(accountSid, authToken);

    // First, let's verify the account and phone number
    try {
      const account = await client.api.accounts(accountSid).fetch();
      console.log('Account Status:', account.status);
      console.log('Account Type:', account.type);

      const phoneNumber = await client.incomingPhoneNumbers.list({
        phoneNumber: twilioPhoneNumber,
      });

      console.log('Phone Number Info:', phoneNumber[0]?.capabilities);
    } catch (verifyError: any) {
      console.error('Verification error:', verifyError.message);
      return NextResponse.json({
        error: 'Failed to verify Twilio account',
        message: verifyError.message,
        code: verifyError.code,
      }, { status: 500 });
    }

    // Try to make the call
    const targetNumber = to || '+13472229576';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get('host')}`;
    const webhookUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

    console.log('Attempting call from', twilioPhoneNumber, 'to', targetNumber);
    console.log('Webhook URL:', `${webhookUrl}/api/twilio/voice`);

    const call = await client.calls.create({
      to: targetNumber,
      from: twilioPhoneNumber,
      url: `${webhookUrl}/api/twilio/voice`,
      statusCallback: `${webhookUrl}/api/twilio/status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed', 'failed'],
    });

    console.log('Call created successfully!');
    console.log('Call SID:', call.sid);
    console.log('Call Status:', call.status);

    return NextResponse.json({
      success: true,
      callSid: call.sid,
      status: call.status,
      to: call.to,
      from: call.from,
      direction: call.direction,
      details: {
        callSid: call.sid,
        status: call.status,
        webhookUrl: `${webhookUrl}/api/twilio/voice`,
      },
      message: 'Call initiated. Check Twilio console for status: https://console.twilio.com/us1/monitor/logs/calls',
    });
  } catch (error: any) {
    console.error('=== CALL ERROR ===');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Status:', error.status);
    console.error('More info:', error.moreInfo);

    return NextResponse.json(
      {
        error: 'Failed to initiate call',
        message: error.message,
        code: error.code,
        status: error.status,
        moreInfo: error.moreInfo,
        details: error,
      },
      { status: 500 }
    );
  }
}
