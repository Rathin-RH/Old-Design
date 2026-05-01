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

import ScalingWrapper from '@/components/ScalingWrapper';

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
          rel="stylesheet"
        />
      </head>

      <body className="overflow-hidden overscroll-none flex items-center justify-center min-h-screen" style={{ touchAction: 'none' }} suppressHydrationWarning>
        <ScalingWrapper>
          {children}
        </ScalingWrapper>
        <ToasterProvider />
        <ResponsiveTester />
        <Analytics />
      </body>
    </html>
  );
}