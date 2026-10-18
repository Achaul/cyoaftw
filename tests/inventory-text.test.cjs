const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(process.argv[2] || 'C:/Git/CYOAFTW/.inventory-text/cyoaftw-engine-CORE.js', 'utf8').replace(/\r\n/g, '\n');
function section(from, to) {
    const start = source.indexOf(from), end = source.indexOf(to, start);
    assert(start >= 0 && end > start, from);
    return source.slice(start, end);
}
const commands = section('// Text commands are a presentation/input layer.', '// END TEXT COMMANDS');
const stacks = section('function getInventoryStackKey(item)', 'function getInventoryEntryMaxEquipAmount(');
const visibility = source.includes('function isLootItemVisible(') ? section('function isLootItemVisible(', 'function takeLootUnitsFromList(') : '';
const plain = value => JSON.parse(JSON.stringify(value));
function item(name, fields = {}) { return { name, type: ['misc'], unitSize: 1, ...fields }; }
function harness(combat = false) {
    const player = { inventory: [], equipped: {}, rucksack: null, hp: 10, hpMax: 20, stamina: 10, staminaMax: 20, coins: 7 };
    const foe = { name: 'the dwarf', species: 'dwarf', hp: 100 };
    const room = { items: [], creatures: [foe] };
    const c = {
        console, setTimeout, clearTimeout, player, foe, room, calls: [], events: [],
        G: { player, activeRoom: room, activeNPC: combat ? foe : null, activeNPCMode: combat ? 'combat' : null, combatEncounter: combat ? { round: 1, foes: [foe] } : null },
        document: { getElementById: () => null }, window: { dispatchEvent(event) { c.events.push(event.detail); } },
        CustomEvent: function (_name, options) { this.detail = options.detail; },
        getItemName: it => it.name || 'item', getItemQuantity: it => it.quantity || 1, getItemUnitValue: it => it.value || 1,
        isCarryContainerItem: it => !!it.container, ensureContainerKey: it => it._ck ||= 'bag',
        cloneItemForStackAmount: (it, quantity) => ({ ...it, quantity }),
        getEquipmentSlotMeta: slot => ({ label: slot }), getDirectEquipmentSlot: it => it.slot || null,
        getItemEquipSlot: it => it.slot || null, isRoomItemTakeable: it => !it.fixed && it.takeable !== false,
        isPotionItem: it => it.type.includes('potion'), isAlcoholItem: it => it.type.includes('alcohol'),
        isHerbItem: it => !!it.herbKey, getHerbKey: it => it.herbKey,
        HEALING_HERBS: { greenwort: {}, tonic: { verb: 'Drink' } },
        getSupplyUse: it => it.consume || null, getCoinValue: p => p.coins, playerUsesMana: () => !!c.usesMana,
        restowPlayerPack() {}, refreshInventoryUi() { c.calls.push(['refresh']); }, saveGameState() { c.calls.push(['save']); },
        getNPCRoomSightName: npc => npc.name, isVisibleEntity: npc => !npc.hidden,
        getActiveEncounter: () => c.G.combatEncounter, encounterStandingFoes: enc => enc.foes.filter(npc => npc.hp > 0),
        getCombatActionGroups: () => c.abilities || [], getCombatTargetOptions: () => ['head', 'torso'],
        generateItemExamineText: async it => c.examine ? c.examine(it) : it.description || 'A plain item.',
        buildEquipmentExamineLines: () => ['Worth about 5g'], buildItemEffectLines: () => [], buildEquipmentCompareLines: () => ['Comparison'],
        equipPlayerItemFromSource(it, list) { c.calls.push(['equip', it]); list.splice(list.indexOf(it), 1); player.equipped[it.slot] = it; return 'Equipped ' + it.name; },
        moveEquippedItemToInventory(slot) { const it = player.equipped[slot]; delete player.equipped[slot]; player.inventory.push(it); return it; },
        removeWornRucksack() { player.inventory.push(player.rucksack); player.rucksack = null; },
        dropInventoryEntryToRoom(key, amount) { c.calls.push(['drop', key, amount]); const it = c.takeInventoryEntryAmount(player, key, amount); if (it) room.items.push(it); return it; },
        dropEquippedItemToRoom(slot) { room.items.push(player.equipped[slot]); delete player.equipped[slot]; return true; },
        dropRucksack() { room.items.push(player.rucksack); player.rucksack = null; return 'Dropped rucksack'; },
        takeRoomObject(it) { c.calls.push(['take', it]); if (c.packFull) return; room.items.splice(room.items.indexOf(it), 1); player.inventory.push(it); },
        drinkInventoryEntry(key) { c.calls.push(['drink', key]); return c.takeInventoryEntryAmount(player, key, 1) ? 'You drink it.' : null; },
        eatInventoryHerb(key) { c.calls.push(['herb', key]); return c.takeInventoryEntryAmount(player, key, 1) ? 'You use the herb.' : null; },
        useSupplyEntry(key) { c.calls.push(['supply', key]); return c.takeInventoryEntryAmount(player, key, 1) ? 'You eat the supply.' : null; },
        drinkPotionInCombat(_npc, key) { c.drinkInventoryEntry(key); c.turn(); },
        eatHerbInCombat(_npc, key) { c.eatInventoryHerb(key); c.turn(); },
        aiAvailable: () => !!c.ai, callAI: async () => c.aiResult,
        INTERACT_MENU_ACTIONS: []
    };
    vm.createContext(c);
    vm.runInContext(commands + '\n' + stacks + '\n' + visibility, c);
    c.state = vm.runInContext('textModeState', c);
    c.state.enabled = true; c.state.sessionPlayer = player;
    c.turn = () => { c.textModeNoteCombatTurn({ playerPassed: true }); c.G.combatEncounter.round++; if (c.waitNarration) c.textModeTrackTask(c.waitNarration); };
    c.send = text => c.submitTextModeCommand(text);
    c.last = () => c.events.at(-1);
    return c;
}

