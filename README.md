# Untitled RPG

A story-driven, menu-based text RPG built with React and Vite. Begin with **When the Stars Faltered**, play Astraea's combat tutorial, create your character, then enter Chapter 1's village life with Garron, Elira, and Rowan.

## Run locally

Use a current Node.js version supported by Vite 8, then run:

```sh
npm ci
npm run dev
```

## Validate and build

```sh
npm run lint
node --test --test-reporter=dot tests/*.test.mjs
npm run build
npm run preview
```

The production build is written to `dist/`. Dependencies and build output are not committed.

## Project notes

- [Completed features through Feature 36](docs/COMPLETED_FEATURES.md)
- [Feature scope and backlog](docs/FEATURE_PLAN.md)
- [Prologue script](docs/story/prologue-v2.md)
- [Feature 36 QA](docs/qa/feature-000036-battle-info.md)
- [Feature 37 Codex journal QA](docs/qa/feature-000037-codex-journal.md)
- [Feature 38 location unlocks QA](docs/qa/feature-000038-location-unlocks.md)

This repository starts with one fresh snapshot of the game through Feature 36. Earlier Git history remains in [the original repository](https://github.com/imhotaruu/untitled-game). Feature 37 adds a Codex journal of first resource discoveries and useful NPC conversation notes. Feature 38 distinguishes hearing about locations from discovering routes and being able to travel there. A draggable, zoomable Story timeline remains a later feature.

Saves and preferences live in browser storage, not Git. Continuing on the same browser origin preserves them; changing the site's origin does not transfer browser storage automatically. Portraits are CSS placeholders while artwork and audio are pending.
