const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const corePath = process.argv[2] || path.join(__dirname, '../.equipment-management/cyoaftw-engine-CORE.js');
const source = fs.readFileSync(corePath, 'utf8').replace(/\r\n/g, '\n');
function extract(start, end) {
    const a = source.indexOf(start), b = source.indexOf(end, a);
    assert.ok(a >= 0 && b > a, start);
    return source.slice(a, b);
}
function element() {
    return { children: [], style: {}, classList: { add() {}, remove() {} }, setAttribute() {},
        appendChild(child) { this.children.push(child); },
        set innerHTML(value) { assert.equal(value, ''); this.children = []; } };
}
function harness() {
    let uid = 0;
    const menu = element();
    const room = { coords: '0,0', items: [], creatures: [] };
    const c = {
        console, window: {}, setTimeout, clearTimeout,
        G: { story: { turnCounter: 0, combatRounds: 0 }, player: { inventory: [], equipped: {}, _baselineClothingSeeded: true }, activeRoom: room, roomMap: { '0,0': room }, sessionFollowers: [], partyMembers: [], activeNPCMode: 'menu' },
        document: { getElementById: () => menu, createElement: element },
        assignLootUID(item) { item._uid = item._uid || 'loot-' + ++uid; return item; },
        getItemName: item => item.name || 'item', getEntityName: npc => npc.name || 'slime',
        isPotionItem: () => false, isItemEquippable: () => false,
        capitaliseFirst: text => text[0].toUpperCase() + text.slice(1), withIndefiniteArticle: name => 'a ' + name,
        getCurrentStoryTurn: () => c.G.story.turnCounter,
        getStatusClock: () => c.G.story.turnCounter + c.G.story.combatRounds,
        advanceStoryTurn(steps) { c.G.story.turnCounter += steps; c.tickSlimeTaming(); },
        renderNPCActionMenu() {}, refreshInventoryUi() {}, renderCompanionsBar() {}, renderRoom() {},
        refreshNPCDetailPanel() { c.detailRefreshes = (c.detailRefreshes || 0) + 1; },
        setNarration(text) { c.narration = text; }, saveGameState() { c.saves = (c.saves || 0) + 1; },
        createCombatButton(label, onclick, opts = {}) { return { textContent: label, onclick, ...opts }; },
        appendCombatGroup(el, label, buttons) { buttons.forEach(b => el.appendChild(b)); },
        queueTurnNote(text) { c.notes.push(text); }, notes: [],
        getActiveEncounter: () => c.encounter || null,
        roomHasActiveHostile: room => room.creatures.some(n => !n.dead && (n.hostility || 0) >= 60),
        aiAvailable: () => c.aiOn || false, tryParseConversationJSON: JSON.parse,
        portraitsEnabled: () => c.portraitsOn || false,
        refreshNPCPortraitIfStale() { c.redraws = (c.redraws || 0) + 1; }, renderNPCPortrait() {},
        isSlimeRemains: it => it && it.objectType === 'body' && it.species === 'slime',
        getSlimeRemainsUnits: it => it.slimeUnitsRemaining || 0,
        getGiftReceiveMode: () => 'engulf', isAcidicSlime: () => false,
        settleSlimeDigestion: () => []
    };
    vm.createContext(c);
    for (const [start, end] of [
        ['function cloneLootTemplate(', 'function pickLootQuality('],
        ['function ensurePlayerEquipmentState(', 'function isPotionItem('],
        ['const SLIME_VARIANTS =', 'const NATURAL_SLIME_ENGULF ='],
        ['const SLIME_HOLD_UNITS =', '// Acidic (green) slimes'],
        ['const NECTAR_DROPS_PER_UNIT =', 'function offerNectarToSlime('],
        ['function addSessionFollower(', 'function moveSessionFollowers('],
        ['function formatInventoryItemLabel(', 'function dropItemIntoCurrentRoom('],
        ['function giveItemToNPC(', 'window.giveItemToNPC =']
    ]) vm.runInContext(extract(start, end), c);
    const slime = { id: 's1', name: 'Moss slime', species: 'slime', isHumanoid: false, hp: 10, hpMax: 10, inventory: [], hostility: 80, memory: { favorability: 0 }, anatomy: { body: { color: 'grey' } } };
    room.creatures.push(slime);
    c.G.activeNPC = slime;
    function nectar(quantity = 1, cap = 1) {
        const item = c.cloneLootTemplate({ id: 'moonbloom-nectar', name: 'Vial of moonbloom nectar', value: 10, quantity, type: ['misc', 'supply'], container: { maxUnitCapacity: cap, emptyId: 'empty-vial', liquid: true } });
        c.G.player.inventory.push(item);
        c.restowPlayerPack(c.G.player);
        return item;
    }
    function feed(drops) {
        c.feedNectarToSlime(slime, c.getNectarEntries()[0].key, drops);
    }
    return { c, slime, room, menu, nectar, feed };
}
async function main() {
    const tests = [];
    const test = (name, fn) => tests.push([name, fn]);
    test('one- and two-drop feeding split a stack, preserve liquid, and return one empty per drained vessel', () => {
        const { c, slime, nectar, feed } = harness();
        nectar(3);
        feed(1);
        assert.equal(slime._slimeBond.totalDrops, 1);
        assert.ok(slime.memory.favorability > 0 && slime.hostility < 80);
        assert.equal(c.getNectarEntries().reduce((n, e) => n + c.getNectarDrops(e.item) * e.totalQuantity, 0), 59);
        assert.equal(c.getNectarEntries().length, 2);
        const partial = c.getNectarEntries().find(e => c.getNectarDrops(e.item) === 19);
        c.feedNectarToSlime(slime, partial.key, 2);
        assert.equal(c.getNectarEntries().reduce((n, e) => n + c.getNectarDrops(e.item) * e.totalQuantity, 0), 57);
        const remainder = c.getNectarEntries().find(e => c.getNectarDrops(e.item) === 17);
        assert.match(c.formatInventoryItemLabel(remainder.item), /17 drops/);
        assert.equal(c.getItemUnitValue(remainder.item), 9);
        c.feedNectarToSlime(slime, remainder.key, 17);
        assert.equal(c.getNectarEntries().reduce((n, e) => n + c.getNectarDrops(e.item) * e.totalQuantity, 0), 40);
        assert.equal(c.G.player.inventory.filter(it => it.stackKey === 'empty-vial').length, 1);
        assert.equal(c.G.story.turnCounter, 3);
    });
    test('nectar has explicit volume conversion, amount controls, and rejects invalid/stale/combat doses', () => {
        const { c, slime, room, menu, nectar } = harness();
        const vessel = nectar(1, 3);
        assert.equal(c.getNectarDrops(vessel), 60);
        const key = c.getNectarEntries()[0].key;
        c.openSlimeNectarMenu(slime, key);
        assert.ok(menu.children.some(b => b.textContent === 'Give 1 drop'));
        assert.ok(menu.children.some(b => b.textContent === 'Give 2 drops'));
        for (const n of [0, -1, 1.5, 61, NaN]) assert.equal(c.takeNectarDose(key, n), null);
        c.encounter = {};
        c.feedNectarToSlime(slime, key, 1);
        assert.equal(c.getNectarDrops(vessel), 60);
        c.encounter = null;
        room.creatures = [];
        c.feedNectarToSlime(slime, key, 1);
        assert.equal(slime._slimeBond, undefined);
    });
    test('following starts at precisely 60 lifetime drops, survives decay/reload and stays outside the party', () => {
        const { c, slime, room, nectar, feed } = harness();
        nectar(3);
        feed(20); feed(20); feed(19);
        assert.equal(slime._slimeBond.totalDrops, 59);
        assert.equal(c.G.sessionFollowers.length, 0);
        c.advanceStoryTurn(100);
        assert.equal(slime._slimeBond.reserve, 0);
        const key = c.getNectarEntries().find(e => c.getNectarDrops(e.item) === 1).key;
        c.feedNectarToSlime(slime, key, 1);
        assert.equal(slime._slimeBond.totalDrops, 60);
        assert.equal(c.G.sessionFollowers[0], slime);
        assert.equal(c.G.partyMembers.length, 0);
        const loaded = JSON.parse(JSON.stringify(slime));
        room.creatures = [loaded]; c.G.sessionFollowers = [];
        c.restoreSlimeFollowers(); c.restoreSlimeFollowers();
        assert.equal(c.G.sessionFollowers.length, 1);
        assert.equal(c.G.sessionFollowers[0], loaded);
        c.removeSessionFollower(loaded);
        c.tickSlimeTaming();
        assert.equal(c.G.sessionFollowers.length, 0);
        assert.equal(loaded._slimeBond.dismissed, true);
    });
    test('a hostile slime cannot become an ally until calmed; every dose still earns favor', () => {
        const { c, slime, nectar, feed } = harness();
        nectar(4);
        feed(20); feed(20);
        slime.hostility = 100;
        feed(20);
        assert.equal(slime._slimeBond.totalDrops, 60);
        assert.equal(c.G.sessionFollowers.length, 0);
        feed(20);
        assert.equal(c.G.sessionFollowers[0], slime);
        slime.hostility = 90; c.tickSlimeTaming();
        assert.equal(c.G.sessionFollowers.length, 0);
    });
    test('ordinary gifts invoke AI with firmness/object/disposition and apply short bounded cosmetic mimicry', async () => {
        const { c, slime, room, nectar, feed } = harness();
        nectar(3); feed(20); feed(20); feed(20);
        const coin = c.cloneLootTemplate({ id: 'coin', name: 'Coin', type: ['currency'], value: 1 });
        c.G.player.inventory.push(coin); c.restowPlayerPack(c.G.player);
        c.aiOn = true; c.portraitsOn = true;
        c.callAI = async ({ instruction }) => {
            assert.match(instruction, /firmness/); assert.match(instruction, /disposition/); assert.match(instruction, /Coin/);
            return JSON.stringify({ shape: 'a comically tilted coin', turns: 900, narration: 'It wobbles into a coin, then gives a hopeful little shimmer.', portrait: 'a tilted coin silhouette made of grey gel, the real coin suspended inside' });
        };
        const hp = slime.hpMax;
        c.giveItemToNPC(slime, c.buildPlayerInventoryEntries(c.G.player).find(e => e.item === coin).key);
        await new Promise(setImmediate);
        assert.equal(slime._slimeBond.mimic.shape, 'a comically tilted coin');
        assert.equal(slime._slimeBond.mimic.until - c.getStatusClock(), 6);
        assert.match(c.narration, /hopeful little shimmer/);
        assert.match(c.getSlimePortraitCue(slime), /tilted coin silhouette/);
        assert.equal(slime.hpMax, hp);
        assert.ok(c.redraws > 0);
        const redraws = c.redraws;
        c.G.story.combatRounds += 6; c.tickSlimeTaming();
        assert.equal(slime._slimeBond.mimic, undefined);
        assert.ok(c.redraws > redraws);
        assert.match(c.getSlimePortraitCue(slime), /soft mound/);
        assert.ok(slime.inventory.some(it => it.name === 'Coin'));
    });
    test('low favor, hostility and insufficient firmness suppress mimicry; duration cannot exceed available firmness', async () => {
        const { c, slime } = harness();
        c.getSlimeBond(slime).reserve = 100;
        assert.equal(c.canSlimeMimic(slime), false);
        slime.hostility = 0; slime.memory.favorability = 80;
        slime._slimeBond.reserve = 23;
        assert.equal(c.canSlimeMimic(slime), false);
        slime._slimeBond.reserve = 24;
        assert.equal(c.canSlimeMimic(slime), true);
        const plan = c.normalizeSlimeMimicPlan({ turns: 800, narration: 'word '.repeat(100), portrait: 'cue '.repeat(80) }, { name: 'Pebble' }, 24);
        assert.equal(plan.turns, 1);
        assert.ok(plan.narration.split(/\s+/).length <= 45);
        assert.ok(plan.portrait.split(/\s+/).length <= 26);
        const item = c.assignLootUID({ name: 'Pebble', _engulfed: true }); slime.inventory.push(item);
        await c.narrateSlimeMimic(slime, item, c.G.activeRoom);
        assert.ok(slime._slimeBond.mimic);
        assert.equal(c.redraws, undefined); // portraits off
        c.advanceStoryTurn(1);
        assert.equal(slime._slimeBond.mimic, undefined);
    });
    test('late AI mimicry replies cannot replace newer gifts, follow the player to another room, or use a removed object', async () => {
        const { c, slime, room } = harness();
        slime.hostility = 0; slime.memory.favorability = 80;
        c.getSlimeBond(slime).reserve = 100;
        c.aiOn = true;
        const replies = [];
        c.callAI = () => new Promise(resolve => replies.push(resolve));
        const coin = c.assignLootUID({ name: 'Coin', _engulfed: true }), key = c.assignLootUID({ name: 'Key', _engulfed: true });
        slime.inventory.push(coin, key);
        const old = c.narrateSlimeMimic(slime, coin, room), latest = c.narrateSlimeMimic(slime, key, room);
        replies[1]('{"shape":"a wobbly key","turns":3,"narration":"It wobbles hopefully."}'); await latest;
        replies[0]('{"shape":"an old coin","turns":5}'); await old;
        assert.equal(slime._slimeBond.mimic.shape, 'a wobbly key');
        const pending = c.narrateSlimeMimic(slime, coin, room);
        c.G.activeRoom = { creatures: [] };
        replies[2]('{}'); await pending;
        assert.equal(slime._slimeBond.mimic.shape, 'a wobbly key');
        c.G.activeRoom = room;
        const removed = c.narrateSlimeMimic(slime, coin, room);
        slime.inventory = [key]; replies[3]('{}'); await removed;
        assert.equal(slime._slimeBond.mimic.shape, 'a wobbly key');
    });
    test('foraging takes one visible loose item and never takes fixtures, hidden goods or unconscious bodies', () => {
        const { c, slime, room, nectar, feed } = harness();
        nectar(3); feed(20); feed(20); feed(20);
        const hidden = { name: 'Secret', hidden: true }, fixture = { name: 'Chest', objectType: 'chest' }, body = { name: 'Slime', species: 'slime', bodyState: 'unconscious', objectType: 'body', slimeUnitsRemaining: 5 };
        const coins = { name: 'Coins', type: ['currency'], quantity: 4 };
        room.items.push(hidden, fixture, body, coins);
        c.advanceStoryTurn(3);
        assert.equal(coins.quantity, 3);
        assert.ok(room.items.includes(hidden) && room.items.includes(fixture) && room.items.includes(body));
        assert.equal(slime.inventory.length, 1);
        assert.equal(slime.inventory[0].quantity, 1);
        assert.equal(slime.inventory[0]._engulfed, true);
    });
    test('AI slime absorption bounds growth, preserves loot, prevents duplicate absorption and revalidates scooped remains', async () => {
        const { c, slime, room, nectar, feed } = harness();
        nectar(3); feed(20); feed(20); feed(20);
        const gem = { name: 'Gem' }, blade = { name: 'Blade' };
        const remains = { species: 'slime', name: 'Dead slime', bodyState: 'corpse', objectType: 'body', slimeUnitsRemaining: 5, inventory: [gem], equipped: { weapon: blade } };
        room.items.push(remains); c.aiOn = true;
        let resolve, calls = 0;
        c.callAI = () => { calls++; return new Promise(r => { resolve = r; }); };
        const work = c.absorbDefeatedSlime(slime, remains, room);
        await c.absorbDefeatedSlime(slime, remains, room);
        assert.equal(calls, 1);
        resolve('{"growth":200}'); await work;
        assert.equal(slime._slimeBond.growth, 3);
        assert.equal(slime.hpMax, 13);
        assert.ok(!room.items.includes(remains));
        assert.ok(room.items.includes(gem) && room.items.includes(blade));
        const other = { ...remains, slimeUnitsRemaining: 5, inventory: [] };
        room.items.push(other);
        const pending = c.absorbDefeatedSlime(slime, other, room);
        other.slimeUnitsRemaining = 4;
        resolve('{"growth":2}'); await pending;
        assert.ok(room.items.includes(other));
        assert.equal(slime._slimeBond.growth, 3);
    });
    test('both portrait modes redraw the imitation and its return, discard stale image replies, and respect portraits off', async () => {
        for (const full of [false, true]) {
            const { c, slime } = harness();
            Object.assign(c, {
                PORTRAIT_PROMPT_VERSION: 12, PORTRAIT_STYLE_SUFFIX: 'fantasy art', PORTRAIT_STYLE_NEGATIVES: 'text',
                getNPCPortraitClothing: () => '', getNPCPortraitTasteLabel: () => '', getNPCFullPortraitGear: () => '',
                getEffectivePortraitMode: () => full ? 'full' : 'bust',
                getPortraitImageFn: () => c.imageFn, portraitGenerationAllowed: () => c.portraitsOn,
                portraitResultToSrc: result => result, shrinkPortraitDataUrl: async result => result,
                setTimeout(...args) { const timer = setTimeout(...args); timer.unref(); return timer; }
            });
            vm.runInContext(extract('function npcPortraitHash(', '// Downscale'), c);
            vm.runInContext(extract('function buildNPCPortraitSubject(', '// Short expression phrase'), c);
            vm.runInContext(extract('function getNPCPortraitHashKey(', '// ── PLAYER PORTRAIT'), c);
            vm.runInContext(extract('const FULL_PORTRAIT_SIZE =', '// Full-length column'), c);
            c.portraitsOn = true;
            const images = [];
            c.imageFn = (prompt, options) => new Promise(resolve => images.push({ prompt, options, resolve }));
            const load = full ? c.loadNPCFullPortrait : c.loadNPCPanelPortrait;
            const key = full ? 'portraitFull' : 'portrait';
            const bond = c.getSlimeBond(slime);
            bond.reserve = 100;
            bond.mimic = { shape: 'a lopsided coin', portrait: 'wobbly grey coin silhouette of gel', until: 3 };
            const work = load(slime, true);
            assert.match(images[0].prompt, /wobbly grey coin silhouette/);
            assert.doesNotMatch(images[0].prompt, /face fully visible|head to feet|standing pose/);
            delete bond.mimic;
            images[0].resolve('old-coin-image');
            await new Promise(setImmediate);
            assert.equal(slime[key], undefined);
            assert.equal(images.length, 2);
            assert.match(images[1].prompt, /soft mound of gel/);
            images[1].resolve('normal-slime-image');
            assert.equal(await work, 'normal-slime-image');
            assert.equal(slime[key], 'normal-slime-image');
            bond.mimic = { shape: 'a loop', portrait: 'wobbly gel loop', until: 3 };
            const second = load(slime, true);
            c.portraitsOn = false; delete bond.mimic;
            images[2].resolve('stale-loop-image');
            assert.equal(await second, null);
            assert.equal(images.length, 3);
            assert.equal(slime[key], 'normal-slime-image');
        }
    });
    test('tamed slimes use the shared follower movement and combat ally lists', () => {
        const { c, slime, room, nectar, feed } = harness();
        nectar(3); feed(20); feed(20); feed(20);
        const destination = { coords: '1,0', creatures: [] };
        c.G.roomMap['1,0'] = destination;
        c.captiveEscapesOnRoomChange = () => false;
        c.window.teleportNPC = (npc, coords) => {
            room.creatures.splice(room.creatures.indexOf(npc), 1);
            c.G.roomMap[coords].creatures.push(npc);
            return true;
        };
        vm.runInContext(extract('function moveSessionFollowers(', 'window.addSessionFollower ='), c);
        vm.runInContext(extract('function getPlayerCompanions(', '// Takes a companion out'), c);
        assert.equal(c.getPlayerCompanions()[0], slime);
        c.moveSessionFollowers(destination.coords);
        assert.ok(destination.creatures.includes(slime));
        assert.ok(!room.creatures.includes(slime));
        assert.equal(c.G.partyMembers.length, 0);
        vm.runInContext(extract('function encFollowerTryFlee(', '// -- bound captive followers'), c);
        c.encIsLooseFollower = () => true;
        assert.equal(c.encFollowerTryFlee({}, slime, []), false);
    });
    test('NPC descriptions show live disposition and imitation, and return to the ordinary slime description', () => {
        const { c, slime } = harness();
        vm.runInContext(fs.readFileSync(path.join(__dirname, '../cyoaftw-npc-data_dbd788b05d.js'), 'utf8'), c);
        slime.hostility = 0; slime.memory.favorability = 30;
        const bond = c.getSlimeBond(slime); bond.reserve = 100;
        assert.match(c.getNPCVisibleBehavior(slime), /buoyant ripples/);
        bond.mimic = { shape: 'a tilted key', portrait: 'a key of grey gel', until: 3 };
        assert.match(c.getSlimeBodyDescription(slime), /holding the shape of a tilted key/);
        assert.match(c.getNPCVisibleBehavior(slime), /tilted key/);
        c.advanceStoryTurn(3);
        assert.doesNotMatch(c.getSlimeBodyDescription(slime), /key/);
        assert.match(c.getSlimeBodyDescription(slime), /gelatinous pile/);
    });
    for (const [name, fn] of tests) { await fn(); console.log('PASS ' + name); }
    console.log('Slime taming checks passed.');
}
main().catch(err => { console.error(err); process.exitCode = 1; });
