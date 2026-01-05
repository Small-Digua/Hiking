-- 标签表
create table public.tags (
  id uuid default uuid_generate_v4() primary key,
  name varchar(50) not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 为路线表添加标签数组字段
alter table public.routes add column if not exists tags text[];

-- 路线标签关联表（用于多对多关系）
create table public.route_tags (
  id uuid default uuid_generate_v4() primary key,
  route_id uuid references public.routes(id) on delete cascade not null,
  tag_id uuid references public.tags(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(route_id, tag_id)
);

-- 启用 RLS
alter table public.tags enable row level security;
alter table public.route_tags enable row level security;

-- 标签表权限
create policy "Tags are viewable by everyone." on tags for select using ( true );
create policy "Authenticated users can insert tags" on tags for insert with check ( auth.role() = 'authenticated' );
create policy "Authenticated users can update tags" on tags for update with check ( auth.role() = 'authenticated' );
create policy "Authenticated users can delete tags" on tags for delete using ( auth.role() = 'authenticated' );

-- 路线标签关联表权限
create policy "Route tags are viewable by everyone." on route_tags for select using ( true );
create policy "Authenticated users can insert route tags" on route_tags for insert with check ( auth.role() = 'authenticated' );
create policy "Authenticated users can delete route tags" on route_tags for delete using ( auth.role() = 'authenticated' );
