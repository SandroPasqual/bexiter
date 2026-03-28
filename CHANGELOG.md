# Changelog - Code Quality Fixes

## Branch: `fix/code-quality-improvements`
Branched from: `v2`

---

## v2.3.1 - Code Quality & Bug Fixes

### Critical Fixes

| # | File | Issue | Fix |
|---|------|-------|-----|
| 1 | `NoteEditor.tsx:46` | `saveTimeoutRef` uses `useState` instead of `useRef` → concurrent saves, race conditions | Use `useRef` + proper timeout cleanup |
| 2 | `TiptapEditor.tsx:86-109` | `useEffect` for keydown listener has no dependency array → memory leak on every render | Add `[editor, notes]` dependency array |
| 3 | `TiptapEditor.tsx:86` | `editor` referenced before `useEditor` definition on line 121 | Move keyboard handler below `useEditor` |
| 4 | `NoteEditor.tsx:169-180` | Markdown export uses `markdown-it` (MD→HTML) on HTML content → corrupted output | Replace with `turndown` (HTML→MD) |

### Error Handling (High)

| # | File | Issue |
|---|------|-------|
| 5 | `NoteEditor.tsx:70-81` | `loadNote()` - no handling for missing notes (blank page) |
| 6 | `NoteEditor.tsx:94-108` | `loadFolders()` / `loadTags()` - silent failures |
| 7 | `NoteEditor.tsx:202-218` | `deleteNote()` / `archiveNote()` - no error check, navigates away on failure |
| 8 | `NoteEditor.tsx:360-418` | Tag/folder operations - no error check, UI/DB desync |
| 9 | `Sidebar.tsx` | `moveNote()`, `moveFolder()`, `archiveNote()`, `deleteNote()`, `togglePinNote()`, `renameItem()`, `deleteFolder()` - all silent |
| 10 | `Sidebar.tsx:569-578` | Search - no error handling |
| 11 | `ShareDialog.tsx:85-93` | `removeCollaborator()` / `updateRole()` - optimistic update without rollback |
| 12 | `app/app/page.tsx` | Dashboard - no loading state, no error handling |

### Performance (Medium)

| # | File | Issue | Fix |
|---|------|-------|-----|
| 13 | Multiple (8+ files) | `createSupabaseBrowserClient()` called on every render | Cache with `useRef` |
| 14 | `Sidebar.tsx:809,816` | `buildFolderTree()` computed twice per render | Use `useMemo` |
| 15 | `Sidebar.tsx:425-432` | Search fires query on every keystroke | Add debounce (300ms) |
| 16 | `Sidebar.tsx` | `NoteItem` / `FolderItem` re-render on any state change | Use `React.memo` |

### Security (Medium)

| # | File | Issue | Fix |
|---|------|-------|-----|
| 17 | `Sidebar.tsx:955-963` | Admin link visible to all users | Hide for non-admins |
| 18 | `NoteEditor.tsx:116` | No input length validation on note title/content | Add max length |
| 19 | `ShareDialog.tsx` | No email format validation in JS | Add validation |

### Code Quality (Medium)

| # | File | Issue | Fix |
|---|------|-------|-----|
| 20 | `tags/page.tsx` | Inconsistent hardcoded colors instead of CSS variables | Use `var(--accent)` etc. |
| 21 | `tags/page.tsx` + `utils.ts` | Duplicated `colorOptions` array | Export from `utils.ts` |
| 22 | `NoteEditor.tsx:34` | Template mode not persisted per note (PLAN.md says it should) | Save to DB |
| 23 | `profile/page.tsx:16,84` | `currentPassword` collected but unused | Remove from UI |
| 24 | `globals.css:224-232` | `button { transition: all }` - inefficient global override | Target specific properties |

---

## How to revert
```bash
git checkout v2
```
