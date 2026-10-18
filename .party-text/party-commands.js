function textPartyRelation(value) {
    const text = String(value || ""); let quote = "";
    for (let index = 0; index < text.length; index++) {
        const ch = text[index];
        if (quote) { if (ch === quote && text[index - 1] !== "\\") quote = ""; continue; }
        if (ch === '"' || ch === "'" && (!index || /\s/.test(text[index - 1]))) { quote = ch; continue; }
        const relation = /^\s+(to|on|from)\s+/i.exec(text.slice(index));
        if (relation) return { item: textCommandUnquote(text.slice(0, index)), target: textCommandUnquote(text.slice(index + relation[0].length)), relation: relation[1].toLowerCase() };
    }
    return null;
}

function parseTextPartyCommand(raw) {
    let match = /^(?:party|companions)(?:\s+(.+))?$/i.exec(raw);
    if (match) return { verb: "party", args: { action: match[1] || "" } };
    if (/^(?:keep(?:\s+it)?|keep\s+(?:the\s+)?rest|agree|yield|compromise|stand\s+firm|decide\s+later)$/i.test(raw)) return { verb: "party", args: { action: textCommandNormalize(raw) } };
    match = /^(?:give\s+loot|give)(?:\s+to\s+(.+))$/i.exec(raw);
    if (match) return { verb: "party", args: { action: "give", target: textCommandUnquote(match[1]) } };
    match = /^(?:give|gift)\s+(.+)$/i.exec(raw);
    if (match) { const relation = textPartyRelation(match[1]); return { verb: "give", args: { item: relation ? relation.item : textCommandUnquote(match[1]), target: relation ? relation.target : "" } }; }
    match = /^(?:companion(?:\s+gear)?|equipment|gear)\s+(.+)$/i.exec(raw);
    if (match) return { verb: "companion", args: { target: textCommandUnquote(match[1]) } };
    match = /^(equip(?:\s+best)?|unequip|take|get)\s+(.+)$/i.exec(raw);
    if (match) {
        const relation = textPartyRelation(match[2]);
        if (relation && /^(on|from)$/.test(relation.relation)) {
            // Room/body sources keep their existing loot route. Companion
            // transfers are explicit: take sword from companion <name>.
            if (/^(take|get|unequip)$/.test(match[1]) && !/^companion\s+/i.test(relation.target)) return null;
            return { verb: "companion", args: { action: /^equip/.test(match[1]) ? "equip" : "take", item: relation.item, target: relation.target.replace(/^companion\s+/i, "") } };
        }
    }
    match = /^equip\s+best\s+(?:on|for)\s+(.+)$/i.exec(raw);
    if (match) return { verb: "companion", args: { action: "best", target: textCommandUnquote(match[1]) } };
    if (/^back$/i.test(raw)) return { verb: "back", args: {} };
    if (/^cancel$/i.test(raw)) return { verb: "cancel", args: {} };
    return null;
}

function textPartyRoster() {
    const members = textModeVisibleNPCs().filter(function (npc) { return isCompanionNPC(npc); });
    return textModeResult("completed", "Companions here:\n" + (members.length ? members.map(function (npc, index) { return (index + 1) + ". " + textModeNPCLabel(npc); }).join("\n") : "None visible.") + "\nUse companion <name> to manage gear, show companion <name> to inspect, or give <item> to <name>.", { party: members.map(function (npc, index) { return { number: index + 1, name: textModeNPCLabel(npc) }; }) });
}

function textCompanionInspect(npc) {
    const items = [];
    Object.keys(npc.equipped || {}).forEach(function (slot) { const item = npc.equipped[slot]; if (slot !== "coinPouch" && !Array.isArray(item) && isLootItemVisible(item)) items.push({ name: getItemName(item), quantity: getItemQuantity(item), location: "equipped", slot: slot }); });
    (npc.inventory || []).forEach(function (item) { if (isLootItemVisible(item)) items.push({ name: getItemName(item), quantity: getItemQuantity(item), location: "carried", slot: null }); });
    return textModeResult("completed", textModeNPCLabel(npc) + "'s gear:\n" + (items.length ? items.map(function (item) { return item.name + " ×" + item.quantity + " — " + item.location + (item.slot ? ": " + item.slot : ""); }).join("\n") : "Nothing visible."), { companion: { name: textModeNPCLabel(npc), items: items } });
}

function textPartyShow(topic) {
    if (/^(party|companions)$/.test(topic)) return textPartyRoster();
    if (/^(options|choices)$/.test(topic)) return textSharedOptions();
    const match = /^companion\s+(.+)$/.exec(topic);
    if (!match) return null;
    const members = resolveTextNPCTarget(match[1], textModeVisibleNPCs().filter(isCompanionNPC)).matches;
    return members.length === 1 ? textCompanionInspect(members[0]) : textModeResult("completed", "Use companion <name> to choose a companion. Type show party for names.");
}

