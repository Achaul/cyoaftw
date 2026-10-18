// Context-specific vocabulary. The primary word is what help/show recommends;
// aliases and optional filler words are interpreted locally, without AI.
const TEXT_COMBAT_KEYWORDS = {
    attack: { primary: "attack", aliases: ["attack", "hit", "strike", "swing"] },
    use: { primary: "use", aliases: ["use", "cast", "perform"] },
    styles: {
        light: ["light", "lightly", "quick", "fast"], balanced: ["balanced", "normal", "standard"],
        heavy: ["heavy", "heavily", "hard", "strong"], precise: ["precise", "accurate", "aimed"]
    },
    parts: { head: ["head", "skull"], torso: ["torso", "body", "chest"], arms: ["arms", "arm"], legs: ["legs", "leg"] },
    abilities: {
        "second wind": ["second wind", "secondwind"], "defend": ["defend", "defence", "defense"],
        "guard": ["guard"], "counter": ["counter", "counterattack"], "escape": ["escape", "flee", "run away"],
        "talk them down": ["talk them down", "talk down", "deescalate"],
        "bandage wounds": ["bandage wounds", "bandage", "bandage myself"], "sneak attack": ["sneak attack", "backstab"]
    },
    filler: ["a", "an", "the", "with", "to", "at", "on", "in", "of", "their", "his", "her", "its", "them", "please", "using", "blow"]
};

function textModeInCombat() {
    return !!G.activeNPC && G.activeNPCMode === "combat";
}

function textCombatActions() {
    if (!G.activeNPC || typeof getCombatActionGroups !== "function") return [];
    const actions = [];
    getCombatActionGroups(G.activeNPC).forEach(function (group) {
        if (group.name === "Attack") return;
        group.actions.forEach(function (action) {
            if (/^(Step back|Study your spellbook to learn a spell|No spells copied yet|You have no spellbook)$/i.test(action.name)) return;
            actions.push(action);
        });
    });
    return actions;
}

function textCombatActionMatches(action, value) {
    const name = textCommandNormalize(action.name);
    const key = textCommandNormalize(value);
    const aliases = TEXT_COMBAT_KEYWORDS.abilities[name] || [name];
    return name === key || textCommandNormalize(action.primary) === key || aliases.indexOf(key) >= 0 || (action.aliases || []).some(function (alias) { return textCommandNormalize(alias) === key; });
}

function parseTextCombatCommand(raw) {
    const words = textCommandNormalize(raw).split(" ").filter(Boolean);
    if (!words.length) return null;
    if (/^(?:target|focus)(?:\s+(.+))?$/i.test(raw)) return { verb: "target", args: { target: raw.replace(/^(?:target|focus)\s*/i, "") } };
    if ((words[0] === TEXT_COMBAT_KEYWORDS.use.primary || TEXT_COMBAT_KEYWORDS.use.aliases.indexOf(words[0]) >= 0) && words.length > 1) return { verb: "use", args: { ability: raw.replace(/^\S+\s+/, "") } };
    let explicit = false;
    const styleKeys = [], partKeys = [], other = [];
    words.forEach(function (word, index) {
        const attackWord = word === TEXT_COMBAT_KEYWORDS.attack.primary || TEXT_COMBAT_KEYWORDS.attack.aliases.indexOf(word) >= 0;
        if (index === 0 && attackWord) { explicit = true; return; }
        if (attackWord) return;
        const style = Object.keys(TEXT_COMBAT_KEYWORDS.styles).find(function (key) { return word === key || TEXT_COMBAT_KEYWORDS.styles[key].indexOf(word) >= 0; });
        if (style) { if (styleKeys.indexOf(style) < 0) styleKeys.push(style); return; }
        const part = Object.keys(TEXT_COMBAT_KEYWORDS.parts).find(function (key) { return word === key || TEXT_COMBAT_KEYWORDS.parts[key].indexOf(word) >= 0; });
        if (part) { if (partKeys.indexOf(part) < 0) partKeys.push(part); return; }
        if (TEXT_COMBAT_KEYWORDS.filler.indexOf(word) < 0) other.push(word);
    });
    // Shorthand requires a style word and combat context. A bare direction or
    // body word outside combat must not turn into an unsolicited attack.
    const first = words.find(function (word) { return TEXT_COMBAT_KEYWORDS.filler.indexOf(word) < 0 && TEXT_COMBAT_KEYWORDS.attack.aliases.indexOf(word) < 0; });
    const shorthandStart = Object.keys(TEXT_COMBAT_KEYWORDS.styles).some(function (key) { return first === key || TEXT_COMBAT_KEYWORDS.styles[key].indexOf(first) >= 0; }) || Object.keys(TEXT_COMBAT_KEYWORDS.parts).some(function (key) { return first === key || TEXT_COMBAT_KEYWORDS.parts[key].indexOf(first) >= 0; });
    if (explicit || (textModeInCombat() && styleKeys.length && shorthandStart)) return { verb: "attack", args: { style: styleKeys.join("/") || "balanced", bodyPart: partKeys.join("/") || "torso", target: other.join(" ") } };
    const key = textCommandNormalize(raw);
    const primary = Object.keys(TEXT_COMBAT_KEYWORDS.abilities).find(function (name) { return TEXT_COMBAT_KEYWORDS.abilities[name].indexOf(key) >= 0; });
    if (primary) return { verb: "use", args: { ability: primary } };
    const matches = textModeInCombat() ? textCombatActions().filter(function (action) { return textCombatActionMatches(action, key); }) : [];
    return matches.length ? { verb: "use", args: { ability: key } } : null;
}

