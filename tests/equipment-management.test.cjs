const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const corePath = process.argv[2] || 'C:/Git/CYOADEV/cyoaftw-engine-CORE.js';
const source = fs.readFileSync(corePath, 'utf8').replace(/\r\n/g, '\n');
function extract(start, end) {
    const first = source.indexOf(start), last = source.indexOf(end, first);
    assert.ok(first >= 0 && last > first, 'Missing source section: ' + start);
    return source.slice(first, last);
}
function element(tag = 'div') {
    let content = '';
    const classes = new Set();
    return {
        tag, children: [], attributes: {}, value: '', className: '', style: {},
        classList: { add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name),
            toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); } },
        focus() {},
        setAttribute(name, value) { this.attributes[name] = value; },
        appendChild(child) { this.children.push(child); return child; },
        get textContent() { return content + this.children.map(child => child.textContent).join(' '); },
        set textContent(value) { content = String(value); this.children = []; },
        set innerHTML(value) { assert.equal(value, ''); content = ''; this.children = []; }
    };
}
function harness() {
    const inventory = element();
    const trade = element();
    const elements = Object.fromEntries(['itemModal', 'itemModalTitle', 'itemModalDesc', 'itemModalStats', 'itemModalActions', 'itemModalClose',
        ...['head', 'weapon', 'hand', 'upper', 'hands', 'lower', 'feet', 'neck', 'belt', 'coinPouch'].map(slot => 'eq-slot-' + slot)].map(id => [id, element()]));
    let uid = 0;
    const c = {
        console, window: {}, G: { player: null, activeRoom: { items: [] } },
        document: { createElement: element, getElementById(id) { return id === 'equipmentInventory' ? inventory : (id === 'chatOptionsEl' ? trade : (elements[id] || null)); } },
        assignLootUID(item) { item._uid = item._uid || 'test-' + ++uid; item.id = item.id || item._uid; return item; },
        getItemName(item) { return item && item.name || 'item'; },
        isPotionItem(item) { return !!(item && [].concat(item.type || []).includes('potion')); },
        isUnarmedWeaponItem(item) { return !item || item === 'unarmed'; },
        getWeaponTypeFromName() { return 'sword'; }, getWeaponDamageByName() { return 6; },
        createPlayerStartingItem(name, slot, options) { return c.cloneLootTemplate({ name, slot, ...options }); },
        renderOtherWornItems() {}, renderEquipmentSlot() {}, getOwnItemFireSpellButtons() { return []; },
        withIndefiniteArticle(name) { return 'a ' + name; },
        dropItemIntoCurrentRoom(item) { c.G.activeRoom.items.push(item); return true; },
        createEquipmentActionButton(label, onClick, options = {}) { const button = element('button'); button.textContent = label; button.onclick = onClick; Object.assign(button, options); return button; },
        refreshInventoryUi(message) { c.lastMessage = message; c.renderEquipment(); },
        createEquipmentQuantityInput(max, value) { const input = element('input'); input.max = max; input.value = value; return input; },
        readEquipmentQuantityInput(input) { return Number(input.value); },
        WIZARD_SPELLS: {}, openEquipmentExamine() {}, playerUsesMana() { return false; },
        getItemLiquid() { return null; }
    };
    for (const name of ['isAlcoholItem', 'isHerbItem', 'isDeityTomeItem', 'isGenericLoreItem', 'isSpellScrollItem', 'isSpellbookItem', 'isClassPrimerItem', 'isClassGearItem']) c[name] = () => false;
    vm.createContext(c);
    vm.runInContext(extract('function cloneLootTemplate(', 'function pickLootQuality('), c);
    vm.runInContext(extract('function ensurePlayerEquipmentState(', 'function isPotionItem('), c);
    vm.runInContext(extract('function dropItemIntoCurrentRoom(', '// Remove a worn item'), c);
    vm.runInContext(extract('function moveEquippedItemToInventory(', 'function getEquippedItem('), c);
    vm.runInContext(extract('function renderEquipmentInventoryEntry(', '// ── CHARACTER SHEET'), c);
    vm.runInContext(extract('function getPlayerCarryContainers(', '// ── SPINNER'), c);
    vm.runInContext(extract('function getTradeStackKey(', 'function recordTradeMemory('), c);
    vm.runInContext(extract('function sellTradeItem(', 'function setChatOptionsDisabled('), c);
    vm.runInContext(extract('function moveOneItemOutOfPack(', 'function openCompanionGearMenu('), c);
    vm.runInContext(extract('function completeGift(', 'window.giveItemToNPC ='), c);
    Object.assign(c, {
        canConverseWithNPC: () => true, ensureNPCTradeStock: npc => npc.inventory || [],
        isItemEquippedByEntity: (entity, item) => entity.rucksack === item || Object.values(entity.equipped || {}).includes(item),
        getTradeBuyPrice: (npc, item) => c.getItemUnitValue(item),
        hasEnoughCoins: (entity, amount) => (entity.coins || 0) >= amount,
        adjustCoins(entity, amount) { entity.coins = (entity.coins || 0) + amount; },
        isForgeSmith: () => false, isClothier: () => false, isForgeWhetstone: () => false,
        isTradeAccepted: () => true, renownRefusesTrade: () => false, getMerchantSellMultiplier: () => 1,
        showTradeMessage(message) { c.tradeMessage = message; },
        renderStats() {}, recordTradeMemory() {}, addChatMessage() {},
        saveGameState() { c.saves = (c.saves || 0) + 1; },
        forgeButton(label, onClick) { return c.createEquipmentActionButton(label, onClick); },
        getEntityName: npc => npc.name, addStoryFact() {}, applyNPCImpact() {}, renderNPCActionMenu() {},
        setNarration(message) { c.narration = message; }
    });
    c.getOwnItemFireSpellButtons = () => [];
    c.formatInventoryItemLabel = (item, qty) => item.name + (qty > 1 ? ' ×' + qty : '');
    function bag(name, capacity = 18, size = 8) {
        const item = c.cloneLootTemplate({ name, type: ['misc', 'pack'], unitSize: size, container: { bag: true, maxUnitCapacity: capacity, straps: 2, wearable: 'back' } });
        c.ensureContainerKey(item);
        return item;
    }
    const p = { _baselineClothingSeeded: true, inventory: [], equipped: {
        lower: { name: 'Travel trousers', type: ['clothes', 'lower'] },
        belt: { name: 'Utility belt', type: ['belt'], pouchSlots: 3 }
    }, rucksack: bag('Rucksack') };
    c.G.player = p;
    c.restowPlayerPack(p);
    function enableEquipmentDetails() {
        Object.assign(c, {
            equipmentExamineItem: null, clearItemModalContents() {}, buildItemEffectLines: () => [],
            getEffectiveItemCharisma: item => item && item.charisma || 0,
            getItemArmorValue: item => item && item.armor || 0,
            getItemGrimeCharismaPenalty: () => 0, getDurabilityExamineLine: () => '',
            getCoinValue: entity => entity.coins || 0, RELIC_POWERS: {},
            signedNumber: number => number > 0 ? '+' + number : String(number),
            getWeaponSkillSummary: () => 'Untrained',
            getWeaponExamineProfile: item => ({ type: 'sword', avg: ((item.damage || 4) + 1) / 2, hit: 0, skillHit: 0, die: item.damage || 4, dmg: 0 }),
            closeItemModal() { elements.itemModal.classList.remove('active'); }, refreshRoomViewAfterClose() {}
        });
        vm.runInContext(extract('function getItemExamineStats(', 'function closeEquipmentExamine('), c);
        vm.runInContext(extract('function closeEquipmentExamine(', 'document.addEventListener("keydown"'), c);
        vm.runInContext(extract('function renderEquipmentSlot(', 'function renderEquipmentInventoryEntry('), c);
    }
    return { c, p, inventory, bag, trade, elements, enableEquipmentDetails };
}
function allElements(node) { return [node, ...node.children.flatMap(allElements)]; }
function test(name, run) { run(); console.log('PASS ' + name); }

