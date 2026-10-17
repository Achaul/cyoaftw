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
    const classes = new Set();
    return {
        children: [], style: {}, textContent: '', disabled: false,
        classList: { add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name) },
        appendChild(child) { this.children.push(child); }, focus() {},
        set innerHTML(value) { assert.equal(value, ''); this.children = []; }
    };
}
function harness() {
    const elements = Object.fromEntries(['itemModal', 'itemModalTitle', 'itemModalDesc', 'itemModalStats', 'itemModalActions', 'itemModalClose'].map(id => [id, element()]));
    const room = { coords: '0,0', type: 'Stairwell', zone: 'Town', examined: true, exits: { U: '0,1000', D: '0,-1000' }, structural: [], creatures: [] };
    const c = {
        console, window: {}, G: { activeRoom: room, player: { coords: room.coords }, roomMap: { [room.coords]: room } },
        document: { getElementById: id => elements[id] || null, createElement: element }, activeReadingSession: null,
        clearItemModalContents() {}, settleRoomFires: () => [], settleRoomLiquids: () => [],
        getEntityName: fixture => fixture.name, getBoardFixtureDescription: () => '',
        roomHasActiveHostile: () => false, getFixtureLiquid: () => null, getFixtureDeityId: () => null,
        getDurabilityExamineLine: () => '', FIXTURE_ORE_SOURCES: {}, MINING_ENABLED: false,
        setNarration(message) { c.narration = message; },
        getBodyMoveBlockReason: () => '', saveGameState() { c.saves = (c.saves || 0) + 1; },
        refreshRoomViewAfterClose() {},
        movePlayer(direction) { c.moved = direction; c.closedBeforeMove = !elements.itemModal.classList.contains('active'); }
    };
    for (const name of ['isWarmthFixture', 'isCauldronFixture', 'isAlchemyTableFixture', 'isNoticeFixture', 'isNoticeWritingSuppliesFixture',
        'isTrainingDummyFixture', 'isFixtureBurning', 'isFlammableFixture', 'isTrapFixture', 'isReadableFixture', 'isPortalFixture',
        'isForageFixture', 'isDrinkableFixture', 'isFoulWaterFixture', 'isFireSourceFixture', 'isWashableRoomObject', 'playerIsSpellcaster']) c[name] = () => false;
    vm.createContext(c);
    vm.runInContext(extract('function isFixtureVisible(', 'function getVisibleRoomFixtures('), c);
    vm.runInContext(extract('function getFixtureTags(', '// Chests (any fixture'), c);
    vm.runInContext(extract('function getFixtureTraversalKind(', '// Store view of a container card'), c);
    vm.runInContext(extract('function closeItemModal(', 'function openItemModal('), c);
    c.isExitLocked = (current, dir) => !!(current.locked && current.locked[dir]);
    c.isExitCollapsed = (current, dir) => !!(current.collapsed && current.collapsed[dir]);
    function show(name, id = name) {
        const fixture = { name, id, tags: ['passage'], examineText: 'A visible passage.' };
        room.structural.push(fixture);
        c.openFixtureCard(fixture);
        return fixture;
    }
    const buttons = () => elements.itemModalActions.children;
    return { c, room, elements, show, buttons };
}
function test(name, fn) { fn(); console.log('PASS ' + name); }

test('stairs expose both actual vertical exits and close their card before moving', () => {
    const { c, show, buttons, elements } = harness();
    show('spiral staircase');
    assert.deepEqual(buttons().map(button => button.textContent), ['Climb up', 'Climb down', 'Leave']);
    buttons()[0].onclick();
    assert.equal(c.moved, 'U');
    assert.equal(c.closedBeforeMove, true);
    assert.equal(c.G.activeItemModal, null);
    assert.equal(elements.itemModal.classList.contains('active'), false);
});

test('cargo lift, trapdoor and ladder labels match the available direction', () => {
    for (const [name, direction, label] of [['cargo lift', 'D', 'Take lift down'], ['cargo lift', 'U', 'Take lift up'], ['trapdoor', 'D', 'Climb down'], ['ladder', 'U', 'Climb up']]) {
        const { c, room, show, buttons } = harness();
        room.exits = { [direction]: '20,30' };
        show(name);
        assert.equal(buttons().length, 2);
        assert.equal(buttons()[0].textContent, label);
        buttons()[0].onclick();
        assert.equal(c.moved, direction);
    }
});

test('banister and runner in a stairs room use its actual staircase', () => {
    for (const name of ['polished banister', 'threadbare runner']) {
        const { room, show, buttons } = harness();
        room.type = 'Stairs';
        room.exits = { U: '10,60' };
        show(name);
        assert.equal(buttons()[0].textContent, 'Climb up');
    }
});

test('passage scenery does not become a shortcut and missing routes are not invented', () => {
    const { c, room, show, buttons, elements } = harness();
    room.type = 'Lift Shaft';
    for (const name of ['winch chains', 'rusted rails']) {
        const fixture = show(name, name === 'winch chains' ? 'lift-chains' : 'rusted-rails');
        assert.equal(c.getFixtureMovementOptions(fixture, room).length, 0);
        assert.deepEqual(buttons().map(button => button.textContent), ['Leave']);
    }
    room.exits = { N: '0,1' };
    show('spiral staircase');
    assert.deepEqual(buttons().map(button => button.textContent), ['Leave']);
    assert.match(elements.itemModalStats.textContent, /No usable route/);
    assert.deepEqual(room.exits, { N: '0,1' });
});

