const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(process.argv[2] || 'C:/Git/CYOAFTW/.loot-text/cyoaftw-engine-CORE.js', 'utf8').replace(/\r\n/g, '\n');
function section(from, to) { const a = source.indexOf(from), b = source.indexOf(to, a); assert(a >= 0 && b > a, from); return source.slice(a, b); }
const code = section('// Text commands are a presentation/input layer.', '// END TEXT COMMANDS') + '\n' +
    section('function getContainerPlaceIdMap(', '// The card for searching') + '\n' +
    section('function getInventoryStackKey(', 'function getInventoryEntryMaxEquipAmount(') + '\n' +
    section('function getTradeStackKey(', 'function createTradeItemRow(') + '\n' +
    section('function ensureContainerContents(', '// ── LOCKED CHESTS') + '\n' +
    section('// Public loot stays visible;', 'function examineRoomObject(') + '\n' +
    section('function collectBodyLoot(', 'function takeRoomObject(') + '\n' + section('function describeContainerLootNames(', '// openOpts.intro:');
const item = (name, props = {}) => ({ name, type: ['misc'], value: 2, unitSize: 1, ...props });
const chest = (name = 'Oak chest', props = {}) => ({ name, tags: ['storage'], opened: true, contents: { items: [], coins: 0 }, ...props });
const plain = value => JSON.parse(JSON.stringify(value));
function harness() {
    const player = { name: 'Player', inventory: [], equipped: {}, hp: 20, coins: 0 };
    const room = { structural: [], items: [], creatures: [] };
    const c = {
        console: { ...console, error(...args) { c.errors.push(args.map(String).join(' ')); } }, setTimeout, clearTimeout, player, room, calls: [], events: [], errors: [], capacity: 100, turns: 0,
        G: { player, activeRoom: room, activeNPC: null, activeNPCMode: null },
        document: { getElementById: id => id === 'npcFavorEl' ? {} : null }, window: { dispatchEvent(event) { c.events.push(event.detail); } },
        CustomEvent: function (_name, opts) { this.detail = opts.detail; },
        getItemName: it => it.name, getEntityName: it => it.name, getItemQuantity: it => it.quantity || 1,
        getItemUnitValue: it => it.value, getItemUnitSize: it => it.unitSize, getItemValue: it => it.value,
        getCoinValue: entity => entity.coins || 0, adjustCoins(entity, amount) { entity.coins = (entity.coins || 0) + amount; },
        isCarryContainerItem: it => !!it.container, ensureContainerKey: it => it.name,
        cloneItemForStackAmount: (it, quantity) => ({ ...it, quantity }),
        getGarmentPlaces: it => ({ storage: it && it.container ? [{ id: 'bag:' + it.name, label: it.name, cap: it.container.capacity }] : [], ties: [] }),
        getPlayerStoragePlaces: () => [{ id: 'hand', label: 'hand', cap: c.capacity }],
        getEquipmentSlotMeta: slot => ({ label: slot }),
        findContainerOwner: (_p, ck) => { const owner = player.inventory.find(it => it.name === ck); return owner ? { item: owner } : null; },
        containerHoldsItem: (container, it) => (container.packed || []).includes(it),
        restowPlayerPack() {}, ensurePlayerEquipmentState() {},
        getVisibleRoomFixtures: r => r.structural.filter(it => !it.concealed && !it.hidden),
        isContainerFixture: it => (it.tags || []).includes('storage'), isRoomItemTakeable: it => !it.fixed,
        isVisibleEntity: it => !it.hidden, isRoomCollapsed: () => false, roomHasActiveHostile: () => !!c.hostile,
        isFixtureBurning: it => !!it.fire, isChestBurning: () => false,
        isNoticeWritingSuppliesFixture: () => false, refreshCellarStock() {},
        withIndefiniteArticle: name => 'a ' + name,
        describeContainerLootNames: (items, coins) => items.map(it => it.name).join(', ') + (coins ? ' ' + coins + 'g' : ''),
        containerItemLabel: it => it.name, formatInventoryItemLabel: it => it.name,
        receivePartyLoot(items, coins) {
            const res = { lines: [], diverted: 0, refused: [] };
            items.forEach(it => {
                if (c.divert) { c.divert.inventory.push(it); res.diverted++; return; }
                const r = c.addToPlayerPack(it); if (r.refused) res.refused.push(it);
                else if (c.partyDecision) c.G._partyLootPending = [it];
            });
            c.adjustCoins(player, coins); return res;
        },
        addToPlayerPack(it) { const used = player.inventory.reduce((sum, it) => sum + c.getItemQuantity(it) * it.unitSize, 0); if (used + c.getItemQuantity(it) * it.unitSize > c.capacity) return { refused: it }; player.inventory.push(it); return {}; },
        partyLootText: (base, res) => base + res.lines.join(' '),
        barCellarTheftAfterTake: () => '',
        packFullText: () => 'Your pack is full.',
        hasPendingPartyLoot: () => !!(c.G._partyLootPending && c.G._partyLootPending.length),
        renderPartyLootDivision(after) { c.partyCallback = after; },
        renderRoomObjectActionMenu(body) { c.textLootCaptureCard(body); },
        openFixtureCard(it, opts) { if (!c.textLootCaptureCard(it, opts)) c.calls.push(['modal', it]); },
        refreshInventoryUi(text) { if (text) c.setNarration(text); }, renderStats() {}, updateInventoryContextPanels() {}, saveGameState() {},
        setNarration: text => c.publishTextModeOutput('narration', text, { source: 'engine' }),
        applyFaithDelta() {}, rememberStoryEvent() {},
        openContainerFixture(it) { if (it.chestLock && it.chestLock.state === 'locked') return; it.opened = true; c.turns++; c.calls.push(['open', it]); if (c.afterOpen) c.afterOpen(); c.openFixtureCard(it); },
        searchBodyObject(it) { it.bodyLooted = true; c.calls.push(['search', it]); },
        ensureChestLock() {}, isChestLocked: it => !!it.chestLock && it.chestLock.state === 'locked',
        getChestBaseBlockReason: () => '', getChestPickBlockReason: () => c.noPick ? 'You need a lockpick.' : '', getChestForceBlockReason: () => '',
        findKeyForLock: () => c.key || null,
        useChestKey(it) { it.chestLock.state = 'unlocked'; },
        attemptPickChestLock(it) { c.turns++; if (!c.failPick) it.chestLock.state = 'unlocked'; },
        forceChest(it) { c.turns++; if (!c.failPick) it.chestLock.state = 'broken'; },
        setExitGridVisible() {}, aiAvailable: () => false, INTERACT_MENU_ACTIONS: []
    };
    vm.createContext(c); vm.runInContext(code, c);
    c.state = vm.runInContext('textModeState', c); c.state.enabled = true; c.state.sessionPlayer = player;
    c.send = async text => { await c.submitTextModeCommand(text); assert.deepEqual(c.errors, []); }; c.last = () => c.events.at(-1);
    return c;
}

