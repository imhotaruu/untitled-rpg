# Feature 27 — Main page readability QA

Branch: `feature/000027-main-page-readability`

Locations sit on the left, Actions and Story share the center equally, and the player sidebar stays on the right. The Action Log spans the center below them. Story is the narrative history; there is no separate Current Scene or objective tracker. Action previews show known effects and costs, without revealing future milestone thresholds.

Automated validation passed: ESLint, production build, 31 tests (item feedback, training armor, and story-history updates), server rendering for all five locations, and a reader-position check using simulated element geometry. The user reviewed and approved the final layout for commit on 2026-11-05. Full checklist completion has not been separately confirmed.

Use an existing save for comparison. Save progress before testing one-time rewards or resetting a game.

## Layout and reading

- [ ] At desktop size, the location heading and flavor text sit above a horizontal divider. Below it, Actions occupy the left half and Story the right half.
- [ ] Story appears only once. The Action Log spans the full center width underneath.
- [ ] The sidebar starts with player name and level, without a Quick status title. Status bars, resting state, Gold, and discovered resources remain visible.
- [ ] Text wraps naturally, and both action details and long story history remain reachable by scrolling their sections.
- [ ] At narrow widths and 200% zoom, panels stack without horizontal page scrolling. Story retains a bounded, scrollable reading area.

## Actions and discovery

- [ ] Actions appear as compact buttons. Hover or keyboard-focus one to preview its description, cost, rewards, and known progress effects in the shared detail panel.
- [ ] Hover and focus never perform an action. Click or Enter/Space performs it once.
- [ ] Practice with Garron shows its stamina cost and Combat Training gain, but no future milestone target. There are no exploration counters or next-step instructions elsewhere on Main.
- [ ] Travel changes the location, description, category, and available actions, and clears the previous action preview.
- [ ] Explore and Forage Carefully spend/grant the same amounts as before. Insufficient stamina produces an Action Log message and no reward.
- [ ] Rest disables its button while active and updates the sidebar. Recovery, completion, and interruption by travel or another action behave as before.
- [ ] Training unlocks, Basic Guard, and the one-time armor reward still work. Claimed one-time actions and their outdated previews disappear.
- [ ] Forest Trail, once discovered, shows its no-actions message and still allows travel elsewhere.

## Story

- [ ] Narrative passages appear newest first. The first passage has a Latest label and a subtle highlight; earlier passages remain readable below it.
- [ ] At the top of the reader, triggering a new story displays the newest passage immediately.
- [ ] Scrolling into older passages immediately shows Jump to latest, even without a new story event.
- [ ] While scrolled down, trigger a story event: the visible passage stays at the same reading position, and Jump to latest gains a small unread dot. Its tooltip and accessible label say New story available.
- [ ] Jump to latest scrolls to the newest passage, focuses the reader, and clears the notification. Manually scrolling to the top also clears it.
- [ ] Repeated actions that produce no new story, and background recovery ticks, do not move the reader or show a false new-story notification.
- [ ] Action Log scrolling and Story scrolling are independent. Performing an action returns Action Log to its latest result without pulling Story away from an older passage.
- [ ] Scrolling down in Action Log changes its header control to Jump to latest. Clicking it returns to the top and focuses that log; manually scrolling back to the top restores Newest first.
- [ ] In both headers, Newest first and Jump to latest use the same snug control dimensions. The unread dot does not change its size. Scrolling between states does not change header height, wrapping, or reader position; at the top the control is disabled.
- [ ] Both readers are keyboard reachable with visible focus. Empty story history has a clear placeholder.

## Navigation and persistence

- [ ] Main and Character navigation work. Story, Relationships, Party, and Codex navigation placeholders remain visibly marked Soon.
- [ ] Save, Load, and Reset open their existing dialogs. Canceling leaves progress intact.
- [ ] Save and reload: location, progression, resources, equipment, and stored narrative/action entries remain intact. Loading unrelated story history returns the reader to its newest passage.
- [ ] The Character page still has plain Overview stat rows, visible profile details, grouped combat stats, upgrade flavor text, and selectable inventory cards.

The existing story-history retention limit and save format are unchanged. This feature changes presentation, not narrative content or gameplay rewards.
