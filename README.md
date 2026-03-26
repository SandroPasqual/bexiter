# Bexiter - Your Personal Knowledge Companion

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
  <img src="https://img.shields.io/github/stars/bexiter/bexiter" alt="Stars">
  <img src="https://img.shields.io/github/forks/bexiter/bexiter" alt="Forks">
</p>

<p align="center">
  A minimalist, secure note-taking app with markdown support, double-links, and MCP integration.
</p>

---

## ✨ Features

- 📝 **Markdown Editor** - Write in markdown with live preview (split/edit/preview modes)
- 📁 **Folders & Tags** - Organize notes your way
- 🔗 **Double Links** - Connect notes with `[[note-name]]` wiki-style links
- 🔍 **Full-text Search** - Find anything instantly
- 🌙 **Dark/Light Theme** - Choose your preferred look
- 📤 **Export** - Download notes as .md files
- 🔐 **Secure** - Your data is protected by Row Level Security (RLS)
- 🤖 **MCP Ready** - Connect to OpenCode and other AI tools

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)

### 1. Clone & Install

```bash
git clone https://github.com/bexiter/bexiter.git
cd bexiter
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the schema in `SUPRBASE_SETUP.md`
3. Get your credentials from **Settings > API**:
   - Project URL
   - `anon` key

### 3. Configure Environment

```bash
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables in Vercel dashboard

---

## 🔐 Security

- **Row Level Security (RLS)** - Each user sees only their own notes
- **Email Authentication** - Secure sign-up with confirmation
- **MCP Access Control** - API endpoints are user-specific
- **Your Data, Your Rules** - No tracking, no analytics

---

## 🤖 MCP Integration

Connect Bexiter to OpenCode or other MCP-compatible tools:

```
POST https://your-deployment.vercel.app/api/mcp
```

Available tools:
- `bexiter_search_notes` - Search by title or content
- `bexiter_get_note` - Get specific note
- `bexiter_list_notes` - List all notes
- `bexiter_create_note` - Create new note
- `bexiter_update_note` - Update existing note
- `bexiter_list_folders` - List folders
- `bexiter_list_tags` - List tags

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth)
- **Markdown:** react-markdown, remark-gfm
- **Editor:** Custom textarea with live preview

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

Made with ❤️ by the Bexiter community