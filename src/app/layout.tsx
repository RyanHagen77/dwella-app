
import React from "react";
import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata = {
  title: "MyHomeDox",
  description: "Your home's digital record",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProviderWrapper>
          <ToastProvider>
            {children}
          </ToastProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}