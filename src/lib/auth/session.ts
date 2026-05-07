import { auth } from '@clerk/nextjs/server'
import { getUserByClerkId } from '@/lib/db/users'
import { getTenantById } from '@/lib/db/tenants'
import { forbidden } from '@/lib/api/response'
import { UserRole, TenantPlanStatus } from '@/types'

interface AuthOptions {
  /** Skip the setupComplete guard — use only for routes that must work during onboarding. */
  skipSetupCheck?: boolean
}

export async function resolveAuthContext(options?: AuthOptions) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthenticated')

  const user = await getUserByClerkId(userId)
  if (!user) throw new Error('User not found')

  const tenant = await getTenantById(user.tenantId)
  if (!tenant) throw new Error('Tenant not found')

  if (
    tenant.planStatus === TenantPlanStatus.Canceled ||
    tenant.planStatus === TenantPlanStatus.ReadOnly
  ) {
    throw Object.assign(
      new Error('Your subscription has been canceled. Please renew your plan to continue.'),
      { status: 403 },
    )
  }

  if (!tenant.setupComplete && !options?.skipSetupCheck) {
    throw Object.assign(new Error('Setup not complete.'), { status: 403 })
  }

  return {
    localUser: user,
    tenant,
    tenantId: tenant.id,
    isPastDue: tenant.planStatus === TenantPlanStatus.PastDue,
  }
}

export async function requireAuth() {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthenticated')
  return userId
}

export async function requireRole(role: UserRole | UserRole[], options?: AuthOptions) {
  const ctx = await resolveAuthContext(options)
  const allowed = Array.isArray(role) ? role : [role]
  if (!allowed.includes(ctx.localUser.role)) throw forbidden()
  return ctx
}
