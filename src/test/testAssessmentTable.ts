import { supabase } from '@/integrations/supabase/client';

// Test if the assessment_responses table exists and is accessible
export const testAssessmentTable = async () => {
  try {
    console.log('Testing assessment_responses table access...');
    
    // Try to query the table structure
    const { data, error } = await supabase
      .from('assessment_responses')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Error accessing assessment_responses table:', error);
      return { success: false, error };
    }

    console.log('Successfully accessed assessment_responses table');
    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error testing assessment_responses table:', error);
    return { success: false, error };
  }
};

// Run the test
testAssessmentTable().then(result => {
  console.log('Test result:', result);
});