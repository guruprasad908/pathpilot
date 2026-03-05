import React from 'react';
import NavBar from '../../components/NavBar';
import GeneratorInput from '../../components/GeneratorInput';

export const metadata = { title: 'Create Roadmap' };

export default function BuilderPage() {
    return (
        <div className="min-h-screen text-zinc-100 selection:bg-white/10 flex flex-col font-display overflow-x-hidden relative">
            <NavBar />

            <div className="container-standard py-12">

                <main className="flex flex-col gap-[var(--space-5)]">
                    <GeneratorInput />
                </main>
            </div>
        </div>
    );
}
