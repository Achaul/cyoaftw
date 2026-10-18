function parseTextForgeCommand(raw) {
    if (textModeInCombat() && textCombatActions().some(function (action) { return textCombatActionMatches(action, raw); })) return null;
    if (/^(?:forge|smith|blacksmith)(?:\s+services)?$/i.test(raw)) return { verb: "forge", args: { action: "services", target: "" } };
    if (/^collect\s+(?:forge|reforged)(?:\s+(?:armour|armor|item))?$/i.test(raw)) return { verb: "forge", args: { action: "collect", target: "" } };
    if (/^deliver\s+(?:forge\s+)?commission$/i.test(raw)) return { verb: "forge", args: { action: "deliver", target: "" } };
    let match = /^(?:name\s+weapon|engrave\s+name)\s+(.+)$/i.exec(raw);
    if (match) return { verb: "forge", args: { action: "name", target: textCommandUnquote(match[1]) } };
    match = /^(sharpen|hone|repair|mend|engrave|scrap|treat|upgrade|refine|fuse|recolou?r)(?:\s+(.+))?$/i.exec(raw);
    if (match) {
        const aliases = { hone: "sharpen", mend: "repair", recolour: "recolor" };
        return { verb: "forge", args: { action: aliases[match[1].toLowerCase()] || match[1].toLowerCase(), target: match[2] || "" } };
    }
    if (sharedChoiceState.menu && /^forge-/.test(sharedChoiceState.menu.kind)) {
        match = /^(?:use|with|using)\s+(.+)$/i.exec(raw);
        if (match) return { verb: "forge", args: { action: "material", target: textCommandUnquote(match[1]) } };
    }
    return null;
}

function splitForgeTarget(raw) {
    let quote = "";
    for (let i = 0; i < raw.length; i++) {
        const ch = raw[i];
        if (quote) { if (ch === quote && raw[i - 1] !== "\\") quote = ""; continue; }
        if (ch === '"' || ch === "'" && (!i || /\s/.test(raw[i - 1]))) { quote = ch; continue; }
        const relation = /^\s+(?:with|using|as)\s+/i.exec(raw.slice(i));
        if (relation) return { item: textCommandUnquote(raw.slice(0, i)), material: textCommandUnquote(raw.slice(i + relation[0].length)) };
    }
    return { item: textCommandUnquote(raw), material: "" };
}

function textForgeShow(topic) {
    if (!/^(forge|smith|blacksmith|forge services)$/.test(topic)) return null;
    const block = forgeServiceBlock(G.activeNPC);
    if (block) return textModeResult("completed", block + " Use how forge for examples.");
    const job = G.player.forgeUpgrade;
    const services = forgeServiceOptions();
    return textModeResult("completed", "Forge actions:\n" + services.map(function (option) { return option.action + (option.blockedReason ? " — unavailable: " + option.blockedReason : ""); }).join("\n") + "\nPaid or destructive work asks for confirmation. Use forge for numbered choices." + (job ? "\n" + job.itemName + ": " + (job.turnsLeft > 0 ? "ready in " + job.turnsLeft + " turns" : "ready; type collect forge") + "." : ""), { service: { view: "forge", actions: services, job: job ? { name: job.itemName, turnsLeft: job.turnsLeft } : null } });
}

async function selectForgeChoice(menu, action, target) {
    const options = menu.options.filter(function (choice) { return choice.meta.action === action; });
    const exact = target ? options.filter(function (choice) { return textCommandNormalize(choice.meta.name) === textCommandNormalize(target); }) : [];
    const matches = exact.length ? exact : target ? textLootMatch(target, options, function (choice) { return choice.meta.name; }) : options;
    if (matches.length !== 1) return textModeResult("needs_input", "Choose the exact forge option by number. No new work has been charged.");
    return runSharedChoice(menu, matches[0]);
}

