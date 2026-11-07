# Feature 35 — Chapter 1 NPC conversations and battle presentation

Branch: `codex/feature-000035-chapter-one-conversations`

## Scope

Adapt existing interactions with Garron, Elira, and Rowan to the shared dialogue screen. Scripts live in `src/data/conversations.js`; player lines resolve to the chosen name. Placeholders use the existing CSS bust silhouettes. Text speed, rapid clicks, keyboard advancement, Settings, and Log work as in the prologue.

Garron speaks during initial training, first practice, the Basic Guard milestone, and the armor handover. Ordinary practice does not repeatedly open a conversation. Elira responds to the first visit and subsequent healing/healthy visits through the existing `visit_healer` action (now labelled Visit Elira). Rowan's introduction, six-wood favor, crafting lesson acceptance, and quest completion use the same existing progression.

Actions retain their costs and rewards: training spends 1 stamina and grants one training sword; practice spends 1 stamina and grants one training point; Elira restores at most 2 HP; Rowan's favor spends 6 Wood and grants 5 Gold; accepting crafting grants 1 Cloth; completing crafting grants 5 Gold. No new relationship rewards, quests, lore revelations, or audio are added.

## State and saves

`performConversationAction` invokes the existing action engine once, then opens dialogue only if the action succeeded. Resources, equipment rewards, flags, and progression are already settled; finishing reading only releases the pending story recaps and clears the conversation. Invalid actions keep their existing feedback and do not open dialogue.

Save version 16 stores the pending action, area, unique action-count token, script IDs, and deferred story entries. Save/load resumes at the conversation's first line; it does not execute the action again. Invalid/conflicting pending states are discarded during migration. Older saves acquire no pending dialogue automatically. Read lines in Log remain session-only, as in Feature 34; the main story recap is saved after completion.

During dialogue, the game replaces the adventure controls with the conversation screen. Travel, actions, crafting, equipment changes, item use, upgrades, combat, and passive recovery are also blocked in the engine. Log or another modal pauses typing. Quest/relationship popup timers start after the conversation ends; saving/loading may dismiss those transient popups, with actual rewards retained in the save and action log.

## Manual QA

- [ ] From a fresh Chapter 1 character at Stonefield House, choose Train with Garron. Check his father role, dialogue, and player name. Finish; verify one training sword, 1 stamina spent, and Practice unlocked.
- [ ] Practice once: a short conversation. Practice 2–4: normal actions. Fifth practice: Basic Guard conversation. Sixth practice: normal action. Rest as needed.
- [ ] Collect Training Armor: check Garron's handover, all four items, and no second claim. Keyboard focus should return to the area heading when a one-time action disappears.
- [ ] Visit Elira at Healer's Hut at full health: first-visit greeting and healthy response. Visit while injured: care dialogue and at most 2 HP restored. Repeat visits omit the introductory greeting.
- [ ] Meet Rowan after training; read their introduction. Try the wood favor with fewer than 6 Wood: no dialogue or spending. With enough wood: conversation, exactly 6 Wood spent and 5 Gold received.
- [ ] Accept Rowan's crafting lesson (with the existing story confirmation enabled). Cancel first: no cost, reward, or conversation. Accept: conversation, 1 Cloth, Crafting/quest unlocked. Check confirmation-off behavior too.
- [ ] Craft the sword at Rowan's bench and Show Your Work. Read the completion conversation; receive 5 Gold once, retain the sword, and see the quest completed. Quest feedback should appear after reading ends.
- [ ] Try Slow, Normal, Fast, and Instant text, rapid clicks, Enter/Space, and clicking outside the text panel. Names and narration stay in sentence case. Player dialogue uses the chosen name; narration has no portrait.
- [ ] Open Log during typing: it pauses, shows only revealed dialogue lines, and closes without advancing. Finish the conversation: the main Story panel gets its recap; Log does not repeat that recap over the named lines. Other triggered milestones still appear.
- [ ] Open Settings/Save/Load during dialogue. Save and reload a training, healer, wood-favor, and crafting conversation: resume the first line, preserving rewards and costs once. Closing the final line twice must not duplicate a reward.
- [ ] While speaking, no adventure sidebar, resource display, or action buttons should compete with the dialogue. Check desktop, narrow mobile, and short viewports for nameplate/portrait/long-text clipping. The screen must scroll when needed.
- [ ] Load a Feature 34 adventure save: keep all items, crafting, relationships, and story progress. Previously completed introductions remain completed. Prologue/replay and Garron's normal spar still work.

