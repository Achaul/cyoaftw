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

const NPC_SPEECH_PROFILES = {
    common: {
        sample: "Yeah, I noticed. Two travelers came through before dusk and kept moving.",
        sentenceLength: "short to medium",
        vocabulary: "plain everyday words",
        cadence: "answers the question first, then adds one useful detail",
        cues: ["speaks plainly", "keeps the point clear", "does not dress up simple facts"],
        avoid: ["poetic imagery", "dramatic pauses", "mysterious tavern-sage lines"]
    },
    direct: {
        sample: "If you need an answer, ask straight. I don't waste time.",
        sentenceLength: "short",
        vocabulary: "blunt practical words",
        cadence: "gets to the point immediately",
        cues: ["uses firm statements", "sounds decisive", "cuts off rambling"],
        avoid: ["flowery phrasing", "soft hedging", "long explanations"]
    },
    gruff: {
        sample: "Saw them, yes. Kept their heads down and paid in full.",
        sentenceLength: "short to medium",
        vocabulary: "rough practical words",
        cadence: "dry and matter-of-fact",
        cues: ["keeps sentences tight", "sounds worn or work-hardened", "shows warmth sparingly"],
        avoid: ["courtly language", "pretty metaphors", "theatrical threats"]
    },
    formal: {
        sample: "I did notice them. They arrived late and spoke to no one for long.",
        sentenceLength: "medium",
        vocabulary: "precise but readable words",
        cadence: "measured and controlled",
        cues: ["chooses words carefully", "sounds composed", "may use titles when appropriate"],
        avoid: ["purple prose", "archaic filler", "grand speeches"]
    },
    guarded: {
        sample: "Maybe. Depends on why you're asking.",
        sentenceLength: "short",
        vocabulary: "plain careful words",
        cadence: "gives partial answers before trust is earned",
        cues: ["holds something back", "tests the listener first", "keeps tone restrained"],
        avoid: ["rambling", "open confession", "needless scene description"]
    },
    folksy: {
        sample: "Could be something to it. This road carries more trouble than wagons lately.",
        sentenceLength: "short to medium",
        vocabulary: "casual conversational words",
        cadence: "friendly and lightly colored by local habit",
        cues: ["sounds approachable", "may use a plain saying now and then", "keeps the mood human and readable"],
        avoid: ["cutesy chatter", "thick dialect spelling", "storybook whimsy"]
    },
    clipped: {
        sample: "Yes. Near the gate. After dark.",
        sentenceLength: "very short",
        vocabulary: "lean functional words",
        cadence: "fragmented but clear",
        cues: ["answers in compact beats", "drops filler", "keeps emotion tucked in"],
        avoid: ["long setup", "speechifying", "decorative wording"]
    },
    nervous: {
        sample: "I saw something, I think. Hard to be sure, but it felt wrong.",
        sentenceLength: "short to medium",
        vocabulary: "simple uncertain words",
        cadence: "hesitates and self-corrects",
        cues: ["second-guesses details", "sounds alert to danger", "watches for reactions"],
        avoid: ["confident lectures", "poetic dread", "slick sarcasm"]
    },
    boisterous: {
        sample: "Aye, I saw them, and they looked like trouble from ten paces off.",
        sentenceLength: "medium",
        vocabulary: "plain emphatic words",
        cadence: "energetic and open",
        cues: ["sounds larger than life without losing clarity", "speaks with confidence", "lets attitude show"],
        avoid: ["long monologues", "fancy ornament", "endless shouting"]
    },
    wry: {
        sample: "I noticed. Trouble rarely bothers to wear a sign, but that came close.",
        sentenceLength: "short to medium",
        vocabulary: "plain words with a dry edge",
        cadence: "understated and pointed",
        cues: ["uses dry humor sparingly", "sounds unimpressed", "lands the point cleanly"],
        avoid: ["constant snark", "florid irony", "riddle-talk"]
    },
    broken: {
        sample: "Seen them. Bad smell. Bad dark. Stay away.",
        sentenceLength: "very short",
        vocabulary: "simple concrete words",
        cadence: "broken or primitive but understandable",
        cues: ["keeps grammar simple", "uses direct warning language", "focuses on immediate facts"],
        avoid: ["eloquent phrasing", "complex syntax", "abstract reflection"]
    },
    whisper: {
        sample: "Keep your voice down. Yes, I saw them, and I don't want them hearing this.",
        sentenceLength: "short to medium",
        vocabulary: "plain quiet words",
        cadence: "low and controlled",
        cues: ["sounds hushed", "stays concise", "treats silence as useful"],
        avoid: ["stagey suspense", "breathy seduction", "atmospheric rambling"]
    }
};

const SPEECH_STYLE_ALIASES = {
    archaic: "formal",
    boisterous: "boisterous",
    broken: "broken",
    chattery: "clipped",
    clipped: "clipped",
    common: "common",
    commanding: "direct",
    direct: "direct",
    eloquent: "formal",
    formal: "formal",
    gagged: "broken",
    growl: "broken",
    gruff: "gruff",
    guttural: "broken",
    hiss: "broken",
    majestic: "formal",
    mechanical: "clipped",
    mimicry: "broken",
    murmur: "guarded",
    nervous: "nervous",
    none: "broken",
    poetic: "formal",
    rambling: "folksy",
    sarcastic: "wry",
    serene: "guarded",
    shout: "direct",
    snarl: "broken",
    squeak: "broken",
    whisper: "whisper",
    whispered: "whisper"
};

const SPEECH_STYLES = Object.keys(NPC_SPEECH_PROFILES);

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

const NPC_ACTION_RELATION_WEIGHTS = {
    greeting: 1,
    help: 2,
    "offer-help": 3,
    "ask-background": 1,
    "ask-place": 0,
    "ask-work": 1,
    "ask-watch": 0,
    "ask-seen": 0,
    "ask-need": 2,
    "ask-people": 1,
    "ask-rumor": 0,
    question: 0,
    calm: 2,
    "keep-calm": 2,
    compliment: 2,
    apology: 2,
    comfort: 2,
    "comfort-rebuffed": -1,
    flirt: 0,
    "flirt-tentative": 1,
    "flirt-received": 2,
    "flirt-rejected": -2,
    tease: 0,
    "tease-playful": 1,
    "tease-backfire": -2,
    "misread-flirt": -2,
    threat: -3,
    "sharp-question": -3,
    goodbye: 0,
    talk: 0,
    gift: 3,
    "generous-trade": 3,
    "fair-trade": 1,
    "hard-bargain": -1,
    "refused-trade": -2,
    "attacked-by-player": -6,
    "surrender-attempt": 0,
    "mercy-shown": 4,
    "mercy-refused": -5,
    "woken-after-defeat": 2
};

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

