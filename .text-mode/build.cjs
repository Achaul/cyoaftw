const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const read = name => fs.readFileSync(path.join(root, name), 'utf8').replace(/\r\n/g, '\n');
function once(source, before, after) {
    if (source.split(before).length !== 2) throw new Error('Expected one match: ' + before.slice(0, 100));
    return source.replace(before, after);
}
let core = read('before/cyoaftw-engine-CORE.js');
// The engine initializes the saved-game prompt before reaching later sections.
// Declare presentation state first so those early UI calls can safely use it.
core = read('commands.js') + '\n\n' + core;
core = once(core, 'Core Engine Version: 2026-10-18-001', 'Core Engine Version: 2026-10-18-002');
core = once(core, 'window.__ENGINE_CORE_VERSION = "2026-10-18-001";', 'window.__ENGINE_CORE_VERSION = "2026-10-18-002";');
core = once(core, '// Latest: Equip directly', '// Latest: Text-mode exploration and conversation, local parsing with AI fallback, contextual help and sequential commands.\n// Previous: Equip directly');
core = once(core, 'function setExitGridVisible(visible) {\n    syncCombatLayout();', 'function setExitGridVisible(visible) {\n    syncCombatLayout();\n    if (typeof syncTextModeView === "function") syncTextModeView();');
core = once(core, 'function setChatOptionsDisabled(disabled) {', 'function setChatOptionsDisabled(disabled) {\n    if (typeof textModeDialogueBusy === "function") textModeDialogueBusy(disabled);');
core = once(core, 'function renderChatOptions(npc, options = null) {', 'function renderChatOptions(npc, options = null) {\n    if (typeof textModeDialogueBusy === "function") textModeDialogueBusy(false);');
core = once(core, '    npcRespond(npc, choice);\n}', '    return typeof textModeTrackTask === "function" ? textModeTrackTask(npcRespond(npc, choice)) : npcRespond(npc, choice);\n}');
core = once(core, '    chooseChatOption(choice);\n}\n\nfunction clearChatOptions()', '    return chooseChatOption(choice);\n}\n\nfunction clearChatOptions()');
core = once(core, 'function showRespondInput(npc) {', 'function showRespondInput(npc) {\n    if (typeof textModeState !== "undefined" && textModeState.enabled) {\n        G.activeNPCMode = "talk";\n        renderChatOptions(npc);\n        textModeResult("completed", \'Use say "..." in the command box to speak.\');\n        focusTextModeInput();\n        return;\n    }');
core = once(core, 'function openGlanceMenu(resultText) {', 'function openGlanceMenu(resultText) {\n    if (typeof textModeState !== "undefined" && textModeState.enabled && resultText) {\n        setNarration(resultText);\n        return;\n    }');
core = once(core, 'function showSetupScreen() {', 'function showSetupScreen() {\n    if (typeof textModeState !== "undefined") setTextMode(false);');
core = once(core, 'function showGameScreen() {', 'function showGameScreen() {\n    if (typeof initializeTextMode === "function") initializeTextMode();');
// Publish semantic dialogue/narration alongside the existing visual renderer.
core = once(core, 'function setNarration(text) {', 'function setNarration(text) {\n    if (typeof textModeState !== "undefined" && textModeState.enabled) publishTextModeOutput("narration", text, { source: "engine" }, false);');
core = once(core, '    renderRoomObservations(el, room, layout);\n}', '    renderRoomObservations(el, room, layout);\n    if (typeof textModeState !== "undefined" && textModeState.enabled) publishTextModeOutput("narration", el.textContent, { source: "engine" }, false);\n}');
const chatStart = core.indexOf('function addChatMessage(');
if (chatStart < 0) throw new Error('Missing addChatMessage');
const brace = core.indexOf('{', core.indexOf(') {', chatStart));
if (brace < 0 || brace - chatStart > 300) throw new Error('Unexpected addChatMessage signature');
// Read actual parameter names to avoid relying on argument ordering.
const params = core.slice(chatStart, brace);
if (!params.includes('side') || !params.includes('speaker') || !params.includes('text')) throw new Error(params);
core = core.slice(0, brace + 1) + '\n    if (typeof textModeState !== "undefined" && textModeState.enabled) publishTextModeOutput(String(speaker || "").toLowerCase() === "narrator" ? "narration" : "dialogue", text, { speaker: speaker, side: side, source: "engine" }, false);' + core.slice(brace + 1);
let html = read('before/cyoaftw-engine-CORE.html');
html = once(html, 'HTML Version: 2026-10-18-001', 'HTML Version: 2026-10-18-002');
html = once(html, 'window.HTML_VERSION = "2026-10-18-001";', 'window.HTML_VERSION = "2026-10-18-002";');
html = once(html, '    Latest: Player-sized NPC portraits', '    Latest: Compass text-mode toggle and persistent command input with help, queue status and return controls.\n    Previous: Player-sized NPC portraits');
html = once(html, '<div class="exit-spacer"></div>', '<button type="button" class="exit-btn" id="textModeToggleBtn" aria-label="Enter text mode" title="Text mode" onclick="setTextMode(true)">&#9000;</button>');
html = once(html, '/* Placeholder for the removed center "Interact" button: keeps the grid\'s\n   3x3 shape without offering anything to click. */', '/* Reserved center-cell sizing for the compass. */');
html = once(html, '/* Compact room actions flank the bottom-center compass at every width. */', read('text-mode.css') + '\n\n/* Compact room actions flank the bottom-center compass at every width. */');
const dock = `        <section id="textModeEl" aria-label="Text mode" hidden>
            <div id="textModeLogEl" role="log" aria-live="polite" aria-relevant="additions text"></div>
            <form id="textModeFormEl" autocomplete="off">
                <input type="text" id="textModeInputEl" maxlength="600" aria-label="Type a game command" aria-describedby="textModeHintEl" placeholder="What do you do?" enterkeyhint="send" spellcheck="false">
                <button type="submit">Enter</button>
                <button type="button" id="textModeStopBtn" onclick="stopTextCommands(true)" hidden>Stop</button>
                <button type="button" aria-label="Return to previous view" title="Return to previous view" onclick="setTextMode(false)">&#8634;</button>
            </form>
            <div id="textModeHintEl">Type 'how' to remember what you can do.</div>
            <div id="textModeStatusEl" role="status"></div>
        </section>
`;
html = once(html, '    </div>\n\n    <!-- Right: NPC detail -->', dock + '    </div>\n\n    <!-- Right: NPC detail -->');
for (const [name, content] of [['cyoaftw-engine-CORE.js', core], ['cyoaftw-engine-CORE.html', html]]) fs.writeFileSync(path.join(root, name), content.replace(/\n/g, '\r\n'));
const tags = value => value.match(/<script\s+src="[^"]+"[^>]*><\/script>/g);
if (JSON.stringify(tags(html)) !== JSON.stringify(tags(read('before/cyoaftw-engine-CORE.html')))) throw new Error('Script load tags changed');
const oldChoice = read('before/cyoaftw-engine-CORE.js').split('function chooseChatOption(option) {')[1].split('window.chooseChatOption = chooseChatOption;')[0];
const newChoice = core.split('function chooseChatOption(option) {')[1].split('window.chooseChatOption = chooseChatOption;')[0];
if (newChoice.replace('return typeof textModeTrackTask === "function" ? textModeTrackTask(npcRespond(npc, choice)) : npcRespond(npc, choice);', 'npcRespond(npc, choice);') !== oldChoice) throw new Error('Conversation routing changed unexpectedly');
console.log('Built staged text-mode engine and shell.');
