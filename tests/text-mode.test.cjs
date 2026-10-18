const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(process.argv[2] || 'C:/Git/CYOAFTW/.text-mode/cyoaftw-engine-CORE.js', 'utf8');
const start = source.indexOf('// Text commands are a presentation/input layer.');
const end = source.indexOf('// END TEXT COMMANDS', start);
assert(start >= 0 && end > start);
const code = source.slice(start, end);
const plain = value => JSON.parse(JSON.stringify(value));
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
function element() {
    const classes = new Set();
    return {
        children: [], dataset: {}, style: {}, value: '', textContent: '', hidden: false, listeners: {}, focused: false,
        classList: { toggle(name, on) { on ? classes.add(name) : classes.delete(name); }, contains: name => classes.has(name) },
        appendChild(child) { this.children.push(child); }, removeChild(child) { this.children.splice(this.children.indexOf(child), 1); },
        get firstChild() { return this.children[0]; },
        addEventListener(name, fn) { this.listeners[name] = fn; }, focus() { this.focused = true; }
    };
}
function harness() {
    const els = Object.fromEntries(['gameWrapper', 'textModeEl', 'textModeLogEl', 'textModeFormEl', 'textModeInputEl', 'textModeStatusEl', 'textModeStopBtn', 'textModeToggleBtn'].map(id => [id, element()]));
    const dwarf = { id: 'd1', name: 'a dwarf', species: 'dwarf', gender: 'male', memory: {} };
    const female = { id: 'd2', name: 'a dwarf woman', species: 'dwarf', gender: 'female', memory: {}, givenName: 'Secret Name' };
    const elf = { id: 'e1', name: 'an elf', species: 'elf', gender: 'female', memory: {} };
    const room = { coords: '0,0', exits: { N: '0,1', E: '1,0' }, creatures: [dwarf, elf, female] };
    const next = { coords: '0,1', exits: { S: '0,0' }, creatures: [] };
    const calls = [], events = [];
    const c = {
        console, setTimeout, clearTimeout, els, calls, events, room, next, dwarf, female, elf,
        G: { player: { coords: '0,0', hp: 20, hpMax: 30, stamina: 4, staminaMax: 10, coins: 6 }, activeRoom: room, activeNPC: null, activeNPCMode: null },
        window: { dispatchEvent(event) { events.push(event.detail); } }, CustomEvent: function (name, options) { this.name = name; this.detail = options.detail; },
        document: { getElementById: id => els[id] || null, createElement: element, addEventListener() {} },
        aiAvailable: () => false, callAI: async () => null,
        isVisibleEntity: npc => !npc.hidden && !npc.unconscious,
        getNPCRoomSightName: npc => npc.name,
        canConverseWithNPC: npc => !npc.dead && !npc.unconscious,
        getCoinValue: p => p.coins,
        getGlanceAvailableDirections: current => Object.keys(current.exits),
        isExitLocked: (current, dir) => current.locked === dir,
        isExitCollapsed: (current, dir) => current.collapsed === dir,
        movePlayer(dir) { calls.push(['move', dir]); if (!c.blockMove) { c.G.activeRoom = next; c.G.player.coords = next.coords; } },
        performGlance(dir) { calls.push(['glance', dir]); },
        examineCurrentRoom() { calls.push(['look', c.G.activeRoom.coords]); },
        selectNPC(npc) { calls.push(['select', npc.id]); c.G.activeNPC = npc; c.G.activeNPCMode = 'menu'; },
        chooseNPCAction(action) { calls.push([action]); c.G.activeNPCMode = 'talk'; },
        submitTypedResponse(npc, text) { calls.push(['say', npc.id, text]); },
        disengageFromNPC() { calls.push(['leave']); c.G.activeNPC = null; c.G.activeNPCMode = null; },
        setExitGridVisible(visible) { c.exitVisible = visible; },
        getChatOptions: () => [{ id: 'greet', label: 'Hello' }, { id: 'name', label: 'Ask their name' }],
        chooseChatOption(option) { calls.push(['choose', option.id]); }
    };
    c.INTERACT_MENU_ACTIONS = ['rest', 'sleep', 'glance'].map(id => ({ id, visible: () => id !== 'sleep' || c.bed, disabledReason: () => c.reason || '', run() { calls.push([id]); } }));
    c.isPlayerJailed = () => false; c.roomHasActiveHostile = () => false;
    c.isRoomCollapsed = () => false; c.hasPendingPartyLoot = () => false;
    vm.createContext(c);
    vm.runInContext(code, c);
    c.state = vm.runInContext('textModeState', c);
    c.setTextMode(true);
    return c;
}

