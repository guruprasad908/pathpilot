import { NextResponse } from 'next/server';
import { getSession } from '../../../../lib/auth';
import OpenAI from 'openai';
import { z } from 'zod';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { prompt } = await req.json();

        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json({ error: 'Valid prompt is required' }, { status: 400 });
        }

        const systemPrompt = `You are a Career Architect. A user wants to learn a topic. Your job is to:
1. Return 3 to 4 learning paths. **CRITICAL: The very first path MUST ALWAYS be a generic, foundational, general-purpose approach to the input.** The remaining paths should be specific career niches.
2. Return a list of exactly 4 high-quality tutorial videos or comprehensive "masterclass" learning resources for this general topic from reputable sources (e.g. YouTube, FreeCodeCamp, Harvard CS50, or similar).

Respond ONLY with valid JSON strictly matching this structure:
{
  "paths": [
    { "title": "...", "description": "..." }
  ],
  "videos": [
    { "title": "...", "url": "..." }
  ]
}

Example for "Python":
{
  "paths": [
    {
      "title": "Core Python Fundamentals",
      "description": "A general-purpose foundation covering syntax, data structures, OOP, and standard libraries without specializing in any specific industry."
    },
    {
      "title": "Python for Data Science & AI",
      "description": "Focus on pandas, numpy, and machine learning models."
    }
  ],
  "videos": [
    {
      "title": "Python Tutorial for Beginners (Full Course)",
      "url": "https://www.youtube.com/results?search_query=python+tutorial+for+beginners+full+course"
    },
    {
      "title": "Harvard CS50P: Introduction to Programming with Python",
      "url": "https://www.youtube.com/results?search_query=CS50P+full+course"
    }
  ]
}

Respond ONLY with valid JSON. Return exactly 3-4 paths and exactly 4 videos.`;

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

        const parsed = JSON.parse(aiOutput);
        
        return NextResponse.json(parsed);

    } catch (error: any) {
        console.error('Error generating scope:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate scope.' },
            { status: 500 }
        );
    }
}