function formatNPCActionTag(tag) {
    const key = String(tag || "").trim();
    if (!key) return "";

    const labels = {
        greeting: "greeted you politely",
        help: "offered help",
        "offer-help": "offered help",
        "ask-background": "asked what brought you here",
        "ask-place": "asked about the area",
        "ask-work": "asked about your work",
        "ask-watch": "asked who you were watching for",
        "ask-seen": "asked what you had seen",
        "ask-need": "asked what you needed most",
        "ask-people": "asked about your people",
        "ask-rumor": "asked for rumors",
        question: "asked questions",
        calm: "tried to keep things calm",
        "keep-calm": "tried to keep things calm",
        compliment: "offered a sincere compliment",
        apology: "apologized",
        comfort: "tried to reassure you",
        "comfort-rebuffed": "pushed comfort at the wrong time",
        "misread-flirt": "misread the mood",
        "flirt-tentative": "tested the waters gently",
        "flirt-received": "flirted warmly",
        "flirt-rejected": "pushed flirtation too far",
        tease: "teased lightly",
        "tease-playful": "teased playfully",
        "tease-backfire": "teased at the wrong moment",
        threat: "threatened you",
        "sharp-question": "pressed you harshly",
        goodbye: "left politely",
        gift: "gave you something",
        "generous-trade": "traded generously",
        "fair-trade": "traded fairly",
        "hard-bargain": "drove a hard bargain",
        "refused-trade": "pushed a bad trade",
        "attacked-by-player": "attacked you",
        "surrender-attempt": "tried to force surrender",
        "mercy-shown": "showed mercy",
        "mercy-refused": "refused mercy",
        "woken-after-defeat": "woke you carefully after the fight"
    };

    if (labels[key]) return labels[key];
    return key.replace(/[-_]/g, " ");
}

function getNPCActionTags(npc, limit = 12) {
    if (!npc || !npc.memory) return [];
    const primary = Array.isArray(npc.memory.playerActionTags) ? npc.memory.playerActionTags : [];
    const fallback = Array.isArray(npc.memory.playerActions) ? npc.memory.playerActions : [];
    const raw = primary.length ? primary : fallback;
    return raw
        .map(tag => String(tag || "").trim())
        .filter(tag => Object.prototype.hasOwnProperty.call(NPC_ACTION_RELATION_WEIGHTS, tag))
        .slice(-limit);
}

function getNPCRelationshipMomentum(npc) {
    const tags = getNPCActionTags(npc, 8);
    if (!tags.length) return 0;

    let total = 0;
    for (let i = 0; i < tags.length; i++) {
        const recencyWeight = 0.6 + ((i + 1) / tags.length) * 0.8;
        total += (NPC_ACTION_RELATION_WEIGHTS[tags[i]] || 0) * recencyWeight;
    }
    return Math.round(total);
}

function getNPCRelationshipSpeechGuidance(npc) {
    if (!npc) {
        return {
            baseline: "neutral",
            direction: "steady",
            cue: "keep the tone even and readable",
            instruction: "Default to a neutral, conversational tone."
        };
    }

    ensureNPCRelationshipState(npc);

    const favor = npc.memory.favorability ?? 0;
    const hostility = npc.hostility ?? 0;
    const momentum = getNPCRelationshipMomentum(npc);
    const score = favor - Math.round(hostility * 0.7) + momentum * 3;

    let baseline = "neutral";
    let instruction = "Default to a neutral, conversational tone.";
    let cue = "keep the tone even and readable";

    if (score >= 70) {
        baseline = "openly warm";
        instruction = "Default to a warm tone. Answer more openly and volunteer one small helpful detail when it fits.";
        cue = "the answer comes easier and carries a little extra warmth";
    } else if (score >= 35) {
        baseline = "warming";
        instruction = "Default to a friendly tone. Be less guarded than before and let a little warmth show.";
        cue = "some of the stiffness is gone";
    } else if (score >= 10) {
        baseline = "cautiously receptive";
        instruction = "Default to a mildly receptive tone. Answer directly and allow a small sign of trust.";
        cue = "they offer one extra useful detail without making a show of it";
    } else if (score <= -70) {
        baseline = "hostile";
        instruction = "Default to a hostile or openly resistant tone. Keep answers terse, skeptical, or refusing.";
        cue = "their patience is thin";
    } else if (score <= -35) {
        baseline = "defensive";
        instruction = "Default to a defensive tone. Stay guarded, skeptical, and sparing with details.";
        cue = "they answer like they expect trouble";
    } else if (score <= -10) {
        baseline = "reserved";
        instruction = "Default to a reserved tone. Be polite if needed, but keep distance and avoid sounding open.";
        cue = "the reply stays tight and measured";
    }

    let direction = "steady";
    if (momentum >= 6) direction = "improving";
    else if (momentum >= 2) direction = "softening";
    else if (momentum <= -6) direction = "deteriorating";
    else if (momentum <= -2) direction = "cooling";

    if (direction === "improving") {
        cue = baseline === "hostile" || baseline === "defensive"
            ? "despite the guard, they give slightly more than they would have before"
            : "they sound a little more at ease than before";
    } else if (direction === "softening") {
        cue = baseline === "reserved"
            ? "a little of the caution lifts"
            : "they let a bit more warmth show";
    } else if (direction === "deteriorating") {
        cue = baseline === "warming" || baseline === "openly warm"
            ? "there is a new edge under the politeness"
            : "they sound more brittle and less patient";
    } else if (direction === "cooling") {
        cue = baseline === "neutral"
            ? "the reply is a touch cooler than before"
            : "they keep a little more distance in the answer";
    }

    return { baseline, direction, cue, instruction };
}

function _npcNormalizeList(value) {
    if (value == null) return [];
    const raw = Array.isArray(value) ? value : [value];
    return raw
        .map(item => String(item || "").toLowerCase().trim())
        .filter(Boolean);
}

function _npcValueInList(value, options) {
    const list = _npcNormalizeList(options);
    if (!list.length) return false;
    const key = String(value || "").toLowerCase().trim();
    return !!key && list.includes(key);
}

function _npcTextIncludesAny(text, options) {
    const list = _npcNormalizeList(options);
    if (!list.length) return false;
    const haystack = String(text || "").toLowerCase();
    return list.some(entry => haystack.includes(entry));
}

function _npcActionTagsInclude(tags, required) {
    const active = new Set(_npcNormalizeList(tags));
    const needed = _npcNormalizeList(required);
    return needed.every(tag => active.has(tag));
}

function _npcResolveConversationValue(value, npc, ctx) {
    return typeof value === "function" ? value(npc, ctx) : value;
}

function _npcLowercaseFirst(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    return text.charAt(0).toLowerCase() + text.slice(1);
}

