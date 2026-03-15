import type { Metadata } from "next";
import { ReactNode } from "react";
import "./globals.css";
import { AppHeader } from "@/components/ui/app-header";

export const metadata: Metadata = {
  title: "TrustStream AI",
  description:
    "AI trust layer for livestream commerce in ASEAN. Detect claims, verify evidence, and protect buyers."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="grain-overlay min-h-screen">
          <AppHeader />
          <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
