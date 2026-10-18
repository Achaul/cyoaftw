// Shared normal/text tailoring presentation. Native quote, job and item rules remain authoritative.
const tailorRequests = new WeakMap();
function tailorServiceBlock(npc, working) {
    const p = G.player, room = G.activeRoom;
    if (!p || !room || p.hp <= 0 || p.dead || p.unconscious || p._dying || p._collapsing) return "You cannot arrange tailoring right now.";
    if (!npc || npc.role !== "Clothier" || G.activeNPC !== npc || !/^(menu|talk|respond|trade|clothier)$/.test(G.activeNPCMode || "")) return "Talk or trade with a clothier first, then type tailor.";
    if (!(room.creatures || []).includes(npc) || !isVisibleEntity(npc) || npc.dead || npc.hp <= 0 || npc.unconscious || !canConverseWithNPC(npc) || (npc.hostility || 0) >= 80 || (npc.memory && npc.memory.favorability || 0) <= -70 || renownRefusesTrade(npc)) return "That clothier is unavailable.";
    if (isNPCOffDuty(npc)) return "The clothier is off duty.";
    if (G.combatEncounter || G.activeItemModal || G.activeObject || roomHasActiveHostile(room) || isRoomCollapsed(room) || isPlayerJailed() || hasPendingPartyLoot()) return "Finish the current danger or interaction first.";
    if (!working && tailorRequests.has(p)) return "The clothier is still considering your work. Wait for the result.";
    return "";
}

function tailorJobStamp(job, working) {
    if (!job) return "";
    return JSON.stringify(working ? Object.assign({}, job, { turnsLeft: 0 }) : job);
}
function captureTailorState(npc, working, strict) {
    const player = G.player, room = G.activeRoom, mode = G.activeNPCMode, source = room.creatures, structural = room.structural;
    const inventory = choiceEntitySnapshot(player), provider = choiceEntitySnapshot(npc);
    const items = (player.inventory || []).concat(Object.values(player.equipped || {}), [player.rucksack]).filter(Boolean);
    const stamps = items.map(function (item) { return JSON.stringify(item); }), pack = player.rucksack;
    const turn = getCurrentStoryTurn(), coins = getCoinValue(player), providerCoins = getCoinValue(npc);
    const job = player.clothierJob, held = job && job.item, quote = job && job.quote, outcome = job && job.outcome, jobStamp = tailorJobStamp(job, working && !strict);
    return function () {
        return G.player === player && G.activeRoom === room && G.activeNPC === npc && G.activeNPCMode === mode && room.creatures === source && room.structural === structural &&
            !tailorServiceBlock(npc, working) && inventory() && provider() && player.rucksack === pack && items.every(function (item, i) { return JSON.stringify(item) === stamps[i]; }) &&
            player.clothierJob === job && (!job || job.item === held && job.quote === quote && job.outcome === outcome) && tailorJobStamp(job, working && !strict) === jobStamp &&
            (working && !strict || getCurrentStoryTurn() === turn && getCoinValue(player) === coins && getCoinValue(npc) === providerCoins);
    };
}
function captureTailorWork(npc, strict = true) {
    let guard;
    const work = { player: G.player, room: G.activeRoom, npc: npc,
        commit: function () { guard = captureTailorState(npc, true, strict); },
        valid: function () { return tailorRequests.get(work.player) === work && guard(); },
        sameScene: function () { return G.player === work.player && G.activeRoom === work.room && G.activeNPC === npc && G.activeNPCMode === "clothier"; }
    };
    tailorRequests.set(work.player, work); work.commit(); return work;
}
function endTailorWork(work) { if (tailorRequests.get(work.player) === work) tailorRequests.delete(work.player); }
function interruptTailorWork(work) {
    endTailorWork(work);
    if (G.player === work.player) saveGameState();
    return sharedChoiceResult("interrupted", "Tailoring was interrupted. Committed costs, pocket changes and jobs remain; no later effects or stale AI results were applied. Pending commands stay paused.");
}
function publishTailorResult(action, data) {
    if (textModeState.enabled) publishTextModeOutput("service", "Tailoring action finished.", { service: Object.assign({ provider: "clothier", stage: "result", action: action }, data) }, false);
}

