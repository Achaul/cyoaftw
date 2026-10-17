const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const core = fs.readFileSync(process.argv[2] || 'C:/Git/CYOADEV/cyoaftw-engine-CORE.js', 'utf8').replace(/\r\n/g, '\n');
const world = fs.readFileSync(process.argv[3] || 'C:/Git/CYOAFTW/cyoaftw-world-data_8bff9bf205.js', 'utf8').replace(/\r\n/g, '\n');
function section(source, start, end) {
    const first = source.indexOf(start);
    const last = source.indexOf(end, first);
    assert.ok(first >= 0 && last > first, 'Missing section: ' + start);
    return source.slice(first, last);
}
function extractFunction(source, name) {
    return section(source, 'function ' + name + '(', '\nfunction ');
}
function harness(mode = 'settle', archetype = 'coming-of-age', dayTurns = 54) {
    let seq = 0;
    const c = {
        turn: 11, waves: 0, saves: 0, notes: [], flags: new Set(),
        G: { player: { name: 'Test', hp: 20, coins: 100, backstory: { archetype, slots: {} } }, activeRoom: { zone: 'Town', coords: '0,0', creatures: [] }, roomMap: {} },
        getCurrentStoryTurn: () => c.turn,
        getPlayerBackstory: () => c.G.player.backstory,
        isEntityCollapsed: () => false,
        hasStoryFlag: flag => c.flags.has(flag),
        setStoryFlag: flag => c.flags.add(flag),
        addStoryFact() {}, rememberStoryEvent() {}, renderRoom() {},
        saveGameState: () => { c.saves++; },
        getZoneTemplate: () => ({}), rand: list => list[0],
        createNPC: () => ({ id: ++seq, name: 'Visitor', hp: 10, hpMax: 10, currentState: {}, memory: {} }),
        findNPCById: id => c.G.activeRoom.creatures.find(n => n.id === id),
        selectNPC: npc => { c.G.activeNPC = npc; },
        startNPCConversation() {}, addChatMessage() {}, renderChatOptions() {}, setNarration() {},
        triggerRoomAmbush: () => { c.waves++; }, document: { getElementById: () => null }
    };
    c.window = c;
    vm.createContext(c);
    const settings = section(world, 'const START_MODES =', '\nfunction _prSlot(');
    vm.runInContext(settings.replace('const STORY_DAY_TURNS = 54;', 'const STORY_DAY_TURNS = ' + dayTurns + ';'), c);
    for (const name of ['_prSlot', '_prHas', 'getPressureSpec']) vm.runInContext(extractFunction(world, name), c);
    vm.runInContext(section(core, 'const PRESSURE_EVENT_DELAY_MS =', '// ── THE GUIDE'), c);
    vm.runInContext(core.match(/^const LODGING_DAY_TURNS = .*$/m)[0], c);
    vm.runInContext(core.match(/^const DAY_TURNS = .*$/m)[0], c);
    c.appendPressureNarration = text => c.notes.push(text);
    c.initBackstoryPressure(c.G.player, mode);
    c.base = c.turn;
    c.day = vm.runInContext('DAY_TURNS', c);
    return c;
}
function at(c, turn) { c.turn = turn; c.runPressureEvent(); }
function leaveConversation(c) { c.G.activeNPC = null; c.G.activeNPCMode = null; }

// Normal: warning after three days, emissary after seven, then a week to act.
// Check actual transitions, including a night passing the old arrival time.
{
    const c = harness();
    const pr = c.getPressure();
    at(c, c.base + 120);
    assert.equal(pr.stage, 0, 'The old emissary deadline no longer starts the story');
    at(c, c.base + 3 * c.day - 1);
    assert.equal(c.notes.length, 0);
    at(c, c.base + 3 * c.day);
    assert.equal(pr.stage, 1);
    assert.equal(c.G.activeRoom.creatures.length, 0);
    at(c, c.base + 7 * c.day - 1);
    assert.equal(pr.stage, 1);
    at(c, c.base + 7 * c.day);
    assert.equal(pr.stage, 2);
    assert.equal(c.G.activeRoom.creatures.length, 1);
    assert.equal(pr.nextTurn, c.base + 14 * c.day);
    leaveConversation(c);
    at(c, pr.nextTurn - 1);
    assert.equal(c.waves, 0);
    at(c, pr.nextTurn);
    assert.equal(c.waves, 1);
    assert.equal(pr.nextTurn, c.turn + 7 * c.day);
}

// Hard starts remain faster: warning after two days, hunters after five.
{
    const c = harness('survive', 'exile');
    const pr = c.getPressure();
    at(c, c.base + 2 * c.day);
    assert.equal(pr.stage, 1);
    at(c, c.base + 5 * c.day - 1);
    assert.equal(c.waves, 0);
    at(c, c.base + 5 * c.day);
    assert.equal(c.waves, 1);
    assert.equal(pr.nextTurn, c.turn + 4 * c.day);
    c.G.activeRoom.creatures.forEach(npc => { npc.dead = true; });
    at(c, pr.nextTurn);
    assert.equal(c.waves, 2);
    assert.equal(pr.beaten, 1);
    assert.equal(pr.nextTurn, c.turn + 4 * c.day);
}