test('weapon sizes follow item names; legacy defaults upgrade and explicit sizes survive', () => {
    const { c } = harness();
    for (const [name, size] of [['Dagger', 2], ['Ruby dagger', 2], ['Sword', 3], ['Short sword', 3], ['Mace', 3], ['Warhammer', 4], ['War hammer', 4], ['Staff', 4], ['Spellstaff of Focus', 4], ['Greatsword', 4], ['Spear', 4], ['Axe', 3], ['Battle axe', 4]]) {
        assert.equal(c.getItemUnitSize({ name, type: ['weapon'] }), size, name);
        const oldSize = c.inferItemUnitSizeFromRules({ name, type: ['weapon'] });
        assert.equal(c.getItemUnitSize({ name, type: ['weapon'], unitSize: oldSize }), size, name + ' old save');
        assert.equal(c.getItemUnitSize(c.cloneLootTemplate({ name, type: ['weapon'] })), size, name + ' new loot');
    }
    assert.equal(c.getItemUnitSize(c.cloneLootTemplate({ name: 'Sword', unitSize: 4 })), 4);
    assert.equal(c.getItemUnitSize(c.cloneLootTemplate(c.cloneLootTemplate({ name: 'Sword' }), { unitSize: 2 })), 2);
    assert.equal(c.getItemUnitSize({ name: 'Sword', unitSize: 7 }), 7);
    assert.equal(c.getItemUnitSize({ name: 'Iron ore', type: ['ore'] }), 1);
    assert.equal(c.getItemUnitSize({ name: 'Silver ring' }), 0);
});