function textCombatFoes() {
    if (!textModeInCombat()) return [];
    const enc = typeof getActiveEncounter === "function" ? getActiveEncounter() : null;
    const foes = enc && typeof encounterStandingFoes === "function" ? encounterStandingFoes(enc) : [G.activeNPC];
    return foes.filter(function (npc) { return textModeVisibleNPCs().indexOf(npc) >= 0 && !(npc.hp <= 0) && !npc.surrendered; });
}

function textCombatSnapshot() {
    return { active: textModeInCombat(), npc: G.activeNPC, encounter: G.combatEncounter, room: G.activeRoom, foes: textCombatFoes() };
}

function textCombatQueueBoundary(before, action) {
    const after = textCombatSnapshot();
    if (!before.active && after.active && action.verb !== "attack") return "A fight started. Pending commands are paused. Type show for combat actions.";
    if (before.active && !after.active) return "The fight ended or you left combat. Pending commands are paused.";
    if (before.active && after.active) {
        if (before.encounter && after.encounter !== before.encounter) return "The encounter changed. Pending commands are paused.";
        if (before.npc !== after.npc && action.verb !== "target" && action.combatTarget !== after.npc) return "Your opponent changed. Pending commands are paused; choose your next action.";
        if (before.room !== after.room) return "You changed rooms. Pending commands are paused.";
        if (after.foes.some(function (foe) { return before.foes.indexOf(foe) < 0; })) return "Another opponent joined. Pending commands are paused; type show targets.";
    }
    return "";
}

function textCombatActionBlock(action) {
    const def = textCommandDefinition(action.verb);
    if (textModeInCombat() && !(def && (def.combat || def.info))) return "A fight is in progress. Type show for combat actions.";
    if (def && def.combatOnly && !textModeInCombat()) return "That action needs an active fight. Use attack <npc> to start one.";
    if (textModeInCombat()) {
        const enc = G.combatEncounter;
        if (enc && (enc.running || enc.beginning || enc.concluding || enc.playerDown)) return "The current combat turn is still resolving.";
        if (def && def.combat && action.verb !== "target" && textCombatFoes().indexOf(G.activeNPC) < 0) return "Your current opponent is no longer standing. Type show targets before continuing.";
    }
    return "";
}

function textCombatShow(topic) {
    const key = textCommandNormalize(topic).replace(/^(?:use|cast|perform)\s+/, "");
    if (key === "targets" || key === "enemies" || key === "foes") {
        const foes = textCombatFoes();
        return textModeResult("completed", foes.length ? foes.map(function (npc, i) {
            return (i + 1) + ". " + textModeNPCLabel(npc) + (npc === G.activeNPC ? " — current target" : "");
        }).join("\n") + "\nUse target <npc>, or attack <npc> heavy head." : "There are no active opponents.");
    }
    const all = textCombatActions();
    const named = all.filter(function (action) { return textCombatActionMatches(action, key); });
    if (key && named.length) return textModeResult("completed", named.map(function (action) {
        const primary = action.primary || action.name.toLowerCase();
        return action.name + ": " + action.title + (action.disabled ? "\nCurrently unavailable." : "") + "\nCommand: " + primary + " (or use " + primary + ")";
    }).join("\n"));
    const group = /^(spell|spells)$/.test(key) ? "Spells" : /^(ability|abilities|actions|verbs|commands|combat)?$/.test(key) ? "" : null;
    if (group === null) return null;
    const available = all.filter(function (action) { return !action.disabled && (!group || action.group === group); });
    const lines = group ? [] : ["attack [style] [body part] — e.g. heavy head or attack head light", "Styles: light, balanced, heavy, precise. Default: balanced torso.", "Body parts here: " + getCombatTargetOptions(G.activeNPC).join(", "), "target <npc>; show targets; status; stop; continue"];
    available.forEach(function (action) { lines.push(action.label + " — type " + (action.primary || action.name.toLowerCase())); });
    return textModeResult("completed", (G.activeNPC ? "Current opponent: " + textModeNPCLabel(G.activeNPC) + ".\n" : "") + (lines.length ? lines.join("\n") : "No available actions in this group.") + "\nUse how <action> for details. Each combat action uses the normal turn and costs.");
}

