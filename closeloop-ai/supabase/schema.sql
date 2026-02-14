-- Create campaigns table
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

-- Create leads table
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

-- Create call_logs table
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_is_selected ON leads(is_selected);
CREATE INDEX IF NOT EXISTS idx_call_logs_campaign_id ON call_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_lead_id ON call_logs(lead_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to auto-update updated_at
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for campaigns
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

-- Create policies for leads
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

-- Create policies for call_logs
CREATE POLICY "Users can view call logs for their campaigns"
  ON call_logs FOR SELECT
  USING (true);

CREATE POLICY "Users can insert call logs"
  ON call_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update call logs"
  ON call_logs FOR UPDATE
  USING (true);
