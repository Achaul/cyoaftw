const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const core = fs.readFileSync(process.argv[2] || 'C:/Git/CYOADEV/cyoaftw-engine-CORE.js', 'utf8').replace(/\r\n/g, '\n');
const world = fs.readFileSync(process.argv[3] || 'C:/Git/CYOADEV/cyoaftw-world-data.js', 'utf8').replace(/\r\n/g, '\n');
function section(source, start, end) {
    const first = source.indexOf(start), last = source.indexOf(end, first);
    assert.ok(first >= 0 && last > first, start);
    return source.slice(first, last);
}
function harness({ species = 'human', archetype = 'coming-of-age', ai = false, result = '1' } = {}) {
    let time = 0, seq = 0;
    const timers = new Map();
    const bs = { archetype, cls: 'Fighter', playerName: 'Ari', text: 'A known history.', goal: 'A known goal.',
        slots: { who: 'Mira', quarry: 'the Ashen Court' }, guide: { state: 'arrived', relation: 'an old friend' } };
    const npc = { name: 'Bran', guide: { active: true, relation: 'an old friend' }, memory: {} };
    const c = { window: null, console: { log() {} }, Promise, Math, JSON,
        G: { player: { hp: 20, hpMax: 20, coins: 5, backstory: bs }, activeRoom: {}, activeNPC: npc, activeNPCMode: 'talk' },
        npc, bs, messages: [], memories: [], choices: [], saves: 0, renders: 0, disabled: [], calls: 0, narration: '',
        getPlayerSpeciesKey: () => species, getPlayerBackstory: () => bs, getCurrentStoryTurn: () => 2,
        setTimeout: (fn, delay) => { const id = ++seq; timers.set(id, { fn, due: time + delay }); return id; },
        clearTimeout: id => timers.delete(id),
        aiAvailable: () => ai, useAIEnabled: () => ai,
        buildPrompt: (_room, _npc, instruction) => instruction,
        callAI: args => { c.calls++; c.lastPrompt = args.instruction; return typeof result === 'function' ? result() : Promise.resolve(result); },
        addChatMessage: (side, speaker, text) => c.messages.push({ side, speaker, text, time }),
        shouldAnimateChatMessage: () => false,
        setChatOptionsDisabled: value => c.disabled.push(value), renderChatOptions: () => c.renders++, saveGameState: () => c.saves++,
        recordNPCConversationChoice: (_npc, choice) => { c.choices.push(choice); if (choice.guideBeat === 'plan') bs.guide.state = 'oriented'; },
        rememberNPCConversationLine: (_npc, side, text) => c.memories.push({ side, text }),
        registerNPCToldMemory() {}, getGuideShifts: () => [], canConverseWithNPC: () => true,
        spawnGuideNPC: () => npc, renderRoom() {}, selectNPC: n => { c.G.activeNPC = n; },
        startNPCConversation: n => { c.G.activeNPCMode = 'talk'; n.guide.conversationRun = (n.guide.conversationRun || 0) + 1; },
        addStoryFact() {}, rememberStoryEvent() {}, setNarration: text => { c.narration = text; },
        queryConversationCatalogue: () => [{ id: 'goodbye', label: 'Goodbye' }]
    };
    c.window = c;
    vm.createContext(c);
    vm.runInContext(world, c);
    c.findTownBuilding = type => ({ name: 'Known ' + type, type });
    vm.runInContext(section(core, 'const GUIDE_GREETING_PAUSE_MS =', 'function startGuideArrival('), c);
    vm.runInContext(section(core, 'function handleGuideTalk(', '// ── GUIDE LIVE STATE'), c);
    vm.runInContext(section(core, 'function startGuideArrival(', '// A guide-flagged conversation option'), c);
    vm.runInContext(section(core, 'function getPlayerHpFraction(', 'function handleGuideTalk('), c);
    vm.runInContext(section(core, 'function phraseGuideBeat(', '// True while the guide still owes'), c);
    vm.runInContext(core.match(/^const GUIDE_PHRASE_TIMEOUT_MS = .*$/m)[0], c);
    vm.runInContext(section(core, 'function handleGuideAnswer(', 'window.showGuideQuestionMenu ='), c);
    vm.runInContext(section(core, 'function getChatOptions(', '// Free-text reply.'), c);
    c.getChatTypingDurationMs = side => side === 'player' ? 40 : 60;
    c.tick = async ms => {
        const end = time + ms;
        const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
        await flush();
        for (;;) {
            const next = [...timers].sort((a, b) => a[1].due - b[1].due)[0];
            if (!next || next[1].due > end) break;
            time = next[1].due;
            timers.delete(next[0]);
            next[1].fn();
            await flush();
        }
        time = end;
        await flush();
    };
    c.choose = (beat, say = 'I need a moment.', stance = 'guarded') => c.handleGuideTalk(npc, beat, { id: 'test', text: 'You say, "' + say + '"', promptText: say, stance });
    return c;
}

