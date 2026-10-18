const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(process.argv[2] || 'C:/Git/CYOAFTW/.combat-text/cyoaftw-engine-CORE.js', 'utf8').replace(/\r\n/g, '\n');
function section(from, to) {
    const start = source.indexOf(from), end = source.indexOf(to, start);
    assert(start >= 0 && end > start, from);
    return source.slice(start, end);
}
const code = section('// Text commands are a presentation/input layer.', '// END TEXT COMMANDS');
const registry = section('// Shared semantic combat actions.', 'function renderCombatActionMenu(');
const plain = value => JSON.parse(JSON.stringify(value));
function element() {
    const classes = new Set();
    return { children: [], dataset: {}, hidden: false, textContent: '', value: '',
        appendChild(child) { this.children.push(child); }, removeChild(child) { this.children.splice(this.children.indexOf(child), 1); },
        get firstChild() { return this.children[0]; },
        classList: { toggle(name, on) { on ? classes.add(name) : classes.delete(name); } }, addEventListener() {}, focus() {} };
}
function harness(combat = true) {
    // Jobs now participate in the contextual command list.
    const els = Object.fromEntries(['gameWrapper', 'textModeEl', 'textModeInputEl', 'textModeFormEl', 'textModeLogEl', 'textModeStatusEl', 'textModeStopBtn'].map(id => [id, element()]));
    const foe = { id: 'd1', name: 'a dwarf', gender: 'male', species: 'dwarf', hp: 30, memory: {} };
    const other = { id: 'd2', name: 'a dwarf woman', gender: 'female', species: 'dwarf', hp: 30, memory: {} };
    const ally = { id: 'a1', name: 'Companion', gender: 'female', species: 'elf', hp: 5, hpMax: 20 };
    const room = { coords: '0,0', creatures: [foe, ally, other], exits: { N: '0,1' } };
    const player = { hp: 20, hpMax: 30, stamina: 12, staminaMax: 20, mana: 5, manaMax: 10, coins: 0 };
    const encounter = { foes: [foe, other], room, id: 'fight' };
    const c = {
        console, setTimeout, clearTimeout, els, foe, other, ally, room, player, calls: [], events: [], fighterRank: 1,
        G: { player, activeRoom: room, activeNPC: combat ? foe : null, activeNPCMode: combat ? 'combat' : null, combatEncounter: combat ? encounter : null },
        document: { getElementById: id => els[id] || null, createElement: element, addEventListener() {} },
        window: { dispatchEvent(event) { c.events.push(event.detail); } }, CustomEvent: function (_name, options) { this.detail = options.detail; },
        aiAvailable: () => false, callAI: async () => null,
        isVisibleEntity: npc => !npc.hidden && !npc.unconscious,
        getNPCRoomSightName: npc => npc.name, canConverseWithNPC: () => true,
        getCoinValue: p => p.coins, getActiveEncounter: () => c.G.combatEncounter,
        encounterStandingFoes: enc => enc.foes.filter(npc => npc.hp > 0 && !npc.unconscious && !npc.hidden && !npc.surrendered),
        getCombatTargetOptions: npc => npc.nonhumanoid ? ['torso', 'head'] : ['torso', 'head', 'arms', 'legs'],
        encounterSetTarget(npc) { c.calls.push(['target', npc.id]); c.G.activeNPC = npc; },
        selectNPC(npc) { c.calls.push(['select', npc.id]); c.G.activeNPC = npc; c.G.activeNPCMode = 'menu'; },
        attackNPC(npc, options) { c.calls.push(['attack', npc.id, plain(options)]); c.G.activeNPCMode = 'combat'; c.G.combatEncounter ||= encounter; if (c.afterAttack) c.afterAttack(npc); },
        useSecondWind() { c.calls.push(['second wind']); c.textModeNoteCombatTurn({ playerPassed: true }); if (c.afterWind) c.afterWind(); },
        performCombatDefense(_npc, key) { c.calls.push(['defense', key]); c.textModeNoteCombatTurn({ playerPassed: true }); },
        attemptCombatEscape() { c.calls.push(['escape']); c.G.activeNPC = null; c.G.activeNPCMode = null; c.G.combatEncounter = null; },
        attemptTalkDown() {}, bandageInCombat() {}, renderNPCActionMenu() {}, renderCombatTargetMenu() {},
        playerIsSpellcaster: () => !!c.caster, getCastableSpellIds: () => c.spells || [],
        WIZARD_SPELLS: { spark: { name: 'Spark', summary: 'A small bolt.', mana: 3 } },
        getEffectiveSpellManaCost: (_p, spell) => spell.mana,
        castSpellAtNPC(_npc, key) { c.calls.push(['spell', key]); c.player.mana -= c.WIZARD_SPELLS[key].mana; c.textModeNoteCombatTurn({ playerPassed: true }); },
        getUnlearnedBookSpellIds: () => [], getPlayerSpellbooks: () => [],
        getEnchantCombatActions: () => c.enchants || [], getSynergyCombatActions: () => c.synergies || [],
        playerHasDeityPowers: () => !!c.power, getDeityArchetype: () => null, getUsablePowers: () => c.power ? [c.power] : [],
        getDeityPowerManaCost: () => 1, getDeityPowerBlockReason: () => '', getPowerCostLabel: () => '1 mana',
        activateDeityPower() {}, getHealableAllies: () => [ally], entityNeedsHealing: e => e.hp < e.hpMax,
        encEntityKey: e => e.id,
        useDeityPower(_id, _npc, entity) { c.calls.push(['heal', entity ? entity.id : 'self']); c.textModeNoteCombatTurn({ playerPassed: true }); },
        getRogueRank: () => 0, ROGUE_BACKSTAB_MIN_RANK: 1,
        getFighterRank: () => c.fighterRank, FIGHTER_MANEUVERS: {}, FIGHTER_EXTRA_MANEUVERS: {}, FIGHTER_STANCES: {},
        playerHasTechnique: () => true, getManeuverBlockReason: () => c.maneuverBlock || '',
        getFighterManeuverDef: key => c.FIGHTER_MANEUVERS[key],
        attemptManeuver(_npc, key) { c.calls.push(['maneuver', key]); c.textModeNoteCombatTurn({ playerPassed: true }); },
        getStanceBlockReason: () => '', useFighterStance() {}, getSecondWindBlockReason: () => c.windBlock || '',
        COMBAT_ATTACK_STYLES: { light: { staminaCost: 1 }, balanced: { staminaCost: 2 }, heavy: { staminaCost: 4 }, precise: { staminaCost: 2 } },
        COMBAT_STANCES: { defend: { tip: 'Defend to recover stamina.' }, guard: { tip: 'Guard' }, counter: { tip: 'Counter' } },
        canHoldCombatStance: () => !c.winded, getGhostVice: () => null,
        getTotalBleed: () => 0, findBandageInInventory: () => null,
        createCombatButton(label, onClick, options) { return { label, onClick, ...options }; },
        INTERACT_MENU_ACTIONS: [{ id: 'rest', visible: () => true, disabledReason: () => '', run() { c.calls.push(['rest']); } }],
        setExitGridVisible() {}, examineCurrentRoom() { c.calls.push(['look']); }
    };
    c.isPlayerJailed = () => false; c.roomHasActiveHostile = () => false;
    vm.createContext(c);
    vm.runInContext(code + '\n' + registry, c);
    c.state = vm.runInContext('textModeState', c);
    c.setTextMode(true);
    return c;
}

