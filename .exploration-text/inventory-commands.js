// Inventory adapter: resolve public item names, then call the existing rules.
// References exist only for a pending question; never persist item selectors.
function parseTextInventoryCommand(raw) {
    const key = textCommandNormalize(raw);
    for (const def of TEXT_COMMANDS.filter(function (entry) { return entry.inventory; })) {
        const aliases = def.aliases.slice().sort(function (a, b) { return b.length - a.length; });
        const alias = aliases.find(function (word) { return key === word || key.indexOf(word + " ") === 0; });
        if (!alias) continue;
        // Keep original punctuation in names; command words contain only letters/spaces.
        const pattern = new RegExp("^" + alias.replace(/ /g, "\\s+") + "(?:\\s+([\\s\\S]+))?$", "i");
        const match = pattern.exec(raw);
        if (!match) continue;
        let item = textCommandUnquote(match[1] || ""), amount = "";
        if (def.id === "drop") {
            const count = /^(all|\d+)\s+(.+)$/i.exec(item);
            if (count) { amount = count[1].toLowerCase(); item = textCommandUnquote(count[2]); }
        }
        return { verb: def.id, args: def.id === "inventory" ? { scope: item } : def.id === "equipment" ? {} : def.id === "drop" ? { item: item, amount: amount } : { item: item } };
    }
    // Explicit ability names take priority over an identically named consumable.
    const use = /^use\s+(.+)$/i.exec(raw);
    if (use && (!textModeInCombat() || !textCombatActions().some(function (action) { return textCombatActionMatches(action, use[1]); }))) {
        const matches = resolveTextInventoryItems(use[1], "consume");
        if (matches.length && matches.every(function (entry) { return textInventoryConsumeVerb(entry.item) === textInventoryConsumeVerb(matches[0].item); })) {
            const verb = textInventoryConsumeVerb(matches[0].item);
            if (verb) return { verb: verb, args: { item: use[1] } };
        }
    }
    return null;
}

function textInventoryVisible(item) {
    return !!item && !item.hidden && !item.isHidden && !item.concealed && item.visible !== false && item.objectType !== "body";
}

function textInventoryConsumeVerb(item) {
    if (isPotionItem(item) || isAlcoholItem(item)) return "drink";
    if (isHerbItem(item)) return HEALING_HERBS[getHerbKey(item)].verb === "Drink" ? "drink" : "eat";
    const supply = getSupplyUse(item);
    return supply ? (supply.verb === "Drink" ? "drink" : "eat") : null;
}

function textInventoryCandidates() {
    const player = G.player;
    if (!player) return [];
    const result = [];
    if (Array.isArray(player.inventory) && player.inventory.length) {
        buildPlayerInventoryEntries(player).forEach(function (entry) {
            if (!textInventoryVisible(entry.item)) return;
            const location = "carried";
            const storage = entry.item.stowed ? " (" + textInventoryStorageLabel(entry.item.stowed) + ")" : "";
            result.push({ item: entry.item, list: player.inventory, key: entry.key, quantity: entry.totalQuantity, location: location,
                label: textInventoryItemName(entry.item) + " ×" + entry.totalQuantity + " — " + location + storage });
        });
    }
    Object.keys(player.equipped || {}).forEach(function (slot) {
        const item = player.equipped[slot];
        if (!textInventoryVisible(item) || Array.isArray(item) || slot === "coinPouch") return;
        result.push({ item: item, slot: slot, quantity: 1, location: "equipped", label: textInventoryItemName(item) + " — equipped: " + getEquipmentSlotMeta(slot).label });
    });
    if (textInventoryVisible(player.rucksack)) result.push({ item: player.rucksack, slot: "back", quantity: 1, location: "equipped", label: textInventoryItemName(player.rucksack) + " — equipped: back" });
    (G.activeRoom && G.activeRoom.items || []).forEach(function (item) {
        if (textInventoryVisible(item) && isRoomItemTakeable(item)) result.push({ item: item, list: G.activeRoom.items, quantity: getItemQuantity(item), location: "floor", label: textInventoryItemName(item) + " ×" + getItemQuantity(item) + " — floor" });
    });
    return result;
}

function textInventoryStorageLabel(key) {
    const containers = typeof getPlayerCarryContainers === "function" ? getPlayerCarryContainers(G.player) : [];
    const container = containers.find(function (item) {
        const places = getGarmentPlaces(item);
        return places.storage.concat(places.ties).some(function (place) { return place.id === key; });
    });
    return container ? getItemName(container) : key === "overflow" ? "overflow" : key === "hand" ? "hand" : "stored";
}

