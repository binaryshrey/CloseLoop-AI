# CloseLoop AI

**AI-Powered Sales Automation Platform** — Automate lead scoring, outreach, and real-time call monitoring with AI agents.

![banner](https://raw.githubusercontent.com/binaryshrey/CloseLoop-AI/refs/heads/main/backend/banner.png)

[Watch Demo Video](https://vimeo.com/1165028067?share=copy&fl=sv&fe=ci)

CloseLoop AI combines campaign management, AI-powered lead scoring (Claude), real-time outbound phone calls (Twilio + ElevenLabs AI voice agents), live call monitoring with AI analysis, and multi-channel outreach (email + phone) into a single platform.

---

## Features

### Campaign Management
- Create campaigns with name, type, description, and product URLs
- Track campaign status (draft, active, completed, paused)
- Dashboard with analytics and interactive charts

### Lead Management & AI Scoring
- Upload leads via CSV or manual entry
- AI-powered lead scoring using Claude — assigns F-Score (0-100) with reasoning
- Lead selection, filtering, and bulk operations

### Email Outreach
- SMTP-based email sending with HTML templates
- Configurable subjects, bodies, and multiple recipients

### AI Phone Calls
- Outbound calls via Twilio
- ElevenLabs AI voice agent acts as a trained salesperson
- Dynamic agent variables (prospect name, company, product info)
- Call status tracking (initiated, ringing, answered, completed)

### Live Call Monitoring
- Real-time transcript streaming via Server-Sent Events
- Speaker identification (agent vs. prospect)
- Confidence score tracking with animated UI
- Call duration timer

### Real-Time Call Analysis
- Claude-powered analysis during calls
- Confidence score (0-100) — likelihood of conversion
- Sentiment analysis (positive / neutral / negative)
- Key buying signals and objection detection
- Next-step recommendations for the agent

### Dashboard & Analytics
- Overview cards: total revenue, new customers, active accounts, growth rate
- Interactive area charts for trends
- Campaigns table with status indicators

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js 16, React 19, TypeScript 5 |
| Styling | Tailwind CSS 4, Framer Motion |
| UI Components | shadcn/ui, Radix UI, Lucide Icons |
| Database | Supabase (PostgreSQL) |
| Auth | WorkOS AuthKit (SSO) |
| AI | Anthropic Claude (lead scoring + call analysis) |
| Voice | Twilio (phone calls), ElevenLabs (AI voice agent) |
| Email | Nodemailer (SMTP) |
| Data | TanStack React Table, Recharts, Papa Parse |

---

## Project Structure

```
closeloop-ai/
├── app/
│   ├── api/
│   │   ├── analyze-leads/           # AI lead scoring with Claude
│   │   ├── analyze/transcript/      # Real-time call analysis
│   │   ├── call-logs/               # Call history CRUD
│   │   ├── calls/initiate/          # Initiate outbound calls
│   │   ├── campaigns/               # Campaign CRUD
│   │   ├── elevenlabs/
│   │   │   ├── conversation-init/   # Conversation initialization webhook
│   │   │   └── webhook/             # ElevenLabs event webhook + SSE broadcast
│   │   ├── leads/                   # Lead management
│   │   ├── send-email/              # Email sending
│   │   ├── transcript/stream/       # SSE endpoint for live transcripts
│   │   └── twilio/
│   │       ├── make-call/           # Make outbound calls
│   │       ├── voice/               # TwiML webhook (connects to ElevenLabs)
│   │       ├── status/              # Call status callbacks
│   │       └── recording/           # Recording callbacks
│   ├── dashboard/                   # Dashboard page
│   ├── onboard/                     # 5-step onboarding wizard
│   ├── live-call/                   # Live call monitoring page
│   ├── sign-in/ & sign-up/         # Auth pages
│   └── callback/                    # WorkOS auth callback
├── components/
│   ├── ui/                          # shadcn/ui components
│   ├── live-call-monitor.tsx        # Real-time call monitoring
│   ├── campaigns-table.tsx          # Campaign data table
│   ├── chart-area-interactive.tsx   # Interactive area chart
│   ├── section-cards.tsx            # Dashboard stat cards
│   └── app-sidebar.tsx              # Navigation sidebar
├── lib/
│   ├── supabase.ts                  # Supabase client
│   └── utils.ts                     # Utilities
├── config/
│   └── email.config.ts              # SMTP configuration
└── types/
    └── database.ts                  # Supabase TypeScript types
```

---

## Onboarding Flow

The onboarding wizard guides users through 5 steps:

1. **Create Campaign** — Set up campaign name, type, description, and product URL
2. **Source Leads** — Upload leads via CSV file
3. **Select Leads** — AI scores leads and you pick the best ones
4. **Outreach - Email** — Configure and send email campaigns
5. **Outreach - Call** — Initiate AI-powered phone calls to leads

---

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase project
- Twilio account with a phone number
- ElevenLabs account with a trained AI agent
- Anthropic API key
- WorkOS account (for auth)
- Gmail account (for SMTP email)

### Environment Variables

Create a `.env.local` file in the `closeloop-ai/` directory:

```env
# WorkOS Authentication
WORKOS_CLIENT_ID=
WORKOS_API_KEY=
WORKOS_COOKIE_PASSWORD=
WORKOS_REDIRECT_URI=http://localhost:3000/callback

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Anthropic Claude
ANTHROPIC_API_KEY=

# ElevenLabs
ELEVENLABS_API_KEY=
ELEVENLABS_AGENT_ID=

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# SMTP Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=CloseLoop AI <your-email@gmail.com>

# App URL (for webhooks in production)
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### Installation

```bash
cd closeloop-ai
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to get started.

---

## Database Schema

The app uses Supabase PostgreSQL with three main tables:

- **campaigns** — Campaign details, status, email config
- **leads** — Lead info (name, email, phone, LinkedIn, Twitter), AI scores, campaign association
- **call_logs** — Call history with transcripts, duration, confidence scores

---

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Next.js   │────▶│   Supabase   │     │   Claude API    │
│   Frontend  │     │  PostgreSQL  │     │  (Lead Scoring  │
│             │     └──────────────┘     │   + Analysis)   │
│  Dashboard  │                          └─────────────────┘
│  Onboarding │     ┌──────────────┐     ┌─────────────────┐
│  Live Call   │────▶│   Twilio     │────▶│  ElevenLabs     │
│             │     │  (Calling)   │     │  (AI Voice Agent)│
└─────────────┘     └──────────────┘     └─────────────────┘
       │
       ▼
┌─────────────┐
│  Nodemailer  │
│  (Email)     │
└─────────────┘
```

---

## Deployment

Deploy to Vercel:

```bash
vercel deploy
```

Make sure to:
1. Set all environment variables in the Vercel dashboard
2. Update `NEXT_PUBLIC_APP_URL` to your production URL
3. Configure Twilio webhooks to point to your production URL
4. Configure ElevenLabs webhooks to point to your production URL

---

## License

MIT
