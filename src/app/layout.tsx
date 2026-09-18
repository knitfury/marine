import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider, ThemeProvider } from "@/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans-var",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MarineLink",
  description:
    "Marine Travelift dealer, customer, equipment and service-management hub.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
