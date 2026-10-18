// One presentation and eligibility layer for native enchanter services.
function enchanterServiceBlock(npc) {
    const p = G.player, room = G.activeRoom;
    if (!p || !room || p.hp <= 0 || p.dead || p.unconscious || p._dying || p._collapsing) return "You cannot arrange enchanting right now.";
    if (!npc || npc.role !== "Enchanter" || G.activeNPC !== npc || !/^(menu|talk|respond|trade|enchant)$/.test(G.activeNPCMode || "")) return "Talk or trade with an enchanter first, then type enchanter.";
    if ((room.creatures || []).indexOf(npc) < 0 || !isVisibleEntity(npc) || npc.hp <= 0 || npc.dead || npc.unconscious || !canConverseWithNPC(npc) || (npc.hostility || 0) >= 80 || (npc.memory && npc.memory.favorability || 0) <= -70 || renownRefusesTrade(npc)) return "That enchanter is unavailable.";
    if (isNPCOffDuty(npc)) return "The enchanter is off duty.";
    if (G.combatEncounter || roomHasActiveHostile(room) || isRoomCollapsed(room) || isPlayerJailed() || hasPendingPartyLoot() || G.activeObject || G.activeItemModal) return "Finish the current danger or interaction first.";
    return "";
}

function getEnchanterItems(action) {
    const p = G.player;
    if (!p) return [];
    const inventory = (p.inventory || []).filter(isLootItemVisible);
    if (action === "duplicate") return inventory.filter(function (item) { return !isItemEquippedByEntity(p, item); });
    const weapons = inventory.filter(function (item) { return isEnchantableWeapon(item) && !isBrokenWeapon(item); });
    const held = p.equipped && p.equipped.weapon;
    if (isLootItemVisible(held) && isEnchantableWeapon(held) && !isBrokenWeapon(held) && !weapons.includes(held)) weapons.unshift(held);
    return weapons;
}

function enchanterActionSpec(action, npc, item) {
    const spec = { provider: "enchanter", action: action, item: item ? getItemName(item) : "", quantity: item ? getItemQuantity(item) : 0, fee: 0, turns: 0, successChance: 0, reason: enchanterServiceBlock(npc) };
    if (spec.reason) return spec;
    if (!/^(enchant|duplicate)$/.test(action)) { spec.reason = "That enchanter service is unavailable."; return spec; }
    if (!item || !getEnchanterItems(action).includes(item)) { spec.reason = action === "duplicate" ? "Choose a visible carried item that is not equipped." : "Choose a visible, sound carried or equipped weapon."; return spec; }
    spec.fee = action === "enchant" ? getEnchantCost(item) : getDuplicateCost(item);
    spec.successChance = action === "enchant" ? getEnchantSuccessChance(item) : DUPLICATE_SUCCESS_CHANCE;
    if (action === "enchant" && getEnchantTier(item) >= ENCHANT_MAX_TIER) spec.reason = "That weapon is fully enchanted.";
    else if (!hasEnoughCoins(G.player, spec.fee)) spec.reason = "You cannot afford the " + spec.fee + "g fee.";
    return spec;
}

function captureEnchanterState(npc) {
    const player = G.player, room = G.activeRoom, mode = G.activeNPCMode;
    const source = room.creatures, structural = room.structural;
    const inventory = choiceEntitySnapshot(player), provider = choiceEntitySnapshot(npc);
    const items = (player.inventory || []).concat(Object.values(player.equipped || {})).filter(Boolean);
    // Full data is private comparison material, never a public projection.
    const stamps = items.map(function (item) { return JSON.stringify(item); });
    const turn = getCurrentStoryTurn(), coins = getCoinValue(player), providerCoins = getCoinValue(npc);
    return function () {
        return G.player === player && G.activeRoom === room && G.activeNPC === npc && G.activeNPCMode === mode && room.creatures === source && room.structural === structural &&
            !enchanterServiceBlock(npc) && inventory() && provider() && getCurrentStoryTurn() === turn && getCoinValue(player) === coins && getCoinValue(npc) === providerCoins &&
            items.every(function (item, i) { return JSON.stringify(item) === stamps[i]; });
    };
}

