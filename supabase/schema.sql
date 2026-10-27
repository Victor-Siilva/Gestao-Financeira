-- Gestão de Finanças: schema inicial. Revise as regras de acesso antes de usar em produção.
create extension if not exists pgcrypto;

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  pay_type text not null check (pay_type in ('Hora','Dia','Mês')),
  rate numeric(12,2) not null check (rate >= 0),
  status text not null default 'Ativo' check (status in ('Ativo','Inativo')),
  created_at timestamptz not null default now()
);

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  category text not null,
  amount numeric(12,2) not null check (amount > 0),
  entry_date date not null default current_date,
  entry_type text not null check (entry_type in ('Receita','Despesa')),
  created_at timestamptz not null default now()
);

-- Não habilite acesso público sem autenticação e políticas adequadas.
alter table public.employees enable row level security;
alter table public.entries enable row level security;

-- Para produção: crie tabela de empresas e memberships, associe cada linha
-- a company_id e escreva policies que restrinjam o acesso aos membros da empresa.
-- As policies abaixo são intencionalmente omitidas para evitar expor dados financeiros.
