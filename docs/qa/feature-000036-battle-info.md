# Feature 36 — Battle Info

Branch: `codex/feature-000036-battle-info`

## Scope

Replace the top-right Details button with Info, opening a shared enemy/party inspector. Clicking a party portrait opens a dedicated personal profile with larger CSS silhouette art and that member's details. It has no enemy/party roster; the top-right Info inspector remains the shared overview. The old Details badge is removed, with a subtle hover/focus cue instead. Selection uses stable combatant IDs. The default Info target is the enemy; the modal retains native focus trapping, Escape dismissal, and focus return to its trigger.

Show actual combat vitals, Attack Power, Defense, Guard Power, Accuracy, Evasion, Critical chance, physical hit chance against the current opponent, active effects, and current enemy intent. The prologue's scripted hits are labelled guaranteed; sparring uses the engine's existing hit-chance calculation. Only supported resources appear. Completed battles retain stats but omit a next move.

No save-format, combat-balance, progression, or reward changes. The roster accepts a list of party members for future use, but the current encounter still has one playable member. With multiple supplied members, enemy hit chance is omitted until a target is known; player hit chances explicitly name the enemy.

## Manual QA

- [ ] In a normal spar, top-right Info replaces Details and opens with Garron selected. Check HP and combat stats; no invented stamina/mana bars. Select the player and compare values to the portrait and current battle state.
- [ ] Close Info with Close and Escape. Focus should return to the trigger; no turn or stamina should be consumed. Click the player's portrait: their dedicated profile opens with art on the left and their statistics on the right, without the roster selector. The name and Party Member · Leader label are shown. Close and confirm focus returns to the portrait. The Info overview still opens on the enemy. Switching targets works by mouse, Tab, and Enter/Space.
- [ ] During turn playback both Info and portrait inspection remain disabled. After damage or recovery, reopen and confirm updated vitals. Battle Log, gear options, and combat commands work as before.
- [ ] During Astraea's tutorial, Info shows the Fragment of Chaos by default; the portrait profile shows Astraea's name, Party Member · Leader role, art placeholder, and HP/ST/MP. Physical hit chance says Guaranteed (tutorial), including while the fragment has increased evasion.
- [ ] After Astral Ward, enemy Info shows Evasive. After Guiding Star, Astraea's Info shows Guiding Star. After the guided strike, both effects disappear. The intent text matches the enemy's current hint.
- [ ] End a spar and inspect: stats remain readable, but no upcoming enemy intent appears. The prologue's Reach the Seal modal still appears after the final dialogue.
- [ ] Check desktop and narrow/short windows. The roster and stat panel should stack cleanly, long names should wrap, and Close should stay accessible when scrolling.

## Validation

- All 158 automated tests pass, including five new tests for combat snapshots and non-mutation, real resource availability, directional hit chances, tutorial effects/guaranteed hits, ended battles, distinct supplied party members, and explicit leader roles.
- ESLint and production build pass.
- Server-render checks cover the Info button, dedicated portrait profiles, exact member selection and roles, enemy/player/default overview selection, meter counts, live effects, a six-member roster, and absence of undefined stat values.
- The user accepted the visual result on 2026-11-08. Individual browser checklist items above are not recorded as exhaustively verified; render checks are not browser interaction tests.
- The user authorized commit and push on 2026-11-08. Final build, lint, and all 158 automated tests pass.

Profile refinement: the current player defaults to Leader; supplied future members can explicitly set isLeader. This is presentation metadata, not a new leadership mechanic. Profile and overview use the same read-only stat component and selector. Placeholder art uses CSS only. Server-render checks verified current buffs/vitals, two-/three-meter profiles, distinct companion selection, absent Details badges, disabled portrait controls during playback, and the unchanged enemy-first Info overview.
