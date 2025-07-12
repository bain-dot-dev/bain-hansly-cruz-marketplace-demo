-- ====================================
-- COMPLETE DATABASE RESET AND SETUP
-- ====================================
-- This script will completely reset the database and set it up with Stripe Connect support

-- Drop existing tables if they exist
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS listings CASCADE;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Anyone can upload listing images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view listing images" ON storage.objects;

-- Delete and recreate storage bucket
DELETE FROM storage.buckets WHERE id = 'listing-images';
INSERT INTO storage.buckets (id, name, public) VALUES ('listing-images', 'listing-images', true);

-- ====================================
-- CREATE TABLES WITH STRIPE SUPPORT
-- ====================================

-- Create listings table with Stripe Connect columns
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  seller_email VARCHAR(255) NOT NULL,
  seller_stripe_account_id TEXT, -- For Stripe Connect account ID
  image_url TEXT,
  location VARCHAR(255) DEFAULT 'Palo Alto, CA',
  status VARCHAR(50) DEFAULT 'available', -- 'available', 'sold', 'pending'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  buyer_email VARCHAR(255) NOT NULL,
  seller_email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchase tracking table for Stripe payments
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  buyer_email VARCHAR(255) NOT NULL,
  seller_email VARCHAR(255) NOT NULL,
  stripe_session_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- ====================================
-- CREATE STORAGE POLICIES
-- ====================================

-- Create policy for listing images storage
CREATE POLICY "Anyone can upload listing images" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'listing-images');

CREATE POLICY "Anyone can view listing images" ON storage.objects 
FOR SELECT USING (bucket_id = 'listing-images');

-- ====================================
-- CREATE INDEXES
-- ====================================

CREATE INDEX idx_listings_category ON listings(category);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_seller_email ON listings(seller_email);
CREATE INDEX idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX idx_messages_listing_id ON messages(listing_id);
CREATE INDEX idx_purchases_listing_id ON purchases(listing_id);
CREATE INDEX idx_purchases_buyer_email ON purchases(buyer_email);
CREATE INDEX idx_purchases_stripe_session_id ON purchases(stripe_session_id);

-- ====================================
-- ENABLE ROW LEVEL SECURITY
-- ====================================

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- ====================================
-- CREATE RLS POLICIES
-- ====================================

-- Listings policies
CREATE POLICY "Anyone can view listings" ON listings FOR SELECT USING (true);
CREATE POLICY "Anyone can create listings" ON listings FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own listings" ON listings FOR UPDATE USING (seller_email = current_setting('request.jwt.claims')::json->>'email');

-- Messages policies
CREATE POLICY "Anyone can view messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Anyone can create messages" ON messages FOR INSERT WITH CHECK (true);

-- Purchases policies
CREATE POLICY "Anyone can view purchases" ON purchases FOR SELECT USING (true);
CREATE POLICY "Anyone can create purchases" ON purchases FOR INSERT WITH CHECK (true);

-- ====================================
-- CREATE FUNCTIONS AND TRIGGERS
-- ====================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update listing status when purchased
CREATE OR REPLACE FUNCTION update_listing_status_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE listings SET status = 'sold' WHERE id = NEW.listing_id;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update listing status when purchase is completed
CREATE TRIGGER update_listing_on_purchase AFTER UPDATE ON purchases
FOR EACH ROW EXECUTE FUNCTION update_listing_status_on_purchase();

-- ====================================
-- SEED DATA WITH STRIPE ACCOUNTS
-- ====================================

