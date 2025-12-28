-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Drop existing tables to allow clean re-run
drop table if exists public.media cascade;
drop table if exists public.hiking_records cascade;
drop table if exists public.itineraries cascade;
drop table if exists public.route_sections cascade;
drop table if exists public.routes cascade;
drop table if exists public.cities cascade;
drop table if exists public.profiles cascade;

-- 1. Profiles Table (extends Supabase Auth)
create table public.profiles (
  id uuid references auth.users not null primary key,
  username text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Cities Table
create table public.cities (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  district text,
  description text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Routes Table
create table public.routes (
  id uuid default uuid_generate_v4() primary key,
  city_id uuid references public.cities(id) on delete cascade not null,
  name text not null,
  difficulty numeric(2,1) not null check (difficulty >= 0 and difficulty <= 5),
  duration_hours numeric(3,1) not null,
  distance_km numeric(4,1) not null,
  cover_image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(city_id, name)
);

-- 4. Route Sections Table (for rich text/image details)
create table public.route_sections (
  id uuid default uuid_generate_v4() primary key,
  route_id uuid references public.routes(id) on delete cascade not null,
  sort_order integer not null,
  content text not null,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Itineraries Table (User plans)
create table public.itineraries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  route_id uuid references public.routes(id) on delete cascade not null,
  planned_date date not null,
  status text default 'Pending' check (status in ('Pending', 'Completed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Hiking Records Table (Completed trips)
create table public.hiking_records (
  id uuid default uuid_generate_v4() primary key,
  itinerary_id uuid references public.itineraries(id) on delete set null,
  user_id uuid references auth.users not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  feelings text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Media Table (Photos/Videos for records)
create table public.media (
  id uuid default uuid_generate_v4() primary key,
  record_id uuid references public.hiking_records(id) on delete cascade not null,
  user_id uuid references auth.users not null,
  type text check (type in ('Image', 'Video')),
  url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
-- For simplicity in development, we enable public read access for data tables
-- In production, you should tighten these policies

alter table public.profiles enable row level security;
alter table public.cities enable row level security;
alter table public.routes enable row level security;
alter table public.route_sections enable row level security;
alter table public.itineraries enable row level security;
alter table public.hiking_records enable row level security;
alter table public.media enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update their own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Cities/Routes/Sections policies (Public Read)
create policy "Cities are viewable by everyone." on cities for select using ( true );
create policy "Routes are viewable by everyone." on routes for select using ( true );
create policy "Route sections are viewable by everyone." on route_sections for select using ( true );

-- Allow authenticated users to insert cities/routes (for seeding data via script)
-- Note: In production, this should be restricted to admins
create policy "Authenticated users can insert cities" on cities for insert with check ( auth.role() = 'authenticated' or auth.role() = 'anon' );
create policy "Authenticated users can insert routes" on routes for insert with check ( auth.role() = 'authenticated' or auth.role() = 'anon' );
create policy "Authenticated users can insert route sections" on route_sections for insert with check ( auth.role() = 'authenticated' or auth.role() = 'anon' );

-- Itineraries policies
create policy "Users can view their own itineraries."
  on itineraries for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own itineraries."
  on itineraries for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own itineraries."
  on itineraries for update
  using ( auth.uid() = user_id );

-- Hiking Records policies
create policy "Users can view their own records."
  on hiking_records for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own records."
  on hiking_records for insert
  with check ( auth.uid() = user_id );

-- Media policies
create policy "Users can view their own media."
  on media for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own media."
  on media for insert
  with check ( auth.uid() = user_id );

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
