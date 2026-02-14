-- Fix RLS Policies for CloseLoop AI
-- Run this in Supabase SQL Editor to fix authentication issues

-- Option 1: Disable RLS entirely (Quick fix for development)
ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs DISABLE ROW LEVEL SECURITY;

-- Option 2: Keep RLS enabled but make policies permissive (Recommended)
-- Uncomment the lines below if you want to keep RLS enabled

/*
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can insert their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can update their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can delete their own campaigns" ON campaigns;

DROP POLICY IF EXISTS "Users can view leads for their campaigns" ON leads;
DROP POLICY IF EXISTS "Users can insert leads" ON leads;
DROP POLICY IF EXISTS "Users can update leads" ON leads;
DROP POLICY IF EXISTS "Users can delete leads" ON leads;

DROP POLICY IF EXISTS "Users can view call logs for their campaigns" ON call_logs;
DROP POLICY IF EXISTS "Users can insert call logs" ON call_logs;
DROP POLICY IF EXISTS "Users can update call logs" ON call_logs;

-- Create new permissive policies
CREATE POLICY "Enable all operations on campaigns"
  ON campaigns
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all operations on leads"
  ON leads
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all operations on call_logs"
  ON call_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);
*/
