const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(process.argv[2] || 'C:/Git/CYOAFTW/.loot-search/cyoaftw-engine-CORE.js', 'utf8').replace(/\r\n/g, '\n');
function section(from, to) { const a = source.indexOf(from), b = source.indexOf(to, a); assert(a >= 0 && b > a, from); return source.slice(a, b); }
const code = section('// Text commands are a presentation/input layer.', '// END TEXT COMMANDS') + '\n' +
    section('const SEARCH_APPROACHES = [', '// Applies the concealment rules') + '\n' +
    section('function isLootItemVisible(', 'function takeLootUnitsFromList(') + '\n' +
    section('function rollStatCheck(', '// -- CHARISMA / ROOM AMBUSH') + '\n' +
    section('// Discovery is an engine action shared', 'function revealBodyLoot(');
const plain = value => JSON.parse(JSON.stringify(value));
const item = (name, fields = {}) => ({ name, quantity: 1, ...fields });
function harness(kind = 'body') {
    const player = { name: 'Player', hp: 20, stamina: 20, staminaMax: 20, inventory: [], equipped: {}, coins: 5 };
    const room = { items: [], structural: [], creatures: [] };
    const target = kind === 'fixture' ? { name: 'Chest', opened: true, contents: { items: [], coins: 7 }, tags: ['storage'] } : kind === 'carry' ? { name: 'Pack', container: {}, packed: [] } : { name: 'Dwarf body', objectType: 'body', inventory: [], equipped: {}, coins: 7 };
    (kind === 'fixture' ? room.structural : room.items).push(target);
    const c = {
        console, setTimeout, clearTimeout, player, room, target, kind, roll: 14, bonuses: {}, turns: 0, rolls: [], spent: [], gains: [], faith: 0, saved: null, messages: [], cards: [],
        G: { player, activeRoom: room, activeNPC: null, activeNPCMode: null },
        document: { getElementById: () => null }, window: {},
        isFixtureVisible: it => !it.hidden && !it.concealed, isContainerFixture: it => (it.tags || []).includes('storage'),
        isCarryContainerItem: it => !!it.container, isRoomCollapsed: () => !!c.collapsed,
        roomHasActiveHostile: () => !!c.hostile, hasPendingPartyLoot: () => !!c.partyPending,
        isChestLocked: it => !!it.locked, isFixtureBurning: it => !!it.fire, isChestBurning: it => !!it.burning,
        ensureEntityStamina() {}, isEntityExhausted: entity => entity.stamina <= 0,
        getContainerContents: it => player.inventory.includes(it) || player.rucksack === it ? player.inventory.filter(entry => entry.stowed === it.name) : it.packed || [],
        ensureContainerContents: it => it.contents,
        getItemName: it => it.name, getEntityName: it => it.name, getItemQuantity: it => it.quantity || 1,
        withIndefiniteArticle: name => 'a ' + name,
        spendEntityStamina(entity, amount) { c.spent.push(amount); entity.stamina -= amount; },
        advanceStoryTurn(amount) { c.turns += amount; if (c.duringTurn) c.duringTurn(); },
        runNPCAutonomyTick() { if (c.duringAutonomy) c.duringAutonomy(); },
        rollD20() { c.rolls.push(c.roll); return c.roll; }, getEntityStatCombatBonus: (_entity, stat) => c.bonuses[stat] || 0,
        trackCombatSkillGain(_entity, options) { c.gains.push(options.statKey); return {}; },
        applyFaithDelta() { c.faith++; }, rememberStoryEvent() {}, renderStats() {},
        saveGameState() { c.saved = plain({ player, room }); },
        setNarration(text) { c.messages.push(text); },
        renderRoomObjectActionMenu(it) { c.cards.push(['body', it]); }, openFixtureCard(it) { c.cards.push(['fixture', it]); }, openContainerCard(it) { c.cards.push(['carry', it]); }
    };
    vm.createContext(c); vm.runInContext(code, c);
    c.members = () => kind === 'body' ? target.inventory : kind === 'fixture' ? target.contents.items : target.packed;
    c.search = approach => c.performLootContentsSearch(target, kind, approach || 'careful');
    return c;
}

