'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { useState, useEffect, useRef } from 'react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import {
  Bold, Italic, Underline as UnderlineIcon,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code, Link2, Link2Off, Undo2, Redo2, Search, FileText, X, CheckSquare, Table as TableIcon
} from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import type { NoteWithTags } from '@/types'

type TemplateMode = 'compact' | 'medium' | 'reader'

interface TiptapEditorProps {
  content: string
  onChange: (html: string) => void
  template?: TemplateMode
  placeholder?: string
}

export function TiptapEditor({ content, onChange, template = 'medium', placeholder = 'Start writing...' }: TiptapEditorProps) {
  const [showLinkDropdown, setShowLinkDropdown] = useState(false)
  const [showTableDropdown, setShowTableDropdown] = useState(false)
  const [linkUrl, setLinkUrl] = useState('https://')
  const [linkMode, setLinkMode] = useState<'url' | 'note'>('url')
  const [noteSearch, setNoteSearch] = useState('')
  const [notes, setNotes] = useState<NoteWithTags[]>([])
  const [filteredNotes, setFilteredNotes] = useState<NoteWithTags[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)
  const tableDropdownRef = useRef<HTMLDivElement>(null)
  const savedSelectionRef = useRef<{ from: number; to: number } | null>(null)
  const supabaseRef = useRef(createSupabaseBrowserClient())
  const supabase = supabaseRef.current

  useEffect(() => {
    const loadNotes = async () => {
      const { data } = await supabase
        .from('notes')
        .select('id, title')
        .eq('is_archived', false)
        .order('title')
        .limit(50)
      if (data) {
        setNotes(data as NoteWithTags[])
        setFilteredNotes(data as NoteWithTags[])
      }
    }
    loadNotes()
  }, [])

  useEffect(() => {
    if (noteSearch.trim()) {
      const filtered = notes.filter(n => 
        n.title?.toLowerCase().includes(noteSearch.toLowerCase())
      )
      setFilteredNotes(filtered)
    } else {
      setFilteredNotes(notes.slice(0, 10))
    }
  }, [noteSearch, notes])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowLinkDropdown(false)
      }
      if (tableDropdownRef.current && !tableDropdownRef.current.contains(e.target as Node)) {
        setShowTableDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          'data-internal': 'false',
        },
      }),
      Placeholder.configure({ placeholder }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          'focus:outline-none min-h-[200px] prose dark:prose-invert max-w-none',
          template === 'compact' && 'template-compact',
          template === 'medium' && 'template-medium',
          template === 'reader' && 'template-reader',
        ),
      },
      handleClickOn(view, pos, node, nodePos, event, direct) {
        const target = event.target as HTMLElement
        const a = target.closest('a')
        if (a) {
          const href = a.getAttribute('href')
          if (href && href.startsWith('/app/note/')) {
            window.location.href = href
            return true
          }
        }
        return false
      },
    },
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editor) return
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (!editor.state.selection.empty) {
          savedSelectionRef.current = {
            from: editor.state.selection.from,
            to: editor.state.selection.to
          }
        }
        setShowLinkDropdown(true)
        setLinkUrl('https://')
        setLinkMode('url')
        setNoteSearch('')
        setFilteredNotes(notes.slice(0, 10))
      }
      if (e.key === 'Escape') {
        setShowLinkDropdown(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [editor, notes])

  useEffect(() => {
    const handleSave = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
      }
    }
    document.addEventListener('keydown', handleSave)
    return () => document.removeEventListener('keydown', handleSave)
  }, [])

  if (!editor) return null

  const toggleBold = () => editor.chain().focus().toggleBold().run()
  const toggleItalic = () => editor.chain().focus().toggleItalic().run()
  const toggleUnderline = () => editor.chain().focus().toggleUnderline().run()
  const toggleH1 = () => editor.chain().focus().toggleHeading({ level: 1 }).run()
  const toggleH2 = () => editor.chain().focus().toggleHeading({ level: 2 }).run()
  const toggleH3 = () => editor.chain().focus().toggleHeading({ level: 3 }).run()
  const toggleBulletList = () => editor.chain().focus().toggleBulletList().run()
  const toggleOrderedList = () => editor.chain().focus().toggleOrderedList().run()
  const toggleBlockquote = () => editor.chain().focus().toggleBlockquote().run()
  const toggleCode = () => editor.chain().focus().toggleCode().run()
  const toggleTaskList = () => editor.chain().focus().toggleTaskList().run()
  const insertTable = (rows = 3, cols = 3) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
    setShowTableDropdown(false)
  }

  const setLink = () => {
    if (showLinkDropdown) {
      setShowLinkDropdown(false)
      return
    }
    if (!editor.state.selection.empty) {
      savedSelectionRef.current = {
        from: editor.state.selection.from,
        to: editor.state.selection.to
      }
    } else {
      savedSelectionRef.current = null
    }
    setShowLinkDropdown(true)
    setLinkUrl('https://')
    setLinkMode('url')
    setNoteSearch('')
    setFilteredNotes(notes.slice(0, 10))
  }

  const applyLink = () => {
    if (savedSelectionRef.current) {
      editor.chain()
        .focus()
        .setTextSelection(savedSelectionRef.current)
        .extendMarkRange('link')
        .setLink({ href: linkUrl })
        .run()
      savedSelectionRef.current = null
    } else if (!editor.state.selection.empty) {
      if (linkMode === 'url' && linkUrl) {
        editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
      } else if (linkMode === 'note' && linkUrl.startsWith('/app/note/')) {
        editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
      }
    }
    setShowLinkDropdown(false)
  }

  const selectNote = (noteId: string, noteTitle: string) => {
    if (savedSelectionRef.current) {
      editor.chain()
        .focus()
        .setTextSelection(savedSelectionRef.current)
        .extendMarkRange('link')
        .setLink({ href: `/app/note/${noteId}` })
        .run()
      savedSelectionRef.current = null
    } else if (!editor.state.selection.empty) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: `/app/note/${noteId}` }).run()
    }
    setShowLinkDropdown(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-4 py-2 border-b border-[var(--border-color)] flex-wrap">
        <ToolBtn onClick={toggleBold} active={editor.isActive('bold')} title="Bold">
          <Bold size={16} />
        </ToolBtn>
        <ToolBtn onClick={toggleItalic} active={editor.isActive('italic')} title="Italic">
          <Italic size={16} />
        </ToolBtn>
        <ToolBtn onClick={toggleUnderline} active={editor.isActive('underline')} title="Underline">
          <UnderlineIcon size={16} />
        </ToolBtn>

        <Divider />

        <ToolBtn onClick={toggleH1} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
          <Heading1 size={16} />
        </ToolBtn>
        <ToolBtn onClick={toggleH2} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <Heading2 size={16} />
        </ToolBtn>
        <ToolBtn onClick={toggleH3} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
          <Heading3 size={16} />
        </ToolBtn>

        <Divider />

        <ToolBtn onClick={toggleBulletList} active={editor.isActive('bulletList')} title="Bullet List">
          <List size={16} />
        </ToolBtn>
        <ToolBtn onClick={toggleOrderedList} active={editor.isActive('orderedList')} title="Numbered List">
          <ListOrdered size={16} />
        </ToolBtn>
        <ToolBtn onClick={toggleBlockquote} active={editor.isActive('blockquote')} title="Quote">
          <Quote size={16} />
        </ToolBtn>
        <ToolBtn onClick={toggleCode} active={editor.isActive('code')} title="Code">
          <Code size={16} />
        </ToolBtn>
        <ToolBtn onClick={toggleTaskList} active={editor.isActive('taskList')} title="Checklist">
          <CheckSquare size={16} />
        </ToolBtn>
        <div className="relative" ref={tableDropdownRef}>
          <ToolBtn onClick={() => setShowTableDropdown(!showTableDropdown)} title="Insert Table">
            <TableIcon size={16} />
          </ToolBtn>
          {showTableDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-md shadow-lg z-50 p-3 min-w-40">
              <div className="text-xs text-[var(--muted)] mb-2 font-medium">Insert table</div>
              <div className="grid grid-cols-3 gap-2">
                {[2, 3, 4].map(rows => 
                  [2, 3, 4].map(cols => (
                    <button
                      key={`${rows}x${cols}`}
                      onClick={() => insertTable(rows, cols)}
                      className="px-3 py-2 text-sm hover:bg-[var(--hover-bg)] rounded bg-[var(--input-bg)] whitespace-nowrap"
                    >
                      {rows}×{cols}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <div className="relative" ref={dropdownRef}>
          <ToolBtn onClick={setLink} active={editor.isActive('link')} title="Link">
            <Link2 size={16} />
          </ToolBtn>
          {editor.isActive('link') && (
            <ToolBtn onClick={() => editor.chain().focus().unsetLink().run()} title="Remove Link">
              <Link2Off size={16} />
            </ToolBtn>
          )}
          
          {showLinkDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-md shadow-lg z-50 w-64 p-2">
              <div className="flex flex-col gap-2">
                <div className="flex gap-1 border-b border-[var(--border-color)] pb-2">
                  <button
                    onClick={(e) => { 
                      e.preventDefault(); 
                      if (!savedSelectionRef.current && !editor.state.selection.empty) {
                        savedSelectionRef.current = { from: editor.state.selection.from, to: editor.state.selection.to }
                      }
                      editor.chain().focus().run(); 
                      setLinkMode('url'); 
                    }}
                    className={cn(
                      'flex-1 px-2 py-1 text-xs rounded',
                      linkMode === 'url' ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)]'
                    )}
                  >
                    URL
                  </button>
                  <button
                    onClick={(e) => { 
                      e.preventDefault(); 
                      if (!savedSelectionRef.current && !editor.state.selection.empty) {
                        savedSelectionRef.current = { from: editor.state.selection.from, to: editor.state.selection.to }
                      }
                      editor.chain().focus().run(); 
                      setLinkMode('note'); 
                    }}
                    className={cn(
                      'flex-1 px-2 py-1 text-xs rounded',
                      linkMode === 'note' ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)]'
                    )}
                  >
                    Note
                  </button>
                </div>
                
                {linkMode === 'url' ? (
                  <input
                    type="text"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://"
                    className="w-full px-2 py-1.5 text-sm bg-[var(--input-bg)] border border-[var(--border-color)] rounded text-[var(--foreground)]"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && applyLink()}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="flex flex-col gap-1">
                    <input
                      type="text"
                      value={noteSearch}
                      onChange={(e) => setNoteSearch(e.target.value)}
                      placeholder="Search notes..."
                      className="w-full px-2 py-1.5 text-sm bg-[var(--input-bg)] border border-[var(--border-color)] rounded text-[var(--foreground)]"
                      autoFocus
                      onMouseDown={(e) => e.stopPropagation()}
                    />
                    <div className="max-h-32 overflow-y-auto">
                      {filteredNotes.map(note => (
                        <button
                          key={note.id}
                          onClick={() => selectNote(note.id, note.title)}
                          onMouseDown={(e) => e.preventDefault()}
                          className="w-full text-left px-2 py-1.5 text-sm hover:bg-[var(--hover-bg)] rounded flex items-center gap-2 text-[var(--foreground)]"
                        >
                          <FileText size={14} />
                          <span className="truncate">{note.title || 'Untitled'}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <button
                  onClick={applyLink}
                  className="w-full px-2 py-1.5 text-sm bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-hover)]"
                >
                  Add Link
                </button>
              </div>
            </div>
          )}
        </div>

        <Divider />

        <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
          <Undo2 size={16} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
          <Redo2 size={16} />
        </ToolBtn>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto px-6 pt-2 pb-6">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

function ToolBtn({ onClick, active, disabled, title, children }: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'p-2 rounded hover:bg-[var(--hover-bg)] transition-colors',
        active && 'bg-[var(--hover-bg)] text-[var(--accent)]',
        disabled && 'opacity-30 cursor-not-allowed',
        !active && !disabled && 'text-gray-600 dark:text-gray-400'
      )}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-6 bg-[var(--border-color)] mx-1" />
}
