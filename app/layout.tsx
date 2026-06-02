import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Burnie / Kumaya Planning Hub",
  description: "Source-backed planning overview for the Kumaya Burning Man camp, maintained by Burnie.",
};

// The planning hub is served from this Mac and should reflect the current YAML
// source files on each request, not a static snapshot from the last build.
export const dynamic = "force-dynamic";

const themeScript = `
(function () {
  try {
    var th = localStorage.getItem("kumaya-theme");
    if (!th) th = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    if (th === "dark") document.documentElement.classList.add("dark");
    document.documentElement.setAttribute("data-density", "comfortable");
  } catch (e) {}
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
