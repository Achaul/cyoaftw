// Exploration adapters select public fixtures, then call native engine actions.
// No persistent fixture selection: every action resolves/checks the current room.
function parseTextExplorationCommand(raw) {
    // Learned combat actions such as Disarm keep their established shorthand.
    if (textModeInCombat() && textCombatActions().some(function (action) { return textCombatActionMatches(action, raw); })) return null;
    let match = /^(?:search|rummage)(?:\s+(careful|carefully|tight|force|forcefully))?$/i.exec(raw);
    if (match) return { verb: "search", args: { source: "room", approach: /^tight$/i.test(match[1]) ? "tight" : /^force/i.test(match[1]) ? "force" : "careful" } };
    match = /^(?:drink|sip)\s+from\s+(.+)$/i.exec(raw);
    if (match) return { verb: "interact", args: { fixture: textCommandUnquote(match[1]), action: "drink" } };
    match = /^fill\s+(.+)$/i.exec(raw);
    if (match) {
        const relation = textLootRelation(match[1], ["from"]);
        return { verb: "fill", args: { item: textCommandUnquote(relation ? relation.item : match[1]), fixture: relation ? relation.source : "" } };
    }
    match = /^(?:examine|inspect|x)\s+fixture\s+(.+)$/i.exec(raw);
    if (match) return { verb: "interact", args: { fixture: textCommandUnquote(match[1]), action: "examine" } };
    match = /^(?:interact(?:\s+with)?|use\s+fixture)\s+(.+)$/i.exec(raw);
    if (match) return { verb: "interact", args: { fixture: textCommandUnquote(match[1]) } };
    match = /^(gather|forage|harvest|mine|scavenge|read|warm(?:\s+up)?|wash(?:\s+up)?|disarm|break|pray|offer|enter|climb)(?:\s+(.+))?$/i.exec(raw);
    if (match) {
        const word = match[1].toLowerCase();
        const verb = /^(forage|harvest)$/.test(word) ? "gather" : /^warm/.test(word) ? "warm" : /^wash/.test(word) ? "wash" : word === "climb" ? "enter" : word;
        return { verb: verb, args: { fixture: textCommandUnquote((match[2] || "").replace(/^(?:at|from|to|on)\s+/i, "")) } };
    }
    if (/^(?:case|case\s+(?:the\s+)?(?:place|room))$/i.test(raw)) return { verb: "case", args: {} };
    if (/^(?:sneak|hide|sneak\s+(?:around|into\s+the\s+shadows))$/i.test(raw)) return { verb: "sneak", args: {} };
    if (/^(?:fixtures|landmarks)$/i.test(raw)) return { verb: "fixtures", args: {} };
    return null;
}

function textExplorationFixtures() {
    const room = G.activeRoom;
    return !room || !Array.isArray(room.structural) || !room.structural.length ? [] : (getVisibleRoomFixtures(room) || []).filter(function (fixture) {
        return fixture && !fixture.hidden && !fixture.isHidden && fixture.visible !== false && (room.structural || []).indexOf(fixture) >= 0;
    }).map(function (fixture) { return { fixture: fixture, room: room, list: room.structural, label: getEntityName(fixture) }; });
}

function textExplorationFresh(ref) {
    return ref && textExplorationFixtures().find(function (entry) { return entry.fixture === ref.fixture && entry.room === ref.room && entry.list === ref.list; });
}

function textExplorationBlock() {
    return textModeRoomBlock() || (isRoomCollapsed(G.activeRoom) ? "Everything here is buried under rubble." : "") ||
        (roomHasActiveHostile(G.activeRoom) ? "Too dangerous to work with fixtures while a threat is nearby." : "");
}

