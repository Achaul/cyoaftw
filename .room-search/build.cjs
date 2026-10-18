const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync('C:/Git/CYOADEV/cyoaftw-engine-CORE.js', 'utf8');
let result = source;
function replaceOnce(before, after) {
    if (result.split(before).length !== 2) throw new Error('Expected exactly one match: ' + before);
    result = result.replace(before, after);
}
replaceOnce('    const check = rollStatCheck(player, approach.stat, 0);\r\n    let found = [];\r\n    if (check.critSuccess) {\r\n        found = candidates.slice();\r\n    } else if (!check.critFail) {\r\n        found = candidates.filter(fixture => check.total >= (fixture.revealDC || 12));\r\n    }\r\n\r\n    if (G.combatRollDebugMode) {\r\n        const topDC = candidates.reduce((max, fixture) => Math.max(max, fixture.revealDC || 12), 0);\r\n        lines.push(formatRollLine("Search", check.roll, check.bonus, check.total, topDC, found.length > 0, check.critSuccess));\r\n    }', [
    '    // An empty search is not a failed stat check. Only roll when this',
    '    // approach can reveal something, using the actual target difficulties.',
    '    const targetDCs = [...new Set(candidates.map(fixture => fixture.revealDC || 12))].sort((a, b) => a - b);',
    '    const check = candidates.length ? rollStatCheck(player, approach.stat, targetDCs[0]) : null;',
    '    let found = [];',
    '    if (check && check.critSuccess) {',
    '        found = candidates.slice();',
    '    } else if (check && !check.critFail) {',
    '        found = candidates.filter(fixture => check.total >= (fixture.revealDC || 12));',
    '    }',
    '',
    '    if (G.combatRollDebugMode) {',
    '        if (check) {',
    '            const bonusText = check.bonus >= 0 ? `+ ${check.bonus}` : `- ${Math.abs(check.bonus)}`;',
    '            const outcome = check.critFail ? "Critical failure" : check.critSuccess ? "Critical success" : found.length ? "Success" : "Failure";',
    '            lines.push(`[Roll] Search (${SEARCH_STAT_LABELS[approach.stat]}): d20(${check.roll}) ${bonusText} = ${check.total} vs ${targetDCs.join("/")} -> ${outcome}`);',
    '        } else {',
    '            lines.push("[Roll] Search: no matching hidden fixtures for this approach; no check needed.");',
    '        }',
    '    }'
].join('\r\n'));
replaceOnce('window.__ENGINE_CORE_VERSION = "2026-10-17-012";', 'window.__ENGINE_CORE_VERSION = "2026-10-17-013";');
fs.writeFileSync(path.join(__dirname, 'cyoaftw-engine-CORE.js'), result);
console.log('Prepared search outcome fix; targets, costs, reveal rules and rewards preserved.');
