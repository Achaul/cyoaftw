const fs = require('node:fs');
const path = require('node:path');
let core = fs.readFileSync('C:/Git/CYOADEV/cyoaftw-engine-CORE.js', 'utf8');
function changeSection(start, end, change) {
    const a = core.indexOf(start), b = core.indexOf(end, a);
    if (a < 0 || b <= a) throw new Error('Missing section: ' + start);
    core = core.slice(0, a) + change(core.slice(a, b)) + core.slice(b);
}
function once(source, before, after) {
    if (source.split(before).length !== 2) throw new Error('Expected one match: ' + before);
    return source.replace(before, after);
}
changeSection('function renderEquipmentSlot(', 'function renderEquipmentInventoryEntry(', section =>
    once(section, 'extraActionsEl.appendChild(createEquipmentActionButton("Examine",', 'actionsEl.appendChild(createEquipmentActionButton("Examine",'));
changeSection('function renderEquipmentInventoryEntry(', 'let _equipmentMoreSequence', section => {
    section = once(section, '    actionsEl.appendChild(createEquipmentActionButton("Examine", () => openEquipmentExamine(entry.item, { slot: slot, equipped: false })));\r\n', '');
    section = once(section, '    primaryActionsEl.className = "equipment-row-actions";',
        '    primaryActionsEl.className = "equipment-row-actions";\r\n    primaryActionsEl.appendChild(createEquipmentActionButton("Examine", () => openEquipmentExamine(entry.item, { slot: slot, equipped: false })));');
    section = once(section, 'primaryActionsEl.appendChild(createEquipmentActionButton("Equip",', 'actionsEl.appendChild(createEquipmentActionButton("Equip",');
    return once(section, 'primaryActionsEl.appendChild(equip);', 'actionsEl.appendChild(equip);');
});
changeSection('function appendWornContainerActions(', 'function renderEquipmentInventoryGroups(', section =>
    once(section, 'extra.appendChild(createEquipmentActionButton("Examine",', 'actions.appendChild(createEquipmentActionButton("Examine",'));
changeSection('function appendRucksackInventoryActions(', 'function renderCompactEquipmentInventory(', section => {
    section = once(section, '    extra.appendChild(createEquipmentActionButton("Examine", function () { openEquipmentExamine(item, { equipped: true }); }));\r\n', '');
    return once(section, '    actions.className = "equipment-row-actions";',
        '    actions.className = "equipment-row-actions";\r\n    actions.appendChild(createEquipmentActionButton("Examine", function () { openEquipmentExamine(item, { equipped: true }); }));');
});
core = once(core, 'function appendEquipmentItemActions(parent, primary, extra, itemName, primaryParent) {',
    'function appendEquipmentItemActions(parent, primary, extra, itemName, primaryParent) {\r\n    if (!extra.children.length) {\r\n        (primaryParent || parent).appendChild(primary);\r\n        return;\r\n    }');
core = once(core, 'window.__ENGINE_CORE_VERSION = "2026-10-17-015";', 'window.__ENGINE_CORE_VERSION = "2026-10-17-016";');
core = once(core, '// Latest: Compact/Expanded inventory views, controls beside item names, ellipsis menus, container equipment controls, and persisted name/value sorting.',
    '// Latest: Examine is a primary equipment action; Equip is under the item ellipsis menu. Compact/Expanded views and persisted name/value sorting.');
fs.writeFileSync(path.join(__dirname, 'cyoaftw-engine-CORE.js'), core);
console.log('Prepared primary Examine controls and Equip in ellipsis menus.');
