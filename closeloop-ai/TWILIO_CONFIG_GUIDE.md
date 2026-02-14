# Twilio Configuration Guide for ElevenLabs Integration

## 🎯 Complete Twilio Setup

### Prerequisites
- Active Twilio account
- Verified phone number (or Twilio phone number purchased)
- Account has sufficient balance for calls

---

## ✅ Essential Configuration Checklist

### 1. **Twilio Account Setup**

#### Get Your Credentials

1. Go to: https://console.twilio.com
2. Navigate to **Account → API keys & tokens**
3. Copy these values:

```
TWILIO_ACCOUNT_SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN: [32-character token]
```

**⚠️ Security:** Never commit these to git. Store in environment variables only.

---

### 2. **Phone Number Configuration**

#### Purchase or Verify a Phone Number

**Option A: Buy a Twilio Number (Recommended for Production)**

1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/search
2. Search for numbers with **Voice** capability
3. Select your country (e.g., United States)
4. Choose a number and purchase ($1-15/month)
5. Copy the phone number in E.164 format: `+1XXXXXXXXXX`

**Option B: Use Verified Caller ID (For Testing)**

1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
2. Click **Add a new caller ID**
3. Enter your phone number
4. Verify via phone call or SMS
5. Use this number for testing (can only call verified numbers)

**Set in Environment Variables:**
```
TWILIO_PHONE_NUMBER=+1234567890
```

---

### 3. **Voice Configuration**

Twilio voice settings are mostly configured via TwiML (done automatically by your app).

**Key Settings Your App Handles:**
- **URL Configuration:** Webhooks are set dynamically when creating calls
- **TwiML Generation:** Your `/api/twilio/voice` endpoint generates this
- **Media Streams:** Configured in TwiML to connect to ElevenLabs

**No manual Twilio dashboard configuration needed for voice!**

---

### 4. **Webhook Configuration (Automatic)**

Your app automatically configures these when making calls:

**Voice Webhook:**
- URL: `https://close-loop-ai.vercel.app/api/twilio/voice`
- Method: POST
- Purpose: Generates TwiML to connect call to ElevenLabs

**Status Callback Webhook:**
- URL: `https://close-loop-ai.vercel.app/api/twilio/status`
- Method: POST
- Events: initiated, ringing, answered, completed
- Purpose: Tracks call status in real-time

**These are set programmatically in your code - no dashboard setup required!**

---

### 5. **Account Limits & Verification**

#### Check Your Account Status

1. Go to: https://console.twilio.com
2. Look for account status banner at top

**Trial Account Limitations:**
- Can only call **verified phone numbers**
- Each call plays "Trial account" message prefix
- Limited monthly balance

**Upgraded Account Benefits:**
- Call any phone number (no verification needed)
- No trial message
- Higher throughput
- Production-ready

#### Upgrade Your Account (Recommended)

1. Go to: https://console.twilio.com/us1/account/manage-account/upgrade
2. Follow upgrade process
3. Add payment method
4. Complete verification

**Costs:**
- Phone Number: ~$1-15/month
- Outbound Calls: ~$0.01-0.04/minute
- Twilio Media Streams: $0.0001/message (negligible)

---

### 6. **Environment Variables Configuration**

In your deployment (Vercel, etc.), set these environment variables:

```bash
# Twilio Credentials
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# ElevenLabs Credentials
ELEVENLABS_AGENT_ID=agent_8901khee2vn9enxsgsy0wqfrqf6m
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# App URL (for webhooks)
NEXT_PUBLIC_APP_URL=https://close-loop-ai.vercel.app
```

**Important:**
- `NEXT_PUBLIC_APP_URL` must be a **public HTTPS URL** (not localhost)
- Trailing slashes don't matter (app handles both)
- All credentials must be from **production** accounts (not test/sandbox)

---

## 🔧 Advanced Configuration

### 1. **Media Streams Settings**

Your app uses Twilio Media Streams to send audio to ElevenLabs WebSocket.

**Current Configuration (in your code):**
```typescript
connect.stream({
  url: signed_url, // ElevenLabs WebSocket URL
});
```

**Why no `track` parameter?**
- ElevenLabs signed URLs handle bidirectional audio internally
- Adding `track: 'both_tracks'` caused error 31941
- Default configuration works correctly

**If you need to customize:**
```typescript
// Option 1: Default (recommended for ElevenLabs)
connect.stream({ url: signed_url });

// Option 2: Explicit inbound only
connect.stream({
  url: signed_url,
  track: 'inbound_track'
});

// Option 3: Custom parameters (advanced)
connect.stream({
  url: signed_url,
  name: 'my_stream',
  track: 'inbound_track'
});
```

---

### 2. **Call Recording (Optional)**

To record calls for quality assurance:

**Update `make-call/route.ts`:**
```typescript
const call = await client.calls.create({
  to: to,
  from: twilioPhoneNumber,
  url: `${webhookUrl}/api/twilio/voice`,
  statusCallback: `${webhookUrl}/api/twilio/status`,
  statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
  record: true, // Enable recording
  recordingChannels: 'dual', // Record both sides separately
  recordingStatusCallback: `${webhookUrl}/api/twilio/recording`,
});
```

**Benefits:**
- Review call quality
- Audit conversations
- Training data for improving prompts

**Note:** Recording increases costs slightly and may require user consent depending on jurisdiction.

---

### 3. **Error Handling Configuration**

Your app already handles common errors, but you can customize:

**In `voice/route.ts`:**
```typescript
// Current error handling
if (!signedUrlResponse.ok) {
  twiml.say('Technical difficulties. Please try again later.');
  twiml.hangup();
}

// Enhanced error handling (optional)
if (!signedUrlResponse.ok) {
  // Log error to external service
  await logError({
    service: 'elevenlabs',
    error: await signedUrlResponse.text(),
    callSid: callSid,
  });

  // Custom message based on error
  if (signedUrlResponse.status === 429) {
    twiml.say('Service is busy. Please call back in a few minutes.');
  } else if (signedUrlResponse.status === 401) {
    twiml.say('Configuration error. Please contact support.');
  } else {
    twiml.say('Technical difficulties. Please try again later.');
  }

  twiml.hangup();
}
```

---

### 4. **Timeout Configuration**

Prevent long-running calls:

**In `make-call/route.ts`:**
```typescript
const call = await client.calls.create({
  to: to,
  from: twilioPhoneNumber,
  url: `${webhookUrl}/api/twilio/voice`,
  statusCallback: `${webhookUrl}/api/twilio/status`,
  statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
  timeout: 30, // Ring for max 30 seconds before giving up
  machineDetection: 'Enable', // Detect voicemail/answering machines
});
```

**Machine Detection Options:**
- `Enable`: Detect and report machine/human
- `DetectMessageEnd`: Wait for voicemail beep before starting
- Leave undefined: No detection (default)

**Note:** Machine detection adds delay and cost. Use only if needed.

---

## 🔍 Twilio Console - Call Debugging

### 1. **Monitor Active Calls**

**Go to:** https://console.twilio.com/us1/monitor/logs/calls

**You'll see:**
- Call SID (unique identifier)
- From/To numbers
- Status (initiated, ringing, answered, completed)
- Duration
- Cost
- Errors (if any)

**Click on a call to see:**
- Detailed timeline
- Webhook requests/responses
- Media streams events
- Error messages
- Audio recordings (if enabled)

---

### 2. **Request Inspector**

**Go to:** https://console.twilio.com/us1/monitor/logs/requests

**Shows all webhook calls:**
- Voice webhook: When call is answered
- Status callbacks: As call progresses
- Request/response bodies
- HTTP status codes
- Response times

**Use this to debug:**
- "Why wasn't my voice webhook called?"
- "What TwiML did my app return?"
- "What status callbacks did I receive?"

---

### 3. **Error Codes Reference**

Common Twilio errors you might encounter:

**Error 31921: Stream - WebSocket - Close Error**
- **Cause:** ElevenLabs closed WebSocket immediately
- **Fix:** Check ElevenLabs agent configuration (see ELEVENLABS_CONFIG_GUIDE.md)

**Error 31941: Stream - Invalid Track Configuration**
- **Cause:** Invalid `track` parameter in Stream
- **Fix:** Remove `track` parameter or use valid value (`inbound_track`, `outbound_track`, `both_tracks`)
- **Status:** ✅ Fixed in latest code update

**Error 11200: HTTP Bad Request**
- **Cause:** Invalid phone number format
- **Fix:** Use E.164 format (+1XXXXXXXXXX)

**Error 13227: Insufficient Funds**
- **Cause:** Account balance too low
- **Fix:** Add funds to Twilio account

**Error 20003: Permission Denied**
- **Cause:** Trying to call unverified number from trial account
- **Fix:** Verify the number or upgrade account

**Error 21608: Resource Not Found**
- **Cause:** Invalid Phone Number SID or incorrect Twilio credentials
- **Fix:** Verify TWILIO_PHONE_NUMBER is correct

**Full error code reference:** https://www.twilio.com/docs/api/errors

---

## 🚀 Testing Your Configuration

### 1. **Test Twilio Credentials**

```bash
# Using curl
curl -X GET \
  "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID.json" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"

# Should return your account details
```

### 2. **Test Phone Number**

```bash
# List your phone numbers
curl -X GET \
  "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/IncomingPhoneNumbers.json" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"

# Should show your purchased/verified numbers
```

### 3. **Test Making a Call (Manual)**

```bash
curl -X POST \
  "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Calls.json" \
  --data-urlencode "Url=http://demo.twilio.com/docs/voice.xml" \
  --data-urlencode "To=+1234567890" \
  --data-urlencode "From=$TWILIO_PHONE_NUMBER" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"

# Should initiate a test call with Twilio demo message
```

