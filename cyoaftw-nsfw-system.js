// === cyoaftw-nsfw-system.js ===
(function() {
  'use strict';

  const NSFW_SYSTEM_ENABLED = true;

  // --- Environmental Modifiers ---
  function getEnvironmentalModifier(room) {
    if (!room) return 1.0;
    const modifiers = {
      tavern: 1.1,    // +10% in taverns
      inn: 1.1,       // +10% in inns
      dungeon: 0.8,   // -20% in dungeons
      forest: 0.9,    // -10% in forests
      private: 1.2,   // +20% in private rooms
    };
    return modifiers[room.type] || 1.0;
  }

  // --- Player Charisma Modifier ---
  function getPlayerCharismaModifier() {
    const player = window.G.player;
    if (!player || !player.stats) return 1.0;
    const charisma = player.stats.charisma || 10; // Default to 10 if not set
    return 0.8 + (charisma * 0.02); // 0.8 to 1.2 modifier
  }

  // --- Apply Attraction Impact ---
  function applyAttractionImpact(npc, impact) {
    if (!npc.relationship) npc.relationship = {};
    const temperamentMod = window.getTemperamentModifier ? window.getTemperamentModifier(npc.temperament) : 0;
    const multiplier = 1.0 + (temperamentMod * 0.1);
    npc.relationship.attraction = (npc.relationship.attraction || 0) + Math.round(impact * multiplier);
    npc.relationship.attraction = Math.max(0, Math.min(100, npc.relationship.attraction));
  }

  // --- Apply Lust Impact ---
  function applyLustImpact(npc, impact, envModifier = 1.0) {
    if (!npc.relationship) npc.relationship = {};
    const temperamentMod = window.getTemperamentModifier ? window.getTemperamentModifier(npc.temperament) : 0;
    const temperamentMultiplier = 1.0 + (temperamentMod * 0.1);
    const charismaMultiplier = getPlayerCharismaModifier();
    const totalModifier = envModifier * temperamentMultiplier * charismaMultiplier;
    npc.relationship.lust = (npc.relationship.lust || 0) + Math.round(impact * totalModifier);
    npc.relationship.lust = Math.max(0, Math.min(100, npc.relationship.lust));
  }

  // --- NSFW Catalogue ---
  const NSFW_CONVERSATION_CATALOGUE = [
    {
      id: "flirt",
      label: "Flirt",
      text: "You flirt with them, testing their interest...",
      priority: 10,
      repeat: "session",
      conditions: { minFavor: 5, minAttraction: 0 },
      relationshipImpact: { lust: +2, attraction: +1 },
      resetTimer: { turns: 5 },
    },
    {
      id: "seduce",
      label: "Seduce",
      text: "You make a bold advance...",
      priority: 20,
      conditions: { minLust: 10, minAttraction: 5 },
      relationshipImpact: { lust: +5, attraction: +2 },
      action: function(npc) { console.log(`[NSFW] Seduction attempt with ${npc.name}`); },
    },
  ];

  // --- Inject NSFW Options ---
  function injectNSFWOptions() {
    if (!NSFW_SYSTEM_ENABLED) return;
    if (!window.NPC_CONVERSATION_CATALOGUE) {
      window.NPC_CONVERSATION_CATALOGUE = [];
    }
    const existingIds = new Set(window.NPC_CONVERSATION_CATALOGUE.map(opt => opt.id));
    NSFW_CONVERSATION_CATALOGUE.forEach(option => {
      if (!existingIds.has(option.id)) {
        window.NPC_CONVERSATION_CATALOGUE.push(option);
      }
    });
  }

  // --- Initialize NPC Relationship State ---
  function ensureNPCRelationshipState(npc) {
    if (!npc) return;
    if (!npc.relationship) {
      npc.relationship = {
        lust: 0,
        attraction: 0,
        orientation: "bi"
      };
    }
    if (typeof npc.relationship.lust !== "number") npc.relationship.lust = 0;
    if (typeof npc.relationship.attraction !== "number") npc.relationship.attraction = 0;
    if (!npc.relationship.orientation) npc.relationship.orientation = "bi";
  }

  // --- Extend chooseChatOption() ---
  function extendChooseChatOption() {
    if (typeof window.chooseChatOption !== "function") {
      console.warn("[NSFW System] chooseChatOption not found, retrying later...");
      setTimeout(extendChooseChatOption, 1000);
      return;
    }
    const original = window.chooseChatOption;
    window.chooseChatOption = function(option) {
      const result = original.apply(this, arguments);
      const npc = window.G.activeNPC;
      if (!npc || !option.relationshipImpact) return result;

      const envModifier = getEnvironmentalModifier(window.G.activeRoom);
      if (option.relationshipImpact.lust) {
        applyLustImpact(npc, option.relationshipImpact.lust, envModifier);
      }
      if (option.relationshipImpact.attraction) {
        applyAttractionImpact(npc, option.relationshipImpact.attraction);
      }
      if (option.action && typeof option.action === 'function') {
        option.action(npc);
      }
      return result;
    };
  }

  // --- Extend advanceStoryTurn() for Decay ---
  function extendAdvanceStoryTurn() {
    if (typeof window.advanceStoryTurn !== "function") {
      console.warn("[NSFW System] advanceStoryTurn not found, retrying later...");
      setTimeout(extendAdvanceStoryTurn, 1000);
      return;
    }
    const original = window.advanceStoryTurn;
    window.advanceStoryTurn = function(steps = 1) {
      const result = original.apply(this, arguments);
      if (window.G.story && window.G.story.turnCounter % 10 === 0) {
        const allNPCs = Object.values(window.G.roomMap || {}).flatMap(room => room.creatures || []);
        for (const npc of allNPCs) {
          if (npc && npc.relationship) {
            npc.relationship.lust = Math.max(0, (npc.relationship.lust || 0) - 1);
            if (window.G.story.turnCounter % 20 === 0) {
              npc.relationship.attraction = Math.max(0, (npc.relationship.attraction || 0) - 0.5);
            }
          }
        }
      }
      return result;
    };
  }

  // --- Initialize ---
  function initNSFWSystem() {
    if (!window.G) {
      setTimeout(initNSFWSystem, 1000);
      return;
    }

    window.ensureNPCRelationshipState = ensureNPCRelationshipState;
    injectNSFWOptions();
    extendChooseChatOption();
    extendAdvanceStoryTurn();

    if (typeof window.createNPC === "function") {
      const originalCreateNPC = window.createNPC;
      window.createNPC = function(species, room, zoneTemplate, options = {}) {
        const npc = originalCreateNPC(species, room, zoneTemplate, options);
        ensureNPCRelationshipState(npc);
        return npc;
      };
    }

    console.log("[NSFW System] Initialized with passive stats");
  }

  initNSFWSystem();
})();