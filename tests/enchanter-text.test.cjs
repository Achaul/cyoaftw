const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const source = fs.readFileSync(process.argv[2] || 'C:/Git/CYOAFTW/.enchanter-text/cyoaftw-engine-CORE.js', 'utf8').replace(/\r\n/g, '\n');
function section(a, b) { const start = source.indexOf(a), end = source.indexOf(b, start); assert(start >= 0 && end > start, a); return source.slice(start, end); }
const code = section('// Text commands are a presentation/input layer.', '// END TEXT COMMANDS') + '\n' + section('const ENCHANT_MAX_TIER', '// One row per tradeable item:');
function element() { return { children: [], style: {}, appendChild(child) { this.children.push(child); }, set innerHTML(_) { this.children = []; }, addEventListener() {}, setAttribute() {} }; }
function harness() {
    let uid = 0;
    const player = { hp: 20, inventory: [], equipped: {}, coins: 1000 }, vendor = { name: 'Mara', role: 'Enchanter', hp: 30, inventory: [], equipped: {}, coins: 50, memory: { favorability: 20 } };
    const room = { coords: '0,0', creatures: [vendor], structural: [], items: [] }, el = element();
    const c = { console, setTimeout, clearTimeout, player, vendor, room, el, turn: 100, events: [], rolls: [], Math: Object.create(Math),
        G: { player, activeRoom: room, activeNPC: vendor, activeNPCMode: 'menu', partyMembers: [], sessionFollowers: [], _partyLootPending: [] },
        document: { getElementById: id => id === 'chatOptionsEl' ? el : null, createElement: element }, window: {}, CustomEvent: function (_, opts) { this.detail = opts.detail; },
        getItemName: i => i.name, getItemQuantity: i => i.quantity || 1, getItemValue: i => (i.value || 1) * (i.quantity || 1),
        isLootItemVisible: i => !!i && !i.hidden && !i.isHidden && !i.concealed && i.visible !== false, isVisibleEntity: i => !i.hidden,
        isBrokenWeapon: i => !!i && i.broken === true, isForgeSmith: n => !!n && n.role === 'Blacksmith',
        isItemEquippedByEntity: (p, i) => Object.values(p.equipped || {}).some(w => w === i || w && w._uid && w._uid === i._uid),
        canConverseWithNPC: () => true, isNPCOffDuty: n => !!n.offDuty, renownRefusesTrade: () => false,
        getCoinValue: p => p.coins || 0, hasEnoughCoins: (p, n) => p.coins >= n, adjustCoins: (p, n) => { p.coins += n; },
        roomHasActiveHostile: () => !!c.hostile, isRoomCollapsed: () => false, isPlayerJailed: () => false, hasPendingPartyLoot: () => false,
        getCurrentStoryTurn: () => c.turn, createCombatButton: (label, onclick, opts = {}) => ({ label, onclick, ...opts }),
        showTradeMessage(text) { c.publishTextModeOutput('narration', text, {}, false); }, setNarration(text) { c.publishTextModeOutput('narration', text, {}, false); },
        renderStats() {}, saveGameState() {}, renderNPCActionMenu() { el.innerHTML = ''; }, rand: list => list[0],
        assignLootUID(i) { i._uid = i._uid || 'copy-' + ++uid; i.id = i.id || 'loot-' + i._uid; return i; },
        aiAvailable: () => false, INTERACT_MENU_ACTIONS: [], getChatOptions: () => []
    };
    c.window.dispatchEvent = e => c.events.push(e.detail); c.Math.random = () => c.rolls.length ? c.rolls.shift() : 0.1;
    vm.createContext(c); vm.runInContext(code, c);
    c.state = vm.runInContext('textModeState', c); c.state.enabled = true; c.state.sessionPlayer = player;
    c.menus = vm.runInContext('sharedChoiceState', c); c.send = text => c.submitTextModeCommand(text);
    c.add = (name, props = {}) => { const item = { name, _uid: 'input-' + ++uid, type: ['weapon'], value: 10, ...props }; player.inventory.push(item); return item; };
    c.confirm = () => c.runSharedChoice(c.menus.menu, c.menus.menu.options.find(o => o.meta.action === 'confirm'));
    return c;
}

test('enchanter grammar has shared intent fields and preserves scroll copying and combat abilities', () => {
    const c = harness();
    for (const [text, action, target] of [['enchanter', 'services', ''], ['enchant dagger', 'enchant', 'dagger'], ['duplicate "Smoke and Fire"', 'duplicate', 'Smoke and Fire'], ['copy item gem', 'duplicate', 'gem']]) {
        const result = c.parseTextCommand(text); assert.equal(result.verb, 'enchanter'); assert.equal(result.args.action, action); assert.equal(result.args.target, target);
    }
    assert.equal(c.parseTextCommand('copy frost scroll').verb, 'copy');
    c.G.activeNPCMode = 'combat'; assert.equal(c.parseTextEnchanterCommand('enchant dagger'), null);
    assert.equal(c.validateTextAIPlan({ actions: [{ verb: 'enchanter', args: { action: 'duplicate', target: 'gem', success: 'yes' } }] }), null);
});

