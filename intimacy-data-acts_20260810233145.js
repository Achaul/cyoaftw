/**
 * INTIMACY SYSTEM - SEX ACT DEFINITIONS
 * Pre-defined intimacy actions with metadata
 * Version: 2026-08-10-0508
 */

// Version identifier for debugging cached files
if (typeof window !== "undefined") {
    window.INTIMACY_ACTS_VERSION = "2026-08-10-0600";
    console.log("[Intimacy Acts] Loaded v2026-08-10-0600");
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ACT_TYPES = {
    TEASE: "tease",           // Non-penetrative, builds arousal
    PENETRATE: "penetrate",   // Initial penetration
    CONTINUE: "continue",     // Continues existing penetration
    END: "end",               // Ends the encounter
    CLOTHING: "clothing",     // Clothing removal/adjustment
    IMPACT: "impact"          // Causes sensation/pain
};

const CLOTHING_REQUIREMENTS = {
    ANY: "any",           // Works clothed or nude
    TOP_OFF: "top_off",   // Requires top to be off
    BOTTOM_OFF: "bottom_off", // Requires bottom to be off
    NUDE: "nude",         // Requires fully nude
    TOP_ON: "top_on",     // Requires top to be on
    BOTTOM_ON: "bottom_on"  // Requires bottom to be on
};

const VIRGINITY_TYPES = {
    VAGINAL: "vaginal",
    ANAL: "anal"
};

// ============================================================================
// CLOTHING DEFINITIONS
// ============================================================================

const INTIMACY_CLOTHING_ITEMS = {
    top: {
        label: "Top",
        covers: ["chest", "nipples", "shoulders", "upper back"],
        removalActions: ["remove", "pull down", "lift", "move aside"],
        description: "Upper body clothing"
    },
    bottom: {
        label: "Bottom",
        covers: ["groin", "hips", "buttocks", "anus"],
        removalActions: ["remove", "pull down", "push down", "move aside"],
        description: "Lower body clothing"
    },
    undergarments: {
        label: "Undergarments",
        covers: ["groin", "buttocks", "anus", "vagina", "penis"],
        removalActions: ["remove", "pull down", "push aside"],
        description: "Underwear"
    }
};

const DEFAULT_CLOTHING_STATE = {
    player: { top: true, bottom: true, undergarments: true },
    npc: { top: true, bottom: true, undergarments: true }
};

// ============================================================================
// SEX ACT DEFINITIONS
// ============================================================================

// Compact act definition format:
// { id, tool, target, verb, type, label, description, arousal, positions, reqClothing, ... }

const SEX_ACTS = {
    // ===== STAGE 1: CLOTHED ACTIONS =====
    kiss_lips: { id: "kiss_lips", tool: "mouth", target: "mouth", verb: "kiss", type: ACT_TYPES.TEASE, label: "Kiss lips", desc: "Kiss them on the lips", arousal: { p: 5, n: 5 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.ANY },
    kiss_cheek: { id: "kiss_cheek", tool: "mouth", target: "face", verb: "kiss", type: ACT_TYPES.TEASE, label: "Kiss cheek", desc: "Give a gentle kiss on the cheek", arousal: { p: 3, n: 3 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling"], reqCloth: CLOTHING_REQUIREMENTS.ANY },
    kiss_neck: { id: "kiss_neck", tool: "mouth", target: "neck", verb: "kiss", type: ACT_TYPES.TEASE, label: "Kiss neck", desc: "Kiss their neck", arousal: { p: 5, n: 8 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Against Wall", "Spooning"], reqCloth: CLOTHING_REQUIREMENTS.ANY },
    
    caress_face: { id: "caress_face", tool: "hand", target: "face", verb: "caress", type: ACT_TYPES.TEASE, label: "Caress face", desc: "Gently caress their face", arousal: { p: 4, n: 6 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap"], reqCloth: CLOTHING_REQUIREMENTS.ANY },
    stroke_hair: { id: "stroke_hair", tool: "hand", target: "hair", verb: "stroke", type: ACT_TYPES.TEASE, label: "Stroke hair", desc: "Run your fingers through their hair", arousal: { p: 3, n: 5 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling"], reqCloth: CLOTHING_REQUIREMENTS.ANY },
    
    grope_breasts_clothed: { id: "grope_breasts_clothed", tool: "hand", target: "chest", verb: "grope", type: ACT_TYPES.TEASE, label: "Grope breasts (over clothes)", desc: "Squeeze their breasts over their clothes", arousal: { p: 10, n: 15 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Against Wall"], reqCloth: CLOTHING_REQUIREMENTS.ANY },
    squeeze_butt_clothed: { id: "squeeze_butt_clothed", tool: "hand", target: "buttocks", verb: "squeeze", type: ACT_TYPES.TEASE, label: "Squeeze butt", desc: "Squeeze their buttocks over clothes", arousal: { p: 8, n: 18 }, pos: ["Standing", "Standing From Behind", "Perched", "Doggy", "Bent Over", "Spooning"], reqCloth: CLOTHING_REQUIREMENTS.ANY },
    
    stroke_arm: { id: "stroke_arm", tool: "hand", target: "arm", verb: "stroke", type: ACT_TYPES.TEASE, label: "Stroke arm", desc: "Stroke their arm", arousal: { p: 2, n: 3 }, pos: ["Standing", "Perched", "Missionary"], reqCloth: CLOTHING_REQUIREMENTS.ANY },
    hold_hand: { id: "hold_hand", tool: "hand", target: "hand", verb: "hold", type: ACT_TYPES.TEASE, label: "Hold hand", desc: "Hold their hand", arousal: { p: 2, n: 2 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap"], reqCloth: CLOTHING_REQUIREMENTS.ANY },
    
    hug: { id: "hug", tool: "hand", target: "chest", verb: "hug", type: ACT_TYPES.TEASE, label: "Hug", desc: "Embrace them", arousal: { p: 5, n: 5 }, pos: ["Standing", "Perched"], reqCloth: CLOTHING_REQUIREMENTS.ANY },
    embrace: { id: "embrace", tool: "hand", target: "back", verb: "embrace", type: ACT_TYPES.TEASE, label: "Embrace from behind", desc: "Wrap your arms around them from behind", arousal: { p: 6, n: 8 }, pos: ["Standing From Behind", "Spooning"], reqCloth: CLOTHING_REQUIREMENTS.ANY },
    
    // ===== STAGE 2: CLOTHING REMOVAL =====
    remove_player_top: { id: "remove_player_top", type: ACT_TYPES.CLOTHING, label: "Remove your top", desc: "Take off your top", clothingItem: "top", target: "player", arousal: { p: 0, n: 5 }, pos: ["Standing", "Perched", "Missionary"], reqCloth: CLOTHING_REQUIREMENTS.TOP_ON },
    remove_player_bottom: { id: "remove_player_bottom", type: ACT_TYPES.CLOTHING, label: "Remove your bottom", desc: "Take off your bottom clothing", clothingItem: "bottom", target: "player", arousal: { p: 5, n: 10 }, pos: ["Standing", "Perched"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_ON },
    remove_player_underwear: { id: "remove_player_underwear", type: ACT_TYPES.CLOTHING, label: "Remove your underwear", desc: "Take off your underwear", clothingItem: "underwear", target: "player", arousal: { p: 8, n: 12 }, pos: ["Standing", "Perched", "Missionary"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_ON },
    undress_player: { id: "undress_player", type: ACT_TYPES.CLOTHING, label: "Undress completely", desc: "Remove all your clothing", target: "player", arousal: { p: 10, n: 15 }, pos: ["Standing"], reqCloth: CLOTHING_REQUIREMENTS.ANY },
    
    remove_npc_top: { id: "remove_npc_top", type: ACT_TYPES.CLOTHING, label: "Remove their top", desc: "Take off their top", clothingItem: "top", target: "npc", arousal: { p: 5, n: 0 }, pos: ["Standing", "Perched", "Missionary"], reqCloth: CLOTHING_REQUIREMENTS.TOP_ON },
    remove_npc_bottom: { id: "remove_npc_bottom", type: ACT_TYPES.CLOTHING, label: "Remove their bottom", desc: "Take off their bottom clothing", clothingItem: "bottom", target: "npc", arousal: { p: 10, n: 5 }, pos: ["Standing", "Standing From Behind", "Perched"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_ON },
    remove_npc_underwear: { id: "remove_npc_underwear", type: ACT_TYPES.CLOTHING, label: "Remove their underwear", desc: "Take off their underwear", clothingItem: "underwear", target: "npc", arousal: { p: 12, n: 8 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_ON },
    undress_npc: { id: "undress_npc", type: ACT_TYPES.CLOTHING, label: "Undress them completely", desc: "Remove all their clothing", target: "npc", arousal: { p: 15, n: 10 }, pos: ["Standing"], reqCloth: CLOTHING_REQUIREMENTS.ANY },
    
    move_top_aside: { id: "move_top_aside", type: ACT_TYPES.CLOTHING, label: "Move top aside", desc: "Move your top to the side", clothingAction: "move_aside", clothingItem: "top", target: "player", arousal: { p: 0, n: 10 }, pos: ["Standing", "Perched", "Missionary"], reqCloth: CLOTHING_REQUIREMENTS.TOP_ON },
    pull_down_bottom: { id: "pull_down_bottom", type: ACT_TYPES.CLOTHING, label: "Pull down bottom", desc: "Pull your bottom down", clothingAction: "pull_down", clothingItem: "bottom", target: "player", arousal: { p: 5, n: 15 }, pos: ["Standing", "Perched"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_ON },
    lift_skirt: { id: "lift_skirt", type: ACT_TYPES.CLOTHING, label: "Lift skirt", desc: "Lift your skirt", clothingAction: "lift", clothingItem: "bottom", target: "player", arousal: { p: 3, n: 10 }, pos: ["Standing", "Perched"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_ON },
    
    move_npc_top_aside: { id: "move_npc_top_aside", type: ACT_TYPES.CLOTHING, label: "Move their top aside", desc: "Move their top to expose their chest", clothingAction: "move_aside", clothingItem: "top", target: "npc", arousal: { p: 10, n: 0 }, pos: ["Standing", "Perched", "Missionary"], reqCloth: CLOTHING_REQUIREMENTS.TOP_ON },
    pull_down_npc_bottom: { id: "pull_down_npc_bottom", type: ACT_TYPES.CLOTHING, label: "Pull down their bottom", desc: "Pull their bottom down", clothingAction: "pull_down", clothingItem: "bottom", target: "npc", arousal: { p: 15, n: 5 }, pos: ["Standing", "Standing From Behind"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_ON },
    
    // ===== STAGE 3: NUDE FOREPLAY - BREASTS/NIPPLES =====
    grope_breasts: { id: "grope_breasts", tool: "hand", target: "chest", verb: "grope", type: ACT_TYPES.TEASE, label: "Grope breasts", desc: "Squeeze and knead their bare breasts", arousal: { p: 10, n: 25 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Astride Lap", "Against Wall", "Doggy", "Bent Over", "Spooning"], reqCloth: CLOTHING_REQUIREMENTS.TOP_OFF },
    squeeze_breasts: { id: "squeeze_breasts", tool: "hand", target: "chest", verb: "squeeze", type: ACT_TYPES.TEASE, label: "Squeeze breasts", desc: "Firmly squeeze their breasts", arousal: { p: 12, n: 30 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Astride Lap", "Doggy", "Spooning"], reqCloth: CLOTHING_REQUIREMENTS.TOP_OFF },
    caress_breasts: { id: "caress_breasts", tool: "hand", target: "chest", verb: "caress", type: ACT_TYPES.TEASE, label: "Caress breasts", desc: "Gently caress their breasts", arousal: { p: 8, n: 20 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap"], reqCloth: CLOTHING_REQUIREMENTS.TOP_OFF },
    
    tease_nipples: { id: "tease_nipples", tool: "hand", target: "nipples", verb: "tease", type: ACT_TYPES.TEASE, label: "Tease nipples", desc: "Tease their nipples with your fingers", arousal: { p: 10, n: 30 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Astride Lap", "Doggy", "Bent Over", "Spooning"], reqCloth: CLOTHING_REQUIREMENTS.TOP_OFF },
    pinch_nipples: { id: "pinch_nipples", tool: "hand", target: "nipples", verb: "pinch", type: ACT_TYPES.TEASE, label: "Pinch nipples", desc: "Pinch their nipples", arousal: { p: 10, n: 35 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap"], reqCloth: CLOTHING_REQUIREMENTS.TOP_OFF },
    flick_nipples: { id: "flick_nipples", tool: "fingers", target: "nipples", verb: "flick", type: ACT_TYPES.TEASE, label: "Flick nipples", desc: "Flick their nipples with your fingertips", arousal: { p: 8, n: 30 }, pos: ["Standing", "Perched", "Missionary"], reqCloth: CLOTHING_REQUIREMENTS.TOP_OFF },
    
    kiss_nipples: { id: "kiss_nipples", tool: "mouth", target: "nipples", verb: "kiss", type: ACT_TYPES.TEASE, label: "Kiss nipples", desc: "Kiss their nipples", arousal: { p: 10, n: 30 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.TOP_OFF },
    lick_nipples: { id: "lick_nipples", tool: "mouth", target: "nipples", verb: "lick", type: ACT_TYPES.TEASE, label: "Lick nipples", desc: "Lick their nipples with your tongue", arousal: { p: 10, n: 35 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.TOP_OFF },
    suck_nipples: { id: "suck_nipples", tool: "mouth", target: "nipples", verb: "suck", type: ACT_TYPES.TEASE, label: "Suck nipples", desc: "Suck on their nipples", arousal: { p: 12, n: 40 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.TOP_OFF },
    bite_nipples: { id: "bite_nipples", tool: "mouth", target: "nipples", verb: "bite", type: ACT_TYPES.IMPACT, label: "Bite nipples", desc: "Gently bite their nipples", arousal: { p: 10, n: 35 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap"], reqCloth: CLOTHING_REQUIREMENTS.TOP_OFF, requiresConsent: true },
    
    // Body touching
    caress_stomach: { id: "caress_stomach", tool: "hand", target: "stomach", verb: "caress", type: ACT_TYPES.TEASE, label: "Caress stomach", desc: "Run your hand over their stomach", arousal: { p: 6, n: 10 }, pos: ["Standing", "Perched", "Missionary"], reqCloth: CLOTHING_REQUIREMENTS.TOP_OFF },
    stroke_back: { id: "stroke_back", tool: "hand", target: "back", verb: "stroke", type: ACT_TYPES.TEASE, label: "Stroke back", desc: "Stroke their back", arousal: { p: 5, n: 10 }, pos: ["Standing From Behind", "Spooning", "Doggy", "Bent Over"], reqCloth: CLOTHING_REQUIREMENTS.ANY },
    massage_shoulders: { id: "massage_shoulders", tool: "hand", target: "shoulders", verb: "massage", type: ACT_TYPES.TEASE, label: "Massage shoulders", desc: "Massage their shoulders", arousal: { p: 4, n: 8 }, pos: ["Standing", "Standing From Behind", "Perched"], reqCloth: CLOTHING_REQUIREMENTS.ANY },
    
    // Groin/Thigh
    tease_groin: { id: "tease_groin", tool: "hand", target: "groin", verb: "tease", type: ACT_TYPES.TEASE, label: "Tease groin", desc: "Tease their groin with your hand", arousal: { p: 15, n: 25 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Doggy", "Bent Over", "Spooning"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    grip_hips: { id: "grip_hips", tool: "hand", target: "hips", verb: "grip", type: ACT_TYPES.TEASE, label: "Grip hips", desc: "Grip their hips firmly", arousal: { p: 8, n: 15 }, pos: ["Standing", "Standing From Behind", "Doggy", "Bent Over", "Missionary"], reqCloth: CLOTHING_REQUIREMENTS.ANY },
    stroke_thighs: { id: "stroke_thighs", tool: "hand", target: "thighs", verb: "stroke", type: ACT_TYPES.TEASE, label: "Stroke thighs", desc: "Stroke their inner thighs", arousal: { p: 10, n: 20 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Doggy"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    
    // ===== VAGINAL ACTIONS =====
    rub_pussy: { id: "rub_pussy", tool: "hand", target: "vagina", verb: "rub", type: ACT_TYPES.TEASE, label: "Rub pussy", desc: "Rub their pussy", arousal: { p: 10, n: 40 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Astride Lap", "Doggy", "Bent Over", "Spooning", "Against Wall", "Against Wall From Behind", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    tease_pussy: { id: "tease_pussy", tool: "hand", target: "vagina", verb: "tease", type: ACT_TYPES.TEASE, label: "Tease pussy", desc: "Tease their pussy with your fingers", arousal: { p: 12, n: 45 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Astride Lap", "Doggy", "Bent Over", "Spooning"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    press_pussy: { id: "press_pussy", tool: "hand", target: "vagina", verb: "press", type: ACT_TYPES.TEASE, label: "Press pussy", desc: "Press against their pussy", arousal: { p: 10, n: 35 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Doggy", "Bent Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    spread_pussy: { id: "spread_pussy", tool: "hand", target: "vagina", verb: "spread", type: ACT_TYPES.TEASE, label: "Spread pussy lips", desc: "Spread their pussy lips apart", arousal: { p: 15, n: 50 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Doggy", "Bent Over", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    
    finger_pussy: { id: "finger_pussy", tool: "fingers", target: "vagina", verb: "finger", type: ACT_TYPES.TEASE, label: "Finger pussy", desc: "Slide a finger into their pussy", arousal: { p: 15, n: 50 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Astride Lap", "Doggy", "Bent Over", "Spooning", "Against Wall", "Against Wall From Behind", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresPrior: ["rub_pussy", "tease_pussy"] },
    enter_pussy_finger: { id: "enter_pussy_finger", tool: "fingers", target: "vagina", verb: "enter", type: ACT_TYPES.PENETRATE, label: "Finger deeply", desc: "Insert fingers deeply into their pussy", arousal: { p: 15, n: 60 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Doggy", "Bent Over", "Spooning", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresLube: true, requiresPrior: ["finger_pussy"] },
    finger_pussy_fast: { id: "finger_pussy_fast", tool: "fingers", target: "vagina", verb: "finger", type: ACT_TYPES.CONTINUE, label: "Finger fast", desc: "Finger their pussy quickly", arousal: { p: 15, n: 55 }, pos: ["Standing", "Perched", "Missionary", "Doggy", "Bent Over", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresLube: true, requiresPrior: ["finger_pussy", "enter_pussy_finger"] },
    
    kiss_pussy: { id: "kiss_pussy", tool: "mouth", target: "vagina", verb: "kiss", type: ACT_TYPES.TEASE, label: "Kiss pussy", desc: "Kiss their pussy", arousal: { p: 10, n: 40 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    lick_pussy: { id: "lick_pussy", tool: "mouth", target: "vagina", verb: "lick", type: ACT_TYPES.TEASE, label: "Lick pussy", desc: "Lick their pussy", arousal: { p: 12, n: 50 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    eat_pussy: { id: "eat_pussy", tool: "mouth", target: "vagina", verb: "eat", type: ACT_TYPES.TEASE, label: "Eat pussy", desc: "Eat their pussy", arousal: { p: 15, n: 60 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    tongue_pussy: { id: "tongue_pussy", tool: "tongue", target: "vagina", verb: "penetrate", type: ACT_TYPES.TEASE, label: "Tongue fuck", desc: "Penetrate their pussy with your tongue", arousal: { p: 15, n: 65 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresPrior: ["lick_pussy", "eat_pussy"] },
    
    press_penis_pussy: { id: "press_penis_pussy", tool: "penis", target: "vagina", verb: "press", type: ACT_TYPES.TEASE, label: "Press against pussy", desc: "Press your penis against their pussy", arousal: { p: 20, n: 50 }, pos: ["Standing", "Standing From Behind", "Missionary", "Doggy", "Bent Over", "Against Wall", "Against Wall From Behind"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, requiresPrior: ["rub_pussy", "tease_pussy", "finger_pussy"] },
    enter_pussy: { id: "enter_pussy", tool: "penis", target: "vagina", verb: "enter", type: ACT_TYPES.PENETRATE, label: "Enter pussy", desc: "Enter their pussy", arousal: { p: 30, n: 80 }, pos: ["Standing", "Standing From Behind", "Missionary", "Doggy", "Bent Over", "Against Wall", "Against Wall From Behind"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, requiresLube: true, requiresPrior: ["press_penis_pussy", "finger_pussy", "enter_pussy_finger"], takesVirginity: [VIRGINITY_TYPES.VAGINAL] },
    thrust_pussy: { id: "thrust_pussy", tool: "penis", target: "vagina", verb: "thrust", type: ACT_TYPES.CONTINUE, label: "Thrust into pussy", desc: "Thrust your penis into their pussy", arousal: { p: 25, n: 70 }, pos: ["Standing", "Standing From Behind", "Missionary", "Doggy", "Bent Over", "Against Wall", "Against Wall From Behind"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, requiresLube: true, requiresPrior: ["enter_pussy"] },
    pump_pussy: { id: "pump_pussy", tool: "penis", target: "vagina", verb: "pump", type: ACT_TYPES.CONTINUE, label: "Pump into pussy", desc: "Pump in and out of their pussy", arousal: { p: 25, n: 75 }, pos: ["Standing", "Standing From Behind", "Missionary", "Doggy", "Bent Over", "Against Wall", "Against Wall From Behind"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, requiresLube: true, requiresPrior: ["enter_pussy", "thrust_pussy"], intensity: "medium" },
    fuck_pussy: { id: "fuck_pussy", tool: "penis", target: "vagina", verb: "fuck", type: ACT_TYPES.CONTINUE, label: "Fuck pussy", desc: "Fuck their pussy", arousal: { p: 30, n: 80 }, pos: ["Standing", "Standing From Behind", "Missionary", "Doggy", "Bent Over", "Against Wall", "Against Wall From Behind"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, requiresLube: true, requiresPrior: ["enter_pussy", "thrust_pussy"], intensity: "hard" },
    pound_pussy: { id: "pound_pussy", tool: "penis", target: "vagina", verb: "pound", type: ACT_TYPES.CONTINUE, label: "Pound pussy", desc: "Pound into their pussy hard", arousal: { p: 35, n: 85 }, pos: ["Doggy", "Bent Over", "Standing From Behind", "Against Wall From Behind"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, requiresLube: true, requiresPrior: ["enter_pussy", "thrust_pussy"], intensity: "hard" },
    
    grind_pussy: { id: "grind_pussy", tool: "groin", target: "vagina", verb: "grind", type: ACT_TYPES.TEASE, label: "Grind against pussy", desc: "Grind your groin against their pussy", arousal: { p: 20, n: 45 }, pos: ["Standing", "Perched", "Astride Lap", "Missionary"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    
    // V on P
    impale_penis: { id: "impale_penis", tool: "vagina", target: "penis", verb: "impale", type: ACT_TYPES.PENETRATE, label: "Impale on penis", desc: "Impale yourself on their penis", arousal: { p: 25, n: 70 }, pos: ["Cowgirl", "Reverse Cowgirl", "Astride Lap"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, requiresLube: true, takesVirginity: [VIRGINITY_TYPES.VAGINAL], playerIsBottom: true },
    ride_penis: { id: "ride_penis", tool: "vagina", target: "penis", verb: "ride", type: ACT_TYPES.CONTINUE, label: "Ride penis", desc: "Ride their penis", arousal: { p: 25, n: 75 }, pos: ["Cowgirl", "Reverse Cowgirl", "Astride Lap"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, requiresLube: true, requiresPrior: ["impale_penis"] },
    bounce_penis: { id: "bounce_penis", tool: "vagina", target: "penis", verb: "bounce", type: ACT_TYPES.CONTINUE, label: "Bounce on penis", desc: "Bounce up and down on their penis", arousal: { p: 30, n: 80 }, pos: ["Cowgirl", "Reverse Cowgirl", "Astride Lap"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, requiresLube: true, requiresPrior: ["impale_penis", "ride_penis"], intensity: "medium" },
    grind_penis: { id: "grind_penis", tool: "vagina", target: "penis", verb: "grind", type: ACT_TYPES.CONTINUE, label: "Grind on penis", desc: "Grind your hips on their penis", arousal: { p: 20, n: 65 }, pos: ["Cowgirl", "Reverse Cowgirl", "Astride Lap"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, requiresLube: true, requiresPrior: ["impale_penis"] },
    
    // ===== ANAL ACTIONS =====
    grope_ass: { id: "grope_ass", tool: "hand", target: "buttocks", verb: "grope", type: ACT_TYPES.TEASE, label: "Grope ass", desc: "Grope their ass", arousal: { p: 8, n: 20 }, pos: ["Standing", "Standing From Behind", "Perched", "Doggy", "Bent Over", "Spooning", "Missionary"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    squeeze_ass: { id: "squeeze_ass", tool: "hand", target: "buttocks", verb: "squeeze", type: ACT_TYPES.TEASE, label: "Squeeze ass", desc: "Squeeze their ass cheeks", arousal: { p: 8, n: 22 }, pos: ["Standing", "Standing From Behind", "Perched", "Doggy", "Bent Over", "Spooning"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    slap_ass: { id: "slap_ass", tool: "hand", target: "buttocks", verb: "slap", type: ACT_TYPES.IMPACT, label: "Slap ass", desc: "Slap their ass", arousal: { p: 10, n: 25 }, pos: ["Standing", "Standing From Behind", "Doggy", "Bent Over", "Spooning"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresConsent: true },
    spread_cheeks: { id: "spread_cheeks", tool: "hand", target: "buttocks", verb: "spread", type: ACT_TYPES.TEASE, label: "Spread cheeks", desc: "Spread their ass cheeks apart", arousal: { p: 12, n: 30 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Spooning"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    
    touch_anus: { id: "touch_anus", tool: "hand", target: "anus", verb: "touch", type: ACT_TYPES.TEASE, label: "Touch anus", desc: "Lightly touch their anus", arousal: { p: 10, n: 35 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Missionary", "Spooning"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    press_anus: { id: "press_anus", tool: "hand", target: "anus", verb: "press", type: ACT_TYPES.TEASE, label: "Press anus", desc: "Press against their anus", arousal: { p: 10, n: 40 }, pos: ["Standing From Behind", "Doggy", "Bent Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    rub_anus: { id: "rub_anus", tool: "hand", target: "anus", verb: "rub", type: ACT_TYPES.TEASE, label: "Rub anus", desc: "Rub their anus", arousal: { p: 12, n: 45 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Missionary"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    
    finger_anus: { id: "finger_anus", tool: "fingers", target: "anus", verb: "finger", type: ACT_TYPES.TEASE, label: "Finger anus", desc: "Tease their anus with your finger", arousal: { p: 15, n: 50 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Missionary", "Spooning"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresLube: true, requiresPrior: ["touch_anus", "press_anus", "rub_anus"] },
    enter_anus_finger: { id: "enter_anus_finger", tool: "fingers", target: "anus", verb: "enter", type: ACT_TYPES.PENETRATE, label: "Finger anus deeply", desc: "Insert your finger into their anus", arousal: { p: 15, n: 60 }, pos: ["Standing From Behind", "Doggy", "Bent Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresLube: true, requiresPrior: ["finger_anus"], takesVirginity: [VIRGINITY_TYPES.ANAL] },
    finger_anus_fast: { id: "finger_anus_fast", tool: "fingers", target: "anus", verb: "finger", type: ACT_TYPES.CONTINUE, label: "Finger anus fast", desc: "Finger their anus quickly", arousal: { p: 15, n: 55 }, pos: ["Standing From Behind", "Doggy", "Bent Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresLube: true, requiresPrior: ["finger_anus", "enter_anus_finger"] },
    
    kiss_anus: { id: "kiss_anus", tool: "mouth", target: "anus", verb: "kiss", type: ACT_TYPES.TEASE, label: "Kiss anus", desc: "Kiss their anus", arousal: { p: 8, n: 40 }, pos: ["Doggy", "Bent Over", "Standing From Behind"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    lick_anus: { id: "lick_anus", tool: "mouth", target: "anus", verb: "lick", type: ACT_TYPES.TEASE, label: "Lick anus", desc: "Lick their anus", arousal: { p: 10, n: 50 }, pos: ["Doggy", "Bent Over", "Standing From Behind"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    suck_anus: { id: "suck_anus", tool: "mouth", target: "anus", verb: "suck", type: ACT_TYPES.TEASE, label: "Suck anus", desc: "Suck on their anus", arousal: { p: 10, n: 55 }, pos: ["Doggy", "Bent Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    rim_anus: { id: "rim_anus", tool: "mouth", target: "anus", verb: "rim", type: ACT_TYPES.TEASE, label: "Rim anus", desc: "Rim their anus with your tongue", arousal: { p: 15, n: 60 }, pos: ["Doggy", "Bent Over", "Standing From Behind"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    tongue_anus: { id: "tongue_anus", tool: "tongue", target: "anus", verb: "penetrate", type: ACT_TYPES.TEASE, label: "Tongue anus", desc: "Penetrate their anus with your tongue", arousal: { p: 15, n: 65 }, pos: ["Doggy", "Bent Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresPrior: ["lick_anus", "rim_anus"] },
    
    press_penis_anus: { id: "press_penis_anus", tool: "penis", target: "anus", verb: "press", type: ACT_TYPES.TEASE, label: "Press against anus", desc: "Press your penis against their anus", arousal: { p: 20, n: 50 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Against Wall From Behind"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, requiresLube: true, requiresPrior: ["finger_anus", "enter_anus_finger", "touch_anus", "rub_anus"] },
    enter_anus: { id: "enter_anus", tool: "penis", target: "anus", verb: "enter", type: ACT_TYPES.PENETRATE, label: "Enter anus", desc: "Enter their anus", arousal: { p: 30, n: 70 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Against Wall From Behind"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, requiresLube: true, requiresPrior: ["press_penis_anus", "finger_anus", "enter_anus_finger"], takesVirginity: [VIRGINITY_TYPES.ANAL] },
    thrust_anus: { id: "thrust_anus", tool: "penis", target: "anus", verb: "thrust", type: ACT_TYPES.CONTINUE, label: "Thrust into anus", desc: "Thrust your penis into their anus", arousal: { p: 25, n: 65 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Against Wall From Behind"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, requiresLube: true, requiresPrior: ["enter_anus"] },
    pound_anus: { id: "pound_anus", tool: "penis", target: "anus", verb: "pound", type: ACT_TYPES.CONTINUE, label: "Pound anus", desc: "Pound into their anus hard", arousal: { p: 35, n: 75 }, pos: ["Doggy", "Bent Over", "Standing From Behind", "Against Wall From Behind"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, requiresLube: true, requiresPrior: ["enter_anus", "thrust_anus"], intensity: "hard" },
    fuck_anus: { id: "fuck_anus", tool: "penis", target: "anus", verb: "fuck", type: ACT_TYPES.CONTINUE, label: "Fuck anus", desc: "Fuck their anus", arousal: { p: 30, n: 80 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Against Wall From Behind"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, requiresLube: true, requiresPrior: ["enter_anus", "thrust_anus"], intensity: "hard" },
    
    accept_penis_anus: { id: "accept_penis_anus", tool: "anus", target: "penis", verb: "accept", type: ACT_TYPES.PENETRATE, label: "Accept penis in anus", desc: "Let them enter your anus", arousal: { p: 40, n: 25 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Against Wall From Behind"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, requiresLube: true, takesVirginity: [VIRGINITY_TYPES.ANAL], playerIsBottom: true },
    take_penis_anus: { id: "take_penis_anus", tool: "anus", target: "penis", verb: "take", type: ACT_TYPES.CONTINUE, label: "Take penis in anus", desc: "Take their penis deeper into your anus", arousal: { p: 35, n: 30 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Against Wall From Behind"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, requiresLube: true, requiresPrior: ["accept_penis_anus"] },
    
    // ===== PENIS ACTIONS (NPC has penis) =====
    stroke_penis: { id: "stroke_penis", tool: "hand", target: "penis", verb: "stroke", type: ACT_TYPES.TEASE, label: "Stroke penis", desc: "Stroke their penis", arousal: { p: 15, n: 30 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    grip_penis: { id: "grip_penis", tool: "hand", target: "penis", verb: "grip", type: ACT_TYPES.TEASE, label: "Grip penis", desc: "Grip their penis firmly", arousal: { p: 12, n: 25 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    squeeze_penis: { id: "squeeze_penis", tool: "hand", target: "penis", verb: "squeeze", type: ACT_TYPES.TEASE, label: "Squeeze penis", desc: "Squeeze their penis", arousal: { p: 10, n: 20 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    kiss_penis: { id: "kiss_penis", tool: "mouth", target: "penis", verb: "kiss", type: ACT_TYPES.TEASE, label: "Kiss penis", desc: "Kiss their penis", arousal: { p: 10, n: 25 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    lick_penis: { id: "lick_penis", tool: "mouth", target: "penis", verb: "lick", type: ACT_TYPES.TEASE, label: "Lick penis", desc: "Lick their penis", arousal: { p: 12, n: 30 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    suck_penis: { id: "suck_penis", tool: "mouth", target: "penis", verb: "suck", type: ACT_TYPES.TEASE, label: "Suck penis", desc: "Suck their penis", arousal: { p: 15, n: 40 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF },
    deepthroat_penis: { id: "deepthroat_penis", tool: "mouth", target: "penis", verb: "deepthroat", type: ACT_TYPES.PENETRATE, label: "Deepthroat penis", desc: "Deepthroat their penis", arousal: { p: 20, n: 60 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresPrior: ["suck_penis", "lick_penis"] },
    
    // ===== ORAL ON PLAYER =====
    kiss_player_mouth: { id: "kiss_player_mouth", tool: "mouth", target: "mouth", verb: "kiss", type: ACT_TYPES.TEASE, label: "Kiss your lips", desc: "Let them kiss your lips", arousal: { p: 5, n: 5 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap"], reqCloth: CLOTHING_REQUIREMENTS.ANY, playerIsBottom: true },
    suck_player_nipples: { id: "suck_player_nipples", tool: "mouth", target: "nipples", verb: "suck", type: ACT_TYPES.TEASE, label: "Let them suck your nipples", desc: "Let them suck on your nipples", arousal: { p: 40, n: 12 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.TOP_OFF, playerIsBottom: true },
    lick_player_pussy: { id: "lick_player_pussy", tool: "mouth", target: "vagina", verb: "lick", type: ACT_TYPES.TEASE, label: "Let them lick your pussy", desc: "Let them lick your pussy", arousal: { p: 50, n: 12 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, playerIsBottom: true },
    eat_player_pussy: { id: "eat_player_pussy", tool: "mouth", target: "vagina", verb: "eat", type: ACT_TYPES.TEASE, label: "Let them eat your pussy", desc: "Let them eat your pussy", arousal: { p: 60, n: 15 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, playerIsBottom: true },
    suck_player_penis: { id: "suck_player_penis", tool: "mouth", target: "penis", verb: "suck", type: ACT_TYPES.TEASE, label: "Let them suck your penis", desc: "Let them suck your penis", arousal: { p: 40, n: 15 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, playerIsBottom: true },
    deepthroat_player_penis: { id: "deepthroat_player_penis", tool: "mouth", target: "penis", verb: "deepthroat", type: ACT_TYPES.TEASE, label: "Let them deepthroat you", desc: "Let them deepthroat your penis", arousal: { p: 60, n: 20 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, playerIsBottom: true },
    lick_player_anus: { id: "lick_player_anus", tool: "mouth", target: "anus", verb: "lick", type: ACT_TYPES.TEASE, label: "Let them lick your anus", desc: "Let them lick your anus", arousal: { p: 50, n: 10 }, pos: ["Doggy", "Bent Over", "Standing From Behind"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, playerIsBottom: true },
    rim_player_anus: { id: "rim_player_anus", tool: "mouth", target: "anus", verb: "rim", type: ACT_TYPES.TEASE, label: "Let them rim your anus", desc: "Let them rim your anus", arousal: { p: 60, n: 15 }, pos: ["Doggy", "Bent Over", "Standing From Behind"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, playerIsBottom: true },
    
    // ===== END ACTIONS =====
    stop: { id: "stop", type: ACT_TYPES.END, label: "Stop", desc: "Stop intimate actions", arousal: { p: 0, n: 0 }, pos: ["Standing", "Perched", "Missionary", "Doggy", "Bent Over", "Spooning", "Astride Lap", "Kneeling", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.ANY },
    pause: { id: "pause", type: ACT_TYPES.END, label: "Pause", desc: "Pause and take a break", arousal: { p: -5, n: -5 }, pos: ["Standing", "Perched", "Missionary", "Doggy", "Bent Over", "Spooning", "Astride Lap"], reqCloth: CLOTHING_REQUIREMENTS.ANY },

    // ===== CLIMAX/EJACULATION ACTIONS =====
    // Male climax inside (vaginal)
    ejaculate_in_vagina: { id: "ejaculate_in_vagina", tool: "penis", target: "vagina", verb: "ejaculate", type: ACT_TYPES.CONTINUE, label: "Ejaculate inside pussy", desc: "Release inside their pussy", arousal: { p: 50, n: 100 }, pos: ["Standing", "Standing From Behind", "Missionary", "Doggy", "Bent Over", "Against Wall", "Against Wall From Behind", "Cowgirl", "Reverse Cowgirl", "Spooning"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, requiresPrior: ["enter_pussy", "thrust_pussy", "pump_pussy", "fuck_pussy"], triggersClimax: true, maleOnly: true, consequence: "internal_semen" },
    
    // Male climax inside (anal)
    ejaculate_in_anus: { id: "ejaculate_in_anus", tool: "penis", target: "anus", verb: "ejaculate", type: ACT_TYPES.CONTINUE, label: "Ejaculate inside anus", desc: "Release inside their anus", arousal: { p: 50, n: 100 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Against Wall From Behind"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, requiresPrior: ["enter_anus", "thrust_anus", "pump_anus", "fuck_anus"], triggersClimax: true, maleOnly: true, consequence: "internal_semen" },
    
    // Male climax inside (mouth)
    ejaculate_in_mouth: { id: "ejaculate_in_mouth", tool: "penis", target: "mouth", verb: "ejaculate", type: ACT_TYPES.CONTINUE, label: "Ejaculate in mouth", desc: "Release in their mouth", arousal: { p: 40, n: 80 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresPrior: ["deepthroat_penis", "suck_penis"], triggersClimax: true, maleOnly: true, consequence: "oral_semen" },
    
    // Male climax on body parts
    ejaculate_on_face: { id: "ejaculate_on_face", tool: "penis", target: "face", verb: "ejaculate on", type: ACT_TYPES.IMPACT, label: "Ejaculate on face", desc: "Release on their face", arousal: { p: 35, n: 70 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Kneeling", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresPrior: ["stroke_penis", "grip_penis"], triggersClimax: true, maleOnly: true, consequence: "external_semen" },
    ejaculate_on_chest: { id: "ejaculate_on_chest", tool: "penis", target: "chest", verb: "ejaculate on", type: ACT_TYPES.IMPACT, label: "Ejaculate on chest", desc: "Release on their chest", arousal: { p: 35, n: 70 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Astride Lap", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.TOP_OFF, requiresPrior: ["stroke_penis", "grip_penis"], triggersClimax: true, maleOnly: true, consequence: "external_semen" },
    ejaculate_on_stomach: { id: "ejaculate_on_stomach", tool: "penis", target: "stomach", verb: "ejaculate on", type: ACT_TYPES.IMPACT, label: "Ejaculate on stomach", desc: "Release on their stomach", arousal: { p: 35, n: 70 }, pos: ["Standing", "Standing From Behind", "Perched", "Missionary", "Astride Lap", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.TOP_OFF, triggersClimax: true, maleOnly: true, consequence: "external_semen" },
    ejaculate_on_butt: { id: "ejaculate_on_butt", tool: "penis", target: "buttocks", verb: "ejaculate on", type: ACT_TYPES.IMPACT, label: "Ejaculate on butt", desc: "Release on their buttocks", arousal: { p: 35, n: 70 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Spooning"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, triggersClimax: true, maleOnly: true, consequence: "external_semen" },
    ejaculate_on_back: { id: "ejaculate_on_back", tool: "penis", target: "back", verb: "ejaculate on", type: ACT_TYPES.IMPACT, label: "Ejaculate on back", desc: "Release on their back", arousal: { p: 35, n: 70 }, pos: ["Standing From Behind", "Doggy", "Bent Over", "Spooning"], reqCloth: CLOTHING_REQUIREMENTS.ANY, triggersClimax: true, maleOnly: true, consequence: "external_semen" },
    ejaculate_on_legs: { id: "ejaculate_on_legs", tool: "penis", target: "legs", verb: "ejaculate on", type: ACT_TYPES.IMPACT, label: "Ejaculate on legs", desc: "Release on their legs", arousal: { p: 30, n: 60 }, pos: ["Standing", "Standing From Behind", "Perched"], reqCloth: CLOTHING_REQUIREMENTS.ANY, triggersClimax: true, maleOnly: true, consequence: "external_semen" },
    ejaculate_on_feet: { id: "ejaculate_on_feet", tool: "penis", target: "feet", verb: "ejaculate on", type: ACT_TYPES.IMPACT, label: "Ejaculate on feet", desc: "Release on their feet", arousal: { p: 30, n: 60 }, pos: ["Standing", "Kneeling", "Kneeling Over"], reqCloth: CLOTHING_REQUIREMENTS.ANY, triggersClimax: true, maleOnly: true, consequence: "external_semen" },
    
    // Female ejaculation/squirting
    female_ejaculate: { id: "female_ejaculate", tool: "vagina", target: "vagina", verb: "ejaculate", type: ACT_TYPES.CONTINUE, label: "Squirt/organic release", desc: "Experience intense release from stimulation", arousal: { p: 45, n: 90 }, pos: ["Standing", "Perched", "Missionary", "Astride Lap", "Cowgirl", "Reverse Cowgirl", "Doggy", "Bent Over"], reqCloth: CLOTHING_REQUIREMENTS.BOTTOM_OFF, requiresPrior: ["finger_pussy", "enter_pussy_finger", "lick_pussy", "eat_pussy"], triggersClimax: true, femaleOnly: true, consequence: "female_ejaculate" },
    
    // Mutual climax (both partners)
    mutual_climax: { id: "mutual_climax", tool: "body", target: "body", verb: "climax together", type: ACT_TYPES.CONTINUE, label: "Climax together", desc: "Both reach orgasm simultaneously", arousal: { p: 50, n: 100 }, pos: ["Standing", "Standing From Behind", "Missionary", "Doggy", "Bent Over", "Cowgirl", "Reverse Cowgirl", "Spooning"], reqCloth: CLOTHING_REQUIREMENTS.NUDE, triggersClimax: true, requiresPrior: ["enter_pussy", "thrust_pussy", "impale_penis", "enter_anus", "thrust_anus"], consequence: "mutual_climax" }
};

// ============================================================================
// AROUSAL CONFIGURATION
// ============================================================================

const AROUSAL_CONFIG = {
    MINOR_AROUSAL: 100,
    MODERATE_AROUSAL: 300,
    HIGH_AROUSAL: 500,
    ORGASM_THRESHOLD: 800,
    DECAY_RATE: 10,
    PERSONALITY_MULTIPLIERS: {
        shy: 0.8,
        bold: 1.2,
        submissive: 1.1,
        dominant: 0.9,
        romantic: 1.3,
        lustful: 1.4
    }
};

// ============================================================================
// INTIMACY STAGES
// ============================================================================

const INTIMACY_STAGES = {
    CLOTHED: 1,
    PARTIAL: 2,
    NUDE: 3
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get act by ID
 */
function getAct(actId) {
    return SEX_ACTS[actId];
}

/**
 * Check if act exists
 */
function hasAct(actId) {
    return SEX_ACTS.hasOwnProperty(actId);
}

/**
 * Get all act IDs
 */
function getAllActIds() {
    return Object.keys(SEX_ACTS);
}

/**
 * Get acts by type
 */
function getActsByType(type) {
    const acts = [];
    for (const [id, act] of Object.entries(SEX_ACTS)) {
        if (act.type === type) {
            acts.push(id);
        }
    }
    return acts;
}

/**
 * Get acts by clothing requirement
 */
function getActsByClothingRequirement(req) {
    const acts = [];
    for (const [id, act] of Object.entries(SEX_ACTS)) {
        if (act.reqCloth === req) {
            acts.push(id);
        }
    }
    return acts;
}

/**
 * Determine current intimacy stage based on clothing
 */
function getIntimacyStage(clothingState) {
    const playerNude = !clothingState.player.top && !clothingState.player.bottom && !clothingState.player.undergarments;
    const npcNude = !clothingState.npc.top && !clothingState.npc.bottom && !clothingState.npc.undergarments;
    
    if (playerNude && npcNude) {
        return INTIMACY_STAGES.NUDE;
    } else if (!clothingState.player.top || !clothingState.player.bottom || 
               !clothingState.npc.top || !clothingState.npc.bottom) {
        return INTIMACY_STAGES.PARTIAL;
    } else {
        return INTIMACY_STAGES.CLOTHED;
    }
}

/**
 * Check if fully nude
 */
function isFullyNude(clothingState, target = null) {
    if (target === "player") {
        return !clothingState.player.top && !clothingState.player.bottom && !clothingState.player.undergarments;
    } else if (target === "npc") {
        return !clothingState.npc.top && !clothingState.npc.bottom && !clothingState.npc.undergarments;
    }
    return !clothingState.player.top && !clothingState.player.bottom && 
           !clothingState.npc.top && !clothingState.npc.bottom;
}

/**
 * Check if action is valid for current state
 */
function isActionValid(actId, npc, player, positionId, clothingState) {
    const act = getAct(actId);
    if (!act) return false;
    
    // Check position
    if (act.pos && act.pos.length > 0) {
        if (!act.pos.includes(positionId)) {
            return false;
        }
    }
    
    // Check clothing
    if (act.reqCloth) {
        if (!checkClothingRequirement(act.reqCloth, clothingState, act.playerIsBottom)) {
            return false;
        }
    }
    
    // Check gender requirements
    if (act.maleOnly || act.femaleOnly) {
        const playerGender = (player && player.stats && player.stats.gender) ? player.stats.gender.toLowerCase() : "male";
        const npcGender = (npc.gender || "female").toLowerCase();
        
        const actorIsPlayer = !act.playerIsBottom;
        if (act.maleOnly && actorIsPlayer && playerGender !== "male") return false;
        if (act.maleOnly && !actorIsPlayer && npcGender !== "male") return false;
        if (act.femaleOnly && actorIsPlayer && playerGender !== "female") return false;
        if (act.femaleOnly && !actorIsPlayer && npcGender !== "female") return false;
    }
    
    // More checks can be added here (prior actions, lube, skills, etc.)
    
    return true;
}

/**
 * Check clothing requirement
 */
function checkClothingRequirement(requirement, clothingState, isPlayerBottom) {
    const target = isPlayerBottom ? "npc" : "player";
    const targetClothing = clothingState[target];
    
    switch (requirement) {
        case CLOTHING_REQUIREMENTS.ANY:
            return true;
        case CLOTHING_REQUIREMENTS.TOP_OFF:
            return !targetClothing.top;
        case CLOTHING_REQUIREMENTS.BOTTOM_OFF:
            return !targetClothing.bottom;
        case CLOTHING_REQUIREMENTS.NUDE:
            return !targetClothing.top && !targetClothing.bottom && !targetClothing.undergarments;
        case CLOTHING_REQUIREMENTS.TOP_ON:
            return targetClothing.top;
        case CLOTHING_REQUIREMENTS.BOTTOM_ON:
            return targetClothing.bottom;
        default:
            return true;
    }
}

/**
 * Get action category for menu organization
 */
function getActionCategory(actId) {
    const act = getAct(actId);
    if (!act) return "Other";
    
    if (act.type === ACT_TYPES.CLOTHING) {
        return "Clothing";
    }
    
    if (act.type === ACT_TYPES.END) {
        return "End";
    }
    
    if (act.type === ACT_TYPES.IMPACT) {
        return "Impact";
    }
    
    if (act.type === ACT_TYPES.PENETRATE || act.type === ACT_TYPES.CONTINUE) {
        if (act.triggersClimax) return "Climax";
        return "Penetration";
    }
    
    // Group by target
    if (act.target === "mouth" || act.target === "lips" || act.target === "face" || act.target === "neck") {
        return "Kissing";
    }
    
    if (act.target === "chest" || act.target === "nipples") {
        return "Breasts";
    }
    
    if (act.target === "vagina" || act.target === "penis") {
        return "Genital";
    }
    
    if (act.target === "anus" || act.target === "buttocks") {
        return "Anal";
    }
    
    if (act.target === "groin" || act.target === "hips" || act.target === "thighs") {
        return "Lower Body";
    }
    
    if (act.target === "hair" || act.target === "shoulders" || act.target === "back" || act.target === "stomach") {
        return "Body";
    }
    
    return "Other";
}

// Export for Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ACT_TYPES,
        CLOTHING_REQUIREMENTS,
        VIRGINITY_TYPES,
        INTIMACY_CLOTHING_ITEMS,
        DEFAULT_CLOTHING_STATE,
        SEX_ACTS,
        AROUSAL_CONFIG,
        INTIMACY_STAGES,
        getAct,
        hasAct,
        getAllActIds,
        getActsByType,
        getActsByClothingRequirement,
        getIntimacyStage,
        isFullyNude,
        isActionValid,
        checkClothingRequirement,
        getActionCategory
    };
}

// Assign to window for browser use
if (typeof window !== 'undefined') {
    window.ACT_TYPES = ACT_TYPES;
    window.CLOTHING_REQUIREMENTS = CLOTHING_REQUIREMENTS;
    window.VIRGINITY_TYPES = VIRGINITY_TYPES;
    window.INTIMACY_CLOTHING_ITEMS = INTIMACY_CLOTHING_ITEMS;
    window.DEFAULT_CLOTHING_STATE = DEFAULT_CLOTHING_STATE;
    window.SEX_ACTS = SEX_ACTS;
    window.AROUSAL_CONFIG = AROUSAL_CONFIG;
    window.INTIMACY_STAGES = INTIMACY_STAGES;
    window.getAct = getAct;
    window.hasAct = hasAct;
    window.getAllActIds = getAllActIds;
    window.getIntimacyStage = getIntimacyStage;
    window.isActionValid = isActionValid;
    window.getActionCategory = getActionCategory;
}
