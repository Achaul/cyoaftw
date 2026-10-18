const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const source = fs.readFileSync(process.argv[2] || 'C:/Git/CYOAFTW/.clothier-text/cyoaftw-engine-CORE.js', 'utf8').replace(/\r\n/g, '\n');
function section(a, b) { const start = source.indexOf(a), end = source.indexOf(b, start); assert(start >= 0 && end > start, a); return source.slice(start, end); }
const code = section('// Text commands are a presentation/input layer.', '// END TEXT COMMANDS') + '\n' + section('const CLOTHIER_LARGE_RUCKSACK_PRICE', '// ── FORGE SERVICES (Blacksmith)');
function element() { return { children: [], style: {}, appendChild(child) { this.children.push(child); }, set innerHTML(_) { this.children = []; }, addEventListener() {}, setAttribute() {} }; }
function harness() {
    let uid = 0;
    const player = { hp: 20, inventory: [], equipped: {}, coins: 500 }, vendor = { id: 'clothier-1', name: 'Mara', role: 'Clothier', hp: 30, inventory: [], equipped: {}, coins: 50, memory: { favorability: 20 } };
    const room = { coords: '0,0', creatures: [vendor], structural: [], items: [] }, el = element();
    player.rucksack = { name: 'Rucksack', _uid: 'pack', type: ['misc'], container: { bag: true, wearable: 'back', maxUnitCapacity: 20 } };
    const c = { console, setTimeout, clearTimeout, player, vendor, room, el, turn: 100, events: [],
        G: { player, activeRoom: room, activeNPC: vendor, activeNPCMode: 'menu', partyMembers: [], sessionFollowers: [], _partyLootPending: [] },
        document: { getElementById: id => id === 'chatOptionsEl' ? el : null, createElement: element }, window: {}, CustomEvent: function (_, opts) { this.detail = opts.detail; },
        getItemName: i => i.name, getItemQuantity: i => i.quantity || 1, getItemUnitValue: i => i.value || 1, getItemEquipSlot: i => i.slot,
        isLootItemVisible: i => !!i && !i.hidden && !i.isHidden && !i.concealed && i.visible !== false, isVisibleEntity: i => !i.hidden,
        isItemEquippedByEntity: (p, i) => Object.values(p.equipped || {}).includes(i), isForgeSmith: n => !!n && n.role === 'Blacksmith',
        canConverseWithNPC: () => true, isNPCOffDuty: n => !!n.offDuty, renownRefusesTrade: () => false,
        getCoinValue: p => p.coins || 0, hasEnoughCoins: (p, n) => p.coins >= n, adjustCoins: (p, n) => { p.coins += n; },
        roomHasActiveHostile: () => !!c.hostile, isRoomCollapsed: () => false, isPlayerJailed: () => false, hasPendingPartyLoot: () => false,
        getCurrentStoryTurn: () => c.turn, advanceStoryTurn(n) { c.turn += n; c.tickClothierJob(n); if (c.onAdvance) c.onAdvance(); },
        createCombatButton: (label, onclick, opts = {}) => ({ label, onclick, ...opts }),
        showTradeMessage(text) { c.publishTextModeOutput('narration', text, {}, false); }, setNarration(text) { c.publishTextModeOutput('narration', text, {}, false); },
        renderStats() {}, saveGameState() { c.saves = (c.saves || 0) + 1; }, renderNPCActionMenu() { el.innerHTML = ''; }, restowPlayerPack() {}, packContainerContents() {}, queueTurnNote() {},
        guessDurabilityMaterial: i => i.material || 'cloth', ensureDurability(i) { return i.durability ||= { hp: 5, max: 10, material: 'cloth' }; }, repairDurability(i) { const d = c.ensureDurability(i); d.hp = d.max; },
        getContainerPlaceIdMap: () => ({}), isPigmentItem: i => !!i && !!i.pigmentColor, getItemBaseArmor: i => i.armor || 0, getItemColour: i => i.color || '', blendColours: (a, b) => a === b ? a : b,
        consumeOneFromInventory(i) { if ((i.quantity || 1) > 1) i.quantity--; else player.inventory.splice(player.inventory.indexOf(i), 1); },
        assignLootUID(i) { i._uid = i._uid || 'copy-' + ++uid; i.id = i.id || 'loot-' + i._uid; return i; }, aiAvailable: () => false, INTERACT_MENU_ACTIONS: [], getChatOptions: () => []
    };
    c.window.dispatchEvent = e => c.events.push(e.detail); vm.createContext(c); vm.runInContext(code, c);
    c.state = vm.runInContext('textModeState', c); c.state.enabled = true; c.state.sessionPlayer = player;
    c.menus = vm.runInContext('sharedChoiceState', c); c.send = text => c.submitTextModeCommand(text);
    c.add = (name, props = {}) => { const item = { name, _uid: 'input-' + ++uid, type: ['misc'], value: 20, ...props }; player.inventory.push(item); return item; };
    c.coat = c.add('Linen shirt', { type: ['clothes'], slot: 'upper', material: 'cloth', durability: { hp: 5, max: 10, material: 'cloth' }, description: 'Plain linen.' });
    c.linen = c.add('Bundle of linen', { tailoringMaterial: 'linen', quantity: 5, value: 4 }); c.dye = c.add('Blue dye', { pigmentColor: 'blue', quantity: 3, value: 3 });
    c.quote = plan => ({ feasible: true, reason: 'Work is practical.', fee: plan.service === 'alteration' ? 12 : 6, turns: 4, name: 'Finished shirt', description: 'A well sewn shirt.', color: null, armorGain: plan.service === 'reinforce' ? 1 : 0, durabilityGain: plan.service === 'reinforce' ? 3 : 0, valueIncrease: plan.service === 'repair' ? 0 : 5, materials: [{ index: 0, quantity: 1 }], dyes: [] });
    c.requestClothierQuote = async plan => c.quote(plan);
    c.requestClothierAppraisal = async () => ({ success: true, appealing: true, reason: 'Neat seams.', name: 'Tailored shirt', description: 'A tidy tailored shirt.', charismaChange: 1, valueChange: 5 });
    c.prepare = async (service = 'repair') => { await c.send('tailor ' + service + ' linen shirt'); await c.send('offer 2 linen'); await c.send('request "Patch the seams and keep the fit"'); };
    c.confirm = () => c.runSharedChoice(c.menus.menu, c.menus.menu.options.find(o => o.meta.action === 'confirm'));
    return c;
}

