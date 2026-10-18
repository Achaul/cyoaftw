const readCommandDefinition = TEXT_COMMANDS.find(function (definition) { return definition.id === "read"; });
readCommandDefinition.example = "read note; read spellbook; read wall tallies; read fixture notice board";
readCommandDefinition.description = "Read a carried book, scroll, note or tome, or visible room writing. Look at <item> inspects and lists actions without consuming it. Deity tomes use one item and grant their normal knowledge/faith; generic lore is cached after its first read. Use study <item>, copy <scroll>, or learn <spell> from <book> for training. Item/fixture conflicts need carried/fixture qualifiers.";

function textReadingVerbAvailable(verb) {
    if (readableActionBlock()) return false;
    if (textInventoryCandidates().some(function (entry) { return entry.location === "carried" && isReadableGameItem(entry.item) && readableActions(entry).some(function (action) { return !action.reason && (action.id === verb || verb === "study" && /^(copy|learn)$/.test(action.id)); }); })) return true;
    return verb === "read" && textExplorationFixtures().some(function (entry) { return entry.fixture.id === "job-board" || textFixtureActions(entry.fixture).some(function (action) { return action.id === "read" && !action.reason; }); });
}

function parseTextReadingCommand(raw) {
    let match = /^look\s+at\s+(.+)$/i.exec(raw);
    if (match) return { verb: "examine", args: { item: textCommandUnquote(match[1]) } };
    match = /^(?:readables|readable items)$/i.exec(raw);
    if (match) return { verb: "readables", args: {} };
    match = /^(read|study|copy)(?:\s+(.+))?$/i.exec(raw);
    if (match) return { verb: match[1].toLowerCase(), args: { item: textCommandUnquote((match[2] || "").replace(/\s+(?:in)?to\s+(?:my\s+)?(?:spellbook|spell book)$/i, "")) } };
    match = /^learn\s+(.+)$/i.exec(raw);
    if (match) { const relation = textLootRelation(match[1], ["from"]); return { verb: "learn", args: { ability: textCommandUnquote(relation ? relation.item : match[1]), item: relation ? relation.source : "" } }; }
    return null;
}

function textReadingShow(topic) {
    if (!/^(readables|readable items|readable|books|reading|study|studying)$/.test(topic)) return null;
    const entries = textInventoryCandidates().filter(function (entry) { return isReadableGameItem(entry.item); });
    return textModeResult("completed", "Readable items:\n" + (entries.length ? entries.map(function (entry, index) { return (index + 1) + ". " + entry.label + describeReadableActions(entry); }).join("\n") : "None visible.") + "\nUse look at <item> to inspect, read <item> for its text, or study <item>. Take floor items first.", { readables: entries.map(function (entry, index) { return { number: index + 1, name: getItemName(entry.item), location: entry.location, actions: readableActions(entry).map(function (action) { return { verb: action.id, ability: action.ability || null, label: action.label, blockedReason: action.reason }; }) }; }) });
}

function openTextReadingMenu(entry) {
    const fresh = textInventoryFreshSelection(entry, "examine"), block = readableActionBlock();
    if (!fresh || fresh.location !== "carried" || block) return textModeResult("blocked", block || "That readable item is no longer carried. Repeat the command.");
    const actions = readableActions(fresh), context = captureReadableRequest(fresh);
    const menu = beginSharedChoiceMenu("reading", null, "Read or study: " + getItemName(fresh.item), function () { openTextReadingMenu(fresh); });
    const valid = menu.valid; menu.valid = function () { return valid() && context.valid(); }; menu.readingEntry = fresh;
    const el = document.getElementById("chatOptionsEl"); if (!el) return textModeResult("blocked", "Reading choices are unavailable.");
    el.innerHTML = "";
    actions.forEach(function (action) { el.appendChild(createSharedChoiceButton(menu, action.label, function () { return runReadableItemAction(fresh, action.id, action.ability); }, { disabled: !!action.reason, title: action.reason, textChoice: { action: action.id, ability: action.ability } })); });
    el.appendChild(createSharedChoiceButton(menu, "Back", function () { returnToRoomView(); }, { textChoice: { action: "back" } }));
    publishSharedChoiceMenu(menu, el); return { status: "needs_input" };
}