function tailorOfferItems(draft) {
    return (G.player.inventory || []).filter(function (item, i, list) {
        return list.indexOf(item) === i && item !== draft.item && isLootItemVisible(item) && !isItemEquippedByEntity(G.player, item) && !clothierItemHasContents(item) &&
            (isPigmentItem(item) || isClothierMaterial(item, draft.service));
    });
}
function tailorDraftStamp(draft) {
    return JSON.stringify([draft.service, draft.request, draft.offers.map(function (row) { return [row.quantity, JSON.stringify(row.item)]; })]);
}
function newTailorDraft(npc, item, service) {
    return { player: G.player, room: G.activeRoom, npc: npc, item: item, service: service, request: "", offers: [] };
}
function openTailorRequest(npc, item, service, draft) {
    if (!CLOTHIER_SERVICES[service] || !getClothierGarments().includes(item)) return sharedChoiceResult("blocked", "Choose a visible owned garment first.");
    const block = getClothierServiceBlock(item, service);
    if (block) return sharedChoiceResult("blocked", block);
    return tailorMenu(npc, "request", service, item, draft || newTailorDraft(npc, item, service));
}

function tailorMenu(npc, view, service, item, draft, quantity) {
    const block = tailorServiceBlock(npc);
    if (block) return sharedChoiceResult("blocked", block);
    G.activeNPCMode = "clothier";
    clothierQuoteSequence++; clothierPendingQuote = null;
    const el = document.getElementById("chatOptionsEl"); if (!el) return sharedChoiceResult("blocked", "The tailoring controls are unavailable.");
    el.innerHTML = "";
    const title = "Clothier: " + view + (service ? " — " + CLOTHIER_SERVICES[service].label : "") + (item ? " — " + getItemName(item) : "");
    const menu = beginSharedChoiceMenu("tailor-" + view, npc, title, function () { tailorMenu(npc, "services"); });
    const valid = menu.valid;
    menu.tailorDraft = draft; menu.tailorService = service;
    const add = function (label, action, run, target, reason) {
        el.appendChild(createSharedChoiceButton(menu, label, run, { disabled: !!reason, title: reason || "", textChoice: { action: action, name: target ? getItemName(target) : "", item: target || null } }));
    };
    if (view === "services") {
        add("Dismantle clothing into materials", "dismantle", function () { openClothierDismantle(npc); });
        const job = G.player.clothierJob;
        if (job) {
            menu.title += "\n" + job.serviceLabel + ": " + job.itemName + " — " + (job.turnsLeft > 0 ? job.turnsLeft + " turns remaining." : "Ready to collect.");
            add("Collect finished work", "collect", function () { return collectClothierJob(npc); }, null, job.turnsLeft > 0 ? "The work is not ready." : "");
        } else Object.keys(CLOTHIER_SERVICES).forEach(function (key) { add(CLOTHIER_SERVICES[key].label, key, function () { tailorMenu(npc, "garments", key); }); });
        add("Patch additional pockets (+3 slots, 75 coins)", "pockets", function () { tailorMenu(npc, "pockets"); });
        add("Browse clothing, bags, materials and dyes", "trade", function () { G.activeNPCMode = "trade"; renderTradeOptions(npc); });
        add("Back to conversation", "back", function () { G.activeNPCMode = "menu"; renderNPCActionMenu(npc); });
    } else if (view === "garments") {
        menu.title += "\n" + CLOTHIER_SERVICES[service].detail;
        getClothierGarments().forEach(function (garment) { add(getItemName(garment), "item", function () { openTailorRequest(npc, garment, service); }, garment, G.player.clothierJob ? "Collect the existing job first." : getClothierServiceBlock(garment, service)); });
        add("Back", "back", function () { tailorMenu(npc, "services"); });
    } else if (view === "request") {
        menu.title += "\nRequest: " + (draft.request || "not described yet") + "\nOffers: " + (draft.offers.length ? draft.offers.map(function (row) { return row.quantity + " × " + getItemName(row.item); }).join(", ") : "none") + ".\nUse offer <quantity> <material/dye>, request \"<description>\", then quote. Nothing is taken until acceptance.";
        let readForm = null;
        if (!textModeState.enabled) {
            const rows = tailorOfferItems(draft).map(function (resource) {
                const label = document.createElement("label"), input = document.createElement("input"); label.style.display = "block";
                label.textContent = getItemName(resource) + " (have " + getItemQuantity(resource) + ") ";
                input.type = "number"; input.min = "0"; input.max = String(getItemQuantity(resource)); input.step = "1";
                input.value = String(draft.offers.find(function (row) { return row.item === resource; })?.quantity || 0);
                input.setAttribute("aria-label", "Offer quantity of " + getItemName(resource)); input.style.width = "5em";
                label.appendChild(input); el.appendChild(label); return { item: resource, input: input };
            });
            const request = document.createElement("textarea"); request.maxLength = 1200; request.rows = 4; request.style.width = "100%";
            request.setAttribute("aria-label", "Describe tailoring work"); request.placeholder = "Describe the work you want"; request.value = draft.request; el.appendChild(request);
            readForm = function () {
                const offers = rows.map(function (row) { return { item: row.item, quantity: Number(row.input.value) }; });
                if (offers.some(function (row) { return !Number.isSafeInteger(row.quantity) || row.quantity < 0 || row.quantity > getItemQuantity(row.item); })) return "Choose whole quantities from zero up to what you carry.";
                draft.offers = offers.filter(function (row) { return row.quantity > 0; }); draft.request = request.value.trim(); return "";
            };
        }
        add("Choose materials and dyes", "offers", function () { const error = readForm && readForm(); if (error) { openTailorRequest(npc, item, service, draft); return sharedChoiceResult("blocked", error); } tailorMenu(npc, "offers", service, item, draft, 1); });
        add("Ask for a quote", "quote", function () { const error = readForm && readForm(); if (error) { openTailorRequest(npc, item, service, draft); return sharedChoiceResult("blocked", error); } return askTailorQuote(draft); });
        add("Back", "back", function () { tailorMenu(npc, "garments", service); });
    } else if (view === "offers") {
        menu.title += "\nChoose an entry to offer " + quantity + " unit(s). Offer 0 <name> keeps it; use offer <quantity> <name> for other quantities.";
        tailorOfferItems(draft).forEach(function (resource) { add(getItemName(resource) + " ×" + getItemQuantity(resource), "offer", function () { return setTailorOffer(draft, resource, quantity); }, resource, quantity > getItemQuantity(resource) ? "Not enough units." : ""); });
        add("Back", "back", function () { openTailorRequest(npc, item, service, draft); });
    } else if (view === "pockets") {
        menu.title += "\n75 coins, +3 slots, one turn. Each clothier can patch each bag once.";
        getClothierRucksacks().forEach(function (bag) { const reason = getClothierPocketBlock(npc, bag); add(getItemName(bag) + " — " + bag.container.maxUnitCapacity + " → " + (bag.container.maxUnitCapacity + CLOTHIER_POCKET_GAIN) + " slots", "pockets", function () { quoteTailorPockets(npc, bag); }, bag, reason); });
        add("Back", "back", function () { tailorMenu(npc, "services"); });
    }
    // Eligibility can initialize the maker id; capture after constructing choices.
    const guard = captureTailorState(npc, false), draftStamp = draft && tailorDraftStamp(draft);
    const draftRefs = draft && [draft.player, draft.room, draft.npc, draft.item];
    menu.valid = function () { return valid() && guard() && (!draft || draft.player === draftRefs[0] && draft.room === draftRefs[1] && draft.npc === draftRefs[2] && draft.item === draftRefs[3] && tailorDraftStamp(draft) === draftStamp); };
    publishSharedChoiceMenu(menu, el); return { status: "needs_input" };
}

