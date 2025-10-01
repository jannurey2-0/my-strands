// In assessmentService.ts

import { supabase } from '@/integrations/supabase/client';
import { TablesInsert, Tables } from '@/integrations/supabase/types';

// Add AssessmentAttempt interface
interface AssessmentAttempt {
  id: string;
  question_ids: string[];
  student_id: string;
  created_at: string;
  completed_at: string | null;
  score: number | null;
}

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
  aptitudeAnswers: Record<string, number | string>;
}

export const assessmentService = {
  // Submit assessment response
  submitAssessment: async (data: AssessmentData, studentId: string) => {
    try {
      const insertData = {
        student_id: studentId,
        basic_info: data.basicInfo,
        academic_profile: data.academicProfile,
        personal_interests: data.personalInterests,
        hobbies: data.hobbies,
        aptitude_answers: data.aptitudeAnswers,
      } as TablesInsert<'assessment_responses'>;

      const { data: result, error } = await supabase
        .from('assessment_responses')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: result };
    } catch (error) {
      console.error('Error in submitAssessment:', error);
      throw error;
    }
  },

  // Get assessment responses for a student
  getStudentAssessments: async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('assessment_responses')
        .select('*')
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data;
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
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
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

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in getAllSchools:', error);
      throw error;
    }
  },

  // Get or create an assessment attempt and return the questions
  getAptitudeQuestions: async (studentId: string) => {
    try {
      // First, get the profile ID for this user
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', studentId)
        .single();

      if (profileError) throw profileError;
      if (!profileData) throw new Error('User profile not found');

      // Now get or create an assessment attempt using the profile ID
      const { data: attemptData, error: attemptError } = await (supabase as any)
        .rpc('get_or_create_assessment_attempt', { 
          p_student_id: profileData.id  // Use profile ID, not user ID
        })
        .single();
  
      if (attemptError) throw attemptError;
      if (!attemptData) throw new Error('Failed to create assessment attempt');
  
      const attempt = attemptData as unknown as AssessmentAttempt;
  
      // Get the questions for this attempt
      const { data: questionsData, error: questionsError } = await supabase
        .from('aptitude_questions')
        .select('*')
        .in('id', attempt.question_ids);

      if (questionsError) throw questionsError;

      // Transform the data to match our interface and randomize the order
      let questions = (questionsData || [])
        .sort((a, b) => {
          const aIndex = attempt.question_ids.indexOf(a.id);
          const bIndex = attempt.question_ids.indexOf(b.id);
          return aIndex - bIndex;
        })
        .map((q: any) => ({
          id: q.id,
          question: q.question,
          options: q.options as string | string[] | null,
          correct_answer: q.correct_answer,
          category: q.category,
          difficulty_level: q.difficulty_level,
          type: q.type || 'multiple_choice',
          attempt_id: attempt.id
        }));

      // Randomize the order of questions and limit to 15
      questions = questions
        .sort(() => Math.random() - 0.5) // Shuffle the questions
        .slice(0, 15); // Limit to 15 questions

      return questions;
    } catch (error) {
      console.error('Error in getAptitudeQuestions:', error);
      throw error;
    }
  },

  // Mark an assessment attempt as completed
  completeAssessmentAttempt: async (attemptId: string, score: number) => {
    try {
      const { data, error } = await (supabase as any)
        .from('assessment_attempts')
        .update({
          completed_at: new Date().toISOString(),
          score: score
        })
        .eq('id', attemptId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in completeAssessmentAttempt:', error);
      throw error;
    }
  },

  // System settings functions
  getSystemSettings: async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in getSystemSettings:', error);
      throw error;
    }
  },

  updateSystemSetting: async (pageName: string, isUnderMaintenance: boolean, maintenanceMessage?: string) => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .update({
          is_under_maintenance: isUnderMaintenance,
          maintenance_message: maintenanceMessage,
          updated_at: new Date().toISOString()
        })
        .eq('page_name', pageName)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in updateSystemSetting:', error);
      throw error;
    }
  },

  // Check if a specific page is under maintenance
  isPageUnderMaintenance: async (pageName: string) => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('is_under_maintenance, maintenance_message')
        .eq('page_name', pageName)
        .single();

      if (error) {
        console.error('Error checking page maintenance status:', error);
        return { isUnderMaintenance: false, maintenanceMessage: 'Currently Under Development' };
      }

      return {
        isUnderMaintenance: data?.is_under_maintenance || false,
        maintenanceMessage: data?.maintenance_message || 'Currently Under Development'
      };
    } catch (error) {
      console.error('Error in isPageUnderMaintenance:', error);
      return { isUnderMaintenance: false, maintenanceMessage: 'Currently Under Development' };
    }
  }
};