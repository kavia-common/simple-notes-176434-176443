# Supabase Setup for Simple Notes (React)

This document explains how to configure Supabase for the Simple Notes app and create the required schema.

## 1) Environment variables

Set these in your `.env` used by Create React App (CRA). CRA only exposes variables prefixed with `REACT_APP_`:

- REACT_APP_SUPABASE_URL=your_supabase_project_url (e.g. https://your-project-id.supabase.co)
- REACT_APP_SUPABASE_KEY=your_anon_public_key

Optional:
- REACT_APP_SUPABASE_ENABLE_REALTIME=true

Note:
- If you also set `SUPABASE_URL` / `SUPABASE_KEY`, the app has a fallback, but CRA may not expose them to the browser. Prefer the `REACT_APP_` versions.

After updating `.env`, restart your dev server so CRA picks up changes.

## 2) Required database schema

Create a table named `public.notes` with the following minimal schema. You can run this in the Supabase SQL editor:

```sql
-- Enable extensions if not already enabled
-- For uuid generation and timestamps
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Table: public.notes
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Optional: keep updated_at current on updates using a trigger
create or replace function public.set_notes_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_notes_updated_at on public.notes;
create trigger trg_notes_updated_at
before update on public.notes
for each row execute function public.set_notes_updated_at();
```

## 3) Row Level Security (RLS) policies

If you plan to use the `anon` public key on the frontend (default for this app), you must allow the `anon` role to read and write to the `notes` table, or implement authentication and scope policies accordingly.

Enable RLS:

```sql
alter table public.notes enable row level security;
```

Example permissive policies (for development/demo):

```sql
-- Allow anyone (anon) to select
create policy "Allow anon select notes"
  on public.notes
  for select
  to anon
  using (true);

-- Allow anyone (anon) to insert
create policy "Allow anon insert notes"
  on public.notes
  for insert
  to anon
  with check (true);

-- Allow anyone (anon) to update
create policy "Allow anon update notes"
  on public.notes
  for update
  to anon
  using (true)
  with check (true);

-- Allow anyone (anon) to delete
create policy "Allow anon delete notes"
  on public.notes
  for delete
  to anon
  using (true);
```

For production, restrict these policies to authenticated users and/or owner-based logic.

## 4) Realtime (optional)

If you want realtime updates, enable Realtime for the `public` schema in your Supabase project, and set:
```
REACT_APP_SUPABASE_ENABLE_REALTIME=true
```

## 5) Quick verification

- Ensure `.env` has valid `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_KEY`.
- Create schema above.
- In the browser console, you should see logs:
  - "[Startup] Using Supabase URL host: ..."
  - "[Supabase] Client initialized. URL host: ..."
- Create a note via the UI. It should appear in the list.

You can also test the insert directly in SQL:

```sql
insert into public.notes (title, content) values ('Hello', 'This is a test note')
returning *;
```

If the UI still fails:
- Check the browser console for detailed Supabase error logs.
- Confirm RLS policies allow your role (anon or authenticated) to perform the operation.