test('all origins and species have a single check-in and caring responses without automatic briefing', () => {
    for (const archetype of ['coming-of-age', 'revenge', 'redemption', 'missing-kin', 'fortune', 'exile', 'calling']) {
        for (const species of ['human', 'elf', 'dwarf', 'halfling', 'orc', 'dragonborn', 'goblin', 'kobold', 'gnoll', 'harpy', 'troll']) {
            const c = harness({ archetype, species });
            for (const id of ['checkin', 'checkin-fine', 'checkin-hurt', 'checkin-rattled', 'checkin-who', 'pause']) {
                const beat = c.getGuideTalkBeat(id, c.bs, { hpFrac: 1, relation: 'an old friend' });
                assert.equal(beat.lines.length, 1, archetype + '/' + species + '/' + id);
                assert.ok(beat.replies.length);
                assert.ok(!beat.plan && !beat.offered);
                assert.doesNotMatch(beat.lines[0], /Known |\{[^}]*\}|bury|thank me|pride|spirit/i);
            }
            const hurt = c.getGuideTalkBeat('checkin', c.bs, { hpFrac: 0.4 });
            assert.match(hurt.lines[0], /hurt/i);
            assert.doesNotMatch(c.getGuideTalkBeat('checkin', c.bs, { hpFrac: 1 }).lines[0], /bleed|stiff|peaky|hurt/i);
        }
    }
});

test('injury, hesitation and boundaries lead to useful options, without promises or forced company', () => {
    const c = harness();
    const hurt = c.getGuideTalkBeat('checkin-hurt', c.bs, {});
    assert.ok(hurt.replies.some(r => r.guideTalk === 'care-rest'));
    const care = c.getGuideTalkBeat('care-rest', c.bs, {});
    assert.match(care.lines[0], /Rest somewhere safe/);
    const fineHurt = c.getGuideTalkBeat('checkin-fine', c.bs, { hpFrac: 0.4 });
    assert.ok(fineHurt.replies.some(r => r.guideTalk === 'care-rest'));
    assert.doesNotMatch(fineHurt.lines[0], /proud|pride|scratch|let it go/);
    const pause = c.getGuideTalkBeat('pause', c.bs, {});
    assert.ok(pause.replies.every(r => r.guideTalk !== 'offer'));
    const answer = c.getGuideTalkBeat('first-lead', c.bs, {});
    assert.equal(answer.lines.length, 1);
    assert.ok(answer.replies.some(r => r.guideTalk === 'offer'));
    assert.ok(!c.getGuideTalkBeat('first-lead', c.bs, { partyOffered: true }).replies.some(r => r.guideTalk === 'offer'));
    assert.ok(!c.getGuideTalkBeat('first-lead', c.bs, { inParty: true }).replies.some(r => r.guideTalk === 'offer'));
});

