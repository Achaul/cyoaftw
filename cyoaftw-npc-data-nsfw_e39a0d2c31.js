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
//     (flirt / seduce / touch_intimately / start_intimacy); the responsive-
//     desire follow-ups (take-the-kiss / press-the-advance) are gated by the
//     npc._advanceRebuffed marker the engine sets when an advance is rebuffed.
//     Do NOT rename or remove these ids without updating cyoaftw-nsfw-system.js.
(function () {
  "use strict";

  // A fixture the player can press an NPC against for the bold
  // "press-the-advance" escalation: beds and other rest-tagged pieces first,
  // then any table-like furniture in the room.
  function _findPressSurface(room) {
    if (!room || !Array.isArray(room.structural)) return null;
    var pattern = /(bed|cot|table|desk|counter|bench|chest|wardrobe|dresser|shelf|cabinet|barrel|crate|stall|sofa|couch)/i;
    var rest = null;
    var other = null;
    room.structural.forEach(function(fixture) {
      if (!fixture) return;
      var name = String(fixture.name || "");
      var id = String(fixture.id || "");
      if (!pattern.test(name) && !pattern.test(id)) return;
      var tags = Array.isArray(fixture.tags) ? fixture.tags : [];
      if (!rest && tags.indexOf("rest") >= 0) rest = fixture;
      else if (!other) other = fixture;
    });
    return rest || other;
  }

  var NPC_NSFW_CONVERSATION_CATALOGUE = [
    // ===== NSFW OPTIONS (moved out of base catalogue in cyoaftw-npc-data.js) =====
    {
        id: "flirt",
        label: "Flirt",
        intent: "flirt",
        text: "You flirt with them, letting your interest show and testing theirs.",
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
        intent: "seduce",
        text: "You suggest a romantic follow-up, like meeting for dinner or a private walk...",
        playerText: "You suggest a romantic follow-up, like meeting for dinner or a private walk...",
        priority: 20,
        // Cheat/testing only: seduce is the debug path into an encounter
        // an encounter (normal play builds attraction and uses the phase-2
        // options), so it only appears while G.intimacyDebugMode is on.
        conditions: {
            minAttraction: 15,
            custom: function(npc, ctx) { return !!(window.G && window.G.intimacyDebugMode); }
        },
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
        id: "touch_intimately",
        label: "Touch them intimately",
        text: "You reach out and touch them intimately, testing how they respond.",
        playerText: "You reach out and touch them intimately, testing how they respond.",
        priority: 30,
        repeat: "encounter",
        conditions: {
            minAttraction: 15,
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
        // Tentative opening: the encounter starts cold — default arousal, a
        // testing-the-waters tone. The low attraction gate (15) makes this
        // the early "slow burn" entry point.
        encounterStart: { tone: "tentative", arousalBoost: 0 },
        relationshipImpact: { lust: +10, attraction: +4 },
        resetTimer: { turns: 15 },
        phase: 2,
        nsfw: true
    },
    {
        id: "start_intimacy",
        label: "Make a move",
        text: "You make your intentions clear, closing the last of the distance between you.",
        playerText: "You make your intentions clear, closing the last of the distance between you.",
        priority: 35,
        repeat: "encounter",
        conditions: {
            minAttraction: 25,
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
        // Confident opening: the encounter starts heated — both arousal
        // meters start at +25 and the tone is direct, skipping the earliest
        // warm-up. The higher attraction+lust gates (25/25) are the reward
        // for building mutual want first.
        encounterStart: { tone: "direct", arousalBoost: 25 },
        relationshipImpact: { lust: +15, attraction: +8 },
        resetTimer: { turns: 15 },
        phase: 2,
        nsfw: true
    },
    // ===== RESPONSIVE-DESIRE FOLLOW-UPS =====
    // Offered after an ordinary advance was rebuffed (the engine's
    // npc._advanceRebuffed marker, set in the npcRespond receptivity gate)
    // while still private and alone. The player escalates with confident
    // physical initiative instead of retreating. responsiveDesire: true tells
    // the reply prompt to lean toward the character responding to that
    // initiative (nerves giving way to heat), and only a clear "refuse" from
    // the AI holds the encounter off - "lukewarm" here means hesitant-then-
    // melting, which starts the scene. One bold chance per rebuff: clicking
    // either entry consumes the marker (see handleIntimacyConversationChoice).
    {
        id: "take-the-kiss",
        label: "Grab their hand and pull them in for a kiss",
        text: "You take their hand and pull them in, kissing them before the moment can slip away.",
        playerText: "You take their hand and pull them in, kissing them before the moment can slip away.",
        priority: 40,
        conditions: {
            minAttraction: 10,
            locationCheck: "private",
            aloneWithTarget: true,
            custom: function(npc, ctx) {
                if (!npc || !npc._advanceRebuffed) return false;
                const isIntimacyActive = npc.intimacy && npc.intimacy.encounter && npc.intimacy.encounter.active;
                return !isIntimacyActive;
            }
        },
        action: "intimacy",
        startEncounter: true,
        responsiveDesire: true,
        encounterStart: { tone: "direct", arousalBoost: 30 },
        relationshipImpact: { lust: +12, attraction: +2 },
        phase: 2,
        nsfw: true
    },
    {
        id: "press-the-advance",
        label: function(npc, ctx) {
            const surface = _findPressSurface(ctx && ctx.room);
            const name = npc && npc.name ? npc.name : "them";
            return surface ? "Press " + name + " back against the " + surface.name + " and grind against them" : "";
        },
        text: function(npc, ctx) {
            const surface = _findPressSurface(ctx && ctx.room);
            const name = npc && npc.name ? npc.name : "them";
            return "You press " + name + " back against the " + (surface ? surface.name : "wall") + " and grind against them.";
        },
        playerText: function(npc, ctx) {
            const surface = _findPressSurface(ctx && ctx.room);
            const name = npc && npc.name ? npc.name : "them";
            return "You press " + name + " back against the " + (surface ? surface.name : "wall") + " and grind against them.";
        },
        priority: 41,
        conditions: {
            minAttraction: 10,
            locationCheck: "private",
            aloneWithTarget: true,
            custom: function(npc, ctx) {
                if (!npc || !npc._advanceRebuffed) return false;
                const isIntimacyActive = npc.intimacy && npc.intimacy.encounter && npc.intimacy.encounter.active;
                return !isIntimacyActive;
            }
        },
        action: "intimacy",
        startEncounter: true,
        responsiveDesire: true,
        encounterStart: { tone: "direct", arousalBoost: 30 },
        relationshipImpact: { lust: +14, attraction: +2 },
        phase: 2,
        nsfw: true
    },
    // ===== PHYSICAL TOUCH ACTIONS (outside intimacy scenes) =====
    // These allow for non-intimacy physical interactions with NPCs that trigger
    // context-aware reactions based on relationship, temperament, location, etc.
    {
        id: "touch-gently",
        label: "Touch them gently",
        text: "You reach out and touch them gently, testing their reaction.",
        playerText: "You reach out and touch them gently, testing their reaction.",
        priority: 25,
        repeat: "session",
        resetTimer: { turns: 10 },
        conditions: {
            romanceEligible: true,
            isHumanoid: true,
            maxHostility: 60,
            custom: function(npc, ctx) {
                // Don't show during intimacy encounters
                const isIntimacyActive = npc && npc.intimacy && npc.intimacy.encounter && npc.intimacy.encounter.active;
                return !isIntimacyActive;
            }
        },
        action: "physical-touch",
        touchType: "gentle",
        relationshipImpact: { lust: +1, attraction: +1 },
        contextNote: function(npc, ctx) {
            const name = npc.name || (npc.firstName && npc.lastName ? npc.firstName + " " + npc.lastName : "them");
            const gender = npc.gender === "male" ? "man" : npc.gender === "female" ? "woman" : "person";
            const temp = String(npc.temperament || "neutral").toLowerCase();
            const loc = ctx.room ? (ctx.room.type || ctx.room.displayName || "this place") : "here";
            const isPrivate = ctx.room && (typeof isPrivateLocationFunc === "function" && isPrivateLocationFunc(ctx.room));
            const hasOthers = ctx.room && ctx.room.creatures && ctx.room.creatures.some(c => c && !c.isPlayer && c !== npc && (c.isHumanoid || c.humanoid));
            const attract = (npc.memory && npc.memory.attraction) || 0;
            const lust = (npc.memory && npc.memory.lust) || 0;
            const favor = (npc.memory && (npc.memory.favorability || npc.memory.favor)) || 0;
            const hostility = (npc.memory && npc.memory.hostility) || 0;
            return "The player has gently touched " + name + ", a " + temp + " " + gender + " (attraction: " + attract + "/100, lust: " + lust + "/100, favor: " + favor + "/100, hostility: " + hostility + "/100). " +
                   (isPrivate ? "You are alone together in " + loc + "." : hasOthers ? "Others are present in " + loc + "." : "You are in " + loc + ".") +
                   " React in character as " + name + " would: welcomed if fond of them, cautious if neutral, or offended if hostile. Be mindful of your temperament (" + temp + "). Your existing attraction/lust/disinhibition stats are already in your persona block.";
        },
        nsfw: true
    },
    {
        id: "grab",
        label: "Grab them",
        text: "You reach out and grab them firmly.",
        playerText: "You reach out and grab them firmly.",
        priority: 26,
        repeat: "session",
        resetTimer: { turns: 15 },
        conditions: {
            romanceEligible: true,
            isHumanoid: true,
            maxHostility: 50,
            minAttraction: 5,
            custom: function(npc, ctx) {
                const isIntimacyActive = npc && npc.intimacy && npc.intimacy.encounter && npc.intimacy.encounter.active;
                return !isIntimacyActive;
            }
        },
        action: "physical-touch",
        touchType: "firm",
        relationshipImpact: { lust: +2, attraction: 0 },
        contextNote: function(npc, ctx) {
            const name = npc.name || (npc.firstName && npc.lastName ? npc.firstName + " " + npc.lastName : "them");
            const gender = npc.gender === "male" ? "man" : npc.gender === "female" ? "woman" : "person";
            const temp = String(npc.temperament || "neutral").toLowerCase();
            const loc = ctx.room ? (ctx.room.type || ctx.room.displayName || "this place") : "here";
            const isPrivate = ctx.room && (typeof isPrivateLocationFunc === "function" && isPrivateLocationFunc(ctx.room));
            const hasOthers = ctx.room && ctx.room.creatures && ctx.room.creatures.some(c => c && !c.isPlayer && c !== npc && (c.isHumanoid || c.humanoid));
            const attract = (npc.memory && npc.memory.attraction) || 0;
            const lust = (npc.memory && npc.memory.lust) || 0;
            const favor = (npc.memory && (npc.memory.favorability || npc.memory.favor)) || 0;
            const hostility = (npc.memory && npc.memory.hostility) || 0;
            return "The player has firmly grabbed " + name + ", a " + temp + " " + gender + " (attraction: " + attract + "/100, lust: " + lust + "/100, favor: " + favor + "/100, hostility: " + hostility + "/100). " +
                   (isPrivate ? "You are alone together in " + loc + "." : hasOthers ? "Others are watching in " + loc + "." : "You are in " + loc + ".") +
                   " React in character as " + name + " would: pulled closer if welcoming, stiffened if uncomfortable, or angry if unwanted. Consider your temperament (" + temp + "). Your existing attraction/lust/disinhibition stats are already in your persona block.";
        },
        nsfw: true
    },
    {
        id: "hug",
        label: "Hug them",
        text: "You step close and wrap your arms around them in a hug.",
        playerText: "You step close and wrap your arms around them in a hug.",
        priority: 24,
        repeat: "session",
        resetTimer: { turns: 10 },
        conditions: {
            romanceEligible: true,
            isHumanoid: true,
            maxHostility: 50,
            custom: function(npc, ctx) {
                const isIntimacyActive = npc && npc.intimacy && npc.intimacy.encounter && npc.intimacy.encounter.active;
                return !isIntimacyActive;
            }
        },
        action: "physical-touch",
        touchType: "affectionate",
        relationshipImpact: { mood: +2, favor: +3, attraction: +2 },
        contextNote: function(npc, ctx) {
            const name = npc.name || (npc.firstName && npc.lastName ? npc.firstName + " " + npc.lastName : "them");
            const gender = npc.gender === "male" ? "man" : npc.gender === "female" ? "woman" : "person";
            const temp = String(npc.temperament || "neutral").toLowerCase();
            const loc = ctx.room ? (ctx.room.type || ctx.room.displayName || "this place") : "here";
            const isPrivate = ctx.room && (typeof isPrivateLocationFunc === "function" && isPrivateLocationFunc(ctx.room));
            const hasOthers = ctx.room && ctx.room.creatures && ctx.room.creatures.some(c => c && !c.isPlayer && c !== npc && (c.isHumanoid || c.humanoid));
            const attract = (npc.memory && npc.memory.attraction) || 0;
            const lust = (npc.memory && npc.memory.lust) || 0;
            const favor = (npc.memory && (npc.memory.favorability || npc.memory.favor)) || 0;
            const hostility = (npc.memory && npc.memory.hostility) || 0;
            return "The player has hugged " + name + ", a " + temp + " " + gender + " (attraction: " + attract + "/100, lust: " + lust + "/100, favor: " + favor + "/100, hostility: " + hostility + "/100). " +
                   (isPrivate ? "You are alone together in " + loc + "." : hasOthers ? "Others can see this in " + loc + "." : "You are in " + loc + ".") +
                   " React in character as " + name + " would: hug back warmly if fond of them, pat awkwardly if neutral, or push away if unwelcome. Consider your temperament (" + temp + "). Your existing attraction/lust/disinhibition stats are already in your persona block.";
        },
        nsfw: true
    },
    {
        id: "grope",
        label: "Grope them",
        text: "You reach out with bolder, more intimate contact.",
        playerText: "You reach out with bolder, more intimate contact.",
        priority: 28,
        repeat: "session",
        resetTimer: { turns: 20 },
        conditions: {
            romanceEligible: true,
            isHumanoid: true,
            maxHostility: 40,
            minAttraction: 10,
            custom: function(npc, ctx) {
                const isIntimacyActive = npc && npc.intimacy && npc.intimacy.encounter && npc.intimacy.encounter.active;
                return !isIntimacyActive;
            }
        },
        action: "physical-touch",
        touchType: "bold",
        relationshipImpact: { lust: +3, attraction: +1 },
        contextNote: function(npc, ctx) {
            const name = npc.name || (npc.firstName && npc.lastName ? npc.firstName + " " + npc.lastName : "them");
            const gender = npc.gender === "male" ? "man" : npc.gender === "female" ? "woman" : "person";
            const temp = String(npc.temperament || "neutral").toLowerCase();
            const loc = ctx.room ? (ctx.room.type || ctx.room.displayName || "this place") : "here";
            const isPrivate = ctx.room && (typeof isPrivateLocationFunc === "function" && isPrivateLocationFunc(ctx.room));
            const hasOthers = ctx.room && ctx.room.creatures && ctx.room.creatures.some(c => c && !c.isPlayer && c !== npc && (c.isHumanoid || c.humanoid));
            const attract = (npc.memory && npc.memory.attraction) || 0;
            const lust = (npc.memory && npc.memory.lust) || 0;
            const favor = (npc.memory && (npc.memory.favorability || npc.memory.favor)) || 0;
            const hostility = (npc.memory && npc.memory.hostility) || 0;
            return "The player has groped " + name + ", a " + temp + " " + gender + " (attraction: " + attract + "/100, lust: " + lust + "/100, favor: " + favor + "/100, hostility: " + hostility + "/100). " +
                   (isPrivate ? "You are alone together in " + loc + "." : hasOthers ? "Others are watching in " + loc + " - very inappropriate!" : "You are in " + loc + ".") +
                   " React in character as " + name + " would: melt into their touch if very attracted, blush and step back if modest, or slap their hand away if angry. Consider your temperament (" + temp + "). Your existing attraction/lust/disinhibition stats are already in your persona block.";
        },
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
