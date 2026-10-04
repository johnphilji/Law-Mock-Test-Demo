import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password | Panther Law Prep",
  description: "Set a new password for your Panther Law Prep account.",
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
