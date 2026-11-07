# Feature 34 — Prologue V2: When the Stars Faltered

Branch: `codex/feature-000034-prologue-integration`

## Scope and source

The six-scene V2 draft is preserved in `docs/story/prologue-v2.md`, including the user-approved correction placing possibility, freedom, and change within creation rather than attributing them to Chaos. The gods seal Chaos; they do not permanently kill it. Astraea is Goddess of Stars, Starwake is her blade, and Morveth, Aurelion, and Elaris retain their domains and dialogue. The blessing does not declare the protagonist a chosen one. The lingering thread appears as foreshadowing; author-only future revelations are excluded.

`src/data/prologueScript.js` holds the readable passages and tutorial dialogue. Scene directions are adapted to atmospheric text and existing CSS silhouettes; the draft's cinematic directions are not claims of new animation or audio assets. The prologue has 22 passage pages across six scenes, followed by birth and Chapter 1 (24 saved passages total). The growing-up bridge is part of the chapter opening. Existing page IDs should remain stable when editing; append IDs for new passages rather than renumbering existing ones.

## Tutorial

The separate Astraea encounter now teaches six inputs: Strike → Astral Ward → Guiding Star → guided Strike → Starlight Mend → Celestial Severance. It replaces V1's Call for Aid battle. Each lesson exposes the appropriate command; future spells unlock progressively and only the lesson's action can execute. Magic is blue after unlocking. There is no generalized main-game spell unlock or party system in this feature.

- Astraea begins with 36 HP, 8 stamina, and 30 mana. Physical strikes cost 1 stamina each.
- Astral Ward costs 4 MP and reduces the incoming 16 damage to 4.
- Guiding Star costs 3 MP and guides the next physical strike. Its effect is visible and consumed by that strike.
- Starlight Mend costs 5 MP and restores up to 12 HP, capped at maximum.
- Celestial Severance costs 8 MP and defeats the weakened fragment. The remaining gods still need Astraea to help seal primordial Chaos.
- This is a safe scripted tutorial, with guaranteed lesson attacks and enough resources for every step. Narrative prose after each action is read manually; short combat frames use the existing pace/motion settings. Normal spar mechanics are unchanged.

## Line-by-line story reader

Prologue and tutorial dialogue show one authored line at a time. Settings offers independent dialogue/narration speed: Slow (48 ms per character), Normal (24 ms), Fast (12 ms), or Instant, with proportional punctuation pauses. Clicking the story area/arrow or pressing Enter/Space reveals an unfinished line, then advances after it is fully visible. Rapid successive clicks are accepted; Instant advances one line per click. The bouncing arrow appears only when ready. Nothing advances on a timer. No audio has been added; supplied sounds can be integrated later.

The opening order is Click to Begin → Prologue: When the Stars Faltered → story → tutorial → story → character creation → Chapter 1 · Act 1: A Place to Begin title card → chapter narration → main game. The start prompt pulses gently; title cards wait for a click or Enter/Space. Narration does not begin typing behind them. The chapter card reappears when loading its saved passage.

The reader uses a borderless, dark full-screen presentation, centered sentence-case prose, a small speaker label, and the arrow alone. Visible scene headings/numbers and instruction/Next Line labels are removed; accessible labels remain. Order is gold and Chaos crimson. Options contains Settings/Save/Load, with Log and Skip or Exit Replay alongside it. Clicking the surrounding background also advances; menus and forms do not. Chapter headings appear only on their separate title cards.

Reduced motion keeps the arrow stationary and removes motion effects; text reveal follows its own speed preference. Settings/save/load/skip/log dialogs pause the reader. Controls outside the story area retain their own behavior, held-key repeats are suppressed, and character creation appears after the birth line. Rapid clicks reveal and advance with no cooldown, preserving revealed lines in Log. Screen readers receive complete lines rather than character-by-character announcements. Character sizing preserves combining marks and emoji; reserved line space keeps typing from moving the arrow.

