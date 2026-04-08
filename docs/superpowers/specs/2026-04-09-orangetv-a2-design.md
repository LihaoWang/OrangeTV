# OrangeTV A2 redesign spec

Date: 2026-04-09
Status: approved and locked for planning
Chosen direction: `A2` cinematic lounge

## Summary

OrangeTV will be redesigned around the `A2` direction: a sharper, warmer, projection-inspired interface that treats the app like a screening room rather than a generic streaming dashboard.

The redesign will not introduce a new information architecture or a new framework. It will keep the current Next.js 14 + Tailwind CSS v3 stack, preserve existing product flows, and refactor the visual system through a new design token layer and updated component styling.

The visual reset is defined by these decisions:

- Remove pill-shaped controls.
- Reduce rounded-card language across the app.
- Stop using bordered boxes as the default way to separate sections.
- Use spacing, typography, alignment, and hairline rules as the primary structure system.
- Use one restrained warm accent family instead of blue-glass UI styling.
- Keep the player and source diagnostics visually integrated with the rest of the product.

## Product intent

The redesigned product should feel:

- Cinematic, but not theatrical
- Technical, but not dense
- Premium, but not glossy
- Quietly authored, rather than algorithmically generated

The interface should support three main product behaviors without visual conflict:

- Browsing and resuming movies, series, anime, and variety content
- Switching sources and reading playback quality information
- Moving between media browsing and live TV without the interface feeling like two separate products

## Non-goals

- No framework migration
- No redesign of core navigation architecture
- No decorative glassmorphism pass
- No “luxury landing page” treatment that harms usability
- No new visual system based on pills, large shadows, or saturated gradients

## Design principles

### 1. Structure through rhythm, not containers

Sections should usually be separated by vertical spacing and a single rule. Full bordered cards should only appear when elevation or grouping is functionally meaningful.

Implications:

- Home rows sit directly on the page surface
- Sidebar, search, and player modules should rely on rails and dividers first
- Overuse of rounded panels is explicitly out of scope

### 2. Sharp controls over soft controls

Interactive controls should read like links, rails, tabs, and plain icon actions rather than pills or floating capsules.

Implications:

- Tab systems should move away from capsule switches where practical
- Filter chips should become underlined or rule-separated options
- Source actions should read as technical controls, not “friendly buttons”

### 3. Warm dark palette with one accent family

The product should abandon pale blue backgrounds and bright blue emphasis. The new base is warm charcoal with restrained copper as the primary accent family.

Implications:

- White is replaced by warm off-white
- Grays stay warm, not blue-gray
- Status cues remain visible but subdued

### 4. Typography carries identity

Identity should come from type, spacing, and hierarchy more than from decorative surfaces.

Implications:

- Lead headings use a tighter, characterful sans display style
- Section labels are small, uppercase, and dry
- Diagnostics use monospace

### 5. Player and browse surfaces belong to the same system

The playback page, source diagnostics, and browse pages should feel like one product, not two design systems stitched together.

Implications:

- Source metrics use the same token set as the home and browse pages
- The player page should inherit the same rule, spacing, and text system
- Live TV should feel like a programming rail, not a separate admin utility

## Token architecture

The redesign will use a three-layer token model.

### Layer 1: foundation tokens

Raw scales and primitives only.

- `color.neutral.*`
- `color.accent.copper.*`
- `space.*`
- `radius.*`
- `font.family.*`
- `font.size.*`
- `duration.*`
- `ease.*`
- `opacity.*`
- `z.*`

### Layer 2: semantic tokens

The primary implementation layer for this refactor.

- `surface.canvas`
- `surface.stage`
- `surface.rail`
- `surface.overlay`
- `line.subtle`
- `line.frame`
- `text.primary`
- `text.secondary`
- `text.quiet`
- `text.inverse`
- `accent.primary`
- `signal.stable`
- `signal.warn`
- `signal.error`
- `loading.shimmer`

### Layer 3: component alias tokens

Only where exact reuse is needed.

- `nav.link.default`
- `nav.link.active`
- `hero.frame.line`
- `queue.row.rule`
- `poster.frame.shadow`
- `source.metric.value`
- `source.metric.label`
- `player.overlay.scrim`
- `field.line`
- `field.fill-muted`

Component alias tokens should be limited. The token system must not become a second component API.

## Token values

These values are the initial locked direction and may be tuned slightly during implementation, but the relationships must remain intact.

### Color foundation

- `color.neutral.950`: `#0B0909`
- `color.neutral.900`: `#151212`
- `color.neutral.800`: `#1E1817`
- `color.neutral.700`: `#2B211F`
- `color.neutral.600`: `#4A3A34`
- `color.neutral.100`: `#F0E6D9`

- `color.accent.copper.700`: `#7F4E3C`
- `color.accent.copper.600`: `#9E654A`
- `color.accent.copper.500`: `#B37456`

### Semantic color mapping

- `surface.canvas`: `color.neutral.950`
- `surface.stage`: `color.neutral.900`
- `surface.rail`: `color.neutral.700`
- `text.primary`: `color.neutral.100`
- `text.secondary`: rgba warm off-white at reduced opacity
- `text.quiet`: muted uppercase utility text
- `accent.primary`: `color.accent.copper.500`
- `line.subtle`: warm light line at low opacity
- `line.frame`: warm light line slightly stronger than `line.subtle`

### Radius scale

