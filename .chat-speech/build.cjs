const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync('C:/Git/CYOADEV/cyoaftw-engine-CORE.js', 'utf8');
const before = '    const mode = options && typeof options.mode === "string" ? options.mode : "auto";\r\n    const parts = buildChatTextParts(text, mode);';
const after = [
    '    let mode = options && typeof options.mode === "string" ? options.mode : "auto";',
    '    // The avatar already identifies the player. Render quoted dialogue without',
    '    // its canned speech attribution, including older choices and guide lines.',
    '    // Keep action narration (e.g. "You say goodbye and step away.") intact.',
    '    if (side === "player") {',
    '        const source = String(text || "");',
    '        const dialogue = source.replace(/^\\s*you\\s+(?:say|ask)\\s*[:,]?\\s*(?=["“<])/i, "");',
    '        if (dialogue !== source) {',
    '            text = dialogue;',
    '            mode = "auto";',
    '        }',
    '    }',
    '    const parts = buildChatTextParts(text, mode);'
].join('\r\n');
if (source.split(before).length !== 2) throw new Error('Expected exactly one renderer match');
const result = source.replace(before, after).replace('window.__ENGINE_CORE_VERSION = "2026-10-17-010";', 'window.__ENGINE_CORE_VERSION = "2026-10-17-011";');
fs.writeFileSync(path.join(__dirname, 'cyoaftw-engine-CORE.js'), result);
console.log('Prepared shared player speech display fix.');
