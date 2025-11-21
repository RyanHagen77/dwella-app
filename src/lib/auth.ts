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
      from: process.env.EMAIL_FROM ?? "Dwella <hello@mydwellaapp.com>",
      async sendVerificationRequest({ identifier, url, provider }) {
        if (process.env.NODE_ENV !== "production") {
          console.log("[DEV] Magic link:", url);
        }

        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY ?? "");
        const to = identifier.trim();

        await resend.emails.send({
          to,
          from: (provider.from ?? "Dwella <hello@mydwellaapp.com>") as string,
          subject: "Sign in to Dwella",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #ffffff; background: linear-gradient(135deg, #33C17D 0%, #2BA36A 100%); padding: 20px; border-radius: 12px; margin: 0; font-size: 24px;">
                  Dwella
                </h1>
              </div>
              
              <div style="background: #f9f9f9; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
                <h2 style="color: #333; margin-top: 0; font-size: 20px;">Sign in to Dwella</h2>
                <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
                  Click the button below to sign in to your account:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${url}" 
                     style="background: linear-gradient(135deg, #F35A1F 0%, #E04A0F 100%); 
                            color: white; 
                            padding: 14px 32px; 
                            text-decoration: none; 
                            border-radius: 8px; 
                            display: inline-block;
                            font-weight: 600;
                            font-size: 15px;">
                    Sign In to Dwella
                  </a>
                </div>
                
                <p style="color: #999; font-size: 14px; line-height: 1.5; margin: 0 0 8px 0;">
                  Or copy and paste this link into your browser:
                </p>
                <p style="color: #F35A1F; font-size: 13px; word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 6px; margin: 0 0 20px 0;">
                  ${url}
                </p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                  <p style="color: #999; font-size: 13px; margin: 0 0 8px 0;">
                    ⏱️ This link expires in <strong>24 hours</strong>
                  </p>
                  <p style="color: #999; font-size: 13px; margin: 0;">
                    🔒 If you didn't request this, you can safely ignore this email
                  </p>
                </div>
              </div>
              
              <div style="text-align: center; color: #999; font-size: 12px;">
                <p style="margin: 0;">
                  The Dwella Team<br>
                  <a href="https://mydwellaapp.com" style="color: #33C17D; text-decoration: none;">mydwellaapp.com</a>
                </p>
              </div>
            </div>
          `,
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