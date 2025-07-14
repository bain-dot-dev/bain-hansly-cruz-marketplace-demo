// Fix seller payment setup by cleaning up duplicate accounts
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixSellerPaymentSetup() {
  console.log('🔧 Fixing seller payment setup...\n');
  
  try {
    // Get the target user
    const userId = '58a431a4-ceb6-435d-831b-3be45b6ef2e0';
    
    // Get all accounts for this user
    const { data: userAccounts, error } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Database error:', error);
      return;
    }
    
    console.log(`Found ${userAccounts?.length || 0} accounts for user ${userId}:`);
    userAccounts?.forEach((acc, i) => {
      console.log(`${i+1}. ${acc.stripe_account_id} - Created: ${acc.created_at}, Charges: ${acc.charges_enabled}`);
    });
    
    if (!userAccounts || userAccounts.length <= 1) {
      console.log('✅ No duplicate cleanup needed');
      return;
    }
    
    // Keep the most recent account with charges_enabled = true
    const enabledAccount = userAccounts.find(acc => acc.charges_enabled);
    const accountToKeep = enabledAccount || userAccounts[0]; // Keep enabled account or most recent
    
    console.log(`\n🎯 Keeping account: ${accountToKeep.stripe_account_id} (enabled: ${accountToKeep.charges_enabled})`);
    
    // Delete duplicate accounts
    const accountsToDelete = userAccounts.filter(acc => acc.id !== accountToKeep.id);
    
    if (accountsToDelete.length > 0) {
      console.log(`\n🗑️  Deleting ${accountsToDelete.length} duplicate account(s):`);
      
      for (const account of accountsToDelete) {
        console.log(`   Deleting: ${account.stripe_account_id}`);
        
        const { error: deleteError } = await supabase
          .from('connected_accounts')
          .delete()
          .eq('id', account.id);
          
        if (deleteError) {
          console.error(`   ❌ Failed to delete ${account.stripe_account_id}:`, deleteError);
        } else {
          console.log(`   ✅ Deleted ${account.stripe_account_id}`);
        }
      }
    }
    
    // Ensure the kept account is properly configured for payments
    if (accountToKeep.charges_enabled) {
      console.log(`\n✅ Account ${accountToKeep.stripe_account_id} is ready for payments!`);
      
      // Update any listings to use this account
      const { data: listings, error: listingsError } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', userId);
        
      if (listingsError) {
        console.error('Error fetching listings:', listingsError);
      } else if (listings && listings.length > 0) {
        console.log(`\n📝 Updating ${listings.length} listing(s) to use payment-ready account...`);
        
        const { error: updateError } = await supabase
          .from('listings')
          .update({ 
            seller_stripe_account_id: accountToKeep.stripe_account_id,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
          
        if (updateError) {
          console.error('❌ Failed to update listings:', updateError);
        } else {
          console.log('✅ Updated all listings with payment-ready account');
        }
      }
      
    } else {
      console.log(`\n⚠️  Account ${accountToKeep.stripe_account_id} needs to complete Stripe onboarding`);
      console.log('   User should visit /profile and complete the "Complete Setup" process');
    }
    
  } catch (e) {
    console.error('Exception:', e.message);
  }
}

fixSellerPaymentSetup().then(() => {
  console.log('\n🎉 Seller payment setup fix completed');
  process.exit(0);
}).catch(error => {
  console.error('Fix failed:', error);
  process.exit(1);
});
