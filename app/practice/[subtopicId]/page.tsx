import React from 'react';
import { redirect } from 'next/navigation';
import { db } from '../../../lib/db';
import { getSession } from '../../../lib/auth';
import PracticeClient from './PracticeClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Self-Directed Practice',
};

export default async function PracticePage({ params }: { params: Promise<{ subtopicId: string }> }) {
    const session = await getSession();

    if (!session?.user_id) {
        redirect('/login');
    }

    const userId = session.user_id;
    const resolvedParams = await params;

    // Validate ownership — also fetch roadmap ID so the client can link back
    const res = await db.query(
        `SELECT n.id as sub_id, n.title, r.user_id, r.id as roadmap_id
         FROM roadmap_nodes n
         JOIN roadmaps r ON n.roadmap_id = r.id
         WHERE n.id = $1`,
        [resolvedParams.subtopicId]
    );

    if (res.rows.length === 0) {
        redirect('/dashboard');
    }

    const subtopic = res.rows[0];

    if (subtopic.user_id !== userId) {
        redirect('/dashboard');
    }

    return (
        <PracticeClient
            subtopicId={subtopic.sub_id}
            subtopicTitle={subtopic.title}
            roadmapId={subtopic.roadmap_id}
        />
    );
}
