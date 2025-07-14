// Check Stripe account payment setup status
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPaymentSetup() {
  console.log('Analyzing seller payment setup...\n');
  
  try {
    // Get the most recent enabled account
    const { data: accounts, error } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('charges_enabled', true)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Database error:', error);
      return;
    }
    
    if (!accounts || accounts.length === 0) {
      console.log('❌ No enabled accounts found for payments');
      
      // Check all accounts for this user
      const { data: allAccounts } = await supabase
        .from('connected_accounts')
        .select('*')
        .eq('user_id', '58a431a4-ceb6-435d-831b-3be45b6ef2e0')
        .order('created_at', { ascending: false });
        
      console.log(`\nFound ${allAccounts?.length || 0} total accounts for user:`);
      allAccounts?.forEach((acc, i) => {
        console.log(`${i+1}. ${acc.stripe_account_id} - Charges: ${acc.charges_enabled}, Payouts: ${acc.payouts_enabled}, Details: ${acc.details_submitted}`);
      });
      
      return;
    }
    
    console.log(`✅ Found ${accounts.length} enabled account(s) for payments:\n`);
    
    for (const account of accounts) {
      console.log(`📊 Checking account: ${account.stripe_account_id}`);
      console.log(`   User ID: ${account.user_id}`);
      console.log(`   Database Status: charges=${account.charges_enabled}, payouts=${account.payouts_enabled}, details=${account.details_submitted}`);
      
      try {
        // Get current status from Stripe
        const stripeAccount = await stripe.accounts.retrieve(account.stripe_account_id);
        
        console.log(`   Stripe Status:`);
        console.log(`     - Type: ${stripeAccount.type}`);
        console.log(`     - Charges enabled: ${stripeAccount.charges_enabled}`);
        console.log(`     - Payouts enabled: ${stripeAccount.payouts_enabled}`);
        console.log(`     - Details submitted: ${stripeAccount.details_submitted}`);
        console.log(`     - Requirements:`);
        
        if (stripeAccount.requirements) {
          const { currently_due, eventually_due, past_due } = stripeAccount.requirements;
          console.log(`       * Currently due: ${currently_due?.length || 0} items`);
          if (currently_due?.length > 0) {
            console.log(`         ${currently_due.join(', ')}`);
          }
          console.log(`       * Eventually due: ${eventually_due?.length || 0} items`);
          console.log(`       * Past due: ${past_due?.length || 0} items`);
        }
        
        console.log(`     - Capabilities:`);
        const capabilities = stripeAccount.capabilities || {};
        console.log(`       * Card payments: ${capabilities.card_payments || 'inactive'}`);
        console.log(`       * Transfers: ${capabilities.transfers || 'inactive'}`);
        
        // Check if ready for payments
        const readyForPayments = stripeAccount.charges_enabled && 
                                 stripeAccount.details_submitted &&
                                 capabilities.card_payments === 'active';
        
        console.log(`\n   🎯 Payment Ready: ${readyForPayments ? '✅ YES' : '❌ NO'}`);
        
        if (!readyForPayments) {
          console.log(`   ⚠️  Issues preventing payments:`);
          if (!stripeAccount.charges_enabled) console.log(`      - Charges not enabled`);
          if (!stripeAccount.details_submitted) console.log(`      - Account details not completed`);
          if (capabilities.card_payments !== 'active') console.log(`      - Card payments capability not active`);
          
          if (currently_due?.length > 0) {
            console.log(`      - Missing required information: ${currently_due.join(', ')}`);
          }
        }
        
      } catch (stripeError) {
        console.error(`   ❌ Stripe API error: ${stripeError.message}`);
      }
      
      console.log('\n' + '='.repeat(60) + '\n');
    }
    
  } catch (e) {
    console.error('Exception:', e.message);
  }
}

checkPaymentSetup().then(() => {
  console.log('Payment setup analysis completed');
  process.exit(0);
}).catch(error => {
  console.error('Analysis failed:', error);
  process.exit(1);
});

    console.log(
      `Found ${listings?.length || 0} listings without Stripe account IDs`
    );

    if (listings && listings.length > 0) {
      // Update each listing with a test account ID
      for (const listing of listings) {
        const testAccountId = `acct_test_${Math.random()
          .toString(36)
          .substr(2, 10)}`;

        const { error: updateError } = await supabase
          .from("listings")
          .update({
            seller_stripe_account_id: testAccountId,
            status: "available",
          })
          .eq("id", listing.id);

        if (updateError) {
          console.error(`Error updating listing ${listing.id}:`, updateError);
        } else {
          console.log(
            `Updated listing ${listing.id} with account ${testAccountId}`
          );
        }
      }
    }

    console.log("✅ Database update completed!");
  } catch (error) {
    console.error("❌ Error updating database:", error);
  }
}

// Run the function
updateListingsWithStripeAccounts().catch(console.error);
