// === cyoaftw-npc-data-nsfw.js ===
// NSFW conversation catalogue entries, separated from cyoaftw-npc-data.js so
// that SFW-only tooling can edit the base NPC dialogue catalogue (and NPC
// autonomy logic) without reading explicit content.
//
// Load contract:
//   - Loaded by cyoaftw-engine-CORE.html via a <script src> tag, after
//     cyoaftw-npc-data.js and before the appended engine payload.
//   - At query time, queryConversationCatalogue() in cyoaftw-npc-data.js merges
//     this array into the active catalogue via window.NPC_NSFW_CONVERSATION_CATALOGUE.
//   - The ids below are referenced by string in cyoaftw-nsfw-system.js
//     (flirt / seduce / proposition / touch_intimately / start_intimacy).
//     Do NOT rename or remove these ids without updating cyoaftw-nsfw-system.js.
(function () {
  "use strict";

  var NPC_NSFW_CONVERSATION_CATALOGUE = [
    // ===== NSFW OPTIONS (moved out of base catalogue in cyoaftw-npc-data.js) =====
    {
        id: "flirt",
        label: "Flirt",
        text: "You flirt with them, running your fingers near their {groin} to test their interest...",
        priority: 10,
        repeat: "session",
        conditions: { romanceEligible: true, maxHostility: 70 },
        relationshipImpact: { lust: +2, attraction: +1 },
        resetTimer: { turns: 5 },
        phase: 1,
        nsfw: true
    },
    {
        id: "seduce",
        label: "Seduce",
        text: "You suggest a romantic follow-up, like meeting for dinner or a private walk...",
        playerText: "You suggest a romantic follow-up, like meeting for dinner or a private walk...",
        priority: 20,
        conditions: { minAttraction: 15 },
        isInquiry: true,
        startEncounter: true,
        relationshipImpact: { lust: +3, attraction: +5 },
        onAccept: { lust: +5, attraction: +8 },
        onReject: { hostility: +10, attraction: -5 },
        resetTimer: { turns: 10 },
        phase: 1,
        nsfw: true
    },
    {
        id: "proposition",
        label: "Proposition",
        text: "You make a direct physical advance, testing if they're up for something quick and immediate...",
        playerText: "You make a direct physical advance, testing if they're up for something quick and immediate...",
        priority: 25,
        conditions: { minAttraction: 10, minLust: 15 },
        isInquiry: true,
        startEncounter: true,
        relationshipImpact: { lust: +8, attraction: +2 },
        onAccept: { lust: +12, attraction: +3 },
        onReject: { hostility: +15, lust: -3 },
        resetTimer: { turns: 15 },
        phase: 1,
        nsfw: true
    },
    {
        id: "touch_intimately",
        label: "Touch them intimately",
        text: "You reach out to touch their {groin} suggestively...",
        playerText: "You reach out to touch their {groin} suggestively...",
        priority: 30,
        repeat: "encounter",
        conditions: {
            minAttraction: 35,
            locationCheck: "private",
            aloneWithTarget: true,
            custom: function(npc, ctx) {
                const hasPendingFollow = npc && npc._pendingSeductionOption === "follow-player";
                const isIntimacyActive = npc.intimacy && npc.intimacy.encounter && npc.intimacy.encounter.active;
                return hasPendingFollow || !isIntimacyActive;
            }
        },
        action: "intimacy",
        startEncounter: true,
        relationshipImpact: { lust: +10, attraction: +4 },
        resetTimer: { turns: 15 },
        phase: 2,
        nsfw: true
    },
    {
        id: "start_intimacy",
        label: "Make a move",
        text: "You make your intentions clear, reaching for their {groin} to initiate intimacy...",
        playerText: "You make your intentions clear, reaching for their {groin} to initiate intimacy...",
        priority: 35,
        repeat: "encounter",
        conditions: {
            minAttraction: 45,
            minLust: 25,
            locationCheck: "private",
            aloneWithTarget: true,
            custom: function(npc, ctx) {
                const hasPendingFollow = npc && npc._pendingSeductionOption === "follow-player";
                const isIntimacyActive = npc.intimacy && npc.intimacy.encounter && npc.intimacy.encounter.active;
                return hasPendingFollow || !isIntimacyActive;
            }
        },
        action: "intimacy",
        startEncounter: true,
        relationshipImpact: { lust: +15, attraction: +8 },
        resetTimer: { turns: 15 },
        phase: 2,
        nsfw: true
    }
  ];

  if (typeof window !== "undefined") {
    window.NPC_NSFW_CONVERSATION_CATALOGUE = NPC_NSFW_CONVERSATION_CATALOGUE;
  }
  if (typeof console !== "undefined") {
    console.log("[NSFW NPC Data] Loaded NPC_NSFW_CONVERSATION_CATALOGUE:", NPC_NSFW_CONVERSATION_CATALOGUE.length, "options");
  }
})();
