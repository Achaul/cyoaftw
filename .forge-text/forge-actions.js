// Shared forge presentation: every consequence stays in its native handler.
const forgeRequests = new WeakMap();

function forgeServiceBlock(npc, working) {
    const p = G.player, room = G.activeRoom;
    if (!p || !room || p.hp <= 0 || p.dead || p.unconscious || p._dying || p._collapsing) return "You cannot arrange forge work right now.";
    if (!npc || !isForgeSmith(npc) || G.activeNPC !== npc || !/^(menu|talk|respond|trade|forge)$/.test(G.activeNPCMode || "")) return "Talk or trade with a blacksmith first, then type forge.";
    if ((room.creatures || []).indexOf(npc) < 0 || !isVisibleEntity(npc) || npc.hp <= 0 || npc.dead || npc.unconscious || !canConverseWithNPC(npc) || (npc.hostility || 0) >= 80 || (npc.memory && npc.memory.favorability || 0) <= -70 || renownRefusesTrade(npc)) return "That blacksmith is unavailable.";
    if (isNPCOffDuty(npc)) return "The blacksmith is off duty.";
    if (G.combatEncounter || roomHasActiveHostile(room) || isRoomCollapsed(room) || isPlayerJailed() || hasPendingPartyLoot() || G.activeObject || G.activeItemModal) return "Finish the current danger or interaction first.";
    if (!working && forgeRequests.has(p)) return "Forge work is still finishing. Wait for its result.";
    return "";
}

function forgeItemStamp(item) {
    // Private comparison only; never publish hidden properties.
    return JSON.stringify(item);
}

function captureForgeState(npc, working) {
    const player = G.player, room = G.activeRoom, mode = G.activeNPCMode;
    const source = room.creatures, structural = room.structural;
    const inventory = choiceEntitySnapshot(player), smithInventory = choiceEntitySnapshot(npc);
    const items = (player.inventory || []).concat(Object.values(player.equipped || {})).filter(Boolean);
    const stamps = items.map(forgeItemStamp);
    const turn = getCurrentStoryTurn(), job = player.forgeUpgrade, commission = player.forgeCommission, deity = player.deity;
    const jobStamp = JSON.stringify(job), commissionStamp = JSON.stringify(commission);
    const coins = getCoinValue(player), smithCoins = getCoinValue(npc);
    return function () {
        if (G.player !== player || G.activeRoom !== room || G.activeNPC !== npc || G.activeNPCMode !== mode || room.creatures !== source || room.structural !== structural || forgeServiceBlock(npc, working)) return false;
        if (!inventory() || !smithInventory() || items.some(function (item, i) { return forgeItemStamp(item) !== stamps[i]; })) return false;
        if (player.forgeUpgrade !== job || player.forgeCommission !== commission || player.deity !== deity) return false;
        return working || (getCurrentStoryTurn() === turn && getCoinValue(player) === coins && getCoinValue(npc) === smithCoins && JSON.stringify(job) === jobStamp && JSON.stringify(commission) === commissionStamp);
    };
}

function captureForgeWork(npc, inputs) {
    let guard, stamps;
    const references = (inputs || []).filter(function (input) { return input && typeof input === "object"; });
    const work = { player: G.player, room: G.activeRoom, npc: npc,
        commit: function () { guard = captureForgeState(npc, true); stamps = references.map(forgeItemStamp); },
        valid: function () { return forgeRequests.get(work.player) === work && guard() && references.every(function (input, index) { return forgeItemStamp(input) === stamps[index]; }); }
    };
    forgeRequests.set(work.player, work);
    work.commit();
    return work;
}

function endForgeWork(work, interrupted) {
    if (forgeRequests.get(work.player) === work) forgeRequests.delete(work.player);
    if (!interrupted) return;
    const message = "Forge work was interrupted. Committed costs and completed effects remain; later effects were not applied. Pending commands stay paused.";
    if (G.player === work.player && G.activeRoom === work.room) { setNarration(message); saveGameState(); }
    return { status: "interrupted", message: message };
}

function forgeOwned(item) {
    return !!item && isLootItemVisible(item) && ((G.player.inventory || []).includes(item) || Object.values(G.player.equipped || {}).includes(item));
}

