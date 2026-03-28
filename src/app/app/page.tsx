'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { FileText, FolderOpen, Tag, Plus } from 'lucide-react'
import { stripHtml } from '@/lib/utils'
import type { NoteWithTags } from '@/types'

export default function AppPage() {
  const { user } = useAuth()
  const router = useRouter()
  const supabaseRef = useRef(createSupabaseBrowserClient())
  const supabase = supabaseRef.current

  const [recentNotes, setRecentNotes] = useState<NoteWithTags[]>([])
  const [folderCount, setFolderCount] = useState(0)
  const [tagCount, setTagCount] = useState(0)

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadDashboardData = async () => {
    const { data: notes } = await supabase
      .from('notes')
      .select('*, tags(*), folder:folders(*)')
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })
      .limit(5)
    if (notes) setRecentNotes(notes as NoteWithTags[])

    const { count: folders } = await supabase
      .from('folders')
      .select('*', { count: 'exact', head: true })
    setFolderCount(folders || 0)

    const { count: tags } = await supabase
      .from('tags')
      .select('*', { count: 'exact', head: true })
    setTagCount(tags || 0)
  }

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'there'

  return (
    <div className="h-full p-8 overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
          Welcome back, {displayName}
        </h1>
        <p className="text-[var(--muted)] mb-8">
          Your personal knowledge companion
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-[var(--card-bg)] rounded-lg border border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              <FileText size={24} className="text-[var(--accent)]" />
              <div>
                <div className="text-2xl font-bold text-[var(--foreground)]">
                  {recentNotes.length}+
                </div>
                <div className="text-sm text-[var(--muted)]">Recent Notes</div>
              </div>
            </div>
          </div>
          <div className="p-4 bg-[var(--card-bg)] rounded-lg border border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              <FolderOpen size={24} className="text-[var(--accent)]" />
              <div>
                <div className="text-2xl font-bold text-[var(--foreground)]">
                  {folderCount}
                </div>
                <div className="text-sm text-[var(--muted)]">Folders</div>
              </div>
            </div>
          </div>
          <div className="p-4 bg-[var(--card-bg)] rounded-lg border border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              <Tag size={24} className="text-[var(--accent)]" />
              <div>
                <div className="text-2xl font-bold text-[var(--foreground)]">
                  {tagCount}
                </div>
                <div className="text-sm text-[var(--muted)]">Tags</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
            Quick Actions
          </h2>
          <button
            onClick={() => router.push('/app/note/new')}
            className="flex items-center gap-2 px-4 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)]"
          >
            <Plus size={20} />
            Create New Note
          </button>
        </div>

        {/* Recent Notes */}
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
            Recent Notes
          </h2>
          {recentNotes.length === 0 ? (
            <div className="text-[var(--muted)] text-center py-8">
              No notes yet. Create your first note to get started!
            </div>
          ) : (
            <div className="space-y-2">
              {recentNotes.map(note => (
                <button
                  key={note.id}
                  onClick={() => router.push(`/app/note/${note.id}`)}
                  className="w-full text-left p-4 bg-[var(--card-bg)] rounded-lg border border-[var(--border-color)] hover:bg-[var(--hover-bg)] transition-colors"
                >
                  <div className="font-medium text-[var(--foreground)]">
                    {note.title || 'Untitled'}
                  </div>
                  <div className="text-sm text-[var(--muted)] mt-1">
                    {stripHtml(note.content || '').substring(0, 100)}...
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
