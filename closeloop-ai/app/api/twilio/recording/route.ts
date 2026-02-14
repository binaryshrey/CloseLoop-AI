import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const recordingSid = formData.get('RecordingSid') as string;
    const recordingUrl = formData.get('RecordingUrl') as string;
    const recordingDuration = formData.get('RecordingDuration') as string;
    const callSid = formData.get('CallSid') as string;

    console.log('Recording available:', {
      recordingSid,
      recordingUrl,
      duration: recordingDuration,
      callSid,
    });

    // Here you can:
    // 1. Download the recording
    // 2. Transcribe it if not done in real-time
    // 3. Store in cloud storage
    // 4. Trigger detailed post-call analysis

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing recording callback:', error);
    return NextResponse.json(
      { error: 'Failed to process recording callback' },
      { status: 500 }
    );
  }
}
