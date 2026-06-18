// ── DATA ARRAYS ──────────────────────────────────────────────────

const ARCHETYPES = [
    "schemer", "hero", "outsider", "sage", "guardian",
    "scoundrel", "romantic", "explorer", "martyr",
    "trickster", "caretaker", "destroyer"
];

const PERSONALITY_TRAITS = [
    "bold", "cautious", "curious", "loyal", "suspicious",
    "cheerful", "moody", "serious", "joker", "flirt",
    "grump", "studious", "helpful", "aloof", "dramatic",
    "sarcastic", "excitable", "shy", "calm", "paranoid",
    "proud", "humble", "reckless", "patient", "bitter"
];

const QUIRKS = [
    "talks to themselves quietly",
    "always fidgets with something",
    "avoids eye contact when lying",
    "laughs at their own jokes",
    "refers to themselves in third person occasionally",
    "taps their foot when nervous",
    "always has a strong opinion about food",
    "hums while working",
    "mistrusts anyone who smiles too much",
    "collects small trinkets",
    "always sits with their back to the wall",
    "repeats the last word of sentences twice",
    "sniffs unfamiliar things before touching them",
    "cracks knuckles before any serious conversation",
    "gives everyone a nickname"
];

const temperaments = [
    "friendly", "neutral", "wary", "hostile",
    "curious", "skittish", "bold", "aggressive"
];

const SPEECH_STYLES = [
    "common", "gruff", "eloquent", "whispered",
    "boisterous", "nervous", "formal", "archaic",
    "clipped", "rambling", "sarcastic", "poetic"
];

const NPC_DISTINGUISHING_MARKS = [
    "a small scar near one eye",
    "weathered hands",
    "a chipped tooth",
    "old travel stains",
    "a guarded stare",
    "a restless posture",
    "a careful way of watching exits",
    "a faint herbal smell",
    "a worn charm tied to their gear",
    "patched clothing",
    "a voice that drops when strangers come close"
];

const NPC_HUMANOID_MOTIVES = [
    "earn enough coin to feel secure",
    "avoid becoming involved in someone else's trouble",
    "find out what strangers know",
    "protect a personal secret",
    "win a little respect",
    "get through the day without losing face",
    "locate a missing contact",
    "turn a rumor into advantage"
];

const NPC_CREATURE_MOTIVES = [
    "guard its territory",
    "search for food or warmth",
    "avoid a stronger threat nearby",
    "obey an old instinct",
    "watch for a chance to flee",
    "protect a hidden nest or resting place"
];

function _npcRand(arr) {
    if (!Array.isArray(arr) || !arr.length) return "";
    return arr[Math.floor(Math.random() * arr.length)];
}

function _npcRandInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function _npcUniquePicks(arr, count) {
    const pool = Array.isArray(arr) ? arr.slice() : [];
    const picks = [];
    while (pool.length && picks.length < count) {
        const index = Math.floor(Math.random() * pool.length);
        picks.push(pool.splice(index, 1)[0]);
    }
    return picks;
}

function _npcJoinList(parts) {
    const clean = (Array.isArray(parts) ? parts : []).filter(Boolean);
    if (!clean.length) return "";
    if (clean.length === 1) return clean[0];
    if (clean.length === 2) return clean[0] + " and " + clean[1];
    return clean.slice(0, -1).join(", ") + ", and " + clean[clean.length - 1];
}

function _npcGetSpeciesTemplate(species) {
    if (typeof getSpeciesTemplate === "function") {
        return getSpeciesTemplate(species);
    }
    return null;
}

function getSpeechTicsForStyle(style, voice) {
    const key = String(style || "common").toLowerCase();
    const map = {
        gruff: ["keeps sentences short", "uses blunt practical words"],
        eloquent: ["chooses words with care", "speaks in polished phrases"],
        whispered: ["keeps their voice low", "leans close before important words"],
        boisterous: ["speaks loudly", "laughs or scoffs between points"],
        nervous: ["restarts sentences", "checks the listener's reaction often"],
        formal: ["uses titles", "keeps a respectful distance in speech"],
        archaic: ["uses old-fashioned phrasing", "speaks as if quoting old custom"],
        clipped: ["answers in fragments", "cuts away unnecessary words"],
        rambling: ["circles the point", "adds side details before the answer"],
        sarcastic: ["answers with dry edges", "lets irony slip into their tone"],
        poetic: ["uses metaphor", "notices sensory details aloud"]
    };
    const tics = map[key] ? map[key].slice() : ["speaks plainly"];
    if (voice) tics.unshift("has a " + voice + " voice");
    return tics.slice(0, 3);
}

