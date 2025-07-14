# Stripe Connect & Stripe Wrapper Integration Setup Guide

This guide will help you set up the complete Stripe Connect and Stripe Wrapper integration for your marketplace demo.

## Prerequisites

1. **Stripe Account**: Sign up at [stripe.com](https://stripe.com)
2. **Supabase Project**: Set up at [supabase.com](https://supabase.com)
3. **Environment Variables**: Configure your `.env.local` file

## Step 1: Environment Configuration

Create or update your `.env.local` file with the following variables:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Step 2: Database Setup

### 2.1 Basic Database Schema

Run the following scripts in your Supabase SQL Editor in order:

1. **Initial Setup**: Run `src/scripts/setup-database.sql`
2. **Stripe Connect Tables**: Run `setup-stripe-connect.sql`
3. **Data Population**: Run `src/scripts/repopulate-database.sql`

### 2.2 Stripe Wrapper Configuration

Run `src/scripts/setup-stripe-wrapper.sql` in your Supabase SQL Editor.

**Important**: Replace `<your_stripe_secret_key>` in the script with your actual Stripe secret key.

## Step 3: Stripe Connect Setup

### 3.1 Enable Connect in Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Connect** → **Settings**
3. Enable **Express accounts**
4. Set up your platform settings

### 3.2 Configure Webhooks (Optional)

For production, set up webhooks to automatically sync transaction data:

1. Go to **Developers** → **Webhooks** in Stripe Dashboard
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events: `charge.succeeded`, `charge.failed`, `account.updated`

## Step 4: Testing the Integration

### 4.1 Test Stripe Connect Flow

1. Navigate to `/profile` in your application
2. Click "Connect with Stripe" in the Stripe Connect section
3. Complete the onboarding flow
4. Verify the connection status updates

### 4.2 Test Payment Processing

1. Go to `/test-checkout` to see sample items
2. Click "Buy Now" on any item
3. Complete the test payment with test card: `4242 4242 4242 4242`
4. Verify transaction appears in analytics

### 4.3 Test Data Synchronization

1. Visit `/analytics` to see the analytics dashboard
2. Click "Sync Stripe Data" to fetch latest transactions
3. Click "Create Test Transaction" to add sample data
4. Verify data updates in real-time

## Step 5: Available Features

### 5.1 Stripe Connect Features

- ✅ Express account creation
- ✅ Onboarding flow
- ✅ Account status tracking
- ✅ Capability monitoring
- ✅ Account disconnection

### 5.2 Stripe Wrapper Features

- ✅ Real-time transaction sync
- ✅ Foreign data wrapper access to Stripe API
- ✅ Materialized views for performance
- ✅ Automated data synchronization
- ✅ Analytics and reporting

### 5.3 Database Views & Functions

- `marketplace_transactions`: Combined local and Stripe data
- `marketplace_analytics`: Daily transaction summaries
- `seller_performance`: Seller metrics and conversion rates
- `category_performance`: Category-wise sales analysis
- `sync_stripe_charges()`: Manual sync function

## Step 6: API Endpoints

### Analytics API (`/api/analytics`)

- `GET ?action=summary`: Transaction summary
- `GET ?action=analytics`: Daily analytics
- `GET ?action=sellers`: Seller performance
- `GET ?action=categories`: Category performance
- `GET ?action=sync`: Sync Stripe data
- `POST`: Create test transactions

### Checkout API (`/api/checkout-session`)

- `POST`: Create Stripe Checkout session for Connect accounts

## Step 7: Production Deployment

### 7.1 Security Considerations

1. Use Supabase Vault for storing Stripe keys:

   ```sql
   SELECT vault.create_secret(
     'your_stripe_secret_key',
     'stripe_key',
     'Stripe API key for production'
   );
   ```

2. Enable Row Level Security (RLS) on all tables
3. Set up proper CORS policies
4. Use environment-specific Stripe keys

### 7.2 Performance Optimization

1. Set up automatic materialized view refresh:

   ```sql
   SELECT cron.schedule(
     'refresh-stripe-views',
     '*/15 * * * *',
     'REFRESH MATERIALIZED VIEW stripe_charges_summary;'
   );
   ```

2. Monitor query performance with `pg_stat_statements`
3. Add appropriate database indexes

## Step 8: Monitoring & Maintenance

### 8.1 Health Checks

- Monitor Stripe Wrapper connection status
- Check sync function execution logs
- Verify data consistency between Stripe and local database

### 8.2 Regular Tasks

- Refresh materialized views
- Sync transaction data
- Monitor seller account statuses
- Review analytics for insights

## Troubleshooting

### Common Issues

1. **Stripe Wrapper Connection Failed**

   - Verify Stripe API key is correct
   - Check network connectivity from Supabase
   - Ensure wrappers extension is enabled

2. **Connect Account Creation Failed**

   - Verify Stripe Connect is enabled
   - Check API key permissions
   - Review Stripe dashboard for errors

3. **Data Sync Issues**
   - Check sync function logs
   - Verify foreign table schema
   - Test Stripe API connectivity

### Getting Help

1. Check Supabase logs in the dashboard
2. Review Stripe webhook events
3. Monitor application logs
4. Test with Stripe's test mode first

## Next Steps

1. **Customize the UI** to match your brand
2. **Add webhook handling** for real-time updates
3. **Implement user authentication** integration
4. **Add more analytics views** for business insights
5. **Set up monitoring** and alerting

## Resources

- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Supabase Wrappers Documentation](https://supabase.com/docs/guides/database/extensions/wrappers)
- [Stripe Wrapper GitHub](https://github.com/supabase/wrappers)
- [Test Card Numbers](https://stripe.com/docs/testing#cards)

---

This integration provides a complete foundation for a marketplace with Stripe Connect payments and real-time transaction analytics powered by Stripe Wrapper and Supabase.
