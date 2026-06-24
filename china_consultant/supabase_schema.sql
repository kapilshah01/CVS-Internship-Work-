-- China Visa Service Consultancy
-- Production-ready Supabase schema
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  phone text,
  role text not null default 'employee' check (role in ('admin', 'employee')),
  status text not null default 'pending' check (status in ('active', 'pending', 'rejected')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, phone, role, status)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, ''), '@', 1)),
    new.raw_user_meta_data ->> 'phone',
    coalesce(new.raw_user_meta_data ->> 'role', 'employee'),
    coalesce(new.raw_user_meta_data ->> 'status', 'pending')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    name = excluded.name,
    phone = excluded.phone,
    role = excluded.role,
    status = excluded.status,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute procedure public.touch_updated_at();

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  phone text,
  country text,
  source text not null default 'website',
  status text not null default 'new' check (status in ('new', 'active', 'reviewing', 'closed')),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists clients_touch_updated_at on public.clients;
create trigger clients_touch_updated_at
before update on public.clients
for each row execute procedure public.touch_updated_at();

create table if not exists public.countries (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists countries_touch_updated_at on public.countries;
create trigger countries_touch_updated_at
before update on public.countries
for each row execute procedure public.touch_updated_at();

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  country text,
  subject text not null default 'Visa Inquiry',
  message text not null,
  status text not null default 'new' check (status in ('new', 'reviewing', 'resolved', 'closed')),
  source text not null default 'website',
  client_id uuid references public.clients(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists inquiries_touch_updated_at on public.inquiries;
create trigger inquiries_touch_updated_at
before update on public.inquiries
for each row execute procedure public.touch_updated_at();

create table if not exists public.appointments (
  id text primary key,
  client_name text not null,
  email text not null,
  phone text,
  country text not null,
  visa_type text,
  purpose text,
  date date not null,
  time text not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  notes text,
  created_date date not null default current_date,
  customer_id uuid references public.clients(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists appointments_touch_updated_at on public.appointments;
create trigger appointments_touch_updated_at
before update on public.appointments
for each row execute procedure public.touch_updated_at();

create table if not exists public.invoices (
  id text primary key,
  client text not null,
  passport text not null,
  passport_list jsonb not null default '[]'::jsonb,
  traveler_count integer not null default 1,
  invoice_mode text not null default 'personal' check (invoice_mode in ('personal', 'group')),
  country text not null,
  visa_type text not null,
  amount numeric(12,2) not null default 0,
  subtotal numeric(12,2) not null default 0,
  tax_rate numeric(8,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  status text not null default 'draft' check (status in ('paid', 'pending', 'draft')),
  date date not null default current_date,
  issue_date date,
  due_date date,
  email text,
  notes text,
  payment_terms text,
  payment_method text,
  currency text not null default 'NPR',
  service_items jsonb not null default '[]'::jsonb,
  customer_id uuid references public.clients(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists invoices_touch_updated_at on public.invoices;
create trigger invoices_touch_updated_at
before update on public.invoices
for each row execute procedure public.touch_updated_at();

create table if not exists public.service_catalog (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  icon text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists service_catalog_touch_updated_at on public.service_catalog;
create trigger service_catalog_touch_updated_at
before update on public.service_catalog
for each row execute procedure public.touch_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role in ('admin', 'employee') and status = 'active'
  );
$$;

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.countries enable row level security;
alter table public.inquiries enable row level security;
alter table public.appointments enable row level security;
alter table public.invoices enable row level security;
alter table public.service_catalog enable row level security;

drop policy if exists "profiles_select_self_or_staff" on public.profiles;
create policy "profiles_select_self_or_staff"
on public.profiles
for select
using (auth.uid() = id or public.is_staff());

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
on public.profiles
for update
using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin"
on public.profiles
for delete
using (public.is_admin());

drop policy if exists "clients_select_staff" on public.clients;
create policy "clients_select_staff"
on public.clients
for select
using (public.is_staff());

drop policy if exists "clients_insert_public" on public.clients;
create policy "clients_insert_public"
on public.clients
for insert
with check (true);

drop policy if exists "clients_update_staff" on public.clients;
create policy "clients_update_staff"
on public.clients
for update
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "clients_delete_admin" on public.clients;
create policy "clients_delete_admin"
on public.clients
for delete
using (public.is_admin());

drop policy if exists "countries_select_public" on public.countries;
create policy "countries_select_public"
on public.countries
for select
using (true);

drop policy if exists "countries_insert_staff" on public.countries;
create policy "countries_insert_staff"
on public.countries
for insert
with check (public.is_staff());

drop policy if exists "countries_update_staff" on public.countries;
create policy "countries_update_staff"
on public.countries
for update
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "countries_delete_admin" on public.countries;
create policy "countries_delete_admin"
on public.countries
for delete
using (public.is_admin());

drop policy if exists "inquiries_select_staff" on public.inquiries;
create policy "inquiries_select_staff"
on public.inquiries
for select
using (public.is_staff());

drop policy if exists "inquiries_insert_public" on public.inquiries;
create policy "inquiries_insert_public"
on public.inquiries
for insert
with check (true);

drop policy if exists "inquiries_update_staff" on public.inquiries;
create policy "inquiries_update_staff"
on public.inquiries
for update
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "inquiries_delete_admin" on public.inquiries;
create policy "inquiries_delete_admin"
on public.inquiries
for delete
using (public.is_admin());

drop policy if exists "appointments_select_public_or_owner_or_staff" on public.appointments;
create policy "appointments_select_public_or_owner_or_staff"
on public.appointments
for select
using (true);

drop policy if exists "appointments_insert_public" on public.appointments;
create policy "appointments_insert_public"
on public.appointments
for insert
with check (true);

drop policy if exists "appointments_update_staff" on public.appointments;
create policy "appointments_update_staff"
on public.appointments
for update
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "appointments_delete_admin" on public.appointments;
create policy "appointments_delete_admin"
on public.appointments
for delete
using (public.is_admin());

drop policy if exists "invoices_select_staff" on public.invoices;
create policy "invoices_select_staff"
on public.invoices
for select
using (public.is_staff());

drop policy if exists "invoices_insert_staff" on public.invoices;
create policy "invoices_insert_staff"
on public.invoices
for insert
with check (public.is_staff());

drop policy if exists "invoices_update_staff" on public.invoices;
create policy "invoices_update_staff"
on public.invoices
for update
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "invoices_delete_admin" on public.invoices;
create policy "invoices_delete_admin"
on public.invoices
for delete
using (public.is_admin());

drop policy if exists "service_catalog_select_public" on public.service_catalog;
create policy "service_catalog_select_public"
on public.service_catalog
for select
using (true);

drop policy if exists "service_catalog_insert_staff" on public.service_catalog;
create policy "service_catalog_insert_staff"
on public.service_catalog
for insert
with check (public.is_staff());

drop policy if exists "service_catalog_update_staff" on public.service_catalog;
create policy "service_catalog_update_staff"
on public.service_catalog
for update
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "service_catalog_delete_admin" on public.service_catalog;
create policy "service_catalog_delete_admin"
on public.service_catalog
for delete
using (public.is_admin());

insert into public.service_catalog (title, description, icon, sort_order)
values
  ('Tourist Visa', 'Complete assistance for leisure and sightseeing visa applications with documentation support.', '🛂', 1),
  ('Business Visa', 'Professional visa processing for business travelers, trade delegates, and corporate representatives.', '💼', 2),
  ('Student Visa', 'Comprehensive support for students seeking to study abroad with scholarship and university guidance.', '🎓', 3),
  ('Family Reunion Visa', 'Expert assistance for family reunion and dependent visa applications with proper documentation.', '👨‍👩‍👧‍👦', 4),
  ('Transit Visa', 'Quick processing for transit visa requirements for travelers passing through supported countries.', '✈️', 5),
  ('Document Verification', 'Professional verification and authentication of all required travel and visa documents.', '📋', 6)
on conflict do nothing;

insert into public.countries (name, code, sort_order)
values
  ('China', 'CN', 1),
  ('Japan', 'JP', 2),
  ('South Korea', 'KR', 3)
on conflict (name) do nothing;
