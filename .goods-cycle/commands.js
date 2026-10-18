// Shared dismantling service: buttons and commands execute these same callbacks.
function parseTextGoodsCommand(raw) {
    const match = /^(?:dismantle|unpick|salvage clothing)(?:\s+(.+))?$/i.exec(raw);
    return match ? { verb: "dismantle", args: { item: textCommandUnquote(match[1] || "") } } : null;
}

function dismantleServiceBlock(npc) {
    if (!G.player || !G.activeRoom || G.player.dead || G.player.hp <= 0 || G.player.unconscious || G.player._dying || G.player._collapsing) return "You cannot arrange dismantling right now.";
    if (!npc || !isClothier(npc) || G.activeNPC !== npc || !/^(menu|talk|respond|trade|clothier)$/.test(G.activeNPCMode || "")) return "Talk or trade with a clothier first, then ask to dismantle clothing.";
    if ((G.activeRoom.creatures || []).indexOf(npc) < 0 || !isVisibleEntity(npc) || !canConverseWithNPC(npc) || npc.dead || npc.hp <= 0 || npc.unconscious || (npc.hostility || 0) >= 80 || (npc.memory && npc.memory.favorability || 0) <= -70 || renownRefusesTrade(npc)) return "That clothier is unavailable.";
    if (isNPCOffDuty(npc)) return "The clothier is off duty. Return during working hours.";
    if (G.combatEncounter || G.activeItemModal || G.activeObject || roomHasActiveHostile(G.activeRoom) || isRoomCollapsed(G.activeRoom) || isPlayerJailed() || hasPendingPartyLoot()) return "Finish the current danger or interaction first.";
    return "";
}

function dismantleItemBlock(npc, item) {
    const block = dismantleServiceBlock(npc);
    if (block) return block;
    if (!item || !isLootItemVisible(item) || G.player.inventory.indexOf(item) < 0 || isItemEquippedByEntity(G.player, item)) return "Choose a carried, unworn garment.";
    if (getContainerSaleBlockReason(item) || clothierItemHasContents(item)) return "Empty the garment's pockets before dismantling it.";
    return getGarmentRecovery(item).length ? "" : "That piece cannot provide usable tailoring material through this service.";
}

function textGoodsAvailable() {
    return typeof getGarmentRecovery === "function" && !!G.activeNPC && !dismantleServiceBlock(G.activeNPC);
}

function dismantleQuoteStamp(item) {
    return JSON.stringify([choiceItemStamp(item), item.material, item.composition, item.durability, item.value, item.hiddenTrait, item.enchant, item.enchantment, item.unique, item.questItem, item.packed]);
}

function beginDismantleMenu(npc, kind, title, refresh) {
    const menu = beginSharedChoiceMenu(kind, npc, title, refresh), valid = menu.valid;
    const now = getCurrentStoryTurn();
    const items = G.player.inventory.map(function (item) { return { item: item, stamp: dismantleQuoteStamp(item) }; });
    menu.valid = function () { return valid() && !dismantleServiceBlock(npc) && now === getCurrentStoryTurn() && items.every(function (entry) { return dismantleQuoteStamp(entry.item) === entry.stamp; }); };
    return menu;
}

function openClothierDismantle(npc) {
    const block = dismantleServiceBlock(npc);
    if (block) return sharedChoiceResult("blocked", block);
    G.activeNPCMode = "clothier";
    const el = document.getElementById("chatOptionsEl");
    if (!el) return { status: "blocked", message: "The service controls are unavailable." };
    el.innerHTML = "";
    const menu = beginDismantleMenu(npc, "goods-dismantle", "Dismantle clothing — choose one unworn, empty garment. Nothing is destroyed until you confirm the quote.", function () { openClothierDismantle(npc); });
    G.player.inventory.filter(function (item) { return !dismantleItemBlock(npc, item); }).forEach(function (item) {
        el.appendChild(createSharedChoiceButton(menu, getItemName(item) + " ×" + getItemQuantity(item), function () { return showDismantleQuote(npc, item); }, { textChoice: { action: "dismantle", item: item } }));
    });
    if (!menu.options.length) clothierText(el, "You have no eligible unworn, empty garments with recoverable material.");
    el.appendChild(createSharedChoiceButton(menu, "Back to trading", function () { G.activeNPCMode = "trade"; renderTradeOptions(npc); }, { textChoice: { action: "back" } }));
    publishSharedChoiceMenu(menu, el);
    return { status: "needs_input" };
}

