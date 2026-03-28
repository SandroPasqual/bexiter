'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Folder, FileText, Search,
  Sun, Moon, LogOut, Tag, Archive,
  ChevronRight, ChevronDown, Shield, Share2,
  Trash2, X, MoreHorizontal, Pin, Edit2, Move
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { cn, isAdmin } from '@/lib/utils'
import type { Folder as FolderType, NoteWithTags, FolderWithNotes } from '@/types'

interface SidebarProps {
  className?: string
}

function buildFolderTree(
  folders: FolderType[],
  notes: NoteWithTags[]
): FolderWithNotes[] {
  const folderMap = new Map<string, FolderWithNotes>()
  
  folders.forEach(f => {
    folderMap.set(f.id, { ...f, notes: [], subfolders: [] })
  })
  
  const rootFolders: FolderWithNotes[] = []
  
  folders.forEach(f => {
    const folder = folderMap.get(f.id)!
    folder.notes = notes.filter(n => n.folder_id === f.id)
    
    if (f.parent_id && folderMap.has(f.parent_id)) {
      folderMap.get(f.parent_id)!.subfolders.push(folder)
    } else {
      rootFolders.push(folder)
    }
  })
  
  return rootFolders.sort((a, b) => a.name.localeCompare(b.name))
}

function NoteItem({ 
  note, 
  pathname,
  onMenuOpen,
  menuOpen,
  moveOpenId,
  setMoveOpen,
  folders,
  moveNote,
  archiveNote,
  deleteNote,
  togglePinNote,
  startRename,
  renameOpen,
  renameValue,
  setRenameValue,
  renameItem
}: {
  note: NoteWithTags
  pathname: string
  onMenuOpen: (id: string | null) => void
  menuOpen: string | null
  moveOpenId: string | null
  setMoveOpen: (id: string | null) => void
  folders: FolderType[]
  moveNote: (noteId: string, folderId: string | null) => void
  archiveNote: (noteId: string) => void
  deleteNote: (noteId: string) => void
  togglePinNote: (noteId: string, isPinned: boolean) => void
  startRename: (type: 'note' | 'folder', id: string, name: string) => void
  renameOpen: {type: 'note' | 'folder', id: string} | null
  renameValue: string
  setRenameValue: (v: string) => void
  renameItem: (type: 'note' | 'folder', id: string, name: string) => void
}) {
  const isMenuOpen = menuOpen === note.id
  const isMoveOpen = moveOpenId === note.id
  const isRenaming = renameOpen?.type === 'note' && renameOpen?.id === note.id

  return (
    <div className="group relative flex items-center">
      {isRenaming ? (
        <input
          type="text"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') renameItem('note', note.id, renameValue)
            if (e.key === 'Escape') { setRenameValue(''); startRename('note', note.id, '') }
          }}
          onBlur={() => renameItem('note', note.id, renameValue)}
          className="flex-1 px-2 py-1 text-sm bg-[var(--input-bg)] border border-[var(--accent)] rounded text-[var(--foreground)]"
          autoFocus
          onMouseDown={(e) => e.stopPropagation()}
        />
      ) : (
        <Link
          href={`/app/note/${note.id}`}
          className={cn(
            "flex-1 flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--hover-bg)] rounded-md",
            pathname === `/app/note/${note.id}` ? "bg-[var(--accent-light)] text-[var(--accent)]" : "text-[var(--foreground)]"
          )}
        >
          <FileText size={14} />
          <span className="truncate">{note.title}</span>
          {note.is_pinned && <Pin size={12} className="text-[var(--accent)]" />}
        </Link>
      )}
      <button
        onClick={() => onMenuOpen(isMenuOpen ? null : note.id)}
        className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--hover-bg)] text-[var(--muted)]"
      >
        <MoreHorizontal size={14} />
      </button>
      
      {isMenuOpen && (
        <div data-context-menu className="absolute right-0 top-8 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-md shadow-lg z-20 min-w-32">
          <button
            onClick={() => startRename('note', note.id, note.title)}
            className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--hover-bg)] flex items-center gap-2"
          >
            <Edit2 size={14} /> Rename
          </button>
          <button
            onClick={() => { onMenuOpen(null); setMoveOpen(note.id); }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--hover-bg)] flex items-center gap-2"
          >
            <Move size={14} /> Move
          </button>
          <button
            onClick={() => togglePinNote(note.id, note.is_pinned || false)}
            className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--hover-bg)] flex items-center gap-2"
          >
            <Pin size={14} /> {note.is_pinned ? 'Unpin' : 'Pin'}
          </button>
          <button
            onClick={() => archiveNote(note.id)}
            className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--hover-bg)] flex items-center gap-2"
          >
            <Archive size={14} /> Archive
          </button>
          <button
            onClick={() => deleteNote(note.id)}
            className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--hover-bg)] flex items-center gap-2 text-red-500"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}

      {isMoveOpen && (
        <div data-context-menu className="absolute right-0 top-8 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-md shadow-lg z-20 min-w-40">
          <div className="text-xs text-[var(--muted)] px-3 py-2 border-b border-[var(--border-color)]">Move to</div>
          <button
            onClick={() => moveNote(note.id, null)}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--hover-bg)] ${note.folder_id === null ? 'bg-[var(--hover-bg)] font-medium' : ''}`}
          >
            No folder
          </button>
          {folders.map(folder => (
            <button
              key={folder.id}
              onClick={() => moveNote(note.id, folder.id)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--hover-bg)] flex items-center gap-2 ${note.folder_id === folder.id ? 'bg-[var(--hover-bg)] font-medium' : ''}`}
            >
              <Folder size={14} className="text-yellow-500" />
              {folder.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function FolderItem({ 
  folder, 
  depth = 0,
  expandedFolders,
  toggleFolder,
  deletingFolder,
  deleteFolder,
  pathname,
  router,
  folders,
  onMenuOpen,
  menuOpen,
  moveOpenId,
  setMoveOpen,
  moveFolder,
  startRename,
  moveNote,
  archiveNote,
  deleteNote,
  togglePinNote,
  renameOpen,
  renameValue,
  setRenameValue,
  renameItem
}: {
  folder: FolderWithNotes
  depth?: number
  expandedFolders: Set<string>
  toggleFolder: (id: string) => void
  deletingFolder: string | null
  deleteFolder: (id: string) => void
  pathname: string
  router: ReturnType<typeof useRouter>
  folders: FolderType[]
  onMenuOpen: (id: string | null) => void
  menuOpen: string | null
  moveOpenId: string | null
  setMoveOpen: (id: string | null) => void
  moveFolder: (folderId: string, parentId: string | null) => void
  startRename: (type: 'note' | 'folder', id: string, name: string) => void
  moveNote: (noteId: string, folderId: string | null) => void
  archiveNote: (noteId: string) => void
  deleteNote: (noteId: string) => void
  togglePinNote: (noteId: string, isPinned: boolean) => void
  renameOpen: {type: 'note' | 'folder', id: string} | null
  renameValue: string
  setRenameValue: (v: string) => void
  renameItem: (type: 'note' | 'folder', id: string, name: string) => void
}) {
  const isExpanded = expandedFolders.has(folder.id)
  const hasContent = folder.notes.length > 0 || folder.subfolders.length > 0
  
  const isMenuOpen = menuOpen === folder.id
  const otherFolders = folders.filter(f => f.id !== folder.id)
  const isRenaming = renameOpen?.type === 'folder' && renameOpen?.id === folder.id

  return (
    <div style={{ marginLeft: depth * 16 }} className="relative">
      <div className="group flex items-center">
        {isRenaming ? (
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') renameItem('folder', folder.id, renameValue)
              if (e.key === 'Escape') { setRenameValue(''); startRename('folder', folder.id, '') }
            }}
            onBlur={() => renameItem('folder', folder.id, renameValue)}
            className="flex-1 px-2 py-1 text-sm bg-[var(--input-bg)] border border-[var(--accent)] rounded text-[var(--foreground)]"
            autoFocus
            onMouseDown={(e) => e.stopPropagation()}
          />
        ) : (
          <button
            onClick={() => toggleFolder(folder.id)}
            className="flex-1 flex items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--hover-bg)] rounded-md"
          >
            {hasContent ? (
              isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
            ) : (
              <span className="w-3.5" />
            )}
            <Folder size={16} className="text-yellow-500" />
            <span className="truncate">{folder.name}</span>
          </button>
        )}
        <button
          onClick={() => onMenuOpen(isMenuOpen ? null : folder.id)}
          className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--hover-bg)] text-[var(--muted)]"
        >
          <MoreHorizontal size={14} />
        </button>
        
        {isMenuOpen && (
          <div data-context-menu className="absolute right-0 top-8 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-md shadow-lg z-20 min-w-32">
            <button
              onClick={() => startRename('folder', folder.id, folder.name)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--hover-bg)] flex items-center gap-2"
            >
              <Edit2 size={14} /> Rename
            </button>
            <button
              onClick={() => { onMenuOpen(null); setMoveOpen(folder.id); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--hover-bg)] flex items-center gap-2"
            >
              <Move size={14} /> Move
            </button>
            <button
              onClick={() => deleteFolder(folder.id)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--hover-bg)] flex items-center gap-2 text-red-500"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}

        {moveOpenId === folder.id && (
          <div data-context-menu className="absolute right-0 top-8 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-md shadow-lg z-20 min-w-40">
            <div className="text-xs text-[var(--muted)] px-3 py-2 border-b border-[var(--border-color)]">Move to</div>
            <button
              onClick={() => moveFolder(folder.id, null)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--hover-bg)] ${folder.parent_id === null ? 'bg-[var(--hover-bg)] font-medium' : ''}`}
            >
              Root
            </button>
            {otherFolders.map(f => (
              <button
                key={f.id}
                onClick={() => moveFolder(folder.id, f.id)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--hover-bg)] flex items-center gap-2 ${folder.parent_id === f.id ? 'bg-[var(--hover-bg)] font-medium' : ''}`}
              >
                <Folder size={14} className="text-yellow-500" />
                {f.name}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {isExpanded && (
        <div>
          {folder.subfolders.map(subfolder => (
            <FolderItem
              key={subfolder.id}
              folder={subfolder}
              depth={depth + 1}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              deletingFolder={deletingFolder}
              deleteFolder={deleteFolder}
              pathname={pathname}
              router={router}
              folders={folders}
              onMenuOpen={onMenuOpen}
              menuOpen={menuOpen}
              moveOpenId={moveOpenId}
              setMoveOpen={setMoveOpen}
              moveFolder={moveFolder}
              startRename={startRename}
              moveNote={moveNote}
              archiveNote={archiveNote}
              deleteNote={deleteNote}
              togglePinNote={togglePinNote}
              renameOpen={renameOpen}
              renameValue={renameValue}
              setRenameValue={setRenameValue}
              renameItem={renameItem}
            />
          ))}
          
          {folder.notes.map(note => (
            <div key={note.id} style={{ marginLeft: (depth + 1) * 16 }}>
              <NoteItem
                note={note}
                pathname={pathname}
                onMenuOpen={onMenuOpen}
                menuOpen={menuOpen}
                moveOpenId={moveOpenId}
                setMoveOpen={setMoveOpen}
                folders={folders}
                moveNote={moveNote}
                archiveNote={archiveNote}
                deleteNote={deleteNote}
                togglePinNote={togglePinNote}
                startRename={startRename}
                renameOpen={renameOpen}
                renameValue={renameValue}
                setRenameValue={setRenameValue}
                renameItem={renameItem}
              />
            </div>
          ))}
          
        </div>
      )}
    </div>
  )
}

