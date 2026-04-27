import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // return NextResponse.next() // test

  // const { url } = request
  const { pathname, search } = request.nextUrl
  const forwardedHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  // console.log('xHost:', host)
  // console.log('xMiddlewareInvokedFor:', pathname)
  // console.log('xSearchparams:', search)
  // console.log('xForwardedHost:', forwardedHost)

  if (forwardedHost === 'pre.vgos.org' && pathname === '/' && search.includes('?id=')) {
    const hash = search.split('?id=')[1]

    try {
      const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}marketing/enquiry/getshortUrl/${hash}`)

      // Check if the response is successful
      if (!apiResponse.ok) {
        // Redirect to referral-view with error parameter
        if (apiResponse.status === 404) {
          return NextResponse.redirect(new URL('/referral-view?error=expired', request.url))
        }

        // For other errors
        return NextResponse.redirect(new URL('/referral-view?error=invalid', request.url))
      }

      const responseData = await apiResponse.json()

      // Validate response data structure
      if (!responseData || !responseData.data || !responseData.data.url) {
        return NextResponse.redirect(new URL('/referral-view?error=invalid', request.url))
      }

      const { data } = responseData

      // Successfully got the URL, redirect to it
      return NextResponse.redirect(new URL(data.url))
    } catch (err) {
      // Redirect to referral-view with error parameter
      return NextResponse.redirect(new URL('/referral-view?error=server', request.url))
    }
  }

  const response = NextResponse.next()

  // 🔹 Handle short URL redirection
  if (pathname === '/referral-view' || pathname.startsWith('/referral-view/')) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/accept-terms-conditions/')) {
    return response
  } else {
    const cookieNames = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      '__Secure-next-auth.session-token.0',
      '__Secure-next-auth.session-token.1',
      '__Secure-next-auth.session-token.2'
    ]

    cookieNames.forEach(cookie => {
      if (request.cookies.has(cookie) && request.nextUrl.hostname !== 'ampersandgroup.in') {
        response.cookies.delete(cookie)
      }
    })

    const token =
      request.cookies.get('next-auth.session-token.1') ||
      request.cookies.get('next-auth.session-token') ||
      request.cookies.get('__Secure-next-auth.session-token') ||
      request.cookies.get('__Secure-next-auth.session-token.0') ||
      request.cookies.get('__Secure-next-auth.session-token.1')

    // const stagedit = /\/stages\/edit\/([a-zA-Z0-9_-]+)/
    // const enquiryTypeEdit = /\/enquiry-type\/edit\/([a-zA-Z0-9_-]+)/
    // const enquiryTypeMapStage = /\/enquiry-type\/map-stage\/([a-zA-Z0-9_-]+)/
    // const enquiryTypeMapStageEdit = /\/enquiry-type\/map-stage\/\/edit\/([a-zA-Z0-9_-]+)/
    // const enquiryDetails = /\/enquiries\/detail\/([a-zA-Z0-9_-]+)/

    // return NextResponse.next() //For bypass keycloak
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/static') ||
      pathname.startsWith('/images') ||
      pathname == '/signIn'
    ) {
      if (token) {
        if (pathname === '/signIn') {
          return NextResponse.redirect(new URL('/', request.url))
        } else {
          return response
        }
      }

      return NextResponse.next()
    } else if (process.env.NODE_ENV === 'production') {
      //return NextResponse.next();
      if (token) {
        if (pathname === '/signIn') {
          return response
        }

        return NextResponse.next()
      } else {
        if (pathname === '/') {
          return response
        } else {
          return NextResponse.redirect(new URL('/', request.url))
        }
      }
    }
  }

  // if (!token) {

  //   return NextResponse.redirect(new URL('/login', request.url))
  // } else if (
  //   // pathname == "/" ||
  //   pathname == '/login/'
  // ) {
  //   // return NextResponse.redirect(new URL('/home', request.url))
  // }
}
