# 🚀 Database Reset Instructions

## Quick Setup (Recommended)

1. **Go to Supabase Dashboard**

   - Open your Supabase project dashboard
   - Go to the SQL Editor

2. **Run the Complete Reset Script**

   - Copy and paste the entire content from `src/scripts/complete-database-reset.sql`
   - Click "Run" to execute

3. **Verify Setup**
   - The script will show confirmation messages
   - You should see tables created with sample data
   - All listings will have test Stripe account IDs

## What This Script Does

✅ **Completely resets the database**

- Drops existing tables safely
- Recreates with proper Stripe Connect columns

✅ **Adds new columns for Stripe**

- `seller_stripe_account_id` - For Stripe Connect accounts
- `status` - Track listing availability ('available', 'sold', 'pending')

✅ **Creates purchase tracking**

- New `purchases` table for payment history
- Tracks Stripe session IDs and payment intents

✅ **Seeds with test data**

- 12 sample listings with test Stripe accounts
- 1 example sold item
- Ready for immediate testing

✅ **Updates API integration**

- New listings automatically get test Stripe accounts
- Checkout buttons work immediately

## After Running the Script

🎯 **Test the complete flow:**

1. Visit: http://localhost:3000
2. Click on any item
3. Click the purple "Buy Now" button
4. Complete the Stripe checkout

🎉 **Your marketplace now has full Stripe Connect support!**

## File Locations

- **Reset Script**: `src/scripts/complete-database-reset.sql`
- **Updated API**: `src/app/api/listings/route.ts` (now adds Stripe accounts)
- **Checkout Button**: Already integrated in item pages
