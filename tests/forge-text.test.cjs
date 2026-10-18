const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const source = fs.readFileSync(process.argv[2] || 'C:/Git/CYOAFTW/.forge-text/cyoaftw-engine-CORE.js', 'utf8').replace(/\r\n/g, '\n');
function section(a, b) { const start = source.indexOf(a), end = source.indexOf(b, start); assert(start >= 0 && end > start, a); return source.slice(start, end); }
const code = section('// Text commands are a presentation/input layer.', '// END TEXT COMMANDS') + '\n' + section('const FORGE_SHARPEN_BASE_FEE', '// ── ENCHANTER SERVICES') + '\n' + section('const ARMOUR_TREAT_BASE_FEE', '// -- PARTY CASTERS:') + '\n' + section('function renameEnchantedItem(', 'function attemptEnchantItem(');
function element() { return { children: [], style: {}, appendChild(child) { this.children.push(child); }, set innerHTML(_) { this.children = []; }, addEventListener() {}, setAttribute() {} }; }
function harness() {
    const player = { name: 'Mira', hp: 20, inventory: [], equipped: {}, coins: 300 }, smith = { name: 'Mara', role: 'Blacksmith', hp: 30, inventory: [], equipped: {}, coins: 100, memory: { favorability: 20 } };
    const room = { coords: '0,0', creatures: [smith], structural: [], items: [] }, el = element();
    const c = { console, setTimeout, clearTimeout, player, smith, room, el, turn: 100, events: [], Math: Object.create(Math),
        G: { player, activeRoom: room, activeNPC: smith, activeNPCMode: 'menu', partyMembers: [], sessionFollowers: [], _partyLootPending: [] },
        document: { getElementById: id => id === 'chatOptionsEl' ? el : null, createElement: element },
        window: {}, CustomEvent: function (_, opts) { this.detail = opts.detail; },
        getItemName: i => i.name, getItemQuantity: i => i.quantity || 1, getItemUnitValue: i => i.value || 1,
        isLootItemVisible: i => !!i && !i.hidden && !i.isHidden && !i.concealed && i.visible !== false,
        isVisibleEntity: i => !i.hidden, canConverseWithNPC: () => true, isNPCOffDuty: n => !!n.offDuty, renownRefusesTrade: () => false,
        getCoinValue: p => p.coins || 0, hasEnoughCoins: (p, n) => p.coins >= n, adjustCoins: (p, n) => { p.coins += n; },
        roomHasActiveHostile: () => !!c.hostile, isRoomCollapsed: () => false, isPlayerJailed: () => false, hasPendingPartyLoot: () => false,
        getCurrentStoryTurn: () => c.turn, advanceStoryTurn(n) { c.turn += n; c.tickForgeUpgradeJob(n); if (c.onAdvance) c.onAdvance(); },
        createCombatButton: (label, onclick, opts = {}) => ({ label, onclick, ...opts }),
        showTradeMessage(text) { c.publishTextModeOutput('narration', text, {}, false); }, setNarration(text) { c.publishTextModeOutput('narration', text, {}, false); },
        renderStats() {}, saveGameState() {}, updateInventoryContextPanels() { c.renderForgeServices(smith); }, rememberStoryEvent() {}, renderNPCActionMenu() { el.innerHTML = ''; },
        renderNarrationWithRoomObservations(_r, text) { c.setNarration(text); },
        isEnchantableWeapon: i => !!i && (i.type || []).includes('weapon'), getWeaponTypeFromName: () => 'dagger', getWeaponDamageType: () => 'edge',
        isPotionItem: i => (i.type || []).includes('potion'), repairDurability() {}, guessDurabilityMaterial: i => i.material || 'cloth',
        rand: list => list[0], randInt: min => min, rollD20: () => 20, cloneLootTemplate: i => ({ ...i }), assignLootUID: i => i,
        RELIC_POWERS: { spark: { name: 'Spark' } }, BOSS_STAT_LABELS: { strength: 'Strength' }, RELIC_POWER_MAX_STACKS: 3, relicPowerDesc: () => 'Spark',
        ORE_TEMPLATES: { silvered: { name: 'Silver ore', id: 'silver', type: ['ore'], forgePower: 3, value: 8 }, star: { name: 'Star ore', id: 'star', type: ['ore'], forgePower: 4, value: 20 }, ember: { name: 'Ember ore' }, deepglass: { name: 'Deepglass ore' }, moonsilver: { name: 'Moon ore', id: 'moon', type: ['ore'], forgePower: 5, value: 30 } },
        ENCHANT_ELEMENT_PREFIXES: {}, aiAvailable: () => false, applyNPCImpact() {}, INTERACT_MENU_ACTIONS: [], getChatOptions: () => []
    };
    c.window.dispatchEvent = e => c.events.push(e.detail); c.Math.random = () => 0.5;
    vm.createContext(c); vm.runInContext(code, c);
    c.state = vm.runInContext('textModeState', c); c.state.enabled = true; c.state.sessionPlayer = player;
    c.menus = vm.runInContext('sharedChoiceState', c); c.send = s => c.submitTextModeCommand(s);
    c.add = (name, props = {}) => { const item = { name, type: ['weapon'], weaponType: 'dagger', value: 20, ...props }; player.inventory.push(item); return item; };
    c.confirm = () => c.runSharedChoice(c.menus.menu, c.menus.menu.options.find(o => o.meta.action === 'confirm'));
    return c;
}

