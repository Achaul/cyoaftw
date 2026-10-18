const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, file), 'utf8').replace(/\r\n/g, '\n');
function once(text, before, after) { if (text.split(before).length !== 2) throw new Error('Expected one match: ' + before.slice(0, 100)); return text.replace(before, after); }
const before = read('before/cyoaftw-engine-CORE.js');
const start = before.indexOf('// Text commands are a presentation/input layer.'), end = before.indexOf('// END TEXT COMMANDS', start);
if (start < 0 || end < start) throw new Error('Missing command block');
let core = before.slice(0, start) + ['commands.js', 'combat-commands.js', 'inventory-commands.js', 'trade-commands.js', 'loot-commands.js', 'exploration-commands.js'].map(file => read(file).replace('// END TEXT COMMANDS', '')).join('\n') + '\n' + before.slice(end);
core = once(core, 'Core Engine Version: 2026-10-18-007', 'Core Engine Version: 2026-10-18-008');
core = once(core, 'window.__ENGINE_CORE_VERSION = "2026-10-18-007";', 'window.__ENGINE_CORE_VERSION = "2026-10-18-008";');
core = once(core, '// Latest: Shared paid', '// Latest: Text room exploration, visible fixture selection/actions and portal travel confirmations.\n// Previous: Shared paid');
core = once(core, 'function openFixtureCard(fixture, cardOptions) {', 'function openFixtureCard(fixture, cardOptions) {\n    if (typeof textExplorationCaptureCard === "function" && textExplorationCaptureCard(fixture, cardOptions)) return;');
core = once(core, 'function presentReadText(room, text, title) {', 'function presentReadText(room, text, title) {\n    if (textModeState.enabled && textModeState.explorationTask) { textModeResult("completed", text, { reading: { title: title, text: text } }); return; }');
// A room search pays/advances time before discovery. Never reveal old-room
// fixtures or new arrivals if autonomy changes the scene during that turn.
const searchStart = core.indexOf('function performRoomSearch('), searchEnd = core.indexOf('// ── CONTAINERS', searchStart);
let search = core.slice(searchStart, searchEnd);
search = once(search, '    const lines = [];', '    const lines = [];\n    const searchNPC = G.activeNPC, searchMode = G.activeNPCMode;\n    const searchTargets = getConcealedRoomFixtures(room).map(function (fixture) { return { fixture: fixture, stat: fixture.revealStat, dc: fixture.revealDC }; });');
search = once(search, '    const candidates = getConcealedRoomFixtures(room)\n        .filter(fixture => fixture.revealed !== true && fixture.revealStat === approach.stat);',
    '    if (G.player !== player || G.activeRoom !== room || G.activeNPC !== searchNPC || G.activeNPCMode !== searchMode || player.dead || player.hp <= 0 || player.unconscious || player._dying || player._collapsing || roomHasActiveHostile(room) || isRoomCollapsed(room)) {\n        const message = "Your room search was interrupted. Its stamina and turn costs are spent; nothing new was revealed.";\n        setNarration(message); renderStats(); saveGameState();\n        if (G.player === player && G.activeRoom === room && roomHasActiveHostile(room) && typeof triggerRoomAmbush === "function") triggerRoomAmbush(room);\n        return { status: "interrupted", message: message };\n    }\n    const candidates = getConcealedRoomFixtures(room)\n        .filter(fixture => fixture.revealed !== true && fixture.revealStat === approach.stat && searchTargets.some(function (target) { return target.fixture === fixture && target.stat === fixture.revealStat && target.dc === fixture.revealDC; }));');
core = core.slice(0, searchStart) + search + core.slice(searchEnd);
let html = read('before/cyoaftw-engine-CORE.html');
html = once(html, 'HTML Version: 2026-10-18-007', 'HTML Version: 2026-10-18-008');
html = once(html, 'window.HTML_VERSION = "2026-10-18-007";', 'window.HTML_VERSION = "2026-10-18-008";');
const scripts = text => text.match(/<script\s+src="[^\"]+"[^>]*><\/script>/g);
if (JSON.stringify(scripts(html)) !== JSON.stringify(scripts(read('before/cyoaftw-engine-CORE.html')))) throw new Error('Script tags changed');
for (const [from, to] of [['function chooseChatOption(option)', 'window.chooseChatOption = chooseChatOption;'], ['function disengageFromNPC(', 'function npcLeavesAfterRebuffedAdvance('], ['function examineRoomObject(', 'function collectBodyLoot(']]) {
    const slice = text => text.slice(text.indexOf(from), text.indexOf(to, text.indexOf(from)));
    if (slice(core) !== slice(before)) throw new Error('Protected routing changed: ' + from);
}
for (const [file, value] of [['cyoaftw-engine-CORE.js', core], ['cyoaftw-engine-CORE.html', html]]) fs.writeFileSync(path.join(__dirname, file), value.replace(/\n/g, '\r\n'));
console.log('Built text exploration engine and shell 008.');