// === Updated ensureNPCConversationState() ===
function ensureNPCConversationState(npc) {
  if (!npc.conversationState) {
    npc.conversationState = {};
  }
  const state = npc.conversationState;

  // Existing fields
  if (!state.usedOptionIds) state.usedOptionIds = [];
  if (!state.sessionUsedOptionIds) state.sessionUsedOptionIds = [];
  if (!state.lastVariantByOption) state.lastVariantByOption = {};
  if (!state.optionUsage) state.optionUsage = {};
  if (!state.interactionCount) state.interactionCount = 0;
  if (!state.sessionInteractionCount) state.sessionInteractionCount = 0;
  if (!state.sessionNumber) state.sessionNumber = 0;
  if (!state.lastOptionId) state.lastOptionId = null;

  // New adult system fields
  if (!npc.relationship) npc.relationship = {};
  if (npc.relationship.lust === undefined) npc.relationship.lust = 0;
  if (npc.relationship.attraction === undefined) npc.relationship.attraction = 0;
  if (npc.relationship.orientation === undefined) {
    npc.relationship.orientation = ["hetero", "bi", "homo"][Math.floor(Math.random() * 3)];
  }
}

function _npcBuildPlayerConversationText(label, action) {
    const text = String(label || "").trim();
    if (!text) return action ? "" : "You act.";

    const lower = text.toLowerCase();
    if (lower === "say goodbye") return "You say goodbye and step away.";
    if (lower === "trade") return "You open trade.";
    if (lower === "tease playfully") return "You tease them playfully.";
    if (lower === "flirt lightly") return "You flirt lightly.";
    if (lower === "keep things calm") return "You try to keep things calm.";
    if (lower === "offer help") return "You offer help.";
    if (lower === "compliment them") return "You compliment them.";
    if (lower === "comfort them") return "You try to comfort them.";
    if (lower === "apologize") return "You apologize.";

    return `You ${_npcLowercaseFirst(text)}.`;
}

function ensureNPCConversationState(npc) {
    if (!npc) return null;
    npc.memory = npc.memory || {};

    const state = npc.memory.conversationState && typeof npc.memory.conversationState === "object"
        ? npc.memory.conversationState
        : {};

    if (!Array.isArray(state.usedOptionIds)) state.usedOptionIds = [];
    if (!Array.isArray(state.sessionUsedOptionIds)) state.sessionUsedOptionIds = [];
    if (!state.lastVariantByOption || typeof state.lastVariantByOption !== "object") state.lastVariantByOption = {};
    if (!state.optionUsage || typeof state.optionUsage !== "object" || Array.isArray(state.optionUsage)) state.optionUsage = {};
    if (typeof state.interactionCount !== "number") state.interactionCount = 0;
    if (typeof state.sessionInteractionCount !== "number") state.sessionInteractionCount = 0;
    if (typeof state.sessionNumber !== "number") state.sessionNumber = 0;
    if (typeof state.lastOptionId !== "string") state.lastOptionId = "";

    npc.memory.conversationState = state;
    return state;
}

function resetNPCConversationSession(npc) {
    const state = ensureNPCConversationState(npc);
    if (!state) return null;

    state.sessionUsedOptionIds = [];
    state.sessionInteractionCount = 0;
    state.sessionNumber += 1;
    state.lastOptionId = "";
    return state;
}

function recordNPCConversationChoice(npc, choice) {
    if (!npc || !choice) return null;
    const state = ensureNPCConversationState(npc);
    if (!state) return null;

    const optionId = String(choice.id || "").trim();
    if (optionId) {
        state.usedOptionIds.push(optionId);
        state.usedOptionIds = state.usedOptionIds.slice(-60);
        state.sessionUsedOptionIds.push(optionId);
        state.sessionUsedOptionIds = state.sessionUsedOptionIds.slice(-30);
        state.lastOptionId = optionId;

        const usage = state.optionUsage[optionId] && typeof state.optionUsage[optionId] === "object"
            ? state.optionUsage[optionId]
            : {};
        usage.count = typeof usage.count === "number" ? usage.count + 1 : 1;
        usage.sessionCount = usage.sessionNumber === state.sessionNumber && typeof usage.sessionCount === "number"
            ? usage.sessionCount + 1
            : 1;
        usage.sessionNumber = state.sessionNumber || 0;
        usage.lastUsedTurn = typeof getCurrentStoryTurn === "function"
            ? getCurrentStoryTurn()
            : state.interactionCount;
        usage.lastUsedEventCounter = typeof G === "object" && G && G.story && typeof G.story.eventCounter === "number"
            ? G.story.eventCounter
            : 0;
        state.optionUsage[optionId] = usage;
    }

    state.interactionCount += 1;
    state.sessionInteractionCount += 1;
    return state;
}

function _npcHasNamedFlags(source, required) {
    const names = _npcNormalizeList(required);
    if (!names.length) return true;
    const map = source && typeof source === "object" ? source : {};
    return names.every(name => !!map[name]);
}

function _npcHasAnyNamedFlags(source, required) {
    const names = _npcNormalizeList(required);
    if (!names.length) return false;
    const map = source && typeof source === "object" ? source : {};
    return names.some(name => !!map[name]);
}

function _npcNormalizeEventNames(value) {
    return _npcNormalizeList(value);
}

function _npcNormalizeStoryEvents(events) {
    return Array.isArray(events) ? events.filter(Boolean) : [];
}

function _npcRecentEventMatches(events, options = {}, afterCounter = 0) {
    const normalizedEvents = _npcNormalizeStoryEvents(events);
    if (!normalizedEvents.length) return false;

    const types = _npcNormalizeEventNames(options.types);
    const tags = _npcNormalizeEventNames(options.tags);

    return normalizedEvents.some(event => {
        const eventCounter = typeof event.eventCounter === "number" ? event.eventCounter : 0;
        if (eventCounter <= afterCounter) return false;

        const eventType = String(event.type || "").toLowerCase();
        const eventTags = _npcNormalizeList(event.tags);
        const typeMatch = !types.length || types.includes(eventType);
        const tagMatch = !tags.length || tags.some(tag => eventTags.includes(tag));
        return typeMatch && tagMatch;
    });
}

function _npcPickConversationVariant(npc, optionId, variants, fallback, ctx) {
    const resolvedFallback = _npcResolveConversationValue(fallback, npc, ctx);
    const pool = (Array.isArray(variants) ? variants : [])
        .map(entry => _npcResolveConversationValue(entry, npc, ctx))
        .filter(Boolean);

    if (!pool.length) return resolvedFallback;

    const state = ensureNPCConversationState(npc);
    const last = state && state.lastVariantByOption
        ? String(state.lastVariantByOption[optionId] || "")
        : "";
    const candidates = pool.length > 1 && last
        ? pool.filter(entry => entry !== last)
        : pool.slice();
    const pickFrom = candidates.length ? candidates : pool;
    const pick = pickFrom[Math.floor(Math.random() * pickFrom.length)];

    if (state && state.lastVariantByOption) {
        state.lastVariantByOption[optionId] = pick;
    }

    return pick;
}

