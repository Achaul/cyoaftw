// BASIC GOODS CYCLE: bounded background household trade and supplier deliveries.
// Only generated merchants participate. Named NPC possessions are not a stock pool.
const GOODS_CYCLE = Object.freeze({ daysPerDelivery: 2, maxCatchup: 3, dailySales: 3, dailyBudget: 24, dailyJunkUnits: 40, stockUnits: 60, stockRows: 36, deliveryUnits: 4, buybackDays: 1 });

function merchantGoodsEligible(npc) {
    return !!(npc && (isMerchantRole(npc.role) || /^(Enchanter|Archivist)$/.test(npc.role)) && npc.isHumanoid !== false && !npc.dead && npc.hp > 0 && !npc.unconscious && !npc.hidden && !npc.isHidden && !npc._inSkirmish && !npc.isGuide && !npc._inParty && !isCompanionNPC(npc));
}

function goodsProtected(item, owner) {
    if (!item || Array.isArray(item) || !isLootItemVisible(item) || item.infinite || isItemEquippedByEntity(owner, item)) return true;
    const tags = [].concat(item.type || []);
    const places = typeof getContainerPlaceIdMap === "function" ? getContainerPlaceIdMap(item) : {};
    return !!(isAnyKeyItem(item) || item.container || item.packed && item.packed.length || (owner.inventory || []).some(function (other) { return other && other !== item && places[other.stowed]; }) || item.bossRelic || item.unique || item.questItem || item.questId || item.affinity || item.hiddenTrait || item.enchant || item.enchantment || item.enchantedSatchel || item.largeRucksack || item.deityId || item.generatedDeityId || item.generatedContent || item.spellId || item.spells || item.poison || item.buff || getItemUnitValue(item) > 100 || tags.some(function (t) { return /^(lore|relic|boss-relic|deity-tome|spellbook|spell-scroll|quest|key)$/.test(t); }));
}

// Future composition work extends this one plan builder. Known composition
// overrides coarse cloth/leather fallback; unsupported components yield nothing.
function getGarmentRecovery(item) {
    if (!item || item.bossRelic || item.affinity || item.hiddenTrait || item.enchant || item.enchantment || item.enchantedSatchel || item.unique || item.questItem || item.questId || item.container || item.infinite) return [];
    const tags = [].concat(item.type || []), slot = getItemEquipSlot(item);
    if (["head", "upper", "lower", "hands", "feet", "neck", "belt"].indexOf(slot) < 0) return [];
    const material = item.material || item.durability && item.durability.material || guessDurabilityMaterial(item);
    if (tags.indexOf("clothes") < 0 && !(tags.indexOf("armor") >= 0 && /^(cloth|leather)$/.test(material))) return [];
    const ratio = item.ruined || item.unusable ? 0 : item.durability && item.durability.max > 0 ? Math.max(0, Math.min(1, item.durability.hp / item.durability.max)) : 1;
    if (ratio < 0.2) return [];
    const parts = item.composition !== undefined ? item.composition : [{ material: material === "leather" ? "leather" : "cloth", units: slot === "upper" ? 3 : slot === "lower" || slot === "feet" ? 2 : 1 }];
    if (!Array.isArray(parts)) return [];
    const totals = {};
    parts.slice(0, 12).forEach(function (part) {
        if (!part || !CLOTHIER_MATERIAL_TEMPLATES.some(function (tpl) { return tpl.tailoringMaterial === part.material; }) || !Number.isSafeInteger(part.units) || part.units < 1) return;
        totals[part.material] = Math.min(12, (totals[part.material] || 0) + part.units);
    });
    // Recovered raw material stays below the intact garment's value. Professional
    // unpicking retains 80% of sound sections, with one usable small piece minimum.
    let budget = Math.floor(getItemUnitValue(item) * 0.75), unitsLeft = 12;
    return Object.keys(totals).map(function (key) {
        const template = CLOTHIER_MATERIAL_TEMPLATES.find(function (tpl) { return tpl.tailoringMaterial === key; });
        const quantity = Math.min(unitsLeft, Math.max(1, Math.floor(totals[key] * ratio * 0.8)), Math.floor(budget / template.value));
        unitsLeft -= quantity; budget -= quantity * template.value;
        return { material: key, template: template, quantity: quantity };
    }).filter(function (part) { return part.quantity > 0; });
}

function createRecoveredMaterial(part) {
    return cloneLootTemplate(Object.assign({}, part.template, { type: ["misc", "tailoring-material"] }), { quantity: part.quantity, unitSize: 1, description: "Usable material recovered by carefully unpicking clothing. Suitable for tailoring work." });
}

function merchantGoodsStock(npc) {
    return (npc.inventory || []).filter(function (item) { return !goodsProtected(item, npc); });
}

function goodsTemplateKey(item) {
    return String(item.name || "").toLowerCase() + "|" + String(item.tailoringMaterial || "");
}