function generateNPCMotivation(npc, template, room) {
    const isHumanoid = npc && npc.isHumanoid === true;
    const culture = template && template.culture ? template.culture : {};
    const values = Array.isArray(culture.values) ? culture.values : [];
    const base = isHumanoid ? NPC_HUMANOID_MOTIVES : NPC_CREATURE_MOTIVES;
    const roomType = room && room.type ? String(room.type).toLowerCase() : "";
    let motive = _npcRand(base);

    if (values.length && Math.random() < 0.45) {
        motive = "act according to " + _npcRand(values);
    }
    if (roomType.indexOf("tavern") >= 0 || roomType.indexOf("inn") >= 0) {
        motive = isHumanoid ? _npcRand(["hear useful gossip", "make a quiet bargain", "rest without being bothered"]) : motive;
    }
    if (roomType.indexOf("gate") >= 0) {
        motive = isHumanoid ? _npcRand(["judge who is entering town", "avoid trouble at the gate", "watch for suspicious travelers"]) : motive;
    }
    if (roomType.indexOf("dungeon") >= 0 || roomType.indexOf("ruin") >= 0 || roomType.indexOf("vault") >= 0) {
        motive = isHumanoid ? _npcRand(["survive the dangerous place", "claim something valuable before others do", "keep outsiders away from a secret"]) : _npcRand(NPC_CREATURE_MOTIVES);
    }

    return motive;
}

function generateNPCEnrichment(npc, room, zoneTemplate) {
    if (!npc) return null;

    const template = _npcGetSpeciesTemplate(npc.species) || {};
    const profile = template.anatomyProfile || {};
    const culture = template.culture || {};
    const isHumanoid = npc.isHumanoid === true;

    const surfaceType = profile.surfaceType || (isHumanoid ? "skin" : "hide");
    const surfaceColor = _npcRand(profile.skinTones) || "unremarkable";
    const build = _npcRand(profile.builds) || (isHumanoid ? "average" : "lean");
    const eyeColor = _npcRand(profile.eyeColors) || "";
    const hairColors = Array.isArray(profile.hairColors) ? profile.hairColors : [];
    const hairColor = isHumanoid ? _npcRand(hairColors) : "";
    const hairStyle = hairColor && hairColor !== "none" && hairColor !== "shaved"
        ? _npcRand(profile.hairStyles) : "";
    const features = _npcUniquePicks(profile.features, isHumanoid ? 2 : 3);
    const marks = _npcUniquePicks(NPC_DISTINGUISHING_MARKS, isHumanoid ? _npcRandInt(1, 2) : 1);
    const movement = _npcRand(profile.movements);
    const voice = _npcRand(profile.voices);
    const values = _npcUniquePicks(culture.values, 2);
    const preferredTopics = _npcUniquePicks(culture.topics, 3);
    const tabooTopics = _npcUniquePicks(culture.taboos, 2);
    const speechTics = getSpeechTicsForStyle(npc.speechStyle, voice);

    const anatomy = {
        size: template.size || "medium",
        build,
        body: {
            surfaceType,
            color: surfaceColor
        },
        eyes: eyeColor ? { color: eyeColor } : null,
        features,
        marks,
        movement,
        voice
    };

    if (hairColor && hairColor !== "none" && hairColor !== "shaved") {
        anatomy.hair = {
            color: hairColor,
            style: hairStyle || "unstyled"
        };
    }

    const enrichment = {
        speciesLore: template.lore || "",
        values,
        preferredTopics,
        tabooTopics,
        speechTics,
        currentMotive: generateNPCMotivation(npc, template, room),
        mannerisms: [
            movement,
            voice ? "speaks in a " + voice + " voice" : "",
            features.length ? "draws attention to " + _npcRand(features) : ""
        ].filter(Boolean),
        reactionNotes: [
            values.length ? "responds well to " + _npcJoinList(values) : "",
            tabooTopics.length ? "bristles at " + _npcJoinList(tabooTopics) : ""
        ].filter(Boolean)
    };

    npc.anatomy = anatomy;
    npc.enrichment = enrichment;
    npc.size = anatomy.size;
    npc.bodyType = build;
    npc.skinTone = surfaceType === "skin" ? surfaceColor : "";
    npc.furColor = surfaceType === "fur" ? surfaceColor : "";
    npc.scaleColor = surfaceType === "scales" ? surfaceColor : "";
    npc.surfaceType = surfaceType;
    npc.surfaceColor = surfaceColor;
    npc.eyeColor = eyeColor;
    npc.hairColor = hairColor && hairColor !== "none" && hairColor !== "shaved" ? hairColor : "";
    npc.hairStyle = hairStyle;
    npc.specialTraits = features.concat(marks).filter(Boolean);
    npc.physicalTraits = buildNPCPhysicalSummary(npc);
    npc.appearanceHighlights = buildNPCAppearanceHighlights(npc);
    npc.loreNotes = enrichment.speciesLore;
    npc.preferredTopics = preferredTopics;
    npc.tabooTopics = tabooTopics;
    npc.currentMotive = enrichment.currentMotive;

    return enrichment;
}

