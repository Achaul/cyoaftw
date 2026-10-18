// Trading is a command adapter over the same stock, quotes and transactions
// as the buttons. A trade question holds object references and its quoted price.
function parseTextTradeCommand(raw) {
    let match = /^(?:trade(?:\s+with)?|shop\s+with|barter\s+with)(?:\s+(.+))?$/i.exec(raw);
    if (match) return { verb: "trade", args: { target: match[1] || "" } };
    match = /^(?:stock|wares|shop)(?:\s+(.+))?$/i.exec(raw);
    if (match) return { verb: "stock", args: { scope: match[1] || "buy" } };
    match = /^(buy|purchase|sell)(?:\s+([\s\S]+))?$/i.exec(raw);
    if (match) {
        let name = match[2] || "", amount = "";
        const count = /^(all|\d+)\s+(.+)$/i.exec(name);
        if (count) { amount = count[1].toLowerCase(); name = count[2]; }
        return { verb: match[1].toLowerCase() === "sell" ? "sell" : "buy", args: { item: textCommandUnquote(name), amount: amount } };
    }
    match = /^(?:examine|inspect|x)\s+(?:stock|shop|wares)(?:\s+([\s\S]+))?$/i.exec(raw);
    return match ? { verb: "examine", args: { item: textCommandUnquote(match[1] || ""), scope: "stock" } } : null;
}

function textTradeBlock(npc) {
    if (textModeInCombat()) return "Finish the fight before trading.";
    if (!npc || G.activeNPC !== npc || G.activeNPCMode !== "trade") return "Start trading first: trade with <npc>.";
    if (textModeVisibleNPCs().indexOf(npc) < 0 || !canConverseWithNPC(npc)) return "That trader is no longer available.";
    if (G.player.carrying) return "Put down the person you are carrying before trading.";
    if (npc._inSkirmish && !isEntityExhausted(npc)) return "That trader is too occupied fighting to do business.";
    if (isNPCOffDuty(npc, G.activeRoom)) return getOffDutyLine(npc);
    if ((npc.hostility || 0) >= 80 || (npc.memory && (npc.memory.favorability || 0) <= -70)) return "They refuse to trade while things stand like this.";
    if (renownRefusesTrade(npc)) return getRenownRefusalMessage(npc);
    return "";
}

function textTradeGroups(npc, side) {
    const list = side === "buy" ? npc.inventory : G.player.inventory;
    const stock = side === "buy" ? ensureNPCTradeStock(npc) : (list || []).filter(function (item) { return item && !isItemEquippedByEntity(G.player, item); });
    const groups = [];
    stock.filter(textInventoryVisible).forEach(function (item) {
        const price = side === "buy" ? getTradeBuyPrice(npc, item) : getTradeSellPrice(npc, item);
        // Keep different sizes/prices separate even if the engine's general
        // display key would group them: each quantity uses one exact quote.
        const key = getTradeStackKey(item) + "|text:" + getItemUnitSize(item) + ":" + price;
        let group = groups.find(function (entry) { return entry.key === key; });
        if (!group) {
            group = { key: key, item: item, items: [], count: 0, npc: npc, list: side === "buy" ? npc.inventory : G.player.inventory, side: side, price: price, infinite: side === "buy" && !!item.infinite };
            groups.push(group);
        }
        group.items.push(item); group.count += getItemQuantity(item);
    });
    groups.forEach(function (entry) {
        entry.block = side === "sell" ? entry.items.map(getContainerSaleBlockReason).find(Boolean) || "" : "";
        entry.label = textInventoryItemName(entry.item) + (entry.infinite ? " — always in stock" : " ×" + entry.count) + " — " + entry.price + "g each" + (entry.block ? " — " + entry.block : "");
    });
    return groups;
}

