import { auth } from '@clerk/nextjs/server'
import { getUserByClerkId } from '@/lib/db/users'
import { getTenantById } from '@/lib/db/tenants'
import { forbidden } from '@/lib/api/response'
import { UserRole } from '@/types'

export async function resolveAuthContext() {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthenticated')

  const user = await getUserByClerkId(userId)
  if (!user) throw new Error('User not found')

  const tenant = await getTenantById(user.tenantId)
  if (!tenant) throw new Error('Tenant not found')

  return { localUser: user, tenant, tenantId: tenant.id }
}

export async function requireAuth() {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthenticated')
  return userId
}

export async function requireRole(role: UserRole | UserRole[]) {
  const ctx = await resolveAuthContext()
  const allowed = Array.isArray(role) ? role : [role]
  if (!allowed.includes(ctx.localUser.role)) throw forbidden()
  return ctx
}
