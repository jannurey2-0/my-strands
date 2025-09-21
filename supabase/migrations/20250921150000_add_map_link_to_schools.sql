-- Add map_link column to schools table
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS map_link TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN public.schools.map_link IS 'Google Maps Embed API link for the school location';

-- IMPORTANT: For production use, you need to:
-- 1. Get a Google Maps API key from https://developers.google.com/maps/documentation/embed/get-api-key
-- 2. Generate proper embed URLs using the Google Maps Embed API
-- 3. Update the map_link values with real embed URLs

-- Example of a proper Google Maps Embed URL format:
-- https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.7745474747747!2d122.07474747474747!3d14.074747474747474!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDA0JzI5LjEiTiAxMjLCsDA0JzI5LjEiRQ!5e0!3m2!1sen!2sph!4v1234567890123!5m2!1sen!2sph

-- Update existing schools with example map links
-- In a production environment, these would be real Google Maps Embed URLs
UPDATE public.schools 
SET map_link = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.7745474747747!2d122.07474747474747!3d14.074747474747474!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDA0JzI5LjEiTiAxMjLCsDA0JzI5LjEiRQ!5e0!3m2!1sen!2sph!4v1234567890123!5m2!1sen!2sph'
WHERE name = 'Manila Science High School';

UPDATE public.schools 
SET map_link = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3860.1234567890123!2d121.12345678901234!3d14.123456789012345!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDA0JzI5LjEiTiAxMjLCsDA0JzI5LjEiRQ!5e0!3m2!1sen!2sph!4v1234567890123!5m2!1sen!2sph'
WHERE name = 'Quezon City High School';

UPDATE public.schools 
SET map_link = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3862.1234567890123!2d121.12345678901234!3d14.123456789012345!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDA0JzI5LjEiTiAxMjLCsDA0JzI5LjEiRQ!5e0!3m2!1sen!2sph!4v1234567890123!5m2!1sen!2sph'
WHERE name = 'Makati Science High School';