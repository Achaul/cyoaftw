# Text enchanter services — 015

Engine and shell `2026-10-18-015`, based on the actual installed 014 files in
`before/`. Previous text, alchemy, forge, goods-cycle and compatibility/UI updates
remain in the baseline. `build.cjs` checks protected routing slices and exact
shell script tags/order.

Talk or trade with an enchanter, then try:

- `enchanter` or `enchanting`
- `show enchanter`, `show enchanting`, `show duplication`
- `how to enchant`, `how to duplicate`
- `enchant iron sword` or `enchant` to choose a weapon
- `duplicate crystal` or `duplicate` to choose a carried entry.

Normal buttons and commands use the same registered service/item/confirmation
menus and native handlers. Review is free; a current explicit number/`choose` or
normal Confirm button approves payment. Quotes report exact fee, quantity and
success chance. Native tiers, rolled bonuses, cap, fee-on-failure and zero-turn
costs are retained. Duplication uses the whole selected inventory entry/stack,
not a user-entered partial quantity, and still places the successful copy
directly in inventory. Only visible carried, unequipped entries can be duplicated;
enchanting also accepts the visible equipped weapon.

`enchanter-actions.js` owns shared eligibility, candidates, private state guards,
menus/quotes, public results and duplication identity repair.
`enchanter-commands.js` routes canonical action/target intents and public lists.
The native service functions still apply every fee, roll and effect. No new AI
request, balancing or service duration is introduced. Combat enchantment abilities
and inventory scroll copying keep their existing parsers.

Service quotes retain exact actor/provider/room/mode/source-array,
inventory/equipment/item references, private data stamps, funds and time. Changed
or replaced state invalidates the quote before any payment. Hidden entries are
excluded and nested hidden state is never published. AI plans and queued choices
cannot supply confirmation. `options` refreshes stale owned menus;
`back`/`cancel` navigate, and `leave` returns to conversation. Answer one menu step
per reply. Leave the menu and explicitly `continue` older queued work.

The existing duplication handler shallow-copied live item identities and nested
data. It now deep-copies saved state, renews item and container identities, remaps
embedded packed stowage references and clears the root's old external stowage.
Hidden flags are preserved. Separately assigned inventory entries are not copied
with an external pocket assignment. This fix serves both normal and typed play.

`cyoa:output` has shared numbered choices and non-displayed `service` quotes and
results with `provider: "enchanter"`. Quotes expose public fee/chance/quantity;
results expose actual success and net coin change plus any resulting public name
and quantity. Native narration describes effects. Future TTS must select one
presentation where menus, quotes, result metadata and narration overlap. Full
private item snapshots never leave the validator. No speech/audio is implemented.

## Verification

```powershell
node .enchanter-text/build.cjs
node .enchanter-text/check.cjs
node .enchanter-text/browser-enchanter.cjs
node .enchanter-text/browser-forge.cjs
node .enchanter-text/browser-crafting.cjs
node .enchanter-text/browser-reading.cjs
node .enchanter-text/browser-goods.cjs
node .enchanter-text/browser-jobs.cjs
node .enchanter-text/browser-smoke.cjs
```

`build.cjs` generates `browser-enchanter.cjs` from the inherited SFW setup and
`browser-enchanter-flows.js`. All 36 suites pass, including 13 enchanter tests,
plus the four required SFW syntax checks. The enchanter browser covers normal and
typed enchant/duplicate, costs/rolls/zero turns, equipped eligibility, whole stacks
and independent nested/container identities, public/hidden output, stale quotes,
ambiguity, explicit queue resumption, focus and desktop/mobile layout. Screenshots
were inspected. Inherited forge, alchemy, reading, goods, jobs and broad gameplay
browser checks run against 015. External requests are blocked and tests control
random outcomes; live AI fallback remains an in-game verification step.

Clothier services beyond dismantling are next, followed by remaining commission,
training, environment and specialist controls. See [TEXT_MODE.md](../TEXT_MODE.md)
for full coverage and TTS handoff. Ship both engine and shell with hash guards
against changed development files.
