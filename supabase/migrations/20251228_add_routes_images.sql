-- Add images column to routes table
-- This will store an array of image URLs for each route
ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS images text[];