function textTradeList(side) {
    const npc = G.activeNPC, reason = textTradeBlock(npc);
    if (reason) return textModeResult("blocked", reason);
    const groups = textTradeGroups(npc, side);
    const items = groups.map(function (entry, index) { return { number: index + 1, name: getItemName(entry.item), quantity: entry.infinite ? null : entry.count, infinite: entry.infinite, unitPrice: entry.price, blockedReason: entry.block }; });
    return textModeResult("completed", (side === "buy" ? "Stock from " : "Goods you can offer to ") + textModeNPCLabel(npc) + ":\n" + (groups.length ? groups.map(function (entry, index) { return (index + 1) + ". " + entry.label; }).join("\n") : "None.") + "\nYour coins: " + getCoinValue(G.player) + "g. Trader's coins: " + getCoinValue(npc) + "g.\n" + (side === "buy" ? "Use buy [amount] <name>, examine stock <name>, or show sell." : "Use sell [amount] <name>. Remove worn gear first and empty containers before selling.") + " Type leave to step away.", { trade: { merchant: textModeNPCLabel(npc), side: side, playerCoins: getCoinValue(G.player), merchantCoins: getCoinValue(npc), items: items } });
}

function textTradeMatchGroups(selector, groups) {
    let query = textCommandNormalize(selector).replace(/\b(?:the|a|an|my|stock|shop|wares|carried|inventory)\b/g, " ");
    const ordinals = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10 };
    let ordinal = null;
    query = query.replace(/\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|\d+(?:st|nd|rd|th))\b/, function (word) { ordinal = ordinals[word] || parseInt(word, 10); return " "; });
    const singular = function (word) { return word.length > 3 && !/ss$/.test(word) ? word.replace(/s$/, "") : word; };
    const tokens = query.split(/\s+/).filter(Boolean).map(singular);
    if (!tokens.length) return [];
    const matches = groups.filter(function (entry) {
        const words = textCommandNormalize(textInventoryItemName(entry.item)).split(" ").map(singular);
        return tokens.every(function (token) { return words.indexOf(token) >= 0; });
    });
    return ordinal !== null ? (ordinal > 0 && ordinal <= matches.length ? [matches[ordinal - 1]] : []) : matches;
}

function textTradeResolve(action, side) {
    const npc = G.activeNPC, reason = textTradeBlock(npc);
    if (reason) return { result: textModeResult("blocked", reason) };
    const groups = textTradeGroups(npc, side);
    const ref = action.tradeRef;
    const matches = ref ? groups.filter(function (entry) {
        return entry.npc === ref.npc && entry.list === ref.list && entry.side === ref.side && entry.key === ref.key && entry.items.length === ref.items.length && entry.items.every(function (item) { return ref.items.indexOf(item) >= 0; });
    }) : textTradeMatchGroups(action.args.item, groups);
    if (!matches.length) return { result: textModeResult("blocked", ref ? "That stock, item or quoted price changed. Please repeat the command." : "No matching " + (side === "buy" ? "stock" : "carried item") + ". Use " + (side === "buy" ? "show stock" : "show sell") + " to check names. Worn items must be removed before selling.") };
    if (matches.length > 1) return { result: textModeAsk(action, "tradeItem", matches, "Which item do you mean?") };
    return { entry: matches[0], npc: npc };
}

async function executeTextTradeInspect(action) {
    const resolved = textTradeResolve(action, "buy");
    if (resolved.result) return resolved.result;
    const entry = resolved.entry, scene = textModeScene(), epoch = textModeState.epoch;
    const description = await generateItemExamineText(entry.item);
    if (epoch !== textModeState.epoch || !textModeSameScene(scene) || textTradeBlock(resolved.npc) || !textTradeGroups(resolved.npc, "buy").some(function (current) { return current.key === entry.key && current.items.indexOf(entry.item) >= 0; })) return textModeResult("interrupted", "The trader or item changed while examining it. Please try again.");
    const slot = getItemEquipSlot(entry.item);
    const lines = buildEquipmentExamineLines(entry.item, slot).concat(buildItemEffectLines(entry.item)).concat(buildEquipmentCompareLines(entry.item, slot, false));
    saveGameState();
    return textModeResult("completed", getItemName(entry.item) + ": " + description + "\n" + lines.join("\n") + "\nPrice: " + entry.price + "g each.", { item: { name: getItemName(entry.item), location: "stock", description: description, lines: lines, unitPrice: entry.price } });
}