function buildNPCAppearanceHighlights(npc) {
    if (!npc) return [];
    const anatomy = npc.anatomy || {};
    const body = anatomy.body || {};
    const highlights = [];

    if (anatomy.build) highlights.push(anatomy.build + " build");
    if (body.color && body.surfaceType) highlights.push(body.color + " " + body.surfaceType);
    if (npc.eyeColor) highlights.push(npc.eyeColor + " eyes");
    if (npc.hairColor) {
        highlights.push((npc.hairStyle ? npc.hairStyle + " " : "") + npc.hairColor + " hair");
    }
    if (Array.isArray(anatomy.features)) {
        for (let i = 0; i < anatomy.features.length; i++) highlights.push(anatomy.features[i]);
    }
    if (Array.isArray(anatomy.marks) && anatomy.marks.length && highlights.length < 6) {
        highlights.push(anatomy.marks[0]);
    }

    return highlights.slice(0, 6);
}

function buildNPCPhysicalSummary(npc) {
    if (!npc) return "";
    const highlights = buildNPCAppearanceHighlights(npc);
    const identity = [npc.gender && npc.gender !== "none" ? npc.gender : "", npc.species || ""]
        .filter(Boolean).join(" ");

    if (!identity && !highlights.length) return "";
    if (!highlights.length) return identity + ".";
    if (!identity) return _npcJoinList(highlights) + ".";
    return identity + " with " + _npcJoinList(highlights) + ".";
}

function getNPCObservationDetail(npc) {
    if (!npc) return "";
    const highlights = Array.isArray(npc.appearanceHighlights) && npc.appearanceHighlights.length
        ? npc.appearanceHighlights.slice(0, 4)
        : buildNPCAppearanceHighlights(npc).slice(0, 4);
    if (!highlights.length) return "";
    return "with " + _npcJoinList(highlights);
}

function getNPCInspectionDetail(npc) {
    if (!npc) return "";
    const lines = [];
    if (npc.physicalTraits) lines.push(npc.physicalTraits);
    if (npc.enrichment && Array.isArray(npc.enrichment.mannerisms) && npc.enrichment.mannerisms.length) {
        lines.push(_npcRand(npc.enrichment.mannerisms));
    }
    if (npc.enrichment && npc.enrichment.currentMotive) {
        lines.push("They seem driven to " + npc.enrichment.currentMotive + ".");
    }
    return lines.join(" ");
}

function getBaseHostilityForTemperament(temperament) {
    const key = String(temperament || "neutral").toLowerCase();
    const ranges = {
        aggressive: [72, 92],
        hostile: [62, 86],
        wary: [42, 66],
        skittish: [28, 52],
        neutral: [24, 46],
        curious: [18, 38],
        bold: [22, 48],
        calm: [14, 34],
        friendly: [6, 24]
    };
    const [min, max] = ranges[key] || ranges.neutral;
    return _npcRandInt(min, max);
}

