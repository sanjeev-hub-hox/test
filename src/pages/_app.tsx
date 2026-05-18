'use client'
// ** React Imports
import { ReactNode, useState, useEffect } from 'react'

// ** Next Imports
import Head from 'next/head'

import { Router, useRouter } from 'next/router'
import type { NextPage } from 'next'
import type { AppProps } from 'next/app'

// ** Loader Import
import NProgress from 'nprogress'

// ** Emotion Imports
import { CacheProvider } from '@emotion/react'
import type { EmotionCache } from '@emotion/cache'

// ** Config Imports

import themeConfig from 'src/configs/themeConfig'

// ** Fake-DB Import
// import 'src/@fake-db'

// ** Third Party Import

// ** Component Imports
import UserLayout from 'src/layouts/UserLayout'
import ThemeComponent from 'src/@core/theme/ThemeComponent'
import AuthGuard from 'src/@core/components/auth/AuthGuard'
import GuestGuard from 'src/@core/components/auth/GuestGuard'

// ** Spinner Import
import Spinner from 'src/@core/components/spinner'

// ** Contexts
import { AuthProvider } from 'src/context/AuthContext'
import { SettingsConsumer, SettingsProvider } from 'src/@core/context/settingsContext'

// ** Styled Components

// ** Utils Imports
import { createEmotionCache } from 'src/@core/utils/create-emotion-cache'

// ** Prismjs Styles
import 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'

// ** React Perfect Scrollbar Style
import 'react-perfect-scrollbar/dist/css/styles.css'

import 'src/iconify-bundle/icons-bundle-react'

// ** Global css styles
import '../../styles/globals.css'
import '../../styles/style.css'
import { getSession, SessionProvider, signIn } from 'next-auth/react'
import { GlobalContextProvider } from 'src/context/store'
import { GlobalProvider } from '../@core/global/GlobalContext'

import { postRequest } from 'src/services/apiService'
import FooterContent from 'src/@core/layouts/components/shared-components/footer/FooterContent'
import { Box } from '@mui/system'
import { useTheme } from '@mui/material'
import CustomHeader from 'src/OwnComponents/AppBar/CustomHeader'
import { usePathname } from 'next/navigation'
import { useTokenRefresh } from 'src/hooks/useTokenRefresh'
import { SSO_TOKEN } from 'src/utils/constants'

// ✅ RBAC: PermissionGuard — gates pages based on userInfo.permissions from localStorage
import PermissionGuard from 'src/components/auth/PermissionGuard'

// ** Extend App Props with Emotion
type ExtendedAppProps = AppProps & {
  Component: NextPage
  emotionCache: EmotionCache
}

type GuardProps = {
  authGuard: boolean
  guestGuard: boolean
  children: ReactNode
}

const clientSideEmotionCache = createEmotionCache()

// ** Pace Loader
if (themeConfig.routingLoader) {
  Router.events.on('routeChangeStart', () => {
    NProgress.start()
  })
  Router.events.on('routeChangeError', () => {
    NProgress.done()
  })
  Router.events.on('routeChangeComplete', () => {
    NProgress.done()
  })
}

const Guard = ({ children, guestGuard }: GuardProps) => {
  // if (guestGuard) {
  //   return <GuestGuard fallback={<Spinner />}>{children}</GuestGuard>
  // } else if (!guestGuard && !authGuard) {
  //   return <>{children}</>
  // } else {
  //   return <AuthGuard fallback={<Spinner />}>{children}</AuthGuard>
  // }

  if (guestGuard) {
    return <GuestGuard fallback={<Spinner />}>{children}</GuestGuard>
  } else {
    return <AuthGuard fallback={<Spinner />}>{children}</AuthGuard>
  }
}

// Component that handles token refresh automatically
const AppContent = ({ children }: { children: ReactNode }) => {
  useTokenRefresh() // This handles all token refresh logic

  return <>{children}</>
}
const PUBLIC_ROUTES = [
  // in public routes
  '/referral-view',
  '/signIn',
  '/accept-terms-conditions'
]

const hasAllowedLob = (rbacData: any): boolean => {
  const lobs = rbacData?.lobs ?? rbacData?.userInfo?.lobs
  const lobCodes = rbacData?.lobCodes ?? rbacData?.userInfo?.lobCodes

  return (
    (Array.isArray(lobs) && lobs.length > 0) ||
    (Array.isArray(lobCodes) && lobCodes.length > 0)
  )
}

