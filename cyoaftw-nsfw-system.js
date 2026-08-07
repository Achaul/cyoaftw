// === cyoaftw-nsfw-system.js ===
(function() {
  'use strict';

  // --- Config ---
  const NSFW_SYSTEM_ENABLED = true;

  // --- NSFW Catalogue (Replace with your functions) ---
  const NSFW_CONVERSATION_CATALOGUE = [
    {
      id: "flirt",
      label: "Flirt",
      text: "You flirt with them, testing their interest...",
      priority: 10,
      repeat: "session",
      conditions: {
        minFavor: 5,
        minAttraction: 0,
      },
      relationshipImpact: { lust: +2, attraction: +1 },
      resetTimer: { turns: 5 },
    },
    {
      id: "seduce",
      label: "Seduce",
      text: "You make a bold advance...",
      priority: 20,
      conditions: {
        minLust: 10,
        minAttraction: 5,
      },
      relationshipImpact: { lust: +5, attraction: +2 },
      action: function(npc) {
        // Replace with your NSFW function
        console.log(`[NSFW] Seduction attempt with ${npc.name}`);
      },
    },
    {
      id: "intimate_act",
      label: "Intimate Act",
      text: "You engage in an intimate act...",
      priority: 30,
      conditions: {
        minLust: 20,
        minAttraction: 10,
        orientation: "bi", // Example: Only for bi/homo NPCs
      },
      relationshipImpact: { lust: +10, attraction: +3 },
      action: function(npc) {
        // Replace with your NSFW function
        console.log(`[NSFW] Intimate act with ${npc.name}`);
      },
    },
    // Add more of your NSFW functions here
  ];

  // --- Inject NSFW Options into Core Catalogue ---
  function injectNSFWOptions() {
    if (!NSFW_SYSTEM_ENABLED || !window.NPC_CONVERSATION_CATALOGUE) return;
    window.NPC_CONVERSATION_CATALOGUE.push(...NSFW_CONVERSATION_CATALOGUE);
  }

  // --- Extend chooseChatOption() to Apply Lust/Attraction ---
  function extendChooseChatOption() {
    const original = window.chooseChatOption;
    window.chooseChatOption = function(option) {
      const result = original.apply(this, arguments);

      // Apply lust/attraction impacts if the option has them
      if (option.relationshipImpact) {
        const npc = window.G.activeNPC;
        if (npc && npc.relationship) {
          if (option.relationshipImpact.lust !== undefined) {
            npc.relationship.lust = (npc.relationship.lust || 0) + option.relationshipImpact.lust;
          }
          if (option.relationshipImpact.attraction !== undefined) {
            npc.relationship.attraction = (npc.relationship.attraction || 0) + option.relationshipImpact.attraction;
          }
        }
      }

      // Execute custom NSFW actions
      if (option.action && typeof option.action === 'function') {
        option.action(window.G.activeNPC);
      }

      return result;
    };
  }

  // --- Initialize ---
  function initNSFWSystem() {
    if (!window.G || !window.NPC_CONVERSATION_CATALOGUE) {
      setTimeout(initNSFWSystem, 1000); // Retry if core isn't ready
      return;
    }

    injectNSFWOptions();
    extendChooseChatOption();
    console.log("[NSFW System] Initialized");
  }

  // Start initialization
  initNSFWSystem();
})();