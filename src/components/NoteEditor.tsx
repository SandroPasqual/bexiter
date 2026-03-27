'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import {
  Eye, Split, Bold, Italic, List, ListOrdered,
  Code, Link2, Quote, Heading1, Heading2, Heading3,
  ArrowLeft, Trash2, Archive, Download,
  Tag, Folder, Share2
} from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { ShareDialog } from '@/components/ShareDialog'
import type { Note, Folder as FolderType, Tag as TagType } from '@/types'

type EditorMode = 'edit' | 'preview' | 'split'

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
  const [mode, setMode] = useState<EditorMode>('split')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showTagPicker, setShowTagPicker] = useState(false)
  const [showFolderPicker, setShowFolderPicker] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (user) {
      loadFolders()
      loadTags()
      if (!isNewNote) {
        loadNote()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, noteId])

  useEffect(() => {
    if (note && !isNewNote) {
      setTitle(note.title)
      setContent(note.content)
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

  const saveNote = useCallback(async () => {
    if (!user || !title.trim()) return
    
    setSaving(true)
    
    const noteData = {
      title: title.trim(),
      content,
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
  }, [user, title, content, isNewNote, note, router, supabase])

  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    if (note || isNewNote) {
      saveTimeoutRef.current = setTimeout(() => {
        saveNote()
      }, 2000)
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [title, content, saveNote, note, isNewNote])

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
  }

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    
    const newContent = 
      content.substring(0, start) + 
      before + selectedText + after + 
      content.substring(end)
    
    setContent(newContent)
    
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
    }, 0)
  }

  const handleDoubleLink = () => {
    insertText('[[', ']]')
  }

  const exportNote = () => {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title || 'note'}.md`
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
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/app')}
            className="p-2 hover:bg-[var(--hover-bg)] rounded-md"
          >
            <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
            className="text-xl font-semibold bg-transparent border-none outline-none text-gray-900 dark:text-white"
          />
          {saving && <span className="text-xs text-gray-400">Saving...</span>}
          {lastSaved && !saving && (
            <span className="text-xs text-gray-400">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <div className="flex items-center border border-[var(--border-color)] rounded-md">
            <button
              onClick={() => setMode('edit')}
              className={cn(
                "p-2", mode === 'edit' && "bg-[var(--hover-bg)]"
              )}
              title="Edit"
            >
              <Bold size={16} className="text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => setMode('split')}
              className={cn(
                "p-2", mode === 'split' && "bg-[var(--hover-bg)]"
              )}
              title="Split"
            >
              <Split size={16} className="text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => setMode('preview')}
              className={cn(
                "p-2", mode === 'preview' && "bg-[var(--hover-bg)]"
              )}
              title="Preview"
            >
              <Eye size={16} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          
          <button
            onClick={() => setShowFolderPicker(!showFolderPicker)}
            className="p-2 hover:bg-[var(--hover-bg)] rounded-md"
            title="Move to folder"
          >
            <Folder size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
          
          <button
            onClick={() => setShowTagPicker(!showTagPicker)}
            className="p-2 hover:bg-[var(--hover-bg)] rounded-md"
            title="Tags"
          >
            <Tag size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
          
          <button
            onClick={exportNote}
            className="p-2 hover:bg-[var(--hover-bg)] rounded-md"
            title="Export as MD"
          >
            <Download size={18} className="text-gray-600 dark:text-gray-400" />
          </button>

          {!isNewNote && (
            <button
              onClick={() => setShowShareDialog(true)}
              className="p-2 hover:bg-[var(--hover-bg)] rounded-md"
              title="Share"
            >
              <Share2 size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
          )}
          
          <button
            onClick={archiveNote}
            className="p-2 hover:bg-[var(--hover-bg)] rounded-md"
            title="Archive"
          >
            <Archive size={18} className="text-gray-600 dark:text-gray-400" />
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

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-[var(--border-color)]">
        <button onClick={() => insertText('**', '**')} className="p-2 hover:bg-[var(--hover-bg)] rounded" title="Bold">
          <Bold size={16} className="text-gray-600 dark:text-gray-400" />
        </button>
        <button onClick={() => insertText('*', '*')} className="p-2 hover:bg-[var(--hover-bg)] rounded" title="Italic">
          <Italic size={16} className="text-gray-600 dark:text-gray-400" />
        </button>
        <div className="w-px h-6 bg-[var(--border-color)]" />
        <button onClick={() => insertText('# ')} className="p-2 hover:bg-[var(--hover-bg)] rounded" title="Heading 1">
          <Heading1 size={16} className="text-gray-600 dark:text-gray-400" />
        </button>
        <button onClick={() => insertText('## ')} className="p-2 hover:bg-[var(--hover-bg)] rounding" title="Heading 2">
          <Heading2 size={16} className="text-gray-600 dark:text-gray-400" />
        </button>
        <button onClick={() => insertText('### ')} className="p-2 hover:bg-[var(--hover-bg)] rounded" title="Heading 3">
          <Heading3 size={16} className="text-gray-600 dark:text-gray-400" />
        </button>
        <div className="w-px h-6 bg-[var(--border-color)]" />
        <button onClick={() => insertText('- ')} className="p-2 hover:bg-[var(--hover-bg)] rounded" title="Bullet List">
          <List size={16} className="text-gray-600 dark:text-gray-400" />
        </button>
        <button onClick={() => insertText('1. ')} className="p-2 hover:bg-[var(--hover-bg)] rounded" title="Numbered List">
          <ListOrdered size={16} className="text-gray-600 dark:text-gray-400" />
        </button>
        <div className="w-px h-6 bg-[var(--border-color)]" />
        <button onClick={() => insertText('`', '`')} className="p-2 hover:bg-[var(--hover-bg)] rounded" title="Inline Code">
          <Code size={16} className="text-gray-600 dark:text-gray-400" />
        </button>
        <button onClick={() => insertText('> ')} className="p-2 hover:bg-[var(--hover-bg)] rounded" title="Quote">
          <Quote size={16} className="text-gray-600 dark:text-gray-400" />
        </button>
        <button onClick={handleDoubleLink} className="p-2 hover:bg-[var(--hover-bg)] rounded" title="Double Link [[]]">
          <Link2 size={16} className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        {(mode === 'edit' || mode === 'split') && (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            placeholder="Start writing in Markdown..."
            className={cn(
              "flex-1 p-4 resize-none bg-transparent outline-none font-mono text-sm",
              "text-gray-900 dark:text-white",
              mode === 'split' && "border-r border-[var(--border-color)]"
            )}
          />
        )}
        
        {/* Preview */}
        {(mode === 'preview' || mode === 'split') && (
          <div className="flex-1 p-4 overflow-y-auto markdown-editor">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '')
                  const isInline = !match
                  return !isInline && match ? (
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  )
                },
                a({ href, children, ...props }) {
                  const isWikiLink = href?.startsWith('[[') && href?.endsWith(']]')
                  if (isWikiLink && href) {
                    const noteTitle = href.slice(2, -2)
                    return (
                      <span
                        className="wiki-link"
                        onClick={() => router.push(`/app/note/${noteTitle}`)}
                      >
                        {children}
                      </span>
                    )
                  }
                  return (
                    <a href={href} {...props} target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  )
                }
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* Folder Picker Dropdown */}
      {showFolderPicker && (
        <div className="absolute right-20 top-24 bg-white dark:bg-gray-800 border border-[var(--border-color)] rounded-md shadow-lg z-10">
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
        <div className="absolute right-12 top-24 bg-white dark:bg-gray-800 border border-[var(--border-color)] rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
          <div className="p-2">
            {tags.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-400">No tags yet</div>
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