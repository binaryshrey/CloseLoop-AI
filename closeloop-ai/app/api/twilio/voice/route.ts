import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const callStatus = formData.get('CallStatus') as string;
    const direction = formData.get('Direction') as string;

    console.log('\n========================================');
    console.log('TWILIO VOICE WEBHOOK CALLED');
    console.log('========================================');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Call SID:', callSid);
    console.log('From:', from);
    console.log('To:', to);
    console.log('Call Status:', callStatus);
    console.log('Direction:', direction);
    console.log('ElevenLabs Agent ID:', process.env.ELEVENLABS_AGENT_ID?.substring(0, 10) + '...');
    console.log('========================================\n');

    // Validate required environment variables
    if (!process.env.ELEVENLABS_AGENT_ID || !process.env.ELEVENLABS_API_KEY) {
      console.error('Missing ElevenLabs credentials');
      const twiml = new VoiceResponse();
      twiml.say({ voice: 'Polly.Joanna' }, 'Configuration error. Missing credentials.');
      twiml.hangup();
      return new NextResponse(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml' },
        status: 200,
      });
    }

    // Use ElevenLabs Register Call API to get TwiML
    // This handles protocol bridging between Twilio and ElevenLabs on their end
    try {
      console.log('Registering call with ElevenLabs...');
      const registerStartTime = Date.now();

      const registerResponse = await fetch(
        'https://api.elevenlabs.io/v1/convai/twilio/register-call',
        {
          method: 'POST',
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agent_id: process.env.ELEVENLABS_AGENT_ID,
            from_number: from || 'unknown',
            to_number: to || process.env.TWILIO_PHONE_NUMBER || 'unknown',
            direction: direction === 'outbound' ? 'outbound' : 'inbound',
          }),
        }
      );

      const registerDuration = Date.now() - registerStartTime;
      console.log(`Register call request took: ${registerDuration}ms`);
      console.log('ElevenLabs register-call status:', registerResponse.status);

      if (!registerResponse.ok) {
        const errorText = await registerResponse.text();
        console.error('Failed to register call with ElevenLabs:', registerResponse.status, errorText);
        throw new Error(`ElevenLabs register-call error: ${registerResponse.status} - ${errorText}`);
      }

      // The register-call endpoint returns raw TwiML XML
      const twimlResponse = await registerResponse.text();

      const totalDuration = Date.now() - startTime;
      console.log('\nVOICE WEBHOOK COMPLETED SUCCESSFULLY');
      console.log(`Total processing time: ${totalDuration}ms`);
      console.log('TwiML response:', twimlResponse);
      console.log('========================================\n');

      return new NextResponse(twimlResponse, {
        headers: { 'Content-Type': 'text/xml' },
      });
    } catch (registerError: any) {
      console.error('Error registering call with ElevenLabs:', registerError.message);

      const twiml = new VoiceResponse();
      twiml.say(
        { voice: 'Polly.Joanna' },
        'We are experiencing technical difficulties connecting to the AI agent. Please try again later.'
      );
      twiml.hangup();

      return new NextResponse(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml' },
        status: 200,
      });
    }
  } catch (error: any) {
    console.error('Fatal error in voice webhook:', error);

    const twiml = new VoiceResponse();
    twiml.say(
      { voice: 'Polly.Joanna' },
      'We are experiencing technical difficulties. Please try again later.'
    );
    twiml.hangup();

    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
      status: 200,
    });
  }
}