function forgeServiceOptions() {
    const weapons = getForgeWeapons(), broken = weapons.some(isBrokenWeapon);
    return [
        ["sharpen", "Sharpen a blade", weapons.some(function (w) { return isBladedWeapon(w) && !isBrokenWeapon(w); }), "You have no sound blade."],
        ["repair", "Repair a broken weapon", broken, "You have no broken weapon."],
        ["engrave", "Name / engrave a weapon", weapons.some(function (w) { return !isBrokenWeapon(w); }), "You have no sound weapon."],
        ["scrap", "Trade a broken weapon for ore", broken, "You have no broken weapon."],
        ["treat", "Treat armour", getForgeArmour().length > 0, "You have no armour with treatment slots."],
        ["upgrade", "Upgrade armour", !G.player.forgeUpgrade && getForgeUpgradeArmourPieces().length > 0, G.player.forgeUpgrade ? "Collect the current forge job first." : "You have no upgradable armour."],
        ["refine", "Refine ore", getForgeRefineStacks().length > 0, "You have no refinable ore."],
        ["fuse", "Magic anvil: fuse relics", getForgeRelics().length >= 2, "You need two boss relics."],
        ["recolor", "Recolor an item", getForgePigments().length > 0 && getForgeRecolorTargets().length > 0, "You need pigment and eligible gear."]
    ].map(function (row) { return { action: row[0], label: row[1], blockedReason: row[2] ? "" : row[3] }; });
}

function forgeActionSpec(action, npc, item, material, title) {
    const spec = { action: action, item: item && typeof item === "object" ? getItemName(item) : "", material: material ? getItemName(material) : "", fee: 0, turns: 1, note: "", reason: forgeServiceBlock(npc) };
    if (spec.reason) return spec;
    if (!/^(refine|collect|deliver)$/.test(action) && !forgeOwned(item)) spec.reason = "That item is no longer available to the forge.";
    if (material && (!isLootItemVisible(material) || !(G.player.inventory || []).includes(material))) spec.reason = "That material is no longer available.";
    if (action === "sharpen") {
        spec.fee = getSharpenFee(item, material);
        if (!getForgeWeapons().includes(item) || !isBladedWeapon(item) || isBrokenWeapon(item) || material && !getForgeMaterials().includes(material)) spec.reason = "Choose a sound blade and an available forge material.";
        const treatment = getMaterialTreatment(material);
        spec.note = describeTreatment(treatment) + "; " + Math.round(treatment.nothing * 100) + "% wasted, " + Math.round(treatment.brk * 1000) / 10 + "% break chance.";
    } else if (action === "repair") {
        spec.fee = getRepairFee(item, !!material);
        if (!getForgeWeapons().includes(item) || !isBrokenWeapon(item) || material && !isRepairRivet(material)) spec.reason = "Choose a broken weapon and, optionally, a repair rivet.";
        spec.note = Math.round(FORGE_REPAIR_SUCCESS_CHANCE * 100) + "% success. Failure destroys the weapon and refunds the fee.";
    } else if (action === "engrave") {
        spec.fee = FORGE_NAME_FEE; spec.title = sanitizeWeaponTitle(title);
        if (!getForgeWeapons().includes(item) || isBrokenWeapon(item) || !spec.title) spec.reason = "Choose a sound weapon and a name of 1–24 characters.";
    } else if (action === "scrap") {
        if (!getForgeWeapons().includes(item) || !isBrokenWeapon(item)) spec.reason = "Only a broken weapon can be traded for ore.";
        spec.note = "Permanently destroys the weapon for " + getScrapYield(item) + " ore pieces.";
    } else if (action === "treat") {
        spec.fee = getArmourTreatmentFee(item);
        spec.reason = spec.reason || getArmourTreatmentBlockReason(item, material);
        if (!getForgeArmour().includes(item) || !getArmourOres().includes(material)) spec.reason = "Choose eligible armour and elemental ore.";
        spec.note = Math.round(ARMOUR_TREAT_NOTHING_CHANCE * 100) + "% chance to waste the ore.";
    } else if (action === "upgrade") {
        if (!material) return Object.assign(spec, { reason: "Choose an ore." });
        spec.fee = getArmourUpgradeFee(item, material); spec.readyIn = getArmourUpgradeTurns(material);
        if (!getForgeUpgradeArmourPieces().includes(item) || !isUpgradableOre(material) || getOreUpgradeTier(material) <= getArmourUpgradeTier(item) || G.player.forgeUpgrade) spec.reason = "Choose armour and a better-grade ore; collect any existing job first.";
        spec.note = "Leave the piece with the smith; +" + getArmourUpgradeGain(item, material) + " armour, ready in " + spec.readyIn + " turns after this visit.";
    } else if (action === "collect") {
        const job = G.player.forgeUpgrade;
        spec.turns = 0; spec.item = job && job.itemName || "";
        if (!job || !job.item || job.turnsLeft > 0) spec.reason = job ? "The smith needs " + job.turnsLeft + " more turns." : "You have no forge job to collect.";
    } else if (action === "refine") {
        const stack = getForgeRefineStacks().find(function (row) { return row.grade === item; });
        spec.fee = getForgeRefineFee(item); spec.item = "Grade " + item + " ore";
        if (!stack) spec.reason = "That ore grade is unavailable.";
        else { spec.quantity = stack.count; spec.note = "Consumes ALL " + stack.count + " visible ore units of this grade; " + describeRefineOdds(stack) + ". Slag can yield nothing."; }
    } else if (action === "fuse") {
        spec.fee = FORGE_ANVIL_FEE;
        if (!getForgeRelics().includes(item) || !getForgeRelics().includes(material) || item === material) spec.reason = "Choose two different owned boss relics.";
        // A held second relic is eligible too, overriding the ordinary material rule.
        else spec.reason = "";
        spec.note = "Roll 1–5: fee lost, relics retained. Roll 6–16: both consumed for one relic. Roll 17–20: perfect fusion. The resulting relic is determined after confirmation.";
    } else if (action === "recolor") {
        spec.fee = FORGE_RECOLOR_FEE;
        if (!getForgeRecolorTargets().includes(item) || !getForgePigments().includes(material)) spec.reason = "Choose eligible gear and a carried pigment.";
        spec.note = "Resulting colour: " + blendColours(getItemColour(item), String(material && material.pigmentColor || "").toLowerCase()) + ".";
    } else if (action === "deliver") {
        const commission = G.player.forgeCommission;
        if (!commission || countCommissionMaterial(commission.kind) < commission.count) spec.reason = "The commission materials are incomplete.";
        else { spec.reward = commission.reward; spec.note = describeForgeCommission(commission) + "; consumes the required materials and pays " + commission.reward + "g."; }
    } else spec.reason = "That forge action is unavailable.";
    if (!spec.reason && !hasEnoughCoins(G.player, spec.fee)) spec.reason = "You cannot afford the " + spec.fee + "g fee.";
    return spec;
}

