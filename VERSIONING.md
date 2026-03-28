# Versioning

```
master ─── tag: v1 (commit dd4df0a)
   │
   └── v2 (branch activ)
        ├── v2   - auth, profile, admin, collaboration
        └── v2.1 - WYSIWYG editor, templates, simplified auth (current)
```

## v1 (tagged)
- Markdown editor, folders, tags, search, theme, export, archive, MCP API

## v2 (implemented)
- Auth improvements, profile, admin, collaboration, secured MCP API

## v2.1 (in progress)
- WYSIWYG editor (TipTap), 3 text templates, simplified auth

## v2.3.1 (in progress - branch: fix/code-quality-improvements)
- Critical bug fixes (save race condition, memory leaks, broken markdown export)
- Error handling across all operations
- Performance improvements (memoization, debounce, client caching)
- Security fixes (admin visibility, input validation)
- Code quality (consistent theming, remove duplication, persist template mode)

## How to switch
```bash
git checkout v1                            # version 1
git checkout v2                            # version 2 (stable)
git checkout fix/code-quality-improvements # v2.3.1 fixes (in progress)
```