function getBaseFavorabilityForTemperament(temperament) {
    const key = String(temperament || "neutral").toLowerCase();
    if (key === "aggressive" || key === "hostile") return -60;
    if (key === "wary") return -20;
    if (key === "skittish") return -10;
    if (key === "friendly") return 18;
    if (key === "curious") return 8;
    if (key === "calm") return 10;
    return 0;
}

function ensureNPCRelationshipState(npc) {
    if (!npc) return npc;

    npc.memory = npc.memory || {};
    if (!Array.isArray(npc.memory.playerActions)) npc.memory.playerActions = [];
    if (typeof npc.memory.metPlayer !== "boolean") npc.memory.metPlayer = false;
    if (typeof npc.memory.aggressionCount !== "number") npc.memory.aggressionCount = 0;
    if (typeof npc.memory.lastSpokenTo !== "number") npc.memory.lastSpokenTo = 0;

    if (typeof npc.hostility !== "number") {
        npc.hostility = getBaseHostilityForTemperament(npc.temperament);
    }

    if (typeof npc.memory.favorability !== "number") {
        npc.memory.favorability = getBaseFavorabilityForTemperament(npc.temperament);
    }

    if (!npc.memory.lastMood) npc.memory.lastMood = "neutral";
    if (typeof npc.memory.attraction !== "number") npc.memory.attraction = 0;
    if (typeof npc.memory.arousal !== "number") npc.memory.arousal = 0;
    if (typeof npc.memory.disinhibition !== "number") npc.memory.disinhibition = 0;

    npc.hostility = Math.max(0, Math.min(100, Math.round(npc.hostility)));
    npc.memory.favorability = Math.max(-100, Math.min(100, Math.round(npc.memory.favorability)));
    npc.memory.attraction = Math.max(0, Math.min(100, Math.round(npc.memory.attraction)));
    npc.memory.arousal = Math.max(0, Math.min(100, Math.round(npc.memory.arousal)));
    npc.memory.disinhibition = Math.max(0, Math.min(100, Math.round(npc.memory.disinhibition)));

    if (!isAdultHumanoidNPC(npc)) {
        npc.memory.attraction = 0;
        npc.memory.arousal = 0;
        npc.memory.disinhibition = 0;
    }

    return npc;
}

function isAdultHumanoidNPC(npc) {
    return !!(
        npc &&
        npc.isHumanoid === true &&
        typeof npc.age === "number" &&
        npc.age >= 18
    );
}

function getMoodScale() {
    return ["furious", "angry", "wary", "neutral", "friendly", "warm", "affectionate"];
}

function canImproveMood(npc, intent) {
    ensureNPCRelationshipState(npc);

    const key = String(intent || "").toLowerCase();
    if (npc.surrendered) return key === "mercy" ? 1.2 : 1;
    if (npc.hostility >= 70 && !["surrender", "plead", "bribe", "gift", "mercy"].includes(key)) return false;
    if (npc.hostility >= 50) return 0.5;
    if (["friendly", "calm"].includes(String(npc.temperament || "").toLowerCase())) return 1.25;
    if (["hostile", "aggressive"].includes(String(npc.temperament || "").toLowerCase())) return 0.75;
    return 1;
}

function getCurrentNPCDisposition(npc) {
    ensureNPCRelationshipState(npc);

    const mood = String(npc.memory.lastMood || "neutral").toLowerCase();
    if (mood && mood !== "neutral") return mood;

    const hostility = npc.hostility ?? 50;
    const favorability = npc.memory.favorability ?? 0;

    if (hostility >= 85) return "hostile";
    if (hostility >= 65) {
        if (favorability <= -40) return "hostile";
        if (favorability < 0) return "unfriendly";
        return "wary";
    }
    if (hostility >= 40) {
        if (favorability <= -60) return "hostile";
        if (favorability <= -30) return "unfriendly";
        if (favorability < 0) return "wary";
        if (favorability > 60) return "friendly";
        return "neutral";
    }
    if (favorability <= -75) return "hateful";
    if (favorability <= -40) return "unfriendly";
    if (favorability <= -10) return "cool";
    if (favorability >= 90) return "devoted";
    if (favorability >= 60) return "warm";
    if (favorability >= 30) return "friendly";
    return "neutral";
}

