# Trading text commands

Engine and shell version: `2026-10-18-005`. The combined guide and TTS handoff are in [TEXT_MODE.md](../TEXT_MODE.md). This build is based on the installed inventory 004 snapshot.

This folder now records the trade 005 snapshot. The latest build, including containers, loot and hidden-item searches, is in [.party-text](../.party-text/README.md). Use that build for further command work.

```text
trade with merchant
show stock
examine stock sword
buy 2 health potions
show sell
sell iron sword
sell all greenwort
leave
```

`trade` uses the current NPC or asks which visible NPC to approach. Merchant/Trader roles, species, gender, public names, and ordinals can identify traders. `stock`, `wares`, and bare `buy` list goods; bare `sell` lists carried sale goods. `how to buy`/`how to sell` explain the commands. Names containing batch separators should be quoted. Numeric list rows are informational; start actions by name, then answer any numbered clarification.

The adapter calls the normal single/bulk buy/sell handlers. It prechecks the full selected quantity, payer's coins, capacity and merchant availability, with 1–100 units per command. `all` applies to one finite group; unlimited stock requires a number. Worn items and filled containers cannot be sold. Pending choices retain object/source references and a quoted price; changed goods/prices must be selected again. Failed or partial transactions pause the remaining queue, preserving completed effects. Each queued action rechecks the current merchant/scene, stock, funds, price and availability. `leave` returns to exploration. Normal trade buttons are hidden only during text trading and restored by the return control.

`trade-pricing.js` defines the exact shared sale quote, including merchant interest, favorability, reputation and the existing fence bonus. The build uses it in normal trade labels, junk-total estimates and sell handlers. Buy/sell handlers return `{ quantity, total }` on success; normal button callbacks ignore that result. Existing pricing rules, item effects, trade memory and costs are preserved.

Trade lists/questions/stock inspection include structured output for future TTS. Successful transactions also emit a non-displayed `trade` event containing actual quantity/total; existing narration still emits. Future speech must select one representation to avoid duplicates. No TTS or microphone input is added.

From `C:\Git\CYOAFTW`:

```powershell
node .trade-text/build.cjs
node tests/trade-text.test.cjs .trade-text/cyoaftw-engine-CORE.js
node .trade-text/browser-smoke.cjs
node .trade-text/check.cjs
```

All 12 new tests pass using extracted real transaction handlers. The browser test uses the full SFW engine and real merchants, stock, pricing, coins, pack space and prior text/combat/inventory flows on desktop/mobile. External requests are blocked. The regression run passes 23 suites; the unchanged job-board harness still omits `getJobBoardWindowBlockReason`.

The build preserves guarded conversation/disengagement routing and shell script tags/order. Reconcile any later development edits with `before/` before applying new payloads. Copy the tested engine and shell together to `C:\Git\CYOADEV` with guards against unexpected target changes. Older phase builds omit subsequent features.

Container transfers, gifts, crafting, reading, services, restock requests, item inquiries and sell-junk sweeps retain their existing controls.
