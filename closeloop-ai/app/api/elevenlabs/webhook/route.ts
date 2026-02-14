import { NextRequest, NextResponse } from 'next/server';

// In-memory store for call transcripts (use Redis in production)
const callTranscripts: Map<string, Array<{
  id: string;
  speaker: 'agent' | 'prospect';
  text: string;
  timestamp: string;
}>> = new Map();

// SSE connections store - shared module state
const sseConnections = new Map<string, Set<ReadableStreamDefaultController>>();

export function addSSEConnection(callSid: string, controller: ReadableStreamDefaultController) {
  if (!sseConnections.has(callSid)) {
    sseConnections.set(callSid, new Set());
  }
  sseConnections.get(callSid)!.add(controller);
}

export function removeSSEConnection(callSid: string, controller: ReadableStreamDefaultController) {
  const connections = sseConnections.get(callSid);
  if (connections) {
    connections.delete(controller);
    if (connections.size === 0) {
      sseConnections.delete(callSid);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('ElevenLabs webhook received:', JSON.stringify(body, null, 2));

    const { type, call_sid, transcript, speaker, conversation_id } = body;

    // Use call_sid or conversation_id as the session identifier
    const sessionId = call_sid || conversation_id || 'unknown';

    // Handle different event types from ElevenLabs
    switch (type) {
      case 'conversation.initiated':
        callTranscripts.set(sessionId, []);
        console.log(`Conversation initiated: ${sessionId}`);
        break;

      case 'agent.response':
      case 'user.transcript':
      case 'transcript': {
        // Add transcript entry
        const transcriptEntry = {
          id: `msg-${Date.now()}`,
          speaker: (speaker === 'agent' || type === 'agent.response') ? 'agent' as const : 'prospect' as const,
          text: transcript || body.text || '',
          timestamp: new Date().toISOString(),
        };

        if (!callTranscripts.has(sessionId)) {
          callTranscripts.set(sessionId, []);
        }

        const history = callTranscripts.get(sessionId)!;
        history.push(transcriptEntry);

        // Broadcast to connected WebSocket clients
        broadcastToClients(sessionId, {
          type: 'transcript',
          data: transcriptEntry,
          sessionId,
        });

        console.log(`Transcript added for ${sessionId}:`, transcriptEntry);
        break;
      }

      case 'conversation.ended':
        console.log(`Conversation ended: ${sessionId}`);
        broadcastToClients(sessionId, {
          type: 'call_ended',
          sessionId,
        });
        // Keep transcript for a while for potential review
        setTimeout(() => {
          callTranscripts.delete(sessionId);
          activeConnections.delete(sessionId);
        }, 60000); // Clean up after 1 minute
        break;

      default:
        console.log(`Unhandled event type: ${type}`);
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error: any) {
    console.error('Error processing ElevenLabs webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to broadcast data to connected SSE clients
function broadcastToClients(sessionId: string, data: any) {
  const connections = sseConnections.get(sessionId);
  if (!connections || connections.size === 0) {
    console.log(`No SSE connections for session ${sessionId}`);
    return;
  }

  const encoder = new TextEncoder();
  const message = `data: ${JSON.stringify(data)}\n\n`;

  console.log(`Broadcasting to ${connections.size} clients for session ${sessionId}`);

  connections.forEach((controller) => {
    try {
      controller.enqueue(encoder.encode(message));
    } catch (error) {
      console.error('Error sending SSE message:', error);
      connections.delete(controller);
    }
  });
}

export function getCallTranscript(sessionId: string) {
  return callTranscripts.get(sessionId) || [];
}
