const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(process.argv[2] || 'C:/Git/CYOAFTW/.goods-cycle/cyoaftw-engine-CORE.js', 'utf8').replace(/\r\n/g, '\n');
function section(a, b) { const start = source.indexOf(a), end = source.indexOf(b, start); assert(start >= 0 && end > start, a); return source.slice(start, end); }
const code = section('// Text commands are a presentation/input layer.', '// END TEXT COMMANDS') + '\n' + section('// BASIC GOODS CYCLE:', '// END BASIC GOODS CYCLE') + '\n' + section('const CLOTHIER_MATERIAL_TEMPLATES', 'const CLOTHIER_DYE_COLOURS') + '\n' + section('function getTradeStackKey(', '// Stacks with MORE');
const plain = x => JSON.parse(JSON.stringify(x));
const item = (name, opts = {}) => ({ name, value: 12, type: ['misc'], ...opts });
const garment = (opts = {}) => item('Linen shirt', { type: ['clothes'], slot: 'upper', material: 'cloth', composition: [{ material: 'linen', units: 3 }], ...opts });
function element() {
    return { children: [], style: {}, dataset: {}, classList: { toggle() {} }, appendChild(child) { this.children.push(child); return child; }, set innerHTML(value) { this.children = []; }, focus() {} };
}
function harness(role = 'Clothier') {
    let uid = 0;
    const player = { hp: 30, inventory: [], equipped: {}, coins: 100 }, vendor = { hp: 30, name: 'Mara', role, inventory: [], equipped: {}, coins: 80, memory: {} };
    const room = { coords: '0,0', creatures: [vendor], items: [] }, panel = element();
    const c = {
        console, setTimeout, clearTimeout, now: 0, events: [], panel, player, vendor, room,
        G: { player, activeRoom: room, roomMap: { '0,0': room }, activeNPC: null, activeNPCMode: null, partyMembers: [], sessionFollowers: [], _partyLootPending: [] },
        window: { dispatchEvent: e => c.events.push(e.detail) }, CustomEvent: function (_, options) { this.detail = options.detail; },
        document: { getElementById: id => id === 'chatOptionsEl' ? panel : null, createElement: element },
        DAY_TURNS: 54, ROLE_TRADE_GOODS: { Vendor: [{ name: 'Ration', value: 2, id: 'ration' }] }, TRADE_GOODS: [{ name: 'Ration', value: 2, id: 'ration' }],
        getCurrentStoryTurn: () => c.now, isMerchantRole: role => ['Clothier', 'Vendor', 'Healer', 'Blacksmith', 'Arcanist', 'Bartender'].includes(role),
        isCompanionNPC: n => !!n.companion, isLootItemVisible: i => !!i && !i.hidden && !i.concealed && i.visible !== false,
        isVisibleEntity: i => !i.hidden, canConverseWithNPC: n => n.hp > 0 && !n.unconscious,
        getItemName: i => i.name, getItemQuantity: i => i.quantity || 1, getItemUnitValue: i => i.value || 1,
        getItemEquipSlot: i => i.slot, guessDurabilityMaterial: i => i.material || 'cloth',
        getInventoryStackKey: i => [i.name, i.value, i.slot || ''].join('|'),
        isItemEquippedByEntity: (n, i) => Object.values(n.equipped || {}).includes(i),
        isAnyKeyItem: i => !!i.key, isVendorJunkItem: i => !!i.junk,
        isNPCOffDuty: n => !!n.offDuty, hasPendingPartyLoot: () => !!c.pendingLoot,
        roomHasActiveHostile: () => !!c.hostile, isRoomCollapsed: () => false, isPlayerJailed: () => false,
        isClothier: n => n && n.role === 'Clothier', isForgeSmith: n => n && n.role === 'Blacksmith', renownRefusesTrade: () => false,
        getCoinValue: n => n.coins, adjustCoins: (n, value) => n.coins += value, hasEnoughCoins: (n, value) => n.coins >= value,
        assignLootUID(i) { if (!i._uid) i._uid = 'test' + ++uid; return i; },
        cloneLootTemplate(t, opts) { return c.assignLootUID({ ...t, ...opts }); },
        createNPCTradeGood(t) { return c.cloneLootTemplate(t); },
        cloneItemForStackAmount(i, qty) { return { ...i, _uid: 'test' + ++uid, quantity: qty }; },
        getContainerSaleBlockReason: i => i.packed && i.packed.length ? 'Empty pockets first.' : '',
        clothierItemHasContents: i => !!(i.packed && i.packed.length),
        getLootMembersInRoom: () => [], getNPCRoomSightName: n => n.name,
        createCombatButton(label, onClick, options) { return { label, onclick: onClick, ...options }; },
        clothierText(el, text) { el.appendChild({ textContent: text }); },
        addToPlayerPack(i) { if (c.full) return { ok: false, refused: i }; player.inventory.push(i); return { ok: true }; },
        advanceStoryTurn(steps) { c.now += steps; if (c.onTurn) c.onTurn(); },
        renderTradeOptions() { panel.innerHTML = ''; }, renderStats() {}, saveGameState() {},
        showTradeMessage(text) { c.publishTextModeOutput('narration', text, { source: 'engine' }); },
        setNarration(text) { c.publishTextModeOutput('narration', text, { source: 'engine' }); },
        aiAvailable: () => false, INTERACT_MENU_ACTIONS: [],
        rand: arr => arr[0], generateLootItem: () => item('Fresh blade', { type: ['weapon'], slot: 'weapon' }),
        textModeInCombat: () => false,
        disengageFromNPC() { c.G.activeNPC = null; c.G.activeNPCMode = null; }
    };
    vm.createContext(c); vm.runInContext(code, c);
    c.state = vm.runInContext('textModeState', c); c.state.enabled = true; c.state.sessionPlayer = player;
    c.menu = () => vm.runInContext('sharedChoiceState.menu', c);
    c.engage = () => { c.G.activeNPC = vendor; c.G.activeNPCMode = 'trade'; };
    c.cycle = day => { c.now = day * 54; c.refreshMerchantGoods(vendor); };
    c.send = text => c.submitTextModeCommand(text);
    return c;
}

