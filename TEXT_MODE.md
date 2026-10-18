# Text mode and the next TTS phase

Current documented implementation: engine and shell `2026-10-18-017`, October 18, 2026.

This is the main handoff document for text commands and future spoken output. Text exploration, conversation, combat, core inventory management, trading, containers/body loot, party loot decisions, gifts, companion equipment, jobs, bounty management, trophy collection, inventory reading/studying, alchemy, poison work, blacksmith forge services, enchanter enchant/duplicate services and clothier tailoring/pocket services are implemented. Remaining coverage gaps are listed below. TTS and microphone input are not implemented.

Maintaining text support and the future TTS architecture is a standing project
requirement in [AGENTS.md](AGENTS.md) and the active development project's
[AGENTS.md](../CYOADEV/AGENTS.md). Apply it to future game updates without waiting
for a reminder; the rules distinguish new actions from shared balance/data changes.

## Design decisions

Keep three layers separate:

1. **Commands:** interpret what the player wants to do.
2. **Game actions and results:** apply the existing engine rules, costs, rolls, and consequences.
3. **Presentation:** display results as text or, in the next phase, speak them.

Text input calls the same game handlers as the buttons. TTS should reuse this command system and add a spoken presentation. Microphone input, if added later, should feed recognized text into the same parser.

Every action needs a canonical primary command. Aliases and context-specific keyword tables provide variety. Help, available-action lists, and AI fallback should stay aligned with that vocabulary.

## Player controls

- Enable **Show text mode (beta)** in **Preferences** to show the keyboard icon in the compass center and the normal combat menu's **Text mode** button. This preference defaults to off and is saved between sessions, separately from game saves. The empty compass center keeps its space while the icon is hidden.
- The keyboard icon opens text mode. Turning the preference off while text mode is active restores normal controls and cancels pending commands; an action already in progress finishes normally.
- The persistent bottom input receives focus. Keyboard Enter and the **Enter** button use the same submission route.
- The return icon restores the current normal controls and cancels pending commands.
- Up/Down recalls input history. **Stop**, or typing `stop`, cancels pending actions; an action already in progress finishes normally.
- The compass/action bar is hidden in text mode. Standard combat button groups are also hidden, leaving narration and the command dock. Other choice submenus can remain visible when needed.

## Current commands

| Context | Examples | Behavior |
| --- | --- | --- |
| Help | `how`, `how talk`, `how do I talk`, `how to attack` | Explain commands and give examples without spending a turn. |
| Available actions | `show`, `show actions`, `show verbs` | List commands for the current context. |
| Combat help | `show attack`, `show abilities`, `show spells`, `how to use second wind`, `how do I use second wind` | Explain attacks or currently represented combat abilities, including unavailable/cooldown information. |
| Observe | `look`, `glance north`, `glance` | Use the normal observation rules. A missing glance direction produces a numbered question. |
| Movement | `north`, `n`, `go northwest`, `up`, `down` | Use existing exits and movement rules. |
| Room search | `search`, `search room`, `search room tight`, `search force room` | Use the existing hidden-fixture search with careful/tight/force approach costs and rolls. Bare search means the room. |
| Exploration abilities | `sneak`, `hide`, `case the place` | Use the learned ability's normal eligibility, costs and effects. Case the Place reveals loose hidden items using its existing rules; room fixture discovery uses search room. |
| Fixtures | `show fixtures`, `fixtures`, `interact with fountain`, `examine fixture chest`, `examine fountain`, `show fixture fountain` | List visible fixtures or describe one and its typed actions. Explicit fixture inspection avoids item-name conflicts. No item card opens. |
| Plants and ore | `gather greenwort`, `forage`, `mine ore vein`, `scavenge rubble` | Use native harvesting/mining/scavenging checks, tools, stamina, yields and cooldowns. Missing/ambiguous fixture names prompt for a number. |
| Fixture reading | `read wall tallies`, `read notice board`, `read fixture wall tallies` | Read a supported visible fixture using its normal turn/roll/lore rules. Reading appears in text output without a modal. Qualify an item/fixture name conflict explicitly. |
| Look at writing | `look at book`, `look at scroll`, `look at note`, `look at second book` | Inspect the actual item and list its reading/study actions. Look does not consume a tome/primer or grant reading knowledge. Type names and titles both work; ambiguity asks for a number. |
| Readable inventory | `show readable items`, `show books`, `readables` | List visible carried and loose writing with public action labels and current restrictions. Take loose items before reading/studying them. |
| Read inventory | `read book`, `read scroll`, `read folded note`, `read tome` | Show the existing passage, cached/generated lore, spellbook contents or scroll summary in text. Deity tomes retain their normal one-item consumption and knowledge/faith effects. |
| Study | `study book of small devotions`, `study scroll`, `study spellbook` | Use existing primer training, arcane basics/cooldown, recipe-note study, scroll copying or spell-learning choices. Menus use options/choose/back/cancel and pause queued actions. |
| Copy and learn | `copy scroll to spellbook`, `learn frost shard from spellbook` | Copy one scroll sitting or learn a selected book spell using native costs, rolls, progress, mishaps, ranks and technique-pick rules. Completing a copy consumes the scroll. |
| Crafting help | `how craft`, `show recipes`, `show ingredients`, `show mix`, `show bowl` | Explain the shared crafting commands or list public information without spending time or answering a pending question. |
| Alchemy | `alchemy`, `craft healing salve`, `brew healing salve`, `prepare greenwort`, `mash greenwort` | Open the table's recipes or preparation choices. Brewing reviews native ingredients, stamina and turns before numbered confirmation. |
| Process builder | `mix`, `add greenwort`, `stir`, `simmer`, `start mix`, `undo mix`, `clear mix` | Build a native process one reply at a time; reviewing/editing is free. Start asks for confirmation before spending resources. |
| Extraction bowl | `bottle mixture`, `taste mixture`, `dab mixture`, `drink mixture`, `dip dagger`, `discard bowl`, `name mixture "Road tonic"` | Use native bowl effects, doses, empty-vial rules and tested-mixture naming. Discard asks for confirmation. |
| Poison bench | `poisons`, `brew antitoxin`, `experiment with poisons`, `add nightshade`, `coat weapon with nightshade draught` | Use native Rogue training, ingredients, rolls, yields and coating rules. Brewing/experimentation asks for confirmation. |
| Forge services | `forge`, `show forge`, `how to repair`, `sharpen dagger with plain`, `repair sword`, `scrap sword` | Talk or trade with a blacksmith first. Native sharpening, repairs and scrap use shared menus and cost/risk confirmations. |
| Engraving | `engrave dagger as "Road Biter"`, `engrave dagger`, `name weapon "Moonbite"` | Select a sound weapon, use a suggested or custom name, then confirm the fee. Custom names accept 1–24 characters. |
| Armour work | `treat blue coat with cinderstone`, `upgrade blue coat with star ore`, `collect forge` | Use native treatment slots, ore grades, costs and delayed upgrade jobs. Collection grants the upgrade once. |
| Forge materials | `refine grade 1`, `fuse first relic with second relic`, `recolor boots with red pigment` | Refining consumes all visible ore of that grade. Fusion consumes two relics on success. Recolouring blends pigment into the current colour. All ask confirmation. |
| Enchanter | `enchanter`, `show enchanter`, `show enchanting`, `show duplication`, `how to enchant` | Talk or trade with an enchanter first. Free lists report eligible items, exact fees, success chances and blocked reasons without replacing a pending choice. |
| Paid enchantment | `enchant iron sword`, `enchant` | Select a sound carried/equipped weapon, review costs and confirm by number. Native tiers, random bonuses, failures and cap apply. No story turn is spent. |
| Duplication | `duplicate crystal`, `duplicate "Second relic"`, `duplicate` | Select one visible carried, unequipped inventory entry. Confirmation quotes its whole quantity and fee. Failure spends the fee but retains the original; successful copies have independent identities and nested state. |
| Clothier | `tailor`, `clothier`, `show tailoring`, `show tailoring materials`, `how tailor` | Talk or trade with a clothier first. Review public garments, service restrictions, offers and job readiness without changing a pending question. |
| Tailoring requests | `tailor repair linen shirt`, `alter coat`, `reinforce tunic`, `offer 2 linen`, `offer 1 blue dye`, `request "shorten sleeves and add blue trim"`, `quote` | Build a session-only draft one reply at a time. At least one material and a description are required. Only acceptance of the validated quote pays/consumes its agreed units and leaves one garment for work. |
| Tailoring collection | `collect tailoring`, `collect finished work` | Collect ready work from any available clothier. Alterations await their native success/appeal appraisal; an unavailable or stale reply leaves the job safe for explicit retry. |
| Extra pockets | `pockets rucksack`, `add pockets to rucksack` | Review then confirm the native 75g, one-turn, +3-slot upgrade, once per bag/clothier pair. Worn and carried rucksacks are supported. |
| Water and warmth | `drink from fountain`, `fill bottle from fountain`, `wash at fountain`, `warm up at hearth` | Use native recovery, hygiene and one-container filling rules. Drink from selects a fixture; drink <item> remains the consumable command. |
| Traps | `disarm spike trap`, `break spike trap` | Use native Flexibility/Prowess checks. A still-armed trap pauses the batch; another attempt must be explicit. Combat Disarm retains its ability shorthand. |
| Ritual fixtures | `pray at altar`, `offer at altar` | Use native prayer/offering checks, costs, cooldowns and faith effects. |
| Fixture travel | `enter waygate`, `climb stairs` | Portal travel asks a numbered confirmation with the fee; stair/lift routes use real exits. Changed quotes/routes are rejected. Portal travel pauses remaining actions after resolving. |
| NPCs | `who is here`, `npcs` | List visible creatures in room order. |
| Start talking | `talk to dwarf`, `talk to second dwarf`, `talk to dwarf female` | Resolve a visible NPC or ask for clarification. |
| Speech | `say "Where is the inn?"`, `reply "Yes"` | Use the existing conversation handler. |
| Conversation choices | `options`, `choose 2`, `leave` | List topics, select a current choice, or disengage. In combat, `options` lists combat commands. |
| Recovery | `rest`, `sleep` | Use existing recovery, time, bed, and danger checks. |
| Status | `status`, `health`, `stats` | Show player resources without spending a turn. |
| Attack | `attack with light hit to head`, `attack head light`, `heavy head` | Resolve an attack style and body part. Shorthand requires combat. |
| Combat ability | `use second wind`, `second wind`, `cast <spell>`, `<learned technique>` | Use a named action from the shared combat definitions. |
| Defense and escape | `defend`, `guard`, `counter`, `escape`, `talk them down`, `bandage wounds` | Use the corresponding normal combat action and checks. |
| Combat target | `show targets`, `target second dwarf`, `attack dwarf female heavy head` | List or select standing foes. Target selection itself is free. |
| Inventory lists | `inventory`, `inv`, `i`, `show inventory`, `equipment`, `show equipment`, `show floor` | List carried stacks, worn slots, or visible loose floor items. Includes quantities and storage locations. |
| Item inspection | `examine sword`, `inspect second potion`, `x equipped sword` | Print the normal item description, real stats/effects, and equipment comparison without opening a card. |
| Equipment | `equip sword`, `wear boots`, `wield dagger`, `equip floor sword`, `unequip sword`, `take off rucksack` | Use normal slot/storage rules. Displaced equipment is stowed or set down when storage is full. |
| Drop | `drop sword`, `drop 2 potions`, `drop all greenwort`, `drop equipped sword` | Drop one by default, or a specified amount from one selected stack. Dropped containers retain their contents. |
| Consumables | `drink health potion`, `quaff potion`, `eat greenwort`, `eat ration`, `drink bracing draught`, `use health potion` | Consume one carried item through the normal potion, alcohol, herb/tonic, or food/drink supply handler. |
| Floor pickup | `take sword`, `get potion`, `pick up dagger` | Pick up a visible loose item or stack with normal pack capacity checks. Leave conversations first; unavailable in combat. |
| Start trade | `trade with merchant`, `trade with second dwarf`, `trade` | Open the normal trade session with a visible NPC or the current NPC. Ambiguous traders ask for a number. Merchant/Trader roles can match `merchant`. |
| Trade lists | `show stock`, `stock`, `wares`, `show buy`, `show sell`, `buy`, `sell` | List stock or carried sale goods, exact unit prices, quantities, unlimited-stock flags, blocked containers, and both coin balances. Requires a current trade. |
| Purchases and sales | `buy 2 health potions`, `sell iron sword`, `sell all greenwort`, `purchase dagger` | Buy/sell one selected item group through the existing single/bulk transaction handlers. Default quantity: one. |
| Stock inspection | `examine stock sword`, `inspect shop potion` | Print the stock item's normal description, stats, effects, equipment comparison, and current unit price without opening a card. |
| Supply cycle | `show market`, `show supply`, `show deliveries`, `show stock` | Review a vendor's public supply summary. Ordinary goods sell and junk becomes gold with game days; small role-specific deliveries replenish toward targets every two processed days. Active interactions keep their stock stable. |
| Clothier dismantling | `dismantle`, `dismantle linen shirt`, `unpick boots`, `salvage clothing shirt`, `show dismantle`, `how dismantle` | Talk/trade with a clothier first. Select one unworn, empty garment, review exact recovery/fee/time, then confirm using shared `options`/`choose`. Destroys one unit, costs one turn and the quoted fee. Existing tailoring materials are returned; overflow goes on the floor. `back`, `cancel`, `leave` and explicit `continue` work normally. |
| Queue control | `stop`, `continue` | Cancel pending actions or explicitly resume a paused batch. |
| Loot sources | `show containers`, `show loot` | List visible fixed containers, carried/worn/floor carry containers, and bodies. Hidden fixtures/bodies remain undisclosed. |
| Open | `open chest`, `open body`, `open rucksack` | Show visible contents without discovering hidden items or taking them. Fixed containers retain their normal opening turn and lock/danger checks. |
| Search contents | `search body`, `search chest carefully`, `search tight rucksack`, `search force chest` | Attempt discovery among direct contents. Careful (default): Willpower, 1 stamina; tight: Flexibility, 2; force: Prowess, 3. Every attempt costs one story turn, including failed/repeated/empty searches. Opening a closed fixed container costs its normal additional turn. |
| Contents | `contents`, `contents chest`, `show contents` | List visible items and coins in an opened/searched source. `contents <source>` selects it for subsequent commands. |
| Take from source | `take 2 potions from chest`, `take sword from body`, `take coins`, `take all from chest` | Transfer loot through the normal capacity, party-sharing and theft rules. Default quantity: one. |
| Loot all | `loot corpse`, `loot second chest` | Open/view, then take visible contents and coins. Hidden items require a separate successful search. Stops if opening creates a threat or further input is needed. |
| Store | `put 2 potions in chest`, `store sword in rucksack`, `store all herbs in chest` | Store carried goods using existing fixed/carry-container rules. Worn items must be removed first. |
| Chest locks | `unlock chest`, `pick lock on chest`, `force chest` | Use normal key, lockpick or weapon-force handlers, including costs, rolls, breakage, noise and possible content loss. |
| Leave loot view | `close`, `done` | Clear the selected source. Does not relock/reset an opened chest. |
| Party | `party`, `show party`, `show companion dwarf` | List visible companions or their public gear without changing a pending decision. |
| Shared choices | `options`, `show options`, `choose 2`, `2`, `back`, `cancel` | Use registered party/gift/companion menus through the same callbacks as buttons. Numbers apply to the current menu; item/NPC clarification takes priority. |
| Loot decisions | `keep it`, `keep the rest`, `give loot to dwarf female`, `agree`, `compromise`, `stand firm` | Resolve current allocations/objections using native ownership, relationships, promises and dispute rules. Continue later queued work explicitly. |
| Loot votes | `party round robin`, `party class`, `party leader`, `decide later` | Answer a currently displayed loot-sharing vote; NPC votes and tie-breaking remain native. |
| Gifts | `give sword to dwarf`, `give apple to second dwarf`, `give` | Offer one carried unit through native acceptance/refusal rules, or open a gift menu. Wait for delayed reactions and reject changed scenes/stacks. |
| Companion equipment | `companion dwarf`, `equipment dwarf`, `equip sword on dwarf`, `equip best for dwarf`, `take sword from companion dwarf` | Use native gear actions. Equip selects their pack; Give from your pack is available in the menu. Swaps remain free; ambiguity asks for a numbered action. |
| Work and postings | `jobs`, `job board`, `view job postings`, `jobs with dwarf`, `accept job serve tables` | Browse the room board or an NPC's real work offers. Looking at/interacting with the guildhall Job Board opens postings in both normal and text views. |
| Shifts and wages | `work`, `collect pay`, `collect wages`, `carry on working` | One shift uses normal stamina/time/pay rules. Collection from the work menu takes earned wages and stops the job; collection from its NPC giver keeps it open. At day end, use the menu's `sleep` action, then choose to carry on or collect. |
| Bounties | `quests`, `quest log`, `accept quest goblins`, `hand in quest goblins`, `abandon quest goblins` | Accept native trophy bounties, review proof/rewards, hand in at a board or the original giver, or abandon with normal standing/favor costs. Ambiguous names leave exact numbered choices. |
| Quest proof | `cut trophy from goblin corpse`, `take trophy from rat corpse`, `cut trophy from body with razor wind` | Collect proof once from a visible eligible corpse, using a blade or learned cutting spell. Uses native turn/mana, eligibility and witness rules. Ordinary body looting does not cut trophies. |

