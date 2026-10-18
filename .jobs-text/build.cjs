const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, file), 'utf8').replace(/\r\n/g, '\n');
function once(text, before, after) { if (text.split(before).length !== 2) throw new Error('Expected one match: ' + before.slice(0, 100)); return text.replace(before, after); }
function edit(text, from, to, fn) { const a = text.indexOf(from), b = text.indexOf(to, a); if (a < 0 || b <= a) throw new Error('Missing ' + from); return text.slice(0, a) + fn(text.slice(a, b)) + text.slice(b); }
const before = read('before/cyoaftw-engine-CORE.js');
let core = edit(before, '// Text commands are a presentation/input layer.', '// END TEXT COMMANDS', () => ['commands.js', 'combat-commands.js', 'inventory-commands.js', 'trade-commands.js', 'loot-commands.js', 'exploration-commands.js', 'choice-actions.js', 'party-commands.js', 'jobs-commands.js'].map(file => read(file).replace('// END TEXT COMMANDS', '')).join('\n') + '\n');
core = once(core, 'Core Engine Version: 2026-10-18-009', 'Core Engine Version: 2026-10-18-010');
core = once(core, 'window.__ENGINE_CORE_VERSION = "2026-10-18-009";', 'window.__ENGINE_CORE_VERSION = "2026-10-18-010";');
core = once(core, '// Latest: Shared typed/button', '// Latest: Jobs, quests and trophy text actions; shared job board and work choices.\n// Previous: Shared typed/button');
// The guildhall uses a different fixture ID from street notice boards.
core = once(core, '(f.id === "notice-board" || f.id === "notice-post")', '(f.id === "notice-board" || f.id === "notice-post" || f.id === "job-board")');
core = once(core, 'function openFixtureCard(fixture, cardOptions) {', 'function openFixtureCard(fixture, cardOptions) {\n    if (fixture && fixture.id === "job-board" && getVisibleRoomFixtures(G.activeRoom).indexOf(fixture) >= 0) { openJobBoard(G.activeRoom); return; }');
core = once(core, 'function createJobBoardWindow(room, title, description, message) {', 'function createJobBoardWindow(room, title, description, message) {\n    if (typeof textModeState !== "undefined" && textModeState.enabled) return createTextJobBoardWindow(room, title, description, message);');
core = once(core, 'function returnFromJobBoard(room) {', 'function returnFromJobBoard(room) {\n    if (typeof textModeState !== "undefined" && textModeState.enabled) { returnToRoomView(); return; }');
// Register explicitly authored actions; typed input never discovers buttons by scraping.
for (const [from, to, kind, anchor, title, npc, refresh] of [
    ['function renderJobBoard(', 'function takeBoardJob(', 'jobs-board', '    function heading(text) {', '"Job postings"', 'null', 'function () { renderJobBoard(room); }'],
    ['function showJobBoardPosting(', 'function renderJobBoard(', 'jobs-posting', '    const job = getActiveJob();', 'title + " — " + text', 'null', 'function () { renderJobBoard(room); }']
]) {
    core = edit(core, from, to, text => {
        text = once(text, anchor, '    const sharedMenu = typeof beginJobChoiceMenu === "function" ? beginJobChoiceMenu("' + kind + '", ' + npc + ', ' + title + ', ' + refresh + ') : null;\n' + anchor);
        text = text.replace(/addJobBoardPosting\(/g, 'postingButton(').replace(/addJobBoardWindowButton\(/g, 'boardButton(');
        text = once(text, '    const sharedMenu =', '    const boardButton = function (parent, label, run, reason, meta) { return jobChoiceButton(sharedMenu, parent, label, run, reason, meta); };\n    const postingButton = function (parent, label, description, run, meta) { return jobPostingButton(sharedMenu, parent, label, description, run, meta); };\n    const sharedMenu =');
        if (kind === 'jobs-board') {
            text = once(text, 'showJobBoardPosting(room, posting, null); });', 'showJobBoardPosting(room, posting, null); }, { action: "read", name: JOB_TYPES[posting.type].label, category: "job" });');
            text = once(text, 'showJobBoardPosting(room, null, quest); });', 'showJobBoardPosting(room, null, quest); }, { action: "read", name: quest.title, category: "quest" });');
            text = once(text, 'handInQuest(quest.id, true);\n            });', 'handInQuest(quest.id, true);\n            }, { action: "handin", name: quest.title, category: "quest" });');
            text = once(text, 'closeItemModal(); openQuestLog(); });', 'closeItemModal(); openQuestLog(); }, "", { action: "log" });');
            text = once(text, 'returnFromJobBoard(room); });', 'returnFromJobBoard(room); }, "", { action: "back" });');
        } else {
            text = once(text, '    }, reason);', '    }, reason, { action: "accept", name: title, category: quest ? "quest" : "job" });');
            text = once(text, 'renderJobBoard(room); });', 'renderJobBoard(room); }, "", { action: "back" });');
        }
        return once(text, '    if (card.close) card.close.focus();', '    if (sharedMenu) { sharedMenu.preserveView = !card.root; publishSharedChoiceMenu(sharedMenu, card.root || document.getElementById("itemModal")); }\n    if (card.close) card.close.focus();');
    });
}
for (const [from, to, kind, anchor, title, npc, refresh] of [
    ['function renderJobMenu()', 'function getJobSleepBlockReason(', 'jobs-work', '    const buttons = [];', 'describeJobStatus(job)', 'null', 'function () { renderJobMenu(); }'],
    ['function renderQuestLog()', '// NPC side:', 'jobs-log', '    const buttons = [];', 'describeQuestLog()', 'null', 'function () { renderQuestLog(); }'],
    ['function showWorkMenu(', '// ── trophies', 'jobs-npc', '    function addBtn(', '"Work and bounties: " + getEntityName(npc)', 'npc', 'function () { showWorkMenu(npc); }']
]) {
    core = edit(core, from, to, text => {
        text = text.replace(/createCombatButton\(/g, 'sharedButton(');
        const binding = (kind === 'jobs-work' ? '    lapseJobDayIfNeeded(job, null);\n' : '') + '    const sharedMenu = typeof beginJobChoiceMenu === "function" ? beginJobChoiceMenu("' + kind + '", ' + npc + ', ' + title + ', ' + refresh + ') : null;\n    const sharedButton = function (label, run, opts) { return sharedMenu ? createSharedChoiceButton(sharedMenu, label, run, opts) : createCombatButton(label, run, opts); };\n';
        text = once(text, anchor, binding + anchor);
        if (kind === 'jobs-work') {
            text = once(text, '() => continueJobNextDay()', '() => continueJobNextDay(), { textChoice: { action: "work" } }');
            text = once(text, '() => collectJobPay(true)))', '() => collectJobPay(true), { textChoice: { action: "collect" } }))');
            text = once(text, '{ disabled: !!block, title: block || describeJobPay(def) }', '{ disabled: !!block, title: block || describeJobPay(def), textChoice: { action: "work" } }');
            text = once(text, '{ disabled: !!sleepBlock, title: sleepBlock || "Sleep through the night. You wake rested, and can carry on or take your pay." }', '{ disabled: !!sleepBlock, title: sleepBlock || "Sleep through the night. You wake rested, and can carry on or take your pay.", textChoice: { action: "sleep" } }');
            text = once(text, 'title: "Take the wages you have earned and finish for now."', 'textChoice: { action: "collect" }, title: "Take the wages you have earned and finish for now."');
            text = once(text, 'returnToRoomView(); saveGameState(); })', 'returnToRoomView(); saveGameState(); }, { textChoice: { action: "back" } })');
        } else if (kind === 'jobs-log') {
            text = once(text, 'setNarration(describeQuestLog()); }));', 'setNarration(describeQuestLog()); }, { textChoice: { action: "handin", name: q.title, category: "quest" } }));');
            text = once(text, '{ className: "danger" }', '{ className: "danger", textChoice: { action: "abandon", name: q.title, category: "quest" } }');
            text = once(text, 'returnToRoomView(); })', 'returnToRoomView(); }, { textChoice: { action: "back" } })');
        } else {
            text = once(text, 'function addBtn(label, onClick, cls) {', 'function addBtn(label, onClick, cls, meta) {\n        if (sharedMenu) { el.appendChild(sharedButton(label, onClick, { className: cls || "kind-action", textChoice: meta || {} })); return; }');
            text = once(text, '    if (t.turnIn) addBtn("Hand in the trophies you were asked for", function () { turnInQuestToNPC(npc); done(); });', '    if (t.turnIn) getReadyQuestsFor(npc).forEach(function (q) { addBtn("Hand in: " + q.title, function () { handInQuest(q.id, false); done(); }, "", { action: "handin", name: q.title, category: "quest" }); });');
            text = once(text, 'collectJobPayFromNPC(npc); done(); });', 'collectJobPayFromNPC(npc); done(); }, "", { action: "collect" });');
            text = once(text, 'acceptJobFromNPC(npc, typeId); done(); });', 'acceptJobFromNPC(npc, typeId); done(); }, "", { action: "accept", name: JOB_TYPES[typeId].label, category: "job" });');
            text = once(text, 'acceptQuestFromNPC(npc, i); done(); });', 'acceptQuestFromNPC(npc, i); done(); }, "", { action: "accept", name: getQuestOfferFor(npc, i).title, category: "quest" });');
            text = once(text, '}, "kind-exit");', '}, "kind-exit", { action: "back" });');
        }
        const close = text.lastIndexOf('}');
        return text.slice(0, close) + '    if (sharedMenu) publishSharedChoiceMenu(sharedMenu, el);\n' + text.slice(close);
    });
}
core = edit(core, 'function abandonQuest(', 'function describeQuestLog(', text => once(text, '    saveGameState();', '    if (typeof publishTextModeOutput === "function") publishTextModeOutput("quest", "Bounty abandoned: " + q.title + ". Town standing falls by " + QUEST_ABANDON_STANDING + ".", { quest: { title: q.title, action: "abandon", standingLoss: QUEST_ABANDON_STANDING } });\n    saveGameState();'));
core = edit(core, 'function performJobShift()', 'function findJobGiver(', text => once(text, '    advanceStoryTurn(def.turns);', '    advanceStoryTurn(def.turns);\n    if (G.player !== player || G.activeRoom !== room || getActiveJob() !== job || player.hp <= 0 || player.dead || player.unconscious || roomHasActiveHostile(room)) {\n        const message = "Work was interrupted after time and effort were spent. No shift or wages were added.";\n        setNarration(message); saveGameState(); return { status: "interrupted", message: message };\n    }'));
core = edit(core, 'function cutTrophyFromBody(', 'function appendTrophyActions(', text => {
    text = once(text, '    const player = G.player;', '    const player = G.player, room = G.activeRoom;\n    const source = room && room.items;');
    return once(text, '    advanceStoryTurn(1);', '    advanceStoryTurn(1);\n    if (G.player !== player || G.activeRoom !== room || room.items !== source || source.indexOf(body) < 0 || !isVisibleEntity(body) || player.dead || player.hp <= 0 || player.unconscious || roomHasActiveHostile(room) || body._trophyTaken) { setNarration("Trophy collection was interrupted. Time and any mana were spent, but no trophy was taken."); saveGameState(); return false; }');
});
let html = read('before/cyoaftw-engine-CORE.html').replaceAll('2026-10-18-009', '2026-10-18-010');
const scripts = text => text.match(/<script\s+src="[^\"]+"[^>]*><\/script>/g);
if (JSON.stringify(scripts(html)) !== JSON.stringify(scripts(read('before/cyoaftw-engine-CORE.html')))) throw new Error('Script tags changed');
for (const [from, to] of [['function chooseChatOption(option)', 'window.chooseChatOption = chooseChatOption;'], ['function disengageFromNPC(', 'function npcLeavesAfterRebuffedAdvance('], ['function examineRoomObject(', 'function collectBodyLoot('], ['function chooseNPCAction(', '// ── COMPANION EQUIPMENT']]) {
    const slice = text => text.slice(text.indexOf(from), text.indexOf(to, text.indexOf(from)));
    if (slice(core) !== slice(before)) throw new Error('Protected routing changed: ' + from);
}
for (const [file, value] of [['cyoaftw-engine-CORE.js', core], ['cyoaftw-engine-CORE.html', html]]) fs.writeFileSync(path.join(__dirname, file), value.replace(/\n/g, '\r\n'));
console.log('Built jobs and quests engine/shell 010.');
