import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export type Role = 'ADMIN' | 'ASSESSOR' | 'CLIENT'

export async function getSession() {
  return getServerSession(authOptions)
}

export type AppUser = {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  role: Role
  clientId?: string | null
  clientName?: string | null
  clientSlug?: string | null
}

export function isTeamRole(role: Role) {
  return ['ADMIN', 'ASSESSOR'].includes(role)
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  ASSESSOR: 'Assessoria',
  CLIENT: 'Cliente',
}
