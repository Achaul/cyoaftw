// Shared choice menu engine. Descriptors bind native callbacks to both buttons
// and typed responses. No DOM scraping, synthetic clicks or saved callbacks.
const sharedChoiceState = { menu: null, sequence: 0 };

function choiceItemStamp(item) {
    if (Array.isArray(item)) return JSON.stringify(item.map(choiceItemStamp));
    return item ? JSON.stringify([item.name, item.type, item.qualityName, item.slot, item.stowed, item.quantity, item.unitSize, item.hidden, item.isHidden, item.concealed, item.visible, item.ruined, item.unusable, item.damage, item.armor]) : "";
}

function choiceArraySnapshot(list, visited) {
    const seen = visited || new Set(); seen.add(list);
    const members = (Array.isArray(list) ? list : []).map(function (item) {
        const packed = item && item.packed;
        return { item: item, stamp: choiceItemStamp(item), packed: packed, contents: Array.isArray(packed) && !seen.has(packed) ? choiceArraySnapshot(packed, seen) : null };
    });
    return function (current) {
        return current === list && members.length === (current || []).length && members.every(function (entry) { return current.indexOf(entry.item) >= 0 && choiceItemStamp(entry.item) === entry.stamp && (!entry.item || entry.item.packed === entry.packed) && (!entry.contents || entry.contents(entry.item.packed)); });
    };
}

function choiceEntitySnapshot(entity) {
    if (!entity) return function () { return true; };
    const inventory = choiceArraySnapshot(entity.inventory), equipped = entity.equipped;
    const slots = Object.keys(equipped || {}).map(function (key) { return { key: key, item: equipped[key], stamp: choiceItemStamp(equipped[key]) }; });
    return function () {
        return inventory(entity.inventory) && entity.equipped === equipped && Object.keys(entity.equipped || {}).length === slots.length && slots.every(function (entry) { return entity.equipped[entry.key] === entry.item && choiceItemStamp(entry.item) === entry.stamp; });
    };
}

function beginSharedChoiceMenu(kind, npc, title, refresh) {
    const player = G.player, room = G.activeRoom, activeNPC = G.activeNPC, mode = G.activeNPCMode;
    const modal = G.activeItemModal, object = G.activeObject;
    const playerState = choiceEntitySnapshot(player), npcState = choiceEntitySnapshot(npc);
    const partyMembers = (G.partyMembers || []).slice(), followers = (G.sessionFollowers || []).slice();
    const pending = choiceArraySnapshot(G._partyLootPending), objection = G._partyLootObjection;
    const partyState = player && player.partyLoot, partyStamp = JSON.stringify(partyState || null);
    const members = typeof getLootMembersInRoom === "function" ? getLootMembersInRoom(room).slice() : [];
    const visibleMembers = members.map(function (member) { return isVisibleEntity(member); });
    const menu = { id: ++sharedChoiceState.sequence, kind: kind, npc: npc, title: title, refresh: refresh, options: [], element: null, children: [], scene: { player: player, room: room, npc: activeNPC, mode: mode, modal: modal, object: object },
        ownsView: function () { const children = menu.element ? Array.from(menu.element.children) : []; return !menu.element || children.length === menu.children.length && children.every(function (child, index) { return child === menu.children[index]; }); },
        valid: function () {
            if (!menu.ownsView()) return false;
            if (G.player !== player || G.activeRoom !== room || G.activeNPC !== activeNPC || G.activeNPCMode !== mode || !player || player.hp <= 0 || player.dead || player.unconscious || player._dying || player._collapsing || G.activeItemModal !== modal || G.activeObject !== object) return false;
            if (G.activeNPCMode === "combat" || roomHasActiveHostile(room) || isRoomCollapsed(room)) return false;
            if (!playerState() || !npcState() || (npc && ((room.creatures || []).indexOf(npc) < 0 || !isVisibleEntity(npc) || npc.dead || npc.hp <= 0 || npc.unconscious))) return false;
            if (partyMembers.length !== (G.partyMembers || []).length || partyMembers.some(function (member) { return (G.partyMembers || []).indexOf(member) < 0; }) || followers.length !== (G.sessionFollowers || []).length || followers.some(function (member) { return (G.sessionFollowers || []).indexOf(member) < 0; })) return false;
            if (/^loot/.test(kind)) {
                const now = getLootMembersInRoom(room);
                if (members.length !== now.length || members.some(function (member, index) { return now.indexOf(member) < 0 || isVisibleEntity(member) !== visibleMembers[index]; }) || !pending(G._partyLootPending) || G._partyLootObjection !== objection || player.partyLoot !== partyState || JSON.stringify(partyState || null) !== partyStamp) return false;
            } else if (hasPendingPartyLoot()) return false;
            return !npc || kind !== "companion" || isCompanionNPC(npc);
        }
    };
    return menu;
}

