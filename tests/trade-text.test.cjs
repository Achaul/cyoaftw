const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(process.argv[2] || 'C:/Git/CYOAFTW/.trade-text/cyoaftw-engine-CORE.js', 'utf8').replace(/\r\n/g, '\n');
function section(from, to) {
    const start = source.indexOf(from), end = source.indexOf(to, start);
    assert(start >= 0 && end > start, from);
    return source.slice(start, end);
}
const code = section('// Text commands are a presentation/input layer.', '// END TEXT COMMANDS') + '\n' +
    section('function getTradeStackKey(', 'function createTradeItemRow(') + '\n' +
    section('function buyTradeItem(', 'const MERCHANT_ROLE_ITEM_INTEREST') + '\n' +
    section('function sellTradeItem(', 'function setChatOptionsDisabled(') + '\n' +
    section('function tradeWithNPC(', '// -- COLLAPSE');
const plain = value => JSON.parse(JSON.stringify(value));
const item = (name, options = {}) => ({ name, type: ['misc'], value: 10, unitSize: 1, ...options });
function harness(trading = true) {
    const player = { inventory: [], equipped: {}, hp: 20, coins: 100, stamina: 10 };
    const merchant = { name: 'a male dwarf', species: 'dwarf', gender: 'male', role: 'Trader', hp: 30, coins: 100, inventory: [], memory: {}, equipped: {} };
    const other = { ...merchant, name: 'a female dwarf', gender: 'female', inventory: [], memory: {}, equipped: {} };
    const room = { creatures: [merchant, other], items: [] };
    const c = {
        console, setTimeout, clearTimeout, player, merchant, other, room, events: [], calls: [], capacity: 100,
        G: { player, activeRoom: room, activeNPC: trading ? merchant : null, activeNPCMode: trading ? 'trade' : null },
        document: { getElementById: () => null }, window: { dispatchEvent(event) { c.events.push(event.detail); } },
        CustomEvent: function (_name, options) { this.detail = options.detail; },
        getItemName: it => it.name, getItemQuantity: it => it.quantity || 1, getItemUnitValue: it => it.value,
        getItemValue: it => it.value * (it.quantity || 1), getItemUnitSize: it => it.unitSize || 1,
        getInventoryStackKey: it => [it.name, it.value, it.damage || '', it.container ? it.name : ''].join('|'),
        isItemEquippedByEntity: (entity, it) => Object.values(entity.equipped).includes(it),
        getContainerPlaceIdMap: it => it.places || {},
        cloneItemForStackAmount: (it, quantity) => ({ ...it, quantity }), cloneLootTemplate: (it, options) => ({ ...it, ...options }),
        getCoinValue: entity => entity.coins, hasEnoughCoins: (entity, amount) => entity.coins >= amount,
        adjustCoins(entity, amount) { entity.coins += amount; },
        getTradeBuyPrice: (_npc, it) => it.value * (c.buyMultiplier || 1),
        getMerchantSellMultiplier: () => c.sellMultiplier || 1, playerHasTechnique: () => !!c.fence, ROGUE_FENCE_BONUS: 1.5,
        canConverseWithNPC: npc => npc.hp > 0 && !npc.unconscious,
        isVisibleEntity: npc => !npc.hidden, getNPCRoomSightName: npc => npc.name,
        isNPCOffDuty: npc => !!npc.offDuty, getOffDutyLine: () => 'The trader is off duty.',
        isEntityExhausted: () => false, renownRefusesTrade: () => !!c.renownRefusal, getRenownRefusalMessage: () => 'The trader refuses you because of your reputation.',
        refuseIfOffDuty(npc) { if (npc.offDuty) { c.G.activeNPCMode = 'menu'; return true; } return false; },
        selectNPC(npc) { c.G.activeNPC = npc; c.G.activeNPCMode = 'menu'; },
        renderNPCActionMenu() {}, renderTradeOptions() {}, renderStats() {}, saveGameState() {},
        ensureNPCRelationshipState() {}, applyNPCImpact() {},
        ensureNPCTradeStock: npc => npc.inventory.filter(it => !it.hidden && it.value > 0 && !c.isItemEquippedByEntity(npc, it)),
        isTradeAccepted: () => !c.refuseOffer,
        packRoomUnits: () => c.capacity - player.inventory.reduce((sum, it) => sum + c.getItemQuantity(it) * c.getItemUnitSize(it), 0),
        packHasRoomFor: (it, amount) => c.packRoomUnits() >= c.getItemUnitSize(it) * amount,
        packFullText: () => 'Your pack is full.', addToPlayerPack(it) { player.inventory.push(it); }, packContainerContents() {},
        recordTradeMemory(npc, given, received, paid, earned) { c.calls.push({ given, received, paid, earned }); if (c.afterTrade) c.afterTrade(npc); },
        addChatMessage(_side, _speaker, text) { c.publishTextModeOutput('narration', text, { source: 'engine' }); },
        showTradeMessage(text) { c.publishTextModeOutput('narration', text, { source: 'engine' }); },
        setNarration(text) { c.publishTextModeOutput('narration', text, { source: 'engine' }); },
        disengageFromNPC() { c.G.activeNPC = null; c.G.activeNPCMode = null; },
        generateItemExamineText: async it => c.examine ? c.examine(it) : 'A real item.',
        getItemEquipSlot: it => it.slot || null, buildEquipmentExamineLines: () => ['Damage: d6'], buildItemEffectLines: () => [], buildEquipmentCompareLines: () => ['Compared with your weapon'],
        aiAvailable: () => !!c.ai, callAI: async () => c.aiResult,
        INTERACT_MENU_ACTIONS: [], isVendorJunkItem: () => false
    };
    vm.createContext(c); vm.runInContext(code, c);
    c.state = vm.runInContext('textModeState', c); c.state.enabled = true; c.state.sessionPlayer = player;
    c.send = text => c.submitTextModeCommand(text); c.last = () => c.events.at(-1);
    return c;
}