test('typed quote is free, native fees are paid once, and resolving it leaves the queue paused', async () => {
    const c = harness(), weapon = c.add('Dagger');
    await c.send('enchant dagger then status'); const menu = c.menus.menu, confirm = menu.options[0];
    assert.equal(menu.kind, 'enchanter-confirm'); assert.equal(c.player.coins, 1000); assert.equal(c.turn, 100);
    await c.confirm(); assert.equal(weapon.enchantTier, 1); assert.equal(c.player.coins, 985); assert.equal(c.vendor.coins, 65); assert.equal(c.turn, 100);
    await c.runSharedChoice(menu, confirm); assert.equal(c.player.coins, 985);
    assert.equal(c.state.queue.length, 1); await c.send('leave'); await c.send('continue'); assert.equal(c.state.queue.length, 0);
});

test('normal buttons select the same item quote and native action', async () => {
    const c = harness(), weapon = c.add('Dagger'); c.state.enabled = false;
    c.renderEnchanterServices(c.vendor); await c.el.children.find(b => b.label === 'Enchant a weapon').onclick();
    assert.equal(c.menus.menu.kind, 'enchanter-enchant'); await c.el.children[0].onclick();
    assert.equal(c.menus.menu.kind, 'enchanter-confirm'); assert.equal(c.player.coins, 1000);
    await c.el.children[0].onclick(); assert.equal(weapon.enchantTier, 1); assert.equal(c.player.coins, 985);
});

test('changed item data, packed contents, source arrays, slots, provider, time or funds invalidate a quote', async () => {
    for (const change of [c => c.player.inventory[0].enchantTier = 2, c => c.player.inventory[0].packed[0].value++, c => c.player.inventory[0] = { ...c.player.inventory[0] }, c => c.player.inventory = c.player.inventory.slice(), c => c.room.creatures = [c.vendor], c => c.room.creatures = [], c => c.player.equipped.weapon = c.player.inventory[0], c => c.player.coins--, c => c.turn++, c => c.vendor.role = 'Vendor', c => c.vendor.offDuty = true]) {
        const c = harness(); c.add('Dagger', { packed: [{ name: 'Gem', value: 1 }] }); await c.send('enchant dagger'); change(c);
        const coins = c.player.coins, turn = c.turn; await c.confirm(); assert.equal(c.player.coins, coins); assert.equal(c.turn, turn);
    }
});

test('hidden, broken, capped, unaffordable and unavailable service attempts spend nothing', async () => {
    for (const props of [{ hidden: true }, { isHidden: true }, { concealed: true }, { visible: false }, { broken: true }, { enchantTier: 5 }]) {
        const c = harness(), item = c.add('Dagger', props);
        assert.equal(c.attemptEnchantItem(c.vendor, item).status, 'blocked'); assert.equal(c.player.coins, 1000);
    }
    for (const change of [c => c.hostile = true, c => c.G.activeNPC = null, c => c.G.activeItemModal = {}, c => c.player.unconscious = true, c => c.player.coins = 0]) {
        const c = harness(), item = c.add('Dagger'); change(c); const coins = c.player.coins;
        await c.send('enchant dagger'); assert.equal(c.player.coins, coins); assert.equal(c.turn, 100);
        assert.equal(c.attemptDuplicateItem(c.vendor, item).status, 'blocked');
    }
});

test('enchantment failure spends the fee, retains the weapon and emits an accurate public result', () => {
    const c = harness(), weapon = c.add('Dagger', { hiddenTrait: { secret: 'Never publish this' } }); c.rolls = [0.99];
    assert.equal(c.attemptEnchantItem(c.vendor, weapon).success, false); assert.equal(weapon.enchantTier, undefined); assert.equal(c.player.coins, 985); assert.equal(c.turn, 100);
    const result = c.events.find(e => e.service?.stage === 'result').service;
    assert.equal(result.success, false); assert.equal(result.coinChange, -15); assert(!JSON.stringify(result).includes('Never publish'));
});

test('success keeps native tier fees, physical/elemental progression and engraved names', () => {
    const c = harness(), weapon = c.add('Dagger', { weaponTitle: 'Quiet Mercy' }); c.rolls = [0.1, 0.9, 0.1, 0.1, 0.1, 0.1];
    c.attemptEnchantItem(c.vendor, weapon); assert.equal(weapon.enchantDamageBonus, 2); assert.equal(weapon.enchantTier, 1); assert(weapon.name.includes('Quiet Mercy'));
    c.attemptEnchantItem(c.vendor, weapon); assert.equal(weapon.elementalDamage.type, 'fire'); assert.equal(weapon.elementalDamage.amount, 3); assert.equal(weapon.enchantTier, 2);
    c.attemptEnchantItem(c.vendor, weapon); assert.equal(weapon.elementalDamage.amount, 7); assert.equal(c.player.coins, 1000 - 15 - 35 - 55); assert.equal(c.turn, 100);
});

