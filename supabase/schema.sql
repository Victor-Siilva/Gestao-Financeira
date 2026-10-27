create extension if not exists pgcrypto;

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  role text not null,
  pay_type text not null check (pay_type in ('Hora', 'Dia', 'Mês')),
  rate numeric(12, 2) not null check (rate >= 0),
  status text not null default 'Ativo' check (status in ('Ativo', 'Inativo')),
  created_at timestamptz not null default now()
);

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  description text not null,
  category text not null,
  amount numeric(12, 2) not null check (amount > 0),
  entry_date date not null default current_date,
  entry_type text not null check (entry_type in ('Receita', 'Despesa')),
  created_at timestamptz not null default now()
);

create table if not exists public.work_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  employee_id uuid not null,
  employee_name text not null,
  role text not null,
  pay_type text not null check (pay_type in ('Hora', 'Dia')),
  rate numeric(12, 2) not null check (rate >= 0),
  work_date date not null,
  quantity numeric(12, 2) not null check (quantity > 0),
  created_at timestamptz not null default now()
);

alter table public.employees
  add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.employees alter column owner_id set default auth.uid();

alter table public.entries
  add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.entries alter column owner_id set default auth.uid();

alter table public.work_records enable row level security;
alter table public.employees enable row level security;
alter table public.entries enable row level security;

drop policy if exists "employees_select_own" on public.employees;
create policy "employees_select_own" on public.employees
  for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists "employees_insert_own" on public.employees;
create policy "employees_insert_own" on public.employees
  for insert to authenticated with check (owner_id = (select auth.uid()));
drop policy if exists "employees_update_own" on public.employees;
create policy "employees_update_own" on public.employees
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
drop policy if exists "employees_delete_own" on public.employees;
create policy "employees_delete_own" on public.employees
  for delete to authenticated using (owner_id = (select auth.uid()));

drop policy if exists "entries_select_own" on public.entries;
create policy "entries_select_own" on public.entries
  for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists "entries_insert_own" on public.entries;
create policy "entries_insert_own" on public.entries
  for insert to authenticated with check (owner_id = (select auth.uid()));
drop policy if exists "entries_update_own" on public.entries;
create policy "entries_update_own" on public.entries
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
drop policy if exists "entries_delete_own" on public.entries;
create policy "entries_delete_own" on public.entries
  for delete to authenticated using (owner_id = (select auth.uid()));

drop policy if exists "work_records_select_own" on public.work_records;
create policy "work_records_select_own" on public.work_records
  for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists "work_records_insert_own" on public.work_records;
create policy "work_records_insert_own" on public.work_records
  for insert to authenticated with check (owner_id = (select auth.uid()));
drop policy if exists "work_records_update_own" on public.work_records;
create policy "work_records_update_own" on public.work_records
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
drop policy if exists "work_records_delete_own" on public.work_records;
create policy "work_records_delete_own" on public.work_records
  for delete to authenticated using (owner_id = (select auth.uid()));

revoke all on public.employees, public.entries, public.work_records from anon;
grant select, insert, update, delete
  on public.employees, public.entries, public.work_records to authenticated;