test('contextual primary verbs preserve blacksmith repair, fixture offering, scroll copying and quoted requests', () => {
    const c = harness();
    for (const [input, action] of [['tailor', 'services'], ['clothier', 'services'], ['repair linen shirt', 'repair'], ['alter linen shirt', 'alteration'], ['reinforce shirt', 'reinforce'], ['offer 2 linen', 'offer'], ['request "Blue trim and short sleeves"', 'request'], ['quote', 'quote'], ['pockets rucksack', 'pockets'], ['collect tailoring', 'collect']]) assert.equal(c.parseTextCommand(input).args.action, action);
    assert.equal(c.parseTextCommand('copy scroll').verb, 'copy'); c.G.activeNPC = null;
    assert.equal(c.parseTextCommand('repair sword').verb, 'forge'); assert.equal(c.parseTextCommand('offer at altar').verb, 'offer');
    assert.equal(c.validateTextAIPlan({ actions: [{ verb: 'tailor', args: { action: 'repair', target: 'shirt', fee: '0' } }] }), null);
});

test('draft editing and quotes are free; acceptance consumes only agreed units, escrows one piece, and cannot replay', async () => {
    const c = harness(); c.coat.quantity = 3;
    await c.prepare(); await c.send('offer 1 blue dye'); await c.send('quote'); const menu = c.menus.menu, confirm = menu.options[0];
    assert.equal(menu.kind, 'tailor-quote'); assert.equal(c.player.coins, 500); assert.equal(c.turn, 100);
    await c.confirm(); assert.equal(c.player.coins, 494); assert.equal(c.vendor.coins, 56); assert.equal(c.linen.quantity, 4); assert.equal(c.dye.quantity, 3);
    assert.equal(c.coat.quantity, 2); assert.equal(c.player.clothierJob.item.quantity, 1); assert.equal(c.player.clothierJob.turnsLeft, 4); assert.equal(c.turn, 101);
    c.player.clothierJob.turnsLeft = 0; await c.collectClothierJob(c.vendor); assert.equal(c.coat.durability.hp, 5);
    assert.equal(c.player.inventory.find(i => i !== c.coat && i.name === 'Linen shirt').durability.hp, 10);
    await c.runSharedChoice(menu, confirm); assert.equal(c.player.coins, 494);
});

test('hidden, worn and filled donations stay unavailable; offers require positive owned material quantities and a request', async () => {
    const c = harness(); c.add('Secret silk', { tailoringMaterial: 'silk', hidden: true }); c.add('Filled cloth', { tailoringMaterial: 'cloth', packed: [{}] });
    await c.send('tailor repair linen shirt'); await c.send('show tailoring materials'); assert(!JSON.stringify(c.events.at(-1)).includes('Secret silk')); assert(!JSON.stringify(c.events.at(-1)).includes('Filled cloth'));
    await c.send('quote'); assert.equal(c.turn, 100); await c.send('offer 99 linen'); assert.equal(c.turn, 100);
    await c.send('offer 2 linen'); await c.send('offer 0 linen'); assert.equal(c.menus.menu.tailorDraft.offers.length, 0);
    await c.send('request "Patch it"'); await c.send('offer 1 blue dye'); await c.send('quote'); assert.notEqual(c.menus.menu.kind, 'tailor-quote'); assert.equal(c.player.coins, 500);
});

