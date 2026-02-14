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

    // Connect the call to ElevenLabs agent via WebSocket
    try {
      const connect = twiml.connect();

      // Build the WebSocket URL with parameters
      const baseUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${process.env.ELEVENLABS_AGENT_ID}`;
      
      const stream = connect.stream({
        url: baseUrl,
      });

      // Pass ElevenLabs API key for authentication
      stream.parameter({
        name: 'xi-api-key',
        value: process.env.ELEVENLABS_API_KEY || '',
      });

      // Pass call metadata
      stream.parameter({
        name: 'call_sid',
        value: callSid,
      });

      // Configure ElevenLabs to send transcript webhooks to our endpoint
      // The webhook URL must be publicly accessible (use ngrok for local dev)
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/elevenlabs/webhook`;
      
      stream.parameter({
        name: 'webhook_url',
        value: webhookUrl,
      });

      console.log('TwiML with stream generated successfully');
      console.log('Webhook URL configured:', webhookUrl);
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