test('an adjacent stair landing is approached with one normal movement step', () => {
    const { c, room, show, buttons } = harness();
    room.type = 'Inn';
    room.exits = { E: '1,0', N: '0,1' };
    c.G.roomMap['1,0'] = { coords: '1,0', type: 'Stairs', exits: { U: '1,60' } };
    c.G.roomMap['0,1'] = { coords: '0,1', type: 'Bedroom' };
    show('staircase');
    assert.equal(buttons()[0].textContent, 'Go to stairs (E)');
    buttons()[0].onclick();
    assert.equal(c.moved, 'E');
});

test('locked and collapsed exits remain actionable through standard movement handling', () => {
    const { c, room, show, buttons } = harness();
    room.locked = { U: true };
    room.collapsed = { D: true };
    show('stairs');
    assert.equal(buttons()[0].textContent, 'Climb up (locked)');
    assert.equal(buttons()[1].textContent, 'Climb down (blocked)');
    assert.equal(buttons()[0].disabled, false);
    buttons()[1].onclick();
    assert.equal(c.moved, 'D');
});

test('combat and carrying restrictions prevent using fixture buttons to bypass movement rules', () => {
    const { c, show, buttons } = harness();
    c.G.activeNPCMode = 'combat';
    const fixture = show('cargo lift');
    assert.equal(buttons()[0].disabled, true);
    assert.match(buttons()[0].title, /fight or flee/);
    c.moveThroughFixture(fixture, c.G.activeRoom, { direction: 'U', target: '0,1000' });
    assert.equal(c.moved, undefined);
    c.G.activeNPCMode = null;
    c.getBodyMoveBlockReason = () => 'You cannot carry that through here.';
    c.openFixtureCard(fixture);
    assert.equal(buttons()[0].disabled, true);
    assert.match(buttons()[0].title, /cannot carry/);
});

test('stale cards, changed exits, removed fixtures and concealed passages cannot move the player', () => {
    for (const change of ['room', 'target', 'fixture', 'concealed']) {
        const { c, room, show, buttons } = harness();
        const fixture = show('trapdoor');
        const click = buttons()[0].onclick;
        if (change === 'room') c.G.activeRoom = { ...room };
        if (change === 'target') room.exits.U = '10,10';
        if (change === 'fixture') room.structural = [];
        if (change === 'concealed') fixture.concealed = true;
        click();
        assert.equal(c.moved, undefined, change);
        assert.match(c.narration, /no longer available/, change);
    }
});

test('discovered hidden passages are usable without revealing other exits', () => {
    const { c, room } = harness();
    room.examined = false;
    const fixture = { name: 'trapdoor', concealed: true };
    assert.equal(c.getFixtureMovementOptions(fixture, room).length, 0);
    fixture.revealed = true;
    assert.equal(c.getFixtureMovementOptions(fixture, room).length, 2);
});

test('fixture clicks run the real movement flow, including turns, followers and door handling', () => {
    for (const state of ['open', 'locked', 'collapsed']) {
        const { c, room, show, buttons, elements } = harness();
        vm.runInContext(extract('function parseCoords(', 'function getAdjacentCoords('), c);
        vm.runInContext(extract('function movePlayer(', '// ── PREFETCH'), c);
        const target = { coords: room.exits.U, zone: 'Town', type: 'Upstairs Hallway', exits: {}, creatures: [] };
        c.G.roomMap[target.coords] = target;
        Object.assign(c, {
            normalizeDirection: direction => direction, isVerticalDirection: direction => direction === 'U' || direction === 'D',
            resolveBodyHaulStrain: () => '', advanceNPCAffectTime() {}, rollDrunkMovementEvent: () => null,
            repairRoomExits() {}, isPortalExit: () => false, getExitLock: () => null, isDoorBurning: () => false,
            getOrCreateRoom: coords => c.G.roomMap[coords], oppositeDirection: direction => direction === 'U' ? 'D' : 'U',
            setRoomExit(current, direction, coords) { current.exits[direction] = coords; }, repairRoomMapExits() {},
            moveSessionFollowers(coords) { c.followersMovedTo = coords; },
            takeHasteFreeStep: () => false, advanceStoryTurn(turns) { c.turns = (c.turns || 0) + turns; },
            updateStoryOnRoomEntered() {}, applyBodyMoveOnPlayerMove: () => '', applyTrespassReaction: () => '', applyNudityReaction: () => '',
            openLockedDoorMenu(current, direction) { c.obstacle = ['lock', current, direction]; },
            openCollapsedExitMenu(current, direction) { c.obstacle = ['collapse', current, direction]; }
        });
        for (const name of ['renderCompanionsBar', 'queuePersonasForRoom', 'clearChatLog', 'renderRoom', 'schedulePrefetch', 'renderRoomNarration',
            'scheduleGuideArrival', 'schedulePressureEvent', 'checkGuideRoomEvents', 'checkGuideParting']) c[name] = () => {};
        if (state === 'locked') room.locked = { U: true };
        if (state === 'collapsed') room.collapsed = { U: true };
        show('worn stone stairs');
        buttons()[0].onclick();
        assert.equal(elements.itemModal.classList.contains('active'), false);
        if (state === 'open') {
            assert.equal(c.G.activeRoom, target);
            assert.equal(c.G.player.coords, target.coords);
            assert.equal(c.G.player.moveSeq, 1);
            assert.equal(c.followersMovedTo, target.coords);
            assert.equal(c.turns, 1);
            assert.equal(target.exits.D, room.coords);
            assert.equal(c.saves, 1);
        } else {
            assert.equal(c.G.activeRoom, room);
            assert.equal(c.G.player.coords, room.coords);
            assert.equal(c.turns, undefined);
            assert.equal(c.obstacle[0], state === 'locked' ? 'lock' : 'collapse');
            assert.equal(c.obstacle[2], 'U');
        }
    }
});

console.log('Fixture movement checks passed.');