function textInventoryItemName(item) {
    const name = getItemName(item);
    return item.qualityName && textCommandNormalize(name).indexOf(textCommandNormalize(item.qualityName)) < 0 ? name + " (" + item.qualityName + ")" : name;
}

function textInventoryEligible(entry, verb) {
    if (verb === "take") return entry.location === "floor";
    if (verb === "unequip") return entry.location === "equipped";
    if (/^(drink|eat|consume)$/.test(verb)) return entry.location === "carried" && (verb === "consume" ? !!textInventoryConsumeVerb(entry.item) : textInventoryConsumeVerb(entry.item) === verb);
    if (verb === "drop") return entry.location !== "floor";
    if (verb === "equip") return entry.location !== "equipped";
    return true;
}

function resolveTextInventoryItems(selector, verb) {
    let query = textCommandNormalize(selector);
    let location = null, ordinal = null;
    query = query.replace(/\b(carried|inventory|equipped|worn|floor|ground)\b/g, function (word) {
        const found = /^(equipped|worn)$/.test(word) ? "equipped" : /^(floor|ground)$/.test(word) ? "floor" : "carried";
        location = location && location !== found ? "conflicting" : found;
        return " ";
    });
    const ordinals = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10 };
    query = query.replace(/\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|\d+(?:st|nd|rd|th))\b/, function (word) { ordinal = ordinals[word] || parseInt(word, 10); return " "; });
    const tokens = query.split(/\s+/).filter(function (word) { return word && !/^(the|a|an|my|from|on|in)$/.test(word); });
    const singular = function (word) { return word.length > 3 && !/ss$/.test(word) ? word.replace(/s$/, "") : word; };
    const matches = textInventoryCandidates().filter(function (entry) {
        if (!textInventoryEligible(entry, verb) || (location && location !== entry.location)) return false;
        const words = textCommandNormalize(textInventoryItemName(entry.item) + (entry.slot ? " " + entry.slot + " " + getEquipmentSlotMeta(entry.slot).label : "")).split(" ").map(singular);
        return tokens.every(function (token) { return words.indexOf(singular(token)) >= 0; });
    });
    return ordinal !== null ? (ordinal > 0 && ordinal <= matches.length ? [matches[ordinal - 1]] : []) : matches;
}

function textInventoryFreshSelection(ref, verb) {
    return textInventoryCandidates().find(function (entry) {
        return entry.item === ref.item && entry.location === ref.location && entry.list === ref.list && entry.slot === ref.slot && entry.key === ref.key && textInventoryEligible(entry, verb);
    });
}

function textInventoryList(scope) {
    const location = scope === "equipment" ? "equipped" : scope === "floor" ? "floor" : "carried";
    const entries = textInventoryCandidates().filter(function (entry) { return entry.location === location; });
    const title = scope === "equipment" ? "Equipped gear" : scope === "floor" ? "Visible loose items" : "Inventory";
    const items = entries.map(function (entry, index) { return { number: index + 1, name: getItemName(entry.item), quantity: entry.quantity, location: entry.location, slot: entry.slot || null, actions: ["examine", "equip", "unequip", "drop", "drink", "eat", "take"].filter(function (verb) { return textInventoryEligible(entry, verb) && (verb !== "equip" || !!getDirectEquipmentSlot(entry.item)); }) }; });
    return textModeResult("completed", title + ":\n" + (entries.length ? entries.map(function (entry, i) { return (i + 1) + ". " + entry.label; }).join("\n") : "None.") + (scope === "inventory" ? "\nCoins: " + getCoinValue(G.player) + ". Use equipment for worn gear; show floor for loose items." : "") + "\nUse an item name, for example examine sword. Ambiguous names ask for a number.", { inventory: { scope: scope, items: items } });
}

function textInventoryRefresh(message) {
    // Keep the active conversation/combat panel and narration in place.
    restowPlayerPack(G.player);
    refreshInventoryUi();
    return textModeResult("completed", message);
}

