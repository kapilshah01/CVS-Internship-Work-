# Database Setup

## 1. Create Supabase project

1. Open `https://supabase.com/dashboard`.
2. Create a new project.
3. Copy the project URL and anon key from `Project Settings -> API`.

## 2. Add env vars to the app

Create `china_consultant/.env` with:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 3. Run the database schema

1. Open `SQL Editor` in Supabase.
2. Paste the contents of `supabase_schema.sql`.
3. Run the query.

This creates:

- `profiles`: one row per authenticated user, with `role` and `status`
- `appointments`: customer and public booking records
- `invoices`: employee/admin-created invoices

## 4. Create your first users

Use `Authentication -> Users -> Add user` for:

- Admin
- Employee
- Customer

After each user is created, go to `Table Editor -> profiles` and set:

- Admin: `role = admin`, `status = active`
- Employee: `role = employee`, `status = active`
- Customer: `role = customer`, `status = active`

You can also let users sign up from the app:

- Customers become `active`
- Employees become `pending`
- Admin registrations become `pending`

Then approve them from the admin dashboard or directly in Supabase `profiles`.

## 5. Access rules

- Customer:
  - Can log in
  - Can view only their own invoices
  - Can view/book their own appointments in the app
- Employee:
  - Can log in after admin approval
  - Can view users, appointments, and invoices
  - Can create invoices, update appointment/invoice status, and clear completed appointments
- Admin:
  - Can log in after admin approval
  - Can approve or reject users
  - Can view all records

## 6. How to access the database

From Supabase dashboard:

- `Table Editor`: browse and edit `profiles`, `appointments`, `invoices`
- `Authentication -> Users`: manage sign-ins and send password reset emails
- `SQL Editor`: run queries, fixes, and migrations

Useful queries:

```sql
select * from public.profiles order by created_at desc;
select * from public.appointments order by created_at desc;
select * from public.invoices order by created_at desc;
```

If employees should be allowed to clear only completed appointments, run this once in `SQL Editor`:

```sql
drop policy if exists "appointments_delete_completed_staff" on public.appointments;
create policy "appointments_delete_completed_staff"
on public.appointments
for delete
using (public.is_staff() and status = 'completed');
```

If invoice creation fails with `stack depth limit exceeded`, run this once in `SQL Editor`:

```sql
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
```

## 7. Notes

- The old browser-only dummy storage is no longer the main data source.
- Employee password reset from the admin UI is not included in this frontend-only version.
- If you want admin-managed password resets later, add a secure server function using the Supabase service role.
