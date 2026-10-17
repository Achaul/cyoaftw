const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const core = fs.readFileSync(process.argv[2] || 'C:/Git/CYOADEV/cyoaftw-engine-CORE.js', 'utf8').replace(/\r\n/g, '\n');
const world = fs.readFileSync(process.argv[3] || 'C:/Git/CYOADEV/cyoaftw-world-data.js', 'utf8').replace(/\r\n/g, '\n');
function section(start, end) {
    const first = core.indexOf(start), last = core.indexOf(end, first);
    assert.ok(first >= 0 && last > first, start);
    return core.slice(first, last);
}
function harness() {
    const c = { window: null, console: { log() {} }, calls: 0, aiAvailable: () => true,
        callAI: () => { c.calls++; throw Error('Origins must not be rewritten'); } };
    c.window = c;
    vm.createContext(c);
    vm.runInContext(world, c);
    vm.runInContext(section('async function polishPlayerBackstory(', '// ── OPENING SCENE (intro card)'), c);
    vm.runInContext(section('async function polishOpeningScene(', 'async function buildOpeningScene('), c);
    c.origins = vm.runInContext('PLAYER_ARCHETYPES', c);
    c.crafts = vm.runInContext('CLASS_CRAFT_QUESTIONS', c);
    return c;
}
const keys = {
    'coming-of-age': ['home', 'reason'], revenge: ['wrong', 'quarry'], redemption: ['sin', 'penance'],
    'missing-kin': ['who', 'lastSeen'], fortune: ['need', 'dream'], exile: ['cause'], calling: ['sign', 'feeling']
};

test('every origin/question/craft combination keeps selected facts in concise, complete prose', () => {
    const c = harness();
    let checked = 0;
    for (const [id, origin] of Object.entries(c.origins)) {
        for (const [cls, craft] of Object.entries(c.crafts)) for (const craftChoice of craft.options) {
            for (const a of origin.questions[0].options) for (const b of origin.questions[1].options) {
                const slots = { ...craftChoice.slot, ...a.slot, ...b.slot };
                const story = c.buildPlayerBackstory({ archetype: id, cls, playerName: 'Ari', slots });
                const lower = story.text.toLowerCase();
                for (const key of ['craft', ...keys[id]]) assert.ok(lower.includes(slots[key].toLowerCase()), id + '/' + key);
                if (id === 'exile' && !/^nobody\b/.test(slots.hunters)) assert.ok(lower.includes(slots.hunters.toLowerCase()));
                assert.doesNotMatch(story.text, /undefined|null|\{[^}]*\}|\. Nobody[^.]*may come looking|grew up in your family's trade|worst day of your life/i);
                assert.ok(story.text.split(/\s+/).length <= 100, id + ' stayed concise');
                assert.ok(story.goal && story.template === story.text);
                assert.equal(story.guide.state, 'pending');
                checked++;
            }
        }
    }
    assert.ok(checked >= 1000, 'Exercised all selected histories and craft combinations: ' + checked);
});

test('Nobody exile choice does not invent pursuers, while named pursuers remain possible', () => {
    const c = harness();
    const origin = c.origins.exile;
    const slots = { craft: 'worked as a guard', ...origin.questions[0].options[0].slot };
    const nobody = origin.build({ ...slots, hunters: 'nobody, as long as you stay careful' }, { craft: slots.craft });
    assert.match(nobody, /hope to stay unnoticed/);
    assert.doesNotMatch(nobody, /may come looking|nobody.*looking/);
    const crown = origin.build({ ...slots, hunters: "the Crown's old magistrates" }, { craft: slots.craft });
    assert.match(crown, /The Crown's old magistrates may come looking/);
});

test('authored and player-written origins are preserved with AI enabled', async () => {
    const c = harness();
    const authored = c.buildPlayerBackstory({ archetype: 'coming-of-age', cls: 'Fighter', playerName: 'Ari',
        slots: { craft: 'trained with a guard', home: "your family's trade", reason: 'you wanted to travel' } });
    assert.equal(await c.polishPlayerBackstory(authored), authored);
    assert.equal(authored.text, authored.template);
    const custom = c.buildPlayerBackstory({ archetype: 'calling', cls: 'Wizard', playerName: 'Ari', slots: {},
        freeform: { background: 'I left a quiet life to search for my brother.', motive: 'Learn why his letters stopped.' } });
    const before = custom.text;
    assert.equal(await c.polishPlayerBackstory(custom), custom);
    assert.equal(custom.text, before);
    assert.equal(custom.goal, 'Learn why his letters stopped.');
    assert.equal(custom.freeform, true);
    assert.equal(c.calls, 0);
});

test('opening keeps start facts and selected history without foretold guide arrival or absolute personality claims', async () => {
    const c = harness();
    for (const zone of ['Town', 'Underground City', 'Dungeon', 'Ruins', 'Swamp']) {
        const ctx = { speciesLabel: 'Human', appearance: { build: 'lean', hairColor: 'black', eyeColor: 'green' },
            trait: 'empathy', backstoryText: 'Your exact selected history.', zone, hubName: 'Known Hub', roomName: 'Known Room',
            tier: 'Hard', kin: true, guideRelation: 'a specific old friend', modeLine: 'Your chosen start pressure.', goal: 'Find a teacher.' };
        const template = c.buildOpeningSceneTemplate(ctx);
        assert.equal(template.split('\n\n').length, 3);
        for (const fact of ['Your exact selected history.', 'Known Room', 'Your chosen start pressure.', 'green eyes', 'black hair']) assert.ok(template.includes(fact));
        assert.doesNotMatch(template, /will find you|never been able|never waited|mist keeps its secrets|as if the war.*weather/);
        assert.ok(template.split(/\s+/).length < 150);
        assert.equal(await c.polishOpeningScene(ctx, template), null);
    }
    assert.equal(c.calls, 0);
});

test('guide motives remain specific and answer-seeking without default dishonesty or evasive riddles', () => {
    const c = harness();
    assert.match(c.origins['missing-kin'].guide.persona, /missing person/);
    assert.match(c.origins.revenge.guide.persona, /lead from proof/);
    assert.match(c.origins.redemption.guide.persona, /without judging/);
    assert.match(c.origins.calling.guide.persona, /Answers questions directly/);
    assert.doesNotMatch(c.origins.fortune.guide.persona, /never.*honest/);
});
