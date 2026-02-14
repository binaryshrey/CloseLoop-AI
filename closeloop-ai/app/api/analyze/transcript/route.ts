import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { transcript, speaker, conversationHistory } = await request.json();

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }

    // Build conversation context
    const conversationContext = conversationHistory
      ? conversationHistory.map((msg: any) =>
          `${msg.speaker}: ${msg.text}`
        ).join('\n')
      : '';

    const fullContext = conversationContext
      ? `${conversationContext}\n${speaker}: ${transcript}`
      : `${speaker}: ${transcript}`;

    // Analyze with Claude
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `You are analyzing a sales call in real-time.
Based on the following conversation, provide:
1. Confidence Score (0-100): How likely is the prospect to convert?
2. Sentiment: POSITIVE, NEUTRAL, or NEGATIVE
3. Key Signals: Brief bullet points of buying signals or objections
4. Recommendation: What should the sales agent do next?

Conversation:
${fullContext}

Respond in JSON format:
{
  "confidenceScore": number (0-100),
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "signals": ["signal1", "signal2"],
  "recommendation": "brief recommendation",
  "reasoning": "brief explanation"
}`
        }
      ]
    });

    // Parse Claude's response
    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      confidenceScore: 50,
      sentiment: 'NEUTRAL',
      signals: ['Unable to analyze'],
      recommendation: 'Continue conversation',
      reasoning: 'Analysis incomplete'
    };

    return NextResponse.json({
      success: true,
      analysis,
      rawResponse: responseText,
    });
  } catch (error: any) {
    console.error('Error analyzing transcript:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze transcript',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
