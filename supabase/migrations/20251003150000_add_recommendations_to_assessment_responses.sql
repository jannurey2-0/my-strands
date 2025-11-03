-- Add recommendations column to assessment_responses table
alter table public.assessment_responses add column if not exists recommendations jsonb;

-- Create index for better performance
create index if not exists idx_assessment_responses_recommendations on public.assessment_responses using gin (recommendations);