### 4. **Test Full Integration**

1. Deploy your app to production (Vercel)
2. Ensure environment variables are set
3. Click "Start Real Call" in your app
4. Answer the phone immediately
5. Listen for ElevenLabs agent greeting
6. Have a conversation
7. Check Vercel logs for successful flow
8. Check Twilio console for call details

---

## 📊 Recommended Settings Summary

### Production Configuration:

```bash
# Environment Variables
TWILIO_ACCOUNT_SID=AC... (from console)
TWILIO_AUTH_TOKEN=... (from console)
TWILIO_PHONE_NUMBER=+1234567890 (purchased number)
ELEVENLABS_AGENT_ID=agent_8901khee2vn9enxsgsy0wqfrqf6m
ELEVENLABS_API_KEY=... (from ElevenLabs)
NEXT_PUBLIC_APP_URL=https://close-loop-ai.vercel.app
```

### Call Configuration:
```typescript
{
  to: "+1234567890", // E.164 format
  from: twilioPhoneNumber, // Your Twilio number
  url: `${webhookUrl}/api/twilio/voice`, // Voice webhook
  statusCallback: `${webhookUrl}/api/twilio/status`, // Status updates
  statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
  timeout: 30, // Optional: ring timeout
  record: false, // Optional: enable if needed
}
```

### TwiML Configuration:
```typescript
// Simple stream (recommended for ElevenLabs)
connect.stream({
  url: signed_url, // From ElevenLabs API
});
```

---

## 🔒 Security Best Practices

### 1. **Protect Your Credentials**
- Never commit Twilio credentials to git
- Use environment variables only
- Rotate Auth Token periodically (every 90 days)
- Use separate credentials for dev/staging/production

### 2. **Validate Webhook Requests**

Verify requests are actually from Twilio:

```typescript
import twilio from 'twilio';

export async function POST(request: NextRequest) {
  // Get Twilio signature from headers
  const signature = request.headers.get('X-Twilio-Signature') || '';

  // Verify request came from Twilio
  const isValid = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    signature,
    request.url,
    await request.formData()
  );

  if (!isValid) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Process webhook...
}
```

### 3. **Rate Limiting**

Prevent abuse of your call endpoint:

```typescript
const callCounts = new Map<string, number>();

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const count = callCounts.get(ip) || 0;

  if (count > 10) { // Max 10 calls per IP per hour
    return NextResponse.json(
      { error: 'Too many calls. Please try again later.' },
      { status: 429 }
    );
  }

  callCounts.set(ip, count + 1);
  setTimeout(() => callCounts.delete(ip), 3600000); // Clear after 1 hour

  // Make call...
}
```

---

## 🆘 Troubleshooting

### Voice Webhook Never Called

**Symptoms:**
- Call shows "completed" immediately
- No voice webhook logs
- Duration < 3 seconds

**Causes:**
- Phone number is busy/unavailable
- Call went to voicemail
- Phone didn't answer
- Invalid webhook URL

**Solutions:**
- Answer phone immediately when it rings
- Verify webhook URL is correct: `https://your-app.vercel.app/api/twilio/voice`
- Check phone can receive calls
- Test with a different phone number

---

### Calls Disconnect After Answering

**Symptoms:**
- Call is answered
- Voice webhook is called
- ElevenLabs WebSocket fails
- Call disconnects after 1-2 seconds

**Causes:**
- ElevenLabs agent misconfiguration
- Invalid signed URL
- Stream configuration error

**Solutions:**
- See ELEVENLABS_CONFIG_GUIDE.md
- Test agent in ElevenLabs dashboard first
- Check for error 31921 or 31941 in Twilio logs

---

### One-Way Audio

**Symptoms:**
- Agent can hear you, but you can't hear agent (or vice versa)

**Causes:**
- Stream track configuration issue
- Audio codec mismatch

**Solutions:**
- Use default stream configuration (no track parameter)
- Check ElevenLabs audio settings

---

### High Costs

**Symptoms:**
- Unexpected charges

**Causes:**
- Calls running too long
- Testing in production
- Media streams data transfer

**Solutions:**
- Set max call duration in ElevenLabs agent settings
- Use test/dev environment for development
- Monitor usage in Twilio console

---

## 📚 Additional Resources

- **Twilio Docs:** https://www.twilio.com/docs/voice
- **Media Streams:** https://www.twilio.com/docs/voice/twiml/stream
- **TwiML Reference:** https://www.twilio.com/docs/voice/twiml
- **Error Codes:** https://www.twilio.com/docs/api/errors
- **Webhooks Guide:** https://www.twilio.com/docs/usage/webhooks

---

## 📝 Notes

- Twilio charges per minute for active calls
- Media Streams add minimal cost (~$0.0001/message)
- Test thoroughly in trial mode before upgrading
- Always use E.164 format for phone numbers (+1XXXXXXXXXX)
- Webhook URLs must be publicly accessible HTTPS endpoints