Saves continue to store the passage/tutorial lesson, not the transient typed-character position. Loading starts that saved passage from its first line, including when loading the same passage. Birth form drafts remain saved as before.

## Birth, saves, skip, and replay

- New journeys and Reset Current Game begin V2; existing adventure saves keep their location and progress.
- Save version 15 stores scene ID, nested divine battle, lesson/reading state, HP/ST/MP, and the birth form draft. Save controls remain disabled during combat playback.
- V1 scene IDs migrate to corresponding V2 scenes. V1 battles or malformed tutorial snapshots return to the battle introduction, with no protagonist rewards or losses. Malformed unknown scenes return to the opening.
- Skip Prologue is available during narration and between combat exchanges. It asks for confirmation, then goes to birth/character creation. Escape cancels. Replay offers Exit Replay instead.
- Birth asks for a name (trimmed, nonblank, at most 32 characters) and gender using the existing player fields. Draft choices can be saved before submission. Submission changes only these fields and advances once to Chapter 1, whose opening contains the growing-up bridge. Old `years` passage saves migrate to the chapter opening.
- Chapter entry begins at Stonefield House, records the opening once, and retains normal starter equipment/stats. Astraea's items, spells, mana capacity, and damage never transfer.
- Story → Replay Prologue uses a temporary journey, pauses real adventure recovery, and hides Save/Load/Reset. Birth choices in replay cannot rename the actual character. Exiting or finishing returns to Story.

## Manual QA

- [ ] Battle dialogue stays over the battlefield in a wide low dark panel with a thin pale slanted border and slim pale speaker tab. Character lines show a larger left-side bust silhouette/initial; narration/tutorial lines show no character portrait. Check narrow screens and long lines for clipping, especially portrait height and the name tab.
- [ ] During battle dialogue, underlying commands cannot be clicked or tabbed into. Dialogue clicks/Enter/Space still reveal then advance; Settings/Save/Load still work. Finishing restores combat controls and focus. Ordinary prologue narration retains its centered layout.

- [ ] Load a Feature 33 or earlier adventure save. Verify location, inventory, crafting, quest, and relationship progress. Open Story → Replay Prologue without resetting.
- [ ] Read Scenes 1–3: corrected Order/Chaos paragraph; Divine Authorities' mortal origins; all four gods' domains and banter; Starwake's summoning. Check long passages at wide and narrow sizes and keyboard focus/Enter.
- [ ] Start the battle. Attack contains Starwake — Strike. Magic is initially locked, then blue after the first lesson. Future spells become available at the appropriate phase.
- [ ] Complete all six inputs. Check mana costs, Ward's damage reduction, Guiding Star's visible buff and consumption, Mend's HP restoration, and the finishing blow. Commands remain disabled during playback and return to the root afterward.
- [ ] Read the dialogue after each lesson at your own pace. It must not auto-advance, including on Fast combat speed. Inspect battle log and Details; HP/ST/MP stay readable.
- [ ] Complete Scenes 5–6: shared sealing, the faint thread, Astraea's pride in her duty, and a blessing rather than assigned destiny. No author-only future revelation should appear.
- [ ] Try Skip Prologue before the battle, between battle lessons, and during the final narration. Confirm leads to birth; cancel and Escape preserve the current scene/phase.
- [ ] Enter a name/gender at birth. Empty or whitespace-only names cannot submit. Save before submitting, reload, and verify the draft. Continue through the growing-up passage into Chapter 1 at home.
- [ ] In replay, enter a different name/gender and finish. The actual character's identity, stats, resources, inventory, quest progress, and story log must be unchanged. Save/Load/Reset must remain absent throughout replay.
- [ ] After saving your adventure, Reset Current Game to check the actual new-game route. Reset does not erase the saved slot. Finish or skip to birth, create the character, and check the name in Character and Relationships.
- [ ] Save/load at each tutorial lesson, its dialogue page, the finishing result, and the birth form. No repeated spell effects, skipped lessons, lost draft, or stuck screen. Old V1 battle saves should show the new battle introduction.
- [ ] Check reduced motion and Slow/Normal/Fast combat pace, then train/spar with Garron and verify exploration and Rowan's crafting quest still work.
- [ ] Story reader: click mid-line to reveal it, then click again to advance. Rapid clicks/double-clicks work on the text, arrow, and surrounding background, including across passage boundaries. Each revealed line remains in Log. Held keys and timers do not advance lines automatically.
- [ ] Start a new journey or replay: pulsing Click to Begin appears first, then a separate Prologue: When the Stars Faltered title card, then the first story line. Both screens wait for input. Skip works before starting; Options still opens Settings.
- [ ] Prose appears in sentence case, with gold Order/crimson Chaos. Only the speaker and continuation arrow are visible around the line; no scene headings/numbers, Next Line label, or helper instructions. Background clicks advance once, while clicks in Options do not.
- [ ] Open Settings/Save/Load/Skip/Log while a line types: typing pauses and dialog controls do not advance it. Cancel resumes. Reduced motion keeps the arrow stationary while respecting text speed. Repeat during tutorial dialogue.
- [ ] Compare Slow, Normal, Fast, and Instant text in both story and battle dialogue. Instant shows each line immediately and advances once per click; other speeds still allow immediate reveal. Reload and change save slots: the preference persists independently of combat pace. Restore defaults returns both to Normal.
- [ ] After character creation, see only Chapter 1 · Act 1 / A Place to Begin and its arrow. Click to enter the growing-up narration: the chapter heading is no longer above the text. Save/load that passage and check the title card, then narration, again.
- [ ] After the birth line, choose your name. Space/Enter in form controls must not skip narration. Save/load the same passage and verify it restarts at line one with the saved form draft preserved.

