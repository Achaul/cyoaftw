const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const corePath = process.argv[2] || 'C:/Git/CYOADEV/cyoaftw-engine-CORE.js';
const dataPath = process.argv[3] || 'C:/Git/CYOADEV/cyoaftw-world-data.js';
const core = fs.readFileSync(corePath, 'utf8').replace(/\r\n/g, '\n');
const data = fs.readFileSync(dataPath, 'utf8');
function extract(start, end) {
    const first = core.indexOf(start), last = core.indexOf(end, first);
    assert.ok(first >= 0 && last > first, 'Missing source section: ' + start);
    return core.slice(first, last);
}
function element() {
    return { children: [], style: {}, textContent: '', appendChild(child) { this.children.push(child); },
        set innerHTML(value) { assert.equal(value, ''); this.children = []; } };
}
function rng(seed) { let next = seed; return () => ((next = (Math.imul(next, 1664525) + 1013904223) >>> 0) / 4294967296); }
function harness() {
    const elements = Object.fromEntries(['statTimeEl', 'statDateEl', 'statSeasonEl', 'dayStripEl', 'timeBlockEl'].map(id => [id, element()]));
    const c = { window: {}, console, Math: Object.assign(Object.create(Math), { random: rng(314) }),
        G: { player: { calendar: { style: 'default', startDay: 0 } }, roomMap: {}, story: { turnCounter: 0 } },
        DAY_TURNS: 54, DAY_DAYLIGHT_TURNS: 30,
        document: { getElementById: id => elements[id], createElement: element }
    };
    c.getGameDay = turn => Math.floor((turn === undefined ? c.G.story.turnCounter : turn) / 54) + 1;
    c.getTurnOfDay = turn => (turn === undefined ? c.G.story.turnCounter : turn) % 54;
    vm.createContext(c);
    vm.runInContext(data, c);
    vm.runInContext(extract('const TIME_PHASES =', 'function isSlowHealRoom('), c);
    vm.runInContext(extract('function getNPCShopName(', 'function renderTradeOptions('), c);
    return { c, elements };
}
function test(name, fn) { fn(); console.log('PASS ' + name); }

test('sidebar separates weekday from numeric date and uses phase-specific emoji', () => {
    const { c, elements } = harness();
    for (const [turn, emoji, phase] of [[0, '🌅', 'Morning'], [10, '☀️', 'Mid-day'], [20, '🌇', 'Evening'], [30, '🌌', 'Night']]) {
        c.G.story.turnCounter = 3 * 54 + turn;
        c.renderTimeAndDate();
        assert.equal(elements.statTimeEl.textContent, emoji + ' ' + phase + ' Fourth Day');
        assert.equal(elements.statDateEl.textContent, '4 Month 1');
        assert.equal(elements.dayStripEl.children.filter(segment => segment.className === 'active').length, 1);
    }
});

test('realm era is randomized once, survives save/restore and advances on year rollover', () => {
    const { c } = harness();
    const first = c.getCalendarDate();
    assert.ok(first.year >= 300 && first.year <= 2400);
    assert.equal(c.getCalendarDate().year, first.year);
    const saved = JSON.parse(JSON.stringify(c.G.player));
    c.G.player = saved;
    assert.equal(c.getCalendarDate().year, first.year);
    c.G.player.currentTownTier = 3;
    assert.equal(c.getCalendarDate().year, first.year);
    assert.equal(c.getCalendarDate(336 * 54).year, first.year + 1);
    assert.equal(c.getCalendarDate(336 * 54).dayOfMonth, 1);
    const years = new Set(Array.from({ length: 20 }, () => c.getCalendarState({ calendar: {} }).startYear));
    assert.ok(years.size > 10);
    c.G.player.calendar.startYear = 1;
    assert.ok(c.getCalendarState().startYear > 1);
});

test('calendar styles and seasonal offsets keep their existing indices and names', () => {
    const { c, elements } = harness();
    c.G.player.calendar = { style: 'moons', startDay: 84, startYear: 777 };
    c.renderTimeAndDate();
    assert.equal(elements.statTimeEl.textContent, '🌅 Morning Solis');
    assert.equal(elements.statDateEl.textContent, '1 Sun Moon');
    assert.equal(elements.statSeasonEl.textContent, 'Summer, Year 777');
    const setup = c.collectCalendarFromSetup();
    assert.ok(setup.startYear > 1);
});

