/**
 * INTIMACY SYSTEM - POSITION DEFINITIONS
 * Position data for the NSFW intimacy action menu
 * Version: 2026-08-16-006
 */

// Version identifier for debugging cached files
if (typeof window !== "undefined") {
    window.INTIMACY_POSITIONS_VERSION = "2026-09-05-001";
    console.log("[Intimacy Positions] Loaded v2026-09-05-001 - Added oral service positions (69, Oral Service, Prone Oral Service, Kneeling By Face, Squatting Before, Riding Face, Mounted On X-Cross)");
}

var INTIMACY_POSITIONS = {
    // ===== STANDING POSITIONS =====
    "Standing": {
        label: "standing face to face",
        playerRole: "standing",
        npcRole: "standing",
        furniture: ["small standing room", "large standing room", "open space"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["hand", "mouth", "fingers", "vagina", "penis"],
        analFriendly: false,
        description: "Both standing, facing each other"
    },
    
    "Standing From Behind": {
        label: "standing from behind",
        playerRole: "behind",
        npcRole: "in front",
        furniture: ["small standing room", "large standing room", "open space"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["hand", "mouth", "fingers", "penis", "vagina"],
        analFriendly: true,
        description: "Player standing behind the NPC"
    },
    
    "Against Wall": {
        label: "against the wall",
        playerRole: "pinned",
        npcRole: "pinning",
        furniture: ["vertical surface", "wall"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["hand", "mouth", "fingers", "vagina"],
        analFriendly: false,
        description: "NPC has player pinned against a wall"
    },
    
    "Against Wall From Behind": {
        label: "against wall from behind",
        playerRole: "pinning",
        npcRole: "pinned",
        furniture: ["vertical surface", "wall"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["hand", "fingers", "penis", "vagina"],
        analFriendly: true,
        description: "Player has NPC pinned against a wall from behind"
    },

    // ===== SEATED POSITIONS =====
    "Perched": {
        label: "perched on lap",
        playerRole: "seated",
        npcRole: "between thighs",
        furniture: ["seat", "chair", "lap"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["hand", "mouth", "fingers", "vagina"],
        analFriendly: false,
        description: "NPC sitting on player's lap"
    },
    
    "Astride Lap": {
        label: "astride lap",
        playerRole: "sitting",
        npcRole: "seated",
        furniture: ["seat", "chair"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["hand", "mouth", "fingers", "vagina", "penis"],
        analFriendly: false,
        description: "Player straddling NPC's lap"
    },

    // ===== LYING POSITIONS =====
    "Missionary": {
        label: "missionary",
        playerRole: "top",
        npcRole: "bottom",
        furniture: ["flat surface", "bed", "ground"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["hand", "mouth", "fingers", "penis", "vagina"],
        analFriendly: false,
        description: "Player on top, facing NPC"
    },
    
    "Doggy": {
        label: "doggy style",
        playerRole: "behind",
        npcRole: "on all fours",
        furniture: ["flat surface", "bed", "ground"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["hand", "fingers", "mouth", "penis"],
        analFriendly: true,
        description: "NPC on hands and knees, player behind"
    },
    
    "Bent Over": {
        label: "bent over",
        playerRole: "standing",
        npcRole: "bent over",
        furniture: ["vertical surface", "table", "bed", "railing"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["hand", "fingers", "mouth", "penis"],
        analFriendly: true,
        description: "NPC bent over a surface"
    },
    
    "Spooning": {
        label: "spooning",
        playerRole: "behind",
        npcRole: "in front",
        furniture: ["flat surface", "bed"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["hand", "fingers", "penis", "vagina"],
        analFriendly: true,
        description: "Both lying on side, player behind NPC"
    },

    // ===== SPECIAL POSITIONS =====
    "Kneeling": {
        label: "kneeling",
        playerRole: "standing",
        npcRole: "kneeling",
        furniture: ["open space", "floor"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["hand", "mouth"],
        analFriendly: false,
        description: "NPC kneeling before player"
    },
    
    "Kneeling Over": {
        label: "kneeling over",
        playerRole: "lying",
        npcRole: "kneeling",
        furniture: ["open space", "floor", "bed"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["hand", "mouth", "fingers", "vagina"],
        analFriendly: false,
        description: "NPC kneeling over player"
    },
    
    // ===== COWGIRL VARIATIONS =====
    "Cowgirl": {
        label: "cowgirl",
        playerRole: "bottom",
        npcRole: "top",
        furniture: ["flat surface", "bed"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["hand", "mouth", "fingers", "vagina", "penis"],
        analFriendly: false,
        description: "Player on back, NPC on top facing player"
    },
    
    "Reverse Cowgirl": {
        label: "reverse cowgirl",
        playerRole: "bottom",
        npcRole: "top",
        furniture: ["flat surface", "bed"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["hand", "fingers", "vagina", "penis"],
        analFriendly: true,
        description: "Player on back, NPC on top facing away"
    },

    // ===== ORAL SERVICE POSITIONS =====
    "Sixty-Nine": {
        label: "69",
        playerRole: "top",
        npcRole: "bottom",
        furniture: ["flat surface", "bed"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["mouth", "hand", "fingers", "vagina", "penis"],
        analFriendly: false,
        description: "Oral service with reciprocal access"
    },

    "Oral Service": {
        label: "oral service",
        playerRole: "top",
        npcRole: "bottom",
        furniture: ["flat surface", "bed", "kneeling position"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["mouth", "hand", "fingers", "vagina", "penis"],
        analFriendly: false,
        description: "NPC performing oral on player"
    },

    "Prone Oral Service": {
        label: "prone oral service",
        playerRole: "bottom",
        npcRole: "top",
        furniture: ["flat surface", "bed"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["mouth", "hand", "fingers"],
        analFriendly: false,
        description: "NPC lying down performing oral"
    },

    "Kneeling By Face": {
        label: "kneeling by face",
        playerRole: "standing",
        npcRole: "kneeling",
        furniture: ["open space", "small standing room", "large standing room"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["penis", "vagina"],
        analFriendly: false,
        description: "Player standing, NPC kneeling at face level"
    },

    "Squatting Before": {
        label: "squatting before",
        playerRole: "standing",
        npcRole: "squatting",
        furniture: ["open space", "small standing room", "large standing room"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["penis", "vagina"],
        analFriendly: false,
        description: "Player standing, NPC squatting in front"
    },

    "Riding Face": {
        label: "riding face",
        playerRole: "bottom",
        npcRole: "top",
        furniture: ["flat surface", "bed"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["vagina", "penis"],
        analFriendly: false,
        description: "NPC sitting on player's face"
    },

    "Mounted On X-Cross Oral Service": {
        label: "mounted on X-cross oral service",
        playerRole: "top",
        npcRole: "restrained",
        furniture: ["x-cross", "bondage furniture"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles", "breasts", "buttocks", "butt", "back", "arm", "hand", "hair", "legs", "feet", "shoulders", "stomach", "nipples"]
        },
        validTools: ["penis", "vagina"],
        analFriendly: false,
        description: "NPC restrained on X-cross performing oral"
    }
};

// Default position for new encounters
const DEFAULT_POSITION = "Standing";

// Helper function to get position by ID
function getPosition(positionId) {
    return INTIMACY_POSITIONS[positionId];
}

// Check if a position exists
function hasPosition(positionId) {
    return INTIMACY_POSITIONS.hasOwnProperty(positionId);
}

// Get all position IDs
function getAllPositionIds() {
    return Object.keys(INTIMACY_POSITIONS);
}

// Get positions filtered by furniture requirement
function getPositionsForFurniture(furnitureType) {
    const validPositions = [];
    for (const [id, pos] of Object.entries(INTIMACY_POSITIONS)) {
        if (pos.furniture.includes(furnitureType)) {
            validPositions.push(id);
        }
    }
    return validPositions;
}

// Get positions that support anal access
function getAnalFriendlyPositions() {
    const positions = [];
    for (const [id, pos] of Object.entries(INTIMACY_POSITIONS)) {
        if (pos.analFriendly) {
            positions.push(id);
        }
    }
    return positions;
}

// Export for Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        INTIMACY_POSITIONS,
        DEFAULT_POSITION,
        getPosition,
        hasPosition,
        getAllPositionIds,
        getPositionsForFurniture,
        getAnalFriendlyPositions
    };
}
