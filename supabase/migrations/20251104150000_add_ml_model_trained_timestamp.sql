-- Add last_trained column to system_settings table for ML model tracking
alter table public.system_settings add column if not exists last_trained timestamp with time zone;

-- Add comment to explain the purpose of the column
comment on column public.system_settings.last_trained is 'Timestamp of when the ML model was last successfully trained';