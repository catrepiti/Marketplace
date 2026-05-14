import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import AppleProvider from 'next-auth/providers/apple'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { client: { select: { id: true, name: true, slug: true } } },
        })

        if (!user || !user.password) return null

        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          clientId: user.clientId,
          clientName: user.client?.name ?? null,
          clientSlug: user.client?.slug ?? null,
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
    ...(process.env.APPLE_ID
      ? [
          AppleProvider({
            clientId: process.env.APPLE_ID ?? '',
            clientSecret: process.env.APPLE_SECRET ?? '',
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.clientId = (user as any).clientId
        token.clientName = (user as any).clientName
        token.clientSlug = (user as any).clientSlug
      }
      // Refresh role from DB on each token refresh
      if (token.sub && !user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          include: { client: { select: { id: true, name: true, slug: true } } },
        })
        if (dbUser) {
          token.role = dbUser.role
          token.clientId = dbUser.clientId
          token.clientName = dbUser.client?.name ?? null
          token.clientSlug = dbUser.client?.slug ?? null
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.sub
        ;(session.user as any).role = token.role
        ;(session.user as any).clientId = token.clientId
        ;(session.user as any).clientName = token.clientName
        ;(session.user as any).clientSlug = token.clientSlug
      }
      return session
    },
    async signIn({ user, account }) {
      // For OAuth providers, assign CLIENT role by default if new user
      if (account?.provider !== 'credentials') {
        const existing = await prisma.user.findUnique({ where: { email: user.email! } })
        if (!existing) {
          await prisma.user.update({
            where: { email: user.email! },
            data: { role: 'CLIENT' },
          })
        }
      }
      return true
    },
  },
}