function getRelationshipLabel(npc) {
    if (!npc) return "unknown";
    ensureNPCRelationshipState(npc);

    const disposition = getCurrentNPCDisposition(npc);
    const favor = npc.memory.favorability ?? 0;

    if (favor >= 95) return "devoted";
    if (favor <= -90) return "hateful";

    switch (disposition) {
        case "furious":
        case "hostile":
            return "hostile";
        case "hateful":
            return "hateful";
        case "unfriendly":
        case "angry":
            return "unfriendly";
        case "wary":
        case "suspicious":
        case "cool":
            return "guarded";
        case "friendly":
            return "friendly";
        case "warm":
        case "affectionate":
            return "very friendly";
        case "devoted":
            return "devoted";
        default:
            return "neutral";
    }
}

function getAttractionLabel(npc) {
    if (!npc || !isAdultHumanoidNPC(npc)) return "none";
    ensureNPCRelationshipState(npc);

    const attraction = npc.memory.attraction ?? 0;
    if (attraction >= 85) return "captivated";
    if (attraction >= 60) return "strongly interested";
    if (attraction >= 35) return "interested";
    if (attraction >= 15) return "curious";
    return "none";
}

function getArousalLabel(npc) {
    if (!npc || !isAdultHumanoidNPC(npc)) return "calm";
    ensureNPCRelationshipState(npc);

    const arousal = npc.memory.arousal ?? 0;
    if (arousal >= 80) return "flustered";
    if (arousal >= 55) return "heated";
    if (arousal >= 30) return "stirred";
    if (arousal >= 10) return "alert";
    return "calm";
}

function adjustNPCMood(npc, delta = 0, favorDelta = 0, intent = null) {
    ensureNPCRelationshipState(npc);

    const scale = delta > 0 || favorDelta > 0 ? canImproveMood(npc, intent) : 1;
    if (scale === false) return npc;

    const moodScale = getMoodScale();
    const currentMood = npc.memory.lastMood || "neutral";
    let moodIndex = moodScale.indexOf(currentMood);
    if (moodIndex < 0) moodIndex = moodScale.indexOf("neutral");

    const scaledDelta = Math.round((delta || 0) * (scale || 1));
    const scaledFavor = Math.round((favorDelta || 0) * (scale || 1));

    if (scaledDelta !== 0) {
        moodIndex = Math.max(0, Math.min(moodScale.length - 1, moodIndex + scaledDelta));
        npc.memory.lastMood = moodScale[moodIndex];
    }

    npc.memory.favorability = Math.max(-100, Math.min(100, (npc.memory.favorability || 0) + scaledFavor));

    if (String(npc.temperament || "").toLowerCase() === "hostile") {
        npc.memory.favorability = Math.min(npc.memory.favorability, 50);
    } else if (String(npc.temperament || "").toLowerCase() === "friendly") {
        npc.memory.favorability = Math.max(npc.memory.favorability, -50);
    }

    return npc;
}

function applyNPCRelationshipImpact(npc, impact = {}) {
    ensureNPCRelationshipState(npc);
    if (!npc) return npc;

    const {
        mood = 0,
        favor = 0,
        hostility = 0,
        aggression = 0,
        attraction = 0,
        arousal = 0,
        disinhibition = 0,
        intent = null,
        moodOverride = null,
        markMet = false,
        actionTag = ""
    } = impact || {};

    adjustNPCMood(npc, mood, favor, intent);

    if (typeof hostility === "number" && hostility !== 0) {
        npc.hostility = Math.max(0, Math.min(100, (npc.hostility || 0) + hostility));
    }
    if (typeof aggression === "number" && aggression !== 0) {
        npc.memory.aggressionCount = Math.max(0, (npc.memory.aggressionCount || 0) + aggression);
    }
    if (isAdultHumanoidNPC(npc)) {
        if (typeof attraction === "number" && attraction !== 0) {
            npc.memory.attraction = Math.max(0, Math.min(100, (npc.memory.attraction || 0) + attraction));
        }
        if (typeof arousal === "number" && arousal !== 0) {
            npc.memory.arousal = Math.max(0, Math.min(100, (npc.memory.arousal || 0) + arousal));
        }
        if (typeof disinhibition === "number" && disinhibition !== 0) {
            npc.memory.disinhibition = Math.max(0, Math.min(100, (npc.memory.disinhibition || 0) + disinhibition));
        }
    }
    if (moodOverride) npc.memory.lastMood = moodOverride;
    if (markMet) npc.memory.metPlayer = true;
    if (actionTag) {
        npc.memory.playerActions.push(actionTag);
        npc.memory.playerActions = npc.memory.playerActions.slice(-12);
    }

    return npc;
}

