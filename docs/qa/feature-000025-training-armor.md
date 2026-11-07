# Feature 25 — Training armor QA

Branch: `feature/000025-training-armor` (based on the completed Feature 24 commit).

All manual checks below were confirmed passed by the developer on 2026-11-05 (Asia/Manila). These are user-reported results. Automated validation also passed: lint, production build, and 25 Node tests.

## Fresh game: earn the armor

Use a separate save slot for QA. Save any progress you want to keep before resetting the current game.

- [x] Start a fresh game. Head, chest, arms, and legs are empty; the training armor is not in inventory.
- [x] Go to Stonefield House. Use **Train with Garron**, then **Practice with Garron** four times. The armor collection action should still be locked.
- [x] Practice a fifth time. Confirm Combat Training is 5, Basic Guard unlocks, and **Collect Training Armor** appears.
- [x] Select the collection action and check that Action Details lists the four rewards.
- [x] Collect the armor. Inventory should gain one Padded Training Cap, one Padded Training Vest, one pair of Leather Training Bracers, and one pair of Padded Training Leggings.
- [x] Check the action log for item gains and the story log for Garron's reward scene. Nothing should be equipped automatically.
- [x] Confirm the collection action disappears. Rapid repeated clicks should not duplicate rewards or the story scene.

## Equip and inspect

- [x] Open **Character → Items → Equipment**. Confirm all four pieces appear with their slot, category, and bonuses.
- [x] Click the head, chest, arms, and legs. Each slot should offer only compatible armor.
- [x] Equip at least one piece from its body-slot panel and one from the inventory grid. Both paths should update the same slot and show accurate feedback.
- [x] Hover or keyboard-focus a body region. Its label should show the equipped item. Equipped regions are green; the selected region remains gold.
- [x] Clicking either arm selects the shared arm slot; clicking either leg selects the shared leg slot. A pair counts as one equipped item and applies its bonus once.
- [x] Check the Combat tab before and after equipping the full set, without changing other equipment or training between readings: **+4 Defense and +1 Guard Power**.
- [x] Unequip each piece from its body-slot panel. It stays in inventory; the slot becomes empty and its bonus is removed. The popup reports the actual stat change.
- [x] Confirm the Training Stick, accessory slots, and poultices still behave normally.

| Piece | Slot | Bonus |
| --- | --- | --- |
| Padded Training Cap | Head | +1 Defense |
| Padded Training Vest | Chest | +2 Defense |
| Leather Training Bracers | Arms | +1 Guard Power |
| Padded Training Leggings | Legs | +1 Defense |

## Persistence and older saves

- [x] Save with armor equipped, reload, and confirm the equipment, inventory quantities, and combat bonuses persist.
- [x] After reloading a claimed reward, confirm **Collect Training Armor** stays unavailable and the scene is not repeated.
- [x] Load a pre-Feature-25 save that already has Basic Guard. The collection action should be available at Stonefield House immediately. Inventory should remain unchanged until the action is used.
- [x] Load an older save without Basic Guard. New armor slots should be empty and the reward should remain locked until Basic Guard is learned.
- [x] Reset the current game after saving the QA state. Armor slots should be empty again and the set must be earned again. Existing saved slots should remain available.

## Layout and accessibility

- [x] Inspect the armor slots and inventory in a narrow window. Text and buttons should fit, and the two sides should stack.
- [x] Use Tab and Enter/Space on body regions and armor buttons; use Left/Right arrows on inventory tabs.
- [x] Confirm bottom-center item feedback remains readable and does not block controls.

## Repeat automated checks

```powershell
node --test tests/itemFeedback.test.mjs tests/trainingArmor.test.mjs
npm run lint
npm run build
```

Armor changes derived stats only; actual combat encounters are not part of this feature. The save format version is now 8, and loading an older save adds empty armor slots without granting starter armor.