## Validation

- [ ] Each tutorial turn shows a separate helper beside the enemy with the current objective, effect, and cost. On narrow screens it stacks above the enemy. It hides during playback/dialogue; spell definitions no longer appear as dialogue lines.
- [ ] Log is at the top right in narration, both kinds of combat, and the main/page toolbar. Read narration, NPC lines, and player lines across passages: revealed lines appear in reading order with their speaker names. It opens at the latest entry; Close stays visible while scrolling.
- [ ] Opening Log mid-type pauses the line. Close or Escape resumes at the same character; browsing the log never advances the story. Check keyboard focus returns to its button.
- [ ] Village and exploration story entries also join the log. Repeated lines remain distinct; recovery ticks and page changes do not duplicate them. Battle damage/command messages remain in Battle Log.
- [ ] Load/reset or starting/ending replay clears the reading-session history, with replay kept separate. Loading an adventure repopulates its saved story entries. It does not reveal future or skipped prologue passages.

- 135 automated tests passed, including text-speed persistence/fallbacks, proportional reveal timing, and successive reveal/advance inputs without elapsed time. Chapter title separation, all four speed render states, the Log label, and the new settings field passed server-render checks. Lint and production build passed.
- ESLint, production build, and diff whitespace checks passed.
- Server-render smoke checks passed for the start gate, hidden scene headings, removed visible helper labels, word emphasis, sentence-case and reduced-motion overrides. Earlier checks covered typing/instant states, one-line visibility, arrow readiness, accessible text, paused tutorial dialogue, and the birth form gate.
- Battle dialogue render checks passed for character/narration variants, a retained battlefield, inert underlying commands, control restoration after dialogue, and unchanged prologue styling. Lint/build and all 132 tests passed after the layout change.
- Visual and interaction review was handled by the user. They accepted this feature for commit/push on 2026-11-07; unchecked manual items above are retained as a regression checklist rather than claims of automated browser coverage.
- Helper/history pass: all 132 tests, lint, and build passed. Render checks covered all six lesson helpers, narrative-only tutorial dialogue, and history speaker/text rendering. Browser interaction checks above remain for manual QA.
