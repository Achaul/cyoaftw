# Text clothier services — 016

Engine and shell `2026-10-18-016`, based on the actual installed 015 files in
`before/`. Earlier text features and compatibility/UI fixes remain in that
baseline. The build verifies protected routing slices and exact script tags/order.

Talk or trade with a clothier, then use one step per reply:

```text
tailor repair linen shirt
offer 2 linen
offer 1 blue dye
request "Patch the seams and preserve the fit"
quote
choose 1
```

Other routes: `alter coat`, `reinforce tunic`, `collect tailoring`,
`pockets rucksack`, `show tailoring`, `show tailoring materials`, `how tailor`.
`repair`/`mend` is contextual: clothier work here, the existing forge route
elsewhere. `offer 0 <name>` keeps a previously offered resource; quantities
replace that resource's draft offer. Quote descriptions containing and/then.

`tailor-actions.js` supplies one set of registered normal/text menus, free request
drafts, actual quantity/textarea controls, native quote requests, public quote
projection, pocket confirmation and private source/request/job guards.
`tailor-commands.js` resolves canonical action/target intent into those callbacks.
Native quote/appraisal requests and validators still determine feasibility,
consumed units, fee, duration, permissible gains and final success/appeal.
Native acceptance, pocket and collection handlers still apply consequences.
No second tailoring rules engine, DOM-label scraping or balance changes are added.

Quotes take nothing until explicit current numbered/button acceptance. Only the
agreed material/dye units are consumed; unused offers remain owned. One garment
is escrowed for the native quoted duration following the handover turn. Splitting
a stack now creates independent nested state so repairing one piece cannot
repair the remainder; ambiguous multi-unit pieces with belongings require
separation/emptying first. Reinforcement retains wear, repair restores durability,
and alteration success/appeal/value/Charisma are appraised at collection. Any
available clothier honours the receipt. Collection is free and single-use.

Pockets retain 75g, one turn and +3 slots, once per bag/clothier pairing. Normal
and typed controls review and confirm the same worn/carried bag. Completed pocket
effects and costs stay committed on interruption.

Guards retain exact actor/provider/room/mode/source arrays, garment/material/pack,
draft/plan/quote and job/item/outcome references plus private stamps, availability,
time and funds. Hidden material/garment/pack names are excluded. Async quote or
appraisal replies reject changed scenes, actors, inputs, clocks and original job
data before caching or granting results. Committed jobs stay on the original
player after an interrupted handover. Unavailable appraisals leave safe work for
explicit retry. Per-player request tokens prevent overlap and only their owner
releases the pending state. The action queue waits for foreground completion;
decisions never automatically resume older commands.

Use `options`, numbers/`choose`, `back`, `cancel`, and `leave` (conversation).
`options` refreshes stale tailoring views at the service root. Leave the menu and
explicitly `continue` an older batch. Read-only help/show preserve decisions.
Drafts are session-only; accepted jobs persist through the normal save system.

Semantic `service` events use `provider: "clothier"` and public quote/commission/
collection/pocket data. Actual appraisal outcomes remain separate from quoted
alteration estimates. Native narration describes consequences. Future TTS must
choose one presentation where menus, quotes, narration and result metadata
overlap. Private snapshots and hidden item names are never published. No audio
provider or speech queue is implemented.

## Verification

```powershell
node .clothier-text/build.cjs
node .clothier-text/check.cjs
node .clothier-text/browser-clothier.cjs
node .clothier-text/browser-enchanter.cjs
node .clothier-text/browser-forge.cjs
node .clothier-text/browser-crafting.cjs
node .clothier-text/browser-reading.cjs
node .clothier-text/browser-goods.cjs
node .clothier-text/browser-jobs.cjs
node .clothier-text/browser-smoke.cjs
```

All 37 suites pass, including 13 clothier tests, plus four required SFW syntax
checks. The clothier browser covers typed/native request forms, quantities,
quotes/acceptance, native costs, escrow, repair/alteration/reinforcement,
collection, pockets, hidden offers, delayed quote/appraisal rejection, queue,
focus and desktop/mobile layout. Screenshots were inspected. Inherited enchanter,
forge, alchemy, reading, goods, jobs and broad gameplay browser workflows run
against 016. External requests are blocked and AI quote/appraisal replies are
controlled; live Perchance AI remains an in-game verification step.

The compact parser schema still stays within its existing size test: it groups
verbs with equal fields and omits redundant empty argument braces; `say=raw`
retains literal speech intent. Quote/appraisal AI prompts are separate native
systems and remain unchanged. No test threshold is relaxed.

Next: smithy commission-board acceptance/return and training, followed by the
remaining environment and specialist controls listed in
[TEXT_MODE.md](../TEXT_MODE.md). Ship both engine and shell using hash guards
against changed development files.
