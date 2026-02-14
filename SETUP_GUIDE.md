# Real-Time Sales Call System Setup Guide

## Prerequisites
This guide will help you set up accounts and integrate ElevenLabs, Twilio, and Claude API for real-time sales calls with confidence scoring.

---

## Step 1: ElevenLabs Setup

### Create Account
1. Go to [ElevenLabs](https://elevenlabs.io/)
2. Click "Sign Up" and create an account
3. Choose a plan (Starter plan recommended for testing)

### Get API Key
1. Log in to your ElevenLabs dashboard
2. Navigate to **Profile Settings** → **API Keys**
3. Click "Create New API Key"
4. Copy and save your API key
5. Add to your `.env` file:
   ```
   ELEVENLABS_API_KEY=your_api_key_here
   ```

### Create Conversational AI Agent
1. Go to **Conversational AI** in the dashboard
2. Click "Create New Agent"
3. Configure your agent:
   - **Name**: Sales Agent
   - **Voice**: Choose a professional voice
   - **First Message**: "Hello! I'm calling from [Company Name]. How are you today?"
   - **System Prompt**:
     ```
     You are a professional sales representative for [Company Name].
     Your goal is to:
     - Introduce the product/service
     - Understand the prospect's needs
     - Address objections professionally
     - Try to book a meeting or close the sale
     - Be friendly, professional, and concise
     ```
4. Save your agent and copy the **Agent ID**

---

## Step 2: Twilio Setup

### Create Account
1. Go to [Twilio](https://www.twilio.com/try-twilio)
2. Sign up for a free trial account
3. Verify your email and phone number
4. Complete the onboarding questionnaire

### Get Phone Number
1. In Twilio Console, go to **Phone Numbers** → **Manage** → **Buy a number**
2. Search for a number (trial accounts get $15.50 credit)
3. Choose a number with **Voice** capability
4. Purchase the number
5. Save your phone number

### Get API Credentials
1. Go to Twilio Console **Dashboard**
2. Find your credentials:
   - **Account SID**
   - **Auth Token**
3. Add to your `.env` file:
   ```
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_number
   ```

---

## Step 3: Anthropic (Claude) API Setup

### Create Account
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up for an account
3. Add payment method (required for API access)

### Get API Key
1. Navigate to **API Keys** in the console
2. Click "Create Key"
3. Name it (e.g., "Sales Call Analyzer")
4. Copy the API key
5. Add to your `.env` file:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```

---

## Step 4: Environment Variables

Create a `.env.local` file in your `closeloop-ai` directory with all the credentials:

```env
# ElevenLabs
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_AGENT_ID=your_agent_id

# Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Anthropic Claude API
ANTHROPIC_API_KEY=your_anthropic_api_key

# App URL (for webhooks)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Step 5: Configure Twilio Webhooks

After deploying the API routes (next step), configure Twilio webhooks:

1. Go to Twilio Console → **Phone Numbers** → **Manage** → **Active Numbers**
2. Click on your purchased number
3. Scroll to **Voice Configuration**
4. Set **A CALL COMES IN** to:
   - **Webhook**: `https://your-domain.com/api/twilio/voice`
   - **HTTP**: POST
5. Set **CALL STATUS CHANGES** to:
   - **Webhook**: `https://your-domain.com/api/twilio/status`
   - **HTTP**: POST
6. Click **Save**

---

## Architecture Overview

```
[Phone Call] → [Twilio] → [Your API] → [ElevenLabs Agent]
                              ↓
                    [Real-time Transcription]
                              ↓
                    [Claude API Analysis]
                              ↓
                    [WebSocket to Frontend]
                              ↓
                [Display Transcript + Confidence Score]
```

---

## Next Steps

1. Install required npm packages
2. Implement API routes for Twilio integration
3. Implement ElevenLabs agent connection
4. Implement Claude real-time analysis
5. Create frontend component for live display
6. Test the complete flow

Proceed to implementation files for the actual code.
