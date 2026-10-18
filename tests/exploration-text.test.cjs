const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(process.argv[2] || 'C:/Git/CYOAFTW/.exploration-text/cyoaftw-engine-CORE.js', 'utf8').replace(/\r\n/g, '\n');
const section = (a, b) => source.slice(source.indexOf(a), source.indexOf(b, source.indexOf(a)));
const code = section('// Text commands are a presentation/input layer.', '// END TEXT COMMANDS');
const plain = value => JSON.parse(JSON.stringify(value));
function harness() {
    const player = { hp: 20, stamina: 20, inventory: [], equipped: {}, coords: '0,0' };
    const room = { structural: [], creatures: [], items: [], exits: {}, coords: '0,0' };
    const c = { console, setTimeout, clearTimeout, room, player, calls: [], events: [], turns: 0, fillable: [], fee: 10, tier: 0,
        G: { player, activeRoom: room, activeNPC: null, activeNPCMode: null },
        document: { getElementById: () => null }, window: { dispatchEvent(event) { c.events.push(event.detail); } }, CustomEvent: function (_name, options) { this.detail = options.detail; },
        getVisibleRoomFixtures: r => r.structural.filter(f => !f.concealed || f.revealed), getEntityName: f => f.name, getItemName: f => f.name,
        textInventoryItemName: f => f.name, getItemQuantity: () => 1,
        isRoomCollapsed: () => !!c.collapsed, roomHasActiveHostile: () => !!c.hostile, hasPendingPartyLoot: () => false,
        getBoardFixtureDescription: () => '',
        isAlchemyTableFixture: f => f.kind === 'alchemy',
        FIXTURE_ORE_SOURCES: { rubble: 1 }, MINING_SOURCES: { vein: { charges: 2 } }, MINING_ENABLED: true,
        FORAGE_STAMINA_COST: 2, PROSPECT_STAMINA_COST: 1, MINING_STAMINA_COST: 4, OFFERING_COST_COINS: 1,
        isForageFixture: f => f.kind === 'herb', isReadableFixture: f => f.kind === 'text', isDrinkableFixture: f => f.kind === 'water', isFoulWaterFixture: f => f.kind === 'foul',
        isCauldronFixture: f => f.kind === 'cauldron', isWarmthFixture: f => f.kind === 'heat', isWashableRoomObject: f => f.kind === 'water', isTrapFixture: f => f.kind === 'trap',
        getFixtureDeityId: f => f.kind === 'altar' ? 'guardian' : null, isPortalFixture: f => f.kind === 'portal', isTownReturnWaygate: f => !!f.returning,
        isContainerFixture: f => f.kind === 'chest', getFixtureMovementOptions: f => f.routes || [], getFixtureMovementBlockReason: () => '',
        isExitLocked: () => false, isExitCollapsed: () => false, getFillableEmptyEntries: () => c.fillable,
        getTownPortalCost: () => c.fee, getHighestPortalTier: () => c.tier, describeTownPortalNextTier: () => 'Stronger foes ahead.', describePortalTownStrength: () => 'Earlier town.',
        getTownPortalBlockReason: () => c.portalBlocked || '', getTownReturnBlockReason: () => '',
        getSearchBlockReason: () => '', ensureEntityStamina() {}, getCoinValue: () => 100,
        performRoomSearch(key) { c.calls.push(['search', key]); c.turns++; player.stamina -= key === 'tight' ? 2 : key === 'force' ? 3 : 1; },
        INTERACT_MENU_ACTIONS: [], aiAvailable: () => false,
        resolveTextInventoryItems: () => [],
        renderStats() {}, saveGameState() {}, resetNpcPanel() {}, rememberStoryEvent() {},
        setNarration(text) { c.publishTextModeOutput('narration', text, {}, false); },
        renderNarrationWithRoomObservations(_r, text) { c.setNarration(text); },
        getConcealedRoomFixtures: r => r.structural.filter(f => f.concealed),
        ensureRoomFixtureState() {}, spendEntityStamina(p, amount) { p.stamina -= amount; },
        advanceStoryTurn(amount) { c.turns += amount; if (c.tick) c.tick(); },
        rollStatCheck: () => ({ total: 20, roll: 20, bonus: 0, success: true, critSuccess: true }),
        trackCombatSkillGain: () => ({}), formatSkillGainDebug: () => '', joinFixtureNames: list => list.map(f => f.name).join(', '),
        SEARCH_APPROACHES: [{ key: 'careful', stat: 'willpower', staminaCost: 1, foundText: 'You find' }, { key: 'tight', stat: 'flexibility', staminaCost: 2 }, { key: 'force', stat: 'physicalProwess', staminaCost: 3 }],
        SEARCH_STAT_LABELS: { willpower: 'Willpower' }
    };
    for (const name of ['Forage', 'Scavenge', 'Mining', 'Read', 'Drink', 'CauldronTaste', 'Warm', 'Prayer', 'Offering']) c['get' + name + 'BlockReason'] = f => f && f.block || '';
    for (const name of ['gatherForageFixture', 'scavengeFixture', 'mineFixture', 'readFixture', 'drinkFromFixture', 'tasteCauldron', 'warmUpAtFixture', 'prayAtFixture', 'makeOfferingAtFixture']) c[name] = f => { c.calls.push([name, f]); c.turns++; if (c.afterAction) c.afterAction(); };
    c.performWash = () => c.calls.push(['wash']);
    c.attemptTrapAction = (f, method) => { c.calls.push(['trap', f, method]); if (!c.failTrap) f.trapState = method === 'break' ? 'broken' : 'disarmed'; };
    c.fillContainerAtFixture = (f, key) => c.calls.push(['fill', f, key]);
    c.performTownPortal = async () => { c.calls.push(['portal']); c.G.activeRoom = { structural: [], coords: 'next' }; };
    c.returnThroughTownPortal = async tier => { c.calls.push(['return', tier]); c.G.activeRoom = { structural: [], coords: 'old' }; };
    c.moveThroughFixture = (f, r, route) => c.calls.push(['move', f, r, route]);
    vm.createContext(c); vm.runInContext(code, c);
    c.resolveTextInventoryItems = () => c.itemMatches || [];
    c.textModeState = vm.runInContext('textModeState', c); c.textModeState.enabled = true; c.textModeState.sessionPlayer = player;
    c.send = text => c.submitTextModeCommand(text);
    c.fixture = (name, kind, props = {}) => { const f = { name, kind, ...props }; room.structural.push(f); return f; };
    return c;
}