function showDismantleQuote(npc, item) {
    const block = dismantleItemBlock(npc, item);
    if (block) return sharedChoiceResult("blocked", block);
    const parts = getGarmentRecovery(item), fee = Math.max(1, Math.ceil(parts.reduce(function (sum, part) { return sum + part.quantity; }, 0) / 2));
    const quote = { npc: npc, item: item, player: G.player, room: G.activeRoom, inventory: G.player.inventory, stamp: dismantleQuoteStamp(item), parts: parts, fee: fee, used: false };
    const materials = parts.map(function (part) { return { name: part.template.name, material: part.material, quantity: part.quantity }; });
    const line = "Destroy one " + getItemName(item) + " and recover " + parts.map(function (part) { return part.quantity + " × " + part.template.name; }).join(", ") + ". Fee: " + fee + "g. Time: 1 turn. Careful unpicking preserves usable sections; existing damage reduces recovery. Materials that do not fit will be placed at your feet.";
    const el = document.getElementById("chatOptionsEl");
    if (!el) return { status: "blocked", message: "The service controls are unavailable." };
    el.innerHTML = ""; clothierText(el, line);
    const menu = beginDismantleMenu(npc, "goods-dismantle-quote", line, function () { openClothierDismantle(npc); });
    el.appendChild(createSharedChoiceButton(menu, "Confirm dismantling — " + fee + "g", function () { return performClothierDismantle(quote); }, { disabled: !hasEnoughCoins(G.player, fee), title: hasEnoughCoins(G.player, fee) ? "" : "You cannot afford this service.", textChoice: { action: "confirm" } }));
    el.appendChild(createSharedChoiceButton(menu, "Back — keep the garment", function () { return openClothierDismantle(npc); }, { textChoice: { action: "back" } }));
    publishSharedChoiceMenu(menu, el);
    if (typeof textModeState !== "undefined" && textModeState.enabled) publishTextModeOutput("service", line, { service: { action: "dismantle", stage: "quote", item: getItemName(item), fee: fee, turns: 1, materials: materials } }, false);
    return { status: "needs_input" };
}

function performClothierDismantle(quote) {
    const npc = quote.npc, item = quote.item;
    if (quote.used || G.player !== quote.player || G.activeRoom !== quote.room || G.player.inventory !== quote.inventory || dismantleQuoteStamp(item) !== quote.stamp) return { status: "blocked", message: "That dismantling quote has changed. Ask for a new quote." };
    const block = dismantleItemBlock(npc, item);
    if (block || !hasEnoughCoins(G.player, quote.fee)) return { status: "blocked", message: block || "You cannot afford the service." };
    // A single synchronous transaction: one input unit, one fee, exact outputs.
    quote.used = true;
    takeOneUnitFromList(G.player.inventory, item);
    adjustCoins(G.player, -quote.fee); adjustCoins(npc, quote.fee);
    const results = quote.parts.map(function (part) {
        const material = createRecoveredMaterial(part), added = addToPlayerPack(material);
        if (!added.ok) { if (!Array.isArray(quote.room.items)) quote.room.items = []; quote.room.items.push(added.refused); }
        return { name: part.template.name, material: part.material, quantity: part.quantity, location: added.ok ? "carried" : "floor" };
    });
    advanceStoryTurn(1);
    const line = npc.name + " carefully unpicks one " + getItemName(item) + ". Recovered: " + results.map(function (result) { return result.quantity + " × " + result.name + (result.location === "floor" ? " (placed at your feet)" : ""); }).join(", ") + ". Paid " + quote.fee + "g.";
    publishTextModeOutput("service", line, { service: { action: "dismantle", stage: "result", item: getItemName(item), fee: quote.fee, turns: 1, materials: results } }, false);
    saveGameState(); renderStats();
    if (G.player !== quote.player || G.activeRoom !== quote.room || dismantleServiceBlock(npc)) return { status: "interrupted", message: "Dismantling finished and the materials were delivered, but the service was interrupted. Completed work will not be repeated." };
    showTradeMessage(line, true);
    G.activeNPCMode = "trade"; renderTradeOptions(npc);
    return { status: "completed" };
}

function textGoodsShow(topic) {
    if (/^(market|supply|deliveries)$/.test(topic)) return textModeResult("completed", G.activeNPC && merchantGoodsEligible(G.activeNPC) ? merchantGoodsSummary(G.activeNPC) : "Trade with a vendor to review their supply cycle. Ordinary stock changes with game days; junk becomes coin, useful goods sell, and suppliers replenish specialty stock.");
    if (!/^(dismantle|dismantling|salvage clothing)$/.test(topic)) return null;
    if (!textGoodsAvailable()) return textModeResult("blocked", dismantleServiceBlock(G.activeNPC));
    const items = G.player.inventory.filter(function (item) { return !dismantleItemBlock(G.activeNPC, item); });
    return textModeResult("completed", "Dismantling candidates: " + (items.length ? items.map(getItemName).join(", ") : "none") + ". Use dismantle <name>, review the quote, then choose Confirm. The service costs one turn and a small fee. Worn garments and filled pockets must be cleared first.");
}

async function executeTextGoodsCommand(action) {
    const npc = G.activeNPC, block = dismantleServiceBlock(npc);
    if (block) return textModeResult("blocked", block);
    const opened = openClothierDismantle(npc);
    if (opened.status !== "needs_input") return opened;
    const query = action.args.item;
    if (!query) return opened;
    const menu = sharedChoiceState.menu;
    const choices = textLootMatch(query, menu.options.filter(function (choice) { return choice.meta.action === "dismantle"; }), function (choice) { return getItemName(choice.meta.item); });
    if (choices.length !== 1) return textModeResult("needs_input", "Choose the exact garment by number from options. No garment or coin has been taken.");
    return runSharedChoice(menu, choices[0]);
}