## Jobs, quests and Job Boards

The guildhall `job-board` fixture now opens the same postings view as the room's Job postings action. In text mode, `interact with job board`, `examine job board`, `read job board`, and `look at job board` open its numbered postings without a modal. `show fixture job board` remains informational. Existing notice-board reading/posting functions remain separate.

`jobs` opens a board when in the room, or the current NPC's work/bounty menu during a conversation. `jobs with <npc>` can select one unambiguous present, available work giver; otherwise talk to the intended NPC first. `quests` opens the active quest log in the room; during a conversation it reports progress. `show jobs` and `show quests` are free public progress views that preserve the current decision and queue.

Board rows open terms, followed by Take job or Accept bounty. Use `accept job <name>` or `accept quest <name>` to select a unique native offer directly, or `options` and `choose <number>`. Work, quest-log and NPC offer menus use the same shared callback descriptors as their normal buttons. `back`/`cancel` leave optional menus; `leave` also exits an NPC work menu. Later queued commands remain paused until `continue`.

`work` performs one native shift; `carry on working` starts the next workday when the job is in its morning state. Sleep until morning uses the existing job menu action and can be interrupted by danger. Native site, town, stamina, workday, tips, bonus, flood and wall-progress rules still apply. `collect pay` from the work menu finishes the job after paying earned wages (including the normal early-quit consequences); at its giver, it collects accrued pay while keeping the job open. A timed job with no wages yet has no collect-and-stop action in the existing menu.

`hand in quest <name>` requires enough matching carried trophies and the correct town. In the room it uses the log's board availability; during an NPC conversation it offers only ready quests from that giver. NPC hand-in choices identify each ready quest separately. Extra trophies are preserved. `abandon quest <name>` uses the room quest log and retains native standing and giver penalties; leave the conversation first to manage abandonment. Quest generation, active limits, veteran standing, board refresh, rewards and saved progress use existing state.

Jobs use `action`/`target` arguments under canonical `jobs` and `quests` intents; `work`, `collect pay`, `accept job/quest`, `hand in quest` and `abandon quest` are deterministic local phrases. AI receives only intent schemas, never executable callbacks or reward fields. `trophy` takes `source` and optional `ability`; its local phrases begin `cut/take/collect trophy`. Only a learned cutting spell is accepted. A body name must identify one visible source; use `show loot` for names.

Menu validation retains the original actor/scene, quest/job references and values, board lists, worksite references, visible fixture references, story turn/town, inventory, giver availability/favor and owned view. Changed/consumed choices cannot pay twice, switch to replacement postings or consume new proof. `options` refreshes a stale owned menu. Modal closure invalidates its old descriptor without deleting the reusable modal DOM. Native work and trophy actions also recheck their scene/source after spending time; interrupted attempts retain costs and do not grant remote wages or proof.

