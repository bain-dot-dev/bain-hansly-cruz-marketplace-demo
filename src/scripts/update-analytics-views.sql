-- Update analytics views to use the new listing_id field

-- 1. Update marketplace_analytics view
CREATE OR REPLACE VIEW marketplace_analytics AS
SELECT 
  DATE_TRUNC('day', dc.created_at) as transaction_date,
  COUNT(*) as total_transactions,
  SUM(dc.amount) as total_volume,
  SUM(dc.application_fee_amount) as total_fees,
  AVG(dc.amount) as avg_transaction_amount,
  COUNT(CASE WHEN dc.status = 'succeeded' THEN 1 END) as successful_transactions,
  COUNT(CASE WHEN dc.status = 'pending' THEN 1 END) as pending_transactions,
  COUNT(DISTINCT dc.listing_id) as unique_items_sold,
  COUNT(DISTINCT l.category) as categories_with_sales
FROM direct_charges dc
LEFT JOIN listings l ON dc.listing_id = l.id
WHERE dc.status = 'succeeded'
GROUP BY DATE_TRUNC('day', dc.created_at)
ORDER BY transaction_date DESC;

-- 2. Update seller_performance view to include actual sales data
CREATE OR REPLACE VIEW seller_performance AS
SELECT 
  ca.stripe_account_id,
  ca.email as seller_email,
  COUNT(l.id) as total_listings,
  COUNT(CASE WHEN l.status = 'sold' THEN 1 END) as sold_listings,
  SUM(CASE WHEN l.status = 'sold' THEN l.price ELSE 0 END) as total_listing_value,
  COUNT(dc.id) as completed_transactions,
  SUM(CASE WHEN dc.status = 'succeeded' THEN dc.amount ELSE 0 END)/100.0 as actual_revenue,
  SUM(CASE WHEN dc.status = 'succeeded' THEN dc.application_fee_amount ELSE 0 END)/100.0 as platform_fees_paid,
  ROUND(
    (COUNT(CASE WHEN l.status = 'sold' THEN 1 END)::decimal / NULLIF(COUNT(l.id), 0)) * 100, 
    2
  ) as conversion_rate,
  ROUND(
    (COUNT(CASE WHEN dc.status = 'succeeded' THEN 1 END)::decimal / NULLIF(COUNT(dc.id), 0)) * 100,
    2
  ) as payment_success_rate
FROM connected_accounts ca
LEFT JOIN listings l ON ca.stripe_account_id = l.seller_stripe_account_id
LEFT JOIN direct_charges dc ON ca.stripe_account_id = dc.connected_account_id
GROUP BY ca.stripe_account_id, ca.email
ORDER BY actual_revenue DESC;

-- 3. Update category_performance view to include transaction data
CREATE OR REPLACE VIEW category_performance AS
SELECT 
  l.category,
  COUNT(l.id) as total_listings,
  COUNT(CASE WHEN l.status = 'sold' THEN 1 END) as sold_count,
  AVG(l.price) as avg_listing_price,
  SUM(CASE WHEN l.status = 'sold' THEN l.price ELSE 0 END) as total_listing_value,
  COUNT(dc.id) as completed_transactions,
  SUM(CASE WHEN dc.status = 'succeeded' THEN dc.amount ELSE 0 END)/100.0 as actual_revenue,
  SUM(CASE WHEN dc.status = 'succeeded' THEN dc.application_fee_amount ELSE 0 END)/100.0 as platform_fees,
  ROUND(
    (COUNT(CASE WHEN l.status = 'sold' THEN 1 END)::decimal / NULLIF(COUNT(l.id), 0)) * 100, 
    2
  ) as category_conversion_rate,
  ROUND(
    AVG(CASE WHEN dc.status = 'succeeded' THEN dc.amount ELSE NULL END)/100.0,
    2
  ) as avg_transaction_amount
FROM listings l
LEFT JOIN direct_charges dc ON l.id = dc.listing_id
GROUP BY l.category
ORDER BY actual_revenue DESC;

-- 4. Update the transaction summary function
CREATE OR REPLACE FUNCTION get_transaction_summary(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  period TEXT,
  transaction_count BIGINT,
  total_volume NUMERIC,
  platform_fees NUMERIC,
  successful_rate NUMERIC,
  unique_items_sold BIGINT,
  avg_transaction_value NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CONCAT('Last ', days_back, ' days') as period,
    COUNT(*)::BIGINT as transaction_count,
    COALESCE(SUM(dc.amount)/100.0, 0) as total_volume,
    COALESCE(SUM(dc.application_fee_amount)/100.0, 0) as platform_fees,
    ROUND(
      (COUNT(CASE WHEN dc.status = 'succeeded' THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      2
    ) as successful_rate,
    COUNT(DISTINCT dc.listing_id)::BIGINT as unique_items_sold,
    ROUND(
      AVG(CASE WHEN dc.status = 'succeeded' THEN dc.amount/100.0 ELSE NULL END),
      2
    ) as avg_transaction_value
  FROM direct_charges dc
  WHERE dc.created_at >= NOW() - INTERVAL '1 day' * days_back;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON marketplace_analytics TO authenticated, anon;
GRANT SELECT ON seller_performance TO authenticated, anon;
GRANT SELECT ON category_performance TO authenticated, anon;

-- Test the updated views
SELECT 'Updated analytics views successfully' as status;
