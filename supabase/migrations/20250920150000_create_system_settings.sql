-- Create system_settings table
create table if not exists public.system_settings (
  id uuid default gen_random_uuid() primary key,
  page_name text not null unique,
  is_under_maintenance boolean not null default false,
  maintenance_message text,
  updated_at timestamp with time zone default now() not null,
  updated_by uuid references auth.users(id)
);

-- Enable RLS
alter table public.system_settings enable row level security;

-- Create policies
create policy "Admins can manage system settings"
  on public.system_settings
  for all
  using (exists (
    select 1 from public.profiles 
    where user_id = auth.uid() and role = 'admin'::app_role
  ));

create policy "Everyone can view system settings"
  on public.system_settings
  for select
  using (true);

-- Create function to update updated_at column
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = public;

-- Create trigger for automatic timestamp updates
create trigger update_system_settings_updated_at
  before update on public.system_settings
  for each row
  execute function public.update_updated_at_column();

-- Insert default settings for all pages
insert into public.system_settings (page_name, is_under_maintenance, maintenance_message) values
  ('schools', false, 'Currently Under Development'),
  ('careers', false, 'Currently Under Development'),
  ('results', false, 'Currently Under Development'),
  ('assessment', false, 'Currently Under Development')
on conflict (page_name) do nothing;