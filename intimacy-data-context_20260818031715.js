/**
 * INTIMACY SYSTEM - CONTEXT DETECTION
 * Detects game state to determine appropriate intimacy options
 * Version: 2026-08-16-006
 */

// Version identifier for debugging cached files
if (typeof window !== "undefined") {
    window.INTIMACY_CONTEXT_VERSION = "2026-08-16-009";
    console.log("[Intimacy Context] Loaded v2026-08-16-009 - All natural labels now use specific body part references with {trait} placeholders");
}

// ============================================================================
// PRIVATE LOCATION TYPES
// Rooms where intimate actions are socially acceptable
// ============================================================================

var PRIVATE_ROOM_TYPES = [
    "Guest Room",
    "Home",
    "Inn Common",
    "Inn",
    "Bedroom",
    "Private Chamber",
    "Tavern Room",
    "Cellar",
    "Vault",
    "Dark Alleyway",
    "Abandoned Armory",
    "Forgotten Shrine",
    "Crumbling Tower",
    "Great Cavern",
    "Stone Vault",
    "Underground Hallway",
    "Underground Gate",
    "Passage",
    "Corridor",
    "Tunnel",
    "Dungeon Chamber"
];

var SOCIAL_ROOM_TYPES = [
    "Town Square",
    "Square",
    "Street",
    "Avenue",
    "Market Avenue",
    "Cobblestone Street",
    "Market",
    "Tavern",
    "Taproom",
    "Smoky Tavern",
    "Gate",
    "Town Gate",
    "Hallway",
    "Ruined Hallway",
    "Ruins Passage",
    "Library",
    "Ruined Library"
];

// ============================================================================
// INTIMACY PHASES
// ============================================================================

var INTIMACY_PHASES = {
    SOCIAL: 1,        // Flirt, seduce, proposition only
    PRIVATE: 2,       // Undressing, foreplay (private location, only 2 people)
    INTIMATE: 3       // Full intimacy menu (after consent/penetration)
};

// ============================================================================
// CONTEXT CHECKING FUNCTIONS
// ============================================================================

/**
 * Check if current room is private (suitable for intimacy)
 */
function isPrivateLocation(room) {
    if (!room) return false;
    
    const roomType = room.type || room.roomType || "";
    const displayName = room.displayName || room.name || "";
    
    // Check against private types
    const normalizedType = roomType.toLowerCase().trim();
    const normalizedName = displayName.toLowerCase().trim();
    
    for (const privateType of PRIVATE_ROOM_TYPES) {
        if (normalizedType.includes(privateType.toLowerCase()) ||
            normalizedName.includes(privateType.toLowerCase())) {
            return true;
        }
    }
    
    // Check room tags/flags if available
    if (room.isPrivate || room.private || room.tags && room.tags.includes("private")) {
        return true;
    }
    
    return false;
}

/**
 * Check if current room is social (public, not suitable for nudity)
 */
function isSocialLocation(room) {
    if (!room) return true; // Default to social if unknown
    
    const roomType = room.type || room.roomType || "";
    const displayName = room.displayName || room.name || "";
    
    const normalizedType = roomType.toLowerCase().trim();
    const normalizedName = displayName.toLowerCase().trim();
    
    for (const socialType of SOCIAL_ROOM_TYPES) {
        if (normalizedType.includes(socialType.toLowerCase()) ||
            normalizedName.includes(socialType.toLowerCase())) {
            return true;
        }
    }
    
    return false;
}

/**
 * Count humanoids in room (excluding player)
 */
function countHumanoidsInRoom(room, excludeNpc = null) {
    if (!room || !room.creatures) return 1; // Assume others present if unknown
    
    let count = 0;
    for (const creature of room.creatures) {
        // Skip excluded NPC
        if (excludeNpc && creature === excludeNpc) continue;
        
        // Skip non-humanoids
        if (!creature.isHumanoid && !creature.humanoid) continue;
        
        // Skip player character
        if (creature.isPlayer) continue;
        
        count++;
    }
    
    return count;
}

/**
 * Check if only player and target NPC are present
 */
function isAloneWithTarget(room, targetNpc) {
    if (!room) return false;
    return countHumanoidsInRoom(room, targetNpc) === 0;
}

