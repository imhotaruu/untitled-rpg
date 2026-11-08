# Feature 39 — Story timeline

Branch: `codex/feature-000039-story-timeline`, based on accepted Feature 38 (`668f32f`).
Status: the user accepted the final presentation on 2026-11-08 and authorized commit/push.

## Scope and behavior

- Story now displays a horizontal timeline with Prologue and Chapter 1 · Act 1 groups, selectable recaps, and a Current chapter marker on the timeline. The redundant top-right You are here block was removed at the user's request. The opening label is The Beginning.
- Ten authored moments cover the prologue replay entry, chapter opening, Garron's first lesson, Elira's first visit, meeting Rowan, visiting Forest Edge, discovering Forest Trail, Basic Guard, Rowan's wood favor, and finishing the crafting lesson. Unrevealed moments have no placeholders or completion totals.
- Moments use authored story order, rather than claiming exact historical dates or action chronology. Elira's visit and training remain optional branches of village life; their placement does not add gameplay gates.
- Conversation recaps stay hidden until their relevant passage finishes, including after save/load. A hint about Forest Trail does not reveal its discovery recap. A completed sword craft does not reveal the lesson's final recap until the turn-in conversation finishes.
- Prologue replay remains available in adventure saves, including skipped-prologue and older saves, without a watched/completed claim. Existing replay isolation remains intact.
- Mouse/pen dragging pans the timeline. Touch uses native scrolling. Zoom buttons range from 75% to 150%; Reset view returns to 100% and the chapter opening. Previous/Next and Left/Right/Home/End provide alternatives to dragging. Browser zoom remains available.
- Back to Main, Log, Settings, and save controls remain on the shared toolbar. The right recap panel spans the Story page from the top, alongside the heading and map. Narrow screens stack the recap below the map. Recap fades respect reduced motion.
- The timeline is read-only and derives visibility from existing actions, conversation notes, story events, visits, route flags, and progress rules. Save schema stays at 18. Capped logs and journal read flags do not affect it. Loading another slot remounts the timeline so selection/zoom do not leak across saves.
- No new story events, rewards, achievements, chapter gates, NPC-scene replay, or dependencies.

## Manual QA — user-owned

The user confirmed they will handle manual browser checks and accepted the final visual result after requesting capitalization, removal of the redundant top-right chapter block, and extending the recap to the top. Individual checks below were not separately reported; unchecked boxes do not override overall acceptance. Use a separate test save without overwriting a save you want to keep.

- [ ] Open Story at the start of Chapter 1. Only Prologue and A Place to Begin appear. The opening recap is selected and the current chapter is visible.
- [ ] Select Prologue and replay it. Exit Replay and confirm the real character, inventory, quests, and story progress are unchanged. A skipped prologue is never labelled completed.
- [ ] Finish Garron's first lesson, visit Elira, and meet Rowan. Reopen Story after each conversation and confirm the corresponding recap appears once. Save/load during a conversation and confirm the recap appears only after finishing it.
- [ ] After Rowan's hint, Forest Trail's discovery recap is absent. Explore Forest Edge three times, resolve any encounter, and confirm the discovered trail appears. First visiting Forest Edge has its own recap.
- [ ] Learn Basic Guard and complete Rowan's favor and crafting lesson. Recaps appear after the corresponding dialogue. Crafting the sword alone does not show the finished-lesson recap.
- [ ] Drag from empty map space and from a moment card. Dragging should pan without selecting another moment; clicking should select it. Release outside the map and confirm dragging stops.
- [ ] Zoom out to 75% and in to 150%. The selected moment remains visible, endpoint buttons disable, and Reset view returns to the chapter opening at 100%. At 75%, no oversized empty scrolling region remains beyond the timeline.
- [ ] Use Tab to focus moments, Left/Right to browse, and Home/End to reach the ends. Previous/Next also work. The selected card and recap agree, and focused controls remain visible.
- [ ] Check desktop and narrow widths: cards, chapter labels, controls, and recaps remain readable. At narrow widths, scroll the page to the recap. Native touch scrolling and browser zoom remain usable.
- [ ] Enable reduced motion. Recaps change directly, with no fade. Other timeline controls still work.
- [ ] Load an older adventure with established progress, then a fresh slot while Story is open. Each shows its own known moments and starts with the chapter opening at 100%. Browsing grants no items or rewards and adds no gameplay log entries.

## Validation

- Automated Node suite: all 197 tests pass (189 existing + 8 timeline tests).
- ESLint, production build, and `git diff --check` pass.
- Server-rendered markup checks pass for fresh/hidden moments, pending and completed dialogue, older-save progress, reduced-motion attributes, and prologue states. These do not replace manual layout or input checks.
- New coverage follows real action/conversation/quest flows, pending-save migration, Basic Guard dialogue, hint versus discovery, older-save recovery, reading without state changes, authored ordering, skipped prologue, and independent save slots.
- Browser automation could not reach the isolated preview; native browser access timed out awaiting approval. No visual or interaction check is claimed from that attempt. The user subsequently confirmed manual browser QA is theirs.

## Follow-up

After acceptance and the authorized commit/push, pause before Feature 40. Prepare the current story for copying into Google Docs, then wait for the user's writing/revision pass before scoping further gameplay work.
