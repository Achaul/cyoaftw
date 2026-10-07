// === cyoaftw-nsfw-system.js === - v2026-09-11-002
// Session followers, isAloneWithNPC fix, typeof guards, clothed narration, early window exposure, make-a-move, action function passthrough fix, stat-based fallback acceptance, nsfw wrapper re-apply
window.__NSFW_SYSTEM_VERSION = "2026-09-24-001";
console.log("[BODY-DEBUG] nsfw-system.js FILE PARSED (before IIFE)");
try {
(function() {
  'use strict';

// NSFW conversation options are now defined in base catalogue (cyoaftw-npc-data.js)

// NSFW options are defined in base catalogue - no injection needed
console.log("[NSFW System] Loaded v2026-09-11-002 - stat-based fallback acceptance + follow action fix + nsfw wrapper re-apply");

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
    const player = window.G && window.G.player;
    if (!player || !player.stats) return 1.0;
    // Route through the engine accessor so worn-clothing quality, carried
    // trinkets and potion bonuses all count (the engine exposes getSetupStat
    // on window - without that exposure this falls back to raw stats).
    // Fallback 3 matches the setup baseline - the old "|| 10" default sat
    // above the design range (base 3 -> 0.86x, 12 -> 1.04x) whenever stats
    // were missing.
    const charisma = typeof window.getSetupStat === "function"
      ? window.getSetupStat("charisma", 3)
      : (player.stats.charisma || 3);
    return 0.8 + (charisma * 0.02);
  }

  function applyAttractionImpact(npc, impact) {
    // Single stat pool: memory.* (the legacy npc.relationship.* pool is
    // folded in once by migrateNPCRelationshipPool in cyoaftw-npc-data.js).
    npc.memory = npc.memory || {};
    const temperamentMod = window.getTemperamentModifier ? window.getTemperamentModifier(npc.temperament) : 0;
    const multiplier = 1.0 + (temperamentMod * 0.1);
    // Charisma scales attractiveness gains the same way lust gains are
    // scaled below - part of making charisma matter across the board.
    const charismaMultiplier = getPlayerCharismaModifier();
    const gain = Math.round(impact * multiplier * charismaMultiplier);
    // Track the action-earned share so recomputeNPCAttraction (interaction
    // start) keeps it on top of the freshly computed base.
    npc.memory.attractionEarned = (typeof npc.memory.attractionEarned === "number" ? npc.memory.attractionEarned : 0) + gain;
    npc.memory.attraction = Math.max(0, Math.min(100, (npc.memory.attraction || 0) + gain));
  }

  function applyLustImpact(npc, impact, envModifier = 1.0) {
    npc.memory = npc.memory || {};
    const temperamentMod = window.getTemperamentModifier ? window.getTemperamentModifier(npc.temperament) : 0;
    const temperamentMultiplier = 1.0 + (temperamentMod * 0.1);
    const charismaMultiplier = getPlayerCharismaModifier();
    const totalModifier = envModifier * temperamentMultiplier * charismaMultiplier;
    npc.memory.lust = Math.max(0, Math.min(100, (npc.memory.lust || 0) + Math.round(impact * totalModifier)));
  }

  // Note: NSFW_CONVERSATION_CATALOGUE is already defined at the top of this file
  // The rest of the code will use the catalogue defined above

  function ensureNPCRelationshipState(npc) {
    if (!npc) return;
    // Memory.* is the single stat pool; run the one-time legacy-merge first.
    if (typeof window.migrateNPCRelationshipPool === "function") {
      window.migrateNPCRelationshipPool(npc);
    }
    npc.memory = npc.memory || {};
    if (typeof npc.memory.lust !== "number") npc.memory.lust = 0;
    if (typeof npc.memory.attraction !== "number") npc.memory.attraction = 0;
    if (typeof npc.memory.arousal !== "number") npc.memory.arousal = 0;
    if (typeof npc.memory.disinhibition !== "number") npc.memory.disinhibition = 0;
    if (!npc.memory.orientation) npc.memory.orientation = "bi";
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
      const hipSize = pickFrom(["narrow", "average", "wide"]);
      anatomy.hips = { sizeCategory: hipSize, description: hipSize, status: [], health: 100 };
      const buttockSize = pickFrom(["small", "medium", "large"]);
      anatomy.buttocks = { sizeCategory: buttockSize, description: buttockSize, status: [], health: 100 };

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

      // Genital size tied to creature size
      // Small creatures (goblin, halfling, dwarf) tend to have smaller genitals
      // Large creatures (orc) tend to have larger genitals
      let genitalSizeCategory;
      if (size === "tiny" || size === "small") {
        genitalSizeCategory = pickFrom(["small", "small", "medium"]); // 66% small, 33% medium
      } else if (size === "large") {
        genitalSizeCategory = pickFrom(["medium", "large", "large"]); // 33% medium, 66% large
      } else {
        genitalSizeCategory = pickFrom(["small", "medium", "medium", "large"]); // balanced for medium
      }
      anatomy.genitalSize = { sizeCategory: genitalSizeCategory, description: "natural proportions", status: [], health: 100 };

      // Pubic hair - civilized species have 40% chance of trimmed hair and no perianal hair
      // Non-civilized always have unkept/messy hair
      let pubicHairStyle, pubicHairDescription, hasPerianalHair;
      
      if (isCivilized) {
        // 40% chance of trimmed/groomed, 60% chance of natural/thick
        const isTrimmed = Math.random() < 0.4;
        if (isTrimmed) {
          pubicHairStyle = pickFrom(["smooth", "neatly trimmed", "closely cropped"]);
          hasPerianalHair = false;
        } else {
          pubicHairStyle = pickFrom(["natural", "thick", "full"]);
          hasPerianalHair = true;
        }
      } else {
        // Non-civilized: always unkept/messy
        pubicHairStyle = pickFrom(["a messy natural", "a unkept and thick", "a long thick and wild", "a tangled thicket of", "an untamed growth of"]);
        hasPerianalHair = true;
      }
      
      let pubicHairColor = pickFrom(["dark", "brown", "black", "blonde", "auburn", "grey"]);
      pubicHairDescription = pubicHairStyle === "smooth" ? "smooth and bare" : pubicHairStyle + " " + pubicHairColor + " hair";
      
      anatomy.pubicHair = { 
        style: pubicHairStyle, 
        color: pubicHairColor, 
        description: pubicHairDescription,
        hasPerianalHair: hasPerianalHair,
        status: [], 
        health: 100 
      };
      
      // Add natural scents based on civilization and species
      // Civilized: subtle, clean scents; Non-civilized: strong, pungent, animalistic
      let scentDescription;
      if (isCivilized) {
        scentDescription = pickFrom([
          "a clean, fresh musk",
          "a subtle floral note",
          "a warm, soapy scent",
          "a light natural aroma",
          "a soft, intimate fragrance",
          "a faint hint of oil or perfume",
          "a barely-there musk",
          "a gentle, warm scent"
        ]);
      } else {
        // Non-civilized creatures have stronger, more primal scents
        if (type.toLowerCase().includes("goblin") || type.toLowerCase().includes("orc")) {
          scentDescription = pickFrom([
            "a pungent, animalistic musk",
            "a strong, earthy scent",
            "a sharp, feral aroma",
            "a deep, musky smell",
            "a robust, primal fragrance",
            "a potent, natural musk",
            "a wild, unwashed scent",
            "an intense, animal odor"
          ]);
        } else if (type.toLowerCase().includes("skeleton")) {
          scentDescription = pickFrom([
            "a musty, ancient odor",
            "a dry, bone-dust scent",
            "a faint, crypt-like aroma",
            "a cold, stone-like smell",
            "a trace of old incense and dust"
          ]);
        } else if (type.toLowerCase().includes("ghost")) {
          scentDescription = pickFrom([
            "a faint, ethereal aroma",
            "a cool, mist-like scent",
            "a trace of old perfumes",
            "a barely-perceptible chill",
            "the scent of memory and decay"
          ]);
        } else if (type.toLowerCase().includes("rat")) {
          scentDescription = pickFrom([
            "a sharp, animal musk",
            "a pungent, rodent scent",
            "a strong, earthy smell",
            "a nest-like aroma",
            "a fur-and-dirt fragrance"
          ]);
        } else {
          scentDescription = pickFrom([
            "a pungent, natural musk",
            "a strong, earthy scent",
            "a deep, animalistic aroma",
            "a robust, unwashed smell",
            "a primal, untamed fragrance"
          ]);
        }
      }
      anatomy.scent = { description: scentDescription, intensity: isCivilized ? "subtle" : "strong" };

      // Use proper genital names with descriptive size terms
      let genitalDescription = "featureless";
      const hasCloaca = template.cloaca === true;
      if (hasCloaca) {
        // Reptilian-kin have a single cloacal vent. Males house a hemipenis
        // within it; females present the vent itself. Size scales the hemipenis.
        if (g === "male") {
          const gs = anatomy.genitalSize.sizeCategory;
          if (gs === "medium") {
            genitalDescription = "hemipenis housed in a cloacal vent";
          } else if (gs === "large") {
            genitalDescription = "girthy hemipenis housed in a cloacal vent";
          } else if (gs === "small") {
            genitalDescription = "slender hemipenis housed in a cloacal vent";
          }
        } else if (g === "female") {
          genitalDescription = "cloacal vent";
        }
      } else if (g === "male") {
        const gs = anatomy.genitalSize.sizeCategory;
        if (gs === "medium") {
          genitalDescription = "penis";
        } else if (gs === "large") {
          genitalDescription = "girthy penis";
        } else if (gs === "small") {
          genitalDescription = "small penis";
        }
      } else if (g === "female") {
        const gs = anatomy.genitalSize.sizeCategory;
        if (gs === "medium") {
          genitalDescription = "vagina";
        } else if (gs === "large") {
          genitalDescription = "meaty vagina";
        } else if (gs === "small") {
          genitalDescription = "small vagina";
        }
      }
      anatomy.genitals = { description: genitalDescription, pigmentation: contrastPigment, status: [], health: 100 };

      // Anal orifice size tied to creature size
      // Small creatures have tight/snug, large creatures have loose/gaping/stretchy
      let analSizeDescription;
      if (size === "tiny") {
        analSizeDescription = pickFrom(["tight", "snug"]);
      } else if (size === "small") {
        analSizeDescription = pickFrom(["snug", "tight", "firm"]);
      } else if (size === "medium") {
        analSizeDescription = pickFrom(["firm", "snug", "supple"]);
      } else if (size === "large") {
        analSizeDescription = pickFrom(["loose", "gaping", "stretchy"]);
      } else {
        analSizeDescription = pickFrom(["tight", "snug", "firm", "supple", "loose"]);
      }

      if (hasCloaca) {
        // The cloaca doubles as the anal opening; describe the vent rather
        // than a separate anus so narration stays anatomically consistent.
        anatomy.anus = {
          description: analSizeDescription + " cloacal vent",
          size: analSizeDescription,
          sphincter: pickFrom(["tight", "snug", "firm", "supple", "responsive"]),
          pigmentation: contrastPigment,
          status: [],
          health: 100
        };
      } else {
        // Add sphincter description to anus with size-based descriptors
        anatomy.anus = {
          description: analSizeDescription + " anus",
          size: analSizeDescription,
          sphincter: pickFrom(["tight", "snug", "firm", "supple", "responsive"]),
          pigmentation: contrastPigment,
          status: [],
          health: 100
        };
      }
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

  function applyInquiryResponse(npc, option, responseText, affirmativeFromCache) {
    if (!npc || !option || !option.isInquiry) return responseText;

    // Ensure responseText is a string (waitForConversationReply can return
    // the cached reply object in some code paths)
    if (responseText && typeof responseText === "object" && responseText.text !== undefined) {
      if (affirmativeFromCache === undefined && responseText.affirmative !== undefined) {
        affirmativeFromCache = responseText.affirmative;
      }
      responseText = responseText.text || "";
    }
    responseText = String(responseText || "");

    console.log("[NSFW Inquiry] applyInquiryResponse called:", {
      optionId: option.id,
      affirmativeFromCache: affirmativeFromCache,
      responseTextStart: responseText.substring(0, 60)
    });

    // Use explicit affirmative field if provided (from cached reply object)
    let isAccepted = affirmativeFromCache === true;
    let isRejected = affirmativeFromCache === false;

    // Fallback: parse from text if affirmative was not explicitly provided.
    // NOTE: when affirmativeFromCache is undefined, both isAccepted and
    // isRejected are false (not undefined), so check for that case.
    if (affirmativeFromCache === undefined) {
        // Check if the AI reply with affirmative has arrived in the cache
        // since the engine started processing (timing race — the engine's
        // waitForConversationReply may have timed out before the AI responded,
        // using a fallback text string, but the real reply may now be cached).
        if (npc && npc.memory && npc.memory.cachedReplies && option.id) {
            var cachedReply = npc.memory.cachedReplies[option.id];
            if (cachedReply && typeof cachedReply === "object" && cachedReply.affirmative !== undefined) {
                affirmativeFromCache = cachedReply.affirmative;
                isAccepted = affirmativeFromCache === true;
                isRejected = affirmativeFromCache === false;
                console.log("[NSFW Inquiry] Recovered affirmative from cache:", affirmativeFromCache);
            }
        }
    }

    // If still undefined, try parsing from text markers
    if (affirmativeFromCache === undefined) {
        const acceptedMatch = responseText.match(/\[ACCEPTED\]\s+(.*)/s);
        const rejectedMatch = responseText.match(/\[REJECTED\]\s+(.*)/s);
        if (acceptedMatch) {
            isAccepted = true;
            responseText = acceptedMatch[1];
        } else if (rejectedMatch) {
            isRejected = true;
            responseText = rejectedMatch[1];
        }
    }

    // If affirmative is still unknown and this is seduce/proposition, check
    // the runtime cache directly as a last resort (the reply may have arrived
    // between the engine's fallback and this function call).
    if (affirmativeFromCache === undefined && !isAccepted && !isRejected &&
        (option.id === "seduce" || option.id === "proposition")) {
        if (typeof runtimeConversationState !== "undefined" && runtimeConversationState.replyCache) {
            for (var key in runtimeConversationState.replyCache) {
                var cached = runtimeConversationState.replyCache[key];
                if (cached && typeof cached === "object" && cached.affirmative === true &&
                    key.indexOf(option.id) !== -1) {
                    isAccepted = true;
                    console.log("[NSFW Inquiry] Recovered affirmative from runtime cache for", option.id);
                    break;
                }
            }
        }
    }

    // ── STAT-BASED FALLBACK ACCEPTANCE ───────────────────────────
    // If the AI hasn't returned an affirmative (not cached, timed out,
    // or unavailable), fall back to NPC stats to decide acceptance.
    // This ensures seduce/proposition can succeed without AI.
    if (!isAccepted && !isRejected && affirmativeFromCache === undefined &&
        (option.id === "seduce" || option.id === "proposition")) {
        var _favor = (npc.memory && typeof npc.memory.favorability === "number") ? npc.memory.favorability : 0;
        var _attraction = (npc.memory && typeof npc.memory.attraction === "number") ? npc.memory.attraction : 0;
        var _lust = (npc.memory && typeof npc.memory.lust === "number") ? npc.memory.lust : 0;
        var _temperament = String(npc.temperament || "").toLowerCase();
        var _isBold = _temperament === "forward" || _temperament === "bold" || _temperament === "lustful";

        // Seduce is easier — accepts if favor >= 20 or attraction >= 15 or lust >= 20
        // Proposition is harder — accepts if favor >= 40 or attraction >= 25 or lust >= 30
        // Bold NPCs get a -10 threshold reduction
        var _threshold = (option.id === "proposition") ? 40 : 20;
        var _attrThreshold = (option.id === "proposition") ? 25 : 15;
        var _lustThreshold = (option.id === "proposition") ? 30 : 20;
        if (_isBold) { _threshold -= 10; _attrThreshold -= 10; _lustThreshold -= 10; }

        if (_favor >= _threshold || _attraction >= _attrThreshold || _lust >= _lustThreshold) {
            isAccepted = true;
            console.log("[NSFW Inquiry] Stat-based fallback ACCEPT for", option.id,
                "(favor=" + _favor + ", attraction=" + _attraction + ", lust=" + _lust + ", bold=" + _isBold + ")");
        } else {
            isRejected = true;
            console.log("[NSFW Inquiry] Stat-based fallback REJECT for", option.id,
                "(favor=" + _favor + ", attraction=" + _attraction + ", lust=" + _lust + ")");
        }
    }

    // Process acceptance
    if (isAccepted) {
      if (option.onAccept) {
        applyRelationshipImpacts(npc, option.onAccept);
      }
      if (typeof addToParty === "function") {
        addToParty(npc);
      }

      // Clear any existing meetup state before setting up new one
      if (option.id === "seduce" || option.id === "proposition") {
        // Mark that this NPC has responded positively to a seduce/proposition,
        // which unlocks the "Ask them to follow you" session-follower option.
        npc._seductionAccepted = true;
        delete npc._meetupArrived;
        delete npc._meetupReturnTurn;
        delete npc._meetupLocation;
        delete npc._meetupRoomType;
        delete npc._meetupRoomName;
        delete npc._originalLocation;
        delete npc._pendingSeductionDestination;
        delete npc._pendingSeductionOption;
      }

      // Handle routing for seduce/proposition
      if (option.id === "seduce" || option.id === "proposition") {
        // Check if we're already in a suitable location for intimacy
        const currentRoom = window.G && window.G.activeRoom;
        const isAlreadySuitable = currentRoom && (
          option.id === "proposition"
            ? (typeof isPrivateLocation === "function" ? isPrivateLocation(currentRoom) : false)
            : ["Tavern", "Inn", "Inn Common"].some(t => currentRoom.type && currentRoom.type.includes(t))
        );

        // Check if we're alone with the NPC (for proposition)
        const isAloneWithNPC = currentRoom && Array.isArray(currentRoom.creatures) &&
          currentRoom.creatures.some(c => c === npc) &&
          currentRoom.creatures.filter(c => c !== npc && (c.isHumanoid || c.humanoid)).length === 0;

        console.log("[NSFW Routing] option=" + option.id, {
          roomType: currentRoom ? currentRoom.type : "none",
          isAlreadySuitable: isAlreadySuitable,
          isAloneWithNPC: isAloneWithNPC,
          startEncounter: option.startEncounter,
          creaturesCount: currentRoom && currentRoom.creatures ? currentRoom.creatures.length : 0,
          otherHumanoids: currentRoom && currentRoom.creatures
            ? currentRoom.creatures.filter(c => c !== npc && (c.isHumanoid || c.humanoid)).length : -1
        });

        // If already in suitable location, start intimacy encounter directly
        if (option.startEncounter && isAlreadySuitable && (
            option.id === "proposition" && isAloneWithNPC ||
            option.id === "seduce"
          )) {
          console.log("[NSFW Routing] → DIRECT INTIMACY (already in suitable location)");
          // Clear pending state
          delete npc._pendingSeductionDestination;
          delete npc._pendingSeductionOption;

          // Start intimacy encounter immediately
          setTimeout(() => {
            if (typeof window.startIntimacyEncounter === "function") {
              console.log("[NSFW Routing] startIntimacyEncounter found, calling it");
              window.startIntimacyEncounter(npc, window.G.player);
              if (typeof window.renderIntimacyActionMenu === "function") {
                window.renderIntimacyActionMenu(npc);
              }
            } else {
              console.error("[NSFW] startIntimacyEncounter not available — intimacy-system.js may have failed to load.");
            }
          }, 100);
          return responseText;
        }

        const isForward = npc.temperament === "forward" || npc.temperament === "bold";
        const startCoords = window.G.player.coords;
        const targetRoom = option.id === "seduce"
            ? findNearestRoomOfTypes(startCoords, ["Tavern", "Inn", "Inn Common"])
            : findNearestPrivateRoom(startCoords);

        console.log("[NSFW Routing] targetRoom search:", {
          isForward: isForward,
          foundRoom: targetRoom ? (targetRoom.type + " @ " + targetRoom.coords) : "NONE"
        });

        if (targetRoom) {
          if (isForward && typeof window.teleportPlayerToCoords === "function") {
            setTimeout(() => {
              window.teleportPlayerToCoords(targetRoom.coords);
            }, 100);
            // Mark that NPC is at meetup location for immediate proposition
            npc._meetupArrived = true;
            npc._meetupLocation = targetRoom.coords;
            npc._meetupRoomName = targetRoom.displayName || targetRoom.type;
            console.log("[NSFW Routing] → FORWARD TELEPORT to", targetRoom.coords);
            return responseText + ` ${npc.name} takes your hand. "Follow me to the ${targetRoom.displayName || targetRoom.type}."`;
          } else {
            npc._pendingSeductionDestination = targetRoom.coords;
            npc._pendingSeductionOption = option.id;

            const homeRoomName = targetRoom.displayName || targetRoom.type;
            console.log("[NSFW Routing] → FOLLOW SUGGESTION registered for", homeRoomName);
            const followOption = {
              id: "follow-seduction-suggestion",
              label: `Go with ${npc.name} to the ${homeRoomName}`,
              text: `You agree to go with ${npc.name} to the ${homeRoomName}.`,
              priority: 5,
              action: function(selectedNPC) {
                if (selectedNPC._pendingSeductionDestination && typeof window.teleportPlayerToCoords === "function") {
                  const dest = selectedNPC._pendingSeductionDestination;
                  window.teleportPlayerToCoords(dest);
                  // Mark NPC as at meetup location after player follows
                  selectedNPC._meetupArrived = true;
                  selectedNPC._meetupLocation = dest;
                  selectedNPC._meetupRoomName = homeRoomName;
                  delete selectedNPC._pendingSeductionDestination;
                  delete selectedNPC._pendingSeductionOption;
                }
              }
            };

            if (!window.NPC_CONVERSATION_CATALOGUE.some(o => o.id === followOption.id)) {
              window.NPC_CONVERSATION_CATALOGUE.push(followOption);
            }

            return responseText + ` ${npc.name} suggests going to the ${targetRoom.displayName || targetRoom.type}.`;
          }
        } else {
          // Fallback: No suitable room found, NPC states the issue
          console.log("[NSFW Routing] → FALLBACK (no target room found)");
          // Clear any pending destination so player can choose
          delete npc._pendingSeductionDestination;
          delete npc._pendingSeductionOption;

          if (option.id === "proposition") {
            // For proposition: player can ask NPC to follow to a spot
            const followOption = {
              id: "ask-npc-to-follow",
              label: `Ask ${npc.name} to follow you`,
              text: `You ask ${npc.name} to follow you to a more private location.`,
              promptText: `You ask ${npc.name} to follow you to a more private location.`,
              priority: 5,
              intent: "seduction-followup",
              action: function(selectedNPC) {
                // Set flag so player can lead the NPC
                selectedNPC._pendingSeductionOption = "follow-player";
                // For now, set a flag to indicate they're ready to follow
                selectedNPC._waitingToFollow = true;
                // Actually add to session followers so they follow the player
                if (typeof window.addSessionFollower === "function") {
                    window.addSessionFollower(selectedNPC);
                }
                // Show confirmation
                if (typeof window.addChatMessage === "function") {
                    var _name = selectedNPC && selectedNPC.name ? selectedNPC.name : "They";
                    window.addChatMessage("left", _name, "Alright, lead the way.", { mode: "auto" });
                }
              },
              relationshipImpact: { lust: +2, attraction: +2 }
            };

            if (!window.NPC_CONVERSATION_CATALOGUE.some(o => o.id === followOption.id)) {
              window.NPC_CONVERSATION_CATALOGUE.push(followOption);
            }

            return responseText + ` ${npc.name} glances around without spotting anywhere suitable nearby - perhaps you should lead the way.`;
          } else {
            // For seduce: NPC agrees to meet later at a specific location
            const meetupRoom = findNearestRoomOfTypes(startCoords, ["Tavern", "Inn", "Inn Common"]);
            
            if (meetupRoom) {
              // Store original location so NPC can return if player doesn't meet
              // Use _homeCoords if available, otherwise use startCoords
              npc._originalLocation = npc._homeCoords || startCoords;
              
              // Store meetup info on NPC
              npc._meetupLocation = meetupRoom.coords;
              npc._meetupRoomType = meetupRoom.type || "Inn";
              npc._meetupRoomName = meetupRoom.displayName || meetupRoom.type;
              
              // Set trigger: meet after 2 turns
              npc._meetupTriggerTurn = (window.G.story && typeof window.G.story.turnCounter === "number" 
                  ? window.G.story.turnCounter + 2 
                  : 2);
              
              // Set return trigger: if not met after 12 more turns, return to home
              npc._meetupReturnTurn = npc._meetupTriggerTurn + 12;
              
              return responseText + ` ${npc.name} agrees - you will meet at the ${meetupRoom.displayName || meetupRoom.type} in a little while.`;
            } else {
              // No meetup location found at all
              return responseText + ` ${npc.name} agrees, and the two of you settle on finding a good spot later.`;
            }
          }
        }
      }

      console.log("[NSFW] Inquiry ACCEPTED for " + (option.id || "unknown"));
      return responseText;
    }
    
    // Process rejection
    if (isRejected) {
      if (option.onReject) {
        applyRelationshipImpacts(npc, option.onReject);
      }
      console.log("[NSFW] Inquiry REJECTED for " + (option.id || "unknown"));
      return responseText;
    }
    
    // No affirmative/rejected determination - return original
    return responseText;
    return responseText;
  }

  function applyRelationshipImpacts(npc, impacts) {
    if (!npc || !impacts) return;
    if (impacts.lust) applyLustImpact(npc, impacts.lust);
    if (impacts.attraction) applyAttractionImpact(npc, impacts.attraction);
    if (impacts.hostility) {
      // Hostility lives directly on the NPC (the engine's own pipeline).
      npc.hostility = Math.max(0, Math.min(100, (npc.hostility || 0) + impacts.hostility));
    }
  }

  function handleMealDateInteraction(npc, option) {
    if (!npc || !option) return false;
    
    // Check if this is a meetup NPC at their meetup location
    const isMeetupActive = npc._meetupArrived && npc._meetupLocation && 
                          window.G && window.G.player && window.G.player.coords === npc._meetupLocation;
    
    if (!isMeetupActive) return false;
    
    // Handle meal-related options
    if (option.id === "split-bill") {
      applyRelationshipImpacts(npc, { lust: +1, attraction: +2 });
      if (typeof window.addChatMessage === "function") {
        const npcName = npc.name || "They";
        window.addChatMessage("left", npcName, `"That's fair. I appreciate you not assuming." She smiles and takes a sip of her drink.`);
      }
      // Mark meal as completed
      npc._mealShared = true;
      return true;
    }
    
    if (option.id === "pay-for-meal") {
      applyRelationshipImpacts(npc, { lust: +3, attraction: +4 });
      if (typeof window.addChatMessage === "function") {
        const npcName = npc.name || "They";
        window.addChatMessage("left", npcName, `"You didn't have to... but thank you." She looks at you with renewed interest.`);
      }
      npc._mealShared = true;
      npc._playerPaid = true;
      return true;
    }
    
    if (option.id === "small-talk") {
      applyRelationshipImpacts(npc, { lust: +2, attraction: +1 });
      if (typeof window.addChatMessage === "function") {
        const npcName = npc.name || "They";
        const topics = [
          `"The food here is excellent, don't you think?" She takes a bite and watches you.`,
          `"I don't usually do this... meeting someone like this." She seems genuinely curious about you.`,
          `"You're different from most people I meet. In a good way." She leans in slightly.`,
          `"I've been meaning to try this place. Good choice." She smiles warmly.`
        ];
        window.addChatMessage("left", npcName, topics[Math.floor(Math.random() * topics.length)]);
      }
      return true;
    }
    
    return false;
  }

  // Helper to check if room offers food
  function isFoodLocation(room) {
    if (!room) return false;
    const foodTypes = ["Inn", "Tavern", "Inn Common", "Kitchen", "Dining", "Restaurant", "Bar", "Taproom"];
    const roomType = (room.type || room.displayName || "").toLowerCase();
    const roomRole = (room.role || "").toLowerCase();
    return foodTypes.some(t => roomType.includes(t.toLowerCase()) || roomRole.includes(t.toLowerCase()));
  }

  // ── EARLY WINDOW EXPOSURE ─────────────────────────────────────
  // Expose critical functions to window immediately (not waiting for
  // initNSFWSystem, which defers until window.G exists). The engine's
  // npcRespond calls window.applyInquiryResponse for inquiry options
  // (seduce/proposition), and it may run before initNSFWSystem completes.
  window.applyInquiryResponse = applyInquiryResponse;
  window.isPrivateLocation = (typeof isPrivateLocation === "function") ? isPrivateLocation : function(room) {
    // Inline fallback so this works even if intimacy-data-context.js hasn't
    // loaded yet (shouldn't happen, but keeps the function self-contained).
    if (!room) return false;
    var privateTypes = ["Guest Room", "Home", "Inn Common", "Inn", "Bedroom", "Private Chamber", "Tavern Room", "Cellar", "Vault", "Dark Alleyway", "Abandoned Armory", "Forgotten Shrine", "Crumbling Tower", "Great Cavern", "Stone Vault", "Underground Hallway", "Underground Gate", "Passage", "Corridor", "Tunnel", "Dungeon Chamber"];
    var t = (room.type || "").toLowerCase();
    var n = (room.displayName || room.name || "").toLowerCase();
    return privateTypes.some(function(p) { return t.includes(p.toLowerCase()) || n.includes(p.toLowerCase()); });
  };

  function injectMeetupConversationOptions() {
    console.log("[NSFW System] Injecting meetup conversation options");
    const meetupOptions = [
      {
        id: "split-bill",
        label: "Suggest splitting the bill",
        text: "You suggest sharing the cost of the meal equally.",
        priority: 30,
        conditions: {
          custom: function(npc, ctx) {
            // Only show in food locations
            if (!isFoodLocation(ctx && ctx.room)) return false;
            
            // Allow at meetup location OR when NPC followed player to private location
            const atMeetup = npc && npc._meetupArrived && ctx && 
                           ctx.room && ctx.room.coords === npc._meetupLocation &&
                           !npc._mealShared;
            const followedToPrivate = npc && npc._pendingSeductionOption === "follow-player" && ctx && ctx.room;
            return atMeetup || followedToPrivate;
          }
        },
        relationshipImpact: { lust: +1, attraction: +2 }
      },
      {
        id: "pay-for-meal",
        label: "Offer to pay for the meal",
        text: "You offer to cover the entire cost of the meal.",
        priority: 30,
        conditions: {
          custom: function(npc, ctx) {
            // Only show in food locations
            if (!isFoodLocation(ctx && ctx.room)) return false;
            
            // Allow at meetup location OR when NPC followed player to private location
            const atMeetup = npc && npc._meetupArrived && ctx && 
                           ctx.room && ctx.room.coords === npc._meetupLocation &&
                           !npc._mealShared;
            const followedToPrivate = npc && npc._pendingSeductionOption === "follow-player" && ctx && ctx.room;
            return atMeetup || followedToPrivate;
          }
        },
        relationshipImpact: { lust: +3, attraction: +4 }
      },
      {
        id: "small-talk",
        label: "Engage in small talk",
        text: "You make light conversation while sharing the meal.",
        priority: 30,
        conditions: {
          custom: function(npc, ctx) {
            // Only show in food locations
            if (!isFoodLocation(ctx && ctx.room)) return false;
            
            // Allow at meetup location with meal shared OR when NPC followed player to private location
            const atMeetup = npc && npc._meetupArrived && ctx && 
                           ctx.room && ctx.room.coords === npc._meetupLocation &&
                           npc._mealShared;
            const followedToPrivate = npc && npc._pendingSeductionOption === "follow-player" && ctx && ctx.room;
            return atMeetup || followedToPrivate;
          }
        },
        relationshipImpact: { lust: +2, attraction: +1 },
        repeat: "always"
      }
    ];
    
    meetupOptions.forEach(option => {
      const existingIndex = window.NPC_CONVERSATION_CATALOGUE.findIndex(o => o.id === option.id);
      if (existingIndex >= 0) {
        window.NPC_CONVERSATION_CATALOGUE[existingIndex] = option;
      } else {
        window.NPC_CONVERSATION_CATALOGUE.push(option);
      }
    });

    // ── Session-follower options ──────────────────────────────────
    // Become available after a successful seduce/proposition (gated by the
    // npc._seductionAccepted flag set in applyInquiryResponse). "Ask them to
    // follow you" makes the NPC trail the player for the current session only
    // (G.sessionFollowers is in-memory; not persisted by saveGameState). The
    // follow/unfollow pair is mutually exclusive via the sessionFollowers
    // membership check. nsfw:true + phase:1 lets these pass the NSFW query
    // wrapper's date-context and phase-2 filters (same as flirt/seduce/
    // proposition); the custom condition still gates them on
    // _seductionAccepted and sessionFollowers membership. relationshipImpact
    // must be a truthy object so the chooseChatOption wrapper reaches the
    // option.action() call (see extendChooseChatOption); an empty object
    // applies no lust/attraction change.
    const followerOptions = [
      {
        id: "ask-to-follow",
        label: function(npc) { return "Ask " + (npc && npc.name ? npc.name : "them") + " to follow you"; },
        text: function(npc) { return "You ask " + (npc && npc.name ? npc.name : "them") + " to come along with you."; },
        promptText: function(npc) { return "You ask " + (npc && npc.name ? npc.name : "them") + " to come along with you on your travels."; },
        priority: 22,
        phase: 1,
        nsfw: true,
        conditions: {
          custom: function(npc, ctx) {
            if (!npc) return false;
            var followers = (window.G && window.G.sessionFollowers) || [];
            return !followers.includes(npc);
          }
        },
        relationshipImpact: {},
        action: function(npc) {
          // An earlier suggested-destination (follow-seduction-suggestion)
          // is moot once the NPC follows the player instead; clear it so
          // the query wrapper does not keep applying date-context filtering.
          delete npc._pendingSeductionDestination;
          delete npc._pendingSeductionOption;
          if (typeof window.addSessionFollower === "function") {
            window.addSessionFollower(npc);
          }
          // Show confirmation message
          if (typeof window.addChatMessage === "function") {
            var _name = npc && npc.name ? npc.name : "They";
            window.addChatMessage("left", _name, "Alright, I'll come with you.", { mode: "auto" });
          }
        }
      },
      {
        id: "stop-following",
        label: function(npc) { return "Ask " + (npc && npc.name ? npc.name : "them") + " to stop following"; },
        text: function(npc) { return "You tell " + (npc && npc.name ? npc.name : "them") + " they needn't follow you anymore."; },
        promptText: function(npc) { return "You tell " + (npc && npc.name ? npc.name : "them") + " they needn't follow you anymore."; },
        priority: 22,
        phase: 1,
        nsfw: true,
        conditions: {
          custom: function(npc, ctx) {
            if (!npc) return false;
            var followers = (window.G && window.G.sessionFollowers) || [];
            return followers.includes(npc);
          }
        },
        relationshipImpact: {},
        action: function(npc) {
          if (typeof window.removeSessionFollower === "function") {
            window.removeSessionFollower(npc);
          }
          // No longer following — drop the follow-player marker so the
          // meal options' followedToPrivate gate does not stay satisfied.
          if (npc && npc._pendingSeductionOption === "follow-player") {
            delete npc._pendingSeductionOption;
          }
          // Show confirmation message
          if (typeof window.addChatMessage === "function") {
            var _name = npc && npc.name ? npc.name : "They";
            window.addChatMessage("left", _name, "Alright, I'll stay here then.", { mode: "auto" });
          }
        }
      }
    ];

    followerOptions.forEach(option => {
      const existingIndex = window.NPC_CONVERSATION_CATALOGUE.findIndex(o => o.id === option.id);
      if (existingIndex >= 0) {
        window.NPC_CONVERSATION_CATALOGUE[existingIndex] = option;
      } else {
        window.NPC_CONVERSATION_CATALOGUE.push(option);
      }
    });

    // ── "Make a move" shortcut ────────────────────────────────────
    // A simple option that appears after a successful seduce/proposition
    // (gated by npc._seductionAccepted). Clicking it starts the intimacy
    // encounter directly via window.startIntimacyEncounter, bypassing the
    // phase-2 location/alone/attraction gates that gate the existing
    // "start_intimacy"/"touch_intimately" options. This is a pragmatic
    // fallback while the async affirmative pipeline is being fixed.
    var makeMoveOption = {
      id: "make-a-move",
      label: function(npc) { return "Make a move on " + (npc && npc.name ? npc.name : "them"); },
      text: function(npc) { return "You make your move on " + (npc && npc.name ? npc.name : "them") + "."; },
      promptText: function(npc) { return "You make your move on " + (npc && npc.name ? npc.name : "them") + "."; },
      priority: 28,
      phase: 1,
      nsfw: true,
      conditions: {
        custom: function(npc, ctx) {
          if (!npc || !npc._seductionAccepted) return false;
          // Don't show if intimacy is already active
          if (npc.intimacy && npc.intimacy.encounter && npc.intimacy.encounter.active) return false;
          return true;
        }
      },
      relationshipImpact: {},
      action: function(npc) {
        console.log("[NSFW] make-a-move action triggered for", npc && npc.name);
        if (typeof window.startIntimacyEncounter === "function") {
          window.startIntimacyEncounter(npc, window.G.player);
          if (typeof window.renderIntimacyActionMenu === "function") {
            window.renderIntimacyActionMenu(npc);
          }
        } else {
          console.error("[NSFW] startIntimacyEncounter not available for make-a-move");
        }
      }
    };

    var makeMoveIndex = window.NPC_CONVERSATION_CATALOGUE.findIndex(function(o) { return o.id === makeMoveOption.id; });
    if (makeMoveIndex >= 0) {
      window.NPC_CONVERSATION_CATALOGUE[makeMoveIndex] = makeMoveOption;
    } else {
      window.NPC_CONVERSATION_CATALOGUE.push(makeMoveOption);
    }
  }

  function extendChooseChatOption() {
    if (typeof window.chooseChatOption !== "function") {
      console.warn("[NSFW System] chooseChatOption not found, retrying...");
      setTimeout(extendChooseChatOption, 1000);
      return;
    }
    // Don't double-wrap
    if (window.chooseChatOption._nsfwWrapped) return;

    const orig = window.chooseChatOption;
    window.chooseChatOption = function(option) {
      const result = orig.apply(this, arguments);
      const npc = window.G.activeNPC;
      if (!npc || !option.relationshipImpact) return result;
      
      // Log NSFW actions for debugging - only for specific NSFW option IDs
      if (option.id === "proposition" || option.id === "seduce" || option.id === "split-bill" || option.id === "pay-for-meal" || option.id === "small-talk") {
        console.log("[NSFW] Action:", option.id, "with", npc.name);
      }
      
      const envMod = getEnvironmentalModifier(window.G.activeRoom);
      if (option.relationshipImpact.lust) applyLustImpact(npc, option.relationshipImpact.lust, envMod);
      if (option.relationshipImpact.attraction) applyAttractionImpact(npc, option.relationshipImpact.attraction);
      // Skip if the engine already fired the action itself (it does this for
      // options whose action is a function, e.g. ask-to-follow/stop-following,
      // because the chat buttons bypass this wrapper on Perchance).
      if (option.action && typeof option.action === "function" && !option.__actionFired) {
        console.log("[NSFW Wrapper] Firing action for option:", option.id, "with NPC:", npc.name);
        option.action(npc);
      }
      
      // Handle meal date interaction
      const handled = handleMealDateInteraction(npc, option);
      
      // Clear meetup flags only if this is a non-date action (player is leaving the date context)
      // Date actions (split-bill, pay-for-meal, small-talk, flirt) should NOT clear the flags
      const dateActions = ["split-bill", "pay-for-meal", "small-talk", "flirt", "seduce", "proposition"];
      if (npc._meetupArrived && !dateActions.includes(option.id)) {
        delete npc._meetupArrived;
        delete npc._meetupReturnTurn;
        delete npc._meetupLocation;
        delete npc._meetupRoomType;
        delete npc._meetupRoomName;
        delete npc._originalLocation;
      }
      
      return result;
    };
    window.chooseChatOption._nsfwWrapped = true;
  }

  // Expose so the engine can re-apply the wrapper after it overwrites
  // window.chooseChatOption (the engine loads after the nsfw system).
  window._nsfwWrapChooseChatOption = extendChooseChatOption;
  console.log("[BODY-DEBUG] IIFE reached line ~1084 (_nsfwWrapChooseChatOption assigned)");

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
          if (npc && npc.memory) {
            npc.memory.lust = Math.max(0, (npc.memory.lust || 0) - 1);
            if (window.G.story.turnCounter % 20 === 0) {
              // Decay the earned share (not just the total) so the next
              // recomputeNPCAttraction doesn't restore what decayed away.
              npc.memory.attractionEarned = Math.max(0, (npc.memory.attractionEarned || 0) - 0.5);
              npc.memory.attraction = Math.max(0, (npc.memory.attraction || 0) - 0.5);
            }
            
            // Handle delayed seduction meetups
            if (npc._meetupTriggerTurn && window.G.story.turnCounter >= npc._meetupTriggerTurn) {
              const currentRoom = window.G.roomMap[npc._meetupLocation];
              if (currentRoom && typeof teleportNPC === "function") {
                // Teleport NPC to meetup location
                teleportNPC(npc, npc._meetupLocation);
                
                // Notify player
                if (typeof window.addGameMessage === "function") {
                  window.addGameMessage("info", `${npc.name} is now waiting at the ${npc._meetupRoomName || npc._meetupRoomType}.`);
                } else if (typeof window.setNarration === "function") {
                  window.setNarration(`${npc.name} is now waiting at the ${npc._meetupRoomName || npc._meetupRoomType}.`);
                }
                
                // Mark that NPC has arrived at meetup
                npc._meetupArrived = true;
              }
              // Clean up the trigger but keep other info for return check
              delete npc._meetupTriggerTurn;
            }
            
            // Handle return if player doesn't meet: after 12 turns at meetup, return to home
            if (npc._meetupArrived && npc._meetupReturnTurn && window.G.story.turnCounter >= npc._meetupReturnTurn) {
              // Determine where to return: use _homeCoords if available, otherwise _originalLocation
              const returnLocation = npc._homeCoords || npc._originalLocation;
              if (typeof teleportNPC === "function" && returnLocation) {
                teleportNPC(npc, returnLocation);
                
                // Notify player
                if (typeof window.addGameMessage === "function") {
                  window.addGameMessage("info", `${npc.name} grew tired of waiting and returned home.`);
                } else if (typeof window.setNarration === "function") {
                  window.setNarration(`${npc.name} grew tired of waiting and returned home.`);
                }
              }
              // Clean up all meetup flags
              delete npc._meetupArrived;
              delete npc._meetupReturnTurn;
              delete npc._meetupLocation;
              delete npc._meetupRoomType;
              delete npc._meetupRoomName;
              delete npc._originalLocation;
            }
          }
        });
      }
      return result;
    };
  }

  // Teleport an NPC to a new room
  function teleportNPC(npc, targetCoords) {
    if (!npc || !targetCoords || !window.G || !window.G.roomMap) return false;
    
    const targetRoom = window.G.roomMap[targetCoords];
    if (!targetRoom) return false;
    
    // Remove NPC from current room - search all rooms if _currentRoomCoords not set
    if (npc._currentRoomCoords && window.G.roomMap[npc._currentRoomCoords]) {
      const currentRoom = window.G.roomMap[npc._currentRoomCoords];
      if (currentRoom && currentRoom.creatures) {
        currentRoom.creatures = currentRoom.creatures.filter(c => c !== npc);
      }
    } else {
      // Search all rooms to find where this NPC currently is
      Object.values(window.G.roomMap).forEach(room => {
        if (room && room.creatures) {
          const index = room.creatures.indexOf(npc);
          if (index >= 0) {
            room.creatures.splice(index, 1);
          }
        }
      });
    }
    
    // Add NPC to target room
    if (!targetRoom.creatures) targetRoom.creatures = [];
    if (!targetRoom.creatures.includes(npc)) {
      targetRoom.creatures.push(npc);
    }
    
    // Update NPC's location tracking
    npc._currentRoomCoords = targetCoords;
    if (typeof npc.coords !== "undefined") {
      npc.coords = targetCoords;
    }
    
    return true;
  }

  function initNSFWSystem() {
    console.log("[NSFW System] initNSFWSystem called");
    console.log("[NSFW System] Initializing NSFW system...");
    if (!window.G) {
      setTimeout(initNSFWSystem, 1000);
      return;
    }
    window.ensureNPCRelationshipState = ensureNPCRelationshipState;
    window.generatePhysicalTraits = generatePhysicalTraits;
    window.applyInquiryResponse = applyInquiryResponse;
    window.teleportNPC = teleportNPC;
    // NSFW options already injected at script load time
    injectMeetupConversationOptions();
    extendChooseChatOption();
    
    // Setup query catalogue wrapper - try multiple times to ensure original function is captured
    function setupQueryWrapper() {
      console.log("[NSFW System] setupQueryWrapper: queryConversationCatalogue type =", typeof window.queryConversationCatalogue, ", NPC_CONVERSATION_CATALOGUE type =", typeof window.NPC_CONVERSATION_CATALOGUE);
      if (typeof window.queryConversationCatalogue === "function" && 
          typeof window.NPC_CONVERSATION_CATALOGUE !== "undefined") {
        console.log("[NSFW System] Both catalogue and function available, setting up wrapper");
        const originalQueryConversationCatalogue = window.queryConversationCatalogue;
        window.queryConversationCatalogue = function(npc, context) {
        console.log("[NSFW System] Wrapper function called with NPC:", npc ? npc.name || npc.id : "null");
        const allOptions = window.NPC_CONVERSATION_CATALOGUE || [];
        console.log("[NSFW System] Wrapper: allOptions length:", allOptions.length);
        
        // First, apply original filtering (e.g., greeting gate) if it exists
        let filteredOptions = allOptions;
        if (typeof originalQueryConversationCatalogue === "function") {
          console.log("[NSFW System] Wrapper: calling original query function");
          filteredOptions = originalQueryConversationCatalogue(npc, context) || allOptions;
        }
        
        // Check if we're in a date/meetup context (primary indicator)
        const isAtMeetup = npc && npc._meetupArrived && context && context.room && 
                          context.room.coords === npc._meetupLocation;
        
        // Check if there's a pending seduction/proposition that needs follow-up (show follow option only)
        // "follow-player" (set by ask-npc-to-follow) means the NPC already
        // agreed and is actively following — it is not a pending decision.
        // Counting it here would lock every later conversation with the NPC
        // into date-only filtering (only Flirt/Say Goodbye survive).
        const hasPendingSeduction = npc && !npc._meetupArrived &&
                                   (npc._pendingSeductionDestination ||
                                    (npc._pendingSeductionOption && npc._pendingSeductionOption !== "follow-player"));
        
        // Check if intimacy encounter is active
        const isIntimacyActive = npc && npc.intimacy && npc.intimacy.encounter && npc.intimacy.encounter.active;
        
        // Check if we're in a Phase 2 context (private location, alone with target, intimacy not active)
        const isPhase2Context = (() => {
          if (!npc || !context || !context.room) {
            if (npc && npc.name) console.log(`[DEBUG] Phase 2 check: ${npc.name} - Missing context or room`);
            return false;
          }
          if (isIntimacyActive) {
            if (npc && npc.name) console.log(`[DEBUG] Phase 2 check: ${npc.name} - Intimacy already active`);
            return false;
          }
          
          // Check private location
          const room = context.room;
          const roomType = room.type || room.displayName || "unknown";
          const isPrivate = (typeof isPrivateLocation === "function" && isPrivateLocation(room)) ||
                           (room.type && ["Guest Room", "Inn", "Inn Common", "Bedroom", "Cellar", "Dark Alleyway", "Vault", "Chamber", "Tower", "Home"].some(t => room.type.includes(t))) ||
                           (room.displayName && room.displayName.toLowerCase().includes("room"));
          if (!isPrivate) {
            if (npc && npc.name) console.log(`[DEBUG] Phase 2 check: ${npc.name} - NOT private (room: ${roomType})`);
            return false;
          }
          
          // Check alone with target
          if (!room.creatures) {
            if (npc && npc.name) console.log(`[DEBUG] Phase 2 check: ${npc.name} - no creatures array`);
            return false;
          }
          if (room.creatures.length === 0) {
            if (npc && npc.name) console.log(`[DEBUG] Phase 2 check: ${npc.name} - empty creatures array`);
            return true; // If no creatures, then we're alone
          }
          let othersPresent = 0;
          const creaturesList = [];
          for (const creature of room.creatures) {
            if (creature.isPlayer) { creaturesList.push("Player"); continue; }
            if (creature === npc) { creaturesList.push("NPC"); continue; }
            if (creature.isHumanoid || creature.humanoid) {
              othersPresent++;
              creaturesList.push(creature.name || creature.type || "Unknown");
            }
          }
          const result = othersPresent === 0;
          
          // Debug logging
          if (npc && npc.name) {
            console.log(`[DEBUG] Phase 2 context for ${npc.name}: private=${isPrivate}, alone=${result} (othersPresent=${othersPresent}, creatures=${creaturesList.join(", ")}, room=${roomType})`);
          }
          
          return result;
        })();
        
        const isDateContext = isAtMeetup || hasPendingSeduction;
        
        // Debug logging for context detection
        if (npc && npc.name) {
          console.log(`[DEBUG] NSFW Context for ${npc.name}: isIntimacyActive=${isIntimacyActive}, isPhase2Context=${isPhase2Context}, isDateContext=${isDateContext}`);
          if (context && context.room) {
            const roomType = context.room.type || context.room.displayName || "unknown";
            console.log(`[DEBUG] Room info: type="${roomType}", creatures=${context.room.creatures ? context.room.creatures.length : 'none'}`);
          }
          if (isAtMeetup) console.log(`[DEBUG] At meetup location: ${npc._meetupLocation}`);
          if (hasPendingSeduction) console.log(`[DEBUG] Has pending seduction: ${npc._pendingSeductionOption}`);
        }
        
        // If intimacy encounter is active, only show intimacy-related options.
        // Keep the greeting options as well: the greeting gate in the
        // original query only opens after a greeting is picked, so dropping
        // them here left "Say goodbye" as the ONLY option and locked the NPC
        // out of all conversation for the rest of the session.
        if (isIntimacyActive) {
          const intimacyOptionIds = ["goodbye"]; // Only allow exiting
          return filteredOptions.filter(option => 
            intimacyOptionIds.includes(option.id) ||
            option.action === "intimacy" ||
            option.intent === "greeting" ||
            option.id === "greet-intro" ||
            option.id === "greet-known"
          );
        }
        
        // If in date context, filter to only show date-related and flirting actions
        // Check this BEFORE Phase 2 so date context takes precedence
        if (isDateContext) {
          const dateOptionIds = ["split-bill", "pay-for-meal", "small-talk", "flirt", 
                                 "follow-seduction-suggestion", "ask-npc-to-follow", "goodbye",
                                 "touch_intimately", "start_intimacy"];
          const filtered = filteredOptions.filter(option => 
            dateOptionIds.includes(option.id) || 
            (option.nsfw === true) ||  // Keep other NSFW options
            (option.tags && option.tags.includes("date")) ||
            (option.phase === 2 && (option.startEncounter === true || option.action !== "intimacy")) ||
            (option.intent === "greeting") ||  // Include greeting options
            (option.id === "greet-intro") ||  // Include specific greeting options
            (option.id === "greet-known")
          );
          if (npc && npc.name) {
            console.log(`[DEBUG] Date filtering applied for ${npc.name}. Options:`, filtered.map(o => o.id));
          }
          return filtered;
        }
        
        // If in Phase 2 context (private location, alone with target), include NSFW options
        if (isPhase2Context) {
          const nsfwOptionIds = ["goodbye", "disengage", "step-away"];
          const phase1NsfwIds = ["flirt", "seduce", "proposition"];
          const filtered = filteredOptions.filter(option => {
            // Include exit options
            if (nsfwOptionIds.includes(option.id)) return true;
            // Include Phase 2 options
            if (option.phase === 2) return true;
            // Include intimacy actions that start an encounter (transition actions only)
            if (option.action === "intimacy" && option.startEncounter === true) return true;
            // Include Phase 1 NSFW options (pre-intimacy conversation options)
            if (option.phase === 1 && option.nsfw === true) return true;
            if (phase1NsfwIds.includes(option.id)) return true;
            // Exclude non-NSFW Phase 1 options
            if (option.phase === 1) return false;
            // Keep base catalogue social options (no phase field) available in
            // private contexts. Dropping them here removed every topic AND the
            // greeting options, leaving only "goodbye" — and because the
            // greeting gate in queryConversationCatalogue never cleared
            // without a greeting option to click, topics stayed hidden for
            // the entire session.
            if (option.phase === undefined) return true;
            return false;
          });
          if (npc && npc.name) {
            console.log(`[DEBUG] Phase 2 filtering applied for ${npc.name}. Options:`, filtered.map(o => ({id: o.id, phase: o.phase, action: o.action})));
            console.log(`[DEBUG] Phase 2 options available:`, filtered.filter(o => o.phase === 2).map(o => o.id));
          }
          return filtered;
        }
        
        if (npc && npc.name) {
          console.log(`[DEBUG] No NSFW filtering applied for ${npc.name}. Options:`, filteredOptions.map(o => o.id));
        }
        
        return filteredOptions;
      };
      // Setup completed successfully
      console.log("[NSFW System] Query catalogue wrapper installed");
      return true;
    }

    // Close setupQueryWrapper: without this brace the retry/call block below
    // becomes a recursive self-call inside its own body, initNSFWSystem never
    // closes where it should, and the whole init path (teleportNPC exposure,
    // meetup/follower option injection, query wrapper install) never runs.
    }

    // Try to setup the wrapper, retry if not ready
    const wrapperSuccess = setupQueryWrapper();
    if (!wrapperSuccess) {
      console.log("[NSFW System] Query catalogue not ready, will retry every second...");
      const retrySetup = setInterval(() => {
        if (setupQueryWrapper()) {
          console.log("[NSFW System] Query catalogue wrapper successfully installed after retry");
          clearInterval(retrySetup);
        }
      }, 1000);
    } else {
      console.log("[NSFW System] Query catalogue wrapper installed immediately");
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
    console.log("[NSFW System] Initialized with passive stats and physical traits and meetup date options");
  }

  // === Unconscious body interactions (kiss / reposition) ===================
  // The SFW engine's renderRoomObjectActionMenu() renders the standard body
  // buttons (Examine / Search / Try to wake / Finish off / Leave) with direct
  // function references, then calls window.appendUnconsciousBodyActions (see
  // bottom of this IIFE) to append the NSFW-only Kiss / Position / Oral /
  // Penetrate / Spit groups. nsfwRenderBodyMenu() (below) re-renders the whole
  // menu after an NSFW action by delegating back to renderRoomObjectActionMenu.
  // Narration is AI-polished via the same ai() path the intimacy system uses:
  // a background ai() call refines the plain template, and only the polished
  // text is printed — a dimmed placeholder ("Looking closer..." / "...")
  // stands in the log while the polish is in flight (see
  // polishBodyNarration / polishBodyExamine, which fall back to the plain
  // template if the polish fails).

  function nsfwGetEntityName(item) {
    return typeof window.getEntityName === "function"
      ? window.getEntityName(item)
      : (item && (item.name || item.originalName) || "the body");
  }

  // Re-render the full body menu after an NSFW body action. The SFW engine's
  // renderRoomObjectActionMenu renders the standard buttons (Examine, Search,
  // Wake, etc.) with direct function references, then calls
  // window.appendUnconsciousBodyActions (below) to append the NSFW groups.
  // No recursion: renderRoomObjectActionMenu no longer delegates back here.
  function nsfwRenderBodyMenu(item) {
    if (typeof window.renderRoomObjectActionMenu === "function") {
      window.renderRoomObjectActionMenu(item);
    }
  }

  function appendUnconsciousBodyGroups(item, el) {
    if (!item || !el) return;
    nsfwEnsureBodyTraits(item);

    // Strip group — garments still worn can be worked off the body (they
    // drop to the room floor and can be picked up later).
    var stripButtons = [];
    if (nsfwBodySlotPresent(item, "upper")) {
      stripButtons.push(window.createCombatButton("Strip top", () => stripBodyGarment(item, "upper")));
    }
    if (nsfwBodySlotPresent(item, "lower")) {
      stripButtons.push(window.createCombatButton("Strip bottom", () => stripBodyGarment(item, "lower")));
    }
    if (stripButtons.length) {
      window.appendCombatGroup(el, "Strip", stripButtons);
    }

    // Kiss group (always available — mouth/cheek are never clothing-gated)
    window.appendCombatGroup(el, "Kiss", [
      window.createCombatButton("Kiss mouth", () => kissUnconsciousBody(item, "mouth")),
      window.createCombatButton("Kiss cheek", () => kissUnconsciousBody(item, "cheek"))
    ]);

    // Position group
    const currentPos = item.bodyPosition || "back";
    const positions = [
      { key: "back", label: "Roll onto back" },
      { key: "side", label: "Roll onto side" },
      { key: "face", label: "Roll onto face" }
    ];
    window.appendCombatGroup(el, "Position", positions.map(p =>
      window.createCombatButton(p.label, () => rollUnconsciousBody(item, p.key), {
        disabled: currentPos === p.key
      })
    ));

    // Touch group — hands and mouth on bare flesh (foreplay)
    var touchButtons = [];
    var touchGenitalType = nsfwBodyGenitalType(item);
    var touchHasAnus = nsfwBodyHasAnus(item);
    if (nsfwBodyHasBreasts(item) && nsfwRegionExposed(item, "breasts")) {
      touchButtons.push(window.createCombatButton("Grope breasts", () => gropeUnconsciousBody(item)));
      touchButtons.push(window.createCombatButton("Lick nipples", () => lickUnconsciousBody(item, "nipples")));
    }
    if (touchGenitalType === "vagina" && nsfwRegionExposed(item, "genitals")) {
      touchButtons.push(window.createCombatButton("Lick vagina", () => lickUnconsciousBody(item, "vagina")));
    } else if ((touchGenitalType === "cloaca-vent" || touchGenitalType === "cloaca-penis") && nsfwRegionExposed(item, "genitals")) {
      touchButtons.push(window.createCombatButton("Lick cloacal vent", () => lickUnconsciousBody(item, "cloaca")));
    }
    if (touchHasAnus && nsfwRegionExposed(item, "anus")) {
      touchButtons.push(window.createCombatButton("Lick anus", () => lickUnconsciousBody(item, "anus")));
    }
    if (touchButtons.length) {
      window.appendCombatGroup(el, "Touch", touchButtons);
    }

    // Oral group — player must have a penis; mouth accessible (not face-down).
    // Once entered, the button becomes a continuation thrust so the entry
    // narration is not repeated.
    if (nsfwPlayerHasPenis() && nsfwRegionExposed(item, "mouth")) {
      var oralButtons = [
        item.mouthUsed
          ? window.createCombatButton("Continue (their mouth)", () => thrustBody(item, "mouth"))
          : window.createCombatButton("Fuck mouth", () => fuckUnconsciousMouth(item))
      ];
      oralButtons.push(window.createCombatButton("Force deep (throat)", () => deepthroatBody(item)));
      window.appendCombatGroup(el, "Oral", oralButtons);
    }

    // Penetrate group — finger and/or penis, gated by anatomy + exposure
    var penButtons = [];
    var genitalType = nsfwBodyGenitalType(item);
    var hasAnus = nsfwBodyHasAnus(item);
    var isCloaca = genitalType === "cloaca-vent" || genitalType === "cloaca-penis";

    // Finger: vagina or cloacal vent (exposed on back/side, lower garment gone)
    if (genitalType === "vagina" && nsfwRegionExposed(item, "genitals")) {
      penButtons.push(window.createCombatButton("Finger vagina", () => fingerBody(item, "vagina")));
    } else if (isCloaca && nsfwRegionExposed(item, "genitals")) {
      penButtons.push(window.createCombatButton("Finger cloacal vent", () => fingerBody(item, "cloaca")));
    }

    // Finger: anus (exposed on side/face, lower garment gone)
    if (hasAnus && nsfwRegionExposed(item, "anus")) {
      penButtons.push(window.createCombatButton("Finger anus", () => fingerBody(item, "anus")));
    }

    // Penis insertion (player must have penis). Once a hole is entered, its
    // button becomes a continuation thrust so the entry narration is told
    // once per hole instead of on every click.
    if (nsfwPlayerHasPenis()) {
      if (genitalType === "vagina" && nsfwRegionExposed(item, "genitals")) {
        penButtons.push(item.penetratedTarget === "vagina"
          ? window.createCombatButton("Continue (their vagina)", () => thrustBody(item, "vagina"))
          : window.createCombatButton("Penetrate vagina", () => penetrateBody(item, "vagina")));
      } else if (isCloaca && nsfwRegionExposed(item, "genitals")) {
        penButtons.push(item.penetratedTarget === "cloaca"
          ? window.createCombatButton("Continue (their cloaca)", () => thrustBody(item, "cloaca"))
          : window.createCombatButton("Penetrate cloaca", () => penetrateBody(item, "cloaca")));
      }
      if (hasAnus && nsfwRegionExposed(item, "anus")) {
        penButtons.push(item.penetratedTarget === "anus"
          ? window.createCombatButton("Continue (their anus)", () => thrustBody(item, "anus"))
          : window.createCombatButton("Penetrate anus", () => penetrateBody(item, "anus")));
      }
    }

    if (penButtons.length) {
      window.appendCombatGroup(el, "Penetrate", penButtons);
    }

    // Their cock group — the body's own reflex-hardened cock. Stroking is
    // available to any player; mounting/riding to players without a
    // penis (penis players use the Penetrate/Climax groups above).
    if (genitalType === "penis" && nsfwRegionExposed(item, "genitals")) {
      var cockButtons = [];
      cockButtons.push(window.createCombatButton(
        item.bodyCockStiff ? "Stroke their stiff cock" : "Stroke their cock",
        () => strokeBodyCock(item)
      ));
      if (!nsfwPlayerHasPenis()) {
        if (item.bodyRidden) {
          cockButtons.push(window.createCombatButton("Ride their cock", () => rideBodyCock(item)));
          cockButtons.push(window.createCombatButton("Climax (riding)", () => riderClimaxBody(item)));
        } else {
          cockButtons.push(window.createCombatButton("Mount their cock", () => rideBodyCock(item), {
            disabled: !item.bodyCockStiff
          }));
        }
      }
      window.appendCombatGroup(el, "Their cock", cockButtons);
    }

    // Pull out group — withdraw from a hole the player is inside. This is
    // the only route to the withdrawal narration: the aftermath of an
    // internal ejaculation (the load dripping back out) and the anal gape
    // scenes play here, not on the climax beats.
    if (nsfwPlayerHasPenis()) {
      var pullOutButtons = [];
      if ((item.penetratedTarget === "vagina" || item.penetratedTarget === "cloaca") && nsfwRegionExposed(item, "genitals")) {
        pullOutButtons.push(window.createCombatButton(
          "Pull out (" + (nsfwGenitalLabel(item) || item.penetratedTarget) + ")",
          () => pullOutBody(item, item.penetratedTarget)
        ));
      } else if (item.penetratedTarget === "anus" && nsfwRegionExposed(item, "anus")) {
        pullOutButtons.push(window.createCombatButton("Pull out (anus)", () => pullOutBody(item, "anus")));
      }
      if (item.mouthUsed && nsfwRegionExposed(item, "mouth")) {
        pullOutButtons.push(window.createCombatButton("Pull out (mouth)", () => pullOutBody(item, "mouth")));
      }
      if (pullOutButtons.length) {
        window.appendCombatGroup(el, "Pull out", pullOutButtons);
      }
    }

    // Climax group — surfaced once the player is inside one or more holes.
    // Lists a finish button for every hole currently in use and still
    // accessible in this pose.
    if (nsfwPlayerHasPenis()) {
      var climaxButtons = [];
      if (item.penetratedTarget === "vagina" && nsfwRegionExposed(item, "genitals")) {
        climaxButtons.push(window.createCombatButton("Finish inside (vagina)", () => climaxBody(item, "vagina")));
      } else if (item.penetratedTarget === "cloaca" && nsfwRegionExposed(item, "genitals")) {
        climaxButtons.push(window.createCombatButton("Finish inside (" + (nsfwGenitalLabel(item) || "cloaca") + ")", () => climaxBody(item, "cloaca")));
      }
      if (item.penetratedTarget === "anus" && nsfwRegionExposed(item, "anus")) {
        climaxButtons.push(window.createCombatButton("Finish inside (anus)", () => climaxBody(item, "anus")));
      }
      if (item.mouthUsed && nsfwRegionExposed(item, "mouth")) {
        climaxButtons.push(window.createCombatButton("Finish inside (mouth)", () => climaxBody(item, "mouth")));
      }
      if (climaxButtons.length) {
        window.appendCombatGroup(el, "Climax", climaxButtons);
      }
    }

    // Finish on them — external climax for penis players. Works with no
    // penetration (masturbating over the body) or as a pull-out finish
    // while inside a hole.
    if (nsfwPlayerHasPenis()) {
      var finishOnButtons = [];
      if (nsfwRegionExposed(item, "mouth")) {
        finishOnButtons.push(window.createCombatButton("Finish on face", () => finishOnBody(item, "face")));
      }
      if (nsfwRegionExposed(item, "breasts")) {
        finishOnButtons.push(window.createCombatButton("Finish on chest", () => finishOnBody(item, "chest")));
      }
      if ((item.bodyPosition || "back") !== "face" && !nsfwBodySlotPresent(item, "upper")) {
        finishOnButtons.push(window.createCombatButton("Finish on stomach", () => finishOnBody(item, "stomach")));
      }
      if (genitalType && nsfwRegionExposed(item, "genitals")) {
        finishOnButtons.push(window.createCombatButton("Finish on genitals", () => finishOnBody(item, "genitals")));
      }
      if (finishOnButtons.length) {
        window.appendCombatGroup(el, "Finish on them", finishOnButtons);
      }
    }

    // Spit group — target-dependent exposure gating
    var spitButtons = [];
    if (nsfwRegionExposed(item, "mouth")) {
      spitButtons.push(window.createCombatButton("Spit on face", () => spitOnBody(item, "mouth")));
    }
    if (nsfwBodyHasBreasts(item) && nsfwRegionExposed(item, "breasts")) {
      spitButtons.push(window.createCombatButton("Spit on breasts", () => spitOnBody(item, "breasts")));
    }
    if (genitalType && nsfwRegionExposed(item, "genitals")) {
      var genLabel = nsfwGenitalLabel(item);
      spitButtons.push(window.createCombatButton("Spit on " + genLabel, () => spitOnBody(item, "genitals")));
    }
    if (hasAnus && nsfwRegionExposed(item, "anus")) {
      spitButtons.push(window.createCombatButton("Spit on anus", () => spitOnBody(item, "anus")));
    }
    if (spitButtons.length) {
      window.appendCombatGroup(el, "Spit", spitButtons);
    }

    // Care group — dried loads (bodyUse) and smell notes NEVER fade on their
    // own (see getBodyUseDescriptor in intimacy-system.js: wet -> tacky ->
    // crusted, permanent), so wiping the body down is the only reset.
    var hasDriedLoads = !!(item.bodyUse && Object.keys(item.bodyUse).some(function (part) {
      return item.bodyUse[part] && item.bodyUse[part].loadKey;
    }));
    var hasSmellNotes = !!(Array.isArray(item.smellNotes) && item.smellNotes.length);
    if (hasDriedLoads || hasSmellNotes) {
      window.appendCombatGroup(el, "Care", [
        window.createCombatButton("Clean them up", () => cleanUpBody(item))
      ]);
    }
  }

  // Wipe the body down with water and a rag: clears dried bodyUse loads and
  // lingering smell notes. This is the only way those reset - time alone
  // just dries them crusty.
  function cleanUpBody(item) {
    if (!item || item.bodyState !== "unconscious") return;
    const name = nsfwGetEntityName(item);
    delete item.bodyUse;
    delete item.smellNotes;
    const baseText = `You fetch water and a rag and wipe ${name}'s limp body down, scrubbing off every dried, crusted trace of what was done to them. By the time you finish they lie clean and unmarked, as if none of it had ever happened.`;
    const actionDesc = "clean up";
    polishBodyNarration(item, actionDesc, baseText);
    window.rememberStoryEvent("care", `${window.G.player.name} cleaned and wiped down ${name}'s unconscious body.`, 2);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // ── AI narration polish ─────────────────────────────────────────
  // Builds a prompt for polishing an unconscious-body action narration.
  // Modeled on buildPlayerNarrativePrompt() from intimacy-system.js but
  // tailored for body interactions rather than sex acts.
  // ── Act-type context for unconscious body actions ────────────
  // Each act type carries:
  //   - difficulty: procedural framing for how the one-sided act physically
  //     plays out against a limp, uncooperative body
  //   - involuntary: the ONLY responses the NPC can show — reflexive physical
  //     reactions, never conscious participation or speech
  //   - anatomyKeys: nsfwTraits.anatomy keys to inject into the prompt for
  //     act-relevant body detail

  console.log("[BODY-DEBUG] IIFE before BODY_ACT_CONTEXT (line ~1525)");
  var BODY_ACT_CONTEXT = {
    "fuck mouth": {
      label: "oral penetration (unconscious)",
      difficulty: "The NPC's jaw hangs slack and unresisting. Their throat is relaxed but offers no cooperation — the player must hold their head and guide the angle themselves. Without a conscious swallowing reflex, saliva pools and drools from their slack mouth. Teeth may scrape if the angle isn't managed.",
      involuntary: "Reflexive only: a gag reflex if pushed deep, drooling from the slack mouth, shallow breathing through the nose, an occasional involuntary swallow. No awareness, no conscious reaction.",
      anatomyKeys: ["genitals"]
    },
    "finger vagina": {
      label: "vaginal fingering (unconscious)",
      difficulty: "The NPC's legs are limp and must be spread manually. The body offers no cooperation — the player parts the thighs and positions the hips themselves. The canal may be dry without arousal, making entry stiff.",
      involuntary: "Reflexive only: a clench around the finger, a slight hip twitch, possible involuntary lubrication from prolonged stimulation. No awareness, no conscious reaction.",
      anatomyKeys: ["genitals", "vagina", "pubicHair"]
    },
    "finger cloacal vent": {
      label: "cloacal fingering (unconscious)",
      difficulty: "The NPC's legs are limp and must be spread manually. The cloacal vent is a single muscular opening — tight and unyielding without conscious relaxation. The player must work it open slowly.",
      involuntary: "Reflexive only: a vent clench, a slight hip twitch. No awareness, no conscious reaction.",
      anatomyKeys: ["genitals", "anus"]
    },
    "finger anus": {
      label: "anal fingering (unconscious)",
      difficulty: "The NPC is unconscious and cannot relax the sphincter voluntarily. The anal ring is tight and resistant — the player must work it open slowly with patience. Penetration is awkward and uncooperative.",
      involuntary: "Reflexive only: a sphincter clench, body tension, a flinch. No awareness, no conscious reaction.",
      anatomyKeys: ["anus"]
    },
    "penetrate vagina": {
      label: "vaginal penetration (unconscious)",
      difficulty: "The NPC's legs are limp and must be spread manually. The body offers no cooperation — the player parts the thighs and positions the hips themselves. Entry may be difficult and stiff without natural lubrication.",
      involuntary: "Reflexive only: a clench around the shaft, a slight hip twitch, possible involuntary lubrication from prolonged stimulation. No awareness, no conscious reaction.",
      anatomyKeys: ["genitals", "vagina", "pubicHair"]
    },
    "penetrate cloaca": {
      label: "cloacal penetration (unconscious)",
      difficulty: "The NPC's legs are limp and must be spread manually. The cloacal vent is a single muscular opening — tight and unyielding without conscious relaxation. The player must work their way in slowly.",
      involuntary: "Reflexive only: a vent clench around the shaft, a slight hip twitch. No awareness, no conscious reaction.",
      anatomyKeys: ["genitals", "anus"]
    },
    "penetrate anus": {
      label: "anal penetration (unconscious)",
      difficulty: "The NPC is unconscious and cannot relax the sphincter voluntarily. The anal ring is tight and resistant — the player must force it open slowly. Penetration is awkward and requires patience; the body tenses reflexively against entry.",
      involuntary: "Reflexive only: a sphincter clench, body tension, a flinch. No awareness, no conscious reaction.",
      anatomyKeys: ["anus"]
    },
    "thrust mouth": {
      label: "continued oral sex (unconscious)",
      difficulty: "The player is already inside the NPC's mouth. The jaw stays slack; the player controls depth and pace entirely, holding the head. Without a swallow reflex, drool runs freely.",
      involuntary: "Reflexive only: gagging when pushed deep, drooling, an occasional involuntary swallow, shallow nasal breathing. No awareness, no conscious reaction.",
      anatomyKeys: ["genitals"]
    },
    "thrust vagina": {
      label: "continued vaginal sex (unconscious)",
      difficulty: "The player is already inside. The limp hips rock passively with each drive; the body offers no rhythm of its own and must be held in place.",
      involuntary: "Reflexive only: irregular flutters and clenches around the shaft, a faint hip twitch, possible involuntary lubrication from prolonged stimulation. No awareness, no conscious reaction.",
      anatomyKeys: ["genitals", "vagina", "pubicHair"]
    },
    "thrust cloaca": {
      label: "continued cloacal sex (unconscious)",
      difficulty: "The player is already inside the vent. The muscular opening grips passively; the player sets the whole pace against the limp body.",
      involuntary: "Reflexive only: the vent clenches and grips around the shaft, a faint hip twitch. No awareness, no conscious reaction.",
      anatomyKeys: ["genitals", "anus"]
    },
    "thrust anus": {
      label: "continued anal sex (unconscious)",
      difficulty: "The player is already inside. The loosened ring offers little resistance now; the body jolts forward with each thrust, entirely passive.",
      involuntary: "Reflexive only: weak sphincter clenches, body tension, a flinch on deep strokes. No awareness, no conscious reaction.",
      anatomyKeys: ["anus"]
    },
    "deepthroat mouth": {
      label: "forced deepthroat (unconscious)",
      difficulty: "The player seats their full length in the NPC's slack mouth and throat. The gag reflex still fires - it is brainstem, not conscious - so retching, throat spasms and messy slobber are constant. Coughing and tears are reflexive airway defenses: they appear ONLY if the player's cock is large enough to block the airway; otherwise the body only gags, flutters and drools, face lax throughout.",
      involuntary: "Reflexive only: retches and throat spasms, glugging sounds, slobber running freely, faint convulsions of the limp body, and - ONLY with an airway-blocking girth - reflexive coughing and tears leaking from the corners of the eyes. No awareness, no conscious reaction.",
      anatomyKeys: ["genitals"]
    },
    "climax inside": {
      label: "climax inside an unconscious body",
      difficulty: "The player is buried in an unresisting hole and finishes. The body stays slack throughout; release meets no participation at all.",
      involuntary: "Reflexive only: one last clench or grip around the shaft, a faint hip twitch, an involuntary swallow if in the mouth. No awareness, no conscious reaction.",
      anatomyKeys: ["genitals", "anus"]
    },
    "grope breasts": {
      label: "breast groping (unconscious)",
      difficulty: "The NPC's arms are limp; the chest rises and falls with slow unconscious breathing. The player handles the bare breasts at will — the body offers nothing but that slow breathing.",
      involuntary: "Reflexive only: the nipples may pebble and harden under attention, a faint change in breathing. No awareness, no conscious reaction.",
      anatomyKeys: ["breasts", "nipples"]
    },
    "lick nipples": {
      label: "nipple licking (unconscious)",
      difficulty: "The player mouths and laps at the bare, unmoving chest. The body lies slack; the player lifts and angles the breasts themselves.",
      involuntary: "Reflexive only: the nipples may stiffen against the tongue, a faint shift in breathing. No awareness, no conscious reaction.",
      anatomyKeys: ["breasts", "nipples"]
    },
    "lick vagina": {
      label: "cunnilingus (unconscious)",
      difficulty: "The NPC's thighs are limp and must be spread manually. The player holds the hips still and laps at the bare sex; the body cannot press up or respond in any way.",
      involuntary: "Reflexive only: the sex may grow flush and slick under prolonged attention, a hip twitch, a clench. No awareness, no conscious reaction.",
      anatomyKeys: ["genitals", "vagina", "pubicHair"]
    },
    "lick cloacal vent": {
      label: "cloacal licking (unconscious)",
      difficulty: "The vent lies still and closed. The player spreads the limp thighs and laps at the smooth-scaled opening, which stays passive and unyielding.",
      involuntary: "Reflexive only: the vent may twitch or slicken under attention, a hip twitch. No awareness, no conscious reaction.",
      anatomyKeys: ["genitals", "anus"]
    },
    "lick anus": {
      label: "anilingus (unconscious)",
      difficulty: "The cheeks must be spread by hand — the body gives no help. The player laps and circles the unmoved pucker at their own pace.",
      involuntary: "Reflexive only: the pucker may clench under the tongue, a faint grip. No awareness, no conscious reaction.",
      anatomyKeys: ["anus"]
    },
    "stroke cock": {
      label: "cock stroking (unconscious)",
      difficulty: "The NPC's cock is soft and slack in unconsciousness. The player works it in their hand; it stiffens as pure reflex — the body gains no awareness and gives no participation.",
      involuntary: "Reflexive only: the cock hardens and may twitch in the grip; the hips may buck once or twice in reflex. No awareness, no conscious reaction.",
      anatomyKeys: ["genitals", "penis"]
    },
    "ride cock": {
      label: "riding an unconscious cock",
      difficulty: "The stiff cock twitches upward on its own. The player lowers themselves onto it and does ALL the work — the body lies passive, and the player sets every motion themselves.",
      involuntary: "Reflexive only: the cock stays hard by reflex and may twitch inside, the hips may buck faintly. No awareness, no conscious reaction.",
      anatomyKeys: ["genitals", "penis"]
    },
    "rider climax": {
      label: "climax while riding (unconscious)",
      difficulty: "The player brings themselves off on the unconscious body's reflexively stiff cock. The body contributes nothing — it simply stays hard beneath them.",
      involuntary: "Reflexive only: a last twitch of the cock inside them, the body's chest rising and falling in slow sleep-breath. No awareness, no conscious reaction.",
      anatomyKeys: ["genitals", "penis"]
    },
    "climax on body": {
      label: "external climax on an unconscious body",
      difficulty: "The player finishes on the unmoving body — no participation, no reaction. The release lands on slack, unresponsive flesh and runs where gravity takes it.",
      involuntary: "Reflexive only: nothing, or a twitch of the nose, slow breathing undisturbed. The body does not stir for the act.",
      anatomyKeys: ["genitals"]
    },
    "strip": {
      label: "stripping an unconscious body",
      difficulty: "The NPC is dead weight. Garments must be worked off limp limbs — arms flopping, hips lifting only when the player hauls them.",
      involuntary: "None beyond the body's passive flopping as it is handled. No awareness, no conscious reaction.",
      anatomyKeys: []
    },
    "spit": {
      label: "spitting / degradation (unconscious)",
      difficulty: "The NPC cannot react. The spit lands on unmoving, unresponsive flesh.",
      involuntary: "No reaction whatsoever — the body lies still. The spit may run or pool along the contours of the flesh.",
      anatomyKeys: []
    },
    "kiss": {
      label: "kiss (unconscious)",
      difficulty: "The NPC's lips are slack and unresponsive. They offer no reciprocation.",
      involuntary: "The lips may part slightly under pressure but offer no conscious response. No awareness.",
      anatomyKeys: []
    },
    "reposition": {
      label: "repositioning (unconscious)",
      difficulty: "The NPC is a dead weight — limp and uncooperative. The player must manually roll or shift the body.",
      involuntary: "None. The body moves passively, flopping or rolling as positioned.",
      anatomyKeys: []
    }
  };

  // Derive the act-type key from the actionDesc string ("fuck mouth",
  // "finger vagina", "penetrate anus", "spit on face", "kiss cheek", etc.)
  function buildBodyActContext(actionDesc) {
    var d = String(actionDesc || "").toLowerCase();
    if (d.indexOf("rider") !== -1) return BODY_ACT_CONTEXT["rider climax"];
    if (d.indexOf("finish on") !== -1) return BODY_ACT_CONTEXT["climax on body"];
    if (d.indexOf("strip") !== -1) return BODY_ACT_CONTEXT["strip"];
    if (d.indexOf("grope") !== -1) return BODY_ACT_CONTEXT["grope breasts"];
    if (d.indexOf("stroke") !== -1) return BODY_ACT_CONTEXT["stroke cock"];
    if (d.indexOf("ride") !== -1 || d.indexOf("mount") !== -1) return BODY_ACT_CONTEXT["ride cock"];
    if (d.indexOf("lick") !== -1) {
      if (d.indexOf("cloaca") !== -1) return BODY_ACT_CONTEXT["lick cloacal vent"];
      if (d.indexOf("anus") !== -1) return BODY_ACT_CONTEXT["lick anus"];
      if (d.indexOf("nipple") !== -1) return BODY_ACT_CONTEXT["lick nipples"];
      return BODY_ACT_CONTEXT["lick vagina"];
    }
    if (d.indexOf("thrust") !== -1) {
      if (d.indexOf("mouth") !== -1) return BODY_ACT_CONTEXT["thrust mouth"];
      if (d.indexOf("cloaca") !== -1) return BODY_ACT_CONTEXT["thrust cloaca"];
      if (d.indexOf("anus") !== -1) return BODY_ACT_CONTEXT["thrust anus"];
      return BODY_ACT_CONTEXT["thrust vagina"];
    }
    if (d.indexOf("climax") !== -1 || d.indexOf("ejaculat") !== -1)
      return BODY_ACT_CONTEXT["climax inside"];
    if (d.indexOf("fuck") !== -1) return BODY_ACT_CONTEXT["fuck mouth"];
    if (d.indexOf("finger") !== -1) {
      if (d.indexOf("cloaca") !== -1) return BODY_ACT_CONTEXT["finger cloacal vent"];
      if (d.indexOf("anus") !== -1) return BODY_ACT_CONTEXT["finger anus"];
      return BODY_ACT_CONTEXT["finger vagina"];
    }
    if (d.indexOf("penetrate") !== -1) {
      if (d.indexOf("cloaca") !== -1) return BODY_ACT_CONTEXT["penetrate cloaca"];
      if (d.indexOf("anus") !== -1) return BODY_ACT_CONTEXT["penetrate anus"];
      return BODY_ACT_CONTEXT["penetrate vagina"];
    }
    if (d.indexOf("spit") !== -1) return BODY_ACT_CONTEXT["spit"];
    if (d.indexOf("kiss") !== -1) return BODY_ACT_CONTEXT["kiss"];
    if (d.indexOf("roll") !== -1 || d.indexOf("reposition") !== -1)
      return BODY_ACT_CONTEXT["reposition"];
    return null;
  }

  // Collect act-relevant anatomy descriptors from nsfwTraits.anatomy.
  function buildBodyAnatomyNote(item, anatomyKeys) {
    if (!item || !Array.isArray(anatomyKeys) || !anatomyKeys.length) return "";
    var a = (item.nsfwTraits && item.nsfwTraits.anatomy) || {};
    var parts = [];
    for (var i = 0; i < anatomyKeys.length; i++) {
      var key = anatomyKeys[i];
      if (a[key]) parts.push(key + ": " + JSON.stringify(a[key]));
    }
    if (!parts.length) return "";
    return "\nACT-RELEVANT ANATOMY:\n" + parts.join("\n");
  }

  // Sentence describing a body part's lingering use-state (recorded by
  // recordBodyUse in intimacy-system.js on finger/penetrate/thrust/climax),
  // or "" when the part reads unused/faded. Used for insertion narration.
  // ── Color & size flavor for body actions ────────────
  // The same character-creation profile the intimacy penetration flavor
  // reads (cock size/color from G.player.anatomy, materialized lazily via
  // ensurePlayerIntimacyAnatomy) plus the body's own skin color/texture.

  function nsfwBodyCockPhrase() {
    var player = window.G && window.G.player;
    if (player && typeof window.ensurePlayerIntimacyAnatomy === "function") {
      window.ensurePlayerIntimacyAnatomy(player);
    }
    if (!player || !player.anatomy) return "cock";
    var size = (typeof getPlayerCockSize === "function") ? getPlayerCockSize(player) : "medium";
    var color = (typeof getPlayerCockColorWord === "function") ? getPlayerCockColorWord(player) : "";
    var sizeWord = size === "large" ? "thick" : size === "small" ? "slender" : "";
    return ((sizeWord ? sizeWord + " " : "") + (color ? color + " " : "") + "cock").replace(/\s+/g, " ").trim();
  }

  function nsfwBodySkinPhrase(item) {
    var body = item && item.nsfwTraits && item.nsfwTraits.anatomy && item.nsfwTraits.anatomy.body;
    if (!body) return "";
    var color = String(body.color || "").toLowerCase().trim();
    var texture = String(body.texture || "").toLowerCase().trim();
    if (!color) return "";
    return color + (texture ? " " + texture : "") + " skin";
  }

  // Player cock size vs the body's orifice - the same small/medium/large
  // comparison the intimacy penetration fit uses (getPenetrationFit), read
  // from the body's own nsfwTraits anatomy.
  function nsfwBodyFit(item, target) {
    var player = window.G && window.G.player;
    if (!player) return "";
    if (typeof window.ensurePlayerIntimacyAnatomy === "function") window.ensurePlayerIntimacyAnatomy(player);
    var cock = (typeof getPlayerCockSize === "function") ? getPlayerCockSize(player) : "medium";
    var a = item && item.nsfwTraits && item.nsfwTraits.anatomy;
    if (!a) return "";
    var anat;
    if (target === "vagina") anat = a.vagina || {};
    else if (target === "anus" || target === "cloaca") anat = a.anus || {};
    else return "";
    var orifice = ({ tight: "small", snug: "small", firm: "medium", supple: "medium", loose: "large", gaping: "large", stretchy: "large" })[String(anat.size || "").toLowerCase()] || String(anat.sizeCategory || "").toLowerCase();
    if (["small", "medium", "large"].indexOf(orifice) === -1) return "";
    if (cock === "large") return orifice === "small" ? "resistance" : orifice === "medium" ? "stretched" : "";
    if (cock === "small") return orifice === "large" ? "easy" : "";
    return "";
  }

  // Depth ladder for the Continue mechanic: each continuation thrust works
  // deeper, 1 (just the head) to 5 (bottomed out). Keyed to the hole in
  // use; entering a different hole resets it.
  function nsfwBodyDepthTier(item, target) {
    var d = (item && item.bodyDepthTarget === target) ? (item.bodyDepth || 0) : 0;
    if (d >= 5) return "bottomed out - every drive grinds hips to hips";
    if (d >= 3) return "deep - most of the length works in with each stroke";
    if (d >= 1) return "shallow - only the first inches are in, working deeper with each push";
    return "not yet entered";
  }

  function nsfwBodyHasLoad(item, target) {
    var u = item && item.bodyUse && item.bodyUse[target];
    return !!(u && u.loadKey);
  }

  // How many internal finishes the target carries (recordBodyUse loadCount).
  // Tiers the filth: one load spills, two slop and bubble, three-plus reads
  // as bowels packed full.
  function nsfwBodyLoadCount(item, target) {
    var u = item && item.bodyUse && item.bodyUse[target];
    return (u && u.loadCount) || 0;
  }

  function nsfwBodyCreampieClause(item, target) {
    if (!nsfwBodyHasLoad(item, target)) return "";
    var label = (target === "cloaca") ? (nsfwGenitalLabel(item) || "vent") : target;
    var loads = nsfwBodyLoadCount(item, target);
    // Overfilled hole: repeated loads slop, bubble and gurgle.
    if (loads >= 2) {
      return pickFrom([
        " Each drive churns through the packed loads inside, the used hole squelching and bubbling, froth working out around your shaft with every stroke.",
        " Their " + label + " is a sloppy, overfilled mess - each thrust squelches the seed back out around you, the body too slack to hold it in.",
        " The packed heat of " + (loads >= 3 ? "bowels full of spent seed" : "the churning loads") + " greets every stroke; the used passage slurps and bubbles around your shaft."
      ]);
    }
    return pickFrom([
      " Your earlier load stirs inside them with every stroke, slicking the way; a white froth works out around your shaft.",
      " Each drive squelches through the seed you left in their " + label + ", the used hole grown wet and easy around you."
    ]);
  }

  // COLOR AND SIZE block for the body-action polish prompt - the same
  // facts the intimacy penetration prompts carry, tailored to body acts.
  function nsfwBodyFlavorPromptNote(item, actionDesc) {
    var desc = String(actionDesc || "");
    var lines = [];
    var player = window.G && window.G.player;
    var isPenisAct = /(penetrate|thrust|climax|fuck mouth|finish|deepthroat|pull out)/i.test(desc);
    if (isPenisAct && player && typeof window.ensurePlayerIntimacyAnatomy === "function") {
      window.ensurePlayerIntimacyAnatomy(player);
    }
    if (isPenisAct && player && player.anatomy) {
      var size = (typeof getPlayerCockSize === "function") ? getPlayerCockSize(player) : "medium";
      var color = (typeof getPlayerCockColorWord === "function") ? getPlayerCockColorWord(player) : "";
      if (size !== "medium" || color) {
        lines.push("- The player's cock: " + (size === "large" ? "large and thick" : size === "small" ? "small and slender" : "average-sized") + (color ? ", " + color + "-skinned" : "") + '. Name its size and color when it appears - e.g. "your ' + (size === "large" ? "thick " : size === "small" ? "slender " : "") + (color || "") + ' cock".');
      }
    }
    var skin = nsfwBodySkinPhrase(item);
    if (skin) {
      lines.push("- The body's skin: " + skin + ". Mention the color/texture whenever their flesh is described.");
    }
    var m = desc.match(/\b(vagina|cloaca|anus|mouth)\b/i);
    if (m) {
      var target = m[1].toLowerCase();
      var fit = nsfwBodyFit(item, target);
      if (fit) {
        var fitDesc = fit === "resistance"
          ? "the hole is small relative to the player's girth - entry and every stroke drag and resist"
          : fit === "stretched"
          ? "the player's girth stretches the hole wide - it reads stuffed and strained"
          : "the hole is roomy relative to the player's slender cock - it yields easily";
        lines.push("- Fit: " + fitDesc + ".");
      }
      lines.push("- Depth: " + nsfwBodyDepthTier(item, target) + ".");
      if (nsfwBodyHasLoad(item, target)) {
        lines.push("- The player already finished inside this " + (target === "cloaca" ? "vent" : target) + " earlier: describe the used, cum-filled state - wet, slick, with sloppy sounds.");
      }
    }
    if (!lines.length) return "";
    return "\nCOLOR AND SIZE (physical facts - weave them naturally into the polish where the relevant body part appears):\n" + lines.join("\n");
  }

  function nsfwBodyUseClause(item, target) {
    if (typeof window.getBodyUseDescriptor !== "function") return "";
    var desc = window.getBodyUseDescriptor(item, target);
    if (!desc) return "";
    var label = (target === "cloaca")
      ? (nsfwGenitalLabel(item) || "cloacal vent")
      : (target === "vagina" ? "vagina" : "anus");
    return " Their " + label + " is " + desc + ".";
  }

  // Lingering body-state note for the AI polish prompts: recent use of the
  // part this act targets should read in the polished narration (a used hole
  // is wetter/looser than a fresh one).
  function nsfwBodyUsePromptNote(item, actionDesc) {
    if (typeof window.getBodyUseDescriptor !== "function") return "";
    var match = String(actionDesc || "").match(/\b(vagina|cloaca|anus|mouth)\b/i);
    if (!match) return "";
    var desc = window.getBodyUseDescriptor(item, match[1].toLowerCase());
    if (!desc) return "";
    return "\nBODY STATE: The NPC's " + match[1].toLowerCase() + " is " + desc +
      ". Weave this into the polish where relevant - an already-used hole reads wetter, looser, easier to enter than a fresh one.";
  }

  // Reflex-arousal note: prolonged handling of the unconscious body
  // leaves purely involuntary traces — flushed skin, hardened nipples,
  // a cock that stiffens by reflex. Folded into the polish prompt so
  // repeated stimulation reads ON the body instead of every act landing
  // on "fresh" flesh.
  function nsfwBodyReflexNote(item) {
    var notes = [];
    if (((item && item.bodyStimulus) || 0) >= 3) {
      notes.push("the body shows the reflex signs of prolonged handling — skin flushed where it has been touched, breathing shifted slightly deeper, purely involuntary");
    }
    if (item && item.bodyCockStiff) {
      notes.push("the NPC's cock stands stiff from reflex — unconscious flesh responding to touch without any awareness");
    }
    if (!notes.length) return "";
    return "\nREFLEX STATE (weave into the polish where relevant — involuntary only): " + notes.join("; ") + ".";
  }

  function buildBodyActionPrompt(item, actionDesc, baseText) {
    const name = nsfwGetEntityName(item);
    const species = (item.species || "human").toLowerCase();
    const gender = item.gender || "unknown";
    const size = item.size || "medium";
    const wounds = typeof window.describeCombatWounds === "function"
      ? window.describeCombatWounds(item) : "";
    const position = item.bodyPosition || "back";

    var speciesNote = species !== "human"
      ? "\nThe NPC is a " + species + ". Include species-appropriate physical details (skin, texture, features)."
      : "";

    var woundNote = wounds
      ? "\nThe NPC has visible wounds: " + wounds + ". Reference them subtly if relevant."
      : "";

    var exposureNote = buildBodyExposureNote(item);

    // Act-type context: difficulty framing + involuntary-reaction guidance
    var actCtx = buildBodyActContext(actionDesc);
    var actTypeLine = actCtx ? "\nACT TYPE: " + actCtx.label + "." : "";
    var difficultyNote = actCtx && actCtx.difficulty
      ? "\nDIFFICULTY (how this act physically plays out against an unconscious body — weave this into the polish):\n" + actCtx.difficulty
      : "";
    var involuntaryNote = actCtx && actCtx.involuntary
      ? "\nINVOLUNTARY RESPONSES (the ONLY reactions the NPC can show — these are reflexive, not conscious):\n" + actCtx.involuntary
      : "";
    var anatomyNote = actCtx
      ? buildBodyAnatomyNote(item, actCtx.anatomyKeys)
      : "";
    var bodyUseNote = nsfwBodyUsePromptNote(item, actionDesc);
    var reflexNote = nsfwBodyReflexNote(item);
    var _bodySmell = "";
    if (typeof window.getActiveSmellNotes === "function") {
      var _sm = window.getActiveSmellNotes(item);
      if (_sm && _sm.length) {
        _bodySmell = "\nSMELL (the body carries this scent - reference it where relevant): " +
          _sm.map(function (n) { return n && n.text; }).filter(Boolean).join("; ") + ".";
      }
    }
    var flavorNote = nsfwBodyFlavorPromptNote(item, actionDesc);

    var prompt = [
"You are polishing a player action description from a text adventure game.",
"The NPC is " + name + ", a " + species + " " + gender + ", currently unconscious and lying on their " + position + "." + speciesNote + woundNote + exposureNote + actTypeLine + bodyUseNote + reflexNote + flavorNote + _bodySmell,
"",
"INSTRUCTIONS:",
"- Polish the BASE TEXT below. Fix grammar, refine the sentence, make it more vivid and sensory.",
"- Keep the same meaning and the same act. Do NOT invent new actions or body parts.",
"- The action: " + actionDesc + ".",
"- Write in second person (\"You ...\"). This is the player's perspective.",
"- This is a ONE-WAY interaction: the player acts ON an unconscious body. The NPC cannot respond, resist, react, shift, murmur, or show any awareness. They are a limp, unresponsive body being handled.",
"- The NPC is unconscious — describe their limp, unresponsive state where relevant.",
"- Use the clothing + exposure context above: only reference anatomy that is listed as exposed and visible in this pose. Do not describe what is covered.",
"- Use direct, physical language. No metaphors, no purple prose.",
"- COLOR AND SIZE: if a COLOR AND SIZE note is present, weave its facts (player cock size/color, the body's skin color, fit, depth, prior loads) naturally into the polish. A resistant fit reads tight and slow to open; an easy one yields. Respect the depth - shallow thrusts stay shallow.",
"- Keep it to 1-2 sentences. Match the length of the base text.",
"- Do NOT add NPC dialogue, speech, or conscious reaction. The NPC is unconscious and cannot participate.",
"- Involuntary physical responses ARE allowed where physically plausible (reflexive clenches, drooling, gag reflex, a flinch, shallow breathing) — but only as reflex, never as awareness or participation." + (involuntaryNote ? involuntaryNote : ""),
difficultyNote,
anatomyNote,
"",
"BASE TEXT (polish this — refine, make more vivid, keep same meaning and details):",
"\"" + baseText + "\"",
"",
"IMPORTANT: Output ONLY the polished text. No explanations, no meta-discussion. Just the polished sentence.",
"",
"RESPOND with only the polished text, nothing else:"
    ].filter(function(l) { return l !== ""; }).join("\n");

    return prompt;
  }

  // Print body-interaction narration to the chat panel (the same channel
  // intimacy encounters use) instead of the narration bar. Falls back to
  // setNarration when the engine exposure is missing.
  function nsfwPrintBodyNarration(text) {
    if (typeof window.addIntimacyNarration === "function") {
      window.addIntimacyNarration(text);
    } else {
      window.setNarration(text);
    }
  }

  // Placeholder line shown in the chat log while an AI polish is in flight
  // ("Looking closer..." for examines, "..." for actions). Printed through
  // addIntimacyNarration with a distinct dimmed class and no typewriter,
  // and returned so the caller can remove it (nsfwRemoveBodyPendingNarration)
  // once the polished narration prints — the placeholder never stays in the
  // log alongside the real text.
  function nsfwShowBodyPendingNarration(text) {
    if (typeof window.addIntimacyNarration === "function") {
      return window.addIntimacyNarration(text, {
        className: "intimacy-narration body-narration-pending",
        animate: false
      }) || null;
    }
    window.setNarration(text);
    return null;
  }

  function nsfwRemoveBodyPendingNarration(entry) {
    if (entry && entry.parentNode) entry.parentNode.removeChild(entry);
  }

  // Fire a background ai() call to polish the action narration, and print
  // only once the polished text returns — the plain base text is never
  // written first and then overwritten. A dimmed "..." placeholder sits in
  // the log while the polish is in flight and is removed when the real text
  // prints. If the polish fails (ai() missing, error, empty or
  // meta-commentary reply) the base text is printed instead, so the action
  // is never left silent. If the player has moved on to another view before
  // the polish lands, the base text is printed so the event still reads in
  // the log. Non-blocking — same pattern as the intimacy system's
  // player-narrative prefetch.
  function polishBodyNarration(item, actionDesc, baseText) {
    var _ai = typeof window.ai === "function" ? window.ai : null;
    if (!_ai) { nsfwPrintBodyNarration(baseText); return; }

    var pendingEntry = nsfwShowBodyPendingNarration("...");
    (async function() {
      var polished = null;
      try {
        var prompt = buildBodyActionPrompt(item, actionDesc, baseText);
        var result = await _ai({
          instruction: prompt,
          startWith: "",
          endButtons: "none",
          generatorName: "cyoaftw-engine-core"
        });
        polished = result && (result.text || result);
        if (polished && polished.trim()) {
          // Reject meta-commentary (same guard as intimacy system)
          var isMeta = /since the base|please provide|I cannot|I'm unable|as an ai|i'll polish|here is the|here's the/i.test(polished.trim());
          if (isMeta) {
            console.log("[Body Actions] Narration rejected (meta-commentary) for:", actionDesc);
            polished = null;
          }
        } else {
          polished = null;
        }
      } catch (e) {
        console.warn("[Body Actions] Narration polish failed for:", actionDesc, e);
      }

      // Only the polished text is bound to the body being viewed; anything
      // else (polish failed, or the player left this body) records the base.
      if (window.G && window.G.activeObject !== item) polished = null;
      nsfwRemoveBodyPendingNarration(pendingEntry);
      nsfwPrintBodyNarration(polished ? polished.trim() : baseText);
    })();
  }

  function kissUnconsciousBody(item, where) {
    if (!item || item.bodyState !== "unconscious") return;
    if (where !== "mouth" && where !== "cheek") return;

    item.kissedWhileOut = true;
    item.bodyKissed = (item.bodyKissed || 0) + 1;
    item.lastKiss = where;

    const name = nsfwGetEntityName(item);
    const baseText = where === "mouth"
      ? `You lean in and press a lingering kiss to ${name}'s slack, unresponsive lips. Their mouth offers no reciprocation — the lips part limply under the pressure.`
      : `You lean in and press a lingering kiss to ${name}'s ${where}. They lie still and unresponsive beneath you.`;
    const actionDesc = "kiss " + where;
    polishBodyNarration(item, actionDesc, baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} kissed ${name} on the ${where} while they were unconscious.`, 4);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // Reposition an unconscious body. Larger creatures (size "large") cannot
  // simply be turned; the player must pass a strength check
  // (d20 + physicalProwess bonus vs DC 12).
  function rollUnconsciousBody(item, position) {
    if (!item || item.bodyState !== "unconscious") return;
    if (!["back", "side", "face"].includes(position)) return;

    const name = nsfwGetEntityName(item);
    const label = position;
    const currentPos = item.bodyPosition || "back";

    if (currentPos === position) {
      window.setNarration(`${name} is already lying on their ${label}.`);
      nsfwRenderBodyMenu(item);
      return;
    }

    // A larger body must be wrestled into position with a strength check.
    if (item.size === "large") {
      const prowess = typeof window.getSetupStat === "function"
        ? window.getSetupStat("physicalProwess", 3)
        : 3;
      const roll = window.randInt(1, 20);
      const strBonus = Math.max(0, Math.floor((prowess - 3) / 2));
      const total = roll + strBonus;
      const DC = 12;
      if (total < DC) {
        const failText = `You heave against ${name}, but ${name} is too heavy to budge — their bulk won't shift.`;
        polishBodyNarration(item, "failed roll reposition", failText);
        window.rememberStoryEvent("combat", `${window.G.player.name} tried to reposition ${name} but couldn't shift their weight.`, 3);
        window.saveGameState();
        nsfwRenderBodyMenu(item);
        return;
      }
    }

    item.bodyPosition = position;
    const baseText = `You grip ${name}'s limp body and heave them onto their ${label}. They're a dead weight — arms and head flopping passively as you roll them over, offering no help.`;
    const actionDesc = "roll onto " + label;
    polishBodyNarration(item, actionDesc, baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} repositioned ${name} onto their ${label}.`, 3);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // ── Anatomy / exposure helpers for body actions ──────────────

  // Player gender — mirrors the intimacy system convention
  // (player.stats.gender, lowercased; "male" => has penis).
  function nsfwPlayerGender() {
    var p = window.G && window.G.player;
    return (p && p.stats && p.stats.gender) ? String(p.stats.gender).toLowerCase() : "male";
  }

  function nsfwPlayerHasPenis() {
    var g = nsfwPlayerGender();
    // "female" contains the substring "male" — exclude it explicitly before
    // the prefix match, or every female player counts as penis-bearing.
    if (g === "female" || g === "f" || g === "woman") return false;
    return g === "male" || g.indexOf("male") !== -1;
  }

  // Determine NPC genital type from nsfwTraits.anatomy.
  // Returns "vagina", "penis", "cloaca-vent", "cloaca-penis", or null.
  // Bodies/NPCs spawned before initNSFWSystem ran (or while the createNPC
  // wrapper was missing) have no nsfwTraits, which leaves genital/anus/breast
  // gating dead — the Penetrate and Spit groups render empty and only Oral
  // shows. Heal lazily: generate physical traits on first contact so legacy
  // bodies behave like freshly spawned ones.
  function nsfwEnsureBodyTraits(item) {
    if (!item || item.nsfwTraits) return;
    try {
      var traits = generatePhysicalTraits(item);
      if (traits) item.nsfwTraits = traits;
    } catch (e) {
      // A generation failure must not break the body menu or examine flow.
      console.warn("[Body Actions] Physical trait generation failed for legacy body:", e);
    }
  }

  function nsfwBodyGenitalType(item) {
    var a = item && item.nsfwTraits && item.nsfwTraits.anatomy;
    if (!a || !a.genitals || !a.genitals.description) return null;
    var d = String(a.genitals.description).toLowerCase();
    if (d.indexOf("cloaca") !== -1) {
      return d.indexOf("hemipenis") !== -1 ? "cloaca-penis" : "cloaca-vent";
    }
    if (d.indexOf("penis") !== -1) return "penis";
    if (d.indexOf("vagina") !== -1) return "vagina";
    return null;
  }

  // Human-readable label for the NPC's genital opening.
  function nsfwGenitalLabel(item) {
    var t = nsfwBodyGenitalType(item);
    if (t === "vagina") return "vagina";
    if (t === "penis") return "penis";
    if (t === "cloaca-vent") return "cloacal vent";
    if (t === "cloaca-penis") return "cloaca";
    return null;
  }

  // True if the NPC has a distinct anal opening (not a cloaca creature,
  // whose vent doubles as the anus and is handled via the genital path).
  function nsfwBodyHasAnus(item) {
    var a = item && item.nsfwTraits && item.nsfwTraits.anatomy;
    if (!a || !a.anus) return false;
    var d = String(a.anus.description || "").toLowerCase();
    return d.indexOf("cloaca") === -1;
  }

  function nsfwBodyHasBreasts(item) {
    var a = item && item.nsfwTraits && item.nsfwTraits.anatomy;
    return !!(a && a.breasts && a.breasts.sizeCategory && a.breasts.sizeCategory !== "flat");
  }

  // Check whether a body region is bare and accessible in the current pose.
  // Mirrors BODY_POSITION_VISIBLE / buildBodyExposureNote logic.
  // region: "mouth" | "breasts" | "genitals" | "anus"
  // Pose access (garment for the region must also be gone):
  //   back → mouth, chest/breasts, genitals
  //   side → mouth, breasts, genitals, anus
  //   face → anus only
  function nsfwRegionExposed(item, region) {
    if (!item) return false;
    var position = item.bodyPosition || "back";
    var upperCovered = nsfwBodySlotPresent(item, "upper");
    var lowerCovered = nsfwBodySlotPresent(item, "lower");

    if (region === "mouth") return position !== "face";
    if (region === "breasts") return !upperCovered && (position === "back" || position === "side");
    if (region === "genitals") return !lowerCovered && (position === "back" || position === "side");
    if (region === "anus") return !lowerCovered && (position === "side" || position === "face");
    return false;
  }

  // ── Body action functions ───────────────────────────────────
  // Each follows the kissUnconsciousBody pattern: guard, set state flags,
  // build base text, AI-polish, remember event, save, re-render menu.

  function fuckUnconsciousMouth(item) {
    if (!item || item.bodyState !== "unconscious") return;
    if (!nsfwRegionExposed(item, "mouth")) return;
    if (!nsfwPlayerHasPenis()) return;

    item.mouthUsed = true;
    item.bodyDepth = 1;
    item.bodyDepthTarget = "mouth";
    const name = nsfwGetEntityName(item);
    var mouthCock = nsfwBodyCockPhrase();
    var mouthSkin = nsfwBodySkinPhrase(item);
    const baseText = pickFrom([
      `You hold ${name}'s slack head and guide your ${mouthCock} past their unresisting lips${mouthSkin ? `, their ${mouthSkin} cool and limp under your grip` : ""}. Their jaw hangs open; saliva pools immediately and drools from the corner of their lips.`,
      `You rub the head of your ${mouthCock} across ${name}'s lax lower lip, then push slowly into the warm, passive wetness of their mouth. They offer nothing back — only the slow breath through their nose and the soft give of a sleeping face.`,
      `You part ${name}'s limp lips with your thumb and feed your ${mouthCock} into the slack warmth of their mouth${mouthSkin ? `, watching their ${mouthSkin} stay utterly expressionless as it takes you` : ""}.`
    ]);
    const actionDesc = "fuck mouth";
    polishBodyNarration(item, actionDesc, baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} fucked ${name}'s mouth while they were unconscious.`, 7);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // Force the full length into the unconscious body's mouth and down
  // its throat. The gag reflex still fires (it is brainstem, not
  // conscious), so gagging, retching and messy slobber always read -
  // but coughing and tearing are reflexive airway defenses and appear
  // ONLY when the member is large enough to block the airway.
  function deepthroatBody(item) {
    if (!item || item.bodyState !== "unconscious") return;
    if (!nsfwRegionExposed(item, "mouth")) return;
    if (!nsfwPlayerHasPenis()) return;

    item.mouthUsed = true;
    item.bodyDepth = 5;
    item.bodyDepthTarget = "mouth";
    const name = nsfwGetEntityName(item);
    var cock = nsfwBodyCockPhrase();
    var player = window.G && window.G.player;
    if (player && typeof window.ensurePlayerIntimacyAnatomy === "function") {
      window.ensurePlayerIntimacyAnatomy(player);
    }
    var cockSize = (typeof getPlayerCockSize === "function" && player) ? getPlayerCockSize(player) : "medium";
    var skin = nsfwBodySkinPhrase(item);
    var airwayBlocked = cockSize === "large";

    var baseText;
    if (airwayBlocked) {
      baseText = pickFrom([
        "You force your " + cock + " past " + name + "'s slack lips and straight down their throat, seating yourself to the root in one slow, relentless push. Their jaw stretches wide and a bulge swells in their throat. The gag reflex fires hard and brainless — retch after retch clamps around your girth while the limp body convulses faintly beneath you, heels drumming once against the floor. Slobber froths out around your shaft, and reflexive tears leak from the corners of their unseeing eyes" + (skin ? "; their " + skin + " shines with it" : "") + ".",
        "You hold " + name + "'s head still and feed your " + cock + " all the way into their throat until your hips rest flush against their face. Their air is cut off — the body knows it, even unconscious. The throat spasms in raw, rhythmic retches, the chest heaves, and wet choking sounds gurgle around you while drool runs unchecked down their chin. When you finally ease back an inch, the body coughs — a harsh, reflexive spasm — and tears spill from the corners of its eyes."
      ]);
    } else {
      baseText = pickFrom([
        "You push your " + cock + " deep into " + name + "'s slack mouth and into their throat, seating yourself fully. The gag reflex flutters around you in weak, brainless waves — clench, release, clench — but the unconscious body gives nothing else: no coughing, no tears, only slobber pooling and running steadily from the corners of its lips" + (skin ? " onto its " + skin : "") + ".",
        "You feed your " + cock + " down " + name + "'s limp throat inch by inch until you are hilted. Their throat grips in soft reflexive flutters, and the only sounds are wet glugs and the slow drip of drool from their slack chin. The face stays lax throughout — whatever the throat does, it does it asleep."
      ]);
    }
    nsfwBodyAddStimulus(item, 2);
    const actionDesc = "deepthroat mouth";
    polishBodyNarration(item, actionDesc, baseText);
    // Record AFTER the polish prompt is built (it assembles
    // synchronously inside polishBodyNarration): the act's own use
    // must not feed the prompt as if it were a PREVIOUS act's state.
    if (typeof window.recordBodyUse === "function") window.recordBodyUse(item, "mouth", { useKind: "penetrate" });
    window.rememberStoryEvent("combat", window.G.player.name + " forced their cock down " + name + "'s unconscious throat.", 8);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // target: "vagina" | "anus" | "cloaca"
  function fingerBody(item, target) {
    if (!item || item.bodyState !== "unconscious") return;
    const name = nsfwGetEntityName(item);
    var label;
    var baseText;

    var fingerSkin = nsfwBodySkinPhrase(item);
    if (target === "vagina" || target === "cloaca") {
      if (!nsfwRegionExposed(item, "genitals")) return;
      label = (target === "cloaca") ? (nsfwGenitalLabel(item) || "cloacal vent") : "vagina";
      baseText = pickFrom([
        `You spread ${name}'s limp legs apart and ease a finger into their exposed ${label}. Without arousal the opening is dry and stiff; you work the finger in slowly against the uncooperative body.`,
        `You part ${name}'s unresisting thighs${fingerSkin ? `, their ${fingerSkin} warm under your palm` : ""}, and circle their bare ${label} with one fingertip before pressing it in, inch by inch, into the dry passage.`
      ]);
    } else if (target === "anus") {
      if (!nsfwRegionExposed(item, "anus")) return;
      label = "anus";
      baseText = pickFrom([
        `You work a finger against ${name}'s tight, unresisting ${label}, slowly pushing past the resistant ring.`,
        `You spread ${name}'s limp cheeks with one hand${fingerSkin ? `, baring the ${fingerSkin.replace(" skin", "")} pucker beneath` : ""} and work a fingertip into the clenched ring, taking your time with the sleeping body.`
      ]);
    } else return;

    item.fingered = true;
    item.fingerTarget = target;
    const actionDesc = "finger " + label;
    polishBodyNarration(item, actionDesc, baseText);
    // Record AFTER the polish prompt is built - see deepthroatBody.
    if (typeof window.recordBodyUse === "function") window.recordBodyUse(item, target, { useKind: "finger" });
    window.rememberStoryEvent("combat", `${window.G.player.name} inserted a finger into ${name}'s ${label} while they were unconscious.`, 6);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // target: "vagina" | "anus" | "cloaca" — requires player penis
  function penetrateBody(item, target) {
    if (!item || item.bodyState !== "unconscious") return;
    if (!nsfwPlayerHasPenis()) return;
    const name = nsfwGetEntityName(item);
    var label;

    var baseText;
    var cock = nsfwBodyCockPhrase();
    var skin = nsfwBodySkinPhrase(item);

    if (target === "vagina" || target === "cloaca") {
      if (!nsfwRegionExposed(item, "genitals")) return;
      label = (target === "cloaca") ? (nsfwGenitalLabel(item) || "cloacal vent") : "vagina";
      var fit = nsfwBodyFit(item, target);
      var entry = fit === "resistance"
        ? `The unresisting opening fights your girth — you work forward inch by stubborn inch, the unconscious body tensing faintly as it is forced to adjust to your size.`
        : fit === "easy"
        ? `Their relaxed, roomy opening yields easily — you slide home in one slow push until you are seated deep.`
        : `The body offers no cooperation — you hold the hips still and push against the unresisting opening, working your way in.`;
      baseText = pickFrom([
        `You spread ${name}'s limp legs apart and guide your ${cock} into their exposed ${label}. ${entry}` + nsfwBodyUseClause(item, target),
        `You position ${name}'s slack hips with both hands${skin ? `, their ${skin} warm under your palms` : ""} and press your ${cock} against their ${label}, feeding yourself in bit by bit while the unconscious body takes you in silence. ${entry}` + nsfwBodyUseClause(item, target)
      ]);
    } else if (target === "anus") {
      if (!nsfwRegionExposed(item, "anus")) return;
      label = "anus";
      var fitA = nsfwBodyFit(item, target);
      var entryA = fitA === "resistance"
        ? `The sphincter clenches hard against your girth; you force it open a fraction at a time, the ring stretching wide around your crown, its stranglehold burning, until the head finally lodges past with an audible pop.`
        : fitA === "easy"
        ? `The relaxed ring gives way with barely any resistance; you sink in smoothly until your hips rest flush against them.`
        : `The sphincter clenches reflexively against the intrusion; you work it open slowly, forcing past the resistant ring as the unconscious body tenses beneath you.`;
      baseText = pickFrom([
        `You press your ${cock} against ${name}'s tight, unresisting anus. ${entryA}` + nsfwBodyUseClause(item, target),
        `You spread ${name}'s limp cheeks with your thumbs and set the head of your ${cock} against their unresisting pucker, easing forward while the unconscious body only flinches in its sleep. ${entryA}` + nsfwBodyUseClause(item, target)
      ]);
    } else return;

    item.penetrated = true;
    item.penetratedTarget = target;
    item.bodyDepth = 1;
    item.bodyDepthTarget = target;
    const actionDesc = "penetrate " + label;
    polishBodyNarration(item, actionDesc, baseText);
    // Record AFTER the polish prompt is built - see deepthroatBody.
    if (typeof window.recordBodyUse === "function") window.recordBodyUse(item, target, { useKind: "penetrate" });
    window.rememberStoryEvent("combat", `${window.G.player.name} penetrated ${name}'s ${label} with their cock while they were unconscious.`, 8);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // Continuation thrusting after the initial penetration, so the entry
  // narration is told once per hole and repeated clicks read as ongoing sex
  // instead of re-entering. target: "vagina" | "cloaca" | "anus" | "mouth"
  // Continuation thrusting after the initial penetration, so the entry
  // narration is told once per hole and repeated clicks read as ongoing
  // sex instead of re-entering. Each continuation works deeper along a
  // 1-5 depth ladder (item.bodyDepth), and the narration carries the
  // same color/size/fit/creampie flavor the intimacy system uses.
  // target: "vagina" | "cloaca" | "anus" | "mouth"
  function thrustBody(item, target) {
    if (!item || item.bodyState !== "unconscious") return;
    if (!nsfwPlayerHasPenis()) return;
    const name = nsfwGetEntityName(item);

    var label;
    var baseText;
    var cock = nsfwBodyCockPhrase();
    var skin = nsfwBodySkinPhrase(item);
    var creampie = nsfwBodyCreampieClause(item, target);

    if (target === "mouth") {
      if (!item.mouthUsed) return;
      if (!nsfwRegionExposed(item, "mouth")) return;
      label = "mouth";
      var dM = (item.bodyDepthTarget === "mouth") ? Math.min(5, (item.bodyDepth || 1) + 1) : 2;
      item.bodyDepth = dM;
      item.bodyDepthTarget = "mouth";
      if (dM >= 5) {
        baseText = pickFrom([
          `You bury your ${cock} in ${name}'s slack mouth to the root with every stroke, hips flush against their face. Saliva has soaked their chin${skin ? `; their ${skin} is flushed and slick with it` : ""}, and their throat works reflexively each time you grind in.`,
          `You ride ${name}'s limp mouth in full-length strokes, your ${cock} plunging from lips to throat and back. Their jaw hangs loose and dripping; the only sounds are the wet, rhythmic slap of your hips against their face.`
        ]);
      } else if (dM >= 3) {
        baseText = pickFrom([
          `You drive deeper into ${name}'s limp mouth, the head of your ${cock} nudging into their throat with each thrust. Wet sounds rise from the unresisting wetness, and their chest rises and falls in quick, shallow breaths around you.`,
          `You pump into ${name}'s unresisting mouth with growing depth, their head rocking in your grip with every drive. Their throat flutters in a reflexive gag each time you push too far.`
        ]);
      } else {
        baseText = pickFrom([
          `You fuck ${name}'s slack mouth in shallow strokes, your ${cock} working a little deeper with each push. Drool runs steadily from the corner of their lips.`,
          `You rock into ${name}'s unresisting mouth, their head cradled in your hands as you feed them the first inches of your ${cock} again and again. Their jaw hangs wide and passive around you.`
        ]);
      }
    } else if (target === "vagina" || target === "cloaca") {
      if (item.penetratedTarget !== target) return;
      if (!nsfwRegionExposed(item, "genitals")) return;
      label = (target === "cloaca") ? (nsfwGenitalLabel(item) || "cloacal vent") : "vagina";
      var dV = (item.bodyDepthTarget === target) ? Math.min(5, (item.bodyDepth || 1) + 1) : 2;
      item.bodyDepth = dV;
      item.bodyDepthTarget = target;
      var fitV = nsfwBodyFit(item, target);
      if (dV >= 5) {
        baseText = pickFrom([
          `You bottom out in ${name}'s limp ${label} with every drive, hips flush against them${skin ? `, their ${skin} jolting with each impact` : ""}. Their hole grips weakly around the root of your ${cock}, purely reflex.` + creampie,
          `You grind hips to hips against ${name}'s unconscious body, your ${cock} sheathed to the root in their slack ${label} with every stroke. The body only rocks with your rhythm, taking you without a trace of awareness.` + creampie
        ]);
      } else if (dV >= 3) {
        baseText = pickFrom([
          `You pump into ${name}'s slack ${label} with long, steady strokes, most of your ${cock} working in and out of the unconscious body. Their hole clenches in irregular, involuntary grips around you.` + creampie,
          `You thrust deep into ${name}'s unresisting ${label}, their limp hips rocking with each drive as you claim more of them with every push.` + creampie
        ]);
      } else {
        baseText = fitV === "resistance"
          ? `You work the first few inches of your ${cock} into ${name}'s limp ${label} again and again, loosening the too-tight grip by force. The unconscious body only clenches weakly around your girth.`
          : fitV === "easy"
          ? `You slide in and out of ${name}'s relaxed ${label} in easy strokes, your ${cock} moving with no resistance at all; the body rocks limply with each push.`
          : `You thrust into ${name}'s unresisting ${label}, their limp hips rocking with each drive as you set your pace. Their hole grips you in irregular, involuntary clenches.`;
      }
    } else if (target === "anus") {
      if (item.penetratedTarget !== "anus") return;
      if (!nsfwRegionExposed(item, "anus")) return;
      label = "anus";
      var dA = (item.bodyDepthTarget === "anus") ? Math.min(5, (item.bodyDepth || 1) + 1) : 2;
      item.bodyDepth = dA;
      item.bodyDepthTarget = "anus";
      var fitA2 = nsfwBodyFit(item, target);
      if (dA >= 5) {
        baseText = pickFrom([
          `You sheathe your ${cock} to the root in ${name}'s anus with every thrust, hips grinding flush against their limp body. The loosened ring grips weakly, and the body jolts with each full-length drive.` + creampie,
          `You pound ${name}'s unresisting anus in full strokes, pulling out to the crown and driving home to the root. Their cheeks flex faintly on every impact; the body gives nothing but reflex.` + creampie
        ]);
      } else if (dA >= 3) {
        baseText = pickFrom([
          `You fuck deep into ${name}'s unresisting anus, their limp cheeks flexing faintly each time you push home. The body gives nothing but reflex around your ${cock}.` + creampie,
          `You drive into ${name}'s loosened anus with even strokes, their limp body jarring forward with each thrust. The ring grips weakly around you, purely reflexive, the friction of it burning where you drag.` + creampie
        ]);
      } else {
        baseText = fitA2 === "resistance"
          ? `You work your ${cock} into the first inches of ${name}'s clenching anus, forcing the tight ring to stretch around you with each shallow drive. The unconscious body tenses beneath you, purely reflexive.`
          : `You ease your ${cock} in and out of ${name}'s loosened anus in careful strokes, letting the sleeping body take a little more of you with each push.`;
      }
    } else return;

    item.thrustCount = (item.thrustCount || 0) + 1;
    item.thrustTarget = target;
    const actionDesc = "thrust " + label;
    polishBodyNarration(item, actionDesc, baseText);
    // Record AFTER the polish prompt is built - see deepthroatBody.
    if (typeof window.recordBodyUse === "function") window.recordBodyUse(item, target, { useKind: "penetrate" });
    window.rememberStoryEvent("combat", `${window.G.player.name} continued thrusting into ${name}'s ${label} while they were unconscious.`, 6);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // Ejaculate into a hole the player is currently inside.
  // target: "vagina" | "cloaca" | "anus" | "mouth"
  function climaxBody(item, target) {
    if (!item || item.bodyState !== "unconscious") return;
    if (!nsfwPlayerHasPenis()) return;
    const name = nsfwGetEntityName(item);

    var label = null;
    if (target === "vagina" || target === "cloaca") {
      if (item.penetratedTarget !== target) return;
      if (!nsfwRegionExposed(item, "genitals")) return;
      label = (target === "cloaca") ? (nsfwGenitalLabel(item) || "cloaca") : "vagina";
    } else if (target === "anus") {
      if (item.penetratedTarget !== "anus") return;
      if (!nsfwRegionExposed(item, "anus")) return;
      label = "anus";
    } else if (target === "mouth") {
      if (!item.mouthUsed) return;
      if (!nsfwRegionExposed(item, "mouth")) return;
      label = "mouth";
    } else return;

    var baseText;
    var climaxCock = nsfwBodyCockPhrase();
    var priorLoad = nsfwBodyHasLoad(item, target);
    var loadsAfter = (nsfwBodyLoadCount(item, target) || 0) + 1;
    if (label === "mouth") {
      baseText = pickFrom([
        `You bury your ${climaxCock} to the hilt in ${name}'s slack mouth and come, spilling straight down their throat. It works one involuntary swallow around you; excess drains from the corner of their lips as you pull out.`,
        `You hold ${name}'s head still and empty yourself into their limp mouth, pulse after pulse across their passive tongue. They swallow once by reflex; the rest overflows, running down their chin${priorLoad ? " and mixing with the seed already drying there" : ""}.`
      ]);
    } else if (label === "anus") {
      baseText = pickFrom([
        `You sheathe your ${climaxCock} fully in ${name}'s anus and come, spilling deep inside the unresisting body. The ring gives one last reflexive clench around you as you empty yourself into them${priorLoad ? ", your new load churning into the mess already pooled inside" : ""}.`,
        `You grind your hips flush against ${name}'s limp body and finish, painting their insides with your release. Their hole milks weakly at your ${climaxCock}, purely reflex, as you drain yourself into the unconscious body.`
      ]);
      // Volume tiers: the second load churns, the third-plus packs the
      // bowels full - repeated finishes should READ as accumulating.
      if (label === "anus") {
        if (loadsAfter >= 3) {
          baseText += ` Their bowels are packed full now — you can feel the thick heat of all that spent seed through the slack of their belly, and every pulse of your ${climaxCock} squelches through the mess.`;
        } else if (loadsAfter === 2) {
          baseText += " The second load churns into the first; the passage is already sloppy and bubbling around you.";
        }
      }
    } else {
      baseText = pickFrom([
        `You hilt your ${climaxCock} in ${name}'s ${label} and come, spilling your release deep inside the unconscious body. Their passage clenches weakly around you, purely reflex, as you drain yourself into them${priorLoad ? ", adding to the load already pooled inside" : ""}.`,
        `You bury yourself to the root in ${name}'s slack ${label} and let go, thick spurts flooding the unresisting passage. The body only clenches weakly around your ${climaxCock}; whatever it cannot hold slowly seeps out around you.`
      ]);
    }

    item.bodyClimaxCount = (item.bodyClimaxCount || 0) + 1;
    item.bodyClimaxTarget = target;
    const actionDesc = "climax inside " + label;
    polishBodyNarration(item, actionDesc, baseText);
    // Record AFTER the polish prompt is built - the just-deposited
    // load must not read as an EARLIER load in the prompt.
    if (typeof window.recordBodyUse === "function") window.recordBodyUse(item, target, { loadKey: "semen", useKind: "penetrate" });
    // The finish leaves a lingering reek on the body (examine, later
    // polish prompts, and the Care group all read it back).
    if (typeof window.addSmellMark === "function") {
      window.addSmellMark(item, "semen");
      if (target === "anus" || target === "cloaca") window.addSmellMark(item, "anal");
    }
    window.rememberStoryEvent("combat", `${window.G.player.name} ejaculated into ${name}'s ${label} while they were unconscious.`, 8);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // Withdraw from a hole the player is currently inside (penetratedTarget
  // or mouthUsed). This is the only place the unconscious flow narrates a
  // pull-out — and therefore the only place an internal ejaculation gets
  // its aftermath: the load dripping back out, and (for anal, earned by
  // depth/fit) a gape the limp ring is too slack to close.
  // target: "vagina" | "cloaca" | "anus" | "mouth"
  function pullOutBody(item, target) {
    if (!item || item.bodyState !== "unconscious") return;
    if (!nsfwPlayerHasPenis()) return;
    const name = nsfwGetEntityName(item);

    var label;
    if (target === "vagina" || target === "cloaca") {
      if (item.penetratedTarget !== target) return;
      if (!nsfwRegionExposed(item, "genitals")) return;
      label = (target === "cloaca") ? (nsfwGenitalLabel(item) || "cloaca") : "vagina";
    } else if (target === "anus") {
      if (item.penetratedTarget !== "anus") return;
      if (!nsfwRegionExposed(item, "anus")) return;
      label = "anus";
    } else if (target === "mouth") {
      if (!item.mouthUsed) return;
      if (!nsfwRegionExposed(item, "mouth")) return;
      label = "mouth";
    } else return;

    var cock = nsfwBodyCockPhrase();
    var fit = nsfwBodyFit(item, target);
    var isDeep = item.bodyDepthTarget === target && (item.bodyDepth || 0) >= 4;
    var loaded = nsfwBodyHasLoad(item, target);

    var baseText;
    if (label === "mouth") {
      baseText = pickFrom([
        `You slide your ${cock} from ${name}'s slack mouth, their lips drifting closed over nothing. A thread of spit stretches and snaps between you and their chin; they breathe on, oblivious.`,
        `You withdraw from ${name}'s limp mouth with one slow pull, your crown dragging across their lolling tongue before it clears their lips. The body swallows once, purely reflex.`
      ]);
      if (loaded) {
        baseText += pickFrom([
          ` The seed pooled on their tongue seeps past their slack lips as you leave, running from the corner of their mouth in a thin white line.`,
          ` They never stir as your load dribbles out after your ${cock}, a slow trickle over their lower lip that they are too deep under to feel.`
        ]);
      }
    } else if (label === "anus") {
      if (fit === "resistance") {
        baseText = pickFrom([
          `You drag your ${cock} out of ${name}'s tight anus a stubborn inch at a time — the reflexive ring clings to you the whole way, gripping without an owner behind it, and you finally wrench free with a soft, wet pop.`,
          `The unconscious ring fights your exit exactly as it fought your entry: you pull back slowly, feeling the clench drag along every inch of your ${cock}, until the head pops loose and ${name} stays exactly as they were.`
        ]);
      } else if (fit === "easy") {
        baseText = pickFrom([
          `Your ${cock} slides from ${name}'s loosened anus with barely any resistance at all, the well-used hole simply letting you go.`,
          `You slip free of ${name}'s slack anus in one easy pull, the stretched passage too relaxed to hold you.`
        ]);
      } else {
        baseText = pickFrom([
          `You pull your ${cock} from ${name}'s clenching anus, the reflexive ring gripping you to the very last inch before you slip free.`,
          isDeep
            ? `You draw the full length of your ${cock} out of ${name}'s depths, the slow drag ending only when the head clears their rim and the unconscious body settles.`
            : `You ease your ${cock} out of ${name}'s anus with a slow, careful pull, their hole gripping weakly around you until you are gone.`
        ]);
      }
      var analLoads = nsfwBodyLoadCount(item, target) || 0;
      if (loaded && analLoads >= 3) {
        // Heavily bred hole: the full filthy withdrawal - puffy matted
        // ring, squirting overflow, failed clench, bubbles and farts,
        // the soiled puddle, and the revulsion-to-admiration beat.
        baseText = `You slowly pull your spent ${cock} out of ${name}'s puffy, swollen sphincter, the rim matted and dark with cum and froth. As your cockhead slides free, a loud squirt of cum streams out of the distended hole — the pink flex of their bowels visible as the opening reflexively tries to tighten closed, and fails. Cum bubbles and lewd, wet farts follow as the stream tapers off, leaving a broad puddle of soiled, brown-streaked semen pooling beneath their limp hips. The reek of raw, spent sex hangs over the body. You feel a short moment of revulsion that quickly gives way to a strange admiration for the filthy mess this session has left.`;
      } else {
        // Gape is EARNED: a bottomed-out session, a size mismatch, or a
        // stretched rim leave the limp ring slow to close (same math as the
        // awake intimacy system's anal pull-out).
        var gapeChance = (isDeep ? 0.45 : 0.15) + (fit === "resistance" ? 0.25 : 0) + (fit === "stretched" ? 0.15 : 0);
        baseText += (Math.random() < Math.min(gapeChance, 0.85))
          ? pickFrom([
              ` The ring stays open behind you — a round, soft gape that closes only slowly, the unconscious muscle too slack to pucker shut.`,
              ` Their hole is left open, winking each time it tries and fails to clench shut, your shape printed into the limp ring.`
            ])
          : ` The ring cinches shut behind you almost at once, clenching once around nothing.`;
        if (loaded) {
          if (analLoads >= 2) {
            // Double-loaded: heavy, obscene overflow.
            baseText += pickFrom([
              ` The moment you withdraw, the packed load comes with you — a thick, glutting squirt that splatters their cheeks and thighs, the slack ring too loose to hold any of it back.`,
              ` Their loosened hole gives up the packed mess immediately: cum bubbles out in loud, wet gurgles, frothing at the ruined rim and pooling beneath their hips.`,
              ` Your withdrawal unstoppers them — the double load escapes in one obscene gush, streaking their crack and landing wetly on the surface beneath.`
            ]);
          } else {
            baseText += pickFrom([
              ` The moment you withdraw, the load you left comes with you — a slow, slick spill from their loosened hole that pools beneath their limp hips.`,
              ` Their unresisting ring squeezes a thick glob of your release out after your ${cock}, and it drools down their crack while they sleep on.`
            ]);
          }
        }
      }
    } else {
      // Vagina / cloaca
      if (fit === "resistance") {
        baseText = `You work your ${cock} out of ${name}'s tight ${label} inch by stubborn inch — the unconscious grip clings even without an owner behind it — and you pop free of the reluctant entrance to a soft, wet sound.`;
      } else if (fit === "stretched") {
        baseText = pickFrom([
          `You ease your ${cock} from ${name}'s stretched ${label}, the slack entrance slow to remember its shape as your girth leaves it.`,
          `Your ${cock} slides out of ${name}'s well-stretched ${label}, the used opening left soft and open around the empty air.`
        ]);
      } else {
        baseText = pickFrom([
          `You draw your ${cock} out of ${name}'s slack ${label} in one slow pull, the unresisting flesh gliding slickly along you until you slip free. Their hole clenches once, purely reflex, then settles.`,
          isDeep
            ? `You drag the full length of your ${cock} from ${name}'s depths, their passage clinging weakly the whole way out until the head clears their entrance with a quiet, wet sound.`
            : `You slip your ${cock} from ${name}'s limp ${label}; the unconscious body offers nothing but one last reflexive clench as you leave it.`
        ]);
      }
      if (loaded) {
        baseText += pickFrom([
          ` Your load follows you out: as soon as you clear the entrance, a slow white trickle spills from their ${label}, running down toward their ass while the body sleeps on.`,
          ` Their entrance clenches as you withdraw, squeezing a thick ribbon of your release out after your ${cock}; it drools lazily from the slack hole.`,
          ` The moment you pull free, the seed you left inside seeps out of their unclenching ${label}, pooling warm beneath their limp hips.`
        ]);
      }
    }

    // Clear the inside state; the recorded internal load (bodyUse) stays —
    // the dripping mess it leaves is what the examine/dried-load narration
    // and later acts keep referencing.
    if (target === "mouth") {
      item.mouthUsed = false;
    } else {
      item.penetratedTarget = null;
    }
    if (item.bodyDepthTarget === target) {
      item.bodyDepth = 0;
      item.bodyDepthTarget = null;
    }

    const actionDesc = "pull out of their " + label;
    polishBodyNarration(item, actionDesc, baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} pulled out of ${name}'s ${label} while they were unconscious.`, 2);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // target: "mouth" | "breasts" | "genitals" | "anus"
  function spitOnBody(item, target) {
    if (!item || item.bodyState !== "unconscious") return;
    const name = nsfwGetEntityName(item);
    var label;

    if (target === "mouth") {
      if (!nsfwRegionExposed(item, "mouth")) return;
      label = "face";
    } else if (target === "breasts") {
      if (!nsfwRegionExposed(item, "breasts")) return;
      label = "breasts";
    } else if (target === "genitals") {
      if (!nsfwRegionExposed(item, "genitals")) return;
      label = nsfwGenitalLabel(item) || "genitals";
    } else if (target === "anus") {
      if (!nsfwRegionExposed(item, "anus")) return;
      label = "anus";
    } else return;

    item.spatOn = true;
    item.spitTarget = target;
    const baseText = `You gather spit and let it fall onto ${name}'s ${label}. The unconscious body doesn't flinch — the spit strikes still, unresponsive flesh and runs slowly along the contours.`;
    const actionDesc = "spit on " + label;
    polishBodyNarration(item, actionDesc, baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} spat on ${name}'s ${label} while they were unconscious.`, 3);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // ── Extended body interactions ─────────────────────────────
  // Foreplay, the body's own cock, and external finishes — mirroring the
  // awake intimacy system's spread so unconscious bodies get more than
  // kiss/penetrate/spit. Each follows the established pattern: guard,
  // state flags, base text, AI-polish, remember event, save, re-render.

  // Stimulating acts raise a body-stimulus counter; at 3+ the polish
  // prompt gains a reflex-state note (nsfwBodyReflexNote above).
  function nsfwBodyAddStimulus(item, n) {
    item.bodyStimulus = ((item && item.bodyStimulus) || 0) + (n || 1);
  }

  // Grope the bare breasts of the unconscious body.
  function gropeUnconsciousBody(item) {
    if (!item || item.bodyState !== "unconscious") return;
    if (!nsfwBodyHasBreasts(item) || !nsfwRegionExposed(item, "breasts")) return;
    const name = nsfwGetEntityName(item);
    const baseText = pickFrom([
      `You kneel over ${name}'s limp form and take their bare breast in your hand, kneading the soft flesh. The nipple hardens against your palm — a reflex the sleeping body can't suppress.`,
      `You cup and squeeze ${name}'s unresisting breasts, weighing them in your palms. They lie utterly passive under your touch, only their slow breathing lifting the flesh.`
    ]);
    nsfwBodyAddStimulus(item);
    item.groped = true;
    polishBodyNarration(item, "grope breasts", baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} groped ${name}'s breasts while they were unconscious.`, 4);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // Lick a bare region of the body: "nipples" | "vagina" | "cloaca" | "anus".
  function lickUnconsciousBody(item, target) {
    if (!item || item.bodyState !== "unconscious") return;
    const name = nsfwGetEntityName(item);
    var label;
    var baseText;

    if (target === "nipples") {
      if (!nsfwBodyHasBreasts(item) || !nsfwRegionExposed(item, "breasts")) return;
      label = "nipples";
      baseText = pickFrom([
        `You bow over ${name}'s slack form and lap at their bare nipple, then draw it into your mouth and suck. The nub stiffens on your tongue — pure reflex — while the body itself never stirs.`,
        `You suck and tongue ${name}'s unresisting nipple, the flesh warming under your mouth. Their chest keeps rising and falling in slow sleep-breath, ignoring you completely.`
      ]);
    } else if (target === "vagina") {
      if (nsfwBodyGenitalType(item) !== "vagina" || !nsfwRegionExposed(item, "genitals")) return;
      label = "vagina";
      baseText = pickFrom([
        `You spread ${name}'s limp thighs and press your mouth to their bare sex, lapping slow and thorough. Their hips twitch once — a reflex — as you work your tongue through the soft folds.`,
        `You settle between ${name}'s unconscious legs and eat them out at your own unhurried pace, holding their hips still. The flesh flushes warm and slick under your tongue without their knowledge.`
      ]);
    } else if (target === "cloaca") {
      var cg = nsfwBodyGenitalType(item);
      if (cg !== "cloaca-vent" && cg !== "cloaca-penis") return;
      if (!nsfwRegionExposed(item, "genitals")) return;
      label = nsfwGenitalLabel(item) || "cloacal vent";
      baseText = `You spread ${name}'s limp thighs and lap over their ${label}, the smooth scales warm under your tongue. The vent twitches faintly — reflex only — as you work it.`;
    } else if (target === "anus") {
      if (!nsfwBodyHasAnus(item) || !nsfwRegionExposed(item, "anus")) return;
      label = "anus";
      baseText = pickFrom([
        `You spread ${name}'s cheeks with both hands and drag your tongue over their unmoved pucker, circling it slow. The ring clamps down once against your tongue — the body's only answer.`,
        `You rim ${name}'s unconscious body thoroughly, their limp form giving no reaction but the occasional reflexive clench under your tongue.`
      ]);
    } else return;

    nsfwBodyAddStimulus(item);
    item.licked = true;
    polishBodyNarration(item, "lick " + label, baseText);
    // Record AFTER the polish prompt is built - see deepthroatBody.
    if (target !== "nipples" && typeof window.recordBodyUse === "function") {
      window.recordBodyUse(item, target, { useKind: "mouth" });
    }
    window.rememberStoryEvent("combat", `${window.G.player.name} licked ${name}'s ${label} while they were unconscious.`, 5);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // Stroke the body's cock (any player). The first stroke narrates the
  // reflex stiffening; later strokes work the stiffened shaft.
  function strokeBodyCock(item) {
    if (!item || item.bodyState !== "unconscious") return;
    if (nsfwBodyGenitalType(item) !== "penis") return;
    if (!nsfwRegionExposed(item, "genitals")) return;
    const name = nsfwGetEntityName(item);
    var wasStiff = !!item.bodyCockStiff;
    var baseText = wasStiff
      ? pickFrom([
        `You work ${name}'s stiffened cock in slow strokes, the flesh twitching in your grip. The hips buck once in pure reflex; the body itself sleeps on.`,
        `You stroke the unconscious cock steadily, thumbing the slick head. ${name} gives no sign of knowing — only the reflex-throb in your hand.`
      ])
      : `You take ${name}'s soft, slack cock in hand and work it with slow strokes. It swells and hardens in your grip — pure reflex — while their face stays slack and unbothered.`;
    nsfwBodyAddStimulus(item);
    item.bodyCockStiff = true;
    item.cockStroked = true;
    polishBodyNarration(item, "stroke cock", baseText);
    // Record AFTER the polish prompt is built - see deepthroatBody.
    if (!wasStiff && typeof window.recordBodyUse === "function") window.recordBodyUse(item, "penis", { useKind: "hand" });
    window.rememberStoryEvent("combat", `${window.G.player.name} stroked ${name}'s cock while they were unconscious.`, 5);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // Mount / continue riding the body's reflex-stiff cock. Only for
  // players WITHOUT a penis (penis players use the Penetrate groups).
  function rideBodyCock(item) {
    if (!item || item.bodyState !== "unconscious") return;
    if (nsfwPlayerHasPenis()) return;
    if (nsfwBodyGenitalType(item) !== "penis") return;
    if (!item.bodyCockStiff) return;
    if (!nsfwRegionExposed(item, "genitals")) return;
    const name = nsfwGetEntityName(item);
    var wasRiding = !!item.bodyRidden;
    var baseText = wasRiding
      ? pickFrom([
        `You ride ${name}'s stiff cock at your own pace, your hips rolling while the body lies passive beneath you. It twitches inside you on reflex alone.`,
        `You grind down onto the unconscious cock, doing all the work yourself. The only answer from ${name} is a faint reflex-buck of their hips.`
      ])
      : `You straddle ${name}'s limp form, line up their reflex-stiff cock, and sink down onto it. The body doesn't stir beyond a single twitch — you take your pleasure from unconscious flesh.`;
    nsfwBodyAddStimulus(item);
    item.bodyRidden = true;
    item.rideCount = ((item && item.rideCount) || 0) + 1;
    polishBodyNarration(item, wasRiding ? "ride cock" : "mount cock", baseText);
    // Record AFTER the polish prompt is built - see deepthroatBody.
    if (!wasRiding && typeof window.recordBodyUse === "function") window.recordBodyUse(item, "penis", { useKind: "penetrate" });
    window.rememberStoryEvent("combat", `${window.G.player.name} ${wasRiding ? "continued riding" : "mounted and rode"} ${name}'s cock while they were unconscious.`, 7);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // The riding player's own climax on the unconscious body.
  function riderClimaxBody(item) {
    if (!item || item.bodyState !== "unconscious") return;
    if (!item.bodyRidden) return;
    const name = nsfwGetEntityName(item);
    var baseText = pickFrom([
      `You grind down hard and come on ${name}'s stiff cock, your climax rolling through you while the body beneath stays limp and oblivious. The cock keeps twitching inside you by reflex.`,
      `You bring yourself off riding the unconscious cock, clenching around it as waves take you. ${name} sleeps through your orgasm completely.`
    ]);
    item.riderClimaxCount = ((item && item.riderClimaxCount) || 0) + 1;
    polishBodyNarration(item, "rider climax", baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} climaxed while riding ${name}'s unconscious body.`, 7);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // External finish: masturbate over the body (or pull out first while
  // inside) and spend on it. target: "face" | "chest" | "stomach" | "genitals".
  function finishOnBody(item, target) {
    if (!item || item.bodyState !== "unconscious") return;
    if (!nsfwPlayerHasPenis()) return;
    const name = nsfwGetEntityName(item);
    var inside = item.penetratedTarget || (item.mouthUsed ? "mouth" : null);
    var label;
    if (target === "face") {
      if (!nsfwRegionExposed(item, "mouth")) return;
      label = "face";
    } else if (target === "chest") {
      if (!nsfwRegionExposed(item, "breasts")) return;
      label = "chest";
    } else if (target === "stomach") {
      if ((item.bodyPosition || "back") === "face" || nsfwBodySlotPresent(item, "upper")) return;
      label = "stomach";
    } else if (target === "genitals") {
      if (!nsfwRegionExposed(item, "genitals")) return;
      label = "genitals";
    } else return;
    var baseText = inside
      ? `You pull out of ${name}'s ${inside} and strip off, stroking yourself over their limp body. You come across their ${label}, the release striping unconscious flesh that doesn't flinch.`
      : `You stand over ${name}'s unconscious body and work yourself, eyes on their slack face. You come across their ${label}, the release landing on flesh that doesn't flinch.`;
    // The inside text narrates the withdrawal - clear the inside state so
    // the menu stops offering continuation/finish-inside for a hole the
    // player already left (pullOutBody owns the withdrawal narration when
    // the player stays; this is the pull-out bundled with an external
    // finish).
    if (inside === "mouth") {
      item.mouthUsed = false;
      if (item.bodyDepthTarget === "mouth") { item.bodyDepth = 0; item.bodyDepthTarget = null; }
    } else if (inside) {
      item.penetratedTarget = null;
      if (item.bodyDepthTarget === inside) { item.bodyDepth = 0; item.bodyDepthTarget = null; }
    }
    item.bodyMarks = ((item && item.bodyMarks) || 0) + 1;
    item.marksTarget = label;
    polishBodyNarration(item, "finish on " + label, baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} finished on ${name}'s ${label} while they were unconscious.`, 6);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // Strip a garment off the body with handling narration; the item
  // drops to the room floor like any discarded clothing. slot: "upper" | "lower".
  function stripBodyGarment(item, slot) {
    if (!item || item.bodyState !== "unconscious") return;
    if (slot !== "upper" && slot !== "lower") return;
    if (!nsfwBodySlotPresent(item, slot)) return;
    const name = nsfwGetEntityName(item);
    var dropped = null;
    if (typeof window.dropWornClothingToRoom === "function") {
      dropped = window.dropWornClothingToRoom(item, slot);
    } else if (item.equipped) {
      delete item.equipped[slot];
    }
    const garment = dropped && dropped.name ? dropped.name : (slot === "upper" ? "top" : "bottom");
    const baseText = pickFrom([
      `You work ${name}'s ${garment} off their limp body, hauling dead-weight hips and flopping arms free of it. They lie utterly passive as you strip them.`,
      `You peel the ${garment} from ${name}'s unconscious form, their limbs flopping as you tug it free. The bared flesh underneath doesn't so much as stir.`
    ]);
    polishBodyNarration(item, "strip " + (slot === "upper" ? "top" : "bottom"), baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} stripped the ${garment} off ${name}'s unconscious body.`, 3);
    window.saveGameState();
    nsfwRenderBodyMenu(item);
  }

  // === Unconscious body: examine narration (NSFW) ==========================
  // Exposed as window.describeUnconsciousBodyExamine so the SFW engine's
  // examineRoomObject() can call it behind a typeof guard when NSFW is
  // enabled. Claims the examine with a truthy return; the narration is
  // printed by polishBodyExamine once the background ai() call has polished
  // the base description into a more intimate, sensory account of the
  // unconscious body — the base text is never shown first. Mirrors
  // polishBodyNarration but is read-only (the player is just looking, not
  // acting on the body).

  // ── Clothing + position exposure context ──────────────────────
  // Derives, at call time, what the player can see of an unconscious body:
  //   1. Which regions are covered, from item.equipped (upper → chest, lower →
  //      groin/rear). Looting via Search deletes these slots, so this stays live.
  //   2. Which of the *exposed* regions are actually visible in the current
  //      bodyPosition (back → chest + groin; side → chest + groin + rear;
  //      face → rear only).
  //   3. Anatomy descriptors for the visible+exposed parts, pulled from
  //      item.nsfwTraits.anatomy (and item.anatomy for build/skin context).
  // Returns a prompt note string. Empty string when nothing is exposed, so
  // callers can simply concatenate it. No new persistent state is written.

  function nsfwBodySlotPresent(item, slot) {
    var eq = item && item.equipped;
    if (!eq || typeof eq !== "object") return false;
    var v = eq[slot];
    return !!v && !Array.isArray(v);
  }

  // Position → which anatomy regions are visible when their garment is gone.
  // Each entry lists the nsfwTraits.anatomy keys that are exposed/visible in
  // that pose when the corresponding slot (upper/lower) is missing.
  console.log("[BODY-DEBUG] IIFE before BODY_POSITION_VISIBLE (line ~1988)");
  var BODY_POSITION_VISIBLE = {
    back: {   // front of the body faces up
      upper: ["breasts", "nipples"],
      lower: ["pubicHair", "vagina", "penis"]
    },
    side: {   // profile; front and rear both reachable
      upper: ["breasts", "nipples"],
      lower: ["pubicHair", "vagina", "penis", "buttocks"]
    },
    face: {   // face-down; back and rear visible
      upper: [],            // back is bare but has no anatomy descriptor key
      lower: ["buttocks"]
    }
  };

  function buildBodyExposureNote(item) {
    if (!item) return "";
    var position = item.bodyPosition || "back";
    var visibleMap = BODY_POSITION_VISIBLE[position] || BODY_POSITION_VISIBLE.back;
    var upperCovered = nsfwBodySlotPresent(item, "upper");
    var lowerCovered = nsfwBodySlotPresent(item, "lower");

    // Collect the anatomy keys visible because their covering garment is gone.
    var exposedKeys = [];
    if (!upperCovered && visibleMap.upper.length) {
      exposedKeys = exposedKeys.concat(visibleMap.upper);
    }
    if (!lowerCovered && visibleMap.lower.length) {
      exposedKeys = exposedKeys.concat(visibleMap.lower);
    }

    var parts = [];
    var nsfwAnatomy = (item.nsfwTraits && item.nsfwTraits.anatomy) || {};
    for (var i = 0; i < exposedKeys.length; i++) {
      var key = exposedKeys[i];
      var data = nsfwAnatomy[key];
      if (data) parts.push(key + ": " + JSON.stringify(data));
    }

    var notes = [];
    // Clothing status line — always useful framing for the AI.
    var clothingParts = [];
    if (upperCovered) clothingParts.push("upper garment on (chest covered)");
    else clothingParts.push("upper garment gone (chest/breasts bare)");
    if (lowerCovered) clothingParts.push("lower garment on (groin/rear covered)");
    else clothingParts.push("lower garment gone (groin/rear bare)");
    notes.push("Clothing: " + clothingParts.join("; ") + ".");

    // Position-specific note for poses the intimacy anatomy keys don't cover.
    if (position === "face" && !upperCovered) {
      notes.push("The NPC is face-down; their bare back is exposed to view.");
    }

    if (parts.length) {
      notes.push("VISIBLE/EXPOSED ANATOMY (only these parts are bare and visible in this pose):\n" + parts.join("\n"));
    }

    return "\n" + notes.join("\n");
  }

  function describeBodyExamineBase(item) {
    nsfwEnsureBodyTraits(item);
    var name = nsfwGetEntityName(item);
    var isCorpse = item.bodyState === "corpse";
    var position = item.bodyPosition || "back";
    var positionPhrase = position === "face" ? "face-down" : "on their " + position;
    var wounds = typeof window.describeCombatWounds === "function"
      ? window.describeCombatWounds(item) : "";
    var ctx = item.defeatContext || {};

    var base = isCorpse
      ? name + " lies " + positionPhrase + ", still and lifeless, utterly at your mercy."
      : name + " lies " + positionPhrase + ", utterly still and at your mercy.";
    if (ctx.cause === "bleeding") {
      base += isCorpse
        ? " Dark, tacky stains mark where the wounds bled out."
        : " Slow bleeding has left them pale and flushed.";
    } else if (ctx.crit && ctx.target === "head") {
      base += " A dark bruise spreads across the skull.";
    }
    if (wounds) base += " Visible wounds: " + wounds + ".";
    return base;
  }

  function buildBodyExaminePrompt(item, baseText) {
    var name = nsfwGetEntityName(item);
    var isCorpse = item.bodyState === "corpse";
    var species = (item.species || "human").toLowerCase();
    var gender = item.gender || "unknown";
    var position = item.bodyPosition || "back";
    var wounds = typeof window.describeCombatWounds === "function"
      ? window.describeCombatWounds(item) : "";

    var speciesNote = species !== "human"
      ? "\nThe NPC is a " + species + ". Include species-appropriate physical details (skin, texture, features)."
      : "";
    var woundNote = wounds
      ? "\nThe NPC has visible wounds: " + wounds + ". Reference them subtly if relevant."
      : "";
    var exposureNote = buildBodyExposureNote(item);

    // Lingering body-state from recent use (recordBodyUse): every part with
    // an active descriptor gets mentioned, so examine reflects what has
    // been done to the body - not just what it looks like fresh.
    var bodyUseLines = [];
    if (typeof window.getBodyUseDescriptor === "function") {
      ["vagina", "anus", "mouth", "breasts", "penis"].forEach(function (part) {
        var d = window.getBodyUseDescriptor(item, part);
        if (d) bodyUseLines.push("their " + part + " " + d);
      });
    }
    var bodyUseNote = bodyUseLines.length
      ? "\nBODY STATE (from recent use - reference subtly, only where visible/relevant): " + bodyUseLines.join("; ") + "."
      : "";

    var stateLine = isCorpse
      ? "currently dead — a lifeless corpse lying " + (position === "face" ? "face-down" : "on their " + position) + ", completely at the player's mercy."
      : "currently unconscious and lying " + (position === "face" ? "face-down" : "on their " + position) + ", completely at the player's mercy.";

    var stateInstr = isCorpse
      ? "- The NPC is DEAD — emphasize the stillness, pallor, and lifelessness of the body. No breathing, no movement, no response."
      : "- The NPC is unconscious — emphasize their limp, vulnerable, unresponsive state.";

    return [
"You are polishing a player 'examine' description from a text adventure game.",
"The NPC is " + name + ", a " + species + " " + gender + ", " + stateLine + speciesNote + woundNote + exposureNote + bodyUseNote,
"",
"INSTRUCTIONS:",
"- Polish the BASE TEXT below. Make it vivid, sensory, and intimate — the player is taking in the body.",
"- Keep the same meaning and details. Do NOT invent new actions or body parts.",
"- Write in second person (\"You ...\"). This is the player's perspective.",
"- This is a ONE-WAY observation: the player is looking at an unconscious body. The NPC cannot respond, react, shift, murmur, or show any awareness — they are a limp, unresponsive body being observed.",
stateInstr,
"- Use the clothing + exposure context above: describe only what is actually visible in this pose. If anatomy is listed as exposed, you may reference it sensually; if a region is covered, do not describe what is hidden beneath it.",
"- You may note the body's exposure, positioning, and the player's control over them. Intimate and sensual framing is allowed; keep it tasteful and to 1-2 sentences.",
"- Use direct, physical language. No metaphors, no purple prose.",
"- Do NOT add NPC dialogue, speech, moans, sighs, or any reaction. The NPC is " + (isCorpse ? "dead" : "unconscious") + " and cannot participate.",
"- Do NOT add inner monologue. Stay on the body and what the player observes.",
"",
"BASE TEXT (polish this — refine, make more vivid, keep same meaning and details):",
"\"" + baseText + "\"",
"",
"IMPORTANT: Output ONLY the polished text. No explanations, no meta-discussion. Just the polished sentence.",
"",
"RESPOND with only the polished text, nothing else:"
    ].join("\n");
  }

  // Fire a background ai() call to polish the examine narration and print
  // only once the polished text returns — the base text is never written
  // first and then overwritten. A dimmed "Looking closer..." placeholder sits
  // in the log while the polish is in flight and is removed when the real
  // text prints. Falls back to the base text when the polish fails, or when
  // the player has moved on to another view.
  function polishBodyExamine(item, baseText) {
    var _ai = typeof window.ai === "function" ? window.ai : null;
    if (!_ai) { nsfwPrintBodyNarration(baseText); return; }

    var pendingEntry = nsfwShowBodyPendingNarration("Looking closer...");
    (async function() {
      var polished = null;
      try {
        var prompt = buildBodyExaminePrompt(item, baseText);
        var result = await _ai({
          instruction: prompt,
          startWith: "",
          endButtons: "none",
          generatorName: "cyoaftw-engine-core"
        });
        polished = result && (result.text || result);
        if (polished && polished.trim()) {
          // Reject meta-commentary (same guard as the intimacy / body-action paths)
          var isMeta = /since the base|please provide|I cannot|I'm unable|as an ai|i'll polish|here is the|here's the/i.test(polished.trim());
          if (isMeta) {
            console.log("[Body Actions] Examine narration rejected (meta-commentary).");
            polished = null;
          }
        } else {
          polished = null;
        }
      } catch (e) {
        console.warn("[Body Actions] Examine narration polish failed:", e);
      }

      if (window.G && window.G.activeObject !== item) polished = null;
      nsfwRemoveBodyPendingNarration(pendingEntry);
      nsfwPrintBodyNarration(polished ? polished.trim() : baseText);
    })();
  }

  console.log("[BODY-DEBUG] IIFE reached line ~2153 (about to assign describeUnconsciousBodyExamine)");
  window.describeUnconsciousBodyExamine = function(item) {
    if (!item || item.bodyState !== "unconscious") return null;
    // Claims the examine for the SFW engine (truthy return). The narration
    // is printed by polishBodyExamine once the AI polish returns — the base
    // text is never written first.
    polishBodyExamine(item, describeBodyExamineBase(item));
    return true;
  };

  // Append-only hook called by the SFW engine's renderRoomObjectActionMenu
  // after it has rendered the standard body buttons. Adds the NSFW body-action
  // groups (Kiss, Position, Oral, Penetrate, Spit) to the same container.
  window.appendUnconsciousBodyActions = function(item, el) {
    console.log("[BODY-DEBUG] NSFW appendUnconsciousBodyActions called", { bodyState: item && item.bodyState, hasEl: !!el });
    if (!item || item.bodyState !== "unconscious" || !el) {
      console.log("[BODY-DEBUG] NSFW appendUnconsciousBodyActions bailing early", { item: !!item, bodyState: item && item.bodyState, hasEl: !!el });
      return;
    }
    appendUnconsciousBodyGroups(item, el);
    console.log("[BODY-DEBUG] NSFW appendUnconsciousBodyGroups done, child count:", el.children.length);
  };

  // === Bound captive interactions ====================================
  // A surrendered NPC the player has roped (npc.bound, see the SFW engine's
  // captor menu / renderCaptorMenu) gets NSFW action groups on that menu once
  // the player has examined them (captiveExamined — the engine gates the hook
  // call the same way unconscious bodies reveal theirs). The key difference
  // from the unconscious-body groups: the captive is AWAKE. Narration frames
  // coercion — fear, reluctance, resignation — not limp unresponsiveness.

  function nsfwIsBoundCaptive(npc) {
    if (!npc || !npc.bound || npc.dead || npc.unconscious) return false;
    if (typeof window.isHeldCaptive === "function") return window.isHeldCaptive(npc);
    return !!npc.surrendered;
  }

  // Region access for a bound captive: mouth is always reachable; chest and
  // groin once the covering garment is gone (Search their gear can take it);
  // the rear/anus likewise, since a bound captive can simply be turned around.
  function nsfwCaptiveRegionExposed(npc, region) {
    if (!npc) return false;
    var upperCovered = nsfwBodySlotPresent(npc, "upper");
    var lowerCovered = nsfwBodySlotPresent(npc, "lower");
    if (region === "mouth") return true;
    if (region === "breasts") return !upperCovered;
    if (region === "genitals") return !lowerCovered;
    if (region === "anus") return !lowerCovered;
    return false;
  }

  function nsfwRenderCaptiveMenu(npc) {
    if (typeof window.renderCaptorMenu === "function") {
      window.renderCaptorMenu(npc);
    }
  }

  // Exposure note for the AI prompts: what the player can currently see of
  // the roped captive. Mirrors buildBodyExposureNote's garment logic but with
  // captive accessibility (mouth always; rear reachable by turning them).
  function buildCaptiveExposureNote(npc) {
    if (!npc) return "";
    var upperCovered = nsfwBodySlotPresent(npc, "upper");
    var lowerCovered = nsfwBodySlotPresent(npc, "lower");
    var exposed = [];
    exposed.push("mouth (always accessible — their face is right there)");
    if (!upperCovered) {
      exposed.push("bare chest (upper garment taken)");
    }
    if (!lowerCovered) {
      exposed.push("bare groin (lower garment taken)");
      exposed.push("bare rear and anus (lower garment taken — they can be turned around)");
    }
    return "\nEXPOSURE (what the player can currently see/reach — do not describe anything else as bare): " + exposed.join("; ") + ".";
  }

  function buildCaptiveActionPrompt(npc, actionDesc, baseText) {
    const name = nsfwGetEntityName(npc);
    const species = (npc.species || "human").toLowerCase();
    const gender = npc.gender || "unknown";
    const wounds = typeof window.describeCombatWounds === "function"
      ? window.describeCombatWounds(npc) : "";

    var speciesNote = species !== "human"
      ? "\nThe NPC is a " + species + ". Include species-appropriate physical details (skin, texture, features)."
      : "";
    var woundNote = wounds
      ? "\nThe NPC has visible wounds: " + wounds + ". Reference them subtly if relevant — they lost this fight."
      : "";
    var exposureNote = buildCaptiveExposureNote(npc);
    var bodyUseNote = nsfwBodyUsePromptNote(npc, actionDesc);

    var prompt = [
"You are polishing a player action description from a text adventure game.",
"The NPC is " + name + ", a " + species + " " + gender + ", currently the player's BOUND CAPTIVE — wrists lashed with rope, forced to comply. They are awake, aware, and unwilling." + speciesNote + woundNote + exposureNote + bodyUseNote,
"",
"INSTRUCTIONS:",
"- Polish the BASE TEXT below. Fix grammar, refine the sentence, make it more vivid and sensory.",
"- Keep the same meaning and the same act. Do NOT invent new actions or body parts.",
"- The action: " + actionDesc + ".",
"- Write in second person (\"You ...\"). This is the player's perspective.",
"- This act is COERCED, not consensual: the NPC submits because they are bound and defeated, not because they want it. Show fear, reluctance, averted eyes, held breath, trembling, stiff unresponsiveness of forced compliance.",
"- The NPC may show small involuntary reactions (flinching, clenching, a shaky breath, stifled sounds) but NO enthusiastic participation, NO arousal framing, and NO dialogue beyond a stifled word.",
"- Use direct, physical language. No metaphors, no purple prose.",
"- Keep it to 1-2 sentences. Match the length of the base text.",
"- Use the exposure context above: only reference anatomy that is listed as accessible. Do not describe what is covered.",
"",
"BASE TEXT (polish this — refine, make more vivid, keep same meaning and details):",
"\"" + baseText + "\"",
"",
"IMPORTANT: Output ONLY the polished text. No explanations, no meta-discussion. Just the polished sentence.",
"",
"RESPOND with only the polished text, nothing else:"
    ].filter(function(l) { return l !== ""; }).join("\n");

    return prompt;
  }

  // Captive mirror of polishBodyNarration: placeholder in the log, print only
  // the polished text once the ai() call returns, fall back to the base text
  // on failure or if the player has moved on to another view.
  function polishCaptiveNarration(npc, actionDesc, baseText) {
    var _ai = typeof window.ai === "function" ? window.ai : null;
    if (!_ai) { nsfwPrintBodyNarration(baseText); return; }

    var pendingEntry = nsfwShowBodyPendingNarration("...");
    (async function() {
      var polished = null;
      try {
        var prompt = buildCaptiveActionPrompt(npc, actionDesc, baseText);
        var result = await _ai({
          instruction: prompt,
          startWith: "",
          endButtons: "none",
          generatorName: "cyoaftw-engine-core"
        });
        polished = result && (result.text || result);
        if (polished && polished.trim()) {
          var isMeta = /since the base|please provide|I cannot|I'm unable|as an ai|i'll polish|here is the|here's the/i.test(polished.trim());
          if (isMeta) {
            console.log("[Captive Actions] Narration rejected (meta-commentary) for:", actionDesc);
            polished = null;
          }
        } else {
          polished = null;
        }
      } catch (e) {
        console.warn("[Captive Actions] Narration polish failed for:", actionDesc, e);
      }

      if (window.G && window.G.activeNPC !== npc) polished = null;
      nsfwRemoveBodyPendingNarration(pendingEntry);
      nsfwPrintBodyNarration(polished ? polished.trim() : baseText);
    })();
  }

  function appendBoundCaptiveGroups(npc, el) {
    if (!npc || !el) return;
    nsfwEnsureBodyTraits(npc);

    // Kiss group — the face is always accessible on a standing bound captive.
    window.appendCombatGroup(el, "Kiss", [
      window.createCombatButton("Kiss mouth", () => kissBoundCaptive(npc, "mouth")),
      window.createCombatButton("Kiss cheek", () => kissBoundCaptive(npc, "cheek"))
    ]);

    // Touch group — grope, gated by anatomy + garment exposure.
    var touchButtons = [];
    if (nsfwBodyHasBreasts(npc) && nsfwCaptiveRegionExposed(npc, "breasts")) {
      touchButtons.push(window.createCombatButton("Grope chest", () => touchBoundCaptive(npc, "breasts")));
    }
    var genitalType = nsfwBodyGenitalType(npc);
    if (genitalType && nsfwCaptiveRegionExposed(npc, "genitals")) {
      touchButtons.push(window.createCombatButton("Stroke genitals", () => touchBoundCaptive(npc, "genitals")));
    }
    if (nsfwCaptiveRegionExposed(npc, "anus")) {
      touchButtons.push(window.createCombatButton("Grope rear", () => touchBoundCaptive(npc, "rear")));
    }
    if (touchButtons.length) {
      window.appendCombatGroup(el, "Touch", touchButtons);
    }

    // Oral group — player must have a penis. Once forced, the button becomes
    // a continuation thrust so the entry narration is not repeated.
    if (nsfwPlayerHasPenis()) {
      window.appendCombatGroup(el, "Oral", [
        npc.captiveMouthUsed
          ? window.createCombatButton("Thrust into mouth", () => thrustCaptive(npc, "mouth"))
          : window.createCombatButton("Force into mouth", () => forceOralCaptive(npc))
      ]);
    }

    // Penetrate group — finger and/or penis, gated by anatomy + exposure.
    var penButtons = [];
    var hasAnus = nsfwBodyHasAnus(npc);
    var isCloaca = genitalType === "cloaca-vent" || genitalType === "cloaca-penis";

    if (genitalType === "vagina" && nsfwCaptiveRegionExposed(npc, "genitals")) {
      penButtons.push(window.createCombatButton("Finger vagina", () => fingerCaptive(npc, "vagina")));
    } else if (isCloaca && nsfwCaptiveRegionExposed(npc, "genitals")) {
      penButtons.push(window.createCombatButton("Finger cloacal vent", () => fingerCaptive(npc, "cloaca")));
    }
    if (hasAnus && nsfwCaptiveRegionExposed(npc, "anus")) {
      penButtons.push(window.createCombatButton("Finger anus", () => fingerCaptive(npc, "anus")));
    }
    if (nsfwPlayerHasPenis()) {
      if (genitalType === "vagina" && nsfwCaptiveRegionExposed(npc, "genitals")) {
        penButtons.push(npc.captivePenetratedTarget === "vagina"
          ? window.createCombatButton("Thrust into vagina", () => thrustCaptive(npc, "vagina"))
          : window.createCombatButton("Penetrate vagina", () => penetrateCaptive(npc, "vagina")));
      } else if (isCloaca && nsfwCaptiveRegionExposed(npc, "genitals")) {
        penButtons.push(npc.captivePenetratedTarget === "cloaca"
          ? window.createCombatButton("Thrust into cloaca", () => thrustCaptive(npc, "cloaca"))
          : window.createCombatButton("Penetrate cloaca", () => penetrateCaptive(npc, "cloaca")));
      }
      if (hasAnus && nsfwCaptiveRegionExposed(npc, "anus")) {
        penButtons.push(npc.captivePenetratedTarget === "anus"
          ? window.createCombatButton("Thrust into anus", () => thrustCaptive(npc, "anus"))
          : window.createCombatButton("Penetrate anus", () => penetrateCaptive(npc, "anus")));
      }
    }
    if (penButtons.length) {
      window.appendCombatGroup(el, "Penetrate", penButtons);
    }

    // Climax group — finish inside every hole currently in use.
    if (nsfwPlayerHasPenis()) {
      var climaxButtons = [];
      if (npc.captivePenetratedTarget === "vagina" && nsfwCaptiveRegionExposed(npc, "genitals")) {
        climaxButtons.push(window.createCombatButton("Finish inside (vagina)", () => climaxCaptive(npc, "vagina")));
      } else if (npc.captivePenetratedTarget === "cloaca" && nsfwCaptiveRegionExposed(npc, "genitals")) {
        climaxButtons.push(window.createCombatButton("Finish inside (" + (nsfwGenitalLabel(npc) || "cloaca") + ")", () => climaxCaptive(npc, "cloaca")));
      }
      if (npc.captivePenetratedTarget === "anus" && nsfwCaptiveRegionExposed(npc, "anus")) {
        climaxButtons.push(window.createCombatButton("Finish inside (anus)", () => climaxCaptive(npc, "anus")));
      }
      if (npc.captiveMouthUsed) {
        climaxButtons.push(window.createCombatButton("Finish inside (mouth)", () => climaxCaptive(npc, "mouth")));
      }
      if (climaxButtons.length) {
        window.appendCombatGroup(el, "Climax", climaxButtons);
      }
    }

    // Care group — wipes dried loads / smell notes off the captive (the only
    // reset those have; see the unconscious-body Care group).
    var hasDriedLoads = !!(npc.bodyUse && Object.keys(npc.bodyUse).some(function (part) {
      return npc.bodyUse[part] && npc.bodyUse[part].loadKey;
    }));
    var hasSmellNotes = !!(Array.isArray(npc.smellNotes) && npc.smellNotes.length);
    if (hasDriedLoads || hasSmellNotes) {
      window.appendCombatGroup(el, "Care", [
        window.createCombatButton("Clean them up", () => cleanUpCaptive(npc))
      ]);
    }
  }

  // ── Captive action functions ─────────────────────────────────
  // Same pattern as the body actions: guard, set state flags, build base
  // text, AI-polish (coercion-framed), remember event, save, re-render menu.

  function kissBoundCaptive(npc, where) {
    if (!nsfwIsBoundCaptive(npc)) return;
    if (where !== "mouth" && where !== "cheek") return;

    npc.captiveKissed = (npc.captiveKissed || 0) + 1;
    npc.captiveLastKiss = where;

    const name = nsfwGetEntityName(npc);
    const baseText = where === "mouth"
      ? `You grip ${name}'s jaw and kiss them full on the mouth. Their lips press flat and unyielding; a fine tremor runs through them, but they don't dare pull away.`
      : `You press a slow kiss to ${name}'s ${where}. They flinch at the touch, then force themselves still, breath coming quick and shallow through their nose.`;
    const actionDesc = "kiss " + where;
    polishCaptiveNarration(npc, actionDesc, baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} kissed ${name} on the ${where} while they were bound.`, 4);
    window.saveGameState();
    nsfwRenderCaptiveMenu(npc);
  }

  // part: "breasts" | "genitals" | "rear"
  function touchBoundCaptive(npc, part) {
    if (!nsfwIsBoundCaptive(npc)) return;
    const name = nsfwGetEntityName(npc);
    var baseText;

    if (part === "breasts") {
      if (!nsfwBodyHasBreasts(npc) || !nsfwCaptiveRegionExposed(npc, "breasts")) return;
      baseText = `You close a hand over ${name}'s bare chest, kneading without hurry. They turn their face away, jaw tight, a shaky breath escaping through their teeth.`;
    } else if (part === "genitals") {
      if (!nsfwBodyGenitalType(npc) || !nsfwCaptiveRegionExposed(npc, "genitals")) return;
      var genLabel = nsfwGenitalLabel(npc) || "genitals";
      baseText = `You stroke a hand over ${name}'s exposed ${genLabel}. Their hips jerk back from the touch, then settle — there is nowhere to go with their wrists tied.`;
    } else if (part === "rear") {
      if (!nsfwCaptiveRegionExposed(npc, "anus")) return;
      baseText = `You grab a handful of ${name}'s rear, squeezing roughly. They stumble half a step from the pull of it, the rope biting into their wrists.`;
    } else return;

    npc.captiveTouched = (npc.captiveTouched || 0) + 1;
    npc.captiveTouchedParts = npc.captiveTouchedParts || [];
    if (npc.captiveTouchedParts.indexOf(part) < 0) npc.captiveTouchedParts.push(part);
    const actionDesc = "touch " + (part === "breasts" ? "chest" : part);
    polishCaptiveNarration(npc, actionDesc, baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} groped ${name} while they were bound.`, 5);
    window.saveGameState();
    nsfwRenderCaptiveMenu(npc);
  }

  function forceOralCaptive(npc) {
    if (!nsfwIsBoundCaptive(npc)) return;
    if (!nsfwPlayerHasPenis()) return;

    npc.captiveMouthUsed = true;
    const name = nsfwGetEntityName(npc);
    const baseText = `You fist a hand in ${name}'s hair and force your cock between their lips. They gag hard around the sudden fullness, eyes squeezed shut, throat fluttering around you.`;
    const actionDesc = "force mouth";
    polishCaptiveNarration(npc, actionDesc, baseText);
    if (typeof window.recordBodyUse === "function") window.recordBodyUse(npc, "mouth", { useKind: "penetrate" });
    window.rememberStoryEvent("combat", `${window.G.player.name} forced their cock into ${name}'s mouth while they were bound.`, 7);
    window.saveGameState();
    nsfwRenderCaptiveMenu(npc);
  }

  // target: "vagina" | "cloaca" | "anus"
  function fingerCaptive(npc, target) {
    if (!nsfwIsBoundCaptive(npc)) return;
    const name = nsfwGetEntityName(npc);
    var label;
    var baseText;

    if (target === "vagina" || target === "cloaca") {
      if (!nsfwCaptiveRegionExposed(npc, "genitals")) return;
      label = (target === "cloaca") ? (nsfwGenitalLabel(npc) || "cloacal vent") : "vagina";
      baseText = `You work a finger into ${name}'s dry, unaroused ${label}. They bite down on a sound, thighs trying to close against the intrusion, held open by nothing but fear of what you will do if they fight.`;
    } else if (target === "anus") {
      if (!nsfwCaptiveRegionExposed(npc, "anus")) return;
      label = "anus";
      baseText = `You press a finger against ${name}'s clenched anus, working it in slowly against the resistant ring. They go rigid, breath held, enduring it.`;
    } else return;

    npc.captiveFingered = true;
    npc.captiveFingerTarget = target;
    if (typeof window.recordBodyUse === "function") window.recordBodyUse(npc, target, { useKind: "finger" });
    const actionDesc = "finger " + label;
    polishCaptiveNarration(npc, actionDesc, baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} inserted a finger into ${name}'s ${label} while they were bound.`, 6);
    window.saveGameState();
    nsfwRenderCaptiveMenu(npc);
  }

  // target: "vagina" | "cloaca" | "anus" — requires player penis
  function penetrateCaptive(npc, target) {
    if (!nsfwIsBoundCaptive(npc)) return;
    if (!nsfwPlayerHasPenis()) return;
    const name = nsfwGetEntityName(npc);
    var label;
    var baseText;

    if (target === "vagina" || target === "cloaca") {
      if (!nsfwCaptiveRegionExposed(npc, "genitals")) return;
      label = (target === "cloaca") ? (nsfwGenitalLabel(npc) || "cloacal vent") : "vagina";
      baseText = `You guide your cock into ${name}'s exposed ${label}. Their breath comes fast and panicked; they take it stiff and unready, bound hands flexing uselessly.` + nsfwBodyUseClause(npc, target);
    } else if (target === "anus") {
      if (!nsfwCaptiveRegionExposed(npc, "anus")) return;
      label = "anus";
      baseText = `You press your cock against ${name}'s tight anus and push in. They stifle a strained noise, muscles locked, forcing themselves to endure it.` + nsfwBodyUseClause(npc, target);
    } else return;

    npc.captivePenetrated = true;
    npc.captivePenetratedTarget = target;
    if (typeof window.recordBodyUse === "function") window.recordBodyUse(npc, target, { useKind: "penetrate" });
    const actionDesc = "penetrate " + label;
    polishCaptiveNarration(npc, actionDesc, baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} penetrated ${name}'s ${label} with their cock while they were bound.`, 8);
    window.saveGameState();
    nsfwRenderCaptiveMenu(npc);
  }

  // Continuation thrusting. target: "vagina" | "cloaca" | "anus" | "mouth"
  function thrustCaptive(npc, target) {
    if (!nsfwIsBoundCaptive(npc)) return;
    if (!nsfwPlayerHasPenis()) return;
    const name = nsfwGetEntityName(npc);
    var label;
    var baseText;

    if (target === "mouth") {
      if (!npc.captiveMouthUsed) return;
      label = "mouth";
      baseText = pickFrom([
        `You fuck ${name}'s mouth with slow, deliberate strokes, holding their head right where you want it. Tears streak their cheeks; they take each thrust with a muffled, helpless sound.`,
        `You pump into ${name}'s mouth, their bound hands tugging uselessly at the rope with every push. They struggle to breathe around you, throat working in quick swallows.`
      ]);
    } else if (target === "vagina" || target === "cloaca") {
      if (npc.captivePenetratedTarget !== target) return;
      if (!nsfwCaptiveRegionExposed(npc, "genitals")) return;
      label = (target === "cloaca") ? (nsfwGenitalLabel(npc) || "cloacal vent") : "vagina";
      baseText = pickFrom([
        `You drive into ${name}'s ${label} in steady strokes, their bound hands flexing behind them with every push. Their body clenches around you tight and unwilling.`,
        `You fuck ${name}'s ${label} with even, unhurried strokes. They endure it with their eyes shut and their jaw clenched, breath hitching each time you fill them.`
      ]);
    } else if (target === "anus") {
      if (npc.captivePenetratedTarget !== "anus") return;
      if (!nsfwCaptiveRegionExposed(npc, "anus")) return;
      label = "anus";
      baseText = pickFrom([
        `You bury yourself in ${name}'s anus again and again, their whole body jolting with each thrust. A strained, breathless noise escapes them each time you bottom out.`,
        `You fuck ${name}'s anus in deep strokes. They stand it rigidly, every muscle locked, a thin whine held behind their teeth.`
      ]);
    } else return;

    npc.captiveThrustCount = (npc.captiveThrustCount || 0) + 1;
    if (typeof window.recordBodyUse === "function") window.recordBodyUse(npc, target, { useKind: "penetrate" });
    const actionDesc = "thrust " + label;
    polishCaptiveNarration(npc, actionDesc, baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} continued thrusting into ${name}'s ${label} while they were bound.`, 6);
    window.saveGameState();
    nsfwRenderCaptiveMenu(npc);
  }

  // Ejaculate into a hole the player is currently inside.
  // target: "vagina" | "cloaca" | "anus" | "mouth"
  function climaxCaptive(npc, target) {
    if (!nsfwIsBoundCaptive(npc)) return;
    if (!nsfwPlayerHasPenis()) return;
    const name = nsfwGetEntityName(npc);

    var label = null;
    if (target === "vagina" || target === "cloaca") {
      if (npc.captivePenetratedTarget !== target) return;
      if (!nsfwCaptiveRegionExposed(npc, "genitals")) return;
      label = (target === "cloaca") ? (nsfwGenitalLabel(npc) || "cloaca") : "vagina";
    } else if (target === "anus") {
      if (npc.captivePenetratedTarget !== "anus") return;
      if (!nsfwCaptiveRegionExposed(npc, "anus")) return;
      label = "anus";
    } else if (target === "mouth") {
      if (!npc.captiveMouthUsed) return;
      label = "mouth";
    } else return;

    var baseText;
    if (label === "mouth") {
      baseText = `You bury yourself to the hilt in ${name}'s mouth and come, spilling down their throat. They gag and swallow around you, eyes streaming, held in place until you are done.`;
    } else if (label === "anus") {
      baseText = `You sheathe yourself fully in ${name}'s anus and come, spilling deep inside them. They shudder once, all over, as you empty yourself into their bound body.`;
    } else {
      baseText = `You hilt yourself in ${name}'s ${label} and come, spilling your release deep inside them. A broken, shivering breath is all the sound they make as you drain yourself into your captive.`;
    }

    npc.captiveClimaxCount = (npc.captiveClimaxCount || 0) + 1;
    if (typeof window.recordBodyUse === "function") window.recordBodyUse(npc, target, { loadKey: "semen", useKind: "penetrate" });
    const actionDesc = "climax inside " + label;
    polishCaptiveNarration(npc, actionDesc, baseText);
    window.rememberStoryEvent("combat", `${window.G.player.name} ejaculated into ${name}'s ${label} while they were bound.`, 8);
    window.saveGameState();
    nsfwRenderCaptiveMenu(npc);
  }

  function cleanUpCaptive(npc) {
    if (!nsfwIsBoundCaptive(npc)) return;
    const name = nsfwGetEntityName(npc);
    delete npc.bodyUse;
    delete npc.smellNotes;
    const baseText = `You fetch water and a rag and wipe ${name} down under the rope, scrubbing off every dried, crusted trace of what you did to them. They hold statue-still through it, watching your face.`;
    const actionDesc = "clean up";
    polishCaptiveNarration(npc, actionDesc, baseText);
    window.rememberStoryEvent("care", `${window.G.player.name} cleaned and wiped down their bound captive ${name}.`, 2);
    window.saveGameState();
    nsfwRenderCaptiveMenu(npc);
  }

  // ── Captive examine ───────────────────────────────────────────

  function describeCaptiveExamineBase(npc) {
    nsfwEnsureBodyTraits(npc);
    var name = nsfwGetEntityName(npc);
    var wounds = typeof window.describeCombatWounds === "function"
      ? window.describeCombatWounds(npc) : "";
    var base = name + " stands roped at the wrists, " +
      (wounds ? "wincing against their wounds" : "shaking with exhaustion") +
      ", eyes down but never leaving you for long. Whatever they see in your face makes them go very still.";
    return base;
  }

  function buildCaptiveExaminePrompt(npc, baseText) {
    var name = nsfwGetEntityName(npc);
    var species = (npc.species || "human").toLowerCase();
    var gender = npc.gender || "unknown";
    var wounds = typeof window.describeCombatWounds === "function"
      ? window.describeCombatWounds(npc) : "";

    var speciesNote = species !== "human"
      ? "\nThe NPC is a " + species + ". Include species-appropriate physical details (skin, texture, features)."
      : "";
    var woundNote = wounds
      ? "\nThe NPC has visible wounds: " + wounds + ". Reference them subtly if relevant."
      : "";
    var exposureNote = buildCaptiveExposureNote(npc);

    var bodyUseLines = [];
    if (typeof window.getBodyUseDescriptor === "function") {
      ["vagina", "anus", "mouth", "breasts", "penis"].forEach(function (part) {
        var d = window.getBodyUseDescriptor(npc, part);
        if (d) bodyUseLines.push("their " + part + " " + d);
      });
    }
    var bodyUseNote = bodyUseLines.length
      ? "\nBODY STATE (from recent use - reference subtly, only where visible/relevant): " + bodyUseLines.join("; ") + "."
      : "";

    return [
"You are polishing a player 'examine' description from a text adventure game.",
"The NPC is " + name + ", a " + species + " " + gender + ", currently the player's BOUND CAPTIVE — wrists lashed with rope, defeated, forced to wait on the player's mercy. They are awake, aware, and afraid." + speciesNote + woundNote + exposureNote + bodyUseNote + smellNote,
"",
"INSTRUCTIONS:",
"- Polish the BASE TEXT below. Make it vivid, sensory, and intimate — the player is looking their captive over.",
"- Keep the same meaning and details. Do NOT invent new actions or body parts.",
"- Write in second person (\"You ...\"). This is the player's perspective.",
"- The NPC is conscious: show fear, tension, wary tracking eyes, small involuntary tells (swallowing, trembling, held breath).",
"- Use the exposure context above: only reference anatomy that is listed as accessible. Do not describe what is covered.",
"- Keep it to 1-2 sentences. Match the length of the base text.",
"- Do NOT add dialogue.",
"",
"BASE TEXT (polish this — refine, make more vivid, keep same meaning and details):",
"\"" + baseText + "\"",
"",
"IMPORTANT: Output ONLY the polished text. No explanations, no meta-discussion. Just the polished sentence.",
"",
"RESPOND with only the polished text, nothing else:"
    ].filter(function(l) { return l !== ""; }).join("\n");
  }

  // Captive mirror of polishBodyExamine: placeholder ("Looking them over..."),
  // print only the polished text, fall back to the base on failure or if the
  // player has moved on to another view.
  function polishCaptiveExamine(npc, baseText) {
    var _ai = typeof window.ai === "function" ? window.ai : null;
    if (!_ai) { nsfwPrintBodyNarration(baseText); return; }

    var pendingEntry = nsfwShowBodyPendingNarration("Looking them over...");
    (async function() {
      var polished = null;
      try {
        var prompt = buildCaptiveExaminePrompt(npc, baseText);
        var result = await _ai({
          instruction: prompt,
          startWith: "",
          endButtons: "none",
          generatorName: "cyoaftw-engine-core"
        });
        polished = result && (result.text || result);
        if (polished && polished.trim()) {
          var isMeta = /since the base|please provide|I cannot|I'm unable|as an ai|i'll polish|here is the|here's the/i.test(polished.trim());
          if (isMeta) {
            console.log("[Captive Actions] Examine narration rejected (meta-commentary).");
            polished = null;
          }
        } else {
          polished = null;
        }
      } catch (e) {
        console.warn("[Captive Actions] Examine narration polish failed:", e);
      }

      if (window.G && window.G.activeNPC !== npc) polished = null;
      nsfwRemoveBodyPendingNarration(pendingEntry);
      nsfwPrintBodyNarration(polished ? polished.trim() : baseText);
    })();
  }

  // Claims the SFW engine's captive Examine (truthy return): the narration is
  // printed here once the AI polish returns — the base text is never shown
  // first. Mirrors describeUnconsciousBodyExamine's contract.
  window.describeBoundCaptiveExamine = function(npc) {
    if (!nsfwIsBoundCaptive(npc)) return null;
    polishCaptiveExamine(npc, describeCaptiveExamineBase(npc));
    return true;
  };

  // Append-only hook called by the SFW engine's renderCaptorMenu after the
  // standard captor buttons. The engine only calls this once the player has
  // examined the captive (captiveExamined), mirroring the unconscious-body
  // reveal pattern.
  window.appendBoundCaptiveActions = function(npc, el) {
    if (!nsfwIsBoundCaptive(npc) || !el) return;
    appendBoundCaptiveGroups(npc, el);
  };

  initNSFWSystem();
})();
} catch (e) {
  console.error("[BODY-DEBUG] nsfw-system.js IIFE THREW:", e.message, e.stack);
}
console.log("[BODY-DEBUG] nsfw-system.js done. appendUnconsciousBodyActions:", typeof window.appendUnconsciousBodyActions, "describeUnconsciousBodyExamine:", typeof window.describeUnconsciousBodyExamine);
