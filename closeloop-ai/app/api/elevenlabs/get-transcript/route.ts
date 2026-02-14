import { NextRequest, NextResponse } from 'next/server';
import { getConversationId } from '../../twilio/voice/route';

export async function GET(request: NextRequest) {
  const callSid = request.nextUrl.searchParams.get('callSid');

  if (!callSid) {
    return NextResponse.json({ error: 'callSid is required' }, { status: 400 });
  }

  // Look up the ElevenLabs conversation_id for this call
  const conversationId = getConversationId(callSid);

  if (!conversationId) {
    // Conversation not registered yet (Twilio hasn't called the voice webhook yet)
    return NextResponse.json({ status: 'pending', transcript: [] });
  }

  // Fetch conversation details from ElevenLabs API
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs conversation API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch conversation', status: 'error' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Format transcript entries
    const transcript = (data.transcript || []).map((entry: any, i: number) => ({
      id: `msg-${i}`,
      speaker: entry.role === 'agent' ? 'agent' : 'prospect',
      text: entry.message,
      timeInCall: entry.time_in_call_secs,
    }));

    return NextResponse.json({
      status: data.status, // "processing" during call, "done" after
      conversationId,
      transcript,
    });
  } catch (error: any) {
    console.error('Error fetching ElevenLabs conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transcript', details: error.message },
      { status: 500 }
    );
  }
}