test('existing saves initialize without resetting stock or retroactive income; repeated reads are free', () => {
    const h = harness('Vendor'), stock = item('Existing goods'); h.vendor.inventory.push(stock); h.now = 10000;
    h.refreshMerchantGoods(h.vendor); h.refreshMerchantGoods(h.vendor);
    assert.equal(h.vendor.inventory[0], stock); assert.equal(h.vendor.coins, 80); assert.equal(h.vendor.goodsCycle.rounds, 0);
});

test('junk converts directly to gold in bounded quantities and newly sold goods get a full grace day', () => {
    const h = harness('Vendor'), junk = item('Junk', { junk: true, quantity: 100, value: 4 });
    h.vendor.inventory.push(junk); h.noteMerchantGoodsReceived(h.vendor, [junk]);
    h.now = 53; h.refreshMerchantGoods(h.vendor); assert.equal(junk.quantity, 100);
    h.cycle(1); assert.equal(junk.quantity, 60); assert.equal(h.vendor.coins, 120); assert.equal(h.vendor.goodsCycle.summary.junk, 40);
    h.now = 107; const fresh = item('Fresh junk', { junk: true }); h.vendor.inventory.push(fresh); h.noteMerchantGoodsReceived(h.vendor, [fresh]);
    h.cycle(2); assert(h.vendor.inventory.includes(fresh));
});

test('useful goods sell with a customer budget; supplier deliveries cost money and stop at targets', () => {
    const h = harness('Vendor'), goods = item('Bandage', { quantity: 10, value: 4 });
    h.vendor.inventory.push(goods); h.cycle(0); h.cycle(1);
    assert.equal(goods.quantity, 9); assert.equal(h.vendor.coins, 83);
    h.cycle(2); assert.equal(h.vendor.goodsCycle.summary.delivered, 1); assert.equal(h.vendor.inventory.find(i => i.name === 'Ration').quantity || 1, 1);
    const n = h.vendor.inventory.length, coins = h.vendor.coins; h.refreshMerchantGoods(h.vendor); assert.equal(h.vendor.inventory.length, n); assert.equal(h.vendor.coins, coins);
});

test('active trade, combat, party decisions and off-duty merchants do not change quoted stock', () => {
    for (const state of ['trade', 'combat', 'party', 'offDuty']) {
        const h = harness('Vendor'), goods = item('Junk', { junk: true }); h.vendor.inventory.push(goods); h.cycle(0);
        if (state === 'trade') h.engage(); if (state === 'combat') h.G.combatEncounter = {}; if (state === 'party') h.pendingLoot = true; if (state === 'offDuty') h.vendor.offDuty = true;
        h.cycle(2); assert(h.vendor.inventory.includes(goods), state); assert.equal(h.vendor.coins, 80);
    }
});

