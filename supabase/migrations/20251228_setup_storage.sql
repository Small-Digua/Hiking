-- Create a new storage bucket for hiking assets
insert into storage.buckets (id, name, public)
values ('hiking_assets', 'hiking_assets', true)
on conflict (id) do nothing;

-- Set up security policies for the bucket

-- 1. Allow public read access to all files in the bucket
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'hiking_assets' );

-- 2. Allow authenticated users to upload files
-- They can upload to any path, but we'll manage paths in the frontend (e.g., userId/filename)
create policy "Authenticated users can upload"
  on storage.objects for insert
  with check (
    bucket_id = 'hiking_assets' 
    and auth.role() = 'authenticated'
  );

-- 3. Allow users to update their own files (optional, but good for avatar updates)
create policy "Users can update own files"
  on storage.objects for update
  using (
    bucket_id = 'hiking_assets' 
    and auth.uid() = owner
  );

-- 4. Allow users to delete their own files
create policy "Users can delete own files"
  on storage.objects for delete
  using (
    bucket_id = 'hiking_assets' 
    and auth.uid() = owner
  );