function createSharedChoiceButton(menu, label, run, options) {
    const opts = options || {};
    const choice = { id: String(menu.options.length + 1), label: label, run: run, disabled: !!opts.disabled, reason: opts.title || "", meta: opts.textChoice || {} };
    menu.options.push(choice);
    return createCombatButton(label, function () {
        if (typeof textModeState !== "undefined" && textModeState.enabled && typeof textRunSharedChoice === "function") {
            if (textModeState.busy || textModeState.parsing) return sharedChoiceResult("blocked", "An action is still finishing. Wait before choosing again.");
            return textRunSharedChoice(menu, choice);
        }
        return runSharedChoice(menu, choice);
    }, opts);
}

function tagSharedChoice(menu, meta) {
    if (menu && menu.options.length) menu.options[menu.options.length - 1].meta = meta;
}

function publishSharedChoiceMenu(menu, element) {
    menu.element = element;
    menu.children = element ? Array.from(element.children) : [];
    sharedChoiceState.menu = menu;
    if (typeof textModeState !== "undefined" && textModeState.enabled) showSharedChoiceMenu(menu);
}

function clearSharedChoiceMenu(menu) {
    if (!menu || sharedChoiceState.menu !== menu) return;
    sharedChoiceState.menu = null;
    if (menu.preserveView) return;
    const el = menu.element, children = el ? Array.from(el.children) : [];
    if (el && children.length === menu.children.length && children.every(function (child, index) { return child === menu.children[index]; })) el.innerHTML = "";
}

function sharedChoiceResult(status, message) {
    if (typeof textModeState !== "undefined" && textModeState.enabled) return textModeResult(status, message);
    if (message) setNarration(message);
    return { status: status };
}

function showSharedChoiceMenu(menu) {
    return textModeResult("needs_input", menu.title + "\n" + menu.options.map(function (choice, index) { return (index + 1) + ". " + choice.label + (choice.disabled ? " — unavailable" + (choice.reason ? ": " + choice.reason : "") : ""); }).join("\n") + "\nType choose <number> (or the number alone). Use back or cancel where available. Later commands stay paused.", { menu: { id: menu.id, kind: menu.kind }, choices: menu.options.map(function (choice, index) { return { number: index + 1, label: choice.label, response: "choose " + (index + 1), disabled: choice.disabled }; }) });
}

async function runSharedChoice(menu, choice) {
    if (sharedChoiceState.menu !== menu || !menu.valid()) return sharedChoiceResult("blocked", "That choice changed or is no longer available. Type options for the current choices.");
    if (!choice || menu.options.indexOf(choice) < 0 || choice.disabled) return sharedChoiceResult("blocked", choice && choice.reason || "Choose an available option from the list.");
    if (choice.meta.target && (!isVisibleEntity(choice.meta.target) || getLootMembersInRoom(G.activeRoom).indexOf(choice.meta.target) < 0)) return sharedChoiceResult("blocked", "That companion is no longer available. Type options to refresh the choices.");
    clearSharedChoiceMenu(menu); // consume before running: no double allocation
    const result = await choice.run();
    if (result && result.status && result.status !== "completed") return sharedChoiceResult(result.status, result.message || "The choice could not finish. Pending commands are paused.");
    if (result && result.accepted === false) return sharedChoiceResult("blocked", "The gift was refused; you keep it. Pending commands are paused.");
    return { status: "completed" };
}

// Async gifts retain their original player/room/NPC and exact stack members.
const activeGiftRequests = new WeakMap();
function captureGiftRequest(npc, entry) {
    const player = G.player, room = G.activeRoom, mode = G.activeNPCMode;
    const modal = G.activeItemModal, object = G.activeObject, playerState = choiceEntitySnapshot(player);
    const inventory = player.inventory;
    const members = inventory.filter(function (item) { return getInventoryEntryKey(item) === entry.key; });
    const stamps = members.map(choiceItemStamp);
    const request = { current: function () {
        return activeGiftRequests.get(npc) === request && G.player === player && G.activeRoom === room && G.activeNPC === npc && G.activeNPCMode === mode && G.activeItemModal === modal && G.activeObject === object && !player.dead && player.hp > 0 && !player.unconscious && !player._dying && !player._collapsing && !roomHasActiveHostile(room) && !isRoomCollapsed(room) && !hasPendingPartyLoot() && (room.creatures || []).indexOf(npc) >= 0 && isVisibleEntity(npc) && !npc.dead && npc.hp > 0 && !npc.unconscious;
    }, valid: function () {
        const current = player.inventory === inventory ? inventory.filter(function (item) { return getInventoryEntryKey(item) === entry.key; }) : [];
        return request.current() && playerState() && !player.dead && player.hp > 0 && !player.unconscious && !player._dying && !player._collapsing &&
            (room.creatures || []).indexOf(npc) >= 0 && isVisibleEntity(npc) && !npc.dead && npc.hp > 0 && !npc.unconscious && !roomHasActiveHostile(room) && !hasPendingPartyLoot() && current.length === members.length && members.every(function (item, index) { return current.indexOf(item) >= 0 && choiceItemStamp(item) === stamps[index]; });
    } };
    activeGiftRequests.set(npc, request);
    return request;
}
// END PARTY ACTIONS
