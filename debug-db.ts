#!/usr/bin/env tsx
// Debug script to check database connection and assessment data
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createClient } from '@supabase/supabase-js';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the project root
const envPath = path.join(__dirname, '.', '.env');
dotenv.config({ path: envPath });

async function debugDatabase() {
  console.log('Debugging database connection and assessment data...');
  
  try {
    // Check environment variables
    console.log('Checking environment variables...');
    console.log('SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET');
    console.log('SUPABASE_PUBLISHABLE_KEY:', process.env.VITE_SUPABASE_PUBLISHABLE_KEY ? 'SET' : 'NOT SET');
    
    if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
      console.error('Missing Supabase environment variables');
      process.exit(1);
    }
    
    // Initialize Supabase client
    console.log('Initializing Supabase client...');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY
    );
    
    // Try to fetch a small amount of data to test the connection
    console.log('Attempting to fetch assessment data...');
    const { data, error } = await supabase
      .from('assessment_responses')
      .select('id, student_id, submitted_at')
      .limit(5);
    
    if (error) {
      console.error('Error fetching data:', error.message);
      console.error('Error details:', error);
      process.exit(1);
    }
    
    console.log(`Successfully connected to database. Found ${data?.length || 0} assessment records.`);
    
    if (data && data.length > 0) {
      console.log('Sample records:');
      data.forEach((record: any, index: number) => {
        console.log(`  ${index + 1}. ID: ${record.id}, Student ID: ${record.student_id}, Submitted: ${record.submitted_at}`);
      });
    } else {
      console.log('No assessment records found in the database.');
      console.log('Please complete some assessments first before training the model.');
    }
    
    console.log('Debug completed successfully!');
    
  } catch (error) {
    console.error('Error during database debug:', error);
    process.exit(1);
  }
}

// Run the debug script
if (import.meta.url === `file://${process.argv[1]}`) {
  debugDatabase();
}

export default debugDatabase;