test('clothing and armour sizes rebalance new loot and existing inferred defaults', () => {
    const { c } = harness();
    for (const [name, type, size] of [
        ['Linen shirt', 'clothes', 1], ['Travel trousers', 'clothes', 1], ['Cloth pants', 'clothes', 1],
        ['Tunic', 'armor', 1], ['Leggings', 'armor', 1], ['Linen skirt', 'clothes', 2], ['Leather skirt', 'clothes', 2],
        ['Greaves', 'armor', 5], ['Steel greaves', 'armor', 5], ['Chainmail', 'armor', 5], ['Chain mail', 'armor', 5],
        ['Chain shirt', 'armor', 5], ['Ring mail', 'armor', 5], ['Plate armour', 'armor', 8],
        ['Leather armor', 'armor', 3], ['Wool cloak', 'clothes', 2], ['Robe', 'clothes', 2],
        ['Boots', 'clothes', 2], ['Shoes', 'clothes', 1], ['Gloves', 'clothes', 1], ['Helmet', 'armor', 3],
        ['Plate gauntlets', 'armor', 3], ['Steel cuirass', 'armor', 8]
    ]) {
        const item = { name, type: [type] };
        assert.equal(c.getItemUnitSize(item), size, name);
        assert.equal(c.getItemUnitSize({ ...item, unitSize: c.inferItemUnitSizeFromRules(item) }), size, name + ' legacy save');
        assert.equal(c.getItemUnitSize({ ...item, unitSize: 8, unitSizeInferred: true }), size, name + ' inferred save');
        assert.equal(c.getItemUnitSize(c.cloneLootTemplate(item)), size, name + ' new loot');
        assert.equal(c.getItemUnitSize(c.cloneLootTemplate(item, { unitSize: 7 })), 7, name + ' custom');
    }
    assert.equal(c.getItemUnitSize({ name: 'Iron shirt', material: 'iron', type: ['armor'] }), 5);
    assert.equal(c.getItemUnitSize({ name: 'Silk shirt', material: 'cloth', type: ['clothes'] }), 1);
});

test('equipping frees storage, removing and swapping correctly use storage', () => {
    const { c, p } = harness();
    const used = () => c.buildEquipmentInventoryGroups(p).groups.reduce((sum, group) => sum + group.used, 0);
    const sword = c.cloneLootTemplate({ name: 'Sword', type: ['weapon'] });
    p.inventory.push(sword);
    c.restowPlayerPack(p);
    assert.equal(used(), 3);
    assert.ok(c.equipInventoryEntry(c.getInventoryEntryKey(sword)));
    c.restowPlayerPack(p);
    assert.equal(p.inventory.length, 0);
    assert.equal(used(), 0);
    assert.equal(p.equipped.weapon.stowed, undefined);
    assert.ok(c.moveEquippedItemToInventory('weapon'));
    c.restowPlayerPack(p);
    assert.equal(used(), 3);
    const staff = c.cloneLootTemplate({ name: 'Staff', type: ['weapon'] });
    p.inventory.push(staff);
    c.restowPlayerPack(p);
    c.equipInventoryEntry(c.getInventoryEntryKey(sword));
    c.equipInventoryEntry(c.getInventoryEntryKey(staff));
    c.restowPlayerPack(p);
    assert.equal(p.equipped.weapon.name, 'Staff');
    assert.equal(p.inventory.length, 1);
    assert.equal(p.inventory[0].name, 'Sword');
    assert.equal(used(), 3);
});