## Validation

User-requested birth presentation refinement:

- [ ] Finish the birth narration: a brief fade removes it, then the centered name/gender form appears alone. The old narration rectangle must not remain above the form.
- [ ] Try rapid clicks during the fade: no duplicate form or unintended submission. Name receives focus when the form appears. Log retains the birth line.
- [ ] Open Settings or Log during the fade: the transition pauses without moving focus behind the modal. Reduced motion switches directly to the form.
- [ ] Enter name/gender and proceed: Chapter 1's separate title card still follows. Save/load retains the draft; the saved birth passage still restarts at its narration, as before.
- [ ] Hover over or focus the prologue/chapter title: no large border surrounds the title content. Keyboard focus highlights/underlines the continuation arrow; Enter and Space still advance. Click to Begin retains its compact focus cue.

Approved chapter transition and tab-unlock checks:

- [ ] Submit a valid name/gender: the form fades out before Chapter 1's title appears. Rapid submissions cannot duplicate or skip chapter entry. Blank names stay on the form with validation.
- [ ] Finish chapter narration: it fades out and the main UI fades in. Reduced motion makes both transitions immediate. Saving/loading or opening Settings/Log during an exit does not cause a stale callback or duplicate completion.
- [ ] At Chapter 1's start, only Main, Character, and Story appear. Party and Codex no longer show Soon placeholders.
- [ ] Train with Garron or visit Elira: Relationships appears with a short entrance after the conversation. Change pages and return: it does not animate again.
- [ ] Meet Rowan: Quests stays hidden. Finish the wood favor: Quests appears when the lesson becomes available. Accept the lesson: Crafting appears. Each new tab animates once; reduced motion displays it directly.
- [ ] Load an older advanced save: previously earned tabs are present without unlock animations. Load a fresh save while on Relationships/Quests/Crafting: return to Main if that page is locked. Reset restores the initial tab set.

- All 153 automated tests passed, including 12 conversation tests and six navigation progression/save-compatibility tests.
- Twelve focused conversation tests cover unchanged action outcomes, once-only effects, practice milestone triggers, Elira's responses, the Rowan quest chain, invalid actions, gameplay blocking, save/load, legacy saves, malformed pending data, and story ordering/caps.
- ESLint, production build, and diff whitespace checks passed. Server-render checks passed for all 11 conversation passages, named NPC/player portrait placeholders, narration without a portrait, paused reader input, Log/options, and hidden future lines.
- Browser visual/interaction QA is left for the user's manual review; render checks are not browser interaction tests.
- After the birth refinement, all 147 tests, lint, and build passed again. Render checks confirm the birth narration initially excludes the form and the standalone form retains name/gender values.
- After chapter transitions and progressive navigation, all 153 tests, lint, build, and diff checks passed. Render checks cover initial/earned tabs, new-tab animation state, reduced motion, disabled name/gender controls during exit, and the retained separate chapter title.
- User accepted the final battle layout and authorized commit/push on 2026-11-08. Remaining unchecked items are the detailed manual QA reference, not a claim that every scenario was manually tested.

Approved battle presentation, pacing, and party-card polish:

- [ ] Prologue and Chapter 1 narration have no visible Narration heading. Battle narration keeps the dark angled box without the cream nameplate. Named speakers retain readable dark lettering on cream nameplates and colored portrait accents; Log still identifies speakers.
- [ ] At desktop width, the enemy is centered across the battlefield, with compact tutorial/action-update panels at the sides. On narrow screens they stack without covering the enemy. Opening and turn messages appear in the upper-right action panel, replacing the old intent box and horizontal strip. The battlefield background and border continue behind the commands, party, and move details all the way to the bottom. Commands are slightly inset on the left. Check that dialogue still dims only the underlying scene, leaving its text readable, and that Details/Battle Log/Reach the Seal dialogs still open above the shared battlefield.
- [ ] The physical command and tutorial instruction say Starward Slash; Starwake remains the weapon in the story. Tutorial helpers show the objective only; move effects appear in the command description and costs on buttons. Hovering does not produce a duplicate browser tooltip.
- [ ] During a player action the party card is raised; during the enemy response it lowers until the bottom of the portrait sits just above the dock edge, then rises for the next player turn. Only the stats disappear while waiting; the full name, turn label, and portrait remain visible. Check both the player (HP/ST) and Astraea (HP/ST/MP), including a long player name and resizing the window. No extra blank space or scrollbar should appear from the lowering animation. Check short/narrow screens: the party sits below commands/details, with active cards fully visible. Keyboard focus on an enabled portrait reveals the card for inspection. Reduced motion changes position without sliding. Battle-end cards return to the neutral raised position.
- [ ] Finish all six lessons and the finisher dialogue: only then does the centered seal panel appear. Check its dim backdrop, entrance, keyboard focus, and Reach the Seal fade. Rapid clicks advance once; reduced motion skips animation. Load a save at the completed tutorial to check the same transition.
- [ ] Read the opening, battle narration, seal, and blessing passages. Related sentences now share short paragraphs. Order and Chaos, the Divine Authorities, Starwake's reveal, and the final blessing still have standalone beats. Click-to-reveal, fast advancement, text settings, and Log remain functional.
- The revised script has 218 story passages plus 38 tutorial passages (formerly 291 + 59). A source comparison verified unchanged prose and scene IDs; the longest paragraph is 46 words.
- All 153 engine tests passed, along with lint and build. Server-render checks cover narration/nameplates, one/four/six-member party layouts and waiting states, player/enemy playback turns, all six helper states, and the seal dialog appearing only after final dialogue. Browser animation, layout, focus, and clicking remain for manual QA.

