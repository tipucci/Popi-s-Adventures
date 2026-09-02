---
name: "Popi's Adventures"
description: "A joyful, hand-crafted outdoor diary with modern trail usability."
colors:
  cream: "#F7F1E3"
  paper: "#FFFDF7"
  ink: "#25251F"
  leaf: "#3F6B4F"
  sunshine: "#F2C94C"
  tomato: "#E66A4E"
  sky: "#7EB6C2"
  moss: "#91A66D"
  border: "#DDD7C9"
typography:
  display:
    fontFamily: "Alegreya, Georgia, serif"
    fontSize: "clamp(2.5rem, 6vw, 3.75rem)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Alegreya, Georgia, serif"
    fontSize: "clamp(2rem, 4vw, 3rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Alegreya, Georgia, serif"
    fontSize: "clamp(1.25rem, 2vw, 1.5rem)"
    fontWeight: 600
    lineHeight: 1.12
  body:
    fontFamily: "Alegreya Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Alegreya Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.02em"
rounded:
  small: "6px"
  medium: "10px"
  large: "14px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  compact: "12px"
  md: "16px"
  gutter-mobile: "20px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
  4xl: "96px"
components:
  button-primary:
    backgroundColor: "{colors.leaf}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.medium}"
    padding: "12px 18px"
  button-primary-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.leaf}"
    typography: "{typography.label}"
    rounded: "{rounded.medium}"
    padding: "11px 17px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.small}"
    padding: "12px 14px"
  card:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.large}"
    padding: "0"
  chip:
    backgroundColor: "{colors.sunshine}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "6px 10px"
---

# Design System: Popi's Adventures

## Overview

**Creative North Star: "The Hand-Drawn Adventure Journal"**

Popi's Adventures is a joyful, hand-crafted outdoor diary: a travel journal drawn by hand, with the usability of a modern outdoor product. It should feel made by real people to remember real adventures shared by Tizi, Meg, Gea, and their friends—not like an activity tracker, fitness product, or generic hiking platform.

The underlying interface stays clean, structured, and highly usable. Personality is layered on top through real photography, hand-drawn lines, arrows, circles, underlines, stars, suns, mountains, footprints, paw prints, paths, short annotations, and controlled irregularity. The content grid can be precise; the decorative marks should not be.

Memories come before performance. Distance, elevation, duration, maps, filters, and checklists remain immediately understandable, but they support the adventure rather than becoming its identity. This direction replaces the previous restrained-minimal world: sunny color, imperfect marks, and affectionate visual details are now intentional parts of the brand.

**Key Characteristics:**

- Joyful, warm, affectionate, curious, and slightly imperfect.
- Modern usability underneath expressive hand-drawn personality.
- Photography-led, with memories presented as collected rather than marketed.
- Calm neutral surfaces punctuated by marker-like bursts of color.
- Playful without becoming childish, chaotic, rustic, or scrapbook-like.

## Colors

The palette feels like warm notebook paper with a small set of colorful markers used to circle, underline, and annotate what matters.

### Primary

- **Leaf:** The main interaction and outdoor-reference color for navigation states, links, primary actions, selected filters, and route-related emphasis.

### Secondary

- **Sunshine:** A joyful highlight for hand-drawn marks, small celebrations, active annotations, and moments that should feel sunny rather than urgent.
- **Sky:** A soft secondary accent for map-related moments, water, weather, and quiet graphic details.

### Tertiary

- **Tomato:** A warm red-orange accent for playful emphasis, affectionate details, and small calls for attention.
- **Moss:** A supporting natural green for secondary outdoor references and calm status treatments.

### Neutral

- **Cream:** The main canvas, closer to warm notebook paper than digital white.
- **Paper:** A raised surface used only where a control or group needs separation.
- **Ink:** The primary reading color: a very dark warm neutral rather than pure black.
- **Border:** A quiet inherited divider for controls and groups that cannot be explained by spacing alone.

### Named Rules

**The Marker-on-Paper Rule.** Cream, Paper, and Ink create a calm field; brand colors behave like markers that highlight, circle, or connect something meaningful.

**The Simple Component Rule.** A page may use several brand colors, but an individual component should stay visually simple and avoid a rainbow of competing accents.

**The Meaning Beyond Color Rule.** Never use color alone to communicate state, difficulty, completion, or selection; pair it with copy, icons, shape, or position.

## Typography

**Narrative Display:** Alegreya (with Georgia and serif fallbacks)

**Reading and Interface:** Alegreya Sans (with ui-sans-serif and system fallbacks)

**Annotation Voice:** Alegreya Italic; no third decorative handwritten font.

**Character:** Typography separates three jobs without fragmenting the identity. Alegreya gives short narrative openings and hike titles an editorial, human voice. Alegreya Sans carries paragraphs and compact interface elements. Alegreya Italic adds one restrained annotative voice for names and photo notes. Filters, maps, checklists, controls, and useful data always stay in Alegreya Sans.

