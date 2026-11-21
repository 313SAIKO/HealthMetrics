import type { Metadata } from "next";
import { AccountProvider } from "../components/account/AccountProvider";

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
      <head>
        <link
          rel="preload"
          href="/fonts/noto-sans-thai-thai.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/noto-sans-thai-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <AccountProvider>{children}</AccountProvider>
      </body>
    </html>
  );
}