test('exploration grammar preserves quoted names, source search, and consumable/combat vocabulary', () => {
    const c = harness();
    for (const [input, verb, args] of [
        ['search', 'search', { source: 'room', approach: 'careful' }], ['search tight', 'search', { source: 'room', approach: 'tight' }],
        ['search chest forcefully', 'search', { source: 'chest', approach: 'force' }], ['drink from fountain', 'interact', { fixture: 'fountain', action: 'drink' }],
        ['fill "Bottle from Home" from well', 'fill', { item: 'Bottle from Home', fixture: 'well' }], ['warm up at hearth', 'warm', { fixture: 'hearth' }],
        ['examine fixture altar', 'interact', { fixture: 'altar', action: 'examine' }], ['case the place', 'case', {}], ['forage greenwort', 'gather', { fixture: 'greenwort' }]
    ]) assert.deepEqual(plain(c.parseTextCommand(input)), { verb, args });
    assert.equal(c.parseTextCommand('drink health potion').verb, 'drink');
    c.G.activeNPC = {}; c.G.activeNPCMode = 'combat'; c.getCombatActionGroups = () => [{ name: 'Abilities', actions: [{ name: 'Disarm', primary: 'disarm' }] }];
    assert.equal(c.parseTextCommand('disarm').verb, 'use');
});

test('fixture lists and show views reveal only public names and preserve pending questions', async () => {
    const c = harness(); c.fixture('Secret altar', 'altar', { concealed: true }); c.fixture('Fountain', 'water');
    const pending = c.textModeState.pending = { kind: 'other' };
    await c.send('show fixtures'); assert.equal(c.textModeState.pending, pending);
    assert.deepEqual(plain(c.events.at(-1).fixtures), [{ number: 1, name: 'Fountain' }]);
    await c.send('show fixture fountain'); assert.equal(c.textModeState.pending, pending);
    assert.equal(c.turns, 0); assert.match(c.events.at(-1).text, /drink from Fountain/);
});

