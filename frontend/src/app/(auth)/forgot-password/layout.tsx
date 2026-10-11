import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password | Panther Law Prep",
  description: "Reset your Panther Law Prep account password.",
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
