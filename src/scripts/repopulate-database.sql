-- Comprehensive database repopulation script for Stripe integration
-- This script creates sample data and synchronizes with Stripe transactions

BEGIN;

-- 1. Create sample users and connected accounts
INSERT INTO connected_accounts (user_id, stripe_account_id, account_type, charges_enabled, payouts_enabled, details_submitted)
VALUES 
  (gen_random_uuid(), 'acct_1234567890abcdef', 'express', true, true, true),
  (gen_random_uuid(), 'acct_0987654321fedcba', 'express', true, false, true),
  (gen_random_uuid(), 'acct_test_sample1', 'express', true, true, true),
  (gen_random_uuid(), 'acct_test_sample2', 'express', true, true, true)
ON CONFLICT (stripe_account_id) DO UPDATE SET
  charges_enabled = EXCLUDED.charges_enabled,
  payouts_enabled = EXCLUDED.payouts_enabled,
  details_submitted = EXCLUDED.details_submitted,
  updated_at = NOW();

-- 2. Create sample listings with Stripe account references
INSERT INTO listings (title, description, price, category, seller_email, seller_stripe_account_id, location, image_url)
VALUES 
  ('iPhone 14 Pro Max', 'Brand new iPhone 14 Pro Max in Space Black. Unlocked and ready to use with all accessories included.', 1199.00, 'Electronics', 'seller1@example.com', 'acct_1234567890abcdef', 'San Francisco, CA', '/api/placeholder/400/300'),
  ('MacBook Pro M2', 'Barely used MacBook Pro with M2 chip, 16GB RAM, 512GB SSD. Perfect for developers and creators.', 2299.00, 'Electronics', 'seller2@example.com', 'acct_0987654321fedcba', 'Palo Alto, CA', '/api/placeholder/400/300'),
  ('Sony WH-1000XM4', 'Excellent noise-canceling headphones in pristine condition. Comes with original case and cables.', 299.00, 'Electronics', 'seller3@example.com', 'acct_test_sample1', 'Mountain View, CA', '/api/placeholder/400/300'),
  ('Gaming Chair', 'Ergonomic gaming chair with lumbar support. Hardly used, very comfortable for long sessions.', 399.00, 'Furniture', 'seller4@example.com', 'acct_test_sample2', 'San Jose, CA', '/api/placeholder/400/300'),
  ('Canon EOS R5', 'Professional mirrorless camera with 45MP sensor. Includes 24-70mm lens and extra batteries.', 3599.00, 'Electronics', 'seller1@example.com', 'acct_1234567890abcdef', 'San Francisco, CA', '/api/placeholder/400/300'),
  ('Vintage Leather Jacket', 'Authentic vintage leather jacket from the 80s. Size M, excellent condition.', 189.00, 'Clothing', 'seller2@example.com', 'acct_0987654321fedcba', 'Berkeley, CA', '/api/placeholder/400/300'),
  ('Road Bike', 'Carbon fiber road bike, 54cm frame. Recently serviced with new tires and chain.', 1799.00, 'Sports', 'seller3@example.com', 'acct_test_sample1', 'Oakland, CA', '/api/placeholder/400/300'),
  ('Smart Watch', 'Apple Watch Series 8 with GPS and cellular. Includes multiple bands and charger.', 449.00, 'Electronics', 'seller4@example.com', 'acct_test_sample2', 'Fremont, CA', '/api/placeholder/400/300')
ON CONFLICT (title, seller_email) DO UPDATE SET
  seller_stripe_account_id = EXCLUDED.seller_stripe_account_id,
  description = EXCLUDED.description,
  updated_at = NOW();

-- 3. Create sample transaction records
INSERT INTO direct_charges (
  connected_account_id, 
  amount, 
  application_fee_amount, 
  currency,
  description, 
  status, 
  payment_intent_id,
  checkout_session_id,
  metadata
)
VALUES 
  ('acct_1234567890abcdef', 119900, 3597, 'usd', 'iPhone 14 Pro Max purchase', 'succeeded', 'pi_1234567890abcdef', 'cs_test_1234567890abcdef', '{"post_id": "listing_1", "product_name": "iPhone 14 Pro Max", "buyer_email": "buyer1@example.com"}'),
  ('acct_test_sample1', 29900, 897, 'usd', 'Sony WH-1000XM4 purchase', 'succeeded', 'pi_test_1234567890', 'cs_test_0987654321', '{"post_id": "listing_3", "product_name": "Sony WH-1000XM4", "buyer_email": "buyer2@example.com"}'),
  ('acct_1234567890abcdef', 359900, 10797, 'usd', 'Canon EOS R5 purchase', 'pending', 'pi_5678901234abcdef', 'cs_test_5678901234', '{"post_id": "listing_5", "product_name": "Canon EOS R5", "buyer_email": "buyer3@example.com"}'),
  ('acct_test_sample2', 44900, 1347, 'usd', 'Smart Watch purchase', 'succeeded', 'pi_test_5678901234', 'cs_test_1357908642', '{"post_id": "listing_8", "product_name": "Smart Watch", "buyer_email": "buyer4@example.com"}')
