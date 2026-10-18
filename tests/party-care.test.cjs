const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const source = fs.readFileSync(process.argv[2] || 'C:/Git/CYOADEV/cyoaftw-engine-CORE.js', 'utf8').replace(/\r\n/g, '\n');
function section(start, end) {
    const a = source.indexOf(start), b = source.indexOf(end, a);
    assert(a >= 0 && b > a, start);
    return source.slice(a, b);
}
function entity(name, overrides = {}) {
    return { name, hp: 20, hpMax: 20, stamina: 10, staminaMax: 10, inventory: [], stats: { willpower: 3 }, ...overrides };
}
function harness() {
    const player = entity('Player');
    const ally = entity('Mira');
    const room = { zone: 'Town', coords: '0,0', items: [], structural: [], creatures: [ally] };
    const menu = { children: [], set innerHTML(value) { assert.equal(value, ''); this.children = []; } };
    const c = {
        console, window: {}, G: { player, activeRoom: room, partyMembers: [ally], sessionFollowers: [] },
        document: { getElementById: id => id === 'chatOptionsEl' ? menu : null },
        turn: 0, saves: 0, notes: [], hostile: false,
        REST_MANA_PER_TURN_DESIGNATED: 3, REST_MANA_PER_TURN_UNDESIGNATED: 1, PLAYER_STAMINA_MAX: 10,
        getCurrentStoryTurn: () => c.turn,
        advanceStoryTurn(n) { c.turn += n; if (c.afterTurn) c.afterTurn(); },
        runNPCAutonomyTick() {}, roomHasActiveHostile: () => c.hostile,
        isRoomCollapsed: () => false, isPlayerJailed: () => false, isRestfulRoom: () => false,
        getClassPerk: (e, key, fallback) => e.perks && e.perks[key] || fallback,
        getFaithPathDef: () => null, getEquippedAffinityTotal: () => 0,
        playerUsesMana: e => !!e.manaMax, getPlayerManaCeiling: e => Math.max(0, (e.manaMax || 0) - (e.manaReserved || 0)),
        ensureEntityStamina(e) { if (e.staminaMax === undefined) e.staminaMax = 10; if (e.stamina === undefined) e.stamina = e.staminaMax; },
        restoreEntityStamina(e, amount) { c.ensureEntityStamina(e); const before = e.stamina; e.stamina = Math.min(e.staminaMax, before + amount); return e.stamina - before; },
        restorePlayerMana(e, amount) { if (!c.playerUsesMana(e)) return 0; const before = e.mana; e.mana = Math.min(c.getPlayerManaCeiling(e), e.mana + amount); return e.mana - before; },
        spendPlayerMana(e, n) { if ((e.mana || 0) < n) return false; e.mana -= n; return true; },
        spendEntityStamina(e, n) { e.stamina -= n; },
        speciesNeedsRest: e => !!e.speciesTired, resetSpeciesRestState(e) { e.speciesTired = false; },
        ensureCombatState(e) { return e.combatState ||= { limbs: {} }; },
        getTotalBleed: e => Object.values(e.combatState && e.combatState.limbs || {}).reduce((sum, limb) => sum + (limb.bleed || 0), 0),
        getWoundedLimbList: e => Object.values(e.combatState && e.combatState.limbs || {}).filter(limb => limb.severed || limb.hp / limb.max <= 0.65).map(limb => ({ level: limb.severed ? 'severed' : 'wounded' })),
        clearAllBleeding(e) { Object.values(e.combatState && e.combatState.limbs || {}).forEach(limb => { limb.bleed = 0; }); },
        syncCombatWoundMemory() {},
        hasActiveStatusEffect: (e, key) => !!(e.effects && e.effects[key]),
        removeStatusEffect(e, key) { if (e.effects) delete e.effects[key]; },
        applyStatusEffect(e, key) { (e.effects ||= {})[key] = true; return ''; },
        queueTurnNote: line => c.notes.push(line),
        restoreCompanionMembership(e) { if (!c.G.partyMembers.includes(e)) c.G.partyMembers.push(e); },
        renderStats() {}, renderInteractSidePanels() {}, scheduleGuideArrival() {}, schedulePressureEvent() {},
        renderNarrationWithRoomObservations(r, text) { c.narration = text; }, setNarration(text) { c.narration = text; },
        saveGameState() { c.saves++; }, triggerRoomAmbush() { c.ambushed = true; },
        createCombatButton(label, onClick, options = {}) { return { label, onClick, ...options }; },
        appendCombatGroup(el, label, buttons) { el.children.push({ label, buttons }); }, renderNPCActionMenu() {},
        unpackAllContainers(e) {
            for (let i = 0; i < e.inventory.length; i++) {
                const item = e.inventory[i]; if (Array.isArray(item.packed)) { e.inventory.push(...item.packed); item.packed = []; }
            }
        },
        getItemName: e => e.name, getItemQuantity: e => e.quantity || 1,
        cloneItemForStackAmount: (item, quantity) => ({ ...item, quantity }),
        isSpiritsItem: e => !!e.spirits, isHerbItem: e => !!e.herb, getHerbKey: e => e.herb,
        isPotionItem: e => e.statusKey === 'potionHealth', getEmptyContainerId: e => e.emptyId || '', createEmptyContainer: id => ({ name: id }),
        encSupportRank: e => e.clericRank || 0, getClassSkillRank: (e, key) => key === 'cleric' ? e.clericRank || 0 : 0,
        getEntityStatValue: (e, key, fallback) => e.stats && e.stats[key] || fallback, randInt: min => min,
        packContainerContents() {}
    };
    vm.createContext(c);
    const run = (start, end) => vm.runInContext(section(start, end), c);
    for (const name of ['COMPANION_WAKE_HP_RATIO', 'JOB_NIGHT_TURNS', 'JOB_SLEEP_HEAL_RATIO']) {
        vm.runInContext(source.match(new RegExp('^const ' + name + ' =.*$', 'm'))[0], c);
    }
    run('const REST_HEAL_PER_TURN_DESIGNATED =', 'function getGameDay(');
    run('function isSlowHealRoom(', 'function getSleepBedQuality(');
    run('function getSleepBedQuality(', '// ── WOUNDS, TREATMENT');
    run('const WOUND_HEAL_FACTOR_NONE =', '// Called from applyCombatDamage');
    run('function onPlayerHitWounds(', 'const INFECTION_ONSET_LINES =');
    run('function getPlayerCompanions(', 'function isPlayerCompanion(');
    run('function getRestBedQuality(', '// ── INTERACT SIDE PANELS');
    run('function attemptRest(', '// ── SHRINE / ALTAR PRAYER');
    run('function moveOneItemOutOfPack(', '// Puts an already-carried item');
    run('const HEALING_HERBS =', 'function getHerbKey(');
    run('function applyHerbEffect(', 'function eatInventoryHerb(');
    run('function applyPotionEffect(', 'function isAlcoholItem(');
    run('const ENC_SUPPORT_HEAL_BASE =', 'function encSupportRank(');
    run('function encSupportHealAmount(', '// Carry out a chosen option');
    run('function getPartyCareBlock(', 'function openTendWoundsMenu(');
    run('function chooseNPCAction(', '// ── COMPANION EQUIPMENT');
    run('function sleepThroughNight(', '// ── notice boards');
    c.roomHasActiveHostile = () => c.hostile;
    return { c, player, ally, room, menu };
}
function injury(e, hp = 4, bleed = 0) {
    e.combatState = { limbs: { arms: { hp, max: 10, bleed, severed: false }, legs: { hp: 0, max: 10, severed: true } } };
}

