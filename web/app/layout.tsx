import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Runway Zero",
  description: "Airport crisis recovery simulator for LLM agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

