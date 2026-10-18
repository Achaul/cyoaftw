// A selected loot source is session-only. Opening/listing never transfers loot.
function textLootQuantity(value) {
    const match = /^(all|\d+)\s+([\s\S]+)$/i.exec(value || "");
    return { item: textCommandUnquote(match ? match[2] : value || ""), amount: match ? match[1].toLowerCase() : "" };
}

function textLootRelation(value, allowed) {
    const text = String(value || "").replace(/[“”]/g, '"');
    let quote = "";
    for (let i = 0; i < text.length; i++) {
        const ch = text.charAt(i);
        if (quote) { if (ch === quote && text.charAt(i - 1) !== "\\") quote = ""; continue; }
        if (ch === '"' || (ch === "'" && (!i || /\s/.test(text.charAt(i - 1))))) { quote = ch; continue; }
        const match = /^\s+(from|into|in)\s+/i.exec(text.slice(i));
        if (match && allowed.indexOf(match[1].toLowerCase()) >= 0) return { item: text.slice(0, i).trim(), source: textCommandUnquote(text.slice(i + match[0].length)) };
    }
    return null;
}

function parseTextLootCommand(raw) {
    let match = /^(open|search|rummage|contents|loot|unlock|pick(?!\s+up\b)(?:\s+lock)?|force(?:\s+open)?)(?:\s+(.+))?$/i.exec(raw);
    if (match) return { verb: /^pick/i.test(match[1]) ? "pick" : /^force/i.test(match[1]) ? "force" : /^rummage$/i.test(match[1]) ? "search" : match[1].toLowerCase(), args: { source: textCommandUnquote((match[2] || "").replace(/^on\s+/i, "")) } };
    if (/^(close(?:\s+container)?|done)$/i.test(raw)) return { verb: "close", args: {} };
    match = /^(?:take|get|pick up)\s+([\s\S]+)$/i.exec(raw);
    if (match) {
        const relation = textLootRelation(match[1], ["from"]);
        const count = textLootQuantity(relation ? relation.item : match[1]);
        if (relation && /^(?:the\s+)?(?:floor|ground)$/i.test(relation.source)) return { verb: "take", args: { item: "floor " + count.item } };
        if (relation || count.amount || /^all$/i.test(count.item)) return { verb: "take", args: { item: count.item, amount: count.amount, source: relation ? relation.source : "" } };
    }
    match = /^(?:store|put|stow)\s+([\s\S]+)$/i.exec(raw);
    if (match) {
        const relation = textLootRelation(match[1], ["in", "into"]);
        if (relation || !/^put\b/i.test(raw)) {
            const count = textLootQuantity(relation ? relation.item : match[1]);
            return { verb: "store", args: { item: count.item, amount: count.amount, source: relation ? relation.source : "" } };
        }
    }
    return null;
}

function textLootSources() {
    const room = G.activeRoom, player = G.player, result = [];
    if (!room || !player) return result;
    (getVisibleRoomFixtures(room) || []).forEach(function (item) {
        if (item && !item.hidden && !item.isHidden && isContainerFixture(item)) result.push({ source: item, kind: "fixture", location: "room", list: room.structural, label: getEntityName(item) + " — room container" });
    });
    (room.items || []).forEach(function (item) {
        if (!item || item.hidden || item.isHidden || item.concealed || item.visible === false) return;
        if (item.objectType === "body" && isVisibleEntity(item)) result.push({ source: item, kind: "body", location: "floor", list: room.items, label: getEntityName(item) + " — " + (item.bodyState || "body") });
    });
    textInventoryCandidates().forEach(function (entry) {
        if (isCarryContainerItem(entry.item)) result.push({ source: entry.item, kind: "carry", location: entry.location, list: entry.list, slot: entry.slot, label: textInventoryItemName(entry.item) + " — " + entry.location + (entry.slot ? ": " + entry.slot : "") });
    });
    return result;
}

function textLootFresh(ref) {
    return ref && textLootSources().find(function (entry) { return entry.source === ref.source && entry.kind === ref.kind && entry.location === ref.location && entry.list === ref.list && entry.slot === ref.slot; });
}

function textLootContext() {
    const context = textModeState.lootContext;
    if (!context || context.player !== G.player || context.room !== G.activeRoom || !textLootFresh(context.ref)) { textModeState.lootContext = null; return null; }
    return textLootFresh(context.ref);
}