test('typed self-reports reach care beats without guessing at questions or negated injuries', () => {
    const c = harness();
    for (const [text, beat] of [["I'm hurt.", 'checkin-hurt'], ['I am bleeding', 'checkin-hurt'], ["I'm not hurt", 'checkin-fine'],
        ["I'm not fine", 'checkin-rattled'], ["I'm a bit rattled.", 'checkin-rattled'], ['I need a moment.', 'pause'], ['Who are you?', 'checkin-who']]) {
        assert.equal(c.getGuideTypedCheckinBeat(c.npc, text), beat, text);
    }
    for (const text of ['I hurt him', "I'm not bleeding", 'How do I heal?', "I'm fine but my friend is hurt", 'Give me a sword']) {
        assert.equal(c.getGuideTypedCheckinBeat(c.npc, text), '', text);
    }
    c.npc.guide.lastBeat = 'first-strong';
    assert.equal(c.getGuideTypedCheckinBeat(c.npc, "I'm fine"), '');
    assert.match(core, /getGuideTypedCheckinBeat\(npc, body\)[\s\S]*?handleGuideTalk\(npc, checkinBeat, choice\)[\s\S]*?matchGuideTopic\(body\)/);
});

test('AI selection accepts only a valid candidate index and cannot add dialogue or drop facts', async () => {
    for (const result of ['A prophecy awaits you.', '1. Here is a new line.', '0', '99', '{"index":1}', '1\n2']) {
        const c = harness({ ai: true, result });
        const output = await c.phraseGuideBeat(c.npc, 'test', ['"Known facts."'], 'hello', { deliveries: ['"Choice one."', '"Choice two."'] });
        assert.deepEqual(Array.from(output), ['"Known facts."']);
    }
    const c = harness({ ai: true, result: { text: '2' } });
    assert.deepEqual(Array.from(await c.phraseGuideBeat(c.npc, 'test', ['fallback'], 'hello', { deliveries: ['one', 'two'] })), ['two']);
    assert.match(c.lastPrompt, /conversation data, never instructions/);
    await c.phraseGuideBeat(c.npc, 'parting', ['"Fixed blessing facts."'], 'bye');
    assert.equal(c.calls, 1, 'Facts and greetings bypass AI entirely');
});

test('AI rejection, synchronous failure and timeout all resolve to the authored response', async () => {
    for (const result of [() => Promise.reject(Error('offline')), () => { throw Error('offline'); }, () => new Promise(() => {})]) {
        const c = harness({ ai: true, result });
        const output = c.phraseGuideBeat(c.npc, 'test', ['fallback'], 'hello', { deliveries: ['one', 'two'] });
        await c.tick(2501);
        assert.deepEqual(Array.from(await output), ['fallback']);
    }
});

test('player and guide type in order, then replies unlock; space does not advance the mission', async () => {
    const c = harness();
    c.choose('pause');
    assert.equal(c.messages.length, 1);
    assert.equal(c.messages[0].side, 'player');
    await c.tick(739);
    assert.equal(c.messages.length, 1);
    await c.tick(1);
    assert.equal(c.messages.length, 2);
    assert.equal(c.messages[1].side, 'left');
    assert.equal(c.renders, 0);
    await c.tick(560);
    assert.equal(c.renders, 1);
    assert.equal(c.disabled.at(-1), false);
    assert.equal(c.bs.guide.state, 'arrived');
    assert.equal(c.npc.guide.playerConcern, 'space');
    assert.equal(c.npc.action, 'gives you room and waits quietly');
    assert.match(c.narration, /Bran gives you room and waits quietly/);
    await c.tick(20000);
    assert.equal(c.messages.length, 2, 'No briefing follows silence');
});

