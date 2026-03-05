'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import NavBar from '../../components/NavBar';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('success');
                setMessage(data.message);
            } else {
                setStatus('error');
                setMessage(data.error || 'System malfunction during transmission.');
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
                        Reconnect
                    </h2>
                    <p className="text-sm text-zinc-500 mt-3 font-light tracking-wide">
                        Enter your email to receive recovery coordinates.
                    </p>
                </div>

                {status === 'success' ? (
                    <div className="text-center space-y-6">
                        <div className="bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 p-6 rounded-xl font-mono text-sm leading-relaxed">
                            <div className="text-emerald-500 font-bold mb-2 uppercase tracking-widest">TRANSMISSION SUCCESSFUL</div>
                            {message}
                        </div>
                        <Link
                            href="/login"
                            className="block w-full py-4 bg-white text-black font-bold text-xs uppercase tracking-widest-xl rounded-xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.1)]"
                        >
                            Return to Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {status === 'error' && (
                            <div className="bg-red-900/40 border border-red-500/50 text-red-300 p-4 rounded-lg text-sm text-center font-mono">
                                [!] {message}
                            </div>
                        )}

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

                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full py-4 mt-4 bg-white text-black font-bold text-xs uppercase tracking-widest-xl rounded-xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:-translate-y-0.5 disabled:opacity-50"
                        >
                            {status === 'loading' ? 'Transmitting...' : 'Request Reset'}
                        </button>

                        <div className="text-center">
                            <Link href="/login" className="text-[10px] text-zinc-500 hover:text-white font-mono uppercase tracking-widest-xl transition-colors">
                                ← Back to Login
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
