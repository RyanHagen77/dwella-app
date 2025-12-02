import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

type VerifyEmailPageProps = {
  searchParams: { token?: string };
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const token = searchParams.token;

  if (!token) {
    return (
      <main className="min-h-screen flex items-center justify-center text-white">
        <p>Invalid verification link.</p>
      </main>
    );
  }

  const record = await prisma.emailVerificationToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!record || record.expiresAt < new Date()) {
    if (record) {
      await prisma.emailVerificationToken.delete({ where: { token } });
    }

    return (
      <main className="min-h-screen flex items-center justify-center text-white">
        <p>This verification link is invalid or has expired.</p>
      </main>
    );
  }

  // Mark user as verified
  await prisma.user.update({
    where: { id: record.userId },
    data: { emailVerified: new Date() },
  });

  // Remove token so it can't be reused
  await prisma.emailVerificationToken.delete({
    where: { token },
  });

  // You can show a nice success screen instead if you prefer
  redirect("/login?verified=1");
}