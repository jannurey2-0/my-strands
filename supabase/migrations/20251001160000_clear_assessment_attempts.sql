-- Clear all assessment attempts to fix question ID mismatch
DELETE FROM public.assessment_attempts;

-- Reset the assessment attempt function to ensure it fetches current question IDs
CREATE OR REPLACE FUNCTION public.get_or_create_assessment_attempt(student_id uuid)
returns uuid as $$
declare
  attempt_id uuid;
  recent_attempt record;
  question_count int;
  total_questions int;
  new_question_ids uuid[];
  used_question_ids uuid[];
  available_question_ids uuid[];
  remaining_questions int;
  questions_to_add int;
begin
  -- Check for an existing incomplete attempt
  SELECT id, question_ids INTO recent_attempt
  FROM public.assessment_attempts
  WHERE student_id = $1 AND completed_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN recent_attempt.id;
  END IF;

  -- Get total number of questions
  SELECT COUNT(*) INTO total_questions FROM public.aptitude_questions;
  
  -- Check if there are any questions
  IF total_questions = 0 THEN
    RAISE EXCEPTION 'No aptitude questions found in database';
  END IF;
  
  -- Get all question IDs
  SELECT array_agg(id) INTO available_question_ids FROM public.aptitude_questions;
  
  -- Get IDs of questions used in previous attempts
  SELECT array_agg(DISTINCT unnest(question_ids)) INTO used_question_ids
  FROM public.assessment_attempts
  WHERE student_id = $1;
  
  -- If no previous attempts, use all questions
  IF used_question_ids IS NULL THEN
    used_question_ids := '{}'::uuid[];
  END IF;
  
  -- Calculate how many new questions we can get
  remaining_questions := total_questions - array_length(used_question_ids, 1);
  questions_to_add := LEAST(30, remaining_questions);
  
  -- If we don't have enough new questions, include some from previous attempts
  IF questions_to_add < 30 THEN
    -- Get random questions from the available ones
    SELECT array_agg(id) INTO new_question_ids
    FROM (
      SELECT id 
      FROM public.aptitude_questions 
      WHERE id = ANY(available_question_ids) AND NOT (id = ANY(used_question_ids))
      ORDER BY random()
      LIMIT questions_to_add
    ) AS new_questions;
    
    -- Add random questions from previous attempts to reach 30
    IF questions_to_add < 30 THEN
      new_question_ids := new_question_ids || (
        SELECT array_agg(id)
        FROM (
          SELECT id 
          FROM public.aptitude_questions 
          WHERE id = ANY(used_question_ids)
          ORDER BY random()
          LIMIT (30 - questions_to_add)
        ) AS existing_questions
      );
    END IF;
  ELSE
    -- We have enough new questions, just get 30 random ones
    SELECT array_agg(id) INTO new_question_ids
    FROM (
      SELECT id 
      FROM public.aptitude_questions 
      WHERE NOT (id = ANY(used_question_ids))
      ORDER BY random()
      LIMIT 30
    ) AS questions;
  END IF;
  
  -- Ensure we have question IDs
  IF new_question_ids IS NULL OR array_length(new_question_ids, 1) = 0 THEN
    RAISE EXCEPTION 'Failed to select question IDs';
  END IF;
  
  -- Create a new attempt
  INSERT INTO public.assessment_attempts (student_id, question_ids)
  VALUES ($1, new_question_ids)
  RETURNING id INTO attempt_id;
  
  RETURN attempt_id;
exception when others then
  raise exception 'Error creating assessment attempt: %', SQLERRM;
end;
$$ language plpgsql security definer;

-- Grant execute permission to authenticated users
grant execute on function public.get_or_create_assessment_attempt(uuid) to authenticated;