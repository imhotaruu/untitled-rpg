# Feature focus

Updated 2026-11-08. Keep upcoming work focused as requested by the user.

Historical commit hashes and branch references below refer to [the original repository](https://github.com/imhotaruu/untitled-game), which retains development history through Feature 36 (`832e9c4`).

## Working agreement

- Define one clear outcome and a short scope before implementing each feature.
- Keep implementation and QA tied to that scope. Include fixes needed to complete it.
- Record unrelated ideas in the backlog instead of silently adding them to the active feature.
- If the user requests a scope change, make its effect on the current feature clear.
- Finish manual review and the authorized commit/push before starting the next feature.

## Completed

- Feature 31: village relationship chart, family connections, Rowan introduction, and secondary-page navigation.
- Feature 32: exploration encounters, common/rare choices, rewards, persistence, and location-list refinements. Committed and pushed as `f27b6ad`.

## Completed: Feature 33 — Crafting introduction and quest tracking

The user authorized implementation on 2026-11-07. Introduce crafting through a small quest from Rowan, with separate Crafting and Quests tabs using Back to Main navigation.

Scope:

- One introductory crafting quest.
- One starter recipe using existing materials.
- A Quests tab showing the active objective and completed quest.
- Safe material spending, once-only quest rewards, and save/load support.

Implementation: after the existing wood-delivery favor, Rowan offers **A Shape of Your Own** and supplies 1 Cloth. Craft a Handmade Training Sword at Village Square using 4 Wood and 1 Cloth, then show it to Rowan for 5 Gold. Keep and equip the sword (+2 Attack Power, +1 Guard Power). This recipe is a once-only equipment craft. Quests tracks Available, Active/ready, and Completed states. Save version 13 preserves the lesson and recipe progress.

Status: accepted by the user and committed/pushed as `a56dbb3`. See `docs/qa/feature-000033-crafting-introduction.md`.

User-requested scope addition on 2026-11-07: keep the lesson, recipe, and quest reward one-time. Add a default-on Settings preference to confirm gold-outlined story actions before performing them. Cancel leaves the action unperformed; regular actions and crafting do not prompt, and battle retains its own confirmation.

Remove the placeholder Continue Story action at the user's request. Story progression continues through the named interactions and gameplay events; none depend on that placeholder.

## Completed: Feature 34 — Prologue integration

Connect the prologue coherently to the current opening story and transition into the first chapter. Review the existing prologue files and current story progression before implementation, then address the continuity and transition changes needed for that connection. Preserve existing saves and progress.

The user proposes Chapter 1 Act 1 for the opening, with later progression advancing acts and chapters; a chapters-only structure is also under consideration. Naming is not finalized. Further crafting and quest expansion stays outside this feature.

The user supplied Prologue V2, **When the Stars Faltered**, and approved replacing its complementary-Order/Chaos paragraph: possibility and change belong to creation; Chaos threatens to unravel it. The six-scene script now establishes Astraea as Goddess of Stars, her blade Starwake, and Morveth, Aurelion, and Elaris. Player-facing source: `docs/story/prologue-v2.md`. Author-only future revelations are excluded from game content.

The temporary Astraea battle is a controlled tutorial: basic strike, Astral Ward, Guiding Star, guided strike, Starlight Mend, and Celestial Severance. Spells spend tutorial mana and apply mitigation, guided-strike, healing, and finishing effects. Shared combat playback handles short exchanges; full scene dialogue waits for manual advancement. This replaces the V1 Call for Aid encounter, not the normal Garron spar. Skip routes to birth/character creation. A name and gender form leads into the existing growing-up bridge and Chapter 1 at home. No divine stats or items carry into the adventure. No generated art, external audio, dependencies, or later magic progression added.

Save version 15 stores the V2 scene, tutorial phase, reading state, mana, and character-creation draft. V1 scene IDs migrate to corresponding V2 scenes; incompatible V1 battles restart at the tutorial introduction. Existing adventure saves stay in the adventure. Story replay stays isolated from the real character, including birth choices. Chapter 1 / Act 1 is working metadata; no later chapter gates are invented. Manual QA: `docs/qa/feature-000034-prologue-integration.md`. The user accepted this feature and authorized commit/push on 2026-11-07.

User-requested presentation update: one line at a time with typewriter reveal and a bouncing continuation arrow. Click the story area/arrow or use Enter/Space to reveal, then advance. Both the prologue and tutorial dialogue use it. Settings has independent Slow/Normal/Fast/Instant text speed; reduced motion keeps the arrow stationary. Rapid clicks are accepted without a cooldown. Modal dialogs pause the reader. Sounds will be supplied later. Saves resume the current passage from its first line, not its transient animation position.

Opening presentation now follows the user's reference: pulsing **Click to Begin** → separate **Prologue: When the Stars Faltered** title card → story → combat tutorial → story → character creation → Chapter 1. Story prose explicitly overrides the global uppercase button style. Visible scene headings/numbers, helper instructions, and Next Line labels are removed; speaker labels and the arrow remain. Order/Chaos receive the reference's gold/crimson emphasis. Settings/Save/Load are tucked under Options. The growing-up bridge is now the opening of Chapter 1 immediately after creation; older `years` cursors migrate to that chapter card. Reduced motion disables the opening pulse and title/arrow animations.

Battle conversations now use a bottom-screen angular dialogue panel over the existing battlefield, following the user's RPG reference. Named speakers receive CSS silhouette/initial portrait placeholders and a nameplate; narration/tutorial text omits the portrait. The shared typewriter, keyboard, and arrow behavior stays intact. The battlefield remains visible but its controls are inert/hidden from assistive technology until conversation ends; focus returns to combat afterward. No generated artwork or new assets added.

The user's second dialogue reference refines the placeholder to a larger unframed bust at left, a wide low dark panel with thin pale slanted edges, and a slim pale speaker tab above it. Smaller screens use a scaled portrait beside the text. This is a CSS presentation change; dialogue behavior and gameplay remain the same.

Feature 34 presentation refinements: Chapter 1 · Act 1 / A Place to Begin appears on a standalone title card before chapter narration. Tutorial objectives and spell definitions appear in a separate helper window. The shared Log is available throughout the game, records revealed narrative/speaker lines plus adventure story entries, and stays separate from battle damage messages. It preserves session history across passages; loading resets that history and imports saved adventure story entries.

## Completed: Feature 35 — Chapter 1 NPC conversations and battle presentation

Feature 34 was committed and pushed as `c1d744d` on `codex/feature-000034-prologue-integration`. The user selected Chapter 1 NPC conversations as Feature 35 on 2026-11-07. Working branch: `codex/feature-000035-chapter-one-conversations`.

Outcome: bring Garron, Elira, and Rowan's existing interactions into the shared dialogue presentation, with named NPC/player lines, portrait placeholders, text speed, rapid advancement, and Log. Keep their current costs, rewards, and progression. New dialogue is an editable adaptation of established scenes; no new chapters, quests, relationship ranks, or audio.

- Garron: initial training, first practice, Basic Guard milestone, and armor handover. Routine practice stays uninterrupted.
- Elira: first visit and short healing/healthy responses. The existing Visit Healer action is labelled Visit Elira; healing remains up to 2 HP.
- Rowan: introduction, wood favor, crafting lesson acceptance, and quest completion.
- Successful actions settle once before opening their conversation. Story recaps wait until it ends; Log records revealed named lines and avoids repeating the recap. Unaffordable/unavailable actions do not open dialogue.
- Save version 16 stores a pending conversation. Loading resumes its first line without replaying rewards. Gameplay mutations and recovery wait for the conversation to finish. Older adventures do not replay already-completed introductions.

Manual QA and validation: `docs/qa/feature-000035-chapter-one-conversations.md`. The user approved the final battle layout and authorized committing/pushing Feature 35 on 2026-11-08. Feature 35 was committed and pushed as `7a46d60`. Its next focused follow-up is Feature 36, described below.

User-requested presentation addition: after the birth narration, fade it out briefly and show name/gender selection on its own centered screen. Reduced motion switches directly. Modal/Log opening pauses the transition; completed narration no longer retains the generic button hover border. This refines the existing birth flow without changing character data or chapter progression.

Presentation preference confirmed by the user: keep prologue/chapter title cards free of large hover/focus outlines, using the continuation arrow as the keyboard focus cue. Use the approved brief fade-out/fade-in style for future dialogue scene transitions, with direct transitions under reduced motion and rapid manual advancement preserved. This is the default for future scene work, not a request to delay every dialogue line.

Further approved presentation changes: submitting a valid name/gender fades the form out before the existing Chapter 1 title. Finishing its narration fades out, then the main screen fades in. Inputs cannot resubmit while exiting; modals pause exits, reduced motion bypasses them, and load/reset cancels old transition callbacks.

Approved top-bar progression: Main, Character, and Story are visible at the chapter start. Relationships appears after training with Garron or visiting Elira (existing Rowan/family progress also qualifies in older saves). Quests appears when Rowan's crafting lesson becomes available after the wood favor; Crafting appears when the lesson is accepted. Party/Codex placeholders remain hidden. New tabs receive a short fade/slide with gold emphasis when first displayed after the conversation. Page changes do not replay it, and loading existing progress does not treat known tabs as newly unlocked. Access is derived from existing progress rather than new save flags.

Approved final Feature 35 polish: hide visible narration labels/nameplates while retaining named speakers and Log attribution; use dark text on cream battle nameplates. Center enemies independently of compact tutorial/action-update side panels, place the latest action in the upper-right panel, and keep move effects/costs in the command UI. The physical move is Starward Slash; Starwake remains the weapon. After the final tutorial dialogue, an animated Reach the Seal modal leads into the sealing scene. Waiting party cards lower beneath a clipped bottom dock edge just far enough to hide their stats; the full name, turn label, and portrait remain visible. The distance is measured per card to support wrapped names and different meter counts, without reserved space below. The acting member rises to reveal the whole card. Reduced motion changes positions directly. The party stays at the bottom on narrow screens too. Curated paragraph grouping reduces story/tutorial passages from 350 to 256 while retaining prose, speaker order, dramatic pauses, and saved scene IDs. The battlefield background and outer border now extend continuously behind the message strip, commands, party, and move details. Commands sit slightly farther left than the upper content; party cards rise from the same scene's bottom edge. The user accepted the final visual presentation on 2026-11-08.

## Completed: Feature 36 — Battle Info

Working branch: `codex/feature-000036-battle-info`, based on Feature 35 (`7a46d60`). The user requested replacing the redundant top-right Details action with a unified enemy/party inspector.

- Top-right Info opens on the enemy. Clicking a party portrait opens a dedicated personal profile with larger CSS silhouette art, name, Party Member/Leader role, current vitals, stats, and effects. The portrait Details badge is removed; a hover/focus highlight indicates inspection. The top-right Info panel remains the shared roster overview. The inspector includes an enemy/party selector, real combat vitals, combat stats, physical hit chance, active effects, and current enemy intent.
- Use combat snapshots, including Astraea's tutorial vitals, rather than adventure values. Omit unsupported resource bars. Tutorial hits remain labelled guaranteed; regular spar hit chances use the existing calculation. Evasive and Guiding Star appear only while active.
- Inspection is read-only and available between turns. Native dialog focus/Escape behavior and Battle Log remain intact. The roster can render supplied party members; this feature does not implement additional playable party members, affinities, weaknesses, scan abilities, or new combat mechanics.
- The user accepted the visual result and authorized commit/push on 2026-11-08. Build, lint, and all 158 automated tests pass. QA: `docs/qa/feature-000036-battle-info.md`.

## Completed: Feature 37 — Codex journal

Working branch: `codex/feature-000037-codex-journal`, based on the fresh `imhotaruu/untitled-rpg` main snapshot (`198a982`). The user selected a journal that remembers discoveries and useful NPC conversation hints. Achievements are a separate possible system, not this page's purpose.

- Codex unlocks after the first resource acquisition or completed conversation note, using the existing tab-reveal behavior. It fills the secondary page and retains Back to Main, Log, Settings, and save controls.
- Resources records the first actual acquisition's location, displayed game day, and source action/encounter. Repeated collection, spending, and capped log history never replace that first record. Receiving cloth from Rowan and finding cloth in a cache have distinct origins.
- Conversations records short notes from existing Garron, Elira, and Rowan passages after the dialogue finishes. Rowan's forest-trail hint can be remembered before discovering the trail, but it neither unlocks that location nor marks Wood as personally found. Notes have no rewards, completion scores, or hidden-entry silhouettes.
- Search and All notes / Resources / Conversations filters only expose recorded entries. The final requested presentation restores the original open-book layout: Contents, categories, search, and the entry list inside the left page; selected prose and provenance together inside the right page, with Previous/Next below it. Keep the dark cover, warm pages, center fold, compact header without Your journal, and accepted centered width (94%, capped at 1560px). Pages stack on narrow screens. No external bookmark rail or separate provenance page remains. No new lore or quest steps are invented.
- Save schema 17 stores the journal independently of the two capped logs. Earlier saves recover supported knowledge from resource discovery and action/progress records, with original locations/dates explicitly unrecorded. In-progress conversation hints stay hidden until completion. Prologue/replay state does not seed the adventure journal.
- Unread notes show an exclamation marker on the main Codex button and matching category buttons, New badges in the entry list, and a Newly recorded label on the opened note. Opening Codex starts at the first unread note; displaying a note marks only it read, while Newly recorded remains visible for notes that were unread when this visit began. Search/category/Previous/Next navigation marks only the displayed entry. Read flags persist per save slot; old entries without a flag start unread once.
- Existing milestone metadata is retained for future use; no achievement UI or completion checklist is added.

Validation: build, lint, and all 170 tests pass. Server-render checks cover empty, discovered, completed/pending conversation, and older-save states. The user accepted the final book layout and authorized commit/push on 2026-11-08. Individual manual checklist items are not all separately confirmed. See `docs/qa/feature-000037-codex-journal.md`.

## Completed: Feature 38 — Location unlocks

The user authorized starting this feature after accepting Feature 37. Working branch: `codex/feature-000038-location-unlocks`, based on `f04cd81`.

Locations now share a knowledge/access engine. Fresh journeys begin with Stonefield House only. Finishing Garron's first lesson reveals Village Square and Healer's Hut; finishing Rowan's introduction opens Forest Edge. Other unknown places stay hidden; Rowan's completed introduction reveals Forest Trail as Heard about, with its existing clue recorded in Codex. Three successful Forest Edge explorations permanently discover the route, independently of the hint. No counters, new places, or additional quest gates are introduced. Travel rejects undiscovered/unknown destinations and waits for pending encounters, conversations, or combat to finish. Stonefield House stays first in Village. Added family conversation guidance explains the recovery split: home restores stamina only; Elira treats HP at the hut. Her visit is optional, not an additional gate.

The user also authorized a small combat presentation addition: lowered party cards briefly reveal the affected vital when HP, stamina, or mana decreases. Bars drain after the lift, then waiting cards tuck away again. The effect uses actual per-member snapshots and respects reduced motion; no new drain mechanics are added.

Area definitions support action, conversation-note, story-event, quest-status, and combined requirements for hearing about a place, discovering it, and separately gaining access. Save schema 18 retains established routes and heard-about knowledge; migration preserves old flags, visits, current locations, and existing progress without replaying discovery logs. The user confirmed that the feature is working flawlessly and authorized commit/push on 2026-11-08. All 189 tests, lint, and build pass. See `docs/qa/feature-000038-location-unlocks.md`.

Feature 38 was accepted, committed, and pushed as `668f32f`.

## Completed: Feature 39 — Story timeline

The user selected the Story timeline on 2026-11-08. Working branch: `codex/feature-000039-story-timeline`, based on Feature 38 (`668f32f`).

Outcome: players can browse the important revealed moments of their journey and see their current chapter.

- Replace the static Story page with a draggable, zoomable timeline, selected-moment recaps, zoom buttons, and reset-view control.
- Group Prologue and Chapter 1 moments in authored story order. Retain the existing Chapter 1 · Act 1 metadata; do not invent later acts or chronology missing from older saves.
- Curate existing opening, family, Rowan, and exploration milestones. Hide unrevealed moments completely. Conversation milestones appear only after the relevant dialogue finishes.
- Derive visibility from durable progress, preserving older saves and independence from capped logs. Browsing is read-only; keep isolated prologue replay without claiming a skipped prologue was completed.
- Preserve Back to Main, Log, Settings, and save controls. Support keyboard navigation, narrow screens, and reduced motion.
- No new story events, rewards, achievements, chapter gates, NPC-scene replay, artwork, or combat content.

After Feature 39 is reviewed and accepted, pause before Feature 40. Prepare the current story as copy-and-paste text for the user's Google Docs writing pass; allow time for their revisions before scoping the next feature. This is a separate follow-up, not authorization to start Feature 40 or publish edits to Google Docs.

Implementation: ten authored moments cover the replay entry, Chapter 1 opening, Garron's first lesson, Elira's first visit, meeting Rowan, first visiting Forest Edge, discovering Forest Trail, learning Basic Guard, the wood favor, and completing the crafting lesson. Only known moments appear. The chapter opening is selected initially; the current chapter remains separately identified when browsing other moments. The view supports mouse/pen dragging, native touch scrolling, 75–150% zoom, reset to the chapter opening, Previous/Next, and arrow/Home/End navigation. Recaps use existing content; no timestamps are invented. Save schema stays at 18 because the timeline is derived from existing records. Selection and zoom reset when loading another save.

Status: the user accepted the final presentation and authorized commit/push on 2026-11-08. All 197 automated tests, lint, and the production build pass. Individual manual checklist items were not separately confirmed. The user will handle manual browser checks; keep future verification focused on code and automated checks unless asked otherwise. QA: `docs/qa/feature-000039-story-timeline.md`.

User-reviewed polish: capitalize The Beginning and remove the redundant top-right You are here block. The timeline's Current chapter marker remains. Extend the right recap panel to the top of the Story page alongside the heading; narrow screens retain the stacked layout.

Achievements remain a separate possible future feature.

## Later ideas

- More recipes, crafting depth, and additional village characters.
- Further encounters and combat encounters.
- Further story writing and expansion of the interactive prologue.
- Expanded party and relationship progression; additional journal content and a separate achievement system if requested.

These are backlog ideas, not promises for Feature 33 or a fixed order of work.

Latest approved battle layout refinement: the scene fills the browser content area with no outer padding or visible combat title/header. Commands and descriptions move toward opposite edges; the centered enemy and party retain equal side columns. The latest battle message replaces the upper-right intent box. An accessible intent icon beside the enemy reveals its hint on hover/focus/tap, dismissed by Escape or tapping away. Actual buffs remain separate: the tutorial fragment displays Evasive only while its evasion is increased to 75%; Guiding Star remains a player buff.

Combat options now live behind a fixed upper-right gear. A native modal panel slides in from the right and preserves Log, Settings, Save, Load, Reset, and Skip Prologue; replay exposes Exit Replay instead of save/reset/skip. Opening options pauses tutorial typing and blocks battlefield input. Choosing an option closes the panel before opening its destination. Escape, Close, and backdrop click dismiss it; reduced motion skips the slide. Info and Battle Log remain in the battlefield, with room reserved beside the gear (Feature 36 replaced Details with Info).
