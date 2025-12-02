/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */

import type { Role, ProStatus } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role?: Role;
      proStatus?: ProStatus | null;
      emailVerified?: string | null;
      profileComplete?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    proStatus?: ProStatus | null;
    emailVerified?: string | null;
    profileComplete?: boolean;
  }
}