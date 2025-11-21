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
          select: { id: true, email: true, name: true, passwordHash: true },
        });
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(creds.password, user.passwordHash);
        if (!ok) return null;

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
        if (process.env.NODE_ENV !== "production") {
          console.log("[DEV] Magic link:", url);
        }

        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY ?? "");
        const to = identifier.trim();

        await resend.emails.send({
          to,
          from: (provider.from ?? "dwella <no-reply@dwella.com>") as string,
          subject: "Your Dwella sign-in link",
          html: `<p>Click to sign in:</p><p><a href="${url}">${url}</a></p>`,
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
          select: { id: true, role: true, proStatus: true },
        });
        if (dbUser) {
          t.sub = dbUser.id;
          t.role = dbUser.role;
          t.proStatus = dbUser.proStatus ?? null;
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