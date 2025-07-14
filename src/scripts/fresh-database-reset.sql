-- =====================================================
-- COMPLETE FRESH DATABASE RESET WITH STRIPE INTEGRATION
-- =====================================================
-- This script completely resets the database and sets up everything fresh
-- including Stripe Connect and Stripe Wrapper integration

-- ====================================
-- STEP 1: CLEAN SLATE - DROP EVERYTHING
-- ====================================

-- Drop all custom views first
DROP VIEW IF EXISTS marketplace_transactions CASCADE;
DROP VIEW IF EXISTS marketplace_analytics CASCADE;
DROP VIEW IF EXISTS seller_performance CASCADE;
DROP VIEW IF EXISTS category_performance CASCADE;

-- Drop materialized views
DROP MATERIALIZED VIEW IF EXISTS stripe_charges_summary CASCADE;

-- Drop all custom tables
DROP TABLE IF EXISTS direct_charges CASCADE;
DROP TABLE IF EXISTS connected_accounts CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS listings CASCADE;

-- Drop custom functions
DROP FUNCTION IF EXISTS sync_stripe_charges() CASCADE;
DROP FUNCTION IF EXISTS get_transaction_summary(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_listing_status_on_purchase() CASCADE;
DROP FUNCTION IF EXISTS get_stripe_charge_details(TEXT) CASCADE;

-- Drop Stripe Wrapper components (if they exist)
DROP SCHEMA IF EXISTS stripe CASCADE;
DROP SERVER IF EXISTS stripe_server CASCADE;
DROP FOREIGN DATA WRAPPER IF EXISTS stripe_wrapper CASCADE;

-- Drop storage policies
DROP POLICY IF EXISTS "Anyone can upload listing images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view listing images" ON storage.objects;

-- Clean storage objects first (to avoid foreign key constraint)
DELETE FROM storage.objects WHERE bucket_id = 'listing-images';

-- Then clean storage bucket
DELETE FROM storage.buckets WHERE id = 'listing-images';

-- ====================================
-- STEP 2: ENABLE EXTENSIONS
-- ====================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS wrappers WITH SCHEMA extensions;

-- ====================================
-- STEP 3: RECREATE STORAGE
-- ====================================

-- Recreate storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('listing-images', 'listing-images', true);

-- ====================================
-- STEP 4: CREATE CORE TABLES
-- ====================================

-- Main listings table with Stripe Connect support
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  seller_email VARCHAR(255) NOT NULL,
  seller_stripe_account_id TEXT, -- Stripe Connect account ID
  image_url TEXT,
  location VARCHAR(255) DEFAULT 'Palo Alto, CA',
  status VARCHAR(50) DEFAULT 'available', -- 'available', 'sold', 'pending'
  sold_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table for buyer-seller communication
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  buyer_email VARCHAR(255) NOT NULL,
  seller_email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Connected accounts table for Stripe Connect management
CREATE TABLE connected_accounts (
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

-- Direct charges table for tracking Stripe Connect payments
CREATE TABLE direct_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connected_account_id TEXT NOT NULL,
  amount INTEGER NOT NULL, -- Amount in cents
  application_fee_amount INTEGER,
  currency TEXT DEFAULT 'usd',
  description TEXT,
  metadata JSONB,
  status TEXT DEFAULT 'pending', -- 'pending', 'succeeded', 'failed'
  payment_intent_id TEXT,
  checkout_session_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================
-- STEP 5: CREATE INDEXES
-- ====================================

-- Listings indexes
CREATE INDEX idx_listings_category ON listings(category);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_seller_email ON listings(seller_email);
CREATE INDEX idx_listings_seller_stripe_account_id ON listings(seller_stripe_account_id);
CREATE INDEX idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX idx_listings_status_category ON listings(status, category);

-- Messages indexes
CREATE INDEX idx_messages_listing_id ON messages(listing_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Connected accounts indexes
CREATE INDEX idx_connected_accounts_stripe_account_id ON connected_accounts(stripe_account_id);
CREATE INDEX idx_connected_accounts_user_id ON connected_accounts(user_id);

-- Direct charges indexes
CREATE INDEX idx_direct_charges_connected_account_id ON direct_charges(connected_account_id);
CREATE INDEX idx_direct_charges_checkout_session_id ON direct_charges(checkout_session_id);
CREATE INDEX idx_direct_charges_payment_intent_id ON direct_charges(payment_intent_id);
CREATE INDEX idx_direct_charges_created_at ON direct_charges(created_at DESC);
CREATE INDEX idx_direct_charges_status ON direct_charges(status);

-- ====================================
-- STEP 6: ENABLE ROW LEVEL SECURITY
-- ====================================

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_charges ENABLE ROW LEVEL SECURITY;

-- ====================================
-- STEP 7: CREATE RLS POLICIES
-- ====================================

-- Service role policies (for API access)
CREATE POLICY "Service role can access all listings" ON listings
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can access all messages" ON messages
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can access all connected accounts" ON connected_accounts
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can access all direct charges" ON direct_charges
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Public access policies
CREATE POLICY "Anyone can view listings" ON listings
FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can create listings" ON listings
FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Users can update their own listings" ON listings
FOR UPDATE TO public USING (seller_email = current_setting('request.jwt.claims', true)::json->>'email')
WITH CHECK (seller_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Anyone can view messages" ON messages
FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can create messages" ON messages
FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Anyone can view connected accounts" ON connected_accounts
FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can view direct charges" ON direct_charges
FOR SELECT TO public USING (true);

-- ====================================
-- STEP 8: CREATE STORAGE POLICIES
-- ====================================

CREATE POLICY "Anyone can upload listing images" ON storage.objects 
FOR INSERT TO public WITH CHECK (bucket_id = 'listing-images');

CREATE POLICY "Anyone can view listing images" ON storage.objects 
FOR SELECT TO public USING (bucket_id = 'listing-images');

-- ====================================
-- STEP 9: CREATE FUNCTIONS AND TRIGGERS
-- ====================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_listings_updated_at 
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connected_accounts_updated_at 
  BEFORE UPDATE ON connected_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_direct_charges_updated_at 
  BEFORE UPDATE ON direct_charges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- STEP 10: SETUP STRIPE WRAPPER
-- ====================================

-- Create Stripe Wrapper FDW
CREATE FOREIGN DATA WRAPPER stripe_wrapper
  HANDLER stripe_fdw_handler
  VALIDATOR stripe_fdw_validator;

-- Create server (you'll need to replace with your actual Stripe key)
-- Option A: Using environment variable (recommended for production)
-- CREATE SERVER stripe_server
--   FOREIGN DATA WRAPPER stripe_wrapper
--   OPTIONS (
--     api_key_name 'stripe_key',
--     api_url 'https://api.stripe.com/v1/',
--     api_version '2024-06-20'
--   );

-- Option B: Direct key (for development - replace with your key)
-- CREATE SERVER stripe_server
--   FOREIGN DATA WRAPPER stripe_wrapper
--   OPTIONS (
--     api_key 'sk_test_your_stripe_secret_key_here',
--     api_url 'https://api.stripe.com/v1/',
--     api_version '2024-06-20'
--   );

-- Create schema for Stripe foreign tables
CREATE SCHEMA IF NOT EXISTS stripe;

-- Note: Uncomment the server creation above with your Stripe key before running these
-- Import key Stripe foreign tables
-- IMPORT FOREIGN SCHEMA stripe 
--   LIMIT TO ("charges", "checkout_sessions", "payment_intents", "accounts")
--   FROM SERVER stripe_server 
--   INTO stripe;

-- Grant permissions on stripe schema
GRANT USAGE ON SCHEMA stripe TO authenticated, anon;
-- GRANT SELECT ON ALL TABLES IN SCHEMA stripe TO authenticated, anon;

-- ====================================
-- STEP 11: CREATE ANALYTICS VIEWS
-- ====================================

-- Create analytics views
CREATE OR REPLACE VIEW marketplace_analytics AS
SELECT 
  DATE_TRUNC('day', dc.created_at) as transaction_date,
  COUNT(*) as total_transactions,
  SUM(dc.amount) as total_volume,
  SUM(dc.application_fee_amount) as total_fees,
  AVG(dc.amount) as avg_transaction_amount,
  COUNT(CASE WHEN dc.status = 'succeeded' THEN 1 END) as successful_transactions,
  COUNT(CASE WHEN dc.status = 'pending' THEN 1 END) as pending_transactions
FROM direct_charges dc
GROUP BY DATE_TRUNC('day', dc.created_at)
ORDER BY transaction_date DESC;

-- Seller performance view
CREATE OR REPLACE VIEW seller_performance AS
SELECT 
  ca.stripe_account_id,
  COUNT(l.id) as total_listings,
  COUNT(CASE WHEN l.status = 'sold' THEN 1 END) as sold_listings,
  SUM(CASE WHEN l.status = 'sold' THEN l.price ELSE 0 END) as total_sales,
  COALESCE(SUM(dc.amount)/100.0, 0) as stripe_volume,
  COALESCE(SUM(dc.application_fee_amount)/100.0, 0) as platform_fees_paid,
  ROUND(
    (COUNT(CASE WHEN l.status = 'sold' THEN 1 END)::decimal / NULLIF(COUNT(l.id), 0)) * 100, 
    2
  ) as conversion_rate
FROM connected_accounts ca
LEFT JOIN listings l ON ca.stripe_account_id = l.seller_stripe_account_id
LEFT JOIN direct_charges dc ON ca.stripe_account_id = dc.connected_account_id AND dc.status = 'succeeded'
GROUP BY ca.stripe_account_id;

-- Category performance view
CREATE OR REPLACE VIEW category_performance AS
SELECT 
  l.category,
  COUNT(*) as total_listings,
  COUNT(CASE WHEN l.status = 'sold' THEN 1 END) as sold_count,
  AVG(l.price) as avg_price,
  SUM(CASE WHEN l.status = 'sold' THEN l.price ELSE 0 END) as total_revenue,
  ROUND(
    (COUNT(CASE WHEN l.status = 'sold' THEN 1 END)::decimal / COUNT(*)) * 100, 
    2
  ) as category_conversion_rate
FROM listings l
GROUP BY l.category
ORDER BY total_revenue DESC;

-- Combined marketplace transactions view
CREATE OR REPLACE VIEW marketplace_transactions AS
SELECT 
  dc.id as local_id,
  dc.checkout_session_id,
  dc.connected_account_id,
  dc.amount,
  dc.currency,
  dc.description,
  dc.status as local_status,
  dc.created_at as local_created_at,
  dc.payment_intent_id,
  (dc.metadata->>'post_id') as listing_id,
  (dc.metadata->>'product_name') as product_name,
  (dc.metadata->>'buyer_email') as buyer_email
FROM direct_charges dc
ORDER BY dc.created_at DESC;

-- Grant permissions on views
GRANT SELECT ON marketplace_analytics TO authenticated, anon;
GRANT SELECT ON seller_performance TO authenticated, anon;
GRANT SELECT ON category_performance TO authenticated, anon;
GRANT SELECT ON marketplace_transactions TO authenticated, anon;

-- ====================================
-- STEP 12: CREATE UTILITY FUNCTIONS
-- ====================================

-- Function to get transaction summary
CREATE OR REPLACE FUNCTION get_transaction_summary(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  period TEXT,
  transaction_count BIGINT,
  total_volume NUMERIC,
  platform_fees NUMERIC,
  successful_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Last ' || days_back || ' days' as period,
    COUNT(*)::BIGINT as transaction_count,
    (SUM(dc.amount)/100.0)::NUMERIC as total_volume,
    (SUM(dc.application_fee_amount)/100.0)::NUMERIC as platform_fees,
    ROUND(
      (COUNT(CASE WHEN dc.status = 'succeeded' THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 
      2
    ) as successful_rate
  FROM direct_charges dc
  WHERE dc.created_at >= NOW() - (days_back || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Function to sync Stripe charges (placeholder for when Stripe Wrapper is connected)
CREATE OR REPLACE FUNCTION sync_stripe_charges()
RETURNS VOID AS $$
BEGIN
  -- This function will sync data from Stripe when the wrapper is properly configured
  -- For now, it's a placeholder
  RAISE NOTICE 'Stripe sync function called - configure Stripe Wrapper first';
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- STEP 13: POPULATE WITH SAMPLE DATA
-- ====================================

-- Insert sample connected accounts
INSERT INTO connected_accounts (stripe_account_id, account_type, charges_enabled, payouts_enabled, details_submitted)
VALUES 
  ('acct_1234567890abcdef', 'express', true, true, true),
  ('acct_0987654321fedcba', 'express', true, false, true),
  ('acct_test_sample1', 'express', true, true, true),
  ('acct_test_sample2', 'express', true, true, true),
  ('acct_test_sample3', 'express', true, true, true),
  ('acct_test_sample4', 'express', true, true, true);

-- Insert sample listings with diverse categories and real Stripe account references
INSERT INTO listings (title, description, price, category, seller_email, seller_stripe_account_id, location, image_url)
VALUES 
  ('iPhone 14 Pro Max 256GB', 'Brand new iPhone 14 Pro Max in Space Black. Unlocked and ready to use with all accessories included. Perfect condition, never dropped.', 1199.00, 'Electronics', 'seller1@example.com', 'acct_1234567890abcdef', 'San Francisco, CA', 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&h=500&fit=crop'),
  
  ('MacBook Pro M2 16"', 'Barely used MacBook Pro with M2 chip, 16GB RAM, 512GB SSD. Perfect for developers and creators. Includes original box and charger.', 2299.00, 'Electronics', 'seller2@example.com', 'acct_0987654321fedcba', 'Palo Alto, CA', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop'),
  
  ('Sony WH-1000XM4 Headphones', 'Excellent noise-canceling headphones in pristine condition. Comes with original case, cables, and all accessories. Amazing sound quality.', 299.00, 'Electronics', 'seller3@example.com', 'acct_test_sample1', 'Mountain View, CA', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop'),
  
  ('Herman Miller Gaming Chair', 'Ergonomic Herman Miller gaming chair with lumbar support. Hardly used, very comfortable for long work sessions. Retail $800.', 450.00, 'Furniture', 'seller4@example.com', 'acct_test_sample2', 'San Jose, CA', 'https://images.unsplash.com/photo-1541558869434-2840d308329a?w=500&h=500&fit=crop'),
  
  ('Canon EOS R5 Camera Kit', 'Professional mirrorless camera with 45MP sensor. Includes 24-70mm lens, extra batteries, memory cards, and camera bag.', 3599.00, 'Electronics', 'seller1@example.com', 'acct_1234567890abcdef', 'San Francisco, CA', 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500&h=500&fit=crop'),
  
  ('Vintage Leather Jacket', 'Authentic vintage leather jacket from the 80s. Size M, excellent condition. Classic style that never goes out of fashion.', 189.00, 'Clothing', 'seller2@example.com', 'acct_0987654321fedcba', 'Berkeley, CA', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=500&fit=crop'),
  
  ('Trek Carbon Road Bike', 'High-end carbon fiber road bike, 54cm frame. Recently serviced with new tires and chain. Perfect for long distance rides.', 1799.00, 'Sports', 'seller3@example.com', 'acct_test_sample1', 'Oakland, CA', 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500&h=500&fit=crop'),
  
  ('Apple Watch Series 8', 'Apple Watch Series 8 with GPS and cellular. Includes multiple bands, charger, and original box. Excellent condition.', 449.00, 'Electronics', 'seller4@example.com', 'acct_test_sample2', 'Fremont, CA', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop'),
  
  ('Mid-Century Dining Table', 'Beautiful mid-century modern dining table with 6 chairs. Solid walnut wood, excellent craftsmanship. Perfect for family dinners.', 850.00, 'Furniture', 'seller1@example.com', 'acct_test_sample3', 'Redwood City, CA', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=500&fit=crop'),
  
  ('PlayStation 5 Bundle', 'PlayStation 5 console with extra DualSense controller and 3 popular games: Spider-Man, God of War, and Horizon.', 650.00, 'Electronics', 'seller2@example.com', 'acct_test_sample4', 'Sunnyvale, CA', 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500&h=500&fit=crop'),
  
  ('Fender Stratocaster Guitar', 'Classic Fender Stratocaster electric guitar in sunburst finish. Includes amp, case, cables, and picks. Great for beginners and pros.', 1200.00, 'Musical Instruments', 'seller3@example.com', 'acct_test_sample1', 'Santa Clara, CA', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=500&fit=crop'),
  
  ('Vintage Rolex Submariner', 'Rare vintage Rolex Submariner from 1980s. Excellent condition with papers. A true collector''s piece with investment potential.', 8500.00, 'Accessories', 'seller4@example.com', 'acct_test_sample2', 'Los Altos, CA', 'https://images.unsplash.com/photo-1523170335258-f5c6c6bd6eaf?w=500&h=500&fit=crop');

-- Insert sample transaction records
INSERT INTO direct_charges (
  connected_account_id, 
  amount, 
  application_fee_amount, 
  currency,
  description, 
  status, 
  payment_intent_id,
  checkout_session_id,
  metadata,
  created_at
)
VALUES 
  ('acct_1234567890abcdef', 119900, 3597, 'usd', 'iPhone 14 Pro Max purchase', 'succeeded', 'pi_1234567890abcdef', 'cs_test_1234567890abcdef', '{"post_id": "listing_1", "product_name": "iPhone 14 Pro Max", "buyer_email": "buyer1@example.com"}', NOW() - INTERVAL '2 days'),
  
  ('acct_test_sample1', 29900, 897, 'usd', 'Sony WH-1000XM4 purchase', 'succeeded', 'pi_test_1234567890', 'cs_test_0987654321', '{"post_id": "listing_3", "product_name": "Sony WH-1000XM4", "buyer_email": "buyer2@example.com"}', NOW() - INTERVAL '1 day'),
  
  ('acct_test_sample2', 44900, 1347, 'usd', 'Apple Watch purchase', 'succeeded', 'pi_test_5678901234', 'cs_test_1357908642', '{"post_id": "listing_8", "product_name": "Apple Watch Series 8", "buyer_email": "buyer3@example.com"}', NOW() - INTERVAL '3 hours'),
  
  ('acct_1234567890abcdef', 359900, 10797, 'usd', 'Canon EOS R5 purchase', 'pending', 'pi_5678901234abcdef', 'cs_test_5678901234', '{"post_id": "listing_5", "product_name": "Canon EOS R5", "buyer_email": "buyer4@example.com"}', NOW() - INTERVAL '1 hour');

-- Update listing statuses based on successful transactions
UPDATE listings 
SET status = 'sold', sold_at = NOW() - INTERVAL '2 days'
WHERE title = 'iPhone 14 Pro Max 256GB';

UPDATE listings 
SET status = 'sold', sold_at = NOW() - INTERVAL '1 day'
WHERE title = 'Sony WH-1000XM4 Headphones';

UPDATE listings 
SET status = 'sold', sold_at = NOW() - INTERVAL '3 hours'
WHERE title = 'Apple Watch Series 8';

UPDATE listings 
SET status = 'pending'
WHERE title = 'Canon EOS R5 Camera Kit';

-- Insert sample messages for buyer-seller communication
INSERT INTO messages (listing_id, buyer_email, seller_email, message)
SELECT 
  l.id,
  'buyer1@example.com',
  l.seller_email,
  'Hi! Is this item still available? I''m very interested in purchasing it and can meet today.'
FROM listings l
WHERE l.title IN ('MacBook Pro M2 16"', 'Trek Carbon Road Bike')

UNION ALL

SELECT 
  l.id,
  'buyer2@example.com',
  l.seller_email,
  'What''s the exact condition of this item? Any scratches, dents, or other damage I should know about?'
FROM listings l
WHERE l.title IN ('Herman Miller Gaming Chair', 'PlayStation 5 Bundle')

UNION ALL

SELECT 
  l.id,
  l.seller_email,
  'buyer1@example.com',
  'Yes, it''s still available! The item is in excellent condition. Would you like to schedule a viewing or video call?'
FROM listings l
WHERE l.title = 'MacBook Pro M2 16"';

-- ====================================
-- STEP 14: FINAL VERIFICATION
-- ====================================

-- Verification queries
DO $$
DECLARE
    listing_count INTEGER;
    charge_count INTEGER;
    account_count INTEGER;
    message_count INTEGER;
    view_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO listing_count FROM listings;
    SELECT COUNT(*) INTO charge_count FROM direct_charges;
    SELECT COUNT(*) INTO account_count FROM connected_accounts;
    SELECT COUNT(*) INTO message_count FROM messages;
    SELECT COUNT(*) INTO view_count FROM information_schema.views WHERE table_schema = 'public';
    
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'FRESH DATABASE SETUP COMPLETED SUCCESSFULLY! 🎉';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Tables created and populated:';
    RAISE NOTICE '- Listings: % items', listing_count;
    RAISE NOTICE '- Connected Accounts: % accounts', account_count;
    RAISE NOTICE '- Direct Charges: % transactions', charge_count;
    RAISE NOTICE '- Messages: % messages', message_count;
    RAISE NOTICE '- Analytics Views: % views', view_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Configure your Stripe secret key in the server setup';
    RAISE NOTICE '2. Uncomment and run the Stripe Wrapper setup sections';
    RAISE NOTICE '3. Test your application at http://localhost:3000';
    RAISE NOTICE '4. Visit /analytics to see the dashboard';
    RAISE NOTICE '5. Visit /profile to test Stripe Connect';
    RAISE NOTICE '===========================================';
END $$;

-- Summary query for verification
SELECT 
  'Fresh Database Setup' as component,
  'Complete' as status,
  jsonb_build_object(
    'listings', (SELECT COUNT(*) FROM listings),
    'connected_accounts', (SELECT COUNT(*) FROM connected_accounts),
    'direct_charges', (SELECT COUNT(*) FROM direct_charges),
    'messages', (SELECT COUNT(*) FROM messages),
    'total_volume_usd', COALESCE((SELECT SUM(amount)/100.0 FROM direct_charges WHERE status = 'succeeded'), 0),
    'platform_fees_usd', COALESCE((SELECT SUM(application_fee_amount)/100.0 FROM direct_charges WHERE status = 'succeeded'), 0),
    'sold_items', (SELECT COUNT(*) FROM listings WHERE status = 'sold'),
    'available_items', (SELECT COUNT(*) FROM listings WHERE status = 'available')
  ) as summary;

-- Show sample data
SELECT 'Sample Listings Created:' as info;
SELECT title, price, category, status, seller_stripe_account_id FROM listings ORDER BY created_at DESC LIMIT 5;

SELECT 'Sample Transactions Created:' as info;
SELECT description, amount/100.0 as amount_usd, status, created_at FROM direct_charges ORDER BY created_at DESC;
