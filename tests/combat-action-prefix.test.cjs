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
function harness() {
    const player = { name: 'Aldric', hp: 20, mana: 20 };
    const c = { G: { player }, player, window: {}, rand: list => list[0],
        withIndefiniteArticle: text => 'a ' + text };
    vm.createContext(c);
    vm.runInContext(section('const STRIKE_VERBS_BY_WEAPON =', 'function getEntityWeaponProfile('), c);
    return c;
}
function strike(extra = {}) {
    return { attackerName: 'Aldric', attackerIsPlayer: true,
        defenderName: 'Goblin', defenderIsPlayer: false, targetKey:'torso',
        weapon: { name:'warhammer', type:'hammer' }, damageType:'blunt',
        damage:11, hpLost:11, hpMax:20, ...extra };
}

test('hits, misses and finishing blows attribute the acting player, even when the target dodges', () => {
    const c = harness();
    for (const line of [c.buildStrikeHitLine(strike()), c.buildStrikeMissLine(strike()), c.buildFinishingBlowLine(strike(), 'unconscious')]) {
        assert.match(line, /^\(Player\) → \(Goblin\) /);
        assert.equal((line.match(/→/g) || []).length, 1);
    }
    assert.match(c.buildStrikeHitLine(strike()), /11 damage/);
});

test('incoming weapon and natural attacks retain the correct actor when narration describes a dodge', () => {
    const c = harness();
    const ctx = strike({ attackerName:'Goblin', attackerIsPlayer:false, defenderName:'Aldric', defenderIsPlayer:true });
    for (const line of [c.buildStrikeHitLine(ctx), c.buildStrikeMissLine(ctx), c.buildFinishingBlowLine(ctx)]) {
        assert.match(line, /^\(Goblin\) → \(Player\) /);
    }
    assert.equal(c.buildStrikeMissLine({ ...ctx, naturalMode:{miss:['You sidestep {A}\'s bite.']} }),
        "(Goblin) → (Player) You sidestep Goblin's bite.");
});

test('watched NPC fights use each combatant name, including natural misses', () => {
    const c = harness();
    const ctx = strike({ attackerName:'Guard', attackerIsPlayer:false, defenderName:'Wolf', watched:true });
    for (const line of [c.buildWatchedStrikeHitLine(ctx), c.buildWatchedStrikeMissLine(ctx), c.buildFinishingBlowLine(ctx, 'unconscious'),
        c.buildWatchedStrikeMissLine({ ...ctx, naturalMode:{watchedMiss:['{D} evades {A}.']} })]) {
        assert.match(line, /^\(Guard\) → \(Wolf\) /);
    }
});

test('self and ally targets are explicit; empty and debug rows are never labelled', () => {
    const c = harness();
    assert.equal(c.formatCombatActionLine(c.player, c.player, 'You drink a potion.'), '(Player) → (Player) You drink a potion.');
    assert.equal(c.formatCombatActionLine(c.player, {name:'Mira'}, 'You heal Mira.'), '(Player) → (Mira) You heal Mira.');
    for (const line of ['', '  ', '[Roll] Attack: 12 -> Hit', '[Skills] +1 Endurance', '[Technique] d8(4)', '[Power] Damage']) {
        assert.equal(c.formatCombatActionLine(c.player, 'Goblin', line), line);
    }
});

test('area spells attribute secondary enemies without labelling their status effects', () => {
    const c = harness();
    const enemies = [{name:'Wolf', hp:10}, {name:'Goblin', hp:10}];
    Object.assign(c, { getOtherHostiles:()=>enemies, ensureCombatState() {},
        dealSpellDamage:()=>({damage:3}), applyNPCImpact() {}, isEntityCollapsed:()=>false,
        applySpellSecondaryEffects(npc, spell, lines) { lines.push(`${npc.name} is stunned!`); } });
    vm.runInContext(section('function applySpellToOthers(', '// Self, utility and debuff spells'), c);
    const lines = [];
    c.applySpellToOthers({}, {name:'Lightning', chain:{jumps:2,die:4}}, lines);
    assert.deepEqual(lines, ['(Player) → (Wolf) Lightning catches Wolf for 3.', 'Wolf is stunned!',
        '(Player) → (Goblin) Lightning catches Goblin for 3.', 'Goblin is stunned!']);
});