test('local commands, natural help, and quoted dialogue parse without splitting speech', () => {
    const c = harness();
    for (const text of ['how talk', 'how do I talk?', 'how can I talk', 'help talk']) assert.equal(c.parseTextCommand(text).args.topic, 'talk');
    assert.deepEqual(plain(c.parseTextCommandBatch('look, go north then talk to second dwarf; say "Hello, go south and find the guard!"').actions), [
        { verb: 'look', args: {} }, { verb: 'move', args: { direction: 'north' } },
        { verb: 'talk', args: { target: 'second dwarf' } }, { verb: 'say', args: { text: 'Hello, go south and find the guard!' } }
    ]);
    assert.equal(c.parseTextCommandBatch("say 'I need food and water'").actions.length, 1);
    assert.equal(c.parseTextCommandBatch("say 'I'm hungry and thirsty'").actions[0].args.text, "I'm hungry and thirsty");
    assert.equal(c.parseTextCommandBatch('say Hello!').actions[0].args.text, 'Hello!');
    assert(c.parseTextCommandBatch('say "unfinished').error);
    assert(c.parseTextCommandBatch('look then stop').error);
    assert(c.parseTextCommandBatch(Array(14).fill('look').join(';')).error);
});

test('targeting handles species-relative ordinals and gender without leaking hidden names or targets', () => {
    const c = harness();
    assert.equal(c.resolveTextNPCTarget('second dwarf').matches[0], c.female);
    assert.equal(c.resolveTextNPCTarget('dwarf female').matches[0], c.female);
    assert.equal(c.resolveTextNPCTarget('female dwarf').matches[0], c.female);
    assert.equal(c.resolveTextNPCTarget('Secret Name').matches.length, 0);
    assert.equal(c.resolveTextNPCTarget('0 dwarf').matches.length, 0);
    assert.equal(c.resolveTextNPCTarget('third dwarf').matches.length, 0);
    c.female.hidden = true;
    assert.equal(c.resolveTextNPCTarget('second dwarf').matches.length, 0);
});

test('ambiguity waits, validates numbers, and resumes with the same NPC reference', async () => {
    const c = harness();
    await c.submitTextModeCommand('talk to dwarf then say "Hello"');
    assert.equal(c.calls.length, 0);
    assert.equal(c.state.pending.options[1], c.female);
    await c.submitTextModeCommand('9');
    assert(c.state.pending);
    // Reordering after the question must not change which NPC the number chose.
    c.room.creatures.reverse();
    await c.submitTextModeCommand('2');
    assert.deepEqual(c.calls, [['select', 'd2'], ['talk'], ['say', 'd2', 'Hello']]);
    assert.equal(c.state.pending, null);
});

test('clarification cannot retarget a departed NPC or survive a changed room', async () => {
    const c = harness();
    await c.submitTextModeCommand('talk to dwarf');
    c.room.creatures = [c.dwarf];
    await c.submitTextModeCommand('2');
    assert.equal(c.calls.length, 0);
    assert(c.state.paused);
    c.room.creatures = [c.dwarf, c.female];
    await c.submitTextModeCommand('talk');
    c.G.activeRoom = c.next;
    await c.submitTextModeCommand('1');
    assert.equal(c.calls.length, 0);
});

test('directions prompt, then execute in order against the room reached by movement', async () => {
    const c = harness();
    await c.submitTextModeCommand('glance then north then look');
    assert.equal(c.calls.length, 0);
    await c.submitTextModeCommand('E');
    assert.deepEqual(c.calls, [['glance', 'E'], ['move', 'N'], ['look', '0,1']]);
});

