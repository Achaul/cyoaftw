# Party decisions, gifts and companion gear in text mode

Superseded by [.jobs-text/README.md](../.jobs-text/README.md), engine/shell 010. This folder preserves the 009 phase.

Engine/shell `2026-10-18-009`, based on installed 008. This is the latest command build. Full guide/TTS handoff: [TEXT_MODE.md](../TEXT_MODE.md).

```text
show party
options
choose 2
keep it
keep the rest
give loot to dwarf female
agree
compromise
stand firm
party round robin
decide later
give sword to dwarf
companion dwarf
show companion dwarf
equip sword on dwarf
equip best for dwarf
take sword from companion dwarf
back
cancel
continue
```

Supported native menus publish shared descriptors for their actual callbacks: party loot voting, leader allocations, player objections, ordinary gifts, and companion equipment. Buttons and typed choices consume the same descriptor, validate its original scene/actors/items and panel ownership, then invoke the existing action. No DOM scraping or synthetic clicks are used. Numbers alone work when no item/NPC clarification is pending. Descriptors, callbacks, menu IDs and pending questions are session-only.

Each menu has a session ID and structured public choices with labels, responses and disabled flags. Item/party inventory snapshots retain references, quantities, storage, visibility, slots and equipment fields. Reordering preserves the selected objects; replacement/movement/hidden targets, a changed party/scene, a replaced panel or a consumed menu cannot silently act on new objects. Old buttons cannot repeat an allocation. Only the owned panel is cleared.

Mandatory loot choices pause the existing action queue. `options`/`show options` review them without replacing queued work. Resolve each choice, then use `continue`; do not replay the completed loot transfer. `stop` cancels queued commands. `cancel` also uses a supported optional menu's Back action (or Decide later for a vote), but cannot erase a required allocation/objection. While an action is finishing, cancel behaves like stop: the current action completes.

`party`/`show party` list visible companions. `show companion <name>` prints public carried/worn gear without changing a pending menu. `companion <name>` opens the shared gear menu. Direct equip/take selectors choose among its native actions; ambiguities leave the numbered menu for an exact answer. Equip means gear from the companion's own pack; the menu also has Give from your pack, with its existing free-slot auto-equip behavior. `take ... from companion <name>` avoids conflicts with ordinary container/body takes. Swaps/transfers retain native companion-equipment behavior and remain free actions. Hidden/concealed/invisible gear is excluded, including Equip best candidates.

`give <item> to <npc>` uses the normal gift handler, offering one carried unit; refusals leave it with the player and pause later commands. It does not force companion auto-equip. `give` opens a gift menu, with NPC/item ambiguity asking for a number. Worn items must be removed first; bulk gifting is not added. Empty-slot equipment handover remains available through the companion menu.

Native gifts return their actual completion promise/result. Delayed reactions retain the original player, room, NPC, interaction mode and exact stack members; changed scenes/targets/stacks cannot consume a replacement or hijack another NPC's UI. Gift completion releases only its own dialogue latch. Normal buttons in text mode use the same foreground wait as typed choices. Stop/cancel can clear later work without cancelling a gift already in progress. Specialised gift submenus (such as nectar dosing) keep normal controls when not registered with the shared choice system.

`choice-actions.js` contains shared descriptors, validation and gift request contexts; `party-commands.js` contains grammar/selection/adapters. `build.cjs` binds the selected native renderers and adds gift completion results, while checking protected conversation/body routing, `chooseNPCAction` and shell script tags/order. Earlier combat/pricing/loot/search/exploration helpers are in `before/` and are not separate build inputs. Reconcile later development edits before rebuilding; ship tested engine/shell together with target hash guards.

Semantic output adds `menu: { id, kind }` and `choices: [{ number, label, response, disabled }]`, public `party`/`companion` lists, engine `kind: "party"` narration, and direct gift `kind: "gift"` metadata `{ gift: { target, name, accepted } }`. Future TTS must select one result presentation and treat menu IDs as session context. Ordinary unregistered service/crafting/job menus still need explicit adapters; this does not make every game submenu available by text.

```powershell
node .party-text/build.cjs
node tests/party-text.test.cjs .party-text/cyoaftw-engine-CORE.js
node .party-text/browser-smoke.cjs
node .party-text/check.cjs
```

All 23 party/choice tests pass. The real-engine browser flow covers typed native allocation, objections and votes; public gear inspection/equip/take/best; gifts and target ambiguity; delayed changed-stack rejection; menu back/cancel; queue pause/continue; and all earlier text/combat/inventory/trade/loot/search/exploration flows on desktop/mobile. External requests are blocked and no page errors occur. Regression: 27 suites pass; the existing job-board harness still omits `getJobBoardWindowBlockReason` and fails as on the unchanged baseline.

Next command families: jobs/quests, inventory reading/studying, crafting/services and their specialised submenus. TTS remains unimplemented.
