const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const source = fs.readFileSync(process.argv[2] || 'C:/Git/CYOADEV/cyoaftw-engine-CORE.js', 'utf8').replace(/\r\n/g, '\n');
function section(start, end) {
    const first = source.indexOf(start), last = source.indexOf(end, first);
    assert.ok(first >= 0 && last > first, start);
    return source.slice(first, last);
}
function harness(hp = 20) {
    const player = { name: 'Player', hp, hpMax: 20, stats: { endurance: 3 }, skills: { statXP: { endurance: 0 } } };
    const c = { player, G: { player, combatRollDebugMode: true }, window: {},
        COMBAT_TARGETS: { torso: { limbKey: 'torso' } }, BODY_ELEMENT_TYPES: ['fire','frost','shock','water','wind'],
        ensureCombatState(entity) { return entity.combatState ||= { limbs: { torso: { hp: 100, max: 100 } } }; },
        hasActiveStatusEffect: (entity, key) => !!entity[key],
        normalizeDamageElement: type => ['fire','frost','shock','water','wind'].includes(type) ? type : null,
        getComboMult: () => 1.5, isEntityWet: entity => !!entity.wetRounds,
        wearPlayerGearFromHit() {}, getBodyKind: () => null, syncCombatWoundMemory() {},
        isEntityIncorporeal: () => false, rollComboRounds: () => 3,
        rand: array => array[0], getStrikeVerbList: () => ['hit'], conjugateStrikeVerb: () => 'hits',
        withIndefiniteArticle: name => 'a ' + name, getStrikeTails: () => ({glancing:[''],solid:[''],heavy:[''],brutal:['']}),
        getStrikeAftermathClause: () => '',
        consumeArmorBuffHits() {}, speciesSurviveLethal() {}, applyNPCElementRider() {},
        isEntityCollapsed: entity => entity.hp <= 0, buildFinishingBlowLine: ctx => c.buildStrikeHitLine(ctx),
        buildStrikeSeverLine: () => 'Severed',
        ensureCombatSkills: entity => entity.skills, getStatLevelXPThreshold: () => 1,
        getFrameStatXPMultiplier: () => 1,
        ENDURANCE_HP_PER_LEVEL: 2, applyStaminaLevelGain() {}, applyManaLevelGain() {}, applyFaithDelta() {},
        playerHasActiveStatus: (entity, key) => !!entity[key], playerUsesMana: () => true,
        removeStatusEffect(entity, key) { delete entity[key]; }
    };
    c.window.G = c.G;
    vm.createContext(c);
    for (const [start, end] of [
        ['function getElementComboRule(', '// Ghosts shrug off plain weapons'],
        ['function isPlayerPhysicallyWarded(', 'function getWoundAttackPenalty('],
        ['function getStrikeDamageTier(', 'function getStrikeDamageClass('],
        ['function getStrikePartWord(', 'function getStrikeDamageTier('],
        ['function getStrikeDamageClass(', 'function fillStrikeTemplate('],
        ['function getCombatActionLabel(', 'function buildStrikeHitLine('],
        ['function buildStrikeHitLine(', 'function buildStrikeMissLine('],
        ['function applyEnduranceLevelHpGain(', '// Player-only for now'],
        ['function maybeLevelUpStat(', '// gain: { weaponType?'],
        ['function trackCombatSkillGain(', 'function formatSkillGainDebug('],
        ['function formatSkillGainDebug(', '// -- COMBAT SKILL IMPACT'],
        ['function absorbDamageWithManaShield(', '// Overcharge and Spellbreak']
    ]) vm.runInContext(section(start, end), c);
    c.hit = function (damage, blocked = 0) {
        Object.assign(c, { counterDamage: damage, blocked, npcPlan: { target:'torso' }, counterRoll: 12,
            elemAtk: null, npc: {}, npcName: 'Goblin', npcWeapon: { name:'warhammer', type:'hammer' },
            naturalMode: null, damageType:'blunt', lines: [] });
        vm.runInContext(section('        const damageResult = counterDamage > 0 ? applyCombatDamage(player',
            '        if (!isEntityCollapsed(player)) applyNPCPoisonOnHit'), c);
        return c.lines.join('\n');
    };
    return c;
}