function textSharedOptions() {
    const menu = sharedChoiceState.menu;
    const owned = menu && menu.ownsView();
    if (menu && menu.valid()) return showSharedChoiceMenu(menu);
    if (menu) clearSharedChoiceMenu(menu);
    if (typeof hasPendingPartyLoot === "function" && hasPendingPartyLoot()) { renderPartyLootDivision(); return sharedChoiceState.menu ? showSharedChoiceMenu(sharedChoiceState.menu) : textModeResult("blocked", "That loot decision is no longer available."); }
    if (menu && owned && (menu.kind === "companion" || menu.kind === "gift") && G.activeNPC === menu.npc && textModeVisibleNPCs().indexOf(menu.npc) >= 0 && !textModeInCombat()) {
        if (menu.kind === "companion" && isCompanionNPC(menu.npc)) openCompanionGearMenu(menu.npc);
        else if (menu.kind === "gift") openGiveMenu(menu.npc);
        return sharedChoiceState.menu ? { status: "needs_input" } : textModeResult("blocked", "That menu is no longer available.");
    }
    return textModeListOptions();
}

function textSharedChoiceBlock() {
    const menu = sharedChoiceState.menu;
    if (menu && (!menu.ownsView() || menu.scene.player !== G.player || menu.scene.room !== G.activeRoom || menu.scene.npc !== G.activeNPC || menu.scene.mode !== G.activeNPCMode)) clearSharedChoiceMenu(menu);
    if (sharedChoiceState.menu) return "A choice is waiting. Type options, choose <number>, back or cancel before continuing.";
    return "";
}

function textSharedChoiceCanHandle(input, action) {
    const menu = sharedChoiceState.menu;
    if (action && /^(back|cancel)$/.test(action.verb)) return true;
    if (action && action.verb === "options") return !!menu || typeof hasPendingPartyLoot === "function" && hasPendingPartyLoot();
    if (!menu) return false;
    if (action && action.verb === "leave" && /^(companion|gift)$/.test(menu.kind)) return true;
    return !textModeState.pending && (/^\d+$/.test(input) || action && action.verb === "choose" || action && action.verb === "party" && /^loot/.test(menu.kind) && !!action.args.action);
}

async function textRunSharedChoice(menu, choice) {
    textModeState.busy = true;
    textModeState.paused = true;
    textModeState.capture = [];
    try {
        const result = await runSharedChoice(menu, choice);
        for (let index = 0; index < textModeState.capture.length; index++) await textModeState.capture[index];
        if (result.status === "completed" && !sharedChoiceState.menu) textModeResult("completed", "Choice resolved." + (textModeState.queue.length ? " Type continue to resume the remaining commands." : ""));
        return result;
    } finally { textModeState.capture = null; textModeState.busy = false; renderTextModeStatus(); focusTextModeInput(); }
}

async function textSharedChoiceInput(input, action) {
    const menu = sharedChoiceState.menu;
    if (action && action.verb === "options" && (menu || typeof hasPendingPartyLoot === "function" && hasPendingPartyLoot())) { textSharedOptions(); return true; }
    if (action && action.verb === "leave" && menu && /^(companion|gift)$/.test(menu.kind)) {
        const back = menu.options.find(function (option) { return option.meta.action === "back"; });
        if (back) await textRunSharedChoice(menu, back);
        return false;
    }
    if (action && /^(back|cancel)$/.test(action.verb)) {
        if (!menu) { if (action.verb === "cancel") { stopTextCommands(true); return true; } return false; }
        const choice = menu.options.find(function (option) { return option.meta.action === "back" || menu.kind === "loot-vote" && option.meta.action === "later"; });
        if (action.verb === "cancel") stopTextCommands(false);
        if (!choice) { textModeResult("blocked", "Pending commands can be cancelled, but this loot decision still needs an answer. Type options to review it."); return true; }
        await textRunSharedChoice(menu, choice); return true;
    }
    if (!menu || textModeState.pending) return false;
    if (/^\d+$/.test(input) || action && action.verb === "choose") {
        const number = Number(action && action.verb === "choose" ? action.args.number : input);
        const choice = Number.isSafeInteger(number) && number > 0 ? menu.options[number - 1] : null;
        await textRunSharedChoice(menu, choice); return true;
    }
    if (action && action.verb === "party" && /^loot/.test(menu.kind) && action.args.action) {
        const key = textCommandNormalize(action.args.action), map = { keep: "keep", "keep it": "keep", "keep rest": "rest", "keep the rest": "rest", agree: "agreeable", yield: "agreeable", compromise: "compromise", "stand firm": "aggressive", "decide later": "later", "round robin": "round_robin", class: "class", "class based": "class", leader: "leader", "leader distributes": "leader" };
        let choices = menu.options.filter(function (choice) { return choice.meta.action === (map[key] || key); });
        if (key === "give") {
            const target = resolveTextNPCTarget(action.args.target, getLootMembersInRoom(G.activeRoom)).matches;
            choices = choices.filter(function (choice) { return target.indexOf(choice.meta.target) >= 0; });
        }
        if (choices.length !== 1) { textModeResult("blocked", "Use choose <number> from options to answer this decision unambiguously."); return true; }
        await textRunSharedChoice(menu, choices[0]); return true;
    }
    return false;
}

