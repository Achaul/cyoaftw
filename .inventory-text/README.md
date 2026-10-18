# Inventory text commands

Engine and shell version: `2026-10-18-004`. The combined player guide, architecture, and TTS handoff are in [TEXT_MODE.md](../TEXT_MODE.md).

This folder records the inventory 004 snapshot. The latest build, including trading, loot and hidden-item searches, is in [.party-text](../.party-text/README.md). Use that build for further command work.

This build extends the installed combat-text 003 baseline. Core commands are `inventory`, `equipment`, `examine <item>`, `equip <item>`, `unequip <item>`, `drop [amount|all] <item>`, `drink <item>`, `eat <item>`, and `take <floor item>`. `show inventory`, `show equipment`, and `show floor` provide lists. `use <consumable>` infers drinking/eating locally; exact combat abilities take priority. Aliases and contextual help live in `commands.js`.

`inventory-commands.js` resolves public names, quality words, simple plurals, ordinals and location qualifiers. Ambiguity asks a numbered question and retains actual item/source references. Each execution rechecks the source, quantity, visibility and eligibility. Existing handlers own equipment slots, storage, item effects, empty containers, pickup refusal and combat turn costs. Inspection prints existing descriptions/stats/comparisons without opening a card. Inventory lists, inspection, and item questions include structured output metadata for future TTS; no audio is generated.

Potions, alcohol and healing herbs/tonics use their normal combat handlers and narration completion. Ordinary supplies are blocked mid-fight; mana potions require a mana pool. Equipment controls remain free. Floor pickup requires exploration and uses the existing whole-stack handler. Container transfers/search, trade, gifts, reading and crafting retain their normal controls.

Build and verify from `C:\Git\CYOAFTW`:

```powershell
node .inventory-text/build.cjs
node tests/inventory-text.test.cjs .inventory-text/cyoaftw-engine-CORE.js
node .inventory-text/browser-smoke.cjs
node .inventory-text/check.cjs
```

All 11 new tests pass. The full SFW browser test covers inventory workflows, real combat consumables and previous text/combat flows on desktop/mobile, with external requests blocked. The full regression run passes 22 suites; the unchanged job-board harness still lacks `getJobBoardWindowBlockReason`.

The build replaces only the command adapter block and explicit version/changelog strings. All game handlers, guarded integrations and shell script tags/order stay intact. `before/` captures the installed 003 engine and shell. Reconcile later development changes before reapplying this build; older phase builds omit inventory commands. Copy the tested engine and shell together to `C:\Git\CYOADEV` with guards against unexpected target changes.
