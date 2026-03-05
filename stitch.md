# Google Stitch Visualization Prompts

Copy and paste the promt below into **Google Stitch** to generate high-fidelity UI mockups of our new Track 1 design system. The prompts are specifically engineered to enforce our exact constraints (colors, border radiuses, typography, and WCAG contrast).

---

## Prompt 1: The Mission Control Dashboard

**Copy this exact text into Google Stitch:**

```text
Design a dark-mode web application dashboard for a learning platform called "PathPilot.V2".

Aesthetic Strict Rules:
- Primary Background: #0a0a0f (deep space black)
- Card / Panel Backgrounds: #151520
- Highlighting Colors: Neon Cyan (#00f0ff) for active states, Neon Emerald (#00ff9d) for completed states.
- Typography: Use a clean geometry font like "Inter" or "Outfit". All text must have strict WCAG-compliant contrast against the dark backgrounds. No generic grey text that is hard to read.
- Borders & Shadows: Use uniform `8px` to `12px` border-radius on cards, with subtle dark borders. Only use glowing neon drop-shadows on the active or completed elements. 

Layout Requirements:
1. Top Navigation Bar: A sticky, glassmorphism header. Left side has a bold "PathPilot.V2" logo. Center has clean text links: "Mission Control", "Mission Log", "Roadmap Architect", "Learning Profile". Right side has a simple logout icon.
2. Main Content Area: A wide "Mission Control" hero section summarizing the current active course (e.g., "Advanced Python Dynamics") with a sleek progress bar showing 65% completion.
3. Modules List: Below the progress bar, show a vertical list of three collapsible accordion cards representing "Planets" (course modules).
4. Subtopics: Expand the first Planet to reveal a vertical list of 3 "Subtopics". The first subtopic is marked fully complete with a green checkmark. The second subtopic is currently "In Progress" and has a glowing purple/cyan "Start Focus" timer button. The third is locked/unexplored.

Keep everything modern, elegant, and avoid overly cluttered sci-fi dashboards. Focus on clean spacing.
```

---

## Prompt 2: The Deep Dive / Practice Chamber

**Copy this exact text into Google Stitch:**

```text
Design an interactive "Adaptive Practice" modal or page layout for an e-learning platform.

Aesthetic Rules:
- Theme: Minimalist Deep Space. Background is #0a0a0f, main content card is #151520.
- Highlight Colors: Use Neon Cyan (#00f0ff) sparingly for primary buttons.
- Typography: Clean sans-serif (Inter). High contrast text.
- Component Style: Rounded corners (12px), clean thin borders.

Layout Requirements:
1. Header: A clean top bar stating "Practice Chamber: Python Decorators" and a badge saying "Difficulty: Adaptive".
2. Problem Area: A clean, distraction-free central area displaying a multiple-choice or short-answer coding question.
3. Solution Toggle: A sleek button that reads "Reveal Solution".
4. Result State: Below the question, show an expanded "Explanation" block that looks like a clean terminal output or code editor window, validating the right answer with a subtle green highlight.
5. Footer: A discrete "Generate New Set" button at the absolute bottom.

Ensure the UI feels like a focus-mode simulation environment—very calm, very dark, with high-contrast text. No heavy textures or noisy graphics.
```
