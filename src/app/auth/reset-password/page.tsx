'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Lock, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const supabaseRef = useRef(createSupabaseBrowserClient())
  const supabase = supabaseRef.current

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message || 'Failed to reset password')
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold text-[var(--foreground)]">
            Password reset successful
          </h2>
          <p className="text-[var(--muted)]">
            Your password has been updated. You can now sign in with your new password.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="inline-flex items-center justify-center py-3 px-6 border border-transparent text-sm font-medium rounded-md text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)]"
          >
            Go to login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-[0.3em] text-[var(--foreground)]">BEXITER</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Set your new password
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="sr-only">New password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[var(--muted)]" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 pl-10 pr-10 py-3 border border-[var(--border-color)] placeholder-[var(--placeholder)] text-[var(--foreground)] bg-[var(--input-bg)] rounded-t-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent sm:text-sm"
                  placeholder="New password (min 6 characters)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">Confirm new password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[var(--muted)]" />
                </div>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 pl-10 pr-10 py-3 border border-[var(--border-color)] placeholder-[var(--placeholder)] text-[var(--foreground)] bg-[var(--input-bg)] rounded-b-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent sm:text-sm"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-[var(--danger)] text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Reset password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
