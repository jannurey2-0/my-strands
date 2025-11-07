-- Add actual_strand column to assessment_responses table for ML training
alter table public.assessment_responses add column if not exists actual_strand text;

-- Add comment to explain the purpose of the column
comment on column public.assessment_responses.actual_strand is 'The actual strand that the student was enrolled in or recommended for ML training purposes';

-- Create index for better performance
create index if not exists idx_assessment_responses_actual_strand on public.assessment_responses (actual_strand);