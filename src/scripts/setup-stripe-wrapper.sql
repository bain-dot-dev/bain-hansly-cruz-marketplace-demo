-- Setup Stripe Wrapper for marketplace demo
-- This script sets up the Stripe Wrapper to sync transaction data from Stripe to our database

-- 1. Enable the wrappers extension
CREATE EXTENSION IF NOT EXISTS wrappers WITH SCHEMA extensions;

-- 2. Enable the Stripe Wrapper FDW
CREATE FOREIGN DATA WRAPPER stripe_wrapper
  HANDLER stripe_fdw_handler
  VALIDATOR stripe_fdw_validator;

-- 3. Store Stripe credentials in Vault (recommended for security)
-- Replace '<your_stripe_secret_key>' with your actual Stripe secret key
-- SELECT vault.create_secret(
--   '<your_stripe_secret_key>',
--   'stripe_key',
--   'Stripe API key for Wrappers'
-- );

-- 4. Create Stripe server connection
-- Option A: Using Vault (recommended)
-- CREATE SERVER stripe_server
--   FOREIGN DATA WRAPPER stripe_wrapper
--   OPTIONS (
--     api_key_name 'stripe_key',
--     api_url 'https://api.stripe.com/v1/',
--     api_version '2024-06-20'
--   );

-- Option B: Without Vault (for development only)
-- Replace '<your_stripe_secret_key>' with your actual Stripe secret key
CREATE SERVER stripe_server
  FOREIGN DATA WRAPPER stripe_wrapper
  OPTIONS (
    api_key '<your_stripe_secret_key>',
    api_url 'https://api.stripe.com/v1/',
    api_version '2024-06-20'
  );

-- 5. Create a schema for Stripe foreign tables
CREATE SCHEMA IF NOT EXISTS stripe;

-- 6. Create foreign tables for key Stripe entities
-- Import all foreign tables from Stripe
IMPORT FOREIGN SCHEMA stripe 
  LIMIT TO ("charges", "checkout_sessions", "payment_intents", "customers", "balance_transactions")
  FROM SERVER stripe_server 
  INTO stripe;

-- 7. Alternative: Manual foreign table creation for better control
-- Charges table for transaction data
CREATE FOREIGN TABLE IF NOT EXISTS stripe.charges (
  id TEXT,
  amount BIGINT,
  currency TEXT,
  customer TEXT,
  description TEXT,
  invoice TEXT,
  payment_intent TEXT,
  status TEXT,
  created TIMESTAMP,
  attrs JSONB
) SERVER stripe_server
OPTIONS (
  object 'charges'
);

-- Checkout Sessions table for session tracking
CREATE FOREIGN TABLE IF NOT EXISTS stripe.checkout_sessions (
  id TEXT,
  customer TEXT,
  payment_intent TEXT,
  subscription TEXT,
  attrs JSONB
) SERVER stripe_server
OPTIONS (
  object 'checkout/sessions',
  rowid_column 'id'
);

-- Payment Intents table for payment tracking
CREATE FOREIGN TABLE IF NOT EXISTS stripe.payment_intents (
  id TEXT,
  customer TEXT,
  amount BIGINT,
  currency TEXT,
  payment_method TEXT,
  created TIMESTAMP,
  attrs JSONB
) SERVER stripe_server
OPTIONS (
  object 'payment_intents'
);

-- Connected accounts table for Stripe Connect
CREATE FOREIGN TABLE IF NOT EXISTS stripe.accounts (
  id TEXT,
  business_type TEXT,
  country TEXT,
  email TEXT,
  type TEXT,
  created TIMESTAMP,
  attrs JSONB
) SERVER stripe_server
OPTIONS (
  object 'accounts'
);

-- 8. Create materialized views for better performance
-- Materialized view for recent successful charges
CREATE MATERIALIZED VIEW IF NOT EXISTS stripe_charges_summary AS
SELECT 
  id,
  amount,
  currency,
  customer,
  description,
  payment_intent,
  status,
  created,
  (attrs->>'metadata')::jsonb as metadata
FROM stripe.charges
WHERE status = 'succeeded'
  AND created >= NOW() - INTERVAL '30 days';

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_stripe_charges_summary_created 
ON stripe_charges_summary(created DESC);

-- 9. Create a function to sync Stripe data to local tables
CREATE OR REPLACE FUNCTION sync_stripe_charges()
RETURNS VOID AS $$
BEGIN
  -- Insert new charges into direct_charges table
  INSERT INTO direct_charges (
    connected_account_id,
    amount,
    currency,
    description,
    status,
    payment_intent_id,
    created_at,
    metadata
  )
  SELECT 
    COALESCE((attrs->>'transfer_data'->>'destination')::text, 'direct'),
    amount,
    currency,
    description,
    status,
    payment_intent,
    created,
    (attrs->>'metadata')::jsonb
  FROM stripe.charges 
  WHERE created >= NOW() - INTERVAL '1 day'
    AND status = 'succeeded'
    AND id NOT IN (
      SELECT payment_intent_id 
      FROM direct_charges 
      WHERE payment_intent_id IS NOT NULL
    )
  ON CONFLICT (payment_intent_id) DO NOTHING;
  
  -- Refresh materialized view
  REFRESH MATERIALIZED VIEW stripe_charges_summary;
  
  RAISE NOTICE 'Stripe data sync completed';
END;
$$ LANGUAGE plpgsql;

-- 10. Create a scheduled job to sync data periodically (requires pg_cron extension)
-- SELECT cron.schedule('sync-stripe-data', '*/15 * * * *', 'SELECT sync_stripe_charges();');

-- 11. Grant necessary permissions
GRANT USAGE ON SCHEMA stripe TO authenticated, anon;
GRANT SELECT ON ALL TABLES IN SCHEMA stripe TO authenticated, anon;
GRANT SELECT ON stripe_charges_summary TO authenticated, anon;

-- 12. Create RLS policies for Stripe data access
ALTER TABLE IF EXISTS stripe_charges_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stripe charges summary" ON stripe_charges_summary
FOR SELECT
TO public
USING (true);

-- 13. Create a view to join local and Stripe data
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
  sc.id as stripe_charge_id,
  sc.status as stripe_status,
  sc.created as stripe_created_at,
  sc.customer as stripe_customer_id,
  sc.payment_intent as stripe_payment_intent_id,
  (sc.metadata->>'post_id') as listing_id,
  (sc.metadata->>'product_name') as product_name
FROM direct_charges dc
LEFT JOIN stripe_charges_summary sc ON dc.payment_intent_id = sc.payment_intent
ORDER BY dc.created_at DESC;

-- Grant access to the view
GRANT SELECT ON marketplace_transactions TO authenticated, anon;

-- 14. Create helper functions for common queries
CREATE OR REPLACE FUNCTION get_stripe_charge_details(charge_id TEXT)
RETURNS TABLE(
  id TEXT,
  amount BIGINT,
  currency TEXT,
  status TEXT,
  customer TEXT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.amount,
    c.currency,
    c.status,
    c.customer,
    c.description,
    (c.attrs->>'metadata')::jsonb,
    c.created
  FROM stripe.charges c
  WHERE c.id = charge_id;
END;
$$ LANGUAGE plpgsql;

-- 15. Verify the setup
SELECT 
  'stripe_wrapper_setup' as component,
  'success' as status,
  'Stripe Wrapper configured successfully' as message;

-- List available foreign tables
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'stripe'
UNION ALL
SELECT 
  schemaname,
  viewname as tablename,
  viewowner as tableowner
FROM pg_views 
WHERE schemaname = 'stripe'
ORDER BY tablename;