export function Sidebar({ className }: SidebarProps) {
  const [folders, setFolders] = useState<FolderType[]>([])
  const [notes, setNotes] = useState<NoteWithTags[]>([])
  const [sharedNotes, setSharedNotes] = useState<NoteWithTags[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<NoteWithTags[]>([])
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [deletingFolder, setDeletingFolder] = useState<string | null>(null)
  const [noteMenuOpen, setNoteMenuOpen] = useState<string | null>(null)
  const [noteMoveOpen, setNoteMoveOpen] = useState<string | null>(null)
  const [folderMenuOpen, setFolderMenuOpen] = useState<string | null>(null)
  const [folderMoveOpen, setFolderMoveOpen] = useState<string | null>(null)
  const [renameOpen, setRenameOpen] = useState<{type: 'note' | 'folder', id: string} | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const { user, signOut } = useAuth()
  const { resolvedTheme, toggleTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const supabaseRef = useRef(createSupabaseBrowserClient())
  const supabase = supabaseRef.current
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (user) {
      loadFolders()
      loadNotes()
      loadSharedNotes()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, refreshKey])

  useEffect(() => {
    const handleNoteChange = () => {
      loadNotes()
      loadFolders()
    }
    window.addEventListener('note-archived', handleNoteChange)
    return () => window.removeEventListener('note-archived', handleNoteChange)
  }, [])

  useEffect(() => {
    if (searchQuery.length > 0) {
      const timer = setTimeout(() => {
        searchNotes()
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setSearchResults([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-context-menu]')) {
        setNoteMenuOpen(null)
        setNoteMoveOpen(null)
        setFolderMenuOpen(null)
        setFolderMoveOpen(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadFolders = async () => {
    const { data } = await supabase
      .from('folders')
      .select('*')
      .order('name')
    if (data) setFolders(data)
  }

  const loadNotes = async () => {
    const { data } = await supabase
      .from('notes')
      .select('*, tags(*), folder:folders(*)')
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })
      .limit(50)
    if (data) setNotes(data as NoteWithTags[])

    if (data && user) {
      const welcomeNote = data.find(n => n.title === 'Welcome to Bexiter')

      if (welcomeNote) {
        localStorage.removeItem('welcome-creating')
        return
      }

      if (data.length > 0) {
        localStorage.removeItem('welcome-creating')
        return
      }

      const alreadyCreating = localStorage.getItem('welcome-creating')
      if (alreadyCreating === 'true') {
        localStorage.removeItem('welcome-creating')
        return
      }
      
      localStorage.setItem('welcome-creating', 'true')
      console.log('Creating welcome note for user:', user.id)
      const welcomeContent = `<h1>Welcome to Bexiter 👋</h1>
<p>This is your first note. Here's what you can do:</p>

<h2>📝 Writing</h2>
<p><strong>Bold text</strong>, <em>italic text</em>, and <u>underlined text</u> work just like in any editor.</p>

<h3>Lists</h3>
<ul>
  <li>Bullet point one</li>
  <li>Bullet point two</li>
</ul>

<ol>
  <li>Number one</li>
  <li>Number two</li>
</ol>

<h2>🔗 Links</h2>
<p>Create links to <strong>other notes</strong> or external websites like <a href="https://google.com">Google</a>.</p>

<h2>📋 Quote</h2>
<blockquote>Here's a quote. Use it for important notes.</blockquote>

<h2>💻 Code</h2>
<p>Use <code>inline code</code> or code blocks:</p>
<pre><code>const hello = "world";
console.log(hello);</code></pre>

<hr>

<h2>📤 Export &amp; Import</h2>
<p><strong>Export:</strong> Click the Download icon to export as HTML or Markdown (.md).</p>
<p><strong>Import:</strong> Copy text from anywhere (Google Docs, Word, Notion) and paste it here. It will be converted automatically.</p>

<h2>⌨️ Shortcuts</h2>
<ul>
  <li><code>Cmd/Ctrl + B</code> - Bold</li>
  <li><code>Cmd/Ctrl + I</code> - Italic</li>
  <li><code>Cmd/Ctrl + U</code> - Underline</li>
  <li><code>Cmd/Ctrl + K</code> - Add link</li>
</ul>

<h2>📁 Organize</h2>
<ul>
  <li>Create folders to organize your notes</li>
  <li>Pin important notes to Favorites</li>
  <li>Use tags for even more organization</li>
  <li>Archive notes you don't need daily</li>
</ul>

<p><em>Delete this note when you're ready to start creating your own!</em></p>`

      const { data: newNote } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          title: 'Welcome to Bexiter',
          content: welcomeContent,
          folder_id: null,
          is_archived: false
        })
        .select('*, tags(*), folder:folders(*)')
        .single()
      
      if (newNote) {
        setNotes([newNote as NoteWithTags])
        localStorage.setItem('welcome-creating', 'false')
      }
    }
  }

  const loadSharedNotes = async () => {
    const { data: collabs } = await supabase
      .from('note_collaborators')
      .select('note_id')
      .eq('user_id', user?.id)

    if (!collabs || collabs.length === 0) return

    const noteIds = collabs.map(c => c.note_id)
    const { data } = await supabase
      .from('notes')
      .select('*, tags(*), folder:folders(*)')
      .in('id', noteIds)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })

    if (data) setSharedNotes(data as NoteWithTags[])
  }

  const searchNotes = async () => {
    const { data, error } = await supabase
      .from('notes')
      .select('*, tags(*), folder:folders(*)')
      .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })
      .limit(20)
    if (error) {
      console.error('Search failed:', error)
      return
    }
    if (data) setSearchResults(data as NoteWithTags[])
  }

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  const createFolder = async () => {
    if (!newFolderName.trim() || !user) return

    const { data, error } = await supabase
      .from('folders')
      .insert({
        name: newFolderName.trim(),
        user_id: user.id
      })
      .select()
      .single()

    if (!error && data) {
      setFolders(prev => [...prev, data])
      setNewFolderName('')
      setShowNewFolder(false)
    }
  }

  const deleteFolder = async (folderId: string) => {
    const folder = folders.find(f => f.id === folderId)
    if (!folder) return
    if (!confirm(`Delete folder "${folder.name}"? Notes inside will be moved out.`)) return

    setDeletingFolder(folderId)
    const { error } = await supabase.from('folders').delete().eq('id', folderId)
    if (error) {
      console.error('Failed to delete folder:', error)
      alert('Failed to delete folder. Please try again.')
      setDeletingFolder(null)
      return
    }
    setFolders(prev => prev.filter(f => f.id !== folderId))
    setFolderMenuOpen(null)
    setDeletingFolder(null)
  }

  const moveNote = async (noteId: string, folderId: string | null) => {
    const { error } = await supabase.from('notes').update({ folder_id: folderId }).eq('id', noteId)
    if (error) {
      console.error('Failed to move note:', error)
      return
    }
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, folder_id: folderId } : n))
    setNoteMoveOpen(null)
    setNoteMenuOpen(null)
  }

  const moveFolder = async (folderId: string, parentId: string | null) => {
    const { error } = await supabase.from('folders').update({ parent_id: parentId }).eq('id', folderId)
    if (error) {
      console.error('Failed to move folder:', error)
      return
    }
    setFolders(prev => prev.map(f => f.id === folderId ? { ...f, parent_id: parentId } : f))
    await loadFolders()
    setFolderMoveOpen(null)
    setFolderMenuOpen(null)
  }

  const archiveNote = async (noteId: string) => {
    const { error } = await supabase.from('notes').update({ is_archived: true }).eq('id', noteId)
    if (error) {
      console.error('Failed to archive note:', error)
      return
    }
    setNotes(prev => prev.filter(n => n.id !== noteId))
    setNoteMenuOpen(null)
    window.dispatchEvent(new Event('note-archived'))
  }

  const deleteNote = async (noteId: string) => {
    if (!confirm('Delete this note?')) return
    const { error } = await supabase.from('notes').delete().eq('id', noteId)
    if (error) {
      console.error('Failed to delete note:', error)
      alert('Failed to delete note. Please try again.')
      return
    }
    setNotes(prev => prev.filter(n => n.id !== noteId))
    setNoteMenuOpen(null)
  }

  const togglePinNote = async (noteId: string, isPinned: boolean) => {
    const { error } = await supabase.from('notes').update({ is_pinned: !isPinned }).eq('id', noteId)
    if (error) {
      console.error('Failed to toggle pin:', error)
      return
    }
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, is_pinned: !isPinned } : n))
    setNoteMenuOpen(null)
  }

  const renameItem = async (type: 'note' | 'folder', id: string, newName: string) => {
    if (!newName.trim()) return
    if (type === 'note') {
      const { error } = await supabase.from('notes').update({ title: newName.trim() }).eq('id', id)
      if (error) {
        console.error('Failed to rename note:', error)
        return
      }
      setNotes(prev => prev.map(n => n.id === id ? { ...n, title: newName.trim() } : n))
    } else {
      const { error } = await supabase.from('folders').update({ name: newName.trim() }).eq('id', id)
      if (error) {
        console.error('Failed to rename folder:', error)
        return
      }
      setFolders(prev => prev.map(f => f.id === id ? { ...f, name: newName.trim() } : f))
    }
    setRenameOpen(null)
    setRenameValue('')
  }

  const startRename = (type: 'note' | 'folder', id: string, currentName: string) => {
    setRenameOpen({ type, id })
    setRenameValue(currentName)
    setNoteMenuOpen(null)
    setFolderMenuOpen(null)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const displayedNotes = searchQuery.length > 0 ? searchResults : notes

  return (
    <div className={cn("h-screen flex flex-col bg-[var(--sidebar-bg)] border-r border-[var(--border-color)]", className)}>
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-color)]">
        <div className="flex items-center justify-between mb-4">
          <Link href="/app" className="text-lg font-semibold text-[var(--foreground)]">
            BEXITER
          </Link>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded hover:bg-[var(--hover-bg)] text-[var(--muted)]"
              title={resolvedTheme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            >
              {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={handleSignOut}
              className="p-2 rounded hover:bg-[var(--hover-bg)] text-[var(--muted)]"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent text-[var(--foreground)]"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="p-3 border-b border-[var(--border-color)] flex gap-2">
        <button
          onClick={() => router.push('/app/note/new')}
          className="flex-1 px-3 py-2 text-sm bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent-hover)]"
        >
          New Note
        </button>
        <button
          onClick={() => setShowNewFolder(true)}
          className="flex-1 px-3 py-2 text-sm bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent-hover)]"
        >
          New Folder
        </button>
      </div>

      {/* New Folder Input */}
      {showNewFolder && (
        <div className="p-3 border-b border-[var(--border-color)]">
          <input
            type="text"
            placeholder="Folder name..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') createFolder()
              if (e.key === 'Escape') setShowNewFolder(false)
            }}
            className="w-full px-3 py-2 text-sm bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent)] text-[var(--foreground)]"
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={createFolder}
              className="px-3 py-1 text-xs bg-[var(--accent)] text-white rounded"
            >
              Create
            </button>
            <button
              onClick={() => setShowNewFolder(false)}
              className="px-3 py-1 text-xs text-[var(--muted)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        {searchQuery.length > 0 ? (
          <div className="mb-4">
            <div className="text-xs font-semibold text-[var(--muted)] uppercase px-3 py-2">
              Search Results
            </div>
            {displayedNotes.length === 0 ? (
              <div className="text-xs text-[var(--muted)] px-3 py-2">No results found</div>
            ) : (
              displayedNotes.map(note => (
                <div key={note.id} className="px-3">
                  <NoteItem
                    note={note}
                    pathname={pathname}
                    onMenuOpen={setNoteMenuOpen}
                    menuOpen={noteMenuOpen}
                    moveOpenId={noteMoveOpen}
                    setMoveOpen={setNoteMoveOpen}
                    folders={folders}
                    moveNote={moveNote}
                    archiveNote={archiveNote}
                    deleteNote={deleteNote}
                    togglePinNote={togglePinNote}
                    startRename={startRename}
                    renameOpen={renameOpen}
                    renameValue={renameValue}
                    setRenameValue={setRenameValue}
                    renameItem={renameItem}
                  />
                </div>
              ))
            )}
          </div>
        ) : (
          <>
            {(() => {
              const folderTree = buildFolderTree(folders, notes)
              const unfiledNotes = notes.filter(n => n.folder_id === null)
              
              return (
                <>
                  {(() => {
                    const pinnedNotes = notes.filter(n => n.is_pinned)
                    const folderTree = buildFolderTree(folders, notes)
                    const unfiledNotes = notes.filter(n => n.folder_id === null && !n.is_pinned)
                    
                    return (
                      <>
                        {pinnedNotes.length > 0 && (
                          <div className="mb-4">
                            <div className="text-xs font-semibold text-[var(--muted)] uppercase px-3 py-2 flex items-center gap-2">
                              <Pin size={12} /> Favorites
                            </div>
                            {pinnedNotes.map(note => (
                              <div key={note.id} className="px-3">
                                <NoteItem
                                  note={note}
                                  pathname={pathname}
                                  onMenuOpen={setNoteMenuOpen}
                                  menuOpen={noteMenuOpen}
                                  moveOpenId={noteMoveOpen}
                                  setMoveOpen={setNoteMoveOpen}
                                  folders={folders}
                                  moveNote={moveNote}
                                  archiveNote={archiveNote}
                                  deleteNote={deleteNote}
                                  togglePinNote={togglePinNote}
                                  startRename={startRename}
                                  renameOpen={renameOpen}
                                  renameValue={renameValue}
                                  setRenameValue={setRenameValue}
                                  renameItem={renameItem}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {folderTree.length === 0 && unfiledNotes.length === 0 && pinnedNotes.length === 0 && (
                          <div className="text-xs text-[var(--muted)] px-3 py-2">No notes yet</div>
                        )}
                        
                        {folderTree.map(folder => (
                          <FolderItem
                            key={folder.id}
                            folder={folder}
                            expandedFolders={expandedFolders}
                            toggleFolder={toggleFolder}
                            deletingFolder={deletingFolder}
                            deleteFolder={deleteFolder}
                            pathname={pathname}
                            router={router}
                            folders={folders}
                            onMenuOpen={setFolderMenuOpen}
                            menuOpen={folderMenuOpen}
                            moveOpenId={folderMoveOpen}
                            setMoveOpen={setFolderMoveOpen}
                            moveFolder={moveFolder}
                            startRename={startRename}
                            moveNote={moveNote}
                            archiveNote={archiveNote}
                            deleteNote={deleteNote}
                            togglePinNote={togglePinNote}
                            renameOpen={renameOpen}
                            renameValue={renameValue}
                            setRenameValue={setRenameValue}
                            renameItem={renameItem}
                          />
                        ))}
                        
                        {unfiledNotes.length > 0 && (
                          <div className="mt-2">
                            {unfiledNotes.map(note => (
                              <div key={note.id} className="px-3">
                                <NoteItem
                                  note={note}
                                  pathname={pathname}
                                  onMenuOpen={setNoteMenuOpen}
                                  menuOpen={noteMenuOpen}
                                  moveOpenId={noteMoveOpen}
                                  setMoveOpen={setNoteMoveOpen}
                                  folders={folders}
                                  moveNote={moveNote}
                                  archiveNote={archiveNote}
                                  deleteNote={deleteNote}
                                  togglePinNote={togglePinNote}
                                  startRename={startRename}
                                  renameOpen={renameOpen}
                                  renameValue={renameValue}
                                  setRenameValue={setRenameValue}
                                  renameItem={renameItem}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )
                  })()}
                </>
              )
            })()}
          </>
        )}

        {/* Shared Notes */}
        {sharedNotes.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-semibold text-[var(--muted)] uppercase px-3 py-2 flex items-center gap-2">
              <Share2 size={12} />
              Shared with me
            </div>
            {sharedNotes.map(note => (
              <Link
                key={note.id}
                href={`/app/note/${note.id}`}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--hover-bg)] rounded-md",
                  pathname === `/app/note/${note.id}`
                    ? "bg-[var(--accent-light)] text-[var(--accent)]"
                    : "text-[var(--foreground)]"
                )}
              >
                <FileText size={14} />
                <span className="truncate">{note.title || 'Untitled'}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Archive */}
        <div className="mb-4">
          <Link
            href="/app/archive"
            className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--hover-bg)] rounded-md"
          >
            <Archive size={14} />
            <span>Archive</span>
          </Link>
        </div>

        {isAdmin(user?.email) && (
          <div className="mb-4">
            <Link
              href="/app/admin"
              className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--hover-bg)] rounded-md"
            >
              <Shield size={14} />
              <span>Admin</span>
            </Link>
          </div>
        )}
      </nav>

      {/* User Info */}
      <div className="p-3 border-t border-[var(--border-color)]">
        <Link href="/app/profile" className="flex items-center gap-2 text-sm text-[var(--foreground)] hover:bg-[var(--hover-bg)] rounded-md p-1 -m-1">
          <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-medium">
            {user?.email?.[0]?.toUpperCase()}
          </div>
          <span className="truncate flex-1">{user?.email}</span>
        </Link>
      </div>
    </div>
  )
}
