/**
 * INTIMACY SYSTEM - POSITION DEFINITIONS
 * Position data for the NSFW intimacy action menu
 * Version: 2026-08-16-0003
 */

// Version identifier for debugging cached files
if (typeof window !== "undefined") {
    window.INTIMACY_POSITIONS_VERSION = "2026-08-16-0003";
    console.log("[Intimacy Positions] Loaded v2026-08-16-0003 - Added vagina/clitoris/penis to accessible targets");
}

const INTIMACY_POSITIONS = {
    // ===== STANDING POSITIONS =====
    "Standing": {
        label: "standing face to face",
        playerRole: "standing",
        npcRole: "standing",
        furniture: ["small standing room", "large standing room", "open space"],
        accessibleTargets: {
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina", "clitoris", "penis", "testicles"]
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
            player: ["neck", "shoulders", "hips", "buttocks", "groin", "vagina"],
            npc: ["back", "neck", "shoulders", "hips", "buttocks", "anus", "vagina"]
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
            player: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina"],
            npc: ["face", "mouth", "lips", "neck", "chest", "hips", "groin", "vagina"]
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
            player: ["neck", "shoulders", "back", "hips", "buttocks", "groin", "vagina"],
            npc: ["back", "neck", "shoulders", "hips", "buttocks", "anus", "vagina"]
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
            player: ["face", "mouth", "lips", "neck", "chest", "thighs", "groin", "vagina"],
            npc: ["face", "mouth", "lips", "neck", "chest", "thighs", "groin", "vagina"]
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
            player: ["face", "mouth", "lips", "neck", "chest", "groin", "vagina"],
            npc: ["face", "mouth", "lips", "neck", "chest", "groin", "vagina"]
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
            player: ["face", "mouth", "lips", "neck", "chest", "groin", "vagina", "clitoris"],
            npc: ["face", "mouth", "lips", "neck", "chest", "groin", "vagina", "clitoris", "thighs", "hips"]
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
            player: ["hips", "buttocks", "groin", "vagina", "anus"],
            npc: ["back", "hips", "buttocks", "groin", "vagina", "anus", "thighs"]
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
            player: ["hips", "buttocks", "groin", "vagina"],
            npc: ["back", "hips", "buttocks", "groin", "vagina", "anus"]
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
            player: ["back", "hips", "buttocks", "groin", "vagina"],
            npc: ["back", "hips", "buttocks", "groin", "vagina"]
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
            player: ["face", "mouth", "lips", "neck", "chest"],
            npc: ["face", "mouth", "lips", "neck", "chest", "head"]
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
            player: ["face", "mouth", "lips", "chest", "groin", "vagina"],
            npc: ["face", "mouth", "lips", "chest", "groin", "vagina"]
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
            player: ["face", "mouth", "lips", "neck", "chest", "groin", "vagina"],
            npc: ["face", "mouth", "lips", "chest", "groin", "vagina", "hips"]
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
            player: ["face", "groin", "vagina"],
            npc: ["back", "hips", "buttocks", "groin", "vagina", "anus"]
        },
        validTools: ["hand", "fingers", "vagina", "penis"],
        analFriendly: true,
        description: "Player on back, NPC on top facing away"
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
