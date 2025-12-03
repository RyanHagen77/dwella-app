// lib/auth.ts
import "server-only";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { NextAuthOptions } from "next-auth";
import type { Role, ProStatus } from "@prisma/client";
import type { JWT } from "next-auth/jwt";
import EmailProvider from "next-auth/providers/email";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

/* ---------- Extended Token type ---------- */
interface AppToken extends JWT {
  sub?: string;
  email?: string;
  role?: Role;
  proStatus?: ProStatus | null;
  emailVerified?: string | null;
  profileComplete?: boolean;
}

/* ---------- NextAuth Config ---------- */
export const authConfig: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: creds.email },
          select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
            emailVerified: true,
            profileComplete: true,
          },
        });

        // No user or no password set → invalid credentials
        if (!user?.passwordHash) return null;

        // ✅ Verify password with bcrypt
        const ok = await bcrypt.compare(creds.password, user.passwordHash);
        if (!ok) return null;

        // ✅ Require verified email for password login
        if (!user.emailVerified) {
          // This will surface as an error on the login page (e.g. error=EMAIL_NOT_VERIFIED)
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        // (Optional) you can also gate on profileComplete here if you want.
        // For now we just return the user and can handle profile completion via middleware.
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
        };
      },
    }),

    EmailProvider({
      from: process.env.EMAIL_FROM ?? "Dwella <no-reply@dwella.com>",
      async sendVerificationRequest({ identifier, url, provider }) {
        const email = identifier.trim().toLowerCase();

        // 🔒 Only send magic link if this email already belongs to a user.
        // This prevents the "new email → magic link → empty account" problem.
        const existingUser = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });

        if (!existingUser) {
          if (process.env.NODE_ENV !== "production") {
            console.log(
              "[EmailProvider] Magic link requested for non-existent user:",
              email
            );
          }
          // Silently exit: no email is sent, and no account will be created.
          // User should instead go through your explicit signup flow.
          return;
        }

        if (process.env.NODE_ENV !== "production") {
          console.log("[DEV] Magic link:", url);
        }

        const serverToken = process.env.POSTMARK_SERVER_TOKEN;
        if (!serverToken) {
          console.error(
            "[EmailProvider] POSTMARK_SERVER_TOKEN is not set – magic link email will not be sent."
          );
          return;
        }

        const { ServerClient } = await import("postmark");
        const client = new ServerClient(serverToken);
        const messageStream =
          process.env.POSTMARK_MESSAGE_STREAM || "outbound";

        const from =
          (provider.from as string | undefined) ??
          process.env.EMAIL_FROM ??
          "Dwella <no-reply@dwella.com>";

        await client.sendEmail({
          From: from,
          To: email,
          Subject: "Your Dwella sign-in link",
          HtmlBody: `<p>Click to sign in:</p><p><a href="${url}">${url}</a></p>`,
          TextBody: `Click to sign in:\n${url}`,
          MessageStream: messageStream,
        });
      },
    }),
  ],

  pages: {
    signIn: "/login",
    verifyRequest: "/login/check-email",
  },

  callbacks: {
    /* ---------- JWT ---------- */
    async jwt({ token, user }) {
      const t = token as AppToken;

      if (user) {
        t.sub = user.id as string;
        t.email = user.email ?? t.email;
      }

      if (t.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: t.email },
          select: {
            id: true,
            role: true,
            proStatus: true,
            emailVerified: true,
            profileComplete: true,
          },
        });

        if (dbUser) {
          t.sub = dbUser.id;
          t.role = dbUser.role;
          t.proStatus = dbUser.proStatus ?? null;
          t.emailVerified = dbUser.emailVerified?.toISOString() ?? null;
          t.profileComplete = dbUser.profileComplete;
        }
      }

      return t;
    },

    /* ---------- Session ---------- */
    async session({ session, token }) {
      const t = token as AppToken;
      if (session.user && t.sub) {
        session.user.id = t.sub;
        session.user.role = t.role;
        session.user.proStatus = t.proStatus ?? null;
        session.user.emailVerified = t.emailVerified ?? null;
        session.user.profileComplete = t.profileComplete ?? false;
      }
      return session;
    },
  },

  events: {
    // Keep hook available for future use — disable lint locally
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async createUser(_event) {
      /* optionally seed defaults */
    },
  },
};