test('canonical combat vocabulary parses flexible order, filler words, aliases, and shorthand', () => {
    const c = harness();
    for (const input of ['attack with light hit to head', 'attack head light', 'light head', 'head light', 'hit the head with a quick strike']) {
        assert.deepEqual(plain(c.parseTextCommand(input)), { verb: 'attack', args: { style: 'light', bodyPart: 'head', target: '' } }, input);
    }
    assert.equal(c.parseTextCommand('heavy head').args.style, 'heavy');
    assert.equal(c.parseTextCommand('attack').args.bodyPart, 'torso');
    assert.equal(c.parseTextCommand('attack').args.style, 'balanced');
    assert.equal(c.parseTextCommand('use second wind').args.ability, 'second wind');
    assert.equal(c.parseTextCommand('second wind').args.ability, 'second wind');
    assert.equal(c.parseTextCommand('say "heavy head, then second wind"').verb, 'say');
    assert.equal(c.parseTextCommand('show attack').verb, 'show');
    assert.equal(c.parseTextCommand('how do I attack heavy head').verb, 'help');
    assert.equal(c.parseTextCommand('attak head light'), null);
});

test('shorthand is combat-only and an AI plan cannot turn it into an unrequested attack', async () => {
    const c = harness(false);
    assert.equal(c.parseTextCommand('heavy head'), null);
    c.aiAvailable = () => true;
    c.callAI = async () => '{"actions":[{"verb":"attack","args":{"style":"heavy","bodyPart":"head"}}]}';
    await c.submitTextModeCommand('heavy head');
    assert.equal(c.calls.length, 0);
    await c.submitTextModeCommand('say "attack" then heavy head');
    assert.equal(c.calls.length, 0);
});

test('attacks use the same handler/options, reject unsupported anatomy and conflicting keywords', async () => {
    const c = harness();
    await c.submitTextModeCommand('heavy head');
    assert.deepEqual(c.calls, [['attack', 'd1', { style: 'heavy', target: 'head' }]]);
    c.foe.nonhumanoid = true;
    await c.submitTextModeCommand('attack arms light');
    await c.submitTextModeCommand('attack light heavy head');
    await c.submitTextModeCommand('attack head torso light');
    assert.equal(c.calls.length, 1);
});

