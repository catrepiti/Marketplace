import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token
    const role = token?.role as string | undefined

    if (pathname.startsWith('/admin') && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/visao-geral', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/feedbacks/:path*',
    '/vendas/:path*',
    '/anuncios/:path*',
    '/garimpador/:path*',
    '/precificador/:path*',
    '/dre/:path*',
    '/visao-geral/:path*',
    '/admin/:path*',
    '/minha-conta/:path*',
  ],
}