// Descriptors intentionally call the same eligibility helpers/handlers as cards.
// More involved crafting/service menus remain separate command families.
function textFixtureActions(fixture) {
    const room = G.activeRoom, actions = [];
    const add = function (id, reason, run, note) { actions.push({ id: id, label: id + " " + getEntityName(fixture), reason: reason || "", run: run, note: note || "" }); };
    if (isForageFixture(fixture)) add("gather", getForageBlockReason(fixture, room), function () { gatherForageFixture(fixture); }, FORAGE_STAMINA_COST + " stamina, 1 turn");
    if (FIXTURE_ORE_SOURCES[fixture.id]) add("scavenge", getScavengeBlockReason(fixture, room), function () { scavengeFixture(fixture); }, PROSPECT_STAMINA_COST + " stamina, 1 turn");
    if (MINING_ENABLED && MINING_SOURCES[fixture.id]) add("mine", getMiningBlockReason(fixture, room), function () { mineFixture(fixture); }, MINING_STAMINA_COST + " stamina, 1 turn; needs a pickaxe");
    if (isReadableFixture(fixture)) add("read", getReadBlockReason(fixture, room), function () { readFixture(fixture); }, "1 turn");
    if (isDrinkableFixture(fixture)) {
        add("drink", getDrinkBlockReason(room), function () { drinkFromFixture(fixture); }, "1 turn");
        add("fill", getFillableEmptyEntries().length ? "" : "You need an empty carried bottle or vial.", null, "1 turn");
    } else if (isFoulWaterFixture(fixture)) add("drink", "The water is foul. You would not touch it.", null);
    if (isCauldronFixture(fixture)) add("drink", getCauldronTasteBlockReason(fixture, room), function () { tasteCauldron(fixture); }, "may have unknown effects");
    if (isWarmthFixture(fixture)) add("warm", getWarmBlockReason(room), function () { warmUpAtFixture(fixture); }, "1 turn");
    if (isWashableRoomObject(fixture)) add("wash", "", function () { performWash(); });
    if (isTrapFixture(fixture)) {
        const reason = fixture.trapState === "armed" ? "" : "That trap is no longer armed.";
        add("disarm", reason, function () { attemptTrapAction(fixture, "disarm"); }, "Flexibility, 1 turn");
        add("break", reason, function () { attemptTrapAction(fixture, "break"); }, "Prowess, 1 turn");
    }
    if (getFixtureDeityId(fixture)) {
        add("pray", getPrayerBlockReason(fixture, room), function () { prayAtFixture(fixture); });
        add("offer", getOfferingBlockReason(fixture, room), function () { makeOfferingAtFixture(fixture); }, OFFERING_COST_COINS + " coin, 1 turn");
    }
    if (isPortalFixture(fixture)) add("enter", isTownReturnWaygate(fixture) ? getTownReturnBlockReason(room, fixture.portalTargetTier) : getTownPortalBlockReason(room), null, "asks for travel confirmation");
    getFixtureMovementOptions(fixture, room).forEach(function (route) {
        const reason = getFixtureMovementBlockReason() || (isExitLocked(room, route.direction) ? "That route is locked." : isExitCollapsed(room, route.direction) ? "That route is blocked by rubble." : "");
        actions.push({ id: "enter", key: route.direction, label: route.label, route: route, reason: reason, run: function () { moveThroughFixture(fixture, room, route); } });
    });
    return actions;
}

function textExplorationList() {
    const fixtures = textExplorationFixtures();
    return textModeResult("completed", "Visible fixtures:\n" + (fixtures.length ? fixtures.map(function (entry, index) { return (index + 1) + ". " + entry.label; }).join("\n") : "None visible. Try look or search room.") + "\nUse examine fixture <name>, or interact with <name> for its actions.", { fixtures: fixtures.map(function (entry, index) { return { number: index + 1, name: entry.label }; }) });
}

function textFixtureCommand(action, entry) {
    return action.id === "drink" ? "drink from " + entry.label : action.id === "fill" ? "fill <empty bottle> from " + entry.label : action.id + " " + entry.label;
}

function textFixtureDescribe(entry) {
    const fixture = entry.fixture, actions = textFixtureActions(fixture);
    const description = getBoardFixtureDescription(fixture) || fixture.examineText || fixture.description || "You take a closer look at " + entry.label + ".";
    const lines = actions.map(function (action) { return textFixtureCommand(action, entry) + (action.route ? " — " + action.label : "") + (action.note ? " — " + action.note : "") + (action.reason ? " — unavailable: " + action.reason : ""); });
    if (isContainerFixture(fixture)) lines.push("open " + entry.label + "; search " + entry.label + "; contents " + entry.label);
    return textModeResult("completed", entry.label + "\n" + description + (lines.length ? "\nActions:\n" + lines.join("\n") : "\nNo typed fixture action is available here yet."), { fixture: { name: entry.label, description: description, actions: actions.map(function (action) { return { verb: action.id, command: textFixtureCommand(action, entry), blockedReason: action.reason, note: action.note || "" }; }) } });
}

