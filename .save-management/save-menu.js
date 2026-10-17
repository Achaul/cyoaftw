// ── SAVE MANAGEMENT MENU ────────────────────────────────────────
// Each manual snapshot has its own key: autosaving never touches these keys,
// and updating one slot does not rewrite every other explored world.
const MANUAL_SAVE_PREFIX = "cyoaftwManualSave:";
const SAVE_FILE_FORMAT = "cyoaftw-save";
const SAVE_FILE_MAX_BYTES = 25 * 1024 * 1024;
const saveMenuState = { opener: null, confirm: null, busy: false };

function isSaveRecord(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

function parseSaveJSON(text) {
    return JSON.parse(text, function (key, value) {
        if (key === "__proto__" || key === "prototype" || key === "constructor") {
            throw new Error("This save contains an unsupported property.");
        }
        return value;
    });
}

function normalizeSaveName(value, fallback = "Manual save") {
    return (typeof value === "string" && value.trim() ? value.trim() : fallback).slice(0, 80);
}

function currentAdventureCanSave() {
    return !!(G.activeRoom && G.player && G.roomMap && G.roomMap[G.player.coords]);
}

function defaultManualSaveName() {
    if (!currentAdventureCanSave()) return "";
    const room = G.activeRoom;
    return normalizeSaveName(`${G.player.name || "Adventurer"} — ${room.displayName || room.name || room.type || "Adventure"}`);
}

function readManualSaves() {
    const saves = [];
    let unreadable = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith(MANUAL_SAVE_PREFIX)) continue;
        try {
            const record = parseSaveJSON(localStorage.getItem(key));
            if (!isSaveRecord(record) || !isValidSavedGame(record.save)) throw new Error("Invalid snapshot");
            saves.push({ key, name: normalizeSaveName(record.name), save: record.save });
        } catch (err) { unreadable++; }
    }
    saves.sort((a, b) => (Number(b.save.meta && b.save.meta.savedAt) || 0) - (Number(a.save.meta && a.save.meta.savedAt) || 0));
    return { saves, unreadable };
}

function storeManualSave(name, save, key) {
    if (!isValidSavedGame(save)) throw new Error("There is no complete adventure to save yet.");
    if (key && !key.startsWith(MANUAL_SAVE_PREFIX)) throw new Error("Invalid save slot.");
    const id = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const target = key || MANUAL_SAVE_PREFIX + id;
    try { localStorage.setItem(target, JSON.stringify({ name: normalizeSaveName(name), save })); }
    catch (err) { throw new Error("Could not store this save. Browser storage may be full or unavailable. Export to disk to keep a backup."); }
    return target;
}

function saveMenuStatus(message, error = false) {
    const el = document.getElementById("saveMenuStatus");
    if (!el) return;
    el.textContent = message;
    el.classList.toggle("save-error", error);
}

function saveMenuButton(label, action, options = {}) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.disabled = !!options.disabled;
    if (options.danger) button.className = "save-danger";
    if (options.title) button.title = options.title;
    button.onclick = action;
    return button;
}

function cancelSaveMenuConfirmation() {
    const pending = saveMenuState.confirm;
    saveMenuState.confirm = null;
    const el = document.getElementById("saveMenuConfirm");
    if (el) { el.hidden = true; el.replaceChildren(); }
    const overlay = document.getElementById("saveMenuConfirmOverlay");
    if (overlay) overlay.hidden = true;
    const card = document.getElementById("saveMenuCard");
    if (card) card.inert = false;
    if (pending && pending.opener && pending.opener.isConnected) pending.opener.focus();
}

function confirmSaveMenuAction(message, label, action, name) {
    const el = document.getElementById("saveMenuConfirm");
    saveMenuState.confirm = { opener: document.activeElement };
    el.replaceChildren();
    el.hidden = false;
    document.getElementById("saveMenuConfirmOverlay").hidden = false;
    document.getElementById("saveMenuCard").inert = true;
    const title = document.createElement("h3");
    title.id = "saveMenuConfirmTitle";
    title.textContent = label === "Load adventure" ? "Load adventure?" : `${label} save`;
    el.appendChild(title);
    const text = document.createElement("p");
    text.id = "saveMenuConfirmMessage";
    text.textContent = message;
    el.appendChild(text);
    let input = null;
    if (typeof name === "string") {
        const field = document.createElement("label");
        field.textContent = "Save name";
        input = document.createElement("input");
        input.type = "text";
        input.maxLength = 80;
        input.value = name;
        field.appendChild(input);
        el.appendChild(field);
    }
    const actions = document.createElement("div");
    actions.className = "save-actions";
    const cancel = saveMenuButton("Cancel", cancelSaveMenuConfirmation);
    const accept = saveMenuButton(label, async function () {
        const value = input ? input.value : null;
        cancelSaveMenuConfirmation();
        try { await action(value); }
        catch (err) { saveMenuStatus(err.message || "The save operation failed.", true); }
    }, { danger: label === "Delete" || label === "Overwrite" });
    actions.append(cancel, accept);
    el.appendChild(actions);
    if (input) { input.focus(); input.select(); }
    else cancel.focus();
}

