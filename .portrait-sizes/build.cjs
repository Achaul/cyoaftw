const fs = require('node:fs');
const path = require('node:path');
const root = 'C:/Git/CYOADEV/';
let core = fs.readFileSync(root + 'cyoaftw-engine-CORE.js', 'utf8');
let html = fs.readFileSync(root + 'cyoaftw-engine-CORE.html', 'utf8');
const originalHtml = html;
function replaceOnce(source, before, after) {
    if (source.split(before).length !== 2) throw new Error('Expected one match: ' + before);
    return source.replace(before, after);
}
core = replaceOnce(core, '        wrap.classList.toggle("portrait-large", portraitSizeIsLarge());', '        applyPortraitSize();');
const start = core.indexOf('// Click the header portrait to switch between compact');
const end = core.indexOf('window.togglePortraitSize = togglePortraitSize;', start);
if (start < 0 || end < start) throw new Error('Portrait size functions not found');
core = core.slice(0, start) + [
    '// Click through small, player-sized medium (the default), and large.',
    '// Remember explicit size choices across NPCs and sessions without regenerating.',
    'const PORTRAIT_SIZE_PREF_KEY = "cyoaftwPortraitSize";',
    'const NPC_PORTRAIT_SIZES = ["small", "medium", "large"];',
    'function getPortraitSize() {',
    '    try {',
    '        const saved = localStorage.getItem(PORTRAIT_SIZE_PREF_KEY);',
    '        if (NPC_PORTRAIT_SIZES.includes(saved)) return saved;',
    '    } catch (e) {}',
    '    return "medium";',
    '}',
    'function portraitSizeIsLarge() { return getPortraitSize() === "large"; }',
    'function applyPortraitSize(size = getPortraitSize()) {',
    '    const wrap = document.getElementById("roomImageWrapEl");',
    '    if (!wrap) return;',
    '    wrap.classList.toggle("portrait-small", size === "small");',
    '    wrap.classList.toggle("portrait-large", size === "large");',
    '    syncPortraitHeaderSpacing();',
    '}',
    'function togglePortraitSize() {',
    '    const wrap = document.getElementById("roomImageWrapEl");',
    '    if (!wrap) return;',
    '    const current = wrap.classList.contains("portrait-large") ? "large" : wrap.classList.contains("portrait-small") ? "small" : "medium";',
    '    const next = NPC_PORTRAIT_SIZES[(NPC_PORTRAIT_SIZES.indexOf(current) + 1) % NPC_PORTRAIT_SIZES.length];',
    '    applyPortraitSize(next);',
    '    try { localStorage.setItem(PORTRAIT_SIZE_PREF_KEY, next); } catch (e) {}',
    '}',
    ''
].join('\r\n') + core.slice(end);
core = replaceOnce(core, '// Column layout: since the portraits moved into their own left-hand bar, the\r\n// text and chat no longer wrap under them, so there is no overhang to\r\n// compensate for. Kept (and called from the older hook points) to clear any\r\n// legacy inline margin left by the pre-column layout.',
    '// Keep medium portraits matched to the player portrait, including sidebar\r\n// scrollbars. Retain the last visible width when the sidebar is collapsed.\r\n// Also clear the legacy chat margin from the pre-column layout.');
core = replaceOnce(core, 'function syncPortraitHeaderSpacing() {\r\n    const chat = document.getElementById("chatPanelEl");', [
    'function syncPortraitHeaderSpacing() {',
    '    const playerPortrait = document.getElementById("playerPortraitEl");',
    '    const wrap = document.getElementById("roomImageWrapEl");',
    '    const width = playerPortrait ? playerPortrait.getBoundingClientRect().width : 0;',
    '    if (wrap && width > 0) wrap.style.setProperty("--player-portrait-size", width + "px");',
    '    const chat = document.getElementById("chatPanelEl");'
].join('\r\n'));
core = replaceOnce(core, 'const ids = ["roomNameEl", "roomDescEl", "narrationEl"];', 'const ids = ["roomNameEl", "roomDescEl", "narrationEl", "playerPortraitEl"];');
core = replaceOnce(core, 'window.__ENGINE_CORE_VERSION = "2026-10-17-013";', 'window.__ENGINE_CORE_VERSION = "2026-10-17-014";');
html = replaceOnce(html, '#roomImageWrapEl { --npc-portrait-size: 112px; --npc-portrait-gap: 16px; --room-content-inset: 0px; }',
    '#roomImageWrapEl { --npc-portrait-size: var(--player-portrait-size, 171px); --npc-portrait-gap: 16px; --room-content-inset: 0px; }\r\n#roomImageWrapEl.portrait-small { --npc-portrait-size: 112px; }');
html = replaceOnce(html, '    #roomImageWrapEl { --npc-portrait-size: 64px; --npc-portrait-gap: 12px; }',
    '    #roomImageWrapEl { --npc-portrait-size: min(var(--player-portrait-size, 171px), 112px, 30vw); --npc-portrait-gap: 12px; }\r\n    #roomImageWrapEl.portrait-small { --npc-portrait-size: 64px; }');
html = html.replaceAll('2026-10-17-011', '2026-10-17-012');
html = replaceOnce(html, 'Latest: Chat options extend beneath the NPC portrait, flush with the sidebar.',
    'Latest: Player-sized NPC portraits by default; click through medium, large, and small.');
const tags = source => source.match(/<script src="[^"]+"><\/script>/g);
if (JSON.stringify(tags(originalHtml)) !== JSON.stringify(tags(html))) throw new Error('Script tags changed');
fs.writeFileSync(path.join(__dirname, 'cyoaftw-engine-CORE.js'), core);
fs.writeFileSync(path.join(__dirname, 'cyoaftw-engine-CORE.html'), html);
console.log('Prepared three portrait sizes with a player-sized desktop default.');
