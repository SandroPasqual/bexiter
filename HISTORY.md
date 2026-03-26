# Bexiter - Development History & Documentation

## 📖 Overview

Bexiter is a minimalist, secure note-taking application with markdown support, double-links, and MCP integration. Born from the search for the perfect personal knowledge companion.

**Version:** 1.0.0  
**Status:** Production Ready  
**Live URL:** https://bexiter.vercel.app

---

## 🗣️ Conversation Log

### Initial Request
- User wanted a note-taking platform like Notion
- Requirements: 
  - Cloud-based (not local only)
  - Multi-user support with user/pass + 2FA
  - Free tier
  - Markdown editor with Notion-like styling
  - Folders + tags + search
  - Export functionality
  - Double-links between notes

### Technology Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Backend | **Supabase** | Best free tier, PostgreSQL power, RLS security |
| Frontend | **Next.js 14** | React, TypeScript, great developer experience |
| Styling | **Tailwind CSS** | Rapid development, consistent design |
| Auth | **Supabase Auth** | Email/password with confirmation |
| Deployment | **Vercel** | Free for personal projects, seamless Next.js integration |

### Features Implemented

1. ✅ **Authentication**
   - Email + password signup/login
   - Email confirmation required
   - Session management via Supabase

2. ✅ **Markdown Editor**
   - Three modes: Edit, Preview, Split
   - Toolbar for formatting (bold, italic, headings, lists, code, quotes)
   - Live preview rendering
   - Auto-save every 2 seconds

3. ✅ **Organization**
   - Folders with hierarchical support
   - Tags with custom colors
   - Archive functionality

4. ✅ **Search**
   - Full-text search across titles and content
   - Real-time results in sidebar

5. ✅ **Double Links**
   - Wiki-style `[[note-name]]` links
   - Clickable in preview mode

6. ✅ **Export**
   - Download individual notes as .md files

7. ✅ **Themes**
   - Light/Dark mode
   - System preference detection

8. ✅ **MCP Integration**
   - REST API at `/api/mcp`
   - Tools: search, get, create, update notes/folders/tags

---

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+
- Supabase account
- GitHub account (for cloning)

### Local Development

```bash
# Clone the repository
git clone https://github.com/SandroPasqual/bexiter.git
cd bexiter

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Add your Supabase credentials

# Run locally
npm run dev
```

### Database Setup

1. Create a Supabase project
2. Go to SQL Editor
3. Run the schema from `SUPRBASE_SETUP.md`

### Deployment

1. Push to GitHub
2. Import to Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 📁 Project Structure

```
bexiter/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── app/
│   │   │   ├── note/[id]/
│   │   │   ├── archive/
│   │   │   └── tags/
│   │   ├── api/
│   │   │   └── mcp/
│   │   └── auth/
│   │       └── callback/
│   ├── components/
│   │   ├── NoteEditor.tsx
│   │   ├── Sidebar.tsx
│   │   └── Providers.tsx
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── utils.ts
│   └── types/
│       └── index.ts
├── SUPRBASE_SETUP.md
├── README.md
├── LICENSE
└── package.json
```

---

## 🔐 Security Features

- **Row Level Security (RLS)** - Each user sees only their own data
- **Email Confirmation** - No unauthorized signups
- **Secure HTTP Headers** - Via Next.js middleware
- **API Access Control** - User-specific queries

---

## 🚀 Future Possibilities

Looking to expand? Here's what could be added:

1. **Real-time Collaboration** - Multiple users editing simultaneously
2. **Mobile Apps** - iOS/Android native apps
3. **End-to-End Encryption** - Zero-knowledge architecture
4. **Plugin System** - Extensible with plugins
5. **API Access** - Public API for third-party integrations
6. **Export All** - Full vault backup as .zip

---

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org)
- [Supabase](https://supabase.com)
- [Tailwind CSS](https://tailwindcss.com)
- [React Markdown](https://github.com/remarkjs/react-markdown)
- [Lucide Icons](https://lucide.dev)

---

## 📜 License

MIT License - See [LICENSE](LICENSE)

---

**Made with ❤️ by the Bexiter community**

*"The companion that sits behind you and supports you"*

---

*Last updated: March 2026*
*Version: 1.0.0*