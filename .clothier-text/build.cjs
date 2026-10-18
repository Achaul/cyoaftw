const fs = require('node:fs'), path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8').replace(/\r\n/g, '\n');
const before = read('before/cyoaftw-engine-CORE.js'); let core = before;
function replace(a, b) { if (core.split(a).length !== 2) throw new Error('Expected one anchor: ' + a.slice(0, 100)); core = core.replace(a, b); }
function editFunction(name, fn) {
    const match = new RegExp('(?:async )?function ' + name + '\\(').exec(core); if (!match) throw new Error(name);
    const start = match.index, end = core.indexOf('\n}', start) + 2; if (end < start) throw new Error('Missing end: ' + name);
    core = core.slice(0, start) + fn(core.slice(start, end)) + core.slice(end);
}
replace('// END TEXT COMMANDS', read('tailor-actions.js') + '\n' + read('tailor-commands.js') + '\n// END TEXT COMMANDS');
replace('const TEXT_COMMANDS = [', 'const TEXT_COMMANDS = [\n    { id: "tailor", tailoring: true, args: ["action", "target"], aliases: ["tailor", "tailoring", "clothier"], example: "tailor; show tailoring; tailor repair linen shirt; alter coat; reinforce tunic; offer 2 linen; offer 1 blue dye; request \\\"shorten the sleeves and add blue trim\\\"; quote; collect tailoring; pockets rucksack", description: "Talk or trade with a clothier. Choose repair, alteration or reinforce and a garment, offer <quantity> <material/dye>, describe the work with request <quoted description>, then quote. At least one material is required; offer 0 <name> keeps it. Review the native quote and explicitly accept by number before any fee/material is taken. One garment is left for the quoted work duration; collect tailoring retrieves it when ready. Alteration success/appeal is appraised at collection. Pockets <bag> reviews +3 slots for 75g and one turn per bag/clothier pair. Options/back/cancel/leave work; one menu step per reply and explicit continue for older queued work." },');
replace('    const enchanting = typeof parseTextEnchanterCommand', '    const tailoring = typeof parseTextTailorCommand === "function" ? parseTextTailorCommand(raw) : null;\n    if (tailoring) return tailoring;\n    const enchanting = typeof parseTextEnchanterCommand');
replace('    if (show && typeof textEnchanterShow', '    if (show && typeof textTailorShow === "function") { const tailor = textTailorShow(key); if (tailor) return tailor; }\n    if (show && typeof textEnchanterShow');
replace('!def.enchanter && !/^(back|cancel)', '!def.enchanter && !def.tailoring && !/^(back|cancel)');
replace('        if (def.enchanter &&', '        if (def.tailoring && tailorServiceBlock(G.activeNPC)) return false;\n        if (def.enchanter &&');
replace('    if (def.enchanter) return executeTextEnchanterCommand(action);', '    if (def.tailoring) return executeTextTailorCommand(action);\n    if (def.enchanter) return executeTextEnchanterCommand(action);');
replace('};literal speech\\n', '};say=raw\\n');
replace('shape.verbs.join("|") + "{" + shape.args + "}"', 'shape.verbs.join("|") + (shape.args ? "{" + shape.args + "}" : "")');
replace('    if (menu && owned && /^enchanter-/', '    if (menu && owned && /^tailor-/.test(menu.kind) && !tailorServiceBlock(menu.npc)) { return tailorMenu(menu.npc, "services"); }\n    if (menu && owned && /^enchanter-/');
replace('    if (!menu) return false;\n    if (/^enchanter-/', '    if (!menu) return false;\n    if (/^tailor-/.test(menu.kind) && action && /^(tailor|leave)$/.test(action.verb)) return true;\n    if (/^enchanter-/');
replace('async function textSharedChoiceInput(input, action) {\n    const menu = sharedChoiceState.menu;', 'async function textSharedChoiceInput(input, action) {\n    const menu = sharedChoiceState.menu;\n    if (menu && /^tailor-/.test(menu.kind) && action && /^(tailor|leave)$/.test(action.verb)) { await textTailorMenuInput(menu, action, input); return true; }');
for (const [name, call] of [
    ['renderClothierServices', 'tailorMenu(npc, "services")'], ['renderClothierGarmentPicker', 'tailorMenu(npc, "garments", service)'],
    ['renderClothierRequest', 'openTailorRequest(npc, item, service)'], ['renderClothierQuote', 'renderTailorQuote(plan)'], ['renderClothierPocketPicker', 'tailorMenu(npc, "pockets")']
]) editFunction(name, text => text.slice(0, text.indexOf('{') + 1) + '\n    return ' + call + ';\n}');
editFunction('clothierServiceAvailable', () => 'function clothierServiceAvailable(npc) { return G.activeNPCMode === "clothier" && !tailorServiceBlock(npc, true); }');
editFunction('getClothierGarments', text => text.replace('return isClothierGarment(it)', 'return isLootItemVisible(it) && isClothierGarment(it)'));
editFunction('getClothierRucksacks', text => text.replace('return item && !Array.isArray(item)', 'return isLootItemVisible(item) && !Array.isArray(item)'));
editFunction('isClothierMaterial', text => text.replace('if (!item || Array.isArray(item))', 'if (!isLootItemVisible(item) || Array.isArray(item))'));
editFunction('getClothierServiceBlock', text => text.replace('    const d = ensureDurability', '    if (getItemQuantity(item) > 1 && clothierItemHasContents(item)) return "Separate one empty garment from this stack before leaving it for tailoring.";\n    const d = ensureDurability'));
editFunction('getClothierPlanBlock', text => text.replace('    if (!plan ||', '    if (plan && (tailorServiceBlock(plan.npc) || !plan.contextGuard || !plan.contextGuard() || JSON.stringify(plan.quote) !== plan.quoteStamp)) return "That tailoring quote changed. Ask for a new quote.";\n    if (!plan ||'));
editFunction('patchClothierPockets', text => {
    text = text.replace('    const block = getClothierPocketBlock(npc, item);', '    const block = tailorServiceBlock(npc) || getClothierPocketBlock(npc, item);');
    text = text.replace('    advanceStoryTurn(1);', '    const work = captureTailorWork(npc, false);\n    advanceStoryTurn(1);\n    if (!work.valid()) return interruptTailorWork(work);\n    endTailorWork(work);\n    publishTailorResult("pockets", { item: getItemName(item), fee: CLOTHIER_POCKET_FEE, turns: 1, capacity: item.container.maxUnitCapacity });');
    return text.replace('    saveGameState();\n}', '    saveGameState();\n    return { status: "completed" };\n}');
});
editFunction('acceptClothierQuote', text => {
    text = text.replace('    if (clothierPendingQuote !== plan) return;', '    if (clothierPendingQuote !== plan) return sharedChoiceResult("blocked", "That quote was already consumed or replaced.");');
    text = text.replace('        held = cloneItemForStackAmount(item, 1);', '        held = cloneEnchanterItem(item);\n        held.quantity = 1;');
    text = text.replace('    advanceStoryTurn(1); // The quoted work time begins after this visit.', '    const work = captureTailorWork(plan.npc, false);\n    advanceStoryTurn(1); // The quoted work time begins after this visit.\n    if (!work.valid()) return interruptTailorWork(work);\n    endTailorWork(work);\n    publishTailorResult("commission", { service: plan.service, item: getItemName(held), fee: q.fee, turns: 1, readyIn: q.turns });');
    return text.replace('    saveGameState();\n}', '    saveGameState();\n    return { status: "completed" };\n}');
});
editFunction('collectClothierJob', text => {
    const at = text.indexOf('{'); let body = text.slice(at + 1, -1);
    body = body.replace('    if (!job || !clothierServiceAvailable(npc) || job.turnsLeft > 0 || !job.item) return;', '    if (!job || !clothierServiceAvailable(npc) || job.turnsLeft > 0 || !job.item) return sharedChoiceResult("blocked", "There is no finished tailoring job to collect.");');
    body = body.replace('        if (G.player !== player || G.player.clothierJob !== job) return;', '        if (!work.valid()) return interruptTailorWork(work);\n        if (G.player !== player || G.player.clothierJob !== job) return interruptTailorWork(work);\n        outcome = outcome && validateClothierAppraisal(outcome, job);');
    body = body.replace('        if (!outcome) { showTradeMessage("The final appraisal is unavailable. Your finished work is safe; try collecting it again.", false); return; }', '        if (!outcome) { endTailorWork(work); renderClothierServices(npc); return sharedChoiceResult("blocked", "The final appraisal is unavailable. Your finished work is safe; try collecting it again."); }');
    body = body.replace('        job.outcome = outcome;', '        job.outcome = outcome;\n        work.commit();');
    body = body.replace('    G.player.clothierJob = null;', '    if (!work.valid()) return interruptTailorWork(work);\n    G.player.clothierJob = null;');
    body = body.replace('    renderStats();', '    endTailorWork(work);\n    publishTailorResult("collect", { service: job.service, item: getItemName(job.item), fee: 0, turns: 0, appraisal: job.outcome || null });\n    renderStats();');
    return text.slice(0, at + 1) + '\n    const block = tailorServiceBlock(npc);\n    if (block) return sharedChoiceResult("blocked", block);\n    const work = captureTailorWork(npc);\n    try {' + body + '\n    return { status: "completed" };\n    } finally { endTailorWork(work); }\n}';
});
replace('// Core Engine Version: 2026-10-18-015', '// Core Engine Version: 2026-10-18-016');
replace('window.__ENGINE_CORE_VERSION = "2026-10-18-015";', 'window.__ENGINE_CORE_VERSION = "2026-10-18-016";');
replace('// Latest:', '// Latest: Shared clothier text drafts, guarded quotes/jobs/appraisals and pocket confirmations.\n// Previous:');
for (const [from, to] of [['function chooseChatOption(option)', 'window.chooseChatOption = chooseChatOption;'], ['function disengageFromNPC(', 'function npcLeavesAfterRebuffedAdvance('], ['function examineRoomObject(', 'function collectBodyLoot('], ['function chooseNPCAction(', '// ── COMPANION EQUIPMENT']]) {
    const slice = text => text.slice(text.indexOf(from), text.indexOf(to, text.indexOf(from))); if (slice(core) !== slice(before)) throw new Error('Protected routing changed: ' + from);
}
const oldHTML = read('before/cyoaftw-engine-CORE.html'), html = oldHTML.replaceAll('2026-10-18-015', '2026-10-18-016');
const scripts = text => text.match(/<script\s+src="[^\"]+"[^>]*><\/script>/g); if (JSON.stringify(scripts(html)) !== JSON.stringify(scripts(oldHTML))) throw new Error('Script tags changed');
for (const [name, text] of [['cyoaftw-engine-CORE.js', core], ['cyoaftw-engine-CORE.html', html]]) fs.writeFileSync(path.join(__dirname, name), text.replace(/\n/g, '\r\n'));
const browserHeader = read('browser-crafting.cjs').split('\n').slice(0, 19).join('\n');
fs.writeFileSync(path.join(__dirname, 'browser-clothier.cjs'), browserHeader + '\n' + read('browser-clothier-flows.js'));
console.log('Built clothier 016 from installed 015.');
