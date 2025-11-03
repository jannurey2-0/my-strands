// Script to check assessment data in the database
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the project root
const envPath = path.join(__dirname, '../../..', '.env');
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Missing Supabase environment variables. Define VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env file.");
}

// Create a Supabase client similar to the web app but for Node.js
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkData() {
  console.log('Checking database data...');
  
  try {
    // Try to get user data (this might work since it's public)
    console.log('\n--- Checking for any data in auth.users ---');
    // Note: We can't directly query auth.users from the client, but we can try other approaches
    
    // Try to get the count of records in assessment_responses
    console.log('\n--- Checking count of assessment_responses ---');
    const { count, error } = await supabase
      .from('assessment_responses')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Count query error:', error.message);
      console.error('Error details:', error);
    } else {
      console.log(`Count of assessment_responses: ${count}`);
    }
    
    // Try to get a simple count
    console.log('\n--- Simple count query ---');
    const { data: countData, error: countError } = await supabase.rpc('count', {
      table_name: 'assessment_responses'
    }).single();
    
    if (countError) {
      console.error('RPC count error:', countError.message);
    } else {
      console.log('RPC count result:', countData);
    }
    
  } catch (error) {
    console.error('Exception when checking data:', error);
  }
}

checkData().catch(console.error);