async function executeTextForgeCommand(action) {
    const npc = G.activeNPC, block = forgeServiceBlock(npc);
    if (block) return textModeResult("blocked", block);
    const args = action.args || {}, verb = args.action || "services", query = splitForgeTarget(args.target || "");
    let menu = sharedChoiceState.menu;
    if (menu && /^forge-/.test(menu.kind) && !menu.valid()) return textModeResult("blocked", "That forge choice changed. Type options to refresh.");
    if (menu && menu.kind === "forge-confirm") return textModeResult("needs_input", "Review the costs and use choose <number> to confirm, or back/cancel. A command plan cannot approve work.");
    if (verb === "services" && menu && /^forge-/.test(menu.kind)) return showSharedChoiceMenu(menu);
    if (verb === "name") return menu && menu.kind === "forge-name" ? menu.submitName(args.target) : textModeResult("blocked", "First use engrave <weapon>, then name weapon <name>.");
    if (verb === "material") {
        if (!menu || !/^(forge-treatment|forge-.+-material)$/.test(menu.kind)) return textModeResult("blocked", "Choose an item at the forge first.");
        return selectForgeChoice(menu, menu.forgeView === "treatment" ? "sharpen" : menu.forgeView.replace(/-material$/, ""), args.target);
    }
    if (/^(collect|deliver)$/.test(verb)) return quoteForgeService(verb, npc, null);
    if (!/^(services|sharpen|repair|engrave|scrap|treat|upgrade|refine|fuse|recolor)$/.test(verb)) return textModeResult("blocked", "That forge action is unavailable. Type how forge.");
    const opened = forgeMenu(npc, verb);
    if (opened.status !== "needs_input") return opened;
    menu = sharedChoiceState.menu;
    if (!query.item || /^(?:ore|armou?r|weapon|blade|relics?|item)$/i.test(query.item)) return opened;
    if (/^(repair|scrap|refine)$/.test(verb)) {
        const target = query.item + (query.material ? " with " + query.material : "");
        // An unspecified rivet is a real choice, not an implicit material expense.
        if (verb === "repair" && !query.material) {
            const options = menu.options.filter(function (choice) { return choice.meta.action === "repair" && !/ with repair rivet$/.test(choice.meta.name); });
            const matches = textLootMatch(target, options, function (choice) { return choice.meta.name; });
            return matches.length === 1 ? runSharedChoice(menu, matches[0]) : textModeResult("needs_input", "Choose the exact repair by number.");
        }
        return selectForgeChoice(menu, verb, target);
    }
    const selected = await selectForgeChoice(menu, "item", query.item);
    if (selected.status !== "completed") return selected;
    menu = sharedChoiceState.menu;
    if (!menu || !menu.valid()) return textModeResult("interrupted", "The forge selection changed. Repeat the command.");
    if (!query.material) return { status: "needs_input" };
    if (verb === "engrave") return menu.submitName(query.material);
    return selectForgeChoice(menu, verb, query.material);
}

async function textForgeMenuInput(menu, action, input) {
    if (splitTextCommands(input || "").parts?.length > 1) return textModeResult("needs_input", "Answer one forge menu step at a time. Leave the menu before starting a new command batch.");
    if (action.verb === "leave") {
        clearSharedChoiceMenu(menu);
        if (G.player !== menu.scene.player || G.activeRoom !== menu.scene.room || G.activeNPC !== menu.npc) return textModeResult("blocked", "That forge scene ended.");
        G.activeNPCMode = "menu"; renderNPCActionMenu(menu.npc);
        return { status: "completed" };
    }
    textModeState.busy = true; textModeState.paused = true; textModeState.capture = [];
    try {
        const result = await executeTextForgeCommand(action);
        for (let i = 0; i < textModeState.capture.length; i++) await textModeState.capture[i];
        return result;
    } finally {
        textModeState.capture = null; textModeState.busy = false;
        renderTextModeStatus(); focusTextModeInput();
    }
}
