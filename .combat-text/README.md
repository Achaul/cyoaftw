# Combat text commands

For the combined text-mode guide and TTS handoff, start with [TEXT_MODE.md](../TEXT_MODE.md).

This folder records the combat 003 snapshot. The latest build, including inventory, trading, loot and hidden-item searches, is in [.party-text](../.party-text/README.md). Use that build for further command work.

Engine and shell version: `2026-10-18-003`. Builds on the installed text-mode foundation without changing combat damage, turn order, or resource rules.

## Commands

- `show` lists current actions in combat and exploration. `show attack`, `show abilities`, `show spells`, `show targets`, and `how second wind` provide focused help.
- `attack with light hit to head`, `attack head light`, and `light head` resolve to the same light head strike. `heavy head` is combat shorthand. Defaults are balanced style and torso target.
- `use second wind` and `second wind` use the same ability. Named spells, powers, maneuvers, stances, rogue abilities, enchantments, and devised techniques use their existing combat callbacks and availability rules.
- `target second dwarf` changes opponent for free. `attack dwarf female heavy head` can select a specific standing opponent. `attack <npc>` can initiate combat from exploration; shorthand cannot start a fight.
- `defend`, `guard`, `counter`, `escape`, `talk them down`, and `bandage wounds` use the corresponding combat actions. Healing powers that offer an ally picker also offer numbered text choices.
- Combine rounds with `then`: `second wind then heavy head`. `stop` cancels pending actions. `continue` explicitly resumes a paused batch.

## Shared definitions and vocabulary

`commands.js` contains the general command registry. Its IDs are canonical primary verbs, with optional `primary` overrides and aliases.

`combat-commands.js` contains `TEXT_COMBAT_KEYWORDS`: primary combat verbs, style aliases, body-part aliases, ability aliases, and filler words. Shorthand requires combat context and a recognized leading style/body keyword. Unknown phrasing uses the bounded, validated AI fallback.

`combat-actions.js` defines semantic action descriptors with a primary command, aliases, label, availability, callback, and optional target choices. The build turns the existing combat menu definitions and enchanting/rogue/synergy builders into shared action data. Both the normal buttons and text commands consume that data. Adding a learned action to these builders makes its primary name available to the command adapter and `show` without duplicating its game rules.

Normal combat button groups are hidden in text mode. A Text mode button in the normal combat menu lets the player switch during a fight; the dock's return icon restores those controls. Other interaction submenus remain available when needed. Inventory consumables still use the inventory controls.

## Queue and output

Each action rechecks current eligibility and anatomy. Cooldowns, insufficient resources, missing techniques, and late handler rejection pause the queue. Pending rounds wait for combat narration completion or a click to skip it. Automatic retargeting, reinforcements, incapacitation, and combat ending pause remaining commands. Slow AI plans and clarification choices are rejected after changes to the player, room, opponent, combat round, or foe roster.

Combat narration emits semantic `cyoa:output` events with kind `combat`, excluding debug rows, for a future TTS renderer. No audio is generated.

## Verification

- Build: `node .combat-text/build.cjs`
- Combat tests: `node --test tests/combat-text.test.cjs`
- Existing text tests: `node tests/text-mode.test.cjs .combat-text/cyoaftw-engine-CORE.js`
- Browser integration: `node .combat-text/browser-smoke.cjs`
- Full regression suites: `node .combat-text/check.cjs`

The browser check uses the real SFW engine locally, blocks external requests, and verifies combat entry/return, attack variants, Second wind and cooldowns, queued narration, and desktop/mobile layouts. AI interpretation uses controlled responses in the tests; live Perchance AI remains an in-game verification step. The unrelated job-board VM harness failure from the baseline remains documented in the prior text-mode work.

The build checks that conversation routing and all original script load tags/order remain intact.
