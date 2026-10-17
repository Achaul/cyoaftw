function handleGuideTalk(npc, beatId, choice) {
    const bs = getPlayerBackstory();
    if (!bs || !npc || !npc.guide || !bs.guide || typeof window.getGuideTalkBeat !== "function") return false;
    const spec = typeof getGuideSpec === "function" ? getGuideSpec(bs.archetype, getPlayerSpeciesKey()) : null;
    const beat = window.getGuideTalkBeat(beatId, bs, {
        hpFrac: getPlayerHpFraction(),
        relation: spec && spec.relation ? spec.relation : bs.guide.relation,
        stance: choice && choice.stance,
        inParty: !!npc._inParty,
        partyOffered: !!bs.guide.partyOffered
    });
    if (!beat || !beat.lines || !beat.lines.length) return false;
    const spoken = choice && (choice.promptText || choice.say || "");
    const playerLine = choice && (choice.text || (spoken ? 'You say, "' + spoken + '"' : ""));
    if (playerLine) addChatMessage("player", "You", playerLine, { mode: "narration", animate: true });
    if (!npc.memory) npc.memory = {};
    npc.memory.pendingResponse = null;
    if (typeof recordNPCConversationChoice === "function" && choice) recordNPCConversationChoice(npc, choice);
    if (typeof classifyConversationChoice === "function" && typeof applyNPCImpact === "function" && choice) {
        applyNPCImpact(npc, classifyConversationChoice(npc, choice));
    }
    if (typeof rememberNPCConversationLine === "function" && playerLine) rememberNPCConversationLine(npc, "player", playerLine, "talk");
    G.activeNPCMode = "talk";
    queueGuideReply(npc, beatId, beat, playerLine, function () {
        if (beat.offered) bs.guide.partyOffered = true;
        if (beat.plan && typeof recordNPCConversationChoice === "function") {
            recordNPCConversationChoice(npc, { id: "guide-talk-" + beatId, intent: "curious", guideBeat: "plan" });
            if (typeof registerNPCToldMemory === "function") {
                registerNPCToldMemory(npc, "guide-mission", "Answered their chosen first step: " + beat.lines.join(" "), { pinned: true, importance: 6, tags: ["guide", "mission"] });
            }
        }
    });
    npc.memory.lastSpokenTo = Date.now();
    return true;
}
window.handleGuideTalk = handleGuideTalk;
