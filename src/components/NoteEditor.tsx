'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import {
  Trash2, Archive, Download,
  Tag, Folder, Share2, Columns2, Minus, AlignLeft, FileText, FileCode
} from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { ShareDialog } from '@/components/ShareDialog'
import { TiptapEditor } from '@/components/TiptapEditor'
import type { Note, Folder as FolderType, Tag as TagType } from '@/types'
import TurndownService from 'turndown'

type TemplateMode = 'compact' | 'medium' | 'reader'

export function NoteEditor() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const supabaseRef = useRef(createSupabaseBrowserClient())
  const supabase = supabaseRef.current

  const noteId = params.id as string
  const isNewNote = noteId === 'new'
  const initialFolderId = searchParams.get('folder_id') || null

  const [note, setNote] = useState<Note | null>(null)
  const [folders, setFolders] = useState<FolderType[]>([])
  const [tags, setTags] = useState<TagType[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [template, setTemplate] = useState<TemplateMode>('medium')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showTagPicker, setShowTagPicker] = useState(false)
  const [showFolderPicker, setShowFolderPicker] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const [noteLoaded, setNoteLoaded] = useState(false)
  const exportDropdownRef = useRef<HTMLDivElement>(null)

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const folderPath = useMemo(() => {
    const folderId = note?.folder_id || (isNewNote ? initialFolderId : null)
    if (!folderId || folders.length === 0) return null

    const path: string[] = []
    let currentId: string | null = folderId
    const visited = new Set<string>()

    while (currentId) {
      if (visited.has(currentId)) break
      visited.add(currentId)
      const folder = folders.find(f => f.id === currentId)
      if (!folder) break
      path.unshift(folder.name)
      currentId = folder.parent_id
    }

    return path.length > 0 ? path : null
  }, [note?.folder_id, folders, isNewNote, initialFolderId])

  useEffect(() => {
    if (user) {
      loadFolders()
      loadTags()
      if (!isNewNote) {
        loadNote()
      } else {
        setNoteLoaded(true)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, noteId])

  useEffect(() => {
    if (note && !isNewNote && !noteLoaded) {
      setTitle(note.title)
      setContent(note.content)
      setNoteLoaded(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note])

  const loadNote = async () => {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .single()

    if (error) {
      console.error('Failed to load note:', error)
      router.push('/app')
      return
    }
    if (data) {
      setNote(data)
      loadNoteTags(data.id)
    }
  }

  const loadNoteTags = async (noteId: string) => {
    const { data } = await supabase
      .from('note_tags')
      .select('tag_id')
      .eq('note_id', noteId)

    if (data) {
      setSelectedTags(data.map(t => t.tag_id))
    }
  }

  const loadFolders = async () => {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .order('name')
    if (error) {
      console.error('Failed to load folders:', error)
      return
    }
    if (data) setFolders(data)
  }

  const loadTags = async () => {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name')
    if (error) {
      console.error('Failed to load tags:', error)
      return
    }
    if (data) setTags(data)
  }

  const saveNote = useCallback(async (currentTitle: string, currentContent: string) => {
    if (!user || !currentTitle.trim()) return

    setSaving(true)

    const noteData = {
      title: currentTitle.trim(),
      content: currentContent,
      updated_at: new Date().toISOString()
    }

    if (isNewNote) {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          ...noteData,
          user_id: user.id,
          folder_id: initialFolderId
        })
        .select()
        .single()

      if (!error && data) {
        setNote(data)
        router.replace(`/app/note/${data.id}`)
        setLastSaved(new Date())
      }
    } else if (note) {
      const { error } = await supabase
        .from('notes')
        .update(noteData)
        .eq('id', note.id)

      if (!error) {
        setLastSaved(new Date())
      }
    }

    setSaving(false)
  }, [user, isNewNote, note, router, supabase])

  const handleContentChange = useCallback((html: string) => {
    setContent(html)
  }, [])

  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle)
  }, [])

  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      if (title.trim()) {
        saveNote(title, content)
      }
    }, 2000)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [title, content, saveNote])

  const exportNote = (format: 'html' | 'md') => {
    let blob: Blob
    let filename: string

    if (format === 'html') {
      blob = new Blob([content], { type: 'text/html' })
      filename = `${title || 'note'}.html`
    } else {
      const turndown = new TurndownService()
      const markdown = turndown.turndown(content)
      blob = new Blob([markdown], { type: 'text/markdown' })
      filename = `${title || 'note'}.md`
    }
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    setShowExportDropdown(false)
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setShowExportDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const deleteNote = async () => {
    if (!note || !confirm('Are you sure you want to delete this note?')) return

    const { error } = await supabase.from('notes').delete().eq('id', note.id)
    if (error) {
      console.error('Failed to delete note:', error)
      alert('Failed to delete note. Please try again.')
      return
    }
    router.push('/app')
  }

  const archiveNote = async () => {
    if (!note) return

    const { error } = await supabase
      .from('notes')
      .update({ is_archived: true })
      .eq('id', note.id)

    if (error) {
      console.error('Failed to archive note:', error)
      alert('Failed to archive note. Please try again.')
      return
    }
    router.push('/app')
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--background)]">
      {/* Header */}
      <div className="border-b border-[var(--border-color)]">
        {/* Row 1: Done + Title + Save status */}
        <div className="px-3 py-2 sm:px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/app')}
              className="px-3 py-1.5 text-sm font-medium text-[var(--accent)] hover:bg-[var(--hover-bg)] rounded-md whitespace-nowrap"
            >
              Done
            </button>
            <div className="flex-1 min-w-0 flex items-baseline">
              {folderPath && (
                <span className="text-lg sm:text-xl text-[var(--muted)] truncate shrink-0">
                  ./{folderPath.join('/')}/&nbsp;
                </span>
              )}
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Untitled"
                className="min-w-0 flex-1 text-lg sm:text-xl font-semibold bg-transparent border-none outline-none text-[var(--foreground)]"
              />
            </div>
            {saving && <span className="text-xs text-[var(--muted)] whitespace-nowrap">Saving...</span>}
            {lastSaved && !saving && (
              <span className="text-xs text-[var(--muted)] whitespace-nowrap hidden sm:inline">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Row 2: Actions toolbar */}
        <div className="flex items-center gap-0.5 px-3 py-1.5 sm:px-4 overflow-x-auto">
          {/* Template Toggle */}
          <div className="flex items-center border border-[var(--border-color)] rounded-md mr-1 shrink-0">
            <button
              onClick={() => setTemplate('compact')}
              className={cn('p-1.5 sm:p-2', template === 'compact' && 'bg-[var(--hover-bg)]')}
              title="Compact"
            >
              <Minus size={16} className="text-[var(--muted)]" />
            </button>
            <button
              onClick={() => setTemplate('medium')}
              className={cn('p-1.5 sm:p-2', template === 'medium' && 'bg-[var(--hover-bg)]')}
              title="Medium"
            >
              <Columns2 size={16} className="text-[var(--muted)]" />
            </button>
            <button
              onClick={() => setTemplate('reader')}
              className={cn('p-1.5 sm:p-2', template === 'reader' && 'bg-[var(--hover-bg)]')}
              title="Reader"
            >
              <AlignLeft size={16} className="text-[var(--muted)]" />
            </button>
          </div>

          <button
            onClick={() => setShowFolderPicker(!showFolderPicker)}
            className="p-1.5 sm:p-2 hover:bg-[var(--hover-bg)] rounded-md shrink-0"
            title="Move to folder"
          >
            <Folder size={18} className="text-[var(--muted)]" />
          </button>

          <button
            onClick={() => setShowTagPicker(!showTagPicker)}
            className="p-1.5 sm:p-2 hover:bg-[var(--hover-bg)] rounded-md shrink-0"
            title="Tags"
          >
            <Tag size={18} className="text-[var(--muted)]" />
          </button>

          <div className="relative shrink-0" ref={exportDropdownRef}>
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="p-1.5 sm:p-2 hover:bg-[var(--hover-bg)] rounded-md"
              title="Export"
            >
              <Download size={18} className="text-[var(--muted)]" />
            </button>

            {showExportDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-md shadow-lg z-20 min-w-36">
                <button
                  onClick={() => exportNote('html')}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--hover-bg)] flex items-center gap-2"
                >
                  <FileCode size={14} /> HTML
                </button>
                <button
                  onClick={() => exportNote('md')}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--hover-bg)] flex items-center gap-2"
                >
                  <FileText size={14} /> Markdown
                </button>
              </div>
            )}
          </div>

          {!isNewNote && (
            <button
              onClick={() => setShowShareDialog(true)}
              className="p-1.5 sm:p-2 hover:bg-[var(--hover-bg)] rounded-md shrink-0"
              title="Share"
            >
              <Share2 size={18} className="text-[var(--muted)]" />
            </button>
          )}

          <button
            onClick={archiveNote}
            className="p-1.5 sm:p-2 hover:bg-[var(--hover-bg)] rounded-md shrink-0"
            title="Archive"
          >
            <Archive size={18} className="text-[var(--muted)]" />
          </button>

          <button
            onClick={deleteNote}
            className="p-1.5 sm:p-2 hover:bg-[var(--hover-bg)] rounded-md text-red-500 shrink-0"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        {noteLoaded && (
          <TiptapEditor
            content={content}
            onChange={handleContentChange}
            template={template}
            placeholder="Start writing..."
          />
        )}
      </div>

      {/* Folder Picker Dropdown */}
      {showFolderPicker && (
        <div className="absolute right-20 top-24 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-md shadow-lg z-10">
          <div className="p-2">
            <button
              onClick={async () => {
                if (note) {
                  const { error } = await supabase.from('notes').update({ folder_id: null }).eq('id', note.id)
                  if (error) {
                    console.error('Failed to move note:', error)
                    return
                  }
                  setNote({ ...note, folder_id: null })
                }
                setShowFolderPicker(false)
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--hover-bg)] rounded flex items-center gap-2 ${note?.folder_id === null ? 'bg-[var(--hover-bg)] font-medium' : ''}`}
            >
              {note?.folder_id === null && <span className="text-[var(--accent)]">✓</span>}
              No Folder
            </button>
            {folders.map(folder => (
              <button
                key={folder.id}
                onClick={async () => {
                  if (note) {
                    const { error } = await supabase.from('notes').update({ folder_id: folder.id }).eq('id', note.id)
                    if (error) {
                      console.error('Failed to move note:', error)
                      return
                    }
                    setNote({ ...note, folder_id: folder.id })
                  }
                  setShowFolderPicker(false)
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--hover-bg)] rounded flex items-center gap-2 ${note?.folder_id === folder.id ? 'bg-[var(--hover-bg)] font-medium' : ''}`}
              >
                <Folder size={14} className="text-yellow-500" />
                {note?.folder_id === folder.id && <span className="text-[var(--accent)]">✓</span>}
                {folder.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tag Picker Dropdown */}
      {showTagPicker && (
        <div className="absolute right-12 top-24 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
          <div className="p-2">
            {tags.length === 0 && (
              <div className="px-3 py-2 text-sm text-[var(--muted)]">No tags yet</div>
            )}
            {tags.map(tag => (
              <button
                key={tag.id}
                onClick={async () => {
                  if (!note) return
                  const isSelected = selectedTags.includes(tag.id)
                  if (isSelected) {
                    const { error } = await supabase
                      .from('note_tags')
                      .delete()
                      .eq('note_id', note.id)
                      .eq('tag_id', tag.id)
                    if (error) {
                      console.error('Failed to remove tag:', error)
                      return
                    }
                    setSelectedTags(prev => prev.filter(t => t !== tag.id))
                  } else {
                    const { error } = await supabase
                      .from('note_tags')
                      .insert({ note_id: note.id, tag_id: tag.id })
                    if (error) {
                      console.error('Failed to add tag:', error)
                      return
                    }
                    setSelectedTags(prev => [...prev, tag.id])
                  }
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--hover-bg)] rounded flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </span>
                {selectedTags.includes(tag.id) && (
                  <span className="text-green-500">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Share Dialog */}
      {showShareDialog && note && user && (
        <ShareDialog
          noteId={note.id}
          ownerId={user.id}
          currentUserEmail={user.email || ''}
          onClose={() => setShowShareDialog(false)}
        />
      )}
    </div>
  )
}

export default NoteEditor