test('a delivery deferred overnight runs on opening, rather than being pinned to closing time', () => {
    const h = harness('Vendor'); h.vendor.inventory.push(item('Junk', { junk: true })); h.cycle(0);
    h.vendor.offDuty = true; h.cycle(2); assert.equal(h.vendor.goodsCycle.rounds, 0);
    h.vendor.offDuty = false; h.now++; h.refreshMerchantGoods(h.vendor);
    assert.equal(h.vendor.goodsCycle.rounds, 2); assert(h.vendor.goodsCycle.summary.delivered > 0);
});

test('occasional new stock matches the vendor role and deliveries respect total stock limits', () => {
    const h = harness('Blacksmith'); vm.runInContext('Math.random = function () { return 0; };', h);
    h.cycle(0); for (let day = 1; day <= 4; day++) h.cycle(day);
    assert.equal(h.vendor.goodsCycle.summary.newItem, 'Fresh blade'); assert(h.vendor.inventory.some(i => i.name === 'Fresh blade'));
    const full = harness('Blacksmith'); vm.runInContext('Math.random = function () { return 0; };', full);
    for (let i = 0; i < 40; i++) full.vendor.inventory.push(item('Special ' + i, { unique: true }));
    full.cycle(0); full.cycle(100); assert.equal(full.vendor.inventory.length, 40); assert.equal(full.vendor.goodsCycle.summary, null);
});

test('depleted delivery goods refill toward a target without a free merchant purse reset', () => {
    const h = harness('Vendor'); h.vendor.coins = 5; h.cycle(0); h.cycle(2);
    assert.equal(h.vendor.inventory.length, 1); assert.equal(h.vendor.coins, 4);
    h.vendor.inventory = []; h.cycle(4); assert.equal(h.vendor.inventory.length >= 1, true); assert(h.vendor.coins < 4);
    const empty = harness('Vendor'); empty.vendor.coins = 0; empty.cycle(0); empty.cycle(2); assert.equal(empty.vendor.inventory.length, 0); assert.equal(empty.vendor.coins, 0);
});

test('keys, hidden and filled goods, equipped and special items survive turnover', () => {
    const h = harness('Vendor');
    const protectedStock = [item('Key', { key: true }), item('Hidden', { hidden: true }), item('Container', { container: {} }), item('Relic', { bossRelic: true }), item('Lucky', { hiddenTrait: {} }), item('Unique', { unique: true }), item('Potion', { infinite: true }), item('Fine', { value: 101 }), item('Scroll', { spellId: 'firebolt' }), item('Equipped')];
    h.vendor.equipped.weapon = protectedStock.at(-1); h.vendor.inventory.push(...protectedStock); h.cycle(0); h.cycle(20);
    for (const i of protectedStock) assert(h.vendor.inventory.includes(i), i.name);
});

test('time skips cap catch-up and saving/reloading cannot replay a completed cycle', () => {
    const h = harness('Vendor'); h.vendor.inventory.push(item('Junk', { junk: true, quantity: 1000 })); h.cycle(0); h.cycle(1000);
    assert.equal(h.vendor.goodsCycle.rounds, 3); assert.equal(h.vendor.inventory[0].quantity, 880);
    h.vendor.goodsCycle = plain(h.vendor.goodsCycle); const coins = h.vendor.coins; h.refreshMerchantGoods(h.vendor); assert.equal(h.vendor.coins, coins);
    h.cycle(1001); assert.equal(h.vendor.goodsCycle.rounds, 4);
});

test('vendor processing consumes damaged clothing and returns usable, bounded tailoring material', () => {
    const h = harness(), old = garment({ quantity: 2, durability: { hp: 50, max: 100 }, value: 20 });
    h.vendor.inventory.push(old); h.cycle(0); h.engage(); h.cycle(1); h.G.activeNPC = null; h.cycle(2);
    assert.equal(h.vendor.goodsCycle.summary.dismantled, 1); assert(h.vendor.inventory.some(i => i.tailoringMaterial === 'linen'));
});

test('composition, condition and value bound recovery; old ambiguous garments yield generic cloth', () => {
    const h = harness();
    assert.equal(h.getGarmentRecovery(garment())[0].material, 'linen');
    assert.equal(h.getGarmentRecovery(garment({ composition: undefined }))[0].material, 'cloth');
    assert.equal(h.getGarmentRecovery(garment({ durability: { hp: 10, max: 100 } })).length, 0);
    assert.equal(h.getGarmentRecovery(garment({ composition: [{ material: 'unobtainium', units: 100 }] })).length, 0);
    const plan = h.getGarmentRecovery(garment({ value: 4, composition: [{ material: 'silk', units: 999 }] })); assert.equal(plan.length, 0);
    assert(h.getGarmentRecovery(garment({ value: 10000, composition: [{ material: 'cloth', units: 999 }] }))[0].quantity <= 12);
});

