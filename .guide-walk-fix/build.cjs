const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const input = process.argv[2] || 'C:/Git/CYOADEV/cyoaftw-engine-CORE.js';
const baseline = fs.readFileSync(input);
let core = baseline.toString('utf8').replace(/\r\n/g, '\n');
function once(before, after) {
    if (core.split(before).length !== 2) throw new Error('Expected one match: ' + before);
    core = core.replace(before, after);
}
once('const GUIDE_KEEP_DELAY_MS = 700;', 'const GUIDE_KEEP_DELAY_MS = 3000;');
once('the guide walk stops only for real combat and shows its lines as typed bubbles', 'the guide walk uses central action narration, pauses between rooms and reopens conversation on arrival');
const start = core.indexOf('function startGuiding(');
const end = core.indexOf('// Buttons for the left interact column', start);
if (start < 0 || end <= start) throw new Error('Missing guiding actions');
core = core.slice(0, start) + fs.readFileSync(path.join(__dirname, 'guiding-actions.js'), 'utf8').replace(/\r\n/g, '\n').trimEnd() + '\n\n' + core.slice(end);
fs.writeFileSync(path.join(__dirname, 'before.js'), baseline);
fs.writeFileSync(path.join(__dirname, 'baseline.sha256'), crypto.createHash('sha256').update(baseline).digest('hex').toUpperCase() + '\n');
fs.writeFileSync(path.join(__dirname, 'cyoaftw-engine-CORE.js'), core.replace(/\n/g, '\r\n'));
console.log('Built guide narration, pacing and arrival conversation fix from current development engine.');
