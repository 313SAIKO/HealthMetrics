import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "HealthMetrics | Health estimates & assessment history",
  description:
    "Bilingual health estimates with private assessment history and comparison.",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: Readonly<RootLayoutProps>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
