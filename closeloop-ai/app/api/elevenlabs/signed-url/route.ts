import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const agentId = process.env.ELEVENLABS_AGENT_ID;
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!agentId || !apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs credentials not configured' },
        { status: 500 }
      );
    }

    // Get a signed URL from ElevenLabs for the conversation
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs API error:', error);
      return NextResponse.json(
        { error: 'Failed to get signed URL from ElevenLabs' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      signedUrl: data.signed_url,
    });
  } catch (error: any) {
    console.error('Error getting signed URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate signed URL', message: error.message },
      { status: 500 }
    );
  }
}
