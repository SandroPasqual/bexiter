# Versioning

## Structura versiunilor

Proiectul folosește **git tags** pentru marcarea versiunilor și **branch-uri** pentru dezvoltare.

```
master ─── tag: v1 (commit dd4df0a)
   │
   └── v2 (branch activ pentru dezvoltare)
```

## Versiuni

### v1 - Prima versiune stabilă
- **Tag:** `v1`
- **Commit:** `dd4df0a`
- **Descriere:** Aplicație de notițe cu editor Markdown, foldere, tag-uri, wiki-links, căutare, theme toggle, export, arhivare, MCP API
- **Live:** https://bexiter.vercel.app
- **Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, Supabase

### v2 - În dezvoltare
- **Branch:** `v2`
- **Status:** În planificare

## Cum se lucrează

### Comutare între versiuni
```bash
git checkout v1     # revii la versiunea 1 (read-only)
git checkout v2     # revii la versiunea 2 (dezvoltare activă)
```

### Marcarea unei noi versiuni
```bash
git tag v3          # pe commit-ul curent din branch-ul activ
```

### Reguli
- Nu se modifică codul din tag-urile existente
- Dezvoltarea se face pe branch-ul corespunzător versiunii curente
- Fiecare versiune stabilă primește un tag pe master