For TTS, board terms publish `kind: "jobs"` with `view`/`title`; numbered menus use the shared `menu`/`choices` contract. Public progress includes `jobs.active: { name, site, owed, day, shifts }` or null and `quests: [{ title, count, collected, ready, reward }]`. Abandonment emits `kind: "quest"` with `quest: { title, action: "abandon", standingLoss }`. Native narration/dialogue/combat lines carry acceptance, work, wages, proof and hand-in results. Pick one presentation where terms, choices and narration overlap; do not read hidden native controls or repeat actions to obtain speech.

## Inventory reading, looking and studying

`look at <item>` uses item/fixture examination. For written items it also lists Read/Study/Copy/Learn actions, requirements and costs. It is free inspection: it does not read a consumable deity tome, use a primer, copy a spell or grant knowledge. `book`, `scroll` and `note` match public item types as well as titles; qualifiers such as `second`, `carried` and `floor` retain the existing exact-reference ambiguity handling. `look` alone keeps its room-observation behavior.

`read <item>` uses the item's native content/effect handler. Generic lore notes generate their passage on first read, cache it on that exact item and retain native deity-revelation effects. Rereading cached lore does not request AI again. Deity tomes consume one and apply their normal knowledge/faith effects. Spellbooks list their real spells; scrolls show their spell summary and copy progress. Plain books/primers and recipe notes show their authored description when no longer passage exists. This feature does not invent full-length book contents. Inventory reading requires a carried, visible item and a safe moment outside NPC/object/modal interactions; floor writing must first be taken. Room writing continues through `read fixture <name>` and its existing rules.

`study <item>` selects a native study action. Primers use one copy over the existing study duration, granting the existing first-rank or later-practice result. Untrained readers can practice arcane basics from a nonempty spellbook or scroll, with the normal cooldown. Trained readers study scrolls through copying and books through learning choices. `copy <scroll>` explicitly performs one copy sitting. `learn <spell> from <book>` explicitly selects that spell. Study of a book with multiple eligible spells opens numbered choices, including disabled reasons; no spell is silently chosen. Known recipes, learning prerequisites, class ranks, advanced-pick teacher requirements, copy failures/mishaps and completion consumption stay native. Recipe-note study retains its consumption, rogue practice and brewing-rank advice; brewing itself is still a separate route.

Normal inventory buttons and text commands now use shared `readableActions` descriptors and `runReadableItemAction`. Registered `reading` menus support `options`, numbers/`choose`, `back` and `cancel`; completed choices leave the old queue paused until `continue`. Direct actions finish before the next queued command. The native inventory buttons also await foreground completion in text mode. Stop cancels later commands while the current read/study completes; it does not undo consumed material.

Requests and choices retain the original player, room, mode, inventory/stack/item references, visibility, written content/copy progress, carried spellbooks and class/branch state. Changed sources/classes, replacement books, danger and new scenes are rejected. Lore replies cannot cache text or grant knowledge/faith to a changed scene or player. Multi-turn study/copy/learning rechecks after time has passed. An interrupted sitting keeps spent time; a primer already consumed at the start stays consumed, and no study/copy/learning progress is granted. A completed native effect is never automatically replayed. A normal reading result cannot open its modal over another scene.

For future TTS, inventory inspection includes `item.readingActions: [{ verb, ability, label, blockedReason }]`; readable lists use `readables: [{ number, name, location, actions }]`. Results use `kind: "reading"` and `reading: { title, text, action, ability, turns, consumed }`, with plain text and debug rows excluded for typed copy/study results. `consumed` indicates that the selected object left the inventory; a consumed unit from a remaining stack can leave this false, while the result text still states the native consumption. Spell choices use the shared menu contract. Recipe study already emits native combat narration, so its reading metadata event is not displayed again. Speech must choose one presentation of overlapping narration/results; it must never reread an item or repeat a study action to produce audio.

## Shared choices, party decisions and gifts

Supported menus now register descriptors for their real button callbacks: party loot votes, leader allocations, player objections, ordinary gifts and companion equipment. `options` prints the current menu; `choose <number>` or a number alone selects it. These bypass the normal pending-loot queue block only to answer that decision. They do not replace paused commands. Resolve all required decisions, then use `continue` explicitly. Already completed transfers are never replayed automatically.

`back` uses a supported optional menu's Back action. `cancel` cancels later commands and leaves an optional menu (or selects Decide later for a vote); it cannot erase an allocation or objection. `stop` cancels later work without deciding the game choice. While busy, cancel behaves like stop: the current action finishes. Unsupported menus keep their normal controls.

Descriptors retain their original actor/room/NPC/mode, item/stack/storage/equipment references, party state and owned panel. Both buttons and text reject stale/replaced/hidden targets, changed inventory/party/scene, changed panels and consumed choices. Reordering keeps the original object selection. Use `options` to refresh an invalid menu. Read-only `show party`, `show companion <name>` and `show options` preserve pending questions and queued work. Menu IDs/callbacks are session-only and are never saved.

`give` offers one carried unit using the existing NPC gift reaction, including refusal, food/engulf handling and container contents. Gift AI is the existing in-character reaction system, separate from the short command-parsing fallback. Native gifts now return their completion promise/result, so queued commands wait. Delayed replies verify the original scene/NPC and exact stack members before transferring anything. Only the gift's own completion latch is released; a stale reply cannot hijack another interaction. A refusal keeps the item and pauses later commands.

`companion <name>` opens native equipment actions. `equip <item> on <companion>` selects their own carried gear; use the menu's Give from your pack to hand over equippable player gear with its normal free-slot auto-equip behavior. Ordinary `give <item> to <npc>` uses gift acceptance and does not force equipping. `take <item> from companion <name>` selects an exact native Take action, avoiding loot-source conflicts. Native swaps/pack transfers remain free. Public inspection and menu rows omit hidden/concealed/invisible belongings, and Equip best excludes invisible candidates too.

This is a reusable choice-registration seam, not blanket conversion of every UI menu. Remaining specialised services, gift choices such as nectar dosing and other unregistered submenus need their own adapters and semantic output. Supported alchemy, forge and enchanter menus are described separately below.

## Room exploration and fixtures

`show fixtures` lists only currently visible structural fixtures. `look` observes ordinary furnishings; `search room` can discover concealed fixtures. `search chest`/`search body` keep their direct-content discovery behavior. Bare `search` now searches the room even when a loot source is selected; this does not replace that source. Room searches use the existing careful/tight/force rules (1/2/3 stamina and one turn) and recheck the scene after time/autonomy advances. Interrupted searches spend costs without revealing old-room fixtures or new arrivals. This guard is shared with normal room search controls.

`interact with <fixture>` prints its cached/authored description and current typed actions, including blocked reasons. `show fixture <name>` is informational and preserves any pending numbered question. `examine <name>` can inspect an unambiguous fixture if no eligible inventory item matches; a name shared with an item asks the player to qualify it. Use `examine fixture <name>` to be explicit. Quotes preserve source names containing separators/prepositions.

Canonical fixture verbs are `gather`, `mine`, `scavenge`, `read`, `warm`, `wash`, `disarm`, `break`, `pray`, `offer`, `fill`, and `enter`. `forage`/`harvest`, `warm up`, `wash up`, and `climb` are local aliases. Omitted fixture names select among fixtures that support that action; multiple matches ask for a number. `show` includes currently usable fixture verbs and learned exploration abilities. Native handlers retain their own costs, rolls, yield, capacity, tool and cooldown behavior. Generic `interact` accepts a supported canonical action argument for AI interpretation; it cannot execute arbitrary handler names.

Choices retain actual fixture/item/route references. Removing/replacing/hiding a fixture, replacing its source array, moving rooms or changing a stair destination invalidates the choice. Water filling also rechecks the selected carried empty stack. Work is blocked during NPC interactions, combat, nearby threats, incapacitation, collapsed rooms, unresolved party decisions, and unrelated open item/object interactions. Completed native effects are preserved when a scene change pauses the remaining queue.

Portal commands require a numbered in-game confirmation. The fee/destination and current availability are rechecked on the answer; AI plans cannot supply approval. `stop`, a new command or leaving text mode cancels a pending confirmation. A cancelled or completed trip pauses later actions; use `continue` explicitly if desired. These are game choices, not tool permission prompts.

More elaborate fixture operations (posting notices, commissions, dummy training, general fire/spell/liquid manipulation, burning items, and shrine dedication) still use normal controls. Their menus need explicit shared-choice adapters before relying on text alone. Alchemy-table work and dipping items in its extraction bowl are supported below.

## Alchemy and poison work

`craft` is the canonical command family; `alchemy`, `crafting`, `brew`, preparation verbs and process/bowl verbs route to it. Use `how craft` for examples. A visible alchemy table is required for alchemy and brewing; inspecting that fixture also mentions its typed commands. `poisons` can open the poison list away from a table, and weapon coating retains its existing availability there. Brewing and experimentation still require the table and the native training checks. Work is blocked by danger, incapacitation, other interactions or unresolved party decisions.

Recipes, plant preparation, process ingredients/actions, poison ingredients, dip targets, naming and confirmations are registered shared menus. Normal buttons and typed choices execute the same authored callbacks and native game handlers. Use `options`, `choose 2`, a number, `back`, `cancel`, or `leave`; availability is rechecked before executing. `show` views preserve the current question and expose only known recipes, visible ingredients and public bowl descriptions.

Known recipes can be selected with `brew <name>` or `craft <name>`. Brewing, starting a process, replaying a saved process, making poison/antitoxin and discarding a bowl show a confirmation. Quotes include ingredients, nominal stamina and story turns, including automatic plant preparation. Reviewing and cancelling a quote spends nothing. Only a current explicit numbered choice or the normal Confirm button approves it; an AI intent or a queued action cannot supply approval. Failure still uses native ingredient loss, rolls, fumes and other consequences.

