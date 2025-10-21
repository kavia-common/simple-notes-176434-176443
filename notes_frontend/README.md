# Simple Notes – React + Supabase

A simple note-taking app where users can create, edit, view, and delete notes.  
Styled with the Ocean Professional theme (blue & amber accents).

## Features
- Create, edit, and delete notes
- Notes listed in reverse chronological order by updated time
- Accessible UI: semantic roles, aria labels, focus management in modal
- Optional realtime updates via Supabase Realtime (disabled by default)
- Clean, modern design using CSS only (no UI frameworks)

## Requirements
Environment variables (set in `.env` in the container root or project root recognized by CRA):
- REACT_APP_SUPABASE_URL=your_supabase_url
- REACT_APP_SUPABASE_KEY=your_supabase_anon_or_service_key
- REACT_APP_SUPABASE_ENABLE_REALTIME=true (optional; defaults to false)

If URL or KEY are missing, the app renders but will show an empty state and console warning.

## Supabase Table
Create a table named `notes` with the following columns:
- id: uuid (primary key, default gen_random_uuid() or uuid_generate_v4())
- title: text
- content: text
- created_at: timestamp with time zone, default now()
- updated_at: timestamp with time zone, update this on insert/update (via trigger or managed in queries)

RLS: Permit anon read/write as suits your environment (or use policies aligned with your auth model).

## Scripts
- npm install
- npm start
- npm run build
- npm test

## File Structure
- src/supabaseClient.js — initializes Supabase client from env variables
- src/services/notesService.js — CRUD and optional realtime subscription
- src/components/Header.js — App header with New Note action
- src/components/NotesList.js — Cards list with edit/delete
- src/components/NoteEditorModal.js — Modal for create/edit (title required)
- src/components/EmptyState.js — Prompt to create first note
- src/App.js — App shell, state, handlers, and rendering
- src/App.css, src/index.css — Ocean Professional styles

## Styling – Ocean Professional
- Primary: #2563EB
- Secondary/Success: #F59E0B
- Error: #EF4444
- Text: #111827
- Background: #f9fafb
- Surface: #ffffff

Includes subtle gradients, rounded corners, shadows, and smooth transitions.

## Notes
- Realtime is disabled unless explicitly enabled via `REACT_APP_SUPABASE_ENABLE_REALTIME`.
- The UI includes helpful error messages if requests fail.
