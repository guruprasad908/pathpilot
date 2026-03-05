'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from './LogoutButton';

export default function NavBar() {
    const pathname = usePathname();

    const links = [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/builder', label: 'Create Roadmap' },
        { href: '/roadmaps', label: 'My Roadmaps' },
        { href: '/profile', label: 'Learning Profile' },
    ];

    return (
        <nav className="sticky top-0 w-full z-50 glass-nav border-b border-white/5 px-6">
            <div className="max-w-7xl mx-auto py-4 flex items-center justify-between">

                <div className="flex items-center gap-8">
                    {/* Logo - Points to Landing Page per user request */}
                    <Link
                        href="/"
                        className="flex items-center gap-3 transition-opacity hover:opacity-80"
                    >
                        <span className="text-xl font-bold tracking-widest-xl text-white uppercase font-display">
                            PathPilot
                        </span>
                    </Link>

                    {/* Nav links */}
                    <div className="hidden md:flex items-center gap-1">
                        {links.map(link => {
                            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`relative px-4 py-1.5 text-xs font-bold uppercase tracking-widest-xl transition-all duration-200 ${isActive
                                        ? 'text-white'
                                        : 'text-zinc-400 hover:text-white'
                                        }`}
                                >
                                    {isActive && (
                                        <span className="absolute -bottom-[1.1rem] left-0 right-0 h-px bg-white/60 shadow-[0_0_12px_rgba(255,255,255,0.3)]" />
                                    )}
                                    {link.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center">
                    <LogoutButton />
                </div>
            </div>
        </nav>
    );
}
