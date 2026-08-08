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
      relationshipImpact: { lust: +2, attraction: +1 },
      resetTimer: { turns: 5 }
    },
    {
      id: "seduce",
      label: "Seduce",
      text: "You make a bold advance...",
      priority: 20,
      relationshipImpact: { lust: +5, attraction: +2 },
      action: function(npc) { console.log("[NSFW] Seduction attempt with " + npc.name); }
    }
  ];

  function injectNSFWOptions() {
    if (!NSFW_SYSTEM_ENABLED) return;
    if (!window.NPC_CONVERSATION_CATALOGUE) window.NPC_CONVERSATION_CATALOGUE = [];
    const existingIds = new Set(window.NPC_CONVERSATION_CATALOGUE.map(opt => opt.id));
    NSFW_CONVERSATION_CATALOGUE.forEach(option => {
      if (!existingIds.has(option.id)) window.NPC_CONVERSATION_CATALOGUE.push(option);
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
