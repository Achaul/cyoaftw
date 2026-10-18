const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, file), 'utf8').replace(/\r\n/g, '\n');
function once(text, before, after) {
    if (text.split(before).length !== 2) throw new Error('Expected one match: ' + before.slice(0, 100));
    return text.replace(before, after);
}
function replaceSection(text, from, to, edit) {
    const start = text.indexOf(from), end = text.indexOf(to, start);
    if (start < 0 || end <= start) throw new Error('Missing section ' + from);
    return text.slice(0, start) + edit(text.slice(start, end)) + text.slice(end);
}
const before = read('before/cyoaftw-engine-CORE.js');
let core = replaceSection(before, '// Text commands are a presentation/input layer.', '// END TEXT COMMANDS', () =>
    ['commands.js', 'combat-commands.js', 'inventory-commands.js', 'trade-commands.js'].map(file => read(file).replace('// END TEXT COMMANDS', '')).join('\n') + '\n');
core = once(core, 'Core Engine Version: 2026-10-18-004', 'Core Engine Version: 2026-10-18-005');
core = once(core, 'window.__ENGINE_CORE_VERSION = "2026-10-18-004";', 'window.__ENGINE_CORE_VERSION = "2026-10-18-005";');
core = once(core, '// Latest: Text inventory', '// Latest: Text trading, exact shared sale quotes, stock inspection and validated buy/sell batches.\n// Previous: Text inventory');
core = once(core, 'function sellTradeItems(npc, group, amount) {', read('trade-pricing.js') + '\nfunction sellTradeItems(npc, group, amount) {');
for (const [from, to, quantity, total] of [
    ['function buyTradeItem(', 'function buyTradeItems(', '1', 'price'],
    ['function buyTradeItems(', 'const MERCHANT_ROLE_ITEM_INTEREST', 'bought.length', 'spent'],
    ['function sellTradeItem(', 'function getTradeSellPrice(', '1', 'price'],
    ['function sellTradeItems(', 'function sellJunkItems(', 'sold.length', 'earned']
]) {
    core = replaceSection(core, from, to, text => once(text, '    renderTradeOptions(npc);\n    saveGameState();\n}', '    renderTradeOptions(npc);\n    saveGameState();\n    return { quantity: ' + quantity + ', total: ' + total + ' };\n}'));
}
// Preserve interest notes while delegating the exact amount to the shared quote.
core = replaceSection(core, 'function sellTradeItem(', 'function setChatOptionsDisabled(', text => {
    const old = 'const price = Math.max(1, Math.floor(basePrice * multiplier));';
    // The helper returns its calculation directly; these are the three handlers.
    if (text.split(old).length !== 4) throw new Error('Expected single, bulk and junk sale prices');
    let count = 0;
    return text.replace(/const price = Math\.max\(1, Math\.floor\(basePrice \* multiplier\)\);/g, () => {
        count++;
        return 'const price = getTradeSellPrice(npc, ' + (count === 1 ? 'item' : 'source') + ');';
    });
});
// The quote uses a return expression, so only the three transaction prices match.
core = replaceSection(core, 'function renderTradeOptions(', 'function recordTradeMemory(', text => {
    text = once(text, 'function renderTradeOptions(npc) {', 'function renderTradeOptions(npc) {\n    if (typeof renderTextModeStatus === "function") renderTextModeStatus();');
    text = once(text, 'const price = Math.max(1, Math.floor(getItemUnitValue(item) / 2));', 'const price = getTradeSellPrice(npc, item);');
    return once(text, 'Math.max(1, Math.floor(getItemUnitValue(item) / 2)) * getItemQuantity(item)', 'getTradeSellPrice(npc, item) * getItemQuantity(item)');
});
let html = read('before/cyoaftw-engine-CORE.html');
html = once(html, 'HTML Version: 2026-10-18-004', 'HTML Version: 2026-10-18-005');
html = once(html, 'window.HTML_VERSION = "2026-10-18-004";', 'window.HTML_VERSION = "2026-10-18-005";');
html = once(html, '#gameWrapper.text-mode-active #interactBarEl { display: none !important; }', '#gameWrapper.text-mode-active #interactBarEl { display: none !important; }\n#gameWrapper.text-mode-active.text-mode-trading #chatOptionsEl { display: none !important; }');
const scripts = text => text.match(/<script\s+src="[^"]+"[^>]*><\/script>/g);
if (JSON.stringify(scripts(html)) !== JSON.stringify(scripts(read('before/cyoaftw-engine-CORE.html')))) throw new Error('Script tags changed');
for (const [from, to] of [['function chooseChatOption(option)', 'window.chooseChatOption = chooseChatOption;'], ['function disengageFromNPC(', 'function npcLeavesAfterRebuffedAdvance(']]) {
    const slice = text => text.slice(text.indexOf(from), text.indexOf(to, text.indexOf(from)));
    if (slice(core) !== slice(before)) throw new Error('Protected routing changed: ' + from);
}
for (const [name, content] of [['cyoaftw-engine-CORE.js', core], ['cyoaftw-engine-CORE.html', html]]) fs.writeFileSync(path.join(__dirname, name), content.replace(/\n/g, '\r\n'));
console.log('Built staged trade text engine and shell.');
