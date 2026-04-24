import type { Metadata, Viewport } from 'next';
import './globals.css';
import ToasterProvider from '@/components/ToasterProvider';
import ResponsiveTester from '@/components/ResponsiveTester';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'VPrint Kiosk',
  description: 'Smart printing kiosk for students',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />

        {/* ✅ ADD THIS */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
          rel="stylesheet"
        />
      </head>

      <body className="overflow-hidden overscroll-none" style={{ touchAction: 'none' }} suppressHydrationWarning>
        {children}
        <ToasterProvider />
        <ResponsiveTester />
        <Analytics />
      </body>
    </html>
  );
}