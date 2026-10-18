const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(process.argv[2] || 'C:/Git/CYOADEV/cyoaftw-engine-CORE.js', 'utf8');
function section(start, end) {
    const a = source.indexOf(start), b = source.indexOf(end, a);
    assert(a >= 0 && b > a, start);
    return source.slice(a, b);
}
function harness(role = 'Merchant', temperament = 'neutral') {
    const npc = { id: 'npc', name: 'Mara', role, temperament, isHumanoid: true, hp: 20, hostility: 0, inventory: [], memory: { favorability: 0 }, social: { secret: { text: 'A hidden cache.', known: false } } };
    const player = { name: 'QA', hp: 20, inventory: [] };
    const room = { coords: '0,0', creatures: [npc], exits: { E: '1,0' } };
    const next = { coords: '1,0', creatures: [] };
    const options = { children: [], set innerHTML(v) { this.children = []; }, appendChild(v) { this.children.push(v); } };
    const c = { G: { player, activeRoom: room, activeNPC: npc, activeNPCMode: 'talk', roomMap: { '0,0': room, '1,0': next }, combatRollDebugMode: true },
        roll: 14, rolls: 0, turn: 10, saves: 0, deeds: 0, combats: 0, messages: [], locks: {}, collapsed: {},
        isAwakeHumanoidNPC: n => n.hp > 0 && !n.unconscious, isCompanionNPC: n => !!n._inParty, canConverseWithNPC: () => true,
        isGuardNPC: n => /guard/i.test(n.role), isMerchantLikeNPC: n => /merchant|blacksmith|healer/i.test(n.role),
        isBarKeeper: n => /bartender|innkeeper/i.test(n.role), renownRefusesTrade: n => !!n.refusesTrade, isBarRefusing: () => false,
        getItemValue: item => item.value || 0, isItemEquippedByEntity: (n, item) => !!(n.equipped && Object.values(n.equipped).includes(item)),
        playerHasActiveStatus: (n, key) => !!(n.status && n.status[key]),
        isExitCollapsed: (_room, dir) => !!c.collapsed[dir],
        npcLockAccess: (_npc, _room, dir) => c.locks[dir] || { ok: true, how: 'open' },
        npcPassExit: (n, r, dir) => c.npcLockAccess(n, r, dir).ok,
        rollDrunkMovementEvent() { throw Error('Forced departure should skip drunken stumbling'); },
        readNoticeBoardsOnEntry() {}, FLEE_RUN_EXTRA_STEPS: 2,
        getNPCDeedReaction: () => ({ deeds: [], lean: 0 }), RENOWN_DEED_AXES: {}, RENOWN_REACT_SCALE: 10,
        getEntityStatCombatBonus: entity => entity === player ? 2 : 0,
        rollD20() { c.rolls++; return c.roll; }, getCurrentStoryTurn: () => c.turn,
        advanceStoryTurn(n) { c.turn += n; }, advanceNPCAffectTime() {},
        ensureNPCSocial: n => n.social, socialFactAvailable: () => false,
        addChatMessage(side, speaker, text) { c.messages.push({ side, speaker, text }); },
        applyNPCImpact(n, impact) { n.hostility += impact.hostility || 0; n.memory.favorability += impact.favor || 0; },
        recordDeed() { c.deeds++; }, saveGameState() { c.saves++; }, renderStats() {}, renderChatOptions() {},
        renderCombatActionMenu() { c.combats++; }, renderCombatNarrationLines(lines) { c.combatLines = lines; }, resolveNPCCounter: () => false,
        disengageFromNPC(text) { c.G.activeNPC = null; c.G.activeNPCMode = null; c.departureText = text; c.saves++; },
        document: { getElementById: id => id === 'chatOptionsEl' ? options : null, createElement: () => ({}) },
        _getRenownReactionPriceMultiplier: () => 1, isClothier: n => n.role === 'Clothier', getItemUnitValue: item => item.value,
        CLOTHIER_LARGE_RUCKSACK_PRICE: 100, CLOTHIER_SATCHEL_PRICE: 200
    };
    c.window = c;
    vm.createContext(c);
    for (const [start, end] of [
        ['function rollStatCheck(', '// -- CHARISMA / ROOM AMBUSH'],
        ['function formatRollLine(', 'function ensureCombatSkills('],
        ['function getNPCExitDirTo(', 'function npcHoldsKeyFor('],
        ['function relocateNPCBetweenRooms(', '// ── TRAILS'],
        ['// -- INTIMIDATION (step 9)', '// -- COMPANION CRIME REACTIONS'],
        ['function getRenownPriceMultiplier(', 'function _getRenownReactionPriceMultiplier('],
        ['function getTradeBuyPrice(', '// Left-panel line:'],
        ['function getBarPrice(', 'function getBarScanRooms(']
    ]) vm.runInContext(section(start, end), c);
    return { c, npc, player, room, next, options };
}

test('menus expose leave and existing information demands, plus prices for all actual sellers', () => {
    for (const role of ['Merchant', 'Clothier', 'Alchemist', 'Enchanter', 'Blacksmith', 'Bartender']) {
        const { c, npc, options } = harness(role);
        const keys = Array.from(c.getIntimidationDemands(npc), d => d.key);
        assert(keys.includes('leave') && keys.includes('price') && keys.includes('secret'), role);
        c.showIntimidateMenu(npc);
        assert(options.children.some(b => b.textContent === 'Make them leave the room'));
        assert(options.children.some(b => b.textContent === 'Make them lower prices'));
    }
    const { c, npc } = harness('Townsfolk');
    assert(!Array.from(c.getIntimidationDemands(npc), d => d.key).includes('price'));
    npc.inventory.push({ value: 30 });
    assert(Array.from(c.getIntimidationDemands(npc), d => d.key).includes('price'));
    npc.equipped = { weapon: npc.inventory[0] };
    assert(!Array.from(c.getIntimidationDemands(npc), d => d.key).includes('price'));
});

