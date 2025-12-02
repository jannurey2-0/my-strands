-- Fix storage policies for ml-models bucket
-- This ensures authenticated users can upload/update models

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to read ML models" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload ML models" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update ML models" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete ML models" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to ML models" ON storage.objects;

-- Allow authenticated users to read models
CREATE POLICY "Allow authenticated users to read ML models"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'ml-models');

-- Allow authenticated users to upload models
CREATE POLICY "Allow authenticated users to upload ML models"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ml-models');

-- Allow authenticated users to update models (for upsert operations)
CREATE POLICY "Allow authenticated users to update ML models"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'ml-models')
WITH CHECK (bucket_id = 'ml-models');

-- Allow authenticated users to delete models (for cleanup)
CREATE POLICY "Allow authenticated users to delete ML models"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'ml-models');

-- Allow public read access (so students can download models without authentication)
CREATE POLICY "Allow public read access to ML models"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'ml-models');

