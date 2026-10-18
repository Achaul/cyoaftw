const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(process.argv[2] || 'C:/Git/CYOAFTW/.party-text/cyoaftw-engine-CORE.js', 'utf8').replace(/\r\n/g, '\n');
function section(start, end) { const a = source.indexOf(start), b = source.indexOf(end, a); assert(a >= 0 && b > a, start); return source.slice(a, b); }
const code = section('// Text commands are a presentation/input layer.', '// END TEXT COMMANDS') + '\n' +
    section('const PARTY_LOOT_CONTESTED_VALUE', '// -- NPC INITIATIVE') + '\n' +
    section('function getGiftReceiveMode(', 'window.giveItemToNPC =') + '\n' +
    section('function moveOneItemOutOfPack(', '// ── OPENING BARKS');
const item = (name, extra = {}) => ({ name, type: ['misc'], unitSize: 1, value: 20, ...extra });
const plain = value => JSON.parse(JSON.stringify(value));
function element() { return { children: [], set innerHTML(value) { assert.equal(value, ''); this.children = []; }, appendChild(child) { this.children.push(child); } }; }
function harness() {
    const player = { name: 'Player', hp: 20, hpMax: 20, stamina: 10, staminaMax: 10, inventory: [], equipped: {}, coords: '0,0' };
    const ally = { id: 'a', name: 'a dwarf', species: 'dwarf', gender: 'female', hp: 20, hpMax: 20, inventory: [], equipped: {}, _inParty: true, temperament: 'gentle', memory: { favorability: 90 } };
    const second = { ...ally, id: 'b', gender: 'male', inventory: [], equipped: {}, memory: { favorability: 90 } };
    const room = { creatures: [ally, second], items: [], structural: [], coords: '0,0' }, el = element();
    const c = { console, setTimeout, clearTimeout, player, ally, second, room, el, events: [], calls: [], impacts: [], saves: 0, turns: 0,
        G: { player, activeRoom: room, activeNPC: null, activeNPCMode: null, partyMembers: [ally, second], sessionFollowers: [], _partyLootPending: [] },
        window: { dispatchEvent(event) { c.events.push(event.detail); } }, CustomEvent: function (_name, options) { this.detail = options.detail; },
        document: { getElementById: id => id === 'chatOptionsEl' ? el : null },
        createCombatButton: (label, onClick, options = {}) => ({ label, onClick, ...options }), appendCombatGroup: (target, title, buttons) => target.children.push({ title, buttons }),
        getEntityName: e => e.name, getNPCRoomSightName: e => e.name, isVisibleEntity: e => !e.hidden && !e.isHidden && !e.concealed && e.visible !== false,
        canConverseWithNPC: e => !e.unconscious && !e.dead, isCompanionNPC: e => !!e._inParty || !!e._sessionFollow,
        roomHasActiveHostile: () => !!c.hostile, isRoomCollapsed: () => !!c.collapsed,
        getItemName: it => it.name, getItemQuantity: it => it.quantity || 1, getItemValue: it => it.value || 0,
        isLootItemVisible: it => !!it && !it.hidden && !it.isHidden && !it.concealed && it.visible !== false,
        getInventoryStackKey: it => it.key || it.name, getInventoryEntryKey: it => JSON.stringify([it.key || it.name, it.stowed || '']),
        buildPlayerInventoryEntries(entity) {
            const result = [];
            for (const it of entity.inventory || []) { if (!c.isLootItemVisible(it)) continue; const key = c.getInventoryEntryKey(it); const group = result.find(e => e.key === key); if (group) group.totalQuantity += c.getItemQuantity(it); else result.push({ item: it, key, totalQuantity: c.getItemQuantity(it) }); }
            return result;
        },
        takeInventoryEntryAmount(entity, key) { const it = entity.inventory.find(i => c.getInventoryEntryKey(i) === key); if (!it) return null; return c.moveOneItemOutOfPack(entity, it); },
        cloneItemForStackAmount: (it, quantity) => ({ ...it, quantity }),
        packContainerContents(_entity, it) { if (it.packed) c.calls.push(['packed', it]); }, restowPlayerPack() {}, refreshInventoryUi() {},
        getItemEquipSlot: it => !it.ruined && !it.unusable ? it.slot || null : null, prepareItemForEquip() {},
        getPlayerEquipmentSlots: () => ['weapon', 'hand', 'upper', 'coinPouch'], getEquipmentSlotMeta: slot => ({ label: slot }),
        getAccessibleEquipmentSources: (e, floor) => (e.inventory || []).concat(floor ? room.items : []).filter(c.isLootItemVisible).map(it => ({ item: it, list: (e.inventory || []).includes(it) ? e.inventory : room.items })),
        splitOneUnit(list, it) { return c.moveOneItemOutOfPack({ inventory: list }, it); },
        getItemExamineStats: it => it, getExamineScore: stats => (stats.damage || 0) + (stats.armor || 0),
        renderNPCActionMenu() { el.innerHTML = ''; }, selectNPC(npc) { c.G.activeNPC = npc; c.G.activeNPCMode = 'menu'; },
        getRoleCombatTier: () => 'civilian', getInitiativeTone: () => 'plain', queueTurnNote() {}, rand: list => list[0],
        getCurrentStoryTurn: () => c.turns, advanceStoryTurn: n => c.turns += n,
        shareImpact(npc, favor) { npc.memory.favorability += favor; c.impacts.push([npc, favor]); },
        rememberStoryEvent() {}, applyNPCImpact(npc, impact) { npc.memory.favorability += impact.favor; }, addStoryFact() {},
        saveGameState() { c.saves++; }, getCoinValue: () => 0, adjustCoins() {},
        isSlimeEntity: () => false, isActiveSlime: () => false, isEntityIncorporeal: () => false, getSupplyUse: it => it.supply || null,
        withIndefiniteArticle: name => 'a ' + name, formatInventoryItemLabel: (it, qty) => it.name + ' x' + qty,
        aiAvailable: () => false, addChatMessage(_side, name, text) { c.events.push({ kind: 'dialogue', text, name }); },
        setNarration: text => c.publishTextModeOutput('narration', text, {}, false),
        getChatOptions: () => [], INTERACT_MENU_ACTIONS: [],
        getStatBonusFromValue: () => 0, getEntityStatValue: () => 3, rollD20: () => 20,
        removeFromParty(npc) { c.G.partyMembers = c.G.partyMembers.filter(n => n !== npc); npc._inParty = false; },
        renderStats() {}, setChatOptionsDisabled() {}, removeTypingIndicator() {}, addTypingIndicator() {},
        getDirectEquipmentSlot: it => it.slot || null, isRoomItemTakeable: () => true,
        getGarmentPlaces: () => ({ storage: [], ties: [] }),
        isCarryContainerItem: it => !!it.container, getContainerContents: it => it.packed || [], getItemUnitSize: it => it.unitSize || 1,
        POTION_OF_HEALTH_TEMPLATE: {}, isPotionItem: () => false, isAlcoholItem: () => false, isHerbItem: () => false
    };
    vm.createContext(c); vm.runInContext(code, c);
    c.textModeState = vm.runInContext('textModeState', c); c.sharedChoiceState = vm.runInContext('sharedChoiceState', c);
    c.textModeState.enabled = true; c.textModeState.sessionPlayer = player;
    c.setChatOptionsDisabled = disabled => c.textModeDialogueBusy(disabled);
    c.findLootObjector = () => null;
    c.send = text => c.submitTextModeCommand(text);
    c.buttons = () => el.children.flatMap(group => group.buttons || []);
    c.openDivision = (...items) => { player.inventory.push(...items); c.G._partyLootPending = items; c.getPartyLootState().rule = 'leader'; c.renderPartyLootDivision(() => c.calls.push(['after'])); return c.sharedChoiceState.menu; };
    return c;
}

