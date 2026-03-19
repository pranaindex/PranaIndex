import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prana Index',
  description: 'Master Your Focus.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* This ensures the dark background applies everywhere */}
      <body className="bg-slate-900 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
