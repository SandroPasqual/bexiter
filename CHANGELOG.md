# Changelog

## v2 - 2026-03-27

### Autentificare & Securitate
- **Toggle parola vizibilă** - buton ochi pe login, signup și reset password (Eye/EyeOff)
- **Branding BEXITER** - litere mari cu spațiu `tracking-[0.3em]` pe toate paginile auth
- **Pagină Forgot Password** (`/forgot-password`) - trimitere email reset parolă
- **Pagină Reset Password** (`/auth/reset-password`) - setare parolă nouă din link email
- **MCP API securizat** - cere `Authorization: Bearer <token>` pentru toate request-urile
- **Signup redirect** - după creare cont redirectează la `/login` fără ecran "check your email"

### Profil (`/app/profile`)
- Afișare email
- Câmp display name (salvat în user_metadata)
- Schimbare parolă cu toggle vizibilitate
- Statistici: număr notițe, foldere, tag-uri

### Admin (`/app/admin`)
- Listă useri cu email, dată înregistrare, ultim login, status confirmare
- Ștergere useri cu confirmare
- Trimitere email reset parolă
- Acces restricționat la email-ul din `ADMIN_EMAILS`
- API securizat: `/api/admin/users` (GET, DELETE, POST)

### Colaborare pe notițe
- Tabel `note_collaborators` cu roluri: `view` și `edit`
- Dialog Share în NoteEditor (buton Share2)
- Invitare prin email cu selectare rol
- Listă colaboratori existenți cu modificare rol și ștergere
- Notițe partajate apar în sidebar sub "Shared with me"
- RLS actualizat: colaboratorii pot vedea/edita notițe partajate

### Configurație
- `.env.local` - `SUPABASE_SERVICE_ROLE_KEY` și `ADMIN_EMAILS` adăugate
- `SUPRBASE_SETUP.md` - schema SQL completă V2 cu tabel `note_collaborators`

### Fișiere noi
- `src/app/(auth)/forgot-password/page.tsx`
- `src/app/auth/reset-password/page.tsx`
- `src/app/app/profile/page.tsx`
- `src/app/app/admin/page.tsx`
- `src/app/api/admin/users/route.ts`
- `src/components/ShareDialog.tsx`

### Fișiere modificate
- `src/app/(auth)/login/page.tsx` - toggle parolă, branding, link forgot password
- `src/app/(auth)/signup/page.tsx` - redirect login, styling consistent, toggle parolă
- `src/app/api/mcp/route.ts` - autentificare Bearer token
- `src/components/NoteEditor.tsx` - buton Share, integrare ShareDialog
- `src/components/Sidebar.tsx` - link Profile, link Admin, secțiune Shared Notes
- `SUPRBASE_SETUP.md` - schema colaborare

---

## v1 - tag `v1` (commit dd4df0a)
- Editor Markdown cu moduri: edit, preview, split
- Foldere pentru organizare
- Tag-uri cu culori
- Wiki-links `[[title]]`
- Căutare full-text
- Dark/Light theme
- Export notițe ca `.md`
- Arhivare notițe
- Auto-save cu debounce 2s
- MCP API endpoint
- Autentificare email/password prin Supabase
- RLS pe toate tabelele
