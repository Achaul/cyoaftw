const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const read = name => fs.readFileSync(path.join(root, name), 'utf8').replace(/\r\n/g, '\n');
function once(source, before, after) {
    if (source.split(before).length !== 2) throw new Error('Expected one match: ' + before.slice(0, 100));
    return source.replace(before, after);
}
function section(source, from, to) {
    const start = source.indexOf(from), end = source.indexOf(to, start);
    if (start < 0 || end <= start) throw new Error('Missing section: ' + from);
    return { start, end, text: source.slice(start, end) };
}
let core = read('before/cyoaftw-engine-CORE.js');
const oldCommands = section(core, '// Text commands are a presentation/input layer.', '// END TEXT COMMANDS');
core = core.slice(0, oldCommands.start) + read('commands.js').replace('// END TEXT COMMANDS', '') + '\n' + read('combat-commands.js') + '\n' + core.slice(oldCommands.end);
core = once(core, 'Core Engine Version: 2026-10-18-002', 'Core Engine Version: 2026-10-18-003');
core = once(core, 'window.__ENGINE_CORE_VERSION = "2026-10-18-002";', 'window.__ENGINE_CORE_VERSION = "2026-10-18-003";');
core = once(core, '// Latest: Text-mode exploration', '// Latest: Shared combat action registry, flexible text attacks/abilities, contextual show and combat queue boundaries.\n// Previous: Text-mode exploration');

