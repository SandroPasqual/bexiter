'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Plus, Folder, FileText, Search,
  Sun, Moon, LogOut, Tag, Archive,
  ChevronRight, ChevronDown, FolderPlus, Shield, Share2,
  Trash2, X
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import type { Folder as FolderType, NoteWithTags } from '@/types'

interface SidebarProps {
  className?: string
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

  const { user, signOut } = useAuth()
  const { resolvedTheme, toggleTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    if (user) {
      loadFolders()
      loadNotes()
      loadSharedNotes()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    if (searchQuery.length > 0) {
      searchNotes()
    } else {
      setSearchResults([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

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
    const { data } = await supabase
      .from('notes')
      .select('*, tags(*), folder:folders(*)')
      .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })
      .limit(20)
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
    await supabase.from('folders').delete().eq('id', folderId)
    setFolders(prev => prev.filter(f => f.id !== folderId))
    setDeletingFolder(null)
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
          className="flex items-center gap-2 px-3 py-2 text-sm bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent-hover)] flex-1"
        >
          <Plus size={16} />
          New Note
        </button>
        <button
          onClick={() => setShowNewFolder(true)}
          className="p-2 text-[var(--muted)] hover:bg-[var(--hover-bg)] rounded-md"
          title="New Folder"
        >
          <FolderPlus size={18} />
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
        {/* Folders */}
        <div className="mb-4">
          <div className="text-xs font-semibold text-[var(--muted)] uppercase px-3 py-2">
            Folders
          </div>
          {folders.length === 0 && (
            <div className="text-xs text-[var(--muted)] px-3 py-2">
              No folders yet
            </div>
          )}
          {folders.map(folder => (
            <div key={folder.id}>
              <div className="group flex items-center">
                <button
                  onClick={() => toggleFolder(folder.id)}
                  className="flex-1 flex items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--hover-bg)] rounded-md"
                >
                  {expandedFolders.has(folder.id) ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                  <Folder size={16} className="text-[var(--accent)]" />
                  <span className="truncate">{folder.name}</span>
                </button>
                <button
                  onClick={() => deleteFolder(folder.id)}
                  disabled={deletingFolder === folder.id}
                  className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--hover-bg)] text-[var(--muted)] hover:text-[var(--danger)] transition-opacity"
                  title="Delete folder"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {expandedFolders.has(folder.id) && (
                <div className="ml-6">
                  {notes
                    .filter(n => n.folder_id === folder.id)
                    .map(note => (
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
                        <span className="truncate">{note.title}</span>
                      </Link>
                    ))}
                  <button
                    onClick={() => router.push(`/app/note/new?folder_id=${folder.id}`)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--hover-bg)] rounded-md w-full"
                  >
                    <Plus size={14} />
                    <span>New note in {folder.name}</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* All Notes */}
        <div className="mb-4">
          <div className="text-xs font-semibold text-[var(--muted)] uppercase px-3 py-2">
            {searchQuery.length > 0 ? 'Search Results' : 'All Notes'}
          </div>
          {displayedNotes.length === 0 && (
            <div className="text-xs text-[var(--muted)] px-3 py-2">
              {searchQuery.length > 0 ? 'No results found' : 'No notes yet'}
            </div>
          )}
          {displayedNotes.map(note => (
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

        {/* Admin */}
        <div className="mb-4">
          <Link
            href="/app/admin"
            className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--hover-bg)] rounded-md"
          >
            <Shield size={14} />
            <span>Admin</span>
          </Link>
        </div>
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
