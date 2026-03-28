# Changelog - Code Quality Fixes & UX Improvements

## Branch: `fix/code-quality-improvements`
Branched from: `v2`

---

## v2.3.1 - Code Quality, Bug Fixes & Mobile UX

### Critical Fixes ✅

| # | File | Issue | Fix |
|---|------|-------|-----|
| 1 | `NoteEditor.tsx` | `saveTimeoutRef` uses `useState` instead of `useRef` → concurrent saves | ✅ `useRef` + proper timeout cleanup |
| 2 | `TiptapEditor.tsx` | `useEffect` for keydown listener has no dependency array → memory leak | ✅ Added `[editor, notes]` dependency array |
| 3 | `TiptapEditor.tsx` | `editor` referenced before `useEditor` definition | ✅ Moved keyboard handler below `useEditor` |
| 4 | `NoteEditor.tsx` | Markdown export produces corrupted output | ✅ Replaced `markdown-it` with `turndown` |

### Error Handling ✅

| # | File | Fix |
|---|------|-----|
| 5 | `NoteEditor.tsx` | ✅ `loadNote()` - redirect to /app on error |
| 6 | `NoteEditor.tsx` | ✅ `loadFolders()` / `loadTags()` - console.error |
| 7 | `NoteEditor.tsx` | ✅ `deleteNote()` / `archiveNote()` - alert on failure |
| 8 | `NoteEditor.tsx` | ✅ Tag/folder operations - error check |
| 9 | `Sidebar.tsx` | ✅ All operations - error check |
| 10 | `Sidebar.tsx` | ✅ Search - error handling |
| 11 | `Sidebar.tsx` | ✅ `loadSharedNotes` - handle missing table |

### Performance ✅

| # | File | Fix |
|---|------|-----|
| 13 | 10+ files | ✅ Cached `createSupabaseBrowserClient` with `useRef` |
| 15 | `Sidebar.tsx` | ✅ Added 300ms debounce to search |

### Security ✅

| # | File | Fix |
|---|------|-----|
| 17 | `Sidebar.tsx` | ✅ Admin link hidden for non-admin users |

### Code Quality ✅

| # | File | Fix |
|---|------|-----|
| 20 | `tags/page.tsx` | ✅ CSS uses CSS variables |
| 21 | `utils.ts` | ✅ `COLOR_OPTIONS` exported, `isAdmin()` added |
| 23 | `profile/page.tsx` | ✅ Removed unused `currentPassword` |
| — | `package.json` | ✅ Removed 6 unused dependencies |

### Mobile Responsive ✅

| # | Change | Details |
|---|--------|---------|
| M1 | NoteEditor toolbar | 2-row layout on mobile: [Done][Title] + [Actions] |
| M2 | Done button | Replaces back arrow, exits to /app |
| M3 | Dashboard welcome | "Welcome, {name}" right-aligned on mobile |
| M4 | Dashboard cards | Centered text, reduced gap/padding on mobile |
| M5 | Sidebar mobile | Fullscreen when open (100% width) |
| M6 | Sidebar desktop | Resizable with drag handle, saved to localStorage |
| M7 | Context menus | Close on click-outside (data-context-menu) |
| M8 | H1/H2 margins | Reduced on mobile via media query |
| M9 | Editor padding | Top padding reduced (24px → 8px) |
| M10 | First child | No margin-top on first h1/h2/h3/p in editor |
| M11 | Folder path | Inline breadcrumb before note title |
| M12 | Welcome note | Reappears when user has no notes |

### Pending (is_pinned column)

| # | Issue | Status |
|---|-------|--------|
| P1 | `is_pinned` column missing from Supabase | ⏳ Waiting for PostgREST cache refresh |
| P2 | `note_collaborators` table 404 | ✅ Silently handled |

---

## Commits (10 total)
```
a6a7872 feat: inline folder path before editable note title
79c2b30 fix: match folder path font size to title, add space separator
a3c745b fix: reduce top spacing in note editor
bf597f6 feat: show folder path breadcrumb in note editor header
22e9895 fix: handle missing note_collaborators table gracefully
6853176 feat: mobile responsive improvements and UX polish
3744224 chore: remove unused dependencies
0dc211b docs: update CHANGELOG with fix status
b655ef0 fix: performance, security, and code quality improvements
57b6020 fix: critical bugs and error handling
```

## How to revert
```bash
git checkout v2
```

## Environment
Add to `.env.local`:
```
NEXT_PUBLIC_ADMIN_EMAILS=your-admin@email.com
ADMIN_EMAILS=your-admin@email.com
```

## Database Migrations
Run in Supabase SQL Editor:
```sql
-- Add is_pinned column (for Favorites/Pin feature)
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- Refresh PostgREST schema cache
SELECT pg_notify('pgrst', 'reload schema');
```
