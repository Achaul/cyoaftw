const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const corePath = process.argv[2] || 'C:/Git/CYOADEV/cyoaftw-engine-CORE.js';
const source = fs.readFileSync(corePath, 'utf8').replace(/\r\n/g, '\n');
function extract(start, end) {
    const first = source.indexOf(start), last = source.indexOf(end, first);
    assert.ok(first >= 0 && last > first, 'Missing source section: ' + start);
    return source.slice(first, last);
}
function element() {
    return {
        children: [], style: {}, textContent: '', classList: { add() {}, remove() {} },
        appendChild(child) { this.children.push(child); },
        set innerHTML(value) { assert.equal(value, ''); this.children = []; }
    };
}
function harness(state = 'unconscious', kind = 'green') {
    const elements = Object.fromEntries(['chatOptionsEl', 'npcPlaceholderEl', 'npcDetailEl', 'npcDetailNameEl', 'npcDetailBehaviorEl', 'npcMoodEl', 'npcRoleEl', 'npcFavorEl'].map(id => [id, element()]));
    let uid = 0;
    const slime = { id: 'slime', name: 'Moss slime', species: 'slime', hp: state === 'corpse' ? 0 : 1, hpMax: 10,
        anatomy: { body: { color: kind } }, objectType: 'body', bodyState: state,
        description: 'The torso is torn and bleeding.', bleedingOut: true, nsfwActionsRevealed: true,
        lastDamageType: 'puncture', combatState: { limbs: { torso: { hp: 0, max: 4, bleed: 3 }, arms: { severed: true } } }, inventory: [] };
    const room = { coords: '0,0', items: [slime], creatures: [] };
    const c = {
        console, window: {}, G: { player: { name: 'Mira', inventory: [], equipped: {}, rucksack: null, _baselineClothingSeeded: true }, activeRoom: room },
        document: { getElementById: id => elements[id], createElement: element },
        assignLootUID(item) { item._uid = item._uid || 'test-' + ++uid; item.id = item.id || item._uid; return item; },
        getItemName: item => item.name || 'item', getEntityName: item => item.originalName || item.name || 'slime',
        isPotionItem: () => false, capitaliseFirst: text => text[0].toUpperCase() + text.slice(1),
        getBodyCarryBlockReason: () => '', getBodyDragBlockReason: () => '', getBodyResurrection: () => null,
        findHealingPotionInInventory: () => null, findRopeInInventory: () => null, appendTrophyActions() {}, describeHaulRollNeed: () => '',
        createCombatButton(label, onclick, options = {}) { const button = element(); button.textContent = label; button.onclick = onclick; Object.assign(button, options); return button; },
        appendCombatGroup(parent, label, buttons) { buttons.forEach(button => parent.appendChild(button)); },
        setNarration(text) { c.narration = text; }, saveGameState() { c.saves = (c.saves || 0) + 1; },
        renderStats() {}, renderNPCPortrait() {}, clearChatLog() {}, setExitGridVisible() {},
        advanceStoryTurn(turns) { c.turns = (c.turns || 0) + turns; },
        isEntityIncorporeal: () => false, getBodyKind: () => null, getCurrentStoryTurn: () => 9,
        BODY_DAMAGE_PHRASES: { puncture: { unconscious: 'Puncture wounds mark their body.', corpse: 'Wounds are crusted with blood.' } },
        BODY_ELEMENT_TYPES: [], renderBodyLootGroup() { c.lootRendered = true; },
        formatInventoryItemLabel: (item, count) => item.name + (count > 1 ? ' x' + count : '')
    };
    c.window.appendUnconsciousBodyActions = () => { throw new ReferenceError('getAction is not defined'); };
    c.window.describeUnconsciousBodyExamine = () => { throw new Error('A slime must not use a humanoid examine hook'); };
    vm.createContext(c);
    for (const [start, end] of [
        ['function cloneLootTemplate(', 'function pickLootQuality('],
        ['function ensurePlayerEquipmentState(', 'function isPotionItem('],
        ['const SLIME_VARIANTS =', 'const NATURAL_SLIME_ENGULF ='],
        ['function getSlimeKindWord(', 'async function fetchSlimeReachNarrative('],
        ['const SLIME_SCOOP_HP_PER_UNIT =', 'function getSlimeScoopBlockReason('],
        ['function getTotalBleed(', 'function clearAllBleeding('],
        ['function describeCombatWounds(', 'function consumeLuckyRoll('],
        ['function isNsfwBodyEligible(', '// -- ROOM AGGRESSION'],
        ['function selectRoomObject(', '// ── ROOM FIXTURES'],
        ['function isSlimeRemains(', 'function getBodyLootRows('],
        ['function examineRoomObject(', 'function collectBodyLoot(']
    ]) vm.runInContext(extract(start, end), c);
    // This small player setup leaves a hand slot for the empty vial. Other
    // containers are force-stowed to exercise the real inventory/stack helpers.
    const empty = c.createEmptyContainer('empty-vial');
    c.G.player.inventory.push(empty);
    c.restowPlayerPack(c.G.player);
    return { c, slime, room, elements, buttons: () => elements.chatOptionsEl.children };
}
function test(name, fn) { fn(); console.log('PASS ' + name); }

