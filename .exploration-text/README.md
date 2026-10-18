# Text room exploration and fixture actions

Engine/shell `2026-10-18-008`, based on installed 007. The latest build adds party decisions, gifts and companion gear in [.party-text/README.md](../.party-text/README.md). Full command/TTS guide: [TEXT_MODE.md](../TEXT_MODE.md).

```text
search room
search tight room
show fixtures
examine fountain
examine fixture chest
interact with fountain
show fixture fountain
gather greenwort
mine ore vein
scavenge rubble
read wall tallies
drink from fountain
fill bottle from fountain
wash at fountain
warm up at hearth
disarm spike trap
break spike trap
pray at altar
offer at altar
enter waygate
climb stairs
sneak
case the place
```

Commands use native action handlers/eligibility helpers. Search approaches, costs/rolls, tools, gathering/mining yields, cooldowns, faith, trap consequences, inventory effects and movement retain engine rules. Reading fixture text is projected into the command log rather than a card; inventory book/study commands remain separate work. Native room search now checks the actor/scene after time/autonomy advances and excludes replaced/new/changed discovery targets. Interruptions spend costs without revealing secrets; normal search controls share this guard.

Bare `search` means the room. Named body/container search keeps direct hidden-content discovery. Room search leaves the selected loot source intact. `forage`/`harvest`, `warm up`, `wash up`, `climb`, and `hide` provide local aliases. Combat ability shorthand (including Disarm) takes priority in combat. `drink <item>` stays the consumable command; `drink from <fixture>` selects a water source/cauldron.

Only visible structural fixtures participate in lists/selection. Clarification retains fixture/source references; reordering does not retarget, and deletion/replacement/concealment/source-array/scene changes invalidate the choice. Water filling selects a current empty carried stack; stair/lift choices retain direction and destination. Public `show` views do not replace pending questions. Item/fixture name conflicts require a qualifier instead of silently selecting either. Fixture work is blocked by normal scene/danger/incapacitation/party/open-interaction restrictions.

Portal entry asks a numbered confirmation showing the current fee/destination. Recheck eligibility and the quote before calling the native asynchronous travel handler; do not allow AI to manufacture approval. Cancelled/completed trips pause later commands. The queue waits for actual travel completion.

`exploration-commands.js` contains the adapters, descriptors and public output. `commands.js` adds registry entries/parser/help/choice routing. `build.cjs` embeds these in the installed 007 baseline and checks guarded conversation/body routing and shell script tag order. Earlier combat/pricing/loot/search helpers are embedded in `before/`; older phase source edits are not inputs to this build. Reconcile future development edits before rebuilding and ship engine/shell together using target hash guards.

Semantic output adds `fixtures: [{ number, name }]`, `fixture: { name, description, actions: [{ verb, command, blockedReason, note }] }`, reading feedback with `reading: { title, text }`, and non-displayed `kind: "exploration"` completion metadata `{ exploration: { verb, fixture } }`. Future TTS should speak one result, avoiding duplicate narration/completion messages. This phase adds no audio.

```powershell
node .exploration-text/build.cjs
node tests/exploration-text.test.cjs .exploration-text/cyoaftw-engine-CORE.js
node .exploration-text/browser-smoke.cjs
node .exploration-text/check.cjs
```

All 16 exploration tests pass. The real-engine SFW browser flow verifies public discovery, inspection/help, ambiguous gathering, water filling/drinking, washing/warmth, reading without modals, trap disarm, tool-gated mining, scavenging cooldowns and cancelled/confirmed real portal travel, plus all earlier text/combat/inventory/trade/loot/discovery flows. Desktop/mobile captures pass, external requests are blocked, and there are no page errors. Regression: 26 suites pass; the existing job-board test harness still omits `getJobBoardWindowBlockReason` and fails as on the unchanged baseline.

Remaining fixture scope: crafting/alchemy, commissions, posting notices, dummy training, fire/spell/liquid manipulation, dipping/burning items and shrine dedication. Party decisions/general submenu responses remain the next command family.
