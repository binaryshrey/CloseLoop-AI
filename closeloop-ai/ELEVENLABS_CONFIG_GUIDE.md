# ElevenLabs Conversational AI Configuration Guide

## 🎯 Complete Agent Setup for Twilio Integration

### Step 1: Access Your Agent
1. Go to: https://elevenlabs.io/app/conversational-ai
2. Find your agent: **"Jordan Belfort"**
3. Agent ID: `agent_8901khee2vn9enxsgsy0wqfrqf6m`

---

## ✅ Essential Configuration Checklist

### 1. **Agent Status - MUST BE PUBLISHED**
- [ ] Open your agent in the ElevenLabs dashboard
- [ ] Check the status indicator (top-right or near the agent name)
- [ ] If it says **"Draft"** → Click **"Publish"** button
- [ ] Verify status shows **"Published"** or **"Live"**

**Why this matters:** Draft agents cannot receive external connections. Twilio will reject connections to unpublished agents.

---

### 2. **Phone/Twilio Integration - MUST BE ENABLED**

#### Location: Agent Settings → Integrations/Channels

- [ ] Look for **"Phone"** or **"Telephony"** integration
- [ ] Enable the toggle/switch
- [ ] Some accounts may have a **"Twilio"** specific integration - enable this
- [ ] Save changes

**If you don't see this option:**
- Check if your ElevenLabs plan includes phone integrations
- Some plans (free/starter) may not have phone access
- Upgrade to a plan that includes phone calls

---

### 3. **Voice Configuration - REQUIRED**

#### Location: Agent Settings → Voice

**Voice Model Selection:**
- [ ] Select a voice from the dropdown
- [ ] Test the voice by clicking "Try it" or "Preview"
- [ ] Recommended voices for sales:
  - **Male:** Adam, Antoni, Arnold
  - **Female:** Bella, Elli, Rachel
- [ ] Set **Voice Stability**: 50-70% (natural variation)
- [ ] Set **Similarity Boost**: 70-80% (clear pronunciation)

**Advanced Settings (Optional):**
- [ ] **Speaking Rate**: 1.0 (normal) or 1.1 (slightly faster for sales)
- [ ] **Use Speaker Boost**: Enable for phone calls (improves audio quality)

---

### 4. **First Message/Greeting - CRITICAL FOR PHONE CALLS**

#### Location: Agent Settings → Conversation → First Message

ElevenLabs agents can either:
- **Speak first** (agent greets the caller)
- **Wait for user** (caller speaks first)

**For Twilio calls, ALWAYS configure a greeting:**

```
Example Greeting:
"Hello! This is Jordan from [Company Name]. I'm calling to discuss [reason]. Do you have a few minutes to chat?"
```

**Settings to check:**
- [ ] Enable **"Agent speaks first"** mode
- [ ] Set greeting message (1-3 sentences)
- [ ] Test that greeting isn't too long (< 10 seconds)

**Why this matters:** If the agent waits for user input and there's silence, it may disconnect.

---

### 5. **Conversation Settings**

#### Location: Agent Settings → Conversation

**Key Settings:**
- [ ] **Language**: English (or your target language)
- [ ] **Conversation Style**: Professional / Friendly / Casual (choose based on use case)
- [ ] **Max Conversation Duration**: Set to 5-10 minutes
- [ ] **Timeout on Silence**: 10-15 seconds (how long to wait before ending call)

**Interruption Handling:**
- [ ] **Allow Interruptions**: Enable (lets caller interrupt agent)
- [ ] **Interruption Sensitivity**: Medium (adjust if too sensitive/not sensitive enough)

---

### 6. **Agent Prompt/System Instructions**

#### Location: Agent Settings → Prompt/Instructions

This is your agent's personality and behavior. Example for sales:

```
You are Jordan Belfort, a highly skilled sales representative. Your goal is to:
1. Quickly build rapport with the prospect
2. Identify their pain points and needs
3. Present our solution as the answer to their problems
4. Handle objections confidently
5. Close the deal or schedule a follow-up

TONE: Confident, friendly, persuasive but not pushy
STYLE: Ask open-ended questions, listen actively, use positive language

If the prospect wants to end the call, politely thank them and offer to follow up later.

IMPORTANT: Keep responses concise (under 30 seconds). Ask one question at a time.
```

**Best Practices:**
- Be specific about the agent's role and goals
- Include conversation flow instructions
- Specify tone and style
- Add constraints (response length, questions per turn)
- Include objection handling strategies

---

### 7. **Knowledge Base (Optional but Recommended)**

#### Location: Agent Settings → Knowledge

- [ ] Add product information (features, pricing, benefits)
- [ ] Add common objections and responses
- [ ] Add company information
- [ ] Upload documents (PDFs, text files) if available

**Format:**
```
Q: What does your product do?
A: [Clear, concise answer]

Q: How much does it cost?
A: [Pricing details]

Objection: "It's too expensive"
Response: "I understand budget is a concern. Let me show you the ROI..."
```

