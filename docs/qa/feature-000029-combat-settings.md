# Feature 29 — Combat pacing and accessibility

Branch: `feature/000029-combat-settings`

## Scope

Settings opens a compact native dialog from the adventure header (including Character) and the battle header. It supports keyboard navigation, Escape, focus containment, and focus return through the existing overlay component.

- Combat pacing: Slow (5–6 seconds per message), Normal (3–4 seconds), Fast (2 seconds). Move announcements and turn transitions use the lower end of each range; damage and outcomes use the upper end. Settings displays these reading times. Every message and vitals snapshot remains in sequence. Each exchange captures its pacing when selected; Settings is disabled during playback, like Save/Load/Reset.
- Battle motion: Reduced or Full (default). Reduced removes portrait/enemy shakes, flashes, lunges, battle entrance/message animations, meter transitions, and command sliding. Text, damage, and focus highlights remain visible. Motion is controlled solely by this setting. Previously stored Follow device preferences fall back to Full while preserving combat pacing.
- Preferences persist automatically in this browser, separately from game saves. Loading, resetting a character, or deleting game saves preserves preferences. Restore defaults returns to Normal / Full. A preference write failure keeps the current session choice and shows a persistence notice.

No combat rules, random rolls, rewards, save version, or story log reading behavior change. Story text reveal speed remains future work.

## Manual QA

The user confirmed the revised message timings felt right and approved Feature 29 for commit and push after removing Follow device. The remaining checklist is not individually confirmed.

- [ ] Open Settings from Main and every Character tab. Confirm the dialog is compact and readable, including on a narrow screen.
- [ ] Navigate with Tab / Shift+Tab; focus stays inside. Escape and Close dismiss it and return focus to Settings.
- [ ] In a spar, compare Slow (5–6 seconds per message), Normal (3–4 seconds), and Fast (2 seconds) using attacks and recovery. Every pace preserves narration order and matching HP/ST changes.
- [ ] During playback, Settings and commands stay disabled. After the exchange, commands return; one selection still resolves only one turn.
- [ ] Set Reduced and attack/take damage. No shakes, flashes, lunges, message slides, or meter animation. Command hover keeps its highlight without moving sideways.
- [ ] Set Full and confirm battle effects return. Confirm only Reduced and Full are offered, independent of the device motion setting.
- [ ] Reload after changing preferences; choices remain. Load another save and reset the current game; preferences remain.
- [ ] Restore defaults returns Normal / Full without changing game progress or deleting saves.
- [ ] Finish or end a spar; Settings remains available on the result and adventure screens.

## Automated verification

Preference tests cover malformed data, storage failures, persistence independent of save slots, motion preference resolution, and message reading times. Existing combat tests cover immutable turn resolution, frame order, vitals, save compatibility, and complete spars. UI interaction and visual checks above remain for manual QA.
