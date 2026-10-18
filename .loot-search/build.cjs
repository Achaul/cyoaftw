const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, file), 'utf8').replace(/\r\n/g, '\n');
function once(text, before, after) { if (text.split(before).length !== 2) throw new Error('Expected one match: ' + before.slice(0, 100)); return text.replace(before, after); }
function edit(text, from, to, fn) { const a = text.indexOf(from), b = text.indexOf(to, a); if (a < 0 || b <= a) throw new Error('Missing section ' + from); return text.slice(0, a) + fn(text.slice(a, b)) + text.slice(b); }
const before = read('before/cyoaftw-engine-CORE.js');
let core = edit(before, '// Text commands are a presentation/input layer.', '// END TEXT COMMANDS', () =>
    ['commands.js', 'combat-commands.js', 'inventory-commands.js', 'trade-commands.js', 'loot-commands.js'].map(file => read(file).replace('// END TEXT COMMANDS', '')).join('\n') + '\n');
core = once(core, 'Core Engine Version: 2026-10-18-006', 'Core Engine Version: 2026-10-18-007');
core = once(core, 'window.__ENGINE_CORE_VERSION = "2026-10-18-006";', 'window.__ENGINE_CORE_VERSION = "2026-10-18-007";');
core = once(core, '// Latest: Text containers', '// Latest: Shared paid body/container discovery checks, search approaches and hidden-content reveal rules.\n// Previous: Text containers');
// Keep the first visible-body inspection for open/loot, separate from a paid
// thorough search. Existing guarded body examine/action branches stay intact.
core = once(core, 'function searchBodyObject(item) {', 'function revealBodyLoot(item) {');
core = once(core, 'function revealBodyLoot(item) {', read('search-actions.js') + '\nfunction revealBodyLoot(item) {');
core = once(core, 'function searchOwnContainer(container) {\n    openContainerCard(container, "");\n}', 'function searchOwnContainer(container) {\n    return searchLootContents(container, "carry", "careful");\n}');
core = edit(core, 'function renderRoomObjectActionMenu(', '// Public loot stays visible;', text => {
    const old = '        if (!item.bodyLooted) {\n            buttons.push(createCombatButton("Search", () => searchBodyObject(item)));\n        }';
    const updated = '        buttons.push(createCombatButton("Contents", () => revealBodyLoot(item)));\n        getLootSearchActions(item, "body").forEach(function (action) { buttons.push(createCombatButton(action.label, action.run, { disabled: !!action.reason, title: action.reason })); });';
    text = once(text, old, updated);
    return once(text, 'if (isCarryContainerItem(item)) buttons.push(createCombatButton("Search", () => openContainerCard(item, "")));', 'if (isCarryContainerItem(item)) {\n            buttons.push(createCombatButton("Contents", () => openContainerCard(item, "")));\n            getLootSearchActions(item, "carry").forEach(function (action) { buttons.push(createCombatButton(action.label, action.run, { disabled: !!action.reason, title: action.reason })); });\n        }');
});
core = edit(core, 'function renderSlimeRemainsActionMenu(', 'function renderRoomObjectActionMenu(', text => once(text,
    '    if (!item.bodyLooted) buttons.push(createCombatButton("Search", () => searchBodyObject(item)));',
    '    buttons.push(createCombatButton("Contents", () => revealBodyLoot(item)));\n    getLootSearchActions(item, "body").forEach(function (action) { buttons.push(createCombatButton(action.label, action.run, { disabled: !!action.reason, title: action.reason })); });'));
