const fs = require('node:fs'), path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8').replace(/\r\n/g, '\n');
const before = read('before/cyoaftw-engine-CORE.js'); let core = before;
function replace(a, b) { if (core.split(a).length !== 2) throw new Error('Expected one anchor: ' + a.slice(0, 100)); core = core.replace(a, b); }
function editFunction(name, fn) {
    const match = new RegExp('(?:async )?function ' + name + '\\(').exec(core);
    if (!match) throw new Error(name);
    const start = match.index, end = core.indexOf('\n}', start) + 2;
    if (end < start) throw new Error('Missing end: ' + name);
    core = core.slice(0, start) + fn(core.slice(start, end)) + core.slice(end);
}
replace('// END TEXT COMMANDS', read('enchanter-actions.js') + '\n' + read('enchanter-commands.js') + '\n// END TEXT COMMANDS');
replace('const TEXT_COMMANDS = [', 'const TEXT_COMMANDS = [\n    { id: "enchanter", enchanter: true, args: ["action", "target"], aliases: ["enchanter", "enchanting"], example: "enchanter; show enchanting; show duplication; enchant iron sword; duplicate healing potion", description: "Talk or trade with an enchanter first. Enchant <weapon> selects a sound carried or equipped weapon; duplicate <item> selects one visible carried inventory entry, copying its whole stack and embedded packed contents. Review the fee and success chance, then explicitly confirm by number. Attempts cost no story turn; failure still spends the fee and keeps the original. Enchantment limits and bonuses use native rules. Options/back/cancel/leave work; answer one menu step per reply, then leave and continue an older batch explicitly." },');
replace('    const forging = typeof parseTextForgeCommand', '    const enchanting = typeof parseTextEnchanterCommand === "function" ? parseTextEnchanterCommand(raw) : null;\n    if (enchanting) return enchanting;\n    const forging = typeof parseTextForgeCommand');
replace('    if (show && typeof textForgeShow', '    if (show && typeof textEnchanterShow === "function") { const service = textEnchanterShow(key); if (service) return service; }\n    if (show && typeof textForgeShow');
replace('!def.forge && !/^(back|cancel)', '!def.forge && !def.enchanter && !/^(back|cancel)');
replace('        if (def.forge &&', '        if (def.enchanter && enchanterServiceBlock(G.activeNPC)) return false;\n        if (def.forge &&');
replace('    if (def.forge) return executeTextForgeCommand(action);', '    if (def.enchanter) return executeTextEnchanterCommand(action);\n    if (def.forge) return executeTextForgeCommand(action);');
// The grouped schema supplies the new action/target intent without extra context.
replace('}; strings; keep speech.\\n', '};literal speech\\n');
replace('    if (menu && owned && /^forge-/', '    if (menu && owned && /^enchanter-/.test(menu.kind) && !enchanterServiceBlock(menu.npc)) { return enchanterMenu(menu.npc, "services"); }\n    if (menu && owned && /^forge-/');
replace('    if (!menu) return false;\n    if (/^forge-/', '    if (!menu) return false;\n    if (/^enchanter-/.test(menu.kind) && action && /^(enchanter|leave)$/.test(action.verb)) return true;\n    if (/^forge-/');
replace('async function textSharedChoiceInput(input, action) {\n    const menu = sharedChoiceState.menu;', 'async function textSharedChoiceInput(input, action) {\n    const menu = sharedChoiceState.menu;\n    if (menu && /^enchanter-/.test(menu.kind) && action && /^(enchanter|leave)$/.test(action.verb)) { await textEnchanterMenuInput(menu, action, input); return true; }');
for (const [name, view] of [['renderEnchanterServices', 'services'], ['renderEnchantItemPicker', 'enchant'], ['renderDuplicateItemPicker', 'duplicate']]) {
    editFunction(name, text => text.slice(0, text.indexOf('{') + 1) + '\n    return enchanterMenu(npc, "' + view + '");\n}');
}
// Retain native fees, rolls, caps, bonus progression and zero-turn transactions.
editFunction('attemptEnchantItem', text => {
    text = text.replace('    if (!npc || !item) return;', '    const spec = enchanterActionSpec("enchant", npc, item);\n    if (spec.reason) return sharedChoiceResult("blocked", spec.reason);\n    const coinsBefore = getCoinValue(G.player);');
    text = text.replace('        return;\n    }\n\n    item.enchantTier', '        return publishEnchanterResult(spec, false, coinsBefore);\n    }\n\n    item.enchantTier');
    text = text.replace(/(^[ \t]*)renderEnchantItemPicker\(npc\);/gm, '$1renderStats();\n$1renderEnchantItemPicker(npc);');
    return text.replace('    saveGameState();\n}', '    saveGameState();\n    return publishEnchanterResult(spec, true, coinsBefore, item);\n}');
});
editFunction('attemptDuplicateItem', text => {
    text = text.replace('    if (!npc || !item) return;', '    const spec = enchanterActionSpec("duplicate", npc, item);\n    if (spec.reason) return sharedChoiceResult("blocked", spec.reason);\n    const coinsBefore = getCoinValue(G.player);\n    let resultItem = null;');
    text = text.replace('const copy = cloneLootTemplate(item);', 'const copy = cloneEnchanterItem(item);\n        resultItem = copy;');
    text = text.replace(/(^[ \t]*)renderDuplicateItemPicker\(npc\);/gm, '$1renderStats();\n$1renderDuplicateItemPicker(npc);');
    return text.replace('    saveGameState();\n}', '    saveGameState();\n    return publishEnchanterResult(spec, !!resultItem, coinsBefore, resultItem);\n}');
});
replace('// Core Engine Version: 2026-10-18-014', '// Core Engine Version: 2026-10-18-015');
replace('window.__ENGINE_CORE_VERSION = "2026-10-18-014";', 'window.__ENGINE_CORE_VERSION = "2026-10-18-015";');
replace('// Latest:', '// Latest: Shared enchanter text menus, current-fee confirmations and independent item duplication.\n// Previous:');
for (const [from, to] of [['function chooseChatOption(option)', 'window.chooseChatOption = chooseChatOption;'], ['function disengageFromNPC(', 'function npcLeavesAfterRebuffedAdvance('], ['function examineRoomObject(', 'function collectBodyLoot('], ['function chooseNPCAction(', '// ── COMPANION EQUIPMENT']]) {
    const slice = text => text.slice(text.indexOf(from), text.indexOf(to, text.indexOf(from)));
    if (slice(core) !== slice(before)) throw new Error('Protected routing changed: ' + from);
}
const oldHTML = read('before/cyoaftw-engine-CORE.html'), html = oldHTML.replaceAll('2026-10-18-014', '2026-10-18-015');
const scripts = text => text.match(/<script\s+src="[^\"]+"[^>]*><\/script>/g);
if (JSON.stringify(scripts(html)) !== JSON.stringify(scripts(oldHTML))) throw new Error('Script tags changed');
for (const [name, text] of [['cyoaftw-engine-CORE.js', core], ['cyoaftw-engine-CORE.html', html]]) fs.writeFileSync(path.join(__dirname, name), text.replace(/\n/g, '\r\n'));
const browserHeader = read('browser-crafting.cjs').split('\n').slice(0, 19).join('\n');
fs.writeFileSync(path.join(__dirname, 'browser-enchanter.cjs'), browserHeader + '\n' + read('browser-enchanter-flows.js'));
console.log('Built enchanter 015 from installed 014.');
