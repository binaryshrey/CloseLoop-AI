# Database Setup Guide

This guide will help you set up the Supabase database for CloseLoop AI.

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Supabase project credentials (already configured in `.env`)

## Database Schema

The application uses three main tables:

### 1. `campaigns` Table
Stores campaign information created by users during onboarding.

**Fields:**
- `id` (UUID) - Primary key, auto-generated
- `user_id` (TEXT) - User ID from WorkOS authentication
- `campaign_name` (TEXT) - Name of the campaign
- `campaign_type` (TEXT) - Type (Lead Generation, Customer Engagement, etc.)
- `campaign_description` (TEXT) - Optional description
- `product_url`, `product_about_url`, `product_pricing_url` (TEXT) - Product URLs
- `email_subject`, `email_body` (TEXT) - Email outreach content
- `status` (TEXT) - Campaign status (draft, active, completed)
- `created_at`, `updated_at` (TIMESTAMP) - Auto-managed timestamps

### 2. `leads` Table
Stores lead information associated with campaigns.

**Fields:**
- `id` (UUID) - Primary key, auto-generated
- `campaign_id` (UUID) - Foreign key to campaigns table
- `name` (TEXT) - Lead name
- `about` (TEXT) - Lead description/title
- `email`, `phone` (TEXT) - Contact information
- `linkedin`, `twitter` (TEXT) - Social media profiles
- `f_score` (INTEGER) - Confidence/fit score (0-100)
- `reason` (TEXT) - Why this lead is a good fit
- `is_selected` (BOOLEAN) - Whether lead is selected for outreach
- `source` (TEXT) - Lead source (manual, csv, api)
- `created_at`, `updated_at` (TIMESTAMP) - Auto-managed timestamps

### 3. `call_logs` Table
Stores call interaction data between AI agents and leads.

**Fields:**
- `id` (UUID) - Primary key, auto-generated
- `campaign_id` (UUID) - Foreign key to campaigns table
- `lead_id` (UUID) - Foreign key to leads table
- `call_status` (TEXT) - Status (initiated, in_progress, completed, failed)
- `call_duration` (INTEGER) - Call duration in seconds
- `confidence_score` (INTEGER) - Confidence score during call (0-100)
- `transcript` (TEXT) - Call transcript
- `recording_url` (TEXT) - URL to call recording
- `started_at`, `ended_at` (TIMESTAMP) - Call timestamps
- `created_at` (TIMESTAMP) - Record creation timestamp

## Setup Instructions

### Step 1: Access Supabase Dashboard

1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your project (or create a new one)
3. Navigate to the **SQL Editor** from the left sidebar

### Step 2: Run Schema Migration

1. Open the SQL Editor
2. Copy the contents of `/supabase/schema.sql`
3. Paste into the SQL Editor
4. Click "Run" to execute the schema creation

This will create:
- All three tables with proper relationships
- Indexes for optimized queries
- Row Level Security (RLS) policies
- Automatic timestamp triggers

### Step 3: Verify Tables

1. Navigate to **Table Editor** in the Supabase dashboard
2. Verify you see three tables:
   - `campaigns`
   - `leads`
   - `call_logs`

### Step 4: Configure Environment Variables

Your `.env` file should already have:

```env
NEXT_PUBLIC_SUPABASE_URL=https://gromlrsdxllytgdiijhn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

These are already configured in your project.

## API Endpoints

The application provides the following API endpoints:

### Campaigns API (`/api/campaigns`)

**POST** - Create a new campaign
```typescript
POST /api/campaigns
Body: {
  user_id: string;
  campaign_name: string;
  campaign_type: string;
  campaign_description?: string;
  product_url?: string;
  product_about_url?: string;
  product_pricing_url?: string;
  email_subject?: string;
  email_body?: string;
  status?: string;
}
```

**GET** - Fetch campaigns
```typescript
// Get all campaigns for a user
GET /api/campaigns?user_id={userId}

// Get specific campaign
GET /api/campaigns?campaign_id={campaignId}
```

**PATCH** - Update a campaign
```typescript
PATCH /api/campaigns
Body: {
  campaign_id: string;
  // ... any fields to update
}
```

### Leads API (`/api/leads`)

**POST** - Create leads (bulk or single)
```typescript
POST /api/leads
Body: {
  leads: [
    {
      campaign_id: string;
      name: string;
      about?: string;
      email?: string;
      phone?: string;
      linkedin?: string;
      twitter?: string;
      f_score?: number;
      reason?: string;
      is_selected?: boolean;
      source?: string;
    }
  ]
}
```

**GET** - Fetch leads
```typescript
// Get all leads for a campaign
GET /api/leads?campaign_id={campaignId}

