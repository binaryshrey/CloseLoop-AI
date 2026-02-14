import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const callSid = formData.get('CallSid') as string;
    const callStatus = formData.get('CallStatus') as string;
    const callDuration = formData.get('CallDuration') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const errorCode = formData.get('ErrorCode') as string;
    const errorMessage = formData.get('ErrorMessage') as string;
    const streamSid = formData.get('StreamSid') as string;

    console.log('\n========================================');
    console.log('📊 TWILIO STATUS CALLBACK');
    console.log('========================================');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('📞 Call SID:', callSid);
    console.log('📊 Status:', callStatus);
    console.log('⏱️  Duration:', callDuration + 's');
    console.log('📱 From:', from);
    console.log('📱 To:', to);

    if (streamSid) {
      console.log('🔗 Stream SID:', streamSid);
    }

    if (errorCode) {
      console.log('❌ ERROR CODE:', errorCode);
      console.log('❌ ERROR MESSAGE:', errorMessage);
    }

    // Log all form data for debugging
    console.log('\n📋 All Status Callback Data:');
    for (const [key, value] of formData.entries()) {
      console.log(`   ${key}: ${value}`);
    }
    console.log('========================================\n');

    // Here you can:
    // 1. Store call status in database
    // 2. Send real-time updates via WebSocket
    // 3. Trigger post-call analysis

    // For now, just log it
    if (callStatus === 'completed') {
      console.log(`✅ Call ${callSid} completed with duration: ${callDuration}s`);

      // Trigger post-call analysis if needed
      // await analyzeCallTranscript(callSid);
    } else if (callStatus === 'failed' || callStatus === 'busy' || callStatus === 'no-answer') {
      console.log(`❌ Call ${callSid} ended with status: ${callStatus}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Error processing status callback:', error);
    return NextResponse.json(
      { error: 'Failed to process status callback' },
      { status: 500 }
    );
  }
}
