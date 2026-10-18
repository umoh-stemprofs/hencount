import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HenCount — eggs, feed and profit",
  description:
    "Daily egg and feed log with laying rate, feed per hen and daily profit, valued at the market tray price.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
