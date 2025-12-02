# ML Model Storage Setup Guide

This guide explains how to set up Supabase Storage for sharing ML models between admin and students.

## Overview

The ML model is now stored in Supabase Storage, allowing:
- **Admin** trains model → saves to Supabase Storage
- **Students** load model from Supabase Storage automatically
- **Shared model** across all users (no per-user training needed)

## Setup Steps

### 1. Create Storage Bucket

You have two options:

#### Option A: Using Supabase Dashboard (Recommended)
1. Go to your Supabase Dashboard
2. Navigate to **Storage**
3. Click **"New bucket"**
4. Configure:
   - **Name**: `ml-models`
   - **Public**: ✅ **Yes** (students need to download without auth)
   - **File size limit**: `50 MB` (models are typically 1-5MB)
   - **Allowed MIME types**: 
     - `application/json`
     - `application/octet-stream`
5. Click **"Create bucket"**

#### Option B: Using SQL Migration
Run the migration file:
```bash
supabase migration up
```

Or manually run the SQL in `supabase/migrations/20251202000000_create_ml_models_bucket.sql`

### 2. Set Up Storage Policies

**IMPORTANT**: After creating the bucket, you MUST set up storage policies!

#### Option A: Run the SQL Migration (Recommended)
Run this SQL in your Supabase SQL Editor:

```sql
-- Fix storage policies for ml-models bucket
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

-- Allow authenticated users to update models
CREATE POLICY "Allow authenticated users to update ML models"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'ml-models')
WITH CHECK (bucket_id = 'ml-models');

-- Allow authenticated users to delete models
CREATE POLICY "Allow authenticated users to delete ML models"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'ml-models');

-- Allow public read access (for students)
CREATE POLICY "Allow public read access to ML models"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'ml-models');
```

#### Option B: Using Supabase Dashboard
1. Go to **Storage** → **Policies** tab
2. Select the `ml-models` bucket
3. Create these policies:

**Public Read Access** (Required for students):
- Allows anyone to read/download models
- Policy: "Allow public read access to ML models"
- Operation: SELECT
- Target roles: `public`

**Authenticated Upload/Update** (For admins):
- Allows authenticated users to upload/update models
- Policies:
  - "Allow authenticated users to upload ML models" (INSERT)
  - "Allow authenticated users to update ML models" (UPDATE)
  - "Allow authenticated users to delete ML models" (DELETE)
- Target roles: `authenticated`

### 3. Verify Setup

1. Go to **Storage** → **ml-models** bucket
2. Check that the bucket is **public**
3. Try uploading a test file to verify permissions

## How It Works

### Model Training Flow

1. **Admin trains model** in Admin Dashboard
2. Model is saved to:
   - ✅ **Supabase Storage** (shared, accessible to all)
   - ✅ **Local storage** (IndexedDB, for faster loading)

### Model Loading Flow

1. **Student visits Results page**
2. System checks:
   - ✅ **Supabase Storage first** (shared model)
   - ✅ **Local storage** (cached model, faster)
   - ✅ **Auto-train** (if no model found)

3. If model found in Supabase Storage:
   - Downloads and loads model
   - Caches to local storage for next time
   - Uses model for predictions

## File Structure in Storage

```
ml-models/
└── strand-recommender-v1/
    ├── model.json          (Model architecture)
    └── weights.bin         (Model weights)
```

## Troubleshooting

### "Storage bucket does not exist"
- Create the bucket manually in Supabase Dashboard
- Ensure bucket name is exactly `ml-models`

### "Failed to upload model" or "new row violates row-level security policy"
- **Most common issue**: Storage policies are missing or incorrect
- Run the SQL migration to create policies (see Step 2 above)
- Verify policies exist in Supabase Dashboard → Storage → Policies
- Ensure authenticated users have INSERT/UPDATE permissions
- Check that bucket_id matches 'ml-models' in policies

### "Model not loading for students"
- Verify bucket is **public**
- Check public read policy exists
- Verify model files exist in bucket
- Test public URL access in browser

### "Permission denied"
- Check storage policies in Supabase Dashboard
- Ensure public read access is enabled
- Verify authenticated users can upload
- Make sure you're logged in as an authenticated user

## Benefits

✅ **Centralized model**: One model for all users  
✅ **No per-user training**: Students don't need to train  
✅ **Faster predictions**: No training delay for students  
✅ **Easy updates**: Admin updates model, all users get it  
✅ **Automatic caching**: Models cached locally for speed  

## Next Steps

After setup:
1. Train a model in Admin Dashboard
2. Verify it appears in Supabase Storage
3. Test loading on a student account
4. Check browser console for any errors

