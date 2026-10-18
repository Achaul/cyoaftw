# Body and container discovery

Engine and shell version: `2026-10-18-007`, built from the installed container/loot 006 snapshot. The latest command build adds room exploration and fixture actions in [.party-text/README.md](../.party-text/README.md). The full guide and TTS handoff are in [TEXT_MODE.md](../TEXT_MODE.md).

```text
open body
contents
search body
search chest carefully
search tight rucksack
search force chest
take ring from body
```

`open`/`contents` show only visible belongings. `loot` takes only visible loot. Search is a separate engine action shared by text commands and normal controls; it never takes the discovered belongings. Normal cards expose free Contents and three search buttons with costs.

| Approach | Stat | Stamina | Story turns |
| --- | --- | --- | --- |
| careful (default) | Willpower | 1 | 1 |
| tight | Flexibility | 2 | 1 |
| force | Prowess | 3 | 1 |

Each explicit attempt pays, including empty, failed and repeated searches. A closed fixed container first uses its normal opening action and additional turn. Locks, fire, combat/threats, incapacitation, party loot decisions, unrelated active interactions and stamina shortages block searching. After costs/time, actor/scene/source identity, source accessibility, direct membership and discovery metadata are checked again; interruptions spend costs without revealing items. New arrivals are excluded.

Direct hidden belongings use the existing flags `hidden`, `isHidden`, `concealed`, or `visible: false`. Default discovery is Willpower/DC 12. Optional `revealStat` (`willpower`, `flexibility`, `physicalProwess`) chooses the required approach; positive `revealDC` sets item difficulty. Invalid stats fall back to Willpower; invalid difficulties default to DC 12. Natural 1 fails and natural 20 reveals candidates for that approach. Set `searchable: false` for secrets controlled by their own events. Only newly revealed belongings award skill progress; repeat attempts do not farm XP. The initial body faith/story effect remains once-only.

Search does not recursively inspect nested bags, reveal hidden fixtures/floor items, identify hidden enchantments, generate new loot, or bypass normal transfers/party rules. Public carry cards, flattened owned inventory/equipment entries and sale lists hide undiscovered items. Normal saves persist revealed flags.

`commands.js` and `loot-commands.js` define the vocabulary/adapter; `search-actions.js` contains shared discovery rules. Older loot/quantity/pricing/combat helpers are embedded in `before/` and are not inputs to this build. Reconcile later active edits before rebuilding, and ship the tested engine/shell together with target hash guards. Guarded routing and original shell script tags/order are checked during the build.

Text searches publish a non-displayed `kind: "search"` result with `search: { source, kind, approach, staminaCost, turns, found: [{ name, quantity }] }`, alongside normal narration/contents output. A future speech renderer must select one presentation to avoid duplicates. No audio is added.

```powershell
node .loot-search/build.cjs
node tests/loot-search.test.cjs .loot-search/cyoaftw-engine-CORE.js
node .loot-search/browser-smoke.cjs
node .loot-search/check.cjs
```

All 11 discovery tests pass. The real-engine SFW browser check covers body/chest/carry discovery, failures/repeats, approach costs, custom difficulty, nested/script/trait preservation, free concealment, post-discovery pickup, opening once and normal search controls, plus previous text/combat/inventory/trade/loot workflows on desktop/mobile. External requests are blocked. Regression: 25 suites pass; the existing job-board VM harness omits `getJobBoardWindowBlockReason` and still fails as it did against the unchanged baseline.
