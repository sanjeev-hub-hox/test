import { useEffect, useRef } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/router'

export const useTokenRefresh = () => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const intervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (status === 'authenticated' && session) {
      const sessionData = session as any

      // If token refresh failed, sign out immediately
      if (sessionData.error === 'RefreshAccessTokenError' || sessionData.error === 'RefreshTokenExpired') {
        const callbackUrl = encodeURIComponent(router.asPath)
        signIn('keycloak', { callbackUrl }) // Redirects back after login

        return
      }

      // Update localStorage with current tokens
      if (sessionData.accessToken) {
        localStorage.setItem('token', sessionData.accessToken)
        localStorage.setItem('refreshToken', sessionData.refreshToken)
        localStorage.setItem('idToken', sessionData.idToken)
      }

      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }

      // Check session every 2 minutes to trigger refresh if needed
      intervalRef.current = setInterval(async () => {
        try {
          const response = await fetch('/api/auth/session')
          const updatedSession = await response.json()

          if (updatedSession?.error) {
            const callbackUrl = encodeURIComponent(router.asPath)
            signIn('keycloak', { callbackUrl }) // Redirects back after login
          } else if (updatedSession?.accessToken) {
            // Update localStorage with refreshed tokens
            localStorage.setItem('token', updatedSession.accessToken)
            localStorage.setItem('refreshToken', updatedSession.refreshToken)
            localStorage.setItem('idToken', updatedSession.idToken)
          }
        } catch (error) {}
      }, 6 * 60 * 1000) // 6 minutes
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [status, session, router])
}
