const fs = require('node:fs'), path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8').replace(/\r\n/g, '\n');
const before = read('before/cyoaftw-engine-CORE.js'); let core = before;
function replace(text, a, b) { if (text.split(a).length !== 2) throw new Error('Expected one anchor: ' + a.slice(0,100)); return text.replace(a,b); }
function once(a,b) { core = replace(core,a,b); }
function edit(from,to,fn) { const a=core.indexOf(from),b=core.indexOf(to,a+from.length); if(a<0||b<=a)throw new Error(from); core=core.slice(0,a)+fn(core.slice(a,b))+core.slice(b); }
once('// END TEXT COMMANDS', read('craft-actions.js')+'\n'+read('craft-commands.js')+'\n// END TEXT COMMANDS');
once('const TEXT_COMMANDS = [', 'const TEXT_COMMANDS = [\n    { id: "craft", crafting: true, args: ["action", "target"], aliases: ["craft", "alchemy", "crafting", "brew"], example: "alchemy; show recipes; brew healing salve; mash greenwort; mix; add greenwort; simmer; start mix; bottle mixture; poisons", description: "Use a visible alchemy table for known recipes, plant preparation or a queued experiment. Brew <known recipe>, prepare/cut/mince/mash <plant>, mix, add <ingredient>, boil/stir/simmer/extract, undo mix, clear mix and start mix. Brewing asks a numbered confirmation with ingredients, stamina and turns. Show recipes/ingredients/mix/bowl is informational. Bottle, taste, dab, drink mixture, dip <item>, discard bowl, and name mixture <name> use native bowl rules. Poisons opens its bench, including known brews, experiment, antitoxin and coating. Options/choose/back/cancel work; continue resumes later commands explicitly." },');
once('    const reading = typeof parseTextReadingCommand', '    const crafting = typeof parseTextCraftCommand === "function" ? parseTextCraftCommand(raw) : null;\n    if (crafting) return crafting;\n    const reading = typeof parseTextReadingCommand');
once('    if (show && typeof textReadingShow', '    if (show && typeof textCraftShow === "function") { const craft = textCraftShow(key); if (craft) return craft; }\n    if (show && typeof textReadingShow');
once('&& !def.reading && !/^(back|cancel)', '&& !def.reading && !def.crafting && !/^(back|cancel)');
once('        if (def.reading && !def.info && (textModeInCombat()', '        if (def.crafting && !textCraftAvailable()) return false;\n        if (def.reading && !def.info && (textModeInCombat()');
once('    if (def.reading || action.verb === "read")', '    if (def.crafting) return executeTextCraftCommand(action);\n    if (def.reading || action.verb === "read")');
once('    if (menu && owned && menu.kind === "reading"', '    if (menu && owned && /^craft-/.test(menu.kind) && !craftSceneBlock()) { menu.refresh(); return sharedChoiceState.menu ? { status: "needs_input" } : textModeResult("blocked", "Repeat the crafting command."); }\n    if (menu && owned && menu.kind === "reading"');
once('    if (!menu) return false;\n    if (menu.kind === "reading"', '    if (!menu) return false;\n    if (/^craft-/.test(menu.kind) && action && (action.verb === "craft" || action.verb === "leave")) return true;\n    if (menu.kind === "reading"');
once('async function textSharedChoiceInput(input, action) {\n    const menu = sharedChoiceState.menu;', 'async function textSharedChoiceInput(input, action) {\n    const menu = sharedChoiceState.menu;\n    if (menu && /^craft-/.test(menu.kind) && action && (action.verb === "craft" || action.verb === "leave")) { await textCraftMenuInput(menu, action); return true; }');
// The same visibility and table selection rules serve buttons and commands.
once('room.structural.filter(isAlchemyTableFixture)[0]', 'getVisibleRoomFixtures(room).filter(function (f) { return isLootItemVisible(f) && isAlchemyTableFixture(f); })[0]');
edit('function getInventoryIngredientItems(', 'function countAlchemyIngredient(', t => t.replace('isAlchemyIngredientItem(it) &&', 'isLootItemVisible(it) && isAlchemyIngredientItem(it) &&'));
edit('function getAlchemyOwnedEntries()', 'function consumeAlchemyRaw(', t => t.replace('if (!isAlchemyIngredientItem(it))', 'if (!isLootItemVisible(it) || !isAlchemyIngredientItem(it))'));
edit('function countPoisonIngredient(', 'function consumePoisonIngredient(', t=>t.replace('if (!it) return;', 'if (!isLootItemVisible(it)) return;'));
edit('function consumePoisonIngredient(', 'function findPoisonRecipeFor(', t=>replace(t, 'const item = findPlayerItemById(id);', 'const item = (G.player.inventory || []).find(function (it) { const base = String(it && it.id || "").toLowerCase(); return isLootItemVisible(it) && (base === id || base.indexOf(id + "-") === 0); });'));
once('return inv.filter(isPoisonVialItem);', 'return inv.filter(function (item) { return isLootItemVisible(item) && isPoisonVialItem(item); });');
once('return inv.filter(isPoisonRecipeNote);', 'return inv.filter(function (item) { return isLootItemVisible(item) && isPoisonRecipeNote(item); });');
once('return it && getHerbKey(it) === "greenwort";', 'return isLootItemVisible(it) && getHerbKey(it) === "greenwort";');
once('return it && /^empty-vial/.test(String(it.id || ""));', 'return isLootItemVisible(it) && /^empty-vial/.test(String(it.id || ""));');
once('Recipes (click to make)', 'Recipes (review before brewing)');
once('    if (fixture.id === "job-board") lines.push("jobs — view job postings and bounties");', '    if (fixture.id === "job-board") lines.push("jobs — view job postings and bounties");\n    if (isAlchemyTableFixture(fixture)) lines.push("alchemy — recipes, preparation and experiments; show ingredients; show bowl");');
// Instrument explicitly authored callbacks. No DOM/button-label parsing at runtime.
const intent = (body, action, target='""', key='""') => 'craftIntent(function () { '+body+' }, "'+action+'", '+target+', '+key+')';
function renderer(from,to,kind,title,refresh,anchor,fn) {
    edit(from,to,t=>{
        t=fn(t).replace(/createCombatButton\(/g,'craftButton(');
        const binding='    const craftMenu = beginCraftMenu("'+kind+'", '+title+', '+refresh+');\n    const craftButton = function (label, run, opts) { return createCraftButton(craftMenu, label, run, opts); };\n';
        t=replace(t,anchor,binding+anchor);
        // Early-return prep picker needs publication before returning.
        t=t.replace('        setNarration("Pick a plant to prepare.");\n        return;', '        setNarration("Pick a plant to prepare.");\n        publishCraftMenu(craftMenu, el);\n        return;');
        const end=t.lastIndexOf('}'); return t.slice(0,end)+'    publishCraftMenu(craftMenu, el);\n'+t.slice(end);
    });
}
renderer('function openAlchemyMenu(', '// The narration the bowl', 'alchemy', '"Alchemy recipes and work"', 'function () { openAlchemyMenu(); }', '    // Click a recipe', t=>{
    t=replace(t,'function () { attemptAlchemyRecipe(id); }',intent('return quoteCraft("recipe", { id: id });','brew','r.name','id'));
    t=replace(t,'function () { startAlchemyProcess(steps, true); }',intent('return quoteCraft("process", { steps: steps, autoPrep: true });','brew','d.playerName || "Untitled " + d.vial + " mixture"','sig'));
    t=replace(t,'function () { openAlchemyNameMenu(sig); }',intent('openAlchemyNameMenu(sig);','name','"the " + d.vial + " mixture"','sig'));
    for(const [body,action] of [['openAlchemyPrepMenu(null);','prepare'],['openAlchemyQueueMenu();','mix'],['openPoisonMenu();','poisons'],['closeInteractMenu();','back']])t=replace(t,'function () { '+body+' }',intent(body,action));
    for(const [body,action] of [['drinkFromAlchemyBowl(fixture);','drink'],['probeAlchemyBowl(fixture, "skin");','dab'],['probeAlchemyBowl(fixture, "taste");','taste'],['collectFromAlchemyBowl(fixture);','bottle']])t=replace(t,'function () { '+body+' openAlchemyMenu(__lastAlchemyNarration()); }',intent('return runCraftBowlAction(fixture, function () { return '+body+' });',action));
    t=replace(t,'function () { openFixtureCard(fixture, { mode: "dip" }); }',intent('openCraftDipMenu(fixture);','dip'));
    return replace(t,'function () { pourOutAlchemyBowl(fixture); openAlchemyMenu(__lastAlchemyNarration()); }',intent('return quoteCraft("discard", {});','discard'));
});
renderer('function openAlchemyPrepMenu(', 'function getAlchemyPrepBlock(', 'prep', 'base ? "Prepare " + getAlchemyBaseDef(base).name : "Choose a plant"', 'function () { openAlchemyPrepMenu(base); }', '    if (!base) {', t=>{
    t=replace(t,'function () { openAlchemyPrepMenu(k); }',intent('openAlchemyPrepMenu(k);','plant','def.name','k'));
    t=replace(t,'function () { prepareAlchemyPlant(base, id); }',intent('return prepareAlchemyPlant(base, id);','idPLACEHOLDER','def.name','base')).replace('"idPLACEHOLDER"','id');
    t=t.replace('function () { openAlchemyMenu(); }',intent('openAlchemyMenu();','back'));
    return t.replace('function () { openAlchemyPrepMenu(null); }',intent('openAlchemyPrepMenu(null);','back'));
});
renderer('function openAlchemyQueueMenu(', 'function openAlchemyIngredientPicker(', 'queue', '"Process: " + describeAlchemyQueue(alchemyQueue)', 'function () { openAlchemyQueueMenu(); }', '    const startBlock =', t=>{
    t=replace(t,'    const startBlock =', '    claimCraftDraft();\n    const startBlock =');
    for(const [body,action] of [['openAlchemyIngredientPicker();','ingredient'],['openAlchemyActionPicker();','action'],['alchemyQueue.pop(); openAlchemyQueueMenu();','undo'],['alchemyQueue = []; openAlchemyQueueMenu();','clear'],['alchemyQueue = []; openAlchemyMenu();','back']])t=replace(t,'function () { '+body+' }',intent(body,action));
    return replace(t,'function () { startAlchemyProcess(alchemyQueue.map(function (s) { return Object.assign({}, s); }), false); }',intent('return quoteCraft("process", { steps: alchemyQueue.map(function (s) { return Object.assign({}, s); }), autoPrep: false });','start'));
});
renderer('function openAlchemyIngredientPicker()', 'function openAlchemyActionPicker()', 'ingredients', '"Choose an ingredient"', 'function () { openAlchemyIngredientPicker(); }', '    const buttons = [];', t=>{
    t=replace(t,'function () {\n            alchemyQueue.push({ t: "add", key: row.key, label: row.label });\n            openAlchemyQueueMenu();\n        }',intent('alchemyQueue.push({ t: "add", key: row.key, label: row.label }); openAlchemyQueueMenu();','add','row.label','row.key'));
    return replace(t,'function () { openAlchemyQueueMenu(); }',intent('openAlchemyQueueMenu();','back'));
});
renderer('function openAlchemyActionPicker()', '// ── FORAGING:', 'actions', '"Choose a process action"', 'function () { openAlchemyActionPicker(); }', '    const buttons =', t=>{
    t=replace(t,'function () { alchemyQueue.push({ t: "act", a: id }); openAlchemyQueueMenu(); }',intent('alchemyQueue.push({ t: "act", a: id }); openAlchemyQueueMenu();','idPLACEHOLDER','act.label','id')).replace('"idPLACEHOLDER"','id');
    return replace(t,'function () { openAlchemyQueueMenu(); }',intent('openAlchemyQueueMenu();','back'));
});
renderer('function openPoisonMenu()', '// Two-step picker:', 'poisons', '"Poison bench"', 'function () { openPoisonMenu(); }', '    if (rank >= ROGUE_POISON_MIN_RANK)', t=>{
    t=replace(t,'function () { attemptPoisonBrew(recipe.ingredients); }',intent('return quoteCraft("poison", { ids: recipe.ingredients.slice() });','brew','recipe.name','key'));
    t=replace(t,'function () { attemptAntitoxinBrew(); }',intent('return quoteCraft("antitoxin", {});','brew','"antitoxin"'));
    t=replace(t,'function () { openPoisonMixMenu(null); }',intent('openPoisonMixMenu(null);','poisonmix'));
    t=replace(t,'function () { studyPoisonRecipeNote(note); }',intent('return studyPoisonRecipeNote(note);','study','r.name'));
    t=replace(t,'function () { coatWeaponWithPoison(v.poisonKey); }',intent('return coatWeaponWithPoison(v.poisonKey);','coat','recipe.name','v.poisonKey'));
    return replace(t,'function () { closeInteractMenu(); }',intent('closeInteractMenu();','back'));
});
renderer('function openPoisonMixMenu(', 'function studyPoisonRecipeNote(', 'poison-mix', 'first ? "Add to " + POISON_INGREDIENTS[first].name : "Choose a poison ingredient"', 'function () { openPoisonMixMenu(first); }', '    const owned =', t=>{
    t=replace(t,'function () {\n            if (first) attemptPoisonBrew([first, id]);\n            else openPoisonMixMenu(id);\n        }',intent('if (first) return quoteCraft("poison", { ids: [first, id] }); else openPoisonMixMenu(id);','add','def.name','id'));
    t=replace(t,'function () { attemptPoisonBrew([first]); }',intent('return quoteCraft("poison", { ids: [first] });','start'));
    return replace(t,'function () { openPoisonMenu(); }',intent('openPoisonMenu();','back'));
});
edit('function openAlchemyNameMenu(', '// Prep: pick a raw plant', ()=> 'function openAlchemyNameMenu(sig) { return openCraftNameMenu(sig); }\n\n');
edit('function dipItemInAlchemyBowl(', '// ── the work', t=>t.replace(/openFixtureCard\(fixture, \{ mode: "dip", message: (.+?) \}\);/g,'openCraftDipMenu(fixture, $1);'));
// Work guards live inside native actions, so normal and text controls share them.
edit('async function attemptAlchemyRecipe(', 'function getAlchemyStartBlockReason(', t=>{
    t=replace(t,'    const lines = [];','    const work = captureCraftWork();\n    const lines = [];');
    t=replace(t,'    advanceStoryTurn(3 + prepped * ALCHEMY_PREP_TURNS);','    work.commitCosts();\n    advanceStoryTurn(getCraftAlchemyTurns(0, prepped));\n    if (!work.valid()) return interruptCraftWork(work);');
    return replace(t,'    finishAlchemyWork(lines);','    finishCraftWork(work, { action: "brew", recipe: recipe.name, success: !!check.success });\n    finishAlchemyWork(lines);');
});
edit('async function startAlchemyProcess(', '// A tested process replayed', t=>{
    t=replace(t,'        await attemptAlchemyRecipe(recipe.id);\n        return;', '        return await attemptAlchemyRecipe(recipe.id);');
    t=replace(t,'    const lines = [];', '    const work = captureCraftWork();\n    const lines = [];');
    t=replace(t,'    advanceStoryTurn(Math.max(3, steps.length) + prepped * ALCHEMY_PREP_TURNS);','    work.commitCosts();\n    advanceStoryTurn(getCraftAlchemyTurns(steps.length, prepped));\n    if (!work.valid()) return interruptCraftWork(work);');
    t=replace(t,'{ check: check });','{ check: check, work: work });');
    t=replace(t,'    noteAlchemyIngredients(player, addKeys);','    if (!work.valid()) return interruptCraftWork(work);\n    noteAlchemyIngredients(player, addKeys);');
    return replace(t,'    finishAlchemyWork(lines);','    finishCraftWork(work, { action: "experiment", success: !!check.success, bowl: { colour: design.vial, smell: design.smell, doses: design.doses } });\n    finishAlchemyWork(lines);');
});
edit('async function getProcessDesign(', '// ── the vial', t=>replace(t,'    a.mixLog[sig] = design;', '    if (ctx && ctx.work && !ctx.work.valid()) return null;\n    a.mixLog[sig] = design;'));
for(const [from,to] of [
    ['function drinkFromAlchemyBowl(', 'function getAlchemyCollectBlockReason('],
    ['function collectFromAlchemyBowl(', '// A careful test:'],
    ['function probeAlchemyBowl(', 'function pourOutAlchemyBowl('],
    ['function pourOutAlchemyBowl(', 'function getAlchemyDipBlockReason('],
    ['function dipItemInAlchemyBowl(', '// ── the work'],
    ['function prepareAlchemyPlant(', '// Mix: queue']
]) edit(from,to,t=>{
    const mark=t.indexOf('    advanceStoryTurn(');if(mark<0)throw new Error(from);
    // Capture immediately before time: native costs/effects before this point stay committed.
    t=t.slice(0,mark)+'    const work = captureCraftWork();\n'+t.slice(mark);
    const end=t.indexOf('\n',t.indexOf('    advanceStoryTurn('));
    t=t.slice(0,end+1)+'    if (!work.valid()) return interruptCraftWork(work);\n'+t.slice(end+1);
    const name=from.slice('function '.length).split('(')[0];
    const action=name==='probeAlchemyBowl'?'mode === "skin" ? "dab" : "taste"':JSON.stringify({drinkFromAlchemyBowl:'drink',collectFromAlchemyBowl:'bottle',dipItemInAlchemyBowl:'dip',prepareAlchemyPlant:'prepare',pourOutAlchemyBowl:'discard'}[name]);
    return t.replace('    saveGameState();','    finishCraftWork(work, { action: '+action+' });\n    saveGameState();');
});
for(const [from,to,anchor] of [
    ['function attemptAntitoxinBrew()', 'function openPoisonMenu()', '    const dc ='],
    ['function attemptPoisonBrew(', 'function coatWeaponWithPoison(', '    const hints =']
]) edit(from,to,t=>{
    t=replace(t,'    const lines = [];','    const work = captureCraftWork();\n    const lines = [];');
    const i=t.indexOf(anchor); if(i<0)throw new Error(anchor);
    t=t.slice(0,i)+'    if (!work.valid()) return interruptCraftWork(work);\n'+t.slice(i);
    // These native actions spend time before consuming ingredients; original inventory is retained until the recheck.
    t=t.replace(/    renderStats\(\);/g, '    finishCraftWork(work, { action: "poison-work" });\n    renderStats();');
    return t;
});
once('// Core Engine Version: 2026-10-18-012','// Core Engine Version: 2026-10-18-013');
once('window.__ENGINE_CORE_VERSION = "2026-10-18-012";','window.__ENGINE_CORE_VERSION = "2026-10-18-013";');
once('// Latest:', '// Latest: Shared text alchemy/prep/process/poison menus, confirmations and guarded brewing.\n// Previous:');
for(const [from,to] of [['function chooseChatOption(option)','window.chooseChatOption = chooseChatOption;'],['function disengageFromNPC(','function npcLeavesAfterRebuffedAdvance('],['function examineRoomObject(','function collectBodyLoot('],['function chooseNPCAction(','// ── COMPANION EQUIPMENT']]) {
    const cut=s=>s.slice(s.indexOf(from),s.indexOf(to,s.indexOf(from))); if(cut(core)!==cut(before))throw new Error('Protected routing changed: '+from);
}
const old=read('before/cyoaftw-engine-CORE.html'),html=old.replaceAll('2026-10-18-012','2026-10-18-013');
const scripts=s=>s.match(/<script\s+src="[^\"]+"[^>]*><\/script>/g); if(JSON.stringify(scripts(html))!==JSON.stringify(scripts(old)))throw new Error('Script tags changed');
for(const [f,s] of [['cyoaftw-engine-CORE.js',core],['cyoaftw-engine-CORE.html',html]])fs.writeFileSync(path.join(__dirname,f),s.replace(/\n/g,'\r\n'));
console.log('Built crafting/alchemy 013 from installed 012.');