test('duplication copies the whole selected stack at native value-based cost with independent identities and state', () => {
    const c = harness(), original = c.add('Crystal', { type: ['misc'], quantity: 3, value: 10, elementalDamage: { type: 'fire', amount: 2 } });
    const result = c.attemptDuplicateItem(c.vendor, original), copy = c.player.inventory.find(i => i !== original);
    assert.equal(result.success, true); assert.equal(c.player.coins, 820); assert.equal(copy.quantity, 3); assert.equal(original.quantity, 3); assert.notEqual(copy._uid, original._uid);
    copy.elementalDamage.amount = 99; assert.equal(original.elementalDamage.amount, 2); assert.equal(c.turn, 100);
    assert.equal(c.events.find(e => e.service?.stage === 'result').service.result.quantity, 3);
});

test('copied container and nested items get independent keys; hidden flags survive and stowage remaps within the copy', () => {
    const c = harness(), bag = c.add('Bag', { type: ['misc'], _ck: 'old-bag', stowed: 'bag:external', packed: [{ name: 'Secret gem', type: ['misc'], _uid: 'old-gem', hidden: true, stowed: 'bag:old-bag', hiddenTrait: { effectValue: 2 } }] });
    const copy = c.cloneEnchanterItem(bag); assert.notEqual(copy._ck, bag._ck); assert.notEqual(copy.packed[0]._uid, bag.packed[0]._uid);
    assert.equal(copy.stowed, undefined); assert.equal(copy.packed[0].stowed, 'bag:' + copy._ck); assert.equal(copy.packed[0].hidden, true);
    copy.packed[0].hiddenTrait.effectValue = 99; assert.equal(bag.packed[0].hiddenTrait.effectValue, 2);
});

test('duplication failure retains original data and still charges; equipped and hidden entries are ineligible', () => {
    const c = harness(), item = c.add('Crystal', { type: ['misc'], value: 1 }); c.rolls = [0.99];
    assert.equal(c.attemptDuplicateItem(c.vendor, item).success, false); assert.equal(c.player.inventory.length, 1); assert.equal(c.player.coins, 975);
    c.player.equipped.hand = item; assert.equal(c.attemptDuplicateItem(c.vendor, item).status, 'blocked'); c.player.equipped = {}; item.hidden = true;
    assert.equal(c.attemptDuplicateItem(c.vendor, item).status, 'blocked'); assert.equal(c.player.coins, 975);
});

test('ambiguity uses numbered exact references; quoted exact ordinal-like names still select their named item', async () => {
    const c = harness(), first = c.add('Dagger'), second = c.add('Dagger');
    await c.send('enchant dagger'); assert.equal(c.menus.menu.kind, 'enchanter-enchant'); assert.equal(c.player.coins, 1000);
    c.player.inventory.reverse(); await c.send('2'); await c.confirm(); assert.equal(second.enchantTier, 1); assert.equal(first.enchantTier, undefined);
    await c.send('leave'); const named = c.add('Second relic', { type: ['misc'] }); await c.send('duplicate "Second relic"'); await c.confirm();
    assert(c.player.inventory.some(i => i !== named && i.name === named.name));
});

test('public lists preserve the active question and conceal hidden entries and nested item state', async () => {
    const c = harness(); c.add('Dagger', { packed: [{ name: 'Secret ruby', hidden: true }] }); c.add('Hidden sword', { hidden: true });
    await c.send('enchant dagger'); const menu = c.menus.menu;
    await c.send('show enchanter'); const event = c.events.at(-1); assert(!JSON.stringify(event).includes('Secret ruby')); assert(!JSON.stringify(event).includes('Hidden sword'));
    await c.send('how to duplicate'); assert.equal(c.menus.menu, menu); assert.equal(c.player.coins, 1000); assert.equal(c.turn, 100);
});

test('plans and queued choices cannot approve fees; back/cancel and one-step menu replies preserve resources', async () => {
    const c = harness(); c.add('Dagger'); await c.send('enchant dagger then choose 1'); await c.send('continue'); assert.equal(c.player.coins, 1000); assert.equal(c.state.queue.length, 1);
    await c.executeTextEnchanterCommand({ verb: 'enchanter', args: { action: 'confirm', target: '' } }); assert.equal(c.player.coins, 1000);
    await c.send('back'); const menu = c.menus.menu; await c.send('enchant dagger then duplicate dagger'); assert.equal(c.menus.menu, menu); assert.equal(c.player.coins, 1000);
    await c.send('cancel'); assert.equal(c.state.queue.length, 0); assert.equal(c.player.coins, 1000);
});
