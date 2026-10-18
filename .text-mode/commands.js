// Text commands are a presentation/input layer. Game rules remain in the engine.
// Session-only state: never save pending commands or clarification references.
const textModeState = {
    enabled: false, busy: false, parsing: false, epoch: 0, queue: [], pending: null,
    paused: false, capture: null, dialogue: null,
    history: [], historyIndex: 0, draft: "", events: [], sessionPlayer: null, choices: null
};
const TEXT_COMMAND_LIMIT = 12;
const TEXT_INPUT_LIMIT = 600;
const TEXT_COMMANDS = [
    { id: "help", args: ["topic"], aliases: ["how", "help"], example: "how; how talk; how do I talk", description: "Ask for commands or examples. Help costs no turn." },
    { id: "look", aliases: ["look", "look around", "look around the room", "l"], example: "look", room: true, description: "Look around the room. Uses the normal Look around action and turn cost." },
    { id: "glance", args: ["direction"], aliases: ["glance", "peek"], example: "glance north", room: true, description: "Peek through an exit. Type glance alone to choose a direction." },
    { id: "move", args: ["direction"], aliases: ["go", "move", "walk", "head"], example: "north; go northwest; up", room: true, description: "Travel through an exit. Short directions such as n and nw work too." },
    { id: "npcs", aliases: ["npcs", "who", "who is here", "who's here", "people"], example: "who is here", description: "List the visible creatures in their room order, with species and gender." },
    { id: "talk", args: ["target"], aliases: ["talk", "talk to", "speak to"], example: "talk to dwarf; talk to second dwarf; talk to dwarf female", description: "Start talking to a visible NPC. Use a known name, species, gender, or ordinal. Ambiguous targets prompt for a number." },
    { id: "say", args: ["text"], aliases: ["say", "reply", "respond"], example: 'say "Where is the inn?"', description: 'Speak to the NPC you are talking with. Quote speech containing commands: say "go north and find the guard".' },
    { id: "options", aliases: ["options", "topics"], example: "options; choose 2", description: "List the current conversation choices, then choose a number. Choices are checked again before being used." },
    { id: "choose", args: ["number"], aliases: ["choose"], example: "choose 2", description: "Pick a numbered conversation option from the most recent options list." },
    { id: "leave", aliases: ["leave", "goodbye", "bye", "step away", "leave conversation"], example: "leave", description: "Step away from the current NPC. Use a direction to leave the room." },
    { id: "rest", aliases: ["rest"], example: "rest", room: true, interact: "rest", description: "Use the normal Rest action, including recovery, time, and danger checks." },
    { id: "sleep", aliases: ["sleep"], example: "sleep", room: true, interact: "sleep", description: "Use the normal Sleep action when a suitable bed is available." },
    { id: "status", aliases: ["status", "health", "stats"], example: "status", description: "Read your health, stamina, mana, and coins. Costs no turn." },
    { id: "stop", aliases: ["stop", "cancel"], example: "stop", description: "Cancel pending commands. An action already in progress finishes normally." },
    { id: "continue", aliases: ["continue", "resume"], example: "continue", description: "Explicitly resume the remaining commands after a pause. A failed action is not retried." }
];

function textCommandDefinition(id) {
    return TEXT_COMMANDS.find(function (entry) { return entry.id === id; });
}

