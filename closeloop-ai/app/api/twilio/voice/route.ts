import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const formData = await request.formData();
    const callSid = formData.get("CallSid") as string;
    const from = formData.get("From") as string;
    const to = formData.get("To") as string;
    const callStatus = formData.get("CallStatus") as string;
    const direction = formData.get("Direction") as string;

    console.log("\n========================================");
    console.log("🔔 TWILIO VOICE WEBHOOK CALLED");
    console.log("========================================");
    console.log("⏰ Timestamp:", new Date().toISOString());
    console.log("📞 Call SID:", callSid);
    console.log("📱 From:", from);
    console.log("📱 To:", to);
    console.log("📊 Call Status:", callStatus);
    console.log("🔄 Direction:", direction);
    console.log("🌐 Request URL:", request.url);
    console.log(
      "🔑 ElevenLabs Agent ID:",
      process.env.ELEVENLABS_AGENT_ID?.substring(0, 10) + "...",
    );
    console.log(
      "🔑 ElevenLabs API Key exists:",
      !!process.env.ELEVENLABS_API_KEY,
    );
    console.log("========================================\n");

    const twiml = new VoiceResponse();

    // Validate required environment variables
    if (!process.env.ELEVENLABS_AGENT_ID) {
      console.error("ELEVENLABS_AGENT_ID is not set");
      twiml.say(
        { voice: "Polly.Joanna" },
        "Configuration error. Agent ID not found.",
      );
      twiml.hangup();
      return new NextResponse(twiml.toString(), {
        headers: { "Content-Type": "text/xml" },
        status: 200,
      });
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      console.error("ELEVENLABS_API_KEY is not set");
      twiml.say(
        { voice: "Polly.Joanna" },
        "Configuration error. API key not found.",
      );
      twiml.hangup();
      return new NextResponse(twiml.toString(), {
        headers: { "Content-Type": "text/xml" },
        status: 200,
      });
    }

    // Connect the call to ElevenLabs agent via WebSocket
    try {
      console.log("🔗 STEP 1: Requesting signed URL from ElevenLabs...");
      const signedUrlStartTime = Date.now();

      // Get a signed URL from ElevenLabs for this conversation
      const signedUrlResponse = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${process.env.ELEVENLABS_AGENT_ID}`,
        {
          method: "GET",
          headers: {
            "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
          },
        },
      );

      const signedUrlDuration = Date.now() - signedUrlStartTime;
      console.log(`⏱️  Signed URL request took: ${signedUrlDuration}ms`);
      console.log(
        "📡 ElevenLabs API Response Status:",
        signedUrlResponse.status,
      );
      console.log(
        "📋 Response Headers:",
        JSON.stringify(Object.fromEntries(signedUrlResponse.headers.entries())),
      );

      if (!signedUrlResponse.ok) {
        const errorText = await signedUrlResponse.text();
        console.error("❌ FAILED to get signed URL from ElevenLabs:");
        console.error("   Status:", signedUrlResponse.status);
        console.error("   Status Text:", signedUrlResponse.statusText);
        console.error("   Error Body:", errorText);
        throw new Error(
          `ElevenLabs API error: ${signedUrlResponse.status} - ${errorText}`,
        );
      }

      const responseData = await signedUrlResponse.json();
      const { signed_url } = responseData;

      console.log(
        "📦 Full ElevenLabs Response:",
        JSON.stringify(responseData, null, 2),
      );

      if (!signed_url) {
        console.error("❌ No signed_url in response:", responseData);
        throw new Error("No signed URL received from ElevenLabs");
      }

      console.log("✅ Got signed URL from ElevenLabs successfully");
      console.log("🔗 WebSocket URL:", signed_url);
      console.log(
        "   Protocol:",
        signed_url.startsWith("wss://") ? "WSS (Secure)" : "WS (Unsecured)",
      );
      console.log("   Domain:", new URL(signed_url).hostname);

      // Optional: Add a brief pause/greeting before connecting
      // Uncomment if the connection is too abrupt
      // twiml.pause({ length: 1 });

      console.log("\n🔗 STEP 2: Creating Twilio Media Stream connection...");

      // Set up Twilio Media Stream to connect to ElevenLabs WebSocket
      const connect = twiml.connect();

      // Create the stream with the signed URL
      // IMPORTANT: ElevenLabs requires inbound_track to receive caller audio
      // It handles bidirectional audio internally via the WebSocket
      const stream = connect.stream({
        url: signed_url,
        track: "inbound_track", // Send caller audio to ElevenLabs
        name: "elevenlabs_stream", // Stream identifier
      });

      // ElevenLabs handles outbound audio (AI responses) automatically
      // through mark/media messages on the WebSocket

      console.log("✅ TwiML stream object created successfully");
      console.log("   Stream Name: elevenlabs_stream");
      console.log("   Track Mode: inbound_track (caller → ElevenLabs)");
      console.log("   Response Audio: Handled by ElevenLabs via WebSocket");
      const twimlXml = twiml.toString();
      console.log("📄 Generated TwiML:");
      console.log("─────────────────────────────────────");
      console.log(twimlXml);
      console.log("─────────────────────────────────────");
    } catch (streamError: any) {
      console.error("\n❌❌❌ ERROR CREATING STREAM ❌❌❌");
      console.error("Error Type:", streamError.constructor.name);
      console.error("Error Message:", streamError.message);
      console.error("Error Code:", streamError.code);
      console.error("Full Error:", streamError);
      console.error("Stack Trace:", streamError.stack);
      console.error("❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌\n");

      // Create a fresh TwiML response with error message
      const errorTwiml = new VoiceResponse();
      errorTwiml.say(
        { voice: "Polly.Joanna" },
        "We are experiencing technical difficulties connecting to the AI agent. Please try again later.",
      );
      errorTwiml.hangup();

      return new NextResponse(errorTwiml.toString(), {
        headers: {
          "Content-Type": "text/xml",
        },
        status: 200,
      });
    }

    // Return the TwiML response
    const twimlString = twiml.toString();
    const totalDuration = Date.now() - startTime;

    console.log("\n✅ VOICE WEBHOOK COMPLETED SUCCESSFULLY");
    console.log(`⏱️  Total processing time: ${totalDuration}ms`);
    console.log("📤 Returning TwiML to Twilio");
    console.log("========================================\n");

    return new NextResponse(twimlString, {
      headers: {
        "Content-Type": "text/xml",
      },
    });
  } catch (error: any) {
    console.error("❌ Fatal error in voice webhook:", error);
    console.error("Error stack:", error.stack);

    const twiml = new VoiceResponse();
    twiml.say(
      { voice: "Polly.Joanna" },
      "We are experiencing technical difficulties. Please try again later.",
    );
    twiml.hangup();

    return new NextResponse(twiml.toString(), {
      headers: {
        "Content-Type": "text/xml",
      },
      status: 200,
    });
  }
}
