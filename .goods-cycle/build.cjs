const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = __dirname;
const read = file => fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const baselinePath = process.argv[2] || 'C:/Git/CYOADEV/cyoaftw-engine-CORE.js';
const baseline = fs.readFileSync(baselinePath);
let core = baseline.toString('utf8').replace(/\r\n/g, '\n');
function once(a, b) {
    if (core.split(a).length !== 2) throw new Error('Expected one anchor: ' + a);
    core = core.replace(a, b);
}
once('const TEXT_COMMANDS = [', `const TEXT_COMMANDS = [
    { id: "dismantle", goods: true, args: ["item"], aliases: ["dismantle", "unpick", "salvage clothing"], example: "dismantle; dismantle linen shirt; unpick boots", description: "At a clothier, choose one carried, unworn, empty garment to dismantle. Review the exact recovered materials, fee and one-turn cost, then choose Confirm. The garment is destroyed; materials that do not fit are placed at your feet. Use options, choose <number>, back or cancel. Choices pause later commands until continue." },`);
once('    const party = typeof parseTextPartyCommand', '    const goods = typeof parseTextGoodsCommand === "function" ? parseTextGoodsCommand(raw) : null;\n    if (goods) return goods;\n    const party = typeof parseTextPartyCommand');
once('    if (show && typeof textJobsShow', '    if (show && typeof textGoodsShow === "function") { const goods = textGoodsShow(key); if (goods) return goods; }\n    if (show && typeof textJobsShow');
once('&& !def.jobs && !/^(back|cancel)', '&& !def.jobs && !def.goods && !/^(back|cancel)');
once('        if (def.jobs &&', '        if (def.goods && !textGoodsAvailable()) return false;\n        if (def.jobs &&');
once('    if (def.party) return executeTextPartyCommand(action);', '    if (def.goods) return executeTextGoodsCommand(action);\n    if (def.party) return executeTextPartyCommand(action);');
once('String args; intent only; keep speech. Unknown: {"actions":[]}.', 'Strings; intent only; keep speech. Else {"actions":[]}');
once('    if (action && action.verb === "options") return !!menu', '    if (menu && /^goods-/.test(menu.kind) && action && action.verb === "leave") return true;\n    if (action && action.verb === "options") return !!menu');
once('async function textSharedChoiceInput(input, action) {\n    const menu = sharedChoiceState.menu;', 'async function textSharedChoiceInput(input, action) {\n    const menu = sharedChoiceState.menu;\n    if (menu && /^goods-/.test(menu.kind) && action && action.verb === "leave") { clearSharedChoiceMenu(menu); return false; }');
once('    if (menu && owned && /^jobs-/.test(menu.kind)', '    if (menu && owned && /^goods-/.test(menu.kind) && textGoodsAvailable()) return openClothierDismantle(menu.npc);\n    if (menu && owned && /^jobs-/.test(menu.kind)');
once('// END TEXT COMMANDS', read(path.join(root, 'commands.js')) + '\n// END TEXT COMMANDS');
once('    if (typeof tickClothierJob === "function") tickClothierJob(steps);', '    if (typeof tickClothierJob === "function") tickClothierJob(steps);\n    if (typeof tickGoodsCycle === "function") tickGoodsCycle();');
once('    ensureClothierRucksackStock(npc);', '    if (typeof refreshMerchantGoods === "function") refreshMerchantGoods(npc);\n    ensureClothierRucksackStock(npc);');
once('    if (!npc.memory) npc.memory = {};\n    if (!Array.isArray(npc.memory.trades))', '    if (typeof noteMerchantGoodsReceived === "function") noteMerchantGoodsReceived(npc, playerGave);\n    if (!npc.memory) npc.memory = {};\n    if (!Array.isArray(npc.memory.trades))');
once('function selectNPC(npc) {', 'function selectNPC(npc) {\n    if (typeof refreshMerchantGoods === "function") refreshMerchantGoods(npc);');
once('// -- CLOTHIER: market stock and quoted, saved tailoring jobs', read(path.join(root, 'goods.js')) + '\n\n// -- CLOTHIER: market stock and quoted, saved tailoring jobs');
once('    const job = G.player.clothierJob;\n    if (job) {\n        clothierText(el,', '    el.appendChild(forgeButton("Dismantle clothing into materials", function () { openClothierDismantle(npc); }));\n    const job = G.player.clothierJob;\n    if (job) {\n        clothierText(el,');
once('Clothier services (repair / alteration / reinforce)', 'Clothier services (repair / alteration / reinforce / dismantle)');
once('    const stock = ensureNPCTradeStock(npc);\n    const playerInventory', '    const stock = ensureNPCTradeStock(npc);\n    if (typeof merchantGoodsSummary === "function") clothierText(el, merchantGoodsSummary(npc));\n    const playerInventory');
once('    const items = groups.map(function (entry, index) { return { number: index + 1, name: getItemName(entry.item), quantity: entry.infinite', '    const cycle = typeof merchantGoodsSummary === "function" ? merchantGoodsSummary(npc) : "";\n    const items = groups.map(function (entry, index) { return { number: index + 1, name: getItemName(entry.item), quantity: entry.infinite');
once(' + " Type leave to step away.", { trade:', ' + (cycle ? "\\n" + cycle : "") + " Type leave to step away.", { trade:');
// Composition is explicit data, never inferred as precious fabric from a name.
const fabrics = { 'linen-shirt': ['linen', 3], 'wool-tunic': ['wool', 3], 'travel-trousers': ['cloth', 2], 'linen-skirt': ['linen', 2], 'cloth-hood': ['cloth', 1], 'soft-gloves': ['leather', 1], 'soft-boots': ['leather', 2], 'silk-scarf': ['silk', 1] };
for (const [id, [material, units]] of Object.entries(fabrics)) once('{ id: "' + id + '", name:', '{ id: "' + id + '", composition: [{ material: "' + material + '", units: ' + units + ' }], name:');
// Different material compositions/conditions must not be collapsed into one trade stack.
once('        item.enchant ? JSON.stringify(item.enchant) : ""', '        item.enchant ? JSON.stringify(item.enchant) : "",\n        item.composition ? JSON.stringify(item.composition) : "",\n        item.durability ? JSON.stringify(item.durability) : ""');
const before = baseline.toString('utf8').replace(/\r\n/g, '\n');
once('// Core Engine Version: 2026-10-18-010', '// Core Engine Version: 2026-10-18-011');
once('window.__ENGINE_CORE_VERSION = "2026-10-18-010";', 'window.__ENGINE_CORE_VERSION = "2026-10-18-011";');
for (const [from, to] of [['function chooseChatOption(option)', 'window.chooseChatOption = chooseChatOption;'], ['function disengageFromNPC(', 'function npcLeavesAfterRebuffedAdvance('], ['function examineRoomObject(', 'function collectBodyLoot('], ['function chooseNPCAction(', '// ── COMPANION EQUIPMENT']]) {
    const slice = text => text.slice(text.indexOf(from), text.indexOf(to, text.indexOf(from)));
    if (slice(core) !== slice(before)) throw new Error('Protected routing changed: ' + from);
}
fs.writeFileSync(path.join(root, 'before.js'), baseline);
fs.writeFileSync(path.join(root, 'baseline.sha256'), crypto.createHash('sha256').update(baseline).digest('hex').toUpperCase() + '\n');
fs.writeFileSync(path.join(root, 'cyoaftw-engine-CORE.js'), core.replace(/\n/g, '\r\n'));
// The shell changes version only; all script tags and their order stay intact.
const shell = fs.readFileSync(process.argv[3] || 'C:/Git/CYOADEV/cyoaftw-engine-CORE.html');
const html = shell.toString('utf8').replaceAll('2026-10-18-010', '2026-10-18-011');
const scripts = text => text.match(/<script\s+src="[^\"]+"[^>]*><\/script>/g);
if (JSON.stringify(scripts(html)) !== JSON.stringify(scripts(shell.toString('utf8')))) throw new Error('Script tags changed');
fs.writeFileSync(path.join(root, 'before.html'), shell);
fs.writeFileSync(path.join(root, 'shell-baseline.sha256'), crypto.createHash('sha256').update(shell).digest('hex').toUpperCase() + '\n');
fs.writeFileSync(path.join(root, 'cyoaftw-engine-CORE.html'), html);
console.log('Built basic vendor goods cycle and shared clothier dismantling from current development baseline.');
