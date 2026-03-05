'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Authentication failed');
            }

            // On success, go to dashboard
            router.push('/dashboard');
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4 relative overflow-hidden font-display selection:bg-white/10">
            {/* Ambient Sci-Fi Background Glows — matching hero section */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Back to Home Button */}
            <div className="absolute top-6 left-6 md:top-10 md:left-10 z-20">
                <Link
                    href="/"
                    className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900/50 hover:bg-zinc-800/80 border border-white/5 hover:border-white/10 text-zinc-400 hover:text-white rounded-full transition-all text-xs font-mono uppercase tracking-widest-xl backdrop-blur-md shadow-lg"
                >
                    <span>←</span> Return to Base
                </Link>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 p-8 md:p-12 rounded-3xl w-full max-w-md shadow-[0_0_80px_rgba(0,0,0,0.6)] relative overflow-hidden backdrop-blur-2xl z-10">
                {/* Minimal accent bar */}
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

                {/* Single Premium Header */}
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-extrabold text-white tracking-tight font-display bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400 uppercase">
                        {isRegistering ? 'Initiate Sequence' : 'Welcome Back'}
                    </h2>
                    <p className="text-sm text-zinc-500 mt-3 font-light tracking-wide">
                        {isRegistering ? 'Create your profile to begin the mission.' : 'Authorization required for secure access.'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-900/40 border border-red-500/50 text-red-300 p-4 rounded-lg mb-6 text-sm text-center shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-zinc-500 text-[10px] font-mono uppercase tracking-widest-xl">Email Designation</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-xl px-5 py-3.5 text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/10 transition-all duration-300 font-mono text-sm"
                            placeholder="astronaut@pathpilot.io"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-zinc-500 text-[10px] font-mono uppercase tracking-widest-xl">Security Key</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-xl px-5 py-3.5 text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/10 transition-all duration-300 font-mono text-sm"
                            placeholder="••••••••"
                            minLength={6}
                        />
                        {!isRegistering && (
                            <div className="flex justify-end">
                                <Link
                                    href="/forgot-password"
                                    className="text-[10px] text-zinc-600 hover:text-white font-mono uppercase tracking-widest-xl transition-colors"
                                >
                                    Forgot security key?
                                </Link>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 mt-4 bg-white text-black font-bold text-xs uppercase tracking-widest-xl rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.05)] transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                        {isLoading ? 'Authenticating...' : (isRegistering ? 'Register Protocol' : 'Access Database')}
                    </button>
                </form>

                <div className="mt-8 text-center text-xs text-zinc-600 font-mono uppercase tracking-widest-xl">
                    {isRegistering ? 'Already cleared for access? ' : "Need clearance? "}
                    <button
                        type="button"
                        onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
                        className="text-white hover:text-zinc-300 transition-colors font-bold ml-1 border-b border-white/20"
                    >
                        {isRegistering ? 'Log In' : 'Sign Up'}
                    </button>
                </div>
            </div>
        </div>
    );
}