function refreshSaveMenu(message = "", error = false) {
    const list = document.getElementById("saveMenuList");
    list.replaceChildren();
    const canSave = currentAdventureCanSave();
    document.getElementById("createManualSaveBtn").disabled = !canSave || saveMenuState.busy;
    document.getElementById("exportCurrentSaveBtn").disabled = !canSave || saveMenuState.busy;
    document.getElementById("importSaveBtn").disabled = saveMenuState.busy;
    let unreadable = 0;
    try {
        const auto = readSavedGame();
        if (auto) list.appendChild(renderSaveMenuEntry({ name: "Autosave", save: auto }, true));
        const result = readManualSaves();
        unreadable = result.unreadable;
        result.saves.forEach(record => list.appendChild(renderSaveMenuEntry(record, false)));
        if (!list.children.length) {
            const empty = document.createElement("p");
            empty.className = "save-empty";
            empty.textContent = "No saves yet. Start an adventure or import a save from disk.";
            list.appendChild(empty);
        }
    } catch (err) {
        message = "Browser storage is unavailable. You can still export your current adventure to disk.";
        error = true;
    }
    if (unreadable) {
        message = `${message ? message + " " : ""}${unreadable} unreadable manual save(s) were left untouched.`;
        error = true;
    }
    saveMenuStatus(message || (canSave ? "Manual saves stay here until you overwrite or delete them." : "Start an adventure to create a new save, or load one below."), error);
    const modal = document.getElementById("saveMenuModal");
    if (modal.classList.contains("active") && !modal.contains(document.activeElement)) {
        document.getElementById("saveMenuCloseBtn").focus();
    }
}

function renderSaveMenuEntry(record, autosave) {
    const row = document.createElement("article");
    row.className = "save-entry";
    const heading = document.createElement("h4");
    heading.textContent = record.name;
    const badge = document.createElement("span");
    badge.className = "save-badge";
    badge.textContent = autosave ? "AUTOMATIC" : "MANUAL";
    heading.appendChild(badge);
    row.appendChild(heading);
    const summary = document.createElement("p");
    summary.className = "save-summary";
    // getSavedGameSummary escapes all character, location and date strings.
    summary.innerHTML = getSavedGameSummary(record.save);
    row.appendChild(summary);
    const actions = document.createElement("div");
    actions.className = "save-actions";
    actions.appendChild(saveMenuButton("Load", function () {
        confirmSaveMenuAction(`Load “${record.name}”? This replaces your current adventure and autosave. Manual saves are kept.`, "Load adventure", function () {
            loadSaveMenuSnapshot(record.save);
        });
    }, { disabled: saveMenuState.busy }));
    actions.appendChild(saveMenuButton("Export", function () {
        try { downloadGameSave(record.save, record.name); saveMenuStatus(`Export requested for “${record.name}”.`); }
        catch (err) { saveMenuStatus("Could not export this save. Please try again.", true); }
    }));
    if (!autosave) {
        actions.appendChild(saveMenuButton("Rename", function () {
            confirmSaveMenuAction("Choose a new name for this save.", "Rename", function (name) {
                storeManualSave(name, record.save, record.key);
                refreshSaveMenu("Save renamed.");
            }, record.name);
        }, { disabled: saveMenuState.busy }));
        actions.appendChild(saveMenuButton("Overwrite", function () {
            confirmSaveMenuAction(`Replace “${record.name}” with your current adventure?`, "Overwrite", function () {
                storeManualSave(record.name, createGameSaveData(), record.key);
                refreshSaveMenu(`“${record.name}” updated.`);
            });
        }, { disabled: !currentAdventureCanSave() || saveMenuState.busy }));
        actions.appendChild(saveMenuButton("Delete", function () {
            confirmSaveMenuAction(`Delete “${record.name}”? This cannot be undone.`, "Delete", function () {
                localStorage.removeItem(record.key);
                refreshSaveMenu("Manual save deleted.");
            });
        }, { danger: true, disabled: saveMenuState.busy }));
    }
    row.appendChild(actions);
    return row;
}

function createManualSaveFromMenu() {
    try {
        storeManualSave(document.getElementById("manualSaveName").value, createGameSaveData());
        refreshSaveMenu("Manual save created.");
    } catch (err) {
        saveMenuStatus("Could not create the save. Browser storage may be full or unavailable. Export to disk to keep a backup.", true);
    }
}