test('incoming strike narration reports damage after gear reduction and absorption separately', () => {
    const c = harness();
    const line = c.hit(12 - 1, 1);
    assert.equal(c.player.hp, 9);
    assert.match(line, /\(11 damage; HP 20 → 9; 1 absorbed by gear\)/);
});

test('the final elemental combo damage reaches incoming strike narration', () => {
    const c = harness(30);
    c.player.frozen = {};
    const line = c.hit(12);
    assert.equal(c.player.hp, 12);
    assert.match(line, /\(18 damage; HP 30 → 12\)/);
    assert.doesNotMatch(line, /\(12 damage/);
});

test('overkill reports HP actually removed while impact and limb damage keep their full value', () => {
    const c = harness(11);
    const result = c.applyCombatDamage(c.player, 12, 'torso', { damageType:'blunt' });
    assert.equal(result.damage, 12);
    assert.equal(result.hpLost, 11);
    assert.equal(c.player.hp, 0);
    assert.equal(c.player.combatState.limbs.torso.hp, 94);
    const d = harness(11);
    assert.match(d.hit(12), /\(11 damage; HP 11 → 0\)/);
});

test('divine ward removes no HP, and fully shielded hits never claim HP damage', () => {
    const c = harness();
    c.player.divineWard = true;
    const result = c.applyCombatDamage(c.player, 12, 'torso', { damageType:'blunt' });
    assert.equal(result.hpLost, 0);
    assert.equal(result.damage, 0);
    assert.equal(c.player.hp, 20);
    const d = harness();
    assert.equal(d.hit(0), '');
    assert.equal(d.player.hp, 20);
});

test('mana shield absorption is separate from the actual HP loss', () => {
    const c = harness();
    Object.assign(c.player, { mana: 1, manaShield: true });
    const shieldLines = [];
    const shield = c.absorbDamageWithManaShield(c.player, 12, shieldLines);
    assert.equal(shield.remaining, 11);
    assert.equal(shield.absorbed, 1);
    assert.match(shieldLines[0], /soaks up 1 damage/);
    assert.match(c.hit(shield.remaining), /\(11 damage; HP 20 → 9\)/);
    assert.equal(c.player.hp, 9);
});

test('Endurance healing is identified separately and does not change the hit damage', () => {
    const c = harness(16);
    const line = c.hit(12);
    vm.runInContext(section('        const playerHitGain = trackCombatSkillGain(player, { statKey: "endurance" });', '        // Grit:'), c);
    const leveledUp = vm.runInContext('playerHitGain.leveledUp', c);
    assert.equal(c.player.hp, 6);
    assert.equal(c.player.hpMax, 22);
    assert.equal(leveledUp.hpGained, 2);
    assert.match(line, /\(12 damage; HP 16 → 4\)/);
    const debug = c.formatSkillGainDebug('Player', { statKey:'endurance', statXP:0, leveledUp });
    assert.match(debug, /\(\+2 HP and max HP\)/);
    assert.match(c.lines.join('\n'), /Your Endurance increases, restoring 2 HP and adding 2 max HP \(HP 4 → 6\)/);
});

test('damage highlighting excludes absorbed amounts and never parses narration as HTML', () => {
    const c = harness();
    c.document = { createElement: () => ({ className:'' }), createTextNode: () => ({}) };
    vm.runInContext(section('function buildCombatNarrationParts(', 'function setCombatNarrationRowText('), c);
    const el = { children:[], appendChild(child) { this.children.push(child); } };
    const text = '<Goblin> hits you (11 damage; 1 absorbed by gear). Your mana shield soaks up 1 damage.';
    const parts = c.buildCombatNarrationParts(el, text, false);
    assert.equal(parts.map(p=>p.text).join(''), text);
    assert.deepEqual(Array.from(parts.filter(p=>p.el.className==='combat-damage'), p=>p.text), ['11 damage']);
});