const NPC_CONVERSATION_CATALOGUE = [
    {
        id: "greet-intro",
        priority: 10,
        repeat: "never",
        label: "Greet them",
        textVariants: [
            "You offer a simple greeting and leave room for them to answer however they like.",
            "You start the conversation with a polite greeting and wait to see what tone they choose.",
            "You open with a measured greeting and give them space to respond."
        ],
        intent: "greeting",
        relationshipImpact: { mood: 1, favor: 4, hostility: -1, intent: "greeting", markMet: true, actionTag: "greeting" },
        conditions: { metPlayer: false }
    },
    {
        id: "greet-known",
        priority: 15,
        repeat: "session",
        resetTimer: { turns: 3 },
        label: (npc, ctx) => {
            if (ctx.hostility >= 70) return "Acknowledge them carefully";
            if (ctx.favor >= 35 || ctx.relationship === "trusted" || ctx.relationship === "friendly") {
                return "Greet them warmly";
            }
            if (ctx.sessionUsedOptionIds.includes("greet-known")) return "Check in with them again";
            return "Greet them again";
        },
        textVariants: [
            (npc, ctx) => ctx.hostility >= 70
                ? "You acknowledge them without crowding them and keep your tone careful."
                : "You greet them like someone you have already spoken with and leave the tone open.",
            (npc, ctx) => ctx.hostility >= 70
                ? "You offer a measured acknowledgment instead of pretending the tension is gone."
                : "You offer a familiar greeting and watch how they receive it this time.",
            (npc, ctx) => ctx.favor >= 35
                ? "You greet them with easy familiarity, as though picking up a conversation already in motion."
                : "You greet them again without making it sound like a first introduction."
        ],
        intent: "greeting",
        relationshipImpact: (npc, ctx) => ctx.hostility >= 70
            ? { mood: 0, favor: 1, hostility: -1, intent: "greeting", markMet: true, actionTag: "greeting" }
            : { mood: 1, favor: 2, hostility: -1, intent: "greeting", markMet: true, actionTag: "greeting" },
        conditions: { metPlayer: true }
    },
    {
        id: "ask-name",
        priority: 18,
        repeat: "never",
        label: "Ask their name",
        textVariants: [
            "You ask their name in a straightforward, polite way.",
            "You ask what you should call them and give them room to answer in their own way.",
            "You ask them to introduce themselves properly."
        ],
        intent: "introduction",
        relationshipImpact: { mood: 0, favor: 2, hostility: -1, intent: "introduction", markMet: true, actionTag: "ask-name" },
        conditions: { metPlayer: false }
    },
    {
        id: "ask-place",
        priority: 20,
        repeat: "session",
        label: "Ask about this place",
        textVariants: [
            "You ask about the area and let them frame it in their own terms.",
            "You invite them to tell you what matters about this place.",
            "You ask them to explain the place as they see it."
        ],
        intent: "curious",
        relationshipImpact: { mood: 0, favor: 1, intent: "curious", markMet: true, actionTag: "ask-place" }
    },
    {
        id: "ask-seen",
        priority: 30,
        repeat: "session",
        resetTimer: { turns: 4 },
        label: "Ask what they have seen",
        textVariants: [
            "You ask what they have noticed nearby and listen for anything unusual.",
            "You steer the conversation toward recent events and what they have seen.",
            "You ask whether anything around here has seemed out of place."
        ],
        intent: "curious",
        relationshipImpact: { mood: 0, favor: 1, intent: "curious", markMet: true, actionTag: "ask-seen" }
    },
    {
        id: "ask-background",
        priority: 40,
        repeat: "session",
        label: "Ask what brought them here",
        textVariants: [
            "You ask what brought them here and leave the rest for them to fill in.",
            "You invite them to share how they ended up in this place.",
            "You ask about the path that led them here."
        ],
        intent: "curious",
        relationshipImpact: { mood: 0, favor: 2, intent: "curious", markMet: true, actionTag: "ask-background" },
        conditions: {
            metPlayer: true,
            maxHostility: 75,
            excludedActionTags: ["ask-background"]
        }
    },
    {
        id: "offer-help",
        priority: 50,
        repeat: "session",
        label: "Offer help",
        textVariants: [
            "You offer help and let them decide how much to reveal.",
            "You make it clear you are willing to help if they need it.",
            "You give them an opening to ask for help without pressing."
        ],
        intent: "help",
        relationshipImpact: { mood: 1, favor: 5, hostility: -1, intent: "help", markMet: true, actionTag: "offer-help" }
    },
    {
        id: "keep-calm",
        priority: 60,
        repeat: "session",
        label: "Keep things calm",
        textVariants: [
            "You keep your tone even and try to keep the conversation from turning ugly.",
            "You slow things down and make it clear you are not looking for a fight.",
            "You give them room while trying to settle the tension."
        ],
        intent: "calm",
        relationshipImpact: { mood: 1, favor: 2, hostility: -2, intent: "calm", markMet: true, actionTag: "keep-calm" },
        conditions: {
            any: [
                { minHostility: 60 },
                { maxFavor: -21 }
            ]
        }
    },
    {
        id: "ask-rumor",
        priority: 70,
        repeat: "session",
        resetTimer: { turns: 6 },
        label: "Ask for a rumor",
        textVariants: [
            "You ask whether they have heard anything worth knowing.",
            "You nudge the conversation toward rumors and loose talk.",
            "You invite them to share whispers, gossip, or anything people are not saying openly."
        ],
        intent: "rumor",
        relationshipImpact: { mood: 0, favor: 2, intent: "curious", markMet: true, actionTag: "ask-rumor" },
        conditions: {
            maxHostility: 59,
            minFavor: -20
        }
    },
    {
        id: "ask-work",
        priority: 80,
        repeat: "session",
        label: npc => npc && npc.role ? `Ask about their work as ${npc.role}` : "Ask about their work",
        textVariants: [
            npc => npc && npc.role
                ? `You ask what life is like in their role as ${npc.role}.`
                : "You ask what kind of work fills their days.",
            npc => npc && npc.role
                ? `You invite them to talk about their work as ${npc.role}.`
                : "You ask what keeps them busy around here.",
            npc => npc && npc.role
                ? `You ask how they came to this sort of work as ${npc.role}.`
                : "You ask what sort of work they have made for themselves."
        ],
        intent: "curious",
        relationshipImpact: { mood: 0, favor: 1, intent: "curious", markMet: true, actionTag: "ask-work" },
        conditions: {
            metPlayer: true,
            roleIncludes: ["guard", "keeper", "merchant", "trader", "bartender", "vendor", "healer", "priest", "archivist", "smith", "cook", "miner", "scout"],
            excludedActionTags: ["ask-work"]
        }
    },
    {
        id: "ask-watch",
        priority: 90,
        repeat: "session",
        label: "Ask who they are watching for",
        textVariants: [
            "You ask who or what they are keeping an eye on.",
            "You draw attention to their vigilance and ask what has them watching so closely.",
            "You ask what they are expecting to see before long."
        ],
        intent: "curious",
        relationshipImpact: { mood: 0, favor: 1, intent: "curious", markMet: true, actionTag: "ask-watch" },
        conditions: {
            roleIncludes: ["guard", "scout"],
            maxHostility: 70,
            excludedActionTags: ["ask-watch"]
        }
    },
    {
        id: "ask-need",
        priority: 100,
        repeat: "session",
        label: "Ask what they need most",
        textVariants: [
            "You ask what they need most right now and let them decide how honest to be.",
            "You follow up by asking what would actually help them.",
            "You ask where help would matter most."
        ],
        intent: "help",
        relationshipImpact: { mood: 1, favor: 3, hostility: -1, intent: "help", markMet: true, actionTag: "ask-need" },
        conditions: {
            requiredActionTags: ["offer-help"],
            maxHostility: 70,
            excludedActionTags: ["ask-need"]
        }
    },
    {
        id: "ask-people",
        priority: 110,
        repeat: "session",
        label: npc => npc && npc.species ? `Ask about ${npc.species} customs` : "Ask about their people",
        textVariants: [
            npc => npc && npc.species
                ? `You ask what someone unfamiliar with ${npc.species} customs ought to know.`
                : "You ask what an outsider should understand about their people.",
            npc => npc && npc.species
                ? `You invite them to explain the customs of ${npc.species} in their own words.`
                : "You ask how they would explain their people to a stranger.",
            npc => npc && npc.species
                ? `You ask about the habits and customs of ${npc.species} without pretending you already understand them.`
                : "You ask about the customs they grew up with."
        ],
        intent: "curious",
        relationshipImpact: { mood: 0, favor: 2, intent: "curious", markMet: true, actionTag: "ask-people" },
        conditions: {
            metPlayer: true,
            excludeSpecies: ["human"],
            minFavor: 0,
            maxHostility: 65,
            excludedActionTags: ["ask-people"]
        }
    },
    {
        id: "compliment",
        priority: 120,
        repeat: "session",
        label: "Compliment them",
        textVariants: [
            "You offer a sincere compliment and watch how they take it.",
            "You try to put them at ease with a genuine compliment.",
            "You offer a few kind words and leave the rest unforced."
        ],
        intent: "flattery",
        relationshipImpact: { mood: 1, favor: 6, hostility: -1, attraction: 3, arousal: 1, intent: "flattery", markMet: true, actionTag: "compliment" }
    },
    {
        id: "apologize",
        priority: 130,
        repeat: "session",
        label: "Apologize",
        textVariants: [
            "You apologize and try to smooth things over without making a bigger scene of it.",
            "You own your part in the tension and try to ease it.",
            "You offer a simple apology and let them decide what to do with it."
        ],
        intent: "apology"
    },
    {
        id: "comfort",
        priority: 140,
        repeat: "session",
        label: "Comfort them",
        textVariants: [
            "You try to reassure them in a calm, steady way.",
            "You offer a little comfort without crowding them.",
            "You speak gently and try to give them something steady to hold onto."
        ],
        intent: "comfort",
        conditions: {
            any: [
                { minFavor: 5 },
                { maxHostility: 55 }
            ]
        }
    },
    {
        id: "flirt",
        priority: 150,
        repeat: "session",
        label: "Flirt lightly",
        textVariants: [
            "You let a little charm into the moment and see whether they lean into it.",
            "You test the waters with a light touch of flirtation.",
            "You nudge the conversation in a warmer direction and watch their reaction."
        ],
        intent: "flirt",
        conditions: {
            romanceEligible: true,
            maxHostility: 70
        }
    },
    {
        id: "tease",
        priority: 160,
        repeat: "session",
        label: "Tease playfully",
        textVariants: [
            "You tease them lightly and see whether they play along.",
            "You try a playful jab to test the mood between you.",
            "You add a bit of playful pressure and watch for their answer."
        ],
        intent: "tease",
        conditions: {
            romanceEligible: true,
            any: [
                { minFavor: 10 },
                { maxHostility: 45 },
                { minAttraction: 15 }
            ]
        }
    },
    {
        id: "trade",
        priority: 170,
        repeat: "always",
        label: "Trade",
        action: "trade",
        conditions: { tradeAvailable: true }
    },
    {
        id: "sharp-question",
        priority: 180,
        repeat: "session",
        label: (npc, ctx) => ctx.hostility >= 55 ? "Warn them sharply" : "Question them sharply",
        textVariants: [
            (npc, ctx) => ctx.hostility >= 55
                ? "You make it clear you will not tolerate trouble."
                : "You press them for a straighter answer.",
            (npc, ctx) => ctx.hostility >= 55
                ? "You answer their edge with one of your own."
                : "You cut through the pleasantries and push for the point.",
            (npc, ctx) => ctx.hostility >= 55
                ? "You give them a sharp warning and leave no doubt you mean it."
                : "You challenge them to stop circling and answer plainly."
        ],
        intent: "aggression",
        relationshipImpact: { mood: -1, favor: -5, hostility: 5, aggression: 1, intent: "aggression", markMet: true, actionTag: "sharp-question" }
    },
    {
        id: "goodbye",
        priority: 190,
        label: "Say goodbye",
        text: "You say goodbye and step away.",
        action: "disengage",
        intent: "goodbye",
        relationshipImpact: { mood: 0, favor: 1, intent: "goodbye", markMet: true, actionTag: "goodbye" }
    }
];