function merchantDeliveryPool(npc) {
    if (npc.role === "Clothier") return CLOTHIER_MATERIAL_TEMPLATES.map(function (t) { return Object.assign({}, t, { type: ["misc", "tailoring-material"], unitSize: 1 }); }).concat(CLOTHIER_CLOTHING_TEMPLATES.map(function (t) { return Object.assign({}, t, { type: ["clothes", t.slot] }); }));
    // Bar drinks retain their real cellar path and original delivery schedule.
    const role = (ROLE_TRADE_GOODS[npc.role] || (npc.role === "Enchanter" ? ROLE_TRADE_GOODS.Arcanist : []) || []).filter(function (t) { return !/room-token/.test(t.id) && ![].concat(t.type || []).includes("alcohol"); });
    if (npc.role === "Healer") return role.concat(["greenwort", "bloodmoss", "sunpetal"].map(function (key) { return { id: key, name: HEALING_HERBS[key].name, value: HEALING_HERBS[key].value, herbKey: key, type: ["misc", "herb"], description: HEALING_HERBS[key].description }; }));
    return role.length ? role : /^(Vendor|Shopkeeper|Trader|Wandering Merchant|Shady Merchant)$/.test(npc.role) ? TRADE_GOODS : [];
}

function initMerchantGoods(npc, now) {
    if (!npc.goodsCycle || npc.goodsCycle.version !== 1) npc.goodsCycle = { version: 1, lastTurn: now, rounds: 0, receipts: {}, summary: null };
    return npc.goodsCycle;
}

function noteMerchantGoodsReceived(npc, items) {
    if (!merchantGoodsEligible(npc) || !Array.isArray(items)) return;
    const now = getCurrentStoryTurn(), state = initMerchantGoods(npc, now);
    items.forEach(function (item) { if (item) { assignLootUID(item); state.receipts[item._uid] = now; } });
}

function goodsInsert(npc, item) {
    const key = getTradeStackKey(item), old = npc.inventory.find(function (other) { return !goodsProtected(other, npc) && getTradeStackKey(other) === key; });
    if (old) old.quantity = getItemQuantity(old) + getItemQuantity(item);
    else npc.inventory.push(item);
}

function merchantStockRoom(npc) {
    const stock = (npc.inventory || []).filter(function (item) { return item && isLootItemVisible(item) && !isItemEquippedByEntity(npc, item) && !item.infinite; });
    return stock.length < GOODS_CYCLE.stockRows && stock.reduce(function (n, item) { return n + getItemQuantity(item); }, 0) < GOODS_CYCLE.stockUnits;
}

