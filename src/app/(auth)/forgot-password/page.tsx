'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2, Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const { sendPasswordResetEmail } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await sendPasswordResetEmail(email)

    if (error) {
      setError(error.message || 'Failed to send reset email')
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
            Check your email
          </h2>
          <p className="text-[var(--muted)]">
            We sent a password reset link to <strong>{email}</strong>.
            Click the link to reset your password.
          </p>
          <a
            href="/login"
            className="inline-flex items-center gap-2 text-[var(--accent)] hover:text-[var(--accent-hover)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </a>
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
            Reset your password
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">Email address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 pl-10 py-3 border border-[var(--border-color)] placeholder-[var(--placeholder)] text-[var(--foreground)] bg-[var(--input-bg)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent sm:text-sm"
                placeholder="Email address"
              />
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
                'Send reset link'
              )}
            </button>
          </div>

          <div className="text-center text-sm">
            <a href="/login" className="inline-flex items-center gap-2 font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]">
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
