const fs = require('node:fs'), path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8').replace(/\r\n/g, '\n');
const before = read('before/cyoaftw-engine-CORE.js');
let core = before, html = read('before/cyoaftw-engine-CORE.html');
function replace(text, from, to) {
    if (text.split(from).length !== 2) throw new Error('Expected one anchor: ' + from.slice(0, 100));
    return text.replace(from, to);
}
core = replace(core, '// ── FONT PREFERENCES', `// ── TEXT MODE BETA PREFERENCE ────────────────────────────────────
// Discoverability is opt-in and saved separately from game/session state.
const SHOW_TEXT_MODE_PREF_KEY = "cyoaftwShowTextMode";
function applyShowTextModePreference(on) {
    document.body.classList.toggle("show-text-mode", !!on);
    const box = document.getElementById("showTextModeToggleInput");
    if (box) box.checked = !!on;
    if (!on && textModeState.enabled) setTextMode(false);
}
function setShowTextMode(on) {
    try { localStorage.setItem(SHOW_TEXT_MODE_PREF_KEY, on ? "on" : "off"); } catch (e) {}
    applyShowTextModePreference(on);
}
window.setShowTextMode = setShowTextMode;
(function () {
    let on = false;
    try { on = localStorage.getItem(SHOW_TEXT_MODE_PREF_KEY) === "on"; } catch (e) {}
    applyShowTextModePreference(on);
})();

// ── FONT PREFERENCES`);
core = core.replaceAll('2026-10-18-016', '2026-10-18-017');
core = replace(core, '// Latest:', '// Latest: Saved opt-in Show text mode (beta) preference for compass and combat entry controls.\n// Previous:');
html = replace(html, '#textModeToggleBtn { font-size: 23px; }', `#textModeToggleBtn { font-size: 23px; }
/* Keep the centre cell occupied so the compass directions never shift. */
body:not(.show-text-mode) #textModeToggleBtn { visibility: hidden; }
body:not(.show-text-mode) .combat-text-toggle { display: none !important; }`);
html = replace(html, '        <label class="sidebar-toggle" title="Text size', `        <label class="sidebar-toggle" title="Show the keyboard icon in the compass centre and the combat Text mode button. Saved between sessions.">
            Show text mode (beta)
            <input type="checkbox" id="showTextModeToggleInput" onchange="setShowTextMode(this.checked)">
        </label>
        <label class="sidebar-toggle" title="Text size`);
html = html.replaceAll('2026-10-18-016', '2026-10-18-017');
html = replace(html, 'Latest: Compass text-mode toggle and persistent command input with help, queue status and return controls.', 'Latest: Saved Show text mode (beta) preference gates compass keyboard and combat text controls.');
for (const [from, to] of [['function chooseChatOption(option)', 'window.chooseChatOption = chooseChatOption;'], ['function disengageFromNPC(', 'function npcLeavesAfterRebuffedAdvance('], ['function examineRoomObject(', 'function collectBodyLoot('], ['function chooseNPCAction(', '// ── COMPANION EQUIPMENT']]) {
    const slice = text => text.slice(text.indexOf(from), text.indexOf(to, text.indexOf(from)));
    if (slice(core) !== slice(before)) throw new Error('Protected routing changed: ' + from);
}
const scripts = text => text.match(/<script\s+src="[^"]+"[^>]*><\/script>/g);
if (JSON.stringify(scripts(html)) !== JSON.stringify(scripts(read('before/cyoaftw-engine-CORE.html')))) throw new Error('Script tags changed');
for (const [name, text] of [['cyoaftw-engine-CORE.js', core], ['cyoaftw-engine-CORE.html', html]]) fs.writeFileSync(path.join(__dirname, name), text.replace(/\n/g, '\r\n'));
console.log('Built text-mode preference 017 from installed 016; protected routing and script tags preserved.');