function textCommandNormalize(value) {
    return String(value || "").toLowerCase().replace(/[’]/g, "'").replace(/[^a-z0-9'\s-]/g, " ").replace(/-/g, " ").replace(/\s+/g, " ").trim();
}

function textCommandDirection(value) {
    const key = textCommandNormalize(value).replace(/\s/g, "");
    const dirs = { n: "N", north: "N", ne: "NE", northeast: "NE", e: "E", east: "E", se: "SE", southeast: "SE", s: "S", south: "S", sw: "SW", southwest: "SW", w: "W", west: "W", nw: "NW", northwest: "NW", u: "U", up: "U", d: "D", down: "D" };
    return dirs[key] || null;
}

function textCommandUnquote(value) {
    const text = String(value || "").trim();
    if (/^"[\s\S]*"$/.test(text) || /^“[\s\S]*”$/.test(text) || /^'[\s\S]*'$/.test(text)) return text.slice(1, -1).trim();
    return text;
}

// Split only outside quoted speech. Apostrophes inside words are not quotes.
function splitTextCommands(input) {
    const text = String(input || "").replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
    const parts = [];
    let quote = "", start = 0;
    for (let i = 0; i < text.length; i++) {
        const ch = text.charAt(i);
        if (quote) {
            const contraction = quote === "'" && /\w/.test(text.charAt(i - 1)) && /\w/.test(text.charAt(i + 1));
            if (ch === quote && text.charAt(i - 1) !== "\\" && !contraction) quote = "";
            continue;
        }
        if (ch === '"' || (ch === "'" && (i === 0 || /\s/.test(text.charAt(i - 1))))) { quote = ch; continue; }
        const separator = /^[,;\n]+\s*(?:(?:and\s+)?then\s+|and\s+)?|^\s+(?:and\s+then|then|and)\s+/i.exec(text.slice(i));
        if (!separator) continue;
        const part = text.slice(start, i).trim();
        if (part) parts.push(part);
        i += separator[0].length - 1;
        start = i + 1;
    }
    if (quote) return { error: "Close the quotation marks around your speech before sending." };
    const tail = text.slice(start).trim();
    if (tail) parts.push(tail);
    return { parts: parts };
}

function parseTextCommand(input) {
    const original = String(input || "").trim();
    const raw = original.replace(/[.!?]+$/, "").trim();
    const key = textCommandNormalize(raw);
    let match = /^(?:how(?:\s+(?:do|can)\s+i)?|help)(?:\s+(?:to\s+)?(.+))?$/i.exec(raw);
    if (match) return { verb: "help", args: { topic: match[1] || "" } };
    match = /^choose\s+(\d+)$/i.exec(raw);
    if (match) return { verb: "choose", args: { number: match[1] } };
    if (/^(?:"[\s\S]*"|“[\s\S]*”|'[\s\S]*')$/.test(raw)) return { verb: "say", args: { text: textCommandUnquote(raw) } };
    match = /^(?:say|reply|respond)\s+([\s\S]+)$/i.exec(original);
    if (match) return { verb: "say", args: { text: textCommandUnquote(match[1]) } };
    match = /^(?:talk\s+to|speak\s+to|talk)(?:\s+(.+))?$/i.exec(raw);
    if (match) return { verb: "talk", args: { target: match[1] || "" } };
    match = /^(?:glance|peek)(?:\s+(?:to\s+)?(?:the\s+)?(.+))?$/i.exec(raw);
    if (match) return { verb: "glance", args: { direction: match[1] || "" } };
    match = /^(?:go|move|walk|head)(?:\s+(?:to\s+)?(?:the\s+)?(.+))?$/i.exec(raw);
    if (match) return { verb: "move", args: { direction: match[1] || "" } };
    const direction = textCommandDirection(raw);
    if (direction) return { verb: "move", args: { direction: direction } };
    const entry = TEXT_COMMANDS.find(function (def) { return def.aliases.indexOf(key) >= 0; });
    return entry ? { verb: entry.id, args: {} } : null;
}

function parseTextCommandBatch(input) {
    if (String(input).length > TEXT_INPUT_LIMIT) return { error: "Please keep commands under " + TEXT_INPUT_LIMIT + " characters." };
    const split = splitTextCommands(input);
    if (split.error) return split;
    if (!split.parts.length) return { error: "Type a command, or how for examples." };
    if (split.parts.length > TEXT_COMMAND_LIMIT) return { error: "Use at most " + TEXT_COMMAND_LIMIT + " actions at once." };
    const actions = split.parts.map(parseTextCommand);
    if (actions.some(function (action) { return !action; })) return { unresolved: true };
    if (actions.length > 1 && actions.some(function (action) { return /^(help|stop|continue)$/.test(action.verb); })) return { error: "Send how, stop, or continue on its own." };
    return { actions: actions };
}

function validateTextAIPlan(value) {
    if (!value || !Array.isArray(value.actions) || !value.actions.length || value.actions.length > TEXT_COMMAND_LIMIT) return null;
    const fields = Object.create(null);
    TEXT_COMMANDS.forEach(function (def) { if (!/^(stop|continue)$/.test(def.id)) fields[def.id] = def.args || []; });
    const actions = [];
    for (let i = 0; i < value.actions.length; i++) {
        const action = value.actions[i];
        if (!action || !Object.prototype.hasOwnProperty.call(fields, action.verb) || !action.args || typeof action.args !== "object" || Array.isArray(action.args)) return null;
        if (Object.keys(action).some(function (key) { return key !== "verb" && key !== "args"; })) return null;
        if (Object.keys(action.args).some(function (key) { return fields[action.verb].indexOf(key) < 0 || typeof action.args[key] !== "string" || action.args[key].length > TEXT_INPUT_LIMIT; })) return null;
        if (action.verb === "say" && !String(action.args.text || "").trim()) return null;
        if (action.verb === "choose" && !/^[1-9]\d*$/.test(action.args.number || "")) return null;
        if ((action.verb === "move" || action.verb === "glance") && !textCommandDirection(action.args.direction)) return null;
        actions.push({ verb: action.verb, args: Object.assign({}, action.args) });
    }
    if (actions.length > 1 && actions.some(function (action) { return action.verb === "help"; })) return null;
    return actions;
}

async function interpretTextCommands(input) {
    if (!aiAvailable()) return null;
    const schema = TEXT_COMMANDS.filter(function (def) { return !/^(stop|continue)$/.test(def.id); }).map(function (def) { return def.id + "{" + (def.args || []).join(",") + "}"; }).join(", ");
    const instruction = 'Map INPUT to ordered actions using VERBS. Return JSON only: {"actions":[{"verb":"...","args":{}}]}. Preserve quoted speech. Invent no actions or outcomes. If ANY part is unsupported or uncertain return {"actions":[]}.\nVERBS: ' + schema + '\nINPUT: ' + JSON.stringify(input);
    let timer;
    try {
        const result = await Promise.race([
            callAI({ instruction: instruction, endButtons: "none" }),
            new Promise(function (resolve) { timer = setTimeout(function () { resolve(null); }, 12000); })
        ]);
        const raw = typeof result === "string" ? result : result && result.text;
        if (!raw) return null;
        const clean = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
        return validateTextAIPlan(JSON.parse(clean));
    } catch (err) {
        console.warn("[Text commands] Interpretation unavailable", err);
        return null;
    } finally { clearTimeout(timer); }
}

// Semantic output events are independent of the on-screen renderer. A future
// speech presentation can consume these without reading labels or HTML.
function publishTextModeOutput(kind, text, details, display) {
    const event = Object.assign({ kind: kind, text: String(text || ""), source: "text-mode" }, details || {});
    if (!event.text) return;
    textModeState.events.push(event);
    if (textModeState.events.length > 100) textModeState.events.shift();
    if (typeof window.dispatchEvent === "function" && typeof CustomEvent === "function") window.dispatchEvent(new CustomEvent("cyoa:output", { detail: event }));
    if (display === false || !textModeState.enabled) return;
    const log = document.getElementById("textModeLogEl");
    if (!log) return;
    const line = document.createElement("div");
    line.className = "text-mode-line text-mode-" + kind;
    line.textContent = event.text;
    log.appendChild(line);
    while (log.children.length > 40) log.removeChild(log.firstChild);
    log.scrollTop = log.scrollHeight;
}

function textModeResult(status, text, details) {
    if (text) publishTextModeOutput(status === "needs_input" ? "choices" : "feedback", text, Object.assign({ status: status }, details || {}));
    return { status: status };
}

function textModeVisibleNPCs() {
    const room = G.activeRoom;
    return room && Array.isArray(room.creatures) ? room.creatures.filter(function (npc) {
        return npc && npc !== G.player && !npc.dead && isVisibleEntity(npc);
    }) : [];
}

function textModeNPCLabel(npc) {
    const name = typeof getNPCRoomSightName === "function" ? getNPCRoomSightName(npc) : npc.name;
    return (name || "creature") + " (" + [npc.gender, npc.species].filter(Boolean).join(" ") + ")";
}

function resolveTextNPCTarget(selector) {
    let query = textCommandNormalize(selector).replace(/^(?:the|a|an)\s+/, "");
    const ordinals = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10 };
    let ordinal = null;
    query = query.replace(/\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|\d+(?:st|nd|rd|th)?)\b/, function (word) { ordinal = ordinals[word] || parseInt(word, 10); return " "; });
    const tokens = query.trim().split(/\s+/).filter(Boolean);
    const visible = textModeVisibleNPCs();
    const matches = visible.filter(function (npc) {
        // Given names stay private until the existing engine reveals them.
        const words = textCommandNormalize([npc.name, npc.descriptorName, npc.species, npc.gender].join(" ")).split(" ");
        return tokens.every(function (token) { return words.indexOf(token) >= 0; });
    });
    if (ordinal !== null) return { matches: ordinal > 0 && ordinal <= matches.length ? [matches[ordinal - 1]] : [] };
    return { matches: matches };
}