test('shop names reflect both the zone and the business type', () => {
    const { c } = harness();
    const fixed = () => 0;
    assert.equal(c.generateShopName('Town', 'Smithy', fixed), 'The Copper Hammer Forge');
    assert.equal(c.generateShopName('Swamp', 'Clothier', fixed), 'The Reed Needle Clothiers');
    assert.equal(c.generateShopName('Underground City', 'Alchemist', fixed), 'The Deep Retort Apothecary');
    assert.equal(c.generateShopName('Ruins', 'Pawnbroker', fixed), 'The Ashen Coin Pawnbrokers');
    assert.match(c.generateShopName('Dungeon', 'Tavern', fixed), /^The Ashen .* Tavern$/);
    assert.equal(c.generateShopName('Town', 'Bedroom', fixed), null);
    const random = rng(1234);
    const names = new Set(Array.from({ length: 100 }, () => c.generateShopName('Town', 'Smithy', random)));
    assert.ok(names.size > 70, 'Variety comes from word combinations');
});

test('the generator avoids duplicates and terminates even with a constant RNG', () => {
    const { c } = harness();
    const names = new Set();
    const a = c.generateShopName('Town', 'Inn', () => 0, names);
    const b = c.generateShopName('Town', 'Inn', () => 0, names);
    assert.notEqual(a, b);
    assert.equal(names.size, 2);
});

test('town plans share shop names across interiors while preserving room types and exit graphs', () => {
    const { c } = harness();
    const plan = c.planTownLayout(rng(42));
    const shops = plan.buildings.filter(building => c.getShopNameTrade(building.type));
    assert.ok(shops.some(building => building.type === 'Smithy'));
    assert.equal(new Set(shops.map(building => building.name)).size, shops.length);
    for (const shop of shops) {
        const rooms = Object.values(plan.rooms).filter(room => room.buildingId === shop.buildingId);
        assert.ok(rooms.length > 1);
        for (const room of rooms) {
            assert.equal(room.buildingName, shop.name);
            assert.ok(room.displayName.includes(shop.name));
            assert.ok(c.getRoomTemplate(room.type));
            for (const target of Object.values(room.exits)) assert.ok(plan.rooms[target], 'Building exits still have destinations');
        }
    }
    const other = c.planTownLayout(rng(123));
    assert.notEqual(shops.find(shop => shop.type === 'Smithy').name, other.buildings.find(shop => shop.type === 'Smithy').name);
});

test('old buildings reveal their saved names and unnamed shops are backfilled only once', () => {
    const { c } = harness();
    const map = {
        '0,0': { type: 'Smithy', displayName: 'Smithy', zone: 'Town', buildingId: 'forge', buildingType: 'Smithy', buildingName: 'The Cinder Anvil', isEntrance: true },
        '1,0': { type: 'Smithy Storeroom', displayName: 'Smithy Storeroom', zone: 'Town', buildingId: 'forge', buildingType: 'Smithy', buildingName: 'The Cinder Anvil', isBuildingRoom: true },
        '2,0': { type: "Scavenger's Stall", displayName: "Scavenger's Stall", zone: 'Ruins' },
        '3,0': { type: 'Bedroom', displayName: 'My private room', zone: 'Town' }
    };
    c.ensureShopNamesForRoomMap(map);
    assert.equal(map['0,0'].displayName, 'The Cinder Anvil');
    assert.equal(map['1,0'].displayName, 'The Cinder Anvil — Smithy Storeroom');
    assert.ok(map['2,0'].buildingName);
    const saved = JSON.stringify(map);
    c.ensureShopNamesForRoomMap(map);
    assert.equal(JSON.stringify(map), saved);
    const restored = JSON.parse(saved);
    c.ensureShopNamesForRoomMap(restored);
    assert.equal(JSON.stringify(restored), saved);
    assert.equal(map['3,0'].displayName, 'My private room');
});

test('standalone generated stores use the zone and keep their functional room type', () => {
    const { c } = harness();
    const room = c.buildRoomInstance('Deep Forge', 'Underground City');
    assert.equal(room.type, 'Deep Forge');
    assert.equal(room.zone, 'Underground City');
    assert.equal(room.name, room.buildingName);
    assert.match(room.name, /Forge|Smithy|Ironworks/);
});

test('market merchants have their own saved business name and dedicated storefronts share theirs', () => {
    const { c } = harness();
    c.G.activeRoom = { type: 'Square', zone: 'Swamp', creatures: [] };
    const clothier = { role: 'Clothier' };
    const name = c.getNPCShopName(clothier);
    assert.match(name, /Clothiers|Tailors|Outfitters/);
    assert.equal(c.getNPCShopName(clothier), name);
    assert.equal(c.getNPCShopName(JSON.parse(JSON.stringify(clothier))), name);
    c.G.activeRoom = { type: 'Smithy', zone: 'Town', buildingName: 'The Copper Hammer Forge' };
    const smith = { role: 'Blacksmith' };
    assert.equal(c.getNPCShopName(smith), c.G.activeRoom.buildingName);
    const container = element();
    c.appendShopNameHeading(smith, container);
    assert.equal(container.children[0].textContent, smith.shopName);
    assert.equal(c.getNPCShopName({ role: 'Guard' }), '');
});

console.log('Calendar and shop name checks passed.');