Use `prepare greenwort` to choose cut/mince/mash, or `mash greenwort` directly. For experiments, enter one builder step per reply: `mix`, `add sunpetal`, `simmer`, then `start mix`. `boil`, `stir` and `extract` are also supported. Editing, undoing and clearing a draft are free. The native maximum and ingredient multiplicity checks still apply. The draft belongs to its original player, room, table and source array; entering a new crafting scene clears it. A pending occupied bowl blocks new processes. Choosing a recipe by name requires existing knowledge; experimentation can discover recipes through the native rules.

The extraction bowl supports tasting, skin testing, drinking, bottling, dipping and confirmed disposal. Bottling uses the normal empty vial and dose rules. Untested mixture effects, magnitude and generated design data are not exposed by lists or semantic events. After testing, select `name mixture` and then enter `name mixture "Road tonic"` (1–40 characters). Normal controls use a name input calling the same validated submission. Named saved mixtures can be replayed through `brew <name>`.

Poison experiments use `experiment with poisons`, `add nightshade`, then a second ingredient such as `add numbroot`; `start mix` reviews a single-ingredient attempt. Known poisons and antitoxin can be selected directly with `brew <name>`. Normal recipe-note study and weapon-coating buttons remain available through the same registered menu; inventory `study <note>` also uses the existing reading route.

Choices retain actor, room, visible table/source, item/equipment, recipe, knowledge, bowl, draft and menu references. Replacing a table, changing materials, advancing time, or changing the scene invalidates a quote. Native work rechecks its scene after spending time and after asynchronous design generation; stale replies do not cache designs, grant products, or apply later effects to another actor/room. Costs and effects already committed remain committed. A completed decision does not automatically resume a paused batch: leave the menu and use `continue` explicitly. Do not batch multiple process-builder steps into one menu reply.

For future TTS, shared menus publish numbered choices. `kind: "craft"` has `craft.stage: "quote"` with `title`, `ingredients`, `stamina`, `turns`, or `stage: "result"` with a canonical `action` and any public `recipe`, `success`, or bowl `{ colour, smell, doses }` fields available at that point. These metadata events are not displayed again. Read-only views use `craft.view: "recipes" | "ingredients" | "bowl"` with known recipe/poison rows, visible ingredient quantities or public bowl description; `show mix` supplies its public process description in text. Native narration carries detailed consequences. Choose one spoken presentation where narration, refreshed menu text and result/quote metadata overlap; never repeat an action or read hidden design fields to obtain speech.

## Forge services

`forge` is the canonical command family. Talk or trade with a present blacksmith first; `forge`, `smith`, or `blacksmith services` opens its registered menu. `show forge` reports actions, blocked reasons and upgrade readiness without replacing a pending choice. `how forge`, `how to repair`, `how to sharpen` and the other forge verbs share the same help. Paid/destructive operations list current fees, time, materials and public risks before confirmation. AI intents and queued choices cannot approve work. Use `options`, numbers/`choose`, `back`, `cancel`, and `leave`; here `leave` returns to the NPC conversation. Leave the forge menu and use `continue` to resume an older batch explicitly. Answer one menu step per reply; a multiple-command menu reply asks the player to separate it.

Commands select the same callbacks as normal buttons. `sharpen <blade>` chooses treatment; `sharpen <blade> with plain` reviews a safe plain edge, and `with <material>` selects a carried whetstone, ore or potion. Once an item is selected, `use <material>` also works. `repair <weapon>` reviews a repair without a rivet; `repair <weapon> with repair rivet` explicitly selects that material. Native failure still applies: sharpening may waste material or break the weapon, and repair failure refunds the fee but loses the weapon. `scrap <broken weapon>` permanently trades it for native ore yields. The self-service grindstone/anvil fixture actions remain separate normal controls.

`engrave <weapon> as "<name>"` reviews engraving directly. Alternatively select `engrave <weapon>`, then a suggested name or `name weapon "<name>"`. The normal custom-name input calls the same validated quote route. Names are sanitized through the native naming rules; text accepts 1–24 characters. Quoted names preserve words such as with/as/and inside the name. Exact item names take priority over ordinal matching; multiple equal names still need a numbered choice.

`treat <armour> with <elemental ore>` uses native resistance slots and waste rolls. `upgrade <armour> with <better-grade ore>` leaves that exact piece in a persistent forge job. The commissioning visit spends one turn and the job then starts with its full native duration. `collect forge` reviews a ready job; collection applies its bonus once and takes no extra turn. If the commissioning tick changes players/scenes, already committed escrow stays on the original player rather than attaching the piece to a replacement player.

`refine grade <number>` consumes **all visible ordinary ore units of that grade**, across stacks, using the native batch/leftover/luck rules; slag can yield nothing. Elemental and hidden ore are excluded. `fuse <relic> with <other relic>` retains the native refusal/clean/perfect rolls and AI-flavoured result within the existing relic framework. A held second relic is supported. `recolor <gear> with <pigment>` (also `recolour`) uses native colour blending and description generation. Existing accepted commissions can be delivered with `deliver commission` through a confirmation; accepting/returning commission-board postings remains on normal controls.

Eligibility, hidden-item filtering, current cost/risk checks, exact player/NPC/scene/source/item references, funds and time are shared by the normal and typed menus. Quotes reject changed state before spending. Native work rechecks after time and asynchronous replies; spent costs and completed effects remain, while stale replies cannot alter detached gear, use changed consumed relic data or grant remote products. A work token keeps normal and typed controls from starting overlapping forge work. Costs, rolls, yields and consequences remain in the native handlers.

For future TTS, registered `forge-*` menus publish the shared numbered-choice contract. Non-displayed `kind: "service"` quote/result events include `service: { stage, action, item, material, fee, turns, note, title?, readyIn?, quantity?, reward?, coinChange? }`. `fee` is the quoted nominal fee; result `coinChange` is the actual player coin delta, including repair refunds or delivery rewards. These events record the attempted service; native narration describes success/failure and actual effects. `show forge` publishes `service: { view: "forge", actions: [{ action, label, blockedReason }], job: { name, turnsLeft } | null }`. Private item/guard snapshots are never published. Speech should select one presentation where narration, quotes and refreshed menu text overlap.

## Enchanter services

`enchanter` is the canonical command family with `action`/`target` string arguments. `enchanting` is a menu alias; `enchant <weapon>` and `duplicate <item>` are direct local phrases. Talk or trade with a present, available enchanter first. `show enchanter`, `show enchanting` and `show duplication` report public candidates, current fees, stack quantities, success chances and restrictions while preserving pending choices. `how to enchant` and `how to duplicate` give the same service help. Combat enchantment abilities retain their previous parser and remain separate from these paid services; scroll copying retains `copy <scroll>`.

Normal service buttons and typed commands use registered `enchanter-services`, `enchanter-enchant`, `enchanter-duplicate` and `enchanter-confirm` menus. Selection opens a free quote; only an explicit current number/`choose` or normal Confirm button authorizes the fee. AI plans cannot supply fee/success fields or approve a pending quote. `options` refreshes stale owned choices. `back`/`cancel` navigate optional menus; `leave` returns to the conversation. Answer one service-menu step per reply. Decisions leave older queued actions paused; leave the menu and use `continue` explicitly. Completed attempts are never automatically replayed.

Enchanting uses sound, visible carried weapons and the equipped weapon, with the existing maximum tier, rising fee, success chance, elemental/physical bonus progression and naming rules. Failure spends the fee without harming the original. Duplication uses visible inventory entries that are not equipped; the selected **whole entry/stack** is copied, with its native value-based cost and 50% success chance. There is no per-command quantity split. Both attempts remain synchronous and spend **no story turn**. Native inventory delivery still adds a successful copy directly to inventory; no new capacity rule is introduced.

Duplicating a live item now deep-copies its saved data, gives copied items independent `_uid`/`id` values and gives copied containers independent storage keys. Embedded packed items keep their visibility flags, receive fresh identities and have copied internal stowage references remapped. The root copy's old external stowage assignment is cleared. Hidden packed names/state are never published. Separately assigned inventory items outside the selected object are not copied along with its pockets. This fixes shared identities and nested mutable state in both the normal and typed duplication action; fees, whole-stack yield and rolls remain native.

The shared/native eligibility checks reject wrong or unavailable providers, danger, incapacitation, competing decisions/modals, hidden or detached items, broken/capped weapons and unaffordable work. Exact actor/provider/room/mode/source-array, item/equipment/inventory references and private data stamps, funds and story time are retained for each menu/quote. Replacing or changing a source, packed content, tier, slot, provider or scene invalidates the old quote before charging. Exact names take priority over ordinal interpretation; otherwise matching/ambiguity uses the existing numbered reference system. No AI request or asynchronous design generation is added to these native services; the generic parser's stale-plan rejection still applies.

For future TTS, shared numbered menus use the existing menu contract. Non-displayed `kind: "service"` quotes include `service: { provider: "enchanter", stage: "quote", action, item, quantity, fee, turns: 0, successChance, reason }`. Native result events include `provider`, `stage: "result"`, `action`, original `item`/`quantity`, `fee`, `turns: 0`, actual `success`/`coinChange`, and `result: { name, quantity } | null`. Read-only lists publish `service: { view: "enchanter", items: [{ action, name, quantity, fee, turns, successChance, blockedReason }] }`. Only public values are projected. Native narration describes the rolled effect or failure; future speech must choose one presentation where results, quotes and refreshed menu text overlap. These events do not require parsing buttons, HTML or private snapshots.

## Clothier tailoring and pockets

`tailor` is the canonical action/target command family; `clothier` and `tailoring` open its menu. Talk or trade with an available clothier first. Select `tailor repair <garment>`, `alter <garment>` or `reinforce <garment>`. Bare `repair`/`mend` uses tailoring during a clothier interaction and retains its forge route elsewhere. `show tailoring` reports public garments, blocked service reasons, packs and current job readiness; `show tailoring materials` reports visible eligible offer quantities. These lists and help preserve the active decision. Normal menus still offer existing dismantling and trading through their shared handlers.

