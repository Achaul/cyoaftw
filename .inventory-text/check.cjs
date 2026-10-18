const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
let failures = 0, passed = 0;
for (const file of fs.readdirSync(path.join(root, 'tests')).filter(name => name.endsWith('.test.cjs'))) {
    const args = [path.join(root, 'tests', file), path.join(__dirname, 'cyoaftw-engine-CORE.js')];
    if (/npc-panel-description|player-portrait|slime-taming/.test(file)) args.push('C:/Git/CYOADEV/cyoaftw-npc-data.js');
    else args.push('C:/Git/CYOADEV/cyoaftw-world-data.js');
    const run = spawnSync(process.execPath, args, { encoding: 'utf8' });
    if (run.status !== 0) { failures++; console.log('FAIL ' + file + '\n' + run.stdout + run.stderr); }
    else { passed++; console.log('PASS ' + file); }
}
console.log(passed + ' suites passed; ' + failures + ' failed.');
process.exitCode = failures ? 1 : 0;