function textLootSelect(entry) {
    textModeState.lootContext = { ref: entry, player: G.player, room: G.activeRoom };
}

function textLootTakeHasSource(action) {
    return !!(action.args.source || action.args.amount || action.sourceRef || action.lootItemRef || /^all$/i.test(action.args.item || "") || (textLootContext() && !/^(?:the\s+)?(?:floor|ground)\b/i.test(action.args.item || "")));
}

function textLootMatch(selector, entries, wordsFor) {
    let query = textCommandNormalize(selector);
    const ordinals = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10 };
    let ordinal = null;
    query = query.replace(/\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|\d+(?:st|nd|rd|th))\b/, function (word) { ordinal = ordinals[word] || parseInt(word, 10); return " "; });
    const singular = function (word) { return word.length > 3 && !/ss$/.test(word) ? word.replace(/s$/, "") : word; };
    const tokens = query.split(/\s+/).filter(function (word) { return word && !/^(a|an|the|my|of)$/.test(word); }).map(singular);
    const matches = entries.filter(function (entry) { const words = textCommandNormalize(wordsFor(entry)).split(" ").map(singular); return tokens.every(function (word) { return words.indexOf(word) >= 0; }); });
    return ordinal !== null ? (ordinal > 0 && ordinal <= matches.length ? [matches[ordinal - 1]] : []) : matches;
}

function textLootResolve(action) {
    const ref = action.sourceRef;
    let matches = ref ? [textLootFresh(ref)].filter(Boolean) : action.args.source ? textLootMatch(action.args.source, textLootSources(), function (entry) { return entry.label + (entry.kind === "body" ? " body" : " container"); }) : textLootContext() ? [textLootContext()] : textLootSources();
    if (!matches.length) return { result: textModeResult("blocked", ref ? "That loot source moved or is no longer available. Repeat the command." : "No visible container or body matches. Type show containers to see available sources.") };
    if (matches.length > 1) return { result: textModeAsk(action, "lootSource", matches, "Which container or body do you mean?") };
    const entry = matches[0];
    action.sourceRef = entry;
    return { entry: entry };
}

function textLootBlock(entry) {
    if (!textLootFresh(entry)) return "That loot source moved or is no longer available.";
    if (textModeInCombat()) return "Finish the fight before handling containers or loot.";
    if (entry.kind !== "carry" || entry.location === "floor") {
        if (G.activeNPC) return "Type leave before handling room containers or bodies.";
        if (isRoomCollapsed(G.activeRoom)) return "Everything here is buried under rubble.";
        if (roomHasActiveHostile(G.activeRoom)) return "Too dangerous to handle loot with a threat nearby.";
    }
    if (entry.kind === "fixture" && (isFixtureBurning(entry.source) || isChestBurning(entry.source))) return "The container is burning. Deal with the fire before reaching inside.";
    return "";
}

function textLootReady(entry) {
    return entry.kind === "fixture" ? entry.source.opened === true : entry.kind === "body" ? entry.source.bodyLooted === true : true;
}

function textLootEntries(entry) {
    if (!textLootReady(entry)) return [];
    const rows = entry.kind === "body" ? getBodyLootRows(entry.source) : (entry.kind === "fixture" ? ensureContainerContents(entry.source).items : getContainerContents(entry.source)).map(function (item) { return { item: item, source: "inventory" }; });
    const groups = [];
    rows.forEach(function (row) {
        if (!isLootItemVisible(row.item)) return;
        const key = (row.slot || "inventory") + ":" + getTradeStackKey(row.item) + ":" + getItemUnitSize(row.item);
        let group = groups.find(function (value) { return value.key === key; });
        if (!group) { group = { key: key, item: row.item, items: [], slot: row.slot, quantity: 0 }; groups.push(group); }
        group.items.push(row.item); group.quantity += getItemQuantity(row.item);
    });
    groups.forEach(function (group) { group.label = textInventoryItemName(group.item) + " ×" + group.quantity + (group.slot ? " — worn: " + group.slot : ""); });
    return groups;
}

function textLootCoins(entry) {
    return !textLootReady(entry) ? 0 : entry.kind === "fixture" ? ensureContainerContents(entry.source).coins : entry.kind === "body" ? getCoinValue(entry.source) : 0;
}

