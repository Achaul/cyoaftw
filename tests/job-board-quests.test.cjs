const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const corePath = process.argv[2] || 'C:/Git/CYOADEV/cyoaftw-engine-CORE.js';
const core = fs.readFileSync(corePath, 'utf8');
function extractFunction(name) {
    const start = core.indexOf('function ' + name + '(');
    assert.ok(start >= 0, 'Missing engine function: ' + name);
    const end = core.indexOf('\nfunction ', start + 1);
    return core.slice(start, end < 0 ? undefined : end);
}

function harness() {
    const c = {
        G: { player: {}, activeRoom: {} }, turn: 100, standing: 0,
        rand: values => values[values.length - 1],
        randInt: min => min,
        getPortalTier: () => 0,
        getPortalGoldFactor: tier => Math.pow(2, tier),
        getCurrentStoryTurn: () => c.turn,
        getTownStanding: () => c.standing,
        getActiveJob: () => null,
        getBoardJobPostings: () => [],
        isQuestReady: () => false,
        createCombatButton: (label, action, options) => ({ label, action, options }),
        appendCombatGroup: (el, label, buttons) => c.groups.push({ label, buttons }),
        document: { getElementById: () => ({ innerHTML: '' }) },
        setNarration: text => { c.narration = text; },
        addChatMessage() {}, saveGameState: () => { c.saves++; },
        resetNpcPanel() {}, renderRoom() {},
        groups: [], saves: 0
    };
    vm.createContext(c);
    const constantsStart = core.indexOf('const QUEST_BOARD_SIZE =');
    const constantsEnd = core.indexOf('const JOB_TYPES =', constantsStart);
    vm.runInContext(core.slice(constantsStart, constantsEnd), c);
    const questsStart = core.indexOf('const QUEST_CULL_SPECIES =');
    const questsEnd = core.indexOf('\nfunction countQuestTrophies(', questsStart);
    vm.runInContext(core.slice(questsStart, questsEnd), c);
    for (const name of ['normalizeSpeciesName', 'ensureQuestState', 'renderJobBoard']) {
        vm.runInContext(extractFunction(name), c);
    }
    return c;
}

// Always pick the last candidate: the original code deterministically chooses slime.
{
    const c = harness();
    assert.equal(c.getTrophyRule('slime'), null);
    const pool = c.getQuestPool(0);
    assert.equal(pool.length, 3);
    assert.equal(new Set(pool.map(q => q.species)).size, 3);
    for (const q of pool) assert.equal(q.part, c.getTrophyRule(q.species).part);
    assert.equal(c.getQuestPool(0), pool, 'Repeated views keep the same board');
}

// Exercise the reported accept -> render -> refill chain up to the active quest cap.
{
    const c = harness();
    c.renderJobBoard(c.G.activeRoom);
    for (let i = 0; i < 3; i++) {
        const q = c.getQuestPool(0)[0];
        assert.equal(c.acceptQuest(q.id, null, true), true);
        assert.match(c.narration, /Bounty accepted/);
        const active = c.ensureQuestState().active;
        const pool = c.getQuestPool(0);
        assert.equal(active.length, i + 1);
        assert.equal(pool.length, Math.min(3, 5 - active.length));
        assert.ok(pool.every(posting => !active.some(a => a.species === posting.species)));
    }
    assert.equal(c.saves, 3);
    assert.match(c.getQuestAcceptBlockReason(c.getQuestPool(0)[0]), /already carrying 3/);
}

// Exhaustion returns null, without advancing quest IDs or inventing a trophy.
{
    const c = harness();
    const excluded = ['goblin', 'kobold', 'orc', 'lizardfolk', 'rat'];
    assert.equal(c.makeCullQuest(0, excluded, false), null);
    assert.equal(c.ensureQuestState().seq, 0);
    vm.runInContext("QUEST_CULL_SPECIES.ghost = { name: 'Ghost', count: [1, 2], pay: 10 };", c);
    assert.equal(c.makeCullQuest(0, excluded, false), null, 'Future species also need trophies');
}

// Refresh and veteran rewards still work with fewer eligible species.
{
    const c = harness();
    c.standing = 15;
    const pool = c.getQuestPool(0);
    assert.equal(pool[2].veteran, true);
    const veteran = c.makeCullQuest(2, ['rat', 'kobold', 'orc', 'lizardfolk'], true);
    assert.equal(veteran.species, 'goblin');
    assert.equal(veteran.count, 5);
    assert.equal(veteran.reward.gold, 150);
    c.turn += 200;
    const refreshed = c.getQuestPool(0);
    assert.notEqual(refreshed, pool);
    assert.equal(refreshed.length, 3);
    assert.ok(refreshed.every(q => c.getTrophyRule(q.species)));
}

console.log('Job board quest regression checks passed.');