test('loot grammar handles quantities, prepositions outside quoted names, and pickup/lock distinctions', () => {
    const h = harness();
    assert.deepEqual(plain(h.parseTextCommand('take 2 potions from chest')), { verb: 'take', args: { item: 'potions', amount: '2', source: 'chest' } });
    assert.deepEqual(plain(h.parseTextCommand('put "Ring in Ash" in chest')), { verb: 'store', args: { item: 'Ring in Ash', amount: '', source: 'chest' } });
    assert.equal(h.parseTextCommand('pick up sword').verb, 'take');
    assert.equal(h.parseTextCommand('pick lock on chest').args.source, 'chest');
    assert.equal(h.parseTextCommandBatch('take "Sword from Smoke and Fire" from chest then close').actions.length, 2);
});

test('show never opens sources, reveals concealed loot, changes the selected source or replaces a pending question', async () => {
    const h = harness(), a = chest('Oak chest', { opened: false }), b = chest('Iron chest');
    h.room.structural.push(a, b, chest('Secret chest', { concealed: true }));
    await h.send('show containers'); assert.equal(h.last().lootSources.length, 2); assert.equal(h.turns, 0);
    await h.send('contents iron chest'); const selected = h.state.lootContext;
    h.state.pending = { sentinel: true };
    await h.send('show contents oak chest');
    assert.equal(h.state.lootContext, selected); assert.equal(h.state.pending.sentinel, true); assert.equal(h.turns, 0);
});