test('rest continues for party stamina and mana after the player is fully rested', () => {
    const { c, player, ally } = harness();
    Object.assign(ally, { stamina: 0, mana: 0, manaMax: 8 });
    assert.equal(c.playerNeedsRest(player), true);
    c.attemptRest();
    assert.equal(ally.stamina, 10); assert.equal(ally.mana, 8); assert.equal(c.turn, 10);
    assert.equal(player.hp, 20); assert.equal(c.partyNeedsRest(c.G.activeRoom), false);
    assert.match(c.narration, /companions rest alongside/); assert.equal(c.saves, 1);
});

test('rest uses each companion wound factor and heals limbs without regrowing them', () => {
    const { c, player, ally } = harness();
    player.hp = 1; ally.hp = 1; injury(ally);
    c.attemptRest();
    assert.equal(player.hp, 11); assert.equal(ally.hp, 5);
    assert.equal(ally.combatState.limbs.arms.hp, 6);
    assert.equal(ally.combatState.limbs.legs.severed, true);
});

test('party recovery excludes absent allies, bystanders and corpses, and deduplicates followers', () => {
    const { c, ally, room } = harness();
    const absent = entity('Away', { hp: 1 }), stranger = entity('Bystander', { hp: 1 });
    const corpse = entity('Dead', { hp: 0, dead: true, objectType: 'body', bodyState: 'corpse' });
    c.G.partyMembers.push(absent, corpse); c.G.sessionFollowers.push(ally); room.creatures.push(stranger, corpse);
    ally.hp = 1;
    c.restHealParty(room, 0, { rest: true });
    assert.equal(ally.hp, 2); assert.equal(absent.hp, 1); assert.equal(stranger.hp, 1); assert.equal(corpse.hp, 0);
});

