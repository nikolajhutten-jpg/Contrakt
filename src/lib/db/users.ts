import { db } from "@/lib/db/client";
import type { User, UserRole } from "@/types";

export async function getUserById(
  userId: string,
  tenantId: string,
): Promise<User | null> {
  return db.user.findFirst({
    where: { id: userId, tenantId },
  });
}

export async function getUserByAuth0Id(
  auth0Id: string,
  tenantId: string,
): Promise<User | null> {
  return db.user.findFirst({
    where: { auth0Id, tenantId },
  });
}

export async function getUsersByTenant(tenantId: string): Promise<User[]> {
  return db.user.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
  });
}

export interface CreateUserInput {
  tenantId: string;
  auth0Id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  return db.user.create({
    data: {
      tenantId: input.tenantId,
      auth0Id: input.auth0Id,
      name: input.name,
      email: input.email,
      role: input.role,
      departmentId: input.departmentId ?? null,
    },
  });
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: UserRole;
  departmentId?: string | null;
  slackUserId?: string | null;
}

export async function updateUser(
  userId: string,
  tenantId: string,
  input: UpdateUserInput,
): Promise<User> {
  return db.user.update({
    where: { id: userId, tenantId },
    data: input,
  });
}

/**
 * Deactivation is modelled as deletion at the db layer.
 * The caller (service layer) is responsible for syncing seat count with Stripe.
 */
export async function deactivateUser(
  userId: string,
  tenantId: string,
): Promise<void> {
  await db.user.delete({
    where: { id: userId, tenantId },
  });
}
