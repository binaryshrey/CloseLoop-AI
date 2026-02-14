import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;

    console.log('=== Twilio Voice Webhook Called ===');
    console.log('Call connected:', { callSid, from, to });
    console.log('ElevenLabs Agent ID:', process.env.ELEVENLABS_AGENT_ID);
    console.log('ElevenLabs API Key exists:', !!process.env.ELEVENLABS_API_KEY);

    const twiml = new VoiceResponse();

    // Validate required environment variables
    if (!process.env.ELEVENLABS_AGENT_ID) {
      console.error('ELEVENLABS_AGENT_ID is not set');
      twiml.say({ voice: 'Polly.Joanna' }, 'Configuration error. Agent ID not found.');
      twiml.hangup();
      return new NextResponse(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml' },
        status: 200,
      });
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      console.error('ELEVENLABS_API_KEY is not set');
      twiml.say({ voice: 'Polly.Joanna' }, 'Configuration error. API key not found.');
      twiml.hangup();
      return new NextResponse(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml' },
        status: 200,
      });
    }

    // Connect the call to ElevenLabs agent via WebSocket
    try {
      console.log('Requesting signed URL from ElevenLabs...');

      // Get a signed URL from ElevenLabs for this conversation
      const signedUrlResponse = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${process.env.ELEVENLABS_AGENT_ID}`,
        {
          method: 'GET',
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
          },
        }
      );

      console.log('ElevenLabs response status:', signedUrlResponse.status);

      if (!signedUrlResponse.ok) {
        const errorText = await signedUrlResponse.text();
        console.error('Failed to get signed URL from ElevenLabs:', {
          status: signedUrlResponse.status,
          statusText: signedUrlResponse.statusText,
          error: errorText,
        });
        throw new Error(`ElevenLabs API error: ${signedUrlResponse.status} - ${errorText}`);
      }

      const responseData = await signedUrlResponse.json();
      const { signed_url } = responseData;

      if (!signed_url) {
        console.error('No signed_url in response:', responseData);
        throw new Error('No signed URL received from ElevenLabs');
      }

      console.log('✓ Got signed URL from ElevenLabs successfully');
      console.log('WebSocket URL (truncated):', signed_url.substring(0, 60) + '...');

      // Optional: Add a brief pause/greeting before connecting
      // Uncomment if the connection is too abrupt
      // twiml.pause({ length: 1 });

      // Set up Twilio Media Stream to connect to ElevenLabs WebSocket
      const connect = twiml.connect();

      // Create the stream with the signed URL
      connect.stream({
        url: signed_url,
      });

      console.log('✓ TwiML with stream generated successfully');
      console.log('TwiML XML:', twiml.toString());

    } catch (streamError: any) {
      console.error('❌ Error creating stream:', streamError);
      console.error('Stream error details:', {
        message: streamError.message,
        stack: streamError.stack,
      });

      // Create a fresh TwiML response with error message
      const errorTwiml = new VoiceResponse();
      errorTwiml.say(
        { voice: 'Polly.Joanna' },
        'We are experiencing technical difficulties connecting to the AI agent. Please try again later.'
      );
      errorTwiml.hangup();

      return new NextResponse(errorTwiml.toString(), {
        headers: {
          'Content-Type': 'text/xml',
        },
        status: 200,
      });
    }

    // Return the TwiML response
    const twimlString = twiml.toString();
    console.log('Returning TwiML response');

    return new NextResponse(twimlString, {
      headers: {
        'Content-Type': 'text/xml',
      },
    });

  } catch (error: any) {
    console.error('❌ Fatal error in voice webhook:', error);
    console.error('Error stack:', error.stack);

    const twiml = new VoiceResponse();
    twiml.say(
      { voice: 'Polly.Joanna' },
      'We are experiencing technical difficulties. Please try again later.'
    );
    twiml.hangup();

    return new NextResponse(twiml.toString(), {
      headers: {
        'Content-Type': 'text/xml',
      },
      status: 200,
    });
  }
}