const App = (props: ExtendedAppProps) => {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props
  const theme = useTheme()
  const pathName = usePathname()
  const [authGuard, setAuthGuard] = useState<boolean>(false)
  const [guestGuard, setguestGuard] = useState<boolean>(false)
  const [isClient, setIsClient] = useState<boolean>(false)
  const [mobileView, setMobileView] = useState<boolean>(false)
  const [mounted, setMounted] = useState(false)

  const router = useRouter()

  // const { data: session }:any = useSession();

  // useEffect(() => {
  //   if (session && session.accessToken) {
  //     // Store the refreshed token in localStorage
  //     localStorage.setItem('token', session.accessToken);
  //     console.log('Token stored in localStorage:', session.accessToken);
  //   }
  // }, [session]);
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (PUBLIC_ROUTES.some(route => router.pathname.startsWith(route))) {
      return
    }

    const checkSession = async () => {
      const session = await getSession()
      if (!session) {
        const callbackUrl = encodeURIComponent(router.asPath)

        signIn('keycloak', { callbackUrl })
      }
    }

    checkSession()
  }, [router.pathname])

  // useEffect(() => {
  //   const refreshTokenInterval = setInterval(async () => {
  //     const session: any = await getSession()
  //     if (session) {
  //       const decodedToken = decodeJWT(session.accessToken)

  //       if (decodedToken) {
  //         const callRedirect = checkJwtExp(decodedToken?.exp)

  //         if (callRedirect) {

  //           const newSession = await getSession()

  //           if (!newSession) {
  //             console.warn('No session found, user may not be logged in.')

  //             return null
  //           }
  //           try {
  //             const response = await fetch('/api/auth/session')
  //             const updatedSession = await response.json()
  //             console.log('Sucess refreshing session:', updatedSession)

  //             return updatedSession
  //           } catch (error) {
  //             console.error('Error refreshing session:', error)

  //             return null
  //           }
  //         }
  //       }
  //     }
  //   }, 2 * 60 * 1000)

  //   return () => clearInterval(refreshTokenInterval)
  // }, [])

  // Variables
  const contentHeightFixed = Component.contentHeightFixed ?? false
  const getLayout =
    Component.getLayout ?? (page => <UserLayout contentHeightFixed={contentHeightFixed}>{page}</UserLayout>)

  const setConfig = Component.setConfig ?? undefined

  // const authGuard = Component.authGuard ?? true

  // const guestGuard = Component.guestGuard ?? false

  useEffect(() => {
    const queryParams = router.query
    if (queryParams.platform === 'mobile') {
      setMobileView(true)
      setAuthGuard(true)
      setguestGuard(false)
    }
  }, [router.query])

  const fetchRBAC = async () => {
    setIsClient(true)

    // Do not call RBAC or downstream APIs on the maintenance route — they return 503 and
    // apiService would navigate here again, causing a full reload loop.
    if (router.pathname === '/503') {
      const sessionVal503: any = await getSession()
      if (sessionVal503?.accessToken) {
        localStorage.setItem('token', sessionVal503.accessToken)
        localStorage.setItem('refreshToken', sessionVal503.refreshToken)
        localStorage.setItem('idToken', sessionVal503.idToken)
        localStorage.setItem('userDetails', JSON.stringify(sessionVal503.user))
        setAuthGuard(true)
        setguestGuard(false)
      } else if (localStorage.getItem('token')) {
        setAuthGuard(true)
        setguestGuard(false)
      } else {
        setAuthGuard(false)
        setguestGuard(true)
      }

      return
    }

    if (process.env.NODE_ENV == 'development') {
      localStorage.setItem('token', SSO_TOKEN || '')
    }
    const sessionVal: any = await getSession()

    if (sessionVal?.accessToken) {
      localStorage.setItem('token', sessionVal?.accessToken)
      localStorage.setItem('refreshToken', sessionVal?.refreshToken)
      localStorage.setItem('idToken', sessionVal?.idToken)

      localStorage.setItem('userDetails', JSON.stringify(sessionVal?.user))
      try {
        const apiRequest = {
          url: `/api/rbac-role-permissions/role-permissions-for-user`,
          serviceURL: 'mdm',
          data: {
            user_email: sessionVal?.user ? sessionVal?.user.email : 'danik.shera@ampersandgroup.in',
            application_id: 1,
            service: 'marketing_service'
          },
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_MDM_TOKEN}`
          }
        }
        const response: any = await postRequest(apiRequest)

        if (response.success) {
          if (!hasAllowedLob(response?.data)) {
            localStorage.removeItem('userInfo')
            setAuthGuard(true)
            setguestGuard(false)
            router.replace('/403')

            return
          }

          const isFirstTimeSetting = !localStorage.getItem('userInfo')

          localStorage.setItem('userInfo', JSON.stringify(response?.data))
          if (isFirstTimeSetting) {
            window.location.reload()
          }
        }
      } catch (error) { }

      setAuthGuard(true)
      setguestGuard(false)
    } else {
      setAuthGuard(false)
      setguestGuard(true)
    }

    // Example of accessing localStorage on the client side
    const token = localStorage.getItem('token')
    if (token) {
      setAuthGuard(true)
      setguestGuard(false)
    }
  }

  useEffect(() => {
    fetchRBAC()
  }, [])

  // ─────────────────────────────────────────────────────────────────────────────
  // ✅ RBAC: Skip PermissionGuard for standalone/public pages that bypass layout.
  // These pages don't need RBAC gating — they are either public or mobile-only.
  // ─────────────────────────────────────────────────────────────────────────────
  const isStandalonePage =
    pathName?.startsWith('/accept-terms-conditions/') ||
    pathName?.startsWith('/referralconfirmation') ||
    mobileView

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <title>{`Marketing - Ampersand`}</title>
        <meta name='description' content={`${themeConfig.templateName} Ampersand`} />
        <meta name='keywords' content='Ampersand' />
        <meta name='viewport' content='initial-scale=1, width=device-width' />
      </Head>
      <GlobalProvider>
        <GlobalContextProvider>
          <AuthProvider>
            <SettingsProvider {...(setConfig ? { pageSettings: setConfig() } : {})}>
              <SettingsConsumer>
                {({ settings }) => {
                  return (
                    <SessionProvider
                      session={pageProps.session}
                      refetchInterval={3 * 60} // Auto-refetch session every 3 minutes
                      refetchOnWindowFocus={true} // Refetch when window regains focus
                    >
                      <ThemeComponent settings={settings}>
                        <AppContent>
                          <Guard authGuard={authGuard} guestGuard={guestGuard}>
                            {/* <AclGuard aclAbilities={aclAbilities} guestGuard={guestGuard} authGuard={authGuard}> */}
                            {/* {isClient && !mobileView ? (
                            getLayout(<Component {...pageProps} />)
                          ) : (
                            <Component {...pageProps} />
                          )} */}
                            {mounted && (
                              <>
                                {/* ── Normal layout pages (with sidebar) ── */}
                                {!isStandalonePage && isClient && (
                                  // ✅ RBAC: PermissionGuard wraps only layout pages.
                                  // Standalone/public pages are excluded (see isStandalonePage above).
                                  // Guard reads userInfo.permissions from localStorage (set by fetchRBAC)
                                  // and redirects to /403 if the user lacks the required permission.
                                  <PermissionGuard>
                                    {getLayout(<Component {...pageProps} />)}
                                  </PermissionGuard>
                                )}

                                {/* ── Standalone pages (no sidebar — no RBAC check needed) ── */}
                                {isStandalonePage && (
                                  <Box
                                    sx={{
                                      width: '100%',
                                      height: '100%',
                                      maxWidth: '600px',
                                      margin: '50px auto',
                                      padding: '20px',
                                      background: '#fff',
                                      borderRadius: '10px',
                                      boxShadow: 1
                                    }}
                                  >
                                    <Component {...pageProps} />
                                  </Box>
                                )}
                              </>
                            )}

                            {(pathName?.startsWith('/accept-terms-conditions/') || mobileView) && (
                              <Box sx={{ background: theme.palette.common.white, padding: '20px' }}>
                                <CustomHeader />
                                <Component {...pageProps} />
                                <Box
                                  sx={{
                                    width: '100%',
                                    padding: '16px',
                                    background: '#f7f7f9',
                                    height: '60px',
                                    mt: 5
                                  }}
                                >
                                  <FooterContent />
                                </Box>
                              </Box>
                            )}
                            {/* </AclGuard> */}
                          </Guard>
                        </AppContent>
                      </ThemeComponent>
                    </SessionProvider>
                  )
                }}
              </SettingsConsumer>
            </SettingsProvider>
          </AuthProvider>
        </GlobalContextProvider>
      </GlobalProvider>
    </CacheProvider>
  )
}

export default App
