let _guideReplySequence = 0;

// One response per player turn. Scene/run checks discard slow replies after
// leaving, restarting a conversation, or choosing another response.
function queueGuideReply(npc, beatId, beat, playerLine, onSpoken) {
    const room = G.activeRoom;
    const run = npc.guide.conversationRun || 0;
    const sequence = ++_guideReplySequence;
    const current = function () {
        return sequence === _guideReplySequence && G.activeNPC === npc && G.activeNPCMode === "talk" &&
            G.activeRoom === room && (npc.guide.conversationRun || 0) === run;
    };
    npc.guide.lastBeat = beatId;
    if (beat.concern) npc.guide.playerConcern = beat.concern;
    if (typeof setChatOptionsDisabled === "function") setChatOptionsDisabled(true);
    const phrased = phraseGuideBeat(npc, beatId, beat.lines, playerLine, beat);
    const delay = playerLine ? getChatTypingDurationMs("player", "You", playerLine, { mode: "narration", animate: true }) + GUIDE_TURN_PAUSE_MS : 0;
    setTimeout(function () {
        phrased.then(function (lines) {
            if (!current()) return;
            npc.action = beat.action || "is talking with you";
            if (beat.action && typeof setNarration === "function") setNarration(npc.name + " " + beat.action + ".");
            npc.memory.pendingResponse = beat.replies && beat.replies.length ? { needed: true, options: beat.replies } : null;
            if (typeof onSpoken === "function") onSpoken();
            if (typeof rememberNPCConversationLine === "function") rememberNPCConversationLine(npc, "npc", lines.join(" "), "talk");
            playGuideGreeting(npc, lines, function () {
                if (!current()) return;
                if (typeof setChatOptionsDisabled === "function") setChatOptionsDisabled(false);
                renderChatOptions(npc);
                saveGameState();
            }, current);
        });
    }, delay);
}

function getGuideTypedCheckinBeat(npc, text) {
    if (!npc || !npc.guide || !npc.guide.active || typeof window.matchGuideCheckinReply !== "function") return "";
    const last = npc.guide.lastBeat || "checkin";
    if (!/^(?:checkin(?:-.*)?|pause|care-rest|first-choice|hook(?:-react)?)$/.test(last)) return "";
    return window.matchGuideCheckinReply(text);
}
