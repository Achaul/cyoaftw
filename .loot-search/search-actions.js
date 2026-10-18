// Discovery is an engine action shared by text commands and normal controls.
// Only direct, already accessible contents can be searched. Opening/listing
// a source never performs this check or recursively reveals a closed bag.
const LOOT_SEARCH_DEFAULT_DC = 12;

function getLootSearchLocation(source, kind) {
    const room = G.activeRoom, player = G.player;
    if (!source || !room || !player) return null;
    if (kind === "fixture") return (room.structural || []).indexOf(source) >= 0 && isFixtureVisible(source, room) && !source.hidden && !source.isHidden && isContainerFixture(source) ? "fixture" : null;
    if (!isLootItemVisible(source)) return null;
    if (kind === "body") return source.objectType === "body" && (room.items || []).indexOf(source) >= 0 ? "body" : null;
    if (kind !== "carry" || !isCarryContainerItem(source)) return null;
    if (player.rucksack === source) return "back";
    const slot = Object.keys(player.equipped || {}).find(function (key) { return player.equipped[key] === source; });
    if (slot) return "equipped:" + slot;
    if ((player.inventory || []).indexOf(source) >= 0) return "inventory";
    return (room.items || []).indexOf(source) >= 0 ? "floor" : null;
}

function getLootSearchBlockReason(source, kind, approachKey, options) {
    const player = G.player, room = G.activeRoom;
    const approach = SEARCH_APPROACHES.find(function (entry) { return entry.key === (approachKey || "careful"); });
    if (!approach) return "Choose a search approach: careful, tight, or force.";
    const location = getLootSearchLocation(source, kind);
    if (!location) return "That body or container is no longer available to search.";
    if (G.activeNPCMode === "combat" || roomHasActiveHostile(room)) return "Too dangerous to search with a threat nearby.";
    if (player.dead || player.hp <= 0 || player.unconscious || player._dying || player._collapsing) return "You cannot search while incapacitated.";
    if (isRoomCollapsed(room)) return "Everything here is buried under rubble.";
    if (hasPendingPartyLoot()) return "Resolve the party's loot decision before searching.";
    if (G.activeObject && G.activeObject !== source) return "Finish the current object interaction first.";
    if (!(options && options.presenting) && G.activeItemModal && G.activeItemModal !== source) return "Close the other item card first.";
    if (G.activeNPC && /^(fixture|body|floor)$/.test(location)) return "Step away from the NPC before searching that source.";
    if (kind === "fixture") {
        if (!source.opened || isChestLocked(source)) return "Open the container before searching its contents. A locked chest must be unlocked first.";
        if (isFixtureBurning(source) || isChestBurning(source)) return "The container is burning. Deal with the fire first.";
    }
    ensureEntityStamina(player);
    if (isEntityExhausted(player) || player.stamina < approach.staminaCost) return "You need " + approach.staminaCost + " stamina for that search. Rest first.";
    return "";
}

function getLootSearchMembers(source, kind) {
    if (kind === "fixture") return ensureContainerContents(source).items.slice();
    if (kind === "carry") return getContainerContents(source).slice();
    const items = Array.isArray(source.inventory) ? source.inventory.slice() : [];
    Object.keys(source.equipped || {}).forEach(function (slot) {
        if (slot === "coinPouch") return;
        const worn = source.equipped[slot];
        if (Array.isArray(worn)) items.push.apply(items, worn.filter(Boolean));
        else if (worn) items.push(worn);
    });
    return items;
}

function getLootItemDiscoveryRule(item) {
    if (!item || isLootItemVisible(item) || item.searchable === false) return null;
    const stat = SEARCH_APPROACHES.some(function (approach) { return approach.stat === item.revealStat; }) ? item.revealStat : "willpower";
    const dc = Number(item.revealDC);
    return { stat: stat, dc: Number.isFinite(dc) && dc > 0 ? Math.max(1, Math.floor(dc)) : LOOT_SEARCH_DEFAULT_DC };
}

