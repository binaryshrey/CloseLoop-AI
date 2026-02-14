# Quick Supabase Setup Commands

## Step-by-Step Instructions

### 1. Access Supabase SQL Editor
- Go to: https://app.supabase.com
- Select your project: `gromlrsdxllytgdiijhn`
- Click **SQL Editor** (left sidebar)
- Click **New Query**

### 2. Run This Complete Script

Copy and paste this entire script into the SQL Editor and click **Run**:

```sql
-- ============================================
-- CLOSELOOP AI DATABASE SCHEMA
-- ============================================

-- 1. CREATE CAMPAIGNS TABLE
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL,
  campaign_description TEXT,
  product_url TEXT,
  product_about_url TEXT,
  product_pricing_url TEXT,
  email_subject TEXT,
  email_body TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CREATE LEADS TABLE
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  about TEXT,
  email TEXT,
  phone TEXT,
  linkedin TEXT,
  twitter TEXT,
  f_score INTEGER,
  reason TEXT,
  is_selected BOOLEAN DEFAULT FALSE,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CREATE CALL_LOGS TABLE
CREATE TABLE IF NOT EXISTS call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  call_status TEXT DEFAULT 'initiated',
  call_duration INTEGER,
  confidence_score INTEGER,
  transcript TEXT,
  recording_url TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_is_selected ON leads(is_selected);
CREATE INDEX IF NOT EXISTS idx_call_logs_campaign_id ON call_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_lead_id ON call_logs(lead_id);

-- 5. CREATE TRIGGER FUNCTION FOR AUTO-UPDATING TIMESTAMPS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. ADD TRIGGERS TO TABLES
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. ENABLE ROW LEVEL SECURITY
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

-- 8. CREATE RLS POLICIES FOR CAMPAIGNS
CREATE POLICY "Users can view their own campaigns"
  ON campaigns FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own campaigns"
  ON campaigns FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own campaigns"
  ON campaigns FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their own campaigns"
  ON campaigns FOR DELETE
  USING (true);

-- 9. CREATE RLS POLICIES FOR LEADS
CREATE POLICY "Users can view leads for their campaigns"
  ON leads FOR SELECT
  USING (true);

CREATE POLICY "Users can insert leads"
  ON leads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update leads"
  ON leads FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete leads"
  ON leads FOR DELETE
  USING (true);

-- 10. CREATE RLS POLICIES FOR CALL_LOGS
CREATE POLICY "Users can view call logs for their campaigns"
  ON call_logs FOR SELECT
  USING (true);

CREATE POLICY "Users can insert call logs"
  ON call_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update call logs"
  ON call_logs FOR UPDATE
  USING (true);
```

### 3. Verify Tables Were Created

After running the script:

1. Click **Table Editor** in the left sidebar
2. You should see 3 tables:
   - ✅ `campaigns`
   - ✅ `leads`
   - ✅ `call_logs`

### 4. Test the Integration

```bash
# In your project directory
cd /Users/shreyanshsaurabh/Documents/Projects-Hackathons/CloseLoop-AI/closeloop-ai

# Start the dev server
npm run dev

# Open browser
# Go to: http://localhost:3000/onboard?step=create-campaign
# Create a campaign and test the flow
```

### 5. View Your Data

After creating a campaign:

1. Go to **Table Editor** in Supabase
2. Click on `campaigns` table
3. You should see your new campaign entry
4. Check the `leads` table after adding leads
5. Check the `call_logs` table after making calls

## Troubleshooting

### If you see "relation already exists" errors:
This means tables are already created. You can skip this or drop them first:

```sql
DROP TABLE IF EXISTS call_logs CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
```

Then run the creation script again.

### If policies already exist:
```sql
DROP POLICY IF EXISTS "Users can view their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can insert their own campaigns" ON campaigns;
-- etc... then recreate them
```

### To reset everything:
```sql
-- WARNING: This deletes all data!
DROP TABLE IF EXISTS call_logs CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

Then run the creation script again.

## Environment Variables (Already Configured)

Your `.env` file already has:
```env
NEXT_PUBLIC_SUPABASE_URL=https://gromlrsdxllytgdiijhn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## What Happens After Setup

1. **Create Campaign** (Step 1) → Saves to `campaigns` table → Returns UUID
2. **Add Leads** (Step 2) → Saves to `leads` table with `campaign_id`
3. **Select Leads** (Step 3) → Updates `is_selected` in `leads` table
4. **Configure Email** (Step 4) → Updates `campaigns` table with email details
5. **Make Calls** (Step 5) → Creates entries in `call_logs` table

## Quick Test Query

After setup, test with this query in SQL Editor:

```sql
-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('campaigns', 'leads', 'call_logs');

-- Should return 3 rows
```

## Database Structure

```
campaigns (id, user_id, campaign_name, type, description, ...)
    ↓ (1 to many)
leads (id, campaign_id, name, email, phone, f_score, is_selected, ...)
    ↓ (1 to many)
call_logs (id, campaign_id, lead_id, transcript, confidence_score, ...)
```

## Done! 🎉

Your database is ready. Start the app and create your first campaign!
