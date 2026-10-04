import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Sign In | Panther Law Prep",
  description: "Panther Law Prep administration portal.",
};

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