test('failed or locked movement pauses remaining actions and requires explicit continue', async () => {
    const c = harness();
    c.blockMove = true;
    await c.submitTextModeCommand('north then look');
    assert.deepEqual(c.calls, [['move', 'N']]);
    assert.equal(c.state.queue.length, 1);
    assert(c.state.paused);
    await c.submitTextModeCommand('continue');
    assert.deepEqual(c.calls, [['move', 'N'], ['look', '0,0']]);
    c.calls.length = 0;
    c.room.locked = 'N';
    await c.submitTextModeCommand('north then look');
    assert.equal(c.calls.length, 0);
    await c.submitTextModeCommand('stop');
    assert.equal(c.state.queue.length, 0);
});

test('room actions use registry availability and block while talking or fighting', async () => {
    const c = harness();
    await c.submitTextModeCommand('rest');
    assert.deepEqual(c.calls, [['rest']]);
    await c.submitTextModeCommand('sleep');
    assert.equal(c.calls.length, 1);
    c.reason = 'Too dangerous';
    await c.submitTextModeCommand('rest');
    assert.equal(c.calls.length, 1);
    c.G.activeNPC = c.dwarf; c.G.activeNPCMode = 'talk';
    await c.submitTextModeCommand('look');
    assert.equal(c.calls.length, 1);
    c.G.activeNPCMode = 'combat';
    await c.submitTextModeCommand('leave then north');
    assert.equal(c.calls.length, 1);
    assert(c.state.paused);
});

test('foreground promises finish before the next action, and stop cancels only pending work', async () => {
    const c = harness(), reply = deferred();
    c.G.activeNPC = c.dwarf; c.G.activeNPCMode = 'talk';
    c.submitTypedResponse = () => { c.calls.push(['say']); return reply.promise; };
    const run = c.submitTextModeCommand('say "hello" then leave then north');
    await Promise.resolve();
    assert.deepEqual(c.calls, [['say']]);
    await c.submitTextModeCommand('stop');
    await c.submitTextModeCommand('north');
    assert.equal(c.calls.length, 1);
    reply.resolve();
    await run;
    assert.deepEqual(c.calls, [['say']]);
    assert.equal(c.state.busy, false);
});

test('callback-based guide work waits on explicit dialogue completion', async () => {
    const c = harness();
    c.G.activeNPC = c.dwarf; c.G.activeNPCMode = 'talk';
    c.submitTypedResponse = () => { c.calls.push(['guide']); c.textModeDialogueBusy(true); };
    const run = c.submitTextModeCommand('say "hello" then leave');
    await Promise.resolve(); await Promise.resolve();
    assert.deepEqual(c.calls, [['guide']]);
    c.textModeDialogueBusy(false);
    await run;
    assert.deepEqual(c.calls, [['guide'], ['leave']]);
});

test('combat or a required NPC answer stops further queued actions', async () => {
    const c = harness();
    c.movePlayer = () => { c.calls.push(['move']); c.G.player.coords = '0,1'; c.G.activeNPC = c.dwarf; c.G.activeNPCMode = 'combat'; };
    await c.submitTextModeCommand('north then look');
    assert.deepEqual(c.calls, [['move']]);
    assert(c.state.paused);
    c.G.activeNPCMode = 'talk';
    c.submitTypedResponse = () => { c.calls.push(['say']); c.dwarf.memory.pendingResponse = { needed: true }; };
    c.calls.length = 0;
    await c.submitTextModeCommand('say "hello" then leave');
    assert.deepEqual(c.calls, [['say']]);
    assert(c.state.paused);
});

test('AI fallback interprets the whole batch and cannot execute unknown or malformed actions', async () => {
    const c = harness();
    await c.submitTextModeCommand('look then do something unsupported');
    assert.equal(c.calls.length, 0);
    c.aiAvailable = () => true;
    c.callAI = async options => { c.prompt = options.instruction; return '{"actions":[{"verb":"look","args":{}},{"verb":"move","args":{"direction":"north"}}]}'; };
    await c.submitTextModeCommand('please check this place out and head northward');
    assert.deepEqual(c.calls, [['look', '0,0'], ['move', 'N']]);
    assert(c.prompt.length < 800, 'Parsing prompt length: ' + c.prompt.length);
    for (const plan of [
        { actions: [{ verb: 'eval', args: { text: 'anything' } }] },
        { actions: [{ verb: 'look', args: { coins: '999' } }] },
        { actions: [{ verb: 'move', args: { direction: 'teleport' } }] },
        { actions: [{ verb: '__proto__', args: {} }] },
        { actions: [{ verb: 'say', args: { text: 33 } }] }
    ]) assert.equal(c.validateTextAIPlan(plan), null);
});

