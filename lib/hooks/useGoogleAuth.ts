'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'

export interface GoogleAuthState {
  loading: boolean
  error: string | null
  success: boolean
}

export function useGoogleAuth() {
  const router = useRouter()
  const [state, setState] = useState<GoogleAuthState>({
    loading: false,
    error: null,
    success: false,
  })

  /**
   * Initialize Google OAuth flow
   */
  const initializeGoogleAuth = useCallback(async () => {
    try {
      setState({ loading: true, error: null, success: false })

      // Get Google OAuth URL from backend
      const response = await fetch('/api/auth/google/init')

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to initialize Google OAuth')
      }

      const { authUrl } = await response.json()

      // Redirect to Google login
      window.location.href = authUrl
    } catch (error: any) {
      setState({
        loading: false,
        error: error.message || 'Google OAuth initialization failed',
        success: false,
      })
    }
  }, [])

  /**
   * Handle OAuth callback with authorization code
   */
  const handleOAuthCallback = useCallback(
    async (code: string) => {
      try {
        setState({ loading: true, error: null, success: false })

        // Exchange code for authentication
        const response = await fetch('/api/auth/google/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Authentication failed')
        }

        const { user } = await response.json()

        setState({ loading: false, error: null, success: true })

        // Redirect to dashboard
        router.push('/dashboard')
      } catch (error: any) {
        setState({
          loading: false,
          error: error.message || 'Authentication failed',
          success: false,
        })
      }
    },
    [router]
  )

  return {
    ...state,
    initializeGoogleAuth,
    handleOAuthCallback,
  }
}
