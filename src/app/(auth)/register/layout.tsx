import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account | Panther Law Prep",
  description: "Register for Panther Law Prep to start preparing for the All India Bar Examination with mock tests and study materials.",
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