// === Updated getNPCConversationContext() ===
function getNPCConversationContext(npc, extraContext = {}) {
  const ctx = {
    npc: npc,
    player: window.G.player,
    relationship: npc.relationship || {},
    // Include lust, attraction, orientation
    lust: npc.relationship?.lust || 0,
    attraction: npc.relationship?.attraction || 0,
    orientation: npc.relationship?.orientation || "bi", // Default to bi for safety
    everGreeted: !!(npc.memory && npc.memory.everGreeted),
    story: window.G.story,
    // ... (other existing fields)
  };
  return { ...ctx, ...extraContext };
}

// === Updated conversationConditionMatches() ===
function conversationConditionMatches(conditions, ctx) {
  if (!conditions) return true;

  // Existing checks (species, role, favor, hostility, etc.)
  if (conditions.species && ctx.npc.species !== conditions.species) return false;
  if (conditions.role && ctx.npc.role !== conditions.role) return false;
  if (conditions.minFavor !== undefined && ctx.npc.relationship.favor < conditions.minFavor) return false;
  if (conditions.maxHostility !== undefined && ctx.npc.relationship.hostility > conditions.maxHostility) return false;

  // New adult system checks
  if (conditions.minLust !== undefined && ctx.npc.relationship.lust < conditions.minLust) return false;
  if (conditions.minAttraction !== undefined && ctx.npc.relationship.attraction < conditions.minAttraction) return false;
  if (conditions.orientation && ctx.npc.relationship.orientation !== conditions.orientation) return false;

  return true;
}

