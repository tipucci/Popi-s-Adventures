# AGENTS.md

## Project Overview
This is an Astro project for a personal hiking diary called "Popi's Adventures".

The site includes:
- homepage with hero section
- hiking archive (list + filters)
- individual hike pages (cover + gallery)
- "About Us" section

The design is:
- mobile-first
- warm, natural, minimal
- simple and highly readable

---

## Core Principles

- Prefer SMALL, TARGETED edits over large refactors
- Do NOT modify unrelated files
- Keep code SIMPLE and maintainable
- Avoid introducing unnecessary abstractions
- Do not add external dependencies unless explicitly requested

---

## File Editing Rules

When making changes:
- Only modify files explicitly relevant to the task
- Preserve existing structure and naming where possible
- Do NOT rewrite entire files unless necessary
- Do NOT rename files unless explicitly requested

If multiple files are involved:
- Think through dependencies first
- Apply changes incrementally

---

## Image Management Rules

All images MUST follow this structure:

src/assets/images/
  site/
    home/
    about/
  hikes/
    <yyyy-mm-dd-slug>/

Rules:
- Use ONLY local images (no remote URLs)
- Naming:
  - cover.jpg
  - gallery-01.jpg, gallery-02.jpg, etc.
- Lowercase filenames only
- No spaces in filenames

Do NOT:
- introduce external image URLs
- mix images from different hikes
- hardcode inconsistent paths

---

## Content Structure (Hikes)

Each hike should support:

- cover
- coverAlt
- gallery (array)

If content collections are used:
- Keep schema consistent
- Ensure type safety
- Do not break existing entries

---

## Components Guidelines

Key components:
- HikeCard
- Hike detail page
- Gallery
- AboutUs

Rules:
- Always include meaningful alt text
- Use semantic HTML
- Do not break layout
- Do not introduce heavy client-side JS

---

## Styling Rules

- Keep styling minimal and consistent
- Do NOT modify global styles unless necessary
- Prefer scoped styles
- Avoid visual regressions

---

## Safety & Stability

Before finalizing changes, ensure:
- Imports are correct
- No broken paths
- No leftover references to old fields (e.g. "image")
- No remote image URLs

---

## When Task Is Complex

If the task involves multiple steps:

1. First propose a PLAN
2. Then apply changes step-by-step
3. Avoid doing everything in a single patch

---

## If Patch Fails

If patching fails or is not possible:
- Provide FULL updated files instead
- Or provide clear diffs
- Do NOT stop at partial output

---

## Output Expectations

Always provide:
- clear list of modified files
- final code (ready to copy)
- minimal but useful explanation

Avoid:
- long introductions
- unnecessary explanations

---

## Change Strategy

- First think, then edit
- If task is complex, propose a plan first
- Modify only necessary lines
- Avoid large patches