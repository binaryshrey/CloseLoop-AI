# Call Connection Debugging Guide

## Overview
This guide will help you debug call disconnection issues step-by-step using the comprehensive logging that's now in place.

## Prerequisites
- Ensure your app is deployed to a public URL (Vercel, etc.)
- Have access to real-time logs (use `vercel logs --follow` or similar)
- ElevenLabs Agent ID and API Key are configured
- Twilio Account SID, Auth Token, and Phone Number are configured

---

## Step-by-Step Debugging Procedure

### Step 1: Verify Environment Variables

First, check that all required environment variables are set:

```bash
# Check locally (if using .env.local)
cat .env.local | grep -E "TWILIO|ELEVENLABS"

# Or check in your deployment dashboard
# Vercel: Settings > Environment Variables
# Ensure you have:
# - TWILIO_ACCOUNT_SID
# - TWILIO_AUTH_TOKEN
# - TWILIO_PHONE_NUMBER
# - ELEVENLABS_AGENT_ID
# - ELEVENLABS_API_KEY
# - NEXT_PUBLIC_APP_URL (should point to your deployed URL)
```

---

### Step 2: Test ElevenLabs Connection

Before making a call, verify your ElevenLabs credentials work:

```bash
# Visit this endpoint in your browser or curl:
curl https://your-app-url.vercel.app/api/test-elevenlabs-connection
```

**Expected Response:**
```json
{
  "success": true,
  "message": "ElevenLabs connection test passed!",
  "agent": { ... },
  "websocket": { ... },
  "tests": {
    "agentFetch": "PASSED",
    "signedUrl": "PASSED"
  }
}
```

**If this fails:**
- ❌ Check your ELEVENLABS_AGENT_ID is correct
- ❌ Check your ELEVENLABS_API_KEY is valid
- ❌ Verify the agent exists in your ElevenLabs dashboard

---

### Step 3: Initiate a Test Call

1. Open your app UI
2. Click "Start Real Call" button
3. **Immediately open your logs** (e.g., `vercel logs --follow`)

---

### Step 4: Monitor Logs in Sequence

Watch for these log sections in **this exact order**:

#### 📞 Section 1: Call Initiation
```
========================================
📞 INITIATING OUTBOUND CALL
========================================
🌐 Webhook Base URL: https://your-app.vercel.app
📱 From Number: +1234567890
📱 To Number: +1234567890
🔗 Voice URL: https://your-app.vercel.app/api/twilio/voice
🔗 Status Callback URL: https://your-app.vercel.app/api/twilio/status
```

**✅ What to verify:**
- Webhook URL is a **public HTTPS URL** (not localhost)
- From/To numbers are in E.164 format (+1XXXXXXXXXX)

**❌ Common issues:**
- If webhook URL contains "localhost" → Deploy to production
- If Twilio error appears → Check Twilio credentials

---

#### 📊 Section 2: Status Callbacks
You should see multiple status updates:

```
========================================
📊 TWILIO STATUS CALLBACK
========================================
📊 Status: initiated
```

Then:
```
📊 Status: ringing
```

Then:
```
📊 Status: answered  ← CRITICAL - Call must reach this state
```

**❌ If call stops at "initiated" or "ringing":**
- Check your phone number can receive calls
- Check if phone is available/not on DND
- Verify Twilio account has sufficient balance

**❌ If you see ERROR CODE or ERROR MESSAGE:**
- Look up the Twilio error code: https://www.twilio.com/docs/api/errors
- Common codes:
  - 11200: Invalid phone number
  - 13227: Insufficient funds
  - 30003: Unreachable destination

---

#### 🔔 Section 3: Voice Webhook Call
When the call is answered, Twilio calls your voice webhook:

```
========================================
🔔 TWILIO VOICE WEBHOOK CALLED
========================================
⏰ Timestamp: 2026-02-14T...
📞 Call SID: CA...
📱 From: +1234567890
📱 To: +1234567890
📊 Call Status: in-progress
🔄 Direction: outbound-api
```

**✅ What to verify:**
- This section appears **after** status "answered"
- Call Status is "in-progress"

**❌ If this section never appears:**
- Voice webhook URL is not publicly accessible
- Check NEXT_PUBLIC_APP_URL is correct
- Verify your deployment is live

---

#### 🔗 Section 4: ElevenLabs Signed URL Request
```
🔗 STEP 1: Requesting signed URL from ElevenLabs...
⏱️  Signed URL request took: XXXms
📡 ElevenLabs API Response Status: 200
```

**✅ Good response (status 200):**
```
✅ Got signed URL from ElevenLabs successfully
🔗 WebSocket URL: wss://api.elevenlabs.io/v1/convai/...
   Protocol: WSS (Secure)
   Domain: api.elevenlabs.io
```

**❌ If status is NOT 200:**
- 401: Invalid API key
- 404: Agent ID not found
- 500: ElevenLabs service error

**❌ If request times out (>5 seconds):**
- Network connectivity issue
- ElevenLabs API may be down (check status page)

---

#### 🔗 Section 5: TwiML Stream Generation
```
🔗 STEP 2: Creating Twilio Media Stream connection...
✅ TwiML stream object created successfully
📄 Generated TwiML:
─────────────────────────────────────
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://api.elevenlabs.io/v1/convai/..."/>
  </Connect>
</Response>
─────────────────────────────────────
```

**✅ What to verify:**
- TwiML contains `<Connect><Stream url="wss://..."/></Connect>`
- WebSocket URL starts with `wss://` (secure)

**❌ If TwiML is malformed:**
- File a bug - this shouldn't happen
- Check for any errors in the "ERROR CREATING STREAM" section

---

