#!/usr/bin/env tsx
// Debug script to check actual_strand data in the database
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createClient } from '@supabase/supabase-js';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the project root
const envPath = path.join(__dirname, '../../..', '.env');
dotenv.config({ path: envPath });

async function debugActualStrand() {
  console.log('Debugging actual_strand data...');
  
  try {
    // Create Supabase client with service role key for full access
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Fetch assessment data with actual_strand column
    console.log('Fetching assessment data from database...');
    const { data, error } = await supabase
      .from('assessment_responses')
      .select('id, actual_strand, basic_info, academic_profile')
      .order('submitted_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to fetch assessment data: ${error.message}`);
    }
    
    console.log(`Found ${data?.length || 0} assessment records`);
    
    if (data && data.length > 0) {
      // Show statistics
      const recordsWithStrand = data.filter((a: any) => a.actual_strand);
      console.log(`${recordsWithStrand.length} records have actual strand data.`);
      
      // Show strand distribution
      const strandCounts: Record<string, number> = {};
      data.forEach((record: any) => {
        const strand = record.actual_strand || 'null';
        strandCounts[strand] = (strandCounts[strand] || 0) + 1;
      });
      
      console.log('Strand distribution:');
      Object.entries(strandCounts).forEach(([strand, count]) => {
        console.log(`  ${strand}: ${count}`);
      });
      
      // Show sample records
      console.log('\nSample records:');
      data.slice(0, 3).forEach((record: any, index: number) => {
        console.log(`Record ${index + 1}:`, {
          id: record.id,
          actualStrand: record.actual_strand,
          fullName: record.basic_info?.fullName,
          favoriteSubject: record.academic_profile?.favoriteSubject,
        });
      });
    }
    
  } catch (error) {
    console.error('Error during debugging:', error);
  }
}

// Run the debug script
if (import.meta.url === `file://${process.argv[1]}`) {
  debugActualStrand();
}

export default debugActualStrand;