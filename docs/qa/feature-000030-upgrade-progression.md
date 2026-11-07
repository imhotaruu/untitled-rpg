# Feature 30 — Upgrades and gathering progression

Branch: `feature/000030-upgrade-progression`

## Scope

Character → Upgrades now groups six upgrades into Conditioning and Combat techniques. Cards show flavor text, per-rank benefits, where the effect applies, current → next-rank totals, owned/required resources, and a reason when unavailable. Players choose purchase order; there are no mutually exclusive paths or respec system in this feature.

Existing Stamina Training, Breathing Practice, and Basic Conditioning keep their IDs, five-rank limits, costs, and effects. Breathing Practice explicitly affects adventure resting only, not combat Guard or Recover. Health and stamina purchases still add two to the corresponding current adventure resource as well as its maximum.

Garron's starter weapon is now named Training Sword, described as a wooden practice sword. New training narration and item feedback use the new name. Its existing internal ID, progression flag, and stat bonuses are preserved so owned and equipped weapons in older saves continue to work. Historical text already stored in logs is unchanged.

| New technique | Benefit per rank | Unlock | Costs, ranks 1–3 |
| --- | --- | --- | --- |
| Striking Drills | +1 Attack Power | Combat Basics from training with Garron | 15 Herbs / 25 Herbs + 5 Wood / 40 Herbs + 10 Wood |
| Precision Drills | +3 percentage points of Accuracy | Combat Basics from training with Garron | 12 Herbs / 22 Herbs + 3 Wood / 35 Herbs + 6 Wood |
| Guard Drills | +1 Guard Power | Basic Guard from practicing with Garron | 12 Herbs / 22 Herbs + 4 Wood / 35 Herbs + 8 Wood |

Gather Wood on Forest Trail costs 2 stamina and grants 3 Wood plus the current mastery bonus. Forest Trail is still discovered through the existing three Explore actions at Forest Edge. The first gathering adds a single story passage about uses for the material; subsequent gathering does not repeat it. Wood becomes visible in Resources on discovery and persists in saves. Ore and Cloth remain reserved; crafting and new village characters are future work.

Costs support any number of resource entries. Every required material must be affordable before any is spent; the card shows each owned/required amount. Later ranks of the three new techniques use Wood for practice equipment alongside Herbs. Existing purchased ranks are preserved without retroactive charges.

Purchasing an upgrade uses the shared bottom-center item notification. It displays the acquired level, actual before/after stat totals, restored adventure vitals when applicable, and all resources spent. Upgrade notifications last seven seconds; existing item notifications retain their timing. A new interaction replaces the old notice, with stale timers prevented from dismissing newer feedback. Feedback is transient and never saved. Rejected attempts produce a No Change notice with the engine reason and no-spend message; unavailable buttons remain disabled. Purchase costs also remain in the Action Log.

These bonuses affect the existing combat engine and appear as upgrade contributions on the Combat tab. Attack Power scales physical move damage; Accuracy remains capped at 95% before enemy evasion; Guard Power applies only when guarding. Preview values use the same derived-stat calculations as combat, including equipment and caps. Purchases with no stat gain at the current cap are blocked without spending resources; a partial gain up to the cap is allowed and shown accurately.

The engine checks training requirements, affordability, rank limits, caps, and combat restrictions. It resolves upgrade definitions by ID, so an altered UI payload cannot bypass requirements or costs. The purchase action remains one rank at a time.

## Gathering mastery

Herb Gathering and Wood Gathering are independent masteries earned through XP. Each successful gathering action grants 1 XP per gathered resource, regardless of base yield or critical harvest. Explore and Forage Carefully share Herb Gathering XP; Gather Wood uses Wood Gathering XP. The first level requires 100 XP, then each successive level requires twice the previous amount: 100 / 200 / 400 / 800 / 1,600 XP. These are additional requirements per level, totaling 3,100 successful gathers from level 0 to the current cap of 5. XP resets toward the next level with any surplus carried over. Each level still adds a fixed +1 resource per gather. Future resources can receive their own definition and explicitly tagged gathering actions.