test('shared UI definitions provide ability costs, disabled reasons, callbacks, and primary names', async () => {
    const c = harness();
    const wind = c.textCombatActions().find(a => a.name === 'Second wind');
    assert.equal(wind.primary, 'second wind');
    assert.equal(c.createCombatActionButton(wind).disabled, wind.disabled);
    await c.submitTextModeCommand('second wind');
    await c.submitTextModeCommand('use secondwind');
    assert.deepEqual(c.calls, [['second wind'], ['second wind']]);
    c.windBlock = 'You need 39 more turns to catch a second wind.';
    const disabled = c.textCombatActions().find(a => a.name === 'Second wind');
    assert.equal(c.createCombatActionButton(disabled).disabled, true);
    await c.submitTextModeCommand('second wind then attack head light');
    assert.equal(c.calls.length, 2);
    assert(c.events.at(-1).text.includes('39 more turns'));
    assert(c.state.paused);
});

test('show and how work in both contexts, list current actions, and explain unavailable abilities', async () => {
    const c = harness();
    await c.submitTextModeCommand('show');
    assert(c.events.at(-1).text.includes('Second wind'));
    assert(c.events.at(-1).text.includes('heavy head'));
    assert(!c.events.at(-1).text.includes('Step back'));
    c.windBlock = 'Still cooling down.';
    await c.submitTextModeCommand('show available actions');
    assert(!c.events.at(-1).text.includes('Second wind'));
    await c.submitTextModeCommand('how second wind');
    assert(c.events.at(-1).text.includes('Still cooling down'));
    await c.submitTextModeCommand('show attack');
    assert(c.events.at(-1).text.includes('balanced torso'));
    c.G.activeNPC = null; c.G.activeNPCMode = null;
    await c.submitTextModeCommand('show');
    assert(c.events.at(-1).text.includes('look'));
    assert(!c.events.at(-1).text.includes('Second wind'));
    assert.equal(c.calls.length, 0);
});

test('available spells and learned techniques resolve by name and recheck current resources', async () => {
    const c = harness();
    c.caster = true; c.spells = ['spark'];
    c.FIGHTER_MANEUVERS.disarm = { label: 'Disarm', style: 'precise', stamina: 2, tip: 'Knock a weapon away.' };
    await c.submitTextModeCommand('cast spark');
    assert.deepEqual(c.calls, [['spell', 'spark']]);
    await c.submitTextModeCommand('spark');
    assert.equal(c.calls.length, 1);
    assert(c.events.at(-1).text.includes('mana'));
    await c.submitTextModeCommand('disarm');
    assert.deepEqual(c.calls.at(-1), ['maneuver', 'disarm']);
    c.maneuverBlock = 'You have not learned that.';
    await c.submitTextModeCommand('use disarm');
    assert.equal(c.calls.length, 2);
    await c.submitTextModeCommand('use an invented superpower');
    assert.equal(c.calls.length, 2);
});

test('opponent targeting uses only standing foes, respects ordinals, and never selects an ally', async () => {
    const c = harness();
    await c.submitTextModeCommand('target second dwarf then heavy head');
    assert.deepEqual(c.calls, [['target', 'd2'], ['attack', 'd2', { style: 'heavy', target: 'head' }]]);
    await c.submitTextModeCommand('attack Companion light head');
    assert.equal(c.calls.length, 2);
    await c.submitTextModeCommand('target dwarf');
    assert.equal(c.state.pending.kind, 'target');
    c.other.hidden = true;
    await c.submitTextModeCommand('2');
    assert.equal(c.calls.length, 2);
});

test('explicit attacks outside combat clarify the NPC before starting a fight', async () => {
    const c = harness(false);
    await c.submitTextModeCommand('attack dwarf head light');
    assert(c.state.pending);
    assert.equal(c.calls.length, 0);
    await c.submitTextModeCommand('3');
    assert(c.state.pending);
    await c.submitTextModeCommand('2');
    assert.deepEqual(c.calls, [['select', 'd2'], ['attack', 'd2', { style: 'light', target: 'head' }]]);
});

test('combat queues recheck cooldowns and stop after automatic retargeting, escape, or reinforcements', async () => {
    for (const change of ['cooldown', 'target', 'escape', 'reinforcement']) {
        const c = harness();
        if (change === 'cooldown') {
            c.afterWind = () => { c.windBlock = 'Cooldown.'; };
            await c.submitTextModeCommand('second wind then second wind then heavy head');
            assert.deepEqual(c.calls, [['second wind']]);
        } else if (change === 'target') {
            c.afterAttack = () => { c.foe.hp = 0; c.G.activeNPC = c.other; };
            await c.submitTextModeCommand('heavy head then light head');
            assert.equal(c.calls.length, 1);
        } else if (change === 'escape') {
            await c.submitTextModeCommand('escape then look');
            assert.deepEqual(c.calls, [['escape']]);
        } else {
            c.afterAttack = () => { const joined = { ...c.other, id: 'new' }; c.room.creatures.push(joined); c.G.combatEncounter.foes.push(joined); };
            await c.submitTextModeCommand('heavy head then light head');
            assert.equal(c.calls.length, 1);
        }
        assert(c.state.paused, change);
        assert(c.state.queue.length, change);
    }
});

