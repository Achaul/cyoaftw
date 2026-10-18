# Text forge services — 014

Engine and shell `2026-10-18-014`, based on the installed 013 files in `before/`.
Earlier text phases, alchemy, goods-cycle and later compatibility/UI fixes remain
in the baseline. Protected routing slices and exact shell script tags/order are
checked by `build.cjs`.

Talk or trade with a blacksmith first. Try:

- `forge`, `show forge`, `how to repair`
- `sharpen dagger with plain`, `sharpen dagger with whetstone`
- `repair sword`, `repair sword with repair rivet`, `scrap sword`
- `engrave dagger as "Road Biter"`, or select engraving then `name weapon Moonbite`
- `treat blue coat with cinderstone`, `upgrade blue coat with star ore`
- `collect forge`, `refine grade 1`
- `fuse first relic with second relic`, `recolor boots with red pigment`
- `deliver commission` for an existing accepted smithy commission.

`forge-actions.js` defines one set of normal/text menus and current-cost/risk
confirmations. Native render functions delegate to that presentation; game
consequences remain in the original handlers. `forge-commands.js` maps canonical
intents to those exact callbacks. No button-label/DOM scraping or separate rules
engine is added. Empty/unavailable services have public blocked reasons. Quote
review/cancellation is free; explicit numbered/normal-button confirmation is
required. Names accept 1–24 characters and native sanitization.

Refining consumes all visible ordinary ore of the chosen grade. Hidden materials
are excluded by the shared native selectors and consumption rules. Failure,
breakage, refunds, luck yields and native job timing remain authoritative. Armour
upgrade escrow belongs to the original player; completed collection grants its
bonus once. Quote freshness includes exact actor/NPC/scene/source/item references,
private item stamps, time, funds and jobs. Native time/async boundaries recheck
context and consumed input data; stale replies retain committed costs/effects
but cannot grant remote results. Work tokens prevent overlapping work.

Use `options`, `choose <number>`, numbers, `back`, `cancel`, and `leave` (back to
conversation). Answer one menu step per reply. Later queued commands stay paused;
leave the menu and explicitly `continue`. A queued choice/AI action cannot supply
approval. `show forge` and help preserve the current decision.

For TTS, registered `forge-*` choices use the shared menu contract. Non-displayed
`service` quote/result events contain public action/item/material/cost/time/risk
data. Result `coinChange` is the actual net player coin delta, including refunds
or rewards; `fee` remains the nominal quote. Native narration carries outcomes.
Future speech must choose one presentation where narration, metadata and refreshed
menus overlap. Private validation/hidden item data are never published. No audio
provider, speech queue or microphone input is added.

## Verification

```powershell
node .forge-text/build.cjs
node .forge-text/check.cjs
node .forge-text/browser-forge.cjs
node .forge-text/browser-crafting.cjs
node .forge-text/browser-reading.cjs
node .forge-text/browser-goods.cjs
node .forge-text/browser-jobs.cjs
node .forge-text/browser-smoke.cjs
```

The build also generates `browser-forge.cjs` from the inherited SFW browser setup
and `browser-forge-flows.js`. All 35 regression suites pass, including 14 forge
tests, plus the four required SFW syntax checks. The forge browser covers native
and typed menus/confirmations, actual fees, normal custom engraving, all forge
families, hidden ore, job timing/collection, stale quotes, delayed moved-scene
rejection, queue continuation, focus and desktop/mobile. Inherited alchemy,
reading, goods, jobs and broad gameplay browser checks also pass. External
requests are blocked and AI replies are controlled; live Perchance AI remains an
in-game verification step. Screenshots are inspected before installation.

Enchanter enchant/duplicate, other clothier services, commission-board acceptance
and return, training, shrine dedication and other environment operations remain
for later sections. Self-service grindstone/anvil fixtures also remain separate
normal controls. See [TEXT_MODE.md](../TEXT_MODE.md) for complete coverage.

Ship both engine and shell, with hash guards against changed development files.
