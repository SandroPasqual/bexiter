'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, UserPlus, Trash2, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase'

interface Collaborator {
  id: string
  email: string
  role: 'view' | 'edit'
  created_at: string
}

interface ShareDialogProps {
  noteId: string
  ownerId: string
  currentUserEmail: string
  onClose: () => void
}

export function ShareDialog({ noteId, ownerId, currentUserEmail, onClose }: ShareDialogProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'view' | 'edit'>('view')
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  const supabase = createSupabaseBrowserClient()

  const loadCollaborators = useCallback(async () => {
    const { data } = await supabase
      .from('note_collaborators')
      .select('id, email, role, created_at')
      .eq('note_id', noteId)
      .order('created_at')

    if (data) setCollaborators(data)
    setLoading(false)
  }, [noteId, supabase])

  useEffect(() => {
    loadCollaborators()
  }, [loadCollaborators])

  const invite = async () => {
    if (!inviteEmail.trim()) return
    if (inviteEmail.toLowerCase() === currentUserEmail.toLowerCase()) {
      setMessage({ text: 'You cannot invite yourself', type: 'error' })
      return
    }

    setInviting(true)
    setMessage({ text: '', type: '' })

    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', inviteEmail.toLowerCase())
      .single()

    const { error } = await supabase
      .from('note_collaborators')
      .insert({
        note_id: noteId,
        email: inviteEmail.toLowerCase(),
        user_id: existingUser?.id || null,
        role: inviteRole,
        invited_by: ownerId
      })

    if (error) {
      if (error.code === '23505') {
        setMessage({ text: 'This user is already a collaborator', type: 'error' })
      } else {
        setMessage({ text: error.message, type: 'error' })
      }
    } else {
      setMessage({ text: `Invitation sent to ${inviteEmail}`, type: 'success' })
      setInviteEmail('')
      loadCollaborators()
    }
    setInviting(false)
  }

  const removeCollaborator = async (id: string) => {
    await supabase.from('note_collaborators').delete().eq('id', id)
    setCollaborators(prev => prev.filter(c => c.id !== id))
  }

  const updateRole = async (id: string, role: 'view' | 'edit') => {
    await supabase.from('note_collaborators').update({ role }).eq('id', id)
    setCollaborators(prev => prev.map(c => c.id === id ? { ...c, role } : c))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <h3 className="font-semibold text-[var(--foreground)]">Share Note</h3>
          <button onClick={onClose} className="p-1 hover:bg-[var(--hover-bg)] rounded">
            <X size={18} className="text-[var(--muted)]" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Invite */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--muted)]">Invite by email</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && invite()}
                placeholder="email@example.com"
                className="flex-1 px-3 py-2 text-sm bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'view' | 'edit')}
                className="px-2 py-2 text-sm bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md text-[var(--foreground)]"
              >
                <option value="view">View</option>
                <option value="edit">Edit</option>
              </select>
              <button
                onClick={invite}
                disabled={inviting}
                className="px-3 py-2 bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                {inviting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              </button>
            </div>
          </div>

          {message.text && (
            <div className={`flex items-center gap-2 text-sm ${
              message.type === 'success' ? 'text-green-500' : 'text-[var(--danger)]'
            }`}>
              {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {message.text}
            </div>
          )}

          {/* Collaborators list */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--muted)]">People with access</label>

            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-[var(--muted)]" />
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-[var(--foreground)]">{currentUserEmail}</span>
                  <span className="text-xs text-[var(--accent)] font-medium">Owner</span>
                </div>

                {collaborators.map(collab => (
                  <div key={collab.id} className="flex items-center justify-between px-3 py-2 text-sm hover:bg-[var(--hover-bg)] rounded">
                    <span className="text-[var(--foreground)]">{collab.email}</span>
                    <div className="flex items-center gap-1">
                      <select
                        value={collab.role}
                        onChange={(e) => updateRole(collab.id, e.target.value as 'view' | 'edit')}
                        className="text-xs bg-transparent border border-[var(--border-color)] rounded px-1 py-0.5 text-[var(--muted)]"
                      >
                        <option value="view">View</option>
                        <option value="edit">Edit</option>
                      </select>
                      <button
                        onClick={() => removeCollaborator(collab.id)}
                        className="p-1 hover:bg-[var(--hover-bg)] rounded text-[var(--muted)] hover:text-[var(--danger)]"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {collaborators.length === 0 && (
                  <div className="text-xs text-[var(--muted)] text-center py-2">
                    No collaborators yet
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