test('support spells distinguish self buffs from hostile casts and leave statuses unprefixed', () => {
    const c = harness();
    Object.assign(c, { WIZARD_SPELLS:{shield:{castLine:'You cast Shield.',selfStatus:'shield'}, hex:{castLine:'You cast Hex.',debuffTarget:'hex',hitLine:'The hex catches {name}.'}},
        playerUsesMana:()=>true, getCastableSpellIds:()=>['shield','hex'], getSpellCastCost:()=>1,
        beginSpellRound:()=>true, spendPlayerMana() {}, applyStatusEffect:(who, status)=>`${who.name} gains ${status}.`,
        trackCombatSkillGain() {}, gainClassSkillXP() {}, gainBranchXP() {}, finishSpellRound(npc, lines) { c.lastLines=lines; } });
    vm.runInContext(section('function castSupportSpell(', '// ── Enchanting'), c);
    const npc = {name:'Goblin'};
    c.castSupportSpell(npc, 'shield');
    assert.deepEqual(Array.from(c.lastLines), ['(Player) → (Player) You cast Shield.', 'Aldric gains shield.']);
    c.castSupportSpell(npc, 'hex');
    assert.deepEqual(Array.from(c.lastLines), ['(Player) → (Goblin) You cast Hex.', 'Goblin gains hex.', '(Player) → (Goblin) The hex catches Goblin.']);
});

test('divine casts use the chosen healing target and keep noncombat casts unchanged', () => {
    const code = section('    const powerTarget = power.heal ?', '    firstUseLines.forEach');
    function cast(power, inCombat, healTarget) {
        const c = harness();
        Object.assign(c, { power:{castLine:'You call on your patron.', ...power}, npc:{name:'Goblin'}, inCombat, healTarget, lines:[] });
        vm.runInContext(code, c);
        return c.lines[0];
    }
    assert.equal(cast({heal:{}},true,{name:'Mira'}), '(Player) → (Mira) You call on your patron.');
    assert.equal(cast({heal:{party:true}},true), '(Player) → (Party) You call on your patron.');
    assert.equal(cast({buff:'ward'},true), '(Player) → (Player) You call on your patron.');
    assert.equal(cast({damage:{}},true), '(Player) → (Goblin) You call on your patron.');
    assert.equal(cast({buff:'ward'},false), 'You call on your patron.');
});

test('names and damage remain plain text through the typewriter, with supporting rows unchanged', () => {
    const c = harness();
    c.document = { createElement:()=>({className:''}), createTextNode:()=>({}) };
    vm.runInContext(section('function buildCombatNarrationParts(', '// Keeps the newest combat line'), c);
    const rows = [c.buildStrikeHitLine(strike({defenderName:'<Goblin>'})), '[Roll] Attack: 12 -> Hit',
        'You feel poison creeping through your veins.', 'Your Endurance increases, restoring 2 HP.'];
    for (const text of rows) {
        const el = { children:[], appendChild(child) { this.children.push(child); } };
        const parts = c.buildCombatNarrationParts(el, text, text.startsWith('['));
        for (const count of [1,10,text.length]) {
            c.setCombatNarrationRowText({parts}, count);
            assert.equal(parts.map(p=>p.el.textContent).join(''), text.slice(0,count));
        }
        if (text.startsWith('(')) assert.equal(parts.filter(p=>p.el.className==='combat-damage').length,1);
    }
    assert.match(rows[0], /^\(Player\) → \(<Goblin>\) /);
    assert.doesNotMatch(rows.slice(1).join('\n'), /→/);
});
