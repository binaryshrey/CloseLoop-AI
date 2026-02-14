import { NextRequest } from 'next/server';
import { addSSEConnection, removeSSEConnection } from '../../elevenlabs/webhook/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const callSid = searchParams.get('callSid');

  console.log('\n========================================');
  console.log('📡 SSE STREAM REQUEST');
  console.log('========================================');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('📞 Call SID:', callSid);
  console.log('========================================\n');

  if (!callSid) {
    console.error('❌ Missing callSid parameter in SSE request');
    return new Response('Missing callSid parameter', { status: 400 });
  }

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      console.log('🔌 Starting SSE stream for call:', callSid);

      // Add this controller to the shared connections map
      addSSEConnection(callSid, controller);

      // Send initial connection message
      const encoder = new TextEncoder();
      const connectionMsg = JSON.stringify({ type: 'connected', callSid });
      controller.enqueue(encoder.encode(`data: ${connectionMsg}\n\n`));

      console.log('✅ SSE Client connected and registered for call:', callSid);

      // Set up cleanup on connection close
      request.signal.addEventListener('abort', () => {
        console.log('🔌 SSE Client disconnected from call:', callSid);
        removeSSEConnection(callSid, controller);
        try {
          controller.close();
        } catch (e) {
          console.log('   (Controller already closed)');
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