/**
 * Determine current intimacy phase based on context
 */
function getCurrentIntimacyPhase(room, targetNpc, npc) {
    if (!room) return INTIMACY_PHASES.SOCIAL;
    
    // Check if intimacy encounter is already active
    if (npc && npc.intimacy && npc.intimacy.encounter && npc.intimacy.encounter.active) {
        return INTIMACY_PHASES.INTIMATE;
    }
    
    // Check if in private location with only target
    const isPrivate = isPrivateLocation(room);
    const isAlone = isAloneWithTarget(room, targetNpc);
    
    // Allow PRIVATE phase if: (private + alone) OR (private + pending seduction/follow)
    const hasPendingSeduction = npc && (npc._pendingSeductionDestination || npc._pendingSeductionOption);
    
    if ((isPrivate && isAlone) || (isPrivate && hasPendingSeduction)) {
        return INTIMACY_PHASES.PRIVATE;
    }
    
    // Default to social
    return INTIMACY_PHASES.SOCIAL;
}

/**
 * Check if full intimacy is allowed in current context
 */
function canStartIntimacy(room, targetNpc) {
    const phase = getCurrentIntimacyPhase(room, targetNpc);
    return phase >= INTIMACY_PHASES.PRIVATE;
}

/**
 * Check if undressing/foreplay is allowed
 */
function canUndress(room, targetNpc) {
    return canStartIntimacy(room, targetNpc);
}

/**
 * Check if full penetration is allowed
 */
function canPenetrate(room, targetNpc, npc) {
    // Requires intimacy encounter to be active
    if (npc && npc.intimacy && npc.intimacy.encounter && npc.intimacy.encounter.active) {
        return true;
    }
    return canStartIntimacy(room, targetNpc);
}

// ============================================================================
// NATURAL LABEL MAPPING
// Maps clinical act IDs to natural, immersive display text
// ============================================================================