### Hierarchy

- **Display** (600, responsive display scale, 1): Reserved for short narrative openings. Compose important breaks intentionally and aim for roughly 8–13 characters per line.
- **Headline** (600, responsive headline scale, 1.05): Page titles and major editorial section headings.
- **Title** (600, responsive title scale, 1.12): Hike names, cards, and narrative subsection titles.
- **Body** (400, 1rem, 1.6): Stories, descriptions, instructions, and general content. Keep long-form text around 60–68 characters per line.
- **Label** (700, 0.875rem, 0.02em): Compact controls and metadata without decorative overuse.
- **Annotation** (Alegreya Italic, 500): Short photo notes, names, occasional section accents, and margin comments only. Never use it for paragraphs, essential metadata, or interface controls.
- **Data** (Alegreya Sans, 650–700, tabular numerals): Distances, elevation, duration, and counts should read as useful notes rather than athletic statistics.

### Named Rules

**The Three Roles Rule.** Alegreya narrates, Alegreya Sans explains and operates, and Alegreya Italic annotates. Never make the visitor decode a functional control through expressive lettering.

**The Margin Note Rule.** Italic annotations remain brief enough to feel added in the moment, not like a second body-text system.

**The Quiet Weight Rule.** Titles live between 600 and 700. Contrast comes from type shape, scale, spacing, and composition—not an 800 default.

## Layout

Use a mobile-first spatial system with comfortable horizontal gutters beginning at the mobile gutter token and increasing progressively at wider breakpoints. Smaller spacing values organize content within a component; larger values separate scenes, memories, and chapters.

The content grid remains deliberate and easy to scan. Controlled irregularity belongs to decoration and editorial moments: slightly rotated doodles, asymmetric photo groupings, overlapping annotations, imperfect SVG strokes, hand-drawn highlights, and small visual surprises. Do not make navigation, forms, filters, or core reading order unpredictable.

Every page balances three layers. Content—photos, stories, and adventures—is dominant. Interface—navigation, filters, maps, and hiking information—is clear and quiet. Personality—doodles, annotations, colors, and playful motion—is expressive but restrained. If personality interferes with content or interface, simplify it.

The homepage should feel like opening the diary and lead into the latest adventure as an editorial story. The archive may become quieter and denser for discovery. Hike detail pages can use the strongest journal compositions. The map stays geographically familiar. The backpack checklist can reward interaction with more playful details.

**The Precise Grid, Imperfect Ink Rule.** Align content and interaction reliably; let drawings and annotations break the geometry in controlled, non-blocking ways.

**The Three-Layer Balance Rule.** Content leads, interface supports, personality signs the work. Layer three must never obscure layers one or two.

## Elevation & Depth

The system is flat by default. Depth comes from overlapping photography, selective Paper surfaces, drawn marks, and occasional irregular composition rather than stacks of floating cards. Shadows are reserved for elements that genuinely detach from the document flow, such as a temporary overlay or a control floating above a map.

### Shadow Vocabulary

- **Ambient Low** (`0 8px 24px rgba(37, 37, 31, 0.08)`): The maximum default softness for a detached overlay, map control, or purposeful hover lift.

### Named Rules

**The Flat Notebook Rule.** A journal page does not turn every memory into a floating panel; sections and cards do not automatically receive borders and shadows.

## Shapes

Small UI uses a modest radius, buttons stay gently curved, and photographs use slightly softened corners. Avoid solving prominence with ever-larger radii. Large decorative surfaces may use irregular local SVG shapes instead of inflated rounded rectangles.

Pills are functional symbols, not the default silhouette. Reserve the pill radius for filters, tags, status chips, and compact selectable states. Standard buttons, metadata, navigation, cards, and content sections use the regular radius scale.

Hand-drawn circles, underlines, paths, and irregular outlines are a separate decorative layer. They may overlap or rotate slightly, but they must not change hit targets, reading order, or layout stability.

**The Geometry Has a Job Rule.** Containers communicate grouping or interaction; doodles communicate emphasis or personality. Do not confuse their roles.

## Components

### Doodle Library

Doodles are a recognizable part of the identity. Build a small reusable library of lightweight local SVG illustrations—curved arrow, rough circle, underline, trail, sun, mountain, tree, tent, backpack, boot, paw, heart, star, and location marker—without an external runtime dependency.

Prefer simple single-stroke drawings with imperfect paths. Use brand colors and vary position, scale, or small rotation deliberately. Decorative doodles are hidden from assistive technology; any mark that communicates information needs an accessible text equivalent.

Good uses include a rough circle around an important word, an arrow toward the latest adventure, a paw near Gea, a trail connecting two editorial elements, a sun beside a joyful memory, or a note beside a photograph. Do not add a fixed quota of doodles to every card or empty space.

### Photography

