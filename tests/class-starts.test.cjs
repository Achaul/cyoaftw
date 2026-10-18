const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const source = fs.readFileSync(process.argv[2] || 'C:/Git/CYOADEV/cyoaftw-engine-CORE.js', 'utf8').replace(/\r\n/g, '\n');
function section(start, end) {
    const a = source.indexOf(start), b = source.indexOf(end, a);
    assert.ok(a >= 0 && b > a, start);
    return source.slice(a, b);
}
function harness(roll = 0) {
    let uid = 0;
    const math = Object.create(Math); math.random = () => roll;
    const c = {
        console, window: {}, Math: math,
        assignLootUID(item) { item._uid = 'item-' + ++uid; return item; },
        rand: list => list[Math.floor(roll * list.length)],
        createPotionItem: template => ({ ...template }), POTION_OF_MANA_TEMPLATE: { id: 'potion-of-mana', name: 'Potion of Mana' },
        createNPCTradeGood: item => ({ ...item }), TRADE_GOODS: [{ id: 'bandage' }, { id: 'lockpick' }],
        applyTechniqueSideEffects() {} // Poison recipe bookkeeping is outside this loadout harness.
    };
    vm.createContext(c);
    vm.runInContext(section('const PLAYER_CLASSES =', 'const CLASS_STAT_LABELS ='), c);
    vm.runInContext(section('const CLASS_KEYS =', '// ── MANA'), c);
    c.classes = vm.runInContext('PLAYER_CLASSES', c);
    c.getPlayerClassDef = p => c.classes[p.class];
    vm.runInContext(section('const WIZARD_SPELLS =', 'function getScrollCopyBlockReason('), c);
    vm.runInContext(section('const BRANCH_TIERS =', 'const WIZARD_LEARN_FROM_BOOK_TURNS ='), c);
    vm.runInContext(section('function isSpellLearned(', '// Where a spell would be learned'), c);
    vm.runInContext(section('const FIGHTER_MANEUVERS =', 'const FIGHTER_DISARM_DC ='), c);
    for (const name of ['ROGUE_LOCK_MIN_RANK', 'ROGUE_SNEAK_MIN_RANK', 'ROGUE_BACKSTAB_MIN_RANK', 'ROGUE_PICKPOCKET_MIN_RANK', 'ROGUE_POISON_MIN_RANK']) vm.runInContext(source.match(new RegExp('^const ' + name + ' = .*$', 'm'))[0], c);
    c.make = cls => {
        const def = c.classes[cls];
        const player = { class: cls, inventory: c.createClassGearItems(def) };
        c.ensureClassSkillState(player);
        c.migrateClassBranchState(player);
        return player;
    };
    return c;
}

test('every Wizard roll starts with exactly one book and one learned basic attack spell', () => {
    const seen = new Set();
    for (const roll of [0, 0.25, 0.49, 0.5, 0.75, 0.999999]) {
        const c = harness(roll), player = c.make('Wizard');
        const books = c.getPlayerSpellbooks(player), castable = c.getCastableSpellIds(player);
        assert.equal(books.length, 1, 'Book must be guaranteed at random roll ' + roll);
        assert.equal(books[0].spells.length, 1); assert.equal(castable.length, 1);
        assert.ok(['firebolt', 'frostShard', 'lightningArc'].includes(castable[0]));
        seen.add(castable[0]);
        assert.equal(c.getTechniqueDef(castable[0]).tier, 'basic');
        assert.equal(player.classSkills.wizard.rank, 3);
        assert.equal(player.inventory.filter(i => i.id === 'potion-of-mana').length, 1);
        assert.equal(player.inventory.filter(c.isSpellScrollItem).length, 0);
        const before = JSON.stringify(player);
        assert.equal(c.migrateClassBranchState(player), false);
        assert.equal(JSON.stringify(player), before, 'Repeated initialization cannot grant duplicates');
    }
    assert.equal(seen.size, 3);
});

test('the starter spell still needs its carried book and grants no other schools or spells', () => {
    const c = harness(0), player = c.make('Wizard');
    assert.equal(c.getPlayerTechniqueIds(player, 'wizard').length, 1);
    const spell = c.getCastableSpellIds(player)[0], book = player.inventory.find(c.isSpellbookItem);
    player.inventory = player.inventory.filter(i => i !== book);
    assert.equal(c.getCastableSpellIds(player).length, 0);
    assert.equal(c.isSpellLearned(player, spell), true, 'Losing the book does not erase training');
    player.inventory.push(book); assert.equal(c.getCastableSpellIds(player)[0], spell);
});

test('other classes keep their existing starting gear and technique rules', () => {
    const c = harness();
    const fighter = c.make('Fighter'), rogue = c.make('Rogue'), cleric = c.make('Cleric');
    assert.deepEqual(Array.from(c.getPlayerTechniqueIds(fighter, 'fighter')).sort(), ['cleave', 'disarm', 'sunder']);
    for (const id of ['sneakHide', 'backstab', 'lockDoor', 'pickpocket', 'nightshade']) assert.equal(c.playerHasTechnique(rogue, id), true);
    assert.equal(rogue.inventory.filter(i => i.id === 'lockpick').length, 2);
    assert.equal(fighter.inventory.filter(i => i.id === 'bandage').length, 1);
    assert.equal(cleric.inventory.filter(i => i.id === 'bandage').length, 2);
    assert.equal(c.getPlayerTechniqueIds(cleric, 'cleric').length, 0, 'Divine techniques require a patron');
    for (const player of [fighter, rogue, cleric]) assert.equal(c.getPlayerSpellbooks(player).length, 0);
});

test('existing branch saves receive no replacement book or free spell on reinitialization', () => {
    const c = harness(), player = { class: 'Wizard', inventory: [], branchVersion: 1, classBranches: {} };
    assert.equal(c.migrateClassBranchState(player), false);
    assert.equal(player.inventory.length, 0); assert.equal(c.getCastableSpellIds(player).length, 0);
});
