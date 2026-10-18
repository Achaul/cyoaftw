function parseTextTailorCommand(raw) {
    if (textModeInCombat()) return null;
    const contextual = G.activeNPC && G.activeNPC.role === "Clothier";
    let text = raw, explicit = /^(?:tailor|tailoring|clothier)(?:\s+(.+))?$/i.exec(raw);
    if (explicit) {
        if (!explicit[1] || /^services$/i.test(explicit[1])) return { verb: "tailor", args: { action: "services", target: "" } };
        text = explicit[1];
    }
    let match = /^(alter|alteration|reinforce)(?:\s+(.+))?$/i.exec(text);
    if (!match && (contextual || explicit)) match = /^(repair|mend)(?:\s+(.+))?$/i.exec(text);
    if (match) return { verb: "tailor", args: { action: /^(alter|alteration)$/i.test(match[1]) ? "alteration" : /^mend$/i.test(match[1]) ? "repair" : match[1].toLowerCase(), target: textCommandUnquote(match[2] || "") } };
    match = /^(?:add pockets|patch pockets|pockets)(?:\s+(?:to\s+)?(.+))?$/i.exec(text);
    if (match) return { verb: "tailor", args: { action: "pockets", target: textCommandUnquote(match[1] || "") } };
    if (/^collect\s+(?:tailoring|clothier|finished work)$/i.test(text) || explicit && /^collect$/i.test(text)) return { verb: "tailor", args: { action: "collect", target: "" } };
    if (contextual || explicit) {
        match = /^(offer|request|describe)(?:\s+(.+))?$/i.exec(text);
        if (match && !/^at\b/i.test(match[2] || "")) return { verb: "tailor", args: { action: /^(request|describe)$/i.test(match[1]) ? "request" : "offer", target: textCommandUnquote(match[2] || "") } };
        if (/^(?:quote|ask for (?:a )?quote)$/i.test(text)) return { verb: "tailor", args: { action: "quote", target: "" } };
    }
    return null;
}

function textTailorShow(topic) {
    if (!/^(tailor|tailoring|clothier|tailoring materials)$/.test(topic)) return null;
    const npc = G.activeNPC, block = tailorServiceBlock(npc);
    if (block) return textModeResult("completed", block + " Type how tailor for examples.");
    const job = G.player.clothierJob;
    if (topic === "tailoring materials") {
        const draft = sharedChoiceState.menu?.tailorDraft || { service: "alteration", item: null };
        const rows = tailorOfferItems(draft).map(function (item) { return { name: getItemName(item), quantity: getItemQuantity(item), dye: isPigmentItem(item) }; });
        return textModeResult("completed", "Available tailoring offers:\n" + (rows.length ? rows.map(function (row) { return row.name + " ×" + row.quantity + (row.dye ? " (dye)" : ""); }).join("\n") : "None.") + "\nSelect a garment, then offer <quantity> <name>.", { service: { view: "tailoring-materials", items: rows } });
    }
    const garments = getClothierGarments().map(function (item) { return { name: getItemName(item), actions: Object.keys(CLOTHIER_SERVICES).map(function (action) { return { action: action, blockedReason: job ? "Collect the existing job first." : getClothierServiceBlock(item, action) }; }) }; });
    const packs = getClothierRucksacks().map(function (item) { return { name: getItemName(item), capacity: item.container.maxUnitCapacity, blockedReason: getClothierPocketBlock(npc, item) }; });
    return textModeResult("completed", "Tailoring: repair, alteration, reinforce, pockets, collect.\n" + (garments.length ? garments.map(function (row) { return row.name + ": " + row.actions.map(function (action) { return action.action + (action.blockedReason ? " (" + action.blockedReason + ")" : ""); }).join(", "); }).join("\n") : "No visible garments.") + (job ? "\n" + job.itemName + ": " + (job.turnsLeft > 0 ? job.turnsLeft + " turns remaining" : "ready; collect tailoring") : "") + "\nPockets: 75g and one turn, +3 slots per bag/clothier pair. Use tailor for choices.", { service: { view: "tailoring", garments: garments, packs: packs, job: job ? { name: job.itemName, action: job.service, turnsLeft: job.turnsLeft } : null } });
}

