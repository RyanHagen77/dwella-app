import React from "react";
import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata = {
  title: "MyDwella",
  description: "Your home's digital record",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-black text-white antialiased">
        <div className="fixed inset-0 -z-50">
          <div className="absolute inset-0 bg-[url('/myhomedox_home3.webp')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-black/55" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.55))]" />
        </div>

        <SessionProviderWrapper>
          <ToastProvider>{children}</ToastProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}