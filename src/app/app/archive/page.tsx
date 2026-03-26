'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { Archive, RotateCcw, Trash2 } from 'lucide-react'
import type { NoteWithTags } from '@/types'

export default function ArchivePage() {
  const { user } = useAuth()
  const supabase = createSupabaseBrowserClient()
  
  const [archivedNotes, setArchivedNotes] = useState<NoteWithTags[]>([])

  useEffect(() => {
    if (user) {
      loadArchivedNotes()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadArchivedNotes = async () => {
    const { data } = await supabase
      .from('notes')
      .select('*, tags(*), folder:folders(*)')
      .eq('is_archived', true)
      .order('updated_at', { ascending: false })
    
    if (data) setArchivedNotes(data as NoteWithTags[])
  }

  const unarchiveNote = async (noteId: string) => {
    await supabase
      .from('notes')
      .update({ is_archived: false })
      .eq('id', noteId)
    
    loadArchivedNotes()
  }

  const permanentlyDelete = async (noteId: string) => {
    if (!confirm('Are you sure you want to permanently delete this note? This cannot be undone.')) return
    
    await supabase.from('notes').delete().eq('id', noteId)
    loadArchivedNotes()
  }

  return (
    <div className="h-full p-8 overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Archive size={28} className="text-gray-600 dark:text-gray-400" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Archive
          </h1>
        </div>

        {archivedNotes.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            No archived notes
          </div>
        ) : (
          <div className="space-y-2">
            {archivedNotes.map(note => (
              <div
                key={note.id}
                className="flex items-center justify-between p-4 bg-[var(--sidebar-bg)] rounded-lg border border-[var(--border-color)]"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {note.title || 'Untitled'}
                  </div>
                  <div className="text-sm text-gray-500">
                    Archived {new Date(note.updated_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => unarchiveNote(note.id)}
                    className="p-2 hover:bg-[var(--hover-bg)] rounded text-green-500"
                    title="Restore"
                  >
                    <RotateCcw size={18} />
                  </button>
                  <button
                    onClick={() => permanentlyDelete(note.id)}
                    className="p-2 hover:bg-[var(--hover-bg)] rounded text-red-500"
                    title="Delete permanently"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}