test('search grammar preserves primary commands, supports approach aliases and keeps quoted source names', () => {
    const h = harness();
    for (const [text, approach, target] of [['search body', 'careful', 'body'], ['search chest carefully', 'careful', 'chest'], ['rummage tight rucksack', 'tight', 'rucksack'], ['search force chest', 'force', 'chest'], ['search "Force chest"', 'careful', 'Force chest']]) {
        assert.deepEqual(plain(h.parseTextCommand(text)), { verb: 'search', args: { source: target, approach } });
    }
});

test('a paid discovery reveals direct hidden flags while leaving hidden traits, nested contents and script-only items alone', () => {
    const h = harness();
    const hidden = item('Ring', { hidden: true, hiddenTrait: { label: 'Secret blessing' } });
    const inner = item('Nested secret', { hidden: true });
    h.members().push(hidden, item('Pouch', { packed: [inner] }), item('Script item', { hidden: true, searchable: false }), item('Dusty note', { isHidden: true }), item('Pin', { concealed: true }), item('Invisible coin', { visible: false }));
    const result = h.search();
    assert.equal(result.status, 'completed'); assert.equal(result.found.length, 4);
    for (const found of [hidden, ...h.members().slice(3)]) assert.equal(h.isLootItemVisible(found), true);
    assert.equal(inner.hidden, true); assert.equal(h.members()[2].hidden, true); assert.equal(hidden.hiddenTraitRevealed, undefined);
    assert.equal(h.player.inventory.length, 0); assert.equal(h.player.coins, 5); assert.equal(h.target.coins, 7);
    assert.deepEqual(h.spent, [1]); assert.equal(h.turns, 1); assert.equal(h.target.bodyLooted, true); assert.equal(h.faith, 1);
    assert.equal(h.saved.room.items[0].inventory[0].hidden, false);
});

test('each approach uses its matching stat and individual difficulty with a single shared roll', () => {
    const h = harness('fixture');
    h.members().push(item('Default', { hidden: true }), item('Hard note', { hidden: true, revealDC: 18 }), item('Tight seam', { hidden: true, revealStat: 'flexibility', revealDC: 14 }), item('False bottom', { hidden: true, revealStat: 'physicalProwess' }));
    assert.deepEqual(plain(h.search().found.map(it => it.name)), ['Default']);
    assert.deepEqual(plain(h.search('tight').found.map(it => it.name)), ['Tight seam']);
    assert.deepEqual(plain(h.search('force').found.map(it => it.name)), ['False bottom']);
    assert.equal(h.members()[1].hidden, true); assert.deepEqual(h.spent, [1, 2, 3]); assert.deepEqual(h.gains, ['willpower', 'flexibility', 'physicalProwess']); assert.equal(h.rolls.length, 3);
});

test('natural 1 never discovers an item and natural 20 beats high difficulties for the selected stat', () => {
    const h = harness(); h.members().push(item('Easy', { hidden: true, revealDC: 1 }), item('Hard', { hidden: true, revealDC: 100 }));
    h.roll = 1; h.bonuses.willpower = 50; assert.equal(h.search().found.length, 0);
    h.roll = 20; assert.equal(h.search().found.length, 2);
});

test('failed, empty and repeated searches pay every time without revealing whether unseen items remain or farming skill gains', () => {
    const h = harness(); h.roll = 1; h.members().push(item('Secret', { hidden: true }));
    const failed = h.search(); assert.equal(failed.found.length, 0); assert(!failed.message.includes('Secret'));
    h.members().length = 0;
    const empty = h.search(); assert.equal(empty.message, failed.message); assert.equal(h.rolls.length, 2);
    assert.equal(h.turns, 2); assert.deepEqual(h.spent, [1, 1]); assert.equal(h.gains.length, 0); assert.equal(h.faith, 1);
    h.members().push(item('New secret', { hidden: true })); h.roll = 20; h.search(); h.search();
    assert.equal(h.rolls.length, 4); assert.equal(h.gains.length, 1); assert.equal(h.faith, 1);
});

