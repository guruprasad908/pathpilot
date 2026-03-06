import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { getSession } from '../../../lib/auth';
import { z } from 'zod';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const RoadmapSchema = z.object({
    title: z.string(),
    rationale: z.string().optional(),
    galaxies: z.array(z.object({
        title: z.string(),
        focus: z.string().optional(),
        planets: z.array(z.object({
            title: z.string(),
            market_relevance: z.string().optional(),
            subtopics: z.array(z.object({
                title: z.string(),
                description: z.string().optional(),
                key_tools: z.array(z.string()).optional()
            }))
        }))
    }))
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

        const systemPrompt = `You are an expert, Market-Aware Curriculum Architect. Your goal is to tailor a highly relevant, job-ready learning roadmap for the requested topic.

CRITICAL INSTRUCTIONS:
- You must adapt the complexity, depth, and size of the roadmap *entirely* based on the user's specific request. If they ask for a "massive", "comprehensive", or "advanced" roadmap, generate a deep curriculum (up to 4 galaxies, 4 planets, 5 subtopics). If they ask for a "quick", "beginner", or "simple" roadmap, generate a focused curriculum (e.g. 2 galaxies, 2 planets, 2 subtopics). If unspecified, aim for a balanced median.
- Ensure the terminology and progression match the implied level of the request.
- You must blend Theoretical Foundations, Practical Tooling, and Market Strategy. Make sure the curriculum leads to tangible, job-ready outcomes. 
- Include the most modern, widely-used industry tools relevant to the request. 
- Ensure the final node of the roadmap acts as a substantial Capstone Project.

Generate a structured learning roadmap for the requested topic. You MUST respond with ONLY valid JSON strictly matching the following schema structure:
{
  "title": "Roadmap Title",
  "rationale": "Why this learning path is highly relevant in today's job market.",
  "galaxies": [
    {
      "title": "Galaxy (Major Theme/Phase)",
      "focus": "e.g., Theoretical Foundation, Tool Mastery, Capstone Project",
      "planets": [
        {
          "title": "Planet (Sub-Topic / Milestone)",
          "market_relevance": "Why employers care about this specific topic right now.",
          "subtopics": [
            { 
              "title": "Specific Concept",
              "description": "1-2 sentences explaining the concept and its practical application.",
              "key_tools": ["Tool1", "Tool2"] 
            }
          ]
        }
      ]
    }
  ]
}`;

        // Call OpenAI and strictly request a JSON object that mimics our schema structure
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            response_format: { type: "json_object" },
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: prompt
                }
            ]
        });

        const aiOutput = completion.choices[0].message.content;
        if (!aiOutput) {
            throw new Error("No output from OpenAI");
        }

        // Parse the JSON and validate it strongly with Zod
        const parsedJson = JSON.parse(aiOutput);
        const validatedData = RoadmapSchema.parse(parsedJson);

        // Phase 11: Return the JSON to the frontend instead of saving directly
        return NextResponse.json({ success: true, roadmap: validatedData });

    } catch (error: any) {
        console.error('AI Generation Failed:', error);

        // Expose error for debugging production
        return NextResponse.json({
            error: 'Failed to generate roadmap',
            details: error?.message || String(error)
        }, { status: 500 });
    }
}