test('party grammar keeps gift, companion, loot and quoted item routes separate', () => {
    const c = harness();
    for (const [text, verb, args] of [
        ['keep it', 'party', { action: 'keep it' }], ['give loot to second dwarf', 'party', { action: 'give', target: 'second dwarf' }],
        ['give "Sword to Remember" to dwarf', 'give', { item: 'Sword to Remember', target: 'dwarf' }],
        ['equipment dwarf', 'companion', { target: 'dwarf' }], ['equip sword on dwarf', 'companion', { action: 'equip', item: 'sword', target: 'dwarf' }],
        ['take sword from companion dwarf', 'companion', { action: 'take', item: 'sword', target: 'dwarf' }], ['equip best for dwarf', 'companion', { action: 'best', target: 'dwarf' }]
    ]) assert.deepEqual(plain(c.parseTextCommand(text)), { verb, args });
    assert.equal(c.parseTextCommand('take sword from chest').verb, 'take');
    assert.equal(c.parseTextCommand('equip sword').verb, 'equip');
});

test('typed keep resolves native allocation once and preserves paused queued commands', async () => {
    const c = harness(), it = item('Relic'); const menu = c.openDivision(it);
    c.textModeState.queue = [{ verb: 'status', args: {} }];
    await c.send('options'); assert.equal(c.events.at(-1).menu.id, menu.id);
    await c.send('keep it'); assert.equal(c.hasPendingPartyLoot(), false); assert.equal(c.getPartyLootState().got.player, 1);
    assert.equal(c.textModeState.queue.length, 1); assert.equal(c.calls.filter(call => call[0] === 'after').length, 1);
    await c.runSharedChoice(menu, menu.options.find(choice => choice.meta.action === 'keep'));
    assert.equal(c.getPartyLootState().got.player, 1);
    await c.send('continue'); assert.equal(c.textModeState.queue.length, 0);
});

