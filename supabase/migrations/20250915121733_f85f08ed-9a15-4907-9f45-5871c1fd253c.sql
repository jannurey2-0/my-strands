-- Create aptitude questions table
CREATE TABLE public.aptitude_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of answer options
  correct_answer INTEGER NOT NULL, -- Index of correct option (0-based)
  category TEXT NOT NULL, -- e.g., 'math', 'science', 'language', 'logical'
  difficulty_level INTEGER NOT NULL DEFAULT 1, -- 1=easy, 2=medium, 3=hard
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on aptitude_questions
ALTER TABLE public.aptitude_questions ENABLE ROW LEVEL SECURITY;

-- Create policies for aptitude questions
CREATE POLICY "Admins can view all questions" 
ON public.aptitude_questions 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create questions" 
ON public.aptitude_questions 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update questions" 
ON public.aptitude_questions 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete questions" 
ON public.aptitude_questions 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Create assessments table to track student test attempts
CREATE TABLE public.assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id),
  questions JSONB NOT NULL, -- Array of question IDs used in this assessment
  answers JSONB NOT NULL, -- Array of student's answers
  score DECIMAL(5,2), -- Calculated score (percentage)
  completed_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on assessments
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- Create policies for assessments
CREATE POLICY "Students can view their own assessments" 
ON public.assessments 
FOR SELECT 
USING (auth.uid() = student_id);

CREATE POLICY "Students can create their own assessments" 
ON public.assessments 
FOR INSERT 
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own assessments" 
ON public.assessments 
FOR UPDATE 
USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all assessments" 
ON public.assessments 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Create schools table
CREATE TABLE public.schools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  strands JSONB NOT NULL DEFAULT '[]', -- Array of available strands
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on schools
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Create policies for schools
CREATE POLICY "Everyone can view schools" 
ON public.schools 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage schools" 
ON public.schools 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Add triggers for updated_at
CREATE TRIGGER update_aptitude_questions_updated_at
  BEFORE UPDATE ON public.aptitude_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON public.assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schools_updated_at
  BEFORE UPDATE ON public.schools
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample admin account (you'll need to change the email/password)
-- First, insert into auth.users manually in SQL editor, then this trigger will create the profile
-- Example: INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at) 
-- VALUES ('admin@shsnavigator.com', crypt('admin123', gen_salt('bf')), now(), now(), now());

-- Insert sample aptitude questions
INSERT INTO public.aptitude_questions (question, options, correct_answer, category, difficulty_level) VALUES
('What is 15 + 27?', '["32", "42", "52", "62"]', 1, 'math', 1),
('Which planet is known as the Red Planet?', '["Venus", "Mars", "Jupiter", "Saturn"]', 1, 'science', 1),
('Choose the correct synonym for "Happy":', '["Sad", "Joyful", "Angry", "Tired"]', 1, 'language', 1),
('If all roses are flowers and some flowers are red, then:', '["All roses are red", "Some roses may be red", "No roses are red", "All flowers are roses"]', 1, 'logical', 2);

-- Insert sample schools
INSERT INTO public.schools (name, address, strands) VALUES
('Manila Science High School', '123 Taft Avenue, Manila', '["STEM", "ABM", "HUMSS", "GAS"]'),
('Quezon City High School', '456 Commonwealth Avenue, Quezon City', '["STEM", "ABM", "HUMSS", "TVL-ICT"]'),
('Makati Science High School', '789 Ayala Avenue, Makati', '["STEM", "ABM", "HUMSS"]');