function textModeHelp(topic) {
    let key = textCommandNormalize(topic).replace(/^(?:to|use)\s+/, "");
    const parsed = key ? parseTextCommand(key) : null;
    let entry = parsed && parsed.verb !== "help" ? textCommandDefinition(parsed.verb) : null;
    if (!entry && key) entry = TEXT_COMMANDS.find(function (def) { return def.aliases.some(function (alias) { return key === alias || key.indexOf(alias + " ") === 0; }); });
    if (entry) return textModeResult("completed", entry.description + "\nExamples: " + entry.example);
    if (key) return textModeResult("completed", "I don't have help for that yet. Type how to see the supported commands.");
    const combat = G.activeNPCMode === "combat";
    const ids = combat ? ["help", "status", "stop"] : ["look", "glance", "move", "npcs", "talk", "say", "options", "choose", "leave", "rest", "sleep", "status", "stop", "continue"];
    const entries = TEXT_COMMANDS.filter(function (def) {
        if (ids.indexOf(def.id) < 0) return false;
        if (def.room && textModeRoomBlock()) return false;
        if (/^(say|options|choose|leave)$/.test(def.id)) return !!G.activeNPC;
        if (def.id === "sleep") {
            const sleep = INTERACT_MENU_ACTIONS.find(function (action) { return action.id === "sleep"; });
            return sleep && sleep.visible(G.activeRoom);
        }
        return true;
    });
    const lines = entries.map(function (def) { return def.id + ": " + def.example; });
    return textModeResult("completed", (combat ? "Use the combat controls above for this fight.\n" : "Commands you can use:\n") + lines.join("\n") + '\nAsk how talk for examples. Combine actions with then, commas, or semicolons. Quote speech: say "Hello, how are you?".');
}

