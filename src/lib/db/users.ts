import { db as prisma } from "@/lib/db/client";
import type { User, UserRole } from "@/types";

export async function getUserById(
  userId: string,
  tenantId: string,
): Promise<User | null> {
  return prisma.user.findFirst({
    where: { id: userId, tenantId },
  });
}

export async function getUserByClerkId(clerkId: string) {
  return prisma.user.findFirst({
    where: { clerkId },
  })
}

export async function getUserByEmail(email: string) {
  return prisma.user.findFirst({
    where: { email },
  });
}

export async function getUsersByTenant(tenantId: string): Promise<User[]> {
  return prisma.user.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
  });
}

export interface CreateUserInput {
  tenantId: string;
  clerkId: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  return prisma.user.create({
    data: {
      tenantId: input.tenantId,
      clerkId: input.clerkId,
      name: input.name,
      email: input.email,
      role: input.role,
      departmentId: input.departmentId ?? null,
    },
  });
}

export interface UpdateUserInput {
  clerkId?: string;
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
  return prisma.user.update({
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
  await prisma.user.delete({
    where: { id: userId, tenantId },
  });
}