test('rucksack and combined usage show units, including pockets, belt and hand', () => {
    const { c, p } = harness();
    const pockets = c.getGarmentPlaces(p.equipped.lower).storage;
    const belt = c.getGarmentPlaces(p.equipped.belt).storage[0];
    const sack = c.getGarmentPlaces(p.rucksack).storage[0];
    p.inventory.push({ name: 'Herb', quantity: 1, stowed: pockets[0].id }, { name: 'Bandage', stowed: pockets[1].id },
        { name: 'Potion', type: ['potion'], stowed: belt.id }, { name: 'Sword', quantity: 2, stowed: sack.id }, { name: 'Staff', stowed: sack.id });
    c.renderEquipment();
    assert.match(inventoryText(c), /Rucksack: 10\/18 units · Combined storage: 13\/24 units/);
    function inventoryText() { return c.document.getElementById('equipmentInventory').textContent; }
});

test('all nested contents are expanded, counted once and kept when dropping the outer pack', () => {
    const { c, p, inventory, bag } = harness();
    const outer = bag('Canvas satchel', 8, 3), inner = bag('Small pouch', 4, 2);
    outer.stowed = c.getGarmentPlaces(p.rucksack).storage[0].id;
    inner.stowed = c.getGarmentPlaces(outer).storage[0].id;
    const dagger = { name: 'Dagger', type: ['weapon'], stowed: c.getGarmentPlaces(inner).storage[0].id };
    p.inventory.push(outer, inner, dagger);
    c.renderEquipment();
    const view = c.buildEquipmentInventoryGroups(p);
    assert.equal(view.byItem.get(p.rucksack).used, 3);
    assert.equal(view.byItem.get(outer).used, 2);
    assert.equal(view.byItem.get(inner).used, 2);
    assert.match(inventory.textContent, /Combined storage: 7\/36 units/);
    const titles = allElements(inventory).filter(node => node.className === 'equipment-row-title').map(node => node.textContent);
    assert.equal(titles.filter(title => title === 'Dagger').length, 1);
    const wornSack = p.rucksack;
    c.dropRucksack();
    assert.equal(p.rucksack, null);
    assert.equal(p.inventory.length, 0);
    assert.equal(wornSack.packed[0], outer);
    assert.equal(outer.packed[0], inner);
    assert.equal(inner.packed[0], dagger);
    c.wearRucksack(wornSack);
    assert.equal(p.inventory.length, 3);
    assert.equal(dagger.stowed, c.getGarmentPlaces(inner).storage[0].id);
});

test('duplicates in different containers act on the selected source and block nesting cycles', () => {
    const { c, p, bag } = harness();
    const outer = bag('Satchel', 12, 2), inner = bag('Pouch', 8, 2);
    const sackId = c.getGarmentPlaces(p.rucksack).storage[0].id;
    const outerId = c.getGarmentPlaces(outer).storage[0].id;
    const innerId = c.getGarmentPlaces(inner).storage[0].id;
    outer.stowed = sackId; inner.stowed = outerId;
    const a = { name: 'Dagger', type: ['weapon'], stowed: sackId };
    const b = { name: 'Dagger', type: ['weapon'], stowed: innerId };
    p.inventory.push(outer, inner, a, b);
    c.restowPlayerPack(p);
    assert.equal(c.buildPlayerInventoryEntries(p).filter(entry => entry.item.name === 'Dagger').length, 2);
    const dropped = c.dropInventoryEntryToRoom(c.getInventoryEntryKey(a), 1);
    assert.equal(dropped.stowed, sackId);
    assert.ok(p.inventory.includes(b));
    assert.ok(!p.inventory.includes(a));
    c.storeInCarryContainer(inner, c.getInventoryEntryKey(outer));
    assert.equal(outer.stowed, sackId);
    const actions = element();
    c.appendEquipmentMoveControl({ item: outer, key: c.getInventoryEntryKey(outer), totalQuantity: 1 }, actions);
    assert.ok(!actions.textContent.includes('Pouch'));
    const movedMessage = c.storeInCarryContainer(outer, c.getInventoryEntryKey(b));
    assert.match(movedMessage, /You put/);
    assert.equal(b.stowed, outerId);
});