test('companions, dead vendors and nonmerchants never cycle their personal possessions', () => {
    for (const extra of [{ companion: true }, { _inParty: true }, { isGuide: true }, { hp: 0 }, { role: 'Adventurer' }]) {
        const h = harness('Vendor'); Object.assign(h.vendor, extra); const junk = item('Personal', { junk: true }); h.vendor.inventory.push(junk); h.cycle(0); h.cycle(20); assert(h.vendor.inventory.includes(junk)); assert.equal(h.vendor.goodsCycle, undefined);
    }
});

test('normal buttons and text use one quote and exact one-unit transaction, never double charge', async () => {
    for (const typed of [false, true]) {
        const h = harness(); h.engage(); h.state.enabled = typed; const shirt = garment({ quantity: 2 }); h.player.inventory.push(shirt);
        if (typed) await h.send('dismantle linen shirt');
        else { h.openClothierDismantle(h.vendor); await h.panel.children[0].onclick(); }
        const menu = h.menu(), choice = menu.options[0]; assert.equal(menu.kind, 'goods-dismantle-quote');
        const coins = h.player.coins; await h.runSharedChoice(menu, choice);
        assert.equal(shirt.quantity, 1); assert.equal(h.player.coins, coins - 1); assert.equal(h.now, 1); assert.equal(h.player.inventory.find(i => i.tailoringMaterial === 'linen').quantity, 2);
        await h.runSharedChoice(menu, choice); assert.equal(h.player.coins, coins - 1); assert.equal(h.now, 1);
    }
});

test('stale material/condition/stack/scene and off-duty replies refuse before any destruction', async () => {
    for (const change of [h => h.player.inventory[0].composition[0].material = 'silk', h => h.player.inventory[0].durability = { hp: 1, max: 100 }, h => h.player.inventory[0].quantity = 3, h => h.G.activeRoom = { creatures: [h.vendor] }, h => h.vendor.offDuty = true]) {
        const h = harness(); h.engage(); const shirt = garment(); h.player.inventory.push(shirt); await h.send('dismantle shirt');
        const menu = h.menu(); change(h); const result = await h.runSharedChoice(menu, menu.options[0]);
        assert.equal(result.status, 'blocked'); assert(h.player.inventory.includes(shirt)); assert.equal(h.player.coins, 100); assert.equal(h.now, 0);
    }
});

test('full packs put recovered materials on the floor and interrupted work cannot be repeated', async () => {
    const h = harness(); h.engage(); h.player.inventory.push(garment()); h.full = true;
    await h.send('dismantle shirt'); const menu = h.menu(); h.onTurn = () => h.hostile = true;
    const result = await h.runSharedChoice(menu, menu.options[0]); assert.equal(result.status, 'interrupted');
    assert.equal(h.room.items[0].tailoringMaterial, 'linen'); assert.equal(h.player.inventory.length, 0); assert.equal(h.player.coins, 99);
    assert.equal(h.events.find(e => e.service && e.service.stage === 'result').service.materials[0].location, 'floor');
});

test('service grammar/help/show, ambiguity, cancellation and paused batches preserve exact actions', async () => {
    const h = harness(); h.engage(); h.player.inventory.push(garment(), garment({ name: 'Linen shirt second' }));
    assert.equal(h.parseTextCommand('unpick shirt').verb, 'dismantle'); assert.equal(h.parseTextCommand('salvage clothing shirt').verb, 'dismantle');
    await h.send('how dismantle'); assert.match(h.events.at(-1).text, /Examples: dismantle/);
    await h.send('show'); assert.match(h.events.at(-1).text, /dismantle/);
    await h.send('dismantle shirt then status'); assert.equal(h.menu().kind, 'goods-dismantle'); assert.equal(h.state.queue.length, 1);
    await h.send('choose 1'); assert.equal(h.menu().kind, 'goods-dismantle-quote');
    await h.send('show dismantle'); assert.equal(h.menu().kind, 'goods-dismantle-quote');
    await h.send('choose 1'); assert.equal(h.now, 1); assert.equal(h.state.queue.length, 1);
    await h.send('continue'); assert.equal(h.state.queue.length, 0);
    await h.send('dismantle'); await h.send('cancel'); assert.equal(h.menu(), null);
});