function setTailorOffer(draft, resource, quantity) {
    if (!Number.isSafeInteger(quantity) || quantity < 0 || quantity > getItemQuantity(resource) || !tailorOfferItems(draft).includes(resource)) return sharedChoiceResult("blocked", "Choose an available material and a whole quantity you carry.");
    draft.offers = draft.offers.filter(function (row) { return row.item !== resource; });
    if (quantity > 0) draft.offers.push({ item: resource, quantity: quantity });
    openTailorRequest(draft.npc, draft.item, draft.service, draft);
}

function captureTailorPlanInputs(plan) {
    const player = plan.player, npc = plan.npc, item = plan.item, materials = plan.materials, dyes = plan.dyes;
    const rows = materials.concat(dyes), refs = rows.map(function (row) { return row.item; });
    const stamp = function () { return JSON.stringify([plan.service, plan.request, plan.snapshot, plan.outfit, plan.materials.map(function (row) { return [row.quantity, row.snapshot]; }), plan.dyes.map(function (row) { return [row.quantity, row.snapshot]; })]); };
    const original = stamp();
    return function () { return plan.player === player && plan.npc === npc && plan.item === item && plan.materials === materials && plan.dyes === dyes && rows.length === materials.length + dyes.length && materials.concat(dyes).every(function (row, i) { return row === rows[i] && row.item === refs[i]; }) && stamp() === original; };
}