function shouldNPCAttack(npc) {
    if (!npc) return false;
    ensureNPCRelationshipState(npc);
    if (npc.surrendered || npc.unconscious || npc.hidden || npc.isHidden) return false;

    const lastMood = String(npc.memory.lastMood || "").toLowerCase();
    if (["afraid", "subdued", "friendly", "warm", "affectionate"].includes(lastMood)) return false;
    if ((npc.hostility || 0) >= 75) return true;
    if ((npc.memory.favorability || 0) <= -75) return true;
    return ["furious", "angry", "hateful"].includes(lastMood);
}

function decayNPCAffect(npc, steps = 1) {
    if (!npc) return npc;
    ensureNPCRelationshipState(npc);
    if (!isAdultHumanoidNPC(npc)) return npc;

    const amount = Math.max(1, Math.floor(steps || 1));
    npc.memory.arousal = Math.max(0, (npc.memory.arousal || 0) - amount * 4);
    npc.memory.disinhibition = Math.max(0, (npc.memory.disinhibition || 0) - amount * 3);
    return npc;
}

function decayNPCStatesInWorld(roomMap, steps = 1) {
    const map = roomMap && typeof roomMap === "object" ? roomMap : {};
    Object.values(map).forEach(room => {
        if (!room || !Array.isArray(room.creatures)) return;
        room.creatures.forEach(npc => decayNPCAffect(npc, steps));
    });
}

// ── GET RANDOM PERSONALITY PROFILE ──────────────────────────────

function getRandomPersonalityProfile(options = {}) {
    function _rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function _randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

    const temperament = options.baseTemperament && temperaments.includes(options.baseTemperament)
        ? options.baseTemperament
        : _rand(temperaments);

    const archetype = _rand(ARCHETYPES);

    // 2-3 unique traits
    const traits = [];
    let availableTraits = PERSONALITY_TRAITS.slice();
    while (traits.length < 3) {
        const pick = _rand(availableTraits);
        if (!traits.includes(pick)) {
            traits.push(pick);
            availableTraits = availableTraits.filter(t => t !== pick);
        }
    }

    // 1-2 quirks
    const quirks = [];
    let availableQuirks = QUIRKS.slice();
    const quirkCount = _randInt(1, 2);
    while (quirks.length < quirkCount) {
        const pick = _rand(availableQuirks);
        if (!quirks.includes(pick)) {
            quirks.push(pick);
            availableQuirks = availableQuirks.filter(q => q !== pick);
        }
    }

    // Big Five by archetype
    const bigFiveMap = {
        schemer:   { openness: 8, conscientiousness: 7, extraversion: 4, agreeableness: 3, neuroticism: 5 },
        hero:      { openness: 6, conscientiousness: 8, extraversion: 7, agreeableness: 6, neuroticism: 2 },
        outsider:  { openness: 7, conscientiousness: 4, extraversion: 2, agreeableness: 4, neuroticism: 7 },
        sage:      { openness: 9, conscientiousness: 7, extraversion: 4, agreeableness: 7, neuroticism: 3 },
        guardian:  { openness: 5, conscientiousness: 9, extraversion: 5, agreeableness: 7, neuroticism: 3 },
        scoundrel: { openness: 6, conscientiousness: 3, extraversion: 8, agreeableness: 2, neuroticism: 5 },
        romantic:  { openness: 7, conscientiousness: 5, extraversion: 7, agreeableness: 8, neuroticism: 6 },
        explorer:  { openness: 9, conscientiousness: 4, extraversion: 6, agreeableness: 5, neuroticism: 4 },
        martyr:    { openness: 6, conscientiousness: 8, extraversion: 4, agreeableness: 9, neuroticism: 7 },
        trickster: { openness: 8, conscientiousness: 3, extraversion: 8, agreeableness: 4, neuroticism: 4 },
        caretaker: { openness: 6, conscientiousness: 8, extraversion: 5, agreeableness: 9, neuroticism: 5 },
        destroyer: { openness: 4, conscientiousness: 3, extraversion: 6, agreeableness: 2, neuroticism: 7 }
    };

    const base = bigFiveMap[archetype] || 
        { openness: 5, conscientiousness: 5, extraversion: 5, agreeableness: 5, neuroticism: 5 };

    const bigFive = {
        openness:          Math.max(1, Math.min(10, base.openness          + _randInt(-2, 2))),
        conscientiousness: Math.max(1, Math.min(10, base.conscientiousness + _randInt(-2, 2))),
        extraversion:      Math.max(1, Math.min(10, base.extraversion      + _randInt(-2, 2))),
        agreeableness:     Math.max(1, Math.min(10, base.agreeableness     + _randInt(-2, 2))),
        neuroticism:       Math.max(1, Math.min(10, base.neuroticism       + _randInt(-2, 2)))
    };

    const speechStyle = _rand(SPEECH_STYLES);

    return {
        temperament,
        archetype,
        traits,
        quirks,
        bigFive,
        speechStyle
    };
}

