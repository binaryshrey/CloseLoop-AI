import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const VoiceResponse = twilio.twiml.VoiceResponse;

/**
 * Converts the ElevenLabs register-call response into valid TwiML for Twilio.
 * Handles both formats:
 *  - Raw TwiML XML (starts with '<' or '<?xml')
 *  - JSON with a twiml_response field
 */
function extractTwiml(responseBody: string): string {
  const trimmed = responseBody.trim();

  // If it starts with '<', it's already raw TwiML XML
  if (trimmed.startsWith('<')) {
    console.log('Response format: raw TwiML XML');
    return trimmed;
  }

  // Otherwise try to parse as JSON
  try {
    const json = JSON.parse(trimmed);

    // Check known field names
    if (json.twiml_response) {
      console.log('Response format: JSON with twiml_response field');
      return json.twiml_response;
    }
    if (json.twiml) {
      console.log('Response format: JSON with twiml field');
      return json.twiml;
    }

    // If JSON but no known TwiML field, log everything for debugging
    console.error('JSON response has no twiml field. Keys:', Object.keys(json));
    console.error('Full response:', trimmed);
    throw new Error('ElevenLabs response missing TwiML field');
  } catch (parseError: any) {
    // Not XML, not valid JSON — something unexpected
    if (parseError.message === 'ElevenLabs response missing TwiML field') {
      throw parseError;
    }
    console.error('Response is neither XML nor valid JSON:', trimmed.substring(0, 200));
    throw new Error(`Unexpected response format from ElevenLabs: ${trimmed.substring(0, 100)}`);
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const callStatus = formData.get('CallStatus') as string;
    const direction = formData.get('Direction') as string;

    console.log('\n========================================');
    console.log('TWILIO VOICE WEBHOOK CALLED');
    console.log('========================================');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Call SID:', callSid);
    console.log('From:', from);
    console.log('To:', to);
    console.log('Call Status:', callStatus);
    console.log('Direction:', direction);
    console.log('ElevenLabs Agent ID:', process.env.ELEVENLABS_AGENT_ID?.substring(0, 10) + '...');
    console.log('========================================\n');

    // Validate required environment variables
    if (!process.env.ELEVENLABS_AGENT_ID || !process.env.ELEVENLABS_API_KEY) {
      console.error('Missing ElevenLabs credentials');
      const twiml = new VoiceResponse();
      twiml.say({ voice: 'Polly.Joanna' }, 'Configuration error. Missing credentials.');
      twiml.hangup();
      return new NextResponse(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml' },
        status: 200,
      });
    }

    // Register call with ElevenLabs and get TwiML for Twilio
    try {
      console.log('Registering call with ElevenLabs...');
      const registerStartTime = Date.now();

      const registerResponse = await fetch(
        'https://api.elevenlabs.io/v1/convai/twilio/register-call',
        {
          method: 'POST',
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agent_id: process.env.ELEVENLABS_AGENT_ID,
            from_number: from || 'unknown',
            to_number: to || process.env.TWILIO_PHONE_NUMBER || 'unknown',
            direction: direction === 'outbound' ? 'outbound' : 'inbound',
            conversation_initiation_client_data: {
              conversation_config_override: {
                tts: {
                  output_format: 'ulaw_8000',
                },
              },
              dynamic_variables: {
                _agent_name_: 'Jordan Belfort',
                _sender_company_: 'CloseLoop AI',
                _product_name_: 'CloseLoop AI',
                _prospect_name_: 'there',
                _company_name_: '',
                _product_description_: 'An autonomous AI-powered sales platform that intelligently qualifies prospects, orchestrates personalized multi-channel outreach campaigns, and conducts live sales calls.',
                _product_pricing_: 'Starter at $49 per month, Pro at $149 per month, and Enterprise at $399 per month',
                _current_offer_: '14-day free trial with no credit card required',
                _support_email_: 'support@closeloop.ai',
                _calendar_link_: 'https://cal.com/closeloop/demo',
              },
            },
          }),
        }
      );

      const registerDuration = Date.now() - registerStartTime;
      console.log(`Register call request took: ${registerDuration}ms`);
      console.log('ElevenLabs register-call status:', registerResponse.status);
      console.log('ElevenLabs content-type:', registerResponse.headers.get('content-type'));

      if (!registerResponse.ok) {
        const errorText = await registerResponse.text();
        console.error('Failed to register call with ElevenLabs:', registerResponse.status, errorText);
        throw new Error(`ElevenLabs register-call error: ${registerResponse.status} - ${errorText}`);
      }

      const responseBody = await registerResponse.text();
      console.log('Raw ElevenLabs response:', responseBody);

      // Convert response to TwiML (handles both XML and JSON formats)
      const twimlResponse = extractTwiml(responseBody);

      const totalDuration = Date.now() - startTime;
      console.log('\nVOICE WEBHOOK COMPLETED SUCCESSFULLY');
      console.log(`Total processing time: ${totalDuration}ms`);
      console.log('TwiML sent to Twilio:', twimlResponse);
      console.log('========================================\n');

      return new NextResponse(twimlResponse, {
        headers: { 'Content-Type': 'text/xml' },
      });
    } catch (registerError: any) {
      console.error('Error registering call with ElevenLabs:', registerError.message);

      const twiml = new VoiceResponse();
      twiml.say(
        { voice: 'Polly.Joanna' },
        'We are experiencing technical difficulties connecting to the AI agent. Please try again later.'
      );
      twiml.hangup();

      return new NextResponse(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml' },
        status: 200,
      });
    }
  } catch (error: any) {
    console.error('Fatal error in voice webhook:', error);

    const twiml = new VoiceResponse();
    twiml.say(
      { voice: 'Polly.Joanna' },
      'We are experiencing technical difficulties. Please try again later.'
    );
    twiml.hangup();

    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
      status: 200,
    });
  }
}