test('normal request form submits through the same quote callback and preserves drafts on missing materials', async () => {
    const c = harness(); c.state.enabled = false; c.G.activeNPCMode = 'clothier'; c.renderClothierRequest(c.vendor, c.coat, 'repair');
    const quote = () => c.el.children.find(b => b.label === 'Ask for a quote');
    await quote().onclick(); assert.equal(c.menus.menu.kind, 'tailor-request');
    const fields = c.el.children.filter(e => e.children?.some(child => child.type === 'number'));
    fields.find(row => row.textContent.includes('linen')).children[0].value = '2';
    c.el.children.find(e => e.rows === 4).value = 'Patch worn seams.';
    await quote().onclick(); assert.equal(c.menus.menu.kind, 'tailor-quote'); assert.equal(c.player.coins, 500);
    await c.el.children[0].onclick(); assert.equal(c.player.clothierJob.item, c.coat); assert.equal(c.player.coins, 494);
});

test('quote validators reject impossible gains, excess consumed offers and bad alteration prices', async () => {
    const c = harness(); await c.prepare('alteration');
    for (const mutate of [q => q.fee = 1, q => q.armorGain = 99, q => q.materials[0].quantity = 9]) {
        c.requestClothierQuote = async plan => { const q = c.quote(plan); mutate(q); return q; }; await c.send('quote'); assert.equal(c.menus.menu.kind, 'tailor-request'); assert.equal(c.player.coins, 500);
    }
    c.requestClothierQuote = async () => ({ feasible: false, reason: 'Bring more linen.' }); await c.send('quote'); assert.equal(c.turn, 100); assert(c.events.some(e => /Bring more linen/.test(e.text)));
});

test('changed sources, garments, offers, time and funds invalidate paid quotes before any consumption', async () => {
    for (const change of [c => c.coat.description = 'Changed', c => c.linen.quantity--, c => c.room.creatures = [c.vendor], c => c.player.inventory = c.player.inventory.slice(), c => c.turn++, c => c.player.coins--, c => c.vendor.offDuty = true]) {
        const c = harness(); await c.prepare(); await c.send('quote'); change(c); const coins = c.player.coins, count = c.linen.quantity, turn = c.turn;
        await c.confirm(); assert.equal(c.player.coins, coins); assert.equal(c.linen.quantity, count); assert.equal(c.turn, turn); assert.equal(c.player.clothierJob, undefined);
    }
    const c = harness(); await c.prepare(); await c.send('quote');
    vm.runInContext('clothierPendingQuote.materials[0].quantity++', c); await c.confirm(); assert.equal(c.player.coins, 500);
});

test('delayed quote results cannot publish or become payable after a scene, actor, material or clock change', async () => {
    for (const change of [c => c.G.activeRoom = { creatures: [], structural: [] }, c => c.G.player = { hp: 20, inventory: [], equipped: {}, coins: 2 }, c => c.linen.quantity--, c => c.turn++]) {
        const c = harness(); await c.prepare(); const draft = c.menus.menu.tailorDraft; let resolve, plan;
        c.requestClothierQuote = p => { plan = p; return new Promise(r => { resolve = r; }); };
        const pending = c.send('quote'); await Promise.resolve(); assert(resolve); assert.equal(c.state.busy, true);
        change(c); resolve(c.quote(plan)); await pending; assert.equal(vm.runInContext('clothierPendingQuote', c), null); assert.equal(c.player.coins, 500); assert.equal(c.player.clothierJob, undefined);
        assert.equal(vm.runInContext('tailorRequests.has(player)', c), false);
    }
});

test('interrupted handover retains the paid original-player job and never attaches it to a new player', async () => {
    const c = harness(); await c.prepare(); await c.send('quote'); const replacement = { hp: 20, inventory: [], equipped: {}, coins: 2 };
    c.onAdvance = () => { c.G.player = replacement; }; await c.confirm();
    assert.equal(c.player.coins, 494); assert.equal(c.player.clothierJob.item, c.coat); assert.equal(c.player.clothierJob.turnsLeft, 4); assert.equal(replacement.clothierJob, undefined);
    const moved = harness(); await moved.prepare(); await moved.send('quote');
    moved.onAdvance = () => { moved.G.activeRoom = { creatures: [], structural: [] }; }; await moved.confirm();
    assert.equal(moved.player.clothierJob.item, moved.coat); assert(moved.saves > 0);
});

