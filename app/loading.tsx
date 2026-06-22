import React from 'react';

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            {/* Cosmic pulse ring */}
            <div className="relative w-24 h-24 flex items-center justify-center mb-6">
                <div className="absolute inset-0 border border-white/10 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                <div className="absolute inset-2 border border-white/20 rounded-full animate-[spin_3s_linear_infinite]" />
                <div className="absolute inset-4 border border-cyan-500/30 rounded-full animate-[spin_4s_linear_infinite_reverse]" />
                <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-pulse" />
            </div>
            
            <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest-xl animate-pulse">
                Establishing uplink...
            </div>
        </div>
    );
}