ON CONFLICT (checkout_session_id) DO UPDATE SET
  status = EXCLUDED.status,
  updated_at = NOW();

-- 4. Create sample messages for buyer-seller communication
INSERT INTO messages (listing_id, buyer_email, seller_email, message)
SELECT 
  l.id,
  'buyer1@example.com',
  l.seller_email,
  'Hi, is this item still available? I''m very interested in purchasing it.'
FROM listings l
WHERE l.title IN ('iPhone 14 Pro Max', 'MacBook Pro M2')
UNION ALL
SELECT 
  l.id,
  'buyer2@example.com',
  l.seller_email,
  'What''s the condition of this item? Any scratches or damage?'
FROM listings l
WHERE l.title IN ('Sony WH-1000XM4', 'Gaming Chair')
UNION ALL
SELECT 
  l.id,
  l.seller_email,
  'buyer1@example.com',
  'Yes, it''s still available! The item is in excellent condition. Would you like to schedule a viewing?'
FROM listings l
WHERE l.title = 'iPhone 14 Pro Max';

-- 5. Update listing statuses based on transactions
UPDATE listings 
SET status = 'sold', sold_at = NOW() - INTERVAL '2 days'
WHERE title IN ('iPhone 14 Pro Max', 'Sony WH-1000XM4', 'Smart Watch');

UPDATE listings 
SET status = 'pending'
WHERE title = 'Canon EOS R5';

-- 6. Create analytics views for reporting
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

-- 7. Create seller performance view
CREATE OR REPLACE VIEW seller_performance AS
SELECT 
  ca.stripe_account_id,
  COUNT(l.id) as total_listings,
  COUNT(CASE WHEN l.status = 'sold' THEN 1 END) as sold_listings,
  SUM(CASE WHEN l.status = 'sold' THEN l.price ELSE 0 END) as total_sales,
  SUM(dc.amount)/100.0 as stripe_volume,
  SUM(dc.application_fee_amount)/100.0 as platform_fees_paid,
  ROUND(
    (COUNT(CASE WHEN l.status = 'sold' THEN 1 END)::decimal / NULLIF(COUNT(l.id), 0)) * 100, 
    2
  ) as conversion_rate
FROM connected_accounts ca
LEFT JOIN listings l ON ca.stripe_account_id = l.seller_stripe_account_id
LEFT JOIN direct_charges dc ON ca.stripe_account_id = dc.connected_account_id
GROUP BY ca.stripe_account_id;

-- 8. Create category performance view
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

-- 9. Grant permissions for new views
GRANT SELECT ON marketplace_analytics TO authenticated, anon;
GRANT SELECT ON seller_performance TO authenticated, anon;
GRANT SELECT ON category_performance TO authenticated, anon;

-- 10. Create a function to get transaction summary
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
      (COUNT(CASE WHEN dc.status = 'succeeded' THEN 1 END)::NUMERIC / COUNT(*)) * 100, 
      2
    ) as successful_rate
  FROM direct_charges dc
  WHERE dc.created_at >= NOW() - (days_back || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- 11. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_direct_charges_created_at ON direct_charges(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_charges_status ON direct_charges(status);
CREATE INDEX IF NOT EXISTS idx_listings_status_category ON listings(status, category);
CREATE INDEX IF NOT EXISTS idx_listings_seller_stripe_account ON listings(seller_stripe_account_id);

-- 12. Verify data integrity
DO $$
DECLARE
    listing_count INTEGER;
    charge_count INTEGER;
    account_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO listing_count FROM listings;
    SELECT COUNT(*) INTO charge_count FROM direct_charges;
    SELECT COUNT(*) INTO account_count FROM connected_accounts;
    
    RAISE NOTICE 'Database repopulation completed successfully:';
    RAISE NOTICE '- Listings created: %', listing_count;
    RAISE NOTICE '- Charges recorded: %', charge_count;
    RAISE NOTICE '- Connected accounts: %', account_count;
END $$;

-- 13. Final verification query
SELECT 
  'Data Repopulation' as component,
  'Complete' as status,
  jsonb_build_object(
    'listings', (SELECT COUNT(*) FROM listings),
    'charges', (SELECT COUNT(*) FROM direct_charges),
    'connected_accounts', (SELECT COUNT(*) FROM connected_accounts),
    'total_volume_usd', (SELECT SUM(amount)/100.0 FROM direct_charges),
    'platform_fees_usd', (SELECT SUM(application_fee_amount)/100.0 FROM direct_charges)
  ) as summary;

COMMIT;