core = edit(core, 'function openFixtureCard(', '// Store view of a container card:', text => {
    text = once(text, 'addAction(tags.includes("storage") ? "Open" : "Search", () => openContainerFixture(fixture)', 'addAction("Open", () => openContainerFixture(fixture)');
    return once(text, '            const packHasItems = buildPlayerInventoryEntries(G.player).length > 0;', '            getLootSearchActions(fixture, "fixture").forEach(function (action) { addAction(action.label, action.run, { keepOpen: true, disabledReason: action.reason }); });\n            const packHasItems = buildPlayerInventoryEntries(G.player).length > 0;');
});
core = edit(core, 'function openContainerCard(', 'function searchOwnContainer(', text => once(text,
    '    const doneBtn = document.createElement("button");',
    '    getLootSearchActions(container, "carry").forEach(function (action) {\n        const button = createEquipmentActionButton(action.label, action.run, { disabled: !!action.reason });\n        button.title = action.reason; actionsEl.appendChild(button);\n    });\n    const doneBtn = document.createElement("button");'));
core = edit(core, 'function openContainerCard(', 'function searchOwnContainer(', text => {
    text = once(text, 'contents.slice().forEach(function (it) {', 'contents.filter(isLootItemVisible).forEach(function (it) {');
    text = once(text, 'if (!contents.length) {', 'if (!contents.some(isLootItemVisible)) {');
    return once(text, 'empty.textContent = "Nothing in here.";', 'empty.textContent = "Nothing visible here.";');
});
core = edit(core, 'function buildPlayerInventoryEntries(', 'function takeInventoryEntryAmount(', text => once(text, 'if (!item) return;', 'if (!isLootItemVisible(item)) return;'));
core = edit(core, 'function renderTradeOptions(', 'function recordTradeMemory(', text => once(text,
    '.filter(item => item && !isItemEquippedByEntity(G.player, item))', '.filter(item => isLootItemVisible(item) && !isItemEquippedByEntity(G.player, item))'));
// Equipment Search now has an explicit cost, with Contents as the free action.
for (const [from, to] of [['function renderEquipmentInventoryEntry(', '// ── CHARACTER SHEET'], ['function appendWornContainerActions(', 'function renderCompactEquipmentInventory(']]) {
    core = edit(core, from, to, text => text.replace(/createEquipmentActionButton\("Search",/g, 'createEquipmentActionButton("Search (1 stamina, 1 turn)",'));
}
// Add free Contents beside the existing carried/worn Search actions.
core = core.replace(/^(\s*)(\w+)\.appendChild\(createEquipmentActionButton\("Search(?: \(1 stamina, 1 turn\))?", (\(\) => searchOwnContainer\(([^)]+)\)|function \(\) \{ searchOwnContainer\(([^)]+)\); \})\)\);/gm,
    (all, space, parent, _callback, arrowItem, functionItem) => space + parent + '.appendChild(createEquipmentActionButton("Contents", function () { openContainerCard(' + (arrowItem || functionItem) + ', ""); }));\n' + all.replace('"Search",', '"Search (1 stamina, 1 turn)",'));
let html = read('before/cyoaftw-engine-CORE.html');
html = once(html, 'HTML Version: 2026-10-18-006', 'HTML Version: 2026-10-18-007');
html = once(html, 'window.HTML_VERSION = "2026-10-18-006";', 'window.HTML_VERSION = "2026-10-18-007";');
const scripts = text => text.match(/<script\s+src="[^\"]+"[^>]*><\/script>/g);
if (JSON.stringify(scripts(html)) !== JSON.stringify(scripts(read('before/cyoaftw-engine-CORE.html')))) throw new Error('Script tags changed');
for (const [from, to] of [['function chooseChatOption(option)', 'window.chooseChatOption = chooseChatOption;'], ['function disengageFromNPC(', 'function npcLeavesAfterRebuffedAdvance('], ['function examineRoomObject(', 'function collectBodyLoot(']]) {
    const slice = text => text.slice(text.indexOf(from), text.indexOf(to, text.indexOf(from)));
    if (slice(core) !== slice(before)) throw new Error('Protected routing changed: ' + from);
}
for (const [file, value] of [['cyoaftw-engine-CORE.js', core], ['cyoaftw-engine-CORE.html', html]]) fs.writeFileSync(path.join(__dirname, file), value.replace(/\n/g, '\r\n'));
console.log('Built staged loot-discovery engine and shell.');