-- Insert sample listings with test Stripe account IDs and real images
INSERT INTO listings (title, description, price, category, seller_email, seller_stripe_account_id, image_url, location, status) VALUES
('iPhone 14 Pro Max', 'Excellent condition, barely used. Comes with original box and charger.', 899.00, 'Electronics', 'john@example.com', 'acct_test_1abc234def', 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&h=500&fit=crop', 'Palo Alto, CA', 'available'),
('Mountain Bike', 'Trek mountain bike, perfect for trails. Well maintained.', 450.00, 'Sporting Goods', 'sarah@example.com', 'acct_test_2ghi567jkl', 'https://images.unsplash.com/photo-1544191696-15693072fa6b?w=500&h=500&fit=crop', 'Palo Alto, CA', 'available'),
('Vintage Leather Sofa', 'Beautiful vintage leather sofa in great condition. Perfect for any living room.', 650.00, 'Home Goods', 'mike@example.com', 'acct_test_3mno890pqr', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=500&fit=crop', 'Palo Alto, CA', 'available'),
('MacBook Air M2', 'Like new MacBook Air with M2 chip. Perfect for students or professionals.', 1200.00, 'Electronics', 'lisa@example.com', 'acct_test_4stu123vwx', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop', 'Palo Alto, CA', 'available'),
('Guitar - Fender Stratocaster', 'Classic Fender Stratocaster in excellent condition. Includes amp and case.', 800.00, 'Musical Instruments', 'david@example.com', 'acct_test_5yza456bcd', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=500&fit=crop', 'Palo Alto, CA', 'available'),
('Dining Table Set', 'Solid wood dining table with 6 chairs. Perfect for family dinners.', 400.00, 'Home Goods', 'emma@example.com', 'acct_test_6efg789hij', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=500&fit=crop', 'Palo Alto, CA', 'available'),
('Gaming Console - PS5', 'PlayStation 5 with extra controller and 3 games included.', 550.00, 'Electronics', 'alex@example.com', 'acct_test_7klm012nop', 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500&h=500&fit=crop', 'Palo Alto, CA', 'available'),
('Road Bike', 'Lightweight carbon fiber road bike. Great for long distance rides.', 1100.00, 'Sporting Goods', 'chris@example.com', 'acct_test_8qrs345tuv', 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500&h=500&fit=crop', 'Palo Alto, CA', 'available'),
('Bookshelf', 'Tall wooden bookshelf with 5 shelves. Perfect for home office.', 120.00, 'Home Goods', 'anna@example.com', 'acct_test_9wxy678zab', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop', 'Palo Alto, CA', 'available'),
('Camera - Canon DSLR', 'Professional Canon DSLR camera with multiple lenses and accessories.', 750.00, 'Electronics', 'tom@example.com', 'acct_test_0cde901fgh', 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500&h=500&fit=crop', 'Palo Alto, CA', 'available'),
('Vintage Watch', 'Rare vintage Rolex watch in excellent condition. Collector''s item.', 2500.00, 'Accessories', 'robert@example.com', 'acct_test_1hij234klm', 'https://images.unsplash.com/photo-1523170335258-f5c6c6bd6eaf?w=500&h=500&fit=crop', 'Palo Alto, CA', 'available'),
('Electric Scooter', 'Fast electric scooter with long battery life. Perfect for commuting.', 380.00, 'Transportation', 'jenny@example.com', 'acct_test_2nop567qrs', 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500&h=500&fit=crop', 'Palo Alto, CA', 'available');

-- Add one sold item as an example
INSERT INTO listings (title, description, price, category, seller_email, seller_stripe_account_id, image_url, location, status) VALUES
('Sold Laptop', 'This item has been sold - example of sold status.', 800.00, 'Electronics', 'sold@example.com', 'acct_test_sold123', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&h=500&fit=crop', 'Palo Alto, CA', 'sold');

-- Insert sample purchase record for the sold item
INSERT INTO purchases (listing_id, buyer_email, seller_email, amount, platform_fee, status, completed_at)
SELECT id, 'buyer@example.com', 'sold@example.com', 800.00, 24.00, 'completed', NOW() - INTERVAL '1 day'
FROM listings WHERE title = 'Sold Laptop';

-- ====================================
-- VERIFICATION QUERIES
-- ====================================

-- Show created tables
SELECT 'Tables created:' as info;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Show sample data
SELECT 'Sample listings with Stripe accounts:' as info;
SELECT title, price, seller_stripe_account_id, status FROM listings LIMIT 5;

-- Show indexes
SELECT 'Indexes created:' as info;
SELECT indexname FROM pg_indexes WHERE schemaname = 'public';

SELECT 'Database reset and setup complete! 🎉' as status;
