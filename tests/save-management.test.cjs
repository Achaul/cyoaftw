const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const corePath = process.argv[2] || 'C:/Git/CYOADEV/cyoaftw-engine-CORE.js';
const source = fs.readFileSync(corePath, 'utf8').replace(/\r\n/g, '\n');
const section = source.slice(source.indexOf('const SAVE_KEY ='), source.indexOf('// ── ROOM GENERATION'));
assert.ok(section.includes('function openSaveMenu()'), 'Save management implementation is present');

function storage() {
    const data = new Map();
    return { data, fail: false, get length() { return data.size; }, key(i) { return [...data.keys()][i]; },
        getItem(k) { return data.has(k) ? data.get(k) : null; },
        setItem(k, v) { if (this.fail) throw new Error('Quota exceeded'); data.set(k, String(v)); },
        removeItem(k) { data.delete(k); } };
}
function element(tag = 'div') {
    const classes = new Set();
    return { tag, children: [], value: '', hidden: false, disabled: false, isConnected: true, style: {},
        classList: { add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x),
            toggle(x, on) { if (on) classes.add(x); else classes.delete(x); } },
        appendChild(child) { this.children.push(child); return child; }, append(...children) { this.children.push(...children); },
        replaceChildren(...children) { this.children = children; }, focus() { this.focused = true; }, select() {}, scrollIntoView() {}, remove() {},
        getClientRects() { return this.hidden ? [] : [1]; },
        contains(target) { return this === target || this.children.some(child => child.contains(target)); },
        click() { if (this.onclick) return this.onclick(); },
        querySelectorAll() { return this.children.flatMap(x => [x, ...x.querySelectorAll()]); } };
}
function sample(name = 'Doran') {
    return { version: 1,
        player: { name, class: 'Rogue', coords: '0,0', stats: { endurance: 4, flexibility: 5 }, hp: 16, hpMax: 16,
            stamina: 5, staminaMax: 10, staminaMaxExact: 10, inventory: [{ name: 'Keepsake', _uid: 'unique-1' }], equipped: {} },
        roomMap: { '0,0': { coords: '0,0', displayName: 'Forgotten Shrine', zone: 'Ruins', creatures: [{ id: 'guide', name: 'Guide' }], exits: {} } },
        story: { turn: 27, quests: [{ id: 'quest-1', progress: 2 }] }, zoneBossState: { Ruins: { defeated: true } },
        zoneForgeState: { Ruins: { jobs: [1] } }, portalTowns: { '1': { roomMap: { '4,4': { name: 'Old Town' } } } },
        worldLore: { kingdom: 'Realm' }, meta: { savedAt: 1000, activeNPCId: 'guide', activeNPCMode: 'combat' } };
}
function harness() {
    const nodes = Object.fromEntries(['saveMenuModal', 'saveMenuCard', 'saveMenuCloseBtn', 'manualSaveName', 'saveMenuStatus', 'saveMenuConfirm', 'saveMenuConfirmOverlay', 'saveMenuList',
        'createManualSaveBtn', 'exportCurrentSaveBtn', 'importSaveBtn', 'setupWrapper', 'gameWrapper', 'savedGamePrompt', 'savedGameSummaryEl', 'loadingSpinner'].map(id => [id, element()]));
    nodes.saveMenuConfirm.hidden = true;
    const state = sample();
    const events = {};
    const c = { console: { log() {}, warn() {}, error() {} }, Blob, Date, Math, crypto: require('node:crypto').webcrypto,
        localStorage: storage(), sessionStorage: storage(), setTimeout(fn) { fn(); },
        document: { readyState: 'loading', activeElement: element('button'), body: element('body'),
            getElementById: id => nodes[id] || null, createElement: element, addEventListener(type, callback) { events[type] = callback; } },
        G: { ...state, activeRoom: state.roomMap['0,0'], activeNPC: state.roomMap['0,0'].creatures[0], activeNPCMode: 'combat' },
        URL: { createObjectURL(blob) { c.download = blob; return 'blob:save'; }, revokeObjectURL() { c.revoked = true; } },
        repairRoomMapExits() {}, ensurePlayerEquipmentState() {},
        parseCoords(coords) { return typeof coords === 'string' && /^-?\d+,-?\d+$/.test(coords) ? { key: coords } : null; } };
    c.window = { location: { reload() { c.reloads = (c.reloads || 0) + 1; } } };
    vm.createContext(c);
    vm.runInContext(section, c);
    return { c, nodes, events };
}
function json(value) { return JSON.parse(JSON.stringify(value)); }
function descendants(el) { return el.children.flatMap(x => [x, ...descendants(x)]); }
function button(el, label) { const b = descendants(el).find(x => x.tag === 'button' && x.textContent === label); assert.ok(b, label); return b; }

