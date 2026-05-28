import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Burnie / Kumaya Planning Hub",
  description: "Internal planning shell for Kumaya Burning Man camp operations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
