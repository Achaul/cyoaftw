// === cyoaftw-nsfw-system.js === - v2026-08-16-0010
(function() {
  'use strict';

// NSFW conversation options are now defined in base catalogue (cyoaftw-npc-data.js)

// NSFW options are defined in base catalogue - no injection needed
console.log("[NSFW System] Loaded - NSFW options in base catalogue");

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

  // Note: NSFW_CONVERSATION_CATALOGUE is already defined at the top of this file
  // The rest of the code will use the catalogue defined above

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
      if (g === "male") {
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
    
    // Use explicit affirmative field if provided (from cached reply object)
    let isAccepted = affirmativeFromCache === true;
    let isRejected = affirmativeFromCache === false;
    
    // Fallback: parse from text if not provided (for backwards compatibility)
    if (isAccepted === undefined && isRejected === undefined) {
        const acceptedMatch = responseText.match(/^\[ACCEPTED\]\s+(.*)/s);
        const rejectedMatch = responseText.match(/^\[REJECTED\]\s+(.*)/s);
        if (acceptedMatch) {
            isAccepted = true;
            responseText = acceptedMatch[1];
        } else if (rejectedMatch) {
            isRejected = true;
            responseText = rejectedMatch[1];
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
          option.id === "proposition" ? isPrivateLocation(currentRoom) : 
          ["Tavern", "Inn", "Inn Common"].some(t => currentRoom.type && currentRoom.type.includes(t))
        );
        
        // Check if we're alone with the NPC (for proposition)
        const isAloneWithNPC = currentRoom && currentRoom.creatures && (
          currentRoom.creatures.filter(c => c.isPlayer || c === npc).length === 2
        );
        
        // If already in suitable location, start intimacy encounter directly
        if (option.startEncounter && isAlreadySuitable && (
            option.id === "proposition" && isAloneWithNPC ||
            option.id === "seduce"
          )) {
          // Clear pending state
          delete npc._pendingSeductionDestination;
          delete npc._pendingSeductionOption;
          
          // Start intimacy encounter immediately
          setTimeout(() => {
            startIntimacyEncounter(npc, window.G.player);
            if (typeof renderIntimacyActionMenu === "function") {
              renderIntimacyActionMenu(npc);
            }
          }, 100);
          return responseText;
        }
        
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
            // Mark that NPC is at meetup location for immediate proposition
            npc._meetupArrived = true;
            npc._meetupLocation = targetRoom.coords;
            npc._meetupRoomName = targetRoom.displayName || targetRoom.type;
            return responseText + ` ${npc.name} takes your hand. "Follow me to the ${targetRoom.displayName || targetRoom.type}."`;
          } else {
            npc._pendingSeductionDestination = targetRoom.coords;
            npc._pendingSeductionOption = option.id;

            const homeRoomName = targetRoom.displayName || targetRoom.type;
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
              },
              relationshipImpact: { lust: +2, attraction: +2 }
            };

            if (!window.NPC_CONVERSATION_CATALOGUE.some(o => o.id === followOption.id)) {
              window.NPC_CONVERSATION_CATALOGUE.push(followOption);
            }

            return responseText + ` ${npc.name} looks around nervously. "I... I don't see anywhere suitable here. Perhaps you could lead the way?"`;
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
              
              return responseText + ` ${npc.name} smiles warmly. "I would enjoy that. Meet me at the ${meetupRoom.displayName || meetupRoom.type} in a little while."`;
            } else {
              // No meetup location found at all
              return responseText + ` ${npc.name} smiles warmly. "I would enjoy that. Let's find a good spot later."`;
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
    if (!npc.relationship) npc.relationship = {};
    if (impacts.lust) applyLustImpact(npc, impacts.lust);
    if (impacts.attraction) applyAttractionImpact(npc, impacts.attraction);
    if (impacts.hostility) {
      npc.relationship.hostility = (npc.relationship.hostility || 0) + impacts.hostility;
      npc.relationship.hostility = Math.max(0, Math.min(100, npc.relationship.hostility));
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

  function injectMeetupConversationOptions() {
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
      
      // Log NSFW actions for debugging - only for specific NSFW option IDs
      if (option.id === "proposition" || option.id === "seduce" || option.id === "split-bill" || option.id === "pay-for-meal" || option.id === "small-talk") {
        console.log("[NSFW] Action:", option.id, "with", npc.name);
      }
      
      const envMod = getEnvironmentalModifier(window.G.activeRoom);
      if (option.relationshipImpact.lust) applyLustImpact(npc, option.relationshipImpact.lust, envMod);
      if (option.relationshipImpact.attraction) applyAttractionImpact(npc, option.relationshipImpact.attraction);
      if (option.action && typeof option.action === "function") option.action(npc);
      
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
      if (typeof window.queryConversationCatalogue === "function" && 
          typeof window.NPC_CONVERSATION_CATALOGUE !== "undefined") {
        const originalQueryConversationCatalogue = window.queryConversationCatalogue;
        window.queryConversationCatalogue = function(npc, context) {
        const allOptions = window.NPC_CONVERSATION_CATALOGUE || [];
        
        // First, apply original filtering (e.g., greeting gate) if it exists
        let filteredOptions = allOptions;
        if (typeof originalQueryConversationCatalogue === "function") {
          filteredOptions = originalQueryConversationCatalogue(npc, context) || allOptions;
        }
        
        // Check if we're in a date/meetup context (primary indicator)
        const isAtMeetup = npc && npc._meetupArrived && context && context.room && 
                          context.room.coords === npc._meetupLocation;
        
        // Check if there's a pending seduction/proposition that needs follow-up (show follow option only)
        const hasPendingSeduction = npc && (npc._pendingSeductionDestination || npc._pendingSeductionOption) && 
                                   !npc._meetupArrived;
        
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
        
        // If intimacy encounter is active, only show intimacy-related options
        if (isIntimacyActive) {
          const intimacyOptionIds = ["goodbye"]; // Only allow exiting
          return filteredOptions.filter(option => 
            intimacyOptionIds.includes(option.id) ||
            option.action === "intimacy"
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
            // Exclude options without phase (base catalogue social options)
            if (option.phase === undefined) return false;
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

  initNSFWSystem();
}
})();