test('autosave and manual saves preserve the complete existing save payload independently', () => {
    const { c } = harness();
    assert.equal(c.saveGameState(), true);
    const original = c.localStorage.getItem('cyoaftwSave');
    const key = c.storeManualSave('Before shrine', c.createGameSaveData());
    c.G.player.hp = 2;
    c.G.story.turn++;
    c.saveGameState();
    const manual = json(c.readManualSaves().saves[0]);
    assert.equal(manual.key, key);
    assert.equal(manual.save.player.hp, 16);
    assert.equal(manual.save.story.turn, 27);
    for (const field of ['player', 'roomMap', 'story', 'zoneBossState', 'zoneForgeState', 'portalTowns', 'worldLore']) {
        assert.deepEqual(manual.save[field], JSON.parse(original)[field], field);
    }
    assert.equal(c.readSavedGame().player.hp, 2);
});

test('manual save names can repeat, snapshots can be renamed/overwritten/deleted independently', () => {
    const { c } = harness();
    const a = c.storeManualSave('Checkpoint', sample());
    const b = c.storeManualSave('Checkpoint', sample('Other'));
    c.storeManualSave('Renamed', sample('Replacement'), a);
    assert.equal(c.readManualSaves().saves.length, 2);
    assert.equal(c.readManualSaves().saves.find(x => x.key === a).name, 'Renamed');
    c.localStorage.removeItem(a);
    assert.equal(c.readManualSaves().saves[0].key, b);
    assert.throws(() => c.storeManualSave('Wrong', sample(), 'cyoaftwSave'), /Invalid save slot/);
});

test('export/import round trip preserves state, including saved NPC combat mode', async () => {
    const { c } = harness();
    c.downloadGameSave(sample(), 'Before / shrine');
    const parsed = c.parseImportedGameSave(await c.download.text());
    assert.deepEqual(json(parsed.save), sample());
    assert.equal(parsed.name, 'Before / shrine');
    assert.equal(c.revoked, true);
    const link = c.document.body.children[0];
    assert.match(link.download, /^cyoaftw-Before-shrine-\d{4}-\d{2}-\d{2}\.json$/);
});

test('raw legacy v1 JSON and UTF-8 BOM files can be imported', () => {
    const { c } = harness();
    assert.equal(c.parseImportedGameSave('\uFEFF' + JSON.stringify(sample())).save.player.name, 'Doran');
    assert.equal(c.parseImportedGameSave(JSON.stringify(sample())).name, 'Doran — Imported');
});

test('invalid, incomplete, future-version and unsafe imports are rejected without changing storage', () => {
    const { c } = harness();
    c.saveGameState();
    const before = [...c.localStorage.data];
    const incomplete = sample(); delete incomplete.roomMap['0,0'];
    const badStats = sample(); badStats.player.stats = null;
    const badNPC = sample(); badNPC.roomMap['0,0'].creatures = [null];
    const badRoom = sample(); badRoom.roomMap['1,1'] = [];
    for (const text of ['not JSON', 'null', '[]', '{}', JSON.stringify(incomplete), JSON.stringify(badStats), JSON.stringify(badNPC), JSON.stringify(badRoom),
        JSON.stringify({ ...sample(), version: 99 }), JSON.stringify({ format: 'cyoaftw-save', version: 2, save: sample() }), '{"__proto__": {}}']) {
        assert.throws(() => c.parseImportedGameSave(text));
    }
    assert.deepEqual([...c.localStorage.data], before);
});