// ── GET RANDOM AGE ───────────────────────────────────────────────

function getRandomAge(category = null) {
    function _randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    if (category === "young")       return _randInt(18, 25);
    if (category === "adult")       return _randInt(26, 45);
    if (category === "middle-aged") return _randInt(46, 60);
    if (category === "elderly")     return _randInt(61, 80);
    return _randInt(18, 80);
}

// ── GET AGE CATEGORY BY ROLE ─────────────────────────────────────

function getAgeCategoryForRole(role, archetype) {
    if (["Innkeeper", "Healer", "Blacksmith", "Priest", "Archivist", "Shopkeeper"].includes(role) ||
        ["sage", "caretaker", "guardian"].includes(archetype)) {
        return ["adult", "middle-aged", "elderly"][Math.floor(Math.random() * 3)];
    }
    if (["Adventurer", "Bartender", "Patron", "Guest", "Scout", "Tomb Robber"].includes(role) ||
        ["hero", "romantic", "scoundrel"].includes(archetype)) {
        return ["young", "adult"][Math.floor(Math.random() * 2)];
    }
    if (["Town Guard", "Stone Guard", "Raider", "Scavenger", "Miner", "Cultist"].includes(role)) {
        return ["young", "adult", "middle-aged"][Math.floor(Math.random() * 3)];
    }
    return ["young", "adult", "middle-aged"][Math.floor(Math.random() * 3)];
}

// ── GENERATE NPC BEHAVIOR ────────────────────────────────────────