The current level determines the payout; a level earned by that gather's XP applies from the next gather. For example, Wood mastery 2 yields 3 base + 2 bonus = 5 Wood. If the gather reaches level 3, subsequent normal gathers yield 6. Failed actions give neither resources nor XP. Ordinary resource rewards, purchases, resting, and combat cannot gain gathering XP. At the cap, the full bonus remains and further XP is not accumulated.

Mastery has its own Character tab, hidden until the first successful gather awards XP. Merely owning or discovering a resource does not unlock it. The first gather shows the user's notification: "You feel as if you will do this a lot of times, you'll get better at this." It announces Unlocked Character → Mastery and starts progress at level 0, 1/100 XP. Each resource's card appears once it has XP or an earned level, with a labeled XP bar, numeric progress, current bonus, and next-level bonus. The capped bar is full and marked Max level. Loading an unprogressed save hides the tab and falls back to Overview if Mastery was selected.

Critical gathering has a 10% chance per gathered resource to double the full yield, including the current mastery bonus. A critical gather at Wood level 2 grants 10 Wood instead of 5, while XP remains +1. This is separate from combat critical chance. Action previews show guaranteed normal yields plus the critical chance and XP gain. Exact harvest amounts, critical results, XP gains, and level gains go to the Action Log. Discovery notifications last ten seconds for reading; level-up and critical notifications last seven. Ordinary XP gains update progress without a popup. Simultaneous discovery/level-up and critical results share one notification.

The first gathering XP also triggers the one-time story event `first_gathering_mastery`, processed last so it becomes the latest Story passage for that action. The prose introduces the possibility of improvement through practice. Its existing completion ID is retained in `completedStoryEvents`, independent of the 50-passage history limit. Later XP/level gains and discovery of another mastery do not repeat the beat.

The Codex milestone catalog in `src/data/milestones.js` names this milestone **Learning by Doing**. `getCompletedMilestones` resolves earned entries from existing completion records. It also recognizes Basic Guard's existing `progress_milestone_basic_guard` entry in `unlocks.completedRules` as **A Steadier Stance**. No separate duplicate completion state is introduced. Codex navigation remains a placeholder; the records and metadata are ready for its future page.

Critical rolls are sampled once per action outside React state updaters and supplied to the engine. The engine never samples randomness during a state update. Missing/invalid rolls give normal yields; XP is deterministic. Thresholds, XP gains, maximum levels, and critical chances are initial tuning values in the mastery definitions. The previous random-level system is replaced.

## Save compatibility

Save version is now 11. Existing conditioning effects are already stored on the player and are not reapplied on load. New combat bonuses are derived from purchased ranks in upgrades.levels. Save/load preserves purchases and active combat snapshots. Upgrades cannot be purchased during a battle, including its result screen. Gathering mastery stores levels and XP toward the next level separately. Earlier test saves keep their earned levels and start at zero XP toward the next; past action counts are not converted into XP. Invalid data normalizes safely, surplus XP carries into levels, and capped XP is zeroed. Materials and story completion records are preserved. Notifications are not saved.

Saves with existing mastery progress but no first-mastery story record receive the missing passage and completion ID once when loaded. Repeated migration does not duplicate it. If a completed passage has already aged out of the log, it is not reinserted; its Codex milestone remains earned.

## Manual QA

On 2026-11-06 (Asia/Manila), the user accepted the final XP-based mastery revision and approved Feature 30 for commit and push. The individual checklist items below were not all explicitly confirmed, so their boxes remain unchecked.

