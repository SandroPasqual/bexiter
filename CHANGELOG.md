# Changelog - Code Quality Fixes

## Branch: `fix/code-quality-improvements`
Branched from: `v2`

---

## v2.3.1 - Code Quality & Bug Fixes

### Critical Fixes ✅

| # | File | Issue | Fix |
|---|------|-------|-----|
| 1 | `NoteEditor.tsx:46` | `saveTimeoutRef` uses `useState` instead of `useRef` → concurrent saves | ✅ Fixed: `useRef` + proper timeout cleanup |
| 2 | `TiptapEditor.tsx:86-109` | `useEffect` for keydown listener has no dependency array → memory leak | ✅ Fixed: Added `[editor, notes]` dependency array |
| 3 | `TiptapEditor.tsx:86` | `editor` referenced before `useEditor` definition | ✅ Fixed: Moved keyboard handler below `useEditor` |
| 4 | `NoteEditor.tsx:169-180` | Markdown export produces corrupted output | ✅ Fixed: Replaced `markdown-it` with `turndown` |

### Error Handling ✅

| # | File | Fix |
|---|------|-----|
| 5 | `NoteEditor.tsx` | ✅ `loadNote()` - redirect to /app on error or missing note |
| 6 | `NoteEditor.tsx` | ✅ `loadFolders()` / `loadTags()` - console.error on failure |
| 7 | `NoteEditor.tsx` | ✅ `deleteNote()` / `archiveNote()` - alert on failure, don't navigate |
| 8 | `NoteEditor.tsx` | ✅ Tag/folder operations - error check before UI update |
| 9 | `Sidebar.tsx` | ✅ All operations (move, archive, delete, pin, rename) - error check |
| 10 | `Sidebar.tsx` | ✅ Search - error handling added |
| 11 | `ShareDialog.tsx` | Skipped - lower priority |
| 12 | `app/app/page.tsx` | Skipped - lower priority |

### Performance ✅

| # | File | Fix |
|---|------|-----|
| 13 | 10+ files | ✅ Cached `createSupabaseBrowserClient` with `useRef` |
| 14 | `Sidebar.tsx` | Skipped - `useMemo` improvement deferred |
| 15 | `Sidebar.tsx` | ✅ Added 300ms debounce to search |
| 16 | `Sidebar.tsx` | Skipped - `React.memo` deferred |

### Security ✅

| # | File | Fix |
|---|------|-----|
| 17 | `Sidebar.tsx` | ✅ Admin link hidden for non-admin users |
| 18 | `NoteEditor.tsx` | Skipped - input validation deferred |
| 19 | `ShareDialog.tsx` | Skipped - email validation deferred |

### Code Quality ✅

| # | File | Fix |
|---|------|-----|
| 20 | `tags/page.tsx` | ✅ CSS uses CSS variables now |
| 21 | `tags/page.tsx` + `utils.ts` | ✅ `COLOR_OPTIONS` exported from `utils.ts` |
| 22 | `NoteEditor.tsx` | Skipped - template persistence requires DB migration |
| 23 | `profile/page.tsx` | ✅ Removed unused `currentPassword` state |
| 24 | `globals.css` | Skipped - low priority |

---

## Commits
1. `docs: add CHANGELOG and update VERSIONING` - Initial documentation
2. `fix: critical bugs and error handling` - Fixes #1-4, #5-10, #15
3. `fix: performance, security, and code quality` - Fixes #13, #17, #20, #21, #23

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