Local adventure photography is the emotional center. Images should feel collected over time rather than presented as marketing assets. Use generous crops, varied editorial compositions, occasional asymmetry, photo groups, and short annotations while preserving intentional treatment within repeated archive components.

Avoid heavy overlays, strong gradients, text over important image content, literal scrapbook frames, fake tape, paper clips, torn paper, and repeated Polaroid effects. A rare notebook-like arrangement is acceptable when it remains contemporary and does not reduce image clarity.

### Hike Cards

Hike cards should feel like memories waiting to be reopened. Their hierarchy is photograph, hike title, place and date, then one compact statistics line such as `12,4 km · 620 m D+ · 4h 10m`. Photography dominates, and a visible outer container is optional when spacing already establishes grouping.

- **Shape:** Photo corners use the large radius; the full card does not need another rounded shell.
- **Surface:** Transparent by default; Paper only when separation is necessary.
- **State:** A subtle image or color transition may signal hover. Avoid dramatic translation, large CTA buttons, and shadow changes.

### Buttons

- **Shape:** Gently curved using the medium radius, not automatically pill-shaped.
- **Primary:** Leaf with light Paper text and compact, confident padding.
- **Hover / Focus:** Ink on hover; a clearly visible focus outline that does not rely on color alone.
- **Secondary:** Paper with Leaf text and a quiet Border outline.

### Inputs and Filters

- **Style:** Paper background, Border outline, Ink content, and the small radius.
- **Focus:** A strong visible Leaf outline or border shift with sufficient contrast.
- **Density:** Compact enough for archive scanning while retaining comfortable mobile touch targets.
- **Filters:** Pills are acceptable for compact selectable filters and tags. Large filter panels must not dominate narrow screens, and active filters always include a non-color indicator.

### Navigation

Navigation is simple and predictable. Main destinations have clear hierarchy, the active location is always visible, and mobile navigation is composed intentionally rather than compressed from desktop. Personality may appear in a restrained underline, circle, or nearby mark, but standard navigation labels and icons remain familiar.

### Map

Keep the core interaction clean and geographically familiar. Bring personality through surrounding UI, marker styling, popup design, typography, and small illustrations, never by compromising map readability or replacing standard controls with ambiguous drawings.

### Backpack Checklist

The checklist can be one of the most playful areas. Completed items may receive a hand-drawn strike-through or tiny celebratory reaction, and local illustrations may reference a backpack, bottle, boots, snacks, or dog equipment. Interaction, progress, and completed states remain unmistakable.

### Motion

Use short, optional motion that reinforces the handmade personality: a doodle being drawn, an underline appearing, a small arrow shift, gentle image movement, or a tiny checkbox celebration. Avoid parallax everywhere, large bouncing effects, animated gradients, excessive scroll animation, and constant decorative movement. Respect `prefers-reduced-motion`.

### Interface Voice

Copy sounds human and informal: “Le nostre ultime avventure” rather than “Attività recenti,” “Dove siamo stati” rather than “Località,” and “Cosa mettiamo nello zaino?” rather than “Checklist equipaggiamento.” Functional controls stay immediately clear; personality must not turn labels into riddles.

**The Meaningful Mark Rule.** A doodle, color burst, annotation, or animation must emphasize a memory, relationship, state, or action. Empty space is not an invitation to decorate.

## Do's and Don'ts

### Do:

- **Do** let real local photography carry the emotional weight of a page.
- **Do** keep the content grid precise while allowing decorative marks and editorial image groupings to feel hand-made.
- **Do** use Sunshine, Tomato, Sky, Moss, and Leaf like notebook markers: small bursts that highlight something meaningful.
- **Do** build reusable doodles as lightweight local SVG assets with accessible behavior.
- **Do** express hiking data as a compact supporting line rather than a panel of performance statistics.
- **Do** reward interaction with short, optional moments of playful motion.
- **Do** remove or simplify personality whenever it interferes with content, navigation, or comprehension.

### Don't:

- **Don't** imitate Piantala Club, Scribbbles, Komoot, or any other reference directly; use them only as evidence for warmth, hand-drawn expression, and outdoor usability.
- **Don't** default to SaaS cards, fitness dashboards, statistics panels, dark outdoor green everywhere, or generic hiking-app patterns.
- **Don't** use gradient backgrounds, glassmorphism, oversized typography, excessive shadows, or pill-shaped controls everywhere.
- **Don't** make every layout geometrically perfect, but never make decoration destabilize the usable grid.
- **Don't** replace familiar interface icons or controls with ambiguous doodles.
- **Don't** use stock outdoor illustrations, random doodles, fake paper textures, fake Polaroids, tape, paper clips, or literal scrapbook styling.
- **Don't** place several decorative marks on every card or animate them constantly.
- **Don't** make the experience technical, athletic, corporate, premium, overly polished, childish, or performance-oriented.

**The Final Test.** Ask first: “Does this feel like something we made to remember our adventures together?” Then ask: “Can I still find the hike or information I need immediately?” Both answers must be yes.