---

### 8. **Webhooks - HIGHLY RECOMMENDED**

#### Location: Agent Settings → Webhooks

Configure webhooks to receive conversation events:

**Webhook URL:** `https://close-loop-ai.vercel.app/api/elevenlabs/webhook`

**Events to Enable:**
- [ ] `conversation.initiated` - When call connects
- [ ] `agent.response` - When agent speaks
- [ ] `user.transcript` - When user speaks
- [ ] `conversation.ended` - When call ends

**Why this matters:** Webhooks enable real-time transcript streaming to your frontend.

---

### 9. **Audio Configuration**

#### Location: Agent Settings → Audio (Advanced)

- [ ] **Sample Rate**: Auto (recommended) or 8kHz/16kHz for phone
- [ ] **Audio Format**: μ-law (for Twilio compatibility)
- [ ] **Echo Cancellation**: Enable
- [ ] **Noise Reduction**: Enable

**Note:** These settings may be automatic for phone integrations.

---

### 10. **Test Your Agent in Dashboard**

**Before connecting to Twilio, test your agent directly:**

1. Go to your agent page
2. Click **"Test"** or **"Try Agent"** button
3. Have a conversation with the agent
4. Verify:
   - [ ] Agent greets you first (if configured)
   - [ ] Agent responds to your input
   - [ ] Voice sounds clear
   - [ ] Agent follows your instructions
   - [ ] Conversation flows naturally

**If agent doesn't work in dashboard → It won't work with Twilio!**

---

## 🔍 Troubleshooting ElevenLabs Configuration

### Agent Test Fails or Doesn't Respond

**Check:**
- Voice model is selected
- First message is configured
- Agent is published (not draft)
- Prompt/instructions are not empty

### Agent Disconnects Immediately on Call

**Possible causes:**
- Agent is in draft mode (not published)
- Phone integration is not enabled
- No greeting configured (agent waits for user, times out)
- Audio format mismatch

**Solution:**
- Complete all steps in the checklist above
- Test agent in dashboard first
- Check ElevenLabs logs for specific errors

### No Audio/One-Way Audio

**Check:**
- Voice model is selected and working
- Audio settings are configured for phone calls
- Speaker boost is enabled
- Sample rate is compatible with Twilio (8kHz/16kHz)

### Transcripts Not Appearing

**Check:**
- Webhooks are configured with correct URL
- Webhook URL is publicly accessible (not localhost)
- Events are enabled: `agent.response`, `user.transcript`
- Check your backend logs for webhook events

---

## 📊 Recommended Settings Summary

### Quick Setup (Copy These Settings):

**Agent Status:** Published ✅
**Phone Integration:** Enabled ✅
**Voice:** Rachel (or your choice)
**Voice Stability:** 60%
**Similarity Boost:** 75%
**Speaking Rate:** 1.0
**First Message:** "Hello! This is Jordan from [Company]. I'm calling to discuss [reason]. Do you have a moment to talk?"
**Agent Speaks First:** Yes ✅
**Language:** English
**Max Duration:** 10 minutes
**Silence Timeout:** 15 seconds
**Allow Interruptions:** Yes ✅
**Webhook URL:** `https://close-loop-ai.vercel.app/api/elevenlabs/webhook`
**Webhook Events:** All enabled ✅

---

## 🚀 Verification Steps

After configuring your agent, verify everything is working:

### 1. Dashboard Test
```
✅ Test agent in ElevenLabs dashboard
✅ Agent greets you first
✅ Agent responds to your questions
✅ Voice is clear
```

### 2. API Test
```bash
# Test getting signed URL
curl -X GET \
  "https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=agent_8901khee2vn9enxsgsy0wqfrqf6m" \
  -H "xi-api-key: YOUR_API_KEY"

# Should return: {"signed_url": "wss://..."}
```

### 3. Integration Test
```
✅ Use your app's test connection endpoint
✅ Should return success with agent details
```

### 4. Full Call Test
```
✅ Make a test call through your app
✅ Answer the phone immediately
✅ Verify agent greets you
✅ Have a conversation
✅ Check transcripts appear in real-time
```

---

## 🆘 Getting Help

### ElevenLabs Support
- **Dashboard:** Click "Help" or "Support" button
- **Email:** support@elevenlabs.io
- **Discord:** ElevenLabs Community Discord
- **Docs:** https://elevenlabs.io/docs/conversational-ai

### Provide These Details When Asking for Help:
- Agent ID: `agent_8901khee2vn9enxsgsy0wqfrqf6m`
- Integration type: Twilio Phone Calls
- Error message: "Twilio WebSocket connection fails"
- What you've tried: List your configuration steps

---

## 📝 Notes

- Changes to agent configuration may take 1-2 minutes to propagate
- Always test in the dashboard before testing with Twilio
- Webhook events may have a slight delay (< 1 second)
- Keep your API key secure - never commit it to git
- Monitor your ElevenLabs usage/credits for phone calls
