# Feature 28 — Turn-based combat foundation

Branch: `feature/000028-turn-based-combat`

## Scope

A repeatable, nonlethal spar with Garron at Stonefield House. It unlocks alongside Basic Guard, after the initial training action and five practices. Eligible older saves gain the action when loaded.

Selecting the spar opens a centered confirmation dialog. **Not Yet** or Escape closes it without starting combat; **Proceed to Battle** starts the encounter and opens a dedicated combat screen. The native modal keeps keyboard focus inside and makes the underlying adventure inert. Normal resting ticks may continue until the battle actually starts.

The player acts first. Selecting a move returns to the root command menu and plays the round in stages: player move announcement/action motion, player impact and damage reaction, a short enemy-turn pause, enemy move/action motion, then enemy impact. Vitals change alongside the matching event. The stage shows one message at a time; stamina costs remain on commands and are omitted from move narration. Commands, End Spar, Details/Log, and Save/Load/Reset are disabled during playback to prevent overlapping turns. Once it finishes, the completed round is committed and controls return. No turns advance while choosing a command.

The dedicated screen uses an atmospheric enemy stage, a bold command menu at lower left, and a centered party portrait strip. **Battle Log** opens the full history and **Details** opens combat stats. Clicking the player's portrait also opens Details. Native overlays support Escape, contain keyboard focus, and restore it when closed.

The portrait strip renders only present party members and centers the group. This spar supplies one member, the player; there are no empty slots or explanatory subtitle. The presentation supports larger groups (including four or six), wrapping on small screens, but does not add allies or party mechanics. Portraits and the enemy use simple CSS silhouettes; no generated artwork or external art is used. Actual HP loss triggers a brief shake/flash on the damaged portrait or enemy. Misses and fully blocked attacks do not. Save/Load/Reset remain in the header. Location navigation, adventure stats, and regular logs are absent. Entrance/message transitions and hit reactions respect reduced-motion preferences. **Return to Adventure** restores Main; sparring results go to the Action Log.

Commands are grouped: **Attack** opens physical moves (Strike and Heavy Strike), while Guard and Recover remain direct commands. Entering a menu or going Back does not take a turn. **Items** lists owned consumables and quantities for reference; items remain unusable in this practice bout. **Magic** is a mana-based category shown as a disabled **???** until `unlocks.systems.magic` is true, then outlined blue. There is no magic unlock event or learned-spell system yet, so an unlocked Magic menu currently says no spells are learned. Existing default MP alone does not unlock magic.

Sparring snapshots the player's equipment-derived stats and starts with separate full health and stamina. Adventure health, stamina, inventory, resources, training, and story progression are preserved. Starting a spar interrupts resting. There are no rewards or lasting injuries. Travel, character changes, ordinary actions, and regeneration are blocked until the result is dismissed. Save, load, and reset remain available.

This feature does not yet implement Astraea's prologue, divine characters, multiple playable party members, bonds/cooperation, magic, combat consumables, or combat rewards. Initiative, Focus, and Resolve remain reserved stats. This first encounter deliberately gives the player the opening move.

## Combat rules

- Attack: costs 1 sparring stamina, uses 100% Attack Power.
- Heavy Strike: costs 3, uses 160% Attack Power with the same hit chance.
- Guard: free, restores up to 1 stamina, adds Guard Power to defense for this turn only.
- Recover: free, restores up to 3 stamina; the enemy still responds.
- End Spar: leaves immediately, with no enemy response or penalty.
- Garron's repeating intentions: measured strike, wind-up (no attack), heavy strike, catching breath (no attack). The upcoming intent is visible before each choice.
- Hit chance: Accuracy minus target Evasion, clamped to 5–95%.
- Critical hits multiply attack power by 1.5 before defense.
- Damage: floor(Attack Power × move multiplier × critical multiplier) minus Defense; minimum 1 normally, minimum 0 while guarding after subtracting Guard Power.
- Stamina restores cap at maximum. Invalid/unaffordable commands do not consume a turn or change random rolls. Defeated combatants do not act.

## Save compatibility

Save version is now 9. Old saves start without a combat encounter. New saves preserve combatants, resources, round, outcome, history, and random seed. The next identical command after load resolves identically. Invalid encounter records are discarded without changing adventure vitals. Combat history keeps the latest 50 rounds.

## Manual QA

On 2026-11-05, the user tested the final sequential turn playback, confirmed it worked, and approved Feature 28 for commit and push. The full checklist below was not individually confirmed, so its boxes remain unchecked.

