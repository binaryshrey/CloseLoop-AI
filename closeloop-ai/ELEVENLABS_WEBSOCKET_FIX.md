# ElevenLabs WebSocket Error 31921 - Troubleshooting Guide

## 🎯 Root Cause

Twilio Error **31921** means: **ElevenLabs WebSocket closed the connection immediately**

Your app is working correctly, but ElevenLabs is rejecting the WebSocket connection.

---

## ✅ What I Fixed

### 1. Added `track: 'both_tracks'` to Stream Configuration

**File:** `app/api/twilio/voice/route.ts`

**Change:**
```typescript
connect.stream({
  url: signed_url,
  track: 'both_tracks', // Ensures bidirectional audio
});
```

This ensures both caller audio (inbound) and agent audio (outbound) are streamed, which is required for conversational AI.

---

## 🔍 ElevenLabs Agent Configuration Checklist

The most common cause of WebSocket errors is **improper agent configuration**. Check these in your ElevenLabs dashboard:

### 1. **Agent Must Be Published (Not in Draft)**
   - Go to: https://elevenlabs.io/app/conversational-ai
   - Find your agent: "Jordan Belfort" (ID: `agent_8901khee2vn9enxsgsy0wqfrqf6m`)
   - Ensure it's **Published** (not Draft)
   - If in Draft mode → Click "Publish"

### 2. **Phone Integration Must Be Enabled**
   - Open your agent settings
   - Go to **Integrations** or **Channels** section
   - Ensure **"Phone"** or **"Twilio"** integration is enabled
   - Some agents are configured for web-only by default

### 3. **Voice Model Must Be Selected**
   - Agent must have a voice model assigned
   - Go to agent settings → **Voice**
   - Ensure a voice is selected and configured

### 4. **Check Agent Greeting/First Message**
   - Agent should have a first message configured
   - If the agent expects the user to speak first, it might close the connection waiting for input
   - Try adding a greeting like: "Hello, this is Jordan. How can I help you today?"

### 5. **Webhook URL (Optional but Recommended)**
   - In agent settings, check if there's a webhook URL field
   - If required, set it to: `https://close-loop-ai.vercel.app/api/elevenlabs/webhook`
   - This allows ElevenLabs to send conversation events back to your app

### 6. **Audio Configuration**
   - Check audio sample rate settings
   - Twilio typically uses: **8kHz** or **16kHz** μ-law
   - Ensure your agent is configured to accept this format

---

## 🧪 Test Your Agent Directly

### Test in ElevenLabs Dashboard:

1. Go to: https://elevenlabs.io/app/conversational-ai
2. Find your "Jordan Belfort" agent
3. Click **"Test"** or **"Try it"** button
4. Have a conversation with the agent

**If this doesn't work** → Your agent has configuration issues unrelated to your app

---

## 🔧 Quick Fixes to Try

### Fix 1: Test with a Different Agent

Create a simple test agent in ElevenLabs:
1. Go to Conversational AI
2. Create new agent
3. Use default settings
4. Publish it
5. Update your `ELEVENLABS_AGENT_ID` to this new agent
6. Test the call

**If this works** → Your "Jordan Belfort" agent has specific configuration issues

---

### Fix 2: Check ElevenLabs Logs

1. Go to: https://elevenlabs.io/app/conversational-ai
2. Find your agent
3. Look for **Logs** or **Usage** tab
4. Check for recent connection attempts around 19:54:30 (your call time)
5. Look for error messages

---

### Fix 3: Verify Agent Permissions

Ensure your ElevenLabs account:
- Has phone integration enabled (might be a paid feature)
- Has sufficient credits/balance
- API key has the correct permissions

---

## 🚀 Next Steps

### Step 1: Deploy the Track Fix

```bash
cd /Users/shreyanshsaurabh/Documents/Projects-Hackathons/CloseLoop-AI/closeloop-ai
git add .
git commit -m "Fix: Add both_tracks to Twilio Stream for bidirectional audio"
git push
```

### Step 2: Verify Agent Configuration

Check all items in the "Agent Configuration Checklist" above.

### Step 3: Test Again

Make another test call and check:
1. Vercel logs for any new errors
2. ElevenLabs dashboard for connection logs
3. Twilio console for updated error messages

### Step 4: Check Logs for New Details

With the track parameter added, the logs should now show:
```
✅ TwiML stream object created successfully
   Track mode: both_tracks (bidirectional audio)
```

---

## 🔍 Advanced Debugging

### Check if ElevenLabs Receives the Connection

Add this to your ElevenLabs agent configuration (if available):
- **Connection webhook**: `https://close-loop-ai.vercel.app/api/elevenlabs/webhook`

This will send events to your app when:
- WebSocket connection is initiated
- Conversation starts
- Errors occur

### Monitor WebSocket Connection

If the issue persists, we can add WebSocket monitoring to your app to see exactly what ElevenLabs is sending back before closing.

---

## 📚 Common Error Patterns

### Pattern 1: Immediate Disconnect (< 1 second)
**Cause**: Agent configuration issue (draft mode, wrong integration, missing voice)
**Solution**: Check agent settings thoroughly

### Pattern 2: Connects but No Audio
**Cause**: Audio format mismatch or track configuration wrong
**Solution**: Verify track settings and audio sample rate

### Pattern 3: Connects Then Times Out (5-10 seconds)
**Cause**: Agent waiting for user input, no greeting configured
**Solution**: Add a greeting message to agent

---

## 🆘 If Nothing Works

1. **Contact ElevenLabs Support**
   - Share your Agent ID: `agent_8901khee2vn9enxsgsy0wqfrqf6m`
   - Share the error: "Twilio WebSocket closes immediately with error 31921"
   - Ask if there are specific Twilio integration requirements

2. **Check ElevenLabs Status Page**
   - Their API might be experiencing issues
   - Check: https://status.elevenlabs.io

3. **Try the ElevenLabs Example**
   - Use their official Twilio + ElevenLabs example code
   - Compare with your implementation
   - Docs: https://elevenlabs.io/docs/conversational-ai/guides/twilio-integration

---

## 📊 What Should Happen When It Works

**Expected log sequence:**
```
🔔 TWILIO VOICE WEBHOOK CALLED
🔗 STEP 1: Requesting signed URL from ElevenLabs...
✅ Got signed URL from ElevenLabs successfully
🔗 STEP 2: Creating Twilio Media Stream connection...
✅ TwiML stream object created successfully
   Track mode: both_tracks (bidirectional audio)
✅ VOICE WEBHOOK COMPLETED SUCCESSFULLY

[Then in ElevenLabs webhook:]
🎙️  ELEVENLABS WEBHOOK RECEIVED
📦 Event Type: conversation.initiated
🆔 Session ID: CA...
```

**If you see `conversation.initiated`** → Success! The WebSocket connected.

---

## 🎯 Most Likely Solution

Based on the error, the #1 most likely issue is:

**Your ElevenLabs agent is not properly configured for phone calls.**

Go to your ElevenLabs dashboard and:
1. Ensure agent is Published
2. Enable Phone/Twilio integration
3. Add a greeting message
4. Test it directly in the dashboard

Then try your call again! 🚀
