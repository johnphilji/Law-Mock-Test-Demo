import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Panther Law Prep | Prepare. Analyze. Achieve.",
  description: "AIBE Mock Test Platform and Online Examination System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} font-sans h-full bg-background text-foreground antialiased`}>
        {children}
      </body>
    </html>
  );
}