test('item aliases, quoted names, primary verbs, plural quantities, and ability priority parse locally', () => {
    const h = harness(true);
    h.player.inventory.push(item('Healing potion', { type: ['potion'] }), item('Second wind', { type: ['potion'] }));
    h.abilities = [{ name: 'Recovery', actions: [{ name: 'Second wind', primary: 'second wind' }] }];
    for (const [input, verb] of [['wear sword', 'equip'], ['put on sword', 'equip'], ['take off sword', 'unequip'], ['pick up sword', 'take'], ['quaff potion', 'drink'], ['chew leaf', 'eat'], ['use healing potion', 'drink'], ['use second wind', 'use'], ['attack head light', 'attack']]) assert.equal(h.parseTextCommand(input).verb, verb, input);
    assert.deepEqual(plain(h.parseTextCommand('drop 2 potions')), { verb: 'drop', args: { item: 'potions', amount: '2' } });
    const batch = h.parseTextCommandBatch('examine "Sword of Smoke and Fire" then inventory');
    assert.equal(batch.actions.length, 2);
    assert.equal(batch.actions[0].args.item, 'Sword of Smoke and Fire');
});

test('inventory, equipment, and floor publish structured public information without opening cards or spending turns', async () => {
    const h = harness(true);
    h.player.inventory.push(item('Potion', { quantity: 3 }), item('Secret', { hidden: true }));
    h.player.equipped = { weapon: item('Sword', { slot: 'weapon' }), coinPouch: item('Coins') };
    h.room.items.push(item('Gem'), item('Hidden gem', { concealed: true }), item('Body', { objectType: 'body' }), item('Statue', { fixed: true }));
    await h.send('show inventory');
    assert.deepEqual(plain(h.last().inventory.items.map(it => [it.name, it.quantity])), [['Potion', 3]]);
    await h.send('show equipment');
    assert.deepEqual(plain(h.last().inventory.items.map(it => it.name)), ['Sword']);
    await h.send('show floor');
    assert.deepEqual(plain(h.last().inventory.items.map(it => it.name)), ['Gem']);
    assert.equal(h.G.combatEncounter.round, 1);
    assert.equal(h.calls.length, 0);
});

test('ambiguous items pause a batch and keep the chosen object when inventory order changes', async () => {
    const h = harness();
    const a = item('Sword', { slot: 'weapon', damage: 4 }), b = item('Sword', { slot: 'weapon', damage: 8 });
    h.player.inventory.push(a, b);
    await h.send('equip sword then equipment');
    assert.equal(h.state.pending.kind, 'item');
    assert.equal(h.state.queue.length, 1);
    assert.equal(h.last().choices.length, 2);
    h.player.inventory.reverse();
    await h.send('2');
    assert.equal(h.player.equipped.weapon, b);
    assert.equal(h.state.queue.length, 0);
});

test('clarifications reject removed, replaced, relocated, and newly hidden items without retargeting', async () => {
    for (const mutate of [
        h => { h.player.inventory.splice(0, 1); },
        h => { h.player.inventory[0] = { ...h.player.inventory[0] }; },
        h => { h.player.inventory[0].stowed = 'other-bag'; },
        h => { h.player.inventory[0].hidden = true; }
    ]) {
        const h = harness();
        h.player.inventory.push(item('Sword', { slot: 'weapon', damage: 4 }), item('Sword', { slot: 'weapon', damage: 8 }));
        await h.send('equip sword'); mutate(h); await h.send('1');
        assert.equal(h.player.equipped.weapon, undefined);
        assert.match(h.last().text, /no longer available/);
    }
});