test('invalid discovery data falls back to a usable default while invalid approaches cost nothing', () => {
    const h = harness('fixture'); h.members().push(item('Old note', { hidden: true, revealDC: -4, revealStat: 'unknown' }));
    assert.equal(h.search('luck').status, 'blocked'); assert.equal(h.turns, 0);
    assert.equal(h.search().found[0].name, 'Old note');
});

test('danger, locks, resource shortages, unrelated cards and party decisions block before paying', () => {
    for (const setup of [h => { h.hostile = true; }, h => { h.target.opened = false; }, h => { h.target.locked = true; }, h => { h.target.fire = true; }, h => { h.player.stamina = 0; }, h => { h.player.stamina = 2; }, h => { h.partyPending = true; }, h => { h.G.activeItemModal = {}; }, h => { h.G.activeObject = {}; }, h => { h.G.activeNPC = {}; }, h => { h.target.hidden = true; }]) {
        const h = harness('fixture'); setup(h); assert.equal(h.search('force').status, 'blocked'); assert.equal(h.turns, 0); assert.equal(h.rolls.length, 0); assert.equal(h.spent.length, 0);
    }
});

test('time passing cannot reveal replacement bodies, relocated sources, altered stashes or secrets after combat begins', () => {
    for (const setup of [h => { h.room.items = [{ ...h.target }]; }, h => { h.target.inventory = h.target.inventory.slice(); }, h => { h.target.objectType = 'npc'; }, h => { h.G.activeNPC = {}; h.G.activeNPCMode = 'combat'; }, h => { h.player.hp = 0; }, h => { h.target.hidden = true; }]) {
        const h = harness(); h.members().push(item('Secret', { hidden: true })); h.duringTurn = () => setup(h);
        const result = h.search(); assert.equal(result.status, 'interrupted'); assert.equal(h.turns, 1); assert.deepEqual(h.spent, [1]); assert.equal(h.rolls.length, 0); assert.equal(h.target.inventory[0].hidden, true);
    }
    const fixture = harness('fixture'); fixture.members().push(item('Secret', { hidden: true })); fixture.duringAutonomy = () => { fixture.target.contents = { items: [item('Replacement', { hidden: true })], coins: 0 }; };
    assert.equal(fixture.search().status, 'interrupted'); assert.equal(fixture.target.contents.items[0].hidden, true);
});

test('new arrivals and changed candidate metadata cannot inherit a search already in progress', () => {
    const h = harness(); const old = item('Old', { hidden: true }); h.members().push(old);
    h.duringTurn = () => { h.members().splice(0, 1, item('Replacement', { hidden: true })); };
    assert.equal(h.search().found.length, 0); assert.equal(old.hidden, true); assert.equal(h.members()[0].hidden, true);
    const other = harness(); const altered = item('Altered', { hidden: true, revealDC: 13 }); other.members().push(altered); other.duringTurn = () => { altered.revealDC = 1; };
    assert.equal(other.search().found.length, 0); assert.equal(altered.hidden, true);
});

test('owned flattened carry contents can be searched, and moving the container during a turn interrupts discovery', () => {
    const h = harness('carry'); h.room.items = []; h.player.rucksack = h.target;
    const secret = item('Stowed note', { hidden: true, stowed: h.target.name }); h.player.inventory.push(secret);
    assert.equal(h.search().found[0].name, 'Stowed note'); assert.equal(secret.hidden, false);
    secret.hidden = true;
    h.duringTurn = () => { h.player.rucksack = null; h.room.items.push(h.target); h.target.packed.push(secret); };
    assert.equal(h.search().status, 'interrupted'); assert.equal(secret.hidden, true);
});

test('normal controls and text use the same action with displayed costs and execution-time validation', () => {
    const h = harness('fixture'); h.members().push(item('Note', { hidden: true })); h.G.activeItemModal = {};
    const actions = h.getLootSearchActions(h.target, 'fixture'); assert.equal(actions.length, 3); assert.match(actions[0].label, /1 stamina, 1 turn/);
    assert.equal(actions[0].reason, ''); assert.equal(actions[0].run().status, 'blocked'); assert.equal(h.turns, 0);
    h.G.activeItemModal = h.target;
    assert.equal(actions[0].run().status, 'completed'); assert.equal(h.turns, 1); assert.equal(h.cards.at(-1)[0], 'fixture');
});