function refreshMerchantGoods(npc) {
    if (!merchantGoodsEligible(npc)) return;
    if (!Array.isArray(npc.inventory)) npc.inventory = [];
    const now = getCurrentStoryTurn(), state = initMerchantGoods(npc, now), day = DAY_TURNS;
    const due = Math.floor((now - state.lastTurn) / day);
    if (due < 1) return;
    // An open interaction owns its stock and quotes. Catch up only after it ends.
    if (G.activeNPC === npc || G.combatEncounter || hasPendingPartyLoot()) return;
    // Defer until working hours. Consuming the due day at night would pin every
    // future daily check to closing time when the player repeatedly sleeps.
    if (typeof isNPCOffDuty === "function" && isNPCOffDuty(npc)) return;
    const summary = { sold: 0, junk: 0, dismantled: 0, delivered: 0, newItem: null, turn: now };
    const start = state.lastTurn;
    for (let round = 0; round < Math.min(due, GOODS_CYCLE.maxCatchup); round++) {
        const at = start + (round + 1) * day;
        state.rounds++;
        let budget = GOODS_CYCLE.dailyBudget, sales = 0, junk = 0, processed = false;
        // Oldest acquisitions first; stock untracked in old saves gets a grace day.
        npc.inventory.slice().forEach(function (item) {
            if (goodsProtected(item, npc)) return;
            assignLootUID(item);
            if (state.receipts[item._uid] === undefined) state.receipts[item._uid] = start;
            const age = at - state.receipts[item._uid];
            if (age < day * GOODS_CYCLE.buybackDays) return;
            const recovered = npc.role === "Clothier" && !processed && age >= day * 2 && item.durability && item.durability.hp / item.durability.max < 0.6 ? getGarmentRecovery(item) : [];
            if (recovered.length && merchantStockRoom(npc)) {
                takeOneUnitFromList(npc.inventory, item);
                recovered.forEach(function (part) { const material = createRecoveredMaterial(part); noteMerchantGoodsReceived(npc, [material]); goodsInsert(npc, material); });
                processed = true; summary.dismantled++; return;
            }
            // Junk has no simulated customer, recipe, or processing dependency.
            const tags = [].concat(item.type || []);
            if (item.junk === true || tags.includes("junk") || isVendorJunkItem(item)) {
                const amount = Math.min(getItemQuantity(item), GOODS_CYCLE.dailyJunkUnits - junk);
                if (amount < 1) return;
                if (amount === getItemQuantity(item)) npc.inventory.splice(npc.inventory.indexOf(item), 1);
                else item.quantity -= amount;
                adjustCoins(npc, Math.max(1, Math.floor(getItemUnitValue(item) * 0.25)) * amount);
                junk += amount; summary.junk += amount; return;
            }
            if (sales >= GOODS_CYCLE.dailySales) return;
            // Ordinary customers buy useful goods; old off-specialty surplus is
            // sold onward at wholesale. Expensive/special possessions are protected.
            const price = Math.max(1, Math.floor(getItemUnitValue(item) * (age >= day * 4 ? 0.35 : 0.75)));
            if (price > budget) return;
            takeOneUnitFromList(npc.inventory, item); adjustCoins(npc, price);
            budget -= price; sales++; summary.sold++;
        });
        if (state.rounds % GOODS_CYCLE.daysPerDelivery === 0) {
            const pool = merchantDeliveryPool(npc);
            let delivered = 0;
            // Rotate the first candidate so a small delivery doesn't always favour
            // the first four materials. Top up targets, never replace existing stock.
            for (let i = 0; i < pool.length && delivered < GOODS_CYCLE.deliveryUnits && merchantStockRoom(npc); i++) {
                const template = pool[(i + state.rounds * 3) % pool.length], key = goodsTemplateKey(template);
                const count = npc.inventory.filter(function (item) { return goodsTemplateKey(item) === key && !isItemEquippedByEntity(npc, item); }).reduce(function (sum, item) { return sum + getItemQuantity(item); }, 0);
                const target = template.tailoringMaterial ? 3 : [].concat(template.type || []).includes("clothes") ? 1 : 2;
                if (count >= target) continue;
                const cost = Math.max(1, Math.floor(template.value * 0.4));
                if (!hasEnoughCoins(npc, cost)) continue;
                const item = createNPCTradeGood(template);
                adjustCoins(npc, -cost); noteMerchantGoodsReceived(npc, [item]); goodsInsert(npc, item);
                delivered++; summary.delivered++;
            }
            // Occasional fresh role-specific stock, without rerolling starter loot.
            if (state.rounds % 4 === 0 && merchantStockRoom(npc) && Math.random() < 0.35) {
                let item = null;
                if (npc.role === "Blacksmith") item = generateLootItem("weapon", "weapon");
                else if (npc.role === "Healer") item = createPotionItem(rand([POTION_OF_STAMINA_TEMPLATE, POTION_OF_MANA_TEMPLATE]));
                else if (/^(Arcanist|Enchanter|Reliquarian)$/.test(npc.role)) item = createClassGearItem(rand(getClassGearKeysForTheme(npc.role === "Reliquarian" ? "divine" : "arcane")));
                else if (npc.role === "Clothier") item = cloneLootTemplate(Object.assign({}, rand(CLOTHIER_CLOTHING_TEMPLATES), { type: ["clothes"] }));
                else if (pool.length) item = createNPCTradeGood(rand(pool));
                if (item && !npc.inventory.some(function (it) { return getItemName(it) === getItemName(item); })) {
                    const cost = Math.max(1, Math.floor(getItemUnitValue(item) * 0.5));
                    if (hasEnoughCoins(npc, cost)) { adjustCoins(npc, -cost); npc.inventory.push(item); noteMerchantGoodsReceived(npc, [item]); summary.newItem = getItemName(item); summary.delivered++; }
                }
            }
        }
    }
    // Discard excess catch-up instead of banking thousands of refreshes on return.
    state.lastTurn = start + due * day;
    const live = new Set(npc.inventory.map(function (item) { return item && item._uid; }));
    Object.keys(state.receipts).forEach(function (uid) { if (!live.has(uid)) delete state.receipts[uid]; });
    if (summary.sold || summary.junk || summary.dismantled || summary.delivered) state.summary = summary;
}

function tickGoodsCycle() {
    const seen = new Set();
    Object.values(G.roomMap || {}).forEach(function (room) {
        if (!room || room.skirmish) return;
        (room.creatures || []).forEach(function (npc) { if (!seen.has(npc)) { seen.add(npc); refreshMerchantGoods(npc); } });
    });
}

function merchantGoodsSummary(npc) {
    if (!merchantGoodsEligible(npc)) return "";
    const s = npc.goodsCycle && npc.goodsCycle.summary;
    const parts = [];
    if (s) {
        if (s.sold) parts.push("Customers bought " + s.sold + " goods");
        if (s.junk) parts.push("cleared " + s.junk + " junk for coin");
        if (s.dismantled) parts.push("recovered tailoring materials");
        if (s.delivered) parts.push("received " + s.delivered + " goods from suppliers");
    }
    return (parts.length ? "Recent business: " + parts.join("; ") + ". " : "") + "Ordinary stock turns over with game days; small supplier deliveries arrive every two days. Recent purchases stay for at least a day. Special goods and cellar deliveries keep their own rules.";
}
// END BASIC GOODS CYCLE
