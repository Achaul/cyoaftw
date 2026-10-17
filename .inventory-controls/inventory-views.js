let _inventoryDisplayPreferences = null;
const INVENTORY_DISPLAY_PREF_KEY = "cyoaftw.inventoryDisplay";

function getInventoryDisplayPreferences() {
    if (_inventoryDisplayPreferences) return _inventoryDisplayPreferences;
    const prefs = { view: "compact", sort: "name" };
    try {
        const saved = JSON.parse(localStorage.getItem(INVENTORY_DISPLAY_PREF_KEY) || "null");
        if (saved && (saved.view === "compact" || saved.view === "expanded")) prefs.view = saved.view;
        if (saved && (saved.sort === "name" || saved.sort === "value")) prefs.sort = saved.sort;
    } catch (e) { /* Storage may be unavailable; the view still works. */ }
    _inventoryDisplayPreferences = prefs;
    return prefs;
}

function setInventoryDisplayPreference(key, value) {
    if (key === "view" ? value !== "compact" && value !== "expanded" : key !== "sort" || value !== "name" && value !== "value") return;
    getInventoryDisplayPreferences()[key] = value;
    try { localStorage.setItem(INVENTORY_DISPLAY_PREF_KEY, JSON.stringify(_inventoryDisplayPreferences)); } catch (e) {}
    renderEquipment();
    const select = document.getElementById(key === "view" ? "inventoryViewSelect" : "inventorySortSelect");
    if (select) select.focus();
}

function compareInventoryDisplayEntries(a, b) {
    if (getInventoryDisplayPreferences().sort === "value") {
        const valueDifference = getItemUnitValue(b.item) - getItemUnitValue(a.item);
        if (valueDifference) return valueDifference;
    }
    return getItemName(a.item).localeCompare(getItemName(b.item)) || String(a.key || "").localeCompare(String(b.key || ""));
}

function appendInventoryDisplayToolbar(parent) {
    const prefs = getInventoryDisplayPreferences();
    const toolbar = document.createElement("div");
    toolbar.className = "inventory-display-toolbar";
    const addSelect = function (key, title, choices) {
        const label = document.createElement("label");
        label.textContent = title + " ";
        const select = document.createElement("select");
        select.id = key === "view" ? "inventoryViewSelect" : "inventorySortSelect";
        select.className = "equipment-action-btn";
        select.setAttribute("aria-label", title + " inventory");
        choices.forEach(function (choice) {
            const option = document.createElement("option");
            option.value = choice[0];
            option.textContent = choice[1];
            select.appendChild(option);
        });
        select.value = prefs[key];
        if (key === "sort") select.title = "Name: A to Z. Value: highest value per item first.";
        select.onchange = function () { setInventoryDisplayPreference(key, select.value); };
        label.appendChild(select);
        toolbar.appendChild(label);
    };
    addSelect("view", "View", [["compact", "Compact"], ["expanded", "Expanded"]]);
    addSelect("sort", "Sort", [["name", "Name (A–Z)"], ["value", "Value (high first)"]]);
    parent.appendChild(toolbar);
}

function appendRucksackInventoryActions(item, parent, primaryParent) {
    const actions = document.createElement("div");
    actions.className = "equipment-row-actions";
    actions.appendChild(createEquipmentActionButton("Remove", removeWornRucksack));
    actions.appendChild(createEquipmentActionButton("Drop", function () { refreshInventoryUi(dropRucksack()); }, { disabled: !G.activeRoom }));
    const extra = document.createElement("div");
    extra.appendChild(createEquipmentActionButton("Examine", function () { openEquipmentExamine(item, { equipped: true }); }));
    extra.appendChild(createEquipmentActionButton("Search", function () { searchOwnContainer(item); }));
    getOwnItemFireSpellButtons(item).forEach(function (button) { extra.appendChild(button); });
    appendEquipmentItemActions(parent, actions, extra, getItemName(item), primaryParent);
}

function renderCompactEquipmentInventory(view, parent) {
    const entries = [];
    view.groups.forEach(function (group) {
        group.entries.forEach(function (entry) {
            entries.push(Object.assign({}, entry, { storageLabel: group.item ? getItemName(group.item) : group.label }));
        });
    });
    // The worn backpack has no fixed equipment slot box; keep it actionable.
    if (G.player.rucksack) entries.push({ item: G.player.rucksack, wornPack: true, key: "worn-pack" });
    entries.sort(compareInventoryDisplayEntries).forEach(function (entry) {
        if (!entry.wornPack) { renderEquipmentInventoryEntry(entry, parent); return; }
        const row = document.createElement("div");
        row.className = "equipment-row";
        const header = document.createElement("div");
        header.className = "equipment-row-header";
        const title = document.createElement("div");
        title.className = "equipment-row-title";
        title.textContent = getItemName(entry.item) + " (worn)";
        header.appendChild(title);
        row.appendChild(header);
        appendRucksackInventoryActions(entry.item, row, header);
        parent.appendChild(row);
    });
    if (!entries.length) {
        const empty = document.createElement("div");
        empty.className = "equipment-empty";
        empty.textContent = "Nothing carried";
        parent.appendChild(empty);
    }
}
