const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const core = fs.readFileSync(process.argv[2] || 'C:/Git/CYOADEV/cyoaftw-engine-CORE.js', 'utf8').replace(/\r\n/g, '\n');
const data = fs.readFileSync('C:/Git/CYOADEV/cyoaftw-npc-data.js', 'utf8');
function section(start, end) {
    const a = core.indexOf(start), b = core.indexOf(end, a);
    assert.ok(a >= 0 && b > a, start);
    return core.slice(a, b);
}
function harness(distance = 3) {
    let time = 0, seq = 0;
    const timers = new Map(), events = [], messages = [], memories = [];
    const narration = { textContent: '' };
    const npc = { id: 'guide', name: 'Bran', givenName: 'Bran', species: 'human', isHumanoid: true, role: 'Traveller', hp: 10, memory: { metPlayer: true, everGreeted: true }, personality: {} };
    const rooms = Array.from({ length: distance + 1 }, (_, i) => ({ coords: i + ',0', displayName: 'Room ' + i, zone: 'Town', type: 'street', creatures: i ? [] : [npc], items: [], exits: {} }));
    const c = {
        console: { log() {}, warn() {} }, window: null, Date, Math, Promise,
        G: { player: { hp: 20, hpMax: 20, stamina: 10, staminaMax: 10, inventory: [], moveSeq: 0, species: 'human' }, activeRoom: rooms[0], sessionFollowers: [], story: { turnCounter: 0 }, partyMembers: [] },
        document: { getElementById: id => id === 'narrationEl' ? narration : null, addEventListener() {} },
        dispatchEvent: event => events.push(event.detail), CustomEvent: function (name, options) { this.detail = options.detail; },
        setTimeout(fn, delay) { const id = ++seq; timers.set(id, { fn, due: time + delay }); return id; }, clearTimeout: id => timers.delete(id),
        canConverseWithNPC: n => n.hp > 0 && !n.dead && !n.unconscious,
        isAwakeHumanoidNPC: n => n.hp > 0 && !n.dead && !n.unconscious,
        addSessionFollower(n) { c.G.sessionFollowers.push(n); }, removeSessionFollower(n) { c.G.sessionFollowers = c.G.sessionFollowers.filter(x => x !== n); },
        getCurrentStoryTurn: () => c.G.story.turnCounter,
        findRoomRoute(room) { if (c.noRoute) return null; return rooms.slice(rooms.indexOf(room) + 1).map(() => ({ dir: 'E' })); },
        DIRECTION_WORDS: { E: 'east' },
        movePlayer() {
            if (c.blockMove) return;
            const old = c.G.activeRoom, next = rooms[rooms.indexOf(old) + 1];
            old.creatures = old.creatures.filter(n => n !== npc); next.creatures.push(npc);
            c.G.activeRoom = next; c.G.player.moveSeq++; c.G.story.turnCounter++;
            narration.textContent = 'You enter ' + next.displayName + '. Room details stay visible.';
            if (c.onMove) c.onMove();
        },
        renderInteractSidePanels() {}, renderRoom() { narration.textContent = 'Room details.'; }, queueTurnNote() {},
        appendNarrationBreak(el) { el.textContent += '\n'; }, appendNarrationText(el, text) { el.textContent += text; },
        applyNPCImpact(n, impact) { c.impacts.push(impact); n.memory.metPlayer = true; }, impacts: [],
        selectNPC(n) { c.selections++; c.G.activeNPC = n; c.G.activeNPCMode = 'menu'; c.resetNPCConversationSession(n); messages.length = 0; }, selections: 0,
        renderChatOptions(n, options) { c.options = options || c.getChatOptions(n); },
        getNPCBoundNote: () => '', syncCombatLayout() {}, takeTurnNotes: () => '', saveGameState() { c.saves++; }, saves: 0,
        addChatMessage(side, speaker, text, options) { messages.push({ side, speaker, text, options }); c.publishTextModeOutput('dialogue', text, { side, speaker, source: 'engine' }, false); },
        rememberNPCConversationLine(n, side, text) { memories.push({ n, side, text }); },
        useAIEnabled: () => false, aiAvailable: () => false,
        isVisibleEntity: n => !n.hidden && !n.dead, getNPCRoomSightName: n => n.name,
        isPlayerJailed: () => false, roomHasActiveHostile: () => false,
        hasPendingPartyLoot: () => c.pendingLoot || false,
        submitTypedResponse(n, text) { c.spoken = { n, text }; },
        chooseChatOption(option) { c.chosen = option; },
        INTERACT_MENU_ACTIONS: []
    };
    c.window = c;
    vm.createContext(c);
    vm.runInContext(data, c);
    c.pickNPCLoreFact = () => null; // World lore selection is outside this travel harness.
    // Use the real command parser, output publisher and conversation catalogue.
    vm.runInContext(section('// Text commands are a presentation/input layer.', '// END TEXT COMMANDS'), c);
    vm.runInContext('textModeState.enabled = true; textModeState.sessionPlayer = G.player;', c);
    vm.runInContext(section('function getChatOptions(', '// Free-text reply.'), c);
    vm.runInContext(section('function startNPCConversation(', 'function tradeWithNPC('), c);
    vm.runInContext(section('function setNarration(text)', '// Same as setNarration'), c);
    vm.runInContext(core.match(/^const GUIDE_KEEP_DELAY_MS = .*$/m)[0], c);
    const start = core.includes('let guideWalkSequence =') ? 'let guideWalkSequence =' : 'function startGuiding(';
    vm.runInContext(section(start, '// Buttons for the left interact column'), c);
    c.startGuiding(npc, { key: rooms[distance].coords, name: 'the guildhall', buildingId: 'guild' });
    function tick(ms) {
        const end = time + ms;
        for (;;) {
            const next = [...timers].sort((a, b) => a[1].due - b[1].due)[0];
            if (!next || next[1].due > end) break;
            time = next[1].due; timers.delete(next[0]); next[1].fn();
        }
        time = end;
    }
    return { c, npc, rooms, events, messages, memories, narration, tick };
}

