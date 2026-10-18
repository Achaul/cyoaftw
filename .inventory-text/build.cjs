const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, file), 'utf8').replace(/\r\n/g, '\n');
function once(text, before, after) {
    if (text.split(before).length !== 2) throw new Error('Expected one match: ' + before);
    return text.replace(before, after);
}
const before = read('before/cyoaftw-engine-CORE.js');
const start = before.indexOf('// Text commands are a presentation/input layer.');
const end = before.indexOf('// END TEXT COMMANDS', start);
if (start < 0 || end <= start) throw new Error('Missing command block');
let core = before.slice(0, start) + read('commands.js').replace('// END TEXT COMMANDS', '') + '\n' + read('combat-commands.js') + '\n' + read('inventory-commands.js') + '\n' + before.slice(end);
core = once(core, 'Core Engine Version: 2026-10-18-003', 'Core Engine Version: 2026-10-18-004');
core = once(core, 'window.__ENGINE_CORE_VERSION = "2026-10-18-003";', 'window.__ENGINE_CORE_VERSION = "2026-10-18-004";');
core = once(core, '// Latest: Shared combat', '// Latest: Text inventory selection, inspection, equipment, floor pickup, dropping, and combat-aware consumables.\n// Previous: Shared combat');
let html = read('before/cyoaftw-engine-CORE.html');
html = once(html, 'HTML Version: 2026-10-18-003', 'HTML Version: 2026-10-18-004');
html = once(html, 'window.HTML_VERSION = "2026-10-18-003";', 'window.HTML_VERSION = "2026-10-18-004";');
const scripts = text => text.match(/<script\s+src="[^"]+"[^>]*><\/script>/g);
if (JSON.stringify(scripts(html)) !== JSON.stringify(scripts(read('before/cyoaftw-engine-CORE.html')))) throw new Error('Script tags changed');
// Everything after the input adapter stays byte-for-byte equal after newline normalization,
// apart from the explicit version/changelog replacements above.
for (const [name, content] of [['cyoaftw-engine-CORE.js', core], ['cyoaftw-engine-CORE.html', html]]) fs.writeFileSync(path.join(__dirname, name), content.replace(/\n/g, '\r\n'));
console.log('Built staged inventory text engine and shell.');
