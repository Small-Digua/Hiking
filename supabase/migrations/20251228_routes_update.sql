-- 1. Add images array column to routes table
ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';

-- 2. Add updated_at column if not exists (usually exists, but ensuring)
ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 3. Create trigger to update updated_at on change
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language plpgsql;

DROP TRIGGER IF EXISTS on_routes_updated ON public.routes;
CREATE TRIGGER on_routes_updated
  BEFORE UPDATE ON public.routes
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();