function performLootContentsSearch(source, kind, approachKey) {
    const key = approachKey || "careful";
    const block = getLootSearchBlockReason(source, kind, key);
    if (block) return { status: "blocked", message: block, found: [] };
    const player = G.player, room = G.activeRoom, npc = G.activeNPC, mode = G.activeNPCMode;
    const activeObject = G.activeObject, activeModal = G.activeItemModal;
    const location = getLootSearchLocation(source, kind);
    const approach = SEARCH_APPROACHES.find(function (entry) { return entry.key === key; });
    const stash = kind === "fixture" ? ensureContainerContents(source) : null;
    const stashItems = stash && stash.items;
    const inventory = kind === "body" ? source.inventory : null;
    const equipped = kind === "body" ? source.equipped : null;
    const candidates = getLootSearchMembers(source, kind).filter(function (item, index, all) { return item && all.indexOf(item) === index; }).map(function (item) {
        return { item: item, rule: getLootItemDiscoveryRule(item) };
    }).filter(function (entry) { return entry.rule && entry.rule.stat === approach.stat; });
    const lines = [];
    spendEntityStamina(player, approach.staminaCost, lines, { isPlayer: true });
    advanceStoryTurn(1);
    if (typeof runNPCAutonomyTick === "function") runNPCAutonomyTick();

    // Costs are committed, but a world tick must never search a replacement
    // body, newly arrived item, moved bag, or an inaccessible closed source.
    const interrupted = player !== G.player || room !== G.activeRoom || npc !== G.activeNPC || mode !== G.activeNPCMode || activeObject !== G.activeObject || activeModal !== G.activeItemModal ||
        location !== getLootSearchLocation(source, kind) || (stash && (source.contents !== stash || stash.items !== stashItems)) ||
        (kind === "body" && (source.inventory !== inventory || source.equipped !== equipped)) ||
        player.dead || player.hp <= 0 || player.unconscious || player._dying || player._collapsing ||
        G.activeNPCMode === "combat" || roomHasActiveHostile(room) || isRoomCollapsed(room) || hasPendingPartyLoot() ||
        (kind === "fixture" && (!source.opened || isChestLocked(source) || isFixtureBurning(source) || isChestBurning(source)));
    if (interrupted) {
        renderStats(); saveGameState();
        return { status: "interrupted", message: "Your search was interrupted as the situation changed. Its stamina and turn costs are spent; nothing new was revealed.", found: [] };
    }
    // Roll even on an empty/fully searched source. Neither a free retry nor a
    // different roll/no-roll response should reveal whether a secret remains.
    const check = rollStatCheck(player, approach.stat, LOOT_SEARCH_DEFAULT_DC);
    const current = getLootSearchMembers(source, kind);
    const found = [];
    candidates.forEach(function (entry) {
        const item = entry.item, rule = getLootItemDiscoveryRule(item);
        if (current.indexOf(item) < 0 || !rule || rule.stat !== entry.rule.stat || rule.dc !== entry.rule.dc) return;
        if (!check.critFail && (check.critSuccess || check.total >= rule.dc)) {
            item.hidden = false; item.isHidden = false; item.concealed = false; item.visible = true;
            found.push(item);
        }
    });
    if (kind === "body" && !source.bodyLooted) {
        source.bodyLooted = true;
        applyFaithDelta({ trickster: 1 }, "searched a defeated foe");
        rememberStoryEvent("combat", (player.name || "The player") + " searched " + getEntityName(source) + ".", 3);
    }
    if (found.length) {
        const gain = trackCombatSkillGain(player, { statKey: approach.stat });
        if (gain && gain.leveledUp) lines.push("Your " + SEARCH_STAT_LABELS[approach.stat].toLowerCase() + " improves.");
        rememberStoryEvent("exploration", (player.name || "The player") + " discovered " + found.map(getItemName).join(", ") + " while searching " + getEntityName(source) + ".", 2);
    }
    const message = "You search " + getEntityName(source) + " (" + approach.label.toLowerCase() + "). " + (found.length ? "You uncover " + found.map(function (item) { return withIndefiniteArticle(getItemName(item)); }).join(", ") + "." : "You find nothing more.") + (lines.length ? " " + lines.join(" ") : "");
    renderStats(); saveGameState();
    return { status: "completed", message: message, found: found.map(function (item) { return { name: getItemName(item), quantity: getItemQuantity(item) }; }), approach: key, staminaCost: approach.staminaCost, turns: 1 };
}

function searchLootContents(source, kind, approachKey) {
    const result = performLootContentsSearch(source, kind, approachKey);
    setNarration(result.message);
    if (result.status !== "interrupted" && getLootSearchLocation(source, kind)) {
        if (kind === "body") renderRoomObjectActionMenu(source);
        else if (kind === "fixture") openFixtureCard(source, { message: result.message });
        else openContainerCard(source, result.message);
    }
    return result;
}

function searchBodyObject(item, approachKey) {
    return searchLootContents(item, "body", approachKey || "careful");
}

function getLootSearchActions(source, kind) {
    return SEARCH_APPROACHES.map(function (approach) {
        return { key: approach.key, label: approach.label + " (" + approach.staminaCost + " stamina, 1 turn)", reason: getLootSearchBlockReason(source, kind, approach.key, { presenting: true }), run: function () { return searchLootContents(source, kind, approach.key); } };
    });
}
