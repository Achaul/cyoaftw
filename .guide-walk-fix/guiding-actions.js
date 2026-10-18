// Session-only generation: old walking timers cannot resume a stopped/replaced walk.
let guideWalkSequence = 0;

function startGuiding(npc, dest) {
    if (G.guiding) endGuiding(G.guiding, "");
    guideWalkSequence++;
    G.guiding = { npc: npc, destKey: dest.key, destName: dest.name, buildingId: dest.buildingId, keep: false, startedTurn: getCurrentStoryTurn() };
    npc._guiding = true;
    addSessionFollower(npc);
}

function endGuiding(g, note) {
    if (!g) return;
    const npc = g.npc;
    if (G.guiding === g) { G.guiding = null; guideWalkSequence++; }
    if (npc) {
        npc._guiding = false;
        if ((G.sessionFollowers || []).indexOf(npc) >= 0 && !npc._inParty) removeSessionFollower(npc);
    }
    if (note && typeof queueTurnNote === "function") queueTurnNote(note);
    if (typeof renderInteractSidePanels === "function") renderInteractSidePanels();
}

// The active guide, or null (and cleaned up) when they are gone, down, or no
// longer with the player.
function getGuiding() {
    const g = G.guiding;
    if (!g) return null;
    const npc = g.npc;
    const room = G.activeRoom;
    const here = !!(npc && room && Array.isArray(room.creatures) && room.creatures.indexOf(npc) >= 0);
    if (!npc || !isAwakeHumanoidNPC(npc) || npc._drunkBlackout || (npc.currentState && npc.currentState.sleeping) || (G.sessionFollowers || []).indexOf(npc) < 0 || !here) {
        endGuiding(g, npc && npc.name ? "You lose track of " + npc.name + "." : "");
        return null;
    }
    return g;
}

// A hostile-looking bystander is not a reason to stop walking; combat is.
function guideBlocked() {
    return G.activeNPCMode === "combat";
}

function guideDecisionPending() {
    const p = G.player;
    return !p || p.dead || p.hp <= 0 || p.unconscious || p._dying || p._collapsing ||
        G.activeNPC || G.activeObject || G.activeItemModal ||
        (typeof hasPendingPartyLoot === "function" && hasPendingPartyLoot());
}

// Append actions to central narration without removing the new room's details.
// Publish only the added line, so text/TTS do not repeat the room description.
function guideAct(npc, text) {
    if (!npc || !text) return;
    const el = document.getElementById("narrationEl");
    if (el) {
        appendNarrationBreak(el);
        appendNarrationBreak(el);
        appendNarrationText(el, text);
    }
    if (typeof textModeState !== "undefined" && textModeState.enabled) publishTextModeOutput("narration", text, { source: "engine" }, false);
}

function guideSay(npc, text) {
    if (!npc || !text || typeof addChatMessage !== "function") return;
    let line = "\"" + text + "\"";
    if (typeof applyNPCDrunkSpeech === "function") line = applyNPCDrunkSpeech(npc, line);
    addChatMessage("left", npc.name || "Your guide", line, { mode: "auto" });
    return line;
}

function completeGuidedArrival(g, text) {
    if (getGuiding() !== g || G.activeRoom.coords !== g.destKey || guideBlocked()) return "blocked";
    const npc = g.npc;
    const canTalk = !guideDecisionPending() && canConverseWithNPC(npc);
    endGuiding(g, "");
    applyNPCImpact(npc, { mood: 1, favor: 2, intent: "friendly", markMet: true, actionTag: "led-player" });
    // A fight, injury or another decision owns its own controls and narration.
    if (!canTalk) return "arrived";
    selectNPC(npc);
    if (G.activeNPC !== npc || G.activeNPCMode === "combat") return "arrived";
    const state = ensureNPCConversationState(npc);
    // Walking here continues an existing conversation. Unlock its topics
    // without replaying a greeting, charging a turn, or giving greeting rewards.
    if (state && state.sessionUsedOptionIds.indexOf("greet-known") < 0) state.sessionUsedOptionIds.push("greet-known");
    npc.memory.pendingResponse = null;
    startNPCConversation(npc);
    guideAct(npc, text || (npc.name || "Your guide") + " stops beside you at " + g.destName + ".");
    const line = guideSay(npc, "Here we are. " + g.destName.replace(/^./, function (c) { return c.toUpperCase(); }) + ".");
    if (line && typeof rememberNPCConversationLine === "function") rememberNPCConversationLine(npc, "npc", line, "friendly");
    npc.memory.lastSpokenTo = Date.now();
    saveGameState();
    return "arrived";
}