async function askTailorQuote(draft) {
    const block = tailorServiceBlock(draft.npc);
    if (block) return sharedChoiceResult("blocked", block);
    if (draft.player !== G.player || draft.room !== G.activeRoom || !getClothierGarments().includes(draft.item) || G.player.clothierJob) return sharedChoiceResult("blocked", "That tailoring draft is no longer available.");
    const reject = function (message) { if (!sharedChoiceState.menu) openTailorRequest(draft.npc, draft.item, draft.service, draft); return sharedChoiceResult("blocked", message); };
    if (!draft.request.trim() || draft.request.length > 1200) return reject("Describe the work you want (up to 1200 characters).");
    const available = tailorOfferItems(draft);
    if (!draft.offers.length || draft.offers.some(function (row) { return !available.includes(row.item) || !Number.isSafeInteger(row.quantity) || row.quantity < 1 || row.quantity > getItemQuantity(row.item); })) return reject("Offer available materials and whole quantities first.");
    const materials = draft.offers.filter(function (row) { return !isPigmentItem(row.item); });
    if (!materials.length) return reject("Offer at least one material or spare garment, as well as any optional dyes.");
    const copyOffers = function (rows) { return rows.map(function (row) { return { item: row.item, quantity: row.quantity, snapshot: JSON.stringify(row.item) }; }); };
    const plan = { player: G.player, npc: draft.npc, item: draft.item, service: draft.service, request: draft.request.trim(), snapshot: JSON.stringify(draft.item), materials: copyOffers(materials), dyes: copyOffers(draft.offers.filter(function (row) { return isPigmentItem(row.item); })), draft: draft };
    plan.outfit = Object.values(G.player.equipped || {}).filter(function (worn) { return isLootItemVisible(worn) && isClothierGarment(worn); }).map(function (worn) { return { name: getItemName(worn), description: worn.description || "", charisma: worn.charisma || 0 }; });
    const inputsValid = captureTailorPlanInputs(plan);
    const seq = ++clothierQuoteSequence, work = captureTailorWork(plan.npc), stamp = tailorDraftStamp(draft);
    try {
        const quote = await requestClothierQuote(plan);
        if (!work.valid() || !inputsValid() || seq !== clothierQuoteSequence || tailorDraftStamp(draft) !== stamp) return interruptTailorWork(work);
        endTailorWork(work);
        const validated = quote && validateClothierQuote(quote, plan);
        if (!validated || !validated.feasible) { openTailorRequest(plan.npc, plan.item, plan.service, draft); return sharedChoiceResult("blocked", validated ? plan.npc.name + ": " + validated.reason : "The clothier could not settle a reliable quote. Nothing was taken; ask again explicitly."); }
        plan.quote = validated; plan.quoteStamp = JSON.stringify(validated);
        const sceneValid = captureTailorState(plan.npc, false);
        plan.contextGuard = function () { return sceneValid() && inputsValid(); };
        clothierPendingQuote = plan; renderTailorQuote(plan); return { status: "completed" };
    } finally { endTailorWork(work); }
}

