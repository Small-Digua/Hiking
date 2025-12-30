-- Enable replication for routes table to support Realtime
alter publication supabase_realtime add table public.routes;
