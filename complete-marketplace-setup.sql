-- =============================================================================
-- COMPLETE MARKETPLACE SETUP SCRIPT
-- =============================================================================
-- This script sets up everything needed for a fully functional marketplace
-- Run this ONCE in your Supabase SQL Editor
-- =============================================================================

-- =============================================================================
-- 1. CORE TABLES
-- =============================================================================

-- Create listings table if it doesn't exist
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  location VARCHAR(255),
  image_url TEXT,
  seller_email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Stripe Connect fields
  seller_stripe_account_id TEXT,
  status TEXT DEFAULT 'available',
  sold_at TIMESTAMP WITH TIME ZONE,
  description TEXT
);

-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  buyer_email VARCHAR(255) NOT NULL,
  seller_email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create connected_accounts table for managing Stripe Connect accounts
CREATE TABLE IF NOT EXISTS connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- References auth.users(id) when using Supabase auth
  stripe_account_id TEXT UNIQUE NOT NULL,
  account_type TEXT DEFAULT 'express',
  charges_enabled BOOLEAN DEFAULT false,
  payouts_enabled BOOLEAN DEFAULT false,
  details_submitted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- =============================================================================
-- 2. INDEXES FOR PERFORMANCE
-- =============================================================================

-- Listings indexes
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_seller_email ON listings(seller_email);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_seller_stripe_account_id ON listings(seller_stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_listing_id ON messages(listing_id);
CREATE INDEX IF NOT EXISTS idx_messages_buyer_email ON messages(buyer_email);
CREATE INDEX IF NOT EXISTS idx_messages_seller_email ON messages(seller_email);

-- Connected accounts indexes
CREATE INDEX IF NOT EXISTS idx_connected_accounts_stripe_account_id ON connected_accounts(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_user_id ON connected_accounts(user_id);

-- Direct charges indexes
CREATE INDEX IF NOT EXISTS idx_direct_charges_checkout_session_id ON direct_charges(checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_direct_charges_connected_account_id ON direct_charges(connected_account_id);

-- =============================================================================
-- 3. ROW LEVEL SECURITY SETUP
-- =============================================================================

-- Enable Row Level Security
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_charges ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Service role can access all listings" ON listings;
DROP POLICY IF EXISTS "Service role can access all messages" ON messages;
DROP POLICY IF EXISTS "Service role can access all connected accounts" ON connected_accounts;
DROP POLICY IF EXISTS "Service role can access all direct charges" ON direct_charges;
DROP POLICY IF EXISTS "Anyone can view listings" ON listings;
DROP POLICY IF EXISTS "Users can create listings" ON listings;
DROP POLICY IF EXISTS "Users can update their own listings" ON listings;
DROP POLICY IF EXISTS "Users can delete their own listings" ON listings;
DROP POLICY IF EXISTS "Anyone can view connected accounts" ON connected_accounts;
DROP POLICY IF EXISTS "Users can manage their own connected accounts" ON connected_accounts;
DROP POLICY IF EXISTS "Users can view messages for their listings" ON messages;
DROP POLICY IF EXISTS "Users can create messages" ON messages;

-- =============================================================================
-- 4. SERVICE ROLE POLICIES (for API access)
-- =============================================================================

CREATE POLICY "Service role can access all listings" ON listings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can access all messages" ON messages
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can access all connected accounts" ON connected_accounts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can access all direct charges" ON direct_charges
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =============================================================================
-- 5. PUBLIC/AUTHENTICATED USER POLICIES
-- =============================================================================

-- Listings policies
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

CREATE POLICY "Users can delete their own listings" ON listings
FOR DELETE
TO public
USING (auth.email() = seller_email);

-- Connected accounts policies
CREATE POLICY "Anyone can view connected accounts" ON connected_accounts
FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can manage their own connected accounts" ON connected_accounts
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view messages for their listings" ON messages
FOR SELECT
TO public
USING (auth.email() = seller_email OR auth.email() = buyer_email);

CREATE POLICY "Users can create messages" ON messages
FOR INSERT
TO public
WITH CHECK (true);

-- =============================================================================
-- 6. ANALYTICS VIEWS
-- =============================================================================

-- Create or replace marketplace analytics view
CREATE OR REPLACE VIEW marketplace_analytics AS
SELECT 
  COUNT(*) as total_listings,
  COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold_items,
  COUNT(CASE WHEN status = 'available' THEN 1 END) as available_items,
  AVG(price) as average_price,
  COUNT(DISTINCT seller_email) as total_sellers,
  COUNT(DISTINCT category) as total_categories,
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as listings_this_week,
  COUNT(CASE WHEN sold_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as sales_this_week
FROM listings;

-- Create or replace detailed listings view with seller info
CREATE OR REPLACE VIEW marketplace_listings_with_analytics AS
SELECT 
  l.*,
  ca.stripe_account_id,
  ca.charges_enabled,
  ca.payouts_enabled,
  ca.details_submitted,
  dc.amount as last_charge_amount,
  dc.status as last_charge_status,
  dc.checkout_session_id as last_checkout_session
FROM listings l
LEFT JOIN connected_accounts ca ON l.seller_stripe_account_id = ca.stripe_account_id
LEFT JOIN LATERAL (
  SELECT amount, status, checkout_session_id
  FROM direct_charges dc 
  WHERE dc.metadata->>'post_id' = l.id::text
  ORDER BY dc.created_at DESC 
  LIMIT 1
) dc ON true;

-- =============================================================================
-- 7. HELPER FUNCTIONS
-- =============================================================================

-- Function to sync Stripe charges (called by API)
CREATE OR REPLACE FUNCTION sync_stripe_charges()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- This is a placeholder function that can be called by the API
  -- The actual syncing logic is handled in the Node.js application
  result := json_build_object(
    'status', 'success',
    'message', 'Stripe charge sync initiated',
    'timestamp', NOW()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to update listing status when sold
CREATE OR REPLACE FUNCTION mark_listing_as_sold(listing_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  updated_rows INTEGER;
BEGIN
  UPDATE listings 
  SET 
    status = 'sold',
    sold_at = NOW(),
    updated_at = NOW()
  WHERE id = listing_id AND status = 'available';
  
  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  
  IF updated_rows > 0 THEN
    result := json_build_object(
      'status', 'success',
      'message', 'Listing marked as sold',
      'listing_id', listing_id,
      'sold_at', NOW()
    );
  ELSE
    result := json_build_object(
      'status', 'error',
      'message', 'Listing not found or already sold',
      'listing_id', listing_id
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 8. TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_listings_updated_at ON listings;
CREATE TRIGGER update_listings_updated_at 
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_connected_accounts_updated_at ON connected_accounts;
CREATE TRIGGER update_connected_accounts_updated_at 
  BEFORE UPDATE ON connected_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_direct_charges_updated_at ON direct_charges;
CREATE TRIGGER update_direct_charges_updated_at 
  BEFORE UPDATE ON direct_charges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 9. SAMPLE DATA (Optional - for testing)
-- =============================================================================

-- Insert sample listings if none exist
INSERT INTO listings (title, price, category, location, seller_email, description)
SELECT * FROM (VALUES 
  ('iPhone 14 Pro', 999.99, 'Electronics', 'San Francisco, CA', 'john@example.com', 'Like new iPhone 14 Pro in excellent condition'),
  ('Vintage Guitar', 1500.00, 'Musical Instruments', 'Austin, TX', 'jane@example.com', 'Beautiful vintage acoustic guitar with amazing sound'),
  ('Mountain Bike', 750.00, 'Sports', 'Denver, CO', 'mike@example.com', 'High-quality mountain bike perfect for trails'),
  ('MacBook Air M2', 1199.99, 'Electronics', 'Seattle, WA', 'sarah@example.com', 'Brand new MacBook Air with M2 chip'),
  ('Leather Sofa', 800.00, 'Furniture', 'Chicago, IL', 'david@example.com', 'Comfortable leather sofa in great condition')
) AS sample_data(title, price, category, location, seller_email, description)
WHERE NOT EXISTS (SELECT 1 FROM listings);

-- Update existing listings with mock Stripe account IDs for testing
UPDATE listings 
SET 
  seller_stripe_account_id = 'acct_test_' || substr(md5(random()::text), 1, 10),
  description = COALESCE(description, 'Great item in excellent condition!')
WHERE seller_stripe_account_id IS NULL;

-- Insert sample connected account for testing
INSERT INTO connected_accounts (stripe_account_id, account_type, charges_enabled, payouts_enabled, details_submitted)
SELECT 'acct_test_1234567890', 'express', true, true, true
WHERE NOT EXISTS (SELECT 1 FROM connected_accounts WHERE stripe_account_id = 'acct_test_1234567890');

-- =============================================================================
-- 10. VERIFICATION AND SUMMARY
-- =============================================================================

-- Display setup summary
DO $$
DECLARE
  listings_count INTEGER;
  messages_count INTEGER;
  accounts_count INTEGER;
  charges_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO listings_count FROM listings;
  SELECT COUNT(*) INTO messages_count FROM messages;
  SELECT COUNT(*) INTO accounts_count FROM connected_accounts;
  SELECT COUNT(*) INTO charges_count FROM direct_charges;
  
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'MARKETPLACE SETUP COMPLETE!';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Tables created and configured:';
  RAISE NOTICE '- listings: % records', listings_count;
  RAISE NOTICE '- messages: % records', messages_count;
  RAISE NOTICE '- connected_accounts: % records', accounts_count;
  RAISE NOTICE '- direct_charges: % records', charges_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Features configured:';
  RAISE NOTICE '✓ Row Level Security policies';
  RAISE NOTICE '✓ Performance indexes';
  RAISE NOTICE '✓ Stripe Connect integration';
  RAISE NOTICE '✓ Analytics views';
  RAISE NOTICE '✓ Helper functions';
  RAISE NOTICE '✓ Auto-update triggers';
  RAISE NOTICE '';
  RAISE NOTICE 'Your marketplace is ready to use!';
  RAISE NOTICE '=============================================================================';
END $$;

-- Final verification query
SELECT 
  'listings' as table_name,
  COUNT(*) as total_records,
  COUNT(seller_stripe_account_id) as with_stripe_account
FROM listings
UNION ALL
SELECT 
  'messages' as table_name,
  COUNT(*) as total_records,
  0 as with_stripe_account
FROM messages
UNION ALL
SELECT 
  'connected_accounts' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN charges_enabled THEN 1 END) as charges_enabled_count
FROM connected_accounts
UNION ALL
SELECT 
  'direct_charges' as table_name,
  COUNT(*) as total_records,
  0 as with_stripe_account
FROM direct_charges;
