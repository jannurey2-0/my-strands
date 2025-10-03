-- Add school_id and category columns to schools table
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS school_id TEXT,
ADD COLUMN IF NOT EXISTS category TEXT;

-- Add comments to describe the new columns
COMMENT ON COLUMN public.schools.school_id IS 'Unique identifier for the school';
COMMENT ON COLUMN public.schools.category IS 'Category of the school (Small, Medium, Large)';

-- Add a check constraint to ensure category values are valid
ALTER TABLE public.schools 
ADD CONSTRAINT valid_school_category 
CHECK (category IN ('Small', 'Medium', 'Large') OR category IS NULL);