test('move selector transfers one item from the displayed stack', () => {
    const { c, p, inventory } = harness();
    const herb = { name: 'Herb', quantity: 2, stowed: c.getGarmentPlaces(p.rucksack).storage[0].id };
    p.inventory.push(herb);
    c.renderEquipment();
    const select = allElements(inventory).find(node => node.tag === 'select');
    assert.ok(select);
    const beltOption = select.children.find(node => node.textContent === 'Utility belt');
    assert.ok(beltOption);
    select.value = beltOption.value;
    select.onchange();
    assert.equal(herb.quantity, 1);
    const beltId = c.getGarmentPlaces(p.equipped.belt).storage[0].id;
    assert.equal(p.inventory.find(item => item.stowed === beltId).quantity, 1);
});

test('storing a nested bag in a floor container transfers its descendants too', () => {
    const { c, p, bag } = harness();
    const floor = bag('Floor chest', 20), outer = bag('Satchel', 6, 2), inner = bag('Pouch', 4, 2);
    outer.stowed = c.getGarmentPlaces(p.rucksack).storage[0].id;
    inner.stowed = c.getGarmentPlaces(outer).storage[0].id;
    const dagger = { name: 'Dagger', stowed: c.getGarmentPlaces(inner).storage[0].id };
    p.inventory.push(outer, inner, dagger);
    c.restowPlayerPack(p);
    assert.match(c.storeInCarryContainer(floor, c.getInventoryEntryKey(outer)), /You put/);
    assert.equal(p.inventory.length, 0);
    assert.equal(floor.packed[0], outer);
    assert.equal(outer.packed[0], inner);
    assert.equal(inner.packed[0], dagger);
});

test('empty packs retain controls; tied gear and overflow are separate from occupied units', () => {
    const { c, p, inventory } = harness();
    c.renderEquipment();
    assert.match(inventory.textContent, /Rucksack: 0\/18 units · Combined storage: 0\/24 units/);
    assert.match(inventory.textContent, /Set rucksack down/);
    assert.match(inventory.textContent, /Travel trousers/);
    const tie = c.getGarmentPlaces(p.equipped.belt).ties[0];
    p.inventory.push({ name: 'Staff', type: ['weapon'], stowed: tie.id }, { name: 'Anvil', unitSize: 50 });
    c.renderEquipment();
    assert.match(inventory.textContent, /Combined storage: 0\/24 units · 1 tied on · 1 with no room/);
    assert.match(inventory.textContent, /No room · Overflow/);
    assert.match(inventory.textContent, /Tied on: 1\/3/);
});

test('deeply nested saved contents restore fully and identical garments keep separate identities', () => {
    const { c, p, bag } = harness();
    let parent = p.rucksack;
    for (let i = 0; i < 9; i++) {
        const child = bag('Pouch ' + i, 4, 2);
        child.stowed = c.getGarmentPlaces(parent).storage[0].id;
        parent.packed = [child];
        parent = child;
    }
    parent.packed = [{ name: 'Dagger', stowed: c.getGarmentPlaces(parent).storage[0].id }];
    c.restowPlayerPack(p);
    assert.equal(p.inventory.length, 10);
    assert.ok(p.inventory.some(item => item.name === 'Dagger'));
    const a = { name: 'Trousers', type: ['lower'] }, b = { name: 'Trousers', type: ['lower'] };
    assert.notEqual(c.getInventoryStackKey(a), c.getInventoryStackKey(b));
});

