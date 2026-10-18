const fs = require('node:fs'), path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8').replace(/\r\n/g, '\n');
const before = read('before/cyoaftw-engine-CORE.js'); let core = before;
function replace(a, b) { if (core.split(a).length !== 2) throw new Error('Expected one anchor: ' + a.slice(0, 100)); core = core.replace(a, b); }
function editFunction(name, fn) {
    const re = new RegExp('(?:async )?function ' + name + '\\('), match = re.exec(core);
    if (!match) throw new Error(name);
    const start = match.index, end = core.indexOf('\n}', start) + 2;
    if (end < start) throw new Error('Missing end: ' + name);
    core = core.slice(0, start) + fn(core.slice(start, end)) + core.slice(end);
}
replace('// END TEXT COMMANDS', read('forge-actions.js') + '\n' + read('forge-commands.js') + '\n// END TEXT COMMANDS');
replace('const TEXT_COMMANDS = [', 'const TEXT_COMMANDS = [\n    { id: "forge", forge: true, args: ["action", "target"], aliases: ["forge", "smith", "blacksmith"], example: "forge; show forge; sharpen dagger with plain; repair sword; engrave dagger as Quiet Mercy; scrap sword; treat armour; upgrade armour; refine grade 1; fuse relics; recolor boots; collect forge", description: "Talk or trade with a blacksmith, then use forge for sharpening, repairs, engraving, scrap, armour treatment/upgrades, ore refining, relic fusion and recolouring. Choose the item, then use <material> or choose a number. Engrave <weapon> as <name>, or name weapon <name> after selecting it. Paid/destructive work reviews costs and risks before numbered confirmation. Refine uses ALL visible ore of the chosen grade. Collect forge takes finished armour work. Options/back/cancel/leave work; later commands need explicit continue." },');
replace('    const crafting = typeof parseTextCraftCommand', '    const forging = typeof parseTextForgeCommand === "function" ? parseTextForgeCommand(raw) : null;\n    if (forging) return forging;\n    const crafting = typeof parseTextCraftCommand');
replace('    if (show && typeof textCraftShow', '    if (show && typeof textForgeShow === "function") { const forge = textForgeShow(key); if (forge) return forge; }\n    if (show && typeof textCraftShow');
replace('!def.crafting && !/^(back|cancel)', '!def.crafting && !def.forge && !/^(back|cancel)');
replace('        if (def.crafting &&', '        if (def.forge && forgeServiceBlock(G.activeNPC)) return false;\n        if (def.crafting &&');
replace('    if (def.crafting) return executeTextCraftCommand(action);', '    if (def.forge) return executeTextForgeCommand(action);\n    if (def.crafting) return executeTextCraftCommand(action);');
// The existing compact schema groups forge with other action/target commands.
replace('}; strings; intent; keep speech.\\n', '}; strings; keep speech.\\n');
replace('    if (menu && owned && /^craft-/', '    if (menu && owned && /^forge-/.test(menu.kind) && !forgeServiceBlock(menu.npc)) { return forgeMenu(menu.npc, "services"); }\n    if (menu && owned && /^craft-/');
replace('    if (!menu) return false;\n    if (/^craft-/', '    if (!menu) return false;\n    if (/^forge-/.test(menu.kind) && action && /^(forge|leave)$/.test(action.verb)) return true;\n    if (/^craft-/');
replace('async function textSharedChoiceInput(input, action) {\n    const menu = sharedChoiceState.menu;', 'async function textSharedChoiceInput(input, action) {\n    const menu = sharedChoiceState.menu;\n    if (menu && /^forge-/.test(menu.kind) && action && /^(forge|leave)$/.test(action.verb)) { await textForgeMenuInput(menu, action, input); return true; }');
// Replace presentation functions only; every consequence remains native.
const renderers = {
    renderForgeServices: ['services'], renderForgeSharpenPicker: ['sharpen'], renderForgeTreatmentPicker: ['treatment', 'item'],
    renderForgeRepairPicker: ['repair'], renderForgeNameWeaponList: ['engrave'], renderForgeNamePicker: ['name', 'item'],
    renderForgeScrapPicker: ['scrap'], renderForgeArmourPicker: ['treat'], renderForgeArmourOrePicker: ['treat-material', 'item'],
    renderForgeUpgradeArmourPicker: ['upgrade'], renderForgeUpgradeOrePicker: ['upgrade-material', 'item'], renderForgeRefinePicker: ['refine'],
    renderForgeAnvilPicker: ['fuse'], renderForgeAnvilSecondPicker: ['fuse-material', 'first'], renderForgeRecolorPicker: ['recolor'], renderForgeRecolorPigmentPicker: ['recolor-material', 'item']
};
for (const [name, [view, arg]] of Object.entries(renderers)) editFunction(name, text => text.slice(0, text.indexOf('{') + 1) + '\n    return forgeMenu(npc, "' + view + '"' + (arg ? ', ' + arg : '') + ');\n}');
// Native candidate/consumption lists must share visibility rules with text.
for (const name of ['getForgeWeapons', 'getForgeMaterials', 'getForgeArmour', 'getArmourOres', 'getForgeUpgradeArmourPieces', 'getForgeRelics', 'getForgePigments', 'getForgeRecolorTargets']) {
    editFunction(name, text => text.replace(/return weapons;/g, 'return weapons.filter(isLootItemVisible);').replace(/return out;/g, 'return out.filter(isLootItemVisible);').replace(/return inv.filter\((.+)\);/g, 'return inv.filter($1).filter(isLootItemVisible);').replace(/return (\(G\.player[^\n]+)\.filter\((.+)\);/g, 'return $1.filter($2).filter(isLootItemVisible);'));
}
for (const name of ['getForgeRefineStacks', 'consumeRefineOreUnits']) editFunction(name, text => text.replace('if (!isRefinableOre(it))', 'if (!isLootItemVisible(it) || !isRefinableOre(it))').replace('return isRefinableOre(it) &&', 'return isLootItemVisible(it) && isRefinableOre(it) &&'));
// Commissions retain their native material selection, now excluding hidden entries.
editFunction('getCommissionOreCandidates', text => text.replace('i && isUpgradableOre(i)', 'isLootItemVisible(i) && isUpgradableOre(i)'));
editFunction('countCommissionMaterial', text => text.replace('if (!item) return sum;', 'if (!isLootItemVisible(item)) return sum;'));
editFunction('consumeCommissionMaterial', text => text.replace('i && isPotionItem(i)', 'isLootItemVisible(i) && isPotionItem(i)'));
const work = {
    attemptSharpen: ['sharpen', 'item', 'material'], attemptRepair: ['repair', 'item', 'rivet'], attemptNameWeapon: ['engrave', 'item', 'null', 'rawTitle'],
    attemptScrapWeapon: ['scrap', 'item'], attemptTreatArmour: ['treat', 'item', 'ore'], attemptUpgradeArmour: ['upgrade', 'item', 'ore'],
    collectForgeUpgrade: ['collect', 'null'], attemptRefineOre: ['refine', 'grade'], attemptFuseRelics: ['fuse', 'first', 'second'],
    attemptRecolourItem: ['recolor', 'item', 'pigment'], deliverForgeCommission: ['deliver', 'null']
};
for (const [name, args] of Object.entries(work)) editFunction(name, text => {
    const at = text.indexOf('{');
    let body = text.slice(at + 1, -1);
    if (name === 'attemptFuseRelics') body = body.replace('    renderForgeServices(npc);\n\n    const choice = (await', '    const choice = (await');
    if (name === 'attemptUpgradeArmour') {
        // Store the committed escrow on the original player before ticking time.
        body = body.replace('    advanceStoryTurn(1);\n    G.player.forgeUpgrade = {', '    work.player.forgeUpgrade = {');
        body = body.replace('        turnsLeft: turns\n    };', '        turnsLeft: turns\n    };\n    const escrow = work.player.forgeUpgrade;\n    work.commit();\n    advanceStoryTurn(1);\n    if (work.player.forgeUpgrade === escrow) escrow.turnsLeft = turns;\n    if (!work.valid()) return endForgeWork(work, true);');
    } else body = body.replace(/(^[ \t]*)advanceStoryTurn\(1\);/gm, '$1work.commit();\n$1advanceStoryTurn(1);\n$1if (!work.valid()) return endForgeWork(work, true);');
    for (const anchor of ['    const fused = buildFusedRelicItem', '    item.color = newColour;']) body = body.replace(anchor, '    if (!work.valid()) return endForgeWork(work, true);\n' + anchor);
    // Release before native menu refresh; async fusion has no intermediate menu.
    body = body.replace(/(^[ \t]*)renderStats\(\);/gm, '$1endForgeWork(work);\n$1renderStats();');
    body = body.replace(/(^[ \t]*)(renderForge\w+\(npc[^\n]*\);)/gm, '$1endForgeWork(work);\n$1$2');
    const specArgs = ['"' + args[0] + '"', 'npc', ...args.slice(1)].join(', ');
    return text.slice(0, at + 1) + '\n    const spec = forgeActionSpec(' + specArgs + ');\n    if (spec.reason) return sharedChoiceResult("blocked", spec.reason);\n    const work = captureForgeWork(npc, [' + args.slice(1).join(', ') + ']);\n    try {' + body + '\n    } finally { endForgeWork(work); }\n}';
});
replace('// Core Engine Version: 2026-10-18-013', '// Core Engine Version: 2026-10-18-014');
replace('window.__ENGINE_CORE_VERSION = "2026-10-18-013";', 'window.__ENGINE_CORE_VERSION = "2026-10-18-014";');
replace('// Latest:', '// Latest: Shared forge services, text commands, guarded work and cost confirmations.\n// Previous:');
for (const [from, to] of [['function chooseChatOption(option)', 'window.chooseChatOption = chooseChatOption;'], ['function disengageFromNPC(', 'function npcLeavesAfterRebuffedAdvance('], ['function examineRoomObject(', 'function collectBodyLoot('], ['function chooseNPCAction(', '// ── COMPANION EQUIPMENT']]) {
    const slice = text => text.slice(text.indexOf(from), text.indexOf(to, text.indexOf(from)));
    if (slice(core) !== slice(before)) throw new Error('Protected routing changed: ' + from);
}
const oldHTML = read('before/cyoaftw-engine-CORE.html'), html = oldHTML.replaceAll('2026-10-18-013', '2026-10-18-014');
const scripts = text => text.match(/<script\s+src="[^\"]+"[^>]*><\/script>/g);
if (JSON.stringify(scripts(html)) !== JSON.stringify(scripts(oldHTML))) throw new Error('Script tags changed');
for (const [name, text] of [['cyoaftw-engine-CORE.js', core], ['cyoaftw-engine-CORE.html', html]]) fs.writeFileSync(path.join(__dirname, name), text.replace(/\n/g, '\r\n'));
const browserHeader = read('browser-crafting.cjs').split('\n').slice(0, 19).join('\n');
fs.writeFileSync(path.join(__dirname, 'browser-forge.cjs'), browserHeader + '\n' + read('browser-forge-flows.js'));
console.log('Built forge 014 from installed 013.');
