import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Failed",
  description:
    "Your payment could not be processed. Review the issue and try again at Jirah Shop.",
};

export default function FailureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