- [ ] Open Character → Upgrades on an existing save. Confirm Conditioning and Combat techniques are readable on desktop and a narrow window, with all six cards, flavor text, and costs.
- [ ] On an untrained save, the new techniques are locked with training requirements. Training with Garron unlocks Striking and Precision Drills. Learning Basic Guard unlocks Guard Drills.
- [ ] With insufficient herbs, Upgrade is disabled and the missing amount is shown. Gather enough herbs, buy one rank, and confirm the exact cost is deducted and the next rank/cost updates.
- [ ] Discover Forest Trail and Gather Wood. Each successful gather spends 2 stamina and normally grants 3 Wood plus the current mastery bonus. Critical gathers double that total and are labeled. Only the first adds its resource story passage. Gathering with insufficient stamina grants neither materials nor XP.
- [ ] At technique level 1, confirm the next rank lists Herbs and Wood separately. Having only one material is insufficient, and neither is spent on rejection. With both available, one purchase deducts both exact costs.
- [ ] Purchase an upgrade and confirm the bottom-center notification reports the new level, real stat changes, and resources spent. It disappears after seven seconds without taking keyboard focus or blocking clicks.
- [ ] Purchase upgrades in quick succession, then use/equip an item. Only the latest feedback remains; older timers must not dismiss it early. Changing the main page or opening Settings/Save/Load clears it.
- [ ] Buy Striking Drills, Precision Drills, and Guard Drills. Compare the preview with Character → Combat; each total and its Upgrades contribution should update. Start a new spar and inspect Details to confirm the same totals.
- [ ] Confirm stronger strikes and guarding in a spar. Guard Drills affects Guard, not passive Defense. Precision improves hit chance but does not guarantee hits.
- [ ] Breathing Practice improves stamina recovery while resting. Combat Guard still restores 1 stamina and Recover restores 3.
- [ ] Max a technique at rank 3. Further purchases are disabled without removing herbs. If Accuracy reaches its cap before rank 3, the preview shows the capped total and purchases with no gain are disabled.
- [ ] Save and reload after purchasing both old and new upgrades. Levels, stats, and resource amounts remain unchanged; bonuses are not applied twice and notifications are not restored.
- [ ] Keyboard navigation reaches available purchase buttons and focus remains visible. Locked/maxed states remain readable without needing hover.
- [ ] On an unprogressed save, successfully Explore, Forage Carefully, or Gather Wood. The discovery notification appears and Character → Mastery unlocks immediately at level 0, 1/100 XP.
- [ ] Gather again. The relevant XP increases by exactly 1. Normal and critical yields grant the same XP; merely hovering or clicking an unaffordable action gives none.
- [ ] At 100 earned XP, level 1 unlocks and the bar resets to 0/200 toward level 2. Further requirements double to 400, 800, and 1,600. Automated tests cover the full 3,100-gather path, so manually grinding every level is optional.
- [ ] After a gain, inspect the action preview and gather again. The reward equals base yield plus the mastery level; the gain-producing gather used the previous level's bonus.
- [ ] Switch between Explore and Forage Carefully. Both share Herb XP and the Herb bonus, while Wood remains independent. Forage's larger yield still grants +1 XP.
- [ ] Inspect the XP bar at early progress, near a threshold, and after a level-up. The numeric XP and bar agree. At level 5 it displays a full bar and Max level without further XP accumulation.
- [ ] Observe a critical gather: the popup and log report ×2 yield, including mastery bonuses. The action preview continues to show the normal reward and 10% critical chance.
- [ ] While viewing Mastery, load a save without any mastery progress. Mastery disappears and Overview is shown. Loading a progressed save makes the tab available again.
- [ ] Save/reload and switch between Main and Character. Mastery persists, notifications stay transient, and there is only one popup at a time. Existing poultice/equipment feedback still works.
- [ ] Earn the first gathering XP. The narrative beat becomes the latest Story passage alongside the Mastery unlock notice, before any level is earned. Subsequent XP and level gains do not repeat it.
- [ ] Load a save from before the story-beat addition that already has mastery progress. The missing story beat appears once; saving and reloading does not duplicate it. New/unprogressed saves do not receive it early.

## Verification

- All 86 automated tests pass, including fourteen upgrade progression tests and fifteen gathering mastery tests. Coverage includes every XP threshold through the cap, critical roll boundaries and payouts, failed-action guards, shared Herb XP, independent Wood XP, notification contents, legacy level preservation, partial XP save/load, story ordering, and durable Codex milestones.
- ESLint and the production build pass.
- Server rendering checks pass for locked, unaffordable, available, capped, and maxed cards, all six grouped cards, and Combat tab upgrade contributions.
- The user accepted the final behavior after manual testing and revisions. Exhaustive browser/layout coverage is not claimed. Resource costs, technique caps, mastery XP requirements, and critical chances remain initial tuning values.

## Future ideas

Encounters and rare encounters with configurable chances are proposed for a later feature. This feature does not roll for encounters or begin combat while gathering. Crafting, additional resource sources, and village craftspeople remain separate follow-up work.