test('button and numbered text routes use the same native assignment and companion effects', async () => {
    for (const button of [false, true]) {
        const c = harness(), it = item('Iron sword', { type: ['weapon'], slot: 'weapon', damage: 7 }); c.openDivision(it);
        if (button) await c.buttons()[0].onClick(); else await c.send('choose 1');
        assert.equal(c.player.inventory.includes(it), false); assert.equal(c.ally.equipped.weapon, it);
        assert.equal(c.getPartyLootState().got.a, 1); assert.equal(c.hasPendingPartyLoot(), false);
    }
});

test('keep rest consumes the native pending haul without replaying its transfers', async () => {
    const c = harness(); c.openDivision(item('Gem'), item('Relic')); await c.send('keep the rest');
    assert.equal(c.getPartyLootState().got.player, 2); assert.equal(c.player.inventory.length, 2); assert.equal(c.hasPendingPartyLoot(), false);
});

test('reordered parties keep the original numbered target; departed or hidden companions invalidate choices', async () => {
    const c = harness(), it = item('Relic'); c.openDivision(it); c.G.partyMembers.reverse(); await c.send('1');
    assert(c.ally.inventory.includes(it));
    for (const change of [c => c.room.creatures.splice(0, 1), c => c.ally.unconscious = true, c => c.G.partyMembers.splice(0, 1), c => c.ally.hidden = true]) {
        const h = harness(); h.openDivision(item('Gem')); change(h); await h.send('1');
        assert.equal(h.player.inventory.length, 1); assert.equal(h.getPartyLootState().got.a, undefined);
    }
});

test('replaced inventory, pending loot or source scene cannot execute an old allocation', async () => {
    for (const change of [c => c.player.inventory = c.player.inventory.slice(), c => c.G._partyLootPending = [item('Gem')], c => c.player.inventory[0].quantity = 2, c => c.G.activeRoom = { creatures: [] }, c => c.hostile = true]) {
        const c = harness(); c.openDivision(item('Gem')); change(c); await c.send('choose 1');
        assert.equal(c.getPartyLootState().got.a, undefined);
    }
});

test('cancel and stop cancel queued work without silently resolving mandatory loot decisions', async () => {
    const c = harness(); c.openDivision(item('Gem')); c.textModeState.queue = [{ verb: 'look', args: {} }];
    await c.send('cancel'); assert.equal(c.textModeState.queue.length, 0); assert.equal(c.hasPendingPartyLoot(), true);
    await c.send('stop'); assert.equal(c.hasPendingPartyLoot(), true); await c.send('options'); await c.send('keep it'); assert.equal(c.hasPendingPartyLoot(), false);
});

test('native loot objections accept typed agreeable, compromise and aggressive responses', async () => {
    for (const [text, style] of [['agree', 'agreeable'], ['compromise', 'compromise'], ['stand firm', 'aggressive']]) {
        const c = harness(), it = item('Relic'); c.player.inventory.push(it); c.getPartyLootState();
        c.startPlayerLootObjection(c.ally, it, 'better'); c.renderPartyLootDivision();
        assert.equal(c.sharedChoiceState.menu.kind, 'loot-objection'); await c.send(text);
        assert.equal(c.G._partyLootObjection, null);
        assert.equal(c.ally.inventory.includes(it), style === 'agreeable');
        assert(c.impacts.length > 0);
    }
});

