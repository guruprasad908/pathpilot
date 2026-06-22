'use client';

import { useState, useEffect } from 'react';

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            
            // Show the prompt after a slight delay so it's not too aggressive
            setTimeout(() => {
                setShowPrompt(true);
            }, 3000);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Check if app is already installed
        window.addEventListener('appinstalled', () => {
            setShowPrompt(false);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        
        // Show the install prompt
        deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            setShowPrompt(false);
        }
        
        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-black/90 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-4 shadow-[0_0_30px_rgba(34,211,238,0.15)] z-[100] animate-[fadeUp_0.5s_ease-out] flex flex-col gap-3">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <img src="/icons/icon-192x192.png" alt="PathPilot Logo" className="w-10 h-10 rounded-xl" />
                    <div>
                        <h4 className="text-white font-bold text-sm">Install PathPilot</h4>
                        <p className="text-zinc-400 text-xs mt-0.5 font-mono">Add to home screen for native experience.</p>
                    </div>
                </div>
                <button 
                    onClick={() => setShowPrompt(false)}
                    className="w-6 h-6 rounded-full flex items-center justify-center bg-white/5 text-zinc-500 hover:text-white"
                >
                    ✕
                </button>
            </div>
            
            <button 
                onClick={handleInstallClick}
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono text-[11px] uppercase tracking-widest rounded-xl transition-all"
            >
                Install App
            </button>
            <style jsx>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
