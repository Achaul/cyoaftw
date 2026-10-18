const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(process.argv[2] || 'C:/Git/CYOAFTW/.jobs-text/cyoaftw-engine-CORE.js', 'utf8').replace(/\r\n/g, '\n');
function section(from, to) { const a = source.indexOf(from), b = source.indexOf(to, a); assert(a >= 0 && b > a, from); return source.slice(a, b); }
const code = section('// Text commands are a presentation/input layer.', '// END TEXT COMMANDS') + '\n' + section('const JOB_WORKDAY_TURNS =', '// ── BAR SERVICE:');
const plain = value => JSON.parse(JSON.stringify(value));
function element() { return { children: [], style: {}, classList: { add() {}, remove() {} }, appendChild(child) { this.children.push(child); }, set innerHTML(v) { assert.equal(v, ''); this.children = []; }, setAttribute() {} }; }
function harness() {
    const player = { hp: 20, hpMax: 20, stamina: 100, staminaMax: 100, inventory: [], equipped: {}, coins: 10, coords: '0,0' };
    const board = { id: 'job-board', name: 'job board' }, room = { coords: '0,0', type: 'Tavern', zone: 'Town', structural: [board], items: [], creatures: [], exits: {} }, el = element();
    const c = { console, setTimeout, clearTimeout, player, room, board, el, turn: 100, tier: 0, events: [], saves: 0,
        G: { player, activeRoom: room, activeNPC: null, activeNPCMode: null, activeItemModal: null, activeObject: null, roomMap: { '0,0': room }, partyMembers: [], sessionFollowers: [] },
        window: { dispatchEvent(event) { c.events.push(event.detail); } }, CustomEvent: function (_name, options) { this.detail = options.detail; },
        document: { getElementById: id => id === 'chatOptionsEl' ? el : null, createElement: element },
        createCombatButton: (label, onClick, opts = {}) => ({ ...element(), label, onClick, ...opts }), appendCombatGroup: (target, title, buttons) => target.children.push({ title, buttons }),
        getEntityName: entity => entity.name, getItemName: item => item.name, getItemQuantity: item => item.quantity || 1,
        getVisibleRoomFixtures: r => r.structural.filter(f => !f.hidden && !f.concealed && !f.isHidden && f.visible !== false),
        isVisibleEntity: e => !!e && !e.hidden && !e.concealed && !e.isHidden && e.visible !== false,
        hasPendingPartyLoot: () => false, roomHasActiveHostile: () => !!c.hostile, isRoomCollapsed: () => !!c.collapsed, isPlayerJailed: () => !!c.jailed,
        isEntityExhausted: () => false, getCurrentStoryTurn: () => c.turn, getPortalTier: () => c.tier, getPortalGoldFactor: () => 1,
        getCharismaPayBonus: () => 0, getEntityStatCombatBonus: () => 0, getCoinValue: p => p.coins, adjustCoins: (p, n) => p.coins += n,
        advanceStoryTurn(n) { c.turn += n; if (c.onAdvance) c.onAdvance(); }, spendEntityStamina: (p, n) => p.stamina -= n,
        rollStatCheck: () => ({ success: false }), rand: list => list[0], randInt: min => min,
        setNarration: text => c.publishTextModeOutput('narration', text, {}, false), addChatMessage: (_side, _name, text) => c.publishTextModeOutput('dialogue', text, {}, false),
        renderStats() {}, renderRoom() {}, resetNpcPanel() {}, clearChatLog() {}, setExitGridVisible() {},
        renderCombatNarrationLines(lines) { c.publishTextModeOutput('combat', lines.join(' '), {}, false); },
        saveGameState: () => c.saves++, closeItemModal() { c.G.activeItemModal = null; }, returnToRoomView() { el.innerHTML = ''; },
        canReadNoticesHere: () => false, recordDeed() {}, recordDeedNote() {}, findNPCById: () => c.giver || null,
        applyNPCImpact(npc, impact) { npc.favor = (npc.favor || 0) + impact.favor; },
        normalizeSpeciesName: text => String(text || '').toLowerCase(), INTERACT_MENU_ACTIONS: [],
        getEntityWeaponProfile: () => null, assignLootUID: item => item,
        WIZARD_SPELLS: { razorWind: { name: 'Razor Wind' } }, getEffectiveSpellManaCost: () => 3,
        spendPlayerMana: (p, n) => p.mana -= n, renderRoomObjectActionMenu() {},
        getChatOptions: () => [], aiAvailable: () => false
    };
    vm.createContext(c); vm.runInContext(code, c);
    c.textModeState = vm.runInContext('textModeState', c); c.sharedChoiceState = vm.runInContext('sharedChoiceState', c);
    c.types = vm.runInContext('JOB_TYPES', c); c.textModeState.enabled = true; c.textModeState.sessionPlayer = player;
    c.getBoardJobPostings = () => [{ type: 'serveTables', site: { room } }];
    c.send = text => c.submitTextModeCommand(text);
    return c;
}
test('job/quest vocabulary has canonical intents without colliding with loot or speech', () => {
    const c = harness();
    for (const [input, verb, args] of [
        ['view job postings', 'jobs', { target: '' }], ['jobs with second dwarf', 'jobs', { target: 'second dwarf' }],
        ['quest log', 'quests', { target: '' }], ['accept job serve tables', 'jobs', { action: 'accept', target: 'serve tables' }],
        ['take bounty goblins', 'quests', { action: 'accept', target: 'goblins' }], ['work', 'jobs', { action: 'work' }],
        ['collect wages', 'jobs', { action: 'collect' }], ['hand in quest goblins', 'quests', { action: 'handin', target: 'goblins' }],
        ['abandon quest goblins', 'quests', { action: 'abandon', target: 'goblins' }], ['cut trophy from goblin corpse with razor wind', 'trophy', { source: 'goblin corpse', ability: 'razor wind' }]
    ]) assert.deepEqual(plain(c.parseTextCommand(input)), { verb, args });
    assert.equal(c.parseTextCommand('take sword from chest').verb, 'take');
    assert.equal(c.parseTextCommand('say "accept job cook"').verb, 'say');
    assert.equal(c.validateTextAIPlan({ actions: [{ verb: 'jobs', args: { action: 'accept', target: 'cook', reward: '1000' } }] }), null);
});
test('board choices accept native work and a consumed posting cannot accept twice', async () => {
    const c = harness(); await c.send('jobs');
    const menu = c.sharedChoiceState.menu, choice = menu.options.find(o => o.meta.category === 'job');
    assert.equal(menu.valid(), true); await c.runSharedChoice(menu, choice);
    await c.send('accept job'); assert.equal(c.getActiveJob().type, 'serveTables');
    assert.equal((await c.runSharedChoice(menu, choice)).status, 'blocked');
    assert.equal(c.ensureJobState().done, 0);
});
test('native shift costs and wage payment occur once; choices preserve queued work', async () => {
    const c = harness(); c.startJob('serveTables', { room: c.room });
    const turn = c.turn, stamina = c.player.stamina;
    await c.send('work then status');
    assert.equal(c.getActiveJob().shifts, 1); assert.equal(c.turn - turn, c.types.serveTables.turns); assert.equal(stamina - c.player.stamina, c.types.serveTables.stamina);
    assert.equal(c.textModeState.queue.length, 1);
    const menu = c.sharedChoiceState.menu, pay = menu.options.find(o => o.meta.action === 'collect'), owed = c.getActiveJob().owed, coins = c.player.coins;
    await c.send('collect pay'); assert.equal(c.getActiveJob(), null); assert.equal(c.player.coins - coins, owed);
    assert.equal((await c.runSharedChoice(menu, pay)).status, 'blocked'); assert.equal(c.player.coins - coins, owed);
    await c.send('continue'); assert.equal(c.textModeState.queue.length, 0);
});
test('wrong site, exhaustion and changed work records cannot spend or pay', async () => {
    const c = harness(); const job = c.startJob('serveTables', { room: c.room }); job.siteCoords = '9,9';
    await c.send('work'); assert.equal(job.shifts, 0); assert.equal(c.turn, 100);
    await c.send('back'); job.siteCoords = c.room.coords; c.player.stamina = 0;
    await c.send('work'); assert.equal(job.shifts, 0); assert.equal(c.turn, 100);
    const menu = c.sharedChoiceState.menu; job.owed = 50;
    assert.equal((await c.runSharedChoice(menu, menu.options[0])).status, 'blocked'); assert.equal(c.player.coins, 10);
});
test('an interrupted native shift retains time/stamina costs but awards no remote wages', () => {
    const c = harness(), job = c.startJob('serveTables', { room: c.room });
    c.onAdvance = () => { c.G.activeRoom = { coords: '9,9' }; };
    const result = c.performJobShift(); assert.equal(result.status, 'interrupted');
    assert.equal(job.shifts, 0); assert.equal(job.owed, 0); assert.equal(c.turn, 100 + c.types.serveTables.turns); assert.equal(c.player.stamina, 100 - c.types.serveTables.stamina);
});
test('expired workdays create valid disabled work menus and refresh after state changes', async () => {
    const c = harness(), job = c.startJob('serveTables', { room: c.room }); c.turn += 30;
    await c.send('work'); assert.equal(job.state, 'dayDone'); assert.equal(c.sharedChoiceState.menu.valid(), true);
    assert.equal(c.sharedChoiceState.menu.options.find(o => o.meta.action === 'work').disabled, true);
    job.state = 'morning'; await c.send('options'); assert.equal(c.sharedChoiceState.menu.valid(), true);
    await c.send('carry on working'); assert.equal(job.state, 'working'); assert.equal(job.shifts, 0); assert.equal(job.dayStartTurn, c.turn);
});
test('quest proof, tier, surplus and consumed rewards use the native rules', async () => {
    const c = harness(), q = c.getQuestPool(0)[0]; assert(c.acceptQuest(q.id, null, false));
    assert.equal(c.handInQuest(q.id, false), false); c.player.inventory.push({ name: 'proof', trophySpecies: q.species, trophyPart: q.part, quantity: q.count + 2 });
    c.tier = 1; assert.equal(c.handInQuest(q.id, false), false); assert.equal(c.player.inventory[0].quantity, q.count + 2);
    c.tier = 0; await c.send('quests'); const menu = c.sharedChoiceState.menu, choice = menu.options.find(o => o.meta.action === 'handin'), coins = c.player.coins;
    await c.send('hand in quest'); assert.equal(c.player.inventory[0].quantity, 2); assert.equal(c.player.coins, coins + q.reward.gold); assert.equal(c.ensureQuestState().done, 1);
    assert.equal((await c.runSharedChoice(menu, choice)).status, 'blocked'); assert.equal(c.player.coins, coins + q.reward.gold);
});
test('abandonment keeps native standing and giver costs and emits a public result once', async () => {
    const c = harness(); c.giver = { id: 'giver', name: 'a guard', favor: 0 };
    const q = c.getQuestPool(0)[0]; c.addTownStanding(5, 0); c.acceptQuest(q.id, c.giver, false);
    await c.send('abandon quest'); assert.equal(c.getTownStanding(), 4); assert.equal(c.giver.favor, -2);
    assert.equal(c.events.filter(e => e.kind === 'quest' && e.quest.action === 'abandon').length, 1);
    assert.equal(c.abandonQuest(q.id), false); assert.equal(c.getTownStanding(), 4);
});
test('quest replacements, refreshed boards, hidden fixtures and new threats invalidate choices', async () => {
    for (const mutation of [c => { const qs = c.ensureQuestState(); qs.boards[0].list = qs.boards[0].list.map(q => ({ ...q })); }, c => { c.turn += 200; }, c => { c.board.hidden = true; }, c => { c.hostile = true; }, c => { c.jailed = true; }]) {
        const c = harness(); await c.send('jobs'); const menu = c.sharedChoiceState.menu, choice = menu.options.find(o => o.meta.category === 'quest');
        mutation(c); assert.equal((await c.runSharedChoice(menu, choice)).status, 'blocked'); assert.equal(c.ensureQuestState().active.length, 0);
    }
});
test('read-only progress/help leaves the current numbered decision and costs unchanged', async () => {
    const c = harness(); await c.send('jobs'); const menu = c.sharedChoiceState.menu;
    await c.send('show quests'); await c.send('how to accept quest'); await c.send('show jobs');
    assert.equal(c.sharedChoiceState.menu, menu); assert.equal(c.turn, 100); assert.equal(c.player.stamina, 100);
    assert.match(c.events.at(-1).text, /collect pay/); await c.send('cancel'); assert.equal(c.sharedChoiceState.menu, null);
});
test('native trophy collection rejects hidden sources and interrupted turns without manufacturing proof', () => {
    const c = harness(); c.player.inventory.push({ name: 'Dagger' }); c.player.mana = 10;
    const body = { name: 'goblin corpse', species: 'goblin', objectType: 'body', bodyState: 'corpse', hostility: 90 };
    c.room.items.push(body);
    c.onAdvance = () => { body.hidden = true; };
    assert.equal(c.cutTrophyFromBody(body, 'razorWind'), false);
    assert.equal(c.turn, 101); assert.equal(c.player.mana, 7); assert.equal(body._trophyTaken, undefined);
    assert.equal(c.player.inventory.filter(i => i.trophySpecies).length, 0);
    body.hidden = false; c.onAdvance = null;
    assert.equal(c.cutTrophyFromBody(body, null), true); assert.equal(body._trophyTaken, true);
    assert.equal(c.player.inventory.filter(i => i.trophySpecies).length, 1);
    assert.equal(c.cutTrophyFromBody(body, null), false); assert.equal(c.turn, 102);
});