function textModeScene() {
    return { player: G.player, room: G.activeRoom, npc: G.activeNPC, mode: G.activeNPCMode };
}

function textModeSameScene(scene) {
    return scene.player === G.player && scene.room === G.activeRoom && scene.npc === G.activeNPC && scene.mode === G.activeNPCMode;
}

function textModeRoomBlock() {
    if (G.activeNPC) return "You are engaged with someone. Type leave before acting in the room.";
    if (G.activeObject) return "Close the current object interaction before acting in the room.";
    return "";
}

function textModeListOptions() {
    if (!G.activeNPC || !/^(talk|respond)$/.test(G.activeNPCMode)) return textModeResult("blocked", "Start a conversation with talk to <npc> first.");
    const options = getChatOptions(G.activeNPC);
    textModeState.choices = { scene: textModeScene(), options: options };
    return textModeResult("completed", options.length ? options.map(function (option, i) { return (i + 1) + ". " + option.label; }).join("\n") + "\nType choose followed by a number, or use say to speak." : "No conversation choices are available. You can use say or leave.");
}

function textModeInterruptReason() {
    if (!G.player || !G.activeRoom || G.player !== textModeState.sessionPlayer) return "The adventure changed. Pending commands have stopped.";
    if (G.player.dead || G.player.hp <= 0 || G.player.unconscious) return "You cannot continue while incapacitated.";
    if (G.activeNPCMode === "combat") return "A fight is in progress. Use the combat controls above; pending commands are paused.";
    if (G.activeItemModal || G.activeObject) return "Finish the open item or object interaction before continuing.";
    return "";
}

