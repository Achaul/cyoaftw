function parseTextEnchanterCommand(raw) {
    // Wizard/combat enchantment abilities retain their existing parsing.
    if (textModeInCombat()) return null;
    if (/^(?:enchanter|enchanting)(?:\s+services)?$/i.test(raw)) return { verb: "enchanter", args: { action: "services", target: "" } };
    const match = /^(enchant|duplicate|duplication|copy item)(?:\s+(.+))?$/i.exec(raw);
    if (!match) return null;
    return { verb: "enchanter", args: { action: match[1].toLowerCase() === "enchant" ? "enchant" : "duplicate", target: textCommandUnquote(match[2] || "") } };
}

function textEnchanterShow(topic) {
    if (!/^(enchanter|enchanter services|enchanting|duplication|duplicate)$/.test(topic)) return null;
    const npc = G.activeNPC, block = enchanterServiceBlock(npc);
    if (block) return textModeResult("completed", block + " Type how enchanter for examples.");
    const actions = /^(duplication|duplicate)$/.test(topic) ? ["duplicate"] : topic === "enchanting" ? ["enchant"] : ["enchant", "duplicate"];
    const rows = [];
    actions.forEach(function (action) { getEnchanterItems(action).forEach(function (item) {
        const spec = enchanterActionSpec(action, npc, item);
        rows.push({ action: action, name: spec.item, quantity: spec.quantity, fee: spec.fee, turns: 0, successChance: spec.successChance, blockedReason: spec.reason });
    }); });
    return textModeResult("completed", "Enchanter services (no story turn; fees are spent even on failure):\n" + (rows.length ? rows.map(function (row) { return row.action + " " + row.name + " ×" + row.quantity + ": " + row.fee + "g, " + Math.round(row.successChance * 100) + "% success" + (row.blockedReason ? " — unavailable: " + row.blockedReason : ""); }).join("\n") : "No eligible visible items.") + "\nUse enchanter for choices, enchant <weapon> or duplicate <item> to review costs.", { service: { view: "enchanter", items: rows } });
}

async function executeTextEnchanterCommand(action) {
    const npc = G.activeNPC, block = enchanterServiceBlock(npc);
    if (block) return textModeResult("blocked", block);
    const args = action.args || {}, verb = args.action || "services", target = args.target || "";
    let menu = sharedChoiceState.menu;
    if (menu && /^enchanter-/.test(menu.kind)) {
        if (!menu.valid()) return textModeResult("blocked", "That service choice changed. Type options to refresh.");
        if (verb === "services") return showSharedChoiceMenu(menu);
        if (menu.kind === "enchanter-confirm") return textModeResult("needs_input", "Review the costs and use choose <number> to confirm, or back/cancel. A plan cannot approve a fee.");
    }
    if (!/^(services|enchant|duplicate)$/.test(verb)) return textModeResult("blocked", "That service is unavailable. Type how enchanter.");
    const opened = enchanterMenu(npc, verb);
    if (opened.status !== "needs_input" || !target || /^(?:a |an |the )?(?:weapon|item)$/i.test(target)) return opened;
    menu = sharedChoiceState.menu;
    const options = menu.options.filter(function (choice) { return choice.meta.action === verb; });
    const exact = options.filter(function (choice) { return textCommandNormalize(choice.meta.name) === textCommandNormalize(target); });
    const matches = exact.length ? exact : textLootMatch(target, options, function (choice) { return choice.meta.name; });
    if (matches.length !== 1) return textModeResult("needs_input", "Choose the exact item by number. Nothing has been charged.");
    const result = await runSharedChoice(menu, matches[0]);
    return result.status === "completed" && sharedChoiceState.menu ? { status: "needs_input" } : result;
}

async function textEnchanterMenuInput(menu, action, input) {
    if (splitTextCommands(input || "").parts?.length > 1) return textModeResult("needs_input", "Answer one service menu step at a time. Leave the menu before starting a new batch.");
    if (action.verb === "leave") {
        clearSharedChoiceMenu(menu);
        if (G.player !== menu.scene.player || G.activeRoom !== menu.scene.room || G.activeNPC !== menu.npc) return textModeResult("blocked", "That service scene ended.");
        G.activeNPCMode = "menu"; renderNPCActionMenu(menu.npc); return { status: "completed" };
    }
    textModeState.busy = true; textModeState.paused = true; textModeState.capture = [];
    try {
        const result = await executeTextEnchanterCommand(action);
        for (let i = 0; i < textModeState.capture.length; i++) await textModeState.capture[i];
        return result;
    } finally {
        textModeState.capture = null; textModeState.busy = false; renderTextModeStatus(); focusTextModeInput();
    }
}