test('stop or a scene change discards slow AI plans', async () => {
    for (const change of ['stop', 'room']) {
        const c = harness(), ai = deferred();
        c.aiAvailable = () => true; c.callAI = () => ai.promise;
        const run = c.submitTextModeCommand('please inspect this place');
        if (change === 'stop') await c.submitTextModeCommand('stop');
        else c.G.activeRoom = c.next;
        ai.resolve('{"actions":[{"verb":"look","args":{}}]}');
        await run;
        assert.equal(c.calls.length, 0);
    }
});

test('contextual help and status are semantic output without changing the world', async () => {
    const c = harness();
    await c.submitTextModeCommand('how do I talk');
    assert(c.events.at(-1).text.includes('dwarf female'));
    await c.submitTextModeCommand('status');
    assert(c.events.at(-1).text.includes('Health: 20/30'));
    assert.equal(c.events.at(-1).kind, 'feedback');
    assert.equal(c.calls.length, 0);
    const beforeCombat = c.events.length;
    c.G.activeNPCMode = 'combat'; c.G.activeNPC = c.dwarf;
    await c.submitTextModeCommand('status');
    assert(c.events.slice(beforeCombat).some(e => e.text.includes('Health: 20/30')));
    assert.equal(c.calls.length, 0);
});

test('conversation choices are numbered, checked again, and never selected from a stale scene', async () => {
    const c = harness();
    c.G.activeNPC = c.dwarf; c.G.activeNPCMode = 'talk';
    await c.submitTextModeCommand('options then choose 2');
    assert.deepEqual(c.calls, [['choose', 'name']]);
    await c.submitTextModeCommand('options');
    c.getChatOptions = () => [{ id: 'greet', label: 'Hello' }];
    await c.submitTextModeCommand('choose 2');
    assert.equal(c.calls.length, 1);
    c.G.activeNPC = c.female;
    await c.submitTextModeCommand('choose 1');
    assert.equal(c.calls.length, 1);
});

test('form uses a single submit route, focuses input, preserves busy drafts and returns to current view', async () => {
    const c = harness();
    assert(c.els.textModeInputEl.focused);
    assert(c.els.gameWrapper.classList.contains('text-mode-active'));
    assert.equal(c.els.textModeEl.hidden, false);
    c.els.textModeInputEl.value = 'how';
    c.els.textModeFormEl.listeners.submit({ preventDefault() {} });
    assert.equal(c.els.textModeInputEl.value, '');
    c.state.busy = true;
    c.els.textModeInputEl.value = 'north';
    c.els.textModeFormEl.listeners.submit({ preventDefault() {} });
    assert.equal(c.els.textModeInputEl.value, 'north');
    c.state.busy = false;
    c.G.activeNPC = c.dwarf;
    c.setTextMode(false);
    assert.equal(c.exitVisible, false);
    assert(c.els.textModeEl.hidden);
    assert.equal(c.state.queue.length, 0);
});

test('submenus pause even when their legacy handler keeps the talk mode', async () => {
    const c = harness();
    c.G.activeNPC = c.dwarf; c.G.activeNPCMode = 'talk';
    c.getChatOptions = () => [{ id: 'directions', label: 'Ask for directions', action: 'directions' }];
    await c.submitTextModeCommand('options then choose 1 then leave');
    assert.deepEqual(c.calls, [['choose', 'directions']]);
    assert(c.state.paused);
    assert.equal(c.state.queue.length, 1);
});

test('loading another player clears session commands and restores the normal view', () => {
    const c = harness();
    c.state.queue.push({ verb: 'look', args: {} });
    c.G.player = { ...c.G.player };
    c.syncTextModeView();
    assert.equal(c.state.enabled, false);
    assert.equal(c.state.queue.length, 0);
    assert.equal(c.els.textModeEl.hidden, true);
});
