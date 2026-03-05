'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '../../components/NavBar';
import ProfileView from '../../components/profile/ProfileView';

type FormState = {
    full_name: string;
    education_level: string;
    learning_goal: string;
    experience_level: string;
    pace_preference: string;
    depth_preference: string;
    daily_time_minutes: number;
};

export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(0);
    const [existingProfile, setExistingProfile] = useState<any>(null);

    const [form, setForm] = useState<FormState>({
        full_name: '',
        education_level: 'undergraduate',
        learning_goal: '',
        experience_level: 'beginner',
        pace_preference: 'normal',
        depth_preference: 'balanced',
        daily_time_minutes: 60,
    });

    // Check for existing profile on mount to fix the "repeating form" bug
    useEffect(() => {
        document.title = 'Learning Profile | PathPilot';

        async function checkProfile() {
            try {
                const res = await fetch('/api/profile');
                if (res.ok) {
                    const data = await res.json();
                    if (data.profile) {
                        setExistingProfile(data.profile);
                    }
                }
            } catch (err) {
                console.error("Failed to check profile:", err);
            } finally {
                setLoading(false);
            }
        }
        checkProfile();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: name === 'daily_time_minutes' ? parseInt(value) || 0 : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            const res = await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (!res.ok) throw new Error('Failed to save profile');

            // Refresh and show the view
            const profileData = await fetch('/api/profile').then(r => r.json());
            setExistingProfile(profileData.profile);
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            setSubmitting(false);
        }
    };

    const steps = [
        {
            id: 'identity',
            label: 'Personal Identity',
            hint: 'Tell us who you are and what your academic background is.',
            type: 'fields',
            fields: [
                { id: 'full_name', label: 'Full Name', placeholder: 'e.g. Commander Shepard' },
                {
                    id: 'education_level', label: 'Education Level', type: 'select', options: [
                        { value: 'high_school', label: 'High School' },
                        { value: 'undergraduate', label: 'Undergraduate' },
                        { value: 'postgraduate', label: 'Postgraduate' },
                        { value: 'professional', label: 'Professional / Self-Taught' },
                    ]
                }
            ]
        },
        {
            id: 'goal',
            label: 'Primary Directive',
            hint: 'What is your main learning goal or mission objective?',
            type: 'textarea',
            fields: [
                { id: 'learning_goal', label: 'Your Objective', placeholder: 'e.g. Master React and Next.js to build cinema-grade web applications.' }
            ]
        },
        {
            id: 'experience_level',
            label: 'Contextual Level',
            hint: 'Used to calibrate question difficulty and roadmap complexity.',
            type: 'options',
            options: [
                { value: 'beginner', label: 'Beginner', desc: 'New to this domain' },
                { value: 'intermediate', label: 'Intermediate', desc: 'Familiar with the basics' },
                { value: 'advanced', label: 'Advanced', desc: 'Looking to master edge cases' },
            ]
        },
        {
            id: 'pace_preference',
            label: 'Operational Pace',
            hint: 'Controls how many topics are packed into your roadmap.',
            type: 'options',
            options: [
                { value: 'slow', label: 'Thorough', desc: 'Fewer topics, deeper focus' },
                { value: 'normal', label: 'Balanced', desc: 'Standard pace and breadth' },
                { value: 'fast', label: 'Intensive', desc: 'Maximum coverage, fast track' },
            ]
        },
        {
            id: 'depth_preference',
            label: 'Telemetry Depth',
            hint: 'How detailed each topic\'s subtopic list will be.',
            type: 'options',
            options: [
                { value: 'surface', label: 'Core Concepts', desc: 'Essential topics only' },
                { value: 'balanced', label: 'Balanced', desc: 'Key topics + sub-branches' },
                { value: 'deep', label: 'Deep Dive', desc: 'Every edge case covered' },
            ]
        },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center font-mono text-white">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-2 border-white/5 border-t-white rounded-full animate-spin" />
                    <span className="animate-pulse tracking-widest-xl uppercase text-[10px] text-zinc-500">Syncing Profile Metrics...</span>
                </div>
            </div>
        );
    }

    if (existingProfile) {
        return (
            <div className="min-h-screen font-display text-zinc-100 flex flex-col relative overflow-hidden">
                <NavBar />
                <ProfileView profile={existingProfile} />
            </div>
        );
    }

    const currentStep = steps[step];

    return (
        <div className="min-h-screen font-display text-zinc-100 selection:bg-white/10 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
            <NavBar />

            <div className="flex-1 flex items-center justify-center p-6 relative z-10">
                <div className="w-full max-w-2xl">
                    <div className="text-center mb-12">
                        <div className="flex items-center justify-center gap-3 mb-6 uppercase font-mono text-[10px] text-emerald-500 tracking-widest-xl">
                            Pilot Protocol Onboarding
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4 font-display">
                            Initialize Your <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">Profile</span>
                        </h1>
                    </div>

                    <div className="flex items-center justify-center gap-3 mb-12">
                        {steps.map((_, i) => (
                            <div key={i} className={`h-1 transition-all duration-500 rounded-full ${i <= step ? 'w-10 bg-white shadow-[0_0_12px_rgba(255,255,255,0.3)]' : 'w-3 bg-zinc-800'}`} />
                        ))}
                    </div>

                    <div className="bg-zinc-900/20 backdrop-blur-2xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                        <div className="p-10 md:p-14">
                            <div className="mb-10">
                                <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-tight">{currentStep.label}</h2>
                                <p className="text-zinc-500 text-xs font-mono tracking-widest-xl">{currentStep.hint}</p>
                            </div>

                            {currentStep.type === 'fields' && (
                                <div className="space-y-8">
                                    {currentStep.fields?.map(f => (
                                        <div key={f.id} className="space-y-3">
                                            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest-xl">{f.label}</label>
                                            {f.type === 'select' ? (
                                                <select
                                                    name={f.id}
                                                    value={form[f.id as keyof FormState] as string}
                                                    onChange={handleChange}
                                                    className="w-full bg-black/40 border border-white/5 rounded-xl px-5 py-4 text-sm text-zinc-200 focus:outline-none focus:border-white/40 transition-all appearance-none font-mono"
                                                >
                                                    {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    name={f.id}
                                                    value={form[f.id as keyof FormState] as string}
                                                    onChange={handleChange}
                                                    placeholder={f.placeholder}
                                                    className="w-full bg-black/40 border border-white/5 rounded-xl px-5 py-4 text-sm text-zinc-200 focus:outline-none focus:border-white/40 transition-all font-mono"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {currentStep.type === 'textarea' && (
                                <div className="space-y-3">
                                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest-xl">{currentStep.fields?.[0].label}</label>
                                    <textarea
                                        name={currentStep.fields?.[0].id}
                                        value={form[currentStep.fields?.[0].id as keyof FormState] as string}
                                        onChange={handleChange}
                                        placeholder={currentStep.fields?.[0].placeholder}
                                        rows={4}
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-5 text-sm text-zinc-200 focus:outline-none focus:border-white/40 transition-all resize-none font-mono"
                                    />
                                </div>
                            )}

                            {currentStep.type === 'options' && (
                                <div className="grid gap-4">
                                    {currentStep.options?.map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setForm(prev => ({ ...prev, [currentStep.id]: opt.value }))}
                                            className={`flex items-center justify-between p-6 rounded-2xl border text-left transition-all ${form[currentStep.id as keyof FormState] === opt.value
                                                ? 'border-white/40 bg-white/5 ring-1 ring-white/10'
                                                : 'border-white/5 bg-black/20 hover:border-white/10'
                                                }`}
                                        >
                                            <div>
                                                <div className="text-base font-bold text-zinc-200 mb-1">{opt.label}</div>
                                                <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest-xl">{opt.desc}</div>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border-2 transition-all ${form[currentStep.id as keyof FormState] === opt.value ? 'bg-white border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.4)]' : 'border-zinc-800'}`} />
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-between items-center mt-12">
                                {step > 0 ? (
                                    <button onClick={() => setStep(s => s - 1)} className="text-zinc-600 hover:text-zinc-400 text-xs font-mono uppercase tracking-widest-xl transition-all">← Back</button>
                                ) : <div />}

                                {step < steps.length - 1 ? (
                                    <button
                                        onClick={() => setStep(s => s + 1)}
                                        className="px-10 py-3 bg-zinc-800/50 border border-white/5 hover:border-white/20 text-white font-bold text-xs uppercase tracking-widest-xl rounded-xl transition-all"
                                    >
                                        Proceed →
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={submitting || !form.full_name}
                                        className="px-12 py-3 bg-white hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] disabled:opacity-30 text-black font-extrabold text-xs uppercase tracking-widest-xl rounded-xl transition-all"
                                    >
                                        {submitting ? 'Authenticating...' : 'Establish Profile'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