function textLootList(entry, select) {
    const reason = textLootBlock(entry);
    if (reason) return textModeResult("blocked", reason);
    if (select !== false) textLootSelect(entry);
    if (!textLootReady(entry)) return textModeResult("blocked", entry.kind === "body" ? "Search this body first: search " + getEntityName(entry.source) + "." : "This container is closed. Use open <container>; a locked chest needs unlock, pick, or force first.");
    const groups = textLootEntries(entry), coins = textLootCoins(entry);
    return textModeResult("completed", "Contents of " + getEntityName(entry.source) + ":\n" + (groups.length ? groups.map(function (group, i) { return (i + 1) + ". " + group.label; }).join("\n") : "No visible items.") + (coins > 0 ? "\nCoins: " + coins + "g." : "") + "\nUse take <item>, take coins, or take all. Store with put <item> in <container>. Type close to leave this view.", { loot: { source: getEntityName(entry.source), kind: entry.kind, location: entry.location, coins: coins, items: groups.map(function (group, index) { return { number: index + 1, name: getItemName(group.item), quantity: group.quantity, slot: group.slot || null }; }) } });
}

function textLootShow(topic) {
    const match = /^contents(?:\s+(?:of\s+)?(.+))?$/.exec(topic);
    if (match) {
        const entries = match[1] ? textLootMatch(match[1], textLootSources(), function (entry) { return entry.label + (entry.kind === "body" ? " body" : " container"); }) : textLootContext() ? [textLootContext()] : textLootSources();
        if (entries.length === 1) return textLootList(entries[0], false);
        return textModeResult("completed", "Use contents <source> to select a container or body. Type show containers for available names.");
    }
    if (topic === "loot" && textLootContext()) return textLootList(textLootContext(), false);
    const sources = textLootSources();
    return textModeResult("completed", "Containers and loot sources:\n" + (sources.length ? sources.map(function (entry, index) { return (index + 1) + ". " + entry.label + (entry.kind === "fixture" ? (entry.source.opened ? " — opened" : " — closed") : entry.kind === "body" ? (entry.source.bodyLooted ? " — searched" : " — unsearched") : ""); }).join("\n") : "None visible.") + "\nUse open <container>, search <body>, or contents <source>.", { lootSources: sources.map(function (entry, index) { return { number: index + 1, name: getEntityName(entry.source), kind: entry.kind, location: entry.location }; }) });
}

// Suppress only the selected loot card while its normal handler runs. Party
// decision controls stay visible; their callbacks can restore the text list.
function textLootMarkPartyView(el) {
    if (!textModeState.enabled || !textLootContext() || !el || !hasPendingPartyLoot()) return;
    textModeState.lootPartyView = { element: el, children: Array.from(el.children) };
}

function textLootClearPartyView() {
    const view = textModeState.lootPartyView;
    if (!view || hasPendingPartyLoot()) return;
    const children = Array.from(view.element.children);
    // Never clear an unrelated panel that has since replaced the choices.
    if (children.length === view.children.length && children.every(function (child, i) { return child === view.children[i]; })) view.element.textContent = "";
    textModeState.lootPartyView = null;
}

function textLootCaptureCard(source, options) {
    if (!textModeState.enabled || G.activeObject) return false;
    const task = textModeState.lootTask, current = textLootContext();
    if (task && task.entry.source === source) {
        if (options && options.message) task.messages.push(options.message);
        return true;
    }
    if (current && current.source === source) { textLootClearPartyView(); textLootList(current); return true; }
    return false;
}

function textLootRun(entry, fn) {
    const previous = textModeState.lootTask;
    const task = { entry: entry, messages: [] };
    textModeState.lootTask = task;
    try { fn(); } finally { textModeState.lootTask = previous; }
    if (task.messages.length) textModeResult("completed", task.messages.join("\n"));
}

function textLootAfter(entry, scene) {
    if (hasPendingPartyLoot()) return "The party needs a loot decision. Use the choices above before continuing; completed transfers are preserved.";
    if (!textModeSameScene(scene)) return "The scene changed while handling loot. Pending commands are paused.";
    return textLootBlock(entry);
}

function textLootOpen(entry) {
    if (entry.kind === "fixture" && !entry.source.opened) textLootRun(entry, function () { openContainerFixture(entry.source); });
    else if (entry.kind === "body" && !entry.source.bodyLooted) textLootRun(entry, function () { searchBodyObject(entry.source); });
    return textLootReady(entry);
}