A request draft belongs to the exact player, room, clothier, garment and service. It is session-only. Enter one step per reply: `offer 2 linen`, optionally `offer 1 blue dye`, `request "patch the seams and preserve the fit"`, then `quote`. `offer <name>` defaults to one unit; `offer 0 <name>` removes that offer. Quantities replace that entry's existing offer rather than accumulating. Materials/dyes must be visible, carried, unequipped and empty; the target garment cannot donate to itself. Reinforcement retains the native ability to propose any such carried material, with feasibility decided by the clothier. A material or spare garment is required in addition to any optional dyes. Quote descriptions containing and/then so they stay one command; normal textarea requests accept up to 1200 characters, while the main text input retains its 600-character total limit.

Normal quantity fields and the request textarea submit through the same draft/quote callback as typed commands. Requesting or editing a draft/quote is free. The existing native AI quote request and validator still decide feasibility, design, fee, duration, consumed units and permitted gains; refusal, invalid output or timeout takes nothing and requires an explicit retry. The compact command-parsing fallback remains separate and only interprets action/target intent. It cannot supply a fee, quote, material callback or approval.

The registered quote lists exact consumed units, fee, one handover turn and the subsequent work duration. Only a current explicit number/`choose` or normal acceptance button pays and leaves the piece. Unused offers remain carried. A stacked garment leaves one independently identified piece with independent nested state, preserving remaining stack durability. Ambiguous stacked garments containing belongings must be separated/emptied first. Native repair restores durability; reinforcement increases armour/durability/value while retaining wear; alteration success, appeal, value and worn Charisma are appraised on collection. No fee, material requirement, balance or duration is reimplemented in the text adapter.

Accepted work remains a persistent `clothierJob`; any available clothier honours the receipt. `collect tailoring` retrieves a ready piece once, with no extra turn. An alteration collection waits for its native appraisal, caches a validated outcome before applying it, and never grants the garment twice. If that request fails or its scene, actor, job, item, agreed design or provider changes, no stale appraisal is cached/applied and the job remains safe for explicit collection later. A commissioning visit interrupted after spending time retains paid materials and escrow on the original player rather than attaching it to a replacement player.

`pockets <rucksack>` / `add pockets to <rucksack>` reviews the native 75g, one-turn, +3-slot service. Both normal and text controls require confirmation and exact worn/carried bag identity. Each clothier can patch each bag once; different bags or clothiers remain eligible. Completed pocket changes and costs remain committed if the subsequent story tick interrupts the interaction.

Menus register as `tailor-services`, `tailor-garments`, `tailor-request`, `tailor-offers`, `tailor-quote`, `tailor-pockets` and `tailor-pocket-quote`. Use `options`, numbers/`choose`, `back`, `cancel`, and `leave` (back to conversation). `options` refreshes stale owned tailoring views at the service root. Choices validate exact source/item/rucksack/job/draft/offer/quote references and private data stamps, funds, story time, availability and owned view. Foreground quote/appraisal requests keep the action queue busy and reject late replies; old completion handlers cannot release a newer request token. Decisions keep older queued commands paused until the player leaves the menu and explicitly uses `continue`.

For TTS, numbered choices use the shared menu contract. Non-displayed `kind: "service"` events use `provider: "clothier"`. Tailoring quotes include `stage: "quote"`, `action` (native service key), public `item`, `fee`, handover `turns: 1`, `readyIn`, consumed `materials: [{ name, quantity }]`, optional public estimated `design`, and agreed reinforcement `gains`. Native result events use `action: "commission" | "collect" | "pockets"`, public item/fee/turns, and relevant native service, readiness, capacity or final `appraisal`. Alteration estimates are not reported as awarded outcomes. Read-only views use `service.view: "tailoring" | "tailoring-materials"` with public garment restrictions, packs/readiness or offer rows. Hidden names and private snapshots are excluded. Native narration carries detailed consequences; speech must choose one presentation where menu text, quotes, results and narration overlap.

## Containers and loot

Use `open <source>` to view visible contents, `search <source>` to attempt hidden-item discovery, and `contents <source>` to select an already accessible source. Names, ordinals, visible qualities and location words can distinguish sources/items. Multiple matches ask numbered questions backed by actual references. If a selected source or item moves, disappears, is replaced or becomes hidden, repeat the command. Quote names containing separators or prepositions: `take "Sword from Smoke and Fire" from chest`.

The selected source is session-only and supplies the source for later `take <item>`, `take coins`, or `take all` commands. `close`, returning to normal controls, a new player or a room change clears it. `stop` cancels pending actions while retaining the selected source. To pick up a loose floor item while a source is selected, use `take <item> from floor`. `show contents <source>` is informational: it neither replaces a pending question nor changes the source selected for queued commands.

Explicit transfers accept whole quantities from 1–100 per selected item group; `take all <item> from <source>` uses the group's quantity within that bound. Bare `take all`/`loot` on a fixed container or body uses its native bulk action. Coin piles are taken as a whole through the party rules. Loose floor pickups retain their existing whole-stack behavior. Taking a worn body item uses the whole slot item; unusual legacy multi-unit worn stacks cannot be split by a typed quantity.

Capacity refusals leave untaken loot at its source. Carry-container transfers can move some units before space runs out; report the result, preserve completed transfers and pause the queue. Nested/self-container transfers use the existing cycle checks. The body bulk collector now preserves hidden/concealed belongings instead of discarding hidden inventory entries, and public container/body lists and bulk collection consistently exclude hidden items.

Loot from fixed containers and bodies keeps existing party distribution, obligations/disputes, coin sharing and theft consequences. A party decision pauses queued commands and leaves its normal buttons visible. Use `options`/`choose`, or supported decision aliases, then `continue` explicitly; do not replay the completed take. Carry-container retrieval retains its existing Get-button behavior.

World containers/bodies require leaving NPC interactions, and handling loot is blocked during combat or a nearby active threat. Own carry-container inspection/storage is available outside combat during ordinary conversations. Burning chests require the existing fire/spell controls first. Chest key, pick and force commands call normal handlers; a failed/unbroken lock pauses the queue after any normal costs. Opening does not reroll an already opened container. `close` only leaves the text view, preserving its persistent opened state.

### Hidden belongings and paid searches

`search body`, `search chest`, and `search rucksack` default to **careful**. Approaches can precede or follow the source: `search tight chest`, `search chest forcefully`. `rummage` is an alias. Quote a source whose name itself starts/ends with an approach word. `force chest` remains the lock-breaking action; `search force chest` searches already accessible contents.

The shared engine action powers text commands and normal search buttons. Normal body/container menus have a free **Contents** action and search buttons showing costs. Every explicit attempt spends its approach's stamina and one story turn, even if nothing remains, the roll fails, or the player repeats a previous search. A new retry must be explicit. Successful discovery grants skill progress only when it reveals new belongings. Searching never automatically takes an item or coins. Opening, contents lists and bulk looting do not perform hidden-item discovery; owned inventory/equipment lists and sale lists also exclude undiscovered belongings.

Search examines direct contents only: a fixture's item stash, a body's inventory/equipment, or a carry container's packed/assigned contents. A bag inside a corpse remains a separate source to search after retrieving it. It does not discover hidden room fixtures or loose hidden floor items, and does not identify an item's `hiddenTrait` enchantment.

Authored belongings with `hidden`, `isHidden`, `concealed`, or `visible: false` can be discovered. Default discovery is a **Willpower check against DC 12**. Set `revealStat` to `willpower`, `flexibility`, or `physicalProwess` to require the corresponding approach, and optionally set positive `revealDC` per item. Invalid stats fall back to Willpower; invalid difficulties default to DC 12. A natural 1 fails; a natural 20 discovers candidates for the chosen approach regardless of DC. `searchable: false` preserves a scripted secret until its own event reveals it. Existing hidden flags are reused; this feature does not generate additional secret loot. A successful reveal persists the visibility flags through normal saves.

Search commits costs before advancing time. It then rechecks the actor, scene, source identity/location, item references and discovery metadata. If movement, a threat, death, a party decision or another interaction interrupts it, costs remain spent and nothing new is revealed. Items arriving during the turn are excluded from that attempt. Resource checks precede opening a closed fixed container, so an unaffordable search does not spend an opening turn.

Ability-specific help depends on the current combat action definitions. Outside combat, a request such as `how second wind` currently falls back to general ability-use help.

Attack styles are **light, balanced, heavy, precise**. Body targets are **torso, head, arms, legs**, where the opponent supports them. Omitting style or body part defaults to **balanced torso**. For example, all of these resolve to a light head strike during combat:

```text
attack with light hit to head
attack head light
light head
head light
```

`attack <npc>` can initiate combat from exploration. `heavy head` cannot initiate a fight outside combat, including through AI fallback.

## Parsing and targeting

```text
Input → local parser → AI fallback if unresolved → validated action list
      → target/availability checks → sequential execution → engine output
```

The parser splits batches on `then`, `and`, commas, or semicolons outside quoted speech. Quote dialogue containing those separators:

```text
look then go north
talk to second dwarf then say "Hello, where is the inn?"
second wind then heavy head
trade with merchant then buy 2 health potions then leave
say "Go north and find the guard."
```

The last example is one speech action, not a movement command.

NPC resolution supports public names, species, gender, and ordinals relative to the matching creatures. `second dwarf` means the second matching dwarf, rather than the second creature overall. Unknown given names are not used. Ambiguous requests produce numbered choices; the selected reference is checked again for visibility and eligibility. Combat targeting is restricted to standing foes.

Item resolution uses public name words, visible quality labels, simple plurals, ordinals, and location qualifiers (`carried`, `inventory`, `equipped`, `worn`, `floor`, `ground`). For example, `examine second sword`, `equip fine sword`, and `drop equipped sword` select within the eligible items for that verb. Multiple matches produce numbered choices. A choice keeps the actual object and source reference; it is rejected if the item disappears, is replaced, becomes hidden, changes stack/storage identity, or the scene changes. Inventory list numbers are informational: use a name to start an action, then answer its numbered question if prompted. Quote names containing batch separators: `examine "Sword of Smoke and Fire"`.

