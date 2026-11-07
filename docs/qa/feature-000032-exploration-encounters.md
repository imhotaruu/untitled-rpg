# Feature 32 — Exploration encounters

Branch: `feature/000032-exploration-encounters`

## Behavior

Explore at Forest Edge or Forest Trail can reveal a short encounter in the Actions column. Forest Trail now has its own Explore action costing 1 stamina. Forest Edge keeps its existing stamina cost, herb yield, and mastery XP. The first successful Explore after this feature is introduced guarantees a common encounter, including for older saves.

After resolving an encounter, the next two successful Explore actions are quiet. Subsequent eligible explorations have a 5% rare chance, 20% common chance, and 75% chance of no encounter. These are starting balance values in `src/data/explorationEncounters.js`. Failed actions do not advance cooldowns or trigger discoveries. Forage Carefully and Gather Wood retain their normal gathering behavior and do not trigger encounters or advance their cooldown.

| Encounter | Area | Investigate reward | Alternative |
| --- | --- | --- | --- |
| Beneath the roots (common) | Forest Edge | 2 Herbs | Leave them growing |
| A fallen bough (common) | Forest Trail | 3 Wood | Step around it |
| An old trail cache (rare) | Either forest area | 8 Gold and 1 Cloth | Leave the cache undisturbed |

Choices have no additional stamina cost, including when the exploration leaves stamina at zero. Each occurrence can resolve only once. Encounters can recur after the cooldown; a new occurrence can grant its reward again. Encounter rewards have no gathering XP, mastery yield bonus, or critical multiplier. Cloth becomes visible in Resources when first obtained; it has no crafting use yet.

The encounter opening and chosen outcome appear in Story; Action Log records discovery, response, and rewards. A bottom-center popup confirms the outcome. Focus moves to the encounter heading when it opens, and returns to Explore after choosing. Pending encounters replace regular actions and disable travel until the player chooses either response. Character, Relationships, and save/settings controls remain available. Combat cannot start during an unresolved encounter. This feature introduces no hostile encounters or new combat enemies.

First resolved encounter and first resolved rare encounter have durable milestone metadata for the future Codex. Either choice counts, so discoveries do not require taking resources. The Codex page stays unavailable.

## Save compatibility

Save version is now 12. Old saves receive empty exploration progress without resources or retroactive discoveries. Pending encounter IDs, occurrence tokens, seen encounters, resolved count, and cooldown persist. Loading a pending encounter returns to Main; the choice is unchanged and does not reroll. Invalid IDs, invalid tokens, mismatched locations, or a simultaneous combat state discard the pending encounter rather than trapping the player. No reward is granted on load.

Random draws are sampled once in the UI action handler, outside React state updaters, then supplied to the engine. Engine calls without an encounter draw do not roll encounters, keeping existing tests and non-interactive callers deterministic. Repeated/stale choice callbacks cannot award the same occurrence twice.

## Manual QA

Use a spare save slot for reset checks.

- [ ] From a fresh game or Feature 31 save, visit Forest Edge and Explore once with stamina available. A common **Beneath the roots** encounter appears in the Actions column. The original Explore cost, herb reward, and mastery XP still apply once.
- [ ] Check the opening in Story, readable choice buttons, reward previews, and keyboard focus. The location buttons are disabled with an explanation while the choice is pending.
- [ ] Gather the mature stems: receive exactly 2 additional Herbs, no additional stamina cost, no extra mastery XP. The outcome appears in Story and Action Log, a popup appears, and normal actions/travel return. Rapid clicking does not duplicate the reward.
- [ ] On another encounter, choose the leave option. Resources stay unchanged and normal play resumes. This also works with zero stamina remaining.
- [ ] Resolve an encounter, then Explore twice: no new encounter occurs during these two quiet explorations. Later encounters are random; a quiet result is normal. Failed attempts and routine gathering do not consume the quiet-exploration count.
- [ ] Unlock Forest Trail through three Explore actions at Forest Edge. Its new Explore action costs 1 stamina and can reveal **A fallen bough**; collect sound wood for 3 Wood or leave it. Gather Wood still works as before.
- [ ] When a rare cache appears, check its rare styling and the 8 Gold + 1 Cloth preview. Taking supplies grants those amounts once and reveals Cloth in Resources. Leaving grants nothing. Rare appearance and boundary probabilities are covered automatically; no prolonged grind is required for manual acceptance.
- [ ] Save while an encounter is pending. Open Character or Relationships, then load that save: return to Main with the same encounter and choices. Resolve, save, and reload again: no repeated reward or reopened encounter.
- [ ] While a choice is pending, visit Character/Relationships and return through Back to Main. The encounter persists. Resetting the game clears it and its discovery history.
- [ ] Test narrow and wide windows. Encounter text and choices remain readable beside or above Story according to the existing responsive layout. Choice buttons are usable by keyboard and touch.
- [ ] Check existing sparring, upgrades, gathering, mastery, and family connections after loading a Feature 31 save.

## Validation

`node --test --test-reporter=dot tests/*.test.mjs`: 104 tests passed, including 10 exploration tests. `npm run lint`, `npm run build`, and `git diff --check` passed.

Automated coverage includes first-encounter introduction, unchanged base exploration rewards/XP, repeat-click protection, no-cost leaving at zero stamina, world-action guards, cooldown eligibility, exact rarity boundaries, rare rewards and milestones, actual save/load round trips, old-save defaults, and malformed pending-state recovery.

Server-render checks cover common and rare encounter cards, choice/reward labels, disabled travel, and restoration of the normal Actions section after resolution. On 2026-11-06, the user approved committing and pushing the current feature after manual review and location-list adjustments. Individual checklist items remain unchecked where completion was not explicitly reported.

## Possible next feature

The user proposed a crafting introduction and a Quests tab for Feature 33. A small crafting quest from Rowan could introduce both systems. Recipe, costs, reward, and quest structure are still to be decided; neither system is included in Feature 32.
