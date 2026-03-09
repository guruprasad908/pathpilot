import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import NavBar from '../../../components/NavBar';
import { getSession } from '../../../lib/auth';
import { db } from '../../../lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function RoadmapStudyPage({ params }: { params: Promise<{ id: string }> }) {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    if (!session) redirect('/login');

    const resolvedParams = await params;
    const roadmapId = resolvedParams.id;
    const userData = await getSession();
    if (!userData) redirect('/login');
    const userId = userData.user_id;

    // Verify ownership
    const roadmapCheck = await db.query(
        `SELECT id, title FROM roadmaps WHERE id = $1 AND user_id = $2`,
        [roadmapId, userId]
    );

    if (roadmapCheck.rows.length === 0) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col items-center justify-center">
                <NavBar />
                <div className="flex-1 flex items-center justify-center w-full">
                    <div className="text-red-400 p-6 bg-red-900/20 border border-red-500/50 rounded-lg">
                        Roadmap not found or unauthorized access.
                    </div>
                </div>
            </div>
        );
    }

    const roadmap = roadmapCheck.rows[0];

    // Fetch all nodes + progress
    const result = await db.query(`
        SELECT 
            n.id, n.parent_id, n.title, n.description, n.depth, n.order_index, n.is_leaf,
            sp.status as progress_status
        FROM roadmap_nodes n
        LEFT JOIN subtopic_progress sp ON sp.subtopic_id = n.id AND sp.user_id = $1
        WHERE n.roadmap_id = $2
        ORDER BY n.depth ASC, n.order_index ASC
    `, [userId, roadmapId]);

    // Build tree
    const nodesById = new Map<string, any>();
    const rootNodes: any[] = [];

    for (const row of result.rows) {
        nodesById.set(row.id, {
            id: row.id,
            parentId: row.parent_id,
            title: row.title,
            description: row.description,
            depth: row.depth,
            isLeaf: row.is_leaf,
            status: row.progress_status || 'not_started',
            children: []
        });
    }

    for (const node of nodesById.values()) {
        if (node.parentId && nodesById.has(node.parentId)) {
            nodesById.get(node.parentId).children.push(node);
        } else if (!node.parentId) {
            rootNodes.push(node);
        }
    }

    // Recursive renderer for the tree
    function TreeNode({ node, level }: { node: any, level: number }) {
        const isLeaf = node.isLeaf;
        const isCompleted = node.status === 'completed';
        const indent = level * 24;

        return (
            <div style={{ marginLeft: indent }}>
                <div className={`flex items-center gap-3 py-2 px-3 rounded-xl transition-all ${
                    isLeaf 
                        ? 'hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06]' 
                        : ''
                }`}>
                    {/* Connector dot */}
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                        isCompleted ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]' :
                        isLeaf ? 'bg-cyan-500/40 border border-cyan-500/40' :
                        'bg-zinc-700'
                    }`} />

                    <span className={`text-sm ${
                        level === 0 ? 'font-bold text-white text-base' :
                        level === 1 ? 'font-semibold text-zinc-200' :
                        isLeaf ? 'text-zinc-400' : 'text-zinc-300 font-medium'
                    } ${isCompleted ? 'line-through text-zinc-600' : ''}`}>
                        {node.title}
                    </span>

                    {isLeaf && (
                        <Link
                            href={`/practice/${node.id}`}
                            className="ml-auto px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all border bg-cyan-500/10 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20 shrink-0"
                        >
                            {isCompleted ? 'Review' : 'Practice'}
                        </Link>
                    )}
                </div>

                {node.children && node.children.length > 0 && (
                    <div className="border-l border-white/[0.06] ml-[11px]">
                        {node.children.map((child: any) => (
                            <TreeNode key={child.id} node={child} level={level + 1} />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent text-zinc-100 selection:bg-white/10 font-display">
            <NavBar />

            <div className="container-standard py-[var(--spacing-sys-2xl)]">
                <header className="mb-[var(--space-5)] border-b border-[var(--color-galaxy-border)] pb-[var(--spacing-sys-lg)] flex flex-col gap-[var(--spacing-sys-md)]">
                    <div className="inline-block px-[var(--spacing-sys-md)] py-[var(--spacing-sys-sm)] bg-white/5 text-white text-sm font-semibold rounded-full border border-white/10 w-max">
                        Active Study Module
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
                        {roadmap.title}
                    </h1>
                </header>

                <main className="flex flex-col gap-4">
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 md:p-8">
                        {rootNodes.map((node: any) => (
                            <TreeNode key={node.id} node={node} level={0} />
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
}
