const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, file), 'utf8').replace(/\r\n/g, '\n');
function once(text, before, after) {
    if (text.split(before).length !== 2) throw new Error('Expected one match: ' + before.slice(0, 100));
    return text.replace(before, after);
}
function edit(text, from, to, fn) {
    const start = text.indexOf(from), end = text.indexOf(to, start);
    if (start < 0 || end <= start) throw new Error('Missing section ' + from);
    return text.slice(0, start) + fn(text.slice(start, end)) + text.slice(end);
}
const before = read('before/cyoaftw-engine-CORE.js');
let core = edit(before, '// Text commands are a presentation/input layer.', '// END TEXT COMMANDS', () =>
    ['commands.js', 'combat-commands.js', 'inventory-commands.js', 'trade-commands.js', 'loot-commands.js'].map(file => read(file).replace('// END TEXT COMMANDS', '')).join('\n') + '\n');
core = once(core, 'Core Engine Version: 2026-10-18-005', 'Core Engine Version: 2026-10-18-006');
core = once(core, 'window.__ENGINE_CORE_VERSION = "2026-10-18-005";', 'window.__ENGINE_CORE_VERSION = "2026-10-18-006";');
core = once(core, '// Latest: Text trading', '// Latest: Text containers and body loot, quantity transfers, chest locks, and party-aware queue pauses.\n// Previous: Text trading');
core = once(core, 'function getBodyLootRows(body) {', read('loot-actions.js') + '\nfunction getBodyLootRows(body) {');
for (const [from, to] of [['function renderPartyLootDivision(', 'function assignPendingLoot('], ['function renderLootObjection(', 'function leavePartyOverLoot(']]) {
    core = edit(core, from, to, text => {
        const matches = text.match(/    appendCombatGroup\(el,[^\n]+\);/g) || [];
        if (matches.length !== 1) throw new Error('Missing party choice group');
        return once(text, matches[0], matches[0] + '\n    if (typeof textLootMarkPartyView === "function") textLootMarkPartyView(el);');
    });
}
for (const [name, args] of [['openFixtureCard', 'fixture, cardOptions'], ['openContainerCard', 'container, message'], ['renderRoomObjectActionMenu', 'item']]) {
    const source = name === 'openFixtureCard' ? 'fixture' : name === 'openContainerCard' ? 'container' : 'item';
    const options = name === 'openFixtureCard' ? 'cardOptions' : name === 'openContainerCard' ? '{ message: message }' : 'null';
    core = once(core, 'function ' + name + '(' + args + ') {', 'function ' + name + '(' + args + ') {\n    if (typeof textLootCaptureCard === "function" && textLootCaptureCard(' + source + ', ' + options + ')) return;');
}
// Carry-container buttons keep string feedback; text callers can request a
// structured result without parsing human-readable messages for success.
for (const [from, to, params] of [
    ['function getFromContainer(', '// Puts one unit', 'container, item'],
    ['function storeInCarryContainer(', '// The card for searching', 'container, stackKey']
]) core = edit(core, from, to, text => {
    text = once(text, '(' + params + ') {', '(' + params + ', options) {\n    const finish = function (message, moved) { return options && options.result ? { message: message, moved: moved || 0 } : message; };');
    return text.replace(/return ("[^;\n]+");/g, (_all, message) => 'return finish(' + message + ', ' + (/^"You (take|put) /.test(message) ? 1 : 0) + ');');
});
core = edit(core, 'function takeContainerItem(', 'function equipContainerItem(', text => {
    text = once(text, 'function takeContainerItem(fixture, index)', 'function takeContainerItem(fixture, index, amount)');
    return once(text, '    const item = stash.items[index];\n    if (!item) return;\n    stash.items.splice(index, 1);', '    const item = takeLootUnitsFromList(stash.items, stash.items[index], amount);\n    if (!item) return;');
});
core = edit(core, 'function takeBodyInventoryItem(', '// Takes every item', text => {
    text = once(text, 'function takeBodyInventoryItem(body, lootItem)', 'function takeBodyInventoryItem(body, lootItem, amount)');
    return once(text, '    const taken = body.inventory.splice(index, 1)[0];', '    const taken = takeLootUnitsFromList(body.inventory, lootItem, amount);\n    if (!taken) return;');
});
core = edit(core, 'function getBodyLootRows(', 'function refreshBodyLootUi(', text => {
    text = once(text, 'if (loot && !loot.hidden && !loot.isHidden)', 'if (isLootItemVisible(loot))');
    return once(text, 'if (!equippedItem || Array.isArray(equippedItem)) return;', 'if (!isLootItemVisible(equippedItem) || Array.isArray(equippedItem)) return;');
});
core = edit(core, 'function describeContainerLootNames(', '// openOpts.intro:', text => once(text, 'const names = items.map(', 'const names = items.filter(isLootItemVisible).map('));
core = edit(core, 'function openFixtureCard(', '// Store view of a container card:', text => once(text,
    'stash.items.forEach(function (item, index) {',
    'stash.items.forEach(function (item, index) {\n                    if (!isLootItemVisible(item)) return;'));
core = edit(core, 'function collectBodyLoot(', 'function takeRoomObject(', text => {
    const start = text.indexOf('    while (inventory.length) {'), end = text.indexOf('    const coins = getCoinValue(item);');
    if (start < 0 || end < start) throw new Error('Missing bulk body collection');
    const replacement = `    const remaining = [];
    inventory.forEach(function (loot) {
        if (isLootItemVisible(loot)) { gathered.push({ ...loot }); found.push(getItemName(loot)); }
        else if (loot) remaining.push(loot);
    });
    item.inventory = remaining;
    const equipped = item.equipped || {};
    Object.keys(equipped).forEach(function (slot) {
        if (slot === "coinPouch") return;
        const piece = equipped[slot];
        if (Array.isArray(piece)) {
            piece.filter(isLootItemVisible).forEach(function (entry) { gathered.push({ ...entry }); found.push(getItemName(entry)); });
            const hidden = piece.filter(function (entry) { return entry && !isLootItemVisible(entry); });
            if (hidden.length) equipped[slot] = hidden; else delete equipped[slot];
        } else if (isLootItemVisible(piece)) {
            gathered.push({ ...piece }); found.push(getItemName(piece)); delete equipped[slot];
        }
    });

`;
    return text.slice(0, start) + replacement + text.slice(end);
});
core = edit(core, 'function takeAllFromContainer(', 'function storeInContainer(', text => {
    text = once(text, 'describeContainerLootNames(stash.items, stash.coins)', 'describeContainerLootNames(stash.items.filter(isLootItemVisible), stash.coins)');
    text = once(text, 'const takenItems = stash.items.slice();', 'const takenItems = stash.items.filter(isLootItemVisible);');
    return once(text, 'stash.items = [];', 'stash.items = stash.items.filter(function (item) { return !isLootItemVisible(item); });');
});
let html = read('before/cyoaftw-engine-CORE.html');
html = once(html, 'HTML Version: 2026-10-18-005', 'HTML Version: 2026-10-18-006');
html = once(html, 'window.HTML_VERSION = "2026-10-18-005";', 'window.HTML_VERSION = "2026-10-18-006";');
const scripts = text => text.match(/<script\s+src="[^"]+"[^>]*><\/script>/g);
if (JSON.stringify(scripts(html)) !== JSON.stringify(scripts(read('before/cyoaftw-engine-CORE.html')))) throw new Error('Script tags changed');
for (const [from, to] of [['function chooseChatOption(option)', 'window.chooseChatOption = chooseChatOption;'], ['function disengageFromNPC(', 'function npcLeavesAfterRebuffedAdvance('], ['function examineRoomObject(', 'function collectBodyLoot(']]) {
    const slice = text => text.slice(text.indexOf(from), text.indexOf(to, text.indexOf(from)));
    if (slice(core) !== slice(before)) throw new Error('Protected routing changed: ' + from);
}
for (const [name, content] of [['cyoaftw-engine-CORE.js', core], ['cyoaftw-engine-CORE.html', html]]) fs.writeFileSync(path.join(__dirname, name), content.replace(/\n/g, '\r\n'));
console.log('Built staged container/loot text engine and shell.');
