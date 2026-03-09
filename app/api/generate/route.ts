import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { getSession } from '../../../lib/auth';
import { z } from 'zod';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Recursive tree node schema — supports unlimited depth
const TreeNodeSchema: z.ZodType<any> = z.lazy(() => z.object({
    title: z.string(),
    description: z.string().optional(),
    children: z.array(TreeNodeSchema).default([])
}));

const RoadmapTreeSchema = z.object({
    title: z.string(),
    description: z.string().optional(),
    children: z.array(TreeNodeSchema)
});

// Allow this function to run for up to 60 seconds on Vercel
export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user_id;

        const { prompt } = await req.json();

        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json({ error: 'Valid prompt is required' }, { status: 400 });
        }

        const systemPrompt = `You are an expert Curriculum Architect who builds deeply structured learning roadmaps. 
Your task is to generate a DEEPLY NESTED mind-map style curriculum tree with 5-6 levels of depth.

CRITICAL DEPTH REQUIREMENTS:
- Level 0: Main chapters/phases (e.g. "Python Fundamentals", "Data Structures", "OOP") — generate 8 to 13 chapters
- Level 1: Major topics within each chapter (e.g. "What is Python", "Environment Setup") — generate 2 to 5 per chapter
- Level 2: Subtopics (e.g. "Installing Python", "IDEs", "Package Management") — generate 2 to 4 per topic
- Level 3: Specific concepts (e.g. "VS Code", "PyCharm", "Jupyter Notebook") — generate 2 to 5 per subtopic
- Level 4+: Even deeper granular points where relevant (e.g. "pip", "virtualenv", "conda")

IMPORTANT RULES:
- Nodes with NO children are "leaf nodes" — these represent the most granular actionable study items
- Every branch should go AT LEAST 3 levels deep, preferably 4-5
- Use short, precise titles (2-6 words max)
- Add a brief "description" field only on level 0 and level 1 nodes
- Make the curriculum practical, modern, and job-ready
- Cover the topic comprehensively — don't leave major areas out

You MUST respond with ONLY valid JSON matching this recursive structure:
{
  "title": "Roadmap Title",
  "description": "Brief overview",
  "children": [
    {
      "title": "Chapter Name",
      "description": "What this chapter covers",
      "children": [
        {
          "title": "Topic Name",
          "description": "Brief description",
          "children": [
            {
              "title": "Subtopic",
              "children": [
                { "title": "Concept A", "children": [] },
                { "title": "Concept B", "children": [] }
              ]
            }
          ]
        }
      ]
    }
  ]
}`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            response_format: { type: "json_object" },
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ]
        });

        const aiOutput = completion.choices[0].message.content;
        if (!aiOutput) {
            throw new Error("No output from OpenAI");
        }

        const parsedJson = JSON.parse(aiOutput);
        const validatedData = RoadmapTreeSchema.parse(parsedJson);

        // Return the tree to the frontend for preview before saving
        return NextResponse.json({ success: true, roadmap: validatedData });

    } catch (error: any) {
        console.error('AI Generation Failed:', error);
        return NextResponse.json({
            error: 'Failed to generate roadmap',
            details: error?.message || String(error)
        }, { status: 500 });
    }
}