test('party loot votes and decide later use native voting/state through shared choices', async () => {
    const c = harness(); c.getPartyLootState(); c.showPartyLootVote(); await c.send('party leader');
    assert(c.getPartyLootState().rule); assert.equal(c.sharedChoiceState.menu, null);
    c.showPartyLootVote(); await c.send('cancel'); assert(c.getPartyLootState().snoozeUntil > 0);
});

test('companion inspection is public, read only and preserves a pending decision', async () => {
    const c = harness(), it = item('Hidden jewel', { concealed: true }); c.ally.inventory.push(it, item('Ration')); c.ally.equipped.weapon = item('Axe');
    c.openDivision(item('Gem')); const menu = c.sharedChoiceState.menu; await c.send('show companion dwarf female');
    assert.equal(c.sharedChoiceState.menu, menu); assert.equal(c.events.at(-1).companion.items.length, 2); assert(!c.events.at(-1).text.includes('Hidden jewel'));
});

test('companion menu swaps native gear, preserves displaced items and returns with back', async () => {
    const c = harness(), old = item('Old axe', { slot: 'weapon', damage: 2 }), sword = item('Iron sword', { slot: 'weapon', damage: 7 });
    c.ally.equipped.weapon = old; c.ally.inventory.push(sword);
    await c.send('equip sword on dwarf female'); assert.equal(c.ally.equipped.weapon, sword); assert(c.ally.inventory.includes(old)); assert.equal(c.turns, 0);
    await c.send('back'); assert.equal(c.sharedChoiceState.menu, null);
});

test('same-named companion gear requires a numbered exact action and stale gear never moves', async () => {
    const c = harness(); c.ally.inventory.push(item('Sword', { slot: 'weapon', damage: 2 }), item('Sword', { slot: 'weapon', damage: 7 }));
    await c.send('equip sword on dwarf female'); const menu = c.sharedChoiceState.menu;
    assert.equal(c.ally.equipped.weapon, undefined); c.ally.inventory[0] = { ...c.ally.inventory[0] };
    await c.send('choose 2'); assert.equal(c.ally.equipped.weapon, undefined);
    await c.send('options'); assert.notEqual(c.sharedChoiceState.menu, menu); await c.send('back');
});

test('give from companion menu preserves native auto-equip and take returns an exact item', async () => {
    const c = harness(), sword = item('Sword', { slot: 'weapon', damage: 5 }); c.player.inventory.push(sword);
    await c.send('companion dwarf female'); let menu = c.sharedChoiceState.menu;
    await c.send('choose ' + (menu.options.findIndex(choice => choice.meta.action === 'give') + 1));
    assert.equal(c.ally.equipped.weapon, sword); assert.equal(c.player.inventory.length, 0);
    await c.send('back'); await c.send('take sword from companion dwarf female'); assert(c.player.inventory.includes(sword)); assert.equal(c.ally.equipped.weapon, null);
});

test('gifts use native acceptance/refusal and move one unit rather than the whole stack', async () => {
    for (const refused of [false, true]) {
        const c = harness(), gift = item('Apple', { quantity: 3 }); c.player.inventory.push(gift); if (refused) c.ally.memory.favorability = -60;
        await c.send('give apple to dwarf female');
        assert.equal(c.getItemQuantity(gift), refused ? 3 : 2); assert.equal(c.ally.inventory.length, refused ? 0 : 1);
        assert.equal(c.events.findLast(event => event.gift).gift.accepted, !refused);
    }
});

test('gift target/item ambiguity retains references instead of reselecting by labels', async () => {
    const c = harness(), gift = item('Apple'); c.player.inventory.push(gift);
    await c.send('give apple to dwarf'); assert.equal(c.textModeState.pending.kind, 'target'); c.room.creatures.reverse(); await c.send('2');
    assert.equal(c.second.inventory.length, 1); assert.equal(c.ally.inventory.length, 0);
});

test('native gift choices are typed and optional menus cancel through their normal Back action', async () => {
    const c = harness(); c.player.inventory.push(item('Apple')); await c.send('give'); await c.send('1');
    assert.equal(c.sharedChoiceState.menu.kind, 'gift'); await c.send('cancel'); assert.equal(c.sharedChoiceState.menu, null); assert.equal(c.G.activeNPCMode, 'menu');
});

