import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prana Index",
  description: "Find your Pi stress score",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