function getNPCConversationContext(npc, extraContext = {}) {
    if (!npc) return null;
    ensureNPCRelationshipState(npc);
    const conversationState = ensureNPCConversationState(npc);

    const room = extraContext.room || (typeof G === "object" ? G.activeRoom : null) || null;
    const actionTags = getNPCActionTags(npc, 20);
    const story = typeof ensureStoryStateShape === "function"
        ? ensureStoryStateShape(typeof G === "object" ? G.story : null)
        : ((typeof G === "object" && G && G.story && typeof G.story === "object") ? G.story : null);
    const externalState = extraContext.externalState && typeof extraContext.externalState === "object"
        ? extraContext.externalState
        : {};

    return {
        npc,
        room,
        role: String(npc.role || "").toLowerCase(),
        species: String(npc.species || "").toLowerCase(),
        temperament: String(npc.temperament || "").toLowerCase(),
        favor: npc.memory && typeof npc.memory.favorability === "number" ? npc.memory.favorability : 0,
        hostility: typeof npc.hostility === "number" ? npc.hostility : 0,
        attraction: npc.memory && typeof npc.memory.attraction === "number" ? npc.memory.attraction : 0,
        arousal: npc.memory && typeof npc.memory.arousal === "number" ? npc.memory.arousal : 0,
        disinhibition: npc.memory && typeof npc.memory.disinhibition === "number" ? npc.memory.disinhibition : 0,
        metPlayer: !!(npc.memory && npc.memory.metPlayer),
        everGreeted: !!(npc.memory && npc.memory.everGreeted),
        mood: String(npc.memory && npc.memory.lastMood || "neutral").toLowerCase(),
        disposition: typeof getCurrentNPCDisposition === "function"
            ? String(getCurrentNPCDisposition(npc) || "").toLowerCase()
            : "neutral",
        relationship: typeof getRelationshipLabel === "function"
            ? String(getRelationshipLabel(npc) || "").toLowerCase()
            : "neutral",
        isHumanoid: npc.isHumanoid === true,
        romanceEligible: typeof isAdultHumanoidNPC === "function" ? isAdultHumanoidNPC(npc) : false,
        tradeAvailable: typeof shouldShowPostReplyTradeAction === "function" ? shouldShowPostReplyTradeAction(npc) : false,
        actionTags,
        roomType: String(room && room.type || "").toLowerCase(),
        roomRole: String(room && room.role || "").toLowerCase(),
        zoneName: String(room && room.zone || "").toLowerCase(),
        aggressionCount: npc.memory && typeof npc.memory.aggressionCount === "number" ? npc.memory.aggressionCount : 0,
        usedOptionIds: Array.isArray(conversationState && conversationState.usedOptionIds)
            ? conversationState.usedOptionIds.slice()
            : [],
        sessionUsedOptionIds: Array.isArray(conversationState && conversationState.sessionUsedOptionIds)
            ? conversationState.sessionUsedOptionIds.slice()
            : [],
        interactionCount: conversationState && typeof conversationState.interactionCount === "number"
            ? conversationState.interactionCount
            : 0,
        sessionInteractionCount: conversationState && typeof conversationState.sessionInteractionCount === "number"
            ? conversationState.sessionInteractionCount
            : 0,
        lastOptionId: conversationState && typeof conversationState.lastOptionId === "string"
            ? conversationState.lastOptionId
            : "",
        optionUsage: conversationState && conversationState.optionUsage && typeof conversationState.optionUsage === "object"
            ? { ...conversationState.optionUsage }
            : {},
        storyTurn: story && typeof story.turnCounter === "number" ? story.turnCounter : 0,
        storyEventCounter: story && typeof story.eventCounter === "number" ? story.eventCounter : 0,
        storyFlags: story && story.flags && typeof story.flags === "object" ? story.flags : {},
        storyRecentEvents: story && Array.isArray(story.recentEvents) ? story.recentEvents.slice() : [],
        externalState
    };
}

function conversationConditionMatches(conditions, ctx) {
    if (!conditions) return true;
    if (!ctx) return false;

    if (Array.isArray(conditions.all) && !conditions.all.every(entry => conversationConditionMatches(entry, ctx))) {
        return false;
    }

    if (Array.isArray(conditions.any) && conditions.any.length &&
        !conditions.any.some(entry => conversationConditionMatches(entry, ctx))) {
        return false;
    }

    if (conditions.not && conversationConditionMatches(conditions.not, ctx)) {
        return false;
    }

    if (typeof conditions.metPlayer === "boolean" && ctx.metPlayer !== conditions.metPlayer) return false;
    if (typeof conditions.isHumanoid === "boolean" && ctx.isHumanoid !== conditions.isHumanoid) return false;
    if (typeof conditions.romanceEligible === "boolean" && ctx.romanceEligible !== conditions.romanceEligible) return false;
    if (typeof conditions.tradeAvailable === "boolean" && ctx.tradeAvailable !== conditions.tradeAvailable) return false;

    if (conditions.species && !_npcValueInList(ctx.species, conditions.species)) return false;
    if (conditions.excludeSpecies && _npcValueInList(ctx.species, conditions.excludeSpecies)) return false;
    if (conditions.temperaments && !_npcValueInList(ctx.temperament, conditions.temperaments)) return false;
    if (conditions.excludeTemperaments && _npcValueInList(ctx.temperament, conditions.excludeTemperaments)) return false;
    if (conditions.relationships && !_npcValueInList(ctx.relationship, conditions.relationships)) return false;
    if (conditions.dispositions && !_npcValueInList(ctx.disposition, conditions.dispositions)) return false;
    if (conditions.roomTypes && !_npcValueInList(ctx.roomType, conditions.roomTypes)) return false;
    if (conditions.roomRoles && !_npcValueInList(ctx.roomRole, conditions.roomRoles)) return false;
    if (conditions.zoneNames && !_npcValueInList(ctx.zoneName, conditions.zoneNames)) return false;

    if (conditions.roles && !_npcValueInList(ctx.role, conditions.roles)) return false;
    if (conditions.excludeRoles && _npcValueInList(ctx.role, conditions.excludeRoles)) return false;
    if (conditions.roleIncludes && !_npcTextIncludesAny(ctx.role, conditions.roleIncludes)) return false;
    if (conditions.excludeRoleIncludes && _npcTextIncludesAny(ctx.role, conditions.excludeRoleIncludes)) return false;
    if (conditions.requiredStoryFlags && !_npcHasNamedFlags(ctx.storyFlags, conditions.requiredStoryFlags)) return false;
    if (conditions.excludedStoryFlags && _npcHasAnyNamedFlags(ctx.storyFlags, conditions.excludedStoryFlags)) return false;
    if (conditions.requiredExternalFlags && !_npcHasNamedFlags(ctx.externalState, conditions.requiredExternalFlags)) return false;
    if (conditions.excludedExternalFlags && _npcHasAnyNamedFlags(ctx.externalState, conditions.excludedExternalFlags)) return false;
    if (conditions.requiredStoryEventTypes && !_npcRecentEventMatches(ctx.storyRecentEvents, {
        types: conditions.requiredStoryEventTypes
    })) {
        return false;
    }
    if (conditions.requiredStoryEventTags && !_npcRecentEventMatches(ctx.storyRecentEvents, {
        tags: conditions.requiredStoryEventTags
    })) {
        return false;
    }
    if (conditions.requiredOptionIds && !_npcActionTagsInclude(ctx.usedOptionIds, conditions.requiredOptionIds)) return false;
    if (conditions.requiredSessionOptionIds && !_npcActionTagsInclude(ctx.sessionUsedOptionIds, conditions.requiredSessionOptionIds)) return false;
    if (conditions.excludedOptionIds && _npcNormalizeList(conditions.excludedOptionIds)
        .some(id => _npcActionTagsInclude(ctx.usedOptionIds, [id]))) {
        return false;
    }
    if (conditions.excludedSessionOptionIds && _npcNormalizeList(conditions.excludedSessionOptionIds)
        .some(id => _npcActionTagsInclude(ctx.sessionUsedOptionIds, [id]))) {
        return false;
    }

    if (typeof conditions.minFavor === "number" && ctx.favor < conditions.minFavor) return false;
    if (typeof conditions.maxFavor === "number" && ctx.favor > conditions.maxFavor) return false;
    if (typeof conditions.minHostility === "number" && ctx.hostility < conditions.minHostility) return false;
    if (typeof conditions.maxHostility === "number" && ctx.hostility > conditions.maxHostility) return false;
    if (typeof conditions.minLust === "number" && ctx.lust < conditions.minLust) return false;
    if (typeof conditions.maxLust === "number" && ctx.lust > conditions.maxLust) return false;
    if (typeof conditions.minAttraction === "number" && ctx.attraction < conditions.minAttraction) return false;
    if (typeof conditions.maxAttraction === "number" && ctx.attraction > conditions.maxAttraction) return false;
    if (typeof conditions.minArousal === "number" && ctx.arousal < conditions.minArousal) return false;
    if (typeof conditions.maxArousal === "number" && ctx.arousal > conditions.maxArousal) return false;
    if (typeof conditions.minDisinhibition === "number" && ctx.disinhibition < conditions.minDisinhibition) return false;
    if (typeof conditions.maxDisinhibition === "number" && ctx.disinhibition > conditions.maxDisinhibition) return false;
    if (typeof conditions.minAggressionCount === "number" && ctx.aggressionCount < conditions.minAggressionCount) return false;
    if (typeof conditions.maxAggressionCount === "number" && ctx.aggressionCount > conditions.maxAggressionCount) return false;
    if (typeof conditions.minInteractionCount === "number" && ctx.interactionCount < conditions.minInteractionCount) return false;
    if (typeof conditions.maxInteractionCount === "number" && ctx.interactionCount > conditions.maxInteractionCount) return false;
    if (typeof conditions.minSessionInteractionCount === "number" && ctx.sessionInteractionCount < conditions.minSessionInteractionCount) return false;
    if (typeof conditions.maxSessionInteractionCount === "number" && ctx.sessionInteractionCount > conditions.maxSessionInteractionCount) return false;

    if (conditions.requiredActionTags && !_npcActionTagsInclude(ctx.actionTags, conditions.requiredActionTags)) return false;
    if (conditions.excludedActionTags && _npcNormalizeList(conditions.excludedActionTags)
        .some(tag => _npcActionTagsInclude(ctx.actionTags, [tag]))) {
        return false;
    }

    if (typeof conditions.custom === "function" && conditions.custom(ctx.npc, ctx) === false) return false;

    return true;
}

