import { supabase } from '@/integrations/supabase/client';
import { TablesInsert, Tables } from '@/integrations/supabase/types';

export interface AssessmentData {
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
  // keys are question ids (string or number) and values can be numeric choice indices or free-text answers
  aptitudeAnswers: Record<string, number | string>;
}

export const assessmentService = {
  // Submit assessment response
  submitAssessment: async (data: AssessmentData, studentId: string) => {
    try {
      console.log('Submitting assessment for student:', studentId);
      console.log('Assessment data:', data);
      
      const insertData = {
        student_id: studentId,
        basic_info: data.basicInfo,
        academic_profile: data.academicProfile,
        personal_interests: data.personalInterests,
        hobbies: data.hobbies,
        aptitude_answers: data.aptitudeAnswers,
      } as TablesInsert<'assessment_responses'>;
      
      console.log('Insert data:', insertData);
      
      // First, let's check if the student profile exists
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_id')
        .eq('id', studentId)
        .single();
      
      if (profileError) {
        console.error('Profile check error:', profileError);
        throw new Error(`Student profile not found: ${profileError.message}`);
      }
      
      console.log('Profile exists:', profileData);
      
      // Now try to insert the assessment
      const { data: result, error } = await supabase
        .from('assessment_responses')
        .insert(insertData)
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        console.error('Error details:', {
          code: error.code,
          details: error.details,
          hint: error.hint,
          message: error.message
        });
        
        // Provide more specific error messages based on common issues
        if (error.code === '23503') {
          throw new Error('Database constraint error: Student profile may not exist or data format is incorrect');
        } else if (error.code === '42501') {
          throw new Error('Permission denied: You may not have permission to submit assessments. This could be due to a database policy issue.');
        } else {
          throw new Error(`Failed to submit assessment: ${error.message} (Code: ${error.code})`);
        }
      }

      console.log('Assessment submitted successfully:', result);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error in submitAssessment:', error);
      throw error;
    }
  },

  // Get assessment responses for a student
  getStudentAssessments: async (studentId: string) => {
    try {
      // First check if the student profile exists and get the user_id
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_id')
        .eq('id', studentId)
        .single();
      
      if (profileError) {
        console.error('Profile check error:', profileError);
        throw new Error(`Student profile not found: ${profileError.message}`);
      }
      
      const { data, error } = await supabase
        .from('assessment_responses')
        .select('*')
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching assessments:', error);
        throw new Error(`Failed to fetch assessments: ${error.message}`);
      }

      return data as Tables<'assessment_responses'>[];
    } catch (error) {
      console.error('Error in getStudentAssessments:', error);
      throw error;
    }
  },

  // Get all assessment responses (admin only)
  getAllAssessments: async () => {
    try {
      const { data, error } = await supabase
        .from('assessment_responses')
        .select(`
          *,
          profiles:student_id(full_name, email)
        `)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching all assessments:', error);
        throw new Error(`Failed to fetch all assessments: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in getAllAssessments:', error);
      throw error;
    }
  },

  // Get all schools
  getAllSchools: async () => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching schools:', error);
        throw new Error(`Failed to fetch schools: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in getAllSchools:', error);
      throw error;
    }
  }
};