function forgeMenu(npc, view, item, extra) {
    const block = forgeServiceBlock(npc);
    if (block) return sharedChoiceResult("blocked", block);
    G.activeNPCMode = "forge";
    const el = document.getElementById("chatOptionsEl");
    if (!el) return sharedChoiceResult("blocked", "The forge controls are unavailable.");
    el.innerHTML = "";
    const menu = beginSharedChoiceMenu("forge-" + view, npc, "Forge: " + view + (item ? " — " + getItemName(item) : ""), function () { forgeMenu(npc, view, item, extra); });
    const valid = menu.valid, guard = captureForgeState(npc, false);
    menu.valid = function () { return valid() && guard(); };
    menu.forgeView = view; menu.forgeItem = item; menu.forgeExtra = extra;
    const add = function (label, action, name, run, reason) {
        el.appendChild(createSharedChoiceButton(menu, label, async function () {
            const result = await run();
            return result && result.status === "needs_input" && sharedChoiceState.menu ? { status: "completed" } : result;
        }, { disabled: !!reason, title: reason || "", textChoice: { action: action, name: name || "" } }));
    };
    const back = function (target) { add("Back", "back", "", function () { return forgeMenu(npc, target || "services"); }); };
    const quote = function (action, target, material, title, name) {
        const spec = forgeActionSpec(action, npc, target, material, title);
        add((name || spec.item) + " — " + spec.fee + "g, " + spec.turns + " turn(s). " + spec.note, action, name || spec.item, function () { return quoteForgeService(action, npc, target, material, title); }, spec.reason);
    };
    if (view === "services") {
        forgeServiceOptions().forEach(function (option) { add(option.label, option.action, "", function () { return forgeMenu(npc, option.action); }, option.blockedReason); });
        if (G.player.forgeUpgrade) quote("collect", null);
        if (G.player.forgeCommission) quote("deliver", null);
        add("Back to conversation", "back", "", function () { G.activeNPCMode = "menu"; renderNPCActionMenu(npc); });
    } else if (/^(sharpen|engrave|scrap|repair)$/.test(view)) {
        getForgeWeapons().filter(function (weapon) { return /^(repair|scrap)$/.test(view) ? isBrokenWeapon(weapon) : !isBrokenWeapon(weapon) && (view !== "sharpen" || isBladedWeapon(weapon)); }).forEach(function (weapon) {
            if (view === "scrap") quote(view, weapon);
            else if (view === "repair") {
                quote(view, weapon);
                const rivet = (G.player.inventory || []).find(function (it) { return isLootItemVisible(it) && isRepairRivet(it); });
                if (rivet) quote(view, weapon, rivet, null, getItemName(weapon) + " with repair rivet");
            } else add(getItemName(weapon), "item", getItemName(weapon), function () { return forgeMenu(npc, view === "sharpen" ? "treatment" : "name", weapon); });
        });
        back();
    } else if (view === "treatment") {
        quote("sharpen", item, null, null, "plain");
        getForgeMaterials().forEach(function (material) { quote("sharpen", item, material, null, getItemName(material)); });
        back("sharpen");
    } else if (view === "name") {
        suggestWeaponTitles(item).forEach(function (title) { quote("engrave", item, null, title, title); });
        add("Suggest other names", "suggest", "", function () { return forgeMenu(npc, "name", item); });
        menu.submitName = function (title) {
            if (sharedChoiceState.menu !== menu || !menu.valid()) return sharedChoiceResult("blocked", "That engraving choice changed. Type options to refresh.");
            if (!String(title || "").trim() || String(title).length > FORGE_NAME_MAX_LEN) return sharedChoiceResult("blocked", "Choose a name of 1–24 characters.");
            clearSharedChoiceMenu(menu); return quoteForgeService("engrave", npc, item, null, title);
        };
        if (!textModeState.enabled) {
            const input = document.createElement("input"), button = document.createElement("button");
            input.className = "chat-respond-input"; input.maxLength = FORGE_NAME_MAX_LEN; input.placeholder = "Weapon name"; input.setAttribute("aria-label", "Weapon name");
            button.className = "chat-option-btn"; button.textContent = "Review engraving";
            button.onclick = function () { return menu.submitName(input.value); };
            input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); menu.submitName(input.value); } });
            el.appendChild(input); el.appendChild(button);
        }
        back("engrave");
    } else if (/^(treat|upgrade|recolor|fuse)$/.test(view)) {
        const items = view === "treat" ? getForgeArmour() : view === "upgrade" ? getForgeUpgradeArmourPieces() : view === "recolor" ? getForgeRecolorTargets() : getForgeRelics();
        items.forEach(function (target) { add(getItemName(target), "item", getItemName(target), function () { return forgeMenu(npc, view + "-material", target); }); });
        back();
    } else if (/-material$/.test(view)) {
        const action = view.replace(/-material$/, "");
        const materials = action === "treat" ? getArmourOres() : action === "upgrade" ? (G.player.inventory || []).filter(function (it) { return isLootItemVisible(it) && isUpgradableOre(it); }) : action === "recolor" ? getForgePigments() : getForgeRelics().filter(function (it) { return it !== item; });
        materials.forEach(function (material) { quote(action, item, material, null, getItemName(material)); });
        back(action);
    } else if (view === "refine") {
        getForgeRefineStacks().forEach(function (stack) { quote("refine", stack.grade, null, null, "grade " + stack.grade); });
        back();
    }
    publishSharedChoiceMenu(menu, el);
    return { status: "needs_input" };
}