#### ✅ Section 6: Voice Webhook Completion
```
✅ VOICE WEBHOOK COMPLETED SUCCESSFULLY
⏱️  Total processing time: XXXms
📤 Returning TwiML to Twilio
```

**✅ Normal timing:**
- Total processing should be < 3000ms (3 seconds)
- Signed URL request should be < 1000ms

**❌ If processing takes > 5 seconds:**
- ElevenLabs API is slow
- Network latency issues

---

### Step 5: Watch for ElevenLabs Events

After the voice webhook completes, watch for ElevenLabs events:

```
========================================
🎙️  ELEVENLABS WEBHOOK RECEIVED
========================================
📦 Event Type: conversation.initiated
🆔 Session ID: CA...
```

**Expected sequence:**
1. `conversation.initiated` - Connection established
2. `agent.response` or `user.transcript` - Conversation starts
3. `conversation.ended` - Call ends

**❌ If you NEVER see conversation.initiated:**
- **This is the root cause of hangup!**
- WebSocket connection failed
- Possible causes:
  - ElevenLabs agent is not configured properly
  - Agent has errors in configuration
  - Audio codec mismatch
  - Network/firewall blocking WebSocket

---

### Step 6: Check for SSE Client Connection

```
========================================
📡 SSE STREAM REQUEST
========================================
📞 Call SID: CA...
🔌 Starting SSE stream for call: CA...
✅ SSE Client connected and registered for call: CA...
```

**✅ This confirms the frontend is listening for transcripts**

---

## Common Failure Patterns

### Pattern 1: Call Hangs Up Immediately (< 2 seconds)

**Symptoms:**
- Status goes: initiated → ringing → answered → completed
- Voice webhook is never called OR returns quickly
- No ElevenLabs events received

**Root Cause:**
- Voice webhook URL is incorrect/unreachable
- OR TwiML returned an immediate hangup

**Solution:**
1. Check NEXT_PUBLIC_APP_URL environment variable
2. Ensure deployment is live: `curl https://your-app.vercel.app/api/twilio/voice`
3. Look for TwiML with `<Hangup/>` in logs

---

### Pattern 2: Call Connects But No Audio

**Symptoms:**
- Status: initiated → ringing → answered → in-progress
- Voice webhook is called successfully
- TwiML with Stream is generated
- But no conversation.initiated from ElevenLabs

**Root Cause:**
- WebSocket connection from Twilio to ElevenLabs is failing
- Signed URL may be invalid or expired

**Solution:**
1. Check the signed URL in logs - should start with `wss://`
2. Manually test ElevenLabs agent in their dashboard
3. Check ElevenLabs agent settings:
   - Voice model is selected
   - Language is configured
   - Agent is not in draft mode

---

### Pattern 3: Connection Established But Immediate Disconnect

**Symptoms:**
- conversation.initiated received
- Immediately followed by conversation.ended
- Call duration < 5 seconds

**Root Cause:**
- ElevenLabs agent encountered an error
- Audio stream incompatibility
- Agent configuration error

**Solution:**
1. Check ElevenLabs dashboard for agent errors
2. Test agent directly in ElevenLabs UI
3. Verify agent prompt is not causing immediate exits
4. Check agent settings for required fields

---

## Quick Diagnostic Commands

### 1. Test Full Call Flow (Manual cURL)

```bash
# Step 1: Get signed URL
curl -X GET \
  "https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=YOUR_AGENT_ID" \
  -H "xi-api-key: YOUR_API_KEY"

# Expected: Should return {"signed_url": "wss://..."}
```

### 2. Check Twilio Call Logs

```bash
# If you have Twilio CLI installed:
twilio api:core:calls:list --limit 5

# Or visit: https://console.twilio.com/us1/monitor/logs/calls
```

### 3. Monitor Real-Time Logs

```bash
# Vercel:
vercel logs --follow

# Or use your hosting platform's log streaming
```

---

## Advanced Debugging

### Enable Twilio Debug Mode

Add this to your Twilio call creation in [make-call/route.ts](app/api/twilio/make-call/route.ts:86-92):

```typescript
const call = await client.calls.create({
  to: to,
  from: twilioPhoneNumber,
  url: `${webhookUrl}/api/twilio/voice`,
  statusCallback: `${webhookUrl}/api/twilio/status`,
  statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
  record: true, // Enable recording to review audio
  recordingStatusCallback: `${webhookUrl}/api/twilio/recording`,
});
```

### Test WebSocket Connection Manually

If you suspect WebSocket issues, test with a WebSocket client:

```bash
# Install websocat:
# brew install websocat

# Get a signed URL first (from test endpoint), then:
websocat "wss://api.elevenlabs.io/v1/convai/..."
```

---

## Checklist Before Reporting Issue

- [ ] All environment variables are set correctly
- [ ] Test ElevenLabs connection endpoint returns success
- [ ] App is deployed to a public HTTPS URL (not localhost)
- [ ] Phone can receive calls and is not on DND
- [ ] Twilio account has sufficient balance
- [ ] Voice webhook is being called (check logs)
- [ ] Signed URL is successfully obtained (status 200)
- [ ] TwiML with Stream is generated
- [ ] Checked ElevenLabs agent works in their dashboard
- [ ] Reviewed all log sections above

---

## Getting Help

If you've gone through all steps and still have issues:

1. **Collect logs** from a single call attempt
2. **Note the exact timestamp** when call hangs up
3. **Check which section** of logs is missing/failing
4. **Review ElevenLabs dashboard** for agent errors
5. **Check Twilio console** for call logs and errors

Common log output to share:
- Complete log output from voice webhook call
- ElevenLabs test connection endpoint response
- Twilio error codes (if any)
- Screenshot of call status progression
