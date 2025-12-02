// src/app/layout.tsx
import React from "react";
import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata = {
  title: "MyDwella",
  description: "Your home's digital record",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{ backgroundColor: "#000000", color: "#ffffff" }}
        className="bg-black text-white"
      >
        <SessionProviderWrapper>
          <ToastProvider>{children}</ToastProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}