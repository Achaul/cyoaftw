// One exact sale quote for the buttons, text lists and transaction handlers.
function getTradeSellPrice(npc, item) {
    const basePrice = Math.max(1, Math.floor(getItemUnitValue(item) / 2));
    const multiplier = getMerchantSellMultiplier(npc, item) * (item.stolen && playerHasTechnique(G.player, "fence") ? ROGUE_FENCE_BONUS : 1);
    return Math.max(1, Math.floor(basePrice * multiplier));
}