test('import adds a new manual save without loading or replacing an existing adventure', async () => {
    const { c, nodes } = harness();
    c.saveGameState();
    const before = c.localStorage.getItem('cyoaftwSave');
    const input = { value: 'file.json', files: [{ size: 200, text: async () => JSON.stringify(sample('Imported')) }] };
    await c.importGameSaveFromMenu(input);
    assert.equal(c.localStorage.getItem('cyoaftwSave'), before);
    assert.equal(c.G.player.name, 'Doran');
    assert.equal(c.readManualSaves().saves[0].save.player.name, 'Imported');
    assert.equal(input.value, '');
    assert.match(nodes.saveMenuStatus.textContent, /Imported/);
    assert.equal(nodes.importSaveBtn.disabled, false);
    assert.equal(c.reloads, undefined);
});

test('oversized files are rejected before reading and import errors leave existing saves intact', async () => {
    const { c, nodes } = harness();
    const key = c.storeManualSave('Existing', sample());
    let read = false;
    await c.importGameSaveFromMenu({ value: 'large', files: [{ size: 26 * 1024 * 1024, text() { read = true; } }] });
    assert.equal(read, false);
    assert.match(nodes.saveMenuStatus.textContent, /25 MB/);
    c.localStorage.fail = true;
    await c.importGameSaveFromMenu({ value: 'file', files: [{ size: 20, text: async () => JSON.stringify(sample()) }] });
    assert.match(nodes.saveMenuStatus.textContent, /storage may be full/);
    assert.ok(c.localStorage.getItem(key));
});

test('storage-full failures never overwrite snapshots and disk export still works', () => {
    const { c, nodes } = harness();
    c.saveGameState();
    const before = c.localStorage.getItem('cyoaftwSave');
    c.localStorage.fail = true;
    assert.equal(c.saveGameState(), false);
    c.createManualSaveFromMenu();
    assert.match(nodes.saveMenuStatus.textContent, /Export to disk/);
    assert.equal(c.localStorage.getItem('cyoaftwSave'), before);
    c.exportCurrentSaveFromMenu();
    assert.ok(c.download);
});

test('corrupt manual records are left untouched and reported', () => {
    const { c, nodes } = harness();
    c.localStorage.setItem('cyoaftwManualSave:broken', 'bad JSON');
    c.refreshSaveMenu();
    assert.match(nodes.saveMenuStatus.textContent, /1 unreadable/);
    assert.equal(c.localStorage.getItem('cyoaftwManualSave:broken'), 'bad JSON');
});

test('load requires confirmation; cancel and Escape preserve the current adventure', async () => {
    const { c, nodes, events } = harness();
    c.storeManualSave('Checkpoint', sample('Other'));
    c.openSaveMenu();
    button(nodes.saveMenuList, 'Load').click();
    assert.equal(c.reloads, undefined);
    assert.equal(nodes.saveMenuConfirm.hidden, false);
    assert.equal(nodes.saveMenuConfirmOverlay.hidden, false);
    assert.equal(nodes.saveMenuCard.inert, true);
    events.keydown({ key: 'Escape', preventDefault() {}, stopImmediatePropagation() {} });
    assert.equal(nodes.saveMenuConfirm.hidden, true);
    assert.equal(nodes.saveMenuConfirmOverlay.hidden, true);
    assert.equal(nodes.saveMenuCard.inert, false);
    assert.equal(nodes.saveMenuModal.classList.contains('active'), true);
    button(nodes.saveMenuList, 'Load').click();
    await button(nodes.saveMenuConfirm, 'Load adventure').click();
    assert.equal(c.reloads, 1);
    assert.equal(c.readSavedGame().player.name, 'Other');
    assert.equal(c.sessionStorage.getItem('cyoaftwLoadRequested'), '1');
    assert.equal(c.saveGameState(), false, 'old adventure cannot autosave after loading is committed');
});

test('delete and overwrite are confirmed, and cancel leaves the original snapshot intact', async () => {
    const { c, nodes } = harness();
    const key = c.storeManualSave('Checkpoint', sample('Other'));
    c.openSaveMenu();
    button(nodes.saveMenuList, 'Overwrite').click();
    assert.equal(JSON.parse(c.localStorage.getItem(key)).save.player.name, 'Other');
    button(nodes.saveMenuConfirm, 'Cancel').click();
    button(nodes.saveMenuList, 'Overwrite').click();
    await button(nodes.saveMenuConfirm, 'Overwrite').click();
    assert.equal(JSON.parse(c.localStorage.getItem(key)).save.player.name, 'Doran');
    button(nodes.saveMenuList, 'Delete').click();
    button(nodes.saveMenuConfirm, 'Cancel').click();
    assert.ok(c.localStorage.getItem(key));
    button(nodes.saveMenuList, 'Delete').click();
    await button(nodes.saveMenuConfirm, 'Delete').click();
    assert.equal(c.localStorage.getItem(key), null);
});

