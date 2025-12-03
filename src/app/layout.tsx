// src/app/layout.tsx
import React from "react";
import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata = {
  title: "MyDwella",
  description: "Your home's digital record",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-black text-white antialiased overflow-x-hidden">
        <SessionProviderWrapper>
          <ToastProvider>{children}</ToastProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}