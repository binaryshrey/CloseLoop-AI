import { NextRequest, NextResponse } from 'next/server';

/**
 * ElevenLabs Conversation Initiation Client Data Webhook
 *
 * This endpoint is called by ElevenLabs when a conversation begins.
 * It should return conversation initialization data in JSON format.
 *
 * Documentation: https://elevenlabs.io/docs/conversational-ai/guides/conversational-ai-agent-webhooks
 */
export async function POST(request: NextRequest) {
  try {
    console.log('\n========================================');
    console.log('🎙️ ELEVENLABS CONVERSATION INIT WEBHOOK');
    console.log('========================================');
    console.log('⏰ Timestamp:', new Date().toISOString());

    // Parse the incoming request body
    const body = await request.json();
    console.log('📦 Request Body:', JSON.stringify(body, null, 2));

    // Extract call information from the request
    const { call_id, agent_id, metadata } = body;

    console.log('📞 Call ID:', call_id);
    console.log('🤖 Agent ID:', agent_id);
    console.log('📊 Metadata:', metadata);

    // Return conversation initiation data
    // Customize this based on your needs
    const responseData = {
      // Optional: Custom first message for the agent to say
      // first_message: "Hello! Thanks for calling. How can I help you today?",

      // Optional: Variables to pass to the agent
      // variables: {
      //   customer_name: "John Doe",
      //   account_id: "12345",
      //   campaign_name: "Product Launch"
      // },

      // Optional: Custom metadata
      // metadata: {
      //   call_source: "inbound",
      //   campaign_id: metadata?.campaign_id
      // }
    };

    console.log('📤 Sending response:', JSON.stringify(responseData, null, 2));
    console.log('✅ CONVERSATION INIT COMPLETED');
    console.log('========================================\n');

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error: any) {
    console.error('❌ Error in conversation init webhook:', error);
    console.error('Error stack:', error.stack);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

// Handle GET requests (for testing)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'ElevenLabs Conversation Initiation Webhook',
    status: 'active',
    endpoint: '/api/elevenlabs/conversation-init',
    method: 'POST',
  });
}
