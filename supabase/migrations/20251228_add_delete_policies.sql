-- Add delete policies for user data tables

-- Drop existing policies if they exist
drop policy if exists "Users can delete their own itineraries." on itineraries;
drop policy if exists "Users can delete their own records." on hiking_records;
drop policy if exists "Users can delete their own media." on media;

-- Itineraries delete policy
create policy "Users can delete their own itineraries."
  on itineraries for delete
  using ( auth.uid() = user_id );

-- Hiking Records delete policy
create policy "Users can delete their own records."
  on hiking_records for delete
  using ( auth.uid() = user_id );

-- Media delete policy
create policy "Users can delete their own media."
  on media for delete
  using ( auth.uid() = user_id );

-- Add deleted_at column to itineraries table if it doesn't exist
alter table public.itineraries add column if not exists deleted_at timestamp with time zone;