function textExplorationShow(topic) {
    if (/^(?:fixtures|landmarks|surroundings)$/.test(topic)) return textExplorationList();
    const match = /^(?:fixture|interact(?:\s+with)?)\s+(.+)$/.exec(topic);
    if (!match) return null;
    const entries = textLootMatch(match[1], textExplorationFixtures(), function (entry) { return entry.label; });
    return entries.length === 1 ? textFixtureDescribe(entries[0]) : textModeResult("completed", "Use interact with <name> to choose a fixture. Type show fixtures for visible names.");
}

function textExplorationVerbAvailable(verb) {
    if (verb === "interact") return textExplorationFixtures().length > 0;
    if (/^(fixtures|sneak|case)$/.test(verb)) return true;
    return textExplorationFixtures().some(function (entry) { return textFixtureActions(entry.fixture).some(function (action) { return action.id === verb && !action.reason; }); });
}

function textExplorationInspect(action) {
    if (action.args.scope || action.itemRef || !String(action.args.item || "").trim()) return null;
    const fixtures = textLootMatch(action.args.item, textExplorationFixtures(), function (entry) { return entry.label; });
    if (!fixtures.length) return null;
    const items = resolveTextInventoryItems(action.args.item, "examine");
    if (items.length) return textModeResult("blocked", "That name matches both an item and a fixture. Use examine fixture <name>, or examine carried/floor <item>.");
    return executeTextExplorationCommand({ verb: "interact", args: { fixture: action.args.item, action: "examine" } });
}

async function textExplorationRun(entry, fn) {
    const previous = textModeState.explorationTask;
    const task = { entry: entry, messages: [] };
    textModeState.explorationTask = task;
    try { return await fn(); } finally {
        textModeState.explorationTask = previous;
        if (task.messages.length) textModeResult("completed", task.messages.join("\n"));
    }
}

function textExplorationCaptureCard(fixture, options) {
    const task = textModeState.enabled && textModeState.explorationTask;
    if (!task || task.entry.fixture !== fixture) return false;
    if (options && options.message) task.messages.push(options.message);
    return true;
}