// A delayed warning starts its next interval when it is delivered; sleep or
// conversation cannot collapse several missed phases into one arrival.
{
    const c = harness();
    c.G.activeNPC = {};
    at(c, c.base + 10 * c.day);
    assert.equal(c.getPressure().stage, 0);
    leaveConversation(c);
    at(c, c.turn);
    assert.equal(c.getPressure().stage, 1);
    assert.equal(c.getPressure().nextTurn, c.turn + 4 * c.day);
}

// Calendar tuning scales lodging, day/night and pressure together.
{
    const c = harness('settle', 'coming-of-age', 72);
    assert.equal(c.day, 72);
    assert.equal(c.getPressure().nextTurn, c.base + 3 * c.day);
}

// Extend each old phase once, including overdue saves and shorter duel terms.
for (const mode of ['settle', 'survive']) {
    for (const stage of [0, 1, 2, 3]) {
        const c = harness(mode);
        const pr = c.G.player.pressure;
        delete pr.timingVersion;
        pr.stage = stage;
        pr.nextTurn = c.turn + 5;
        pr.paid = 25; pr.beaten = 1; pr.npcIds = [123];
        const phase = ['warn', 'next', 'then', 'repeat'][stage];
        const old = mode === 'settle' ? [50, 70, 90, 130][stage] : [30, 40, 60, 90][stage];
        const duration = vm.runInContext('PRESSURE_TIMING.' + mode + '.' + phase, c);
        c.getPressure();
        assert.equal(pr.nextTurn, c.turn + 5 + duration - old);
        const deadline = pr.nextTurn;
        c.getPressure();
        assert.equal(pr.nextTurn, deadline, 'Repeated reads must not keep extending the deadline');
        assert.equal(pr.paid, 25); assert.equal(pr.beaten, 1); assert.deepEqual(pr.npcIds, [123]);
        c.G.player.pressure = JSON.parse(JSON.stringify(pr));
        assert.equal(c.getPressure().nextTurn, deadline, 'The migration marker survives saving and loading');
    }
}
{
    const c = harness('settle', 'revenge');
    const pr = c.G.player.pressure;
    delete pr.timingVersion;
    pr.stage = 2; pr.nextTurn = c.turn - 10; pr.extended = true;
    c.getPressure();
    assert.equal(pr.nextTurn, c.turn + Math.round(7 * c.day / 2) - 45 + 3 * c.day - 60);
}

// Fresh/resolved stories stay inactive; manual readiness still speeds a duel.
{
    const c = harness('fresh');
    at(c, 10000);
    assert.equal(c.waves, 0); assert.equal(c.notes.length, 0);
}
{
    const c = harness();
    const pr = c.getPressure();
    delete pr.timingVersion; pr.resolved = true;
    const deadline = pr.nextTurn;
    at(c, 10000);
    assert.equal(pr.nextTurn, deadline); assert.equal(c.waves, 0);
}
{
    const c = harness('settle', 'revenge');
    const pr = c.getPressure();
    pr.stage = 2; pr.nextTurn = c.turn + 200;
    c.handlePressureChoice({ name: 'Rival', memory: {} }, { pressureAction: 'ready' });
    assert.equal(pr.nextTurn, c.turn + 30);
    c.getPressure();
    assert.equal(pr.nextTurn, c.turn + 30, 'Explicit readiness must not trigger migration');
}
{
    const c = harness('settle', 'fortune');
    const pr = c.getPressure();
    const npc = { name: 'Collector', memory: {} };
    pr.stage = 2; pr.nextTurn = c.turn + 1;
    c.handlePressureChoice(npc, { pressureAction: 'pay' });
    assert.equal(pr.paid, 100);
    assert.equal(pr.nextTurn, c.turn + 7 * c.day, 'A partial payment buys a week');
    c.handlePressureChoice(npc, { pressureAction: 'time' });
    assert.equal(pr.nextTurn, c.turn + 10 * c.day, 'Asking for time adds three days');
    c.handlePressureChoice(npc, { pressureAction: 'time' });
    assert.equal(pr.nextTurn, c.turn + 10 * c.day, 'Time can only be requested once per visit');
}
{
    const c = harness();
    c.G.player.jobs = { done: 2 };
    c.flags.add('trained-once');
    at(c, c.getPressure().nextTurn);
    assert.equal(c.getPressure().resolved, true, 'Completing the terms still ends pursuit');
    assert.equal(c.G.activeRoom.creatures.length, 0);
}

console.log('Backstory pressure pacing checks passed (calendar, arrivals, waves, migration and readiness).');