function textModeAsk(action, kind, options, message) {
    textModeState.pending = { action: action, kind: kind, options: options, scene: textModeScene() };
    return textModeResult("needs_input", message + "\n" + options.map(function (value, index) {
        return (index + 1) + ". " + (kind === "target" ? textModeNPCLabel(value) : value);
    }).join("\n") + "\nType a number, or stop to cancel.");
}

async function executeTextCommand(action) {
    const args = action.args || {};
    const def = textCommandDefinition(action.verb);
    if (!def) return textModeResult("blocked", "That command is not supported. Type how for examples.");
    if (action.verb === "help") return textModeHelp(args.topic);
    if (action.verb === "status") {
        const p = G.player;
        return textModeResult("completed", "Health: " + p.hp + "/" + p.hpMax + ". Stamina: " + p.stamina + "/" + p.staminaMax + (typeof p.mana === "number" ? ". Mana: " + p.mana + "/" + p.manaMax : "") + ". Coins: " + getCoinValue(p) + ".");
    }
    const interrupted = textModeInterruptReason();
    if (interrupted) return textModeResult("interrupted", interrupted);
    if (def.room) {
        const reason = textModeRoomBlock();
        if (reason) return textModeResult("blocked", reason);
    }
    if (action.verb === "npcs") {
        const npcs = textModeVisibleNPCs();
        return textModeResult("completed", npcs.length ? npcs.map(function (npc, i) { return (i + 1) + ". " + textModeNPCLabel(npc); }).join("\n") : "No visible creatures are here.");
    }
    if (action.verb === "move" || action.verb === "glance") {
        const dir = textCommandDirection(args.direction);
        const room = G.activeRoom;
        const dirs = action.verb === "glance" ? getGlanceAvailableDirections(room) : Object.keys(room.exits || {});
        if (!dir) {
            if (!dirs.length) return textModeResult("blocked", "There are no available directions for that here.");
            return textModeAsk(action, "direction", dirs, "Which direction?");
        }
        if (!room.exits || !room.exits[dir]) return textModeResult("blocked", "There is no exit " + dir + " here.");
        if (isExitLocked(room, dir)) return textModeResult("blocked", "The way " + dir + " is locked. Return to the room controls to deal with the door.");
        if (isExitCollapsed(room, dir)) return textModeResult("blocked", "The way " + dir + " is blocked by rubble.");
        if (action.verb === "glance") {
            const entry = INTERACT_MENU_ACTIONS.find(function (value) { return value.id === "glance"; });
            const reason = entry && entry.disabledReason(room);
            if (reason) return textModeResult("blocked", reason);
            if (dirs.indexOf(dir) < 0) return textModeResult("blocked", "You have already had a good look that way.");
            performGlance(dir);
            return { status: "completed" };
        }
        const before = G.player.coords;
        movePlayer(dir);
        return G.player.coords !== before ? { status: "completed" } : textModeResult("blocked", "You did not move. Remaining commands are paused.");
    }
    if (action.verb === "look") {
        examineCurrentRoom();
        return { status: "completed" };
    }
    if (def.interact) {
        const entry = INTERACT_MENU_ACTIONS.find(function (value) { return value.id === def.interact; });
        if (!entry || !entry.visible(G.activeRoom)) return textModeResult("blocked", "You cannot " + action.verb + " here.");
        const reason = entry.disabledReason(G.activeRoom);
        if (reason) return textModeResult("blocked", reason);
        entry.run(G.activeRoom);
        return { status: "completed" };
    }
    if (action.verb === "talk") {
        const matches = action.targetRef ? textModeVisibleNPCs().filter(function (npc) { return npc === action.targetRef; }) : resolveTextNPCTarget(args.target).matches;
        if (!matches.length) return textModeResult("blocked", "No visible NPC matches that description. Type who is here.");
        if (matches.length > 1) return textModeAsk(action, "target", matches, "Who do you mean?");
        const npc = matches[0];
        if (!canConverseWithNPC(npc)) return textModeResult("blocked", "That creature cannot converse with you.");
        if (G.activeNPC && G.activeNPC !== npc) return textModeResult("blocked", "Type leave before talking to someone else.");
        if (G.activeNPC !== npc) selectNPC(npc);
        if (G.activeNPC !== npc || G.activeNPCMode === "combat") return textModeResult("blocked", "You could not start that conversation.");
        chooseNPCAction("talk");
        textModeResult("completed", 'Talking with ' + textModeNPCLabel(npc) + '. Use say "Hello" to speak, options for topics, or leave to step away.');
        return { status: "completed" };
    }
    if (action.verb === "options") return textModeListOptions();
    if (action.verb === "choose") {
        const choices = textModeState.choices;
        const number = Number(args.number);
        if (!choices || !textModeSameScene(choices.scene)) return textModeResult("blocked", "Type options to list the current conversation choices first.");
        const selected = choices.options[number - 1];
        if (!selected || !Number.isInteger(number) || number < 1) return textModeResult("blocked", "Choose a number from the options list.");
        const current = getChatOptions(G.activeNPC).find(function (option) { return selected.id && option.id === selected.id; });
        if (!current || current.disabled) return textModeResult("blocked", "That choice is no longer available. Type options for the current choices.");
        textModeState.choices = null;
        await chooseChatOption(current);
        if ((current.action && !/^(disengage|respond)$/.test(String(current.action))) || (G.activeNPC && !/^(talk|respond|menu)$/.test(G.activeNPCMode))) return textModeResult("needs_input", "Choice selected. Pending commands are paused; finish any open interaction above before continuing.");
        return { status: "completed" };
    }
    if (action.verb === "say") {
        const npc = G.activeNPC;
        if (!npc || !/^(talk|respond|menu)$/.test(G.activeNPCMode) || !canConverseWithNPC(npc)) return textModeResult("blocked", "Start a conversation with talk to <npc> first.");
        const body = String(args.text || "").trim();
        if (!body || body.length > 240) return textModeResult("blocked", "Use say followed by up to 240 characters of speech.");
        if (G.activeNPCMode === "menu") chooseNPCAction("talk");
        await submitTypedResponse(npc, body);
        return { status: "completed" };
    }
    if (action.verb === "leave") {
        if (!G.activeNPC) return textModeResult("blocked", "You are already in the room view. Use a direction to move.");
        if (!/^(talk|respond|menu)$/.test(G.activeNPCMode)) return textModeResult("blocked", "Finish the current interaction using its controls first.");
        disengageFromNPC();
        return { status: "completed" };
    }
    return textModeResult("blocked", "Send that command on its own.");
}

