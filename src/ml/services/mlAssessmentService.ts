// ML-specific assessment service that doesn't rely on the main Supabase client
import { supabase } from './supabaseClient';
import logger from '@/lib/logger';

export interface MLAssessmentData {
  basicInfo: {
    fullName: string;
    age: string;
    gender: string;
    school: string;
    region: string;
    email: string;
  };
  academicProfile: {
    gwa: string;
    favoriteSubject: string;
    leastFavoriteSubject: string;
  };
  personalInterests: string[];
  hobbies: string[];
  aptitudeAnswers: Record<string, number | string>;
  recommendations?: Record<string, number> | null;
  actualStrand?: string;
}

export const mlAssessmentService = {
  // Get all assessment responses (for ML training)
  getAllAssessments: async () => {
    try {
      console.log('Fetching data from assessment_responses table...');
      
      // Check if supabase client is properly initialized
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      const { data, error } = await supabase
        .from('assessment_responses')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to fetch assessment data: ${error.message}`);
      }
      
      console.log(`Found ${data?.length || 0} assessment records`);
      // Removed sensitive data logging
      // if (data && data.length > 0) {
      //   console.log('First record:', JSON.stringify(data[0], null, 2));
      // }
      
      return data;
    } catch (error) {
      logger.error('Error in getAllAssessments:', error);
      throw new Error(`Failed to fetch assessment data: ${(error as Error).message}`);
    }
  },
};