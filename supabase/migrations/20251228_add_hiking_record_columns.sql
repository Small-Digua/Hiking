-- Add missing columns to hiking_records table
ALTER TABLE public.hiking_records ADD COLUMN IF NOT EXISTS distance numeric(4,1);
ALTER TABLE public.hiking_records ADD COLUMN IF NOT EXISTS duration text;
