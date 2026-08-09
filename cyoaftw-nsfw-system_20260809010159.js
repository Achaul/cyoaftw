// === cyoaftw-nsfw-system.js ===
(function() {
  'use strict';

  const NSFW_SYSTEM_ENABLED = true;

  function getEnvironmentalModifier(room) {
    if (!room) return 1.0;
    const modifiers = {
      tavern: 1.1,
      inn: 1.1,
      dungeon: 0.8,
      forest: 0.9,
      private: 1.2
    };
    return modifiers[room.type] || 1.0;
  }

  function getPlayerCharismaModifier() {
    const player = window.G.player;
    if (!player || !player.stats) return 1.0;
    const charisma = player.stats.charisma || 10;
    return 0.8 + (charisma * 0.02);
  }

  function applyAttractionImpact(npc, impact) {
    if (!npc.relationship) npc.relationship = {};
    const temperamentMod = window.getTemperamentModifier ? window.getTemperamentModifier(npc.temperament) : 0;
    const multiplier = 1.0 + (temperamentMod * 0.1);
    npc.relationship.attraction = (npc.relationship.attraction || 0) + Math.round(impact * multiplier);
    npc.relationship.attraction = Math.max(0, Math.min(100, npc.relationship.attraction));
  }

  function applyLustImpact(npc, impact, envModifier = 1.0) {
    if (!npc.relationship) npc.relationship = {};
    const temperamentMod = window.getTemperamentModifier ? window.getTemperamentModifier(npc.temperament) : 0;
    const temperamentMultiplier = 1.0 + (temperamentMod * 0.1);
    const charismaMultiplier = getPlayerCharismaModifier();
    const totalModifier = envModifier * temperamentMultiplier * charismaMultiplier;
    npc.relationship.lust = (npc.relationship.lust || 0) + Math.round(impact * totalModifier);
    npc.relationship.lust = Math.max(0, Math.min(100, npc.relationship.lust));
  }

  const NSFW_CONVERSATION_CATALOGUE = [
    {
      id: "flirt",
      label: "Flirt",
      text: "You flirt with them, testing their interest...",
      priority: 10,
      repeat: "session",
      conditions: { romanceEligible: true, maxHostility: 70 },
      relationshipImpact: { lust: +2, attraction: +1 },
      resetTimer: { turns: 5 }
    },
    {
      id: "seduce",
      label: "Seduce",
      text: "You suggest a romantic follow-up, like meeting for dinner or a private walk...",
      priority: 20,
      conditions: { minAttraction: 15 },
      isInquiry: true,
      relationshipImpact: { lust: +3, attraction: +5 },
      onAccept: { lust: +5, attraction: +8 },
      onReject: { hostility: +10, attraction: -5 },
      resetTimer: { turns: 10 }
    },
    {
      id: "proposition",
      label: "Proposition",
      text: "You make a direct physical advance, testing if they're up for something quick and immediate...",
      priority: 25,
      conditions: { minAttraction: 10, minLust: 15 },
      isInquiry: true,
      relationshipImpact: { lust: +8, attraction: +2 },
      onAccept: { lust: +12, attraction: +3 },
      onReject: { hostility: +15, lust: -3 },
      resetTimer: { turns: 15 },
      action: function(npc) { console.log("[NSFW] Proposition made to " + npc.name); }
    }
  ];

  function injectNSFWOptions() {
    if (!NSFW_SYSTEM_ENABLED) return;
    if (!window.NPC_CONVERSATION_CATALOGUE) window.NPC_CONVERSATION_CATALOGUE = [];
    NSFW_CONVERSATION_CATALOGUE.forEach(option => {
      const existingIndex = window.NPC_CONVERSATION_CATALOGUE.findIndex(o => o.id === option.id);
      if (existingIndex >= 0) {
        window.NPC_CONVERSATION_CATALOGUE[existingIndex] = option;
      } else {
        window.NPC_CONVERSATION_CATALOGUE.push(option);
      }
    });
  }

  function ensureNPCRelationshipState(npc) {
    if (!npc) return;
    if (!npc.relationship) npc.relationship = { lust: 0, attraction: 0, orientation: "bi" };
    if (typeof npc.relationship.lust !== "number") npc.relationship.lust = 0;
    if (typeof npc.relationship.attraction !== "number") npc.relationship.attraction = 0;
    if (!npc.relationship.orientation) npc.relationship.orientation = "bi";
  }

  function getCreatureTemplate(type) {
    if (Array.isArray(window.creatureTemplates)) {
      const lowerType = String(type || "").toLowerCase();
      return window.creatureTemplates.find(t => String(t.type || "").toLowerCase() === lowerType) || {};
    }
    if (typeof window.getSpeciesTemplate === "function") return window.getSpeciesTemplate(type) || {};
    return {};
  }

  function pickByWeights(options) {
    const total = options.reduce((sum, o) => sum + (o.w || 0), 0);
    if (total <= 0) return options[0]?.v;
    let roll = Math.random() * total;
    for (let o of options) {
      if (roll < (o.w || 0)) return o.v;
      roll -= (o.w || 0);
    }
    return options[0]?.v;
  }

  function pickFrom(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function generatePhysicalTraits(npc) {
    if (!npc || !NSFW_SYSTEM_ENABLED) return null;
    const type = npc.species || "Unknown";
    const gender = npc.gender;
    const template = getCreatureTemplate(type) || {};
    const isHumanoid = template.isHumanoid ?? true;
    const size = template.size || "medium";
    const isCivilized = template.isCivilized === true;
    const anatomy = {};
    const tones = Array.isArray(template.allowedSkinTones) ? template.allowedSkinTones : ["pale", "fair", "tan", "olive", "brown", "dark"];
    const tone = pickFrom(tones);

    function deriveAreolaPigment(baseTone) {
      const darkSet = ["dark", "deep brown", "brown", "black"];
      const lightSet = ["pale", "fair", "ivory"];
      const midSet = ["tan", "olive"];
      baseTone = String(baseTone || "").toLowerCase();
      if (darkSet.includes(baseTone)) return pickFrom(["deep brown", "darkened", "rich umber"]);
      if (lightSet.includes(baseTone)) return pickFrom(["soft pink", "rosy", "peach-toned"]);
      if (midSet.includes(baseTone)) return pickFrom(["warm rose", "muted brown", "soft terracotta"]);
      return pickFrom(["softly tinted", "natural toned"]);
    }

    function deriveContrastPigment(baseTone) {
      const darkSet = ["dark", "deep brown", "brown", "black"];
      const lightSet = ["pale", "fair", "ivory"];
      const midSet = ["tan", "olive"];
      baseTone = String(baseTone || "").toLowerCase();
      if (darkSet.includes(baseTone)) return pickFrom(["slightly darker", "deepened", "richly shaded"]);
      if (lightSet.includes(baseTone)) return pickFrom(["soft pink", "rosy", "gently flushed"]);
      if (midSet.includes(baseTone)) return pickFrom(["warm toned", "softly blushed", "slightly deeper"]);
      return pickFrom(["slightly darker", "naturally toned"]);
    }

    const areolaPigment = deriveAreolaPigment(tone);
    const contrastPigment = deriveContrastPigment(tone);
    const surfaceType = template.visualProfile?.surface?.type || "skin";
    const surfaceProfile = template.visualProfile?.surface || {};
    anatomy.body = {
      color: tone,
      surfaceType: surfaceType,
      texture: Array.isArray(surfaceProfile.texture) ? pickFrom(surfaceProfile.texture) : surfaceProfile.texture || null,
      sheen: surfaceProfile.sheen || null,
      coverage: surfaceProfile.coverage || null
    };

    if ((template.appearanceProfile === "feathered") || (surfaceType === "feathers")) {
      anatomy.plumage = { color: tone, texture: pickFrom(["sleek", "glossy", "mottled"]) };
    }

    const allowedHairColors = Array.isArray(template.allowedHairColors) ? template.allowedHairColors : null;
    if (allowedHairColors?.length) {
      const hairColor = pickFrom(allowedHairColors);
      if (hairColor !== "none") {
        anatomy.hair = { color: hairColor, style: pickFrom(["short", "long", "cropped", "braided", "tied back", "loose"]) };
      }
    }

    const allowedEyeColors = Array.isArray(template.allowedEyeColors) ? template.allowedEyeColors : null;
    if (allowedEyeColors && allowedEyeColors.length) {
      const eyeColor = pickFrom(allowedEyeColors);
      anatomy.eyes = { color: eyeColor, description: eyeColor, status: [], health: 100 };
    }

    if (isHumanoid && gender && gender !== "none" && gender !== "undefined") {
      const g = String(gender).toLowerCase();
      anatomy.hips = { sizeCategory: pickFrom(["narrow", "average", "wide"]), description: anatomy.hips.sizeCategory, status: [], health: 100 };
      anatomy.buttocks = { sizeCategory: pickFrom(["small", "medium", "large"]), description: anatomy.buttocks.sizeCategory, status: [], health: 100 };

      let breastSize = "flat";
      let breastDescription = "a flat, toned chest";
      if (g === "female") { breastSize = "medium"; breastDescription = "a modest bust"; }
      anatomy.breasts = {
        sizeCategory: breastSize,
        description: breastDescription,
        status: [],
        health: 100,
        fluids: [],
        nipples: { size: pickFrom(["small", "average", "prominent"]), texture: pickFrom(["smooth", "softly raised", "slightly raised"]) },
        areolas: { size: pickFrom(["small", "average", "wide"]), pigmentation: areolaPigment }
      };

      if (template.sensualProfile?.breasts) {
        const tb = template.sensualProfile.breasts;
        anatomy.breasts.description = tb.description || anatomy.breasts.description;
        if (tb.size) anatomy.breasts.sizeCategory = tb.size;
        if (tb.nipples) anatomy.breasts.nipples = { size: tb.nipples.size || anatomy.breasts.nipples.size, color: tb.nipples.color || null, texture: tb.nipples.texture || anatomy.breasts.nipples.texture };
        if (tb.areolas) anatomy.breasts.areolas = { size: tb.areolas.size || anatomy.breasts.areolas.size, pigmentation: tb.areolas.color || areolaPigment, texture: tb.areolas.texture || null };
      }

      anatomy.genitalSize = { sizeCategory: pickFrom(["small", "medium", "large"]), description: "natural proportions", status: [], health: 100 };

      let pubicHairStyle = pickFrom(isCivilized ? ["smooth", "neatly trimmed", "natural", "thick"] : ["a messy natural", "a unkept and thick", "a long thick and wild"]);
      let pubicHairColor = pickFrom(["dark", "brown", "black", "blonde", "auburn", "grey"]);
      anatomy.pubicHair = { style: pubicHairStyle, color: pubicHairColor, description: pubicHairStyle === "smooth" ? "smooth and bare" : pubicHairStyle + " " + pubicHairColor + " hair", status: [], health: 100 };

      const gd = g === "male" ? anatomy.genitalSize.sizeCategory + " member" : (g === "female" ? anatomy.genitalSize.sizeCategory + " sex" : "featureless");
      anatomy.genitals = { description: gd, pigmentation: contrastPigment, status: [], health: 100 };
      anatomy.anus = { description: "natural", pigmentation: contrastPigment, status: [], health: 100 };
    }

    const bodyweight = pickFrom(["skinny", "smoothly built", "muscular", "chubby", "overweight"]);
    return { anatomy: anatomy, size: size, bodyweight: bodyweight };
  }

  // Helper: Find nearest room of specific types (BFS)
  function findNearestRoomOfTypes(startCoords, types) {
    const visited = new Set();
    const queue = [{ coords: startCoords, distance: 0 }];
    const typeSet = new Set(types.map(t => t.toLowerCase()));

    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current.coords)) continue;
      visited.add(current.coords);

      const room = window.G.roomMap[current.coords];
      if (room && typeSet.has((room.type || "").toLowerCase())) {
        return room;
      }

      if (room?.exits) {
        Object.values(room.exits).forEach(exit => {
          if (exit?.key && !visited.has(exit.key)) {
            queue.push({ coords: exit.key, distance: current.distance + 1 });
          }
        });
      }
    }
    return null;
  }

  // Helper: Find nearest private room (no creatures or specific types)
  function findNearestPrivateRoom(startCoords) {
    const privateTypes = ["alleyway", "cellar", "storage", "closet"];
    const privateTypeSet = new Set(privateTypes);
    const visited = new Set();
    const queue = [{ coords: startCoords, distance: 0 }];

    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current.coords)) continue;
      visited.add(current.coords);

      const room = window.G.roomMap[current.coords];
      if (room) {
        const isPrivateType = privateTypeSet.has((room.type || "").toLowerCase());
        const isEmpty = !room.creatures || room.creatures.length === 0;
        if (isPrivateType || isEmpty) {
          return room;
        }
      }

      if (room?.exits) {
        Object.values(room.exits).forEach(exit => {
          if (exit?.key && !visited.has(exit.key)) {
            queue.push({ coords: exit.key, distance: current.distance + 1 });
          }
        });
      }
    }
    return null;
  }

  function applyInquiryResponse(npc, option, responseText) {
    if (!npc || !option || !option.isInquiry) return responseText;
    const acceptedMatch = responseText.match(/^\[ACCEPTED\]\s+(.*)/s);
    const rejectedMatch = responseText.match(/^\[REJECTED\]\s+(.*)/s);
    if (acceptedMatch) {
      const cleanText = acceptedMatch[1];
      if (option.onAccept) {
        applyRelationshipImpacts(npc, option.onAccept);
      }
      if (typeof addToParty === "function") {
        addToParty(npc);
      }

      // Handle routing for seduce/proposition
      if (option.id === "seduce" || option.id === "proposition") {
        const isForward = npc.temperament === "forward" || npc.temperament === "bold";
        const startCoords = window.G.player.coords;
        const targetRoom = option.id === "seduce"
            ? findNearestRoomOfTypes(startCoords, ["Tavern", "Inn", "Inn Common"])
            : findNearestPrivateRoom(startCoords);

        if (targetRoom) {
          if (isForward && typeof window.teleportPlayerToCoords === "function") {
            setTimeout(() => {
              window.teleportPlayerToCoords(targetRoom.coords);
            }, 100);
            return cleanText + ` ${npc.name} takes your hand. "Follow me to the ${targetRoom.displayName || targetRoom.type}."`;
          } else {
            npc._pendingSeductionDestination = targetRoom.coords;
            npc._pendingSeductionOption = option.id;

            const followOption = {
              id: "follow-seduction-suggestion",
              label: `Go with ${npc.name} to the ${targetRoom.displayName || targetRoom.type}`,
              text: `You agree to go with ${npc.name} to the ${targetRoom.displayName || targetRoom.type}.`,
              priority: 5,
              action: function(selectedNPC) {
                if (selectedNPC._pendingSeductionDestination && typeof window.teleportPlayerToCoords === "function") {
                  window.teleportPlayerToCoords(selectedNPC._pendingSeductionDestination);
                  delete selectedNPC._pendingSeductionDestination;
                  delete selectedNPC._pendingSeductionOption;
                }
              }
            };

            if (!window.NPC_CONVERSATION_CATALOGUE.some(o => o.id === followOption.id)) {
              window.NPC_CONVERSATION_CATALOGUE.push(followOption);
            }

            return cleanText + ` ${npc.name} suggests going to the ${targetRoom.displayName || targetRoom.type}.`;
          }
        }
      }

      console.log("[NSFW] Inquiry ACCEPTED for " + (option.id || "unknown"));
      return cleanText;
    }
    if (rejectedMatch) {
      const cleanText = rejectedMatch[1];
      if (option.onReject) {
        applyRelationshipImpacts(npc, option.onReject);
      }
      console.log("[NSFW] Inquiry REJECTED for " + (option.id || "unknown"));
      return cleanText;
    }
    return responseText;
  }

  function applyRelationshipImpacts(npc, impacts) {
    if (!npc || !impacts) return;
    if (!npc.relationship) npc.relationship = {};
    if (impacts.lust) applyLustImpact(npc, impacts.lust);
    if (impacts.attraction) applyAttractionImpact(npc, impacts.attraction);
    if (impacts.hostility) {
      npc.relationship.hostility = (npc.relationship.hostility || 0) + impacts.hostility;
      npc.relationship.hostility = Math.max(0, Math.min(100, npc.relationship.hostility));
    }
  }

  function extendChooseChatOption() {
    if (typeof window.chooseChatOption !== "function") {
      console.warn("[NSFW System] chooseChatOption not found, retrying...");
      setTimeout(extendChooseChatOption, 1000);
      return;
    }
    const orig = window.chooseChatOption;
    window.chooseChatOption = function(option) {
      const result = orig.apply(this, arguments);
      const npc = window.G.activeNPC;
      if (!npc || !option.relationshipImpact) return result;
      const envMod = getEnvironmentalModifier(window.G.activeRoom);
      if (option.relationshipImpact.lust) applyLustImpact(npc, option.relationshipImpact.lust, envMod);
      if (option.relationshipImpact.attraction) applyAttractionImpact(npc, option.relationshipImpact.attraction);
      if (option.action && typeof option.action === "function") option.action(npc);
      return result;
    };
  }

  function extendAdvanceStoryTurn() {
    if (typeof window.advanceStoryTurn !== "function") {
      console.warn("[NSFW System] advanceStoryTurn not found, retrying...");
      setTimeout(extendAdvanceStoryTurn, 1000);
      return;
    }
    const orig = window.advanceStoryTurn;
    window.advanceStoryTurn = function(steps = 1) {
      const result = orig.apply(this, arguments);
      if (window.G.story && window.G.story.turnCounter % 10 === 0) {
        Object.values(window.G.roomMap || {}).flatMap(function(r) { return r.creatures || []; }).forEach(function(npc) {
          if (npc && npc.relationship) {
            npc.relationship.lust = Math.max(0, (npc.relationship.lust || 0) - 1);
            if (window.G.story.turnCounter % 20 === 0) {
              npc.relationship.attraction = Math.max(0, (npc.relationship.attraction || 0) - 0.5);
            }
          }
        });
      }
      return result;
    };
  }

  function initNSFWSystem() {
    if (!window.G) {
      setTimeout(initNSFWSystem, 1000);
      return;
    }
    window.ensureNPCRelationshipState = ensureNPCRelationshipState;
    window.generatePhysicalTraits = generatePhysicalTraits;
    window.applyInquiryResponse = applyInquiryResponse;
    injectNSFWOptions();
    extendChooseChatOption();
    if (!window.queryConversationCatalogue) {
      window.queryConversationCatalogue = function(npc, context) {
        return window.NPC_CONVERSATION_CATALOGUE || [];
      };
    }
    extendAdvanceStoryTurn();
    if (typeof window.createNPC === "function") {
      const orig = window.createNPC;
      window.createNPC = function(species, room, zoneTemplate, options) {
        if (options === void 0) options = {};
        const npc = orig(species, room, zoneTemplate, options);
        ensureNPCRelationshipState(npc);
        if (NSFW_SYSTEM_ENABLED) {
          const nsfwTraits = generatePhysicalTraits(npc);
          if (nsfwTraits) npc.nsfwTraits = nsfwTraits;
        }
        return npc;
      };
    }
    console.log("[NSFW System] Initialized with passive stats and physical traits");
  }

  initNSFWSystem();
})();
