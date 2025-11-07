import { supabase } from '../../integrations/supabase/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkMlSettings() {
  try {
    console.log('Checking ML model settings...');
    
    // Fetch ML model settings
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('page_name', 'ml_model')
      .single();

    if (error) {
      console.error('Error fetching ML settings:', error);
      return;
    }

    if (data) {
      console.log('ML Model Settings:');
      console.log(`  Page Name: ${data.page_name}`);
      console.log(`  Is Under Maintenance (ML Enabled): ${data.is_under_maintenance}`);
      console.log(`  Maintenance Message: ${data.maintenance_message}`);
      console.log(`  Updated At: ${data.updated_at || 'Never'}`);
      
      // Try to get last_trained if it exists (may not be in TypeScript types)
      // @ts-ignore
      if (data.last_trained) {
        // @ts-ignore
        console.log(`  Last Trained: ${data.last_trained}`);
      } else {
        console.log(`  Last Trained: Never`);
      }
      
      // Interpret the settings
      if (data.is_under_maintenance) {
        console.log('\n✅ ML Model is currently ENABLED');
        console.log('   (is_under_maintenance = true means ML is enabled in the admin dashboard)');
      } else {
        console.log('\n❌ ML Model is currently DISABLED');
        console.log('   (is_under_maintenance = false means ML is disabled in the admin dashboard)');
      }
    } else {
      console.log('No ML model settings found in the database.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the check
checkMlSettings();