import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;

    console.log('Incoming call:', { callSid, from, to });

    const twiml = new VoiceResponse();

    // Connect the call to ElevenLabs agent
    const connect = twiml.connect();

    // Use WebSocket to connect to ElevenLabs
    const stream = connect.stream({
      url: `wss://${request.headers.get('host')}/api/websocket/elevenlabs`,
    });

    // Pass call metadata as parameters
    stream.parameter({
      name: 'callSid',
      value: callSid,
    });
    stream.parameter({
      name: 'agentId',
      value: process.env.ELEVENLABS_AGENT_ID || '',
    });

    // Alternative: Use ElevenLabs' phone integration directly
    // If you've configured phone integration in ElevenLabs dashboard
    const dial = twiml.dial();
    dial.number({
      url: `https://api.elevenlabs.io/v1/convai/conversation/phone?agent_id=${process.env.ELEVENLABS_AGENT_ID}`,
    });

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