test('load failure preserves the old autosave and clears the pending reload marker', () => {
    const { c } = harness();
    c.saveGameState();
    const before = c.localStorage.getItem('cyoaftwSave');
    c.localStorage.fail = true;
    assert.throws(() => c.loadSaveMenuSnapshot(sample('Other')), /Could not prepare/);
    assert.equal(c.localStorage.getItem('cyoaftwSave'), before);
    assert.equal(c.sessionStorage.getItem('cyoaftwLoadRequested'), null);
    assert.equal(c.reloads, undefined);
    c.localStorage.fail = false;
    c.window.location.reload = () => { throw new Error('Blocked'); };
    assert.throws(() => c.loadSaveMenuSnapshot(sample('Other')), /Could not restart/);
    assert.equal(c.localStorage.getItem('cyoaftwSave'), before);
});

test('setup supports importing/loading but cannot snapshot the unstarted default character', () => {
    const { c, nodes } = harness();
    c.G.activeRoom = null;
    c.G.roomMap = {};
    c.openSaveMenu();
    assert.equal(nodes.createManualSaveBtn.disabled, true);
    assert.equal(nodes.exportCurrentSaveBtn.disabled, true);
    assert.equal(nodes.importSaveBtn.disabled, false);
    assert.equal(c.saveGameState(), false);
});

test('reload marker resumes once and normal startup continues to show the existing save prompt', () => {
    const { c, nodes } = harness();
    c.saveGameState();
    c.sessionStorage.setItem('cyoaftwLoadRequested', '1');
    let resumes = 0;
    c.resumeSavedGame = async () => { resumes++; };
    c.initSavedGamePrompt();
    c.initSavedGamePrompt();
    assert.equal(resumes, 1);
    assert.equal(c.sessionStorage.getItem('cyoaftwLoadRequested'), null);
    assert.equal(nodes.savedGamePrompt.classList.contains('active'), true);
});

test('the existing resume path restores the round-tripped world, inventory, story and combat target', async () => {
    const { c } = harness();
    c.localStorage.setItem('cyoaftwSave', JSON.stringify(sample('Restored')));
    const calls = [];
    for (const name of ['showSpinner', 'hideSpinner', 'ensurePlayerClassState', 'seedAnnouncedDeityPowers', 'migrateLegacyNPCRoles',
        'repairRoomMapExits', 'ensureTownPortalRoom', 'syncPortalChamberWaygates', 'clearConversationRuntimeState', 'restorePartyMembers',
        'restoreSlimeFollowers', 'clearChatLog', 'renderRoom', 'renderStats', 'renderCombatActionMenu', 'schedulePrefetch', 'setEngagedRoomHeader', 'setNarration', 'updateLoadingStatus']) {
        c[name] = () => calls.push(name);
    }
    Object.assign(c, { waitForNextPaint: async () => {}, performLoadingStep: async (message, progress, action) => action(), wait: async () => {},
        countNPCsInRoomMap: map => Object.values(map).reduce((n, r) => n + (r.creatures || []).length, 0),
        ensureStoryStateShape: state => state, findPortalChamberRoom: () => null, hydrateNPCSpeciesFlags() {}, buildEngagedNPCLine: () => 'Ready' });
    assert.equal(await c.resumeSavedGame(), true);
    assert.equal(c.G.player.name, 'Restored');
    assert.equal(c.G.player.inventory[0]._uid, 'unique-1');
    assert.equal(c.G.story.quests[0].progress, 2);
    assert.equal(c.G.portalTowns['1'].roomMap['4,4'].name, 'Old Town');
    assert.equal(c.G.activeRoom, c.G.roomMap['0,0']);
    assert.equal(c.G.activeNPC, c.G.activeRoom.creatures[0]);
    assert.equal(c.G.activeNPCMode, 'combat');
    assert.ok(calls.includes('renderCombatActionMenu'));
});
