let _equipmentMoreSequence = 0;
let _equipmentOpenMore = null;

// Extra item controls expand below their own row, so selects and long spell
// actions stay usable without covering another item. Only one is open at once.
function appendEquipmentItemActions(parent, primary, extra, itemName, primaryParent) {
    const id = "equipment-more-" + (++_equipmentMoreSequence);
    extra.id = id;
    extra.className = "equipment-row-actions equipment-more-actions";
    extra.hidden = true;
    extra.style.display = "none";
    extra.setAttribute("role", "group");
    extra.setAttribute("aria-label", "More actions for " + itemName);
    const close = function (restoreFocus) {
        extra.hidden = true;
        extra.style.display = "none";
        more.setAttribute("aria-expanded", "false");
        if (_equipmentOpenMore && _equipmentOpenMore.panel === extra) _equipmentOpenMore = null;
        if (restoreFocus) more.focus();
    };
    const more = createEquipmentActionButton("\u2026", function () {
        if (!extra.hidden) { close(false); return; }
        if (_equipmentOpenMore) _equipmentOpenMore.close(false);
        extra.hidden = false;
        extra.style.display = "";
        more.setAttribute("aria-expanded", "true");
        _equipmentOpenMore = { panel: extra, close: close };
    });
    more.className = "equipment-action-btn equipment-more-toggle";
    more.title = "More actions for " + itemName;
    more.setAttribute("aria-label", more.title);
    more.setAttribute("aria-expanded", "false");
    more.setAttribute("aria-controls", id);
    const escape = function (event) {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        close(true);
    };
    more.onkeydown = escape;
    extra.onkeydown = escape;
    primary.appendChild(more);
    (primaryParent || parent).appendChild(primary);
    parent.appendChild(extra);
}

// A worn pack can also be carried, with its storage and contents intact.
function removeWornRucksack() {
    const player = G.player;
    const item = player && player.rucksack;
    if (!item) return;
    player.rucksack = null;
    delete item.stowed;
    player.inventory = Array.isArray(player.inventory) ? player.inventory : [];
    player.inventory.push(item);
    restowPlayerPack(player);
    refreshInventoryUi("You remove " + getItemName(item) + " and carry it.");
}
