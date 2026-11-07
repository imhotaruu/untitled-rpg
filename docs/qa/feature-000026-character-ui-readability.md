# Feature 26 — Character page readability QA

Branch: `feature/000026-character-ui-readability`

Automated checks passed: ESLint, production build, and all 25 existing item-feedback and training-armor tests. A server-rendering smoke check also covered all four character tabs and all three upgrades in unaffordable, affordable, and max-level states. Browser layout and interaction checks below are pending manual QA.

Use an existing save with training armor and some herbs for the fullest coverage. Save progress before testing purchases or consuming items.

## Overview

- [ ] Name and level appear first, followed by Health, Mana, and Stamina as plain current / maximum values (no bars), and regeneration rates.
- [ ] These stats use the same stacked, full-width label-and-value rows as Profile details.
- [ ] Values match the existing save and update as stamina recovers.
- [ ] Profile details always show Gender, Path, Area, and Day without an expand/collapse control.
- [ ] All seven attributes, Gold, and discovered resources remain available and correct.

## Combat

- [ ] Training shows Combat Basics, the training rank and count, and Basic Guard status.
- [ ] Offense contains Attack Power, Accuracy, and Critical Chance; Defense contains Defense, Guard Power, and Evasion; Support contains Initiative, Focus, and Resolve.
- [ ] Gear contributions appear beside their corresponding totals. Empty bonuses do not create extra rows.
- [ ] Equipping the full training armor set still adds +4 Defense and +1 Guard Power. Removing it reverses those changes.
- [ ] The note that these stats do not affect battle yet remains visible.

## Upgrades

- [ ] Each card shows its level, description, current → next value, and owned / required resources.
- [ ] Each upgrade has a distinct italic flavor line below its gameplay description. Both remain readable, including at max level and on narrow screens.
- [ ] With insufficient herbs, the card names the shortfall and disables Upgrade.
- [ ] With exactly enough herbs, Upgrade is enabled. Buying spends the correct amount, increases the stat and level once, and updates the next price and preview.
- [ ] Stamina regeneration previews show clean decimals (for example, 0.5/s → 0.6/s).
- [ ] A level-5 upgrade shows Maximum level reached, its current stat, and a disabled Max level button, with no next cost or next-value preview.

## Items

- [ ] The mannequin and inventory share the desktop width equally. All four body-slot controls still support hover, keyboard focus, selection, equipping, and unequipping.
- [ ] Equipment, Consumables, and Key Items remain separate categories. Cards show names, quantities, and slot/type or Equipped status.
- [ ] Selecting a card highlights it and reveals one detail panel beneath the grid, including its description, category, effects, and available action.
- [ ] Selecting another card replaces those details. Switching categories clears the previous selection.
- [ ] Equip from the detail panel: the mannequin, Equipped label, Combat totals, and feedback popup update correctly. Unequip from the character side and confirm Equip becomes available again.
- [ ] Use a poultice with missing stamina: quantity decreases and the popup reports actual recovery. At full health and stamina, it says Item was not consumed and quantity stays the same.
- [ ] Use the last poultice: its card and actions disappear, leaving the empty category message. No outdated Use button remains.
- [ ] Key items show descriptions without Equip or Use actions.

## Readability, keyboard, and persistence

- [ ] Check at desktop size, a narrow window (about 390px), and 200% browser zoom. Text wraps, cards stack, and every control remains reachable without horizontal page scrolling.
- [ ] Tab focus is visible. Character and inventory tabs support Left/Right arrows and Home/End; item cards support Enter/Space.
- [ ] Text and labels are comfortably readable, and selection, missing-resource, and equipped states can be understood without relying only on color.
- [ ] Save and reload. Player stats, upgrades, equipment, and quantities persist; UI selections are not saved as game progress.
- [ ] Main-page actions and story/action logs still work normally.
