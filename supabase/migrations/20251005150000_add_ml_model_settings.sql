-- Add ML model settings to system_settings table
insert into public.system_settings (page_name, is_under_maintenance, maintenance_message) values
  ('ml_model', false, 'ML Model Disabled')
on conflict (page_name) do nothing;