test('opening costs only the first opening and locked sources cannot leak contents or execute queued takes', async () => {
    const h = harness(), a = chest('Oak chest', { opened: false }); h.room.structural.push(a);
    await h.send('open oak chest then contents'); await h.send('open oak chest'); assert.equal(h.turns, 1);
    const locked = chest('Locked chest', { opened: false, chestLock: { state: 'locked' } }); locked.contents.items.push(item('Secret treasure')); h.room.structural.push(locked);
    await h.send('open locked chest then take all'); assert.equal(h.state.queue.length, 1); assert.equal(locked.contents.items.length, 1); assert.equal(h.player.inventory.length, 0);
    assert.equal(h.events.some(event => event.loot && event.loot.items.some(it => it.name === 'Secret treasure')), false);
});

test('source and item clarification revalidate actual references rather than retargeting same-name replacements', async () => {
    const h = harness(), a = chest(), b = chest(); h.room.structural.push(a, b);
    await h.send('open oak chest'); h.room.structural.splice(0, 1); await h.send('1'); assert.match(h.last().text, /no longer available/);
    b.contents.items.push(item('Sword', { value: 4 }), item('Sword', { value: 8 }));
    await h.send('take sword from oak chest'); assert.equal(h.state.pending.kind, 'lootItem');
    b.contents.items[0] = { ...b.contents.items[0] }; await h.send('1'); assert.equal(h.player.inventory.length, 0); assert.match(h.last().text, /item changed/);
});

test('fixture quantities and coins use normal transfers and oversized requests move nothing', async () => {
    const h = harness(), a = chest(); a.contents.items.push(item('Potion', { quantity: 5 })); a.contents.coins = 7; h.room.structural.push(a);
    await h.send('take 9 potions from oak chest'); assert.equal(a.contents.items[0].quantity, 5);
    await h.send('take 2 potions from oak chest'); assert.equal(a.contents.items[0].quantity, 3); assert.equal(h.player.inventory[0].quantity, 2);
    await h.send('put 2 potions in oak chest'); assert.equal(h.player.inventory.length, 0); assert.equal(a.contents.items.reduce((sum, it) => sum + it.quantity, 0), 5);
    await h.send('take coins from oak chest'); assert.equal(h.player.coins, 7); assert.equal(a.contents.coins, 0);
});

test('full packs restore refused fixture and body items and pause later commands', async () => {
    for (const kind of ['fixture', 'body']) {
        const h = harness(); h.capacity = 0;
        const a = kind === 'fixture' ? chest() : { name: 'Dwarf body', objectType: 'body', bodyLooted: true, inventory: [], equipped: {} };
        (kind === 'fixture' ? a.contents.items : a.inventory).push(item('Sword'));
        (kind === 'fixture' ? h.room.structural : h.room.items).push(a);
        await h.send('take sword from ' + a.name + ' then close');
        assert.equal(h.player.inventory.length, 0); assert.equal((kind === 'fixture' ? a.contents.items : a.inventory).length, 1); assert.equal(h.state.queue.length, 1);
    }
});

test('bulk body and fixture loot preserve hidden and concealed belongings without disclosing them', async () => {
    const h = harness();
    const body = { name: 'Dwarf corpse', objectType: 'body', bodyLooted: true, inventory: [item('Herb'), item('Secret', { hidden: true })], equipped: { weapon: item('Axe'), hand: item('Concealed relic', { concealed: true }) }, coins: 5 };
    h.room.items.push(body); await h.send('loot dwarf corpse');
    assert.deepEqual(plain(body.inventory.map(it => it.name)), ['Secret']); assert.equal(body.equipped.hand.name, 'Concealed relic'); assert.equal(body.equipped.weapon, undefined); assert.equal(h.player.coins, 5);
    const a = chest(); a.contents.items.push(item('Gem'), item('Hidden cache', { hidden: true })); h.room.structural.push(a);
    await h.send('loot oak chest'); assert.equal(a.contents.items.length, 1); assert.equal(a.contents.items[0].name, 'Hidden cache');
    assert.equal(h.events.some(event => /Secret|Hidden cache|Concealed relic/.test(event.text)), false);
    assert.equal(h.describeContainerLootNames([item('Hidden gem', { hidden: true })], 0), '');
});