// Explicit foreground tasks, separate from AI/background prefetch. The UI
// dialogue latch covers scripted guide sequences that complete via callbacks.
function textModeTrackTask(task) {
    if (textModeState.capture && task && typeof task.then === "function") textModeState.capture.push(task);
    return task;
}

function textModeDialogueBusy(busy) {
    if (!busy) {
        if (textModeState.dialogue) textModeState.dialogue.resolve();
        textModeState.dialogue = null;
    } else if (textModeState.capture && !textModeState.dialogue) {
        const latch = { scene: textModeScene() };
        const promise = new Promise(function (resolve) { latch.resolve = resolve; });
        textModeState.dialogue = latch;
        textModeState.capture.push(promise);
    }
}

async function runTextCommandQueue() {
    if (textModeState.busy || textModeState.parsing || !textModeState.enabled) return;
    textModeState.busy = true;
    textModeState.paused = false;
    const epoch = textModeState.epoch;
    try {
        while (textModeState.enabled && epoch === textModeState.epoch && textModeState.queue.length) {
            const reason = textModeInterruptReason();
            if (reason && !/^(help|status)$/.test(textModeState.queue[0].verb)) { textModeResult("interrupted", reason); textModeState.paused = true; break; }
            const action = textModeState.queue.shift();
            textModeState.capture = [];
            renderTextModeStatus("Doing: " + action.verb);
            const result = await executeTextCommand(action);
            // Tasks can enqueue another task as they complete. Drain by index.
            for (let i = 0; i < textModeState.capture.length; i++) await textModeState.capture[i];
            textModeState.capture = null;
            if (epoch !== textModeState.epoch) break;
            if (result.status !== "completed") { textModeState.paused = true; break; }
            const after = textModeInterruptReason();
            if (after) { textModeResult("interrupted", after); textModeState.paused = true; break; }
            if (G.activeNPC && G.activeNPC.memory && G.activeNPC.memory.pendingResponse && G.activeNPC.memory.pendingResponse.needed && textModeState.queue.length && !/^(say|options|choose)$/.test(textModeState.queue[0].verb)) {
                textModeResult("needs_input", 'They are waiting for your answer. Use say "..."; pending actions are paused.');
                textModeState.paused = true;
                break;
            }
        }
    } catch (err) {
        console.error("[Text commands] Action failed", err);
        textModeState.paused = true;
        textModeResult("blocked", "That action could not finish. Pending commands are paused; type stop to cancel them.");
    } finally {
        textModeState.capture = null;
        textModeDialogueBusy(false);
        textModeState.busy = false;
        renderTextModeStatus();
        focusTextModeInput();
    }
}