function readingChoiceMatches(menu, action) {
    const args = action.args || {};
    if (args.item && !textLootMatch(args.item, [menu.readingEntry], function (entry) { return getItemName(entry.item) + readableItemKeywords(entry.item); }).length) return [];
    let choices = menu.options.filter(function (choice) { return choice.meta.action === action.verb; });
    if (action.verb === "study" && !choices.length) choices = menu.options.filter(function (choice) { return choice.meta.action === "copy" || choice.meta.action === "learn"; });
    if (args.ability) choices = choices.filter(function (choice) { const id = choice.meta.ability; return id && (textCommandNormalize(WIZARD_SPELLS[id].name) === textCommandNormalize(args.ability) || id === args.ability); });
    return choices;
}

async function selectTextReadingChoice(menu, action) {
    const choices = readingChoiceMatches(menu, action);
    if (choices.length !== 1) return textModeResult("needs_input", "Choose the exact reading or study action from options. Nothing has been read, consumed or learned.");
    return textRunSharedChoice(menu, choices[0]);
}

async function executeTextReadingCommand(action) {
    if (action.verb === "readables") return textReadingShow("readables");
    const args = action.args || {}, selector = args.item || args.fixture || "";
    const items = action.itemRef ? [textInventoryFreshSelection(action.itemRef, "examine")].filter(Boolean) : resolveTextInventoryItems(selector, "examine").filter(function (entry) { return isReadableGameItem(entry.item); });
    const fixtures = action.verb === "read" ? textLootMatch(selector, textExplorationFixtures(), function (entry) { return entry.label; }) : [];
    if (items.length && fixtures.length && !action.itemRef && !/\b(carried|inventory|floor|equipped|worn)\b/i.test(selector)) return textModeResult("blocked", "That name matches an item and a fixture. Use read carried <item> or read fixture <name>.");
    if (action.verb === "read" && (/^fixture\s+/i.test(selector) || !items.length && fixtures.length || args.fixture && !args.item)) return executeTextExplorationCommand({ verb: "read", args: { fixture: selector.replace(/^fixture\s+/i, "") }, fixtureRef: action.fixtureRef });
    const block = readableActionBlock(); if (block) return textModeResult("blocked", block);
    if (!items.length) return textModeResult("blocked", "No readable item matches. Type show readable items for names. Use read fixture <name> for room writing.");
    if (items.length > 1) return textModeAsk(action, "item", items, "Which readable item do you mean?");
    const entry = items[0]; if (entry.location !== "carried") return textModeResult("blocked", "Take that item into your inventory before reading or studying it.");
    const actions = readableActions(entry);
    let matches = actions.filter(function (candidate) { return candidate.id === action.verb; });
    if (action.verb === "study" && !matches.length) matches = actions.filter(function (candidate) { return candidate.id === "copy" || candidate.id === "learn"; });
    if (args.ability) matches = matches.filter(function (candidate) { return candidate.ability && (textCommandNormalize(WIZARD_SPELLS[candidate.ability].name) === textCommandNormalize(args.ability) || candidate.ability === args.ability); });
    if (matches.length > 1 || !selector && action.verb !== "read") return openTextReadingMenu(entry);
    if (!matches.length) return textModeResult("blocked", "That action is unavailable on this item." + describeReadableActions(entry));
    if (matches[0].reason) return textModeResult("blocked", matches[0].reason);
    const result = await runReadableItemAction(entry, matches[0].id, matches[0].ability);
    return result.status === "completed" ? result : textModeResult(result.status, result.message);
}
