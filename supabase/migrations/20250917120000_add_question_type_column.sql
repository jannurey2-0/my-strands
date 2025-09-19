-- Add type column to aptitude_questions

alter table if exists public.aptitude_questions
  add column if not exists "type" text not null default 'multiple_choice';

-- Add a check constraint to limit allowed types
alter table if exists public.aptitude_questions
  add constraint aptitude_questions_type_check check ("type" in ('multiple_choice','true_false','essay','identification'));

-- Optional index for faster filtering by type
create index if not exists idx_aptitude_questions_type on public.aptitude_questions("type");
