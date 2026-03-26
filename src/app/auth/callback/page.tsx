'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        router.push('/app')
      } else {
        router.push('/login')
      }
    }

    handleAuthCallback()
  }, [router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  )
}