# Basic goods cycle and clothier dismantling

Engine/shell `2026-10-18-011`, based on current development 010, including later
starting-spellbook and guide fixes. No new production dependencies. Shell changes
its version only; the build verifies protected routing and script-tag order.

Every game day eligible generated vendors sell up to three ordinary useful goods
to background customers with a 24g daily spending budget. They convert up to 40
units of junk directly to coin at 25% of full unit value, minimum 1g. Junk includes
the explicit `junk` flag/tag and existing vendor-junk classifier. Protected goods
are excluded first. Goods sold by the player stay at least one full game day.

Every two processed days suppliers deliver up to four missing units, toward
targets of three per tailoring material, one per garment, or two per other
commodity. Deliveries cost the vendor coin; there is no stock or purse reset.
The starting pool rotates through the vendor's specialties. Every fourth day has
a 35% chance of one additional role-appropriate item, subject to funds, duplicate
names, and stock limits (36 rows / 60 units). A penniless empty shop needs proceeds
from player purchases/sales or other business before it can afford deliveries.

Clothiers can dismantle one old damaged garment per day into existing tailoring
materials for resale. The same recovery function powers the player service:
**Clothier services → Dismantle clothing**, or `dismantle <name>` while engaged
with a clothier. A registered picker/confirmation uses the same callbacks for
buttons and text. Accepting destroys one carried, unworn, empty garment, charges
the exact fee and one turn, and returns materials. Overflow is placed on the floor.
`options`, `choose`, `back`, `cancel`, `leave`, and explicit `continue` are supported.

Optional `composition: [{ material: "linen", units: 3 }]` data uses existing
`CLOTHIER_MATERIAL_TEMPLATES`. Recovery accounts for condition and preserves 80%
of usable sections (one small piece minimum), with a 75%-of-input-value ceiling
and 12-unit output cap. Supported clothier templates declare their composition.
Old garments fall back to generic cloth/leather; names do not invent silk.
Unsupported explicit components yield nothing. Bags and magical/special items
are outside this first service.

State saves as `npc.goodsCycle`, with acquisition dates keyed by loot UID. Old
saves initialize without historical turnover or replacing inventory. Catch-up
processes at most three days and consumes the full elapsed interval, preventing
repeat farming. Closing hours defer until opening. Active NPC interactions,
combat and party decisions pause turnover; companions, guides, unavailable NPCs
and skirmishes are excluded. Protected special goods include keys, quest items,
hidden/equipped items, containers, magical/lore goods and items worth over 100g.
Existing infinite healer stock, cellar deliveries, special bags and other native
services keep their rules.

`goods.js` owns the extension points: recovery/composition, supplier pools,
eligibility/protection, stock limits, acquisition grace, timing and public supply
summaries. `commands.js` contains shared dismantling actions and text adapters.
`show market` / `show supply` / `show deliveries` review public business summaries.
Service quote/result events use `kind: "service"` with structured materials. They
overlap choices/native narration; future speech must select one presentation.

Deferred: named NPC shopping, gathering/production chains, dynamic scarcity
prices, caravans, crafting new garments from recovered inputs, generalized
smelting/alchemy production and automatic sale of protected specialty goods.
Background customer purchases and supplier sales represent the wider economy.

```powershell
node .goods-cycle/check.cjs
node .goods-cycle/browser-goods.cjs
node .goods-cycle/browser-smoke.cjs
node .goods-cycle/browser-jobs.cjs
```

Reproduce with saved inputs after installation:

```powershell
node .goods-cycle/build.cjs .goods-cycle/before.js .goods-cycle/before.html
```

Install the tested pair only after checking both original hashes in
`baseline.sha256` / `shell-baseline.sha256`. Reconcile newer development edits
before rebuilding/applying. Do not rebuild an older feature snapshot over 011.