test('guide travel appends central narration and publishes it once without a chat bubble', () => {
    const { c, narration, events, messages } = harness();
    assert.equal(c.followGuideStep(), 'moved');
    assert.match(narration.textContent, /Room 1.*Room details stay visible\.[\s\S]*Bran leads the way east\./);
    assert.equal(messages.length, 0);
    assert.equal(events.filter(e => e.kind === 'narration' && /leads the way east/.test(e.text)).length, 1);
    assert.equal(c.G.story.turnCounter, 1);
});

test('continuous following leaves three seconds between rooms and arrives in one open conversation', () => {
    const { c, npc, rooms, tick, messages, memories, narration } = harness();
    c.startKeepFollowing();
    assert.equal(c.G.activeRoom, rooms[1]);
    tick(2999); assert.equal(c.G.activeRoom, rooms[1]);
    tick(1); assert.equal(c.G.activeRoom, rooms[2]);
    tick(3000); assert.equal(c.G.activeRoom, rooms[3]);
    assert.equal(c.G.guiding, null);
    assert.equal(c.G.activeNPC, npc); assert.equal(c.G.activeNPCMode, 'talk');
    assert.equal(c.selections, 1);
    assert.equal(messages.filter(m => /Here we are/.test(m.text)).length, 1);
    assert.ok(memories.some(m => m.n === npc && /Here we are.*guildhall/.test(m.text)));
    assert.match(narration.textContent, /leads you east and stops/);
    assert.ok(c.options.some(o => /^ask-/.test(o.id)), 'The real catalogue must offer questions beyond greeting: ' + c.options.map(o => o.id).join(', '));
    assert.ok(!c.options.some(o => o.id === 'greet-intro' || o.id === 'greet-known'));
    assert.equal(c.G.story.turnCounter, 3, 'Conversation setup must not charge a greeting turn');
    assert.equal(c.impacts.filter(x => x.actionTag === 'led-player').length, 1);
    assert.equal(c.G.sessionFollowers.includes(npc), false);
    tick(20000); assert.equal(c.selections, 1);
});