test('clicking and examining unconscious or dead slime never invokes humanoid body action hooks', () => {
    for (const state of ['unconscious', 'corpse']) {
        const { c, slime, elements, buttons } = harness(state);
        assert.doesNotThrow(() => c.selectRoomObject(slime));
        assert.equal(buttons().some(button => button.textContent === 'Collect some slime'), false);
        assert.doesNotThrow(() => buttons().find(button => button.textContent === 'Examine').onclick());
        assert.ok(buttons().some(button => button.textContent === 'Collect some slime'));
        assert.doesNotMatch(c.narration, /torso|blood|arms?|legs?|head|skin|flesh|bones?/i);
        assert.doesNotMatch(elements.npcDetailBehaviorEl.textContent, /torso|blood|arms?|legs?|head|skin|flesh|bones?/i);
        assert.ok(buttons().some(button => button.textContent === 'Search'));
        assert.ok(buttons().some(button => button.textContent === 'Carry'));
        assert.ok(buttons().some(button => button.textContent === 'Drag'));
        assert.ok(!buttons().some(button => /Bind \(hands/.test(button.textContent)));
        assert.equal(slime.bleedingOut, false);
        assert.equal(c.describeCombatWounds(slime), '');
        assert.equal(c.getTotalBleed(slime), 0);
    }
});

test('newly defeated slimes get jelly descriptions, names and no bleeding-out state', () => {
    for (const state of ['unconscious', 'corpse']) {
        const { c, slime, room } = harness(state);
        room.items = []; room.creatures = [slime];
        c.moveDefeatedNPCToRoomObject(slime, state);
        assert.ok(room.items.includes(slime));
        assert.ok(!room.creatures.includes(slime));
        assert.equal(slime.bleedingOut, false);
        assert.match(slime.description, /jelly/);
        assert.doesNotMatch(slime.description, /torso|blood|arms?|legs?|head|skin|flesh|bones?/i);
        assert.match(slime.name, state === 'corpse' ? /^remains of/ : /^unconscious/);
    }
});

test('all elemental and physical defeat descriptions avoid humanoid anatomy', () => {
    const { c, slime } = harness();
    for (const damage of ['edge', 'puncture', 'blunt', 'fire', 'frost', 'shock', 'holy', 'shadow', 'poison', 'earth', 'wind', 'arcane', 'water']) {
        slime.lastDamageType = damage;
        for (const state of ['corpse', 'unconscious']) {
            const text = c.buildBodyDescription(slime, 'Moss slime', state, 'Blood covers its torso.');
            assert.match(text, /jelly/);
            assert.doesNotMatch(text, /torso|blood|arms?|legs?|head|skin|flesh|bones?/i, damage);
        }
    }
});

test('both examine views collect a correctly typed sample, consume one empty and spend one turn', () => {
    for (const state of ['corpse', 'unconscious']) {
        for (const [color, kind] of [['green', 'acidic'], ['purple', 'poisonous'], ['blue', 'icy'], ['grey', 'grey']]) {
            const { c, slime, buttons } = harness(state, color);
            c.examineRoomObject(slime);
            buttons().find(button => button.textContent === 'Collect some slime').onclick();
            const scoop = buttons().find(button => button.textContent.startsWith('Collect in:'));
            assert.ok(scoop);
            scoop.onclick();
            const inventory = c.G.player.inventory;
            assert.equal(inventory.length, 1);
            assert.equal(inventory[0].slime.kind, kind);
            assert.equal(inventory[0].slime.units, 1);
            assert.equal(inventory[0].container.emptyId, 'empty-vial');
            assert.equal(c.getFillableEmptyEntries().length, 0);
            assert.equal(slime.slimeUnitsRemaining, 4);
            assert.equal(slime.hp, state === 'corpse' ? 0 : 1);
            assert.equal(slime.bodyState, state);
            assert.equal(c.turns, 1);
            assert.equal(c.G.activeObject, slime);
            assert.match(c.narration, /collect some jelly/);
        }
    }
});

test('sampling is finite, persists in a save, and rejects a stale or distant target', () => {
    const { c, slime, room } = harness('corpse');
    slime.slimeUnitsRemaining = 1;
    const key = c.getFillableEmptyEntries()[0].key;
    room.items = [];
    c.collectSlimeRemains(slime, key);
    assert.equal(c.getFillableEmptyEntries().length, 1);
    assert.equal(c.turns, undefined);
    room.items = [slime];
    c.collectSlimeRemains(slime, key);
    assert.equal(slime.slimeUnitsRemaining, 0);
    const restored = JSON.parse(JSON.stringify(slime));
    assert.equal(c.getSlimeRemainsUnits(restored), 0);
    c.G.player.inventory.push(c.createEmptyContainer('empty-vial'));
    c.restowPlayerPack(c.G.player);
    c.collectSlimeRemains(slime, c.getFillableEmptyEntries()[0].key);
    assert.match(c.narration, /no more jelly/);
    assert.equal(c.turns, 1);
    assert.equal(c.getFillableEmptyEntries().length, 1);
});

test('missing or oversized containers are disabled and collecting never starts combat', () => {
    const { c, slime, buttons } = harness('corpse');
    c.G.player.inventory = [];
    c.examineRoomObject(slime);
    let collect = buttons().find(button => button.textContent === 'Collect some slime');
    assert.equal(collect.disabled, true);
    assert.match(collect.title, /empty vial, flask or bottle/);
    c.G.player.inventory.push(c.createEmptyContainer('empty-bottle'));
    c.restowPlayerPack(c.G.player);
    slime.slimeUnitsRemaining = 2;
    c.openSlimeRemainsScoopMenu(slime);
    const bottle = buttons().find(button => button.textContent.startsWith('Collect in:'));
    assert.equal(bottle.disabled, true);
    bottle.onclick();
    assert.match(c.narration, /not enough jelly/);
    assert.equal(c.turns, undefined);
    c.G.activeNPCMode = 'combat';
    assert.match(c.getSlimeRemainsScoopBlockReason(slime), /Finish the fight/);
    c.openSlimeRemainsScoopMenu(slime);
    assert.equal(c.G.activeNPCMode, 'combat');
    assert.match(c.narration, /Finish the fight/);
});

test('ordinary bodies keep their normal description, bleeding and humanoid hooks', () => {
    const { c, slime } = harness();
    slime.species = 'human';
    assert.match(c.buildBodyDescription(slime, 'Bandit', 'corpse'), /body|blood/);
    assert.equal(c.getTotalBleed(slime), 3);
    let called = false;
    c.window.appendUnconsciousBodyActions = () => { called = true; };
    c.renderRoomObjectActionMenu(slime);
    assert.equal(called, true);
});

console.log('Slime remains checks passed.');
