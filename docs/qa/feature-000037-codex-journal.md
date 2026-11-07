# Feature 37 — Codex journal

Branch: `codex/feature-000037-codex-journal`

## Scope and behavior

Codex is a personal reference journal, not an achievement list. The user ultimately selected the original open-book layout: Contents, category buttons, search, and the clickable entry list are inside the left page; selected prose and provenance share the right page, with Previous/Next controls below. The dark cover, warm pages, center fold, compact header without Your journal, and accepted centered desktop width (94%, capped at 1560px) remain. Pages stack on narrow screens. External bookmarks and the separate provenance page are removed. Back to Main navigation remains available.

First resource acquisition records persist separately from logs: resource ID, area ID, displayed game day, and source action/encounter ID. Repeats and spending never replace the original. Gold's initial visible zero balance does not count as a discovery. Merely hearing about Wood does not create a Wood resource entry. Taking an encounter reward records its location; leaving supplies does not count as acquisition.

The initial conversation notes cover Garron's stance and guard advice, Elira's welcome, and Rowan's fallen-wood request, grain lesson, and first sword materials. They summarize existing prose and remain historical notes even after a request is fulfilled. They appear only when their conversation completes, not when its costs/rewards settle. Saving during dialogue preserves this distinction. Completion callbacks remain once-only and grant no additional gameplay rewards.

Codex appears after the first entry, with existing navigation reveal behavior. Party remains unavailable. No new people profiles, achievement counters, milestone page, map unlocks, quest objectives, auto-travel, story timeline, generated art, or sound were added.

## New-note notification

New entries start unread. The Main navigation's Codex button shows a gold ! while any unread entry remains, with an accessible unread count. Category buttons show ! for their unread notes, entry buttons show New, and the open note shows Newly recorded when appropriate. Opening Codex chooses the first unread entry when available. Only the entry actually displayed is marked read; filtering or opening the page never clears the entire journal. A Newly recorded label remains on viewed notes that were new at the start of this visit, so the context is still visible after the saved unread flag clears. No popup interrupts narration.

Read flags persist with game saves independently by slot. Acquiring the same resource or repeating a known conversation does not reset a read entry. Earlier entries without read flags begin unread; after reading and saving, that state persists. Read flags are part of Feature 37 save schema 17.

## Saves

Schema version 17 adds `journal.entries`. Existing saves recover known materials from discovery/resource records and NPC information supported by completed actions or progress. They do not invent where or when the player first learned something: those entries say Location not recorded / Date not recorded. Current pending passages are excluded from recovered hints. New entries contain actual provenance, including Rowan's gift versus a forest cache. Saved IDs are validated against definitions; duplicates/unknown IDs are removed and invalid provenance is not presented as fact. Prologue state has no adventure journal. Source prose remains in data definitions so later edits do not require changing save IDs.

## Manual QA

Refresh the development page to load the updated save migration. Use a spare slot for fresh-game tests.

- [ ] Fresh Chapter 1: Codex stays hidden before a discovery or completed NPC conversation. Finish Garron's initial lesson or visit Elira; Codex appears. Open it and read the matching note, speaker, location, and game day.
- [ ] Save partway through Garron's/Rowan's dialogue, then load. Finish the conversation and confirm its note is added only once. Check costs/rewards are unchanged.
- [ ] Explore Forest Edge or Forage Carefully successfully. Herbs records Forest Edge and the actual source action/day. Gather again, spend herbs, and travel; the original entry remains unchanged.
- [ ] Meet Rowan: Sound wood along the trail is recorded. Wood itself remains absent until obtained, and the hint does not reveal Forest Trail in Locations. The sword-material note stays absent until his crafting lesson dialogue is finished.
- [ ] Get Cloth from Rowan's lesson, then find a rare cache, or test the reverse order in another save. Cloth retains its true first source/location. Leaving a cache does not count as obtaining its Gold/Cloth.
- [ ] Search for a resource, person, or location. Filter Resources/Conversations and select notes. No matching notes is clear, and clearing the search restores entries. No undiscovered titles, counts of remaining entries, or achievement rewards appear.
- [ ] Load an older progressed save. Supported entries appear without fabricated locations/dates; new gains do not overwrite an unknown old first acquisition. Loading a fresh slot hides Codex again. Slots keep separate journals.
- [ ] Record a new note: Main shows Codex !. Open it: the first unread note is displayed with Newly recorded, other unread notes keep their New badges and category ! markers. View all unread notes: return to Main and confirm ! clears. Repeat a known gather: it stays clear.
- [ ] Save after reading some notes, load, and confirm only those entries remain read. Load another slot and confirm its unread state is independent. Check search/filter selection marks only the displayed note, not hidden results.
- [ ] Browse using Previous/Next: selection and the Note X of Y label follow the filtered list; boundary buttons disable, including both buttons on an empty result. Check the centered book has modest desktop margins and a compact heading, without the Your journal label.
- [ ] Check keyboard Tab/Enter/Space, visible focus, category selected states, and Back to Main. Check desktop and narrow windows: the tabs and prose remain accessible, long text wraps, and controls remain accessible.
- [ ] Confirm normal NPC dialogue, crafting, exploration rewards, save/load, and the existing Story page still work. Prologue replay must not add tutorial discoveries to the real character's journal.

## Validation

- All 170 Node tests pass, including twelve new journal tests covering first provenance, duplicate prevention, immutable updates, failures, rare reward/leave choices, conversation gating, gifts, old-save recovery, malformed data, slot persistence, selective read marking, repeat acquisition behavior, unread navigation, and saved read-state migration.
- Existing conversation tests still compare gameplay outcomes; journal note differences are asserted separately. Navigation tests include the new earned Codex tab. Save-version assertions now expect 17.
- ESLint and production build pass.
- Server-render checks pass for empty and discovered journals, completed/pending NPC hints, hidden future content, and legacy metadata. These are not interactive browser tests. The user accepted the final result on 2026-11-08; the individual checklist boxes above remain unchecked where not explicitly confirmed.
- Latest UI render checks pass for journal rendering and unread behavior. The restored original book layout builds and lints successfully and was accepted by the user.
- The user authorized commit and push on 2026-11-08 after accepting the final layout. Final production build, lint, and all 170 tests pass.

## Next feature

The user chose a proper location unlock system for Feature 38 while reviewing the journal. The draggable, zoomable Story timeline is deferred until after that; scope each separately.
