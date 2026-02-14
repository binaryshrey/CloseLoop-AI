import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;

    console.log('Call connected:', { callSid, from, to });
    console.log('ElevenLabs Agent ID:', process.env.ELEVENLABS_AGENT_ID);
    console.log('ElevenLabs API Key exists:', !!process.env.ELEVENLABS_API_KEY);

    const twiml = new VoiceResponse();

    // For now, let's test with a simple voice response to verify the call works
    twiml.say({
      voice: 'alice',
    }, 'Hello! This is CloseLoop A I. Connecting you to our AI sales agent now.');

    twiml.pause({ length: 1 });

    // Validate required environment variables
    if (!process.env.ELEVENLABS_AGENT_ID) {
      console.error('ELEVENLABS_AGENT_ID is not set');
      twiml.say('Configuration error. Please contact support.');
      twiml.hangup();
      return new NextResponse(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml' },
        status: 500,
      });
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      console.error('ELEVENLABS_API_KEY is not set');
      twiml.say('Configuration error. Please contact support.');
      twiml.hangup();
      return new NextResponse(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml' },
        status: 500,
      });
    }

    // Connect the call to ElevenLabs agent via WebSocket
    try {
      const connect = twiml.connect();

      // Build the WebSocket URL with agent_id
      const websocketUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${process.env.ELEVENLABS_AGENT_ID}`;

      const stream = connect.stream({
        url: websocketUrl,
      });

      // Pass ElevenLabs API key as a custom parameter
      // This is sent in the WebSocket metadata to ElevenLabs
      stream.parameter({
        name: 'xi-api-key',
        value: process.env.ELEVENLABS_API_KEY,
      });

      // Optional: Pass authorization header (some ElevenLabs versions need this)
      stream.parameter({
        name: 'authorization',
        value: process.env.ELEVENLABS_API_KEY,
      });

      console.log('TwiML with stream generated successfully');
      console.log('Agent ID:', process.env.ELEVENLABS_AGENT_ID);
      console.log('WebSocket URL:', websocketUrl);
    } catch (streamError) {
      console.error('Error creating stream:', streamError);
      twiml.say('There was an error connecting to the AI agent. The call will now end.');
      twiml.hangup();
    }

    return new NextResponse(twiml.toString(), {
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  } catch (error) {
    console.error('Error in voice webhook:', error);

    const twiml = new VoiceResponse();
    twiml.say('We are experiencing technical difficulties. Please try again later.');
    twiml.hangup();

    return new NextResponse(twiml.toString(), {
      headers: {
        'Content-Type': 'text/xml',
      },
      status: 500,
    });
  }
}