function textCombatResolveOpponent(action) {
    const args = action.args || {};
    const inCombat = textModeInCombat();
    const candidates = inCombat ? textCombatFoes() : textModeVisibleNPCs();
    let matches;
    if (action.targetRef) matches = candidates.filter(function (npc) { return npc === action.targetRef; });
    else if (!args.target && G.activeNPC && candidates.indexOf(G.activeNPC) >= 0) matches = [G.activeNPC];
    else matches = resolveTextNPCTarget(args.target || "", candidates).matches;
    if (!matches.length) return { result: textModeResult("blocked", inCombat ? "No standing opponent matches that target. Type show targets." : "No visible creature matches that target. Type who is here.") };
    if (matches.length > 1) return { result: textModeAsk(action, "target", matches, "Which opponent?") };
    const npc = matches[0];
    if (npc.hp <= 0 || npc.surrendered || npc.unconscious || npc.isUnconsciousBody) return { result: textModeResult("blocked", "That opponent is already down or has surrendered.") };
    return { npc: npc };
}

async function executeTextCombatCommand(action) {
    const args = action.args || {};
    if (action.verb === "attack" || action.verb === "target") {
        const target = textCombatResolveOpponent(action);
        if (target.result) return target.result;
        const npc = target.npc;
        if (action.verb === "attack") {
            if (!Object.prototype.hasOwnProperty.call(COMBAT_ATTACK_STYLES, args.style || "balanced")) return textModeResult("blocked", "Choose one attack style: light, balanced, heavy, or precise.");
            const part = args.bodyPart || "torso";
            if (getCombatTargetOptions(npc).indexOf(part) < 0) return textModeResult("blocked", "That body part is unavailable on this opponent. Choose " + getCombatTargetOptions(npc).join(", ") + ".");
        }
        if (G.activeNPC !== npc) {
            if (textModeInCombat()) encounterSetTarget(npc);
            else selectNPC(npc);
            if (G.activeNPC !== npc) return textModeResult("blocked", "You could not engage that opponent.");
        }
        if (action.verb === "target") return textModeResult("completed", "Current opponent: " + textModeNPCLabel(npc) + ".");
        action.combatTarget = npc;
        if (G.activeObject || G.activeItemModal) return textModeResult("blocked", "Close the open object or item interaction first.");
        attackNPC(npc, { style: args.style || "balanced", target: args.bodyPart || "torso" });
        return { status: "completed" };
    }
    if (action.verb === "use") {
        if (!action.abilityId && !String(args.ability || "").trim()) return textModeResult("blocked", "Use an action name, such as use second wind. Type show for your actions.");
        const list = textCombatActions();
        const matches = action.abilityId ? list.filter(function (entry) { return entry.id === action.abilityId; }) : list.filter(function (entry) { return textCombatActionMatches(entry, args.ability); });
        if (!matches.length) return textModeResult("blocked", "You do not have that combat action available. Type show for your actions.");
        if (matches.length > 1) return textModeAsk(action, "ability", matches.map(function (entry) { return { id: entry.id, label: entry.group + ": " + entry.label }; }), "Which action?");
        const selected = matches[0];
        if (selected.disabled) return textModeResult("blocked", selected.title || "That action is currently unavailable.");
        let chosen = selected;
        if (typeof selected.targets === "function") {
            const choices = selected.targets();
            if (!action.targetChoiceId) {
                action.abilityId = selected.id;
                return textModeAsk(action, "abilityTarget", choices, selected.name + ": who?");
            }
            chosen = choices.find(function (entry) { return entry.id === action.targetChoiceId; });
            if (!chosen || chosen.disabled) return textModeResult("blocked", chosen ? chosen.title : "That target is no longer available.");
        }
        const before = textCombatSnapshot();
        textModeState.combatTurnSpent = false;
        await chosen.run();
        // A handler may reject a late rule check. Never run the next queued
        // action merely because that handler returned without spending a turn.
        if (!textModeState.combatTurnSpent && before.npc === G.activeNPC && textModeInCombat() && before.encounter === G.combatEncounter) return textModeResult("blocked", "That action did not complete a combat turn. Pending commands are paused.");
        return { status: "completed" };
    }
    return textModeResult("blocked", "Unknown combat command. Type show.");
}

function textModeNoteCombatTurn(context) {
    const ctx = context || {};
    if (textModeState.capture && !ctx.encounterTurn && !ctx.noEncounter && !(G.combatEncounter && G.combatEncounter.running)) textModeState.combatTurnSpent = true;
}

function textModeTrackCombatNarration(session) {
    if (!textModeState.capture) return;
    textModeTrackTask(new Promise(function (resolve) { session.textCommandDone = resolve; }));
}

function textModePublishCombat(rows) {
    if (!textModeState.enabled) return;
    const lines = rows.filter(function (row) { return !row.debug; }).map(function (row) { return row.text; });
    if (lines.length) publishTextModeOutput("combat", lines.join("\n"), { source: "engine", lines: lines }, false);
}