async function selectTailorChoice(menu, action, target) {
    const options = menu.options.filter(function (choice) { return choice.meta.action === action; });
    const exact = target ? options.filter(function (choice) { return textCommandNormalize(choice.meta.name) === textCommandNormalize(target); }) : [];
    const matches = exact.length ? exact : target ? textLootMatch(target, options, function (choice) { return choice.meta.name; }) : options;
    if (matches.length !== 1) return textModeResult("needs_input", "Choose the exact tailoring option by number. No materials or fees were taken.");
    const result = await runSharedChoice(menu, matches[0]);
    return result.status === "completed" && sharedChoiceState.menu ? { status: "needs_input" } : result;
}

async function executeTextTailorCommand(action) {
    const npc = G.activeNPC, block = tailorServiceBlock(npc);
    if (block) return textModeResult("blocked", block);
    const args = action.args || {}, verb = args.action || "services", target = args.target || "";
    let menu = sharedChoiceState.menu;
    if (menu && /^tailor-/.test(menu.kind)) {
        if (!menu.valid()) return textModeResult("blocked", "The tailoring choice changed. Type options to refresh.");
        if (verb === "services") return showSharedChoiceMenu(menu);
        if (/^tailor-(quote|pocket-quote)$/.test(menu.kind)) return textModeResult("needs_input", "Review the quote and explicitly choose its acceptance number, or back/cancel. A plan cannot accept fees.");
    }
    if (/^(repair|alteration|reinforce)$/.test(verb)) {
        if (G.player.clothierJob) return textModeResult("blocked", "Collect the current tailoring job first.");
        const opened = tailorMenu(npc, "garments", verb);
        if (opened.status !== "needs_input" || !target) return opened;
        return selectTailorChoice(sharedChoiceState.menu, "item", target);
    }
    if (verb === "pockets") {
        const opened = tailorMenu(npc, "pockets");
        return opened.status !== "needs_input" || !target ? opened : selectTailorChoice(sharedChoiceState.menu, "pockets", target);
    }
    if (verb === "collect") { G.activeNPCMode = "clothier"; return await collectClothierJob(npc); }
    if (/^(request|offer|quote)$/.test(verb)) {
        const draft = menu && menu.tailorDraft;
        if (!draft) return textModeResult("blocked", "Select a garment and tailoring service first.");
        if (verb === "request") {
            if (!target.trim() || target.length > 1200) return textModeResult("blocked", "Describe the work in 1–1200 characters.");
            draft.request = target.trim(); return openTailorRequest(npc, draft.item, draft.service, draft);
        }
        if (verb === "quote") return await askTailorQuote(draft);
        const match = /^(\d+)\s+(.+)$/.exec(target), quantity = match ? Number(match[1]) : 1, query = match ? textCommandUnquote(match[2]) : target;
        if (!Number.isSafeInteger(quantity) || quantity < 0) return textModeResult("blocked", "Offer a whole nonnegative quantity.");
        const opened = tailorMenu(npc, "offers", draft.service, draft.item, draft, quantity);
        return opened.status !== "needs_input" || !query ? opened : selectTailorChoice(sharedChoiceState.menu, "offer", query);
    }
    if (verb === "services") return tailorMenu(npc, "services");
    return textModeResult("blocked", "That tailoring action is unavailable. Type how tailor.");
}

async function textTailorMenuInput(menu, action, input) {
    if (splitTextCommands(input || "").parts?.length > 1) return textModeResult("needs_input", "Answer one tailoring menu step at a time. Quote request text containing and/then. Leave the menu before starting a new batch.");
    if (action.verb === "leave") {
        clearSharedChoiceMenu(menu); clothierQuoteSequence++; clothierPendingQuote = null;
        if (G.player !== menu.scene.player || G.activeRoom !== menu.scene.room || G.activeNPC !== menu.npc) return textModeResult("blocked", "That tailoring scene ended.");
        G.activeNPCMode = "menu"; renderNPCActionMenu(menu.npc); return { status: "completed" };
    }
    textModeState.busy = true; textModeState.paused = true; textModeState.capture = [];
    try {
        const result = await executeTextTailorCommand(action);
        for (let i = 0; i < textModeState.capture.length; i++) await textModeState.capture[i];
        return result;
    } finally { textModeState.capture = null; textModeState.busy = false; renderTextModeStatus(); focusTextModeInput(); }
}
