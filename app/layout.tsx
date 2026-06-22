import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

import BackgroundWrapper from '../components/BackgroundWrapper';
import InstallPrompt from '../components/InstallPrompt';

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
});

export const metadata: Metadata = {
    title: {
        template: '%s | PathPilot',
        default: 'PathPilot — AI Learning Roadmaps',
    },
    description: 'AI-generated, adaptive learning roadmaps. Build, track, and master any subject with PathPilot.',
    manifest: '/manifest.json',
    icons: {
        icon: '/favicon.svg',
        apple: '/icons/icon-192x192.png',
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'PathPilot',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
            <body className="font-sans" suppressHydrationWarning>
                {/* Dynamic Background Effects Wrapper */}
                <BackgroundWrapper />

                {children}
                
                {/* Global App Install Prompt for PWA */}
                <InstallPrompt />
            </body>
        </html>
    );
}
