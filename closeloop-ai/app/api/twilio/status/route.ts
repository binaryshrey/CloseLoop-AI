import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const callSid = formData.get('CallSid') as string;
    const callStatus = formData.get('CallStatus') as string;
    const callDuration = formData.get('CallDuration') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;

    console.log('Call status update:', {
      callSid,
      status: callStatus,
      duration: callDuration,
      from,
      to,
    });

    // Here you can:
    // 1. Store call status in database
    // 2. Send real-time updates via WebSocket
    // 3. Trigger post-call analysis

    // For now, just log it
    if (callStatus === 'completed') {
      console.log(`Call ${callSid} completed with duration: ${callDuration}s`);

      // Trigger post-call analysis if needed
      // await analyzeCallTranscript(callSid);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing status callback:', error);
    return NextResponse.json(
      { error: 'Failed to process status callback' },
      { status: 500 }
    );
  }
}