// Reuse the existing menu definitions as data. Both renderers now consume the
// same costs, availability checks, and callbacks. No combat math changes.
for (const [name, after] of [
    ['getEnchantCombat', '// ── Spell display'],
    ['getSynergyCombat', 'function getSelfSynergies('],
    ['getRogueTechnique', '// Case the Place:']
]) {
    const found = section(core, 'function ' + name + 'Buttons(npc) {', after);
    let data = found.text.replace('function ' + name + 'Buttons(npc)', 'function ' + name + 'Actions(npc)').replace(/createCombatButton\(/g, 'combatActionDescriptor(');
    data += 'function ' + name + 'Buttons(npc) {\n    return ' + name + 'Actions(npc).map(createCombatActionButton);\n}\n\n';
    core = core.slice(0, found.start) + data + core.slice(found.end);
}
const menu = section(core, 'function renderCombatActionMenu(npc) {', 'function renderCombatTargetMenu(');
const from = menu.text.indexOf('    appendCombatGroup(el, "Attack", [');
const to = menu.text.indexOf('    // Touch screens');
if (from < 0 || to <= from) throw new Error('Combat groups missing');
let groups = menu.text.slice(from, to).replace(/createCombatButton\(/g, 'combatActionDescriptor(').replace(/appendCombatGroup\(el, /g, 'addGroup(');
for (const name of ['getEnchantCombat', 'getSynergyCombat', 'getRogueTechnique']) groups = groups.replace(new RegExp(name + 'Buttons\\(', 'g'), name + 'Actions(');
groups = groups.replace('disabled: !!block || !enough || power.use === "body" || power.use === "world",', 'disabled: !!block || !enough || power.use === "body" || power.use === "world",\n                targets: power.heal && power.heal.ally && getHealableAllies().length ? function () { return getCombatHealTargetActions(power, npc); } : null,');
groups = groups.replace('title: COMBAT_STANCES.guard.tip, disabled: !canHoldCombatStance("guard")', 'title: canHoldCombatStance("guard") ? COMBAT_STANCES.guard.tip : "You are too winded to hold Guard. Try Defend.", disabled: !canHoldCombatStance("guard")');
groups = groups.replace('title: COMBAT_STANCES.counter.tip, disabled: !canHoldCombatStance("counter")', 'title: canHoldCombatStance("counter") ? COMBAT_STANCES.counter.tip : "You are too winded to hold Counter. Try Defend.", disabled: !canHoldCombatStance("counter")');
groups = groups.replace('title: "Bind your bleeding wounds with a bandage - stops the bleed, costs the turn."', 'title: getTotalBleed(G.player) <= 0 ? "You have no bleeding wounds to bandage." : !findBandageInInventory() ? "You have no bandages." : "Bind your bleeding wounds with a bandage - stops the bleed, costs the turn."');
const definitions = read('combat-actions.js') + '\n\nfunction getCombatActionGroups(npc) {\n    if (!npc) return [];\n    const groups = [];\n    function addGroup(name, actions) {\n        actions.forEach(function (action) { action.group = name; action.id = name + ":" + action.id; });\n        groups.push({ name: name, actions: actions });\n    }\n' + groups + '\n    return groups;\n}\n\n';
const render = menu.text.slice(0, from) + '    getCombatActionGroups(npc).forEach(function (group) {\n        appendCombatGroup(el, group.name, group.actions.map(createCombatActionButton));\n    });\n    const textButton = createCombatButton("Text mode", function () { setTextMode(true); }, { className: "combat-text-toggle", title: "Type combat commands" });\n    textButton.id = "combatTextModeBtn";\n    el.appendChild(textButton);\n    el.classList.add("text-combat-menu");\n\n' + menu.text.slice(to);
core = core.slice(0, menu.start) + definitions + render + core.slice(menu.end);
core = once(core, 'function appendCombatGroup(el, title, buttons) {', 'function appendCombatGroup(el, title, buttons) {\n    if (!el.children.length && el.classList) el.classList.remove("text-combat-menu");');
const healMenu = section(core, '    const mk = function (label, target, e) {', '    appendCombatGroup(el, power.name + ": who?", buttons);');
core = core.slice(0, healMenu.start) + '    const buttons = getCombatHealTargetActions(power, npc).map(createCombatActionButton);\n' + core.slice(healMenu.end);
// Explicit animation completion lets queued rounds finish displaying before
// the next command replaces their narration. Clicking narration still skips.
core = once(core, '    activeCombatNarration.done = true;', '    activeCombatNarration.done = true;\n    if (typeof activeCombatNarration.textCommandDone === "function") activeCombatNarration.textCommandDone();');
core = once(core, 'function resolveNPCCounter(npc, lines, context) {', 'function resolveNPCCounter(npc, lines, context) {\n    if (typeof textModeNoteCombatTurn === "function") textModeNoteCombatTurn(context);');
core = once(core, '    const session = { rows: rowStates, done: false };', '    const session = { rows: rowStates, done: false };\n    if (typeof textModeTrackCombatNarration === "function") textModeTrackCombatNarration(session);');
core = once(core, '        if (index >= rowStates.length) {\n            session.done = true;', '        if (index >= rowStates.length) {\n            session.done = true;\n            if (typeof session.textCommandDone === "function") session.textCommandDone();');
core = once(core, '    el.textContent = "";\n    el.scrollTop = 0;\n    if (!rows.length) return;', '    if (typeof textModePublishCombat === "function") textModePublishCombat(rows);\n    el.textContent = "";\n    el.scrollTop = 0;\n    if (!rows.length) return;');
let html = read('before/cyoaftw-engine-CORE.html');
html = once(html, 'HTML Version: 2026-10-18-002', 'HTML Version: 2026-10-18-003');
html = once(html, 'window.HTML_VERSION = "2026-10-18-002";', 'window.HTML_VERSION = "2026-10-18-003";');
html = once(html, 'Type \'how\' to remember what you can do.', 'Type \'show\' to see available actions, or \'how\' for examples.');
html = once(html, '#gameWrapper.text-mode-active #interactBarEl { display: none !important; }', '#gameWrapper.text-mode-active #interactBarEl { display: none !important; }\n#gameWrapper.text-mode-active .combat-text-toggle,\n#gameWrapper.text-mode-active #roomImageWrapEl.combat-active #chatOptionsEl.text-combat-menu { display: none !important; }');
const scripts = value => value.match(/<script\s+src="[^"]+"[^>]*><\/script>/g);
if (JSON.stringify(scripts(html)) !== JSON.stringify(scripts(read('before/cyoaftw-engine-CORE.html')))) throw new Error('Script load tags changed');
const oldRouting = section(read('before/cyoaftw-engine-CORE.js'), 'function chooseChatOption(option)', 'window.chooseChatOption = chooseChatOption;').text;
if (section(core, 'function chooseChatOption(option)', 'window.chooseChatOption = chooseChatOption;').text !== oldRouting) throw new Error('Conversation routing changed');
for (const [name, content] of [['cyoaftw-engine-CORE.js', core], ['cyoaftw-engine-CORE.html', html]]) fs.writeFileSync(path.join(root, name), content.replace(/\n/g, '\r\n'));
console.log('Built staged combat text engine and shell.');
