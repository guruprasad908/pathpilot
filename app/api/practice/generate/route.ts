import { NextResponse } from 'next/server';
import { getSession } from '../../../../lib/auth';
import { db } from '../../../../lib/db';
import OpenAI from 'openai';
import { z } from 'zod';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const responseSchema = z.object({
    difficulty: z.preprocess(
        val => typeof val === 'string' ? val.toLowerCase() : val,
        z.enum(['foundation', 'applied', 'advanced'])
    ),
    problems: z.array(
        z.object({
            question: z.string(),
            solution: z.string(),
            explanation: z.string()
        })
    ).length(3, "Must return exactly 3 problems")
});

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session?.user_id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user_id;

        const body = await req.json();
        const { subtopicId } = body;

        if (!subtopicId) {
            return NextResponse.json({ error: 'subtopicId is required' }, { status: 400 });
        }

        console.log(`Starting practice generation. userId=${userId}, subtopicId=${subtopicId}`);

        // 1. Fetch user average
        console.log("Fetching user average...");
        const avgRes = await db.query(
            `SELECT COALESCE(AVG(duration_seconds), 0) as avg_time 
             FROM study_sessions 
             WHERE user_id = $1 AND duration_seconds IS NOT NULL`,
            [userId]
        );
        const userAvg = parseFloat(avgRes.rows[0].avg_time) || 0;

        // 2. Fetch subtopic study statistics and roadmap context
        const statsRes = await db.query(
            `SELECT 
                s.id, s.title as subtopic_title,
                p.title as planet_title,
                g.title as galaxy_title,
                r.title as roadmap_title,
                r.user_id as owner_id,
                COALESCE(pr.status, 'not_started') as status,
                COALESCE(SUM(ss.duration_seconds), 0) as total_time,
                COUNT(ss.id) as session_count
            FROM subtopics s
            JOIN planets p ON s.planet_id = p.id
            JOIN galaxies g ON p.galaxy_id = g.id
            JOIN roadmaps r ON g.roadmap_id = r.id
            LEFT JOIN subtopic_progress pr ON pr.subtopic_id = s.id AND pr.user_id = $1
            LEFT JOIN study_sessions ss ON ss.subtopic_id = s.id AND ss.user_id = $1
            WHERE s.id = $2
            GROUP BY s.id, p.title, g.title, r.title, r.user_id, pr.status`,
            [userId, subtopicId]
        );

        if (statsRes.rows.length === 0) {
            console.log(`Subtopic not found for subtopicId: ${subtopicId} and userId: ${userId}`);
            return NextResponse.json({ error: 'Subtopic not found' }, { status: 404 });
        }

        const stats = statsRes.rows[0];

        if (stats.owner_id !== userId) {
            return NextResponse.json({ error: 'Unauthorized to access this subtopic' }, { status: 403 });
        }

        const profileRes = await db.query(
            `SELECT experience_level, pace_preference, depth_preference 
             FROM user_learning_profile WHERE user_id = $1`,
            [userId]
        );
        const profile = profileRes.rows[0] || {};

        // 4. Calculate Adaptive Difficulty (Server-Side)
        let computedDifficulty: 'foundation' | 'applied' | 'advanced' = 'applied'; // Step 4: Default -> applied
        const totalTimeNum = parseInt(stats.total_time, 10);
        const sessionCountNum = parseInt(stats.session_count, 10);

        if (userAvg === 0) {
            // Step 0: If user_avg = 0 → foundation
            computedDifficulty = 'foundation';
        } else if (
            stats.status !== 'completed' &&
            (totalTimeNum > 2.5 * userAvg || (sessionCountNum > 3 && totalTimeNum > 300))
        ) {
            // Step 1: Foundation
            computedDifficulty = 'foundation';
        } else if (stats.status === 'completed' && totalTimeNum < 1.5 * userAvg) {
            // Step 2: Advanced
            computedDifficulty = 'advanced';
        } else if (
            stats.status === 'in_progress' &&
            totalTimeNum >= 0.75 * userAvg &&
            totalTimeNum <= 2.5 * userAvg
        ) {
            // Step 3: Applied
            computedDifficulty = 'applied';
        }

        console.log(`Computed difficulty: ${computedDifficulty} for user ${userId}, session count ${sessionCountNum}, totalTimeNum ${totalTimeNum}, userAvg ${userAvg}`);

        // 5. Generate Problems with OpenAI
        const generateProblems = async () => {
            console.log("Calling OpenAI...");
            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                response_format: { type: "json_object" },
                messages: [
                    {
                        role: "system",
                        content: `You are an expert tutor creating practice problems.
Goal: Create exactly 3 practice problems for a student.

Context:
- Roadmap: ${stats.roadmap_title}
- Galaxy: ${stats.galaxy_title}
- Target Concept: ${stats.subtopic_title}
- Set Difficulty: ${computedDifficulty}
- User Profile: ${profile.experience_level || 'beginner'} experience, ${profile.depth_preference || 'balanced'} depth.

Strict Rules:
- Return ONLY valid JSON in this exact structure: { "difficulty": "${computedDifficulty}", "problems": [ { "question": "", "solution": "", "explanation": "" } ] }
- Must return exactly 3 problems (problems array length === 3).
- Do not repeat textbook definitions.
- Problems must require thinking.
- Keep explanations under 150 words.
- No markdown formatting in the output strings whatsoever (no bolding, no \`\`\`, no lists).
- If 'foundation': focus on core mechanics and identifying components.
- If 'applied': focus on using the concept to solve a scenario.
- If 'advanced': focus on edge cases, troubleshooting, or deep architectural understanding.`
                    }
                ],
                temperature: 0.7,
            });

            console.log("OpenAI response received.");
            const content = completion.choices[0].message.content || '{}';
            // Strip markdown boundaries just in case
            const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanContent);
            return responseSchema.parse(parsed);
        };

        let result;
        try {
            result = await generateProblems();
        } catch (err) {
            console.error("First generation attempt failed, retrying once...", err);
            try {
                result = await generateProblems();
            } catch (retryErr) {
                console.error("Second generation attempt failed:", retryErr);
                return NextResponse.json({ error: 'Failed to generate well-formed practice problems: ' + (retryErr as any).message }, { status: 500 });
            }
        }

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Top-level error generating practice:', error);
        return NextResponse.json({ error: 'Internal Server Error: ' + error.message, stack: error.stack }, { status: 500 });
    }
}
