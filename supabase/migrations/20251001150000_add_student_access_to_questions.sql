-- Add policy to allow students to view aptitude questions
CREATE POLICY "Students can view aptitude questions" 
ON public.aptitude_questions 
FOR SELECT 
USING (public.has_role(auth.uid(), 'student'));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_aptitude_questions_category ON public.aptitude_questions(category);