- `radius.0`: `0`
- `radius.xs`: `2px`
- `radius.sm`: `4px`
- `radius.md`: `8px`
- `radius.lg`: `12px`

Rules:

- Everyday utility UI should stop at `8px`
- `12px` is reserved for poster clipping or larger visual surfaces
- No token should enable pill controls

### Spacing scale

- `space.2`: `8px`
- `space.3`: `12px`
- `space.4`: `16px`
- `space.5`: `20px`
- `space.6`: `24px`
- `space.8`: `32px`
- `space.10`: `40px`

Rules:

- Prefer larger vertical spacing between sections to avoid boxed grouping
- Section spacing should do more work than background surfaces

### Motion tokens

- `duration.fast`: `160ms`
- `duration.base`: `220ms`
- `duration.slow`: `320ms`
- `ease.standard`: `cubic-bezier(0.16, 1, 0.3, 1)`

Rules:

- Animate with transform and opacity only
- Avoid buoyant, playful motion
- Hover should feel precise, not inflated

## Typography system

### Display

Use a characterful sans stack for major headings.

Preferred direction:

- `Cabinet Grotesk`, `Geist`, `"Segoe UI"`, `sans-serif`

Use cases:

- Home lead headings
- Player title anchors
- Major browse page anchors

### Title and section

Use a tighter sans hierarchy for section headings and labels.

Use cases:

- Row headings
- Module titles
- Search result section headings

### Utility and diagnostics

Use monospace for technical content.

Use cases:

- Source latency
- Throughput
- Quality labels
- Search streaming progress
- Runtime and timing metadata where machine-like reading helps

### Typography behavior rules

- Lead headlines should be strong, not oversized for effect
- Section labels should stay small and uppercase
- Body copy should remain readable on dark surfaces
- Serif is not part of the A2 direction

## Surface system

### Page surface

The page background is a warm near-black canvas. Most pages should read as open surfaces, not layered card stacks.

### Lead frame

The “hero frame” is a major signature of the system.

Definition:

- Artwork-driven
- Uses an inset rule
- Uses internal safe area for copy
- Does not rely on a rounded card shell
- Does not use glow-heavy chrome

### Rails

Rails are the main grouping pattern for technical or utility content.

Use cases:

- Source metrics
- Continue watching lists
- Search filter bars
- Sidebar navigation

### Rules

Hairline dividers are a primary structural token.

Use cases:

- Between sections
- Between technical rows
- Under headers
- Around frame insets

## Component guidance

### Sidebar

Current problem:

- Glassy bordered surface
- Soft active pills
- Generic icon/nav treatment

Target behavior:

- Reduce background chrome
- Use one vertical structure with rules and text emphasis
- Active state should use weight and a restrained marker, not a bubble

### Mobile header and bottom nav

Current problem:

- Rounded control feeling
- Too much reliance on soft surfaces

Target behavior:

- One thin separating rule
- Plain icon anchors with stronger spacing
- Active state through tone and alignment, not filled capsules

### Home page

Current problem:

- Row after row of similar cards on a pale background
- Weak hierarchy between “continue watching” and category rows

Target behavior:

- A stronger lead section
- Rows sit directly on the page
- Section distinction comes from copy, spacing, and poster rhythm

### Browse pages

Current problem:

- Filter and category controls feel soft and generic
- Content grid is visually detached from the page

Target behavior:

- Filters become line-based or underlined controls
- Grid feels placed on a stage, not inside a frosted container

### Search page

Current problem:

- Search state and filters risk drifting into utility clutter

Target behavior:

- Search input is flatter and more direct
- Streaming state is shown with subtle utility styling
- Filter UI avoids chips and pills

### Player page

Current problem:

- Source switching area reads like a card stack
- Too much shape repetition between player, detail block, and source list

Target behavior:

- Source selection becomes a technical rail with rules
- Diagnostics are aligned, restrained, and monospace-led
- Playback surface is visually integrated with the rest of the system

### Live page

Current problem:

- Risk of feeling like a separate tool

Target behavior:

- Treat live channels like programming rails
- Keep status and EPG information technical but visually consistent

## Explicit rejections

The implementation must avoid these patterns:

- Pill-shaped buttons or tabs
- Rounded box grouping as the default section pattern
- Generic glassmorphism
- Blue accent reintroduction
- Thick shadows as hierarchy
- Decorative gradient text
- Overscaled hover motion
- “Friendly” streaming app chrome that conflicts with the sharper A2 system

## Refactor boundaries

In scope for the redesign refactor:

- Token system creation
- Global color/type/spacing reset
- Navigation restyling
- Home page restyling
- Browse page restyling
- Search page restyling
- Player page restyling
- Live page restyling
- Shared component restyling

Out of scope unless separately planned:

- Functional product redesign
- Search architecture rewrite
- Player engine rewrite
- Data model changes
- New feature design unrelated to the visual system

## Recommended implementation order

1. Create foundation tokens
2. Create semantic tokens
3. Map component aliases only where needed
4. Refactor layout shell and navigation
5. Refactor shared content components such as poster cards and row containers
6. Refactor high-traffic pages: home, browse, search
7. Refactor player and live pages
8. Add state styling for loading, empty, and error views in the new system

## Approval state

This design is locked for planning based on user approval of:

- The `A2` visual direction
- The A2 token-system screen
- The corrected hero-frame spacing demonstration

Next step after user review of this document:

- Write the implementation plan for the refactor
