const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync('C:/Git/CYOADEV/cyoaftw-engine-CORE.js', 'utf8');
let core = source;
function replaceOnce(before, after) {
    if (core.split(before).length !== 2) throw new Error('Expected one match: ' + before);
    core = core.replace(before, after);
}
replaceOnce('// While speaking to someone the player can lean on them to do one of three things:\r\n// "make them lower their prices", "make them serve you anyway" (past a refusal), "make\r\n// them tell you what they know" (a secret held back for want of favor). Code decides',
    '// While speaking to someone the player can demand lower prices, service past\r\n// a refusal, information held back for want of favor, or that they leave the room.\r\n// Both successful and failed threats damage the relationship. Code decides');
replaceOnce('    price:  { label: "Make them lower their prices",', '    price:  { label: "Make them lower prices",');
replaceOnce('const INTIMIDATE_DEMANDS = {', 'const INTIMIDATE_DEMANDS = {\r\n    leave:  { label: "Make them leave the room", dc: 2, ask: "You square your shoulders and tell them to leave the room. Now.", tag: "leave the room" },');
replaceOnce('const INTIMIDATE_LINES = {', [
    'const INTIMIDATE_LINES = {',
    '    leave:  { meek: "\\\"All right! I am going. Just keep back.\\\"",',
    '              firm: "\\\"Fine. I will go. Keep your distance.\\\"",',
    '              bold: "\\\"You want the room? Have it. I will remember this.\\\"" },'
].join('\r\n').replace(/\\\\\\"/g, '\\"'));
const helper = [
    '// Price demands also apply to people selling spare inventory, not only',
    '// the merchant role list. Checking eligibility must not generate stock.',
    'function isIntimidationSeller(npc) {',
    '    if (!npc) return false;',
    '    return isMerchantLikeNPC(npc) || isBarKeeper(npc) || /clothier|alchemist|enchanter/i.test(String(npc.role || "")) ||',
    '        (Array.isArray(npc.inventory) && npc.inventory.some(item => item && !item.hidden && !item.isHidden &&',
    '            getItemValue(item) > 0 && !isItemEquippedByEntity(npc, item)));',
    '}',
    '',
    '// Only real adjacent rooms reachable without forcing/picking a lock.',
    '// Stairs and lifts count, but a threat cannot move a bound or pinned NPC.',
    'function getIntimidationLeaveDestinations(npc, room = G.activeRoom) {',
    '    if (!npc || !room || !Array.isArray(room.creatures) || !room.creatures.includes(npc) ||',
    '        npc.bound || npc._prisoner || playerHasActiveStatus(npc, "hamstrung") || playerHasActiveStatus(npc, "impaled")) return [];',
    '    return Object.keys(room.exits || {}).filter(dir => {',
    '        const coords = room.exits[dir];',
    '        if (!coords || coords === room.coords || !G.roomMap[coords] || isExitCollapsed(room, dir)) return false;',
    '        const access = npcLockAccess(npc, room, dir);',
    '        return access.ok && access.how !== "pick" && access.how !== "force";',
    '    }).map(dir => room.exits[dir]);',
    '}',
    '',
    'function leaveRoomAfterIntimidation(npc, room) {',
    '    const destinations = getIntimidationLeaveDestinations(npc, room);',
    '    for (const coords of destinations) {',
    '        if (relocateNPCBetweenRooms(npc, room, coords, { ignoreDrunkStumble: true })) {',
    '            npc._fleeRun = { steps: FLEE_RUN_EXTRA_STEPS, from: room.coords };',
    '            return true;',
    '        }',
    '    }',
    '    return false;',
    '}',
    ''
].join('\r\n');
replaceOnce('// The demands that make sense with this NPC right now:', helper + '\r\n// The demands that make sense with this NPC right now:');
replaceOnce('    const seller = (typeof isMerchantLikeNPC === "function" && isMerchantLikeNPC(npc)) || isBarKeeper(npc);\r\n    const keys = [];',
    '    const seller = isIntimidationSeller(npc);\r\n    const keys = ["leave"];');
replaceOnce('        out.push({ key: k, label: INTIMIDATE_DEMANDS[k].label, dc: dc, chance: chance, hint: "Your read: " + getIntimidationOddsWord(chance) + "." });',
    '        const disabledReason = k === "leave" && !getIntimidationLeaveDestinations(npc).length ? "They have no clear way out of this room." : "";\r\n        out.push({ key: k, label: INTIMIDATE_DEMANDS[k].label, dc: dc, chance: chance, disabledReason: disabledReason, hint: disabledReason || "Your read: " + getIntimidationOddsWord(chance) + "." });');
replaceOnce('getIntimidationDemands(npc).length);', 'getIntimidationDemands(npc).some(d => !d.disabledReason));');
replaceOnce('        btn.title = d.hint;\r\n        btn.onclick', '        btn.title = d.hint;\r\n        btn.disabled = !!d.disabledReason;\r\n        btn.onclick');
replaceOnce('    if (!npc || !player || !demand) return null;\r\n    const dc = getIntimidationDC(npc, key);', [
    '    if (!npc || !player || !demand || G.activeNPC !== npc || !room ||',
    '        !Array.isArray(room.creatures) || !room.creatures.includes(npc)) return null;',
    '    const available = getIntimidationDemands(npc).find(d => d.key === key);',
    '    if (!available || available.disabledReason) return null;',
    '    const dc = getIntimidationDC(npc, key);'
].join('\r\n'));
replaceOnce('            lines.push(npc.name + " will charge you less for a while.");',
    '            lines.push(npc.name + " lowers prices by " + Math.round((1 - st.priceMult) * 100) + "% for " + INTIMIDATE_PRICE_TURNS + " turns.");');
replaceOnce('        } else if (key === "serve") {\r\n            st.serviceUntil', [
    '        } else if (key === "leave") {',
    '            res.left = leaveRoomAfterIntimidation(npc, room);',
    '            lines.push(npc.name + (res.left ? " backs away and leaves the room." : " tries to leave, but cannot get through the exit."));',
    '            if (res.left) {',
    '                disengageFromNPC([say].concat(lines).join(" "));',
    '                return res;',
    '            }',
    '        } else if (key === "serve") {',
    '            st.serviceUntil'
].join('\r\n'));
const blockStart = core.indexOf('function resolveIntimidation('), blockEnd = core.indexOf('// -- COMPANION CRIME REACTIONS', blockStart);
let block = core.slice(blockStart, blockEnd);
block = block.replaceAll('addChatMessage("player", "You", t, { mode: "narration", animate: true });', 'addChatMessage("left", "Narrator", t, { mode: "narration", animate: true });');
core = core.slice(0, blockStart) + block + core.slice(blockEnd);
replaceOnce('return CLOTHIER_LARGE_RUCKSACK_PRICE;', 'return Math.max(1, Math.round(CLOTHIER_LARGE_RUCKSACK_PRICE * getIntimidationPriceMult(npc)));');
replaceOnce('return CLOTHIER_SATCHEL_PRICE;', 'return Math.max(1, Math.round(CLOTHIER_SATCHEL_PRICE * getIntimidationPriceMult(npc)));');
replaceOnce('    if (getIntimidationPriceMult(npc) < 1) adj -= Math.max(1, Math.round(base * 0.25));\r\n    return Math.max(1, base + adj);',
    '    return Math.max(1, Math.round((base + adj) * getIntimidationPriceMult(npc)));');
replaceOnce('window.__ENGINE_CORE_VERSION = "2026-10-17-014";', 'window.__ENGINE_CORE_VERSION = "2026-10-17-015";');
fs.writeFileSync(path.join(__dirname, 'cyoaftw-engine-CORE.js'), core);
console.log('Prepared leave-room demand, expanded price eligibility and price effects.');
