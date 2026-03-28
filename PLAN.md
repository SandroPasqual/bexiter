# Bexiter - Development History

## Philosophy

Open app → write. No friction, no complexity.

---

## v2.3 - Current Version

### Implemented Features

#### 1. Keyboard Shortcuts
- **Cmd/Ctrl + K** - opens link dropdown
- **Escape** - closes dropdowns
- Built-in TipTap shortcuts:
  - Cmd/Ctrl + B = bold
  - Cmd/Ctrl + I = italic
  - Cmd/Ctrl + U = underline
  - Cmd/Ctrl + Z = undo
  - Cmd/Ctrl + Shift + Z = redo

#### 2. Export Options
- Export as HTML (original)
- Export as Markdown (.md) - NEW
- Dropdown menu for format selection

#### 3. Welcome Note (Onboarding)
- Auto-created once per user (uses localStorage to track)
- Contains:
  - Welcome message
  - Demo of all formatting options (bold, italic, lists, headings, links, quotes, code)
  - Export/Import instructions
  - Keyboard shortcuts reference
  - Organization tips (folders, favorites, tags, archive)
- User can delete when ready

#### 4. Archive - Real-time Updates
- When archiving/unarchiving notes:
  - Sidebar updates automatically (via event dispatch)
  - Archive page updates automatically
  - No page refresh needed

#### 5. Checklists (Task Lists)
- New button in toolbar (checkbox icon)
- Creates interactive todo lists
- Check/uncheck items with click
- Strikethrough completed items

#### 6. Tables
- New button in toolbar opens dropdown
- Select from preset sizes: 2x2 to 4x4
- Header row included
- Styled for light/dark themes
- Cells have padding and borders

---

## v2.2 - Previous Version

### Implemented Features

#### 1. Sidebar - File Manager Structure
- Hierarchical folders (folder in folder)
- Favorites section (pinned notes) at top
- Unified list: Favorites → Folders → Unfiled Notes
- Real-time updates (no refresh needed for new notes)

#### 2. Context Menu (3 dots) for Notes & Folders

**Notes:**
- Rename - inline edit
- Move - dropdown to select folder
- Pin/Unpin - add to Favorites
- Archive - move to archive
- Delete - confirm and delete

**Folders:**
- Rename - inline edit
- Move - dropdown to select parent folder
- Delete - confirm (notes moved out, not deleted)

#### 3. Link System in Editor
- Button Link in toolbar opens dropdown
- Two modes: URL or Note
- Search notes by typing (filters automatically)
- Links displayed as underlined text (visible on both light/dark themes)
- Click on internal link navigates to note

#### 4. Note Display (Dashboard)
- Recent Notes section shows plain text excerpt (no HTML)
- Fixed with stripHtml() utility function

### Database Changes (v2.2)

```sql
-- Add is_pinned to notes
ALTER TABLE notes ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;
```

---

## v2.1 - Previous Version

### Editor - WYSIWYG (TipTap)

Replace markdown textarea with rich text editor.

**Formatting:**
- Formatted text (bold, italic, underline)
- H1, H2, H3 headings
- Lists (bullet, numbered) - with visible markers
- Code blocks
- Links (external and internal)
- Blockquotes - styled with border and background

**Paste behavior:**
- Google Docs → preserves structure
- Word → preserves structure
- Web → cleans and formats

### Text Templates (3 modes)

| Mode | Font | Line-height | Padding | Max-width | Use case |
|---|---|---|---|---|---|
| Compact | 14px | 1.4 | 16px | 100% | Quick notes, dense info |
| Medium | 16px | 1.6 | 24px | 800px | Default, balanced |
| Reader | 18px | 1.8 | 32px | 680px | Long reads, comfortable |

Toggle in editor header. Saves preference per note.

### Auth Simplified

- Email confirmation DISABLED
- Signup → auto-login → direct to app
- Login → email + password → direct to app

### Data Storage

Content stored as HTML (not markdown) in Supabase `notes.content`.

---

## Architecture

```
src/
  app/
    (auth)/
      login/          # Login page
      signup/         # Signup page (auto-login)
      forgot-password/ # Password reset request
    auth/
      callback/       # Supabase auth callback
      reset-password/ # Set new password
    app/
      layout.tsx      # App shell with sidebar
      page.tsx        # Dashboard
      note/[id]/      # Note editor (WYSIWYG)
      tags/           # Tag management
      archive/        # Archived notes
      profile/        # User profile
      admin/          # Admin panel (owner only)
    api/
      mcp/            # MCP API (secured)
      admin/users/    # Admin user management

  components/
    Sidebar.tsx       # Navigation, file manager, notes list
    TiptapEditor.tsx  # WYSIWYG editor
    NoteEditor.tsx     # Note page with toolbar
    ShareDialog.tsx    # Collaboration dialog
    Providers.tsx      # Context providers

  contexts/
    AuthContext.tsx    # Auth state and methods
    ThemeContext.tsx   # Theme toggle

  lib/
    supabase.ts       # Supabase clients
    utils.ts          # Utilities (stripHtml, etc)

  types/
    index.ts          # TypeScript types
```

---

## What Stays Deactivated (not deleted)

These features were implemented in v2 and remain in code:
- MCP API (secured) - available when needed
- Forgot/Reset password pages - functional but simplified
- Admin panel - functional
- Collaboration - functional
- Tags system - functional

---

## Dependencies Added (v2.3)

```bash
npm install @tiptap/extension-task-list @tiptap/extension-task-item @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header
```

---

## What We Don't Touch

- Supabase backend (works, don't rebuild)
- RLS policies (work, don't overthink)
- Deployment (local for now, Vercel later)
- Email configuration (disabled confirmation, done)

---

## Running the App

```bash
npm run dev
```

Server runs on http://localhost:3000

To keep server running after terminal closes:
```bash
nohup npm run dev &
```

---

## Future Ideas (not implemented)

- PWA / Offline mode
- Collaboration (async, not simultaneous)
- Version history
- Tables in editor
- Images in notes
- PDF/DOCX export
- Checklists
- Reminders / Due dates
- White label
- MCP + RAG for AI assistant
