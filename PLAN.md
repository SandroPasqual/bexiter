# Bexiter v2.1 - Development Plan

## Philosophy

Open app → write. No friction, no complexity.

## Current State (v2)

Implemented and working:
- Auth (email/password via Supabase)
- Markdown editor with preview
- Folders, tags, search
- Collaboration with roles
- Admin panel
- Export, archive, auto-save
- MCP API (secured)

## What Changes in v2.1

### 1. Editor - WYSIWYG (TipTap)

Replace markdown textarea with rich text editor.

**What user sees:**
- Formatted text (bold, italic, underline)
- H1, H2, H3 headings
- Lists (bullet, numbered)
- Code blocks
- Links

**What user doesn't see:**
- Markdown syntax
- Raw HTML

**Paste behavior:**
- Google Docs → preserves structure
- Word → preserves structure
- Web → cleans and formats

### 2. Text Templates (3 modes)

| Mode | Font | Line-height | Padding | Max-width | Use case |
|---|---|---|---|---|---|
| Compact | 14px | 1.4 | 16px | 100% | Quick notes, dense info |
| Medium | 16px | 1.6 | 24px | 800px | Default, balanced |
| Reader | 18px | 1.8 | 32px | 680px | Long reads, comfortable |

Toggle in editor header. Saves preference per note.

### 3. Auth Simplified

- Email confirmation DISABLED
- Signup → auto-login → direct to app
- Login → email + password → direct to app

### 4. Data Storage

Content stored as HTML (not markdown) in Supabase `notes.content`.

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
    Sidebar.tsx       # Navigation, search, notes list
    TiptapEditor.tsx  # WYSIWYG editor component (NEW)
    ShareDialog.tsx   # Collaboration dialog
    Providers.tsx     # Context providers

  contexts/
    AuthContext.tsx    # Auth state and methods
    ThemeContext.tsx   # Theme toggle

  lib/
    supabase.ts       # Supabase clients
    utils.ts          # Utilities

  types/
    index.ts          # TypeScript types
```

## Components Map

```
┌─ App Layout ─────────────────────────────┐
│ ┌─ Sidebar ─┐ ┌─ Main Content ─────────┐ │
│ │ Search     │ │                        │ │
│ │ Folders    │ │  Page content          │ │
│ │ Notes      │ │  (Dashboard/Editor/    │ │
│ │ Shared     │ │   Tags/Archive/        │ │
│ │ Tags       │ │   Profile/Admin)       │ │
│ │ Archive    │ │                        │ │
│ │ Admin      │ │                        │ │
│ │ [Profile]  │ │                        │ │
│ └────────────┘ └────────────────────────┘ │
└──────────────────────────────────────────┘
```

## Editor Structure (v2.1)

```
┌─ Note Editor ────────────────────────────┐
│ [←] [Title]         [Save] [Share] [...] │
│ [Bold][Italic][H1][H2][H3][List][Code]   │
│ [Compact][Medium*][Reader]  [Export]     │
│ ┌─────────────────────────────────────┐  │
│ │                                     │  │
│ │  WYSIWYG content area              │  │
│ │  (TipTap)                           │  │
│ │                                     │  │
│ │  - What you see is what you get     │  │
│ │  - No markdown visible              │  │
│ │  - Paste works naturally            │  │
│ │                                     │  │
│ └─────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

## Implementation Order

1. Install TipTap dependencies
2. Create TiptapEditor component
3. Replace textarea in NoteEditor
4. Add template toggle (compact/medium/reader)
5. Simplify signup (auto-login)
6. Test + iterate

## What Stays Deactivated (not deleted)

These features were implemented in v2 and remain in code:
- MCP API (secured) - available when needed
- Forgot/Reset password pages - functional but simplified
- Admin panel - functional
- Collaboration - functional

## What We Don't Touch

- Supabase backend (works, don't rebuild)
- RLS policies (work, don't overthink)
- Deployment (local for now, Vercel later)
- Email configuration (disabled confirmation, done)