// One room along the way. Both manual and automatic following share this action.
function followGuideStep() {
    const g = getGuiding();
    if (!g) return "blocked";
    const room = G.activeRoom;
    const player = G.player;
    const name = g.npc.name || "Your guide";
    if (guideBlocked()) {
        g.keep = false;
        guideAct(g.npc, name + " stops short.");
        guideSay(g.npc, "Not with that going on.");
        renderInteractSidePanels();
        return "blocked";
    }
    if (guideDecisionPending()) { stopKeepFollowing(); return "blocked"; }
    if (room.coords === g.destKey) return completeGuidedArrival(g);
    const route = findRoomRoute(room, g.destKey, { targetBuildingId: g.buildingId });
    if (!route || !route.length) {
        endGuiding(g, "");
        renderRoom();
        guideAct(g.npc, name + " frowns.");
        guideSay(g.npc, "The way is closed to us. I can't take you there from here.");
        return "blocked";
    }
    const step = route[0];
    const word = DIRECTION_WORDS[step.dir] || String(step.dir).toLowerCase();
    movePlayer(step.dir);
    if (G.activeRoom === room) {
        g.keep = false;
        return "blocked";
    }
    // Recheck the original actor and guide after movement/autonomy/entry hazards.
    if (G.player !== player || getGuiding() !== g) return "blocked";
    if (guideBlocked() || guideDecisionPending()) { g.keep = false; return "moved"; }
    if (G.activeRoom.coords === g.destKey) return completeGuidedArrival(g, name + " leads you " + word + " and stops.");
    guideAct(g.npc, name + " leads the way " + word + ".");
    return "moved";
}

function startKeepFollowing() {
    const g = getGuiding();
    if (!g) return;
    const run = ++guideWalkSequence;
    g.keep = true;
    runKeepFollowing(run);
}

function stopKeepFollowing() {
    guideWalkSequence++;
    if (G.guiding) G.guiding.keep = false;
    if (typeof renderInteractSidePanels === "function") renderInteractSidePanels();
}

function runKeepFollowing(run) {
    if (run === undefined) run = guideWalkSequence;
    if (run !== guideWalkSequence) return;
    const g = getGuiding();
    if (!g || !g.keep) return;
    if (guideBlocked()) {
        g.keep = false;
        guideAct(g.npc, (g.npc.name || "Your guide") + " stops short.");
        guideSay(g.npc, "Not with that going on.");
        renderInteractSidePanels();
        return;
    }
    if (guideDecisionPending()) { stopKeepFollowing(); return; }
    const result = followGuideStep();
    const still = G.guiding;
    if (result === "moved" && still === g && still.keep && !guideBlocked()) {
        const room = G.activeRoom, player = G.player, moveSeq = player.moveSeq;
        setTimeout(function () {
            if (run !== guideWalkSequence || G.guiding !== g) return;
            if (G.activeRoom !== room || G.player !== player || player.moveSeq !== moveSeq) { stopKeepFollowing(); return; }
            runKeepFollowing(run);
        }, GUIDE_KEEP_DELAY_MS);
    } else if (still) {
        still.keep = false;
        if (guideBlocked() && result === "moved") {
            guideAct(still.npc, (still.npc.name || "Your guide") + " stops short.");
            guideSay(still.npc, "Not with that going on.");
        }
        renderInteractSidePanels();
    }
}

function stopFollowingGuide() {
    const g = G.guiding;
    if (!g) return;
    endGuiding(g, (g.npc && g.npc.name ? g.npc.name : "Your guide") + " shrugs and lets you go your own way.");
    renderRoom();
}
