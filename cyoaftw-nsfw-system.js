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
    const temperamentMod = window.getTemperamentModifier(npc.temperament);
    const multiplier = 1.0 + (temperamentMod * 0.1); // Scale by 10% per point
    npc.relationship.attraction = (npc.relationship.attraction || 0) + Math.round(impact * multiplier);
    npc.relationship.attraction = Math.max(0, Math.min(100, npc.relationship.attraction));
  }

  // --- Apply Lust Impact ---
  function applyLustImpact(npc, impact, envModifier = 1.0) {
    if (!npc.relationship) npc.relationship = {};
    const temperamentMod = window.getTemperamentModifier(npc.temperament);
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
    if (!NSFW_SYSTEM_ENABLED || !window.NPC_CONVERSATION_CATALOGUE) return;
    window.NPC_CONVERSATION_CATALOGUE.push(...NSFW_CONVERSATION_CATALOGUE);
  }

  // --- Extend chooseChatOption() ---
  function extendChooseChatOption() {
    const original = window.chooseChatOption;
    window.chooseChatOption = function(option) {
      const result = original.apply(this, arguments);
      const npc = window.G.activeNPC;
      if (!npc || !option.relationshipImpact) return result;

      const envModifier = getEnvironmentalModifier(window.G.currentRoom);
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
    const original = window.advanceStoryTurn;
    window.advanceStoryTurn = function(steps = 1) {
      const result = original.apply(this, arguments);
      if (window.G.story.turnCounter % 10 === 0) {
        for (const npc of Object.values(window.G.npcs || {})) {
          if (npc.relationship) {
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
    if (!window.G || !window.NPC_CONVERSATION_CATALOGUE) {
      setTimeout(initNSFWSystem, 1000);
      return;
    }
    injectNSFWOptions();
    extendChooseChatOption();
    extendAdvanceStoryTurn();
    console.log("[NSFW System] Initialized with passive stats");
  }

  initNSFWSystem();
})();