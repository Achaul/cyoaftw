const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const read = name => fs.readFileSync(path.join(root, name), 'utf8').replace(/\r\n/g, '\n');
function once(source, before, after) {
    if (source.split(before).length !== 2) throw Error('Expected one match: ' + before.slice(0, 100));
    return source.replace(before, after);
}
function editSection(source, start, end, edit) {
    const a = source.indexOf(start), b = source.indexOf(end, a);
    if (a < 0 || b <= a) throw Error(start);
    return source.slice(0, a) + edit(source.slice(a, b)) + source.slice(b);
}
let core = read('before/cyoaftw-engine-CORE.js');
core = editSection(core, 'function renderEquipmentInventoryEntry(', '// ── CHARACTER SHEET', function (chunk) {
    chunk = once(chunk, '    const slot = getItemEquipSlot(entry.item);', '    const slot = getItemEquipSlot(entry.item);\n    const wearablePack = entry.item.container && entry.item.container.wearable === "back" && !entry.item.ruined && !entry.item.unusable;');
    chunk = once(chunk, 'const baseSubtitle = slot ? `Can equip to ${getEquipmentSlotMeta(slot).label}` : ((isPotion || isAlcohol)', 'const baseSubtitle = slot ? `Can equip to ${getEquipmentSlotMeta(slot).label}` : (wearablePack ? "Can equip to Back" : ((isPotion || isAlcohol)');
    chunk = once(chunk, 'getInventoryUseSubtitle(entry.item))))));', 'getInventoryUseSubtitle(entry.item)))))));');
    chunk = once(chunk, '    if (slot) {\n        actionsEl.appendChild(createEquipmentActionButton("Equip",', '    const primaryActionsEl = document.createElement("div");\n    primaryActionsEl.className = "equipment-row-actions";\n    if (slot) {\n        primaryActionsEl.appendChild(createEquipmentActionButton("Equip",');
    chunk = once(chunk, '        }, { disabled: getInventoryEntryMaxEquipAmount(entry) <= 0 }));\n    }', `        }, { disabled: getInventoryEntryMaxEquipAmount(entry) <= 0 }));
    } else {
        const equip = createEquipmentActionButton("Equip", function () {
            if (!wearablePack || G.player.rucksack || (G.player.inventory || []).indexOf(entry.item) < 0) return;
            refreshInventoryUi(wearRucksack(entry.item));
        }, { disabled: !wearablePack || !!G.player.rucksack });
        equip.title = wearablePack ? (G.player.rucksack ? "Remove your current pack first." : "Wear as your pack.") : "This item cannot be equipped.";
        primaryActionsEl.appendChild(equip);
    }`);
    chunk = once(chunk, '    if (entry.item.container && entry.item.container.wearable === "back" && G.player.rucksack === null) {\n        actionsEl.appendChild(createEquipmentActionButton("Wear as your pack", () => { refreshInventoryUi(wearRucksack(entry.item)); }));\n    }\n', '');
    chunk = once(chunk, '        actionsEl.appendChild(qtyWrap);', '        primaryActionsEl.appendChild(qtyWrap);');
    chunk = once(chunk, '    actionsEl.appendChild(createEquipmentActionButton("Drop",', '    primaryActionsEl.appendChild(createEquipmentActionButton("Drop",');
    chunk = once(chunk, '    rowEl.appendChild(actionsEl);', '    appendEquipmentItemActions(rowEl, primaryActionsEl, actionsEl, getItemName(entry.item), headerEl);');
    chunk = once(chunk, '    actionsEl.appendChild(createEquipmentActionButton("Examine",', `    if (entry.storageLabel) {
        const location = document.createElement("div");
        location.className = "equipment-row-subtitle inventory-item-location";
        location.textContent = "Stored in: " + entry.storageLabel;
        actionsEl.appendChild(location);
    }
    actionsEl.appendChild(createEquipmentActionButton("Examine",`);
    return chunk + read('more-actions.js') + '\n\n';
});
core = editSection(core, 'function appendWornContainerActions(', 'function renderEquipmentInventoryGroups(', function (chunk) {
    chunk = once(chunk, '    actions.appendChild(createEquipmentActionButton("Examine " + name, () => openEquipmentExamine(item, { slot: slot, equipped: true })));', `    const extra = document.createElement("div");
    extra.appendChild(createEquipmentActionButton("Examine", () => openEquipmentExamine(item, { slot: slot, equipped: true })));
    extra.appendChild(createEquipmentActionButton("Search", () => searchOwnContainer(item)));
    getOwnItemFireSpellButtons(item).forEach(function (button) { extra.appendChild(button); });`);
    chunk = once(chunk, 'createEquipmentActionButton("Remove " + name,', 'createEquipmentActionButton("Remove",');
    chunk = once(chunk, 'createEquipmentActionButton("Drop " + name,', 'createEquipmentActionButton("Drop",');
    return once(chunk, '    parent.appendChild(actions);', '    appendEquipmentItemActions(parent, actions, extra, name);');
});
core = editSection(core, '        if (group.item === G.player.rucksack) {', '        if (!group.entries.length) {', function (chunk) {
    chunk = once(chunk, '            actions.appendChild(createEquipmentActionButton("Manage rucksack", () => searchOwnContainer(group.item)));', `            actions.appendChild(createEquipmentActionButton("Remove", removeWornRucksack));
            const extra = document.createElement("div");
            extra.appendChild(createEquipmentActionButton("Examine", () => openEquipmentExamine(group.item, { equipped: true })));
            extra.appendChild(createEquipmentActionButton("Search", () => searchOwnContainer(group.item)));`);
    chunk = once(chunk, 'createEquipmentActionButton("Set rucksack down",', 'createEquipmentActionButton("Drop",');
    chunk = once(chunk, '{ actions.appendChild(button); }', '{ extra.appendChild(button); }');
    return once(chunk, '            section.appendChild(actions);', '            appendEquipmentItemActions(section, actions, extra, getItemName(group.item));');
});
core = editSection(core, 'function renderEquipmentSlot(', 'function renderEquipmentInventoryEntry(', function (chunk) {
    const start = chunk.indexOf('    const actionsEl = document.createElement("div");', chunk.indexOf('    if (!item) {'));
    if (start < 0) throw Error('Worn item actions');
    let actions = chunk.slice(start);
    actions = once(actions, '    actionsEl.appendChild(createEquipmentActionButton("Examine",', '    const extraActionsEl = document.createElement("div");\n    extraActionsEl.appendChild(createEquipmentActionButton("Examine",');
    actions = once(actions, 'actionsEl.appendChild(createEquipmentActionButton("Search",', 'extraActionsEl.appendChild(createEquipmentActionButton("Search",');
    actions = once(actions, 'function (b) { actionsEl.appendChild(b); }', 'function (b) { extraActionsEl.appendChild(b); }');
    actions = once(actions, '    slotEl.appendChild(actionsEl);', '    appendEquipmentItemActions(slotEl, actionsEl, extraActionsEl, getItemName(item));');
    return chunk.slice(0, start) + actions;
});
core = editSection(core, 'function renderEquipmentInventoryGroups(', 'function renderEquipment() {', function (chunk) {
    return once(chunk, '        group.entries.forEach(function (entry) {', '        group.entries.slice().sort(compareInventoryDisplayEntries).forEach(function (entry) {');
});
core = editSection(core, '        if (group.item === G.player.rucksack) {', '        if (!group.entries.length) {', function () {
    return '        if (group.item === G.player.rucksack) appendRucksackInventoryActions(group.item, section);\n';
});
core = once(core, 'function renderEquipment() {', read('inventory-views.js') + '\n\nfunction renderEquipment() {');
core = editSection(core, 'function renderEquipment() {', '// ── SPINNER', function (chunk) {
    chunk = once(chunk, '    inventoryEl.innerHTML = "";', '    inventoryEl.innerHTML = "";\n    const compact = getInventoryDisplayPreferences().view === "compact";\n    inventoryEl.classList.toggle("inventory-compact", compact);\n    appendInventoryDisplayToolbar(inventoryEl);');
    chunk = once(chunk, '    renderEquipmentInventoryGroups(view, inventoryEl);', '    if (compact) renderCompactEquipmentInventory(view, inventoryEl);\n    else renderEquipmentInventoryGroups(view, inventoryEl);');
    return once(chunk, '    if (!view.groups.length) {', '    if (!compact && !view.groups.length) {');
});
core = once(core, '// Core Engine Version: 2026-10-17-009', '// Core Engine Version: 2026-10-17-010');
core = once(core, 'window.__ENGINE_CORE_VERSION = "2026-10-17-009";', 'window.__ENGINE_CORE_VERSION = "2026-10-17-010";');
core = once(core, '// Latest: Actor-to-target prefixes on combat action lines, preserving unprefixed status and debug lines.', '// Latest: Compact/Expanded inventory views, controls beside item names, ellipsis menus, container equipment controls, and persisted name/value sorting.\n// Previous: Player-led guide check-ins with bounded delivery, caring responses and concise canonical origin stories.\n// Previous: Actor-to-target prefixes on combat action lines, preserving unprefixed status and debug lines.');
fs.writeFileSync(path.join(root, 'cyoaftw-engine-CORE.js'), core.replace(/\n/g, '\r\n'));
let html = read('before/cyoaftw-engine-CORE.html');
html = once(html, '.equipment-qty-wrap {', read('inventory-controls.css') + '\n\n.equipment-qty-wrap {');
fs.writeFileSync(path.join(root, 'cyoaftw-engine-CORE.html'), html.replace(/\n/g, '\r\n'));
console.log('Built compact inventory controls.');
