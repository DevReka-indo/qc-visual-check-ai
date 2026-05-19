import { type NextRequest, NextResponse } from 'next/server'
import { verifyTokenEdge } from '@/lib/auth/edge'

const AUTH_COOKIE_NAME = "auth-token"

const PUBLIC_ROUTES = ['/auth', '/register']

const PROTECTED_ROUTES = [
    '/',
    '/database',
    '/detection-result',
    '/user',
    '/statistic',
    '/api/upload'
]

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    console.log("\n==============================")
    console.log("MIDDLEWARE REQUEST")
    console.log("==============================")
    console.log("PATHNAME:", pathname)

    // Get auth token from cookies
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value

    console.log("HAS TOKEN:", !!token)

    if (token) {
        console.log("TOKEN PREVIEW:", token.slice(0, 30) + "...")
    }

    // Verify token
    let payload = null

    try {
        payload = token ? await verifyTokenEdge(token) : null

        console.log("TOKEN PAYLOAD:", payload)
    } catch (error) {
        console.error("TOKEN VERIFY ERROR:", error)
    }

    const isValidToken = payload !== null

    console.log("IS VALID TOKEN:", isValidToken)

    // Public routes
    if (PUBLIC_ROUTES.includes(pathname)) {
        console.log("PUBLIC ROUTE")

        // Already logged in
        if (isValidToken) {
            console.log("REDIRECTING TO HOME")

            return NextResponse.redirect(
                new URL('/', request.url)
            )
        }

        console.log("ALLOW PUBLIC ACCESS")

        return NextResponse.next()
    }

    // Protected routes
    const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
        route === '/'
            ? pathname === '/'
            : pathname.startsWith(route),
    )

    console.log("IS PROTECTED ROUTE:", isProtectedRoute)

    if (isProtectedRoute) {
        if (!isValidToken) {

            console.log("UNAUTHORIZED ACCESS")

            if (pathname.startsWith('/api/')) {
                console.log("RETURN 401 API")

                return NextResponse.json(
                    { error: 'Unauthorized' },
                    { status: 401 }
                )
            }

            console.log("REDIRECT TO /auth")

            return NextResponse.redirect(
                new URL('/auth', request.url)
            )
        }

        console.log("AUTHORIZED ACCESS")

        return NextResponse.next()
    }

    console.log("ALLOW OTHER ROUTE")

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}