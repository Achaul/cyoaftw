# Reading and study text support — 012

Based on the actual installed 011 engine/shell, including subsequent merchant, nectar, guide walking, Wizard starting spell and inventory UI fixes. All earlier features stay in `before/`; this patch does not rebuild an older command snapshot. Main guide/TTS contract: [TEXT_MODE.md](../TEXT_MODE.md).

```text
look at book
look at scroll
look at note
show readable items
read folded note
read book
read fixture wall tallies
study book of small devotions
study scroll
copy scroll to spellbook
study spellbook
learn frost shard from spellbook
options
choose 2
back
cancel
continue
```

Look inspects and lists supported reading actions; explicit read/study applies the item's native effects. Reading does not fabricate full book passages. Existing lore generation/cache and deity revelation, consumable tomes/primers/recipe notes, arcane practice/cooldowns, scroll-copy progress/mishaps and spellbook learning use native handlers and costs. Reading requires carrying the source; fixture reading keeps its original route. Shared native inventory buttons use the same descriptors and callbacks as text. Multiple spells use registered reading choices and explicit queue resumption.

`readable-actions.js` owns descriptors, inventory buttons and request contexts. `reading-commands.js` owns grammar, type/title targeting, public lists and menu projection. `build.cjs` patches the reconciled baseline in `before/`, adds optional completion guards to native handlers, and checks protected routing and shell script tags/order. Delayed lore cannot cache content/grant knowledge after source or scene changes. Timed actions keep their spent turns and any already consumed primer, and withhold progress when interrupted. Stop cancels later work while the current action finishes. Reading results carry plain semantic output for future TTS; speech playback is not implemented.

```powershell
node .reading-text/build.cjs
node tests/reading-text.test.cjs .reading-text/cyoaftw-engine-CORE.js
node .reading-text/check.cjs
node .reading-text/browser-reading.cjs
node .reading-text/browser-goods.cjs
node .reading-text/browser-jobs.cjs
node .reading-text/browser-smoke.cjs
```

Validation: all 33 regression suites, including 11 new reading tests, and the four required SFW syntax checks pass. Real SFW reading, merchant, jobs and inherited text-mode browser flows pass. Reading checks cover look/type targeting, hidden items, ambiguity/replaced references, cached and delayed lore, tome/primer effects, arcane study/cooldown, copy completion, spell choices/learning, queue resumption, normal inventory Read buttons, desktop/mobile and focus. External requests are blocked; AI replies are controlled. Live Perchance generation remains an in-game verification step. Reconcile later edits and hash-guard both current targets and staged files when installing engine/shell together.

Next: crafting/alchemy and specialised service menus, followed by remaining environment interactions and a TTS output audit.
