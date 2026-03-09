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

        const systemPrompt = `You are a Career Architect. A user wants to learn a topic. Your job is to return 3 to 4 learning paths. 
CRITICAL: The very first path MUST ALWAYS be a generic, foundational, general-purpose approach to the input.
The remaining 2-3 paths should be specific, high-value career paths or highly focused niches related to their exact input.
Do not generate a roadmap. Generate ONLY a JSON object containing an array of specific goals.

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
    },
    {
      "title": "Python for Full-Stack Web Development",
      "description": "Focus on Django, FastAPI, and robust backend engineering."
    },
    {
      "title": "Python for Automation & Scripting",
      "description": "Focus on web scraping, task automation, and DevOps."
    }
  ]
}

Respond ONLY with valid JSON strictly matching the { "paths": [{ "title": "...", "description": "..." }] } structure. Return exactly 3 to 4 paths.`;

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
