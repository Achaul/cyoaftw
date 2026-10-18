// Jobs use native consequences and explicitly registered native menu callbacks.
function beginJobChoiceMenu(kind, npc, title, refresh) {
    const menu = beginSharedChoiceMenu(kind, npc, title, refresh);
    const valid = menu.valid, player = G.player, room = G.activeRoom;
    const job = getActiveJob(), qs = ensureQuestState(), active = qs.active.slice();
    const site = job && getJobSiteRoom(job);
    const topics = npc ? JSON.stringify(getNPCWorkTopics(npc)) : "";
    const offers = npc ? getNPCWorkTopics(npc).jobs.map(function (type) { return { type: type, site: resolveJobSite(type, room, npc) }; }) : [];
    const boards = Object.keys(qs.boards).map(function (key) { const board = qs.boards[key]; return { key: key, board: board, list: board.list, members: board.list.slice() }; });
    const stamp = JSON.stringify([job, qs]), turn = getCurrentStoryTurn(), tier = getPortalTier();
    const npcStamp = JSON.stringify(npc && [npc.role, npc.buildingId, npc.hostility, npc.memory && npc.memory.favorability]);
    const fixtures = getVisibleRoomFixtures(room).slice();
    const postings = kind === "jobs-board" || kind === "jobs-posting" ? getBoardJobPostings(room) : [];
    menu.valid = function () {
        if (!valid() || isPlayerJailed() || getCurrentStoryTurn() !== turn || getPortalTier() !== tier || getActiveJob() !== job || ensureQuestState() !== qs || JSON.stringify([job, qs]) !== stamp) return false;
        if (active.length !== qs.active.length || active.some(function (q) { return qs.active.indexOf(q) < 0; })) return false;
        if (job && getJobSiteRoom(job) !== site) return false;
        if (npc && (JSON.stringify(getNPCWorkTopics(npc)) !== topics || offers.some(function (entry) { const now = resolveJobSite(entry.type, room, npc); return !now || !entry.site || now.room !== entry.site.room || now.dir !== entry.site.dir || now.alt !== entry.site.alt; }))) return false;
        if (boards.some(function (entry) { const current = qs.boards[entry.key]; return current !== entry.board || current.list !== entry.list || entry.members.some(function (q) { return current.list.indexOf(q) < 0; }); })) return false;
        if (fixtures.some(function (fixture) { return getVisibleRoomFixtures(room).indexOf(fixture) < 0; })) return false;
        if (postings.length) {
            const current = getBoardJobPostings(room);
            if (current.length !== postings.length || postings.some(function (p) { return !current.some(function (q) { return p.type === q.type && p.site.room === q.site.room && p.site.dir === q.site.dir && p.site.alt === q.site.alt; }); })) return false;
        }
        return G.player === player && (!npc || jobGiverIsAvailable(npc) && JSON.stringify([npc.role, npc.buildingId, npc.hostility, npc.memory && npc.memory.favorability]) === npcStamp);
    };
    return menu;
}

function createTextJobBoardWindow(room, title, description, message) {
    closeItemModal();
    const root = document.getElementById("chatOptionsEl");
    if (!root) return null;
    root.innerHTML = "";
    // The typed presentation lives in semantic output, leaving the input visible
    // on narrow screens. The registered callbacks also power the normal modal.
    const view = document.createElement("div"); view.hidden = true; root.appendChild(view);
    const heading = document.createElement("p"); heading.textContent = title + "\n" + description + (message ? "\n" + message : ""); view.appendChild(heading);
    const contents = document.createElement("div"), actions = document.createElement("div");
    view.appendChild(contents); view.appendChild(actions);
    publishTextModeOutput("jobs", heading.textContent, { view: "board", title: title });
    return { root: root, contents: contents, actions: actions, close: null };
}

function jobChoiceButton(menu, parent, label, run, reason, meta) {
    if (!menu) return addJobBoardWindowButton(parent, label, run, reason);
    const button = createSharedChoiceButton(menu, label, run, { disabled: !!reason, title: reason || "", textChoice: meta || {} });
    styleBoardWindowButton(button); parent.appendChild(button); return button;
}

function jobPostingButton(menu, parent, label, description, run, meta) {
    if (!menu) return addJobBoardPosting(parent, label, description, run);
    return jobChoiceButton(menu, parent, label + " — " + description, run, "", meta);
}