test('reinforcement retains native wear while repair restores only the job piece; collection is single-use', async () => {
    const c = harness(); await c.prepare('reinforce'); await c.send('quote'); await c.confirm();
    const job = c.player.clothierJob; job.turnsLeft = 0; await c.collectClothierJob(c.vendor);
    assert.equal(c.coat.armor, 1); assert.equal(c.coat.durability.max, 13); assert.equal(c.coat.durability.hp, 8); assert.equal(c.coat.value, 25);
    await c.collectClothierJob(c.vendor); assert.equal(c.player.inventory.filter(i => i === c.coat).length, 1); assert.equal(c.coat.durability.max, 13);
});

test('late alteration appraisals cannot cache or apply after exact job/item/provider/scene changes', async () => {
    for (const change of [c => c.G.activeRoom = { creatures: [], structural: [] }, c => c.player.clothierJob.item = { ...c.player.clothierJob.item }, c => c.player.clothierJob.quote.description = 'Changed', c => c.vendor.offDuty = true]) {
        const c = harness(); await c.prepare('alteration'); await c.send('quote'); await c.confirm(); const job = c.player.clothierJob; job.turnsLeft = 0; let resolve;
        c.requestClothierAppraisal = () => new Promise(r => { resolve = r; }); const pending = c.collectClothierJob(c.vendor); assert(resolve);
        change(c); resolve({ success: true, appealing: true, reason: 'Good.', name: 'Changed shirt', description: 'New.', charismaChange: 1, valueChange: 5 });
        assert.equal((await pending).status, 'interrupted'); assert.equal(job.outcome, undefined); assert.equal(c.coat.name, 'Linen shirt'); assert(!c.player.inventory.includes(c.coat));
    }
});

test('appraisal failure keeps the job safe; explicit retry applies and publishes the native success/appeal outcome once', async () => {
    const c = harness(); await c.prepare('alteration'); await c.send('quote'); await c.confirm(); const job = c.player.clothierJob; job.turnsLeft = 0;
    c.requestClothierAppraisal = async () => null; assert.equal((await c.collectClothierJob(c.vendor)).status, 'blocked'); assert.equal(c.player.clothierJob, job);
    c.requestClothierAppraisal = async () => ({ success: false, appealing: false, reason: 'Crooked seams.', name: 'Uneven shirt', description: 'A crooked hem.', charismaChange: -1, valueChange: -3 });
    await c.collectClothierJob(c.vendor); assert.equal(c.coat.name, 'Uneven shirt'); assert.equal(c.coat.charisma, -1); assert.equal(c.coat.value, 17); assert.equal(c.player.clothierJob, null);
    assert.equal(c.events.find(e => e.service?.action === 'collect').service.appraisal.success, false);
});

test('pockets use free confirmation, exact worn pack identity and native once-per-clothier costs/gains', async () => {
    const c = harness(); await c.send('pockets rucksack'); const oldMenu = c.menus.menu, oldChoice = oldMenu.options[0]; assert.equal(c.player.coins, 500);
    await c.confirm(); assert.equal(c.player.rucksack.container.maxUnitCapacity, 23); assert.equal(c.player.coins, 425); assert.equal(c.turn, 101);
    await c.runSharedChoice(oldMenu, oldChoice); assert.equal(c.player.coins, 425); assert(c.getClothierPocketBlock(c.vendor, c.player.rucksack));
    const pack = c.player.rucksack; c.player.rucksack = { ...pack, container: { ...pack.container }, clothierPocketMakers: [] }; await c.send('options'); await c.send('pockets rucksack'); c.player.rucksack = pack;
    await c.confirm(); assert.equal(c.player.coins, 425);
});

test('help/show preserve pending drafts/quotes and queues require explicit approval and continuation', async () => {
    const c = harness(); await c.send('tailor repair linen shirt then choose 1'); await c.send('offer 2 linen'); await c.send('request "Patch it"'); await c.send('quote'); const menu = c.menus.menu;
    await c.send('show tailoring'); await c.send('how tailor'); assert.equal(c.menus.menu, menu); await c.send('continue'); assert.equal(c.turn, 100);
    await c.executeTextTailorCommand({ verb: 'tailor', args: { action: 'confirm', target: '' } }); assert.equal(c.player.coins, 500);
    await c.confirm(); assert.equal(c.state.queue.length, 1); await c.send('leave'); await c.send('continue'); assert.equal(c.state.queue.length, 0);
});
