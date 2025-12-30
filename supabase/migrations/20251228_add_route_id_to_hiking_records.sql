-- Add route_id column to hiking_records table
ALTER TABLE public.hiking_records 
ADD COLUMN IF NOT EXISTS route_id uuid REFERENCES public.routes(id);

-- Update RLS policies for hiking_records (drop all existing policies first)
DROP POLICY IF EXISTS "Users can delete their own records." ON public.hiking_records;
DROP POLICY IF EXISTS "Users can insert their own records." ON public.hiking_records;
DROP POLICY IF EXISTS "Users can view their own records." ON public.hiking_records;
DROP POLICY IF EXISTS "Users can insert their own hiking records" ON public.hiking_records;
DROP POLICY IF EXISTS "Users can view their own hiking records" ON public.hiking_records;
DROP POLICY IF EXISTS "Users can update their own hiking records" ON public.hiking_records;
DROP POLICY IF EXISTS "Users can delete their own hiking records" ON public.hiking_records;

-- Create comprehensive RLS policies
CREATE POLICY "Users can insert their own hiking records" 
ON public.hiking_records 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own hiking records" 
ON public.hiking_records 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own hiking records" 
ON public.hiking_records 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hiking records" 
ON public.hiking_records 
FOR DELETE 
USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE public.hiking_records ENABLE ROW LEVEL SECURITY;