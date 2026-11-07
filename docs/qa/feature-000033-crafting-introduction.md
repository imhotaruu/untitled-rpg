# Feature 33 — Crafting introduction and quest tracking

Branch: `feature/000033-crafting-introduction`

## Scope

One introductory quest from Rowan, one starter recipe, separate Crafting and Quests pages, and persistent progress. These pages use the shared Back to Main navigation and full-width content layout. Quests is available from Main immediately, with an empty state until a quest becomes known. Crafting appears in Main's navigation only after accepting Rowan's lesson.

The existing wood-delivery favor is the prerequisite, not a second quest added to the journal. After **Bring Wood to Rowan**, **Learn Crafting with Rowan** becomes available at Village Square. Older eligible saves receive this action on load without free supplies or automatic quest acceptance.

## Quest flow

**A Shape of Your Own**

1. Accept the lesson at Village Square. Rowan grants 1 Cloth once and unlocks Crafting. Quests moves the lesson from Available to Active.
2. Gather 4 Wood, then return to Village Square to use Rowan's workbench.
3. Open Crafting and make a **Handmade Training Sword**, spending 4 Wood and 1 Cloth atomically. It enters Character → Items and the quest becomes ready to turn in.
4. Choose **Show Your Work to Rowan** at Village Square. The quest moves to Completed and grants 5 Gold once. Keep the sword, whether equipped or unequipped.

The Handmade Training Sword grants +2 Attack Power and +1 Guard Power when equipped. Compared with the existing Training Sword, that is +1 Attack Power with unchanged Guard Power. Crafting does not equip it automatically, increase gathering mastery, or cost stamina. This equipment recipe can be crafted once; repeated inputs and already-owned equipment do not spend materials.

Quest acceptance, crafting, and completion use the existing bottom-center feedback popup, Story, and Action Log. A durable completion milestone is available for the future Codex. No additional relationship stages, recipes, crafting mastery, batch crafting, random outcomes, or general quest chains are included.

## Guards and saves

Story confirmation is enabled by default in Settings → Confirm story actions. Gold-outlined actions (including quest acceptance and turn-in) show “This will advance the story. Are you sure you want to continue?” with Not Yet and Continue. Not Yet and Escape close the dialog without performing the action. Confirm executes through the existing engine, which still validates availability, costs, and once-only completion. The browser preference persists across save slots; older preferences default to On, and Restore defaults re-enables it. This user-requested addition does not change the one-time actions or the first equipment craft. Normal actions, crafting, and encounter responses do not show this prompt; battle has its existing confirmation.

Crafting requires the accepted lesson, sufficient materials, and the Village Square workbench. It is blocked during combat or an unresolved exploration encounter. The engine reads the canonical recipe by ID. Quest start and turn-in also verify the current quest stage, beyond checking action visibility.

Save version 13 adds normalized per-recipe crafted records. Quest status is derived from durable acceptance/completion action flags plus the crafted record, avoiding a second mutable quest-status field. Existing saves retain resources, inventory, exploration encounters, and progress. Loading does not replay rewards or scenes. Active, ready, and completed quest states survive save/load; reset clears them.

## Manual QA

- [ ] Village Square no longer offers the placeholder Continue Story action, including after loading an older save. Named story actions and their confirmation prompts still work.
- [ ] With Confirm story actions On, click a gold story action: see the warning before progress, rewards, or costs apply. Not Yet and Escape both cancel; Continue performs it once. Check the one-time notice for quest actions. The normal engine still rejects insufficient resources.
- [ ] Turn Confirm story actions Off: gold story actions execute immediately. Reload and switch save slots: the preference stays Off. Restore defaults: confirmation returns. Normal actions and crafting remain immediate; battle confirmation still appears independently.

- [ ] Fresh game: Quests shows its empty state and Crafting is absent from the Main navigation. Other navigation and full-width Relationships still work.
- [ ] Meet Rowan and complete their original 6-Wood favor. Quests shows **A Shape of Your Own** under Available. Village Square offers **Learn Crafting with Rowan**. An older save with the favor completed should reach this same state after loading.
- [ ] Accept the lesson: gain exactly 1 Cloth, see a Quest Accepted popup and story passage, and find Crafting in the Main navigation. The lesson appears under Active in Quests. Repeated clicks cannot grant more Cloth.
- [ ] Open Crafting with too little Wood or Cloth: see owned/required quantities and a disabled craft button explaining the missing materials. Neither resource is spent.
- [ ] View Crafting away from Village Square: see the workbench location requirement. Resolve any pending exploration encounter before crafting.
- [ ] Return with at least 4 Wood and 1 Cloth. Craft once: spend exactly those amounts and receive one Handmade Training Sword. Check its bonuses and the Item Crafted popup. The craft button now says Crafted; double-clicking does not spend more materials.
- [ ] Use View in Items, equip the sword, and compare Combat stats with the original Training Sword: +1 Attack Power, unchanged Guard Power. Equipping is optional for quest completion.
- [ ] Quests now tells you to show your work to Rowan. At Village Square, choose that action: gain exactly 5 Gold, keep the sword, and move the quest into Completed. The action disappears and cannot pay twice.
- [ ] Save/load at three points: accepted but not crafted, crafted but not turned in, and completed. Materials, equipment, quest status, and available actions must remain correct, with no repeated payouts.
- [ ] Load a pre-lesson save or reset: Crafting is hidden again, with no future recipe leaked by the locked page. Existing quests and items reflect the loaded save.
- [ ] Use keyboard navigation and check narrow/wide windows. Material rows, quest objectives, buttons, and feedback remain readable. Back to Main works from both pages.

## Validation

- 114 automated tests passed, including 10 new crafting/quest tests covering unlocks, rewards, atomic spending, duplicate protection, existing inventory/equipment, quest guards, migration, and save/load.
- ESLint and production build passed.
- Server-render checks passed for locked, available, active, ready, and completed UI states; material quantities, item bonuses, and Crafting navigation visibility were verified.
- The user accepted the feature after manual review on 2026-11-07 and authorized commit/push. Individual checklist items above remain available for future regression checks.
