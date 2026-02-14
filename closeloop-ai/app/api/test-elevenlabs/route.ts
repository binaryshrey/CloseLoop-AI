import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const agentId = process.env.ELEVENLABS_AGENT_ID;
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!agentId || !apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        agentId: !!agentId,
        apiKey: !!apiKey,
      }, { status: 500 });
    }

    // Test ElevenLabs API connection
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/agents/${agentId}`,
      {
        headers: {
          'xi-api-key': apiKey,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({
        success: false,
        error: 'ElevenLabs API error',
        status: response.status,
        message: error,
      }, { status: response.status });
    }

    const agent = await response.json();

    return NextResponse.json({
      success: true,
      message: 'ElevenLabs configuration is valid',
      agent: {
        agent_id: agent.agent_id,
        name: agent.name,
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}