var NATURAL_LABELS = {
    // Stage 1: Social/Clothed
    kiss_lips: "Kiss lips",
    kiss_cheek: "Kiss cheek",
    kiss_neck: "Kiss neck",
    caress_face: "Caress face",
    stroke_hair: "Stroke hair",
    hold_hand: "Hold hand",
    hug: "Hug their body",
    embrace: "Embrace their body",
    
    // Stage 2: Clothing Removal
    remove_player_top: "Remove your top",
    remove_player_bottom: "Remove your bottom",
    remove_player_underwear: "Remove your underwear",
    undress_player: "Undress yourself",
    remove_npc_top: "Remove their top",
    remove_npc_bottom: "Remove their bottom",
    remove_npc_underwear: "Remove their underwear",
    undress_npc: "Undress them completely",
    move_top_aside: "Move your top aside",
    pull_down_bottom: "Pull down your bottom",
    lift_skirt: "Lift your skirt",
    move_npc_top_aside: "Move their top aside",
    pull_down_npc_bottom: "Pull down their bottom",
    
    // Stage 3: Nude Foreplay - Gentle
    grope_breasts: "Touch their breasts",
    caress_breasts: "Caress their breasts",
    squeeze_breasts: "Squeeze their breasts",
    tease_nipples: "Tease their nipples",
    pinch_nipples: "Pinch their nipples",
    flick_nipples: "Flick their nipples",
    kiss_nipples: "Kiss their nipples",
    lick_nipples: "Lick their nipples",
    suck_nipples: "Suck their nipples",
    bite_nipples: "Nibble their nipples",
    
    caress_stomach: "Run your hand over their stomach",
    stroke_back: "Stroke their back",
    massage_shoulders: "Massage their shoulders",
    grip_hips: "Grip their hips",
    stroke_thighs: "Stroke their thighs",
    tease_groin: "Tease their groin",
    
    // Genital actions - suggestive
    rub_pussy: "Touch their {pussy}",
    tease_pussy: "Tease their {pussy}",
    press_pussy: "Press against their {pussy}",
    spread_pussy: "Part their {pussy} lips",
    finger_pussy: "Explore their {pussy} with your fingers",
    enter_pussy_finger: "Slide your fingers inside their {pussy}",
    finger_pussy_fast: "Finger their {pussy} quickly",
    kiss_pussy: "Kiss their {pussy}",
    lick_pussy: "Taste their {pussy}",
    eat_pussy: "Pleasure them with your mouth on their {pussy}",
    tongue_pussy: "Use your tongue on their {pussy}",
    grind_pussy: "Grind against their {pussy}",
    
    press_penis_pussy: "Press your {penis} against their {pussy}",
    enter_pussy: "Enter their {pussy}",
    thrust_pussy: "Thrust into their {pussy}",
    pump_pussy: "Move with their {pussy}",
    fuck_pussy: "Take their {pussy}",
    pound_pussy: "Pound into their {pussy}",
    
    // Vagina on penis (player bottom)
    impale_penis: "Lower yourself onto their {penis}",
    ride_penis: "Ride their {penis}",
    bounce_penis: "Bounce on their {penis}",
    grind_penis: "Grind on their {penis}",
    
    // Anal actions
    grope_ass: "Touch their {buttocks}",
    squeeze_ass: "Squeeze their {buttocks}",
    slap_ass: "Spank their {buttocks}",
    spread_cheeks: "Spread their {buttocks} cheeks",
    touch_anus: "Touch their {anus}",
    press_anus: "Press against their {anus}",
    rub_anus: "Rub their {anus}",
    finger_anus: "Tease their {anus} with your finger",
    enter_anus_finger: "Slide your finger inside their {anus}",
    finger_anus_fast: "Finger their {anus} quickly",
    kiss_anus: "Kiss their {anus}",
    lick_anus: "Lick their {anus}",
    suck_anus: "Suck on their {anus}",
    rim_anus: "Rim their {anus}",
    tongue_anus: "Use your tongue on their {anus}",
    press_penis_anus: "Press your {penis} against their {anus}",
    enter_anus: "Enter their {anus} from behind",
    thrust_anus: "Thrust into their {anus} from behind",
    pound_anus: "Pound into their {anus} from behind",
    fuck_anus: "Take their {anus} from behind",
    accept_penis_anus: "Let them enter your {anus}",
    take_penis_anus: "Take their {penis} deeper into your {anus}",
    
    // Penis actions (on NPC)
    stroke_penis: "Stroke their {penis}",
    grip_penis: "Grip their {penis} firmly",
    squeeze_penis: "Squeeze their {penis}",
    kiss_penis: "Kiss their {penis}",
    lick_penis: "Lick their {penis}",
    suck_penis: "Take their {penis} in your mouth",
    deepthroat_penis: "Take their {penis} deep",
    
    // On player
    suck_player_nipples: "Let them suck your {nipples}",
    lick_player_pussy: "Let them pleasure you with their mouth on your {pussy}",
    eat_player_pussy: "Let them taste your {pussy}",
    suck_player_penis: "Let them please you with their mouth on your {penis}",
    deepthroat_player_penis: "Let them take your {penis} deep",
    lick_player_anus: "Let them lick your {anus}",
    rim_player_anus: "Let them rim your {anus}",
    
    // Climax actions - natural
    ejaculate_in_vagina: "Finish inside their {pussy}",
    ejaculate_in_anus: "Finish inside their {anus} from behind",
    ejaculate_in_mouth: "Release in their mouth",
    ejaculate_on_face: "Mark their face",
    ejaculate_on_chest: "Finish on their {chest}",
    ejaculate_on_stomach: "Finish on their {stomach}",
    ejaculate_on_butt: "Finish on their {buttocks}",
    ejaculate_on_back: "Finish on their back",
    ejaculate_on_legs: "Finish on their {legs}",
    ejaculate_on_feet: "Finish on their {feet}",
    female_ejaculate: "Let yourself go",
    mutual_climax: "Climax together",
    
    // End actions
    stop: "Stop",
    pause: "Pause"
};

/**
 * Get natural display label for an act, with optional gender personalization
 * If npc and player are provided, uses gendered labels when available
 */
