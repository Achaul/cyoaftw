const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const source = fs.readFileSync(process.argv[2] || 'C:/Git/CYOAFTW/.reading-text/cyoaftw-engine-CORE.js', 'utf8').replace(/\r\n/g, '\n');
function section(a, b) { const start = source.indexOf(a), end = source.indexOf(b, start); assert(start >= 0 && end > start, a); return source.slice(start, end); }
function native(name) { const start = source.indexOf('function ' + name + '('), end = source.indexOf('\nfunction ', start + 1); assert(start >= 0 && end > start, name); return source.slice(start, end); }
const code = section('// Text commands are a presentation/input layer.', '// END TEXT COMMANDS') + '\n' +
    ['getPlayerSpellbooks', 'getKnownSpellIds', 'getScrollCopyBlockReason', 'copyScrollToSpellbook', 'describeSpellbookText', 'getPrimerBlockReason', 'studyClassPrimer', 'getArcaneStudyBlockReason', 'studyArcaneText', 'learnSpellFromBook'].map(native).join('\n');
const plain = x => JSON.parse(JSON.stringify(x));
const item = (name, type, extra = {}) => ({ name, type: [type], key: name, quantity: 1, ...extra });
function element() { return { children: [], style: {}, appendChild(child) { this.children.push(child); }, set innerHTML(v) { assert.equal(v, ''); this.children = []; } }; }
function harness() {
    const player = { name: 'Player', hp: 20, hpMax: 20, stamina: 30, staminaMax: 30, inventory: [], equipped: {}, classSkills: { wizard: { rank: 0, xp: 0 }, cleric: { rank: 0, xp: 0 } }, classBranches: {}, learned: [] };
    const room = { coords: '0,0', structural: [], items: [], creatures: [] }, el = element();
    const c = { console, setTimeout, clearTimeout, player, room, el, turn: 100, events: [], calls: [],
        G: { player, activeRoom: room, activeNPC: null, activeNPCMode: null, activeObject: null, activeItemModal: null, partyMembers: [], sessionFollowers: [] },
        window: {}, document: { getElementById: id => id === 'chatOptionsEl' ? el : null },
        createCombatButton: (label, onClick, options = {}) => ({ label, onClick, ...options }), createEquipmentActionButton: (label, onClick, options = {}) => ({ label, onClick, ...options }),
        getItemName: i => i.name, getItemQuantity: i => i.quantity || 1, getInventoryEntryKey: i => i.key,
        buildPlayerInventoryEntries: p => p.inventory.filter(i => !i.hidden && !i.isHidden && !i.concealed && i.visible !== false).map(i => ({ item: i, key: i.key, totalQuantity: i.quantity || 1 })),
        isRoomItemTakeable: () => true, isLootItemVisible: i => !!i && !i.hidden && !i.isHidden && !i.concealed && i.visible !== false,
        getEquipmentSlotMeta: key => ({ label: key }), getCoinValue: () => 10,
        isDeityTomeItem: i => i.type.includes('deity-tome'), isGenericLoreItem: i => i.type.includes('lore'), isSpellbookItem: i => i.type.includes('spellbook'),
        isSpellScrollItem: i => i.type.includes('spell-scroll'), isClassPrimerItem: i => i.type.includes('primer'), isPoisonRecipeNote: i => !!i.poisonRecipeKey,
        getClassSkillRank: (p, key) => p.classSkills[key].rank, ensureClassSkillState() {}, playerIsSpellcaster: p => p.classSkills.wizard.rank >= 1,
        describeSpellLearnBlock: () => c.learnBlock || '', isSpellLearned: (p, id) => p.learned.includes(id), getSpellLearnPlan: () => ({ branch: 'frost', reason: '', extra: false }),
        learnTechnique(p, id) { p.learned.push(id); }, getEquippedAffinityTotal: () => 0,
        WIZARD_SPELLS: { frostShard: { name: 'Frost Shard', summary: 'A shard of ice.', copyDC: 10 }, firebolt: { name: 'Firebolt', summary: 'A bolt of fire.', copyDC: 10 } },
        CLASS_PRIMERS: { cleric: { label: 'divine faith' } }, CLASS_PRIMER_TURNS: 8, CLASS_PRIMER_LATER_XP_SHARE: 0.25,
        CLASS_STUDY_TURNS: 2, CLASS_STUDY_XP: 2, CLASS_STUDY_COOLDOWN: 12,
        WIZARD_LEARN_FROM_BOOK_TURNS: 2, WIZARD_LEARN_FROM_BOOK_XP: 2,
        SPELL_COPY_TURNS_PER_SITTING: 2, SPELL_COPY_PROGRESS_MIN: 20, SPELL_COPY_PROGRESS_MAX: 35, SPELL_COPY_PROGRESS_CRIT: 50, SPELL_COPY_MISHAP_LOSS: 15, CLASS_RANK_BASELINE: 1,
        getCurrentStoryTurn: () => c.turn, advanceStoryTurn(n) { c.turn += n; if (c.onAdvance) c.onAdvance(); },
        rollStatCheck: () => c.roll || { success: true, critSuccess: true }, randInt: min => min,
        gainClassSkillXP(key, xp) { player.classSkills[key].xp += xp; }, applyClassTrainingEffects() {}, getClassRankName: () => 'Novice', getClassSkillXPNeeded: () => 10,
        trackCombatSkillGain: () => ({}), formatSkillGainDebug: () => '[debug]', formatRollLine: () => '[debug]', isCombatDebugLine: line => line === '[debug]',
        takeInventoryEntryAmount(p, key) { const i = p.inventory.find(i => i.key === key); if (!i) return null; if (i.quantity > 1) i.quantity--; else p.inventory.splice(p.inventory.indexOf(i), 1); return { ...i, quantity: 1 }; },
        roomHasActiveHostile: () => !!c.hostile, isRoomCollapsed: () => false, hasPendingPartyLoot: () => false, isPlayerJailed: () => false,
        isVisibleEntity: e => !e.hidden, getEntityName: e => e.name, getVisibleRoomFixtures: r => r.structural,
        refreshInventoryUi: line => c.calls.push(['refresh', line]), renderStats() {}, saveGameState() {}, returnToRoomView() { el.innerHTML = ''; },
        showReadingModal: (title, text) => c.calls.push(['modal', title, text]), dismissItemModal() {},
        aiAvailable: () => false, INTERACT_MENU_ACTIONS: [], getChatOptions: () => [],
        readLoreNoteEntry: async key => { const i = player.inventory.find(i => i.key === key); return i.generatedContent; },
        readInventoryEntry(key) { const i = player.inventory.find(i => i.key === key); c.takeInventoryEntryAmount(player, key); return 'You learn of ' + i.deityId; }
    };
    c.window.G = c.G; c.window.dispatchEvent = e => c.events.push(e.detail); c.CustomEvent = function (_name, options) { this.detail = options.detail; };
    vm.createContext(c); vm.runInContext(code, c); c.state = vm.runInContext('textModeState', c); c.menus = vm.runInContext('sharedChoiceState', c);
    c.state.enabled = true; c.state.sessionPlayer = player; c.send = input => c.submitTextModeCommand(input);
    return c;
}
test('look/read/study/copy/learn grammar keeps quotes and fixture support', () => {
    const c = harness();
    for (const [input, expected] of [
        ['look at book', { verb: 'examine', args: { item: 'book' } }], ['look at scroll', { verb: 'examine', args: { item: 'scroll' } }],
        ['look at note', { verb: 'examine', args: { item: 'note' } }], ['read "Notes from Smoke and Fire"', { verb: 'read', args: { item: 'Notes from Smoke and Fire' } }],
        ['copy scroll to spellbook', { verb: 'copy', args: { item: 'scroll' } }], ['learn frost shard from spellbook', { verb: 'learn', args: { ability: 'frost shard', item: 'spellbook' } }]
    ]) assert.deepEqual(plain(c.parseTextCommand(input)), expected);
    assert.equal(c.parseTextCommand('look').verb, 'look'); assert.equal(c.parseTextCommand('say "read book"').verb, 'say');
    assert.equal(c.validateTextAIPlan({ actions: [{ verb: 'learn', args: { item: 'book', ability: 'firebolt', grantXP: '999' } }] }), null);
});
test('public type keywords support books, scrolls and notes while hidden items stay absent', async () => {
    const c = harness(); c.player.inventory.push(item('Arcane volume', 'spellbook', { spells: [] }), item('Old parchment', 'spell-scroll', { spellId: 'frostShard' }), item('Secret letter', 'lore', { hidden: true }));
    assert.equal(c.resolveTextInventoryItems('book', 'examine')[0].item.name, 'Arcane volume'); assert.equal(c.resolveTextInventoryItems('scroll', 'examine').length, 1);
    await c.send('show readable items'); assert(!c.events.at(-1).text.includes('Secret letter')); assert.equal(c.turn, 100);
});
test('a primer consumes one copy and trains with native time; interruption spends the book without remote training', async () => {
    for (const interrupted of [false, true]) {
        const c = harness(), primer = item('Devotions', 'primer', { primerClass: 'cleric', quantity: 2 }); c.player.inventory.push(primer);
        if (interrupted) c.onAdvance = () => { c.G.activeRoom = { coords: '1,1' }; };
        await c.send('study book'); assert.equal(primer.quantity, 1); assert.equal(c.turn, 108);
        assert.equal(c.player.classSkills.cleric.rank, interrupted ? 0 : 1);
        if (interrupted) assert.equal(c.events.at(-1).status, 'interrupted');
    }
});
test('arcane basics retain cooldown and rank restrictions without consuming the text', async () => {
    const c = harness(), scroll = item('Rune', 'spell-scroll', { spellId: 'frostShard' }); c.player.inventory.push(scroll);
    await c.send('study scroll'); assert.equal(c.turn, 102); assert.equal(c.player.classSkills.wizard.xp, 2); assert(c.player.inventory.includes(scroll));
    await c.send('study scroll'); assert.equal(c.turn, 102); assert.match(c.events.at(-1).text, /last sitting/);
});
test('scroll completion copies to the actual carried book, learns, consumes, and excludes debug speech', async () => {
    const c = harness(); c.player.classSkills.wizard.rank = 2;
    const scroll = item('Rune', 'spell-scroll', { spellId: 'frostShard', copyProgress: 75 }), book = item('Volume', 'spellbook', { spells: [] }); c.player.inventory.push(scroll, book); c.G.combatRollDebugMode = true;
    await c.send('copy scroll'); assert(!c.player.inventory.includes(scroll)); assert.deepEqual(book.spells, ['frostShard']); assert(c.player.learned.includes('frostShard')); assert.equal(c.turn, 102);
    assert(!c.events.filter(e => e.kind === 'reading').at(-1).text.includes('[debug]'));
});
test('failed and critical-failure copy checks retain native progress and consume no scroll', async () => {
    for (const critFail of [false, true]) {
        const c = harness(); c.player.classSkills.wizard.rank = 2; c.roll = { success: false, critFail };
        const scroll = item('Rune', 'spell-scroll', { spellId: 'frostShard', copyProgress: 40 }); c.player.inventory.push(scroll, item('Volume', 'spellbook', { spells: [] }));
        await c.send('copy scroll'); assert.equal(scroll.copyProgress, critFail ? 25 : 40); assert(c.player.inventory.includes(scroll)); assert.equal(c.turn, 102);
    }
});
test('lost book or new danger during a sitting grants no copy progress or learned spell', async () => {
    for (const danger of [false, true]) {
        const c = harness(); c.player.classSkills.wizard.rank = 2;
        const scroll = item('Rune', 'spell-scroll', { spellId: 'frostShard', copyProgress: 75 }), book = item('Volume', 'spellbook', { spells: [] }); c.player.inventory.push(scroll, book);
        c.onAdvance = () => { if (danger) c.hostile = true; else c.player.inventory = c.player.inventory.filter(i => i !== book); };
        await c.send('copy scroll'); assert.equal(scroll.copyProgress, 75); assert(c.player.inventory.includes(scroll)); assert.equal(book.spells.length, 0); assert.equal(c.events.at(-1).status, 'interrupted');
    }
});
test('book choices pause the queue, learn a specific spell once, and reject stale spell lists', async () => {
    const c = harness(); c.player.classSkills.wizard.rank = 3; const book = item('Volume', 'spellbook', { spells: ['frostShard', 'firebolt'] }); c.player.inventory.push(book);
    await c.send('study book then status'); const menu = c.menus.menu; assert.equal(menu.kind, 'reading'); assert.equal(c.state.queue.length, 1);
    const choice = menu.options.find(o => o.meta.ability === 'frostShard'); book.spells.reverse();
    assert.equal((await c.runSharedChoice(menu, choice)).status, 'blocked'); assert.equal(c.player.learned.length, 0);
    await c.send('options'); await c.send('learn frost shard from book'); assert(c.player.learned.includes('frostShard')); assert.equal(c.turn, 102); assert.equal(c.state.queue.length, 1);
    assert.equal((await c.runSharedChoice(menu, choice)).status, 'blocked'); await c.send('continue'); assert.equal(c.state.queue.length, 0);
});
test('unowned, hidden, changed-class and dangerous readings are refused before costs', async () => {
    const c = harness(), book = item('Volume', 'spellbook', { spells: ['frostShard'] }); c.room.items.push(book);
    await c.send('read book'); assert.match(c.events.at(-1).text, /inventory/); assert.equal(c.turn, 100);
    c.room.items = []; c.player.inventory.push(book); c.hostile = true; await c.send('read book'); assert.equal(c.events.at(-1).status, 'blocked'); assert.equal(c.turn, 100);
    c.hostile = false; const context = c.captureReadableRequest(c.textInventoryCandidates()[0]); c.player.classSkills.wizard.rank++;
    assert.equal(context.valid(), false);
});
test('native inventory buttons reject moved scenes and share the same guarded read callback', async () => {
    const c = harness(), note = item('Folded letter', 'lore', { generatedContent: 'Written directions.' }); c.player.inventory.push(note);
    const parent = element(), entry = c.buildPlayerInventoryEntries(c.player)[0]; c.appendReadableInventoryActions(entry, parent);
    c.G.activeRoom = { coords: '1,1' }; await parent.children[0].onClick(); assert.equal(c.events.filter(e => e.kind === 'reading').length, 0);
    c.G.activeRoom = c.room; const fresh = element(); c.appendReadableInventoryActions(entry, fresh); await fresh.children[0].onClick();
    assert.equal(c.events.filter(e => e.kind === 'reading').length, 1); assert.equal(c.state.busy, false);
});
test('contextual show offers reading from inventory and only available study verbs', async () => {
    const c = harness(); c.player.inventory.push(item('Volume', 'spellbook', { spells: [] }));
    await c.send('show'); assert.match(c.events.at(-1).text, /^read: /m); assert(!/^copy: /m.test(c.events.at(-1).text)); assert(!/^study: /m.test(c.events.at(-1).text));
    c.player.inventory.push(item('Rune', 'spell-scroll', { spellId: 'frostShard' }));
    await c.send('show'); assert.match(c.events.at(-1).text, /^study: /m); assert(!/^copy: /m.test(c.events.at(-1).text));
    c.player.classSkills.wizard.rank = 2; await c.send('show'); assert.match(c.events.at(-1).text, /^copy: /m);
});
