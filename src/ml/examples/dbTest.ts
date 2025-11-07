#!/usr/bin/env tsx
// Simple database test script
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { supabase } from '../services/supabaseClient';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the project root
const envPath = path.join(__dirname, '../../..', '.env');
dotenv.config({ path: envPath });

async function testDB() {
  console.log('Testing database connection...');
  
  try {
    // Test a simple query
    const { data, error } = await supabase
      .from('assessment_responses')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Database error:', error);
      return;
    }
    
    console.log('Database connection successful!');
    console.log('Sample record ID:', data?.[0]?.id || 'No records found');
    
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
testDB();