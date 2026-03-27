'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold, Italic, Underline as UnderlineIcon,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code, Link2, Undo2, Redo2
} from 'lucide-react'
import { cn } from '@/lib/utils'

type TemplateMode = 'compact' | 'medium' | 'reader'

interface TiptapEditorProps {
  content: string
  onChange: (html: string) => void
  template?: TemplateMode
  placeholder?: string
}

export function TiptapEditor({ content, onChange, template = 'medium', placeholder = 'Start writing...' }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: true,
        autolink: true,
      }),
      Placeholder.configure({ placeholder }),
    ],
    content,
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
    },
  })

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

  const setLink = () => {
    const url = window.prompt('URL:', 'https://')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
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
        <ToolBtn onClick={setLink} active={editor.isActive('link')} title="Link">
          <Link2 size={16} />
        </ToolBtn>

        <Divider />

        <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
          <Undo2 size={16} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
          <Redo2 size={16} />
        </ToolBtn>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto p-6">
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