test('forge grammar preserves quoted separators, primary verbs and existing combat/inventory routes', () => {
    const c = harness();
    for (const [text, action] of [['forge', 'services'], ['mend dagger', 'repair'], ['recolour coat', 'recolor'], ['name weapon Quiet Mercy', 'name'], ['collect forge', 'collect'], ['deliver commission', 'deliver']]) assert.equal(c.parseTextCommand(text).args.action, action);
    assert.equal(c.splitForgeTarget('"Sword with history" as "Smoke and Fire"').item, 'Sword with history');
    assert.equal(c.splitForgeTarget('"Sword with history" as "Smoke and Fire"').material, 'Smoke and Fire');
    assert.equal(c.parseTextCommand('take dagger').verb, 'take');
    assert.equal(c.validateTextAIPlan({ actions: [{ verb: 'forge', args: { action: 'sharpen', target: 'dagger', fee: '0' } }] }), null);
});

test('native buttons and text share free quotes, real costs and a single consumed confirmation', async () => {
    const c = harness(), blade = c.add('Dagger');
    await c.send('sharpen dagger with plain then status'); const menu = c.menus.menu, choice = menu.options[0];
    assert.equal(menu.kind, 'forge-confirm'); assert.equal(c.player.coins, 300); assert.equal(c.turn, 100);
    await c.confirm(); assert.equal(blade.edgeHits, 8); assert.equal(c.player.coins, 300 - c.getSharpenFee(blade, null)); assert.equal(c.turn, 101);
    const coins = c.player.coins; await c.runSharedChoice(menu, choice); assert.equal(c.player.coins, coins);
    assert.equal(c.state.queue.length, 1); await c.send('leave'); await c.send('continue'); assert.equal(c.state.queue.length, 0);
});

test('changed or replaced items, scene arrays, money, clock and duty invalidate quotes without cost', async () => {
    for (const change of [c => c.player.inventory[0].value++, c => c.player.inventory[0] = { ...c.player.inventory[0] }, c => c.room.creatures = [c.smith], c => c.turn++, c => c.player.coins--, c => c.smith.offDuty = true]) {
        const c = harness(); c.add('Dagger'); await c.send('sharpen dagger with plain'); change(c);
        const coins = c.player.coins, turn = c.turn; await c.confirm(); assert.equal(c.player.coins, coins); assert.equal(c.turn, turn); assert.equal(c.player.inventory[0].edgeHits, undefined);
    }
});

test('shortages, hidden items and unavailable actors cannot start or charge work', async () => {
    for (const change of [c => c.player.inventory[0].hidden = true, c => c.player.coins = 0, c => c.hostile = true, c => c.G.activeNPC = null, c => c.smith.offDuty = true]) {
        const c = harness(); c.add('Dagger'); change(c); const coins = c.player.coins;
        await c.send('sharpen dagger with plain'); assert.equal(c.turn, 100); assert.equal(c.player.coins, coins);
    }
});

