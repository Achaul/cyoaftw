# Container and loot text commands

Engine and shell version: `2026-10-18-006`. This snapshot is based on the installed trade 005 snapshot. The latest build adds paid discovery and room/fixture exploration in [.party-text/README.md](../.party-text/README.md). The complete guide and TTS handoff are in [TEXT_MODE.md](../TEXT_MODE.md).

```text
show containers
open chest
search body
contents
take 2 potions from chest
take coins from body
take all from chest
loot corpse
put 2 potions in chest
store sword in rucksack
unlock chest
pick lock on chest
force chest
close
```

Source and item ambiguity use numbered questions and actual references. A selected source supplies omitted `from` clauses; `close`, mode exit and player/room changes clear it. `show` queries do not replace pending questions or change the source selected for queued commands. Quote names containing separators/prepositions. `take <item> from floor` explicitly uses ordinary loose-item pickup while a source is selected.

The adapter reuses normal opening, search, take/store, key, pick and force handlers. Opening retains its normal turn and does not reroll opened containers. Explicit quantities default to one, with 1–100 units per group. Fixed-container/body `take all` uses native bulk actions. Capacity refusal or partial carry-container storage pauses the queue while preserving completed effects. Nested-cycle checks, party rules, coin sharing, disputes and theft consequences remain active. Party decisions keep normal controls visible and require explicit `continue` after resolution. Typed party allocation/dispute responses are future work.

Engine changes add optional quantity arguments to fixture/body inventory takes and optional structured results to carry-container transfers; normal buttons retain their existing defaults/string feedback. Public loot helpers keep hidden/concealed belongings intact during bulk collection and out of public lists. Scoped renderer hooks replace only the selected loot card with text output; guarded body/conversation routes and original shell script tags/order are preserved.

`lootSources`, `loot`, and numbered source/item choices provide public structured output for later TTS. No audio is added. The AI fallback groups verbs with matching argument shapes to keep its registry-derived parsing prompt compact.

```powershell
node .loot-text/build.cjs
node tests/loot-text.test.cjs .loot-text/cyoaftw-engine-CORE.js
node .loot-text/browser-smoke.cjs
node .loot-text/check.cjs
```

All 12 new tests pass. The full SFW browser test covers real containers/bodies, quantities, carry transfers, opening once, keys, hidden preservation, full-pack refusal, partial storage, cycle refusal, party decisions and previous text/combat/inventory/trade flows on desktop/mobile. Resolved party controls are cleared so stale buttons cannot repeat allocation. External requests are blocked. The regression run passes 24 suites; the unchanged job-board harness still omits `getJobBoardWindowBlockReason`.

Reconcile later development edits with `before/` before reapplying. Copy tested engine and shell together to `C:\Git\CYOADEV` with guards against target changes. Older phase builds omit later features. Room-wide searching, chest spells/fire controls, party decision responses, reading, gifts, crafting and other services retain their normal controls.