test('trade vocabulary uses canonical verbs, aliases, quantities and quoted item names', () => {
    const h = harness(false);
    for (const [text, verb] of [['trade with merchant', 'trade'], ['shop with dwarf', 'trade'], ['wares', 'stock'], ['purchase sword', 'buy'], ['sell sword', 'sell']]) assert.equal(h.parseTextCommand(text).verb, verb);
    assert.deepEqual(plain(h.parseTextCommand('buy 2 health potions')), { verb: 'buy', args: { item: 'health potions', amount: '2' } });
    assert.deepEqual(plain(h.parseTextCommand('inspect stock sword')), { verb: 'examine', args: { item: 'sword', scope: 'stock' } });
    assert.equal(h.parseTextCommandBatch('buy "Sword of Smoke and Fire" then sell dagger').actions.length, 2);
});

test('merchant role targeting clarifies, keeps the selected NPC, and resumes the purchase batch', async () => {
    const h = harness(false); h.other.inventory.push(item('Health potion', { quantity: 5 }));
    await h.send('trade with merchant then buy 2 health potions');
    assert.equal(h.state.pending.kind, 'target'); assert.equal(h.state.queue.length, 1);
    await h.send('2');
    assert.equal(h.G.activeNPC, h.other); assert.equal(h.G.activeNPCMode, 'trade');
    assert.equal(h.other.inventory[0].quantity, 3); assert.equal(h.player.coins, 80);
    assert.equal(h.last().trade.quantity, 2);
});

test('stock lists hide concealed and equipped goods and sell quotes match actual merchant/fence pricing', async () => {
    const h = harness();
    const worn = item('Worn sword'); h.merchant.equipped.weapon = worn;
    h.merchant.inventory.push(item('Potion', { quantity: 3 }), item('Hidden', { hidden: true }), item('Secret', { concealed: true }), worn);
    h.player.inventory.push(item('Stolen sword', { stolen: true })); h.sellMultiplier = 2; h.fence = true;
    await h.send('show stock'); assert.deepEqual(plain(h.last().trade.items.map(it => it.name)), ['Potion']);
    await h.send('show sell'); assert.equal(h.last().trade.items[0].unitPrice, 15);
    await h.send('how to sell'); assert.match(h.last().text, /Examples: sell iron sword/);
    const before = h.player.coins; await h.send('sell stolen sword');
    assert.equal(h.player.coins - before, 15); assert.equal(h.last().trade.total, 15);
});

test('finite and unlimited stock use the real bulk handlers without consuming the unlimited listing', async () => {
    const h = harness(); const infinite = item('Stamina potion', { infinite: true });
    h.merchant.inventory.push(item('Health potion', { quantity: 4 }), infinite);
    await h.send('buy 3 health potions then buy 2 stamina potions');
    assert.equal(h.merchant.inventory[0].quantity, 1); assert.equal(h.player.coins, 50);
    assert.equal(h.merchant.inventory.includes(infinite), true);
    assert.equal(h.player.inventory.some(it => it.infinite), false);
    assert.equal(h.calls.length, 2);
    const before = h.player.coins; await h.send('buy all stamina potions'); assert.equal(h.player.coins, before);
});

test('full requested quantities, player coins and pack capacity are checked before any purchase', async () => {
    for (const [quantity, coins, capacity, input] of [[2, 100, 100, 'buy 3 potions'], [5, 19, 100, 'buy 2 potions'], [5, 100, 1, 'buy 2 potions'], [500, 10000, 1000, 'buy 101 potions']]) {
        const h = harness(); h.player.coins = coins; h.capacity = capacity; h.merchant.inventory.push(item('Potion', { quantity }));
        await h.send(input + ' then buy potion');
        assert.equal(h.player.coins, coins); assert.equal(h.player.inventory.length, 0); assert.equal(h.merchant.inventory[0].quantity, quantity);
        assert.equal(h.state.queue.length, 1); assert.equal(h.state.paused, true);
    }
});