function stopTextCommands(announce) {
    textModeState.epoch++;
    textModeState.queue = [];
    textModeState.pending = null;
    textModeState.choices = null;
    textModeState.paused = false;
    if (announce) textModeResult("completed", textModeState.busy ? "Pending commands cancelled. The current action will finish." : "Pending commands cancelled.");
    renderTextModeStatus();
}

async function submitTextModeCommand(raw) {
    const input = String(raw || "").trim();
    if (!input || !textModeState.enabled) return;
    const single = parseTextCommand(input);
    if (single && single.verb === "stop") { stopTextCommands(true); return; }
    if (single && single.verb === "help") { textModeHelp(single.args.topic); return; }
    if (textModeState.busy || textModeState.parsing) { textModeResult("blocked", "An action is still finishing. You can type how or stop while you wait."); return; }
    if (single && single.verb === "continue") {
        if (textModeState.pending) { textModeResult("needs_input", "Answer the numbered question first, or type stop."); return; }
        if (!textModeState.queue.length) { textModeResult("completed", "There are no pending commands."); return; }
        return runTextCommandQueue();
    }
    if (textModeState.pending && (/^\d+$/.test(input) || (textModeState.pending.kind === "direction" && textCommandDirection(input)))) {
        const pending = textModeState.pending;
        if (!textModeSameScene(pending.scene)) { stopTextCommands(false); textModeResult("blocked", "The scene changed. Please repeat your command."); return; }
        const pick = /^\d+$/.test(input) ? pending.options[Number(input) - 1] : textCommandDirection(input);
        if (!pick || pending.options.indexOf(pick) < 0) { textModeResult("needs_input", "Choose one of the listed numbers, or stop."); return; }
        if (pending.kind === "target") pending.action.targetRef = pick;
        else pending.action.args.direction = pick;
        textModeState.pending = null;
        textModeState.queue.unshift(pending.action);
        return runTextCommandQueue();
    }
    const local = parseTextCommandBatch(input);
    if (local.error) { textModeResult("blocked", local.error); return; }
    if (textModeState.queue.length || textModeState.pending) {
        stopTextCommands(false);
        textModeResult("completed", "The new command replaces the paused commands.");
    }
    const scene = textModeScene();
    const epoch = textModeState.epoch;
    let actions = local.actions;
    publishTextModeOutput("command", "> " + input);
    if (local.unresolved) {
        textModeState.parsing = true;
        renderTextModeStatus("Interpreting your command...");
        try { actions = await interpretTextCommands(input); }
        finally { textModeState.parsing = false; renderTextModeStatus(); }
        if (!textModeState.enabled || epoch !== textModeState.epoch) return;
        if (!textModeSameScene(scene)) { textModeResult("blocked", "The scene changed while interpreting. Please repeat your command."); return; }
    }
    if (!actions) { textModeResult("blocked", 'I could not understand that. Try how, or say "..." when speaking to an NPC.'); return; }
    // A batch is interpreted in full before any action is allowed to run.
    textModeState.queue = actions;
    return runTextCommandQueue();
}