test('drop validates full requested quantities against the latest stack before removing anything', async () => {
    const h = harness();
    h.player.inventory.push(item('Potion', { quantity: 3 }));
    for (const amount of ['0', '4', '999999999999999999999999']) {
        await h.send('drop ' + amount + ' potions');
        assert.equal(h.player.inventory[0].quantity, 3);
        assert.equal(h.room.items.length, 0);
    }
    await h.send('drop 2 potions');
    assert.equal(h.player.inventory[0].quantity, 1);
    assert.equal(h.room.items[0].quantity, 2);
    await h.send('drop all potions');
    assert.equal(h.player.inventory.length, 0);
    assert.equal(h.room.items[1].quantity, 1);
});

test('combat consumables use their shared handlers and wait for narration before the next queued turn', async () => {
    const h = harness(true);
    h.player.inventory.push(item('Health potion', { type: ['potion'] }), item('Greenwort', { herbKey: 'greenwort' }));
    let finish;
    h.waitNarration = new Promise(resolve => { finish = resolve; });
    const run = h.send('drink health potion then eat greenwort');
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(h.G.combatEncounter.round, 2);
    assert.equal(h.state.queue.length, 1);
    assert.equal(h.state.busy, true);
    h.waitNarration = null; finish(); await run;
    assert.equal(h.G.combatEncounter.round, 3);
    assert.deepEqual(h.calls.filter(call => /^(drink|herb)$/.test(call[0])).map(call => call[0]), ['drink', 'herb']);
});

test('ordinary supplies and useless mana potions cannot spend combat turns or consume inventory', async () => {
    const h = harness(true);
    h.player.inventory.push(item('Ration', { consume: { verb: 'Eat' } }), item('Mana potion', { type: ['potion'], statusKey: 'potionMana' }));
    await h.send('eat ration'); assert.match(h.last().text, /middle of a fight/);
    await h.send('drink mana potion'); assert.match(h.last().text, /no mana/);
    assert.equal(h.player.inventory.length, 2);
    assert.equal(h.G.combatEncounter.round, 1);
    assert.equal(h.calls.length, 0);
});

test('herbal tonics are drinkable through the herb handler and ordinary supplies work outside combat', async () => {
    for (const combat of [false, true]) {
        const h = harness(combat);
        h.player.inventory.push(item('Bracing draught', { herbKey: 'tonic' }));
        await h.send('use bracing draught');
        assert.equal(h.player.inventory.length, 0);
        assert.equal(h.calls.some(call => call[0] === 'herb'), true);
        assert.equal(h.calls.some(call => call[0] === 'drink'), false);
    }
    const h = harness(); h.player.inventory.push(item('Bread', { consume: { verb: 'Eat' } }));
    await h.send('eat bread'); assert.equal(h.calls.some(call => call[0] === 'supply'), true);
});

test('pickup refuses concealed or fixed items, blocks combat, and pauses a batch on full storage', async () => {
    const h = harness();
    h.room.items.push(item('Gem', { hidden: true }), item('Statue', { fixed: true }), item('Sword'));
    await h.send('take gem'); await h.send('take statue'); assert.equal(h.calls.length, 0);
    h.packFull = true; await h.send('take sword then inventory');
    assert.equal(h.room.items.length, 3); assert.equal(h.state.queue.length, 1); assert.equal(h.state.paused, true);
    const fight = harness(true); fight.room.items.push(item('Sword')); await fight.send('take sword');
    assert.equal(fight.calls.length, 0);
});

test('slow item descriptions cannot publish inspection results after an item or scene changes', async () => {
    const h = harness(); h.player.inventory.push(item('Sword', { slot: 'weapon' }));
    let finish; h.examine = () => new Promise(resolve => { finish = resolve; });
    const run = h.send('examine sword then drop sword');
    await new Promise(resolve => setImmediate(resolve));
    h.player.inventory[0].hidden = true; finish('A description'); await run;
    assert.equal(h.events.some(event => event.item), false);
    assert.equal(h.state.queue.length, 1); assert.equal(h.state.paused, true);
    assert.equal(h.room.items.length, 0);
});

test('AI plans share inventory argument schemas and cannot bypass current item or quantity checks', async () => {
    const h = harness(); h.player.inventory.push(item('Potion', { quantity: 2 }));
    assert.equal(h.validateTextAIPlan({ actions: [{ verb: 'drop', args: { item: 'potion', amount: '2', dangerous: 'yes' } }] }), null);
    h.ai = true; h.aiResult = JSON.stringify({ actions: [{ verb: 'drop', args: { item: 'potion', amount: '5' } }] });
    await h.send('set five potions on the ground');
    assert.equal(h.player.inventory[0].quantity, 2); assert.equal(h.room.items.length, 0);
    h.aiResult = JSON.stringify({ actions: [{ verb: 'drop', args: { item: 'potion', amount: '2' } }] });
    await h.send('set both potions down'); assert.equal(h.player.inventory.length, 0); assert.equal(h.room.items[0].quantity, 2);
});