async function executeTextLootCommand(action) {
    const args = action.args || {};
    textLootClearPartyView();
    if (action.verb === "close") { textModeState.lootContext = null; return textModeResult("completed", "You leave the container/loot view."); }
    const resolved = textLootResolve(action);
    if (resolved.result) return resolved.result;
    const entry = resolved.entry, reason = textLootBlock(entry), scene = textModeScene();
    if (reason) return textModeResult("blocked", reason);
    textLootSelect(entry);
    if (/^(open|search|loot)$/.test(action.verb)) {
        if (!textLootOpen(entry)) return textModeResult("blocked", "The source could not be opened. Check the latest response; locked chests need unlock, pick, or force.");
        const afterOpen = textLootAfter(entry, scene);
        if (afterOpen) return textModeResult("interrupted", afterOpen);
        if (action.verb !== "loot") return textLootList(entry);
        action = Object.assign({}, action, { verb: "take", args: { item: "all" } });
    }
    if (/^(unlock|pick|force)$/.test(action.verb)) {
        if (entry.kind !== "fixture") return textModeResult("blocked", "That action needs a locked fixed chest.");
        ensureChestLock(entry.source, G.activeRoom);
        if (!isChestLocked(entry.source)) return textModeResult("blocked", "That chest is not locked. Use open <chest>.");
        const block = action.verb === "unlock" ? getChestBaseBlockReason(G.activeRoom) : action.verb === "pick" ? getChestPickBlockReason(G.activeRoom) : getChestForceBlockReason(G.activeRoom);
        if (block) return textModeResult("blocked", block);
        if (action.verb === "unlock" && !findKeyForLock(entry.source.chestLock)) return textModeResult("blocked", "You do not have a matching key.");
        textLootRun(entry, function () { if (action.verb === "unlock") useChestKey(entry.source); else if (action.verb === "pick") attemptPickChestLock(entry.source); else forceChest(entry.source); });
        const afterLock = textLootAfter(entry, scene);
        if (afterLock) return textModeResult("interrupted", afterLock);
        return textModeResult(isChestLocked(entry.source) ? "blocked" : "completed", isChestLocked(entry.source) ? "The chest is still locked. Pending commands are paused; another attempt must be explicit." : "The lock is open. Use open <chest> to see its contents.");
    }
    if (action.verb === "contents") return textLootList(entry);
    if (!textLootReady(entry)) return textLootList(entry);
    if (action.verb === "store") return textLootStore(action, entry, scene);
    return textLootTake(action, entry, scene);
}