test('selling refuses worn goods, filled containers and unaffordable full quantities', async () => {
    const h = harness(); const worn = item('Worn sword'); h.player.equipped.weapon = worn;
    h.player.inventory.push(worn, item('Bag', { container: {}, packed: [item('Gem')] }), item('Potion', { quantity: 4 }));
    await h.send('sell worn sword'); await h.send('sell bag');
    h.merchant.coins = 9; await h.send('sell 2 potions');
    assert.equal(h.player.inventory.length, 3); assert.equal(h.player.inventory[2].quantity, 4); assert.equal(h.calls.length, 0);
});

test('item clarification rejects changed quotes, replacement objects and a different source inventory', async () => {
    for (const mutate of [h => { h.merchant.inventory[0].value++; }, h => { h.merchant.inventory[0] = { ...h.merchant.inventory[0] }; }, h => { h.merchant.inventory = h.merchant.inventory.slice(); }]) {
        const h = harness(); h.merchant.inventory.push(item('Sword', { damage: 4 }), item('Sword', { damage: 8 }));
        await h.send('buy sword'); assert.equal(h.state.pending.kind, 'tradeItem');
        mutate(h); await h.send('1'); assert.equal(h.player.coins, 100); assert.equal(h.player.inventory.length, 0);
        assert.match(h.last().text, /quoted price changed/);
    }
});

test('each queued trade rechecks merchant visibility, duty, reputation, relations and fighting', async () => {
    for (const mutate of [h => { h.merchant.hidden = true; }, h => { h.merchant.offDuty = true; }, h => { h.renownRefusal = true; }, h => { h.merchant.hostility = 80; }, h => { h.merchant._inSkirmish = true; }, h => { h.G.activeNPC = h.other; h.other.inventory.push(item('Potion')); }]) {
        const h = harness(); h.merchant.inventory.push(item('Potion', { quantity: 3 })); h.afterTrade = () => mutate(h);
        await h.send('buy potion then buy potion');
        assert.equal(h.player.coins, 90); assert.equal(h.merchant.inventory[0].quantity, 2); assert.equal(h.state.paused, true);
    }
});

test('late refusal and partial handler results stop subsequent commands', async () => {
    const h = harness(); h.merchant.inventory.push(item('Potion', { quantity: 3 })); h.refuseOffer = true;
    await h.send('buy potion then buy potion'); assert.equal(h.player.coins, 100); assert.equal(h.state.queue.length, 1);
    h.refuseOffer = false;
    h.buyTradeItems = (npc, group) => { h.buyTradeItem(npc, group.item); return { quantity: 1, total: 10 }; };
    await h.send('buy 2 potions then buy potion');
    assert.equal(h.player.coins, 90); assert.equal(h.state.queue.length, 1); assert.match(h.last().text, /trade changed/);
});

test('stock inspection prints existing descriptions and stats and rejects late stale results', async () => {
    const h = harness(); const sword = item('Sword', { slot: 'weapon' }); h.merchant.inventory.push(sword);
    await h.send('examine stock sword'); assert.equal(h.last().item.location, 'stock'); assert.match(h.last().text, /Damage: d6/);
    let finish; h.examine = () => new Promise(resolve => { finish = resolve; });
    const run = h.send('examine stock sword then buy sword'); await new Promise(resolve => setImmediate(resolve));
    h.merchant.inventory.splice(0, 1); finish('A stale description'); await run;
    assert.equal(h.state.queue.length, 1); assert.equal(h.player.coins, 100); assert.match(h.last().text, /item changed/);
});

test('trade requires a current session, blocks combat, and leave returns to exploration', async () => {
    const h = harness(false); await h.send('buy potion'); assert.match(h.last().text, /Start trading first/);
    h.G.activeNPC = h.merchant; h.G.activeNPCMode = 'combat';
    await h.send('trade with dwarf'); assert.equal(h.G.activeNPCMode, 'combat');
    h.G.activeNPCMode = 'trade'; await h.send('leave'); assert.equal(h.G.activeNPC, null);
});

test('AI schemas accept trade arguments but malformed plans cannot bypass item and quantity checks', async () => {
    const h = harness(); h.merchant.inventory.push(item('Potion', { quantity: 2 })); h.ai = true;
    assert.equal(h.validateTextAIPlan({ actions: [{ verb: 'buy', args: { item: 'potion', amount: 2 } }] }), null);
    h.aiResult = JSON.stringify({ actions: [{ verb: 'buy', args: { item: 'potion', amount: '3' } }] });
    await h.send('pay for three potions'); assert.equal(h.player.coins, 100);
    h.aiResult = JSON.stringify({ actions: [{ verb: 'buy', args: { item: 'potion', amount: '2' } }] });
    await h.send('pay for both potions'); assert.equal(h.player.coins, 80);
});