test('a successful leave demand rolls, harms the relationship, and relocates rather than deleting the NPC', () => {
    const { c, npc, room, next } = harness();
    const result = c.resolveIntimidation(npc, 'leave');
    assert.equal(result.success, true); assert.equal(result.left, true);
    assert.equal(c.rolls, 1); assert.equal(c.turn, 11);
    assert(!room.creatures.includes(npc)); assert(next.creatures.includes(npc));
    assert.equal(npc.memory.favorability, -6); assert.equal(npc.hostility, 10);
    assert.equal(c.G.activeNPC, null); assert.equal(c.G.activeNPCMode, null);
    assert.match(c.departureText, /leaves the room/);
    assert.equal(c.saves, 1);
});

test('unavailable, locked, collapsed, bound and stale departures cannot spend a turn or roll', () => {
    for (const configure of [
        ({ room }) => { room.exits = {}; },
        ({ c }) => { c.locks.E = { ok: false, how: null }; },
        ({ c }) => { c.locks.E = { ok: true, how: 'pick' }; },
        ({ c }) => { c.collapsed.E = true; },
        ({ npc }) => { npc.bound = true; },
        ({ c }) => { c.G.activeNPC = null; }
    ]) {
        const h = harness(); configure(h);
        assert.equal(h.c.resolveIntimidation(h.npc, 'leave'), null);
        assert.equal(h.c.turn, 10); assert.equal(h.c.rolls, 0);
        assert(h.room.creatures.includes(h.npc));
    }
});

test('departure supports stairs and key-accessible exits without teleporting home', () => {
    const { c, npc, room, next } = harness();
    room.exits = { U: next.coords }; c.locks.U = { ok: true, how: 'key' };
    npc._homeCoords = '100,100'; c.G.roomMap['100,100'] = { coords: '100,100', creatures: [] };
    assert.equal(c.resolveIntimidation(npc, 'leave').left, true);
    assert(next.creatures.includes(npc)); assert.equal(c.G.roomMap['100,100'].creatures.length, 0);
});

test('failed leave and price demands preserve location and prices but harm favor and hostility', () => {
    for (const key of ['leave', 'price']) {
        const { c, npc, room } = harness('Merchant', 'friendly'); c.roll = 2;
        const result = c.resolveIntimidation(npc, key);
        assert.equal(result.success, false); assert.equal(result.violent, false);
        assert(room.creatures.includes(npc)); assert(npc.memory.favorability < 0); assert(npc.hostility > 0);
        assert.equal(c.getIntimidationPriceMult(npc), 1); assert.equal(c.deeds, 1);
    }
});

test('bold targets can fight back when either demand fails', () => {
    for (const key of ['leave', 'price']) {
        const { c, npc, room } = harness('Merchant', 'bold'); c.roll = 2;
        const result = c.resolveIntimidation(npc, key);
        assert.equal(result.violent, true); assert.equal(c.G.activeNPCMode, 'combat');
        assert.equal(c.combats, 1); assert(room.creatures.includes(npc));
        assert.equal(npc.memory.favorability, -15); assert.equal(npc.hostility, 45);
    }
});

test('price success reduces real buy quotes temporarily, while critical success yields a deeper cut', () => {
    for (const [roll, expected] of [[14, 75], [20, 60]]) {
        const { c, npc } = harness(); c.roll = roll;
        assert.equal(c.getTradeBuyPrice(npc, { value: 100 }), 100);
        const result = c.resolveIntimidation(npc, 'price');
        assert.equal(result.success, true); assert.equal(c.getTradeBuyPrice(npc, { value: 100 }), expected);
        assert(npc.memory.favorability < 0 && npc.hostility > 0);
        const state = JSON.parse(JSON.stringify(npc.memory)); npc.memory = state;
        assert.equal(c.getTradeBuyPrice(npc, { value: 100 }), expected, 'discount survives save-shaped data');
        assert.equal(c.resolveIntimidation(npc, 'price'), null, 'cannot repeatedly stack an active discount');
        c.turn += 30; assert.equal(c.getTradeBuyPrice(npc, { value: 100 }), 100);
    }
});

test('clothier special stock and bar prices honor the negotiated reduction', () => {
    const clothier = harness('Clothier'); clothier.c.roll = 20;
    clothier.c.resolveIntimidation(clothier.npc, 'price');
    assert.equal(clothier.c.getTradeBuyPrice(clothier.npc, { largeRucksack: true }), 60);
    assert.equal(clothier.c.getTradeBuyPrice(clothier.npc, { enchantedSatchel: true }), 120);
    const bar = harness('Bartender'); bar.c.roll = 20;
    bar.c.resolveIntimidation(bar.npc, 'price');
    assert.equal(bar.c.getBarPrice(bar.npc, { value: 10 }), 6);
});

test('repeated intimidation becomes harder and companions and guides remain ineligible', () => {
    const { c, npc } = harness();
    const first = c.getIntimidationDC(npc, 'leave');
    c.roll = 2; c.resolveIntimidation(npc, 'leave');
    assert(c.getIntimidationDC(npc, 'leave') > first);
    npc._inParty = true; assert.equal(c.getIntimidationDemands(npc).length, 0);
    npc._inParty = false; npc.isGuide = true; assert.equal(c.getIntimidationDemands(npc).length, 0);
});