function enchanterMenu(npc, view) {
    const block = enchanterServiceBlock(npc);
    if (block) return sharedChoiceResult("blocked", block);
    G.activeNPCMode = "enchant";
    const el = document.getElementById("chatOptionsEl");
    if (!el) return sharedChoiceResult("blocked", "The service controls are unavailable.");
    el.innerHTML = "";
    const menu = beginSharedChoiceMenu("enchanter-" + view, npc, "Enchanter: " + view, function () { return enchanterMenu(npc, view); });
    const valid = menu.valid, guard = captureEnchanterState(npc);
    menu.valid = function () { return valid() && guard(); };
    const add = function (label, action, run, item, reason) {
        el.appendChild(createSharedChoiceButton(menu, label, run, { disabled: !!reason, title: reason || "", textChoice: { action: action, name: item ? getItemName(item) : "" } }));
    };
    if (view === "services") {
        add("Enchant a weapon", "enchant", function () { enchanterMenu(npc, "enchant"); }, null, getEnchanterItems("enchant").some(function (item) { return !enchanterActionSpec("enchant", npc, item).reason; }) ? "" : "No affordable eligible weapon; use show enchanting for details.");
        add("Duplicate an item (costly)", "duplicate", function () { enchanterMenu(npc, "duplicate"); }, null, getEnchanterItems("duplicate").length ? "" : "You have no visible carried items to duplicate.");
        add("Back to conversation", "back", function () { G.activeNPCMode = "menu"; renderNPCActionMenu(npc); });
    } else {
        getEnchanterItems(view).forEach(function (item) {
            const spec = enchanterActionSpec(view, npc, item);
            add(getItemName(item) + " ×" + spec.quantity + " — " + spec.fee + "g (" + Math.round(spec.successChance * 100) + "% success)", view, function () { quoteEnchanterService(view, npc, item); }, item, spec.reason);
        });
        if (!menu.options.length) menu.title += " — no eligible visible items.";
        add("Back", "back", function () { enchanterMenu(npc, "services"); });
    }
    publishSharedChoiceMenu(menu, el);
    return { status: "needs_input" };
}

function quoteEnchanterService(action, npc, item) {
    const spec = enchanterActionSpec(action, npc, item);
    if (spec.reason) return sharedChoiceResult("blocked", spec.reason);
    const line = "Confirm " + action + " " + spec.item + " ×" + spec.quantity + ": " + spec.fee + "g, no story turn, " + Math.round(spec.successChance * 100) + "% success. Failure still costs the fee; the original item is retained." + (action === "duplicate" ? " Copies this whole inventory entry, including any embedded packed contents." : " The engine rolls the enchantment; no element or bonus is promised.");
    const el = document.getElementById("chatOptionsEl"); el.innerHTML = "";
    const menu = beginSharedChoiceMenu("enchanter-confirm", npc, line, function () { enchanterMenu(npc, action); });
    const valid = menu.valid, guard = captureEnchanterState(npc), stamp = JSON.stringify(spec);
    menu.valid = function () { return valid() && guard() && JSON.stringify(enchanterActionSpec(action, npc, item)) === stamp; };
    el.appendChild(createSharedChoiceButton(menu, "Confirm", function () { return action === "enchant" ? attemptEnchantItem(npc, item) : attemptDuplicateItem(npc, item); }, { textChoice: { action: "confirm" } }));
    el.appendChild(createSharedChoiceButton(menu, "Back — keep coins", function () { enchanterMenu(npc, action); }, { textChoice: { action: "back" } }));
    publishSharedChoiceMenu(menu, el);
    if (textModeState.enabled) publishTextModeOutput("service", line, { service: Object.assign({}, spec, { stage: "quote" }) }, false);
    return { status: "needs_input" };
}

function publishEnchanterResult(spec, success, coinsBefore, resultItem) {
    if (textModeState.enabled) publishTextModeOutput("service", "Enchanter attempt finished.", { service: { provider: "enchanter", stage: "result", action: spec.action, item: spec.item, quantity: spec.quantity, fee: spec.fee, turns: 0, success: success, coinChange: getCoinValue(G.player) - coinsBefore, result: resultItem ? { name: getItemName(resultItem), quantity: getItemQuantity(resultItem) } : null } }, false);
    return { status: "completed", success: success };
}

function cloneEnchanterItem(item) {
    // A live item is not a template: its nested state and identities need copying.
    const copy = JSON.parse(JSON.stringify(item)), keys = new Map();
    function renew(node, root) {
        if (!node || typeof node !== "object") return;
        if (!Array.isArray(node) && (root || node._uid || node.name && Array.isArray(node.type))) {
            const oldKey = node._ck;
            delete node._uid; delete node.id;
            assignLootUID(node);
            if (oldKey) { node._ck = "ck-" + node._uid; keys.set(oldKey, node._ck); }
        }
        Object.values(node).forEach(function (child) { renew(child, false); });
    }
    renew(copy, true);
    function remap(node) {
        if (!node || typeof node !== "object") return;
        if (typeof node.stowed === "string") node.stowed = node.stowed.split(":").map(function (part) { return keys.get(part) || part; }).join(":");
        Object.values(node).forEach(remap);
    }
    remap(copy); delete copy.stowed;
    return copy;
}
