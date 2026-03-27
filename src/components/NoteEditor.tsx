'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft, Trash2, Archive, Download,
  Tag, Folder, Share2, Columns2, Minus, AlignLeft
} from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { ShareDialog } from '@/components/ShareDialog'
import { TiptapEditor } from '@/components/TiptapEditor'
import type { Note, Folder as FolderType, Tag as TagType } from '@/types'

type TemplateMode = 'compact' | 'medium' | 'reader'

export function NoteEditor() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createSupabaseBrowserClient()

  const noteId = params.id as string
  const isNewNote = noteId === 'new'

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
  const [noteLoaded, setNoteLoaded] = useState(false)

  const saveTimeoutRef = useState<NodeJS.Timeout | null>(null)[0]

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
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .single()

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
    const { data } = await supabase
      .from('folders')
      .select('*')
      .order('name')
    if (data) setFolders(data)
  }

  const loadTags = async () => {
    const { data } = await supabase
      .from('tags')
      .select('*')
      .order('name')
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
          user_id: user.id
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
    const timer = setTimeout(() => {
      if (title.trim()) {
        saveNote(title, content)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [title, content, saveNote])

  const exportNote = () => {
    const blob = new Blob([content], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title || 'note'}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const deleteNote = async () => {
    if (!note || !confirm('Are you sure you want to delete this note?')) return

    await supabase.from('notes').delete().eq('id', note.id)
    router.push('/app')
  }

  const archiveNote = async () => {
    if (!note) return

    await supabase
      .from('notes')
      .update({ is_archived: true })
      .eq('id', note.id)

    router.push('/app')
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/app')}
            className="p-2 hover:bg-[var(--hover-bg)] rounded-md"
          >
            <ArrowLeft size={18} className="text-[var(--muted)]" />
          </button>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled"
            className="text-xl font-semibold bg-transparent border-none outline-none text-[var(--foreground)]"
          />
          {saving && <span className="text-xs text-[var(--muted)]">Saving...</span>}
          {lastSaved && !saving && (
            <span className="text-xs text-[var(--muted)]">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Template Toggle */}
          <div className="flex items-center border border-[var(--border-color)] rounded-md mr-2">
            <button
              onClick={() => setTemplate('compact')}
              className={cn('p-2', template === 'compact' && 'bg-[var(--hover-bg)]')}
              title="Compact"
            >
              <Minus size={16} className="text-[var(--muted)]" />
            </button>
            <button
              onClick={() => setTemplate('medium')}
              className={cn('p-2', template === 'medium' && 'bg-[var(--hover-bg)]')}
              title="Medium"
            >
              <Columns2 size={16} className="text-[var(--muted)]" />
            </button>
            <button
              onClick={() => setTemplate('reader')}
              className={cn('p-2', template === 'reader' && 'bg-[var(--hover-bg)]')}
              title="Reader"
            >
              <AlignLeft size={16} className="text-[var(--muted)]" />
            </button>
          </div>

          <button
            onClick={() => setShowFolderPicker(!showFolderPicker)}
            className="p-2 hover:bg-[var(--hover-bg)] rounded-md"
            title="Move to folder"
          >
            <Folder size={18} className="text-[var(--muted)]" />
          </button>

          <button
            onClick={() => setShowTagPicker(!showTagPicker)}
            className="p-2 hover:bg-[var(--hover-bg)] rounded-md"
            title="Tags"
          >
            <Tag size={18} className="text-[var(--muted)]" />
          </button>

          <button
            onClick={exportNote}
            className="p-2 hover:bg-[var(--hover-bg)] rounded-md"
            title="Export"
          >
            <Download size={18} className="text-[var(--muted)]" />
          </button>

          {!isNewNote && (
            <button
              onClick={() => setShowShareDialog(true)}
              className="p-2 hover:bg-[var(--hover-bg)] rounded-md"
              title="Share"
            >
              <Share2 size={18} className="text-[var(--muted)]" />
            </button>
          )}

          <button
            onClick={archiveNote}
            className="p-2 hover:bg-[var(--hover-bg)] rounded-md"
            title="Archive"
          >
            <Archive size={18} className="text-[var(--muted)]" />
          </button>

          <button
            onClick={deleteNote}
            className="p-2 hover:bg-[var(--hover-bg)] rounded-md text-red-500"
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
                  await supabase.from('notes').update({ folder_id: null }).eq('id', note.id)
                }
                setShowFolderPicker(false)
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--hover-bg)] rounded"
            >
              No Folder
            </button>
            {folders.map(folder => (
              <button
                key={folder.id}
                onClick={async () => {
                  if (note) {
                    await supabase.from('notes').update({ folder_id: folder.id }).eq('id', note.id)
                  }
                  setShowFolderPicker(false)
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--hover-bg)] rounded flex items-center gap-2"
              >
                <Folder size={14} className="text-yellow-500" />
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
                    await supabase
                      .from('note_tags')
                      .delete()
                      .eq('note_id', note.id)
                      .eq('tag_id', tag.id)
                    setSelectedTags(prev => prev.filter(t => t !== tag.id))
                  } else {
                    await supabase
                      .from('note_tags')
                      .insert({ note_id: note.id, tag_id: tag.id })
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
