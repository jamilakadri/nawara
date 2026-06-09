import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmartHR — Onboarding Platform",
  description: "Plateforme RH intelligente pour un onboarding structuré, automatisé et mesurable.",
};

import { AuthProvider } from "@/lib/authContext";
import { NotificationProvider } from "@/lib/notificationContext";
import { ToastContainer } from "@/components/ui/Toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <NotificationProvider>
            {children}
            <ToastContainer />
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