Prologue save-label refinement:

- [ ] Reset the current game and save during the prologue or tutorial battle. Save, Load, and Reset slot cards show Astraea · Level ??? / The Veil / Prologue / Day ???, plus the real save timestamp.
- [ ] Existing prologue slots receive the same labels without resaving. Load one and finish character creation/chapter entry; a subsequent Chapter 1 save shows the chosen name, real level, location, and day.
- Labels are derived from the saved narrative phase; the underlying protagonist data is preserved. Empty slots stay empty.
- All 153 tests, lint, and build passed. Expanded save round-trip assertions cover fresh journeys, all tutorial steps/dialogue, birth drafts, chapter entry, and empty slots. Server-render checks passed for the Save, Load, and Reset modals with prologue and Chapter 1 saves.

Annotated-layout follow-up:

- [ ] The battlefield expands toward both page edges; commands sit far left, move descriptions far right, and enemy/party remain centered. Check narrow screens for stacked content and no horizontal scroll.
- [ ] Latest action updates appear only once in the upper-right panel, including damage and enemy turns. Battle Log retains full history.
- [ ] Hover/focus/tap the gold intent icon beside the enemy: show the next-move hint. Move away (when not focused), press Escape, or tap elsewhere to close. The hint remains hoverable and is hidden during turn playback and dialogue.
- [ ] After Astral Ward, a separate Evasive buff icon appears. It remains through Guiding Star, then disappears after the guided strike. No invented effects appear during normal sparring; its intent icon shows Garron's actual next move.
- Build, lint, 35 prologue/combat tests, and focused server-render checks passed. Render checks cover all six lesson states, separate intent/buff indicators, action-message placement, normal sparring, and playback/dialogue/battle-end states. Tooltip interaction and visual layout still need manual browser review.

Full-window combat and options panel:

- [ ] Combat fills the browser content area, without the visible location/title header, outer margin, or rounded outer border. The enemy, command area, and party remain visible; short/narrow windows can scroll when necessary. Check that the gear never covers Details/Battle Log or the turn banner.
- [ ] Open the upper-right gear by mouse or keyboard: options slide in from the right and focus moves inside the panel. Escape, Close, and backdrop click dismiss it and return focus. Reduced motion opens directly.
- [ ] Open options mid-dialogue: typing pauses and battlefield clicks cannot advance it. Close to resume. During combat playback the gear stays disabled.
- [ ] Choose Log, Settings, Save, Load, Reset, or Skip Prologue: the options panel closes before the destination opens. Cancel/close each destination without advancing dialogue. The Log retains its existing session history; normal NPC conversation Log buttons still work.
- [ ] Replay offers Log, Settings, and Exit Replay, with no Save/Load/Reset/Skip actions. Normal sparring offers no Skip Prologue.
- All 153 tests, lint, and production build passed. Server-render checks cover the removed visible combat header, gear/options structure, tutorial dialogue, replay/spar restrictions, reduced-motion attributes, and retained standalone Log buttons. Panel animation, focus, backdrop dismissal, and viewport fit await manual browser QA.

## Acceptance

On 2026-11-08, the user accepted the full-window battle presentation after screenshot-based iteration and requested committing/pushing Feature 35. Further battle ideas and polish are deferred. The latest validation includes all 153 automated tests, ESLint, a production build, and diff whitespace checks; interaction-specific manual checks remain documented above.
