/**
 * ADMIN AUDIT LOGGING
 *
 * Tracks all admin actions for accountability.
 * Stores actor, action type, target entity, and changes.
 *
 * Location: lib/auditLog.ts
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type AuditAction =
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_SUSPENDED"
  | "USER_ACTIVATED"
  | "USER_ROLE_CHANGED"
  | "USER_IMPERSONATED"
  | "PRO_APPROVED"
  | "PRO_REJECTED"
  | "HOME_UPDATED"
  | "HOME_REASSIGNED"
  | "HOME_DELETED"
  | "TRANSFER_CANCELLED"
  | "TRANSFER_COMPLETED"
  | "CONNECTION_ARCHIVED"
  | "SYSTEM_TASK_RUN";

export type AuditEntity =
  | "User"
  | "Home"
  | "HomeTransfer"
  | "Connection"
  | "JobRequest"
  | "System";

type AuditLogParams = {
  actorId: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  homeId?: string;
  diff?: Prisma.InputJsonValue;
};

export async function logAdminAction({
  actorId,
  action,
  entity,
  entityId,
  homeId,
  diff,
}: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId,
        action,
        entity,
        entityId,
        homeId: homeId ?? null,
        diff: diff ?? Prisma.JsonNull,
      },
    });
  } catch (error) {
    console.error("[AUDIT ERROR]", error);
  }
}