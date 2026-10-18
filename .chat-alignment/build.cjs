const fs = require('node:fs');
const path = require('node:path');
const sourcePath = 'C:/Git/CYOADEV/cyoaftw-engine-CORE.html';
const source = fs.readFileSync(sourcePath, 'utf8');
let html = source;
function replaceOnce(before, after) {
    if (html.split(before).length !== 2) throw new Error('Expected one match: ' + before);
    html = html.replace(before, after);
}
replaceOnce('--npc-portrait-gap: 16px; }', '--npc-portrait-gap: 16px; --room-content-inset: 0px; }');
replaceOnce('    padding-left: calc(var(--npc-portrait-size) + 20px + var(--npc-portrait-gap));',
    '    --room-content-inset: calc(var(--npc-portrait-size) + 20px + var(--npc-portrait-gap));\r\n    padding-left: var(--room-content-inset);');
replaceOnce('#roomImageWrapEl.has-npc-full { padding-left: var(--npc-full-width); }',
    '#roomImageWrapEl.has-npc-full { --room-content-inset: var(--npc-full-width); padding-left: var(--room-content-inset); }');
replaceOnce('#roomImageWrapEl.has-npc-full { padding-left: 0; }',
    '#roomImageWrapEl.has-npc-full { --room-content-inset: 0px; padding-left: 0; }');
replaceOnce('/* Chat panel */', '/* Chat panel: options span beneath the portrait to the sidebar edge, while\r\n   the log keeps the portrait inset. Options sit above the portrait column so\r\n   its full-height transparent area cannot intercept button clicks. */');
const panelStart = html.indexOf('#chatPanelEl {\r\n    flex: 1;');
const panelEnd = html.indexOf('\r\n}', panelStart);
if (panelStart < 0 || panelEnd < 0) throw new Error('Chat panel not found');
const panel = html.slice(panelStart, panelEnd);
html = html.slice(0, panelStart) + panel.replace('z-index: 1;', 'z-index: auto;').replace('    width: 100%;',
    '    align-self: flex-end;\r\n    margin-left: calc(0px - var(--room-content-inset));\r\n    width: calc(100% + var(--room-content-inset));') + html.slice(panelEnd);
replaceOnce('#chatLogEl {\r\n    flex: 2;', '#chatLogEl {\r\n    flex: 2;\r\n    margin-left: var(--room-content-inset);\r\n    z-index: 1;');
replaceOnce('#chatOptionsEl {\r\n    display: flex;', '#chatOptionsEl {\r\n    position: relative;\r\n    z-index: 3;\r\n    display: flex;');
html = html.replaceAll('2026-10-17-010', '2026-10-17-011');
replaceOnce('Latest: Slightly shorter buttons; damage icons and amounts stay together.',
    'Latest: Chat options extend beneath the NPC portrait, flush with the sidebar.');
const scripts = text => text.match(/<script\b[^>]*>[\s\S]*?<\/script>/g);
if (JSON.stringify(scripts(source).map(s => s.replaceAll('2026-10-17-010', '2026-10-17-011'))) !== JSON.stringify(scripts(html))) throw new Error('Script content changed');
fs.writeFileSync(path.join(__dirname, 'cyoaftw-engine-CORE.html'), html);
console.log('Prepared chat alignment; all script tags and behavior preserved.');
