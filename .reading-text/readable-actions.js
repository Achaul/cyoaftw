// Shared native/button/text descriptors for written inventory materials.
const activeReadableRequests = new WeakMap();
function readableItemKeywords(item) {
    if (!isReadableGameItem(item)) return "";
    if ((item.type || []).some(function (type) { return /^(book|spellbook|primer|deity-tome)$/.test(type); })) return " book";
    if ((item.type || []).some(function (type) { return /^(scroll|spell-scroll)$/.test(type); })) return " scroll";
    return " note";
}
function isReadableGameItem(item) {
    return !!item && ((item.type || []).some(function (type) { return /^(book|spellbook|primer|deity-tome|lore|scroll|spell-scroll|note|letter|journal)$/.test(type); }) || !!item.primerClass || !!item.poisonRecipeKey);
}

function readableActionBlock() {
    const player = G.player, room = G.activeRoom;
    if (!player || !room || player.dead || player.hp <= 0 || player.unconscious || player._dying || player._collapsing) return "You cannot read or study right now.";
    if (G.activeNPC || G.activeObject || G.activeItemModal) return "Finish the current interaction first; leave conversations before reading or studying.";
    if (G.combatEncounter || roomHasActiveHostile(room) || isRoomCollapsed(room) || hasPendingPartyLoot()) return "Find a safe moment and finish pending decisions before reading or studying.";
    return "";
}

function readableItemStamp(item) {
    return JSON.stringify([choiceItemStamp(item), item.type, item.spells, item.spellId, item.copyProgress, item.primerClass, item.poisonRecipeKey, item.deityId, item.description, item.generatedContent, item.generatedTopic, item.generatedDeityId]);
}

function captureReadableRequest(entry) {
    const player = G.player, room = G.activeRoom, npc = G.activeNPC, mode = G.activeNPCMode, modal = G.activeItemModal, object = G.activeObject;
    let inventory = choiceEntitySnapshot(player), consumed = false, itemStamp = readableItemStamp(entry.item);
    const books = (player.inventory || []).filter(isSpellbookItem).map(function (book) { return { book: book, stamp: readableItemStamp(book) }; });
    const training = JSON.stringify([player.classSkills, player.classBranches]);
    const context = { textPresentation: typeof textModeState !== "undefined" && textModeState.enabled, interrupted: false, running: false,
        sameScene: function () { return G.player === player && G.activeRoom === room && G.activeNPC === npc && G.activeNPCMode === mode && G.activeItemModal === modal && G.activeObject === object; },
        valid: function () {
            return context.sameScene() && !readableActionBlock() && (!context.running || activeReadableRequests.get(player) === context) && inventory() &&
                (consumed || (player.inventory || []).indexOf(entry.item) >= 0 && isLootItemVisible(entry.item) && readableItemStamp(entry.item) === itemStamp) &&
                books.every(function (record) { return player.inventory.indexOf(record.book) >= 0 && readableItemStamp(record.book) === record.stamp; }) && JSON.stringify([player.classSkills, player.classBranches]) === training;
        },
        consumed: function () { consumed = true; inventory = choiceEntitySnapshot(player); },
        contentGenerated: function () { itemStamp = readableItemStamp(entry.item); }
    };
    return context;
}

function readableActions(entry) {
    const item = entry.item, player = G.player, actions = [];
    if (!isReadableGameItem(item) || !isLootItemVisible(item)) return actions;
    const base = entry.location && entry.location !== "carried" ? "Take this item into your inventory first." : readableActionBlock();
    const add = function (id, label, reason, run, ability) { actions.push({ id: id, label: label, reason: base || reason || "", run: run, ability: ability || "" }); };
    add("read", "Read" + (isDeityTomeItem(item) ? " (uses one tome; grants deity knowledge)" : ""), "", async function (context) {
        if (isDeityTomeItem(item)) return readInventoryEntry(entry.key);
        if (isGenericLoreItem(item)) return readLoreNoteEntry(entry.key, context);
        if (isSpellbookItem(item)) return describeSpellbookText(player, item);
        if (isSpellScrollItem(item)) { const spell = WIZARD_SPELLS[item.spellId]; return getItemName(item) + "\n" + spell.summary + "\nCopy progress: " + (item.copyProgress || 0) + "%. Use copy <scroll> for one sitting."; }
        if (isPoisonRecipeNote(item)) { const recipe = POISON_RECIPES[item.poisonRecipeKey]; return recipe.name + ": " + (item.description || "Study this note to learn its recipe."); }
        return item.description || "There is no authored passage in this item. Study actions, if available, are listed separately.";
    });
    if (isClassPrimerItem(item)) add("study", "Study primer (" + CLASS_PRIMER_TURNS + " turns; uses one book)", getPrimerBlockReason(item), function (context) { return studyClassPrimer(entry.key, context); });
    if ((isSpellbookItem(item) || isSpellScrollItem(item)) && getClassSkillRank(player, "wizard") < 1) add("study", "Study arcane basics (" + CLASS_STUDY_TURNS + " turns)", getArcaneStudyBlockReason(player, item), function (context) { return studyArcaneText(item, context); });
    if (isSpellScrollItem(item)) add("copy", "Copy to spellbook (" + SPELL_COPY_TURNS_PER_SITTING + " turns; scroll consumed when complete)", getScrollCopyBlockReason(player, item), function (context) { return copyScrollToSpellbook(item, context); });
    if (isSpellbookItem(item)) (item.spells || []).filter(function (id) { return WIZARD_SPELLS[id] && !isSpellLearned(player, id); }).forEach(function (id) {
        add("learn", "Learn " + WIZARD_SPELLS[id].name + " (" + WIZARD_LEARN_FROM_BOOK_TURNS + " turns)", describeSpellLearnBlock(player, id), function (context) { return learnSpellFromBook(id, context); }, id);
    });
    if (isPoisonRecipeNote(item)) {
        const recipe = POISON_RECIPES[item.poisonRecipeKey];
        add("study", "Study recipe (1 turn; uses one note)", ensurePoisonKnowledge(player)[recipe.id] ? "You already know this recipe." : "", function () { studyPoisonRecipeNote(item); return "Recipe learned: " + recipe.name + ". The note was consumed."; });
    }
    return actions;
}