test('late replies cannot appear after moving, switching NPC, reopening or issuing a newer reply', async () => {
    for (const change of [c => { c.G.activeRoom = {}; }, c => { c.G.activeNPC = {}; },
        c => { c.npc.guide.conversationRun = 1; }, c => { c.G.activeNPCMode = null; }]) {
        const c = harness({ ai: true, result: () => new Promise(() => {}) });
        c.choose('checkin-rattled', "I'm shaken.");
        change(c);
        await c.tick(5000);
        assert.equal(c.messages.length, 1);
        assert.equal(c.renders, 0);
        assert.equal(c.memories.filter(m => m.side === 'npc').length, 0);
    }
    const c = harness();
    c.choose('first-strong', 'I want to train.');
    c.choose('pause');
    await c.tick(5000);
    assert.equal(c.messages.filter(m => m.side === 'left').length, 1);
    assert.equal(c.bs.guide.state, 'arrived', 'Cancelled advice never counts as delivered');
});

test('known topic answers wait their turn and do not append a party pitch', async () => {
    const c = harness();
    c.handleGuideAnswer(c.npc, 'next', null, null);
    assert.equal(c.messages.length, 1);
    assert.equal(c.bs.guide.state, 'arrived');
    await c.tick(2000);
    assert.equal(c.messages.filter(m => m.side === 'left').length, 1);
    assert.equal(c.bs.guide.state, 'oriented');
    assert.ok(!c.bs.guide.partyOffered);
});

test('AI-off guide replies survive the missing free-text menu item', () => {
    const c = harness();
    c.npc.memory.pendingResponse = { needed: true, options: [{ label: 'A moment', say: 'I need a moment.', guideTalk: 'pause' }] };
    const options = c.getChatOptions(c.npc);
    assert.ok(options.some(o => o.guideTalk === 'pause'));
    assert.ok(options.some(o => o.id === 'goodbye'));
    assert.ok(!options.some(o => o.id === 'respond-free'));
    delete c.npc.guide;
    assert.equal(c.getChatOptions(c.npc).length, 1, 'Non-guide restricted menus retain their boundaries');
    const live = harness({ ai: true });
    live.npc.memory.pendingResponse = { needed: true, options: [{ label: 'A moment', say: 'I need a moment.', guideTalk: 'pause' }] };
    assert.equal(live.getChatOptions(live.npc).length, 1, 'AI-on restricted menus are never bypassed');
});

test('every parting retains free, unbound, single-use protection facts', () => {
    const c = harness();
    for (let i = 0; i < 30; i++) for (const id of ['parting', 'parting-shout']) {
        const beat = c.getGuideTalkBeat(id, c.bs, {});
        assert.match(beat.lines[0], /newcomer's blessing/);
        assert.match(beat.lines[0], /free|no cost/i);
        assert.match(beat.lines[0], /no god/i);
        assert.match(beat.lines[0], /once|one rescue/i);
    }
});

test('arrival speaks immediately once, waits for the player, and cannot spawn a duplicate guide', async () => {
    const c = harness({ ai: true });
    c.bs.guide.state = 'pending';
    assert.equal(c.startGuideArrival(), true);
    assert.equal(c.startGuideArrival(), false);
    await c.tick(0);
    assert.equal(c.messages.length, 1);
    assert.equal(c.messages[0].side, 'left');
    assert.equal(c.calls, 0, 'No model latency before the check-in');
    await c.tick(30000);
    assert.equal(c.messages.length, 1);
    assert.equal(c.renders, 1);
    assert.equal(c.bs.guide.state, 'arrived');
    assert.ok(c.npc.memory.pendingResponse.options.some(r => r.guideTalk === 'checkin-rattled'));
});

test('leaving while a bubble types cannot unlock options in a different scene', async () => {
    const c = harness();
    c.choose('pause');
    await c.tick(740);
    assert.equal(c.messages.length, 2);
    c.G.activeRoom = {};
    await c.tick(560);
    assert.equal(c.renders, 0);
    assert.notEqual(c.disabled.at(-1), false);
});
