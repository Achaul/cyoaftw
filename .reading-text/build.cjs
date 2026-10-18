const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, file), 'utf8').replace(/\r\n/g, '\n');
const before = read('before/cyoaftw-engine-CORE.js');
let core = before;
function once(a, b) { if (core.split(a).length !== 2) throw new Error('Expected one anchor: ' + a.slice(0, 90)); core = core.replace(a, b); }
function edit(from, to, fn) { const a = core.indexOf(from), b = core.indexOf(to, a); if (a < 0 || b <= a) throw new Error(from); core = core.slice(0, a) + fn(core.slice(a, b)) + core.slice(b); }
once('// END TEXT COMMANDS', read('readable-actions.js') + '\n' + read('reading-commands.js') + '\n// END TEXT COMMANDS');
once('const TEXT_COMMANDS = [', 'const TEXT_COMMANDS = [\n    { id: "readables", reading: true, info: true, args: [], aliases: ["readables", "readable items"], example: "show readable items; readables", description: "List visible carried and loose readable items and their available read/study/copy/learn actions. Reading and study require carrying the item; take floor items first. Look at <item> inspects without consuming it or granting knowledge." },\n    ...["study", "copy", "learn"].map(function (verb) { return { id: verb, reading: true, args: ["item", "ability"], aliases: [verb], example: "study book of small devotions; study spellbook; copy scroll of frost shard; learn frost shard from spellbook", description: "Use the existing primer, arcane practice, recipe note, scroll copying or spellbook learning action. Study a spellbook to choose among its spells. Primers/recipe notes and completed scroll copies are consumed by their normal rules. Costs, ranks, cooldowns, skill picks and interrupted attempts remain native. Use read <item> for its text, look at <item> for inspection, options/choose and back/cancel for choices." }; }),');
once('return { id: verb, exploration: true, args: ["fixture"],', 'return { id: verb, exploration: true, args: verb === "read" ? ["item", "fixture"] : ["fixture"],');
once('    const goods = typeof parseTextGoodsCommand', '    const reading = typeof parseTextReadingCommand === "function" ? parseTextReadingCommand(raw) : null;\n    if (reading) return reading;\n    const goods = typeof parseTextGoodsCommand');
once('    if (show && typeof textGoodsShow', '    if (show && typeof textReadingShow === "function") { const reading = textReadingShow(key); if (reading) return reading; }\n    if (show && typeof textGoodsShow');
once('JSON {"actions":[{"verb":"v","args":{}}]}. Strings; intent only; keep speech. Else {"actions":[]}', '{"actions":[{"verb":"","args":{}}]}; strings; intent; keep speech.');
once('return !/^(stop|continue|back|cancel)$/.test(def.id);', 'return !/^(stop|continue|back|cancel|readables)$/.test(def.id);');
once('&& !def.goods && !/^(back|cancel)', '&& !def.goods && !def.reading && !/^(back|cancel)');
once('        if (def.goods &&', '        if (def.reading && !def.info && (textModeInCombat() || textModeRoomBlock() || roomHasActiveHostile(G.activeRoom))) return false;\n        if (def.goods &&');
once('        if (def.exploration && !def.info &&', '        if (def.id === "read") return textReadingVerbAvailable("read");\n        if (def.reading && !def.info && !textReadingVerbAvailable(def.id)) return false;\n        if (def.exploration && !def.info &&');
once('    if (def.goods) return executeTextGoodsCommand(action);', '    if (def.reading || action.verb === "read") return executeTextReadingCommand(action);\n    if (def.goods) return executeTextGoodsCommand(action);');
once('textInventoryItemName(entry.item) + (entry.slot ?', 'textInventoryItemName(entry.item) + (typeof readableItemKeywords === "function" ? readableItemKeywords(entry.item) : "") + (entry.slot ?');
once('        saveGameState();\n        return textModeResult("completed", name + ": " + description + "\\n" + lines.join("\\n"),', '        const reading = typeof describeReadableActions === "function" ? describeReadableActions(entry) : "";\n        saveGameState();\n        return textModeResult("completed", name + ": " + description + "\\n" + lines.join("\\n") + reading,');
once('{ item: { name: name, location: entry.location, quantity: entry.quantity, description: description, lines: lines } }', '{ item: { name: name, location: entry.location, quantity: entry.quantity, description: description, lines: lines, readingActions: typeof readableActions === "function" && isReadableGameItem(item) ? readableActions(entry).map(function (action) { return { verb: action.id, ability: action.ability || null, label: action.label, blockedReason: action.reason }; }) : [] } }');
once('    if (menu && owned && /^goods-/.test(menu.kind)', '    if (menu && owned && menu.kind === "reading" && !readableActionBlock()) return openTextReadingMenu(menu.readingEntry);\n    if (menu && owned && /^goods-/.test(menu.kind)');
once('    if (!menu) return false;\n    if (/^jobs-/', '    if (!menu) return false;\n    if (menu.kind === "reading" && action && /^(read|study|copy|learn)$/.test(action.verb)) return true;\n    if (/^jobs-/');
once('async function textSharedChoiceInput(input, action) {\n    const menu = sharedChoiceState.menu;', 'async function textSharedChoiceInput(input, action) {\n    const menu = sharedChoiceState.menu;\n    if (menu && menu.kind === "reading" && action && /^(read|study|copy|learn)$/.test(action.verb)) { await selectTextReadingChoice(menu, action); return true; }');
// Use the same action descriptors in normal inventory rows. Keep travel casts.
const a = core.indexOf('function renderEquipmentInventoryEntry('), b = core.indexOf('\nfunction ', a + 1);
let row = core.slice(a, b);
const start = row.indexOf('    if (isSpellScroll) {'), travel = row.indexOf('        getCastableSpellIds(G.player).filter', start), open = row.indexOf('        actionsEl.appendChild(createEquipmentActionButton("Open"', travel), end = row.indexOf('    if (isCarryContainerItem(entry.item)) {', open);
if ([start, travel, open, end].some(n => n < 0)) throw new Error('Missing native reading controls');
row = row.slice(0, start) + '    appendReadableInventoryActions(entry, actionsEl);\n    if (isSpellbook) {\n' + row.slice(travel, open) + '    }\n\n' + row.slice(end);
core = core.slice(0, a) + row + core.slice(b);
// Native handlers retain their costs/effects, with optional shared request guards.
for (const [from, to, signature, anchor] of [
    ['function copyScrollToSpellbook(', 'function describeSpellbookText(', 'copyScrollToSpellbook(scroll)', '    const copyDC ='],
    ['function learnSpellFromBook(', '// Puts a taught spell', 'learnSpellFromBook(spellId)', '    learnTechnique(player, spellId, plan.branch);'],
    ['function studyClassPrimer(', '// ---- practising', 'studyClassPrimer(stackKey)', '    const lines = [];'],
    ['function studyArcaneText(', 'function getDevotionPracticeBlockReason(', 'studyArcaneText(item)', '    player.lastArcaneStudyTurn =']
]) edit(from, to, text => {
    text = text.replace(signature, signature.slice(0, -1) + ', readingContext)');
    if (from.includes('studyClassPrimer')) text = text.replace('    if (!consumed) return "You no longer have that.";', '    if (!consumed) return "You no longer have that.";\n    if (readingContext) readingContext.consumed();');
    const index = text.indexOf(anchor); if (index < 0) throw new Error(anchor);
    text = text.slice(0, index) + '    if (readingContext && !readingContext.valid()) { readingContext.interrupted = true; saveGameState(); return "Reading was interrupted after time and any consumed material were spent. No study or copying progress was granted."; }\n' + text.slice(index);
    return text.replace('return lines.join(" ");', 'return (readingContext && readingContext.textPresentation ? lines.filter(function (line) { return !isCombatDebugLine(line); }) : lines).join(" ");');
});
once('async function generateLoreNoteContent(item) {', 'async function generateLoreNoteContent(item, readingContext) {');
once('    item.generatedContent = content;', '    if (readingContext && !readingContext.valid()) return null;\n    item.generatedContent = content;');
once('    if (topicId === "deity" && deity) item.generatedDeityId = deity.id;', '    if (topicId === "deity" && deity) item.generatedDeityId = deity.id;\n    if (readingContext) readingContext.contentGenerated();');
once('async function readLoreNoteEntry(stackKey) {', 'async function readLoreNoteEntry(stackKey, readingContext) {');
once('    const content = await generateLoreNoteContent(entry.item);', '    const content = await generateLoreNoteContent(entry.item, readingContext);\n    if (readingContext && !readingContext.valid()) return null;');
once('// Core Engine Version: 2026-10-18-011', '// Core Engine Version: 2026-10-18-012');
once('// Latest:', '// Latest: Shared readable actions, look-at inspection, text reading/study/copy/learning and guarded completion.\n// Previous:');
once('window.__ENGINE_CORE_VERSION = "2026-10-18-011";', 'window.__ENGINE_CORE_VERSION = "2026-10-18-012";');
for (const [from, to] of [['function chooseChatOption(option)', 'window.chooseChatOption = chooseChatOption;'], ['function disengageFromNPC(', 'function npcLeavesAfterRebuffedAdvance('], ['function examineRoomObject(', 'function collectBodyLoot('], ['function chooseNPCAction(', '// ── COMPANION EQUIPMENT']]) {
    const slice = text => text.slice(text.indexOf(from), text.indexOf(to, text.indexOf(from)));
    if (slice(core) !== slice(before)) throw new Error('Protected routing changed: ' + from);
}
const oldHtml = read('before/cyoaftw-engine-CORE.html'), html = oldHtml.replaceAll('2026-10-18-011', '2026-10-18-012');
const scripts = text => text.match(/<script\s+src="[^\"]+"[^>]*><\/script>/g);
if (JSON.stringify(scripts(html)) !== JSON.stringify(scripts(oldHtml))) throw new Error('Scripts changed');
for (const [file, text] of [['cyoaftw-engine-CORE.js', core], ['cyoaftw-engine-CORE.html', html]]) fs.writeFileSync(path.join(__dirname, file), text.replace(/\n/g, '\r\n'));
console.log('Built reading/study 012 from current 011 with subsequent fixes preserved.');
