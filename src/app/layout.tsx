import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "HealthMetrics | BMI, BMR & TDEE Calculator",
  description: "Calculate your BMI, BMR, and TDEE in seconds.",
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