function parseTextJobsCommand(raw) {
    let match = /^(jobs?|job board|job postings|view job postings|bounties|quests?|quest log|journal)(?:\s+(?:with|from)\s+(.+))?$/i.exec(raw);
    if (match) return { verb: /^(bount|quest|journal)/i.test(match[1]) ? "quests" : "jobs", args: { target: textCommandUnquote(match[2] || "") } };
    if (/^look\s+(?:at\s+)?(?:the\s+)?job board$/i.test(raw)) return { verb: "jobs", args: {} };
    match = /^(?:accept|take)\s+(job|quest|bounty)(?:\s+(.+))?$/i.exec(raw);
    if (match) return { verb: /^job$/i.test(match[1]) ? "jobs" : "quests", args: { action: "accept", target: textCommandUnquote(match[2] || "") } };
    match = /^(?:hand\s+in|turn\s+in)(?:\s+(?:quest|bounty|trophies))?(?:\s+(.+))?$/i.exec(raw);
    if (match) return { verb: "quests", args: { action: "handin", target: textCommandUnquote(match[1] || "") } };
    match = /^(?:abandon|quit)\s+(quest|bounty|job)(?:\s+(.+))?$/i.exec(raw);
    if (match) return { verb: /^job$/i.test(match[1]) ? "jobs" : "quests", args: { action: /^job$/i.test(match[1]) ? "collect" : "abandon", target: textCommandUnquote(match[2] || "") } };
    if (/^(?:work|work shift|do work|carry on working)$/i.test(raw)) return { verb: "jobs", args: { action: "work" } };
    if (/^(?:collect (?:pay|wages)|get paid)$/i.test(raw)) return { verb: "jobs", args: { action: "collect" } };
    match = /^(?:cut|take|collect)\s+(?:a\s+)?troph(?:y|ies)(?:\s+from\s+(.+?))?(?:\s+with\s+(.+))?$/i.exec(raw);
    if (match) return { verb: "trophy", args: { source: textCommandUnquote(match[1] || ""), ability: textCommandUnquote(match[2] || "") } };
    if (/^trophy$/i.test(raw)) return { verb: "trophy", args: {} };
    return null;
}

function textJobsShow(topic) {
    if (!/^(jobs?|quests?|bounties|journal|job board|job postings)$/.test(topic)) return null;
    const quests = ensureQuestState().active, job = getActiveJob();
    return textModeResult("completed", (job ? describeJobStatus(job) : "You have no active job.") + "\n" + describeQuestLog() + "\n" + (roomHasJobBoard(G.activeRoom) ? "Use jobs for local postings; accept job <name> or accept quest <name>. " : "Find a job board or ask a work giver. ") + "Use quests for your log, work for one shift, collect pay to take wages and stop the job, hand in quest <name>, or abandon quest <name>. During a conversation, jobs opens that NPC's offers. Cut trophy from <body> collects proof using a blade; add with <spell> for a learned cutting spell.", { jobs: { active: job ? { name: JOB_TYPES[job.type].label, site: getJobSiteName(job), owed: job.owed, day: job.day, shifts: job.shifts } : null }, quests: quests.map(function (q) { return { title: q.title, count: q.count, collected: countQuestTrophies(q), ready: isQuestReady(q), reward: q.reward.gold }; }) });
}

function textJobsChoiceMatches(menu, action) {
    const args = action.args || {}, category = action.verb === "quests" ? "quest" : "job";
    let choices = menu.options.filter(function (choice) { return choice.meta.action === args.action && (!choice.meta.category || choice.meta.category === category); });
    if (args.target) choices = textLootMatch(args.target, choices, function (choice) { return choice.meta.name || choice.label; });
    return choices;
}