// Get only selected leads
GET /api/leads?campaign_id={campaignId}&selected_only=true

// Get specific lead
GET /api/leads?lead_id={leadId}
```

**PATCH** - Update a single lead
```typescript
PATCH /api/leads
Body: {
  lead_id: string;
  // ... any fields to update
}
```

**PUT** - Bulk update leads
```typescript
PUT /api/leads
Body: {
  lead_ids: string[];
  update_data: {
    is_selected?: boolean;
    // ... other fields
  }
}
```

### Call Logs API (`/api/call-logs`)

**POST** - Create a call log
```typescript
POST /api/call-logs
Body: {
  campaign_id: string;
  lead_id: string;
  call_status?: string;
  confidence_score?: number;
  transcript?: string;
  recording_url?: string;
  started_at?: string;
}
```

**GET** - Fetch call logs
```typescript
// Get all call logs for a campaign
GET /api/call-logs?campaign_id={campaignId}

// Get call logs for a specific lead
GET /api/call-logs?lead_id={leadId}

// Get specific call log
GET /api/call-logs?call_log_id={callLogId}
```

**PATCH** - Update a call log
```typescript
PATCH /api/call-logs
Body: {
  call_log_id: string;
  call_status?: string;
  call_duration?: number;
  confidence_score?: number;
  transcript?: string;
  recording_url?: string;
  ended_at?: string;
}
```

## How It Works

### Onboarding Flow Integration

1. **Step 1: Create Campaign**
   - User fills in campaign details
   - On clicking "Next", campaign is saved to database
   - Campaign ID is added to URL query params for persistence

2. **Step 2: Source Leads**
   - User adds leads manually or via CSV
   - Leads are saved to database when moving to next step
   - Each lead is linked to the campaign via `campaign_id`

3. **Step 3: Select Leads**
   - User selects leads for outreach
   - Selection status is updated in database in real-time
   - `is_selected` field is toggled for each lead

4. **Step 4: Email Outreach**
   - Email subject and body are saved
   - Campaign is updated with email details

5. **Step 5: Call Center**
   - When a call starts, a call log entry is created
   - Call status, transcript, and confidence scores are tracked
   - All call data is persisted for analytics

### Query Param Structure

The campaign ID is persisted in the URL:
```
/onboard?step=create-campaign&campaign_id={uuid}
```

This allows:
- Page refreshes without losing campaign data
- Sharing campaign links
- Resuming campaigns later

## Database Relationships

```
campaigns (1) ----< (many) leads
    |
    |----< (many) call_logs

leads (1) ----< (many) call_logs
```

## Security

- **Row Level Security (RLS)** is enabled on all tables
- Policies allow users to access their own data
- Currently set to permissive for development
- **Production**: Update policies to use proper authentication

## TypeScript Types

All database types are defined in `/types/database.ts`:

```typescript
import type { Campaign, Lead, CallLog } from '@/types/database';
```

## Troubleshooting

### Issue: Tables not created
**Solution**: Check SQL Editor for errors. Ensure you're running the complete schema from `/supabase/schema.sql`

### Issue: API returns 500 errors
**Solution**:
1. Check Supabase credentials in `.env`
2. Verify RLS policies are configured
3. Check browser console for detailed errors

### Issue: Campaign ID not persisting
**Solution**: Check that URL includes `campaign_id` query param. The onboard client automatically adds it after campaign creation.

### Issue: Leads not saving
**Solution**: Ensure campaign is created first (Step 1 must be completed before Step 2 saves leads)

## Next Steps

1. **Add Authentication Checks**: Update RLS policies to verify user ownership
2. **Add CSV Upload**: Implement CSV parsing and bulk lead import
3. **Add Real-time Updates**: Use Supabase real-time subscriptions for live updates
4. **Add Analytics**: Query call_logs for campaign performance metrics
5. **Add Dashboard**: Display campaigns, leads, and call statistics

## Support

For issues with:
- **Supabase**: Check [Supabase Documentation](https://supabase.com/docs)
- **Application**: Review API route files in `/app/api/`
- **Database Schema**: Review `/supabase/schema.sql`
