'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Reset token missing from sequence.');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        setStatus('loading');
        setMessage('');

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('success');
                setMessage(data.message);
                setTimeout(() => router.push('/login'), 3000);
            } else {
                setStatus('error');
                setMessage(data.error || 'Authorization rejected.');
            }
        } catch (err) {
            setStatus('error');
            setMessage('Network error. Check telemetry connection.');
        }
    };

    return (
        <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4 relative overflow-hidden font-display selection:bg-white/10">
            {/* Ambient Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="bg-zinc-900/40 border border-white/5 p-8 md:p-12 rounded-3xl w-full max-w-md shadow-[0_0_80px_rgba(0,0,0,0.6)] relative overflow-hidden backdrop-blur-2xl z-10">
                {/* Minimal accent bar */}
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

                <div className="text-center mb-10">
                    <h2 className="text-3xl font-extrabold text-white tracking-tight font-display bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400 uppercase">
                        Re-Authorize
                    </h2>
                    <p className="text-sm text-zinc-500 mt-3 font-light tracking-wide">
                        Set new security credentials for your profile.
                    </p>
                </div>

                {status === 'success' ? (
                    <div className="text-center space-y-6">
                        <div className="bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 p-6 rounded-xl font-mono text-sm leading-relaxed">
                            <div className="text-emerald-500 font-bold mb-2 uppercase tracking-widest">CREDENTIALS RE-ESTABLISHED</div>
                            {message}
                            <div className="mt-4 text-[10px] animate-pulse">Redirecting to Login sequence...</div>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {status === 'error' && (
                            <div className="bg-red-900/40 border border-red-500/50 text-red-300 p-4 rounded-lg text-sm text-center font-mono">
                                [!] {message}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="block text-zinc-500 text-[10px] font-mono uppercase tracking-widest-xl">New Security Key</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/40 border border-white/5 rounded-xl px-5 py-3.5 text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/10 transition-all duration-300 font-mono text-sm"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'loading' || !token}
                            className="w-full py-4 mt-4 bg-white text-black font-bold text-xs uppercase tracking-widest-xl rounded-xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:-translate-y-0.5 disabled:opacity-50"
                        >
                            {status === 'loading' ? 'Updating...' : 'Set Credentials'}
                        </button>

                        <div className="text-center">
                            <Link href="/login" className="text-[10px] text-zinc-500 hover:text-white font-mono uppercase tracking-widest-xl transition-colors">
                                ← Return to Login
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex flex-col items-center justify-center font-mono text-zinc-500 uppercase tracking-widest text-[10px]">
                <div className="animate-pulse">Initializing Security Decryption...</div>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
