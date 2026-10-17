from pathlib import Path
import re

root = Path(__file__).parent
core = root / 'cyoaftw-engine-CORE.js'
shell = root / 'cyoaftw-engine-CORE.html'
js = Path('C:/Git/CYOADEV/cyoaftw-engine-CORE.js').read_text(encoding='utf-8')
html = Path('C:/Git/CYOADEV/cyoaftw-engine-CORE.html').read_text(encoding='utf-8')
assert '// ── SAVE MANAGEMENT MENU' not in js, 'Save menu has already been applied to CYOADEV'
js = js.replace('// Core Engine Version: 2026-10-17-005', '// Core Engine Version: 2026-10-17-006', 1)
js = js.replace('// Latest: Bold red applied-damage amounts with an impact icon in combat narration, preserving typing and click-to-skip.', '// Latest: Named manual saves, disk export/import and a save manager available in-game and at setup.', 1)
js = js.replace('window.__ENGINE_CORE_VERSION = "2026-10-17-005";', 'window.__ENGINE_CORE_VERSION = "2026-10-17-006";', 1)
js = js.replace('const SAVE_KEY = "cyoaftwSave";', 'const SAVE_KEY = "cyoaftwSave";\nconst SAVE_LOAD_REQUEST_KEY = "cyoaftwLoadRequested";\nlet gameSaveReloading = false;', 1)
first = js.index('function isValidSavedGame(')
last = js.index('\nfunction readSavedGame(', first)
js = js[:first] + '''function isValidSavedGame(save) {
    if (!isSaveRecord(save) || save.version !== 1 || !isSaveRecord(save.player) || !isSaveRecord(save.roomMap)) return false;
    const player = save.player;
    if (typeof player.coords !== "string" || !parseCoords(player.coords) || !Object.prototype.hasOwnProperty.call(save.roomMap, player.coords)) return false;
    if (!isSaveRecord(player.stats) || !Number.isFinite(player.hp) || !Number.isFinite(player.hpMax)) return false;
    if (player.inventory !== undefined && !Array.isArray(player.inventory)) return false;
    if (player.equipped !== undefined && !isSaveRecord(player.equipped)) return false;
    for (const room of Object.values(save.roomMap)) {
        if (!isSaveRecord(room)) return false;
        if (room.creatures !== undefined && (!Array.isArray(room.creatures) || room.creatures.some(npc => !isSaveRecord(npc)))) return false;
        if (room.exits !== undefined && !isSaveRecord(room.exits)) return false;
    }
    for (const key of ["story", "zoneBossState", "zoneForgeState", "portalTowns", "worldLore", "meta"]) {
        if (save[key] != null && !isSaveRecord(save[key])) return false;
    }
    return true;
}
''' + js[last:]
js = js.replace('const save = JSON.parse(raw);', 'const save = parseSaveJSON(raw);', 1)
first = js.index('function initSavedGamePrompt()')
js = js[:first] + (root / 'save-menu.js').read_text(encoding='utf-8') + '\n\n' + js[first:]
js = js.replace('''function initSavedGamePrompt() {
    showSetupScreen();''', '''function initSavedGamePrompt() {
    showSetupScreen();
    let requested = false;
    try {
        requested = sessionStorage.getItem(SAVE_LOAD_REQUEST_KEY) === "1";
        sessionStorage.removeItem(SAVE_LOAD_REQUEST_KEY);
    } catch (err) {}
    if (requested && hasSavedGame()) {
        resumeSavedGame().catch(function (err) {
            console.error("Adventure restore failed:", err);
            hideSpinner();
            showSetupScreen();
            showSavedGamePrompt();
            openSaveMenu();
            saveMenuStatus("This adventure could not be restored. Your manual saves are still available.", true);
        });
        return;
    }''', 1)
# Share the original full-state serializer between auto/manual saves and files.
first = js.index('function saveGameState()')
last = js.index('// ── ROOM GENERATION', first)
old = js[first:last]
data = old[old.index('        const saveData = {'):old.index('\n\n        localStorage.setItem(')]
data = data.replace('        const saveData = {', '    return {', 1)
data = '\n'.join(line[4:] if line.startswith('    ') else line for line in data.splitlines())
replacement = '''function createGameSaveData() {
    if (!currentAdventureCanSave()) throw new Error("Start an adventure before saving.");
    repairRoomMapExits();
    ensurePlayerEquipmentState(G.player);
''' + '    ' + data + '''
}

function saveGameState() {
    if (gameSaveReloading) return false;
    try {
        const saveData = createGameSaveData();
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        console.log("Game saved.");
        return true;
    } catch (err) {
        console.error("Save failed:", err);
        return false;
    }
}


'''
js = js[:first] + replacement + js[last:]
js = js.replace('["itemModal", "preferencesModal", "equipmentManager", "mapManager", "combatHelpModal"]', '["itemModal", "preferencesModal", "saveMenuModal", "equipmentManager", "mapManager", "combatHelpModal"]', 1)
html = html.replace('2026-10-17-006', '2026-10-17-007', 2)
html = html.replace('Latest: Bold damage amounts and impact icons in combat narration.', 'Latest: Save manager with named manual saves and disk export/import.', 1)
html = html.replace('/* Preferences modal (bottom-left', (root / 'save-menu.css').read_text(encoding='utf-8') + '\n\n/* Preferences modal (bottom-left', 1)
html = html.replace('<!-- ── PREFERENCES ── -->', (root / 'save-menu.html').read_text(encoding='utf-8') + '\n<!-- ── PREFERENCES ── -->', 1)
html = html.replace('    <div id="savedGamePrompt">', '    <button type="button" class="secondary" id="setupSavesButton" onclick="openSaveMenu()">Load / manage saves</button>\n\n    <div id="savedGamePrompt">', 1)
html = html.replace('        <div id="locationLabelEl"></div>', '''        <button type="button" id="sidebarSavesButton" onclick="openSaveMenu()" title="Manual saves, autosave, and disk backups" style="margin-top:6px; width:100%; background:#222;">
            &#128190; Saves
        </button>
        <div id="locationLabelEl"></div>''', 1)
core.write_text(js, encoding='utf-8', newline='\r\n')
shell.write_text(html, encoding='utf-8', newline='\r\n')
