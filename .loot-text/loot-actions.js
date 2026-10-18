// Public loot stays visible; bulk collection must leave hidden belongings intact.
function isLootItemVisible(item) {
    return !!item && !item.hidden && !item.isHidden && !item.concealed && item.visible !== false;
}

// Optional quantities preserve the original button behavior (whole stack).
function takeLootUnitsFromList(list, item, amount) {
    if (!item || !Array.isArray(list) || list.indexOf(item) < 0) return null;
    const count = getItemQuantity(item);
    const wanted = amount === undefined ? count : amount;
    if (!Number.isSafeInteger(wanted) || wanted < 1 || wanted > count) return null;
    if (wanted === count) return list.splice(list.indexOf(item), 1)[0];
    const taken = cloneItemForStackAmount(item, wanted);
    item.quantity = count - wanted;
    return taken;
}
