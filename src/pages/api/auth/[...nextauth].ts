import KeycloakProvider from 'next-auth/providers/keycloak'
import NextAuth, { type NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENTID || '',
      clientSecret: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_SECRET || '',
      issuer: `${process.env.NEXT_PUBLIC_KEYCLOAK_URL}/realms/${process.env.NEXT_PUBLIC_KEYCLOAK_REALM}`
    })
  ],

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: 'jwt'
  },

  callbacks: {
    async session({ session, token }: any) {
      session.user.id = token.id
      session.accessToken = token.accessToken
      session.refreshToken = token.refreshToken
      session.idToken = token.idToken
      session.error = token.error || null
      session.accessTokenExpires = token.accessTokenExpires || null
      session.realTime = token.realTime || null
      session.refreshTokenExpires = token.refreshTokenExpires || null

      return session
    },

    async jwt({ token, user, account }: any) {
      const refreshWindow = 5 * 60 * 1000

      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.idToken = account.id_token
        token.accessTokenExpires = account.expires_at * 1000
        token.refreshTokenExpires = Date.now() + account.refresh_expires_in * 1000
        token.id = user?.id || null

        return token
      }

      if (Date.now() < (token.accessTokenExpires ?? 0) - refreshWindow) {
        return token
      }

      if (token.refreshTokenExpires && Date.now() > token.refreshTokenExpires) {
        return { ...token, error: 'RefreshTokenExpired' }
      }

      return await refreshAccessToken(token)
    },

    async redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) ? url : baseUrl
    }
  },

  cookies: {
    sessionToken: {
      name: '__Secure-next-auth.session-token',
      options: {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        domain: process.env.NEXT_PUBLIC_DOMAIN
      }
    },
    callbackUrl: {
      name: '__Secure-next-auth.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: true,
        httpOnly: true
      }
    }
  }
}

async function refreshAccessToken(token: any) {
  try {
    const url = `${process.env.NEXT_PUBLIC_KEYCLOAK_URL}/realms/${process.env.NEXT_PUBLIC_KEYCLOAK_REALM}/protocol/openid-connect/token`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENTID || '',
        client_secret: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_SECRET || '',
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken || ''
      })
    })

    const refreshedTokens = await response.json()
    if (!response.ok) {
      throw new Error(`Failed to refresh access token:- ${JSON.stringify(refreshedTokens)}`)
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      refreshTokenExpires: refreshedTokens.refresh_expires_in
        ? Date.now() + refreshedTokens.refresh_expires_in * 1000
        : null,
      idToken: refreshedTokens.id_token
    }
  } catch (error) {
    return {
      ...token,
      error: 'RefreshAccessTokenError'
    }
  }
}

export default NextAuth(authOptions)