async function executeTextPartyCommand(action) {
    const args = action.args || {};
    if (action.verb === "party") return args.action ? textModeResult("blocked", "That decision is not currently available. Type options or show party.") : textPartyRoster();
    const members = textModeVisibleNPCs().filter(function (npc) { return action.verb === "give" || isCompanionNPC(npc); });
    const targets = action.targetRef ? members.filter(function (npc) { return npc === action.targetRef; }) : args.target ? resolveTextNPCTarget(args.target, members).matches : G.activeNPC && members.indexOf(G.activeNPC) >= 0 ? [G.activeNPC] : members;
    if (!targets.length) return textModeResult("blocked", "No available NPC/companion matches. Type show party or who is here.");
    if (targets.length > 1) return textModeAsk(action, "target", targets, "Who do you mean?");
    const npc = targets[0]; action.targetRef = npc;
    if (G.activeNPC && G.activeNPC !== npc) return textModeResult("blocked", "Type leave before switching to another NPC.");
    if (roomHasActiveHostile(G.activeRoom) || isRoomCollapsed(G.activeRoom)) return textModeResult("blocked", "Too dangerous to exchange items here.");
    if (G.activeNPC && !/^(menu|talk|respond|give)$/.test(G.activeNPCMode)) return textModeResult("blocked", "Finish the current NPC interaction first.");
    if (action.verb === "give") {
        if (!args.item) { if (!G.activeNPC) selectNPC(npc); openGiveMenu(npc); return { status: "needs_input" }; }
        if (/^(?:all|\d+)\s+/i.test(args.item)) return textModeResult("blocked", "Give transfers one item at a time. Name the carried item without a quantity.");
        const items = action.itemRef ? [textInventoryFreshSelection(action.itemRef, "drop")].filter(Boolean) : resolveTextInventoryItems(args.item, "drop").filter(function (entry) { return entry.location === "carried"; });
        if (!items.length) return textModeResult("blocked", "No matching carried item remains. Unequip worn items first.");
        if (items.length > 1) return textModeAsk(action, "item", items, "Which carried item do you want to give?");
        if (!G.activeNPC) selectNPC(npc);
        if (G.activeNPC !== npc || G.activeNPCMode === "combat") return textModeResult("interrupted", "The NPC interaction changed.");
        const result = await giveItemToNPC(npc, items[0].key);
        if (!result) return textModeResult("needs_input", "The gift needs another choice in its normal controls. Pending commands are paused.");
        if (result.status !== "completed") return textModeResult(result.status, result.message || "The gift could not finish. Pending commands are paused.");
        publishTextModeOutput("gift", result.accepted ? "Gift accepted." : "Gift refused.", { gift: { target: textModeNPCLabel(npc), name: getItemName(items[0].item), accepted: !!result.accepted } }, false);
        return result.accepted ? { status: "completed" } : textModeResult("blocked", "The gift was refused; you keep it. Pending commands are paused.");
    }
    if (!G.activeNPC) selectNPC(npc);
    if (G.activeNPC !== npc || !isCompanionNPC(npc) || G.activeNPCMode === "combat") return textModeResult("interrupted", "That companion is no longer available.");
    openCompanionGearMenu(npc);
    const menu = sharedChoiceState.menu;
    if (!args.action) return { status: "needs_input" };
    const key = args.action === "best" ? "best" : args.action;
    let choices = menu ? menu.options.filter(function (choice) { return choice.meta.action === key; }) : [];
    if (args.item) choices = textLootMatch(args.item, choices, function (choice) { return choice.meta.item ? getItemName(choice.meta.item) : ""; });
    if (choices.length !== 1) return textModeResult("needs_input", "Choose the exact gear action by number from the menu above.");
    const result = await runSharedChoice(menu, choices[0]);
    return result.status === "completed" ? { status: "needs_input" } : result;
}