function conversationOptionResetAvailable(entry, ctx, usage) {
    if (!entry || !ctx || !usage) return false;

    const resetConfig = entry.resetTimer != null ? entry.resetTimer : entry.decay;
    if (resetConfig == null && !entry.resetOnStoryFlags && !entry.resetOnStoryEventTypes &&
        !entry.resetOnStoryEventTags && !entry.resetOnExternalFlags && typeof entry.resetWhen !== "function") {
        return false;
    }

    const normalizedReset = typeof resetConfig === "number"
        ? { turns: resetConfig }
        : (resetConfig && typeof resetConfig === "object" ? resetConfig : {});

    if (typeof normalizedReset.turns === "number" && typeof usage.lastUsedTurn === "number") {
        if ((ctx.storyTurn - usage.lastUsedTurn) >= normalizedReset.turns) return true;
    }

    const storyFlagNames = normalizedReset.storyFlags || entry.resetOnStoryFlags;
    if (storyFlagNames && _npcHasAnyNamedFlags(ctx.storyFlags, storyFlagNames)) return true;

    const externalFlagNames = normalizedReset.externalFlags || entry.resetOnExternalFlags;
    if (externalFlagNames && _npcHasAnyNamedFlags(ctx.externalState, externalFlagNames)) return true;

    const eventTypes = normalizedReset.storyEventTypes || entry.resetOnStoryEventTypes;
    const eventTags = normalizedReset.storyEventTags || entry.resetOnStoryEventTags;
    if ((eventTypes || eventTags) && _npcRecentEventMatches(ctx.storyRecentEvents, {
        types: eventTypes,
        tags: eventTags
    }, usage.lastUsedEventCounter || 0)) {
        return true;
    }

    if (typeof entry.resetWhen === "function" && entry.resetWhen(ctx.npc, ctx, usage) === true) {
        return true;
    }

    return false;
}

function conversationRepeatAvailable(entry, ctx) {
    const repeat = String(entry && entry.repeat || "always").toLowerCase();
    const optionId = String(entry && entry.id || "").trim();
    if (!optionId) return true;
    const usage = ctx && ctx.optionUsage && typeof ctx.optionUsage === "object"
        ? ctx.optionUsage[optionId]
        : null;

    if (repeat === "never") {
        if (!ctx.usedOptionIds.includes(optionId)) return true;
        return conversationOptionResetAvailable(entry, ctx, usage);
    }

    if (repeat === "session") {
        if (!ctx.sessionUsedOptionIds.includes(optionId)) return true;
        return conversationOptionResetAvailable(entry, ctx, usage);
    }

    return true;
}

function buildConversationOption(entry, npc, ctx) {
    const optionId = String(entry.id || "").trim();
    const label = _npcPickConversationVariant(npc, `${optionId}:label`, entry.labelVariants, entry.label, ctx);
    const action = _npcResolveConversationValue(entry.action, npc, ctx);
    const promptText = _npcPickConversationVariant(npc, `${optionId}:text`, entry.textVariants, entry.text, ctx);
    const playerText = _npcPickConversationVariant(
        npc,
        `${optionId}:playerText`,
        entry.playerTextVariants,
        entry.playerText || _npcBuildPlayerConversationText(label, action),
        ctx
    );

    if (!label || (!playerText && !action)) return null;

    const impact = _npcResolveConversationValue(entry.relationshipImpact, npc, ctx);
    return {
        id: entry.id,
        label,
        text: playerText,
        promptText: promptText || playerText,
        action,
        intent: _npcResolveConversationValue(entry.intent, npc, ctx),
        className: _npcResolveConversationValue(entry.className, npc, ctx),
        relationshipImpact: impact && typeof impact === "object" ? { ...impact } : impact
    };
}

