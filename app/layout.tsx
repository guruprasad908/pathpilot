import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

import BackgroundWrapper from '../components/BackgroundWrapper';

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
    icons: {
        icon: '/favicon.svg',
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
            </body>
        </html>
    );
}