test('trade shows a contents indicator and disabled Sell, then enables it once empty', () => {
    const { c, p, bag, trade } = harness();
    const sack = bag('Canvas bag', 6, 2);
    const nested = bag('Empty pouch', 3, 1);
    sack.stowed = c.getGarmentPlaces(p.rucksack).storage[0].id;
    nested.stowed = c.getGarmentPlaces(sack).storage[0].id;
    p.inventory.push(sack, nested);
    const npc = { name: 'Merchant', coins: 1000, inventory: [] };
    c.renderTradeOptions(npc);
    let row = trade.children.find(node => node.className === 'trade-item-row' && node.children[0].textContent.startsWith('Canvas bag'));
    assert.match(row.textContent, /Contains items — empty before selling/);
    let sell = row.children.find(node => node.textContent === 'Sell');
    assert.equal(sell.disabled, true);
    assert.match(sell.title, /Contains items/);
    assert.equal(row.children.find(node => node.textContent === 'Examine').disabled, undefined);
    const emptyRow = trade.children.find(node => node.className === 'trade-item-row' && node.children[0].textContent.startsWith('Empty pouch'));
    assert.equal(emptyRow.children.find(node => node.textContent === 'Sell').disabled, false);
    p.inventory.splice(p.inventory.indexOf(nested), 1);
    c.renderTradeOptions(npc);
    row = trade.children.find(node => node.className === 'trade-item-row' && node.children[0].textContent.startsWith('Canvas bag'));
    sell = row.children.find(node => node.textContent === 'Sell');
    assert.equal(sell.disabled, false);
    assert.doesNotMatch(row.textContent, /Contains items/);
    // The sale itself rechecks even if this button predates a contents change.
    sack.packed = [{ name: 'Herb' }];
    sell.onclick();
    assert.ok(p.inventory.includes(sack));
    assert.equal(npc.coins, 1000);
    assert.match(c.tradeMessage, /empty before selling/);
    sack.packed = [];
    c.sellTradeItem(npc, sack);
    assert.ok(!p.inventory.includes(sack));
    assert.ok(npc.inventory.includes(sack));
    assert.equal(p.coins, 1);
});

test('full containers block both bulk sale controls and direct bulk sale calls', () => {
    const { c, p, bag, trade } = harness();
    const sack = bag('Bag stack', 6, 2);
    sack.quantity = 12;
    sack.packed = [{ name: 'Herb' }];
    p.inventory.push(sack);
    const npc = { name: 'Merchant', coins: 1000, inventory: [] };
    c.renderTradeOptions(npc);
    const row = trade.children.find(node => node.className === 'trade-item-row' && node.children[0].textContent.startsWith('Bag stack'));
    assert.equal(row.children.find(node => node.textContent === 'Sell 10').disabled, true);
    assert.equal(row.children.find(node => node.textContent === 'Sell').disabled, true);
    c.sellTradeItems(npc, c.groupItemsForDisplay([sack])[0], 10);
    assert.equal(sack.quantity, 12);
    assert.equal(npc.inventory.length, 0);
    assert.equal(npc.coins, 1000);
    assert.match(c.tradeMessage, /empty before selling/);
});

test('sell all junk excludes filled containers and pocketed garments, including zero-size contents', () => {
    const { c, p, bag, trade } = harness();
    const sack = bag('Canvas bag', 6, 2);
    sack.packed = [{ name: 'Herb' }];
    const trousers = { name: 'Spare trousers', type: ['clothes', 'lower'] };
    const key = { name: 'Brass key', opensLockId: 'quest-door', stowed: c.getGarmentPlaces(trousers).storage[0].id };
    const belt = { name: 'Spare belt', type: ['belt'] };
    const tied = { name: 'Quest charm', opensLockId: 'other-door', stowed: c.getGarmentPlaces(belt).ties[0].id };
    const junk = { name: 'Broken pebble', value: 2 };
    p.inventory.push(sack, trousers, key, belt, tied, junk);
    assert.equal(c.getItemUnitSize(key), 0);
    assert.ok(c.getContainerSaleBlockReason(trousers));
    assert.ok(c.getContainerSaleBlockReason(belt));
    assert.equal(c.isVendorJunkItem(sack), false);
    assert.equal(c.isVendorJunkItem(trousers), false);
    const npc = { name: 'Merchant', coins: 1000, inventory: [] };
    c.renderTradeOptions(npc);
    assert.match(trade.children.find(node => node.tag === 'button' && node.textContent.startsWith('Sell all junk')).textContent, /1 item/);
    c.sellJunkItems(npc);
    assert.ok(p.inventory.includes(sack));
    assert.ok(p.inventory.includes(trousers));
    assert.ok(p.inventory.includes(key));
    assert.ok(p.inventory.includes(belt));
    assert.ok(p.inventory.includes(tied));
    assert.equal(npc.inventory.length, 1);
    assert.equal(npc.inventory[0].name, junk.name);
});