test('async native gifts wait before queued status and stop preserves only the current gift', async () => {
    const c = harness(); c.player.inventory.push(item('Apple')); c.aiAvailable = () => true;
    let finish; c.fetchGiftReaction = () => new Promise(resolve => { finish = resolve; });
    const task = c.send('give apple to dwarf female then status'); await Promise.resolve();
    assert.equal(typeof finish, 'function'); assert.equal(c.ally.inventory.length, 0); assert.equal(c.textModeState.busy, true);
    await c.send('stop'); finish({ verdict: 'accept', favor: 2, reaction: 'Thanks.' }); await task;
    assert.equal(c.ally.inventory.length, 1); assert.equal(c.textModeState.queue.length, 0);
    assert(!c.events.some(event => /Health:/.test(event.text)));
});

test('delayed gift reactions reject replaced stacks, moved items, departed NPCs and changed scenes', async () => {
    for (const change of [c => c.player.inventory[0] = { ...c.player.inventory[0] }, c => c.player.inventory[0].stowed = 'other', c => c.player.inventory[0].quantity = 2, c => c.room.creatures = [], c => c.G.activeRoom = { creatures: [] }, c => c.G.player = { ...c.player }, c => c.G.activeNPC = c.second]) {
        const c = harness(); c.player.inventory.push(item('Apple')); c.aiAvailable = () => true;
        let finish; c.fetchGiftReaction = () => new Promise(resolve => finish = resolve);
        const task = c.send('give apple to dwarf female'); await Promise.resolve(); change(c); finish({ verdict: 'accept', favor: 2, reaction: 'Thanks.' }); await task;
        assert.equal(c.ally.inventory.length, 0); assert(c.events.some(event => /Nothing was transferred/.test(event.text)));
    }
});

test('shared choice descriptors reject forged, disabled and consumed choices', async () => {
    const c = harness(), menu = c.openDivision(item('Gem'));
    assert.equal((await c.runSharedChoice(menu, { ...menu.options[0] })).status, 'blocked');
    menu.options[0].disabled = true; assert.equal((await c.runSharedChoice(menu, menu.options[0])).status, 'blocked');
    await c.send('keep it'); assert.equal((await c.runSharedChoice(menu, menu.options[1])).status, 'blocked');
});

test('a replaced panel cannot execute old menu choices or clear unrelated controls', async () => {
    const c = harness(), menu = c.openDivision(item('Gem')), replacement = { title: 'Other controls', buttons: [] };
    c.el.children = [replacement]; await c.send('choose 1'); assert.equal(c.player.inventory.length, 1);
    c.clearSharedChoiceMenu(menu); assert.equal(c.el.children[0], replacement);
});

test('an accepted asynchronous gift releases its completion latch before the next queued action', async () => {
    const c = harness(); c.player.inventory.push(item('Apple')); c.aiAvailable = () => true;
    let finish; c.fetchGiftReaction = () => new Promise(resolve => finish = resolve);
    const task = c.send('give apple to dwarf female then status'); await Promise.resolve();
    assert(!c.events.some(event => /Health:/.test(event.text)));
    finish({ verdict: 'accept', favor: 2, reaction: 'Thanks.' }); await task;
    assert(c.events.some(event => /Health:/.test(event.text))); assert.equal(c.textModeState.dialogue, null);
});

test('normal gift buttons also wait for completion and cancel preserves the current transfer', async () => {
    const c = harness(); c.player.inventory.push(item('Apple')); c.selectNPC(c.ally); c.openGiveMenu(c.ally); c.aiAvailable = () => true;
    let finish; c.fetchGiftReaction = () => new Promise(resolve => finish = resolve);
    const button = c.buttons().find(button => /^Give:/.test(button.label)), task = button.onClick(); await Promise.resolve();
    assert.equal(c.textModeState.busy, true); await c.send('cancel'); finish({ verdict: 'accept', favor: 2, reaction: 'Thanks.' }); await task;
    assert.equal(c.ally.inventory.length, 1); assert.equal(c.textModeState.busy, false); assert.equal(c.textModeState.dialogue, null);
});

test('an offered container cannot acquire a replacement payload while its gift reaction is pending', async () => {
    const c = harness(), bag = item('Bag', { container: {}, packed: [item('Keepsake')] }); c.player.inventory.push(bag); c.aiAvailable = () => true;
    let finish; c.fetchGiftReaction = () => new Promise(resolve => finish = resolve);
    const task = c.send('give bag to dwarf female'); await Promise.resolve(); bag.packed[0] = { ...bag.packed[0] };
    finish({ verdict: 'accept', favor: 2, reaction: 'Thanks.' }); await task;
    assert(c.player.inventory.includes(bag)); assert.equal(c.ally.inventory.length, 0);
});
