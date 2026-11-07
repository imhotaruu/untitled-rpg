# Completed features through Feature 36

Snapshot date: 2026-11-08 (Asia/Manila). This is the starting point for the new public `imhotaruu/untitled-rpg` repository. It contains the current game in one fresh commit, without importing the old Git ancestry.

Earlier history remains in [imhotaruu/untitled-game](https://github.com/imhotaruu/untitled-game). The final Feature 36 commit there is [`832e9c4`](https://github.com/imhotaruu/untitled-game/commit/832e9c4f62b73ab27a9383aa1da0de7a2633289a). Historical hashes and branch names in the other documents belong to that repository.

## Foundation carried into Feature 24

The available Git history contains an initial baseline rather than separate commits or QA records for Features 1–23. Their exact individual titles are not reconstructed here. The inherited foundation includes:

- React/Vite app, reusable panels, and a dark interface.
- Main and Character screens; player profile, combat stats, and upgrades.
- Area travel, area-specific actions, discovery, unlocks, and progress rules.
- Health, mana, stamina, resources, equipment bonuses, consumable use, and inventory.
- Resting/recovery, basic training, story events, and action/story logs.
- Multiple browser save slots, loading/reset, and migration of older save data.

## Feature record

| Feature | Completed work |
| --- | --- |
| 24 — Item feedback and inventory | Bottom-center item feedback, including no-effect/no-consumption messages; categorized inventory grids; character silhouette beside inventory; interactive head, chest, arms, and legs equipment slots. |
| [25 — Training armor](qa/feature-000025-training-armor.md) | Earn Garron's four-piece armor set after training progress; equip/unequip through inventory or body slots; correct bonuses and once-only rewards. |
| [26 — Character readability](qa/feature-000026-character-ui-readability.md) | Clearer Overview, Combat, Upgrades, and Items presentation; simple overview stat values and visible profile details; upgrade flavor text. |
| [27 — Main-page readability](qa/feature-000027-main-page-readability.md) | Refined locations, compact action buttons with hover/focus explanations, story alongside actions, action history below, and snug Jump to latest controls that do not shift log layout. |
| [28 — Turn-based combat](qa/feature-000028-turn-based-combat.md) | Confirmed entry to a separate Garron spar screen, separate practice vitals, physical attacks/guard/recovery, command categories, party portrait placeholders, sequential combat messages and hit reactions. Action outlines distinguish battle, rest, story, and ordinary actions. |
| [29 — Pacing and motion](qa/feature-000029-combat-settings.md) | Slow (5–6 seconds), Normal (3–4 seconds), and Fast (2 seconds) battle-message pacing; Full/Reduced motion; persistent preferences separate from save slots. |
| [30 — Upgrades and gathering mastery](qa/feature-000030-upgrade-progression.md) | Training Sword naming, Wood gathering, multi-resource upgrades, purchase notifications, Herb/Wood mastery XP and bars, first-gather unlock/story milestone, escalating level thresholds, fixed yield bonuses, and critical harvests. |
| [31 — Village relationships](qa/feature-000031-village-relationships.md) | Full-width relationship chart, portrait selection, centered connecting arrows, recorded shared moments, Garron/Elira family connections, Rowan's introduction and wood favor, and Back to Main navigation. |
| [32 — Exploration encounters](qa/feature-000032-exploration-encounters.md) | Common/rare forest encounters with choices, rewards, cooldowns, persistence, and durable milestones; location ordering and alignment refinements. |
| [33 — Crafting introduction and quests](qa/feature-000033-crafting-introduction.md) | Rowan's A Shape of Your Own quest, separate Crafting/Quests pages, a once-only Handmade Training Sword recipe and turn-in reward, story-action confirmation preference, and removal of placeholder Continue Story actions. |
| [34 — Playable prologue](qa/feature-000034-prologue-integration.md) | When the Stars Faltered narration, Astraea's six-step combat/magic tutorial, sealing story, birth/name/gender selection, Chapter 1 transition, replay/skip support, typewriter dialogue, named speaker placeholders, Log, and independent text speed. |
| [35 — Chapter 1 conversations and battle presentation](qa/feature-000035-chapter-one-conversations.md) | Garron/Elira/Rowan conversations with once-only rewards and saved progress; fade transitions and progressive tab reveals; prologue-specific save labels; condensed passages; Starward Slash; fullscreen-style battle layout, intent tooltips, compact tutorial guidance, turn-responsive portrait dock, options drawer, and dramatic Reach the Seal transition. |
| [36 — Battle Info and personal profiles](qa/feature-000036-battle-info.md) | Shared enemy/party Info inspector; portrait-click personal profiles with larger placeholder art, name/leader role, actual battle vitals/stats/effects; no redundant portrait Details badge; read-only inspection between turns. |

## Current playable scope

The opening follows Click to Begin → prologue title → story → divine combat tutorial → story → character creation → Chapter 1. Village life includes family training/healing, gathering, upgrades, equipment, Rowan's introduction and crafting lesson, and exploration encounters.

The current combat system has one playable member at a time. Astraea is temporary tutorial control, with no divine stats or inventory carried into village life. Party layouts and inspectors can display supplied future members, but recruitment and multi-member turns are not implemented. Practice combat does not grant lasting injuries or rewards.

Relationships records known people and shared history; it is not yet an affinity-point or romance system. Party and Codex navigation stay hidden pending implementation. Codex milestone metadata exists, but there is no completed Codex page. Crafting currently has one introductory equipment recipe. Extra chapters, enemies, recipes, resources, artwork, and sound remain future work.

## Validation at the snapshot

- Production build: passed (`npm run build`).
- ESLint: passed (`npm run lint`).
- Automated Node suite: 158 tests passed.
- Feature 36's visual result was accepted by the user. Historical QA documents distinguish user-confirmed checks from outstanding individual manual checks; their unchecked boxes are not implied to have passed.
- Save schema remains version 16; the repository move changes no game logic or storage keys.

## Next

Feature 37's gameplay scope has not been selected. Keep the next feature focused on one agreed outcome; repository migration is preparation for that work.
