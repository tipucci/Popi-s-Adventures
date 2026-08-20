---
target: homepage regressions only
total_score: 23
max_score: 28
na_heuristics: 5,7,10
p0_count: 0
p1_count: 2
timestamp: 2026-08-20T23-28-38Z
slug: src-pages-index-astro
---
# Homepage critique — regressions only

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 3 | Active states and recovery copy are visible; mobile focus visibility is weak. |
| 2 | Match System / Real World | 4 | Italian diary language and hiking metadata remain natural and specific. |
| 3 | User Control and Freedom | 3 | Main destinations remain clear and reachable. |
| 4 | Consistency and Standards | 3 | Mobile contrast and numeric formatting diverge from the otherwise coherent system. |
| 5 | Error Prevention | n/a | No input or destructive workflow on this surface. |
| 6 | Recognition Rather Than Recall | 4 | Navigation and actions remain text-labelled and explicit. |
| 7 | Flexibility and Efficiency | n/a | Not material for this Experience homepage. |
| 8 | Aesthetic and Minimalist Design | 3 | The hierarchy is focused; the featured missing-photo state weakens the intended peak. |
| 9 | Error Recovery | 3 | The empty-data state explains the problem and offers “Riprova.” |
| 10 | Help and Documentation | n/a | Not material for this surface. |
| **Total** | | **23/28** | **Good** |

## Design Specificity Verdict

The homepage remains authored for Popi’s Adventures: Gea-led local photography, affectionate Italian copy, marker accents, and the editorial latest-memory structure are coherent with `DESIGN.md`. No category-level or visual-direction regression was found.

The deterministic scan reported two advisory `design-system-font-size` findings in `src/pages/index.astro`: `0.8125rem` at line 231 and `1.125rem` at line 238. Both are genuine type-ramp inconsistencies, with no strict false positives. Browser overlay injection did not complete, so no user-visible overlay is available; the reliable fallback is the CLI JSON plus independent desktop/mobile screenshots and DOM evidence.

## Overall Impression

The recent header and footer changes improved consistency without destabilizing the homepage. The remaining problems are narrow and measurable: focus visibility, mobile active-state contrast, fixed-nav occlusion, and the featured missing-photo state.

## What’s Working

- Product specificity remains strong; the page still reads as a personal outdoor diary rather than an app dashboard.
- Responsive structure is stable with no horizontal overflow at 1440, 768, 390, or 320 pixels.
- Semantic foundations remain sound: one `h1`, ordered headings, labelled navigation, meaningful image alternatives, `aria-current`, reduced-motion handling, and at least 44px primary targets.

## Priority Issues

### [P1] Focus rings fail non-text contrast

The 3px Sunshine focus outline used on the featured adventure link, About CTA, desktop navigation, and footer links is approximately 1.41:1 against Cream/Paper, below the 3:1 focus-indicator requirement. Keyboard focus exists but can visually disappear.

Fix: use Leaf or Ink for the outer focus ring; Sunshine may remain as a secondary inner accent.

Suggested command: `$impeccable audit`

### [P1] Active mobile-navigation text misses AA contrast

The active mobile item uses `#FFFAF3` text and icon on `#C65E34`, approximately 4.00:1. At 12px this misses the 4.5:1 normal-text threshold.

Fix: darken the active background or use Ink for the active label and icon while preserving the filled state and `aria-current`.

Suggested command: `$impeccable audit`

### [P2] Fixed mobile navigation obscures live content

At 390px the 74px bottom navigation occupies y=754–828 while the featured card spans y=570–921; at 320px it occupies y=719–775 over a y=570–891 card. Content remains reachable by scrolling, but the control covers part of the primary memory and can also obscure focused or anchored content.

Fix: provide fixed-nav-aware scroll clearance for content and keyboard focus, and verify safe-area spacing at narrow widths.

Suggested command: `$impeccable adapt`

### [P2] The featured latest hike lacks the photography promised by the hierarchy

“Monte Spedone” is the dominant first memory at every breakpoint, but its main visual is the pale “Foto in arrivo” fallback. The state is honest and accessible, yet the most prominent story is the least personal image on the page.

Fix: add the real local cover. Until it exists, prevent the missing-image state from becoming the largest photographic feature while keeping the entry and its chronology visible.

Suggested command: `$impeccable harden`

## Persona Red Flags

- **Sam, accessibility-dependent:** the yellow keyboard ring can disappear against Cream/Paper, and the active mobile label fails normal-text contrast.
- **Casey, distracted mobile user:** targets are comfortably sized and there is no overflow, but the fixed nav cuts across the primary recent-memory card at 390 and 320 pixels.
- **Jordan, first-timer:** routes and actions are clear, but the most prominent recent entry immediately presents “Foto in arrivo,” weakening confidence in the latest memory.

## Minor Observations

- The diary totals use two undocumented sizes: `0.8125rem` labels and `1.125rem` values.
- Duration formatting is inconsistent within one group: `03:30`, `03:00`, and `3:00`.
- `5210 m` lacks the Italian thousands separator used elsewhere for localized numbers.

## Questions to Consider

- Can the bottom navigation remain fixed if keyboard-focused or anchored content can sit behind it?
- When the newest hike has no photo, is chronological prominence more important than preserving the homepage’s photography-led first memory?
