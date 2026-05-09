-- ============================================================
-- Team Task Manager — Database Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ==================== TABLES ====================

-- profiles (auto-created on signup via trigger)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz default now()
);

-- trigger to auto-create profile on auth.users insert
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles(id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- projects
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  owner_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now()
);

-- project_members (join table with role)
create table if not exists project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text check (role in ('admin', 'member')) default 'member',
  joined_at timestamptz default now(),
  unique(project_id, user_id)
);

-- tasks
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  description text,
  status text check (status in ('todo', 'in_progress', 'done')) default 'todo',
  priority text check (priority in ('low', 'medium', 'high')) default 'medium',
  assigned_to uuid references profiles(id) on delete set null,
  due_date date,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ==================== RLS ====================

alter table profiles enable row level security;
alter table projects enable row level security;
alter table project_members enable row level security;
alter table tasks enable row level security;

-- ==================== RLS POLICIES ====================

-- profiles
create policy "Users read own profile" on profiles for select using (auth.uid() = id);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);

-- projects
create policy "Members read their projects" on projects for select
  using (id in (select project_id from project_members where user_id = auth.uid()));

create policy "Admins insert projects" on projects for insert
  with check (owner_id = auth.uid());

create policy "Admins delete projects" on projects for delete
  using (id in (select project_id from project_members where user_id = auth.uid() and role = 'admin'));

-- project_members
create policy "Members read project_members" on project_members for select
  using (project_id in (select project_id from project_members where user_id = auth.uid()));

create policy "Admins manage members" on project_members for all
  using (project_id in (select project_id from project_members where user_id = auth.uid() and role = 'admin'));

-- tasks
create policy "Members read tasks" on tasks for select
  using (project_id in (select project_id from project_members where user_id = auth.uid()));

create policy "Admins manage tasks" on tasks for insert
  using (project_id in (select project_id from project_members where user_id = auth.uid() and role = 'admin'));

create policy "Members update task status" on tasks for update
  using (project_id in (select project_id from project_members where user_id = auth.uid()))
  with check (project_id in (select project_id from project_members where user_id = auth.uid()));

create policy "Admins delete tasks" on tasks for delete
  using (project_id in (select project_id from project_members where user_id = auth.uid() and role = 'admin'));
