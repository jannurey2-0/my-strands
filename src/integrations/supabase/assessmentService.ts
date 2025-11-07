// In assessmentService.ts

import { supabase } from '@/integrations/supabase/client';
import { TablesInsert, Tables } from '@/integrations/supabase/types';
import logger from '@/lib/logger';

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
  recommendations?: Record<string, number> | null;
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
      logger.error('Error in submitAssessment:', error);
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
      logger.error('Error in getStudentAssessments:', error);
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
      logger.error('Error in getAllAssessments:', error);
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
      logger.error('Error in getAllSchools:', error);
      throw error;
    }
  },

  // Get or create an assessment attempt for a student
  getOrCreateAssessmentAttempt: async () => {
    try {
      // First get the current user's profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .single();

      if (profileError) throw profileError;
      if (!profileData) throw new Error('User profile not found');

      logger.debug('Calling get_or_create_assessment_attempt with profile ID:', { profileId: profileData.id });

      // Call the database function to get or create an assessment attempt
      const { data: attemptData, error: attemptError } = await (supabase as any)
        .rpc('get_or_create_assessment_attempt', { 
          p_student_id: profileData.id  // Changed to match the function parameter name
        })
        .single();

      if (attemptError) {
        logger.error('Error calling get_or_create_assessment_attempt:', attemptError);
        throw attemptError;
      }

      if (!attemptData) throw new Error('Failed to create assessment attempt');

      logger.debug('Assessment attempt ID:', { attemptId: attemptData });

      return attemptData;
    } catch (error) {
      logger.error('Error in getOrCreateAssessmentAttempt:', error);
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
      logger.debug('Calling get_or_create_assessment_attempt with profile ID:', { profileId: profileData.id });
      const { data: attemptData, error: attemptError } = await (supabase as any)
        .rpc('get_or_create_assessment_attempt', { 
          p_student_id: profileData.id  // Changed from student_id to p_student_id
        })
        .single();
  
      if (attemptError) {
        logger.error('Error calling get_or_create_assessment_attempt:', attemptError);
        // Provide more detailed error information
        if (attemptError.code === 'PGRST202') {
          throw new Error(`Database function not found. This usually means the database migrations haven't been applied correctly. Details: ${attemptError.message}`);
        }
        throw attemptError;
      }
      if (!attemptData) throw new Error('Failed to create assessment attempt');
      
      logger.debug('Assessment attempt ID:', { attemptId: attemptData });
  
      // Now fetch the complete attempt data
      const { data: fullAttemptData, error: fetchError } = await (supabase as any)
        .from('assessment_attempts')
        .select('*')
        .eq('id', attemptData)
        .single();
        
      if (fetchError) throw fetchError;
      if (!fullAttemptData) throw new Error('Failed to fetch assessment attempt data');
      
      const attempt = fullAttemptData as unknown as AssessmentAttempt;
  
      // Log the attempt details for debugging
      logger.debug('Fetching questions for attempt:', { attempt });
      logger.debug('Question IDs to fetch:', { questionIds: attempt.question_ids });

      // Get the questions for this attempt
      logger.debug('Question IDs to fetch (before query):', { questionIds: attempt.question_ids });
      if (attempt.question_ids && attempt.question_ids.length > 0) {
        logger.debug('Question IDs type:', { type: typeof attempt.question_ids[0] });
      }
      
      // First, let's check what questions exist in the database without RLS
      const { data: allQuestionsCheck, error: allQuestionsCheckError } = await supabase
        .from('aptitude_questions')
        .select('id')
        .limit(5);
        
      logger.debug('All questions check (limited):', { data: allQuestionsCheck, error: allQuestionsCheckError });
      
      const { data: questionsData, error: questionsError } = await supabase
        .from('aptitude_questions')
        .select('*')
        .in('id', attempt.question_ids || []);
        
      if (questionsError) {
        logger.error('Error fetching aptitude questions from database:', questionsError);
        throw questionsError;
      }

      // Log if no questions were found
      if (!questionsData || questionsData.length === 0) {
        logger.warn('No aptitude questions found for attempt');
        
        // Let's also check what questions exist in the database
        const { data: allQuestions, error: allQuestionsError } = await supabase
          .from('aptitude_questions')
          .select('id');
          
        if (allQuestionsError) {
          logger.error('Error fetching all questions for debugging:', allQuestionsError);
        }
        
        // Check if any of the question IDs exist
        const existingQuestionIds = allQuestions?.map(q => q.id) || [];
        const missingIds = (attempt.question_ids || []).filter(id => !existingQuestionIds.includes(id));
        logger.debug('Missing question IDs count:', { count: missingIds.length });
      }

      // Transform the data to match our interface and randomize the order
      let questions = (questionsData || [])
        .sort((a, b) => {
          const aIndex = (attempt.question_ids || []).indexOf(a.id);
          const bIndex = (attempt.question_ids || []).indexOf(b.id);
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

      // Check if we got any questions
      if (questions.length === 0) {
        logger.warn('No questions found for the attempt. This might be due to a mismatch between attempt question IDs and database question IDs.');
        // Try to get all questions as a fallback
        const { data: allQuestions, error: allQuestionsError } = await supabase
          .from('aptitude_questions')
          .select('*')
          .limit(15);
          
        if (allQuestionsError) {
          logger.error('Error fetching fallback questions:', allQuestionsError);
        } else if (allQuestions && allQuestions.length > 0) {
          questions = allQuestions.map((q: any) => ({
            id: q.id,
            question: q.question,
            options: q.options as string | string[] | null,
            correct_answer: q.correct_answer,
            category: q.category,
            difficulty_level: q.difficulty_level,
            type: q.type || 'multiple_choice',
            attempt_id: attempt.id
          }));
        }
      }
      
      // Randomize the order of questions and limit to 15
      questions = questions
        .sort(() => Math.random() - 0.5) // Shuffle the questions
        .slice(0, 15); // Limit to 15 questions

      return questions;
    } catch (error) {
      logger.error('Error in getAptitudeQuestions:', error);
      // Provide a more user-friendly error message
      if (error.message && error.message.includes('function')) {
        throw new Error('Unable to load assessment questions. Please contact support if this issue persists.');
      }
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
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error in completeAssessmentAttempt:', error);
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
      logger.error('Error in getSystemSettings:', error);
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
      logger.error('Error in updateSystemSetting:', error);
      throw error;
    }
  },

  // Save strand recommendations for an assessment
  saveRecommendations: async (assessmentId: string, recommendations: Record<string, number>) => {
    try {
      // Find the strand with the highest percentage
      let highestStrand = '';
      let highestPercentage = 0;
      
      Object.entries(recommendations).forEach(([strand, percentage]) => {
        if (percentage > highestPercentage) {
          highestPercentage = percentage;
          highestStrand = strand;
        }
      });
      
      const { data, error } = await supabase
        .from('assessment_responses')
        .update({
          recommendations: recommendations,
          actual_strand: highestStrand
        })
        .eq('id', assessmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error in saveRecommendations:', error);
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
        logger.error('Error checking page maintenance status:', error);
        return { isUnderMaintenance: false, maintenanceMessage: 'Currently Under Development' };
      }

      return {
        isUnderMaintenance: data?.is_under_maintenance || false,
        maintenanceMessage: data?.maintenance_message || 'Currently Under Development'
      };
    } catch (error) {
      logger.error('Error in isPageUnderMaintenance:', error);
      return { isUnderMaintenance: false, maintenanceMessage: 'Currently Under Development' };
    }
  },

  // Test function to verify recommendations saving
  testRecommendationsSaving: async (assessmentId: string, testData: Record<string, number>) => {
    try {
      const result = await assessmentService.saveRecommendations(assessmentId, testData);
      logger.debug('Test recommendations saved successfully:', result);
      return result;
    } catch (error) {
      logger.error('Error in testRecommendationsSaving:', error);
      throw error;
    }
  }
};