Drop quantities apply to one selected stack in one storage location. Requests above the current quantity are refused before anything is removed. Loose floor `take` uses the existing whole-stack handler; source-qualified takes support quantities as described above. Hidden items, fixed objects, and bodies are excluded from loose-item selection. Bodies have their separate search/loot route. Coins are listed separately from worn equipment.

Inspection and equipment management retain the normal free equipment-control behavior. Potions, alcohol, healing herbs, and brewed herbal tonics use their existing combat handlers, cost a combat turn, and wait for combat narration before the next queued command. Ordinary supplies cannot be used during combat, and mana potions are refused when the player has no mana pool, matching the existing buttons. Outside combat, consumables retain the normal inventory-control costs. `use <item>` locally infers `drink` or `eat` when the named carried consumables agree on the action; a matching combat ability takes priority. Explicit `drink` and `eat` always resolve items.

Trading requires an active trade session and is unavailable during combat. `trade` uses the current NPC when one is engaged; otherwise it resolves visible NPCs and asks if necessary. Use `leave` before switching to a different trader, or to return to exploration. `how to buy` and `how to sell` explain commands; `show buy` and `show sell` display current lists. `options` in trade also lists stock.

`buy` and `sell` accept public item-name words, qualities, simple plurals and ordinals, with numbered clarification for ambiguity. List numbers are informational; use names for transactions. Worn gear is excluded from sales, and containers must be emptied. Stock selection excludes hidden/concealed items and NPC equipment. Groups retain object/source references and the quoted price: replacing stock, changing its source array, or changing the quote invalidates a pending item choice instead of silently accepting another deal.

Each transaction accepts 1–100 units from one selected group. `all` means that finite group's current quantity; unlimited stock requires a numeric quantity. Before invoking a transaction, text mode checks the full requested stock, payer's coins, and purchase capacity. A failed precheck trades nothing and pauses the remaining batch. Each later queued action obtains fresh prices and rechecks merchant visibility, ability to converse, duty, relations, reputation, and availability. Unexpected trader/scene changes pause the batch. If an engine handler refuses late or reports a partial/different transaction, preserve the completed effects, report the actual result and pause; never replay or roll back a completed trade automatically.

Sale quotes use shared `getTradeSellPrice()`, including merchant interest, favorability, reputation, and the existing fence bonus. Both the normal trade rows and text lists now use this exact price, replacing the old base-half-value display estimate. Buy prices continue to use `getTradeBuyPrice()`. Single/bulk buy/sell handlers return `{ quantity, total }` on success for the command adapter; normal buttons ignore the return value and keep their existing behavior. No new trade turn costs are introduced.

Current limits are 600 input characters, 12 actions per batch, and the existing 240-character conversation speech limit. Pending commands and clarification references are session-only and are not saved.

### AI fallback

The fallback receives a short instruction, the registered verb/argument shapes, the input, and—in combat—the canonical styles, body parts, and action names. It does not receive private NPC/world context for parsing.

It returns an ordered action list, for example:

```json
{"actions":[{"verb":"attack","args":{"style":"heavy","bodyPart":"head"}}]}
```

AI interprets intent. The engine validates the fields and determines availability, cost, success, damage, and consequences. An unresolved batch is interpreted in full before anything executes. Invalid, unsupported, failed, disabled, or timed-out interpretation executes nothing; the interpretation timeout is 12 seconds. Late plans are discarded after cancellation or relevant scene changes.

## Action queues and completion

Actions execute sequentially and recheck current state before use. Foreground work is separate from background prefetch. Existing NPC promises and callback-based dialogue completion are tracked; queued combat rounds also wait for narration completion or the player's click to skip it.

Execution reports `completed`, `blocked`, `needs_input`, or `interrupted`. The queue pauses for ambiguity, failed movement, unavailable abilities, an NPC awaiting an answer, incapacitation, or an interaction requiring further input. Combat ending, automatic opponent changes, and reinforcements also pause remaining commands.

`continue` resumes the remaining batch explicitly; it does not retry a failed action. A new ordinary command replaces a paused batch. `show`, `how`, and `stop` remain available while an action finishes.

Scene validation includes player, room, active NPC/mode, encounter identity, round, and foe roster. Clarification choices and slow AI responses must not silently act on a different scene.

## Where to make changes

The installed development files are:

- `C:\Git\CYOADEV\cyoaftw-engine-CORE.js`
- `C:\Git\CYOADEV\cyoaftw-engine-CORE.html`

The original command modules and later patch sources are:

| File | Responsibility |
| --- | --- |
| [.jobs-text/commands.js](.jobs-text/commands.js) | `TEXT_COMMANDS`, general parser/help, compact AI schema validation, targeting, queue, input controller, and semantic output publisher. |
| [.jobs-text/combat-commands.js](.jobs-text/combat-commands.js) | `TEXT_COMBAT_KEYWORDS`, combat shorthand, ability resolution, combat help, target selection, queue boundaries, and narration completion/output hooks. |
| [.jobs-text/inventory-commands.js](.jobs-text/inventory-commands.js) | Item grammar, public item selection, stack/location checks, inventory output, and adapters to existing equipment/consumable/pickup handlers. |
| [.jobs-text/trade-commands.js](.jobs-text/trade-commands.js) | Trader targeting, stock/sale lists, stock inspection, quoted item choices, quantity/availability checks, and calls to existing transactions. |
| [.jobs-text/loot-commands.js](.jobs-text/loot-commands.js) | Source/item selection, container context, search/take/store/loot/lock adapters, scoped card presentation, and party/threat/capacity interruption handling. |
| [.jobs-text/exploration-commands.js](.jobs-text/exploration-commands.js) | Room searches, exploration abilities, public fixture matching/actions, reading projection, bottle choices and travel confirmations. |
| [.jobs-text/choice-actions.js](.jobs-text/choice-actions.js) | Native callback descriptors, scene/inventory/panel validation, one-time selection and async gift request contexts. |
| [.jobs-text/party-commands.js](.jobs-text/party-commands.js) | Party/companion/gift grammar, public lists, typed menu controls, choice aliases and foreground completion. |
| [.jobs-text/jobs-commands.js](.jobs-text/jobs-commands.js) | Work/bounty grammar, public progress, native menu selection, board text projection, job/quest state validation and trophy adapter. |
| [.loot-search/search-actions.js](.loot-search/search-actions.js) | Original shared paid body/container discovery rules, already embedded in the current baseline; not an input to the jobs build. |
| [.loot-text/loot-actions.js](.loot-text/loot-actions.js) | Original public-loot visibility and exact quantity helpers, embedded in the current baseline; not an input to the jobs build. |
| [.trade-text/trade-pricing.js](.trade-text/trade-pricing.js) | Original shared sale-quote source, already embedded in the current baseline; not an input to the jobs build. |
| [.jobs-text/build.cjs](.jobs-text/build.cjs) | Builds from installed 009. Adds native job/quest choice bindings and Job Board fixture routing while retaining protected routing and shell script tags/order. |
| [.goods-cycle/goods.js](.goods-cycle/goods.js) | Shared saved vendor turnover, junk conversion, bounded supplier deliveries, protected stock, composition/recovery plans and public business summaries. |
| [.goods-cycle/commands.js](.goods-cycle/commands.js) | Shared button/text dismantling picker and confirmation, exact one-unit transaction, stale-item/scene validation, public service results, grammar and help. |
| [.goods-cycle/build.cjs](.goods-cycle/build.cjs) | Earlier 011 patch from installed 010 with later fixes preserved; source is reconciled with active development files and original hashes are saved. |
| [tests/goods-cycle.test.cjs](tests/goods-cycle.test.cjs) | Old-save initialization, junk/goods/money flows, supplier targets, opening hours, catch-up/replay, protected possessions, composition limits, native/text service parity, stale choices, overflow and queues. |
| [.combat-text/combat-actions.js](.combat-text/combat-actions.js) | Original source of shared combat descriptors and healing target choices, already embedded in the current baseline. This older file is not an input to the jobs build. |
| [tests/text-mode.test.cjs](tests/text-mode.test.cjs) | Exploration, conversation, queue, interpretation, and input tests. |
| [tests/combat-text.test.cjs](tests/combat-text.test.cjs) | Combat vocabulary, rules/availability parity, targeting, queue boundaries, healing choices, and stale-plan tests. |
| [tests/inventory-text.test.cjs](tests/inventory-text.test.cjs) | Item ambiguity, stale choices, quantities, consumable restrictions, narration waits, AI schemas, and inspection/pickup failure tests. |
| [tests/trade-text.test.cjs](tests/trade-text.test.cjs) | Trader/item choices, actual single/bulk handlers, price parity, quantities, stock, coins, capacity, refusal, stale quotes, inspection and queue interruptions. |
| [tests/loot-text.test.cjs](tests/loot-text.test.cjs) | Grammar, read-only lists, stale sources/items, exact quantities, full-pack restoration, hidden preservation, carry results, party decisions and lock/threat interruptions. |
| [tests/loot-search.test.cjs](tests/loot-search.test.cjs) | Search grammar, real checks, costs, criticals, authored metadata, public visibility, direct membership, interruption/refusal and repeat/XP rules. |
| [tests/exploration-text.test.cjs](tests/exploration-text.test.cjs) | Exploration grammar, public/stale targets, bottle/route choices, native availability, room-search interruption, travel quote/confirmation and AI schema boundaries. |
| [tests/party-text.test.cjs](tests/party-text.test.cjs) | Native/button/text allocation and objections, stale/consumed/panel choices, voting, gear identity, gift refusal/ambiguity and async completion/cancellation. |
| [tests/jobs-text.test.cjs](tests/jobs-text.test.cjs) | Native work costs/pay, workday/site/exhaustion rules, quest proof/rewards/abandonment, stale/consumed menus and interrupted trophy collection. |
| [.reading-text/readable-actions.js](.reading-text/readable-actions.js) | Shared native/text written-item descriptors, request validation, guarded completion, inventory button adapter and public inspection actions. |
| [.reading-text/reading-commands.js](.reading-text/reading-commands.js) | Look/read/study/copy/learn grammar, readable lists, shared spell-choice menus and fixture/item routing. |
| [.reading-text/build.cjs](.reading-text/build.cjs) | Earlier 012 reading patch build from the reconciled installed 011 baseline. |
| [tests/reading-text.test.cjs](tests/reading-text.test.cjs) | Native study/copy/learning costs, consumption, progress/mishaps, context interruptions, hidden/type selection, menu freshness and shared normal buttons. |
| [.crafting-text/craft-actions.js](.crafting-text/craft-actions.js) | Shared crafting callbacks, current-cost confirmations, scene/item/work guards, naming and dip menus. |
| [.crafting-text/craft-commands.js](.crafting-text/craft-commands.js) | Craft grammar, public show views, registered native menu routing and foreground completion. |
| [.crafting-text/build.cjs](.crafting-text/build.cjs) | Earlier 013 alchemy patch build from the actual installed 012 baseline. |
| [tests/crafting-text.test.cjs](tests/crafting-text.test.cjs) | Native costs/yields/failure, quote freshness, hidden materials, interruption, async design rejection, draft bounds and explicit approval/queue behavior. |
| [.forge-text/forge-actions.js](.forge-text/forge-actions.js) | Shared forge choices, cost/risk quotes, normal engraving form, visibility and native work guards. |
| [.forge-text/forge-commands.js](.forge-text/forge-commands.js) | Forge grammar, exact/ordinal item selection, public availability and sequential menu routing. |
| [.forge-text/build.cjs](.forge-text/build.cjs) | Earlier 014 forge build from the installed 013 engine/shell. |
| [tests/forge-text.test.cjs](tests/forge-text.test.cjs) | Real native fees/failures/refunds/yields/jobs, hidden materials, quote identity, interruptions, async stale results, queue approval and commission delivery. |
| [.enchanter-text/enchanter-actions.js](.enchanter-text/enchanter-actions.js) | Shared service eligibility, candidates, private quote guards, normal/text menus, public results and independent duplication. |
| [.enchanter-text/enchanter-commands.js](.enchanter-text/enchanter-commands.js) | Enchant/duplicate grammar, public lists, exact/ordinal selection and sequential menu replies. |
| [.enchanter-text/build.cjs](.enchanter-text/build.cjs) | Earlier 015 enchanter build from installed 014. |
| [tests/enchanter-text.test.cjs](tests/enchanter-text.test.cjs) | Native success/failure/costs, full-stack copies and nested identities, hidden/equipped eligibility, quote freshness, ambiguity and explicit approval/queue behavior. |
| [.clothier-text/tailor-actions.js](.clothier-text/tailor-actions.js) | Shared request forms/drafts/offers, native quote bridge, source/work guards, pocket confirmations and public results. |
| [.clothier-text/tailor-commands.js](.clothier-text/tailor-commands.js) | Contextual repair/alter/reinforce/offer/request/quote/collection grammar, read-only public views and sequential replies. |
| [.clothier-text/build.cjs](.clothier-text/build.cjs) | Current 016 build from installed 015; guards native handover/appraisal/pocket actions while retaining native quote/effect rules and protected integrations. |
| [tests/clothier-text.test.cjs](tests/clothier-text.test.cjs) | Native costs/material consumption, single-piece escrow, wear/gains/appraisal outcomes, hidden offers, exact stale references, async rejection, pockets and approval/queue behavior. |