test('sharpen failure consumes one material and can break a weapon; failed repair refunds but destroys it', () => {
    const c = harness(), blade = c.add('Dagger'), ore = c.add('Iron ore', { type: ['ore'], forgePower: 2, quantity: 3 });
    c.Math.random = () => 0; c.attemptSharpen(c.smith, blade, ore);
    assert.equal(blade.broken, true); assert.equal(ore.quantity, 2); assert.equal(c.turn, 101);
    c.Math.random = () => 0.999; const coins = c.player.coins; c.attemptRepair(c.smith, blade, null);
    assert.equal(c.player.coins, coins); assert(!c.player.inventory.includes(blade)); assert.equal(c.turn, 102);
});

test('a world tick interruption keeps paid fees but cannot treat a detached weapon or consume late materials', () => {
    const c = harness(), blade = c.add('Dagger'), ore = c.add('Iron ore', { type: ['ore'], forgePower: 2, quantity: 3 });
    c.onAdvance = () => { c.G.activeRoom = { creatures: [], structural: [], items: [] }; };
    const result = c.attemptSharpen(c.smith, blade, ore);
    assert.equal(result.status, 'interrupted'); assert.equal(c.turn, 101); assert(c.player.coins < 300); assert.equal(ore.quantity, 3); assert.equal(blade.edgeHits, undefined);
    assert.equal(vm.runInContext('forgeRequests.has(G.player)', c), false);
});

test('engraving sanitizes names, asks confirmation, and read-only help preserves a pending choice', async () => {
    const c = harness(), blade = c.add('Dagger');
    await c.send('engrave dagger as "Road Biter"'); const menu = c.menus.menu;
    await c.send('show forge'); await c.send('how to repair'); assert.equal(c.menus.menu, menu); assert.equal(c.turn, 100);
    await c.send('forge confirm'); assert.equal(c.turn, 100); await c.confirm(); assert.equal(blade.weaponTitle, 'Road Biter'); assert.equal(c.player.coins, 294);
    await c.send('engrave dagger'); await c.send('name weapon ' + 'x'.repeat(25)); assert.equal(c.menus.menu.kind, 'forge-name'); assert.equal(c.turn, 101);
});

test('refining consumes all visible ore of one grade, preserves hidden ore and keeps native luck yields', () => {
    const c = harness(), visible = c.add('Iron ore', { type: ['ore'], forgePower: 2, quantity: 5 });
    const hidden = c.add('Secret ore', { type: ['ore'], forgePower: 2, quantity: 99, hidden: true });
    const spec = c.forgeActionSpec('refine', c.smith, 1); assert.equal(spec.quantity, 5); assert(!JSON.stringify(spec).includes('Secret'));
    c.attemptRefineOre(c.smith, 1); assert(!c.player.inventory.includes(visible)); assert.equal(hidden.quantity, 99);
    assert.equal(c.player.inventory.filter(i => i.name === 'Silver ore').length, 3); assert.equal(c.turn, 101);
});

test('armour upgrade holds the original piece at full work time and collection only grants its bonus once', () => {
    const c = harness(), armour = c.add('Coat', { type: ['armor'], armor: 4, upgradeTier: 0 }), ore = c.add('Star ore', { ...c.ORE_TEMPLATES.star, quantity: 2 });
    c.attemptUpgradeArmour(c.smith, armour, ore); const job = c.player.forgeUpgrade;
    assert.equal(job.item, armour); assert.equal(job.turnsLeft, c.getArmourUpgradeTurns(ore)); assert(!c.player.inventory.includes(armour)); assert.equal(ore.quantity, 1);
    c.collectForgeUpgrade(c.smith); assert(!c.player.inventory.includes(armour));
    job.turnsLeft = 0; c.collectForgeUpgrade(c.smith); assert.equal(armour.armor, 6); assert.equal(c.player.inventory.filter(i => i === armour).length, 1);
    c.collectForgeUpgrade(c.smith); assert.equal(armour.armor, 6);
});

