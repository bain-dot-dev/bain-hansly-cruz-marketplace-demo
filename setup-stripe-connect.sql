-- Database setup for Stripe Connect integration
-- Run this in your Supabase SQL Editor

-- Add missing columns to listings table
ALTER TABLE listings ADD COLUMN IF NOT EXISTS seller_stripe_account_id TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS sold_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS description TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_seller_stripe_account_id ON listings(seller_stripe_account_id);

-- Create direct_charges table for tracking Stripe Connect payments
CREATE TABLE IF NOT EXISTS direct_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connected_account_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  application_fee_amount INTEGER,
  currency TEXT DEFAULT 'usd',
  description TEXT,
  metadata JSONB,
  status TEXT DEFAULT 'pending',
  payment_intent_id TEXT,
  checkout_session_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create connected_accounts table for managing Stripe Connect accounts
CREATE TABLE IF NOT EXISTS connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_account_id TEXT UNIQUE NOT NULL,
  account_type TEXT DEFAULT 'express',
  charges_enabled BOOLEAN DEFAULT false,
  payouts_enabled BOOLEAN DEFAULT false,
  details_submitted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_direct_charges_checkout_session_id ON direct_charges(checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_direct_charges_connected_account_id ON direct_charges(connected_account_id);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_stripe_account_id ON connected_accounts(stripe_account_id);

-- Enable Row Level Security
ALTER TABLE direct_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Service role can access all direct charges" ON direct_charges;
DROP POLICY IF EXISTS "Service role can access all connected accounts" ON connected_accounts;
DROP POLICY IF EXISTS "Service role can access all listings" ON listings;

-- Create RLS policies for service role (API access)
CREATE POLICY "Service role can access all direct charges" ON direct_charges
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can access all connected accounts" ON connected_accounts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can access all listings" ON listings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create policies for regular users
CREATE POLICY "Anyone can view listings" ON listings
FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can create listings" ON listings
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Users can update their own listings" ON listings
FOR UPDATE
TO public
USING (auth.email() = seller_email)
WITH CHECK (auth.email() = seller_email);

-- Update existing listings with mock seller accounts for testing
UPDATE listings 
SET seller_stripe_account_id = 'acct_test_' || substr(md5(random()::text), 1, 10),
    description = COALESCE(description, 'Great item in excellent condition!')
WHERE seller_stripe_account_id IS NULL;

-- Verify the setup
SELECT 
  'listings' as table_name,
  COUNT(*) as total_records,
  COUNT(seller_stripe_account_id) as with_stripe_account
FROM listings
UNION ALL
SELECT 
  'direct_charges' as table_name,
  COUNT(*) as total_records,
  0 as with_stripe_account
FROM direct_charges
UNION ALL
SELECT 
  'connected_accounts' as table_name,
  COUNT(*) as total_records,
  0 as with_stripe_account
FROM connected_accounts;