async function executeTextTradeCommand(action) {
    const args = action.args || {};
    if (action.verb === "trade") {
        if (G.activeNPC && !/^(menu|talk|respond|trade)$/.test(G.activeNPCMode)) return textModeResult("blocked", "Finish the current interaction before trading.");
        const candidates = textModeVisibleNPCs().filter(canConverseWithNPC);
        let matches;
        if (action.targetRef) matches = candidates.filter(function (npc) { return npc === action.targetRef; });
        else if (!String(args.target || "").trim() && G.activeNPC) matches = candidates.filter(function (npc) { return npc === G.activeNPC; });
        else matches = resolveTextNPCTarget(args.target, candidates, function (npc) { return (npc.role || "") + (/merchant|trader/i.test(npc.role || "") ? " merchant" : ""); }).matches;
        if (!matches.length) return textModeResult("blocked", "No available NPC matches that trader. Type who is here.");
        if (matches.length > 1) return textModeAsk(action, "target", matches, "Who would you like to trade with?");
        const npc = matches[0];
        if (G.activeNPC && G.activeNPC !== npc) return textModeResult("blocked", "Type leave before trading with someone else.");
        if (G.activeNPC !== npc) selectNPC(npc);
        if (G.activeNPC !== npc || textModeInCombat()) return textModeResult("blocked", "You could not engage that trader.");
        tradeWithNPC(npc);
        if (G.activeNPCMode !== "trade") return textModeResult("blocked", "They are not available for trade right now.");
        return textTradeList("buy");
    }
    if (action.verb === "stock") {
        const scope = textCommandNormalize(args.scope || "buy");
        if (!/^(buy|stock|wares|sell|selling)$/.test(scope)) return textModeResult("blocked", "Use show stock or show sell.");
        return textTradeList(/^(sell|selling)$/.test(scope) ? "sell" : "buy");
    }
    if (!String(args.item || "").trim() && !args.amount) return textTradeList(action.verb);
    const resolved = textTradeResolve(action, action.verb);
    if (resolved.result) return resolved.result;
    const entry = resolved.entry, npc = resolved.npc;
    if (entry.infinite && args.amount === "all") return textModeResult("blocked", "That item is always in stock. Choose a number from 1 to 100.");
    const amount = args.amount === "all" ? entry.count : args.amount ? Number(args.amount) : 1;
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > 100) return textModeResult("blocked", "Choose a whole amount from 1 to 100 per command.");
    if (!entry.infinite && amount > entry.count) return textModeResult("blocked", "Only " + entry.count + " are available. Nothing was traded.");
    if (entry.block) return textModeResult("blocked", entry.block);
    const total = amount * entry.price;
    if (!Number.isSafeInteger(total)) return textModeResult("blocked", "That trade total is too large.");
    const payer = action.verb === "buy" ? G.player : npc;
    if (!hasEnoughCoins(payer, total)) return textModeResult("blocked", (action.verb === "buy" ? "You need " : "The trader needs ") + total + "g for that full quantity. Nothing was traded.");
    if (action.verb === "buy" && !packHasRoomFor(entry.item, amount)) return textModeResult("blocked", packFullText([entry.item]) + " Nothing was traded.");
    const scene = textModeScene();
    const result = action.verb === "buy" ? (amount === 1 ? buyTradeItem(npc, entry.item) : buyTradeItems(npc, entry, amount)) : (amount === 1 ? sellTradeItem(npc, entry.item) : sellTradeItems(npc, entry, amount));
    if (!result || !result.quantity) return textModeResult("blocked", "The trade did not complete. Pending commands are paused; check the latest trader response.");
    const details = { trade: { merchant: textModeNPCLabel(npc), side: action.verb, name: getItemName(entry.item), quantity: result.quantity, total: result.total } };
    if (result.quantity !== amount || result.total !== total) return textModeResult("interrupted", "The trade changed while resolving: " + result.quantity + " item(s) for " + result.total + "g. Pending commands are paused.", details);
    if (!textModeSameScene(scene) || textTradeBlock(npc)) return textModeResult("interrupted", "Trade completed, but the trader or scene changed. Pending commands are paused.", details);
    // The handler already published the transaction's narration.
    publishTextModeOutput("trade", "You " + action.verb + " " + result.quantity + " × " + getItemName(entry.item) + " for " + result.total + "g.", details, false);
    return { status: "completed" };
}
