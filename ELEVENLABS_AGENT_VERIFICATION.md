# ElevenLabs Agent Configuration Verification

## ⚠️ Critical Issues That Cause Call Disconnection

Based on your setup, here are the most common reasons calls disconnect immediately:

### Issue #1: Agent Not Published ⭐ **MOST COMMON**
**Check:** Go to https://elevenlabs.io/app/conversational-ai
- Find agent ID: `agent_3901khdvqd14e48r5ksexqeh0rwb`
- Look for status indicator
- If it says **"Draft"** → Click **"Publish"**

### Issue #2: No First Message Configured ⭐ **VERY COMMON**
**Problem:** Agent waits for user to speak first, but on phone calls there's silence → timeout → disconnect

**Fix:**
1. Go to Agent Settings → Conversation → First Message
2. Enable **"Agent speaks first"**
3. Add greeting:
   ```
   Hello! Thanks for answering. This is an automated call from [Your Company]. How are you doing today?
   ```

### Issue #3: Phone Integration Not Enabled
**Check:** Agent Settings → Integrations/Channels
- Enable **"Phone"** or **"Twilio"** integration
- If you don't see this option, your plan may not support phone calls

### Issue #4: Voice Not Configured
**Check:** Agent Settings → Voice
- Ensure a voice model is selected
- Test the voice works

## 🧪 Quick Test

### Test Your Agent Directly (Before Testing with Twilio):
1. Go to https://elevenlabs.io/app/conversational-ai
2. Open your agent: `agent_3901khdvqd14e48r5ksexqeh0rwb`
3. Click **"Test"** or **"Try it"** button
4. The agent should greet you immediately (if configured correctly)

**If the test doesn't work** → Your agent configuration is the problem (not Twilio)

## 🔧 Code Changes Made

### Changes to `/app/api/twilio/voice/route.ts`:

1. **Added 1-second pause** before connecting
   - Ensures call is fully established
   - Prevents premature connection attempts

2. **Added custom parameters** to stream
   - Passes call context (CallSID, phone numbers) to ElevenLabs
   - Helps with debugging and analytics

3. **Proper stream configuration**
   - `track: "inbound_track"` - sends caller audio to ElevenLabs
   - `name: "elevenlabs_stream"` - identifies the stream
   - ElevenLabs sends audio back via WebSocket media messages

## 🚀 Next Steps

### Step 1: Fix Agent Configuration
Go through the checklist above and ensure:
- ✅ Agent is **Published**
- ✅ **First message** is configured
- ✅ **Phone integration** is enabled
- ✅ **Voice** is selected

### Step 2: Test Agent Directly
Test in ElevenLabs dashboard to confirm it works

### Step 3: Deploy & Test Call
```bash
cd closeloop-ai
git add .
git commit -m "Fix: Add pause and parameters for ElevenLabs connection"
git push
```

Then make a test call.

## 📊 What Should Happen

### Successful Call Flow:
1. Call is initiated
2. Twilio calls your webhook: `/api/twilio/voice`
3. Your app gets signed URL from ElevenLabs
4. TwiML connects to ElevenLabs WebSocket
5. **1-second pause** (ensures connection is ready)
6. ElevenLabs agent speaks greeting: "Hello! Thanks for answering..."
7. Conversation continues bidirectionally

### Logs You Should See:
```
🔔 TWILIO VOICE WEBHOOK CALLED
🔗 STEP 1: Requesting signed URL from ElevenLabs...
✅ Got signed URL from ElevenLabs successfully
🔗 STEP 2: Creating Twilio Media Stream connection...
✅ TwiML stream object created successfully
   Stream Name: elevenlabs_stream
   Track Mode: inbound_track (caller → ElevenLabs)
   Custom Parameters: { call_sid: "CA...", from: "+1...", to: "+1..." }
```

## 🆘 Still Not Working?

### Check Logs for Specific Errors:

**Error: "31921 - WebSocket Close"**
- Agent configuration issue
- Agent not published
- Agent not configured for phone

**Error: "31941 - Invalid Track Configuration"**
- Already fixed in code
- Ensure you've deployed latest changes

**No Error, Just Disconnects:**
- Most likely: **No first message configured**
- Agent waits for user → silence → timeout → disconnect

### Debug Commands:
```bash
# Check environment variables are set
cd closeloop-ai
grep ELEVENLABS .env

# Should show:
# ELEVENLABS_API_KEY=sk_...
# ELEVENLABS_AGENT_ID=agent_3901khdvqd14e48r5ksexqeh0rwb
```

## 📞 Support

If still having issues:
1. **Check ElevenLabs Status**: https://status.elevenlabs.io
2. **Contact ElevenLabs Support** with:
   - Agent ID: `agent_3901khdvqd14e48r5ksexqeh0rwb`
   - Error: "Twilio integration - calls disconnect immediately"
   - Mention you've verified agent is published and has first message