- [ ] With an existing Basic Guard save, reload and visit Stonefield House. **Spar with Garron** appears.
- [ ] With a fresh game, sparring is absent until **Train with Garron**, then five **Practice with Garron** actions unlock Basic Guard.
- [ ] Equip the Training Stick and training armor, then select the spar. A centered confirmation appears before any encounter starts. Choose **Not Yet**, then repeat using Escape: both stay on Main, restore focus to the spar action, and add no combat log or costs. Normal resting ticks can still occur.
- [ ] Open the confirmation using the keyboard. Tab/Shift+Tab stay inside; background navigation cannot be activated. Choose **Proceed to Battle**: the dedicated screen opens with a centered enemy, upcoming intent, latest turn message, bold lower-left commands, and centered party portraits below. Locations, adventure sidebar, regular navigation, and Action/Story Logs are absent.
- [ ] Only the present player portrait appears, centered with live HP/ST. No empty positions or HP/ST subtitle appear. The active portrait's gold outline disappears when the spar ends.
- [ ] **Details** and the player's portrait open live sparring health/stamina plus Attack Power, Defense, Guard Power, actual hit chance against Garron, Evasion, and Critical Chance. Enemy health remains on the stage. Escape or Close returns focus to the trigger without taking a turn.
- [ ] Both sparring vitals start full even if adventure health/stamina are low. The practice notice explains that these are separate vitals.
- [ ] **Attack** opens only physical attacks, with **Strike** (1 ST) and **Heavy Strike** (3 ST). Opening/backing out of a category never consumes a turn. Selecting a move resolves one turn; waiting does nothing. Back or Escape returns focus to the category.
- [ ] Selecting Strike or Heavy Strike immediately returns to **Commands**, then narrates/animates the exchange in order. Health drops only with the corresponding impact message, after its move announcement. The enemy-turn pause is readable. Move announcements omit stamina cost.
- [ ] Extra clicks, held Enter, or rapid key presses during playback never queue another turn. Commands, End Spar, portrait/details/log, and Save/Load/Reset stay disabled until the round finishes. Root-menu keyboard focus returns afterward.
- [ ] A finishing blow ends playback with the outcome and no enemy move. Misses do not shake the target; Guard/Recover and enemy wait turns have their own messages. End Spar remains immediate when no move is playing.
- [ ] **???** is disabled while magic is locked. The future `unlocks.systems.magic` flag exposes blue **Magic**, whose menu currently reports no spells learned. Default MP alone does not reveal it.
- [ ] **Items** shows owned consumables and quantities, omits equipment/key items, and explains that they cannot be used in the spar. Entering or leaving it changes no inventory or combat state.
- [ ] Garron's visible intentions match his next response. Wind-up and catching breath cause no attack; heavy strike is stronger than measured strike.
- [ ] Guard mitigates this turn's attack and restores at most 1 stamina. Recover restores at most 3. Neither exceeds maximum stamina.
- [ ] When stamina is too low, unaffordable attack buttons disable and free moves remain usable.
- [ ] Win a spar; no final enemy attack occurs. The result remains visible until **Return to Adventure**. Main returns to the same location. Repeat the spar; confirmation appears again.
- [ ] Lose a spar or use **End Spar**. Adventure health, stamina, items, and resources remain unchanged. No reward is granted for any outcome.
- [ ] Travel and Character navigation are absent during the encounter and result screen, then restored on return. Resting does not regenerate while sparring.
- [ ] Save mid-spar, make a move, then reload. Health, stamina, intent, log, and turn restore; repeating the same move reproduces its result. Refresh also resumes the last saved encounter.
- [ ] Load a combat save from the Character page or refresh with that save selected: it resumes directly on the dedicated screen without another entry confirmation. Load an older noncombat save: normal actions return. Save/load a finished result as well.
- [ ] **Battle Log** opens the full round history. Scroll away from the top: **Newest first** becomes the snug **Jump to latest** control without shifting spacing. Close, make a move, then reopen: the newest round is at the top. The stage message also updates. Return restores the regular Story panel and Action Log.
- [ ] Use Tab/Shift+Tab and Enter/Space. Up/Down/Home/End navigate enabled battle commands without acting. Descriptions and the command cursor follow focus. Start/result headings receive focus, and **Return to Adventure** returns focus to the spar action.
- [ ] Command buttons slide only while hovered and realign when the pointer leaves, even after clicking. Keyboard focus remains visible without a persistent slide.
- [ ] Actual HP loss shakes/flashes the affected player portrait or enemy silhouette briefly. No hit reaction occurs on a miss, fully blocked strike, or initial screen mount. Rapid turns remain usable.
- [ ] Details and Battle Log trap keyboard focus and block background moves. Escape/Close restore focus. History remains accessible after victory, defeat, or End Spar.
- [ ] At narrow widths, stage, party, commands, and descriptions stack without horizontal overflow; portrait cards wrap. On shorter desktop windows, the battle screen can scroll to reach the dock. History scrolls inside its overlay.
- [ ] With reduced motion enabled, entrance/message animations, command transitions, action motions, and hit reactions are skipped. Ordered narration and its reading pauses remain.
- [ ] Character Overview, Combat, Upgrades, and Items all show the same live status/resources sidebar as Main. Resting, consuming items, and buying upgrades update it immediately. On narrow screens it stacks above Character content; the dedicated battle screen still omits it.
- [ ] Action outlines identify their purpose: crimson for **Spar with Garron**, battle confirmation, Attack/Heavy Strike/Guard; green for Rest/Recover; gold for **Continue Story**; white for ordinary actions. Hover/focus preserves each category color, while disabled actions remain visibly muted. Training and collecting armor stay ordinary actions even when they add story passages.

## Automated verification

- `node --test tests/*.test.mjs`: 52 passing tests covering combat, ordered playback snapshots, existing item feedback, story history, and equipment regressions.
- `npm run lint`: passed.
- `npm run build`: passed.
- Server-render smoke checks for active/result screens, locked/unlocked magic categories, dynamically populated one/four/six-member portrait layouts, and empty-history rendering; browser appearance, hit reactions, and native dialog keyboard behavior remain for manual review.

Combat tests cover unlocks, location gates, equipment snapshots, costs, guard lifetime, intent cycles, hit/critical rules, terminal outcomes, immutability, blocked world actions, old saves, exact save/load continuation, corrupt encounter recovery, bounded history, and a full earned-loadout victory.

## Future work

The user requested adjustable combat text/playback speed and story text speed in a future feature, extending the settings to other text where useful. Current timings remain fixed for Feature 28. Upgrade revisions/additions are also deferred to a later feature.