async function executeTextExplorationCommand(action) {
    const args = action.args || {}, scene = textModeScene();
    if (action.verb === "fixtures") return textExplorationList();
    const block = textExplorationBlock();
    if (block) return textModeResult("blocked", block);
    if (action.verb === "search" || action.verb === "case" || action.verb === "sneak") {
        let reason;
        if (action.verb === "search") {
            const approach = SEARCH_APPROACHES.find(function (entry) { return entry.key === (args.approach || "careful"); });
            if (!approach) return textModeResult("blocked", "Choose careful, tight, or force for the room search.");
            reason = getSearchBlockReason(G.activeRoom);
            ensureEntityStamina(G.player);
            if (!reason && G.player.stamina < approach.staminaCost) reason = "You need " + approach.staminaCost + " stamina for that search.";
            if (!reason) {
                const result = performRoomSearch(approach.key);
                if (result && result.status === "interrupted") return textModeResult("interrupted", result.message);
            }
        } else {
            const id = action.verb === "case" ? "casePlace" : "sneak";
            const descriptor = INTERACT_MENU_ACTIONS.find(function (entry) { return entry.id === id; });
            reason = !descriptor || !descriptor.visible(G.activeRoom) ? "You have not learned that exploration ability." : descriptor.disabledReason(G.activeRoom);
            if (!reason) descriptor.run(G.activeRoom);
        }
        if (reason) return textModeResult("blocked", reason);
        if (!textModeSameScene(scene) || roomHasActiveHostile(G.activeRoom)) return textModeResult("interrupted", "The situation changed during exploration. Pending commands are paused.");
        return { status: "completed" };
    }
    const verb = action.verb === "interact" ? textCommandNormalize(args.action || "examine") : action.verb;
    const all = textExplorationFixtures();
    let entries = action.fixtureRef ? [textExplorationFresh(action.fixtureRef)].filter(Boolean) : args.fixture ? textLootMatch(args.fixture, all, function (entry) { return entry.label; }) : all.filter(function (entry) { return textFixtureActions(entry.fixture).some(function (value) { return value.id === verb; }); });
    if (!entries.length) return textModeResult("blocked", action.fixtureRef ? "That fixture moved, disappeared or became hidden. Repeat the command." : "No visible fixture matches. Type show fixtures for names.");
    if (entries.length > 1) return textModeAsk(action, "fixture", entries, "Which fixture do you mean?");
    const entry = entries[0], fixture = entry.fixture;
    action.fixtureRef = entry;
    if (verb === "examine") return textFixtureDescribe(entry);
    const choices = textFixtureActions(fixture).filter(function (value) { return value.id === verb; });
    if (!choices.length) return textModeResult("blocked", "That action is not available on this fixture. Use interact with " + entry.label + " for its actions.");
    if (choices.length > 1 && !action.fixtureRoute) return textModeAsk(action, "fixtureRoute", choices, "Which route?");
    const selected = action.fixtureRoute ? choices.find(function (value) { return value.route && value.route.direction === action.fixtureRoute.route.direction && value.route.target === action.fixtureRoute.route.target; }) : choices[0];
    if (!selected) return textModeResult("blocked", "That route changed. Repeat the command.");
    if (selected.reason) return textModeResult("blocked", selected.reason);
    if (verb === "fill") {
        const fillable = getFillableEmptyEntries().map(function (value) { return { ...value, label: textInventoryItemName(value.item) }; });
        const matches = action.fillRef ? fillable.filter(function (value) { return value.key === action.fillRef.key && value.item === action.fillRef.item && value.totalQuantity === action.fillRef.totalQuantity; }) : textLootMatch(args.item || "", fillable, function (value) { return value.label; });
        if (!matches.length) return textModeResult("blocked", "No matching empty carried bottle is available. Type inventory to check.");
        if (matches.length > 1) return textModeAsk(action, "fixtureFill", matches, "Which empty container?");
        action.fillRef = matches[0];
        await textExplorationRun(entry, function () { fillContainerAtFixture(fixture, matches[0].key); });
    } else if (verb === "enter" && isPortalFixture(fixture)) {
        const quote = { returning: isTownReturnWaygate(fixture), cost: isTownReturnWaygate(fixture) ? 0 : getTownPortalCost(), tier: isTownReturnWaygate(fixture) ? fixture.portalTargetTier : getHighestPortalTier() + 1 };
        if (!action.portalChoice) {
            action.portalQuote = quote;
            return textModeAsk(action, "fixtureConfirm", [{ label: "Travel through " + entry.label + " (" + quote.cost + " gold)", yes: true }, { label: "Cancel travel", yes: false }], "Confirm travel? " + (isTownReturnWaygate(fixture) ? describePortalTownStrength(quote.tier) : describeTownPortalNextTier()));
        }
        if (!action.portalChoice.yes) return textModeResult("blocked", "Travel cancelled. Pending commands are paused.");
        if (!action.portalQuote || action.portalQuote.returning !== quote.returning || action.portalQuote.cost !== quote.cost || action.portalQuote.tier !== quote.tier) return textModeResult("blocked", "The portal destination or fee changed. Repeat enter to review it.");
        await textExplorationRun(entry, function () { return isTownReturnWaygate(fixture) ? returnThroughTownPortal(quote.tier) : performTownPortal(); });
        return textModeResult("interrupted", "Travel resolved. Pending commands are paused; use look to check your surroundings.");
    } else await textExplorationRun(entry, selected.run);
    if (!textModeSameScene(scene) || roomHasActiveHostile(G.activeRoom) || textModeInterruptReason()) return textModeResult("interrupted", "The situation changed during that action. Completed effects are preserved; pending commands are paused.");
    if (!textExplorationFresh(entry)) return textModeResult("interrupted", "The fixture changed or is no longer visible. Pending commands are paused.");
    if ((verb === "disarm" || verb === "break") && fixture.trapState === "armed") return textModeResult("blocked", "The trap remains armed. Another attempt must be explicit.");
    publishTextModeOutput("exploration", "Finished " + verb + " at " + entry.label + ".", { exploration: { verb: verb, fixture: entry.label } }, false);
    return { status: "completed" };
}
