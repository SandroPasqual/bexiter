'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { Loader2, User, Mail, Lock, BarChart3, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'

export default function ProfilePage() {
  const { user } = useAuth()
  const supabaseRef = useRef(createSupabaseBrowserClient())
  const supabase = supabaseRef.current

  const [displayName, setDisplayName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const [stats, setStats] = useState({ notes: 0, folders: 0, tags: 0 })

  useEffect(() => {
    if (user) {
      setDisplayName(user.user_metadata?.display_name || '')
      loadStats()
    }
  }, [user])

  const loadStats = async () => {
    const [notesRes, foldersRes, tagsRes] = await Promise.all([
      supabase.from('notes').select('id', { count: 'exact', head: true }),
      supabase.from('folders').select('id', { count: 'exact', head: true }),
      supabase.from('tags').select('id', { count: 'exact', head: true })
    ])
    setStats({
      notes: notesRes.count || 0,
      folders: foldersRes.count || 0,
      tags: tagsRes.count || 0
    })
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setSaveMessage('')

    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName }
    })

    if (error) {
      setSaveMessage(error.message)
    } else {
      setSaveMessage('Profile updated successfully')
    }
    setSaving(false)
    setTimeout(() => setSaveMessage(''), 3000)
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    setPasswordSuccess('')

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }

    setChangingPassword(true)

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordSuccess('Password changed successfully')
      setNewPassword('')
      setConfirmPassword('')
    }
    setChangingPassword(false)
  }

  return (
    <div className="h-screen overflow-y-auto bg-[var(--background)] p-6 md:p-10">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Profile</h1>

        {/* Account Info */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
            <User size={20} />
            Account
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--muted)] mb-1">Email</label>
              <div className="flex items-center gap-2 px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md text-[var(--foreground)]">
                <Mail size={16} className="text-[var(--muted)]" />
                {user?.email}
              </div>
            </div>

            <div>
              <label htmlFor="display-name" className="block text-sm font-medium text-[var(--muted)] mb-1">Display Name</label>
              <input
                id="display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="px-4 py-2 bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent-hover)] disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              Save
            </button>

            {saveMessage && (
              <p className={`text-sm ${saveMessage.includes('success') ? 'text-green-500' : 'text-[var(--danger)]'}`}>
                {saveMessage}
              </p>
            )}
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
            <Lock size={20} />
            Change Password
          </h2>

          <div className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 6 characters)"
                className="w-full px-3 py-2 pr-10 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--muted)]"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-3 py-2 pr-10 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>

            {passwordError && (
              <div className="flex items-center gap-2 text-[var(--danger)] text-sm">
                <AlertCircle size={16} />
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="flex items-center gap-2 text-green-500 text-sm">
                <CheckCircle size={16} />
                {passwordSuccess}
              </div>
            )}

            <button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="px-4 py-2 bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent-hover)] disabled:opacity-50 flex items-center gap-2"
            >
              {changingPassword && <Loader2 size={16} className="animate-spin" />}
              Update Password
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
            <BarChart3 size={20} />
            Statistics
          </h2>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-[var(--input-bg)] rounded-lg">
              <div className="text-3xl font-bold text-[var(--accent)]">{stats.notes}</div>
              <div className="text-sm text-[var(--muted)]">Notes</div>
            </div>
            <div className="text-center p-4 bg-[var(--input-bg)] rounded-lg">
              <div className="text-3xl font-bold text-[var(--accent)]">{stats.folders}</div>
              <div className="text-sm text-[var(--muted)]">Folders</div>
            </div>
            <div className="text-center p-4 bg-[var(--input-bg)] rounded-lg">
              <div className="text-3xl font-bold text-[var(--accent)]">{stats.tags}</div>
              <div className="text-sm text-[var(--muted)]">Tags</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