test('manual arrival also unlocks normal typed questions, thanks and numbered conversation choices', async () => {
    const { c, npc } = harness(1);
    assert.equal(c.followGuideStep(), 'arrived');
    assert.equal((await c.executeTextCommand(c.parseTextCommand('options'))).status, 'completed');
    assert.equal((await c.executeTextCommand(c.parseTextCommand('choose 1'))).status, 'completed');
    assert.ok(c.chosen);
    // Free speech has the existing AI availability rules; enable it for the adapter check.
    c.useAIEnabled = () => true; c.aiAvailable = () => true;
    assert.equal((await c.executeTextCommand(c.parseTextCommand('say "Thank you for showing me the way."'))).status, 'completed');
    assert.equal(c.spoken.n, npc); assert.match(c.spoken.text, /Thank you/);
});

test('stop then restart cannot let the old timer accelerate the new walk', () => {
    const { c, rooms, tick } = harness(5);
    c.startKeepFollowing(); tick(1000); c.stopKeepFollowing();
    tick(1000); c.startKeepFollowing(); assert.equal(c.G.activeRoom, rooms[2]);
    tick(1000); assert.equal(c.G.activeRoom, rooms[2], 'Old callback at 3000ms is stale');
    tick(1999); assert.equal(c.G.activeRoom, rooms[2]);
    tick(1); assert.equal(c.G.activeRoom, rooms[3]);
});

test('old callbacks cannot move a replacement guide or a changed player/room', () => {
    for (const change of [
        ({ c, rooms }) => { c.G.activeRoom = rooms[0]; },
        ({ c }) => { c.G.player = { ...c.G.player }; },
        ({ c }) => { c.G.player.moveSeq++; },
        ({ c, npc }) => { c.startGuiding(npc, { key: '3,0', name: 'another place' }); }
    ]) {
        const h = harness(); h.c.startKeepFollowing(); change(h);
        const room = h.c.G.activeRoom;
        h.tick(10000); assert.equal(h.c.G.activeRoom, room);
    }
});

test('combat and pending decisions halt walking and cannot be replaced by an arrival chat', () => {
    for (const interrupt of [
        c => { c.G.activeNPCMode = 'combat'; },
        c => { c.G.player.unconscious = true; },
        c => { c.pendingLoot = true; },
        c => { c.G.activeObject = {}; },
        c => { c.G.activeItemModal = {}; },
        c => { c.G.activeNPC = { name: 'Someone else' }; }
    ]) {
        const { c, rooms, tick, messages } = harness(1);
        c.onMove = () => interrupt(c);
        c.startKeepFollowing();
        assert.equal(c.G.activeRoom, rooms[1]);
        assert.equal(c.selections, 0); assert.ok(!messages.some(m => /Here we are/.test(m.text)));
        tick(20000); assert.equal(c.selections, 0);
    }
});

test('lost or unconscious guides, blocked moves and closed routes never complete arrival', () => {
    for (const setup of [
        ({ c }) => { c.blockMove = true; },
        ({ c }) => { c.noRoute = true; },
        ({ c, npc }) => { c.onMove = () => { npc.unconscious = true; }; },
        ({ c }) => { c.onMove = () => { c.G.activeRoom.creatures = []; }; }
    ]) {
        const h = harness(1); setup(h);
        assert.equal(h.c.followGuideStep(), 'blocked'); assert.equal(h.c.selections, 0);
        assert.equal(h.c.impacts.length, 0);
    }
});

test('arrival already at the destination is safe and keeps party membership', () => {
    const { c, npc, rooms } = harness(0);
    npc._inParty = true; c.G.partyMembers.push(npc);
    assert.equal(c.followGuideStep(), 'arrived');
    assert.equal(c.G.activeRoom, rooms[0]); assert.equal(c.G.activeNPCMode, 'talk');
    assert.equal(c.G.partyMembers[0], npc); assert.equal(c.G.story.turnCounter, 0);
    assert.equal(c.followGuideStep(), 'blocked'); assert.equal(c.selections, 1);
});