function getNaturalLabel(actId, npc, player) {
    // First check NATURAL_LABELS for override
    if (NATURAL_LABELS[actId]) {
        // If gendered label function exists and we have npc/player info, try to apply gender
        if (typeof getGenderedLabel === 'function' && npc && player) {
            // Create a mock act object with the NATURAL_LABEL as the label
            // This allows getGenderedLabel to properly add possessive pronouns
            const naturalLabel = NATURAL_LABELS[actId];
            const act = getAct(actId);
            if (act) {
                // Try to get gendered version using the act's target info
                const gendered = getGenderedLabel(act, npc, player);
                if (gendered && gendered !== act.label) {
                    return gendered;
                }
            }
            // If act-based gendering didn't work or act not found,
            // try to gender the natural label directly by finding the target
            const actForNatural = getAct(actId);
            if (actForNatural && actForNatural.target) {
                // Create a temporary act with the natural label and the act's target
                const tempAct = {
                    label: naturalLabel,
                    target: actForNatural.target
                };
                const genderedNatural = getGenderedLabel(tempAct, npc, player);
                if (genderedNatural && genderedNatural !== naturalLabel) {
                    return genderedNatural;
                }
            }
        }
        return NATURAL_LABELS[actId];
    }
    
    // Fallback to act label
    const act = getAct(actId);
    if (!act) return actId;
    
    // Try gendered label if we have npc/player
    if (typeof getGenderedLabel === 'function' && npc && player) {
        const gendered = getGenderedLabel(act, npc, player);
        if (gendered && gendered !== act.label) {
            return gendered;
        }
    }
    
    return act.label || actId;
}

// ============================================================================
// ACTION FILTERING FOR MENU
// ============================================================================

/**
 * Filter actions based on current intimacy phase
 */
function filterActionsByPhase(actions, phase) {
    const filtered = [];
    
    // Handle both array and object (categorized) formats
    const actionsArray = Array.isArray(actions) ? actions : (
        actions ? Object.values(actions).flat() : []
    );
    
    for (const action of actionsArray) {
        const act = action.actId ? getAct(action.actId) : action;
        if (!act) continue;
        
        // Always allow in intimate phase
        if (phase >= INTIMACY_PHASES.INTIMATE) {
            filtered.push(action);
            continue;
        }
        
        // Private phase: allow clothing removal and foreplay
        if (phase >= INTIMACY_PHASES.PRIVATE) {
            if (act.type === ACT_TYPES.CLOTHING || 
                act.type === ACT_TYPES.TEASE ||
                (act.type === ACT_TYPES.IMPACT && act.id !== "slap_ass")) {
                filtered.push(action);
                continue;
            }
        }
        
        // Social phase: only allow non-physical actions
        if (phase >= INTIMACY_PHASES.SOCIAL) {
            // These are always allowed in social contexts
            const socialActions = [
                "kiss_lips", "kiss_cheek", "kiss_neck",
                "caress_face", "stroke_hair", 
                "hug", "embrace",
                "hold_hand"
            ];
            
            if (socialActions.includes(act.id)) {
                filtered.push(action);
            }
        }
    }
    
    return filtered;
}

// Export for Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PRIVATE_ROOM_TYPES,
        SOCIAL_ROOM_TYPES,
        INTIMACY_PHASES,
        NATURAL_LABELS,
        isPrivateLocation,
        isSocialLocation,
        countHumanoidsInRoom,
        isAloneWithTarget,
        getCurrentIntimacyPhase,
        canStartIntimacy,
        canUndress,
        canPenetrate,
        filterActionsByPhase,
        getNaturalLabel
    };
}

// Assign to window for browser use
if (typeof window !== 'undefined') {
    window.PRIVATE_ROOM_TYPES = PRIVATE_ROOM_TYPES;
    window.SOCIAL_ROOM_TYPES = SOCIAL_ROOM_TYPES;
    window.INTIMACY_PHASES = INTIMACY_PHASES;
    window.NATURAL_LABELS = NATURAL_LABELS;
    window.isPrivateLocation = isPrivateLocation;
    window.isSocialLocation = isSocialLocation;
    window.countHumanoidsInRoom = countHumanoidsInRoom;
    window.isAloneWithTarget = isAloneWithTarget;
    window.getCurrentIntimacyPhase = getCurrentIntimacyPhase;
    window.canStartIntimacy = canStartIntimacy;
    window.canUndress = canUndress;
    window.canPenetrate = canPenetrate;
    window.filterActionsByPhase = filterActionsByPhase;
    window.getNaturalLabel = getNaturalLabel;
}