function generateNPCBehavior(npc) {
    function _rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    ensureNPCRelationshipState(npc);

    const hostility   = npc.hostility ?? 50;
    const mood        = npc.memory?.lastMood || "neutral";
    const favor       = npc.memory?.favorability ?? 0;
    const attraction  = npc.memory?.attraction ?? 0;
    const arousal     = npc.memory?.arousal ?? 0;
    const disposition = getCurrentNPCDisposition(npc);
    const traits      = npc.personalityProfile?.traits || npc.personalityTraits || ["neutral"];

    const behaviorMatrix = {
        calm:       ["Appears calm", "Appears collected", "Is relaxed", "Seems at ease"],
        friendly:   ["Seems friendly", "Smiles at you", "Appears welcoming", "Greets you warmly"],
        aggressive: ["Is glaring at you", "Is ready to lunge", "Eyes you with hostility", "Seems like they want to fight"],
        hostile:    ["Appears agitated", "Looks ready to attack", "Seems on edge", "Is glaring at you"],
        neutral:    ["Seems indifferent", "Is observing you", "Appears neutral"],
        curious:    ["Is eyeing you curiously", "Seems intrigued", "Appears to be examining you"],
        skittish:   ["Looks nervous", "Appears skittish", "Flinches at sudden movements"],
        wary:       ["Is on edge", "Seems cautious", "Keeps a close eye on you"]
    };

    const personalityFlairs = {
        bold:       ["Stands tall with confidence", "Locks eyes without hesitation"],
        joker:      ["Grins mischievously", "Flashes a sly smile"],
        flirt:      ["Smirks playfully", "Gives you a suggestive glance"],
        grump:      ["Scowls and mutters under their breath", "Looks perpetually unimpressed"],
        serious:    ["Keeps a firm focused expression", "Maintains strict posture"],
        studious:   ["Seems lost in thought", "Peers at a notebook"],
        helpful:    ["Looks eager to assist", "Nods as if awaiting your request"],
        aloof:      ["Glances past you disinterestedly", "Keeps their distance"],
        moody:      ["Sighs heavily", "Shifts moodily from foot to foot"],
        cheerful:   ["Beams with cheerful energy", "Grins ear to ear"],
        shy:        ["Avoids eye contact", "Keeps a low profile"],
        dramatic:   ["Strikes a theatrical pose", "Sighs dramatically"],
        sarcastic:  ["Rolls their eyes", "Raises an eyebrow skeptically"],
        suspicious: ["Eyes you with mistrust", "Keeps one hand on their purse"],
        excitable:  ["Bounces on their toes", "Talks with rapid enthusiasm"],
        neutral:    ["Watches you with a neutral expression"]
    };

    // Determine base tone
    let baseTone = "neutral";
    if (["furious", "hateful"].includes(disposition) || hostility >= 80) baseTone = "aggressive";
    else if (["hostile", "angry", "unfriendly"].includes(disposition) || hostility >= 60) baseTone = "hostile";
    else if (["affectionate", "warm", "devoted"].includes(disposition) || favor >= 75) baseTone = "friendly";
    else if (["friendly"].includes(disposition) || favor >= 40) baseTone = "calm";
    else if (["wary", "guarded", "cool"].includes(disposition) || favor >= -20) baseTone = "wary";
    else baseTone = "neutral";

    const behaviorOptions = behaviorMatrix[baseTone] || behaviorMatrix["neutral"];

    let behavior = "";
    if      (mood === "furious")                              behavior = behaviorOptions[behaviorOptions.length - 1];
    else if (mood === "angry")                                behavior = behaviorOptions[Math.min(2, behaviorOptions.length - 1)];
    else if (["friendly","warm","affectionate"].includes(mood)) behavior = behaviorOptions[0];
    else                                                      behavior = _rand(behaviorOptions);

    // Add personality flair
    const chosenTrait = Array.isArray(traits) && traits.length ? _rand(traits) : "neutral";
    const flairOptions = personalityFlairs[chosenTrait] || [];
    if (flairOptions.length && Math.random() < 0.8) {
        behavior += `. ${_rand(flairOptions)}`;
    }

    if (npc.enrichment && Array.isArray(npc.enrichment.mannerisms) &&
        npc.enrichment.mannerisms.length && Math.random() < 0.45) {
        behavior += `. ${_rand(npc.enrichment.mannerisms)}`;
    }

    if (isAdultHumanoidNPC(npc)) {
        if (attraction >= 60 && hostility < 50 && favor >= 10 && Math.random() < 0.35) {
            behavior += ". Their attention lingers on you a little longer than it should.";
        } else if (attraction >= 40 && hostility >= 55 && Math.random() < 0.3) {
            behavior += ". Something in their expression turns tense and conflicted.";
        } else if (arousal >= 55 && Math.random() < 0.35) {
            behavior += ". They look momentarily flustered before steadying themselves.";
        }
    }

    return behavior;
}

// ── GENERATE POSTURE OR ACTION ───────────────────────────────────

function generatePostureOrAction(temperament) {
    function _rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    const behaviorMatrix = {
        calm:       ["is breathing steadily", "is sitting calmly", "is standing peacefully"],
        friendly:   ["is smiling warmly", "is giving you a friendly nod", "is standing in an inviting posture"],
        aggressive: ["is clenching their fists", "is pacing like a predator", "is flexing aggressively"],
        hostile:    ["is baring their teeth", "is glaring intensely", "is standing in a threatening stance"],
        neutral:    ["is standing idly", "is observing the surroundings", "is doing nothing in particular"],
        curious:    ["is tilting their head inquisitively", "is studying you closely", "is watching with interest"],
        skittish:   ["is flinching at sounds", "is shifting nervously", "is backing away slightly"],
        wary:       ["is watching cautiously", "is stepping lightly", "is keeping a safe distance"]
    };

    const actions = behaviorMatrix[String(temperament || "").toLowerCase()]
        || behaviorMatrix["neutral"];

    return _rand(actions);
}
