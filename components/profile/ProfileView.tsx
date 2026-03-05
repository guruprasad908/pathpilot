import React from 'react';
import Link from 'next/link';

type ProfileViewProps = {
    profile: any;
};

export default function ProfileView({ profile }: ProfileViewProps) {
    const joinDate = new Date(profile.join_date).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });

    const stats = [
        { label: 'Completed', value: profile.completed_topics_count || 0, color: 'text-white font-extrabold' },
        { label: 'Level', value: profile.experience_level, color: 'text-white font-extrabold', capitalize: true },
        { label: 'Joined', value: joinDate, color: 'text-zinc-500 font-medium' },
    ];

    return (
        <div className="w-full max-w-4xl mx-auto py-12 px-6">
            {/* Instagram Style Header */}
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 mb-12">
                {/* Avatar Placeholder */}
                <div className="relative group">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center p-1 group-hover:border-cyan-500/30 transition-all duration-500 overflow-hidden shadow-2xl">
                        <div className="w-full h-full rounded-full bg-black border border-white/5 flex items-center justify-center text-5xl opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all font-display">
                            {profile.full_name?.charAt(0) || 'A'}
                        </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-cyan-500 rounded-full border-4 border-black flex items-center justify-center shadow-lg">
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    </div>
                </div>

                {/* Identity Info */}
                <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
                        <h2 className="text-3xl font-extrabold text-white tracking-tight font-display">{profile.full_name}</h2>
                        <div className="flex gap-3 justify-center md:justify-start">
                            <button className="px-6 py-2 bg-zinc-900 border border-white/5 hover:border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest-xl text-zinc-300 transition-all">
                                Edit Protocol
                            </button>
                            <button className="p-2 bg-zinc-900 border border-white/5 hover:border-white/10 rounded-xl text-zinc-500 hover:text-white transition-all">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-center md:justify-start gap-10 mb-8">
                        {stats.map((s, idx) => (
                            <div key={idx} className="flex flex-col md:flex-row md:items-baseline md:gap-2">
                                <span className={`text-base font-extrabold ${s.color} ${s.capitalize ? 'capitalize' : ''}`}>
                                    {s.value}
                                </span>
                                <span className="text-[10px] text-zinc-500 uppercase tracking-widest-xl font-mono">
                                    {s.label}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-3">
                        <div className="text-sm font-bold text-zinc-200 tracking-wide">{profile.learning_goal || 'Mission Objective: Total Mastery'}</div>
                        <div className="text-xs text-zinc-500 leading-relaxed font-mono italic max-w-md mx-auto md:mx-0 opacity-80">
                            "{profile.bio || 'Exploring the boundaries of technology and intelligence through structured learning and persistence.'}"
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Tabs / Sections */}
            <div className="border-t border-white/5 pt-12">
                <div className="flex justify-center -mt-[1px]">
                    <div className="border-t border-white/40 px-10 py-4 text-[10px] font-mono tracking-widest-xl uppercase text-white flex items-center gap-3">
                        <span className="w-1 h-1 rounded-full bg-cyan-500 animate-pulse" /> OVERVIEW
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                    {/* Learning Style Card */}
                    <div className="bg-zinc-900/20 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:border-cyan-500/20 transition-all duration-500 shadow-2xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                        <h3 className="text-[10px] font-mono font-bold text-white tracking-widest-xl uppercase mb-8">Heuristic Payload</h3>
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <div className="text-[9px] text-zinc-600 uppercase tracking-widest-xl mb-2">Velocity</div>
                                <div className="text-sm font-bold text-zinc-200 capitalize tracking-wide">{profile.pace_preference}</div>
                            </div>
                            <div>
                                <div className="text-[9px] text-zinc-600 uppercase tracking-widest-xl mb-2">Density</div>
                                <div className="text-sm font-bold text-zinc-200 capitalize tracking-wide">{profile.depth_preference}</div>
                            </div>
                            <div>
                                <div className="text-[9px] text-zinc-600 uppercase tracking-widest-xl mb-2">Allocation</div>
                                <div className="text-sm font-bold text-zinc-200 tracking-wide">{profile.daily_time_minutes}m/day</div>
                            </div>
                            <div>
                                <div className="text-[9px] text-zinc-600 uppercase tracking-widest-xl mb-2">Education</div>
                                <div className="text-sm font-bold text-zinc-200 capitalize tracking-wide">{profile.education_level || 'General'}</div>
                            </div>
                        </div>
                        <Link href="/profile?edit=style" className="mt-10 block text-center py-3 bg-zinc-900/50 border border-white/5 rounded-xl text-[10px] font-mono font-bold text-zinc-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-all uppercase tracking-widest-xl">
                            Recalibrate Pattern
                        </Link>
                    </div>

                    {/* Milestone Progress Card */}
                    <div className="bg-zinc-900/10 backdrop-blur-xl border border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-500 shadow-panel">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                        <h3 className="text-[10px] font-mono font-bold text-white tracking-widest-xl uppercase mb-8">Milestone Progress</h3>
                        <div className="flex flex-col gap-8">
                            <div>
                                <div className="flex justify-between items-baseline mb-3">
                                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest-xl font-bold">Sectors Secured</span>
                                    <span className="text-white font-bold font-mono text-sm shadow-[0_0_10px_rgba(255,255,255,0.2)]">{profile.completed_topics_count || 0}</span>
                                </div>
                                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                                    <div className="h-full bg-white transition-all duration-1000 shadow-[0_0_12px_rgba(255,255,255,0.4)]" style={{ width: '45%' }} />
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    <div className="text-xs text-zinc-300 font-bold uppercase tracking-widest-xl">First Flight</div>
                                </div>
                                <span className="text-[10px] font-mono text-white font-bold tracking-widest-xl">SECURED</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
