// ── cyoaftw-npc-data.js v2026-10-03-0004 ── Typed replies carry relationship effects (playerTone)
// Version identifier for debugging cached files
if (typeof window !== "undefined") {
    window.NPC_DATA_VERSION = "2026-09-11-001";
    console.log("[NPC Data] Loaded v2026-09-11-001 - speech profile tone/style/language + temperament inflection");
}

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
        tone: "neutral and conversational",
        styleDescription: "ordinary, unremarkable speech",
        languageNotes: "speaks the common tongue naturally",
        cues: ["speaks plainly", "keeps the point clear", "does not dress up simple facts"],
        avoid: ["poetic imagery", "dramatic pauses", "mysterious tavern-sage lines"]
    },
    direct: {
        sample: "If you need an answer, ask straight. I don't waste time.",
        sentenceLength: "short",
        vocabulary: "blunt practical words",
        cadence: "gets to the point immediately",
        tone: "firm and commanding",
        styleDescription: "aggressive, no-nonsense delivery",
        languageNotes: "uses simplified, forceful language",
        cues: ["uses firm statements", "sounds decisive", "cuts off rambling"],
        avoid: ["flowery phrasing", "soft hedging", "long explanations"]
    },
    gruff: {
        sample: "Saw them, yes. Kept their heads down and paid in full.",
        sentenceLength: "short to medium",
        vocabulary: "rough practical words",
        cadence: "dry and matter-of-fact",
        tone: "low and gravelly",
        styleDescription: "work-hardened, sparing with words",
        languageNotes: "uses rough dialect, drops pleasantries",
        cues: ["keeps sentences tight", "sounds worn or work-hardened", "shows warmth sparingly"],
        avoid: ["courtly language", "pretty metaphors", "theatrical threats"]
    },
    formal: {
        sample: "I did notice them. They arrived late and spoke to no one for long.",
        sentenceLength: "medium",
        vocabulary: "precise but readable words",
        cadence: "measured and controlled",
        tone: "composed and measured",
        styleDescription: "elegant, careful word choice",
        languageNotes: "uses refined language, may include archaic phrasing",
        cues: ["chooses words carefully", "sounds composed", "may use titles when appropriate"],
        avoid: ["purple prose", "archaic filler", "grand speeches"]
    },
    guarded: {
        sample: "Maybe. Depends on why you're asking.",
        sentenceLength: "short",
        vocabulary: "plain careful words",
        cadence: "gives partial answers before trust is earned",
        tone: "flat and noncommittal",
        styleDescription: "evasive, testing the listener",
        languageNotes: "uses minimal language, withholds detail",
        cues: ["holds something back", "tests the listener first", "keeps tone restrained"],
        avoid: ["rambling", "open confession", "needless scene description"]
    },
    folksy: {
        sample: "Could be something to it. This road carries more trouble than wagons lately.",
        sentenceLength: "short to medium",
        vocabulary: "casual conversational words",
        cadence: "friendly and lightly colored by local habit",
        tone: "warm and unhurried",
        styleDescription: "friendly, down-to-earth delivery",
        languageNotes: "uses local sayings, comfortable colloquialisms",
        cues: ["sounds approachable", "may use a plain saying now and then", "keeps the mood human and readable"],
        avoid: ["cutesy chatter", "thick dialect spelling", "storybook whimsy"]
    },
    clipped: {
        sample: "Yes. Near the gate. After dark.",
        sentenceLength: "very short",
        vocabulary: "lean functional words",
        cadence: "fragmented but clear",
        tone: "sharp and high-pitched",
        styleDescription: "manic, fast-paced delivery with nervous energy",
        languageNotes: "uses simplified language, drops articles and fillers, may use a harsh guttural dialect",
        cues: ["answers in compact beats", "drops filler", "keeps emotion tucked in"],
        avoid: ["long setup", "speechifying", "decorative wording"]
    },
    nervous: {
        sample: "I saw something, I think. Hard to be sure, but it felt wrong.",
        sentenceLength: "short to medium",
        vocabulary: "simple uncertain words",
        cadence: "hesitates and self-corrects",
        tone: "quavering and uncertain",
        styleDescription: "anxious, second-guessing delivery",
        languageNotes: "uses hedging language, trails off mid-sentence",
        cues: ["second-guesses details", "sounds alert to danger", "watches for reactions"],
        avoid: ["confident lectures", "poetic dread", "slick sarcasm"]
    },
    boisterous: {
        sample: "Aye, I saw them, and they looked like trouble from ten paces off.",
        sentenceLength: "medium",
        vocabulary: "plain emphatic words",
        cadence: "energetic and open",
        tone: "loud and hearty",
        styleDescription: "larger-than-life, enthusiastic delivery",
        languageNotes: "uses emphatic language, may include rowdy exclamations",
        cues: ["sounds larger than life without losing clarity", "speaks with confidence", "lets attitude show"],
        avoid: ["long monologues", "fancy ornament", "endless shouting"]
    },
    wry: {
        sample: "I noticed. Trouble rarely bothers to wear a sign, but that came close.",
        sentenceLength: "short to medium",
        vocabulary: "plain words with a dry edge",
        cadence: "understated and pointed",
        tone: "dry and sardonic",
        styleDescription: "understated, pointed delivery with dry humor",
        languageNotes: "uses ironic wordplay, understatement",
        cues: ["uses dry humor sparingly", "sounds unimpressed", "lands the point cleanly"],
        avoid: ["constant snark", "florid irony", "riddle-talk"]
    },
    broken: {
        sample: "Seen them. Bad smell. Bad dark. Stay away.",
        sentenceLength: "very short",
        vocabulary: "simple concrete words",
        cadence: "broken or primitive but understandable",
        tone: "guttural and harsh",
        styleDescription: "primitive, fragmented delivery",
        languageNotes: "uses simplified pidgin language, drops articles and complex grammar, tribal dialect",
        cues: ["keeps grammar simple", "uses direct warning language", "focuses on immediate facts"],
        avoid: ["eloquent phrasing", "complex syntax", "abstract reflection"]
    },
    whisper: {
        sample: "Keep your voice down. Yes, I saw them, and I don't want them hearing this.",
        sentenceLength: "short to medium",
        vocabulary: "plain quiet words",
        cadence: "low and controlled",
        tone: "hushed and faint",
        styleDescription: "ethereal, barely-audible delivery",
        languageNotes: "uses minimal language, may include archaic or mournful phrasing",
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

const NPC_BACKGROUNDS = [
    { background: "grew up in a border trading town", dialectFlavor: "peppers speech with quick trade-cant shorthand" },
    { background: "born and raised in an isolated mountain clan", dialectFlavor: "carries old-fashioned, formal turns of phrase" },
    { background: "spent years with a traveling caravan", dialectFlavor: "cadence is a patchwork picked up from a dozen different places" },
    { background: "grew up in a coastal fishing village", dialectFlavor: "unhurried, sing-song cadence with maritime turns of phrase" },
    { background: "orphaned young, raised by whoever would take them in", dialectFlavor: "no single clear origin - habits borrowed from everywhere" },
    { background: "spent time in a monastery or temple school", dialectFlavor: "measured, deliberate phrasing with the occasional formal or archaic word" },
    { background: "grew up on the road with no fixed home", dialectFlavor: "speaks plainly and efficiently, with little patience for ornament" },
    { background: "raised within these city walls, rarely traveling far", dialectFlavor: "speaks with unselfconscious local familiarity, assuming shared context" }
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
    "ask-rumor-source": 0,
    "ask-rumor-proof": 1,
    "ask-family": 1,
    "ask-work-hardest": 1,
    "ask-seen-who": 0,
    "press-topic": 0,
    "ask-event": 0,
    "typed-warm": 1,
    "typed-rude": -2,
    "typed-threat": -3,
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

// ensureNPCConversationState: single canonical definition further below
// (state lives at npc.memory.conversationState). An older duplicate that
// wrote to npc.conversationState was removed — the later declaration always
// overrode it, so it was dead code that split state across two paths.

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
    if (typeof state.lastTopic !== "string") state.lastTopic = "";
    if (typeof state.lastLoreFactId !== "string") state.lastLoreFactId = "";

    npc.memory.conversationState = state;
    return state;
}

function resetNPCConversationSession(npc) {
    const state = ensureNPCConversationState(npc);
    if (!state) return null;

    state.sessionUsedOptionIds = [];
    if (npc && npc.memory) npc.memory.pendingResponse = null;
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
    // Typed / canned replies ("respond-...") are free-form: keep them out of
    // the used-option lists so they cannot push real option ids (like the
    // session greeting) out of the capped history. lastOptionId still moves,
    // so "right after X" follow-ups (press-topic) do not linger after a reply.
    if (optionId && optionId.indexOf("respond-") === 0) {
        state.lastOptionId = optionId;
    } else if (optionId) {
        state.usedOptionIds.push(optionId);
        state.usedOptionIds = state.usedOptionIds.slice(-60);
        state.sessionUsedOptionIds.push(optionId);
        state.sessionUsedOptionIds = state.sessionUsedOptionIds.slice(-30);
        state.lastOptionId = optionId;
        // A lore option: this NPC has now told that fact (never repeats it),
        // the world's "heard" count rises, and a follow-up can refer to it.
        if (choice.loreFactId && typeof ensureWorldLore === "function") {
            const loreState = ensureWorldLore();
            loreState.heard[choice.loreFactId] = (loreState.heard[choice.loreFactId] || 0) + 1;
            if (!npc.memory.loreTold || typeof npc.memory.loreTold !== "object") npc.memory.loreTold = {};
            npc.memory.loreTold[choice.loreFactId] = true;
            state.lastLoreFactId = choice.loreFactId;
        }
        // A guide option moves the opening story along (e.g. "plan" marks the
        // guide as having oriented the player).
        if (choice.guideBeat && typeof onGuideBeat === "function") onGuideBeat(npc, choice.guideBeat);
        // ask-about-topic labels read "Ask about <topic>"; remember the topic
        // so a follow-up ("press-topic") can refer to it.
        if (optionId === "ask-about-topic" && typeof choice.label === "string") {
            state.lastTopic = choice.label.replace(/^Ask about\s+/i, "").trim();
        }

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

// ── CONTEXTUAL CONVERSATION TOPICS ──────────────────────────────
// Short topic phrases (same register as species culture.topics, e.g.
// ["recent trouble", "work", "weather", "rumors"]) keyed by NPC role and
// by room type. Used by the "ask-about-topic" catalogue entry below to
// surface a topic that fits who the NPC is and where the conversation is
// happening, instead of the same generic questions everywhere. Keys are
// lowercase to match ctx.role / ctx.roomType, which are already lowercased
// by getNPCConversationContext().

const NPC_ROLE_TOPIC_POOLS = {
    "town guard": ["patrol routes", "recent troublemakers", "who's passed through"],
    "stone guard": ["tunnel security", "cave-ins", "who's recently been seen"],
    "vendor": ["prices", "best sellers", "where goods come from"],
    "shopkeeper": ["stock", "customers", "competition"],
    "wandering merchant": ["the road", "other towns", "rare finds"],
    "blacksmith": ["commissions", "materials", "local smithing reputation"],
    "innkeeper": ["guests", "rooms", "town happenings"],
    "bartender": ["drinks", "regulars", "overheard gossip"],
    "cook": ["ingredients", "the kitchen", "complaints about the food"],
    "servant": ["chores", "their employer", "what they overhear"],
    "priest": ["faith", "omens", "donations"],
    "archivist": ["old records", "forbidden texts", "the library's condition"],
    "scholar": ["research", "theories", "rare knowledge"],
    "pilgrim": ["their journey", "what they're seeking", "the shrine"],
    "townsfolk": ["daily life", "neighbors", "local news"],
    "villager": ["daily life", "neighbors", "local news"],
    "guest": ["why they're visiting", "the inn", "travel plans"],
    "patron": ["why they're here", "the tavern", "local talk"],
    "wanderer": ["the road", "where they've been", "having no fixed home"],
    "adventurer": ["recent jobs", "dangers ahead", "their gear"],
    "scout": ["the terrain", "threats they've spotted", "safe routes"],
    "miner": ["the tunnels", "ore veins", "cave-ins"],
    "raider": ["their territory", "targets", "rival raiders"],
    "scavenger": ["salvage", "safe pickings", "close calls"],
    "cultist": ["the cause", "secrecy", "outsiders"],
    "tomb robber": ["loot", "traps", "competitors"]
};

const NPC_LOCATION_TOPIC_POOLS = (function () {
    const townSpine = ["foot traffic", "local news", "who's been seen around"];
    const townLandmark = ["town business", "arrivals and departures", "watch activity"];
    const tavern = ["drinks", "gossip", "the regulars"];
    const inn = ["travelers", "the rooms", "comings and goings"];
    const dungeonSpine = ["echoes", "structural danger", "what's further in"];
    const dungeonLandmark = ["what this place was", "old dangers", "relics"];
    const dungeonInterior = ["hazards", "weapons", "past intruders"];
    const ruinsSpine = ["decay", "old architecture", "who's been through"];
    const ruinsLandmark = ["history", "old rituals", "the view from up here"];
    const undergroundLandmark = ["the city below", "who controls access", "the dangers down here"];
    const swamp = ["the water", "what's sunk here", "survival"];

    return {
        "street": townSpine,
        "avenue": townSpine,
        "alleyway": townSpine,
        "square": townLandmark,
        "gate": townLandmark,
        "tavern": tavern,
        "taproom": tavern,
        "inn": inn,
        "inn common": inn,
        "guest room": inn,
        "kitchen": ["food", "supplies", "the cook"],
        "cellar": ["storage", "what's kept down here", "pests"],
        "passage": dungeonSpine,
        "corridor": dungeonSpine,
        "tunnel": dungeonSpine,
        "chamber": dungeonLandmark,
        "shrine": dungeonLandmark,
        "trap": dungeonInterior,
        "armory": dungeonInterior,
        "hallway": ruinsSpine,
        "ruins passage": ruinsSpine,
        "altar": ruinsLandmark,
        "tower": ruinsLandmark,
        "library": ["old texts", "lost knowledge", "the dust and decay"],
        "cavern": undergroundLandmark,
        "smithy": ["good steel", "ore and prices", "the forge"],
        "deep forge": ["the old smiths", "ore from the deep seams", "good steel"],
        "mine shaft": ["the ore seams", "the shift", "cave-ins"],
        "collapsed gallery": dungeonInterior,
        "underground gate": undergroundLandmark,
        "vault": ["valuables", "security", "who built this place"],
        "underground hallway": ["echoes", "the tunnel network", "traffic"],
        "marsh": swamp,
        "broken ground": swamp,
        "swamp camp": swamp,
        "submerged ruin": swamp
    };
})();

// Merges role topics + location topics + the NPC's species-flavor topics
// (npc.preferredTopics, set once by generateNPCEnrichment) into one deduped
// candidate list, role/location first since those are the more specific,
// context-relevant fit; species topics remain as a fallback so the pool is
// essentially never empty.
function getContextualNPCTopics(npc, ctx) {
    const rolePool = NPC_ROLE_TOPIC_POOLS[ctx && ctx.role] || [];
    const locationPool = NPC_LOCATION_TOPIC_POOLS[ctx && ctx.roomType] || [];
    const speciesPool = Array.isArray(npc && npc.preferredTopics) ? npc.preferredTopics : [];

    const merged = [];
    const seen = {};
    rolePool.concat(locationPool, speciesPool).forEach(function (topic) {
        const key = String(topic || "").trim().toLowerCase();
        if (!key || seen[key]) return;
        seen[key] = true;
        merged.push(topic);
    });
    return merged;
}

// Picks one topic for this build of the "ask-about-topic" option and
// stashes it on ctx so the label and the text template agree on the same
// topic. buildConversationOption() resolves label before text/playerText,
// so by the time text runs the pick is already on ctx. The pick itself
// goes through _npcPickConversationVariant so it also gets the "don't
// repeat what was just shown" rotation every other conversation option uses.
function _npcPickAskAboutTopic(npc, ctx) {
    if (ctx && ctx.__askAboutTopicPick) return ctx.__askAboutTopicPick;
    const topics = getContextualNPCTopics(npc, ctx);
    const topic = _npcPickConversationVariant(npc, "ask-about-topic:topic", topics, "what's on their mind", ctx);
    if (ctx) ctx.__askAboutTopicPick = topic;
    return topic;
}

// ── STORY AWARENESS ─────────────────────────────────────────────
// G.story.recentEvents is dominated by "movement" and "conversation" noise, so
// anything that wants to react to what has actually happened has to skip
// those. An NPC is treated as aware of an event when it happened in their
// room, mentions them by name, or (for civilised NPCs) is recent news of the
// kind that travels (trouble, deaths, rising tension).
const NPC_NOISE_EVENT_TYPES = ["movement", "conversation", "start"];
const NPC_NEWS_EVENT_TYPES = ["combat", "death", "act-shift"];
const NPC_EVENT_LOCAL_WINDOW = 20;   // story turns an in-room / involving-them event stays relevant
const NPC_EVENT_NEWS_WINDOW = 8;     // story turns recent news keeps travelling

// Newest first (rememberStoryEvent unshifts). Each entry is the raw story
// event plus `here` (happened in this room) and `age` (story turns ago).
function getNPCAwareStoryEvents(npc, opts) {
    if (!npc) return [];
    const options = opts || {};
    const story = typeof G === "object" && G && G.story ? G.story : null;
    if (!story || !Array.isArray(story.recentEvents)) return [];

    const turnNow = typeof story.turnCounter === "number" ? story.turnCounter : 0;
    const room = options.room || (typeof G === "object" && G ? G.activeRoom : null);
    const roomName = room ? String(room.displayName || room.name || "") : "";
    const npcName = String(npc.name || "").toLowerCase();
    const civilised = npc.isHumanoid === true;

    const out = [];
    story.recentEvents.forEach(function (ev) {
        if (!ev) return;
        const type = String(ev.type || "").toLowerCase();
        if (NPC_NOISE_EVENT_TYPES.indexOf(type) >= 0) return;
        if (_npcNormalizeList(ev.tags).indexOf("item-discovery") >= 0) return; // private to the player
        const age = turnNow - (typeof ev.turn === "number" ? ev.turn : turnNow);
        const here = !!roomName && ev.room === roomName;
        const involvesNpc = !!npcName && String(ev.text || "").toLowerCase().indexOf(npcName) >= 0;

        let aware = false;
        if (here || involvesNpc) aware = age <= NPC_EVENT_LOCAL_WINDOW;
        else if (civilised && NPC_NEWS_EVENT_TYPES.indexOf(type) >= 0) aware = age <= NPC_EVENT_NEWS_WINDOW;
        if (aware) out.push(Object.assign({}, ev, { here: here, age: age }));
    });
    return out;
}
if (typeof window !== "undefined") window.getNPCAwareStoryEvents = getNPCAwareStoryEvents;

// Picks the newest aware event we can turn into a menu topic and describes it:
// { event, label, phrase, note, sig } or null. Memoized on ctx so the label,
// text and note of one menu build all agree.
function _npcEventTopic(npc, ctx) {
    if (ctx && ctx.__eventTopic !== undefined) return ctx.__eventTopic;
    let topic = null;
    const events = getNPCAwareStoryEvents(npc, { room: ctx && ctx.room });
    for (let i = 0; i < events.length && !topic; i++) {
        const ev = events[i];
        const type = String(ev.type || "").toLowerCase();
        const tags = _npcNormalizeList(ev.tags);
        let label = "";
        let phrase = "";
        if (type === "combat") {
            label = ev.here ? "Ask about the trouble here" : "Ask about the recent trouble";
            phrase = ev.here ? "the trouble that just happened here" : "the trouble people have been talking about";
        } else if (type === "death") {
            label = "Ask about what just happened";
            phrase = "what just happened";
        } else if (type === "lore" || type === "faith") {
            label = "Ask about the gods";
            phrase = tags.indexOf("deity-lore") >= 0 ? "what you have been learning of the gods" : "faith and the gods";
        } else if (type === "exploration") {
            if (!ev.here) continue;
            label = "Ask about what turned up";
            phrase = "what turned up when you searched around here";
        } else if (type === "act-shift") {
            label = "Ask about the mood lately";
            phrase = "the mood around here lately";
        } else {
            continue;
        }
        topic = {
            event: ev,
            label: label,
            phrase: phrase,
            sig: String(ev.eventCounter || 0),
            note: "Something the speaker knows about (" + (ev.here ? "it happened here" : "word has reached them") +
                "): " + String(ev.text || "").slice(0, 200) +
                " Answer from the speaker's own point of view and do not invent details that contradict this."
        };
    }
    if (ctx) ctx.__eventTopic = topic;
    return topic;
}

// ── WORLD LORE: WHAT THIS NPC KNOWS ─────────────────────────────
// Facts live in WORLD_LORE_FACTS (cyoaftw-world-data.js). Which of them an
// NPC knows is decided here from role, species and place, with a stable
// per-NPC dice roll so the same NPC always knows (and slants) the same things.
// No AI calls: the chosen fact reaches the prompt only as an option's
// contextNote, so it costs a couple of lines for one reply.

function _loreHash(text) {
    let h = 2166136261;
    const s = String(text || "");
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return (h >>> 0) % 100;
}

function _loreNpcKey(npc) {
    return String((npc && (npc.id || npc.givenName || npc.name)) || "npc");
}

// Knowledge tiers an NPC can draw on, from role and species.
const NPC_LORE_ROLE_TIERS = [
    { match: ["guard", "scout", "watch", "raider", "adventurer", "soldier", "mercenary", "guildmaster"], tiers: ["military", "local"] },
    { match: ["priest", "pilgrim", "cultist"], tiers: ["faith", "local"] },
    { match: ["archivist", "scholar", "librarian"], tiers: ["scholar", "faith"] },
    { match: ["vendor", "shopkeeper", "merchant", "trader", "bartender", "innkeeper", "cook", "servant"], tiers: ["trade", "local"] },
    { match: ["blacksmith", "smith", "miner", "stone guard"], tiers: ["deep", "trade"] },
    { match: ["townsfolk", "villager", "guest", "patron", "wanderer", "healer"], tiers: ["local"] },
    { match: ["scavenger", "tomb robber"], tiers: ["deep", "military"] }
];

const NPC_LORE_SPECIES_TIERS = {
    "dwarf": ["deep"],
    "elf": ["scholar"],
    "human": ["local"],
    "halfling": ["local", "trade"],
    "dragonborn": ["military"],
    "goblin": ["military", "deep"],
    "orc": ["military"],
    "kobold": ["deep", "military"],
    "lizardfolk": ["swamp"],
    "skeleton": ["military"],
    "ghost": ["military", "faith", "secret"]
};

function getNPCLoreTiers(npc, ctx) {
    const role = String((ctx && ctx.role) || (npc && npc.role) || "").toLowerCase();
    const species = String((ctx && ctx.species) || (npc && npc.species) || "").toLowerCase();
    const tiers = { common: true };
    NPC_LORE_ROLE_TIERS.forEach(function (row) {
        if (_npcTextIncludesAny(role, row.match)) row.tiers.forEach(function (t) { tiers[t] = true; });
    });
    (NPC_LORE_SPECIES_TIERS[species] || []).forEach(function (t) { tiers[t] = true; });
    // Secrets are for the trusted, the faithful and the dead.
    const favor = ctx && typeof ctx.favor === "number" ? ctx.favor : 0;
    const hostility = ctx && typeof ctx.hostility === "number" ? ctx.hostility : 0;
    if ((favor >= 20 && hostility < 40) || species === "ghost") tiers.secret = true;
    else delete tiers.secret;
    return tiers;
}

// Zone distance over the zone-link graph (ZONE_LINKS, engine). Unknown -> 1.
function _loreZoneDistance(fromZone, toZone) {
    const a = String(fromZone || "").toLowerCase();
    const b = String(toZone || "").toLowerCase();
    if (!a || !b) return 1;
    if (a === b) return 0;
    if (typeof ZONE_LINKS === "undefined" || !Array.isArray(ZONE_LINKS)) return 1;
    const seen = {};
    seen[a] = 0;
    const queue = [a];
    while (queue.length) {
        const cur = queue.shift();
        for (let i = 0; i < ZONE_LINKS.length; i++) {
            const link = ZONE_LINKS[i];
            if (!link) continue;
            const from = String(link.from || "").toLowerCase();
            const to = String(link.to || "").toLowerCase();
            let next = "";
            if (from === cur) next = to;
            else if (to === cur) next = from;
            if (next && seen[next] === undefined) {
                seen[next] = seen[cur] + 1;
                if (next === b) return seen[next];
                queue.push(next);
            }
        }
    }
    return 3;
}

// Which side an NPC leans toward: "crown", "banners" or "neutral". Stable.
function getNPCLoreLeaning(npc, ctx) {
    const species = String((ctx && ctx.species) || (npc && npc.species) || "").toLowerCase();
    const role = String((ctx && ctx.role) || (npc && npc.role) || "").toLowerCase();
    if (species === "skeleton") return "crown";
    if (species === "ghost") return "neutral";
    const seed = ensureWorldLore().seed;
    let crown = 20, banners = 20;
    if (seed.townOrigin === "crown") crown += 12; else banners += 12;
    if (species === "goblin" || species === "orc" || species === "kobold") banners += 30;
    if (species === "dwarf" || species === "lizardfolk") { crown -= 15; banners -= 15; }
    if (_npcTextIncludesAny(role, ["guard", "town hall"])) crown += 10;
    if (_npcTextIncludesAny(role, ["raider", "scavenger", "tomb robber"])) banners += 15;
    if (_npcTextIncludesAny(role, ["priest", "pilgrim"])) { crown -= 10; banners -= 10; }
    const roll = _loreHash(_loreNpcKey(npc) + ":lean");
    if (roll < crown) return "crown";
    if (roll >= 100 - banners) return "banners";
    return "neutral";
}

// Every fact this NPC knows: [{ fact, firsthand, distorted }]. Memoized on ctx.
function getNPCKnownLoreFacts(npc, ctx) {
    if (!npc || typeof WORLD_LORE_FACTS === "undefined") return [];
    if (ctx && ctx.__loreKnown) return ctx.__loreKnown;
    const tiers = getNPCLoreTiers(npc, ctx);
    const key = _loreNpcKey(npc);
    const zone = ctx && ctx.zoneName ? ctx.zoneName : "";
    const out = [];
    // Named buildings of the town (see getPlaceLoreFacts in
    // cyoaftw-world-data.js) join the fixed facts.
    let allFacts = typeof getPlaceLoreFacts === "function"
        ? WORLD_LORE_FACTS.concat(getPlaceLoreFacts())
        : WORLD_LORE_FACTS;
    // First-lead facts from the player's backstory (see getBackstoryLoreFacts in
    // cyoaftw-world-data.js): what the guide hints at is what asking around finds.
    if (typeof getBackstoryLoreFacts === "function") {
        allFacts = allFacts.concat(getBackstoryLoreFacts());
    }
    // Wanted thieves (see getCrimeLoreFacts in the engine) are live gossip.
    // A fact carrying aboutId is never told by the person it is about.
    if (typeof getCrimeLoreFacts === "function") {
        allFacts = allFacts.concat(getCrimeLoreFacts().filter(function (f) { return !f.aboutId || f.aboutId !== npc.id; }));
    }
    const here = ctx && ctx.room && ctx.room.buildingId ? ctx.room.buildingId : null;
    allFacts.forEach(function (fact) {
        // Someone working inside a building knows it firsthand.
        const ownBuilding = !!(here && fact.buildingId === here);
        const own = fact.tiers.filter(function (t) { return tiers[t] && t !== "common"; });
        const firsthand = own.length > 0 || ownBuilding;
        const commonOnly = fact.tiers.indexOf("common") >= 0;
        if (!firsthand && !commonOnly) return;
        if (fact.tiers.indexOf("secret") >= 0 && !tiers.secret) return;
        let chance = ownBuilding ? 100 : (typeof fact.know === "number" ? fact.know : 50);
        // Distance only matters for things that are not common knowledge.
        let dist = 0;
        if (!commonOnly || firsthand) {
            dist = 3;
            (fact.zones || []).forEach(function (z) { dist = Math.min(dist, _loreZoneDistance(zone, z)); });
            if ((fact.zones || []).length === 0) dist = 0;
        }
        if (!commonOnly) chance = chance * (dist === 0 ? 1 : (dist === 1 ? 0.7 : 0.35));
        if (!firsthand) chance = Math.min(chance, 70); // hearsay only
        if (_loreHash(key + ":" + fact.id) >= chance) return;
        const garbled = !firsthand && !!fact.distorted && _loreHash(key + ":" + fact.id + ":garble") < 45;
        out.push({ fact: fact, firsthand: firsthand, distorted: garbled });
    });
    if (ctx) ctx.__loreKnown = out;
    return out;
}

// Picks the fact to offer now: facts this NPC has not told yet, least-heard first, filtered by purpose ("rumor"
// keeps rumor-flagged facts), nearest to this NPC's place first, with a stable
// per-NPC tiebreak so the same menu keeps the same fact until it is heard.
function pickNPCLoreFact(npc, ctx, purpose) {
    const memoKey = "__lorePick:" + (purpose || "topic");
    if (ctx && ctx[memoKey] !== undefined) return ctx[memoKey];
    const lore = ensureWorldLore();
    const zone = ctx && ctx.zoneName ? ctx.zoneName : "";
    const key = _loreNpcKey(npc);
    // The rumor option and the topic option must not offer the same fact.
    const topicPick = purpose === "rumor" ? pickNPCLoreFact(npc, ctx, "topic") : null;
    let pool = getNPCKnownLoreFacts(npc, ctx).filter(function (entry) {
        if (topicPick && topicPick.fact.id === entry.fact.id) return false;
        if (npc.memory && npc.memory.loreTold && npc.memory.loreTold[entry.fact.id]) return false;
        if (purpose === "rumor" && !entry.fact.rumor) return false;
        return true;
    });
    pool = pool.map(function (entry) {
        let dist = 3;
        (entry.fact.zones || []).forEach(function (z) { dist = Math.min(dist, _loreZoneDistance(zone, z)); });
        return { entry: entry, score: (entry.firsthand ? 0 : 2) + dist + (lore.heard[entry.fact.id] || 0) * 1.5 + _loreHash(key + ":pick:" + entry.fact.id) / 100 };
    }).sort(function (a, b) { return a.score - b.score; });
    const pick = pool.length ? pool[0].entry : null;
    if (ctx) ctx[memoKey] = pick;
    return pick;
}

function _loreLeaningLine(leaning) {
    if (leaning === "crown") return " The speaker sympathizes with the Crown and tells it with that slant, without lying outright.";
    if (leaning === "banners") return " The speaker sympathizes with the Free Banners and tells it with that slant, without lying outright.";
    return " The speaker takes no side in the war.";
}

function buildNPCLoreNote(npc, ctx, entry, mode) {
    if (!entry) return "";
    const seed = ensureWorldLore().seed;
    const text = getWorldLoreFactText(entry.fact, seed, entry.distorted);
    if (mode === "source") {
        return "Something the speaker told the player: \"" + text + "\" Now the player asks how they know it. " +
            (entry.firsthand
                ? "Say it comes from their own work or experience, and how sure they are."
                : "Say plainly it is only what they heard from others, and they cannot vouch for it.") +
            " Do not add new events or names.";
    }
    return "Local history the speaker " + (entry.firsthand ? "knows firsthand" : "has only heard secondhand") + ": \"" + text + "\"" +
        (entry.distorted ? " (They believe this version.)" : "") +
        " Answer from the speaker's own point of view in their own words, and do not invent other events or names." +
        _loreLeaningLine(getNPCLoreLeaning(npc, ctx));
}

function _loreLastHeardEntry(npc, ctx) {
    const state = npc && npc.memory && npc.memory.conversationState ? npc.memory.conversationState : null;
    const id = ctx && ctx.lastLoreFactId ? ctx.lastLoreFactId : (state ? state.lastLoreFactId : "");
    if (!id) return null;
    const known = getNPCKnownLoreFacts(npc, ctx);
    for (let i = 0; i < known.length; i++) if (known[i].fact.id === id) return known[i];
    return null;
}

// True when the NPC's last reply said it expects an answer (the reply JSON's
// "responseNeeded" flag, stored by npcRespond in the engine).
function _npcResponseIsPending(npc) {
    const pending = npc && npc.memory ? npc.memory.pendingResponse : null;
    return !!(pending && pending.needed === true);
}

// ── TYPED REPLY TONE ────────────────────────────────────────────
// Free-typed replies ("Respond..." in the engine) have no catalogue entry, so
// their relationship effect comes from the tone of the words. The AI judges it
// in the NPC's reply JSON (playerTone: warm | neutral | rude | threatening,
// "how the words land on this speaker"); when it is missing, a small keyword
// pass supplies a fallback so typed text is never consequence-free.
const NPC_TYPED_TONES = ["warm", "neutral", "rude", "threatening"];

const NPC_TYPED_TONE_IMPACTS = {
    // intent matters: canImproveMood() makes warm words land far weaker on an
    // NPC at hostility 70+ ("calm"), and a refusal to be won over is the same
    // rule every other friendly option already follows.
    warm:        { mood: 1,  favor: 3,  hostility: -1, aggression: 0, intent: "calm",       actionTag: "typed-warm" },
    rude:        { mood: -1, favor: -4, hostility: 3,  aggression: 0, intent: "insult",     actionTag: "typed-rude" },
    threatening: { mood: -1, favor: -6, hostility: 7,  aggression: 1, intent: "aggression", actionTag: "typed-threat" }
};

function classifyTypedTone(text) {
    const t = " " + String(text || "").toLowerCase().replace(/[^a-z' ]+/g, " ").replace(/\s+/g, " ") + " ";
    const has = function (list) { return list.some(function (w) { return t.indexOf(w) >= 0; }); };
    if (has([" kill you", " gut you", " cut you", " hurt you", " break your", " burn this", " or else", " you'll regret", " you will regret", " you're dead", " you are dead", " make you bleed", " draw my", " end you"])) return "threatening";
    if (has([" shut up", " idiot", " stupid", " moron", " fool ", " useless", " pathetic", " piss off", " get lost", " out of my way", " don't care", " who cares", " go away", " waste of"])) return "rude";
    if (has([" thank", " please", " sorry", " apolog", " appreciate", " my friend", " kind of you", " much obliged", " no offense", " no offence", " forgive"])) return "warm";
    return "neutral";
}

// Builds the impact for a typed reply, or null for a neutral one. Warm words
// have diminishing returns (two warm replies in the last three halve the
// gain) so a stream of flattery cannot farm favor; rude and threatening
// words are never dampened.
function buildTypedToneImpact(npc, tone, text) {
    const key = NPC_TYPED_TONES.indexOf(String(tone || "").toLowerCase()) >= 0
        ? String(tone).toLowerCase()
        : classifyTypedTone(text);

    if (npc && npc.memory) {
        if (!Array.isArray(npc.memory.typedTones)) npc.memory.typedTones = [];
    }
    const recent = npc && npc.memory ? npc.memory.typedTones.slice(-3) : [];
    if (npc && npc.memory) {
        npc.memory.typedTones.push(key);
        npc.memory.typedTones = npc.memory.typedTones.slice(-6);
    }

    const base = NPC_TYPED_TONE_IMPACTS[key];
    if (!base) return null;
    const impact = Object.assign({ markMet: true }, base);
    if (key === "warm" && recent.filter(function (x) { return x === "warm"; }).length >= 2) {
        impact.mood = 0;
        impact.favor = Math.max(1, Math.round(impact.favor / 2));
        impact.hostility = 0;
    }
    return impact;
}
if (typeof window !== "undefined") {
    window.classifyTypedTone = classifyTypedTone;
    window.buildTypedToneImpact = buildTypedToneImpact;
}

// ── RELEVANCE HELPERS ───────────────────────────────────────────
// Used by catalogue conditions below so reactive options (apologize, comfort)
// only show when there is something to react to.
const NPC_FRICTION_OPTION_IDS = ["insult", "sharp-question", "push-for-answers"];
const NPC_FRICTION_ACTION_TAGS = [
    "threat", "sharp-question", "tease-backfire", "misread-flirt", "flirt-rejected",
    "comfort-rebuffed", "hard-bargain", "refused-trade", "attacked-by-player", "mercy-refused"
];

// True when the player has recently given this NPC a reason to be upset.
function _npcPlayerCausedFriction(ctx) {
    if (!ctx) return false;
    if (ctx.favor < 0 || ctx.hostility >= 35) return true;
    const session = Array.isArray(ctx.sessionUsedOptionIds) ? ctx.sessionUsedOptionIds : [];
    if (NPC_FRICTION_OPTION_IDS.some(function (id) { return session.indexOf(id) >= 0; })) return true;
    const tags = Array.isArray(ctx.actionTags) ? ctx.actionTags.slice(-6) : [];
    return NPC_FRICTION_ACTION_TAGS.some(function (tag) { return tags.indexOf(tag) >= 0; });
}

// True when the NPC looks like they could use comforting: hurt, rattled by
// something recent, surrendered, or in a sour mood.
function _npcNeedsComfort(npc, ctx) {
    if (!npc || !ctx) return false;
    if (npc.surrendered) return true;
    const hpMax = npc.hpMax || 0;
    if (hpMax > 0 && typeof npc.hp === "number" && npc.hp > 0 && npc.hp < hpMax * 0.6) return true;
    if (["wary", "angry", "furious"].indexOf(ctx.mood) >= 0) return true;
    if (_npcPlayerCausedFriction(ctx)) return true;
    return _npcRecentEventMatches(ctx.storyRecentEvents, { types: ["combat", "danger", "death"] });
}

// Menu ranking + cap. Only entries from the base catalogue are re-ranked or
// capped; entries merged in from window.NPC_NSFW_CONVERSATION_CATALOGUE are
// passed through untouched so that half of the menu behaves exactly as before.
const NPC_MAX_TOPIC_OPTIONS = 7;

function _npcEntryIsBase(entry) {
    return NPC_CONVERSATION_CATALOGUE.indexOf(entry) >= 0;
}

// Lower rank sorts first. Follow-ups to something just said, role-specific
// topics and story-driven topics float above generic ones.
function _npcEntryRank(entry) {
    let rank = entry && typeof entry.priority === "number" ? entry.priority : 0;
    if (!_npcEntryIsBase(entry)) return rank;
    const c = entry.conditions || {};
    if (typeof entry.rankBoost === "number") rank -= entry.rankBoost;
    if (c.requiredSessionOptionIds) rank -= 60;
    if (c.roleIncludes) rank -= 15;
    if (c.requiredStoryFlags || c.requiredStoryEventTypes || c.requiredStoryEventTags) rank -= 20;
    if (c.hasOwnDeity) rank -= 10;
    return rank;
}

// Returns a filter that keeps at most NPC_MAX_TOPIC_OPTIONS base-catalogue
// topic entries (call AFTER sorting by rank). Hidden topics surface later as
// the shown ones are used up (most are repeat: "session").
function _npcMakeTopicCap(npc, ctx) {
    let kept = 0;
    return function (entry) {
        if (!_npcEntryIsBase(entry)) return true;
        const kind = _npcDeriveOptionKind(entry, _npcResolveConversationValue(entry.intent, npc, ctx), npc, ctx);
        if (kind !== "topic") return true;
        kept += 1;
        return kept <= NPC_MAX_TOPIC_OPTIONS;
    };
}

// A warm, unthreatened NPC introduces themselves by name when greeted,
// without being asked. Used by the greeting entries (contextNote + reveal).
function _npcWillIntroduce(npc, ctx) {
    if (!npc || !ctx || ctx.nameKnown) return false;
    return ctx.favor >= 25 && ctx.hostility <= 35;
}
function _npcIntroNote(npc, ctx) {
    if (!_npcWillIntroduce(npc, ctx)) return "";
    return "You have warmed to the player. Introduce yourself by name in this reply, naturally and in your own voice: your name is " + getNPCSelfName(npc) + ". Do not invent a different name.";
}

// ── GUIDE HELPERS ───────────────────────────────────────────────
// The guide is the NPC who joins the player after character creation (see
// startGuideArrival in the engine and PLAYER_ARCHETYPES in
// cyoaftw-world-data.js). Their menu entries below are gated on npc.guide and
// read the player's backstory, so what they say follows the player's own
// answers. All wording comes from AI replies steered by these notes; the
// facts in them are the only ones the guide is told to use.
function _npcIsGuide(npc) {
    return !!(npc && npc.guide && npc.guide.active);
}

// True once the guide has laid out the first step or asked about the party.
function _guideOrientedOrOffered() {
    const bs = typeof getPlayerBackstory === "function" ? getPlayerBackstory() : null;
    return !!(bs && bs.guide && (bs.guide.state === "oriented" || bs.guide.partyOffered));
}

// The current lead stage if this NPC (not the guide) is in that stage's
// building and the guide's plan has been heard; otherwise null. Pass null for
// npc to skip the NPC checks (used by the prompt note).
function _leadStageFor(npc) {
    const bs = typeof getPlayerBackstory === "function" ? getPlayerBackstory() : null;
    if (!bs || !bs.guide || bs.guide.state !== "oriented") return null;
    if (typeof window.getCurrentLeadStage !== "function") return null;
    const st = window.getCurrentLeadStage(bs);
    if (!st || !st.building) return null;
    if (npc) {
        if (npc.guide || npc.isHumanoid === false) return null;
        const room = typeof G !== "undefined" ? G.activeRoom : null;
        if (!room || room.buildingId !== st.building.id) return null;
    }
    return st;
}

// The guide's party question is on screen (its canned replies are showing).
function _guideOfferPending(npc) {
    const p = npc && npc.memory ? npc.memory.pendingResponse : null;
    return !!(p && p.needed && Array.isArray(p.options) && p.options.some(function (o) { return o && o.guideParty; }));
}

function _guideNote(kind) {
    const bs = typeof getPlayerBackstory === "function" ? getPlayerBackstory() : null;
    if (!bs) return "";
    if (kind === "plan") {
        const plan = typeof getGuidePlanText === "function" ? getGuidePlanText(bs) : "";
        return "You are the player's guide. Tell them plainly what to do first, in your own voice: " + plan +
            " Name the place, give one reason, and keep it to a few sentences. Do not invent other named people or places.";
    }
    if (kind === "past") {
        return "The player asks how the two of you came to be here. Recount, briefly and in your own voice, this shared history without adding new facts or names: " + bs.text;
    }
    if (kind === "town") {
        const places = typeof getGuideTownSummary === "function" ? getGuideTownSummary() : "";
        return "The player asks what you make of the town. Give an honest first impression in your own voice, mentioning only places that really exist here" +
            (places ? " (" + places + ")" : "") + ". Do not invent other named places or people.";
    }
    if (kind === "trust") {
        const plan = typeof getGuidePlanText === "function" ? getGuidePlanText(bs) : "";
        return "The player asks how sure you are about the lead (" + plan + "). Be honest in your own voice: say what you actually know and what is only a hunch or hearsay. Do not invent new facts.";
    }
    return "";
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
        contextNote: _npcIntroNote,
        revealsName: _npcWillIntroduce,
        cacheSig: (npc, ctx) => _npcWillIntroduce(npc, ctx) ? "intro" : "",
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
        contextNote: _npcIntroNote,
        revealsName: _npcWillIntroduce,
        cacheSig: (npc, ctx) => _npcWillIntroduce(npc, ctx) ? "intro" : "",
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
        // The greeting gate hides everything but greetings until the session
        // greeting, and greeting sets metPlayer, so the old "metPlayer: false"
        // condition meant this option could never be shown. Offer it until the
        // name has been asked once (repeat: "never" tracks that), unless the
        // NPC is too hostile to bother introducing themselves.
        conditions: { maxHostility: 70, nameKnown: false },
        contextNote: (npc, ctx) => "Your name is " + getNPCSelfName(npc) + ". Tell the player your name in this reply, in your own voice (you may grudgingly or warmly, depending on your mood). Do not invent a different name."
    },
    {
        id: "ask-place",
        priority: 20,
        repeat: "session",
        label: (npc, ctx) => (ctx && ctx.roomType && ctx.roomType.length <= 22)
            ? "Ask about the " + ctx.roomType
            : "Ask about this place",
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
        relationshipImpact: { mood: 0, favor: 1, intent: "curious", markMet: true, actionTag: "ask-seen" },
        // Only worth asking when something noteworthy happened that the NPC
        // knows about (movement/conversation chatter does not count - see
        // getNPCAwareStoryEvents), or the NPC watches the place for a living.
        conditions: {
            custom: (npc, ctx) =>
                getNPCAwareStoryEvents(npc, { room: ctx.room }).length > 0 ||
                _npcTextIncludesAny(ctx.role, ["guard", "scout", "keeper", "bartender", "watch"])
        }
    },
    {
        // Offering a drink (any alcohol in the player's inventory - see
        // TAVERN_DRINK_TEMPLATES / offerDrinkToNPC in cyoaftw-engine-CORE.js)
        // is a scripted action, not an AI turn: the engine consumes the
        // drink, stacks the NPC's "drunk" status effect and loosens their
        // inhibitions (memory.disinhibition - the same pool the
        // min/maxDisinhibition conditions above read). The function-action
        // path in chooseChatOption fires the action and shows its own chat
        // lines, skipping npcRespond.
        id: "offer-drink",
        priority: 26,
        repeat: "session",
        resetTimer: { turns: 4 },
        label: "Offer them a drink",
        textVariants: [
            "You offer them something to drink.",
            "You hold out a drink for them.",
            "You suggest sharing a drink together."
        ],
        intent: "gift",
        conditions: {
            maxHostility: 60,
            custom: (npc, ctx) =>
                ctx.isHumanoid &&
                typeof playerHasAlcohol === "function" &&
                playerHasAlcohol()
        },
        action: (npc) => {
            if (typeof offerDrinkToNPC === "function") offerDrinkToNPC(npc);
        }
    },
    {
        id: "ask-about-event",
        priority: 28,
        rankBoost: 20,
        repeat: "session",
        // A new noteworthy event reopens it; the same event is only asked once.
        resetOnStoryEventTypes: ["combat", "death", "lore", "faith", "exploration", "act-shift"],
        label: (npc, ctx) => { const t = _npcEventTopic(npc, ctx); return t ? t.label : ""; },
        textVariants: [
            (npc, ctx) => { const t = _npcEventTopic(npc, ctx); return t ? `You ask what they make of ${t.phrase}.` : ""; },
            (npc, ctx) => { const t = _npcEventTopic(npc, ctx); return t ? `You bring up ${t.phrase} and let them tell it their way.` : ""; },
            (npc, ctx) => { const t = _npcEventTopic(npc, ctx); return t ? `You ask what they saw or heard about ${t.phrase}.` : ""; }
        ],
        // Facts passed to the AI so the reply is about the real event.
        contextNote: (npc, ctx) => { const t = _npcEventTopic(npc, ctx); return t ? t.note : ""; },
        // Cached replies for this option are dropped when this changes.
        cacheSig: (npc, ctx) => { const t = _npcEventTopic(npc, ctx); return t ? t.sig : ""; },
        intent: "curious",
        relationshipImpact: { mood: 0, favor: 1, intent: "curious", markMet: true, actionTag: "ask-event" },
        replaces: ["ask-seen"],
        conditions: {
            metPlayer: true,
            maxHostility: 70,
            custom: (npc, ctx) => !!_npcEventTopic(npc, ctx)
        }
    },
    {
        id: "ask-about-lore",
        priority: 44,
        rankBoost: 18,
        repeat: "session",
        resetTimer: { turns: 5 },
        label: (npc, ctx) => { const e = pickNPCLoreFact(npc, ctx, "topic"); return e ? `Ask about ${e.fact.topic}` : ""; },
        textVariants: [
            (npc, ctx) => { const e = pickNPCLoreFact(npc, ctx, "topic"); return e ? `You ask what they know about ${e.fact.topic}.` : ""; },
            (npc, ctx) => { const e = pickNPCLoreFact(npc, ctx, "topic"); return e ? `You bring up ${e.fact.topic} and let them tell it their way.` : ""; },
            (npc, ctx) => { const e = pickNPCLoreFact(npc, ctx, "topic"); return e ? `You ask what people around here say about ${e.fact.topic}.` : ""; }
        ],
        loreFact: (npc, ctx) => { const e = pickNPCLoreFact(npc, ctx, "topic"); return e ? e.fact.id : ""; },
        contextNote: (npc, ctx) => buildNPCLoreNote(npc, ctx, pickNPCLoreFact(npc, ctx, "topic"), "tell"),
        cacheSig: (npc, ctx) => { const e = pickNPCLoreFact(npc, ctx, "topic"); return e ? e.fact.id + (e.distorted ? "d" : "") : ""; },
        intent: "curious",
        relationshipImpact: { mood: 0, favor: 1, intent: "curious", markMet: true, actionTag: "ask-world-lore" },
        conditions: {
            metPlayer: true,
            maxHostility: 60,
            minFavor: -20,
            custom: (npc, ctx) => ctx.isHumanoid && !!pickNPCLoreFact(npc, ctx, "topic")
        }
    },
    {
        id: "ask-lore-source",
        priority: 43,
        rankBoost: 40,
        repeat: "session",
        label: "Ask how they know that",
        textVariants: [
            "You ask how they came to know that.",
            "You ask whether that is something they saw or only heard.",
            "You ask who told them, and whether they trust it."
        ],
        contextNote: (npc, ctx) => buildNPCLoreNote(npc, ctx, _loreLastHeardEntry(npc, ctx), "source"),
        cacheSig: (npc, ctx) => ctx.lastLoreFactId || "",
        intent: "curious",
        relationshipImpact: { mood: 0, favor: 1, intent: "curious", markMet: true, actionTag: "ask-lore-source" },
        replaces: ["ask-about-lore", "ask-rumor"],
        conditions: {
            maxHostility: 59,
            custom: (npc, ctx) => (ctx.lastOptionId === "ask-about-lore" || ctx.lastOptionId === "ask-rumor") && !!_loreLastHeardEntry(npc, ctx)
        }
    },
    // ===== FOLLOW-UP CHAINS =====
    // A follow-up appears only after its parent was used this conversation
    // (requiredSessionOptionIds) and, via `replaces`, takes the parent's slot
    // so the menu does not grow. Follow-ups rank above generic topics.
    {
        id: "ask-seen-who",
        priority: 31,
        repeat: "session",
        label: "Ask who else was around",
        textVariants: [
            "You ask who else was nearby when they noticed it.",
            "You ask whether anyone else might have seen the same thing.",
            "You ask who they would trust to back up what they saw."
        ],
        intent: "curious",
        relationshipImpact: { mood: 0, favor: 1, intent: "curious", markMet: true, actionTag: "ask-seen-who" },
        replaces: ["ask-seen"],
        conditions: {
            requiredSessionOptionIds: ["ask-seen"],
            maxHostility: 65
        }
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
            // Personal question: needs some rapport or a few exchanges first.
            any: [
                { minFavor: 10 },
                { minInteractionCount: 4 }
            ],
            excludedActionTags: ["ask-background"]
        }
    },
    {
        id: "ask-family",
        priority: 41,
        repeat: "session",
        label: "Ask about home and family",
        textVariants: [
            "You ask whether they have family or anyone waiting for them somewhere.",
            "You ask about the home they came from and who they left there.",
            "You ask who they think of when they think of home."
        ],
        intent: "curious",
        relationshipImpact: { mood: 0, favor: 2, intent: "curious", markMet: true, actionTag: "ask-family" },
        replaces: ["ask-background"],
        conditions: {
            requiredSessionOptionIds: ["ask-background"],
            minFavor: 8,
            maxHostility: 65
        }
    },
    {
        id: "ask-about-topic",
        priority: 45,
        repeat: "always",
        label: (npc, ctx) => `Ask about ${_npcPickAskAboutTopic(npc, ctx)}`,
        text: (npc, ctx) => {
            const topic = _npcPickAskAboutTopic(npc, ctx);
            return _npcRand([
                `You bring up ${topic} and see what they have to say.`,
                `You steer the conversation toward ${topic}.`,
                `You ask them directly about ${topic}.`
            ]);
        },
        intent: "curious",
        relationshipImpact: { mood: 0, favor: 1, intent: "curious", markMet: true, actionTag: "ask-about-topic" },
        conditions: {
            metPlayer: true,
            maxHostility: 70,
            custom: (npc, ctx) => getContextualNPCTopics(npc, ctx).length > 0
        }
    },
    {
        id: "press-topic",
        priority: 46,
        repeat: "always",
        label: (npc, ctx) => ctx && ctx.lastTopic ? `Press for more on ${ctx.lastTopic}` : "Press for more",
        textVariants: [
            (npc, ctx) => `You press for more detail on ${ctx && ctx.lastTopic ? ctx.lastTopic : "that"}.`,
            (npc, ctx) => `You ask them to say more about ${ctx && ctx.lastTopic ? ctx.lastTopic : "that"}.`,
            (npc, ctx) => `You stay on ${ctx && ctx.lastTopic ? ctx.lastTopic : "the subject"} and ask what they have not said yet.`
        ],
        intent: "curious",
        relationshipImpact: { mood: 0, favor: 1, intent: "curious", markMet: true, actionTag: "press-topic" },
        rankBoost: 60,
        // Only right after asking about a topic, so it never piles up.
        conditions: {
            maxHostility: 65,
            custom: (npc, ctx) => ctx.lastOptionId === "ask-about-topic" && !!ctx.lastTopic
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
        id: "rumor-source",
        priority: 71,
        repeat: "session",
        label: "Ask who is behind it",
        textVariants: [
            "You ask who they think is behind it, and how much they actually know.",
            "You ask where the talk started and who keeps it going.",
            "You ask who stands to gain from people believing it."
        ],
        intent: "curious",
        relationshipImpact: { mood: 0, favor: 1, intent: "curious", markMet: true, actionTag: "ask-rumor-source" },
        replaces: ["ask-rumor"],
        conditions: {
            requiredSessionOptionIds: ["ask-rumor"],
            maxHostility: 59,
            minFavor: -20
        }
    },
    {
        id: "rumor-proof",
        priority: 72,
        repeat: "session",
        label: "Ask where you could learn more",
        textVariants: [
            "You ask where someone could confirm any of this for themselves.",
            "You ask who else might be willing to talk about it.",
            "You ask where you would start if you wanted proof."
        ],
        intent: "curious",
        relationshipImpact: { mood: 0, favor: 2, intent: "curious", markMet: true, actionTag: "ask-rumor-proof" },
        replaces: ["rumor-source"],
        conditions: {
            requiredSessionOptionIds: ["rumor-source"],
            maxHostility: 55,
            minFavor: 5
        }
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
            (npc, ctx) => {
                const role = (ctx && ctx.role) || "";
                if (role.includes("guard")) return "You ask if there's been any trouble worth watching for.";
                if (role.includes("healer")) return "You ask if anything's been going around that has people worried.";
                if (role.includes("priest") || role.includes("archivist")) return "You ask if they've noticed any ill omens lately.";
                if (["vendor", "shopkeeper", "merchant", "trader", "bartender", "innkeeper", "blacksmith"].some(tag => role.includes(tag))) {
                    return "You ask if trade's been good, or if something's been eating into it.";
                }
                return "You ask whether they have heard anything worth knowing.";
            },
            (npc, ctx) => {
                const role = (ctx && ctx.role) || "";
                if (role.includes("guard")) return "You ask what's been keeping the watch busy lately.";
                if (role.includes("healer")) return "You ask what ailments have kept them busiest this season.";
                if (role.includes("priest") || role.includes("archivist")) return "You ask what the old stories say about times like these.";
                if (["vendor", "shopkeeper", "merchant", "trader", "bartender", "innkeeper", "blacksmith"].some(tag => role.includes(tag))) {
                    return "You ask what's been moving through the market lately, good or bad.";
                }
                return "You nudge the conversation toward rumors and loose talk.";
            },
            "You invite them to share whispers, gossip, or anything people are not saying openly."
        ],
        intent: "rumor",
        // A real piece of local history this NPC would plausibly have heard.
        loreFact: (npc, ctx) => { const e = pickNPCLoreFact(npc, ctx, "rumor"); return e ? e.fact.id : ""; },
        contextNote: (npc, ctx) => buildNPCLoreNote(npc, ctx, pickNPCLoreFact(npc, ctx, "rumor"), "tell"),
        cacheSig: (npc, ctx) => { const e = pickNPCLoreFact(npc, ctx, "rumor"); return e ? e.fact.id + (e.distorted ? "d" : "") : ""; },
        relationshipImpact: { mood: 0, favor: 2, intent: "curious", markMet: true, actionTag: "ask-rumor" },
        rankBoost: 25,
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
        id: "ask-work-hardest",
        priority: 81,
        repeat: "session",
        label: "Ask what the hardest part is",
        textVariants: [
            "You ask what the hardest part of the work is that outsiders never see.",
            "You ask what makes the job worse than it looks.",
            "You ask what they would change about the work if they could."
        ],
        intent: "curious",
        relationshipImpact: { mood: 0, favor: 2, intent: "curious", markMet: true, actionTag: "ask-work-hardest" },
        replaces: ["ask-work"],
        conditions: {
            requiredSessionOptionIds: ["ask-work"],
            maxHostility: 65
        }
    },
    {
        id: "browse-wares",
        priority: 85,
        repeat: "always",
        label: npc => npc && npc.role ? `Ask the ${npc.role} what they're selling` : "Ask what they have for sale",
        action: "trade",
        conditions: {
            metPlayer: true,
            roleIncludes: ["vendor", "shopkeeper", "merchant", "trader", "bartender", "innkeeper", "blacksmith"],
            maxHostility: 79,
            minFavor: -69
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
        id: "ask-remedies",
        priority: 92,
        repeat: "session",
        label: "Ask about remedies and ailments",
        textVariants: [
            "You ask what's been going around and how they've been treating it.",
            "You ask whether they've seen anything unusual sicken folk lately.",
            "You ask what remedies they keep close at hand for the worst cases."
        ],
        intent: "curious",
        relationshipImpact: { mood: 0, favor: 2, intent: "curious", markMet: true, actionTag: "ask-remedies" },
        conditions: {
            roleIncludes: ["healer"],
            maxHostility: 70,
            excludedActionTags: ["ask-remedies"]
        }
    },
    {
        id: "ask-repairs",
        priority: 94,
        repeat: "session",
        label: "Ask about repairs and craftsmanship",
        textVariants: [
            "You ask what it takes to keep gear from failing when it matters most.",
            "You ask about the trickiest repair they've had to make lately.",
            "You ask what separates a good repair from a rushed one."
        ],
        intent: "curious",
        relationshipImpact: { mood: 0, favor: 2, intent: "curious", markMet: true, actionTag: "ask-repairs" },
        conditions: {
            roleIncludes: ["blacksmith", "smith"],
            maxHostility: 70,
            excludedActionTags: ["ask-repairs"]
        }
    },
    {
        id: "ask-lore",
        priority: 96,
        repeat: "session",
        label: (npc, ctx) => (ctx && ctx.role || "").includes("priest") ? "Ask about omens and old rites" : "Ask about the old records",
        textVariants: [
            (npc, ctx) => (ctx && ctx.role || "").includes("priest")
                ? "You ask what omens or old rites still shape how people here live."
                : "You ask what the old records say about how this place came to be.",
            (npc, ctx) => (ctx && ctx.role || "").includes("priest")
                ? "You ask what faith looks like for the people who actually live here."
                : "You ask what's been lost, misfiled, or simply forgotten in the archives.",
            "You ask what history they think outsiders always get wrong."
        ],
        intent: "curious",
        relationshipImpact: { mood: 0, favor: 2, intent: "curious", markMet: true, actionTag: "ask-lore" },
        conditions: {
            roleIncludes: ["priest", "archivist"],
            maxHostility: 70,
            excludedActionTags: ["ask-lore"]
        }
    },
    {
        id: "ask-deity",
        priority: 95,
        repeat: "session",
        label: "Ask about the old gods",
        textVariants: [
            "You ask which of the old gods still hold sway around here.",
            "You ask what they know of the gods people still pray to.",
            "You ask if any deity's name comes up more than the others."
        ],
        intent: "curious",
        relationshipImpact: { mood: 0, favor: 2, intent: "curious", markMet: true, actionTag: "ask-deity" },
        conditions: {
            roleIncludes: ["priest", "archivist", "cultist"],
            maxHostility: 70,
            excludedActionTags: ["ask-deity"]
        }
    },
    // Distinct from "ask-deity" above (generic lore, gated by role) - this
    // is for an NPC who personally follows a specific deity (npc.deity,
    // set once when they were generated inside a shrine room - see
    // spawnNPCsForRoom in cyoaftw-engine-CORE.js). hasOwnDeity gates it to
    // exactly those NPCs, regardless of role.
    {
        id: "ask-their-deity",
        priority: 96,
        repeat: "session",
        label: "Ask who they pray to",
        textVariants: [
            "You ask which god or spirit they personally hold to.",
            "You ask who they kneel before when no one else is watching.",
            "You ask, plainly, who they pray to."
        ],
        intent: "curious",
        relationshipImpact: { mood: 0, favor: 2, intent: "curious", markMet: true, actionTag: "ask-their-deity" },
        conditions: {
            hasOwnDeity: true,
            minFavor: 10,
            maxHostility: 70,
            excludedActionTags: ["ask-their-deity"]
        }
    },
    {
        id: "ask-recipe",
        priority: 97,
        repeat: "session",
        label: "Ask about the local fare",
        textVariants: [
            "You ask what dish they're proudest of putting together.",
            "You ask where they source the ingredients that are hardest to come by.",
            "You ask what the locals actually order versus what's on the sign."
        ],
        intent: "curious",
        relationshipImpact: { mood: 0, favor: 2, intent: "curious", markMet: true, actionTag: "ask-recipe" },
        conditions: {
            roleIncludes: ["cook"],
            maxHostility: 70,
            excludedActionTags: ["ask-recipe"]
        }
    },
    {
        id: "ask-mines",
        priority: 98,
        repeat: "session",
        label: "Ask about the tunnels and the work below",
        textVariants: [
            "You ask what it's like working the tunnels day after day.",
            "You ask if they've struck anything worth talking about lately.",
            "You ask what dangers they watch for underground that outsiders never think of."
        ],
        intent: "curious",
        relationshipImpact: { mood: 0, favor: 2, intent: "curious", markMet: true, actionTag: "ask-mines" },
        conditions: {
            roleIncludes: ["miner"],
            maxHostility: 70,
            excludedActionTags: ["ask-mines"]
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
            minFavor: 8,
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
        intent: "apology",
        // Only offered when there is something to apologize for.
        conditions: {
            custom: (npc, ctx) => _npcPlayerCausedFriction(ctx)
        }
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
        // Needs both a reason (hurt, rattled, sour mood, recent trouble) and
        // an NPC who is not too hostile to accept it.
        conditions: {
            any: [
                { minFavor: 5 },
                { maxHostility: 55 }
            ],
            custom: (npc, ctx) => _npcNeedsComfort(npc, ctx)
        }
    },

    {
        id: "insult",
        priority: 155,
        repeat: "session",
        label: "Insult them",
        textVariants: [
            "You let a barbed remark slip, aimed right where it'll sting.",
            "You cut them down with a few well-chosen words.",
            "You don't bother being kind about it and say exactly what you think."
        ],
        intent: "insult",
        relationshipImpact: { mood: -2, favor: -8, hostility: 6, aggression: 1, attraction: -3, intent: "insult", markMet: true, actionTag: "insult" }
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
    // ===== PLAYER-PERSONALITY OPTIONS =====
    // Gated on the traits tallied from the character-creation questions
    // (setupPage3 / selectPersonality -> G.player.traits). minPlayerTraits
    // requires that trait to have been picked in both of its two
    // opportunities, so this reflects a clearly established personality
    // rather than a single coin-flip answer.
    {
        id: "ask-details",
        priority: 182,
        repeat: "session",
        resetTimer: { turns: 5 },
        label: "Ask about the small details",
        textVariants: [
            "You ask about the small details most people would not think to mention.",
            "You point out something easy to miss and ask them about it directly.",
            "You press for specifics instead of letting the answer stay vague."
        ],
        intent: "curious",
        relationshipImpact: { mood: 0, favor: 2, intent: "curious", markMet: true, actionTag: "ask-details" },
        conditions: {
            metPlayer: true,
            maxHostility: 70,
            minPlayerTraits: { curiosity: 2 },
            excludedActionTags: ["ask-details"]
        }
    },
    {
        id: "listen-closely",
        priority: 184,
        repeat: "session",
        resetTimer: { turns: 5 },
        label: "Listen closely",
        textVariants: [
            "You set your own agenda aside and really listen to what they are saying.",
            "You give them your full attention and let them lead the conversation.",
            "You hold back your own questions and just listen for a while."
        ],
        intent: "empathy",
        relationshipImpact: { mood: 1, favor: 4, hostility: -2, intent: "empathy", markMet: true, actionTag: "listen-closely" },
        conditions: {
            metPlayer: true,
            maxHostility: 75,
            minPlayerTraits: { empathy: 2 },
            excludedActionTags: ["listen-closely"]
        }
    },
    {
        id: "push-for-answers",
        priority: 186,
        repeat: "session",
        resetTimer: { turns: 5 },
        label: "Push for a straight answer",
        textVariants: [
            "You hold your ground and push for a straight answer, no dodging.",
            "You refuse to let the question slide and press them to answer plainly.",
            "You stand firm and make it clear you are not leaving without an answer."
        ],
        intent: "bold",
        relationshipImpact: (npc, ctx) => ctx.hostility >= 50
            ? { mood: -1, favor: -3, hostility: 4, intent: "bold", markMet: true, actionTag: "push-for-answers" }
            : { mood: 0, favor: 3, hostility: 1, intent: "bold", markMet: true, actionTag: "push-for-answers" },
        conditions: {
            metPlayer: true,
            minPlayerTraits: { boldness: 2 },
            excludedActionTags: ["push-for-answers"]
        }
    },
    // -- Stat-gated options (minStats / maxStats conditions) --------------
    // Examples of the stat thresholds: the player's live stat (base + status
    // effects + gear/hygiene for charisma) must meet the threshold for the
    // option to appear at all. Kept chaste - anything beyond a friendly
    // charm belongs in the NSFW catalogue.
    {
        id: "steady-nerve",
        priority: 187,
        repeat: "session",
        resetTimer: { turns: 6 },
        label: "Hold their gaze and stay steady",
        textVariants: [
            "You hold their gaze without flinching and let the silence settle.",
            "You don't give an inch. Your voice stays level and your eyes stay on theirs.",
            "You stand your ground, calm and unhurried, and wait for them to blink first."
        ],
        intent: "bold",
        relationshipImpact: { mood: 0, favor: 1, hostility: -2, intent: "bold", markMet: true, actionTag: "steady-nerve", statXP: { willpower: 1 } },
        conditions: {
            minHostility: 50,
            minStats: { willpower: 5 },
            excludedActionTags: ["steady-nerve"]
        }
    },
    {
        id: "win-them-over",
        priority: 188,
        repeat: "session",
        resetTimer: { turns: 6 },
        label: "Turn on the charm",
        textVariants: [
            "You lean on an easy smile and a few warm words, and watch them loosen up.",
            "You turn on your most disarming charm and let it do the work.",
            "You pitch your tone friendly and unforced, and they seem to soften."
        ],
        intent: "flattery",
        relationshipImpact: { mood: 1, favor: 5, hostility: -1, attraction: 4, intent: "flattery", markMet: true, actionTag: "win-them-over" },
        // Rolled at click time (see classifyConversationChoice). Average or
        // low Charisma, a grubby appearance, or not being their type all make
        // this land less often.
        socialCheck: {
            baseDC: 12,
            success: { mood: 1, favor: 5, hostility: -1, attraction: 4, intent: "flattery", markMet: true, actionTag: "win-them-over" },
            failure: { mood: 0, favor: 0, intent: "flattery", markMet: true, actionTag: "charm-fell-flat" },
            critFail: { mood: -1, favor: -2, hostility: 1, intent: "awkward", markMet: true, actionTag: "charm-backfired" }
        },
        conditions: {
            maxHostility: 49,
            minStats: { charisma: 5 },
            excludedActionTags: ["win-them-over"]
        }
    },
    // ===== GUIDE =====
    // Only the opening-guide NPC (npc.guide) gets these. They float to the top
    // of the menu (rankBoost) until the player has what they need.
    {
        id: "guide-first-step",
        priority: 1,
        rankBoost: 90,
        repeat: "session",
        resetTimer: { turns: 4 },
        label: (npc, ctx) => ctx.storyFlags && ctx.storyFlags["guide-oriented"] ? "Ask about the plan again" : "Ask what to do first",
        textVariants: [
            "You ask what you should do first.",
            "You ask where the two of you should begin.",
            "You ask what the plan is."
        ],
        guideBeat: "plan",
        contextNote: () => _guideNote("plan"),
        cacheSig: (npc, ctx) => ctx.storyFlags && ctx.storyFlags["guide-oriented"] ? "oriented" : "new",
        intent: "curious",
        relationshipImpact: { mood: 1, favor: 2, intent: "curious", markMet: true, actionTag: "guide-plan" },
        conditions: { custom: (npc) => _npcIsGuide(npc) }
    },
    {
        id: "guide-about-town",
        priority: 2,
        rankBoost: 70,
        repeat: "session",
        resetTimer: { turns: 8 },
        label: "Ask what they make of the town",
        textVariants: [
            "You ask what they make of the town so far.",
            "You ask for their first impression of the place.",
            "You ask whether the town is what they expected."
        ],
        contextNote: () => _guideNote("town"),
        intent: "curious",
        relationshipImpact: { mood: 0, favor: 1, intent: "curious", markMet: true, actionTag: "guide-town" },
        conditions: { custom: (npc) => _npcIsGuide(npc) }
    },
    {
        id: "guide-shared-past",
        priority: 3,
        rankBoost: 60,
        repeat: "session",
        resetTimer: { turns: 10 },
        label: "Talk about how you got here",
        textVariants: [
            "You ask them to remind you how the two of you ended up here.",
            "You say it feels strange to be here, and ask how it all began.",
            "You ask whether they ever thought it would come to this."
        ],
        contextNote: () => _guideNote("past"),
        intent: "empathy",
        relationshipImpact: { mood: 1, favor: 2, intent: "empathy", markMet: true, actionTag: "guide-past" },
        conditions: { custom: (npc) => _npcIsGuide(npc) }
    },
    {
        id: "guide-how-sure",
        priority: 4,
        rankBoost: 80,
        repeat: "session",
        label: "Ask how sure they are",
        textVariants: [
            "You ask how sure they are about that lead.",
            "You ask what they actually know, and what is only talk.",
            "You ask whether they would stake anything on it."
        ],
        contextNote: () => _guideNote("trust"),
        intent: "curious",
        relationshipImpact: { mood: 0, favor: 1, intent: "curious", markMet: true, actionTag: "guide-trust" },
        conditions: {
            requiredSessionOptionIds: ["guide-first-step"],
            custom: (npc) => _npcIsGuide(npc)
        }
    },
    // Lead payoff: with the guide's plan heard, asking the current lead's
    // question of someone in that lead's building moves the opening arc along
    // (see ARCHETYPE_LEADS in cyoaftw-world-data.js, onLeadPayoff in the
    // engine). Any civil local can answer; the reveal text is the only fact
    // they are told to give.
    {
        id: "lead-stage-ask",
        priority: 1,
        rankBoost: 95,
        repeat: "session",
        resetTimer: { turns: 6 },
        label: (npc, ctx) => { const st = _leadStageFor(npc); return st ? st.ask : "Ask around"; },
        textVariants: [
            "You ask what you came here to find out.",
            "You lower your voice and ask what you came to ask.",
            "You say you were told this was the place to ask."
        ],
        guideBeat: "lead",
        contextNote: () => { const st = _leadStageFor(null); return st ? "The player asks something you can answer. Answer in your own voice, briefly: " + st.reveal : ""; },
        cacheSig: () => { const st = _leadStageFor(null); return "lead" + (st ? st.idx : "x"); },
        intent: "curious",
        relationshipImpact: { mood: 0, favor: 1, intent: "curious", markMet: true, actionTag: "lead-ask" },
        conditions: { maxHostility: 49, custom: (npc, ctx) => !!_leadStageFor(npc) }
    },
    // Party: the guide asks once after the first step (see maybeOfferGuideParty
    // in the engine); these two are the standing way to change your mind. Both
    // are answered by scripted lines (handleGuidePartyChoice).
    {
        id: "guide-join-party",
        priority: 6,
        rankBoost: 65,
        repeat: "always",
        label: "Ask them to come along",
        text: "You ask whether they would travel with you.",
        textVariants: ["You ask whether they would travel with you."],
        guideParty: "accept",
        intent: "talk",
        relationshipImpact: { mood: 1, favor: 2, intent: "talk", markMet: true, actionTag: "guide-party" },
        conditions: { custom: (npc) => _npcIsGuide(npc) && !npc._inParty && _guideOrientedOrOffered() && !_guideOfferPending(npc) }
    },
    {
        id: "guide-leave-party",
        priority: 7,
        rankBoost: 5,
        kind: "action",
        repeat: "always",
        label: "Ask them to wait here",
        text: "You ask them to wait here until you come back.",
        textVariants: ["You ask them to wait here until you come back."],
        guideParty: "leave",
        intent: "talk",
        relationshipImpact: { mood: 0, favor: 0, intent: "talk", markMet: true, actionTag: "guide-party" },
        conditions: { custom: (npc) => _npcIsGuide(npc) && !!npc._inParty }
    },
    // Free-text bridge. When the NPC's last line expects an answer the engine
    // shows this as "Respond..." (kind "reply", with any canned replies from the
    // reply JSON next to it); otherwise it stays available as a quiet
    // "Say something..." action. The engine handles action "respond" by
    // swapping the menu for a text box. Not subject to the topic cap.
    {
        id: "respond-free",
        priority: 5,
        repeat: "always",
        kind: (npc, ctx) => _npcResponseIsPending(npc) ? "reply" : "action",
        label: (npc, ctx) => _npcResponseIsPending(npc) ? "Respond..." : "Say something...",
        action: "respond",
        conditions: { metPlayer: true }
    },
    {
        id: "goodbye",
        priority: 190,
        label: "Say goodbye",
        text: "You say goodbye and step away.",
        action: "disengage",
        intent: "goodbye",
        relationshipImpact: { mood: 0, favor: 1, intent: "goodbye", markMet: true, actionTag: "goodbye" }
    },
    // ===== NSFW OPTIONS =====
    // NSFW catalogue entries (flirt / seduce / proposition / touch_intimately /
    // start_intimacy) live in cyoaftw-npc-data-nsfw.js and are merged into the
    // active catalogue at query time via window.NPC_NSFW_CONVERSATION_CATALOGUE.
    // Do NOT re-inline them here; keeping them out keeps this file readable by
    // SFW-only tooling.
];

// Export catalogue to window immediately after definition for NSFW system access
if (typeof window !== "undefined") {
    window.NPC_CONVERSATION_CATALOGUE = NPC_CONVERSATION_CATALOGUE;
}

// Player's live stat values (base + status effects + gear/hygiene for
// charisma, via getSetupStat in cyoaftw-engine-CORE.js) for the minStats /
// maxStats conditions. Guarded with typeof so this file keeps working when
// loaded standalone or before the engine payload exposes getSetupStat.
function _npcGetPlayerStats() {
    var out = {};
    if (typeof getSetupStat !== "function") return out;
    ["physicalProwess", "flexibility", "willpower", "endurance", "charisma"].forEach(function (statKey) {
        out[statKey] = getSetupStat(statKey, 3);
    });
    return out;
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
        // Single stat pool: npc.memory.* (see migrateNPCRelationshipPool —
        // the old NSFW-side npc.relationship.* values are folded in once,
        // and every writer now targets memory.*).
        attraction: (npc.memory && typeof npc.memory.attraction === "number" ? npc.memory.attraction : 0),
        lust: (npc.memory && typeof npc.memory.lust === "number" ? npc.memory.lust : 0),
        arousal: (npc.memory && typeof npc.memory.arousal === "number" ? npc.memory.arousal : 0),
        disinhibition: (npc.memory && typeof npc.memory.disinhibition === "number" ? npc.memory.disinhibition : 0),
        orientation: String((npc.memory && npc.memory.orientation) || "bi").toLowerCase(),
        actDisinhibition: (npc.memory && npc.memory.actDisinhibition && typeof npc.memory.actDisinhibition === "object" ? npc.memory.actDisinhibition : {}),
        metPlayer: !!(npc.memory && npc.memory.metPlayer),
        nameKnown: !!(npc.memory && npc.memory.nameKnown),
        everGreeted: !!(npc.memory && npc.memory.everGreeted),
        mood: String(npc.memory && npc.memory.lastMood || "neutral").toLowerCase(),
        disposition: typeof getCurrentNPCDisposition === "function"
            ? String(getCurrentNPCDisposition(npc) || "").toLowerCase()
            : "neutral",
        relationship: typeof getRelationshipLabel === "function"
            ? String(getRelationshipLabel(npc) || "").toLowerCase()
            : "neutral",
        isHumanoid: npc.isHumanoid === true,
        // True for a civilized NPC generated inside a shrine room, who was
        // assigned that shrine's deity as their own (npc.deity - see
        // spawnNPCsForRoom in cyoaftw-engine-CORE.js). Gates "ask-their-deity".
        hasOwnDeity: !!npc.deity,
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
        lastTopic: conversationState && typeof conversationState.lastTopic === "string"
            ? conversationState.lastTopic
            : "",
        lastLoreFactId: conversationState && typeof conversationState.lastLoreFactId === "string"
            ? conversationState.lastLoreFactId
            : "",
        optionUsage: conversationState && conversationState.optionUsage && typeof conversationState.optionUsage === "object"
            ? { ...conversationState.optionUsage }
            : {},
        storyTurn: story && typeof story.turnCounter === "number" ? story.turnCounter : 0,
        storyEventCounter: story && typeof story.eventCounter === "number" ? story.eventCounter : 0,
        storyFlags: story && story.flags && typeof story.flags === "object" ? story.flags : {},
        storyRecentEvents: story && Array.isArray(story.recentEvents) ? story.recentEvents.slice() : [],
        externalState,
        // Player personality profile from the character-creation questions
        // (see getPlayerTraitCounts/getPlayerDominantTrait in cyoaftw-engine-CORE.js).
        // Guarded with typeof so this file keeps working even if loaded
        // standalone or before the engine payload defines those helpers.
        playerTraits: typeof getPlayerTraitCounts === "function" ? getPlayerTraitCounts() : {},
        playerDominantTrait: typeof getPlayerDominantTrait === "function"
            ? String(getPlayerDominantTrait() || "").toLowerCase()
            : "",
        // Live player stat values for minStats/maxStats conditions.
        playerStats: _npcGetPlayerStats()
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
    if (typeof conditions.nameKnown === "boolean" && ctx.nameKnown !== conditions.nameKnown) return false;
    if (typeof conditions.isHumanoid === "boolean" && ctx.isHumanoid !== conditions.isHumanoid) return false;
    if (typeof conditions.romanceEligible === "boolean" && ctx.romanceEligible !== conditions.romanceEligible) return false;
    if (typeof conditions.hasOwnDeity === "boolean" && ctx.hasOwnDeity !== conditions.hasOwnDeity) return false;
    if (typeof conditions.tradeAvailable === "boolean" && ctx.tradeAvailable !== conditions.tradeAvailable) return false;

    if (conditions.species && !_npcValueInList(ctx.species, conditions.species)) return false;
    if (conditions.excludeSpecies && _npcValueInList(ctx.species, conditions.excludeSpecies)) return false;
    if (conditions.temperaments && !_npcValueInList(ctx.temperament, conditions.temperaments)) return false;
    if (conditions.excludeTemperaments && _npcValueInList(ctx.temperament, conditions.excludeTemperaments)) return false;
    if (conditions.relationships && !_npcValueInList(ctx.relationship, conditions.relationships)) return false;
    if (conditions.dispositions && !_npcValueInList(ctx.disposition, conditions.dispositions)) return false;
    if (conditions.requiredPlayerTraits && !_npcValueInList(ctx.playerDominantTrait, conditions.requiredPlayerTraits)) return false;
    if (conditions.excludedPlayerTraits && _npcValueInList(ctx.playerDominantTrait, conditions.excludedPlayerTraits)) return false;
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
    if (conditions.minActDisinhibition && typeof conditions.minActDisinhibition === "object") {
        var actMap = ctx.actDisinhibition || {};
        for (var k in conditions.minActDisinhibition) {
            if (!Object.prototype.hasOwnProperty.call(conditions.minActDisinhibition, k)) continue;
            var need = conditions.minActDisinhibition[k];
            if (typeof need !== "number") continue;
            var have = typeof actMap[k] === "number" ? actMap[k] : 0;
            if (have < need) return false;
        }
    }
    if (conditions.maxActDisinhibition && typeof conditions.maxActDisinhibition === "object") {
        var actMapMax = ctx.actDisinhibition || {};
        for (var kMax in conditions.maxActDisinhibition) {
            if (!Object.prototype.hasOwnProperty.call(conditions.maxActDisinhibition, kMax)) continue;
            var cap = conditions.maxActDisinhibition[kMax];
            if (typeof cap !== "number") continue;
            var haveMax = typeof actMapMax[kMax] === "number" ? actMapMax[kMax] : 0;
            if (haveMax > cap) return false;
        }
    }
    if (typeof conditions.minAggressionCount === "number" && ctx.aggressionCount < conditions.minAggressionCount) return false;
    if (typeof conditions.maxAggressionCount === "number" && ctx.aggressionCount > conditions.maxAggressionCount) return false;
    if (typeof conditions.minInteractionCount === "number" && ctx.interactionCount < conditions.minInteractionCount) return false;
    if (typeof conditions.maxInteractionCount === "number" && ctx.interactionCount > conditions.maxInteractionCount) return false;
    if (typeof conditions.minSessionInteractionCount === "number" && ctx.sessionInteractionCount < conditions.minSessionInteractionCount) return false;
    if (typeof conditions.maxSessionInteractionCount === "number" && ctx.sessionInteractionCount > conditions.maxSessionInteractionCount) return false;

    // Player personality thresholds, e.g. { curiosity: 2 } requires the
    // player to have picked "curiosity" at least twice during setup.
    if (conditions.minPlayerTraits && typeof conditions.minPlayerTraits === "object") {
        const playerTraits = ctx.playerTraits || {};
        const meetsAll = Object.keys(conditions.minPlayerTraits).every(function (traitKey) {
            const need = conditions.minPlayerTraits[traitKey];
            const have = typeof playerTraits[traitKey] === "number" ? playerTraits[traitKey] : 0;
            return have >= need;
        });
        if (!meetsAll) return false;
    }

    // Player stat thresholds, e.g. { charisma: 5 } requires the player's
    // current (gear/status-adjusted) Charisma to be at least 5. minStats and
    // maxStats are checked independently, so both can be used together for a
    // band. A stat missing from ctx.playerStats reads as the default 3.
    if (conditions.minStats && typeof conditions.minStats === "object") {
        const statsNow = ctx.playerStats || {};
        const meetsMinStats = Object.keys(conditions.minStats).every(function (statKey) {
            const need = conditions.minStats[statKey];
            if (typeof need !== "number") return true;
            const have = typeof statsNow[statKey] === "number" ? statsNow[statKey] : 3;
            return have >= need;
        });
        if (!meetsMinStats) return false;
    }
    if (conditions.maxStats && typeof conditions.maxStats === "object") {
        const statsNowMax = ctx.playerStats || {};
        const meetsMaxStats = Object.keys(conditions.maxStats).every(function (statKey) {
            const cap = conditions.maxStats[statKey];
            if (typeof cap !== "number") return true;
            const have = typeof statsNowMax[statKey] === "number" ? statsNowMax[statKey] : 3;
            return have <= cap;
        });
        if (!meetsMaxStats) return false;
    }

    if (conditions.requiredActionTags && !_npcActionTagsInclude(ctx.actionTags, conditions.requiredActionTags)) return false;
    if (conditions.excludedActionTags && _npcNormalizeList(conditions.excludedActionTags)
        .some(tag => _npcActionTagsInclude(ctx.actionTags, [tag]))) {
        return false;
    }

    if (typeof conditions.custom === "function" && conditions.custom(ctx.npc, ctx) === false) return false;

    // Phase 2 conditions: location and privacy checks
    if (conditions.locationCheck === "private") {
      const room = ctx.room;
      if (!room) return false;
      if (typeof isPrivateLocation === "function") {
        if (!isPrivateLocation(room)) return false;
      } else {
        const privateTypes = ["Guest Room", "Inn", "Inn Common", "Bedroom", "Cellar", "Dark Alleyway", "Vault", "Chamber", "Tower"];
        const roomType = room.type || room.displayName || "";
        const roomRole = room.role || "";
        const isPrivate = privateTypes.some(t => 
          roomType.toLowerCase().includes(t.toLowerCase()) ||
          roomRole.toLowerCase().includes(t.toLowerCase())
        );
        if (!isPrivate) return false;
      }
    }

    if (conditions.aloneWithTarget === true) {
      const room = ctx.room;
      if (!room) return false;
      if (!room.creatures) return false;
      
      if (typeof isAloneWithTarget === "function") {
        if (!isAloneWithTarget(room, ctx.npc)) return false;
      } else {
        let othersPresent = 0;
        for (const creature of room.creatures) {
          if (creature.isPlayer) continue;
          if (creature === ctx.npc) continue;
          if (creature.isHumanoid || creature.humanoid) {
            othersPresent++;
          }
        }
        if (othersPresent > 0) return false;
      }
    }

    if (conditions.intimacyActive !== undefined) {
      const isActive = ctx.npc.intimacy && ctx.npc.intimacy.encounter && ctx.npc.intimacy.encounter.active;
      if (conditions.intimacyActive !== isActive) return false;
    }

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

    // Greeting-gate self-heal: greet-intro is "never" repeatable on the
    // assumption that using it sets metPlayer. If the NPC's memory lost that
    // flag (old save, regenerated memory, impact that never landed), the
    // intro must come back — otherwise the greeting gate leaves the player
    // with nothing but "Say goodbye" for the rest of the game.
    if (optionId === "greet-intro" && ctx && ctx.metPlayer === false) {
        return true;
    }

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

// Menu grouping for the chat UI. Entries may set `kind` explicitly
// ("topic" | "social" | "action" | "exit"); otherwise it is derived:
//   exit   - disengage actions (goodbye)
//   action - anything that does something mechanical (trade, follow, intimacy
//            passthroughs, function actions)
//   social - tone options aimed at the NPC's feelings (compliment, apologize...)
//   topic  - everything else (questions / conversation subjects)
// `tone` ("hostile" | "friendly") only matters for social options.
const NPC_SOCIAL_INTENTS = [
    "flattery", "apology", "comfort", "calm", "empathy", "help", "tease",
    "flirt", "aggression", "insult", "bold", "awkward", "greeting"
];
const NPC_HOSTILE_INTENTS = ["aggression", "insult", "bold"];

function _npcDeriveOptionKind(entry, intent, npc, ctx) {
    if (entry && typeof entry.kind === "function") {
        const resolved = entry.kind(npc, ctx);
        if (typeof resolved === "string" && resolved) return resolved;
    }
    if (entry && typeof entry.kind === "string" && entry.kind) return entry.kind;
    if (!entry) return "topic";
    if (entry.action === "disengage" || entry.id === "goodbye") return "exit";
    if (entry.action || entry.intimacyAction || entry.startEncounter) return "action";
    if (NPC_SOCIAL_INTENTS.indexOf(String(intent || "").toLowerCase()) >= 0) return "social";
    return "topic";
}

function _npcDeriveOptionTone(entry, intent) {
    if (entry && typeof entry.tone === "string" && entry.tone) return entry.tone;
    return NPC_HOSTILE_INTENTS.indexOf(String(intent || "").toLowerCase()) >= 0 ? "hostile" : "friendly";
}

function buildConversationOption(entry, npc, ctx) {
    const optionId = String(entry.id || "").trim();
    const label = _npcPickConversationVariant(npc, `${optionId}:label`, entry.labelVariants, entry.label, ctx);
    // Do NOT resolve the action property via _npcResolveConversationValue —
    // if it's a function (like ask-to-follow/stop-following/make-a-move), we
    // need to pass it through as a function reference so it fires on click,
    // not during menu rendering. String actions ("trade", "intimacy", etc.)
    // pass through unchanged.
    const action = typeof entry.action === "function" ? entry.action : _npcResolveConversationValue(entry.action, npc, ctx);
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
    const isInquiry = entry.isInquiry === true;
    // Options whose content depends on live state (e.g. a specific story
    // event) can set cacheSig; when it changes, any reply cached for this
    // option id belongs to the old state and is discarded before the menu's
    // prefetch check runs.
    if (entry.cacheSig !== undefined && npc && npc.memory) {
        const sig = String(_npcResolveConversationValue(entry.cacheSig, npc, ctx));
        if (!npc.memory.cachedReplySigs || typeof npc.memory.cachedReplySigs !== "object") npc.memory.cachedReplySigs = {};
        if (npc.memory.cachedReplySigs[optionId] !== sig) {
            if (typeof removeCachedConversationReply === "function") removeCachedConversationReply(npc, optionId);
            npc.memory.cachedReplySigs[optionId] = sig;
        }
    }
    const resolvedIntent = _npcResolveConversationValue(entry.intent, npc, ctx);
    return {
        id: entry.id,
        kind: _npcDeriveOptionKind(entry, resolvedIntent, npc, ctx),
        tone: _npcDeriveOptionTone(entry, resolvedIntent),
        label,
        text: playerText,
        promptText: promptText || playerText,
        contextNote: String(_npcResolveConversationValue(entry.contextNote, npc, ctx) || ""),
        // World-lore fact this option tells (recorded once chosen, see recordNPCConversationChoice).
        loreFactId: entry.loreFact ? String(_npcResolveConversationValue(entry.loreFact, npc, ctx) || "") : "",
        revealsName: entry.revealsName !== undefined ? _npcResolveConversationValue(entry.revealsName, npc, ctx) === true : false,
        action,
        intent: resolvedIntent,
        className: _npcResolveConversationValue(entry.className, npc, ctx),
        relationshipImpact: impact && typeof impact === "object" ? { ...impact } : impact,
        isInquiry: isInquiry,
        onAccept: entry.onAccept,
        onReject: entry.onReject,
        resetTimer: entry.resetTimer,
        // Resolved at click time by classifyConversationChoice (engine).
        socialCheck: entry.socialCheck,
        // Intimacy system additions
        intimacyAction: entry.intimacyAction,
        startEncounter: entry.startEncounter,
        phase: entry.phase,
        // Opening-guide story beat (see onGuideBeat in the engine).
        guideBeat: entry.guideBeat,
        guideParty: entry.guideParty
    };
}

function queryConversationCatalogue(npc, extraContext = {}) {
    console.log("[NPC Data] queryConversationCatalogue called with NPC:", npc ? npc.name || npc.id : "null");
    if (!npc) return [];

    // Self-heal a half-updated state BEFORE the context snapshot: everGreeted
    // implies metPlayer. If an old save or a failed impact left everGreeted
    // true but metPlayer false, greet-known (conditions: metPlayer) would
    // never show.
    if (npc.memory && npc.memory.everGreeted === true && npc.memory.metPlayer !== true) {
        npc.memory.metPlayer = true;
    }

    const ctx = getNPCConversationContext(npc, extraContext);
    if (!ctx) return [];

    const everGreeted = npc.memory && npc.memory.everGreeted === true;
    const greetedThisSession = ctx.sessionUsedOptionIds && (
        ctx.sessionUsedOptionIds.includes("greet-intro") ||
        ctx.sessionUsedOptionIds.includes("greet-known") ||
        ctx.sessionUsedOptionIds.some(id => typeof id === "string" && id.indexOf("greet-") === 0)
    );
    
    // Merge local SFW catalogue with the NSFW catalogue (loaded by
    // cyoaftw-npc-data-nsfw.js into window.NPC_NSFW_CONVERSATION_CATALOGUE).
    // Deduplicate by ID, giving priority to the NSFW catalogue options.
    // Keep this merge intact: it is the link that lets SFW tooling edit the
    // base catalogue without touching NSFW content.
    const windowCatalogue = window.NPC_NSFW_CONVERSATION_CATALOGUE || [];
    console.log("[NPC Data] Window catalogue size:", windowCatalogue.length, "options:", windowCatalogue.map(o => o.id));
    console.log("[NPC Data] Base catalogue size:", NPC_CONVERSATION_CATALOGUE.length, "options:", NPC_CONVERSATION_CATALOGUE.map(o => o.id));
    const fullCatalogue = [...NPC_CONVERSATION_CATALOGUE];
    
    // Add window catalogue options, overwriting duplicates
    for (const windowOption of windowCatalogue) {
        const existingIndex = fullCatalogue.findIndex(o => o.id === windowOption.id);
        if (existingIndex >= 0) {
            fullCatalogue[existingIndex] = windowOption;
        } else {
            fullCatalogue.push(windowOption);
        }
    }
    
    // Filter by greeting gate: only greeting and disengage options until greeting in current session
    let filtered = fullCatalogue;
    if (!greetedThisSession) {
        filtered = fullCatalogue.filter(entry => {
            const isGreeting = entry.intent === "greeting" || 
                entry.id === "greet-intro" || 
                entry.id === "greet-known";
            const isDisengage = entry.action === "disengage" || entry.id === "goodbye";
            // "stop-following" is companion management, not small talk — an
            // NPC who is actively following can always be dismissed, even
            // before the session greeting.
            const isCompanionManagement = entry.id === "stop-following";
            return isGreeting || isDisengage || isCompanionManagement;
        });
    }

    const result = filtered
        .filter(entry => conversationRepeatAvailable(entry, ctx))
        .filter(entry => conversationConditionMatches(entry.conditions, ctx))
        .filter(entry => {
          if (entry.id === "follow-seduction-suggestion") {
            return npc && npc._pendingSeductionDestination;
          }
          // Filter out intimacy actions that don't start an encounter
          // These should only appear in the intimacy action menu, not in conversation
          if (entry.action === "intimacy" && !entry.startEncounter) {
            return false;
          }
          return true;
        })
        // `replaces`: a follow-up that is currently available hides the
        // parent(s) it lists, so a chain swaps one button for the next.
        .filter((entry, idx, list) => {
            const entryId = String(entry.id || "").toLowerCase();
            return !list.some(other => other !== entry && other.replaces &&
                _npcNormalizeList(other.replaces).indexOf(entryId) >= 0);
        })
        .sort((a, b) => _npcEntryRank(a) - _npcEntryRank(b))
        .filter(_npcMakeTopicCap(npc, ctx))
        .map(entry => buildConversationOption(entry, npc, ctx))
        .filter(Boolean);
    
    console.log("[NPC Data] queryConversationCatalogue returning", result.length, "options:", result.map(o => o.id));

    // Fallback invariant: while the greeting gate is closed, the menu MUST
    // contain a greeting option — without one the player can only say
    // goodbye and the conversation can never open. If every greet entry
    // was filtered out (unexpected conditions, repeat state, catalogue
    // changes), synthesize a plain greeting.
    if (!greetedThisSession && !result.some(o => o && o.intent === "greeting")) {
        console.warn("[NPC Data] Greeting gate closed with no greeting option — injecting fallback.");
        const fallback = buildConversationOption({
            id: "greet-fallback",
            priority: 12,
            label: "Greet them",
            text: "You offer a simple greeting and wait to see how they answer.",
            intent: "greeting",
            relationshipImpact: { mood: 1, favor: 3, hostility: -1, intent: "greeting", markMet: true, actionTag: "greeting" }
        }, npc, ctx);
        if (fallback) result.unshift(fallback);
    }

    return result;
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
        tone: profile.tone || "",
        styleDescription: profile.styleDescription || "",
        languageNotes: profile.languageNotes || "",
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
        tone: speechProfile.tone,
        styleDescription: speechProfile.styleDescription,
        languageNotes: speechProfile.languageNotes,
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
    const backgroundEntry = _npcRand(NPC_BACKGROUNDS) || {};

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
        articulation: template.articulation || "",
        voice,
        background: backgroundEntry.background || "",
        dialectFlavor: backgroundEntry.dialectFlavor || "",
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
    npc.articulation = enrichment.articulation;
    npc.voice = enrichment.voice;
    npc.background = enrichment.background;
    npc.dialectFlavor = enrichment.dialectFlavor;
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

// ── GIVEN NAMES ─────────────────────────────────────────────────────
// Every NPC is named at creation (npc.givenName) but the player does not
// know it yet: npc.name stays the descriptor ("a female Elf") until the name
// is learned (asked, or revealNPCName called), at which point npc.name
// becomes the given name and the descriptor is kept in npc.descriptorName.
const NPC_GIVEN_NAME_POOLS = {
    Human: {
        male: ["Aldric", "Bram", "Corwin", "Dunstan", "Edmund", "Garrick", "Hale", "Osric", "Tobias", "Wystan", "Marcus", "Perrin"],
        female: ["Adela", "Brenna", "Cecily", "Edda", "Isolde", "Maren", "Nessa", "Rowena", "Tamsin", "Wilma", "Lyra", "Hester"],
        surnames: ["Thatcher", "Marsh", "Fletcher", "Holloway", "Crane", "Ashby", "Penn", "Redd"]
    },
    Elf: {
        male: ["Aelar", "Caelith", "Erevan", "Faelen", "Ilyan", "Lorien", "Sylvar", "Thalion", "Varis"],
        female: ["Aelira", "Caelyn", "Elowen", "Ilaria", "Liriel", "Nyssa", "Sariel", "Thessaly", "Vaelis"]
    },
    Dwarf: {
        male: ["Baldrek", "Dorin", "Gorm", "Hargrim", "Korgan", "Thrain", "Orsik", "Brogar", "Dural"],
        female: ["Bruna", "Dagny", "Gunnhild", "Helga", "Kathra", "Morda", "Sigrun", "Torvi", "Vilma"],
        surnames: ["Ironbrow", "Stonefist", "Deepdelver", "Coalbeard", "Anvilhand", "Rockbiter"]
    },
    Halfling: {
        male: ["Perry", "Milo", "Garret", "Finnan", "Cade", "Osborn", "Wendel", "Tolly"],
        female: ["Rosie", "Lidda", "Merry", "Poppy", "Sunny", "Tilda", "Wren", "Bessie"],
        surnames: ["Goodbarrel", "Brushgather", "Underbough", "Tealeaf", "Greenbottle"]
    },
    Dragonborn: {
        male: ["Arjhan", "Balasar", "Donaar", "Kriv", "Medrash", "Torinn", "Rhogar"],
        female: ["Akra", "Biri", "Daar", "Harann", "Kava", "Sora", "Thava", "Nala"]
    },
    Goblin: {
        any: ["Snik", "Grizzle", "Nob", "Krag", "Mizzit", "Zug", "Blotch", "Skritch", "Wazzle", "Pogg"]
    },
    Orc: {
        male: ["Grukk", "Dorag", "Mogrash", "Thokk", "Urzul", "Vargo", "Kargath"],
        female: ["Baggi", "Shagra", "Ulgra", "Yagra", "Mogra", "Volen", "Draka"]
    },
    Skeleton: {
        any: ["Old Marrow", "Rattle", "Tibia", "Clavicus", "Grim", "Femur", "Sorrel", "Brittle", "Oswin"]
    },
    Rat: {
        any: ["Nibbles", "Whisker", "Scratch", "Gnaw", "Squeak", "Mange", "Tatter"]
    },
    Ghost: {
        any: ["Edith", "Alaric", "Mourne", "Veyra", "Cormac", "Isabeau", "Hollis", "Wren"]
    },
    Lizardfolk: {
        any: ["Ssaren", "Thessik", "Kuruss", "Vessa", "Zhiss", "Rasskel", "Ixtli", "Sethra"]
    },
    Kobold: {
        any: ["Yip", "Dink", "Rik", "Skrib", "Tamp", "Zik", "Nubb", "Pip"]
    }
};

function generateNPCGivenName(species, gender) {
    const pool = NPC_GIVEN_NAME_POOLS[species] || NPC_GIVEN_NAME_POOLS[String(species || "")];
    if (!pool) return "Stranger";
    var list = null;
    if (gender === "male" && pool.male) list = pool.male;
    else if (gender === "female" && pool.female) list = pool.female;
    else if (pool.any) list = pool.any;
    else list = (pool.male || []).concat(pool.female || []);
    if (!list.length) return "Stranger";
    var name = list[Math.floor(Math.random() * list.length)];
    if (pool.surnames && Math.random() < 0.5) {
        name += " " + pool.surnames[Math.floor(Math.random() * pool.surnames.length)];
    }
    return name;
}

// Gives the NPC a hidden given name if it has none (new NPCs and old saves).
function ensureNPCGivenName(npc) {
    if (!npc || npc.givenName) return npc;
    if (npc.dead || npc.objectType === "body") return npc;
    npc.descriptorName = npc.descriptorName || npc.name || "";
    npc.givenName = generateNPCGivenName(npc.species, npc.gender);
    if (!npc.memory) npc.memory = {};
    if (typeof npc.memory.nameKnown !== "boolean") npc.memory.nameKnown = false;
    return npc;
}

function npcNameIsKnown(npc) {
    return !!(npc && npc.memory && npc.memory.nameKnown === true);
}

// What the NPC calls itself - used in prompts. Always the real name.
function getNPCSelfName(npc) {
    if (!npc) return "someone";
    return npc.givenName || npc.name || "someone";
}

// Player learns the name: the displayed name switches from the descriptor to
// the given name everywhere (chat labels, narration, story events).
function revealNPCName(npc) {
    if (!npc) return npc;
    ensureNPCGivenName(npc);
    if (!npc.givenName) return npc;
    if (!npc.memory) npc.memory = {};
    npc.memory.nameKnown = true;
    npc.descriptorName = npc.descriptorName || npc.name || "";
    npc.name = npc.givenName;
    return npc;
}

function ensureNPCRelationshipState(npc) {
    if (!npc) return npc;

    npc.memory = npc.memory || {};
    if (typeof npc.memory.nameKnown !== "boolean") npc.memory.nameKnown = false;
    ensureNPCGivenName(npc);
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
    if (typeof npc.memory.lust !== "number") npc.memory.lust = 0;
    if (typeof npc.memory.arousal !== "number") npc.memory.arousal = 0;
    if (typeof npc.memory.disinhibition !== "number") npc.memory.disinhibition = 0;
    if (!npc.memory.actDisinhibition || typeof npc.memory.actDisinhibition !== "object") {
        npc.memory.actDisinhibition = {};
    }
    Object.keys(npc.memory.actDisinhibition).forEach(function (actKey) {
        var v = npc.memory.actDisinhibition[actKey];
        if (typeof v !== "number" || isNaN(v)) v = 0;
        npc.memory.actDisinhibition[actKey] = Math.max(0, Math.min(100, Math.round(v)));
    });

    npc.hostility = Math.max(0, Math.min(100, Math.round(npc.hostility)));
    npc.memory.favorability = Math.max(-100, Math.min(100, Math.round(npc.memory.favorability)));
    npc.memory.attraction = Math.max(0, Math.min(100, Math.round(npc.memory.attraction)));
    npc.memory.arousal = Math.max(0, Math.min(100, Math.round(npc.memory.arousal)));
    npc.memory.disinhibition = Math.max(0, Math.min(100, Math.round(npc.memory.disinhibition)));

    if (!isAdultHumanoidNPC(npc)) {
        npc.memory.attraction = 0;
        npc.memory.arousal = 0;
        npc.memory.disinhibition = 0;
        npc.memory.actDisinhibition = {};
    }

    // Fold the legacy NSFW-side npc.relationship.* pool into memory.* once.
    migrateNPCRelationshipPool(npc);

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

// -- STAT POOL MERGE + ATTRACTION RECOMPUTE -----------------------------------
// Historically the SFW engine tracked romance stats on npc.memory.* while the
// NSFW system tracked them on npc.relationship.* — and the condition reader
// preferred relationship.*, which masked every SFW gain (first impression,
// compliments, charm) once the NSFW system had initialized an NPC. The pools
// are now merged: memory.* is the single source of truth, relationship.* is a
// legacy object that nothing reads or writes anymore.

// One-time merge of the old NSFW pool into the memory pool (sum — each side
// only accumulated from its own sources). Also seeds attractionEarned from
// whatever attraction history exists above the currently computed base, so
// the next recompute preserves it.
function migrateNPCRelationshipPool(npc) {
    if (!npc) return npc;
    const memory = npc.memory = npc.memory || {};
    if (memory._relationshipPoolMerged) return npc;
    memory._relationshipPoolMerged = true;

    const rel = npc.relationship;
    const relAttraction = (rel && typeof rel.attraction === "number") ? rel.attraction : 0;
    const relLust = (rel && typeof rel.lust === "number") ? rel.lust : 0;
    const relOrientation = (rel && rel.orientation) ? String(rel.orientation) : "";

    if (typeof memory.attraction !== "number") memory.attraction = 0;
    if (typeof memory.lust !== "number") memory.lust = 0;
    memory.attraction = Math.max(0, Math.min(100, memory.attraction + relAttraction));
    memory.lust = Math.max(0, Math.min(100, memory.lust + relLust));

    ensureNPCOrientation(npc);
    if (relOrientation && !memory.orientation) memory.orientation = relOrientation;

    // Seed earned from whatever attraction history exists above the computed
    // base — but never overwrite an existing earned history (e.g. a save that
    // already tracks it).
    if (typeof memory.attractionEarned !== "number") {
        memory.attractionEarned = Math.max(0, memory.attraction - computeNPCAttractionBase(npc));
    }
    return npc;
}

// Sexual orientation: seeded deterministically from the NPC's id so it is
// stable across saves and sessions (~70% straight / 20% bi / 10% gay).
function ensureNPCOrientation(npc) {
    if (!npc) return "bi";
    const memory = npc.memory = npc.memory || {};
    if (memory.orientation) return memory.orientation;
    const seedSource = String(npc.id || npc.name || npc.type || "npc");
    let hash = 0;
    for (let i = 0; i < seedSource.length; i++) {
        hash = (hash * 31 + seedSource.charCodeAt(i)) >>> 0;
    }
    const roll = hash % 100;
    memory.orientation = roll < 70 ? "straight" : (roll < 90 ? "bi" : "gay");
    return memory.orientation;
}

// Orientation mismatch is a heavy penalty on the computed base, not a block:
// flirts and other actions still earn attraction on top (see design notes).
const NPC_ORIENTATION_MISMATCH_FACTOR = 0.25;

function _npcGetOrientationFactor(npc) {
    const orientation = String(ensureNPCOrientation(npc) || "bi").toLowerCase();
    if (orientation === "bi") return 1;
    const npcGender = String(npc.gender || "").toLowerCase();
    const playerGender = (typeof G === "object" && G && G.player && G.player.stats && G.player.stats.gender)
        ? String(G.player.stats.gender).toLowerCase()
        : "male";
    const npcLikes = orientation === "straight"
        ? (npcGender === "female" ? "male" : "female")
        : (npcGender === "female" ? "female" : "male");
    return npcLikes === playerGender ? 1 : NPC_ORIENTATION_MISMATCH_FACTOR;
}

// The computed half of attraction: live Charisma (gear, hygiene and potions
// included via getSetupStat), type match, orientation, and — when the player
// is unclothed — a situational term. Re-derived on every interaction start
// so equipping better clothes or cleaning up shifts it.

// Unclothed term: the player wearing nothing registers with the NPC either
// as enticing or as off-putting. It is only a POSITIVE contribution when the
// NPC has enough disinhibition, matches the player's type, matches their
// orientation, and the player's Charisma is above a floor; otherwise it is
// a small penalty (embarrassment/discomfort).
const NPC_UNCLOTHED_BONUS = 8;
const NPC_UNCLOTHED_PENALTY = 5;
const NPC_UNCLOTHED_MIN_DISINHIBITION = 20;
const NPC_UNCLOTHED_MIN_CHARISMA = 5;

// Player unclothed = no top AND no bottom coverage, using the same slot
// mapping as getClothingStateForCharacter in the intimacy system
// (upper/head/chest = top, lower/feet/legs = bottom).
function _npcIsPlayerUnclothed() {
    const player = (typeof G === "object" && G && G.player) ? G.player : null;
    if (!player || !player.equipped) return false;
    const eq = player.equipped;
    const hasTop = !!(eq.upper || eq.head || eq.chest);
    const hasBottom = !!(eq.lower || eq.feet || eq.legs);
    return !hasTop && !hasBottom;
}

function _npcGetUnclothedAttractionTerm(npc, charisma) {
    if (!_npcIsPlayerUnclothed()) return 0;
    const disinhibition = npc.memory && typeof npc.memory.disinhibition === "number"
        ? npc.memory.disinhibition : 0;
    const typeMatch = typeof getNPCTypeMatchScore === "function" ? getNPCTypeMatchScore(npc) : 0;
    const orientationMatch = _npcGetOrientationFactor(npc) === 1;
    const receptive = disinhibition >= NPC_UNCLOTHED_MIN_DISINHIBITION &&
        typeMatch > 0 &&
        orientationMatch &&
        charisma >= NPC_UNCLOTHED_MIN_CHARISMA;
    return receptive ? NPC_UNCLOTHED_BONUS : -NPC_UNCLOTHED_PENALTY;
}

function computeNPCAttractionBase(npc) {
    if (!isAdultHumanoidNPC(npc)) return 0;
    const hostility = typeof npc.hostility === "number" ? npc.hostility : 0;
    if (hostility >= NPC_FIRST_IMPRESSION.hostilityCutoff) return 0;
    const charisma = typeof getSetupStat === "function" ? getSetupStat("charisma", 3) : 3;
    const typeScore = typeof getNPCTypeMatchScore === "function" ? getNPCTypeMatchScore(npc) : 0;
    const orientationFactor = _npcGetOrientationFactor(npc);
    const raw = NPC_FIRST_IMPRESSION.base +
        (typeScore * NPC_FIRST_IMPRESSION.perMatchPoint * orientationFactor) +
        ((charisma - 3) * NPC_FIRST_IMPRESSION.perCharisma);
    const capped = Math.max(0, Math.min(NPC_FIRST_IMPRESSION.max, Math.round(raw)));
    // Situational unclothed term rides on top of the capped base (a naked
    // charmer can exceed the normal first-impression ceiling).
    return capped + _npcGetUnclothedAttractionTerm(npc, charisma);
}

// -- NUDITY REACTIONS (walking into a populated room unclothed) ----------
// The engine's applyNudityReaction runs this per NPC on room entry. An NPC
// whose "type" the player matches exactly (with a compatible orientation)
// is intrigued instead of offended: attraction and lust rise, and a
// sufficiently disinhibited one may call out something appreciative.
// Everyone else civilized bristles — public indecency costs favor and
// earns hostility. Uncivilized humanoids skip the offense (they don't
// care about indecency) unless they match the player's type, in which case
// the intrigued branch above still applies.

const NUDITY_EXACT_MATCH_SCORE = 1.5;   // both type prefs line up
const NUDITY_OFFENDED_HOSTILITY = 7;
const NUDITY_OFFENDED_FAVOR = -3;
const NUDITY_INTRIGUED_ATTRACTION = 4;
const NUDITY_INTRIGUED_LUST = 3;
const NUDITY_CATCALL_MIN_DISINHIBITION = 30;

function _npcPickLine(arr) {
    if (!Array.isArray(arr) || !arr.length) return "";
    return arr[Math.floor(Math.random() * arr.length)];
}

function _npcNudityOffendedLines() {
    return [
        "gasps and looks away, scandalized",
        "splutters, \"Have you no shame?\"",
        "chokes on their drink, staring",
        "mutters, \"For mercy's sake, put something on!\"",
        "raises a hand to shield their eyes",
        "bristles, \"Not in here! Out with you!\""
    ];
}

function _npcNudityFlusteredLines() {
    return [
        "quietly averts their eyes, ears burning",
        "goes very red and studies the floor",
        "coughs and pretends nothing is out of the ordinary"
    ];
}

function _npcNudityCatcallLines(npc) {
    var temperament = String((npc && npc.temperament) || "").toLowerCase();
    var bold = temperament === "bold" || temperament === "forward" ||
        temperament === "lustful" || temperament === "dominant";
    return bold ? [
        "\"Well now — not much left to the imagination, is there?\"",
        "\"Now THAT'S a sight. Careful, you'll cause a scene.\"",
        "\"Looking for attention? Consider it gotten.\"",
        "\"Gods above — you could stop traffic dressed like that. Or not dressed.\""
    ] : [
        "\"I, um — wow. You look... wow.\"",
        "\"You're, uh... really not shy, are you?\"",
        "\"That's... quite the entrance you just made.\""
    ];
}

// One NPC's reaction to the unclothed player entering. Returns
// { stance: "intrigued" | "offended" | "flustered", catcall, line } or null
// when this NPC doesn't react. Stat changes are applied here so the engine
// hook stays a thin narration assembler.
function getNudityReactionForNPC(npc) {
    if (!npc || !isAdultHumanoidNPC(npc)) return null;
    if (!_npcIsPlayerUnclothed()) return null;
    ensureNPCRelationshipState(npc);

    const typeScore = getNPCTypeMatchScore(npc);
    const orientationMatch = _npcGetOrientationFactor(npc) === 1;

    // Exact type match with a compatible orientation: intrigued, not
    // offended — attraction and lust rise, scaled by the player's appeal.
    if (typeScore >= NUDITY_EXACT_MATCH_SCORE && orientationMatch) {
        const appeal = getPlayerAppealMultiplier(npc);
        const attractionGain = Math.max(1, Math.round(NUDITY_INTRIGUED_ATTRACTION * appeal));
        npc.memory.attractionEarned = (typeof npc.memory.attractionEarned === "number" ? npc.memory.attractionEarned : 0) + attractionGain;
        npc.memory.attraction = Math.max(0, Math.min(100, (npc.memory.attraction || 0) + attractionGain));
        npc.memory.lust = Math.max(0, Math.min(100, (npc.memory.lust || 0) + NUDITY_INTRIGUED_LUST));
        const disinhibition = typeof npc.memory.disinhibition === "number" ? npc.memory.disinhibition : 0;
        const willCatcall = disinhibition >= NUDITY_CATCALL_MIN_DISINHIBITION;
        if (willCatcall && typeof rememberStoryEvent === "function") {
            rememberStoryEvent("social", `${npc.name || "Someone"} cat-called ${G.player.name} on sight for walking in unclothed.`, 3);
        }
        return {
            stance: "intrigued",
            catcall: willCatcall,
            line: willCatcall ? _npcPickLine(_npcNudityCatcallLines(npc)) : null
        };
    }

    // Uncivilized creatures don't care about public indecency.
    const civilized = typeof getSpeciesIsCivilized === "function" ? getSpeciesIsCivilized(npc.species) : true;
    if (!civilized) return null;

    // Most civilized onlookers take offense; a few just fluster.
    if (Math.random() < 0.8) {
        npc.hostility = Math.max(0, Math.min(100, (npc.hostility || 0) + NUDITY_OFFENDED_HOSTILITY));
        npc.memory.favorability = Math.max(-100, Math.min(100, (npc.memory.favorability || 0) + NUDITY_OFFENDED_FAVOR));
        return { stance: "offended", catcall: false, line: _npcPickLine(_npcNudityOffendedLines()) };
    }
    return { stance: "flustered", catcall: false, line: _npcPickLine(_npcNudityFlusteredLines()) };
}

// Fresh per-engagement variance, rolled every time the player clicks the
// NPC: a d20 (the engine's own dice when available) mapped to roughly
// -4..+5, plus the NPC's current mood on the engine mood scale (-3..+3,
// furious to affectionate). Represents how receptive they happen to feel
// right now; the deterministic base and the earned history are unchanged.
function _npcRollEngagementSwing(npc) {
    let roll;
    if (typeof G === "object" && G && typeof rollD20 === "function") {
        roll = rollD20(G.player);
    } else {
        roll = 1 + Math.floor(Math.random() * 20);
    }
    let moodMod = 0;
    const mood = String((npc.memory && npc.memory.lastMood) || "neutral").toLowerCase();
    if (typeof getMoodScale === "function") {
        const scale = getMoodScale();
        const idx = scale.indexOf(mood);
        if (idx >= 0) moodMod = idx - 3;
    }
    return Math.round((roll - 10) / 2) + moodMod;
}

// Recompute attraction at interaction start: attraction = computed base +
// action-earned history + a fresh engagement swing. Run from selectNPC in
// the engine.
function recomputeNPCAttraction(npc) {
    if (!npc || !isAdultHumanoidNPC(npc)) return npc;
    migrateNPCRelationshipPool(npc);
    const memory = npc.memory;
    if (typeof memory.attractionEarned !== "number") memory.attractionEarned = 0;
    const base = computeNPCAttractionBase(npc);
    // A hostile NPC (base 0) gets no swing - a lucky roll must not warm
    // someone up who currently can't stand the player.
    const swing = base > 0 ? _npcRollEngagementSwing(npc) : 0;
    memory.attractionSwing = swing;
    memory.attraction = Math.max(0, Math.min(100, base + memory.attractionEarned + swing));
    return npc;
}

// -- NPC "TYPE" (who an NPC is drawn to) -----------------------------------
// Each adult humanoid NPC gets two stable preferences ("type") drawn from
// things the game actually knows about the player: dominant personality
// trait, outward bearing (stat impression), presentation (clothing/hygiene),
// and the build/hair/eyes picked at character creation. How well the player
// matches scales how much attraction their actions earn (see
// getPlayerAppealMultiplier, applied in applyNPCRelationshipImpact) - a match
// helps, a mismatch dampens, and the player's Charisma softens mismatches and
// slightly boosts matches. It never blocks anything outright and never makes
// attraction negative on its own. Cosmetic/SFW only: it is a multiplier on
// existing attraction gains, not new content.
const NPC_TYPE_AXES = ["trait", "bearing", "presentation", "build", "hairColor", "hairStyle", "eyeColor"];
const NPC_TYPE_TRAIT_VALUES = ["curiosity", "empathy", "boldness"];
const NPC_TYPE_BEARING_STAT = { imposing: "physicalProwess", nimble: "flexibility", steady: "willpower", hardy: "endurance" };
const NPC_TYPE_PRESENTATION_VALUES = ["polished", "unfussy"];
// Mirrors the character-creation <select> options in cyoaftw-engine-CORE.html.
const NPC_TYPE_PHYSICAL_VALUES = {
    build: ["lean", "athletic", "sturdy", "broad", "soft", "slight"],
    hairColor: ["black", "dark brown", "brown", "auburn", "red", "blond", "gray", "white"],
    hairStyle: ["cropped", "short", "loose", "long", "braided", "tied back", "curly", "messy"],
    eyeColor: ["brown", "hazel", "green", "blue", "gray", "amber"]
};
const NPC_TYPE_SCORE_STEP = 0.15;       // multiplier change per point of match score
const NPC_TYPE_MULTIPLIER_MIN = 0.6;
const NPC_TYPE_MULTIPLIER_MAX = 1.4;
const NPC_TYPE_CHARISMA_SOFTEN_PER_POINT = 0.1;  // mismatch reduction per CHA above 3
const NPC_TYPE_CHARISMA_SOFTEN_MAX = 0.6;
const NPC_TYPE_CHARISMA_BOOST_PER_POINT = 0.05;  // match boost per CHA above 3
const NPC_TYPE_CHARISMA_BOOST_MAX = 0.5;

function _npcTypeHash(text) {
    var h = 2166136261;
    var str = String(text || "");
    for (var i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

// Small seeded PRNG (mulberry32) so an NPC's type is stable across saves and
// visits without needing to be rolled at creation time.
function _npcTypeRng(seed) {
    var a = seed >>> 0;
    return function () {
        a = (a + 0x6D2B79F5) >>> 0;
        var t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function _npcTypePick(list, rng) {
    return list[Math.floor(rng() * list.length) % list.length];
}

function _npcTypeValuesForAxis(axis, rng) {
    if (axis === "trait") return [_npcTypePick(NPC_TYPE_TRAIT_VALUES, rng)];
    if (axis === "bearing") return [_npcTypePick(Object.keys(NPC_TYPE_BEARING_STAT), rng)];
    if (axis === "presentation") return [_npcTypePick(NPC_TYPE_PRESENTATION_VALUES, rng)];
    var pool = NPC_TYPE_PHYSICAL_VALUES[axis].slice();
    var first = pool.splice(Math.floor(rng() * pool.length), 1)[0];
    var second = pool.splice(Math.floor(rng() * pool.length), 1)[0];
    return [first, second];
}

// A personality-driven lead preference: archetype first, then role, then
// temperament. Returns an axis/value or null (then the lead is random).
function _npcTypeLeadHint(npc, rng) {
    var archetype = String(npc.archetype || "").toLowerCase();
    var role = String(npc.role || "").toLowerCase();
    var temperament = String(npc.temperament || "").toLowerCase();
    var archetypeHints = {
        hero: { axis: "trait", values: ["boldness"] },
        destroyer: { axis: "trait", values: ["boldness"] },
        scoundrel: { axis: "trait", values: ["boldness"] },
        trickster: { axis: "trait", values: ["boldness"] },
        sage: { axis: "trait", values: ["curiosity"] },
        explorer: { axis: "trait", values: ["curiosity"] },
        caretaker: { axis: "trait", values: ["empathy"] },
        romantic: { axis: "trait", values: ["empathy"] },
        martyr: { axis: "trait", values: ["empathy"] },
        guardian: { axis: "bearing", values: ["steady"] },
        schemer: { axis: "presentation", values: ["polished"] }
    };
    if (archetypeHints[archetype]) return archetypeHints[archetype];

    var roleHints = [
        { words: ["scholar", "sage", "mage", "wizard", "alchemist", "scribe", "librarian"], axis: "trait", values: ["curiosity"] },
        { words: ["healer", "priest", "cleric", "herbalist", "innkeeper", "bartender"], axis: "trait", values: ["empathy"] },
        { words: ["guard", "soldier", "mercenary", "raider", "bandit", "hunter", "scout", "blacksmith", "miner"], axis: "bearing", values: [_npcTypePick(["imposing", "steady", "hardy", "nimble"], rng)] }
    ];
    for (var i = 0; i < roleHints.length; i++) {
        var hint = roleHints[i];
        if (hint.words.some(function (word) { return role.indexOf(word) !== -1; })) return hint;
    }

    var temperamentHints = {
        bold: { axis: "trait", values: ["boldness"] },
        aggressive: { axis: "trait", values: ["boldness"] },
        curious: { axis: "trait", values: ["curiosity"] },
        friendly: { axis: "trait", values: ["empathy"] },
        calm: { axis: "bearing", values: ["steady"] }
    };
    return temperamentHints[temperament] || null;
}

// Lazily seeds npc.typePrefs (so existing saves and already-spawned NPCs get
// a type too). Two preferences on different axes; stable per NPC.
function ensureNPCTypePreferences(npc) {
    if (!npc) return [];
    if (Array.isArray(npc.typePrefs)) return npc.typePrefs;

    var rng = _npcTypeRng(_npcTypeHash((npc.id || "") + "|" + (npc.name || "") + "|" + (npc.role || "")));
    var prefs = [];
    var lead = _npcTypeLeadHint(npc, rng);
    if (lead) {
        prefs.push({ axis: lead.axis, values: lead.values.slice() });
    } else {
        var leadAxis = _npcTypePick(NPC_TYPE_AXES, rng);
        prefs.push({ axis: leadAxis, values: _npcTypeValuesForAxis(leadAxis, rng) });
    }
    var remaining = NPC_TYPE_AXES.filter(function (axis) { return axis !== prefs[0].axis; });
    var secondAxis = _npcTypePick(remaining, rng);
    prefs.push({ axis: secondAxis, values: _npcTypeValuesForAxis(secondAxis, rng) });

    npc.typePrefs = prefs;
    return prefs;
}

// What the game knows about the player right now, for matching. Every source
// is typeof-guarded so this file keeps working before the engine payload
// exposes its helpers.
function _npcGetPlayerTypeProfile() {
    var trait = "";
    if (typeof getPlayerDominantTrait === "function") {
        trait = String(getPlayerDominantTrait() || "").toLowerCase();
        if (trait && typeof getPlayerTraitValue === "function" && getPlayerTraitValue(trait) < 2) trait = "";
    }
    return {
        trait: trait,
        stats: _npcGetPlayerStats(),
        presentation: typeof getPlayerPresentationScore === "function" ? getPlayerPresentationScore() : 0,
        appearance: typeof getPlayerAppearance === "function" ? getPlayerAppearance() : null
    };
}

// +1 match, 0 neutral, negative for a clear mismatch (see per-axis notes).
function _npcEvaluateTypePref(pref, profile) {
    if (!pref || !profile) return 0;
    var values = Array.isArray(pref.values) ? pref.values : [];
    if (pref.axis === "trait") {
        if (!profile.trait) return 0;
        return values.indexOf(profile.trait) !== -1 ? 1 : -0.5;
    }
    if (pref.axis === "bearing") {
        var statKey = NPC_TYPE_BEARING_STAT[values[0]];
        var statValue = statKey && typeof profile.stats[statKey] === "number" ? profile.stats[statKey] : 3;
        if (statValue >= 5) return 1;
        if (statValue <= 2) return -1;
        return 0;
    }
    if (pref.axis === "presentation") {
        if (values[0] === "polished") {
            if (profile.presentation >= 2) return 1;
            if (profile.presentation < 0) return -1;
            return 0;
        }
        // "unfussy": at ease with plain, practical looks; put off by overdone ones.
        if (profile.presentation >= 5) return -0.5;
        if (profile.presentation >= -1 && profile.presentation <= 1) return 0.5;
        return 0;
    }
    var appearance = profile.appearance;
    if (!appearance || typeof appearance[pref.axis] !== "string") return 0;
    return values.indexOf(appearance[pref.axis]) !== -1 ? 1 : -0.5;
}

// Raw match score (before charisma), summed over the NPC's preferences.
function getNPCTypeMatchScore(npc) {
    var prefs = ensureNPCTypePreferences(npc);
    if (!prefs.length) return 0;
    var profile = _npcGetPlayerTypeProfile();
    return prefs.reduce(function (sum, pref) { return sum + _npcEvaluateTypePref(pref, profile); }, 0);
}

// Multiplier on the attraction an NPC gains from the player's actions.
// Charisma (above 3) softens a mismatch and slightly boosts a match. Shared
// helper, also exposed on window so the NSFW lust scaling can adopt it.
function getPlayerAppealMultiplier(npc) {
    if (!npc) return 1;
    var score = getNPCTypeMatchScore(npc);
    var charisma = typeof getSetupStat === "function" ? getSetupStat("charisma", 3) : 3;
    var edge = Math.max(0, charisma - 3);
    if (score < 0) {
        score = score * (1 - Math.min(NPC_TYPE_CHARISMA_SOFTEN_MAX, edge * NPC_TYPE_CHARISMA_SOFTEN_PER_POINT));
    } else if (score > 0) {
        score = score * (1 + Math.min(NPC_TYPE_CHARISMA_BOOST_MAX, edge * NPC_TYPE_CHARISMA_BOOST_PER_POINT));
    }
    var multiplier = 1 + score * NPC_TYPE_SCORE_STEP;
    return Math.max(NPC_TYPE_MULTIPLIER_MIN, Math.min(NPC_TYPE_MULTIPLIER_MAX, multiplier));
}

function _npcDescribeTypePref(pref) {
    var values = Array.isArray(pref.values) ? pref.values : [];
    var first = values[0] || "";
    switch (pref.axis) {
        case "trait":
            return { curiosity: "curious, inquisitive people", empathy: "warm, caring people", boldness: "bold, direct people" }[first] || "";
        case "bearing":
            return { imposing: "an imposing, powerful presence", nimble: "light-footed, agile people", steady: "steady, unshakable people", hardy: "hardy, resilient people" }[first] || "";
        case "presentation":
            return first === "polished" ? "people who take care over their appearance" : "unfussy, down-to-earth people";
        case "build":
            return values.join(" or ") + " builds";
        case "hairColor":
            return values.join(" or ") + " hair";
        case "hairStyle":
            return values.join(" or ") + " hair";
        case "eyeColor":
            return values.join(" or ") + " eyes";
        default:
            return "";
    }
}

// For the NPC prompt (adult humanoids only): what they are drawn to, and how
// the player lines up. label is "" when the player is neither a clear match
// nor a clear mismatch, so the prompt stays quiet for the middling case.
function getNPCTypeSummary(npc) {
    if (!isAdultHumanoidNPC(npc)) return { typeText: "", label: "" };
    var prefs = ensureNPCTypePreferences(npc);
    var typeText = prefs.map(_npcDescribeTypePref).filter(Boolean).join("; ");
    var score = getNPCTypeMatchScore(npc);
    var label = "";
    if (score >= 1) label = "match";
    else if (score <= -1) label = "mismatch";
    return { typeText: typeText, label: label };
}

// How an NPC's type gets revealed to the player in the side panel: the lead
// preference after a few conversations (or once they are curious about the
// player), the second after more (or real interest). Purely derived from
// existing counters, so it needs no saved state. Adult humanoids only.
const NPC_TYPE_REVEAL_FIRST = { interactions: 3, attraction: 15 };
const NPC_TYPE_REVEAL_SECOND = { interactions: 7, attraction: 35 };

function getNPCRevealedTypeHints(npc) {
    if (!isAdultHumanoidNPC(npc)) return [];
    var prefs = ensureNPCTypePreferences(npc);
    var convo = npc.memory && npc.memory.conversationState ? npc.memory.conversationState : null;
    var interactions = convo && typeof convo.interactionCount === "number" ? convo.interactionCount : 0;
    var attraction = npc.memory && typeof npc.memory.attraction === "number" ? npc.memory.attraction : 0;

    var revealed = 0;
    if (interactions >= NPC_TYPE_REVEAL_FIRST.interactions || attraction >= NPC_TYPE_REVEAL_FIRST.attraction) revealed = 1;
    if (interactions >= NPC_TYPE_REVEAL_SECOND.interactions || attraction >= NPC_TYPE_REVEAL_SECOND.attraction) revealed = 2;
    return prefs.slice(0, revealed).map(_npcDescribeTypePref).filter(Boolean);
}

// -- FIRST IMPRESSION + TYPE-ALIGNED ACTIONS -----------------------------------
// First encounter: an adult humanoid NPC starts with some attraction (or none)
// based on how well the player fits their type and the player's CURRENT
// Charisma - which already folds in clothing quality and hygiene/grime, so
// meeting someone while filthy genuinely starts you behind. One-time per NPC
// (npc.memory.firstImpressionDone). Hostile NPCs start at 0, and the result is
// capped so nobody begins past "curious".
const NPC_FIRST_IMPRESSION = { base: 6, perMatchPoint: 6, perCharisma: 1.5, max: 22, hostilityCutoff: 60 };

function applyNPCFirstImpression(npc) {
    if (!isAdultHumanoidNPC(npc)) return npc;
    npc.memory = npc.memory || {};
    if (npc.memory.firstImpressionDone) return npc;
    npc.memory.firstImpressionDone = true;

    var hostility = typeof npc.hostility === "number" ? npc.hostility : 0;
    if (hostility >= NPC_FIRST_IMPRESSION.hostilityCutoff) return npc;

    var charisma = typeof getSetupStat === "function" ? getSetupStat("charisma", 3) : 3;
    var raw = NPC_FIRST_IMPRESSION.base +
        getNPCTypeMatchScore(npc) * NPC_FIRST_IMPRESSION.perMatchPoint +
        (charisma - 3) * NPC_FIRST_IMPRESSION.perCharisma;
    var gain = Math.max(0, Math.min(NPC_FIRST_IMPRESSION.max, Math.round(raw)));
    npc.memory.attraction = Math.max(0, Math.min(100, (npc.memory.attraction || 0) + gain));
    return npc;
}

// Acting in line with what an NPC is drawn to earns a small attraction bump:
// a curious question for someone who likes curious people, a bold stand for
// someone who likes bold ones, kindness for someone who likes empathy. Only
// for non-hostile actions, and capped per NPC so repeating an option cannot
// farm it. Returns the bonus to add to this impact's attraction.
const NPC_INTENT_TRAIT = { curious: "curiosity", help: "empathy", empathy: "empathy", comfort: "empathy", bold: "boldness" };
const NPC_TYPE_ALIGNMENT_GAIN = 1;
const NPC_TYPE_ALIGNMENT_CAP = 10;

function getNPCTypeAlignmentBonus(npc, impact) {
    if (!isAdultHumanoidNPC(npc) || !impact) return 0;
    var trait = NPC_INTENT_TRAIT[String(impact.intent || "").toLowerCase()];
    if (!trait) return 0;
    if ((impact.hostility || 0) > 0 || (impact.favor || 0) < 0) return 0;
    if ((npc.memory.typeAlignmentGain || 0) >= NPC_TYPE_ALIGNMENT_CAP) return 0;
    var prefs = ensureNPCTypePreferences(npc);
    var aligned = prefs.some(function (pref) {
        return pref.axis === "trait" && Array.isArray(pref.values) && pref.values[0] === trait;
    });
    if (!aligned) return 0;
    npc.memory.typeAlignmentGain = (npc.memory.typeAlignmentGain || 0) + NPC_TYPE_ALIGNMENT_GAIN;
    return NPC_TYPE_ALIGNMENT_GAIN;
}

if (typeof window !== "undefined") {
    window.getPlayerAppealMultiplier = getPlayerAppealMultiplier;
    window.applyNPCFirstImpression = applyNPCFirstImpression;
    window.getNPCTypeMatchScore = getNPCTypeMatchScore;
    window.isPlayerUnclothed = _npcIsPlayerUnclothed;
    window.getNudityReactionForNPC = getNudityReactionForNPC;
    window.ensureNPCTypePreferences = ensureNPCTypePreferences;
    window.getNPCTypeSummary = getNPCTypeSummary;
    window.getNPCRevealedTypeHints = getNPCRevealedTypeHints;
    window.migrateNPCRelationshipPool = migrateNPCRelationshipPool;
    window.ensureNPCOrientation = ensureNPCOrientation;
    window.computeNPCAttractionBase = computeNPCAttractionBase;
    window.recomputeNPCAttraction = recomputeNPCAttraction;
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
    // Idempotent: normally already applied when the NPC was first opened.
    applyNPCFirstImpression(npc);

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
        // A small bonus when the action fits what this NPC is drawn to.
        const attractionDelta = (typeof attraction === "number" ? attraction : 0) +
            getNPCTypeAlignmentBonus(npc, impact);
        if (attractionDelta !== 0) {
            // Player charisma scales how attractive the NPC finds them -
            // same multiplier shape as the lust scaling in the NSFW system
            // (0.8 + CHA * 0.02), so both pipelines agree. Worn-clothing
            // bonuses flow in through getSetupStat/getEntityStatValue.
            const charismaMultiplier = typeof getSetupStat === "function"
                ? (0.8 + (getSetupStat("charisma", 3) * 0.02))
                : 1;
            // NPC "type": how well the player matches what this NPC is drawn
            // to (see getPlayerAppealMultiplier). Only scales gains - a
            // negative attraction change (an insult) is left as-is.
            const appealMultiplier = attractionDelta > 0
                ? getPlayerAppealMultiplier(npc)
                : 1;
            const attractionGain = Math.round(attractionDelta * charismaMultiplier * appealMultiplier);
            // Track the action-earned share separately from the computed
            // base so recomputeNPCAttraction (interaction start) preserves
            // it while re-deriving the base from live stats.
            npc.memory.attractionEarned = (typeof npc.memory.attractionEarned === "number" ? npc.memory.attractionEarned : 0) + attractionGain;
            npc.memory.attraction = Math.max(0, Math.min(100, (npc.memory.attraction || 0) + attractionGain));
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

function applyActDisinhibitionDelta(npc, actKey, delta, reason) {
    if (!npc || !npc.memory) return npc;
    if (typeof actKey !== "string" || !actKey) return npc;
    if (typeof delta !== "number" || delta === 0) return npc;
    ensureNPCRelationshipState(npc);
    if (!isAdultHumanoidNPC(npc)) return npc;
    if (!npc.memory.actDisinhibition || typeof npc.memory.actDisinhibition !== "object") {
        npc.memory.actDisinhibition = {};
    }
    var current = typeof npc.memory.actDisinhibition[actKey] === "number"
        ? npc.memory.actDisinhibition[actKey] : 0;
    var next = Math.max(0, Math.min(100, Math.round(current + delta)));
    npc.memory.actDisinhibition[actKey] = next;
    if (typeof reason === "string" && reason && typeof rememberStoryEvent === "function") {
        rememberStoryEvent("intimacy", reason);
    }
    return npc;
}

function getActDisinhibition(npc, actKey) {
    if (!npc || !npc.memory || !npc.memory.actDisinhibition) return 0;
    if (typeof actKey !== "string" || !actKey) return 0;
    var v = npc.memory.actDisinhibition[actKey];
    return typeof v === "number" && !isNaN(v) ? Math.max(0, Math.min(100, v)) : 0;
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

// Export function to window for NSFW system access (catalogue already exported above)
if (typeof window !== "undefined") {
    window.queryConversationCatalogue = queryConversationCatalogue;
    // Per-act disinhibition helpers, used by intimacy-system.js to gate and
    // progress intimacy acts by body category. See applyActDisinhibitionDelta /
    // getActDisinhibition above for the storage shape.
    window.applyActDisinhibitionDelta = applyActDisinhibitionDelta;
    window.getActDisinhibition = getActDisinhibition;
}