async function runReadableItemAction(entry, id, ability) {
    const player = G.player;
    if (activeReadableRequests.has(player)) return { status: "blocked", message: "Another reading or study action is still finishing." };
    const fresh = textInventoryFreshSelection(entry, "examine");
    if (!fresh || fresh.location !== "carried") return { status: "blocked", message: "That readable item moved, changed or became hidden. Select it again." };
    const action = readableActions(fresh).find(function (candidate) { return candidate.id === id && candidate.ability === (ability || ""); });
    if (!action || action.reason) return { status: "blocked", message: action && action.reason || "That reading action is unavailable." };
    const context = captureReadableRequest(fresh), name = getItemName(fresh.item), turn = getCurrentStoryTurn();
    context.running = true; activeReadableRequests.set(player, context);
    try {
        if (!context.valid()) return { status: "interrupted", message: "The reading context changed. Select the item again." };
        const line = await action.run(context);
        if (!line || context.interrupted || !context.sameScene()) return { status: "interrupted", message: context.interrupted ? String(line) : "The scene or readable item changed while waiting. No delayed reading result was applied to the new scene." };
        const text = String(line);
        saveGameState();
        const details = { reading: { title: name, text: text, action: id, ability: ability || null, turns: getCurrentStoryTurn() - turn, consumed: player.inventory.indexOf(fresh.item) < 0 } };
        if (context.textPresentation) {
            if (textModeState.enabled) publishTextModeOutput("reading", text, details, !isPoisonRecipeNote(fresh.item));
            refreshInventoryUi();
        } else if (!textModeState.enabled) {
            refreshInventoryUi(id === "read" ? undefined : text);
            if (id === "read") showReadingModal(name, text, { onClose: dismissItemModal });
        }
        return { status: "completed", reading: details.reading };
    } finally { if (activeReadableRequests.get(player) === context) activeReadableRequests.delete(player); }
}

function appendReadableInventoryActions(entry, parent) {
    const ref = { ...entry, location: "carried", list: G.player.inventory, quantity: entry.totalQuantity };
    const actor = G.player, actions = readableActions(ref), owner = captureReadableRequest(ref);
    actions.forEach(function (action) {
        const button = createEquipmentActionButton(action.label, async function () {
            if (!owner.valid()) { if (owner.sameScene()) refreshInventoryUi("That reading action changed. Select it again."); return; }
            const typed = textModeState.enabled;
            if (typed && (textModeState.busy || textModeState.parsing)) return;
            button.disabled = true;
            if (typed) { textModeState.busy = true; textModeState.paused = true; textModeState.capture = []; }
            try {
                const result = await runReadableItemAction(ref, action.id, action.ability);
                if (typed) { for (let index = 0; index < textModeState.capture.length; index++) await textModeState.capture[index]; }
                if (result.status !== "completed") { if (typed) textModeResult(result.status, result.message); else if (owner.sameScene() && G.player === actor) refreshInventoryUi(result.message); }
            } finally {
                button.disabled = !!action.reason;
                if (typed) { textModeState.capture = null; textModeState.busy = false; renderTextModeStatus(); focusTextModeInput(); }
            }
        }, { disabled: !!action.reason });
        button.title = action.reason || action.label; parent.appendChild(button);
    });
}

function describeReadableActions(entry) {
    if (!isReadableGameItem(entry.item)) return "";
    const actions = readableActions(entry);
    return "\nReading actions:\n" + actions.map(function (action) { return action.label + (action.reason ? " — unavailable: " + action.reason : "") + ". Command: " + (action.id === "learn" ? "learn " + WIZARD_SPELLS[action.ability].name + " from " : action.id + " ") + getItemName(entry.item); }).join("\n");
}
