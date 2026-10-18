const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, file), 'utf8').replace(/\r\n/g, '\n');
function once(text, before, after) { if (text.split(before).length !== 2) throw new Error('Expected one match: ' + before.slice(0, 100)); return text.replace(before, after); }
function edit(text, from, to, fn) { const a = text.indexOf(from), b = text.indexOf(to, a); if (a < 0 || b <= a) throw new Error('Missing ' + from); return text.slice(0, a) + fn(text.slice(a, b)) + text.slice(b); }
const before = read('before/cyoaftw-engine-CORE.js');
let core = edit(before, '// Text commands are a presentation/input layer.', '// END TEXT COMMANDS', () => ['commands.js', 'combat-commands.js', 'inventory-commands.js', 'trade-commands.js', 'loot-commands.js', 'exploration-commands.js', 'choice-actions.js', 'party-commands.js'].map(file => read(file).replace('// END TEXT COMMANDS', '')).join('\n') + '\n');
core = once(core, 'Core Engine Version: 2026-10-18-008', 'Core Engine Version: 2026-10-18-009');
core = once(core, 'window.__ENGINE_CORE_VERSION = "2026-10-18-008";', 'window.__ENGINE_CORE_VERSION = "2026-10-18-009";');
core = once(core, '// Latest: Text room exploration', '// Latest: Shared typed/button party decisions, gift completion and companion equipment choices.\n// Previous: Text room exploration');
function sharedRenderer(text, kind, npc, title, refresh, anchor) {
    text = text.replace(/createCombatButton\(/g, 'sharedButton(');
    const binding = '    const sharedMenu = typeof beginSharedChoiceMenu === "function" ? beginSharedChoiceMenu("' + kind + '", ' + npc + ', ' + title + ', ' + refresh + ') : null;\n    const sharedButton = function (label, run, opts) { return sharedMenu ? createSharedChoiceButton(sharedMenu, label, run, opts) : createCombatButton(label, run, opts); };\n';
    text = once(text, anchor, binding + anchor);
    const close = text.lastIndexOf('}');
    return text.slice(0, close) + '    if (sharedMenu) publishSharedChoiceMenu(sharedMenu, el);\n' + text.slice(close);
}
core = edit(core, 'function showPartyLootVote()', 'function castPartyLootVote(', text => {
    text = sharedRenderer(text, 'loot-vote', 'null', '"How should the party split loot?"', 'function () { showPartyLootVote(); }', '    const buttons = PARTY_LOOT_RULE_KEYS.map');
    text = once(text, '{ title: PARTY_LOOT_RULES[key].blurb }', '{ title: PARTY_LOOT_RULES[key].blurb, textChoice: { action: key } }');
    return once(text, '{ title: "Settle it another time." }', '{ title: "Settle it another time.", textChoice: { action: "later" } }');
});
core = edit(core, 'function renderPartyLootDivision(', 'function assignPendingLoot(', text => {
    text = once(text, '    const members = getLootMembersInRoom(G.activeRoom);', '    const members = getLootMembersInRoom(G.activeRoom).filter(function (member) { return isVisibleEntity(member); });');
    text = sharedRenderer(text, 'loot-division', 'null', '"Divide the loot: " + getItemName(item)', 'function () { renderPartyLootDivision(afterFn); }', '    const buttons = members.map');
    text = once(text, 'assignPendingLoot(item, m, afterFn); });', 'assignPendingLoot(item, m, afterFn); }, { textChoice: { action: "give", target: m, item: item } });');
    text = once(text, 'assignPendingLoot(item, G.player, afterFn); }));', 'assignPendingLoot(item, G.player, afterFn); }, { textChoice: { action: "keep", item: item } }));');
    return once(text, 'keepRestOfPendingLoot(afterFn); }));', 'keepRestOfPendingLoot(afterFn); }, { textChoice: { action: "rest" } }));');
});
core = edit(core, 'function renderLootObjection(', 'function leavePartyOverLoot(', text => {
    text = sharedRenderer(text, 'loot-objection', 'ob.npc', 'name + " wants the " + getItemName(ob.item)', 'function () { renderPartyLootDivision(afterFn); }', '    const buttons = [');
    text = once(text, '{ title: "Give way gracefully." }', '{ title: "Give way gracefully.", textChoice: { action: "agreeable" } }');
    text = once(text, '{ title: "Offer them the next valuable." }', '{ title: "Offer them the next valuable.", textChoice: { action: "compromise" } }');
    text = once(text, '{ title: "Lean on them. Risky if they are proud." }', '{ title: "Lean on them. Risky if they are proud.", textChoice: { action: "aggressive" } }');
    return once(text, '    return true;\n    if (sharedMenu) publishSharedChoiceMenu(sharedMenu, el);', '    if (sharedMenu) publishSharedChoiceMenu(sharedMenu, el);\n    return true;');
});
core = edit(core, 'function openGiveMenu(', 'function describeGiftForPrompt(', text => {
    text = sharedRenderer(text, 'gift', 'npc', '"Give " + getEntityName(npc) + " something"', 'function () { openGiveMenu(npc); }', '    const entries = buildPlayerInventoryEntries');
    text = once(text, 'function () { giveItemToNPC(npc, e.key); }', 'function () { return giveItemToNPC(npc, e.key); }');
    text = once(text, '{ title: mode === "food" && !getSupplyUse(e.item) ? "They would not know what to do with it." : "Hand over one." }', '{ title: mode === "food" && !getSupplyUse(e.item) ? "They would not know what to do with it." : "Hand over one.", textChoice: { action: "gift", item: e.item, key: e.key } }');
    text = once(text, 'renderNPCActionMenu(npc); }));', 'renderNPCActionMenu(npc); }, { textChoice: { action: "back" } }));');
    // The nectar button is emitted before the ordinary gift entries. Bind it
    // with the same menu, without lifting any specialised nectar logic here.
    const bindingStart = text.indexOf('    const sharedMenu ='), bindingEnd = text.indexOf('    const entries =', bindingStart);
    const binding = text.slice(bindingStart, bindingEnd);
    text = text.slice(0, bindingStart) + text.slice(bindingEnd);
    return once(text, '    if (isActiveSlime(npc)) {', binding + '    if (isActiveSlime(npc)) {');
});
core = edit(core, 'function openCompanionGearMenu(', '// ── OPENING BARKS', text => {
    text = sharedRenderer(text, 'companion', 'npc', '"Equipment: " + getEntityName(npc)', 'function () { openCompanionGearMenu(npc); }', '    if (npc._inParty) appendCombatGroup');
    text = once(text, '{ title: "Compare current gear with their packs and the room floor. Current gear wins ties." }', '{ title: "Compare current gear with their packs and the room floor. Current gear wins ties.", textChoice: { action: "best" } }');
    text = once(text, '{ title: "Into your pack." }', '{ title: "Into your pack.", textChoice: { action: "take", item: item, slot: slot, source: "equipped" } }');
    for (const [group, action] of [['equipButtons', 'equip'], ['takeButtons', 'take'], ['giveButtons', 'give']]) {
        const ending = '        }));\n    });\n    if (' + group + '.length)';
        text = once(text, ending, '        }));\n        if (sharedMenu) tagSharedChoice(sharedMenu, { action: "' + action + '", item: ' + (group === 'giveButtons' ? 'entry.item' : 'item') + ', source: "carried" });\n    });\n    if (' + group + '.length)');
    }
    text = once(text, 'sharedButton("Back", function () { renderNPCActionMenu(npc); })', 'sharedButton("Back", function () { renderNPCActionMenu(npc); }, { textChoice: { action: "back" } })');
    text = text.replace(/if \(!item \|\| item.hidden \|\| item.isHidden\) return;/g, 'if (!isLootItemVisible(item)) return;');
    return once(text, 'if (item && !Array.isArray(item)) {', 'if (isLootItemVisible(item) && !Array.isArray(item)) {');
});
// Return the native gift's completion promise and reject delayed replies whose
// original actor/NPC/stack is gone. Manual legacy completeGift calls keep working.
core = edit(core, 'function giveItemToNPC(', 'function completeGift(', text => {
    text = once(text, '    const mode = getGiftReceiveMode(npc);', '    const mode = getGiftReceiveMode(npc);\n    const giftContext = typeof captureGiftRequest === "function" ? captureGiftRequest(npc, entry) : null;');
    text = text.replace(/        completeGift\(([^\n]+), (true|false)\);/g, '        return completeGift($1, $2, giftContext);');
    text = text.replace(/(return completeGift\([^\n]+;\n)        return;\n/g, '$1');
    text = once(text, '        setNarration("You hold out " + withIndefiniteArticle(name) + " to " + npcName + ", and your hand passes straight through. Nothing there can take it.");\n        return;', '        setNarration("You hold out " + withIndefiniteArticle(name) + " to " + npcName + ", and your hand passes straight through. Nothing there can take it.");\n        return { status: "blocked", message: "That creature cannot hold a gift." };');
    text = once(text, '            setNarration(npcName + " is already full. The " + name + " will not sink in, and you pull it back.");\n            return;', '            setNarration(npcName + " is already full. The " + name + " will not sink in, and you pull it back.");\n            return { status: "blocked", message: "That creature has no room for the gift." };');
    text = once(text, '            setNarration(npcName + " sniffs at the " + name + " and loses interest. You keep it.");\n            return;', '            setNarration(npcName + " sniffs at the " + name + " and loses interest. You keep it.");\n            return { status: "blocked", message: "That creature only accepts food. You keep the item." };');
    text = once(text, '    if (typeof refuseIfOffDuty === "function" && refuseIfOffDuty(npc)) return;', '    if (typeof refuseIfOffDuty === "function" && refuseIfOffDuty(npc)) return { status: "blocked", message: "That NPC is unavailable to receive a gift right now." };');
    text = once(text, '    Promise.resolve(fetchGiftReaction(npc, item, room))', '    return Promise.resolve(fetchGiftReaction(npc, item, room))');
    text = once(text, '    if (typeof addTypingIndicator === "function") addTypingIndicator();', '    const giftDialogue = typeof textModeState !== "undefined" ? textModeState.dialogue : null;\n    if (typeof addTypingIndicator === "function") addTypingIndicator();');
    text = once(text, '        });\n}', '        }).finally(function () {\n            if (giftDialogue && typeof textModeState !== "undefined" && textModeState.dialogue === giftDialogue) textModeDialogueBusy(false);\n        });\n}');
    return once(text, 'if (typeof removeTypingIndicator === "function") removeTypingIndicator();', 'if ((!giftContext || giftContext.current()) && typeof removeTypingIndicator === "function") removeTypingIndicator();');
});
core = once(core, 'function completeGift(npc, stackKey, item, result, narrationOnly) {', 'function completeGift(npc, stackKey, item, result, narrationOnly, giftContext) {\n    if (giftContext && !giftContext.valid()) {\n        if (giftContext.current()) { G.activeNPCMode = "menu"; renderNPCActionMenu(npc); }\n        return { status: "interrupted", message: "The gift target, scene or carried stack changed while waiting. Nothing was transferred." };\n    }');
core = edit(core, 'function completeGift(', 'window.giveItemToNPC =', text => {
    text = once(text, '        saveGameState();\n        return;', '        saveGameState();\n        return { status: "completed", accepted: true };');
    const close = text.lastIndexOf('}');
    return text.slice(0, close) + '    return { status: "completed", accepted: accepted };\n' + text.slice(close);
});
// Party narration is appended directly to the room in the legacy UI. Also
// publish it through the existing semantic seam for typed/spoken presentation.
core = once(core, 'function appendPartyLootNarration(text) {', 'function appendPartyLootNarration(text) {\n    if (typeof textModeState !== "undefined" && textModeState.enabled && text) publishTextModeOutput("party", text, { source: "engine" });');
// Equip-best must use the same public visibility rules as manual gear choices.
core = once(core, 'if (!item || seen.has(item) || item.hidden || item.isHidden || item.concealed || item.objectType === "body") return;', 'if (!item || seen.has(item) || item.hidden || item.isHidden || item.concealed || item.visible === false || item.objectType === "body") return;');
let html = read('before/cyoaftw-engine-CORE.html');
html = once(html, 'HTML Version: 2026-10-18-008', 'HTML Version: 2026-10-18-009');
html = once(html, 'window.HTML_VERSION = "2026-10-18-008";', 'window.HTML_VERSION = "2026-10-18-009";');
const scripts = text => text.match(/<script\s+src="[^\"]+"[^>]*><\/script>/g);
if (JSON.stringify(scripts(html)) !== JSON.stringify(scripts(read('before/cyoaftw-engine-CORE.html')))) throw new Error('Script tags changed');
for (const [from, to] of [['function chooseChatOption(option)', 'window.chooseChatOption = chooseChatOption;'], ['function disengageFromNPC(', 'function npcLeavesAfterRebuffedAdvance('], ['function examineRoomObject(', 'function collectBodyLoot('], ['function chooseNPCAction(', '// ── COMPANION EQUIPMENT']]) {
    const slice = text => text.slice(text.indexOf(from), text.indexOf(to, text.indexOf(from)));
    if (slice(core) !== slice(before)) throw new Error('Protected routing changed: ' + from);
}
for (const [file, value] of [['cyoaftw-engine-CORE.js', core], ['cyoaftw-engine-CORE.html', html]]) fs.writeFileSync(path.join(__dirname, file), value.replace(/\n/g, '\r\n'));
console.log('Built shared party choices engine and shell 009.');