function renderTailorQuote(plan) {
    const q = plan.quote, npc = plan.npc, el = document.getElementById("chatOptionsEl"); el.innerHTML = "";
    const consumed = q.materials.map(function (row) { return { name: getItemName(plan.materials[row.index].item), quantity: row.quantity }; }).concat(q.dyes.map(function (row) { return { name: getItemName(plan.dyes[row.index].item), quantity: row.quantity }; }));
    const detail = plan.service === "reinforce" ? "Agreed gains: +" + q.armorGain + " armour, +" + q.durabilityGain + " maximum durability, +" + q.valueIncrease + "g value." : plan.service === "alteration" ? q.name + ": " + q.description + " Estimated value increase: " + q.valueIncrease + "g; success, appeal, value and Charisma are appraised at collection." : CLOTHIER_SERVICES.repair.detail;
    const line = npc.name + ": " + q.reason + "\n" + CLOTHIER_SERVICES[plan.service].label + " " + getItemName(plan.item) + ": " + q.fee + "g, one handover turn, then " + q.turns + " work turns.\nConsumes: " + consumed.map(function (row) { return row.quantity + " × " + row.name; }).join(", ") + ". Unused offers stay with you. Leaves one garment with the clothier; any clothier can honour the receipt.\n" + detail;
    const menu = beginSharedChoiceMenu("tailor-quote", npc, line, function () { tailorMenu(npc, "services"); });
    const valid = menu.valid;
    menu.valid = function () { return valid() && clothierPendingQuote === plan && plan.contextGuard() && JSON.stringify(q) === plan.quoteStamp; };
    el.appendChild(createSharedChoiceButton(menu, "Accept quote and leave the piece (" + q.fee + "g)", function () { return acceptClothierQuote(plan); }, { disabled: !hasEnoughCoins(G.player, q.fee), textChoice: { action: "confirm" } }));
    el.appendChild(createSharedChoiceButton(menu, "Back — keep the piece", function () { openTailorRequest(npc, plan.item, plan.service, plan.draft); }, { textChoice: { action: "back" } }));
    publishSharedChoiceMenu(menu, el);
    if (textModeState.enabled) publishTextModeOutput("service", line, { service: { provider: "clothier", stage: "quote", action: plan.service, item: getItemName(plan.item), fee: q.fee, turns: 1, readyIn: q.turns, materials: consumed, design: plan.service === "alteration" ? { name: q.name, description: q.description, estimatedValueIncrease: q.valueIncrease } : null, gains: plan.service === "reinforce" ? { armor: q.armorGain, durability: q.durabilityGain, value: q.valueIncrease } : null } }, false);
}

function quoteTailorPockets(npc, item) {
    const block = tailorServiceBlock(npc) || getClothierPocketBlock(npc, item);
    if (block) return sharedChoiceResult("blocked", block);
    const el = document.getElementById("chatOptionsEl"); el.innerHTML = "";
    const line = "Patch " + getItemName(item) + ": " + CLOTHIER_POCKET_FEE + "g, one turn, " + item.container.maxUnitCapacity + " → " + (item.container.maxUnitCapacity + CLOTHIER_POCKET_GAIN) + " slots. Each clothier can patch each bag once.";
    const menu = beginSharedChoiceMenu("tailor-pocket-quote", npc, line, function () { tailorMenu(npc, "pockets"); });
    const valid = menu.valid, guard = captureTailorState(npc, false);
    menu.valid = function () { return valid() && guard() && !getClothierPocketBlock(npc, item); };
    el.appendChild(createSharedChoiceButton(menu, "Confirm pockets", function () { return patchClothierPockets(npc, item); }, { textChoice: { action: "confirm" } }));
    el.appendChild(createSharedChoiceButton(menu, "Back", function () { tailorMenu(npc, "pockets"); }, { textChoice: { action: "back" } }));
    publishSharedChoiceMenu(menu, el);
    if (textModeState.enabled) publishTextModeOutput("service", line, { service: { provider: "clothier", stage: "quote", action: "pockets", item: getItemName(item), fee: CLOTHIER_POCKET_FEE, turns: 1, capacity: item.container.maxUnitCapacity + CLOTHIER_POCKET_GAIN } }, false);
}
