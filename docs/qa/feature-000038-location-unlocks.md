# Feature 38 — Location unlocks

Branch: `codex/feature-000038-location-unlocks`, based on Feature 37 (`f04cd81`).
Status: accepted by the user on 2026-11-08; commit and push authorized.

## Scope

- Separate knowledge of a place from discovery of its route and current permission to travel.
- A fresh Chapter 1 starts at Stonefield House, the only visible location. Village Square, Healer's Hut, and Forest Edge start hidden. Finishing Garron's first lesson opens the square and hut together; finishing Rowan's introduction opens Forest Edge. Pending conversations do not reveal their destinations.
- Completing Rowan's introduction records the existing Codex clue and reveals Forest Trail as a non-interactive **Heard about** entry in Locations. Pending dialogue does not reveal it, including after loading.
- Three successful Explore actions at Forest Edge discover the route, independently of the hint once Forest Edge is accessible (older saves may already have access). Forage Carefully and failed actions do not count. No numerical discovery checklist is shown to players.
- A discovered route becomes a normal travel button. A later clue cannot downgrade it. Discovery writes one action-log message and retains the existing `unlock_forest_trail` milestone ID.
- UI and travel engine share the same access check. Battle, conversation, prologue, and pending encounter states block travel. Unknown/undiscovered destinations are rejected; destination labels come from the canonical area definition. Clicking the current location does not interrupt rest or manufacture another visit.
- Garron naturally points the player toward Rowan and Elira; Rowan explains the route to the forest edge. Elira's first visit explains that she treats wounds, while resting at home restores stamina. Related Codex notes remember this guidance. Visiting Elira is optional, not an additional exploration gate.
- Rest restores stamina only, stops at full stamina even if wounded, and never heals HP. Visiting Elira retains its existing capped +2 HP treatment and does not restore stamina. Existing item healing is unchanged.
- User-requested small addition: a waiting battle card briefly rises far enough to show the affected HP/ST/MP meter when that vital decreases. The bar holds its old width during the lift, drains over 650 ms, then the card tucks back down. Each member reacts to their own snapshots. Reduced motion reveals the final values without animation. No drain mechanics or additional party members are introduced.
- No new locations, quests, rewards, or Story timeline changes are added.

## Authoring future locations

`src/data/areas.js` can give a location a `progression` object:

- `heardWhen` and `heardHint`: learn its existence without opening a route.
- `discoverWhen` and optional `discoveryRuleId`: discover the route permanently.
- Optional `accessWhen` and `accessHint`: separately check whether a known route is currently accessible. None of the current areas needs an extra gate.

Requirements support successful action counts, recorded conversation notes, completed story-event IDs, exact quest statuses, and nested `all`/`any` conditions. Use `any` when several quest stages should qualify; an exact `active` condition does not imply `ready` or `completed`. Empty/unknown requirements fail. Conversation requirements use authored journal note IDs, so narration logs being trimmed or notes being marked read do not erase knowledge.

The location processor runs after normal action/story progression, completed conversations, and resolved exploration encounters. Access conditions are evaluated live; discoveries and heard-about flags persist. Additional future progression entry points should call the same processor after settling their outcomes.

## Saves

Save schema 18 adds `unlocks.heardAreas`; established route flags remain in `unlocks.areas`. Loading preserves routes evidenced by valid flags, recorded visits, the current known location, completed discovery rules, or sufficient exploration progress. Older conversation notes recover their corresponding location reveals. Previously open village/forest routes stay open even if their new introductory conversation has not been completed. A reset/new journey uses the home-only progression. Unknown IDs/non-boolean flags are discarded, and an invalid current location falls back to Stonefield House. Prologue saves do not acquire adventure location knowledge. Migration is silent and repeatable; save slots remain independent.

## Manual QA

Use an empty slot or a separate test save; do not overwrite a save you want to keep.

- [ ] Start a fresh Chapter 1: only Stonefield House appears. Save/load before training and confirm the other places remain hidden.
- [ ] Finish Garron's first lesson: Village Square and Healer's Hut appear together, with home still first. Forest Edge stays hidden. Meet Rowan: only after his conversation ends does Forest Edge become available and Forest Trail appear, labelled Heard about with a short clue. It cannot be used to travel. The corresponding Codex note exists; Wood has not been collected just because it was mentioned.
- [ ] Explore Forest Edge three times, responding to any encounters. The trail becomes a regular button; its clue card disappears. Travel there and gather wood normally. Forage Carefully does not advance route discovery.
- [ ] Visit Elira and read the family conversation. With wounded HP and depleted stamina, resting at home restores only stamina and stops once full. Elira restores up to 2 HP per visit without changing stamina. A visit to her is not required before meeting Rowan.
- [ ] In an older save with Forest Edge already open, exploration still works even without Rowan's note. Talking to Rowan later does not relock a discovered route.
- [ ] Save/load once while the trail is heard about and once after discovering it. Each slot restores its own state. Load an older save that already visited the trail and confirm travel remains available.
- [ ] If discovery coincides with an encounter, travel stays disabled until choosing a response. Saving/loading during the encounter preserves this restriction.
- [ ] At desktop and narrow widths, the clue fits the Locations panel and does not overlap the action area. Available travel buttons remain keyboard accessible.

- [ ] In a Garron spar, take a hit during his turn: the lowered card rises enough to show HP, the bar shrinks, and the card lowers again. A miss must not trigger a damage reveal. On your next turn, the full card appears normally.
- [ ] During the prologue tutorial, physical attacks animate stamina loss and spells animate mana loss. No damage/spending is applied twice. Fast playback still leaves time for the reveal; reduced motion shows changed values without sliding/draining animations.

## Validation

2026-11-08: all 189 automated tests pass; ESLint, the production build, and `git diff --check` pass. Server-render checks pass for hidden, heard-about, discovered, and temporarily blocked location entries.

Automated engine coverage includes hidden/heard/discovered states, opening conversation gates, rest versus healing, old-save discovery without a hint, real pending encounters, canonical travel validation, separate access requirements, malformed flags, old saves, and independent save slots. Combat feedback tests follow actual spar/tutorial frames and cover simultaneous losses, healing, and missing vitals. Presentation is checked with server-rendered markup; the user subsequently reported that the feature is working flawlessly and accepted it. Individual checklist items were not separately reported.
