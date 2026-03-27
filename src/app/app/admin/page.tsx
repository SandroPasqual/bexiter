'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2, Users, Trash2, KeyRound, AlertCircle, CheckCircle, Shield } from 'lucide-react'

interface UserEntry {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  email_confirmed_at: string | null
}

export default function AdminPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<UserEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [sendingReset, setSendingReset] = useState<string | null>(null)

  const getToken = useCallback(async () => {
    const { createSupabaseBrowserClient } = await import('@/lib/supabase')
    const supabase = createSupabaseBrowserClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }, [])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const token = await getToken()
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUsers(data.users)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    }
    setLoading(false)
  }, [getToken])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const deleteUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to delete user ${email}? This action cannot be undone.`)) return

    setDeleting(userId)
    setActionMessage('')
    try {
      const token = await getToken()
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUsers(prev => prev.filter(u => u.id !== userId))
      setActionMessage(`User ${email} deleted successfully`)
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : 'Failed to delete user')
    }
    setDeleting(null)
    setTimeout(() => setActionMessage(''), 5000)
  }

  const sendResetPassword = async (email: string) => {
    setSendingReset(email)
    setActionMessage('')
    try {
      const token = await getToken()
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'reset_password', email })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setActionMessage(`Password reset email sent to ${email}`)
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : 'Failed to send reset email')
    }
    setSendingReset(null)
    setTimeout(() => setActionMessage(''), 5000)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--background)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-[var(--danger)] mx-auto" />
          <p className="text-[var(--danger)]">{error}</p>
          <button onClick={loadUsers} className="px-4 py-2 bg-[var(--accent)] text-white rounded-md">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen overflow-y-auto bg-[var(--background)] p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
            <Shield size={24} />
            Admin
          </h1>
          <span className="text-sm text-[var(--muted)]">
            Logged in as {user?.email}
          </span>
        </div>

        {actionMessage && (
          <div className={`flex items-center gap-2 p-3 rounded-md text-sm ${
            actionMessage.includes('success') || actionMessage.includes('sent')
              ? 'bg-green-500/10 text-green-500'
              : 'bg-red-500/10 text-[var(--danger)]'
          }`}>
            {actionMessage.includes('success') || actionMessage.includes('sent')
              ? <CheckCircle size={16} />
              : <AlertCircle size={16} />}
            {actionMessage}
          </div>
        )}

        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-[var(--border-color)] flex items-center gap-2">
            <Users size={20} className="text-[var(--accent)]" />
            <h2 className="font-semibold text-[var(--foreground)]">Users ({users.length})</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--muted)]">
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3 hidden md:table-cell">Registered</th>
                  <th className="text-left p-3 hidden md:table-cell">Last Login</th>
                  <th className="text-left p-3 hidden md:table-cell">Confirmed</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-[var(--border-color)] hover:bg-[var(--hover-bg)]">
                    <td className="p-3 text-[var(--foreground)]">{u.email}</td>
                    <td className="p-3 text-[var(--muted)] hidden md:table-cell">{formatDate(u.created_at)}</td>
                    <td className="p-3 text-[var(--muted)] hidden md:table-cell">{formatDate(u.last_sign_in_at)}</td>
                    <td className="p-3 hidden md:table-cell">
                      {u.email_confirmed_at ? (
                        <span className="text-green-500">Yes</span>
                      ) : (
                        <span className="text-yellow-500">Pending</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => sendResetPassword(u.email!)}
                          disabled={sendingReset === u.email}
                          className="p-2 rounded hover:bg-[var(--hover-bg)] text-[var(--muted)] hover:text-[var(--accent)]"
                          title="Send password reset email"
                        >
                          {sendingReset === u.email
                            ? <Loader2 size={16} className="animate-spin" />
                            : <KeyRound size={16} />}
                        </button>
                        <button
                          onClick={() => deleteUser(u.id, u.email!)}
                          disabled={deleting === u.id || u.email === user?.email}
                          className="p-2 rounded hover:bg-[var(--hover-bg)] text-[var(--muted)] hover:text-[var(--danger)] disabled:opacity-30"
                          title={u.email === user?.email ? "Can't delete yourself" : 'Delete user'}
                        >
                          {deleting === u.id
                            ? <Loader2 size={16} className="animate-spin" />
                            : <Trash2 size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
