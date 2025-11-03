-- Add update policy for assessment_attempts table
create policy "Students can update their own assessment attempts"
  on public.assessment_attempts
  for update
  using (student_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));