General command IDs are canonical verbs; `primary` and `aliases` can supply alternative spellings. Specialized argument parsing must also be updated when adding new grammar. Combat styles/body parts have canonical keys and aliases in `TEXT_COMBAT_KEYWORDS`. Named combat actions derive their primary command from their shared descriptor and can provide explicit aliases.

When adding an action, reuse its engine handler and eligibility checks. Add its command arguments/examples, parser support where needed, and meaningful tests. Do not introduce a separate text-only implementation of damage, costs, or turn resolution.

The older command folders describe earlier snapshots. The 011 upgrade is described in [.goods-cycle/README.md](.goods-cycle/README.md), 012 reading in [.reading-text/README.md](.reading-text/README.md), 013 alchemy in [.crafting-text/README.md](.crafting-text/README.md), 014 forge in [.forge-text/README.md](.forge-text/README.md), and 015 enchanting in [.enchanter-text/README.md](.enchanter-text/README.md). Current 016 sources and validation are described in [.clothier-text/README.md](.clothier-text/README.md); this build patches the actual installed 015 engine/shell. Reconcile baseline snapshots with newer development edits before applying a newly built payload. Rebuilding an older phase would omit later features.

The subsequent [.nectar-syrup-fix/build.cjs](.nectar-syrup-fix/build.cjs) compatibility patch makes the shared nectar eligibility check accept inventory `Nectar syrup` as well as legacy Moonbloom nectar, while keeping their stacks separate. Drop dosing still uses its existing normal panel; this patch adds no commands or output contract. Preserve this fix when reconciling later upgrade builds.

The subsequent [.guide-walk-fix/build.cjs](.guide-walk-fix/build.cjs) patch moves guide travel actions into central narration, preserving the room description and publishing only the added line as `kind: "narration"`. Spoken guide lines remain dialogue. Normal Follow/Keep following controls share the same movement action; automatic walking waits three seconds between rooms and rejects timers from stopped/replaced walks or changed scenes. Guide walking still uses normal controls rather than new text commands. Safe arrival opens the NPC's normal conversation past the greeting, says "Here we are", and remembers the destination line. Existing `options`, `choose`, `say`, `how talk` and `leave` work there; free speech retains the normal AI availability rules. Combat, incapacitation or another pending interaction/decision takes priority over arrival chat. No paused text batch resumes automatically. Preserve this patch when reconciling upgrade baselines.

The subsequent [.class-start-fix/build.cjs](.class-start-fix/build.cjs) balance patch guarantees every new Wizard a spellbook with one learned basic attack spell: Firebolt, Frost Shard or Lightning Arc. Existing new-character branch initialization grants the book's spell; combat buttons, `show spells`, `how to use <spell>` and `cast <spell>` use the existing shared definitions and costs. Additional spells still require normal learning and a carried book. Existing saves are not given replacement books or free spells. No commands, menus or output contracts change. Preserve the starting-loadout patch when reconciling upgrade baselines.

The engine remains plain JavaScript appended by the Perchance workflow. Ship the engine and shell together; this feature adds no production script dependency. Follow `C:\Git\CYOADEV\AGENTS.md`, preserve existing integration hooks, and preserve script load order.

## TTS handoff: agreed direction

TTS is the next presentation phase. It should initially accept typed commands and provide spoken output. Microphone input is a separate optional phase.

The spoken mode should turn useful game information into natural language. It should omit charts, decorative labels, and debug output while still communicating failed actions, choices, injuries, resource limits, and costs. For example, a visual resource display could become “You're wounded and getting tired,” with exact values available on request.

Conversational help should use the same command vocabulary: `how do I talk`, `how talk`, `how to attack`, and `show`. Spoken help should give short, relevant examples.

Keep the **action queue** and **speech queue** separate. Stopping speech must not cancel or replay a game action. Cancelling pending actions must not undo a completed turn. Repeating spoken information must not submit another command.

### Existing output seam

`publishTextModeOutput()` dispatches a browser `CustomEvent` named `cyoa:output`. Its `detail` has:

```js
{
    kind: "combat",       // also command, feedback, choices, narration, dialogue, trade, search, exploration, party, gift, jobs, quest, service, reading, craft
    text: "...",         // plain text, not HTML
    source: "engine",    // or text-mode
    // Optional metadata, depending on the publisher:
    speaker: "...",
    side: "left",
    status: "needs_input",
    lines: ["..."],      // combat narrative lines; debug rows excluded
    inventory: { scope: "inventory", items: [
        { number: 1, name: "Potion of Health", quantity: 2, location: "carried", slot: null, actions: ["examine", "drop", "drink"] }
    ] },
    item: { name: "Iron sword", location: "equipped", quantity: 1, description: "...", lines: ["..."] },
    choices: [{ number: 1, label: "Iron sword — equipped: Weapon", response: "1" }],
    trade: { merchant: "a dwarf (female dwarf)", side: "buy", playerCoins: 50, merchantCoins: 100, items: [
        { number: 1, name: "Potion of Health", quantity: null, infinite: true, unitPrice: 10, blockedReason: "" }
    ] }
}
```

This is a starting point, not a complete TTS contract:

