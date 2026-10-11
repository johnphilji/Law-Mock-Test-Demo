import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Panther Law Prep",
  description: "Sign in to your Panther Law Prep account to access AIBE mock tests and exam preparation resources.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