test('queued actions wait for narration completion, and stop preserves the current completed turn', async () => {
    const c = harness();
    const session = {};
    c.afterAttack = () => c.textModeTrackCombatNarration(session);
    const run = c.submitTextModeCommand('heavy head then second wind');
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    assert.equal(c.calls.length, 1);
    assert.equal(c.state.busy, true);
    await c.submitTextModeCommand('show');
    await c.submitTextModeCommand('stop');
    session.textCommandDone();
    await run;
    assert.equal(c.calls.length, 1);
    assert.equal(c.state.busy, false);
});

test('healing target choices share their definitions with the UI and revalidate a chosen ally', async () => {
    const c = harness();
    c.power = { id: 'heal', name: 'Healing touch', heal: { ally: true }, summary: 'Restore health.' };
    await c.submitTextModeCommand('use healing touch');
    assert.equal(c.state.pending.kind, 'abilityTarget');
    await c.submitTextModeCommand('2');
    assert.deepEqual(c.calls, [['heal', 'a1']]);
    await c.submitTextModeCommand('healing touch');
    c.ally.hp = c.ally.hpMax;
    await c.submitTextModeCommand('2');
    assert.equal(c.calls.length, 1);
});

test('typed actions rejected by a late handler check do not advance the remaining queue', async () => {
    const c = harness();
    c.useSecondWind = () => { c.calls.push(['late rejection']); };
    await c.submitTextModeCommand('second wind then heavy head');
    assert.deepEqual(c.calls, [['late rejection']]);
    assert(c.state.paused);
});

test('AI attack plans accept only registered style/part fields and combat output excludes debug rows', () => {
    const c = harness();
    assert(c.validateTextAIPlan({ actions: [{ verb: 'attack', args: { style: 'heavy', bodyPart: 'head' } }] }));
    for (const args of [{ style: '__proto__' }, { style: 'nuclear' }, { bodyPart: 'invented' }, { damage: '999' }]) assert.equal(c.validateTextAIPlan({ actions: [{ verb: 'attack', args }] }), null);
    c.textModePublishCombat([{ text: 'You strike.', debug: false }, { text: '[Roll] 20', debug: true }]);
    assert.equal(c.events.at(-1).kind, 'combat');
    assert.equal(c.events.at(-1).text, 'You strike.');
});

test('custom techniques have a stable primary command and optional aliases independent of their label', async () => {
    const c = harness();
    c.synergies = [c.combatActionDescriptor('A newly devised technique (3 stamina)', () => { c.calls.push(['surge']); c.textModeNoteCombatTurn({}); }, { primary: 'surge', aliases: ['resurge'] })];
    await c.submitTextModeCommand('resurge');
    await c.submitTextModeCommand('use surge');
    assert.deepEqual(c.calls, [['surge'], ['surge']]);
    await c.submitTextModeCommand('show');
    assert(c.events.at(-1).text.includes('type surge'));
});

test('unrecognized combat phrasing falls back to a validated plan using the shared action vocabulary', async () => {
    const c = harness();
    c.aiAvailable = () => true;
    c.callAI = async options => { c.aiPrompt = options.instruction; return '{"actions":[{"verb":"attack","args":{"style":"light","bodyPart":"head"}}]}'; };
    await c.submitTextModeCommand('attak head light');
    assert.deepEqual(c.calls, [['attack', 'd1', { style: 'light', target: 'head' }]]);
    assert(c.aiPrompt.includes('Second wind'));
    assert(c.aiPrompt.includes('bodyPart'));
});

test('a slow AI combat plan is discarded when the round or roster changes', async () => {
    for (const change of ['round', 'roster']) {
        const c = harness();
        let resolve;
        c.aiAvailable = () => true;
        c.callAI = () => new Promise(done => { resolve = done; });
        const run = c.submitTextModeCommand('attak head light');
        if (change === 'round') c.G.combatEncounter.round = 2;
        else { const newcomer = { ...c.foe, id: 'new' }; c.room.creatures.push(newcomer); c.G.combatEncounter.foes.push(newcomer); }
        resolve('{"actions":[{"verb":"attack","args":{"style":"light","bodyPart":"head"}}]}');
        await run;
        assert.equal(c.calls.length, 0);
    }
});
