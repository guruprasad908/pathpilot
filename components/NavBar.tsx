'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import LogoutButton from './LogoutButton';

export default function NavBar() {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Prevent scrolling when menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isMobileMenuOpen]);

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
                        className="flex items-center gap-3 transition-opacity hover:opacity-80 relative z-[60]"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <span className="text-xl font-bold tracking-widest-xl text-white uppercase font-display">
                            PathPilot
                        </span>
                    </Link>

                    {/* Desktop Nav links */}
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

                <div className="hidden md:flex items-center">
                    <LogoutButton />
                </div>

                {/* Mobile Hamburger Toggle */}
                <button
                    className="md:hidden relative z-[60] p-2 text-zinc-400 hover:text-white transition-colors"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Toggle mobile menu"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center pt-20 animate-in fade-in duration-300">
                    <div className="flex flex-col items-center gap-8 w-full px-8">
                        {links.map(link => {
                            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`text-2xl font-display font-bold uppercase tracking-widest-xl transition-all duration-300 ${isActive
                                        ? 'text-cyan-400 scale-110 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]'
                                        : 'text-zinc-400 hover:text-white'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}

                        <div className="mt-12 w-full max-w-xs border-t border-white/10 pt-12 flex justify-center" onClick={() => setIsMobileMenuOpen(false)}>
                            <LogoutButton />
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