function renderTextModeStatus(message) {
    const el = document.getElementById("textModeStatusEl");
    if (el) el.textContent = message || (textModeState.parsing ? "Interpreting your command..." : textModeState.busy ? "Finishing the current action..." : textModeState.pending ? "Waiting for your choice" : textModeState.paused && textModeState.queue.length ? "Paused: " + textModeState.queue.length + " pending. Type continue or stop." : "Ready");
    const stop = document.getElementById("textModeStopBtn");
    if (stop) stop.hidden = !(textModeState.busy || textModeState.parsing || textModeState.queue.length || textModeState.pending);
}

function focusTextModeInput() {
    if (!textModeState.enabled || G.activeItemModal) return;
    const input = document.getElementById("textModeInputEl");
    if (input) input.focus({ preventScroll: true });
}

function syncTextModeView() {
    if (textModeState.enabled && textModeState.sessionPlayer && textModeState.sessionPlayer !== G.player) {
        textModeState.enabled = false;
        stopTextCommands(false);
    }
    const dialogue = textModeState.dialogue;
    if (dialogue && (dialogue.scene.player !== G.player || dialogue.scene.room !== G.activeRoom || dialogue.scene.npc !== G.activeNPC || G.activeNPCMode === "combat")) textModeDialogueBusy(false);
    const game = document.getElementById("gameWrapper");
    if (game) game.classList.toggle("text-mode-active", textModeState.enabled);
    const dock = document.getElementById("textModeEl");
    if (dock) dock.hidden = !textModeState.enabled;
    renderTextModeStatus();
}

function setTextMode(enabled) {
    if (enabled && (!G.player || !G.activeRoom)) return;
    textModeState.enabled = !!enabled;
    if (enabled) {
        initializeTextMode();
        textModeState.sessionPlayer = G.player;
        syncTextModeView();
        if (!textModeState.events.length) textModeResult("completed", 'Text mode ready. Type how for commands. Use say "..." for dialogue.');
        focusTextModeInput();
    } else {
        stopTextCommands(false);
        syncTextModeView();
        if (G.activeRoom) setExitGridVisible(!G.activeNPC && !G.activeObject);
        const toggle = document.getElementById("textModeToggleBtn");
        if (toggle && !G.activeNPC) toggle.focus();
    }
}

function initializeTextMode() {
    const input = document.getElementById("textModeInputEl");
    const form = document.getElementById("textModeFormEl");
    if (!input || !form || form.dataset.textModeWired) return;
    form.dataset.textModeWired = "true";
    form.addEventListener("submit", function (event) {
        event.preventDefault();
        const raw = input.value.trim();
        if (!raw || event.isComposing) return;
        // Keep a command in the box when the engine cannot accept it yet.
        const parsed = parseTextCommand(raw);
        if ((textModeState.busy || textModeState.parsing) && !(parsed && /^(help|stop)$/.test(parsed.verb))) { submitTextModeCommand(raw); return; }
        input.value = "";
        textModeState.history.push(raw);
        if (textModeState.history.length > 50) textModeState.history.shift();
        textModeState.historyIndex = textModeState.history.length;
        textModeState.draft = "";
        submitTextModeCommand(raw);
    });
    input.addEventListener("keydown", function (event) {
        event.stopPropagation();
        if (event.isComposing && event.key === "Enter") { event.preventDefault(); return; }
        if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
        event.preventDefault();
        if (textModeState.historyIndex === textModeState.history.length) textModeState.draft = input.value;
        textModeState.historyIndex = Math.max(0, Math.min(textModeState.history.length, textModeState.historyIndex + (event.key === "ArrowUp" ? -1 : 1)));
        input.value = textModeState.historyIndex === textModeState.history.length ? textModeState.draft : textModeState.history[textModeState.historyIndex];
    });
    // Prevent a second UI action interleaving with a foreground command. Stop
    // and return controls in the dock remain available during that command.
    document.addEventListener("click", function (event) {
        if (!textModeState.busy && !textModeState.parsing) return;
        const target = event.target;
        if (!target || !target.closest || target.closest("#textModeEl")) return;
        if (target.closest("#gameWrapper") && target.closest("button, a, input, select")) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    }, true);
    syncTextModeView();
}

window.setTextMode = setTextMode;
window.submitTextModeCommand = submitTextModeCommand;
window.stopTextCommands = stopTextCommands;
// END TEXT COMMANDS
