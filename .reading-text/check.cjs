const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
let failed = 0, passed = 0;
for (const file of fs.readdirSync(path.join(root, 'tests')).filter(name => name.endsWith('.test.cjs'))) {
    const args = [path.join(root, 'tests', file), path.join(__dirname, 'cyoaftw-engine-CORE.js'), /npc-panel-description|player-portrait|slime-taming/.test(file) ? 'C:/Git/CYOADEV/cyoaftw-npc-data.js' : 'C:/Git/CYOADEV/cyoaftw-world-data.js'];
    const run = spawnSync(process.execPath, args, { encoding: 'utf8' });
    if (run.status !== 0) { failed++; console.log('FAIL ' + file + '\n' + run.stdout + run.stderr); }
    else { passed++; console.log('PASS ' + file); }
}
for (const file of [path.join(__dirname, 'cyoaftw-engine-CORE.js'), ...['cyoaftw-npc-data.js', 'cyoaftw-context-builder.js', 'cyoaftw-world-data.js'].map(file => 'C:/Git/CYOADEV/' + file)]) {
    const run = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (run.status !== 0) { failed++; console.log(run.stdout + run.stderr); }
}
console.log(passed + ' suites passed; ' + failed + ' failures.');
process.exitCode = failed ? 1 : 0;
