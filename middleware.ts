import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token
    const role = token?.role as string | undefined

    // Admin-only routes
    if (pathname.startsWith('/admin') && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Client-only routes — team cannot access /cliente
    if (pathname.startsWith('/cliente') && role !== 'CLIENT') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Team routes — clients cannot access these pages
    const teamRoutes = ['/dashboard', '/feedbacks', '/vendas', '/anuncios', '/visao-geral', '/concorrencia', '/estoque']
    if (teamRoutes.some(r => pathname.startsWith(r)) && role === 'CLIENT') {
      return NextResponse.redirect(new URL('/cliente', req.url))
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
    '/visao-geral/:path*',
    '/concorrencia/:path*',
    '/estoque/:path*',
    '/admin/:path*',
    '/cliente/:path*',
    // /conectar is intentionally excluded — public route
  ],
}