function queryConversationCatalogue(npc, extraContext = {}) {
    if (!npc) return [];

    const ctx = getNPCConversationContext(npc, extraContext);
    if (!ctx) return [];

    const everGreeted = npc.memory && npc.memory.everGreeted === true;
    
    // Filter by greeting gate: only greeting and disengage options until first greeting
    let filtered = NPC_CONVERSATION_CATALOGUE;
    if (!everGreeted) {
        filtered = NPC_CONVERSATION_CATALOGUE.filter(entry => {
            const isGreeting = entry.intent === "greeting" || 
                entry.id === "greet-intro" || 
                entry.id === "greet-known";
            const isDisengage = entry.action === "disengage" || entry.id === "goodbye";
            return isGreeting || isDisengage;
        });
    }

    return filtered
        .filter(entry => conversationRepeatAvailable(entry, ctx))
        .filter(entry => conversationConditionMatches(entry.conditions, ctx))
        .sort((a, b) => (a.priority || 0) - (b.priority || 0))
        .map(entry => buildConversationOption(entry, npc, ctx))
        .filter(Boolean);
}

function normalizeSpeechStyle(style) {
    const key = String(style || "common").toLowerCase().trim();
    if (SPEECH_STYLE_ALIASES[key]) return SPEECH_STYLE_ALIASES[key];
    if (NPC_SPEECH_PROFILES[key]) return key;
    return "common";
}

function getSpeechProfile(style) {
    return NPC_SPEECH_PROFILES[normalizeSpeechStyle(style)] || NPC_SPEECH_PROFILES.common;
}

function determineNPCSpeechStyle(npc, room, zoneTemplate) {
    if (!npc) return "common";

    const template = _npcGetSpeciesTemplate(npc.species) || {};
    const role = String(npc.role || "").toLowerCase();
    const temperament = String(npc.temperament || "").toLowerCase();
    const ageCategory = String(npc.ageCategory || "").toLowerCase();
    const roomType = String((room && room.type) || "").toLowerCase();
    const zoneName = String((zoneTemplate && zoneTemplate.name) || (room && room.zone) || "").toLowerCase();
    const traits = Array.isArray(npc.personalityTraits) && npc.personalityTraits.length
        ? npc.personalityTraits
        : (Array.isArray(npc.personalityProfile && npc.personalityProfile.traits) ? npc.personalityProfile.traits : []);

    let style = normalizeSpeechStyle(template.speechStyle || npc.speechStyle || npc.speech || "common");

    if (role.includes("guard")) style = "direct";
    else if (role.includes("blacksmith") || role.includes("miner")) style = "gruff";
    else if (role.includes("innkeeper") || role.includes("bartender") || role.includes("shopkeeper")) style = "folksy";
    else if (role.includes("healer") || role.includes("priest") || role.includes("archivist")) style = "formal";
    else if (role.includes("scout") || role.includes("thief") || role.includes("raider")) style = "guarded";

    if (roomType.includes("gate") && style === "common") style = "guarded";
    if ((roomType.includes("tavern") || roomType.includes("inn")) && ["common", "guarded"].includes(style)) style = "folksy";
    if ((zoneName.includes("dungeon") || zoneName.includes("ruin")) && ["common", "folksy"].includes(style)) style = "guarded";

    if (temperament === "aggressive" || temperament === "hostile" || temperament === "bold") {
        if (style === "formal") style = "direct";
        else if (style === "common") style = "gruff";
    } else if (temperament === "wary" || temperament === "skittish" || temperament === "paranoid") {
        if (!["broken", "whisper", "guarded", "nervous"].includes(style)) style = "guarded";
    } else if (temperament === "friendly" || temperament === "curious") {
        if (style === "common") style = "folksy";
        if (style === "direct") style = "common";
    }

    if (traits.includes("sarcastic")) style = "wry";
    else if (traits.includes("shy") || traits.includes("paranoid")) style = "nervous";
    else if (traits.includes("grump") || traits.includes("bitter")) style = "gruff";
    else if (traits.includes("studious")) style = "formal";
    else if (traits.includes("cheerful") || traits.includes("helpful")) {
        if (["common", "guarded"].includes(style)) style = "folksy";
    }

    if (ageCategory === "elderly" && ["common", "direct"].includes(style)) style = "formal";
    if (ageCategory === "young" && style === "formal" && !role.includes("priest") && !role.includes("archivist")) style = "common";

    return normalizeSpeechStyle(style);
}

function getNPCSpeechProfile(npc, room, zoneTemplate) {
    const style = determineNPCSpeechStyle(npc, room, zoneTemplate);
    const profile = getSpeechProfile(style);
    return {
        style,
        sample: profile.sample,
        sentenceLength: profile.sentenceLength,
        vocabulary: profile.vocabulary,
        cadence: profile.cadence,
        cues: Array.isArray(profile.cues) ? profile.cues.slice() : [],
        avoid: Array.isArray(profile.avoid) ? profile.avoid.slice() : []
    };
}

function syncNPCSpeechProfile(npc, room, zoneTemplate) {
    if (!npc) return null;
    const speechProfile = getNPCSpeechProfile(npc, room, zoneTemplate);
    npc.speechStyle = speechProfile.style;
    npc.speechProfile = {
        style: speechProfile.style,
        sample: speechProfile.sample,
        sentenceLength: speechProfile.sentenceLength,
        vocabulary: speechProfile.vocabulary,
        cadence: speechProfile.cadence,
        cues: speechProfile.cues.slice(0, 3),
        avoid: speechProfile.avoid.slice(0, 3)
    };
    return speechProfile;
}

function getSpeechTicsForStyle(style, voice) {
    const profile = getSpeechProfile(style);
    const tics = Array.isArray(profile.cues) && profile.cues.length
        ? profile.cues.slice(0, 3)
        : ["speaks plainly"];
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
    const speechProfile = syncNPCSpeechProfile(npc, room, zoneTemplate) || getNPCSpeechProfile(npc, room, zoneTemplate);

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
    const speechTics = getSpeechTicsForStyle(speechProfile.style, voice);

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
        speechProfile: {
            style: speechProfile.style,
            sample: speechProfile.sample,
            sentenceLength: speechProfile.sentenceLength,
            vocabulary: speechProfile.vocabulary,
            cadence: speechProfile.cadence,
            cues: speechProfile.cues.slice(0, 3),
            avoid: speechProfile.avoid.slice(0, 3)
        },
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
    npc.speechProfile = enrichment.speechProfile;

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
    if (!Array.isArray(npc.memory.playerActionTags)) npc.memory.playerActionTags = [];
    if (!Array.isArray(npc.memory.recentLines)) npc.memory.recentLines = [];
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
    if (npc.hostility >= 70) {
        if (["surrender", "plead", "bribe", "gift", "mercy", "apology", "calm", "comfort", "help", "greeting"].includes(key)) return 0.25;
        return false;
    }
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
        npc.memory.playerActionTags.push(actionTag);
        npc.memory.playerActionTags = npc.memory.playerActionTags.slice(-20);
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

    return {
        temperament,
        archetype,
        traits,
        quirks,
        bigFive
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
