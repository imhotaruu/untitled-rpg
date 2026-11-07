# Feature 31 — Village relationships

Branch: `feature/000031-village-relationships`

## Scope

Relationships is now an available main page. A selected-character profile sits on the left, with a circular portrait network on the right. Its village chart shows only people the player has met, connecting the player, Garron, Elira, and Rowan with lines. Select a portrait to highlight its connections and dim unrelated lines. Select a diamond on a line, or a connection in the profile, to read that pair's shared history. The active bond has a brighter line and marker. Diamond numbers count recorded shared moments; they are not affinity scores or romance levels. Initial-letter portraits are placeholders; no generated art is used. Relationships uses the full page width without the status/resources sidebar; Main and Character retain their sidebar. On narrow screens, the network stacks above the profile.

Rowan is a working name for the village carpenter. Definitions and relationship history live in `src/data/relationships.js`; persistent action/person IDs should stay stable when names or prose change.

Garron and Elira are known from the start as your parents. Elira’s profile identifies her as your mother, Garron’s wife, and the village healer. The chart includes permanent **Mother and child** and **Husband and wife · Married** connections, with no invented shared moments or automatic rewards. Garron's profile identifies him as a retired adventurer and protective parent; the permanent **Father and child** relationship is separate from earned training moments. Training with him records **First lessons** and makes **Meet Rowan** available at Village Square. That one-time introduction reveals Rowan's node, the player's first connection to them, and the link between Rowan's practice swords and Garron's teaching. Rowan asks for six pieces of Wood. **Bring Wood to Rowan** consumes 6 Wood and grants 5 Gold once, records the story, and changes the player's bond to **A helping hand**.

Garron's bond reflects the existing training, Basic Guard, and training armor moments. Connections use descriptive stages rather than points or repeatable talk/gift farming. Bottom-center feedback announces a new player connection or shared moment. Unseen stages and characters are not displayed.

Both Rowan actions have durable milestone metadata for the future Codex. The Codex page remains unavailable. This feature does not add random/rare encounters, recruitable party members, crafting, or relationship stat bonuses.

## Save behavior

Relationships are derived from existing durable completion records and system unlocks, not log text or action counts. No new save schema is needed; version 11 remains valid. Older trained saves recover Garron's known moments and unlock Rowan's introduction without replaying training or granting rewards. A recorded introduction or wood delivery stays complete after reload and after its text falls out of the 50-entry story log.

## Manual QA

Use a spare save slot if checking a fresh game.

- [ ] Character and Relationships use a compact **← Back to Main** control instead of the full navigation/status header. It returns to Main without losing progress. Save, Load, Reset, and Settings remain available; the normal page tabs remain on Main. Check keyboard focus and wrapping at narrow widths.

- [ ] Fresh game → Relationships: the player, Garron, and Elira appear with father/child, mother/child, and husband/wife connections and zero recorded shared moments. Their profiles say **Your father** and **Your mother**. Select the parents’ bond and confirm it says **Married**. Rowan and future bond stages remain hidden; Rowan’s introduction stays locked until training.
- [ ] Stonefield House → Train with Garron: a **Bond Updated** popup appears. **First lessons** is recorded while **Father and child** remains visible.
- [ ] Village Square → Meet Rowan: one story passage, new-connection popup, and the action disappears. The chart now contains four people and five connections. Selecting Rowan or Garron shows their connection to each other as well as to the player.
- [ ] Select each portrait with the mouse, then Tab and Enter/Space. Selection, highlighted lines, and shared moments agree; keyboard focus remains visible.
- [ ] Select the diamond between Garron and Rowan: their shared history appears in the left profile. Select a different connection in the profile and confirm its diamond and line become active. Unrelated lines stay dimmed, but their markers remain selectable.
- [ ] Connection lines align with the centers of the portrait circles, independently of the name labels below them. Arrowheads point toward both portraits for the current mutual connections, stopping outside the selection rings. Resize the window and check both horizontal and diagonal bonds; arrowheads should keep their shape and the diamond should remain at the midpoint.
- [ ] Check the chart with three and four known people: portraits arrange themselves without empty slots. Diamond numbers match each connection's recorded moments. New story milestones update the numbers without inventing bond points.
- [ ] Before owning 6 Wood, attempt Bring Wood to Rowan: no payment, Gold reward, story, or bond change occurs.
- [ ] Explore Forest Edge three times to reveal Forest Trail. Gather at least 6 Wood there, resting if needed. Return to Village Square and deliver: exactly 6 Wood spent, exactly 5 Gold gained, one story passage, **Bond Updated** popup, and Rowan's bond becomes **A helping hand**. The delivery action disappears.
- [ ] Practice with Garron until Basic Guard, then collect training armor. His history gains the corresponding moments. Further practice or Talk does not keep increasing the bond.
- [ ] Save and reload: people, connection labels, histories, resources, and one-time actions remain correct. Loading an older trained save shows Garron and makes Rowan available without automatically meeting them.
- [ ] Load a fresh save while on Relationships: Rowan and earned moments disappear; both parents and their marriage remain known. Check page navigation back to Main and Character, and confirm combat still uses its separate screen.
- [ ] Check narrow and wide windows: the profile is left of the network on desktop, portrait buttons stay inside the chart, details stack below the chart on narrow layouts, and Relationships fills the page without a status sidebar. Main and Character still show their status sidebar.

- [ ] With Rowan introduced, all five bond diamonds remain separately selectable without crossing lines at the same midpoint. Elira appears in older saves automatically, without replaying scenes or granting progress.

## Automated validation

- `node --test --test-reporter=dot tests/*.test.mjs`: 94 tests passed, including 8 new relationship tests.
- `npm run lint`: passed.
- `npm run build`: passed.
- Server-render smoke check (before arrow refinement): fresh chart shows the family connection without Rowan or unearned lessons; introduced chart shows discovered portraits and shared-moment details. Arrow endpoints now use browser measurements via ResizeObserver; their alignment is included in manual QA above.

User acceptance: on 2026-11-06, the user approved the current implementation after iterative manual UI checks and authorized commit/push. Individual checklist boxes remain unchecked where completion was not explicitly reported.

