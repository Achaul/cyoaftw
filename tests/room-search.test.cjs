const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(process.argv[2] || 'C:/Git/CYOADEV/cyoaftw-engine-CORE.js', 'utf8').replace(/\r\n/g, '\n');
const world = fs.readFileSync('C:/Git/CYOADEV/cyoaftw-world-data.js', 'utf8');
function section(start, end) {
    const a = source.indexOf(start), b = source.indexOf(end, a);
    assert(a >= 0 && b > a, start);
    return source.slice(a, b);
}
function harness(type = 'Chamber', fixtures = [{ id: 'chest', name: 'chest' }]) {
    const player = { name: 'QA', stamina: 20 };
    const room = { type, name: type, structural: fixtures, forageSeeded: true, herbsSeeded: true };
    const c = { G: { activeRoom: room, player, combatRollDebugMode: true }, rolls: 0, turns: 0, xp: 0, saves: 0, roll: 14, bonus: 2,
        ensureNoticeWritingSupplies() {}, isTrapFixture: () => false, isRoomCollapsed: () => false,
        roomHasActiveHostile: () => false, isEntityExhausted: () => player.stamina <= 0,
        getEntityName: fixture => fixture.name,
        spendEntityStamina(entity, cost) { entity.stamina = Math.max(0, entity.stamina - cost); },
        advanceStoryTurn(n) { c.turns += n; },
        rollD20() { c.rolls++; return c.roll; }, getEntityStatCombatBonus: () => c.bonus,
        trackCombatSkillGain() { c.xp++; return {}; }, formatSkillGainDebug: () => '',
        resetNpcPanel() {}, renderStats() {}, saveGameState() { c.saves++; },
        renderNarrationWithRoomObservations(current, text) { c.narration = text; c.visible = c.getVisibleRoomFixtures(current); },
        setNarration(text) { c.narration = text; }
    };
    c.window = c;
    vm.createContext(c);
    vm.runInContext(world, c);
    vm.runInContext(section('const FIXTURE_CONCEALMENT_RULES =', '// Applies the concealment rules'), c);
    vm.runInContext(section('function ensureRoomFixtureState(', '// Sub-menu of search approaches'), c);
    vm.runInContext(section('function rollStatCheck(', '// -- CHARISMA / ROOM AMBUSH'), c);
    vm.runInContext(section('function formatRollLine(', 'function ensureCombatSkills('), c);
    vm.runInContext(section('function performRoomSearch(', '// ── CONTAINERS'), c);
    return { c, player, room };
}

test('the actual Smithy Storeroom never rolls against DC zero or reports an empty search as a miss', () => {
    for (const approach of ['careful', 'tight', 'force']) {
        const { c, room, player } = harness('Smithy Storeroom', []);
        room.structural = JSON.parse(JSON.stringify(c.getRoomTemplate('Smithy Storeroom').structural));
        c.performRoomSearch(approach);
        assert.equal(c.rolls, 0);
        assert.doesNotMatch(c.narration, /vs 0|\bMiss\b|\bFailure\b|Critical/i);
        assert.match(c.narration, /nothing new/);
        assert.equal(c.xp, 0);
        assert.equal(c.turns, 1);
        assert.equal(player.stamina, 20 - ({ careful: 1, tight: 2, force: 3 })[approach]);
        assert.equal(c.visible.length, 3);
    }
});

test('an approach without matching hidden targets skips its check without revealing other targets', () => {
    const { c, room } = harness();
    c.performRoomSearch('careful');
    assert.equal(c.rolls, 0);
    assert.equal(room.structural[0].revealed, false);
    assert.equal(c.xp, 0);
    assert.doesNotMatch(c.narration, /vs 0|\bMiss\b/);
});

test('ordinary rolls above a target DC reveal the fixture and award XP', () => {
    const { c, room } = harness();
    c.performRoomSearch('tight');
    assert.equal(c.rolls, 1);
    assert.equal(room.structural[0].revealed, true);
    assert.equal(c.xp, 1);
    assert.match(c.narration, /d20\(14\) \+ 2 = 16 vs 11 -> Success/);
    assert.doesNotMatch(c.narration, /\bHit\b|\bMiss\b/);
});

test('failed checks show a real DC, award no XP, and can be retried', () => {
    const { c, room } = harness(); c.roll = 4;
    c.performRoomSearch('tight');
    assert.equal(room.structural[0].revealed, false);
    assert.equal(c.xp, 0);
    assert.match(c.narration, /vs 11 -> Failure/);
    c.roll = 14; c.performRoomSearch('tight');
    assert.equal(room.structural[0].revealed, true);
    assert.equal(c.rolls, 2);
});

test('natural one still fails and natural twenty still discovers matching fixtures', () => {
    const failed = harness(); failed.c.roll = 1; failed.c.bonus = 100;
    failed.c.performRoomSearch('tight');
    assert.equal(failed.room.structural[0].revealed, false);
    assert.match(failed.c.narration, /Critical failure/);
    const passed = harness(); passed.c.roll = 20; passed.c.bonus = -100;
    passed.c.performRoomSearch('tight');
    assert.equal(passed.room.structural[0].revealed, true);
    assert.match(passed.c.narration, /Critical success/);
});

test('one roll handles mixed target difficulties without misreporting the higher DC', () => {
    const { c, room } = harness('Chamber', [
        { id: 'a', name: 'cache', stateInit: true, concealed: true, revealStat: 'willpower', revealDC: 10 },
        { id: 'b', name: 'rune', stateInit: true, concealed: true, revealStat: 'willpower', revealDC: 18 }
    ]);
    c.performRoomSearch('careful');
    assert.equal(room.structural[0].revealed, true);
    assert.notEqual(room.structural[1].revealed, true);
    assert.equal(c.rolls, 1);
    assert.match(c.narration, /vs 10\/18 -> Success/);
});

test('debug-off searches still discover targets and completed searches cannot spend again', () => {
    const { c, player } = harness(); c.G.combatRollDebugMode = false;
    c.performRoomSearch('tight');
    assert.doesNotMatch(c.narration, /\[Roll\]/);
    assert.equal(c.xp, 1);
    const stamina = player.stamina;
    c.performRoomSearch('tight');
    assert.equal(player.stamina, stamina);
    assert.equal(c.rolls, 1);
    assert.equal(c.turns, 1);
    assert.match(c.narration, /nothing more to find/);
});