async function executeTextInventoryCommand(action) {
    const args = action.args || {};
    if (action.verb === "inventory") {
        const scope = textCommandNormalize(args.scope);
        if (scope && !/^(floor|ground|equipment|gear|equipped|carried|inventory|all)$/.test(scope)) return textModeResult("blocked", "Use inventory, equipment, or show floor.");
        return textInventoryList(/^(equipment|gear|equipped)$/.test(scope) ? "equipment" : /^(floor|ground)$/.test(scope) ? "floor" : "inventory");
    }
    if (action.verb === "equipment") return textInventoryList("equipment");
    if (!String(args.item || "").trim()) return textModeResult("blocked", "Name an item, for example " + action.verb + " sword. Use inventory, equipment, or show floor to see names.");
    const matches = action.itemRef ? [textInventoryFreshSelection(action.itemRef, action.verb)].filter(Boolean) : resolveTextInventoryItems(args.item, action.verb);
    if (!matches.length) return textModeResult("blocked", action.itemRef ? "That item changed or is no longer available. Please repeat the command." : "No available item matches that request. Use inventory, equipment, or show floor to check its name and location.");
    if (matches.length > 1) return textModeAsk(action, "item", matches, "Which item do you mean?");
    const entry = matches[0], item = entry.item, name = getItemName(item);
    const inCombat = textModeInCombat();
    if (action.verb === "examine") {
        const scene = textModeScene();
        const epoch = textModeState.epoch;
        const description = await generateItemExamineText(item);
        if (epoch !== textModeState.epoch || !textModeSameScene(scene) || !textInventoryFreshSelection(entry, "examine")) return textModeResult("interrupted", "The scene or item changed while examining it. Please try again.");
        const slot = entry.slot === "back" ? null : entry.slot || getItemEquipSlot(item);
        const lines = buildEquipmentExamineLines(item, slot).concat(buildItemEffectLines(item)).concat(buildEquipmentCompareLines(item, slot, entry.location === "equipped"));
        saveGameState();
        return textModeResult("completed", name + ": " + description + "\n" + lines.join("\n"), { item: { name: name, location: entry.location, quantity: entry.quantity, description: description, lines: lines } });
    }
    if (action.verb === "equip") {
        if (!getDirectEquipmentSlot(item)) return textModeResult("blocked", name + " cannot be equipped.");
        return textInventoryRefresh(equipPlayerItemFromSource(item, entry.list));
    }
    if (action.verb === "unequip") {
        if (entry.slot === "back") { removeWornRucksack(); return textModeResult("completed", "You remove " + name + " and carry it."); }
        if (!moveEquippedItemToInventory(entry.slot)) return textModeResult("blocked", "That item could not be removed.");
        return textInventoryRefresh("You remove " + name + " and carry it.");
    }
    if (action.verb === "drop") {
        const amount = args.amount === "all" ? entry.quantity : args.amount ? Number(args.amount) : 1;
        if (!Number.isSafeInteger(amount) || amount < 1 || amount > entry.quantity) return textModeResult("blocked", "Choose a whole amount from 1 to " + entry.quantity + ", or all.");
        if (entry.slot === "back") return textInventoryRefresh(dropRucksack());
        const dropped = entry.location === "equipped" ? dropEquippedItemToRoom(entry.slot) : dropInventoryEntryToRoom(entry.key, amount);
        if (!dropped) return textModeResult("blocked", "That item could not be dropped.");
        return textInventoryRefresh("You drop " + name + (amount > 1 ? " ×" + amount : "") + ".");
    }
    if (action.verb === "take") {
        // The engine handles coins, wearable packs, overflow refusal and persistence.
        const scene = textModeScene();
        takeRoomObject(item);
        if (scene.room.items.indexOf(item) >= 0) return textModeResult("blocked", "You could not carry " + name + ". Check your pack space.");
        return textModeResult("completed", "You pick up " + name + ".");
    }
    if (action.verb === "drink" || action.verb === "eat") {
        if (isPotionItem(item) && item.statusKey === "potionMana" && !playerUsesMana(G.player)) return textModeResult("blocked", "You have no mana to restore.");
        const supply = getSupplyUse(item);
        if (inCombat && supply) return textModeResult("blocked", "You cannot use ordinary food or drink supplies in the middle of a fight. Potions, alcohol and healing herbs use a combat turn.");
        if (inCombat) {
            textModeState.combatTurnSpent = false;
            if (isHerbItem(item)) eatHerbInCombat(G.activeNPC, entry.key);
            else drinkPotionInCombat(G.activeNPC, entry.key);
            if (!textModeState.combatTurnSpent) return textModeResult("blocked", "That consumable could not be used.");
            return { status: "completed" };
        }
        const line = supply ? useSupplyEntry(entry.key) : isHerbItem(item) ? eatInventoryHerb(entry.key) : drinkInventoryEntry(entry.key);
        if (!line) return textModeResult("blocked", "That consumable could not be used.");
        return textInventoryRefresh(line);
    }
    return textModeResult("blocked", "That inventory action is not supported.");
}