function textLootTake(action, entry, scene) {
    const args = action.args || {}, key = textCommandNormalize(args.item);
    const groups = textLootEntries(entry);
    if (key === "all" && entry.kind !== "carry") {
        const before = groups.reduce(function (sum, group) { return sum + group.quantity; }, 0), coins = textLootCoins(entry);
        if (!before && !coins) return textModeResult("blocked", "Nothing visible remains to take.");
        textLootRun(entry, function () { if (entry.kind === "fixture") takeAllFromContainer(entry.source); else takeAllBodyLoot(entry.source); });
        const after = textLootAfter(entry, scene);
        if (after) return textModeResult("interrupted", after);
        const left = textLootEntries(entry).reduce(function (sum, group) { return sum + group.quantity; }, 0);
        if (left || textLootCoins(entry)) return textModeResult("blocked", "Some loot remains because it could not be carried. Completed transfers are preserved; pending commands are paused.");
        return textLootList(entry);
    }
    if (/^(coins|coin|gold|money)$/.test(key) && entry.kind !== "carry") {
        if (args.amount) return textModeResult("blocked", "Take coins transfers the source's coin pile through the party rules; omit the quantity.");
        if (!textLootCoins(entry)) return textModeResult("blocked", "There are no coins left here.");
        textLootRun(entry, function () { if (entry.kind === "fixture") takeContainerCoins(entry.source); else takeBodyCoins(entry.source); });
        const after = textLootAfter(entry, scene);
        return after ? textModeResult("interrupted", after) : textLootList(entry);
    }
    if (!key) return textModeResult("blocked", "Name an item, coins, or all. Type contents to see what is available.");
    let matches = action.lootItemRef ? groups.filter(function (group) { const ref = action.lootItemRef; return group.key === ref.key && group.items.length === ref.items.length && group.items.every(function (item) { return ref.items.indexOf(item) >= 0; }); }) : key === "all" ? groups : textLootMatch(args.item, groups, function (group) { return textInventoryItemName(group.item); });
    if (!matches.length) return textModeResult("blocked", "That item changed or is not in this source. Type contents to check names.");
    if (key !== "all" && matches.length > 1) return textModeAsk(action, "lootItem", matches, "Which item do you mean?");
    let moved = 0;
    for (const group of matches) {
        const amount = key === "all" || args.amount === "all" ? group.quantity : args.amount ? Number(args.amount) : 1;
        if (!Number.isSafeInteger(amount) || amount < 1 || amount > group.quantity || amount > 100) return textModeResult("blocked", "Choose an available whole amount from 1 to 100 per item group.");
        if (group.slot && amount !== group.quantity) return textModeResult("blocked", "That worn item must be taken as a whole. Use take all <name> from <body>.");
        for (let count = 0; count < amount;) {
            const block = textLootAfter(entry, scene);
            if (block) return textModeResult("interrupted", block);
            const fresh = textLootEntries(entry).find(function (value) { return value.key === group.key; });
            if (!fresh) return textModeResult("blocked", "The remaining item changed. Completed transfers are preserved.");
            const source = fresh.items[0], wanted = entry.kind === "carry" ? 1 : Math.min(amount - count, getItemQuantity(source));
            let result;
            textLootRun(entry, function () {
                if (entry.kind === "carry") result = getFromContainer(entry.source, source, { result: true });
                else if (entry.kind === "fixture") takeContainerItem(entry.source, ensureContainerContents(entry.source).items.indexOf(source), wanted);
                else if (fresh.slot) takeBodyEquippedItem(entry.source, fresh.slot);
                else takeBodyInventoryItem(entry.source, source, wanted);
            });
            const remaining = textLootEntries(entry).find(function (value) { return value.key === group.key; });
            const done = entry.kind === "carry" ? result.moved : Math.max(0, fresh.quantity - (remaining ? remaining.quantity : 0));
            if (result && result.message) textModeResult("completed", result.message);
            moved += done; count += done;
            const after = textLootAfter(entry, scene);
            if (after) return textModeResult("interrupted", after);
            if (done < wanted) return textModeResult("blocked", "Could not take the full quantity. " + moved + " unit(s) moved; completed transfers are preserved.");
        }
    }
    return textLootList(entry);
}

function textLootStore(action, entry, scene) {
    if (entry.kind === "body") return textModeResult("blocked", "Store items in a container, rather than on a body.");
    const args = action.args || {};
    if (!String(args.item || "").trim() || textCommandNormalize(args.item) === "all") return textModeResult("blocked", "Name the carried item to store, such as put 2 potions in chest.");
    const matches = action.itemRef ? [textInventoryFreshSelection(action.itemRef, "drop")].filter(Boolean) : resolveTextInventoryItems(args.item, "drop").filter(function (value) { return value.location === "carried"; });
    if (!matches.length) return textModeResult("blocked", "That carried item is no longer available. Worn gear must be removed first.");
    if (matches.length > 1) return textModeAsk(action, "item", matches, "Which carried item do you want to store?");
    const selected = matches[0], amount = args.amount === "all" ? selected.quantity : args.amount ? Number(args.amount) : 1;
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > 100 || amount > selected.quantity) return textModeResult("blocked", "Choose an available whole amount from 1 to 100.");
    if (entry.kind === "fixture") {
        textLootRun(entry, function () { storeInContainer(entry.source, selected.key, amount); });
    } else {
        const members = G.player.inventory.filter(function (item) { return getInventoryEntryKey(item) === selected.key; });
        for (let count = 0; count < amount; count++) {
            const block = textLootAfter(entry, scene);
            if (block) return textModeResult("interrupted", block);
            const member = members.find(function (item) { return G.player.inventory.indexOf(item) >= 0 && getContainerContents(entry.source).indexOf(item) < 0; });
            if (!member) return textModeResult("blocked", "The remaining item moved or is already in that container. Completed transfers are preserved.");
            const result = storeInCarryContainer(entry.source, getInventoryEntryKey(member), { result: true });
            textModeResult(result.moved ? "completed" : "blocked", result.message);
            if (!result.moved) return { status: "blocked" };
        }
        refreshInventoryUi();
    }
    const after = textLootAfter(entry, scene);
    return after ? textModeResult("interrupted", after) : textLootList(entry);
}
