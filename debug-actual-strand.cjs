// Simple debug script to check actual_strand data
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: './.env' });

async function debugActualStrand() {
  console.log('Debugging actual_strand data...');
  
  try {
    // Create Supabase client with service role key for full access
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
    );
    
    // First, get the total count
    console.log('Fetching total count of assessment records...');
    const { count: totalCount, error: countError } = await supabase
      .from('assessment_responses')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Count query error:', countError);
      return;
    }
    
    console.log(`Total assessment records in database: ${totalCount}`);
    
    // Fetch all assessment data with actual_strand column
    console.log('Fetching all assessment data from database...');
    const { data, error } = await supabase
      .from('assessment_responses')
      .select('id, actual_strand, basic_info, academic_profile')
      .order('submitted_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error:', error);
      return;
    }
    
    console.log(`Found ${data?.length || 0} assessment records`);
    
    if (data && data.length > 0) {
      // Show statistics
      const recordsWithStrand = data.filter((a) => a.actual_strand);
      console.log(`${recordsWithStrand.length} records have actual strand data.`);
      
      // Show strand distribution
      const strandCounts = {};
      data.forEach((record) => {
        const strand = record.actual_strand || 'null';
        strandCounts[strand] = (strandCounts[strand] || 0) + 1;
      });
      
      console.log('Strand distribution:');
      Object.entries(strandCounts).forEach(([strand, count]) => {
        console.log(`  ${strand}: ${count}`);
      });
      
      // Show sample records
      console.log('\nSample records:');
      data.slice(0, 3).forEach((record, index) => {
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

debugActualStrand();