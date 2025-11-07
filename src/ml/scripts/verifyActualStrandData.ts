import { supabase } from '../../integrations/supabase/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function verifyActualStrandData() {
  try {
    console.log('Checking assessment_responses table for data...');
    
    // Fetch all assessment responses without specifying actual_strand column
    const { data, error } = await supabase
      .from('assessment_responses')
      .select('*')
      .order('submitted_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching data:', error);
      return;
    }

    console.log(`Found ${data?.length || 0} assessment records:`);
    
    if (data && data.length > 0) {
      data.forEach((record: any, index) => {
        console.log(`\nRecord ${index + 1}:`);
        console.log(`  ID: ${record.id}`);
        console.log(`  Student ID: ${record.student_id}`);
        console.log(`  Submitted: ${record.submitted_at}`);
        console.log(`  Actual Strand: ${record.actual_strand || 'NULL'}`);
        console.log(`  Has Recommendations: ${!!record.recommendations}`);
      });
      
      // Count records with and without actual_strand
      const withStrand = data.filter((record: any) => record.actual_strand !== null && record.actual_strand !== undefined).length;
      const withoutStrand = data.filter((record: any) => !record.actual_strand || record.actual_strand === null).length;
      
      console.log(`\nSummary:`);
      console.log(`  Records with actual_strand: ${withStrand}`);
      console.log(`  Records without actual_strand: ${withoutStrand}`);
    } else {
      console.log('No assessment records found.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the verification
verifyActualStrandData();