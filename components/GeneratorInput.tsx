'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GeneratorInput() {
    const [prompt, setPrompt] = useState('');
    const [isScoping, setIsScoping] = useState(false);
    const [scopes, setScopes] = useState<{title: string, description: string}[] | null>(null);
    const [selectedScope, setSelectedScope] = useState<{title: string, description: string} | null>(null);
    const [videoOptions, setVideoOptions] = useState<{title: string, url: string}[] | null>(null);
    const [selectedVideo, setSelectedVideo] = useState<{title: string, url: string} | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [sourceData, setSourceData] = useState('');
    const [roadmapTemplate, setRoadmapTemplate] = useState<any | null>(null);
    const [generationError, setGenerationError] = useState('');
    const [saveError, setSaveError] = useState('');
    const abortRef = React.useRef<AbortController | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        if (isCustomMode) {
            if (!sourceData.trim()) return;
            handleGenerate(`Source Material: ${prompt}. Raw Content provided in sourceData.`);
        } else {
            handleScope(e);
        }
    };

    const handleScope = async (e: React.FormEvent) => {

        setIsScoping(true);
        setScopes(null);
        setVideoOptions(null);
        setGenerationError('');

        try {
            const res = await fetch('/api/generate/scope', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });

            const resData = await res.json();

            if (!res.ok) {
                throw new Error(resData.error || 'Failed to identify learning paths');
            }

            if (resData.paths) setScopes(resData.paths);
            if (resData.videos) setVideoOptions(resData.videos);
        } catch (err: any) {
            setGenerationError(err.message || 'AI scoping failed. Please try again.');
        } finally {
            setIsScoping(false);
        }
    };

    const handleGenerate = async (finalPrompt: string) => {
        setIsLoading(true);
        setScopes(null);
        // We keep videoOptions and selectedVideo here
        setRoadmapTemplate(null);
        setGenerationError('');

        // Create abort controller + 120s timeout
        const controller = new AbortController();
        abortRef.current = controller;
        const timeoutId = setTimeout(() => controller.abort(), 120000);

        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    prompt: finalPrompt,
                    sourceData: isCustomMode ? sourceData : undefined
                }),
                signal: controller.signal,
            });

            const resData = await res.json();

            if (!res.ok) {
                throw new Error(resData.details || resData.error || 'Failed to generate roadmap');
            }

            if (resData.roadmap) {
                // Attach the selected video to the template
                const template = {
                    ...resData.roadmap,
                    tutorial_video_url: selectedVideo?.url || null,
                    tutorial_video_title: selectedVideo?.title || null
                };
                setRoadmapTemplate(template);
            }
        } catch (err: any) {
            if (err.name === 'AbortError') {
                setGenerationError('Request timed out or was cancelled. Please try again.');
            } else {
                setGenerationError(err.message || 'AI generation failed. Please try again.');
            }
        } finally {
            clearTimeout(timeoutId);
            abortRef.current = null;
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        abortRef.current?.abort();
    };

    const handleSave = async () => {
        if (!roadmapTemplate) return;
        setIsSaving(true);
        setSaveError('');
        try {
            const res = await fetch('/api/roadmaps/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(roadmapTemplate)
            });
            if (!res.ok) throw new Error('Failed to save roadmap');
            const data = await res.json();
            router.push(`/universe/${data.roadmapId}`);
        } catch (err: any) {
            setSaveError(err.message || 'Error saving roadmap. Please try again.');
            setIsSaving(false);
        }
    };

    const updateTitle = (newTitle: string) => setRoadmapTemplate({ ...roadmapTemplate, title: newTitle });

    // Recursive helper to update a node's title by path (array of indices)
    const updateNodeTitle = (path: number[], newTitle: string) => {
        const newChildren = JSON.parse(JSON.stringify(roadmapTemplate.children));
        let target = newChildren;
        for (let i = 0; i < path.length - 1; i++) {
            target = target[path[i]].children;
        }
        target[path[path.length - 1]].title = newTitle;
        setRoadmapTemplate({ ...roadmapTemplate, children: newChildren });
    };

    // Recursive helper to delete a node by path
    const deleteNode = (path: number[]) => {
        const newChildren = JSON.parse(JSON.stringify(roadmapTemplate.children));
        let target = newChildren;
        for (let i = 0; i < path.length - 1; i++) {
            target = target[path[i]].children;
        }
        target.splice(path[path.length - 1], 1);
        setRoadmapTemplate({ ...roadmapTemplate, children: newChildren });
    };

    // Recursive node renderer for the editable preview
    const EditableTreeNode = ({ node, path, depth }: { node: any, path: number[], depth: number }) => {
        const hasChildren = node.children && node.children.length > 0;
        const indent = depth * 20;

        return (
            <div style={{ marginLeft: indent }}>
                <div className={`flex items-center gap-3 py-1.5 group/node ${depth === 0 ? 'mb-1' : ''}`}>
                    {/* Connector */}
                    <div className={`shrink-0 rounded-full ${
                        depth === 0 ? 'w-2 h-2 bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.5)]' :
                        depth === 1 ? 'w-1.5 h-1.5 bg-zinc-500' :
                        'w-1 h-1 bg-zinc-700'
                    }`} />
                    <input
                        value={node.title}
                        onChange={e => updateNodeTitle(path, e.target.value)}
                        className={`bg-transparent focus:outline-none border-b border-transparent focus:border-white/10 flex-1 py-0.5 transition-all duration-300 ${
                            depth === 0 ? 'font-extrabold text-white text-[10px] uppercase tracking-widest-xl' :
                            depth === 1 ? 'font-bold text-zinc-200 text-sm' :
                            depth === 2 ? 'font-medium text-zinc-300 text-sm' :
                            'font-light text-zinc-400 text-xs'
                        }`}
                    />
                    <button
                        onClick={() => deleteNode(path)}
                        className="text-rose-500/30 hover:text-rose-400 opacity-100 sm:opacity-0 group-hover/node:opacity-100 px-2 sm:px-1 text-xs transition-all shrink-0"
                        title="Remove node"
                    >
                        ✕
                    </button>
                </div>
                {node.description && depth <= 1 && (
                    <p className="text-xs text-zinc-500/80 font-light leading-relaxed ml-[22px] mb-1 max-w-2xl" style={{ marginLeft: indent + 22 }}>
                        {node.description}
                    </p>
                )}
                {hasChildren && (
                    <div className="border-l border-white/[0.04]" style={{ marginLeft: indent + 8 }}>
                        {node.children.map((child: any, cIndex: number) => (
                            <EditableTreeNode key={cIndex} node={child} path={[...path, cIndex]} depth={depth + 1} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // ─── Loading State ───
    if (isScoping) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] py-20 relative">
                <div className="relative w-32 h-32 mb-12">
                    <div className="absolute inset-0 rounded-full border border-emerald-500/20 border-t-emerald-400 animate-spin" style={{ animationDuration: '1.5s' }} />
                    <div className="absolute inset-[38%] rounded-full bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-pulse" />
                </div>
                <div className="text-center space-y-3 mb-10">
                    <p className="font-mono text-xs text-emerald-400 tracking-widest-xl uppercase animate-pulse">
                        Analyzing Market Pathways
                    </p>
                    <p className="font-mono text-xs text-zinc-500 tracking-widest-xl">
                        Identifying optimal specializations for {prompt}...
                    </p>
                </div>
            </div>
        );
    }

    if (scopes && !selectedScope && !selectedVideo && videoOptions) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[55vh] py-12 relative max-w-4xl mx-auto w-full">
                <div className="text-center mb-12 relative">
                    <div className="flex items-center justify-center gap-3 mb-5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse" />
                        <span className="font-mono text-xs text-emerald-500 uppercase tracking-widest-xl">Step 1: Specialization</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4 font-display">
                        Select Your Specialization
                    </h2>
                    <p className="text-zinc-400 text-base max-w-xl leading-relaxed font-light mx-auto">
                        Which trajectory aligns with your professional or personal goals?
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    {scopes.map((scope, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedScope(scope)}
                            className="bg-zinc-900/60 border border-white/5 hover:border-emerald-500/50 rounded-xl p-6 text-left transition-all hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(16,185,129,0.1)] group"
                        >
                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{scope.title}</h3>
                            <p className="text-zinc-400 text-sm font-light leading-relaxed">{scope.description}</p>
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => setScopes(null)}
                    className="mt-10 text-zinc-500 hover:text-white text-xs font-mono uppercase tracking-widest-xl transition-colors"
                >
                    ← Back to Input
                </button>
            </div>
        );
    }

    if (selectedScope && !roadmapTemplate && !isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[55vh] py-12 relative max-w-4xl mx-auto w-full">
                <div className="text-center mb-12 relative">
                    <div className="flex items-center justify-center gap-3 mb-5">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-pulse" />
                        <span className="font-mono text-xs text-cyan-500 uppercase tracking-widest-xl">Step 2: Source Intelligence</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-pulse" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4 font-display">
                        Select a Full Course Masterclass
                    </h2>
                    <p className="text-zinc-400 text-base max-w-xl leading-relaxed font-light mx-auto">
                        Pick a comprehensive, full-length YouTube course to serve as your primary briefing for the <span className="text-cyan-400 font-bold">{selectedScope.title}</span> mission.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-3 w-full max-w-2xl">
                    {videoOptions?.map((video, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                setSelectedVideo(video);
                                handleGenerate(`Topic: ${prompt}. Focus: ${selectedScope.title}. Context: ${selectedScope.description}. Chosen Video: ${video.title}`);
                            }}
                            className="bg-zinc-900/60 border border-white/5 hover:border-cyan-500/50 rounded-xl p-5 text-left transition-all hover:bg-zinc-800/80 hover:shadow-lg group flex items-center justify-between"
                        >
                            <div>
                                <h3 className="text-white font-bold group-hover:text-cyan-400 transition-colors text-sm">{video.title}</h3>
                                <p className="text-red-500/80 text-[10px] font-mono mt-1 uppercase tracking-widest leading-none font-bold">Full Duration YouTube Course</p>
                            </div>
                            <span className="text-cyan-500/30 group-hover:text-cyan-400 transition-colors">→</span>
                        </button>
                    ))}
                    <button
                        onClick={() => {
                            setSelectedVideo({ title: 'Standard Curriculum', url: '' });
                            handleGenerate(`Topic: ${prompt}. Focus: ${selectedScope.title}. Context: ${selectedScope.description}`);
                        }}
                        className="mt-4 bg-transparent border border-white/5 hover:border-white/20 rounded-xl p-4 text-center text-zinc-500 hover:text-white text-xs font-mono uppercase tracking-widest-xl transition-all"
                    >
                        Skip Video Selection
                    </button>
                </div>

                <button
                    onClick={() => setSelectedScope(null)}
                    className="mt-10 text-zinc-500 hover:text-white text-xs font-mono uppercase tracking-widest-xl transition-colors"
                >
                    ← Back to Specialization
                </button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] py-20 relative">
                <div className="relative w-32 h-32 mb-12">
                    <div className="absolute inset-0 rounded-full border border-cyan-500/20 border-t-cyan-400 animate-spin" style={{ animationDuration: '2s' }} />
                    <div className="absolute inset-4 rounded-full border border-cyan-500/10 border-b-cyan-500/50 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
                    <div className="absolute inset-[38%] rounded-full bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-pulse" />
                    <div className="absolute inset-8 rounded-full bg-cyan-500/10 animate-ping" />
                </div>

                <div className="text-center space-y-3 mb-10">
                    <p className="font-mono text-xs text-cyan-400 tracking-widest-xl uppercase animate-pulse">
                        Generating Your Roadmap
                    </p>
                    <p className="font-mono text-xs text-zinc-500 tracking-widest-xl">
                        Analyzing objective and building topic structure...
                    </p>
                </div>

                <button
                    onClick={handleCancel}
                    className="text-zinc-500 hover:text-zinc-300 text-xs font-mono uppercase tracking-widest-xl border border-white/5 hover:border-white/10 px-5 py-2 rounded-lg transition-colors"
                >
                    Cancel
                </button>
            </div>
        );
    }

    if (!roadmapTemplate) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[55vh] py-12 relative">
                <div className="text-center mb-16 relative">
                    <div className="flex items-center justify-center gap-3 mb-5">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-pulse" />
                        <span className="font-mono text-xs text-cyan-500 uppercase tracking-widest-xl">AI Core Online</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-pulse" />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-5 font-display">
                        Define Your <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">Directive</span>
                    </h2>
                    <p className="text-zinc-400 text-lg max-w-xl leading-relaxed font-light">
                        Enter a learning objective. The AI Core will synthesize a structured mission roadmap calibrated to your cognitive profile.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="w-full max-w-2xl relative group">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8">
                        <button
                            type="button"
                            onClick={() => setIsCustomMode(false)}
                            className={`w-full sm:w-auto px-6 py-2.5 rounded-full text-[10px] font-mono tracking-widest uppercase transition-all ${!isCustomMode ? 'bg-cyan-500 text-black font-bold' : 'bg-white/5 text-zinc-500 hover:text-white'}`}
                        >
                            Standard Prompt
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsCustomMode(true)}
                            className={`w-full sm:w-auto px-6 py-2.5 rounded-full text-[10px] font-mono tracking-widest uppercase transition-all ${isCustomMode ? 'bg-amber-500 text-black font-bold' : 'bg-white/5 text-zinc-500 hover:text-white'}`}
                        >
                            Deep Data Analysis
                        </button>
                    </div>

                    <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-white/10 via-transparent to-white/10 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-all duration-700" />

                        <div className={`relative bg-black/60 backdrop-blur-xl border ${isCustomMode ? 'border-amber-500/30' : 'border-white/5'} group-focus-within:border-white/20 rounded-xl overflow-hidden transition-all duration-300 shadow-2xl`}>
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-500/0 to-transparent group-focus-within:via-cyan-500/30 transition-all duration-500" />

                            <div className="p-5 space-y-4">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                                    <div className="flex items-center gap-4 w-full">
                                        <span className={`font-mono ${isCustomMode ? 'text-amber-500' : 'text-cyan-500'} text-xl shrink-0 select-none animate-pulse`}>›</span>
                                        <input
                                            type="text"
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            placeholder={isCustomMode ? "Name this roadmap (Required)..." : "What do you want to master? (e.g. 'Machine Learning')"}
                                            className={`flex-1 bg-transparent text-zinc-200 placeholder-zinc-700 focus:outline-none text-base sm:text-lg font-light tracking-wide ${isCustomMode && !prompt.trim() ? 'border-b border-rose-500/20' : ''}`}
                                            disabled={isLoading}
                                            autoFocus
                                        />
                                    </div>
                                    {!isCustomMode && (
                                        <button
                                            type="submit"
                                            disabled={!prompt.trim()}
                                            className="w-full sm:w-auto shrink-0 px-8 py-3 bg-white text-black font-bold text-xs uppercase tracking-widest-xl rounded-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:bg-zinc-900 disabled:text-zinc-700 disabled:cursor-not-allowed"
                                        >
                                            Synthesize
                                        </button>
                                    )}
                                </div>

                                {isCustomMode && (
                                    <div className="space-y-4">
                                        <textarea
                                            value={sourceData}
                                            onChange={(e) => setSourceData(e.target.value)}
                                            placeholder="Paste your raw data, syllabus, unstructured notes, or text snippets here... AI will structure it for you."
                                            className="w-full h-32 bg-zinc-900/40 border border-white/5 rounded-lg p-4 text-zinc-300 text-sm focus:outline-none focus:border-amber-500/30 transition-colors custom-scrollbar"
                                        />
                                        <div className="flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={!prompt.trim() || !sourceData.trim()}
                                                className="w-full sm:w-auto px-8 py-3.5 bg-amber-500 text-black font-bold text-xs uppercase tracking-widest-xl rounded-lg transition-all duration-300 hover:bg-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:bg-zinc-900 disabled:text-zinc-700 disabled:cursor-not-allowed"
                                            >
                                                Analyze & Structure
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-500/0 to-transparent group-focus-within:via-cyan-500/20 transition-all duration-500" />
                        </div>
                    </div>

                    {!isCustomMode && (
                        <div className="flex flex-wrap gap-2 mt-5 justify-center">
                            {['Python Basics', 'React & Next.js', 'System Design', 'Data Structures'].map((hint) => (
                                <button
                                    key={hint}
                                    type="button"
                                    onClick={() => setPrompt(hint)}
                                    className="px-4 py-2 bg-zinc-900 border border-white/5 hover:border-cyan-500/30 hover:bg-zinc-800 text-zinc-500 hover:text-cyan-400 text-[10px] font-mono tracking-widest-xl uppercase rounded-lg transition-all duration-300"
                                >
                                    {hint}
                                </button>
                            ))}
                        </div>
                    )}

                    {generationError && (
                        <div className="mt-6 flex items-start gap-3 bg-rose-950/20 border border-rose-500/30 text-rose-400 text-xs font-mono px-5 py-4 rounded-xl">
                            <span className="text-rose-500 font-bold mt-0.5">[!]</span>
                            <div>
                                <div className="font-bold text-rose-400 mb-1 uppercase tracking-wider">Generation Failed</div>
                                <div className="text-rose-400/80">{generationError}</div>
                            </div>
                            <button onClick={() => setGenerationError('')} className="ml-auto text-rose-600 hover:text-rose-400 transition-colors">✕</button>
                        </div>
                    )}
                </form>
            </div>
        );
    }

    // ─── Editable Preview ───
    return (
        <div className="relative overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10 pb-8 border-b border-white/5 relative">
                <div className="absolute bottom-[-1px] left-0 w-24 h-px bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />

                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        <span className="font-mono text-xs text-emerald-500 tracking-widest-xl uppercase">Directive Ready — Review & Confirm</span>
                    </div>
                    <input
                        value={roadmapTemplate.title}
                        onChange={e => updateTitle(e.target.value)}
                        className="text-3xl md:text-4xl font-extrabold bg-transparent border-b border-transparent hover:border-zinc-800 focus:border-cyan-500 focus:outline-none text-white w-full py-2 transition-colors duration-200 font-display"
                    />
                    {roadmapTemplate.description && (
                        <p className="text-zinc-400 text-sm mt-4 leading-relaxed font-light border-l-2 border-cyan-500/30 pl-4">{roadmapTemplate.description}</p>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 shrink-0 w-full sm:w-auto">
                    <button
                        onClick={() => setRoadmapTemplate(null)}
                        className="w-full sm:w-auto text-zinc-500 hover:text-zinc-300 text-[10px] font-mono tracking-widest-xl uppercase transition-colors py-2"
                    >
                        Discard Sequence
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full sm:w-auto px-8 py-4 bg-white text-black font-extrabold text-[10px] uppercase tracking-widest-xl rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all duration-300 hover:-translate-y-0.5"
                    >
                        {isSaving ? 'Initializing...' : 'Deploy Mission →'}
                    </button>
                </div>
            </div>

            <div className="bg-black/30 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden shadow-panel p-6">
                {roadmapTemplate.children && roadmapTemplate.children.map((node: any, index: number) => (
                    <EditableTreeNode key={index} node={node} path={[index]} depth={0} />
                ))}
            </div>

            <div className="mt-12 pt-8 pb-4 border-t border-white/5 flex flex-col sm:flex-row justify-end items-center gap-4 sm:gap-8">
                <button
                    onClick={() => setRoadmapTemplate(null)}
                    className="w-full sm:w-auto text-zinc-500 hover:text-zinc-300 text-[10px] font-mono tracking-widest-xl uppercase transition-colors py-2"
                >
                    Discard Sequence
                </button>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full sm:w-auto px-10 py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-extrabold text-[10px] uppercase tracking-widest-xl rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.1)] hover:shadow-[0_0_40px_rgba(16,185,129,0.2)] transition-all duration-300 hover:-translate-y-0.5"
                >
                    {isSaving ? 'Initializing...' : 'Deploy Mission →'}
                </button>
            </div>
        </div>
    );
}
