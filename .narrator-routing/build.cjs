const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync('C:/Git/CYOADEV/cyoaftw-engine-CORE.js', 'utf8');
let result = source;
function replaceOnce(before, after) {
    if (result.split(before).length !== 2) throw new Error('Expected one match: ' + before);
    result = result.replace(before, after);
}
replaceOnce('function animateChatBubbleText(bubble, side, speaker, text, options = {}) {',
    'function animateChatBubbleText(bubble, side, speaker, text, options = {}, scrollContainer = null) {');
replaceOnce('    const log = document.getElementById("chatLogEl");\r\n    const start = performance.now();',
    '    const log = scrollContainer || document.getElementById("chatLogEl");\r\n    const start = performance.now();');
replaceOnce('function addChatMessage(side, speaker, text, options = {}) {', [
    '// Narrator messages share the centered room narration area. Append each',
    '// message so successive action results and existing room details survive.',
    'function addNarratorMessage(text, options = {}) {',
    '    const narration = document.getElementById("narrationEl");',
    '    if (!narration || !String(text || "").trim()) return;',
    '    syncCombatLayout();',
    '    const line = document.createElement("div");',
    '    line.className = "narration-line";',
    '    narration.appendChild(line);',
    '    animateChatBubbleText(line, "left", "Narrator", text,',
    '        Object.assign({}, options, { mode: "narration" }), narration);',
    '    narration.scrollTop = narration.scrollHeight;',
    '}',
    '',
    'function addChatMessage(side, speaker, text, options = {}) {',
    '    if (String(speaker || "").trim().toLowerCase() === "narrator") {',
    '        addNarratorMessage(text, options);',
    '        return;',
    '    }'
].join('\r\n'));
replaceOnce('window.__ENGINE_CORE_VERSION = "2026-10-17-011";', 'window.__ENGINE_CORE_VERSION = "2026-10-17-012";');
fs.writeFileSync(path.join(__dirname, 'cyoaftw-engine-CORE.js'), result);
console.log('Prepared Narrator routing with centered, appended narration and existing text-speed behavior.');
