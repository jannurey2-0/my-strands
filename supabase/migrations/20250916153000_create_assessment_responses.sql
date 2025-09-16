-- Create assessment_responses table
create table if not exists public.assessment_responses (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  basic_info jsonb not null,
  academic_profile jsonb not null,
  personal_interests jsonb not null,
  hobbies jsonb not null,
  aptitude_answers jsonb not null,
  submitted_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Create indexes
create index if not exists idx_assessment_responses_student_id on public.assessment_responses(student_id);
create index if not exists idx_assessment_responses_submitted_at on public.assessment_responses(submitted_at);

-- Enable RLS
alter table public.assessment_responses enable row level security;

-- Create policies
create policy "Students can insert their own assessment responses"
  on public.assessment_responses
  for insert
  with check (student_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

create policy "Students can view their own assessment responses"
  on public.assessment_responses
  for select
  using (student_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

create policy "Students can update their own assessment responses"
  on public.assessment_responses
  for update
  using (student_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

create policy "Admins can view all assessment responses"
  on public.assessment_responses
  for select
  using (public.has_role(auth.uid(), 'admin'::app_role));