test('fixture ambiguity retains object identity after reordering and resumes a queued action once', async () => {
    const c = harness(), a = c.fixture('Greenwort patch', 'herb'), b = c.fixture('Greenwort patch', 'herb');
    await c.send('gather greenwort then status'); assert.equal(c.textModeState.pending.kind, 'fixture');
    c.room.structural.reverse(); await c.send('2');
    assert.equal(c.calls[0][1], b); assert.notEqual(c.calls[0][1], a); assert.equal(c.calls.length, 1); assert.equal(c.textModeState.queue.length, 0);
});

test('removed, replaced, concealed or relocated fixture choices never retarget', async () => {
    for (const change of [c => c.room.structural.pop(), c => c.room.structural[1] = { ...c.room.structural[1] }, c => c.room.structural[1].concealed = true, c => c.room.structural = c.room.structural.slice()]) {
        const c = harness(); c.fixture('Patch', 'herb'); c.fixture('Patch', 'herb');
        await c.send('gather patch then status'); change(c); await c.send('2');
        assert.equal(c.calls.length, 0); assert.equal(c.textModeState.paused, true);
    }
});

test('native eligibility is rechecked after clarification and unavailable commands pause the queue', async () => {
    const c = harness(); c.fixture('Patch', 'herb'); const b = c.fixture('Patch', 'herb');
    await c.send('gather patch then status'); b.block = 'Stripped bare.'; await c.send('2');
    assert.equal(c.calls.length, 0); assert.match(c.events.at(-1).text, /Stripped bare/); assert.equal(c.textModeState.queue.length, 1);
});

test('water filling resolves both fixture and item questions and rejects changed empty stacks', async () => {
    const c = harness(), f = c.fixture('Well', 'water');
    c.fillable = [{ item: { name: 'Empty bottle' }, key: 'a', totalQuantity: 2 }, { item: { name: 'Empty vial' }, key: 'b', totalQuantity: 1 }];
    await c.send('fill container from well'); assert.equal(c.calls.length, 0);
    await c.send('fill from well'); // a named item is required; use generic matching below
    await c.send('fill empty from well'); assert.equal(c.textModeState.pending.kind, 'fixtureFill');
    c.fillable[1].totalQuantity = 2; await c.send('2'); assert.equal(c.calls.length, 0);
    await c.send('fill bottle from well'); assert.equal(c.calls[0][1], f); assert.equal(c.calls[0][2], 'a');
});

test('unknown actions, foul water and competing item/fixture names cannot cause side effects', async () => {
    const c = harness(); c.fixture('Fountain', 'foul');
    await c.send('drink from fountain'); assert.equal(c.calls.length, 0); assert.match(c.events.at(-1).text, /foul/);
    c.itemMatches = [{}]; await c.send('examine fountain'); assert.match(c.events.at(-1).text, /both an item and a fixture/);
    const result = await c.executeTextExplorationCommand({ verb: 'interact', args: { fixture: 'fountain', action: 'delete' } });
    assert.equal(result.status, 'blocked'); assert.equal(c.calls.length, 0);
});

test('room searches check full approach stamina, delegate costs and keep loot context intact', async () => {
    const c = harness(), context = { keep: true }; c.textModeState.lootContext = context;
    c.player.stamina = 2; await c.send('search room force then status'); assert.equal(c.calls.length, 0); assert.equal(c.turns, 0);
    c.player.stamina = 10; await c.send('search tight room');
    assert.deepEqual(plain(c.calls), [['search', 'tight']]); assert.equal(c.player.stamina, 8); assert.equal(c.turns, 1); assert.equal(c.textModeState.lootContext, context);
});

test('sneak and Case the Place require the native learned-ability descriptor', async () => {
    const c = harness(); await c.send('sneak'); assert.equal(c.calls.length, 0);
    c.INTERACT_MENU_ACTIONS.push({ id: 'sneak', visible: () => true, disabledReason: () => '', run: () => c.calls.push(['sneak']) });
    await c.send('sneak'); assert.deepEqual(plain(c.calls), [['sneak']]);
    await c.send('case'); assert.equal(c.calls.length, 1);
});

