/**
 * INTIMACY SYSTEM - CONTEXT DETECTION
 * Detects game state to determine appropriate intimacy options
 * Version: 2026-08-16-0001
 */

// Version identifier for debugging cached files
if (typeof window !== "undefined") {
    window.INTIMACY_CONTEXT_VERSION = "2026-08-16-0001";
    console.log("[Intimacy Context] Loaded v2026-08-16-0001 - Fixed receiver clothing check");
}

// ============================================================================
// PRIVATE LOCATION TYPES
// Rooms where intimate actions are socially acceptable
// ============================================================================

const PRIVATE_ROOM_TYPES = [
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

const SOCIAL_ROOM_TYPES = [
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

const INTIMACY_PHASES = {
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

const NATURAL_LABELS = {
    // Stage 1: Social/Clothed
    kiss_lips: "Kiss them",
    kiss_cheek: "Kiss their cheek",
    kiss_neck: "Kiss their neck",
    caress_face: "Caress their face",
    stroke_hair: "Stroke their hair",
    hold_hand: "Hold their hand",
    hug: "Hug them",
    embrace: "Embrace them",
    
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
    rub_pussy: "Touch them intimately",
    tease_pussy: "Tease them between their legs",
    press_pussy: "Press against them",
    spread_pussy: "Part their folds",
    finger_pussy: "Explore them with your fingers",
    enter_pussy_finger: "Slide your fingers inside",
    finger_pussy_fast: "Finger them quickly",
    kiss_pussy: "Kiss them there",
    lick_pussy: "Taste them",
    eat_pussy: "Pleasure them with your mouth",
    tongue_pussy: "Use your tongue on them",
    grind_pussy: "Grind against them",
    
    press_penis_pussy: "Press yourself against them",
    enter_pussy: "Enter them",
    thrust_pussy: "Thrust into them",
    pump_pussy: "Move with them",
    fuck_pussy: "Take them",
    pound_pussy: "Pound into them",
    
    // Vagina on penis (player bottom)
    impale_penis: "Lower yourself onto them",
    ride_penis: "Ride them",
    bounce_penis: "Bounce on them",
    grind_penis: "Grind on them",
    
    // Anal actions
    grope_ass: "Touch their ass",
    squeeze_ass: "Squeeze their ass",
    slap_ass: "Spank them",
    spread_cheeks: "Spread their cheeks",
    touch_anus: "Touch them there",
    press_anus: "Press against them",
    rub_anus: "Rub them there",
    finger_anus: "Tease them with your finger",
    enter_anus_finger: "Slide your finger inside them",
    finger_anus_fast: "Finger them there quickly",
    kiss_anus: "Kiss them there",
    lick_anus: "Lick them there",
    suck_anus: "Suck on them",
    rim_anus: "Rim them",
    tongue_anus: "Use your tongue on them there",
    press_penis_anus: "Press against their back entrance",
    enter_anus: "Enter them from behind",
    thrust_anus: "Thrust into them from behind",
    pound_anus: "Pound into them from behind",
    fuck_anus: "Take them from behind",
    accept_penis_anus: "Let them enter you",
    take_penis_anus: "Take them deeper",
    
    // Penis actions (on NPC)
    stroke_penis: "Stroke them",
    grip_penis: "Grip them firmly",
    squeeze_penis: "Squeeze them",
    kiss_penis: "Kiss them there",
    lick_penis: "Lick them",
    suck_penis: "Take them in your mouth",
    deepthroat_penis: "Take them deep",
    
    // On player
    suck_player_nipples: "Let them suck your nipples",
    lick_player_pussy: "Let them pleasure you",
    eat_player_pussy: "Let them taste you",
    suck_player_penis: "Let them please you",
    deepthroat_player_penis: "Let them take you deep",
    lick_player_anus: "Let them lick you there",
    rim_player_anus: "Let them rim you",
    
    // Climax actions - natural
    ejaculate_in_vagina: "Finish inside them",
    ejaculate_in_anus: "Finish inside them from behind",
    ejaculate_in_mouth: "Release in their mouth",
    ejaculate_on_face: "Mark their face",
    ejaculate_on_chest: "Finish on their chest",
    ejaculate_on_stomach: "Finish on their stomach",
    ejaculate_on_butt: "Finish on their backside",
    ejaculate_on_back: "Finish on their back",
    ejaculate_on_legs: "Finish on their legs",
    ejaculate_on_feet: "Finish on their feet",
    female_ejaculate: "Let yourself go",
    mutual_climax: "Climax together",
    
    // End actions
    stop: "Stop",
    pause: "Pause"
};

/**
 * Get natural display label for an act
 */
function getNaturalLabel(actId) {
    return NATURAL_LABELS[actId] || getAct(actId)?.label || actId;
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