test('interrupted commissioning retains escrow on the original player and never attaches it to a replacement', () => {
    const c = harness(), armour = c.add('Coat', { type: ['armor'], armor: 4, upgradeTier: 0 }), ore = c.add('Star ore', c.ORE_TEMPLATES.star);
    const replacement = { hp: 20, inventory: [], equipped: {}, coins: 10 };
    c.onAdvance = () => { c.G.player = replacement; };
    const result = c.attemptUpgradeArmour(c.smith, armour, ore);
    assert.equal(result.status, 'interrupted'); assert.equal(c.player.forgeUpgrade.item, armour); assert.equal(replacement.forgeUpgrade, undefined);
});

test('late recolour replies cannot mutate replaced items or a new player, and hold the work lock', async () => {
    for (const change of [c => c.player.inventory[0] = { ...c.player.inventory[0] }, c => c.G.player = { hp: 20, inventory: [], equipped: {}, coins: 10 }]) {
        const c = harness(), coat = c.add('Blue coat', { type: ['armor'], color: 'blue' }), pigment = c.add('Red pot', { type: ['pigment'], pigmentColor: 'red', quantity: 2 }); let resolve;
        c.requestRecolourDescription = () => new Promise(r => { resolve = r; });
        const pending = c.attemptRecolourItem(c.smith, coat, pigment); assert(resolve); assert.match(c.forgeServiceBlock(c.smith), /finishing/);
        change(c); resolve('A purple coat.'); const result = await pending;
        assert.equal(result.status, 'interrupted'); assert.equal(coat.color, 'blue'); assert.equal(pigment.quantity, 1); assert.equal(c.player.coins, 296);
    }
});

test('fusion refusal preserves parents; delayed replies cannot use changed consumed parent data or grant remote relics', async () => {
    const c = harness(), a = c.add('First relic', { bossRelic: true, relicPower: 'spark' }), b = c.add('Second relic', { bossRelic: true, relicPower: 'spark' });
    c.rollD20 = () => 1; await c.attemptFuseRelics(c.smith, a, b); assert(c.player.inventory.includes(a)); assert(c.player.inventory.includes(b)); assert.equal(c.player.coins, 275); assert.equal(c.menus.menu.kind, 'forge-services');
    c.rollD20 = () => 20; let resolve; c.requestRelicFusionChoice = () => new Promise(r => { resolve = r; });
    const pending = c.attemptFuseRelics(c.smith, a, b); assert(resolve); a.value = 9999; resolve({ name: 'Forbidden relic' });
    assert.equal((await pending).status, 'interrupted'); assert(!c.player.inventory.some(i => i.fusedRelic)); assert.equal(c.player.coins, 250);
});

test('queued choices and AI action strings cannot supply approval, and menu replies are one step at a time', async () => {
    const c = harness(); c.add('Dagger'); await c.send('sharpen dagger with plain then choose 1'); await c.send('continue'); assert.equal(c.turn, 100); assert.equal(c.state.queue.length, 1);
    await c.send('forge confirm'); assert.equal(c.turn, 100);
    await c.send('back'); const menu = c.menus.menu; await c.send('sharpen dagger with plain then repair dagger'); assert.equal(c.menus.menu, menu); assert.equal(c.turn, 100);
});

test('existing commission delivery uses visible materials once and publishes the actual coin change', async () => {
    const c = harness(), ore = c.add('Iron ore', { type: ['ore'], forgePower: 2, quantity: 3 });
    const hidden = c.add('Secret ore', { type: ['ore'], forgePower: 2, quantity: 99, hidden: true });
    c.player.forgeCommission = { kind: 'ore', count: 2, reward: 40 };
    await c.send('deliver commission'); const menu = c.menus.menu, choice = menu.options[0];
    assert.equal(c.player.coins, 300); await c.confirm();
    assert.equal(ore.quantity, 1); assert.equal(hidden.quantity, 99); assert.equal(c.player.coins, 340); assert.equal(c.player.forgeCommission, null);
    assert.equal(c.events.find(e => e.service && e.service.stage === 'result').service.coinChange, 40);
    await c.runSharedChoice(menu, choice); assert.equal(c.player.coins, 340);
});