async function textJobsSelect(menu, action, foreground) {
    if (foreground) {
        textModeState.busy = true; textModeState.paused = true; textModeState.capture = [];
        try {
            const result = await textJobsSelect(menu, action, false);
            for (let index = 0; index < textModeState.capture.length; index++) await textModeState.capture[index];
            return result;
        } finally { textModeState.capture = null; textModeState.busy = false; renderTextModeStatus(); focusTextModeInput(); }
    }
    let choices = textJobsChoiceMatches(menu, action);
    if (!choices.length && action.args.action === "accept" && menu.kind === "jobs-board") {
        choices = textJobsChoiceMatches(menu, { verb: action.verb, args: { action: "read", target: action.args.target } });
        if (choices.length === 1) {
            const result = await runSharedChoice(menu, choices[0]);
            if (result.status !== "completed") return result;
            menu = sharedChoiceState.menu;
            choices = menu ? textJobsChoiceMatches(menu, action) : [];
        }
    }
    if (choices.length !== 1) return textModeResult("needs_input", "Choose the exact action by number from options. No work, payment or quest change has been made.");
    return runSharedChoice(menu, choices[0]);
}

async function executeTextJobsCommand(action) {
    const args = action.args || {};
    if (action.verb === "trophy") return executeTextTrophyCommand(action);
    if (isPlayerJailed() || roomHasActiveHostile(G.activeRoom) || isRoomCollapsed(G.activeRoom)) return textModeResult("blocked", "You cannot deal with work or bounties here right now.");
    if (G.activeNPC) {
        if (!/^(menu|talk|respond)$/.test(G.activeNPCMode)) return textModeResult("blocked", "Finish this NPC interaction first.");
        if (args.target && !args.action && !resolveTextNPCTarget(args.target, [G.activeNPC]).matches.length) return textModeResult("blocked", "Leave this conversation before asking another NPC.");
        if (action.verb === "quests" && !args.action && !args.target) return textJobsShow("quests");
        showWorkMenu(G.activeNPC);
    } else if (args.target && !args.action) {
        const matches = resolveTextNPCTarget(args.target, textModeVisibleNPCs()).matches;
        if (matches.length !== 1) return textModeResult("blocked", "Talk to the intended work giver first, then type jobs.");
        if (!jobGiverIsAvailable(matches[0])) return textModeResult("blocked", "That work giver is unavailable.");
        selectNPC(matches[0]);
        if (G.activeNPC !== matches[0] || G.activeNPCMode === "combat") return textModeResult("interrupted", "That NPC is unavailable.");
        showWorkMenu(matches[0]);
    } else if (/^(work|collect)$/.test(args.action || "")) {
        if (!getActiveJob()) return textModeResult("blocked", "You have no active job. Type jobs to find work.");
        renderJobMenu();
    } else if (action.verb === "quests" && args.action !== "accept") openQuestLog();
    else {
        if (!roomHasJobBoard(G.activeRoom)) return textModeResult("blocked", "There is no job board here. Talk to a work giver and type jobs, or type show quests for progress.");
        openJobBoard(G.activeRoom);
    }
    const menu = sharedChoiceState.menu;
    if (!menu || !/^jobs-/.test(menu.kind)) return textModeResult("blocked", "No work menu is available.");
    if (!args.action) return { status: "needs_input" };
    const result = await textJobsSelect(menu, action, false);
    return result.status === "completed" && sharedChoiceState.menu ? { status: "needs_input" } : result;
}

async function executeTextTrophyCommand(action) {
    const block = textModeRoomBlock();
    if (block) return textModeResult("blocked", block);
    const args = action.args || {}, bodies = textLootSources().filter(function (entry) { return entry.kind === "body"; });
    const matches = args.source ? textLootMatch(args.source, bodies, function (entry) { return entry.label; }) : bodies;
    if (matches.length !== 1) return textModeResult("blocked", "Name one visible body: cut trophy from <body>. Type show loot for names.");
    const body = matches[0].source;
    let spell = null;
    if (args.ability) {
        const spells = getTrophyCutSpells().filter(function (id) { return textCommandNormalize(WIZARD_SPELLS[id].name) === textCommandNormalize(args.ability) || id === args.ability; });
        if (spells.length !== 1) return textModeResult("blocked", "That learned cutting spell is unavailable.");
        spell = spells[0];
    }
    const reason = getTrophyBlockReason(body, !!spell);
    if (reason) return textModeResult("blocked", reason);
    const scene = textModeScene();
    let ok = false;
    textLootRun(matches[0], function () { ok = cutTrophyFromBody(body, spell); });
    if (!textModeSameScene(scene)) return textModeResult("interrupted", "The scene changed while collecting proof. Pending commands are paused.");
    return ok ? { status: "completed" } : textModeResult("blocked", "The trophy could not be collected. Check the latest response.");
}
