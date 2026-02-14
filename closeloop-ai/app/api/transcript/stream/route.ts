import { NextRequest } from 'next/server';
import { addSSEConnection, removeSSEConnection } from '../../elevenlabs/webhook/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const callSid = searchParams.get('callSid');

  if (!callSid) {
    return new Response('Missing callSid parameter', { status: 400 });
  }

  console.log(`SSE connection established for call: ${callSid}`);

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Add this controller to the shared connections map
      addSSEConnection(callSid, controller);

      // Send initial connection message
      const encoder = new TextEncoder();
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected', callSid })}\n\n`)
      );

      console.log(`Client connected to SSE stream for call: ${callSid}`);

      // Set up cleanup on connection close
      request.signal.addEventListener('abort', () => {
        console.log(`Client disconnected from SSE stream for call: ${callSid}`);
        removeSSEConnection(callSid, controller);
        try {
          controller.close();
        } catch (e) {
          // Controller already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
