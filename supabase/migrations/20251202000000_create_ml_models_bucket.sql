-- Create storage bucket for ML models
-- This bucket will store the trained ML models that can be shared across all users

-- Note: Storage bucket creation requires admin privileges
-- If this migration fails, create the bucket manually in Supabase Dashboard:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Click "New bucket"
-- 3. Name: ml-models
-- 4. Public: true (so models can be downloaded)
-- 5. File size limit: 50MB (models are typically 1-5MB)
-- 6. Allowed MIME types: application/json, application/octet-stream

-- Create the bucket (if you have admin access)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ml-models',
  'ml-models',
  true,
  52428800, -- 50MB in bytes
  ARRAY['application/json', 'application/octet-stream']
)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the bucket
-- Allow authenticated users to read models
CREATE POLICY "Allow authenticated users to read ML models"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'ml-models');

-- Allow authenticated users to upload/update models (for admins)
CREATE POLICY "Allow authenticated users to upload ML models"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ml-models');

CREATE POLICY "Allow authenticated users to update ML models"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'ml-models');

-- Allow public read access (so students can download models without authentication)
CREATE POLICY "Allow public read access to ML models"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'ml-models');