test('carry-container transfers expose structured success while preserving string results for normal buttons', async () => {
    const h = harness(); const bag = item('Floor pack', { container: { capacity: 2 }, packed: [] }); h.room.items.push(bag);
    h.player.inventory.push(item('Ration', { quantity: 3 }));
    await h.send('put 2 rations in floor pack'); assert.equal(bag.packed.reduce((sum, it) => sum + h.getItemQuantity(it), 0), 2);
    await h.send('put ration in floor pack'); assert.match(h.last().text, /no room left/);
    const message = h.getFromContainer(bag, bag.packed[0]); assert.equal(typeof message, 'string');
    const result = h.getFromContainer(bag, bag.packed[0], { result: true }); assert.equal(result.moved, 1); assert.equal(bag.packed.length, 0);
});

test('party allocation and pending decisions preserve the existing rules and stop command replay', async () => {
    const h = harness(), a = chest(); a.contents.items.push(item('Potion')); h.room.structural.push(a); h.partyDecision = true;
    await h.send('take potion from oak chest then close');
    assert.equal(h.state.paused, true); assert.equal(h.state.queue.length, 1); assert.equal(h.player.inventory.length, 1);
    await h.send('continue'); assert.equal(h.state.queue.length, 1); assert.equal(h.player.inventory.length, 1);
    h.G._partyLootPending = []; h.partyCallback(); await h.send('continue'); assert.equal(h.state.lootContext, null);
    const other = harness(), b = chest(); b.contents.items.push(item('Potion')); other.room.structural.push(b); other.divert = { inventory: [] };
    await other.send('take potion from oak chest'); assert.equal(other.player.inventory.length, 0); assert.equal(other.divert.inventory.length, 1);
});

test('threats arising during opening stop automatic loot and key/pick failures preserve costs and pending commands', async () => {
    const h = harness(), a = chest('Oak chest', { opened: false }); a.contents.items.push(item('Sword')); h.room.structural.push(a); h.afterOpen = () => { h.hostile = true; };
    await h.send('loot oak chest'); assert.equal(h.player.inventory.length, 0); assert.match(h.last().text, /threat nearby/);
    h.hostile = false; h.afterOpen = null; a.opened = false; a.chestLock = { state: 'locked' };
    await h.send('unlock oak chest'); assert.match(h.last().text, /matching key/);
    h.failPick = true; await h.send('pick oak chest then take all'); assert.equal(h.turns, 2); assert.equal(h.state.queue.length, 1);
    h.key = {}; await h.send('unlock oak chest'); assert.equal(a.chestLock.state, 'unlocked');
});

test('context disappears after a room/player change or returning to normal controls', async () => {
    const h = harness(), a = chest(); h.room.structural.push(a); await h.send('contents oak chest'); assert(h.textLootContext());
    h.G.activeRoom = { structural: [], items: [] }; assert.equal(h.textLootContext(), null);
    h.G.activeRoom = h.room; await h.send('contents oak chest'); h.setTextMode(false); assert.equal(h.state.lootContext, null);
});

test('resolved party controls disappear without clearing a different panel that replaced them', async () => {
    const h = harness(); h.room.structural.push(chest()); await h.send('contents oak chest');
    const el = { children: [{}], textContent: 'Keep it' };
    h.G._partyLootPending = [item('Gem')]; h.textLootMarkPartyView(el);
    h.G._partyLootPending = []; h.textLootClearPartyView(); assert.equal(el.textContent, '');
    el.textContent = 'Keep it'; h.G._partyLootPending = [item('Gem')]; h.textLootMarkPartyView(el);
    el.children = [{}]; el.textContent = 'Conversation choices'; h.G._partyLootPending = [];
    h.textLootClearPartyView(); assert.equal(el.textContent, 'Conversation choices');
});