- Engine emission currently covers common narration/dialogue paths and combat narration, and is gated on text mode being enabled. Other output paths still need an audit.
- Command input is also emitted; a speech renderer should not automatically read every typed command aloud.
- Inventory lists and inspection include structured public item data. Item clarification includes numbered labels and response strings. These numbers belong to the current question; they are not durable item IDs. Other choice lists still need structured option IDs, labels, and response examples before relying on them for spoken interaction.
- Trade list feedback includes merchant, side, balances and item quotes; stock inspection includes `location: "stock"` and `unitPrice`. Trade item questions include structured numbered labels/responses. Completed transactions emit a non-displayed `kind: "trade"` event with `{ merchant, side, name, quantity, total }`, alongside existing engine narration. A TTS renderer must choose one presentation of that result to avoid speaking it twice.
- Clothier dismantling uses registered `goods-dismantle` and `goods-dismantle-quote` menus with current scene/actor/inventory/composition/condition/time validation. Non-displayed `kind: "service"` events include `service: { action: "dismantle", stage: "quote" | "result", item, fee, turns, materials: [{ name, material, quantity, location? }] }`; result locations are `carried` or `floor`. Quote events overlap choice text; result events overlap native narration. Future speech must select one presentation. Confirmation consumes one quote and never resumes the paused game queue automatically. `show market` and trade lists expose aggregate public supply summaries, excluding hidden/protected stock names.
- Source-list feedback includes `lootSources: [{ number, name, kind, location }]`; contents feedback includes `loot: { source, kind, location, coins, items: [{ number, name, quantity, slot }] }`. Source/item questions include structured numbered labels/responses. These describe public data and session choices, not durable item IDs.
- Registered menus include `menu: { id, kind }` plus `choices: [{ number, label, response, disabled }]`. IDs are session-only and support future stale-audio rejection. Public companion inspection adds `companion: { name, items: [{ name, quantity, location, slot }] }`; roster output has `party: [{ number, name }]`. Party narration emits `kind: "party"`; direct gifts emit non-displayed `kind: "gift"` with `gift: { target, name, accepted }`, alongside native narration/dialogue. Select one spoken result and preserve explicit queue resumption after decisions. Specialised/unregistered menus still need their own output/adapters.
- Completed text searches emit a non-displayed `kind: "search"` event with `search: { source, kind, approach, staminaCost, turns, found: [{ name, quantity }] }`. Costs are the nominal approach costs; a preceding chest opening has its own normal turn. No undiscovered names/counts/difficulties are exposed. This overlaps normal narration and contents feedback, so speech should choose one presentation. Failed checks complete with an empty `found`; blocked/interrupted attempts use existing feedback statuses.
- Fixture lists include `fixtures: [{ number, name }]`; inspection includes `fixture: { name, description, actions: [{ verb, command, blockedReason, note }] }`. Fixture reading feedback has `reading: { title, text }`. Completed fixture actions emit non-displayed `kind: "exploration"` with `exploration: { verb, fixture }` alongside native narration. These views contain public data and overlap other feedback; TTS must select one presentation. Travel and route questions use structured numbered choices.
- Events do not yet carry stable event IDs, sequence numbers, or scene-generation tokens. Add these to support deduplication, cancellation, and stale-audio rejection.
- Some engine outputs can be superseded or emitted at intermediate rendering stages. Audit coverage and duplicate/replacement behavior before simply reading every event.
- The in-memory event history is bounded to 100 events; the visible command log is separately bounded. Neither is a durable speech transcript.

### Recommended next implementation sequence

1. Audit important result paths and complete the semantic output contract. Preserve essential consequences while excluding debug/UI-only material.
2. Add a spoken projection for narration, dialogue, combat, status, help, and numbered choices. Prefer deterministic formatting for routine feedback.
3. Add the audio adapter and an ordered speech queue with explicit completion/error signals. Keep voice/provider choices separate from game logic.
4. Add TTS mode controls, repeat, stop speaking, and voice/rate/volume preferences. Keep action cancellation distinct from speech cancellation.
5. Define whether queued actions wait for spoken results. Combat currently waits for visual narration; route that presentation-completion boundary through the active renderer while keeping the two queues separate.
6. Reject or cancel stale speech after scene changes, loads, or mode switches. Specify how urgent interruptions take priority over older narration.
7. Test the important loops using spoken output: discover actions, resolve ambiguity, talk, attack, handle a cooldown, pick a healing target, and stop/repeat without changing game state.

Audio provider, voice selection, persistence of audio preferences, and detailed interruption policy remain implementation decisions. No TTS provider has been chosen and no audio is generated by the current feature.

## Validation and remaining scope

Preference update 017 is staged in `.text-mode-preference/`, based on installed 016. Run `node .text-mode-preference/build.cjs` and `node .text-mode-preference/browser-preference.cjs` to rebuild and verify it. Browser checks pass default-off visibility, persisted on/off, unchanged compass placement, input focus and Enter, cancellation when disabled, dynamically created combat controls, desktop/mobile layout, and invalid/unavailable storage, with no page errors. The 17 existing text-mode tests and four required SFW syntax checks pass against 017. Command and service coverage is unchanged from 016.

Previous clothier feature validation, from `C:\Git\CYOAFTW`:

```powershell
node .clothier-text/build.cjs
node tests/clothier-text.test.cjs .clothier-text/cyoaftw-engine-CORE.js
node .clothier-text/browser-clothier.cjs
node .clothier-text/browser-enchanter.cjs
node .clothier-text/browser-forge.cjs
node .clothier-text/browser-crafting.cjs
node .clothier-text/browser-reading.cjs
node .clothier-text/browser-goods.cjs
node .clothier-text/browser-jobs.cjs
node .clothier-text/browser-smoke.cjs
node .clothier-text/check.cjs
```

Clothier 016 validation: all 37 suites pass, including 13 clothier tests, plus the four required SFW syntax checks. The clothier browser passes native/typed request forms and quantities, validated quotes/acceptance, agreed material consumption and costs, repair/alteration/reinforcement and job collection, pocket confirmation, hidden material preservation, stale quote/appraisal rejection, explicit queue continuation, focus and desktop/mobile layout. Screenshots were inspected. Inherited enchanter, forge, alchemy, reading, goods, jobs and broad gameplay browser workflows also pass against 016. External requests are blocked and AI quote/appraisal replies are controlled; live Perchance AI remains an in-game verification step. The parser prompt-size threshold is unchanged; its grouped schema omits redundant empty argument braces.

Enchanter 015 validation: all 36 suites pass, including 13 enchanter tests, plus the four required SFW syntax checks. The browser check passes normal/text enchant and duplication, fees/rolls/zero-turn behavior, equipped eligibility, whole-stack output, independent copied identities/nested data/container keys, hidden filtering, stale quotes, ambiguity, queue continuation, focus and desktop/mobile layout. Screenshots were inspected. Inherited forge, alchemy, reading, goods, jobs and broad gameplay browser workflows also pass against 015. External requests are blocked; service rolls are controlled in tests. These services add no AI call; live command-parsing fallback remains an in-game verification step.

Forge 014 validation: all 35 suites pass, including 14 native forge/text tests, plus the four required SFW syntax checks. The forge browser covers shared normal/text menus and confirmations, fees and one-time choices, engraving suggestions/custom input, sharpening/repair/scrap, armour treatment and full-duration jobs/collection, refining with hidden ore preserved, fusion/recolour, stale quote and delayed moved-scene rejection, queue continuation, focus and desktop/mobile layout. Screenshots were inspected. The inherited alchemy, reading, goods, jobs and broad gameplay browser workflows also pass against 014. External requests are blocked and AI responses are controlled; live Perchance AI remains an in-game verification step. The goods-cycle VM harness now supplies the native blacksmith role predicate used by contextual help.

At this handoff, all 11 jobs/quest tests, 23 party/choice tests, 16 exploration tests, 11 discovery tests, 12 loot tests, 12 trade tests, 11 inventory tests, 16 combat tests, and 17 text-mode tests passed. The SFW browser check covers native typed party allocations/objections/votes, options/back/cancel, gift ambiguity/acceptance and delayed changed-stack rejection, companion inspection/equip/take/best, hidden gear, stale choice refusal and queue pause/continue, plus prior exploration/discovery/loot/text/inventory/trade/combat workflows on desktop/mobile. External requests are blocked. AI parsing and delayed reactions use controlled test responses; live Perchance AI still needs in-game verification.

The jobs browser check also exercises the normal Job Board modal and its buttons, typed board/posting navigation, native shift costs and wage collection, quest progress/hand-in/rewards/surplus proof/abandonment penalties, stale fixture rejection, NPC job/bounty offers and named hand-in, NPC wage collection, overnight sleep/next-day continuation, trophy collection once, input focus and desktop/mobile layout. No page errors occurred.

The jobs-phase regression run passed all 29 suites. The existing job-board VM harness was updated to supply its current rendering dependencies; its accept/refill and quest-generation checks now pass too.

Notices, smithy commission-board acceptance/return, dummy/specialist training, self-service grindstone/anvil fixtures, chest/environment spells/fire handling, general burning/dipping interactions beyond the alchemy bowl and shrine dedication still rely on existing controls. Trade-adjacent restock requests, ask-about-item, sell-junk sweeps and specialised gift menus such as nectar dosing also remain on normal panels. Blacksmith services and existing commission delivery, enchanter enchant/duplicate, clothier repair/alteration/reinforcement quotes/jobs/collection/pockets and dismantling are supported. Shared choices cover registered menus; each remaining submenu needs its own adapter. Smithy commission-board actions and training are next. Completing those routes is separate from audio playback and should be considered before calling the whole game usable through spoken interaction alone.

Goods-cycle 011 validation: `node .goods-cycle/check.cjs` passes all 32 suites, including 16 goods-cycle/service tests, and the four required SFW syntax checks. `browser-goods.cjs` verifies normal buttons and typed dismantling, a real player sale followed by junk clearance and supply turnover, stale quotes, explicit queue resumption, public results, and mobile layout. Inherited `browser-smoke.cjs` and `browser-jobs.cjs` run against the same 011 engine/shell. External requests are blocked. Background customers and suppliers are abstract; named NPC shopping, dynamic scarcity prices, and complete production/composition chains remain future work.

Reading 012 validation: `node .reading-text/check.cjs` passes all 33 suites, including 11 reading/study tests, plus the four required SFW syntax checks. `browser-reading.cjs` passes real-engine look/type targeting, public/hidden lists, ambiguous and replaced item references, cached/generated and delayed lore, tome/primer consumption and knowledge, arcane basics/cooldown, copying/scroll consumption, spell menus/learning, explicit queue resumption, normal inventory Read controls, desktop/mobile and focus checks, with no page errors. The merchant, jobs and inherited text-mode browser workflows also pass against the staged 012 build. Requests are blocked outside the local test page; live Perchance AI remains an in-game verification step. Subsequent merchant, nectar, guide-walk, Wizard starting-loadout and inventory UI fixes are preserved in the baseline.

Crafting 013 validation: `node .crafting-text/check.cjs` passes all 34 suites, including 13 crafting tests, plus the four required SFW syntax checks. `browser-crafting.cjs` passes native/text confirmations, actual costs/yields, hidden ingredients, preparation, process editing, bowl testing/bottling/drinking/dipping, naming/replay, poison/coating/antitoxin, changed-table/quote and delayed moved-scene rejection, explicit queue continuation, input focus and desktop/mobile checks. Screenshots were inspected. Reading, goods and jobs browser workflows also pass against 013. The inherited broad gameplay smoke check passed on rerun after an intermittent companion gear assertion; its assertion now includes diagnostic events and gear. Browser requests are blocked outside the local test page and AI responses are controlled; live Perchance AI remains an in-game verification step.
