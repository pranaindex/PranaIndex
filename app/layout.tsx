import React from 'react';
import './globals.css';

export const metadata = {
  title: 'Prana Index',
  description: 'Breathing and Calibration',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, backgroundColor: 'black', color: 'white' }}>
        {children}
      </body>
    </html>
  );
}