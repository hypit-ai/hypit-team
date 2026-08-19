<p align="center">
  <img src="public/logo-mark.svg" width="72" alt="Hypit AI" />
</p>

<h1 align="center">Hypit Team</h1>

<p align="center">
  An interactive team site for Hypit AI — the people building Narratage.
</p>

## About

This repository contains Hypit AI's team experience and the story behind Narratage, a source-first video programming language and compilation system for AI agents.

The site uses a persistent Three.js world to connect the opening sequence, product narrative, field notes, and team profiles. GSAP and Lenis synchronize the WebGL scene with scroll position and pointer input, while all essential content remains available as semantic HTML.

## Highlights

- Scroll-driven Three.js scenes with responsive quality tiers
- GSAP choreography and Lenis smooth scrolling
- English and Simplified Chinese localization
- Reduced-motion and non-WebGL fallbacks
- Responsive layouts from mobile to large desktop screens
- Dynamic Open Graph artwork and localized metadata

## Routes

| Route | Description |
| --- | --- |
| `/` | Main Hypit AI team experience |
| `/team` | Team index |
| `/manifesto` | Narratage manifesto |

## Tech stack

- Next.js 16, React 19, and TypeScript
- Three.js, React Three Fiber, and Drei
- GSAP, Lenis, and Motion
- Tailwind CSS 4
- Bun

## Getting started

[Bun](https://bun.sh/) 1.3 or newer is required.

```bash
git clone git@github.com:hypit-ai/hypit-team.git
cd hypit-team
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start the development server |
| `bun run lint` | Run ESLint |
| `bun x tsc --noEmit` | Run TypeScript checks |
| `bun run build` | Create a production build |
| `bun run start` | Start the production server |

## Project structure

```text
app/                    Routes, metadata, and global styles
components/experience/  Team experience and persistent Three.js world
components/sections/    Narratage editorial sections
components/three/       Reusable WebGL scenes and materials
components/ui/          Shared interface components
hooks/                  Locale, media-query, and scroll hooks
lib/data/               Localized product and team content
lib/experience/         Shared 3D world state
public/                 Brand and presentation assets
```

## Content and assets

Localized copy lives in `lib/data/`. The current team experience is defined in `lib/data/experience.ts`. Team photography is delivered through the Hypit AI CDN configured in `next.config.ts`.

> [!NOTE]
> WebGL is a progressive visual layer. Headings, descriptions, navigation, and team information remain in the DOM, and motion-heavy sequences provide reduced-motion behavior.
