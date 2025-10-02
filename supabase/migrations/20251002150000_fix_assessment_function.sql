-- Fix the get_or_create_assessment_attempt function to use the correct parameter name
-- Simplified version to avoid complex SQL that causes errors

CREATE OR REPLACE FUNCTION public.get_or_create_assessment_attempt(p_student_id uuid)
returns uuid as $$
declare
  attempt_id uuid;
  recent_attempt record;
  new_question_ids uuid[];
begin
  -- Check for an existing incomplete attempt
  SELECT id, question_ids INTO recent_attempt
  FROM public.assessment_attempts
  WHERE student_id = p_student_id AND completed_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN recent_attempt.id;
  END IF;

  -- Get 30 random question IDs (simplified approach)
  SELECT array_agg(id) INTO new_question_ids
  FROM (
    SELECT id 
    FROM public.aptitude_questions 
    ORDER BY random()
    LIMIT 30
  ) AS questions;
  
  -- Ensure we have question IDs
  IF new_question_ids IS NULL OR array_length(new_question_ids, 1) = 0 THEN
    RAISE EXCEPTION 'Failed to select question IDs - no questions available';
  END IF;
  
  -- Create a new attempt
  INSERT INTO public.assessment_attempts (student_id, question_ids)
  VALUES (p_student_id, new_question_ids)
  RETURNING id INTO attempt_id;
  
  RETURN attempt_id;
exception when others then
  raise exception 'Error creating assessment attempt: %', SQLERRM;
end;
$$ language plpgsql security definer;

-- Grant execute permission to authenticated users
grant execute on function public.get_or_create_assessment_attempt(uuid) to authenticated;