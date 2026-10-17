function handleGuideAnswer(npc, topicId, typedText, choice) {
    if (!npc || !npc.guide || typeof window.getGuideTopic !== "function") return false;
    const topic = window.getGuideTopic(topicId);
    if (!topic) return false;
    const bs = getPlayerBackstory();
    const line = window.getGuideTopicAnswer(topicId, bs);
    if (!line) return false;
    const playerLine = typedText ? 'You say, "' + typedText + '"' : 'You ask, "' + topic.question + '"';
    addChatMessage("player", "You", playerLine, { mode: "narration", animate: true });
    if (!npc.memory) npc.memory = {};
    npc.memory.pendingResponse = null;
    if (typeof rememberNPCConversationLine === "function") rememberNPCConversationLine(npc, "player", playerLine, "curious");
    npc.memory.lastSpokenTo = Date.now();
    G.activeNPCMode = "talk";
    queueGuideReply(npc, "topic-" + topicId, { lines: [line], replies: null, concern: topicId === "rest" ? "hurt" : "ready" }, playerLine, function () {
        if (typeof recordNPCConversationChoice === "function") {
            recordNPCConversationChoice(npc, { id: "guide-ask-" + topicId, intent: "curious", guideBeat: topicId === "next" ? "plan" : undefined });
        }
        if (typeof registerNPCToldMemory === "function") {
            registerNPCToldMemory(npc, "guide-" + topicId, "Answered their question: " + topic.question, { pinned: true, importance: 5, tags: ["guide", topicId] });
        }
    });
    return true;
}