test('sleep heals each companion by max HP, refills resources and clears fatigue', () => {
    const { c, player, ally, room } = harness();
    room.structural.push({ id: 'bed', tags: ['rest'] });
    c.turn = 120; player.fatigue = { lastSleepTurn: 0, applied: 0, narratedDays: 0 };
    Object.assign(ally, { hp: 10, hpMax: 100, stamina: 0, mana: 0, manaMax: 12, fatigue: { lastSleepTurn: 0, applied: 2, base: 12, narratedDays: 2 } });
    ally.staminaMax = 10;
    c.performSleep();
    assert.equal(ally.hp, 60); assert.equal(ally.staminaMax, 12); assert.equal(ally.stamina, 12); assert.equal(ally.mana, 12);
    assert.equal(ally.fatigue.lastSleepTurn, 144); assert.equal(ally.effects.wellRested, true);
    assert.match(c.narration, /companions sleep and recover/);
});

test('interrupted sleep grants proportional recovery and no completed-night bonuses', () => {
    const { c, ally, room } = harness();
    room.structural.push({ id: 'bed', tags: ['rest'] });
    ally.hp = 10; ally.hpMax = 100; ally.stamina = 0; ally.mana = 0; ally.manaMax = 12;
    ally.fatigue = { lastSleepTurn: 0, applied: 0, narratedDays: 0 };
    c.afterTurn = () => { if (c.turn === 6) c.hostile = true; };
    c.performSleep();
    assert.equal(c.turn, 6); assert.equal(ally.hp, 23); assert.equal(ally.stamina, 3); assert.equal(ally.mana, 3);
    assert.equal(ally.fatigue.lastSleepTurn, 0); assert.equal(ally.effects, undefined); assert.equal(c.ambushed, true);
});

test('downed companions heal and wake once; bleeding bodies remain down', () => {
    const { c, room } = harness();
    const body = entity('Unconscious Finn', { originalName: 'Finn', hp: 9, objectType: 'body', bodyState: 'unconscious', _wasPartyMember: true });
    const bleeding = entity('Unconscious Ada', { hp: 1, objectType: 'body', bodyState: 'unconscious', _wasPartyMember: true, bleedingOut: true });
    room.items.push(body, bleeding);
    const lines = c.restHealParty(room, 0, { rest: true });
    assert.equal(body.hp, 10, 'Wake threshold remains the existing 50 percent');
    assert.equal(room.creatures.filter(e => e === body).length, 1); assert.equal(lines.length, 1);
    assert.equal(bleeding.hp, 1); assert.ok(room.items.includes(bleeding));
});

test('wound dialogue exposes both treatment directions and NPC bandaging consumes exactly one of their supplies', () => {
    const { c, player, ally, menu } = harness();
    injury(player, 4, 2);
    const bandage = { name: 'Bandage', quantity: 2 }; ally.inventory.push(bandage);
    c.G.activeNPC = ally;
    c.chooseNPCAction('partycare');
    assert.match(menu.children[0].label, /Tend to Mira/); assert.match(menu.children[1].label, /Ask Mira to tend to you/);
    menu.children[1].buttons.find(b => b.label === 'Bandage wounds').onClick();
    assert.equal(bandage.quantity, 1); assert.equal(c.getTotalBleed(player), 0); assert.equal(player.wounds.dressed, true);
    assert.equal(c.turn, 1); assert.equal(c.saves, 1); assert.equal(player.inventory.length, 0);
});

test('player healing potion heals NPC HP and limbs, stops bleeding and cures infection', () => {
    const { c, player, ally } = harness();
    ally.hp = 2; injury(ally, 2, 2); ally.effects = { infected: true };
    const potion = { name: 'Potion of Health', statusKey: 'potionHealth', quantity: 2, emptyId: 'Empty vial' };
    player.inventory.push(potion);
    c.tendPartyPatient(ally, player, ally, 'potion', potion);
    assert.equal(ally.hp, 20); assert.equal(ally.combatState.limbs.arms.hp, 10); assert.equal(c.getTotalBleed(ally), 0);
    assert.equal(ally.effects.infected, undefined); assert.equal(ally.wounds.cleaned, true); assert.equal(potion.quantity, 1);
    assert.equal(player.inventory[1].name, 'Empty vial'); assert.equal(c.turn, 1);
});

test('NPC herbs heal the player and player herbs heal NPC wounds using the same effects', () => {
    for (const npcTreats of [false, true]) {
        const { c, player, ally } = harness();
        const actor = npcTreats ? ally : player, patient = npcTreats ? player : ally;
        patient.hp = 2; injury(patient, 2, 1);
        const herb = { name: 'Silverroot', herb: 'silverroot' }; actor.inventory.push(herb);
        c.tendPartyPatient(ally, actor, patient, 'herb', herb);
        assert.equal(patient.hp, 11); assert.equal(c.getTotalBleed(patient), 0);
        assert.equal(patient.wounds.dressed, true); assert.equal(patient.wounds.cleaned, true); assert.equal(actor.inventory.length, 0);
    }
});

