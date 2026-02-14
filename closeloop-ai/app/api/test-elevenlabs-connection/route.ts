import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const agentId = process.env.ELEVENLABS_AGENT_ID;
    const apiKey = process.env.ELEVENLABS_API_KEY;

    console.log('Testing ElevenLabs connection...');
    console.log('Agent ID:', agentId);
    console.log('API Key exists:', !!apiKey);

    if (!agentId || !apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        hasAgentId: !!agentId,
        hasApiKey: !!apiKey,
      }, { status: 500 });
    }

    // Test 1: Get agent details
    console.log('Test 1: Fetching agent details...');
    const agentResponse = await fetch(
      `https://api.elevenlabs.io/v1/convai/agents/${agentId}`,
      {
        headers: {
          'xi-api-key': apiKey,
        },
      }
    );

    if (!agentResponse.ok) {
      const error = await agentResponse.text();
      console.error('Agent details fetch failed:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch agent details',
        status: agentResponse.status,
        message: error,
      }, { status: agentResponse.status });
    }

    const agentData = await agentResponse.json();
    console.log('✓ Agent details fetched successfully');

    // Test 2: Get signed URL
    console.log('Test 2: Getting signed URL...');
    const signedUrlResponse = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey,
        },
      }
    );

    if (!signedUrlResponse.ok) {
      const error = await signedUrlResponse.text();
      console.error('Signed URL fetch failed:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to get signed URL',
        status: signedUrlResponse.status,
        message: error,
        agentData,
      }, { status: signedUrlResponse.status });
    }

    const { signed_url } = await signedUrlResponse.json();
    console.log('✓ Signed URL obtained successfully');
    console.log('WebSocket URL (truncated):', signed_url.substring(0, 60) + '...');

    return NextResponse.json({
      success: true,
      message: 'ElevenLabs connection test passed!',
      agent: {
        agent_id: agentData.agent_id,
        name: agentData.name,
        language: agentData.conversation_config?.agent?.language,
      },
      websocket: {
        urlPrefix: signed_url.substring(0, 60) + '...',
        protocol: signed_url.startsWith('wss://') ? 'wss' : 'unknown',
      },
      tests: {
        agentFetch: 'PASSED',
        signedUrl: 'PASSED',
      },
    });

  } catch (error: any) {
    console.error('Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