test('filled containers remain buyable and ordinary liquid containers stay sellable', () => {
    const { c, p, bag, trade } = harness();
    p.coins = 100;
    const sack = bag('Merchant bag', 6, 2);
    sack.packed = [{ name: 'Herb' }];
    const npc = { name: 'Merchant', coins: 1000, inventory: [sack] };
    c.renderTradeOptions(npc);
    const row = trade.children.find(node => node.className === 'trade-item-row');
    assert.equal(row.children.find(node => node.textContent === 'Buy').disabled, false);
    assert.doesNotMatch(row.textContent, /empty before selling/);
    assert.equal(c.getContainerSaleBlockReason({ name: 'Potion', type: ['potion'], container: { liquid: true, maxUnitCapacity: 1 } }), '');
});

test('gifting a filled container still transfers all its contents', () => {
    const { c, p, bag } = harness();
    const sack = bag('Gift bag', 6, 2);
    sack.stowed = c.getGarmentPlaces(p.rucksack).storage[0].id;
    const herb = { name: 'Herb', stowed: c.getGarmentPlaces(sack).storage[0].id };
    p.inventory.push(sack, herb);
    const npc = { name: 'Companion', inventory: [] };
    assert.ok(c.getContainerSaleBlockReason(sack));
    c.completeGift(npc, c.getInventoryEntryKey(sack), sack, { verdict: 'accept', favor: 2, reaction: 'Thanks.' }, false);
    assert.equal(p.inventory.length, 0);
    assert.equal(npc.inventory.length, 1);
    assert.equal(npc.inventory[0]._ck, sack._ck);
    assert.equal(npc.inventory[0].packed[0], herb);
});

test('companion equipment transfers still accept filled garments', () => {
    const { c, p } = harness();
    const belt = { name: 'Utility belt', type: ['belt'], pouchSlots: 3 };
    const herb = { name: 'Herb', stowed: c.getGarmentPlaces(belt).storage[0].id };
    p.inventory.push(belt, herb);
    const npc = { name: 'Companion', inventory: [], equipped: {} };
    assert.ok(c.getContainerSaleBlockReason(belt));
    const moved = c.moveOneItemOutOfPack(p, belt);
    c.equipItemOnCompanion(npc, moved, 'belt');
    assert.equal(p.inventory.length, 0);
    assert.equal(npc.equipped.belt, belt);
    assert.equal(npc.equipped.belt.packed[0], herb);
});

test('worn containers have direct Remove and Drop controls, with carried Equip and Drop after removal', () => {
    const { c, p, inventory } = harness();
    const belt = p.equipped.belt;
    const herb = { name: 'Herb', stowed: c.getGarmentPlaces(belt).storage[0].id };
    p.inventory.push(herb);
    c.renderEquipment();
    allElements(inventory).find(node => node.tag === 'button' && node.textContent === 'Remove Utility belt').onclick();
    assert.equal(p.equipped.belt, undefined);
    assert.ok(p.inventory.includes(belt));
    assert.ok(p.inventory.includes(herb));
    const row = allElements(inventory).find(node => node.className === 'equipment-row' && node.textContent.includes('Utility belt'));
    assert.ok(row);
    assert.ok(allElements(row).some(node => node.tag === 'button' && node.textContent === 'Drop'));
    allElements(row).find(node => node.tag === 'button' && node.textContent === 'Equip').onclick();
    assert.equal(p.equipped.belt.name, 'Utility belt');
    assert.equal(herb.stowed, c.getGarmentPlaces(p.equipped.belt).storage[0].id);
    allElements(inventory).find(node => node.tag === 'button' && node.textContent === 'Drop Utility belt').onclick();
    assert.equal(p.equipped.belt, undefined);
    assert.ok(!p.inventory.includes(herb));
    assert.equal(c.G.activeRoom.items[0].packed[0], herb);
});

test('every carried container retains its own row in fallback layouts, without duplicate item actions', () => {
    const { c, p, inventory, bag } = harness();
    const a = bag('Satchel A', 8, 2), b = bag('Satchel B', 8, 2);
    a.stowed = c.getGarmentPlaces(b).storage[0].id;
    b.stowed = c.getGarmentPlaces(a).storage[0].id;
    p.inventory.push(a, b);
    c.renderEquipment();
    const rows = allElements(inventory).filter(node => node.className === 'equipment-row');
    for (const name of [a.name, b.name]) {
        const ownRows = rows.filter(row => allElements(row).some(node => node.className === 'equipment-row-title' && node.textContent === name));
        assert.equal(ownRows.length, 1);
        assert.ok(allElements(ownRows[0]).some(node => node.tag === 'button' && node.textContent === 'Drop'));
    }
});

