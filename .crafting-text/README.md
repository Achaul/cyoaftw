# Text crafting and alchemy — 013

Engine and shell `2026-10-18-013`, built from the actual installed 012 files in
`before/`. The baseline preserves the earlier text phases, goods cycle, nectar,
guide walking, Wizard starting loadout and inventory UI fixes.

## Player commands

- `alchemy`, `crafting`, `craft at alchemy table`: native recipes and work.
- `show recipes`, `show ingredients`, `show mix`, `show bowl`, `how craft`.
- `craft healing salve`, `brew healing salve`: review a known recipe.
- `prepare greenwort`, `cut greenwort`, `mince greenwort`, `mash greenwort`.
- `mix`, `add sunpetal`, `boil`, `stir`, `simmer`, `extract`, `start mix`.
- `undo mix`, `clear mix`: edit the process without spending a turn.
- `taste mixture`, `dab mixture`, `drink mixture`, `bottle mixture`, `dip dagger`.
- `discard bowl`: review disposal; `name mixture`, then `name mixture "Road tonic"`
  for a tested mixture. `brew Road tonic` replays its saved process.
- `poisons`, `brew antitoxin`, `brew <known poison>`, `experiment with poisons`.
- Poison experiments: `add nightshade`, then another ingredient, or `start mix`
  for one ingredient. `coat weapon with <poison>` uses the native coating action.

Enter one builder step per reply. Menus support `options`, `choose <number>`,
numbers, `back`, `cancel`, and `leave`. A completed choice leaves later queued
commands paused; leave the menu and explicitly `continue`. Recipe names and
ingredients with separator words can be quoted.

## Shared rules and boundaries

`craft-actions.js` supplies explicit callback metadata, shared menus,
current-cost confirmations, naming, dipping, and scene/work guards.
`craft-commands.js` interprets typed intents and selects those callbacks.
`build.cjs` annotates existing native menu callbacks and guards native work;
it does not implement a second crafting rules engine or scrape button labels.

Brewing/process/poison/antitoxin/disposal uses a numbered confirmation on both
normal and text controls. Resource/time quotes are free and must still match
when answered. Explicit player confirmation is required; AI plans and queued
choices cannot approve it. The existing native costs, yields, rolls, automatic
preparation and failure consequences remain authoritative.

Table work requires a visible table and a safe, available actor/room. Poison
lists and coating retain their normal availability away from the table. Hidden
materials, notes, vials and tables are excluded by shared native selectors.
Drafts belong to their original scene. Menus retain exact source/item/knowledge,
bowl, draft, player and room references. Native actions recheck after time and
asynchronous design generation, preserving committed costs/effects while
rejecting remote rewards and stale design caching. Old async requests cannot
release a newer request's pending state.

The semantic `cyoa:output` seam publishes public shared choices, known recipe
and visible ingredient/bowl views, plus non-displayed `craft` quote/result
metadata. Unknown mixture effects/design data remain hidden. Existing native
narration describes consequences; future TTS must select one presentation where
narration, refreshed menu text and metadata overlap. No speech/audio provider or
microphone input is added.

## Verification

From `C:\Git\CYOAFTW`:

```powershell
node .crafting-text/build.cjs
node .crafting-text/check.cjs
node .crafting-text/browser-crafting.cjs
node .crafting-text/browser-reading.cjs
node .crafting-text/browser-goods.cjs
node .crafting-text/browser-jobs.cjs
node .crafting-text/browser-smoke.cjs
```

All 34 regression suites pass, including 13 new crafting tests, along with the
four required SFW syntax checks. The crafting browser flow verifies real native
and typed confirmations, costs, hidden materials, preparation, process editing,
unknown bowl output, testing/bottling/drinking/dipping, naming/replay, poison,
coating, antitoxin, stale table/quote and delayed moved-scene rejection, queue,
desktop/mobile and input focus. The inherited reading, goods and jobs workflows
pass. The broad gameplay smoke check passed on rerun after an intermittent
companion equipment assertion; failure diagnostics now include the current
public events and gear. Browser runs block external requests and use controlled
AI design responses; live Perchance AI remains an in-game verification step.
Desktop/mobile crafting screenshots were inspected.

The build checks protected integration slices and exact shell script tags/order.
Ship the engine and shell together. Before installation, reconcile with current
development hashes; never replace newer edits with an old build.

## Remaining coverage

This phase covers alchemy and poison work. Forge, enchanting, relic fusion,
clothier commissions, training, notices, shrine dedication and general
environment fire/spell/liquid interactions still need their own adapters.
See [TEXT_MODE.md](../TEXT_MODE.md) for the full coverage and future TTS contract.