test('portal travel requires a numbered confirmation; cancellation, changed fees and stale fixtures spend nothing', async () => {
    for (const mode of ['cancel', 'fee', 'removed', 'blocked', 'accept']) {
        const c = harness(); c.fixture('Waygate', 'portal'); await c.send('enter waygate then status');
        assert.equal(c.textModeState.pending.kind, 'fixtureConfirm'); assert.equal(c.calls.length, 0);
        if (mode === 'fee') c.fee++;
        if (mode === 'removed') c.room.structural = [];
        if (mode === 'blocked') c.portalBlocked = 'Not enough gold.';
        await c.send(mode === 'cancel' ? '2' : '1');
        assert.equal(c.calls.length, mode === 'accept' ? 1 : 0); assert.equal(c.textModeState.queue.length, 1);
    }
});

test('stair choices retain their exact route and reject destination changes', async () => {
    const c = harness(), f = c.fixture('Stairs', 'stairs', { routes: [{ direction: 'U', target: 'up', label: 'Climb up' }, { direction: 'D', target: 'down', label: 'Climb down' }] });
    await c.send('climb stairs'); assert.equal(c.textModeState.pending.kind, 'fixtureRoute');
    f.routes[0] = { direction: 'U', target: 'other', label: 'Climb up' }; await c.send('1'); assert.equal(c.calls.length, 0);
    await c.send('climb stairs'); await c.send('2'); assert.equal(c.calls[0][3].target, 'down');
});

test('scene changes and failed trap attempts preserve completed effects while pausing later actions', async () => {
    const c = harness(); c.fixture('Patch', 'herb'); c.afterAction = () => { c.hostile = true; };
    await c.send('gather patch then gather patch'); assert.equal(c.calls.length, 1); assert.equal(c.textModeState.queue.length, 1);
    c.hostile = false; c.afterAction = null; c.failTrap = true; c.fixture('Spike trap', 'trap', { trapState: 'armed' });
    await c.send('disarm spike trap then status'); assert.equal(c.calls.at(-1)[0], 'trap'); assert.equal(c.textModeState.queue.length, 1);
});

test('the real shared room search spends costs but reveals nothing after an interrupted world tick', async () => {
    const c = harness(), hidden = c.fixture('Hidden cache', 'chest', { concealed: true, revealed: false, revealStat: 'willpower', revealDC: 12 });
    vm.runInContext(section('function performRoomSearch(', '// ── CONTAINERS'), c);
    c.tick = () => { c.G.activeRoom = { structural: [] }; };
    const result = c.performRoomSearch('careful');
    assert.equal(result.status, 'interrupted'); assert.equal(hidden.revealed, false); assert.equal(c.turns, 1); assert.equal(c.player.stamina, 19);
});

test('the real shared room search excludes newly arrived fixtures and changed discovery metadata', () => {
    const c = harness(), hidden = c.fixture('Hidden cache', 'chest', { concealed: true, revealed: false, revealStat: 'willpower', revealDC: 12 });
    vm.runInContext(section('function performRoomSearch(', '// ── CONTAINERS'), c);
    let newcomer;
    c.tick = () => { hidden.revealDC++; newcomer = c.fixture('New cache', 'chest', { concealed: true, revealed: false, revealStat: 'willpower', revealDC: 12 }); };
    c.performRoomSearch('careful'); assert.equal(hidden.revealed, false); assert.equal(newcomer.revealed, false);
});

test('danger, conversation and incapacitation block fixture actions without spending a turn', async () => {
    for (const change of [c => c.hostile = true, c => c.G.activeNPC = {}, c => c.G.player.unconscious = true, c => c.collapsed = true]) {
        const c = harness(); c.fixture('Patch', 'herb'); change(c); await c.send('gather patch then status');
        assert.equal(c.calls.length, 0); assert.equal(c.turns, 0); assert.equal(c.textModeState.paused, true);
    }
});

test('AI plans use the exploration schema and cannot manufacture travel approval', async () => {
    const c = harness();
    assert.equal(c.validateTextAIPlan({ actions: [{ verb: 'enter', args: { fixture: 'waygate', confirm: 'yes' } }] }), null);
    assert.equal(c.validateTextAIPlan({ actions: [{ verb: 'enter', args: { fixture: 'waygate' }, portalChoice: { yes: true } }] }), null);
    assert.equal(c.validateTextAIPlan({ actions: [{ verb: 'interact', args: { fixture: 'fountain', action: 'drink' } }] }).length, 1);
});