test('empty equipment slots show Swap and equip the best carried item', () => {
    const { c, p, elements, enableEquipmentDetails } = harness();
    enableEquipmentDetails();
    const weak = { name: 'Wool cap', type: ['armor', 'head'], armor: 1 };
    const best = { name: 'Iron helmet', type: ['armor', 'head'], armor: 4 };
    const ruined = { name: 'Ruined helmet', type: ['armor', 'head'], armor: 100, ruined: true };
    p.inventory.push(weak, best, ruined);
    c.renderEquipment();
    const box = elements['eq-slot-head'];
    assert.match(box.textContent, /Best in pack: Iron helmet/);
    const swap = allElements(box).find(node => node.tag === 'button' && node.textContent === 'Swap');
    assert.equal(swap.disabled, false);
    swap.onclick();
    assert.equal(p.equipped.head.name, best.name);
    assert.ok(p.inventory.includes(weak));
    assert.ok(p.inventory.includes(ruined));
    const count = p.inventory.length;
    swap.onclick();
    assert.equal(p.inventory.length, count);
});

test('empty slot Swap remains visible without candidates, and available gloves reveal the Hands slot', () => {
    const { c, p, elements, enableEquipmentDetails } = harness();
    enableEquipmentDetails();
    c.renderEquipmentSlot('head');
    const swap = allElements(elements['eq-slot-head']).find(node => node.tag === 'button' && node.textContent === 'Swap');
    assert.ok(swap);
    assert.equal(swap.disabled, true);
    const gloves = { name: 'Cloth gloves', type: ['clothes', 'hands'] };
    p.inventory.push(gloves);
    c.restowPlayerPack(p);
    c.renderEquipmentSlot('hands');
    assert.equal(elements['eq-slot-hands'].style.display, '');
    const equip = allElements(elements['eq-slot-hands']).find(node => node.tag === 'button' && node.textContent === 'Swap');
    assert.equal(equip.disabled, false);
    equip.onclick();
    assert.equal(p.equipped.hands.name, gloves.name);
});

test('examining a carried item offers Swap for an empty slot and an occupied one', () => {
    for (const occupied of [false, true]) {
        const { c, p, elements, enableEquipmentDetails } = harness();
        enableEquipmentDetails();
        const current = { name: 'Wool cap', type: ['armor', 'head'], armor: 1 };
        if (occupied) p.equipped.head = current;
        const helmet = { name: 'Iron helmet', type: ['armor', 'head'], armor: 4, examineText: 'A sturdy helmet.' };
        p.inventory.push(helmet);
        c.restowPlayerPack(p);
        c.openEquipmentExamine(helmet, { slot: 'head', equipped: false });
        const swap = elements.itemModalActions.children.find(node => node.textContent === 'Swap');
        assert.ok(swap);
        if (!occupied) assert.match(elements.itemModalStats.textContent, /Nothing is equipped/);
        swap.onclick();
        assert.equal(p.equipped.head.name, helmet.name);
        assert.equal(p.inventory.includes(current), occupied);
        assert.equal(elements.itemModal.classList.contains('active'), false);
    }
});

test('worn gear retains the existing Swap recommended upgrade action', () => {
    const { c, p, elements, enableEquipmentDetails } = harness();
    enableEquipmentDetails();
    const current = { name: 'Wool cap', type: ['armor', 'head'], armor: 1, examineText: 'A wool cap.' };
    const helmet = { name: 'Iron helmet', type: ['armor', 'head'], armor: 4 };
    p.equipped.head = current;
    p.inventory.push(helmet);
    c.restowPlayerPack(p);
    c.openEquipmentExamine(current, { slot: 'head', equipped: true });
    const swap = elements.itemModalActions.children.find(node => node.textContent === 'Swap recommended');
    assert.ok(swap);
    swap.onclick();
    assert.equal(p.equipped.head.name, helmet.name);
    assert.ok(p.inventory.includes(current));
});

console.log('Equipment management checks passed.');