function downloadGameSave(save, name) {
    if (!isValidSavedGame(save)) throw new Error("There is no complete adventure to export yet.");
    const data = { format: SAVE_FILE_FORMAT, version: 1, name: normalizeSaveName(name), save };
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filename = normalizeSaveName(name).replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "") || "adventure";
    link.href = url;
    link.download = `cyoaftw-${filename}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    try { link.click(); }
    finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
}

function exportCurrentSaveFromMenu() {
    try { downloadGameSave(createGameSaveData(), defaultManualSaveName()); saveMenuStatus("Export requested for your current adventure."); }
    catch (err) { saveMenuStatus("Could not export your adventure. Please try again.", true); }
}

function parseImportedGameSave(text) {
    if (typeof text !== "string" || new Blob([text]).size > SAVE_FILE_MAX_BYTES) throw new Error("Choose a save file smaller than 25 MB.");
    let data;
    try { data = parseSaveJSON(text.replace(/^\uFEFF/, "")); }
    catch (err) { throw new Error("This file is not a readable CYOAFTW JSON save."); }
    if (!isSaveRecord(data)) throw new Error("This file is not a CYOAFTW save.");
    const wrapped = data.format === SAVE_FILE_FORMAT;
    if (wrapped && data.version !== 1) throw new Error("This save file uses an unsupported format version.");
    const save = wrapped ? data.save : data;
    if (!isValidSavedGame(save)) throw new Error("This save is incomplete or uses an unsupported game version.");
    return { name: normalizeSaveName(wrapped ? data.name : null, `${save.player.name || "Adventurer"} — Imported`), save };
}

async function importGameSaveFromMenu(input) {
    const file = input.files && input.files[0];
    if (!file || saveMenuState.busy) return;
    saveMenuState.busy = true;
    cancelSaveMenuConfirmation();
    refreshSaveMenu("Reading save file…");
    let message = "", failed = false;
    try {
        if (file.size > SAVE_FILE_MAX_BYTES) throw new Error("Choose a save file smaller than 25 MB.");
        const record = parseImportedGameSave(await file.text());
        try { storeManualSave(record.name, record.save); }
        catch (err) { throw new Error("Could not store the imported save. Browser storage may be full or unavailable. Your file and existing saves are unchanged."); }
        message = `Imported “${record.name}”. Select Load when you are ready to continue it.`;
    } catch (err) { message = err.message || "Could not read the save file."; failed = true; }
    finally {
        input.value = "";
        saveMenuState.busy = false;
        refreshSaveMenu(message, failed);
    }
}

function loadSaveMenuSnapshot(save) {
    if (!isValidSavedGame(save)) throw new Error("This save cannot be loaded.");
    // Reload before restoring so old AI promises, timers and transient UI cannot
    // mutate the newly loaded world. The existing resume path handles migrations.
    const previous = localStorage.getItem(SAVE_KEY);
    try {
        sessionStorage.setItem(SAVE_LOAD_REQUEST_KEY, "1");
        localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch (err) {
        try { sessionStorage.removeItem(SAVE_LOAD_REQUEST_KEY); } catch (_) {}
        throw new Error("Could not prepare this save for loading. Browser storage may be full or unavailable.");
    }
    gameSaveReloading = true;
    try { window.location.reload(); }
    catch (err) {
        gameSaveReloading = false;
        sessionStorage.removeItem(SAVE_LOAD_REQUEST_KEY);
        if (previous === null) localStorage.removeItem(SAVE_KEY);
        else localStorage.setItem(SAVE_KEY, previous);
        throw new Error("Could not restart the game page. Please try loading again.");
    }
}

function openSaveMenu() {
    const modal = document.getElementById("saveMenuModal");
    if (!modal) return;
    if (!modal.classList.contains("active")) saveMenuState.opener = document.activeElement;
    cancelSaveMenuConfirmation();
    document.getElementById("manualSaveName").value = defaultManualSaveName();
    refreshSaveMenu();
    modal.classList.add("active");
    document.getElementById("saveMenuCloseBtn").focus();
}

function closeSaveMenu() {
    cancelSaveMenuConfirmation();
    document.getElementById("saveMenuModal").classList.remove("active");
    if (saveMenuState.opener && saveMenuState.opener.isConnected) saveMenuState.opener.focus();
}

document.addEventListener("keydown", function (event) {
    const modal = document.getElementById("saveMenuModal");
    if (!modal || !modal.classList.contains("active")) return;
    if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (saveMenuState.confirm) cancelSaveMenuConfirmation();
        else closeSaveMenu();
    } else if (event.key === "Tab") {
        const focusScope = saveMenuState.confirm ? document.getElementById("saveMenuConfirm") : modal;
        const buttons = Array.from(focusScope.querySelectorAll("button:not(:disabled), input:not(:disabled):not([type=hidden])"))
            .filter(el => el.getClientRects().length);
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (!focusScope.contains(document.activeElement)) { event.preventDefault(); first.focus(); }
        else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
}, true);

window.openSaveMenu = openSaveMenu;
window.closeSaveMenu = closeSaveMenu;
window.cancelSaveMenuConfirmation = cancelSaveMenuConfirmation;
window.createManualSaveFromMenu = createManualSaveFromMenu;
window.exportCurrentSaveFromMenu = exportCurrentSaveFromMenu;
window.importGameSaveFromMenu = importGameSaveFromMenu;
// ── END SAVE MANAGEMENT MENU ────────────────────────────────────
