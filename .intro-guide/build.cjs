const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const read = p => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
function once(source, old, value) {
    if (source.split(old).length !== 2) throw new Error('Expected one match: ' + old.slice(0, 100));
    return source.replace(old, value);
}
function section(source, from, to, value) {
    const start = source.indexOf(from), end = source.indexOf(to, start);
    if (start < 0 || end <= start) throw new Error('Missing section: ' + from);
    return source.slice(0, start) + value + '\n\n' + source.slice(end);
}
function write(name, content) { fs.writeFileSync(path.join(root, name), content.replace(/\n/g, '\r\n')); }

let world = read(path.join(root, 'before/cyoaftw-world-data.js'));
world = once(world, 'const GUIDE_TALK_CHECKIN = [', read(path.join(root, 'care-data.js')) + '\n\nconst GUIDE_TALK_CHECKIN = [');
world = section(world, '// beatId -> { lines:', '// ── OPENING SCENE', read(path.join(root, 'talk-beats.js')));
world = once(world, 'window.getGuideTalkBeat = getGuideTalkBeat;', 'window.getGuideTalkBeat = getGuideTalkBeat;\n    window.matchGuideCheckinReply = matchGuideCheckinReply;');
world = once(world, '"Follow my lead", say: "I want to follow my lead."', '"Ask about my lead", say: "Where can I start looking?"');
world = once(world, `    exile: {\n        friendly: '"Then we keep it quiet. What do you need first?"',\n        guarded: '"You do not have to trust me on my word. Decide for yourself how much to tell anyone."',\n        hostile: '"Alright. I will not come with you unless you ask."'`, `    exile: {\n        friendly: '"Then we keep it quiet. What do you need first?"',\n        guarded: '"I cannot promise you will be safe. You can choose how much to tell anyone here."',\n        hostile: '"I hear you. How you face them is your choice. I can help you prepare if you ask."'`);
world = once(world, `        friendly: '"Then we can start there. Do you need anything before you go?"',\n        guarded: '"You do not have to decide what it means yet. We can take one step and see."'`, `        friendly: '"I cannot tell you what it means for you. We can ask at the shrine, if you want."',\n        guarded: '"Yes. You can turn back. You do not owe the shrine an answer."'`);
// Clear, literal practical advice; the old pools added proverbs to directions.
world = section(world, 'const GUIDE_TALK_STRONG = [', '// The blessing, said as the guide parts.', `const GUIDE_TALK_STRONG = [
    '\\"The trainers at {guildPlace} sell lessons. You can practise in the yard for free.\\"',
    '\\"Try {guildPlace}. Lessons cost coin, but practice in the yard is free.\\"'
];
const GUIDE_TALK_COIN = [
    '\\"Check the notice boards in the tavern, the inn, or the town hall. Innkeepers and cooks also hire hands.\\"',
    '\\"Ask an innkeeper or a cook about work, or read a notice board. Bounties pay when you bring proof.\\"'
];`.replace(/\\"/g, '"'));
world = once(world, 'v2026-10-17-003 ── Shop name', 'v2026-10-17-004 ── Player-led guide check-ins and bounded intro delivery. Previous: Shop name');
world = once(world, 'window.WORLD_DATA_VERSION = "2026-10-17-003";', 'window.WORLD_DATA_VERSION = "2026-10-17-004";');

let core = read(path.join(root, 'before/cyoaftw-engine-CORE.js'));
core = once(core, 'function playGuideGreeting(npc, pieces, done) {', 'function playGuideGreeting(npc, pieces, done, isCurrent) {');
core = once(core, '        if (index > 0 && (G.activeNPC !== npc || G.activeNPCMode !== "talk")) return;', '        if ((typeof isCurrent === "function" && !isCurrent()) || G.activeNPC !== npc || G.activeNPCMode !== "talk") return;');
core = once(core, 'setTimeout(done, getChatTypingDurationMs("left", npc.name, text, opts) + GUIDE_REPLY_PAUSE_MS);', 'setTimeout(function () { if (typeof isCurrent !== "function" || isCurrent()) done(); }, getChatTypingDurationMs("left", npc.name, text, opts) + GUIDE_REPLY_PAUSE_MS);');
core = once(core, 'function startGuideArrival() {', read(path.join(root, 'reply-queue.js')) + '\n\nfunction startGuideArrival() {');
core = once(core, '    if (!bs || !room) return false;\n    const npc = spawnGuideNPC(room, bs);', '    if (!bs || !bs.guide || bs.guide.state !== "pending" || !room) return false;\n    const npc = spawnGuideNPC(room, bs);');
core = section(core, '    // The guide speaks first. The opening line is scripted', '    if (typeof recordNPCConversationChoice === "function") {\n        recordNPCConversationChoice(npc, { id: "greet-guide-opening"', `    const talk = typeof window.getGuideTalkBeat === "function"
        ? window.getGuideTalkBeat("checkin", bs, { hpFrac: getPlayerHpFraction(), relation: spec.relation })
        : { lines: [getGuideOpeningLine(bs)], replies: spec.replies };
    G.activeNPCMode = "talk";
    queueGuideReply(npc, "checkin", talk, "");`);
core = once(core, '    npc.memory.pendingResponse = { needed: true, options: talk && talk.replies ? talk.replies : spec.replies.map(function (r) { return Object.assign({}, r); }) };', '    npc.memory.pendingResponse = { needed: true, options: talk.replies || [] };');
core = section(core, 'function handleGuideTalk(', '// ── GUIDE LIVE STATE', read(path.join(root, 'handle-talk.js')));
core = once(core, 'const GUIDE_PHRASE_TIMEOUT_MS = 9000;', 'const GUIDE_PHRASE_TIMEOUT_MS = 2500;');
core = section(core, '// Terms a rephrased line must keep:', '// True while the guide still owes', read(path.join(root, 'delivery.js')));
core = once(core, '    const base = "- You are the player\'s guide, "', '    let base = "- You are the player\'s guide, "');
core = once(core, '    let live = [];\n    try { live = getGuideLiveStateLines(npc); }', `    base += " Reply to what the player actually said before offering advice. One useful response per turn; no automatic briefing, repeat greeting, proverb, consolation speech, or claim that you know how they feel. Do not invent shared memories, observations, threats, supplies, healing, travel or promises of safety. Offer only help the game supports; the player chooses whether you accompany them.";
    if (npc.guide.playerConcern) base += " The player's last stated need was: " + npc.guide.playerConcern + ". Respect it until they change direction; time passing does not mean they recovered or consented.";
    let live = [];
    try { live = getGuideLiveStateLines(npc); }`);
core = once(core, '        npc.guide.lastTurn = nowTurn;', '        npc.guide.lastTurn = nowTurn;\n        npc.guide.conversationRun = (npc.guide.conversationRun || 0) + 1;');
core = once(core, '    const npc = G.activeNPC;\n    \n    // Debug: Log conversation action selection', '    const npc = G.activeNPC;\n    if (npc && npc.guide) _guideReplySequence += 1;\n    \n    // Debug: Log conversation action selection');
core = once(core, `            if (!useAIEnabled()) return options.filter(function (o) { return !(o && o.id === "respond-free"); });
            return withCannedReplyOptions(npc, options);`, `            const withReplies = withCannedReplyOptions(npc, options);
            if (!useAIEnabled()) return withReplies.filter(function (o) { return !(o && o.id === "respond-free"); });
            return withReplies;`);
core = once(core, '    if (at < 0) return options; // menu is restricted (e.g. mid-encounter): add nothing', '    const scriptedGuideReplies = !useAIEnabled() && npc.guide && npc.guide.active && G.activeNPCMode === "talk" && pending.options.every(function (o) { return o && (o.guideTalk || o.guideParty); });\n    if (at < 0 && !scriptedGuideReplies) return options; // ordinary restricted menus stay restricted\n    const insertAt = at < 0 ? 0 : at;');
core = once(core, '    return options.slice(0, at).concat(canned, options.slice(at));', '    return options.slice(0, insertAt).concat(canned, options.slice(insertAt));');
core = once(core, '        const guideTopic = window.matchGuideTopic(body);', `        const checkinBeat = getGuideTypedCheckinBeat(npc, body);
        if (checkinBeat && handleGuideTalk(npc, checkinBeat, choice)) return;
        const guideTopic = window.matchGuideTopic(body);`);
core = section(core, 'function handleGuideAnswer(', 'window.showGuideQuestionMenu =', read(path.join(root, 'handle-answer.js')));
core = once(core, '"Greeted them as " + spec.relation + " and asked if they were hurt."', '"Found them and checked how they were holding up."');
core = section(core, '// ── GUIDE LIVE STATE, INFLECTION AND PHRASING', 'const GUIDE_PHRASE_TIMEOUT_MS =', `// ── GUIDE LIVE STATE AND DELIVERY ───────────────────────────────
// Real health, story events, known history and the player's stated need inform
// the guide's voice. Intro facts and progression stay authored; AI can only
// select a complete approved delivery. Ordinary conversation uses the same
// live context and listening rules through getGuideContextLine.
`);
core = section(core, '    addChatMessage("player", "You", \'You say, "I should be going."\'', '// Called at the end of movePlayer: the player walked off', `    const playerLine = 'You say, "I should be going."';
    addChatMessage("player", "You", playerLine, { mode: "narration", animate: true });
    if (npc.memory) npc.memory.pendingResponse = null;
    G.activeNPCMode = "talk";
    queueGuideReply(npc, "parting", beat, playerLine);
    return true;
}`);
({ world, core } = require('./origins.cjs')(world, core));
write('cyoaftw-world-data.js', world);
write('cyoaftw-engine-CORE.js', core);
console.log('Built intro guide engine and world data.');