function quoteForgeService(action, npc, item, material, title) {
    const spec = forgeActionSpec(action, npc, item, material, title);
    if (spec.reason) return sharedChoiceResult("blocked", spec.reason);
    const el = document.getElementById("chatOptionsEl"); el.innerHTML = "";
    const line = "Confirm " + action + (spec.item ? " " + spec.item : "") + (spec.material ? " using " + spec.material : "") + (spec.title ? ' as "' + spec.title + '"' : "") + ": " + spec.fee + "g, " + spec.turns + " turn(s). " + spec.note;
    const menu = beginSharedChoiceMenu("forge-confirm", npc, line, function () { forgeMenu(npc, "services"); });
    const guard = captureForgeState(npc, false), valid = menu.valid, stamp = JSON.stringify(spec);
    menu.valid = function () { return valid() && guard() && JSON.stringify(forgeActionSpec(action, npc, item, material, title)) === stamp; };
    el.appendChild(createSharedChoiceButton(menu, "Confirm", async function () {
        const player = G.player, coinsBefore = getCoinValue(player);
        const handlers = { sharpen: attemptSharpen, repair: attemptRepair, engrave: function (n, it) { return attemptNameWeapon(n, it, title); }, scrap: attemptScrapWeapon, treat: attemptTreatArmour, upgrade: attemptUpgradeArmour, collect: collectForgeUpgrade, refine: attemptRefineOre, fuse: attemptFuseRelics, recolor: attemptRecolourItem, deliver: deliverForgeCommission };
        const result = await handlers[action](npc, item, material);
        if (result && result.status === "interrupted") return result;
        if (textModeState.enabled) publishTextModeOutput("service", "Forge action finished.", { service: Object.assign({}, spec, { stage: "result", coinChange: getCoinValue(player) - coinsBefore }) }, false);
        return { status: "completed" };
    }, { textChoice: { action: "confirm" } }));
    el.appendChild(createSharedChoiceButton(menu, "Back — keep items and coins", function () { return forgeMenu(npc, "services"); }, { textChoice: { action: "back" } }));
    publishSharedChoiceMenu(menu, el);
    if (textModeState.enabled) publishTextModeOutput("service", line, { service: Object.assign({}, spec, { stage: "quote" }) }, false);
    return { status: "needs_input" };
}