test('healing magic works in both directions and consumes mana or NPC stamina', () => {
    for (const npcTreats of [false, true]) {
        const { c, player, ally } = harness();
        const actor = npcTreats ? ally : player, patient = npcTreats ? player : ally;
        actor.clericRank = 2; patient.hp = 2; injury(patient, 2, 2);
        if (!npcTreats) { actor.manaMax = 12; actor.mana = 3; }
        c.tendPartyPatient(ally, actor, patient, 'magic');
        assert.equal(patient.hp, 9); assert.equal(c.getTotalBleed(patient), 0);
        assert.equal(npcTreats ? actor.stamina : actor.mana, npcTreats ? 7 : 0); assert.equal(c.turn, 1);
    }
});

test('missing supplies, insufficient magic, full health, unavailable allies and combat cannot grant free healing', () => {
    for (const blocked of ['missing', 'spent', 'healthy', 'absent', 'asleep', 'hostile', 'combat', 'outsider']) {
        const { c, player, ally, room } = harness();
        player.hp = 2; ally.clericRank = 2;
        const potion = { name: 'Potion', statusKey: 'potionHealth' };
        if (blocked === 'spent') ally.stamina = 2;
        if (blocked === 'healthy') player.hp = player.hpMax;
        if (blocked === 'absent') room.creatures = [];
        if (blocked === 'asleep') ally.currentState = { sleeping: true };
        if (blocked === 'hostile') c.hostile = true;
        if (blocked === 'combat') c.G.activeNPCMode = 'combat';
        const actor = blocked === 'outsider' ? entity('Stranger') : ally;
        const before = player.hp;
        c.tendPartyPatient(ally, actor, player, blocked === 'missing' ? 'potion' : 'magic', blocked === 'missing' ? potion : undefined);
        assert.equal(player.hp, before, blocked); assert.equal(c.turn, 0, blocked); assert.equal(c.saves, 0, blocked);
    }
});

test('slow rest still restores party resources on turns when the player gains zero HP', () => {
    const { c, player, ally, room } = harness();
    room.zone = 'Dungeon'; player.hp = 1; injury(player, 2, 1);
    Object.assign(ally, { hp: 10, stamina: 0, mana: 0, manaMax: 15, manaReserved: 5 });
    c.attemptRest();
    assert.equal(player.hp, 2); assert.equal(ally.hp, 13);
    assert.equal(ally.stamina, 10); assert.equal(ally.mana, 10);
});

test('NPC spirits clean infection without killing the player and keep the empty flask with the NPC', () => {
    const { c, player, ally } = harness();
    injury(player, 2, 1); player.hp = 1; player.effects = { infected: true };
    const spirits = { name: 'Spirits', spirits: true, emptyId: 'Empty flask' }; ally.inventory.push(spirits);
    c.tendPartyPatient(ally, ally, player, 'spirits', spirits);
    assert.equal(player.hp, 1); assert.equal(player.wounds.cleaned, true); assert.equal(player.effects.infected, undefined);
    assert.equal(ally.inventory[0].name, 'Empty flask'); assert.equal(player.inventory.length, 0); assert.equal(c.turn, 1);
});

test('job-night sleep also restores party health and resources', () => {
    const { c, ally, room } = harness();
    const job = { state: 'dayDone', day: 1 };
    Object.assign(c, { getActiveJob: () => job, getJobSleepBlockReason: () => '', renderJobMenu() {}, describeJobStatus: () => '' });
    room.structural.push({ id: 'bed', tags: ['rest'] });
    Object.assign(ally, { hp: 1, stamina: 0, mana: 0, manaMax: 8 });
    c.sleepThroughNight();
    assert.equal(ally.hp, 20); assert.equal(ally.stamina, 10); assert.equal(ally.mana, 8);
    assert.equal(job.state, 'morning'); assert.equal(c.turn, 24); assert.equal(c.saves, 1);
});

test('full-HP companion limb injuries still accumulate fractional healing while resting', () => {
    const { c, ally, room } = harness();
    room.zone = 'Dungeon'; injury(ally, 4);
    c.attemptRest();
    assert.equal(ally.hp, ally.hpMax); assert.ok(ally.combatState.limbs.arms.hp > 4);
    assert.equal(ally.combatState.limbs.legs.severed, true); assert.equal(c.turn, 10);
});

test('a fresh NPC wound clears previous treatment without changing the player wound state', () => {
    const { c, player, ally } = harness();
    player.wounds = { dressed: true, cleaned: true }; ally.wounds = { dressed: true, cleaned: true };
    c.onPlayerHitWounds({ hp: 4, max: 10 }, true, ally);
    assert.equal(ally.wounds.dressed, false); assert.equal(ally.wounds.cleaned, false);
    assert.equal(player.wounds.dressed, true); assert.equal(player.wounds.cleaned, true);
});
