/**
 * INTIMACY SYSTEM - MAIN IMPLEMENTATION
 * Core functionality for the NSFW intimacy action menu
 * 
 * Version: 2026-08-16-003
 * This system provides:
 * - LOT (Tool-Verb-Target) based action generation
 * - Staged intimacy (Clothed -> Partial -> Nude)
 * - Position-aware accessibility
 * - Clothing state tracking
 * - One-at-a-time AI response generation
 * - Gender filtering and pronoun system
 */

// Version identifier for debugging cached files
if (typeof window !== "undefined") {
    window.INTIMACY_SYSTEM_VERSION = "2026-08-31-028";
    console.log("[Intimacy System] Loaded v2026-08-31-028 - Fixed cooldown for oral sex (can continue during cooldown), fixed 'closed' descriptors, fixed missing verbs, fixed capitalization, added 'into' and tool specs");
}

// ============================================================================
// IMPORTS / DEPENDENCIES
// ============================================================================

// Load data files
// Note: In browser environment, these will be loaded as separate script tags
// In Node.js, use require()
if (typeof require !== 'undefined') {
    const positionsData = require('./intimacy-data-positions.js');
    const matrixData = require('./intimacy-data-matrix.js');
    const actsData = require('./intimacy-data-acts.js');
    const contextData = require('./intimacy-data-context.js');
    
    // Export everything
    module.exports = { ...positionsData, ...matrixData, ...actsData, ...contextData, ...module.exports };
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Climax and cooldown constants
var CLIMAX_CONFIG = {
    // Cooldown periods in milliseconds (for males only)
    MALE_COOLDOWN_SHORT: 30000,      // 30 seconds - quick recovery
    MALE_COOLDOWN_NORMAL: 300000,    // 5 minutes - average
    MALE_COOLDOWN_LONG: 600000,      // 10 minutes - exhausted
    MALE_COOLDOWN_EXHAUSTED: 1800000, // 30 minutes - completely spent
    
    // Female recovery (much shorter, can have multiple orgasms)
    FEMALE_COOLDOWN: 60000,          // 1 minute
    
    // Fertility tracking
    FERTILE_WINDOW_DAYS: 5,           // Days around ovulation
    PREGNANCY_CHANCE_BASE: 0.05,     // 5% base chance per internal ejaculation
    PREGNANCY_CHANCE_FERTILE: 0.25,  // 25% during fertile window
    
    // Consequence types
    CONSEQUENCE_TYPES: {
        INTERNAL_SEMEN: "internal_semen",
        ORAL_SEMEN: "oral_semen", 
        EXTERNAL_SEMEN: "external_semen",
        FEMALE_EJACULATE: "female_ejaculate",
        MUTUAL_CLIMAX: "mutual_climax"
    }
};

// ============================================================================
// LLM NARRATIVE ENHANCEMENT SYSTEM
// ============================================================================

/**
 * LLM Enhancement Configuration
 * Controls the optional LLM-based narrative refinement system
 */
var LLM_ENHANCEMENT_CONFIG = {
    // Tools that qualify as sexual for LLM enhancement
    SEXUAL_TOOLS: new Set(["mouth", "tongue", "fingers", "hand", "penis", "vagina"]),
    
    // Targets that are genital/erotic (for additional filtering)
    SEXUAL_TARGETS: new Set(["vagina", "pussy", "clitoris", "clit", "penis", "cock", "anus", "ass", "buttocks", "butt", "mouth", "lips", "tongue", "breasts", "nipples", "testicles", "balls", "groin"]),
    
    // Maximum cache size per encounter
    MAX_CACHE_SIZE: 50,
    
    // LLM enhancement is enabled
    ENABLED: true
};

/**
 * Check if an action qualifies for LLM enhancement (sexual act)
 * @param {Object} act - The intimacy action object
 * @returns {boolean} - True if this is a sexual act that should be enhanced
 */
function isSexualAct(act) {
    if (!act || !LLM_ENHANCEMENT_CONFIG.ENABLED) return false;
    
    const tool = (act.tool || "").toLowerCase();
    const target = (act.target || "").toLowerCase();
    
    // Check if tool is sexual
    if (LLM_ENHANCEMENT_CONFIG.SEXUAL_TOOLS.has(tool)) {
        return true;
    }
    
    // Also check if target is sexual (catches cases like hand tool on vagina target)
    if (LLM_ENHANCEMENT_CONFIG.SEXUAL_TARGETS.has(target)) {
        return true;
    }
    
    return false;
}

/**
 * Initialize LLM enhancement cache and queue for an intimacy state
 * @param {Object} intimacy - The intimacy state object
 */
function initializeLLMEnhancement(intimacy) {
    if (!intimacy) return;
    
    if (!intimacy.llmEnhancement) {
        intimacy.llmEnhancement = {
            cache: new Map(),
            pendingPromise: null,
            active: false
        };
    } else {
        // Ensure cache exists and is a Map
        if (!intimacy.llmEnhancement.cache || !(intimacy.llmEnhancement.cache instanceof Map)) {
            intimacy.llmEnhancement.cache = new Map();
        }
        if (intimacy.llmEnhancement.pendingPromise === undefined) {
            intimacy.llmEnhancement.pendingPromise = null;
        }
        if (intimacy.llmEnhancement.active === undefined) {
            intimacy.llmEnhancement.active = false;
        }
    }
}

/**
 * Clear LLM enhancement cache (called on position change or encounter end)
 * @param {Object} intimacy - The intimacy state object
 */
function clearLLMEnhancementCache(intimacy) {
    if (intimacy && intimacy.llmEnhancement) {
        if (intimacy.llmEnhancement.cache && intimacy.llmEnhancement.cache instanceof Map) {
            intimacy.llmEnhancement.cache.clear();
        }
        intimacy.llmEnhancement.active = false;
        intimacy.llmEnhancement.pendingPromise = null;
    }
}

/**
 * Build context object for LLM enhancement
 * @param {Object} npc - The NPC
 * @param {Object} act - The intimacy action
 * @param {Object} intimacy - The intimacy state
 * @param {string} baseNarrative - The system-generated narrative
 * @returns {Object} - Context for LLM
 */
function buildLLMEnhancementContext(npc, act, intimacy, baseNarrative) {
    const context = {
        baseNarrative: baseNarrative,
        actionType: act.id || "",
        position: (intimacy.position && intimacy.position.player) || "Unknown"
    };
    
    // Add NPC traits
    if (npc) {
        context.npc = {
            species: npc.species || "",
            gender: npc.gender || "",
            civilizationLevel: npc.civilizationLevel || "",
            skinColor: npc.skinColor || npc.skin || "",
            personality: npc.personality || npc.personalityProfile?.summary || "",
            speechPattern: npc.speechPattern || npc.speechStyle || ""
        };
        
        // Add anatomy traits for relevant body parts
        // We include all sexual anatomy traits since they might be relevant
        if (npc.anatomy) {
            context.npc.anatomy = {};
            const sexualParts = ["vagina", "anus", "penis", "breasts", "nipples", "pubicHair", "buttocks"];
            sexualParts.forEach(part => {
                if (npc.anatomy[part]) {
                    context.npc.anatomy[part] = npc.anatomy[part];
                }
            });
        }
    }
    
    return context;
}

/**
 * Get cached LLM-enhanced narrative for an action
 * @param {Object} intimacy - The intimacy state
 * @param {string} actionType - The action ID
 * @param {string} position - The current position
 * @returns {string|null} - Cached enhanced narrative or null
 */
function getCachedLLMEnhancement(intimacy, actionType, position) {
    if (!intimacy?.llmEnhancement) return null;
    
    // Ensure cache is initialized and is a Map
    if (!intimacy.llmEnhancement.cache) {
        intimacy.llmEnhancement.cache = new Map();
    }
    
    // If cache is not a Map (e.g., loaded from old save), convert it
    if (!(intimacy.llmEnhancement.cache instanceof Map)) {
        // If it's a plain object, try to preserve its data
        if (intimacy.llmEnhancement.cache && typeof intimacy.llmEnhancement.cache === 'object') {
            const oldCache = intimacy.llmEnhancement.cache;
            intimacy.llmEnhancement.cache = new Map();
            // Convert old cache entries to Map (if it was a plain object with keys)
            for (const key in oldCache) {
                if (oldCache.hasOwnProperty(key)) {
                    intimacy.llmEnhancement.cache.set(key, oldCache[key]);
                }
            }
        } else {
            intimacy.llmEnhancement.cache = new Map();
        }
    }
    
    const cacheKey = `${actionType}||${position}`;
    return intimacy.llmEnhancement.cache.get(cacheKey) || null;
}

/**
 * Store LLM-enhanced narrative in cache
 * @param {Object} intimacy - The intimacy state
 * @param {string} actionType - The action ID
 * @param {string} position - The current position
 * @param {string} enhancedNarrative - The LLM-enhanced narrative
 */
function cacheLLMEnhancement(intimacy, actionType, position, enhancedNarrative) {
    if (!intimacy?.llmEnhancement) return;
    
    // Ensure cache is initialized
    if (!intimacy.llmEnhancement.cache || !(intimacy.llmEnhancement.cache instanceof Map)) {
        intimacy.llmEnhancement.cache = new Map();
    }
    
    const cacheKey = `${actionType}||${position}`;
    
    // Enforce max cache size
    if (intimacy.llmEnhancement.cache.size >= LLM_ENHANCEMENT_CONFIG.MAX_CACHE_SIZE) {
        // Delete the first entry (FIFO)
        const firstKey = intimacy.llmEnhancement.cache.keys().next().value;
        intimacy.llmEnhancement.cache.delete(firstKey);
    }
    
    intimacy.llmEnhancement.cache.set(cacheKey, enhancedNarrative);
}

/**
 * Request LLM enhancement for a narrative (non-blocking)
 * Only queues one request at a time per encounter
 * @param {Object} npc - The NPC
 * @param {Object} act - The intimacy action
 * @param {Object} intimacy - The intimacy state
 * @param {string} baseNarrative - The system-generated narrative
 * @returns {Promise<string|null>} - Resolves with enhanced narrative or null if failed
 */
async function requestLLMEnhancement(npc, act, intimacy, baseNarrative) {
    if (!LLM_ENHANCEMENT_CONFIG.ENABLED || !npc || !act || !intimacy) {
        return Promise.resolve(null);
    }
    
    // Check if we already have a cached version
    const position = (intimacy.position && intimacy.position.player) || "Unknown";
    const cached = getCachedLLMEnhancement(intimacy, act.id, position);
    if (cached) {
        return Promise.resolve(cached);
    }
    
    // Initialize enhancement system if needed
    initializeLLMEnhancement(intimacy);
    
    // If there's already a pending request, wait for it to complete first
    if (intimacy.llmEnhancement.pendingPromise) {
        try {
            await intimacy.llmEnhancement.pendingPromise;
        } catch (e) {
            // Previous request failed, continue anyway
            console.warn(`[Intimacy LLM] Previous enhancement request failed:`, e);
        }
    }
    
    // Build context
    const context = buildLLMEnhancementContext(npc, act, intimacy, baseNarrative);
    
    // Create the promise and store it
    const enhancementPromise = (async () => {
        try {
            // Only proceed if AI function is available
            if (typeof ai !== 'function') {
                return null;
            }
            
            // Check if action involves verbal response (for speech pattern)
            const hasVerbal = act.objectDialogueTags || act.dialogueTags || act.tags;
            
            // Build the prompt
            const prompt = buildLLMEnhancementPrompt(context, hasVerbal);
            
            const result = await ai({
                instruction: prompt,
                startWith: "",
                endButtons: "none",
                generatorName: "cyoaftw-engine-core"
            });
            
            const enhancedText = result && (result.text || result);
            
            if (enhancedText && typeof enhancedText === 'string' && enhancedText.trim()) {
                // Cache the result
                cacheLLMEnhancement(intimacy, act.id, position, enhancedText);
                return enhancedText;
            }
            
            return null;
        } catch (error) {
            console.error(`[Intimacy LLM] Enhancement failed:`, error);
            return null;
        } finally {
            // Clear the pending promise
            if (intimacy.llmEnhancement) {
                intimacy.llmEnhancement.pendingPromise = null;
            }
        }
    })();
    
    // Store the promise so subsequent calls wait
    intimacy.llmEnhancement.pendingPromise = enhancementPromise;
    intimacy.llmEnhancement.active = true;
    
    return enhancementPromise;
}

/**
 * Build the LLM enhancement prompt
 * @param {Object} context - The context object
 * @param {boolean} includeSpeech - Whether to include speech pattern guidance
 * @returns {string} - The prompt for LLM
 */
function buildLLMEnhancementPrompt(context, includeSpeech = false) {
    const promptParts = [
        "Enhance this erotic intimacy narrative with more vivid, varied, and descriptive language.",
        "Keep all the same facts, actions, and context from the base narrative.",
        "Use explicit, anatomical terminology where appropriate.",
        "Maintain the same perspective (second person 'you' for player, third person for NPC).",
        "Do not add new actions, body parts, or contextual elements that aren't in the base.",
        ""
    ];
    
    if (context.npc) {
        promptParts.push(`NPC Context:`);
        promptParts.push(`- Species: ${context.npc.species}`);
        promptParts.push(`- Gender: ${context.npc.gender}`);
        promptParts.push(`- Civilization: ${context.npc.civilizationLevel}`);
        promptParts.push(`- Skin: ${context.npc.skinColor}`);
        promptParts.push(`- Personality: ${context.npc.personality}`);
        
        if (includeSpeech && context.npc.speechPattern) {
            promptParts.push(`- Speech pattern: ${context.npc.speechPattern}`);
        }
        
        if (context.npc.anatomy) {
            promptParts.push(`- Anatomy traits: ${JSON.stringify(context.npc.anatomy)}`);
        }
        promptParts.push("");
    }
    
    promptParts.push(`Action: ${context.actionType}`);
    promptParts.push(`Position: ${context.position}`);
    promptParts.push("");
    promptParts.push(`Base Narrative: "${context.baseNarrative}"`);
    promptParts.push("");
    promptParts.push(`Output only the enhanced narrative text (1-3 sentences max). Do not add explanations, disclaimers, or formatting.`);
    
    return promptParts.join("\n");
}

// ============================================================================
// PRONOUN HELPERS
// ============================================================================

/**
 * Get possessive pronoun for an NPC based on gender
 * Returns: her, his, their
 */
function getPossessivePronoun(npc) {
    if (!npc) return "their";
    
    const gender = (npc.gender || "").toLowerCase();
    // Check female first with exact or prefix match to avoid "male" matching "female"
    if (gender === "female" || gender === "f" || 
        gender.includes(" woman") || gender.includes(" girl") ||
        gender.includes("female ") || gender.startsWith("female")) {
        return "her";
    }
    if (gender === "male" || gender === "m" || 
        gender.includes(" man") || gender.includes(" boy") ||
        gender.includes("male ") || gender.startsWith("male")) {
        return "his";
    }
    return "their";
}

/**
 * Get subject pronoun for an NPC based on gender
 * Returns: She, He, They
 */
function getSubjectPronoun(npc) {
    if (!npc) return "They";
    
    const gender = (npc.gender || "").toLowerCase();
    // Check female first with exact or prefix match to avoid "male" matching "female"
    if (gender === "female" || gender === "f" || 
        gender.includes(" woman") || gender.includes(" girl") ||
        gender.includes("female ") || gender.startsWith("female")) {
        return "She";
    }
    if (gender === "male" || gender === "m" || 
        gender.includes(" man") || gender.includes(" boy") ||
        gender.includes("male ") || gender.startsWith("male")) {
        return "He";
    }
    return "They";
}

/**
 * Get object pronoun for an NPC based on gender
 * Returns: her, him, them
 */
function getObjectPronoun(npc) {
    if (!npc) return "them";
    const gender = (npc.gender || "female").toLowerCase();
    // Check female first, then male, with prefix matching for race+gender combinations
    if (gender === "female" || gender === "f" || 
        gender.includes(" woman") || gender.includes(" girl") ||
        gender.includes("female ") || gender.startsWith("female")) return "her";
    if (gender === "male" || gender === "m" || 
        gender.includes(" man") || gender.includes(" boy") ||
        gender.includes("male ") || gender.startsWith("male")) return "him";
    return "them";
}

// ============================================================================
// INTIMACY STATE MANAGEMENT
// ============================================================================

/**
 * Initialize intimacy state for an NPC
 */
/**
 * Convert character equipment to intimacy clothing state format
 * Maps equipment slots to intimacy clothing categories (top, bottom, undergarments)
 */
function getClothingStateForCharacter(character) {
    if (!character) return { top: true, bottom: true, undergarments: true };
    
    // Default to clothed - most characters wear clothes by default
    const defaultState = { top: true, bottom: true, undergarments: true };
    
    // If character has equipped items, use them to determine clothing state
    if (character.equipped) {
        // Map equipment slots to intimacy clothing
        const hasTop = !!character.equipped.upper || !!character.equipped.head || !!character.equipped.chest;
        const hasBottom = !!character.equipped.lower || !!character.equipped.feet || !!character.equipped.legs;
        
        return {
            top: hasTop,
            bottom: hasBottom,
            undergarments: true  // Assume underwear is worn by default
        };
    }
    
    // If no equipped property, assume fully clothed
    return defaultState;
}

function initializeIntimacyState(npc) {
    if (!npc) return;
    
    // Determine gender for tracking
    const npcGender = (npc.gender || "female").toLowerCase();
    
    // Initialize clothing state based on actual equipped items if available
    // Use global G if available, otherwise default to clothed
    const player = typeof G !== 'undefined' ? G.player : null;
    const playerClothing = getClothingStateForCharacter(player);
    const npcClothing = getClothingStateForCharacter(npc);
    
    // If intimacy state already exists, only update clothing if it's missing or invalid
    if (npc.intimacy) {
        // Check if clothing state exists and is valid
        if (!npc.intimacy.clothing || 
            !npc.intimacy.clothing.npc || 
            !npc.intimacy.clothing.player) {
            console.log(`[Intimacy] Fixing missing clothing state`);
            npc.intimacy.clothing = {
                player: playerClothing,
                npc: npcClothing
            };
        } else {
            // Clothing state exists, but log it for debugging
            console.log(`[Intimacy] Clothing state already exists - NPC: ${JSON.stringify(npc.intimacy.clothing.npc)}, Player: ${JSON.stringify(npc.intimacy.clothing.player)}`);
        }
        return npc.intimacy;
    }
    
    console.log(`[Intimacy] Initializing clothing state - NPC: ${JSON.stringify(npcClothing)}, Player: ${JSON.stringify(playerClothing)}`);
    
    npc.intimacy = {
        // Clothing state
        clothing: {
            player: playerClothing,
            npc: npcClothing
        },
        // Current positions
        position: {
            player: DEFAULT_POSITION,
            npc: DEFAULT_POSITION
        },
        // Arousal tracking
        arousal: {
            player: 0,
            npc: 0
        },
        // Lube state - tracked per body part
        lube: {
            vagina: { hasLube: false, level: 0 },
            anus: { hasLube: false, level: 0 },
            mouth: { hasLube: false, level: 0 },
            general: { hasLube: false, level: 0 }
        },
        // Legacy global lube for backwards compatibility
        hasLube: false,
        lubeLevel: 0,
        // Virginity tracking
        virginity: {
            vaginal: true,
            anal: true
        },
        // Last action for continuity
        lastAction: null,
        // Action history (for context)
        actionHistory: [],
        // Current penetration state
        penetration: {
            active: false,
            tool: null,
            target: null,
            depth: 0,
            playerIsBottom: false
        },
        // Encounter state
        encounter: {
            active: false,
            startedAt: null,
            lastActivityAt: null
        },
        // Climax and cooldown tracking
        climax: {
            playerOrgasms: 0,
            npcOrgasms: 0,
            lastPlayerClimax: null,
            lastNPCClimax: null,
            // Male-only cooldown
            playerCooldownUntil: null,
            npcCooldownUntil: npcGender === "male" ? null : null,
            // Track internal ejaculation for semen drip narratives
            lastInternalEjaculation: null,  // e.g., "vagina", "anus"
            hasInternalEjaculation: false
        },
        // Encounter tracking for special events
        encounterFlags: {
            hasAnalPee: false  // Track if accidental peeing occurred this encounter
        },
        // Fertility and pregnancy tracking
        fertility: {
            // Only track for female NPCs
            isFertile: npcGender === "female" ? false : null,
            fertileUntil: npcGender === "female" ? null : null,
            // Pregnancy state
            isPregnant: npcGender === "female" ? false : null,
            pregnancyWeek: npcGender === "female" ? 0 : null,
            pregnancyStartDate: npcGender === "female" ? null : null
        },
        // Fluid/consequence tracking from current encounter
        fluids: {
            internalSemen: false,
            oralSemen: false,
            externalSemen: false,
            femaleEjaculate: false
        },
        // LLM enhancement system
        llmEnhancement: {
            cache: new Map(),
            pendingPromise: null,
            active: false
        }
    };
    
    return npc.intimacy;
}

/**
 * Reset intimacy state for an NPC
 */
function resetIntimacyState(npc) {
    if (!npc || !npc.intimacy) return;
    
    const npcGender = (npc.gender || "female").toLowerCase();
    
    npc.intimacy = {
        clothing: { ...DEFAULT_CLOTHING_STATE },
        position: { player: DEFAULT_POSITION, npc: DEFAULT_POSITION },
        arousal: { player: 0, npc: 0 },
        lube: {
            vagina: { hasLube: false, level: 0 },
            anus: { hasLube: false, level: 0 },
            mouth: { hasLube: false, level: 0 },
            general: { hasLube: false, level: 0 }
        },
        hasLube: false,
        lubeLevel: 0,
        virginity: { vaginal: true, anal: true },
        lastAction: null,
        actionHistory: [],
        penetration: { active: false, tool: null, target: null, depth: 0, playerIsBottom: false },
        encounter: { active: false, startedAt: null, lastActivityAt: null },
        climax: {
            playerOrgasms: 0,
            npcOrgasms: 0,
            lastPlayerClimax: null,
            lastNPCClimax: null,
            playerCooldownUntil: null,
            npcCooldownUntil: npcGender === "male" ? null : null,
            // Track internal ejaculation for semen drip narratives
            lastInternalEjaculation: null,
            hasInternalEjaculation: false
        },
        // Encounter tracking for special events
        encounterFlags: {
            hasAnalPee: false
        },
        fertility: {
            isFertile: npcGender === "female" ? false : null,
            fertileUntil: npcGender === "female" ? null : null,
            isPregnant: npcGender === "female" ? false : null,
            pregnancyWeek: npcGender === "female" ? 0 : null,
            pregnancyStartDate: npcGender === "female" ? null : null
        },
        fluids: {
            internalSemen: false,
            oralSemen: false,
            externalSemen: false,
            femaleEjaculate: false
        },
        // LLM enhancement system
        llmEnhancement: {
            cache: new Map(),
            pendingPromise: null,
            active: false
        }
    };
}

/**
 * Start an intimate encounter
 */
function startIntimacyEncounter(npc, player, positionId = null) {
    if (!npc) return false;
    
    // Only initialize if state doesn't already exist
    if (!npc.intimacy) {
        initializeIntimacyState(npc);
    }
    
    // Set position
    const pos = positionId || DEFAULT_POSITION;
    npc.intimacy.position.player = pos;
    npc.intimacy.position.npc = pos;
    
    // Mark encounter as active
    npc.intimacy.encounter.active = true;
    npc.intimacy.encounter.startedAt = Date.now();
    npc.intimacy.encounter.lastActivityAt = Date.now();
    
    // Set game mode to intimacy
    if (typeof G !== "undefined") {
        G.activeNPCMode = "intimacy";
    }
    
    console.log(`[Intimacy] Started encounter with ${npc.name || 'NPC'} in position: ${pos}`);
    
    return true;
}

/**
 * End an intimate encounter
 */
function endIntimacyEncounter(npc) {
    if (!npc || !npc.intimacy) return false;
    
    npc.intimacy.encounter.active = false;
    npc.intimacy.encounter.startedAt = null;
    npc.intimacy.encounter.lastActivityAt = null;
    
    // Reset penetration state
    npc.intimacy.penetration = { active: false, tool: null, target: null, depth: 0 };
    
    // Clear LLM enhancement cache
    clearLLMEnhancementCache(npc.intimacy);
    
    // Reset game mode
    if (typeof G !== "undefined") {
        G.activeNPCMode = null;
        G.activeNPC = null;
    }
    
    // Restore UI state for intimacy mode
    if (typeof document !== "undefined") {
        const roomDescEl = document.getElementById("roomDescEl");
        if (roomDescEl) roomDescEl.style.display = "";
        const narrationEl = document.getElementById("narrationEl");
        if (narrationEl) narrationEl.style.display = "";
        const placeholderEl = document.getElementById("npcPlaceholderEl");
        const detailEl = document.getElementById("npcDetailEl");
        if (placeholderEl) placeholderEl.style.display = "";
        if (detailEl) detailEl.classList.remove("active");
        // Remove position container
        const positionContainer = document.getElementById("intimacyPositionContainer");
        if (positionContainer) positionContainer.remove();
    }
    
    console.log(`[Intimacy] Ended encounter with ${npc.name || 'NPC'}`);
    
    return true;
}

/**
 * Update last activity timestamp
 */
function updateLastActivity(npc) {
    if (!npc || !npc.intimacy) return;
    npc.intimacy.encounter.lastActivityAt = Date.now();
}

// ============================================================================
// ACTION MENU GENERATION
// ============================================================================

/**
 * Generate valid actions for current state
 */
function generateValidActions(npc, player, positionId = null) {
    if (!npc || !player) return [];
    
    const intimacy = npc.intimacy || initializeIntimacyState(npc);
    const clothingState = intimacy.clothing;
    const currentPosition = positionId || intimacy.position.player;
    const stage = getIntimacyStage(clothingState);
    
    const validActions = [];
    const actionIds = getAllActIds();

    for (const actId of actionIds) {
        const act = getAct(actId);
        if (!act) continue;
        
        // Check if action is valid for current state
        if (isActionValid(actId, npc, player, currentPosition, clothingState)) {
            // Determine if player is the actor (true) or NPC is the actor (false)
            // playerIsBottom means player is receiving, so NPC is actor
            const isPlayerActor = !act.playerIsBottom;
            
            // For CLOTHING and END actions, skip tool/target accessibility check
            // Clothing actions only need clothing state validation (handled by isActionValid)
            // END actions don't need accessibility checks
            if (act.type === ACT_TYPES.CLOTHING || act.type === ACT_TYPES.END) {
                validActions.push({ ...act, actId });
            }
            // For actions that work regardless of clothing (reqCloth: ANY), also skip accessibility check
            // This allows "over clothes" actions like grope_breasts_clothed
            else if (act.reqCloth === CLOTHING_REQUIREMENTS.ANY) {
                validActions.push({ ...act, actId });
            }
            // For other actions, check position accessibility for tool-target
            else if (checkToolTargetAccessibility(act.tool, act.target, currentPosition, clothingState, isPlayerActor)) {
                validActions.push({ ...act, actId });
            }
        }
    }
    
    // Add stage-specific filtering first (before categorizing)
    const filteredActions = applyStageFilteringToArray(validActions, stage);

    // Sort actions by category for menu organization
    const categorizedActions = {};
    for (const action of filteredActions) {
        const category = getActionCategory(action.actId);
        if (!categorizedActions[category]) {
            categorizedActions[category] = [];
        }
        categorizedActions[category].push(action);
    }
    
    // Flatten back to array for consistency
    const result = [];
    for (const category in categorizedActions) {
        result.push(...categorizedActions[category]);
    }
    
    return result;
}

/**
 * Check if action is valid (simple boolean version)
 */
function isActionValid(actId, npc, player, positionId, clothingState) {
    const result = checkActionValidity(actId, npc, player, positionId, clothingState);
    return result.valid;
}

/**
 * Check if action is valid and return reason if not
 * Returns { valid: boolean, reason?: string } for an action
 */
function checkActionValidity(actId, npc, player, positionId, clothingState) {
    const act = getAct(actId);
    if (!act) return { valid: false, reason: "unknown action" };
    
    // Check position requirement
    if (act.pos && act.pos.length > 0 && !act.pos.includes(positionId)) {
        return { valid: false, reason: "no position" };
    }
    
    // Check clothing requirement
    if (act.reqCloth) {
        const targetOverride = act.type === ACT_TYPES.CLOTHING ? act.target : null;
        if (!checkClothingRequirement(act.reqCloth, clothingState, act.playerIsBottom, targetOverride)) {
            return { valid: false, reason: "clothed" };
        }
    }
    
    // Check clothing for clothing actions
    if (act.type === ACT_TYPES.CLOTHING) {
        if (act.id === "undress_player" || act.id === "undress_npc" || act.clothingItem || act.clothingAction) {
            const targetIsPlayer = act.target === "player";
            const targetKey = targetIsPlayer ? "player" : "npc";
            if (clothingState && clothingState[targetKey]) {
                const targetClothing = clothingState[targetKey];
                if (act.id === "undress_player" || act.id === "undress_npc") {
                    if (!targetClothing.top && !targetClothing.bottom && !targetClothing.undergarments) {
                        return { valid: false, reason: "already nude" };
                    }
                } else if (act.clothingItem) {
                    if (!targetClothing[act.clothingItem]) {
                        return { valid: false, reason: "not worn" };
                    }
                }
            }
        }
    }
    
    // Check "over clothes" actions when target is nude
    if (act.id && act.id.includes("_clothed")) {
        const isPlayerTarget = act.target === "player" || act.playerIsBottom === false;
        const targetKey = isPlayerTarget ? "player" : "npc";
        const targetClothing = clothingState && clothingState[targetKey];
        if (targetClothing && !targetClothing.top && !targetClothing.bottom && !targetClothing.undergarments) {
            return { valid: false, reason: "clothed" };
        }
    }
    
    // Check gender requirements
    if (act.maleOnly || act.femaleOnly || act.requiresNpcMale || act.requiresNpcFemale || act.requiresActorMale || act.requiresActorFemale || act.requiresPlayerMale || act.requiresPlayerFemale) {
        const playerGender = (player && player.stats && player.stats.gender) ? player.stats.gender.toLowerCase() : "male";
        const npcGender = (npc.gender || "female").toLowerCase();
        const actorIsPlayer = !act.playerIsBottom;
        
        if (act.maleOnly) {
            if (actorIsPlayer && playerGender !== "male") return { valid: false, reason: "wrong gender" };
            if (!actorIsPlayer && npcGender !== "male") return { valid: false, reason: "wrong gender" };
        }
        if (act.femaleOnly) {
            if (actorIsPlayer && playerGender !== "female") return { valid: false, reason: "wrong gender" };
            if (!actorIsPlayer && npcGender !== "female") return { valid: false, reason: "wrong gender" };
        }
        if (act.requiresActorMale) {
            if (actorIsPlayer && playerGender !== "male") return { valid: false, reason: "wrong gender" };
            if (!actorIsPlayer && npcGender !== "male") return { valid: false, reason: "wrong gender" };
        }
        if (act.requiresActorFemale) {
            if (actorIsPlayer && playerGender !== "female") return { valid: false, reason: "wrong gender" };
            if (!actorIsPlayer && npcGender !== "female") return { valid: false, reason: "wrong gender" };
        }
        if (act.requiresNpcMale && npcGender !== "male") return { valid: false, reason: "wrong gender" };
        if (act.requiresNpcFemale && npcGender !== "female") return { valid: false, reason: "wrong gender" };
        if (act.requiresPlayerMale && playerGender !== "male") return { valid: false, reason: "wrong gender" };
        if (act.requiresPlayerFemale && playerGender !== "female") return { valid: false, reason: "wrong gender" };
    }
    
    // Check prior actions
    if (act.requiresPrior && act.requiresPrior.length > 0) {
        const intimacy = npc && npc.intimacy;
        const actionHistory = intimacy && intimacy.actionHistory ? intimacy.actionHistory : [];
        const hasPriorAction = act.requiresPrior.some(priorActId => {
            return actionHistory.some(historyEntry => historyEntry.actId === priorActId);
        });
        if (!hasPriorAction) {
            return { valid: false, reason: "prior required" };
        }
    }

    // Check penetration conflict: cannot start penetration in different orifice without pulling out first
    if (act.type === ACT_TYPES.PENETRATE || act.type === ACT_TYPES.CONTINUE) {
        const intimacy = npc && npc.intimacy;
        if (intimacy && intimacy.penetration && intimacy.penetration.active) {
            const currentTarget = intimacy.penetration.target;
            const newTarget = act.target;
            
            // If trying to penetrate a different orifice, block it
            if (currentTarget && newTarget && currentTarget !== newTarget) {
                // Allow some compatible transitions (e.g., vaginal <-> clitoris)
                const compatibleTargets = {
                    vagina: ["pussy", "clitoris", "clit"],
                    pussy: ["vagina", "clitoris", "clit"],
                    anus: ["ass", "butthole"],
                    ass: ["anus", "butthole"],
                    mouth: ["lips"],
                    lips: ["mouth"]
                };
                
                const isCompatible = compatibleTargets[currentTarget] && compatibleTargets[currentTarget].includes(newTarget);
                
                if (!isCompatible) {
                    return { valid: false, reason: "pull out first" };
                }
            }
        }
    }

    // Check END actions - must match corresponding start/continue action from lastAction
    if (act.type === ACT_TYPES.END) {
        const intimacy = npc && npc.intimacy;
        const lastAction = intimacy && intimacy.lastAction ? intimacy.lastAction.actId : null;
        
        if (!lastAction) {
            // No prior action, only allow generic end actions
            if (actId !== "stop" && actId !== "pause") {
                return { valid: false, reason: "no active action" };
            }
        } else {
            // Define mapping of END actions to their corresponding start/continue actions
            const END_ACTION_MAPPING = {
                // Fingering end actions (vaginal and anal)
                stop_fingering: ["finger_pussy", "finger_pussy_fast", "enter_pussy_finger", "finger_anus", "finger_anus_fast", "enter_anus_finger"],
                pull_off_of_finger: ["finger_pussy", "finger_pussy_fast", "enter_pussy_finger", "finger_anus", "finger_anus_fast", "enter_anus_finger"],
                
                // Vaginal/Anal penetration end actions
                pull_out: ["enter_pussy", "thrust_pussy", "enter_anus", "thrust_anus"],
                pull_off: ["enter_pussy", "thrust_pussy", "enter_anus", "thrust_anus"],
                
                // Hand job end actions
                release_cock: ["stroke_penis", "grip_penis"],
                
                // Oral end actions
                pull_out_of_mouth: ["deepthroat_penis", "suck_penis", "fuck_mouth", "deepthroat_penis_player", "accept_penis_mouth"]
            };
            
            const requiredStartActions = END_ACTION_MAPPING[actId];
            if (requiredStartActions && !requiredStartActions.includes(lastAction)) {
                return { valid: false, reason: "no active action" };
            }
        }
    }
    
    // Check lube - now checks per-body-part lube
    if (act.requiresLube) {
        const intimacy = npc && npc.intimacy;
        if (!intimacy || !intimacy.lube) {
            return { valid: false, reason: "no lube" };
        }
        
        // Map action target to lube body part
        const target = act.target || "";
        const actIdLower = (act.id || "").toLowerCase();
        let lubePart = "general";
        
        if (target === "vagina" || target === "pussy" || target === "clitoris" ||
            actIdLower.includes("pussy") || actIdLower.includes("vagina") || actIdLower.includes("clitoris") ||
            actIdLower.includes("clit") || actIdLower.includes("fold")) {
            lubePart = "vagina";
        } else if (target === "anus" || target === "buttocks" || target === "butt" || target === "ass" ||
                   actIdLower.includes("anal") || actIdLower.includes("anus") || actIdLower.includes("butt") || actIdLower.includes("ass")) {
            lubePart = "anus";
        } else if (target === "mouth" || target === "lips" || target === "face" ||
                   actIdLower.includes("mouth") || actIdLower.includes("oral") || actIdLower.includes("kiss")) {
            lubePart = "mouth";
        }
        
        const partLube = intimacy.lube[lubePart];
        if (!partLube || !partLube.hasLube) {
            return { valid: false, reason: "no lube" };
        }
        
        // Also update legacy flag for backwards compatibility
        intimacy.hasLube = true;
    }
    
    // Check climax context: climax actions should only be available when appropriate
    if (act.triggersClimax) {
        const intimacy = npc && npc.intimacy;
        if (!intimacy) return { valid: true }; // Can't validate, allow
        
        const currentPenetration = intimacy.penetration || {};
        const playerGender = (player && player.stats && player.stats.gender) ? player.stats.gender.toLowerCase() : "male";
        const npcGender = (npc.gender || "female").toLowerCase();
        
        // For internal ejaculation (inside vagina/anus/mouth), player must be:
        // 1. Male
        // 2. Currently penetrating that specific body part with their penis
        if (actId === "ejaculate_in_vagina") {
            if (playerGender !== "male") {
                return { valid: false, reason: "wrong gender" };
            }
            // Must be penetrating vagina with penis (player -> NPC)
            if (!currentPenetration.active || currentPenetration.target !== "vagina" || currentPenetration.tool !== "penis") {
                return { valid: false, reason: "no access" };
            }
        }
        
        if (actId === "ejaculate_in_anus") {
            if (playerGender !== "male") {
                return { valid: false, reason: "wrong gender" };
            }
            // Must be penetrating anus with penis (player -> NPC)
            if (!currentPenetration.active || currentPenetration.target !== "anus" || currentPenetration.tool !== "penis") {
                return { valid: false, reason: "no access" };
            }
        }
        
        if (actId === "ejaculate_in_mouth") {
            if (playerGender !== "male") {
                return { valid: false, reason: "wrong gender" };
            }
            // Must be penetrating mouth with penis (player -> NPC mouth)
            // Or NPC is penetrating player's mouth with their mouth (receiving oral)
            const validMouthPenetration = currentPenetration.active && 
                ((currentPenetration.target === "mouth" && currentPenetration.tool === "penis") ||
                 (currentPenetration.target === "penis" && currentPenetration.tool === "mouth"));
            if (!validMouthPenetration) {
                return { valid: false, reason: "no access" };
            }
        }
        
        // For female ejaculation (squirting), player must be:
        // 1. Female
        // 2. Receiving vaginal penetration or penetrating with vagina
        if (actId === "female_ejaculate") {
            if (playerGender !== "female") {
                return { valid: false, reason: "wrong gender" };
            }
            // Player can squirt if:
            // - Player's vagina is being penetrated (playerIsBottom, target=vagina)
            // - Player is penetrating with vagina (tool=vagina)
            if (!currentPenetration.active) {
                return { valid: false, reason: "no access" };
            }
            const validVaginalContext = 
                (currentPenetration.target === "vagina" && currentPenetration.playerIsBottom) ||
                (currentPenetration.tool === "vagina");
            if (!validVaginalContext) {
                return { valid: false, reason: "no access" };
            }
        }
        
        // For external ejaculation (on body parts), player must be male
        if (actId.startsWith("ejaculate_on_")) {
            if (playerGender !== "male") {
                return { valid: false, reason: "wrong gender" };
            }
            // These are always available for males, regardless of penetration state
            // The position will determine where the ejaculation lands
        }
        
        // Mutual climax can happen in any penetration context
        if (actId === "mutual_climax") {
            // Both must be in a state where climax is possible
            if (!currentPenetration.active) {
                return { valid: false, reason: "no access" };
            }
        }
    }
    
    // Check consent
    if (act.requiresConsent) {
        const npcAttraction = (npc.relationship && npc.relationship.attraction) || 0;
        const npcLust = (npc.relationship && npc.relationship.lust) || 0;
        if (npcAttraction < 50 || npcLust < 30) {
            return { valid: false, reason: "no consent" };
        }
    }
    
    // Check tool/target accessibility for non-clothing, non-ANY actions
    const isPlayerActor = !act.playerIsBottom;
    if (act.type !== ACT_TYPES.CLOTHING && act.type !== ACT_TYPES.END && act.reqCloth !== CLOTHING_REQUIREMENTS.ANY) {
        if (!checkToolTargetAccessibility(act.tool, act.target, positionId, clothingState, isPlayerActor)) {
            return { valid: false, reason: "no access" };
        }
    }
    
    return { valid: true };
}

/**
 * Get user-friendly hint for disabled action reason
 */
function getDisabledHintForReason(reason, npc, player, act) {
    const hintMap = {
        "pull out first": "Pull out first",
        "no position": "Wrong position",
        "clothed": "Remove clothes first",
        "no access": "No access",
        "no lube": "Needs lubrication",
        "wrong gender": "Wrong gender",
        "no consent": "Needs more attraction",
        "already nude": "Already undressed",
        "not worn": "Not wearing",
        "prior required": "Action requires prior step",
        "no active action": "No active action",
        "unknown action": "Unknown action"
    };
    return hintMap[reason] || reason;
}

/**
 * Generate all actions with validity status for displaying disabled actions with hints
 */
function generateAllActionsWithStatus(npc, player, positionId = null) {
    if (!npc || !player) return { valid: [], invalid: [] };
    
    const intimacy = npc.intimacy || initializeIntimacyState(npc);
    const clothingState = intimacy.clothing;
    const currentPosition = positionId || intimacy.position.player;
    const stage = getIntimacyStage(clothingState);
    
    const validActions = [];
    const invalidActions = [];
    const actionIds = getAllActIds();
    
    for (const actId of actionIds) {
        const act = getAct(actId);
        if (!act) continue;
        
        const checkResult = checkActionValidity(actId, npc, player, currentPosition, clothingState);
        
        if (checkResult.valid) {
            // Apply stage filtering
            if (applyStageFilteringToSingleAction(act, stage)) {
                validActions.push({ ...act, actId });
            }
        } else {
            // Include invalid action with reason and hint
            const disabledHint = getDisabledHintForReason(checkResult.reason, npc, player, act);
            invalidActions.push({ ...act, actId, disabled: true, disabledReason: checkResult.reason, disabledHint });
        }
    }
    
    // Sort invalid actions by category for menu organization
    const categorizedInvalid = {};
    for (const action of invalidActions) {
        const category = getActionCategory(action.actId);
        if (!categorizedInvalid[category]) {
            categorizedInvalid[category] = [];
        }
        categorizedInvalid[category].push(action);
    }
    
    // Flatten categorized invalid actions
    const flatInvalid = [];
    for (const category in categorizedInvalid) {
        flatInvalid.push(...categorizedInvalid[category]);
    }
    
    // Sort valid actions by category
    const categorizedValid = {};
    for (const action of validActions) {
        const category = getActionCategory(action.actId);
        if (!categorizedValid[category]) {
            categorizedValid[category] = [];
        }
        categorizedValid[category].push(action);
    }
    
    // Flatten valid actions
    const flatValid = [];
    for (const category in categorizedValid) {
        flatValid.push(...categorizedValid[category]);
    }
    
    return { valid: flatValid, invalid: flatInvalid };
}

/**
 * Apply stage filtering to a single action
 */
function applyStageFilteringToSingleAction(action, stage) {
    // Clothing actions are always allowed
    if (action.type === ACT_TYPES.CLOTHING) return true;
    
    // END actions are always allowed
    if (action.type === ACT_TYPES.END) return true;
    
    // Stage 1: Clothed - only external actions
    if (stage === INTIMACY_STAGES.CLOTHED) {
        if (action.type === ACT_TYPES.PENETRATE || action.type === ACT_TYPES.CONTINUE) return false;
    }
    
    // Stage 2: Partial - still hide full penetration
    if (stage === INTIMACY_STAGES.PARTIAL) {
        if (action.type === ACT_TYPES.PENETRATE || action.type === ACT_TYPES.CONTINUE) return false;
    }
    
    return true;
}

/**
 * Apply stage-specific filtering to actions array
 * Note: Clothing accessibility is already handled by checkToolTargetAccessibility,
 * so we only filter by action type here.
 */
function applyStageFilteringToArray(actions, stage) {
    return actions.filter(action => {
        // Clothing actions are always allowed
        if (action.type === ACT_TYPES.CLOTHING) return true;
        
        // END actions are always allowed
        if (action.type === ACT_TYPES.END) return true;
        
        // Stage 1: Clothed - allow all non-penetrative actions
        if (stage === INTIMACY_STAGES.CLOTHED) {
            // Remove penetration and continue actions until partially undressed
            if (action.type === ACT_TYPES.PENETRATE || action.type === ACT_TYPES.CONTINUE) return false;
        }
        
        // Stage 2: Partial - allow all except full penetration
        if (stage === INTIMACY_STAGES.PARTIAL) {
            // Still hide full penetration until fully nude
            if (action.type === ACT_TYPES.PENETRATE || action.type === ACT_TYPES.CONTINUE) return false;
        }
        
        // Stage 3: Nude - allow all actions
        // No filtering needed
        
        return true;
    });
}

/**
 * Apply stage-specific filtering to actions (legacy - for categorized object)
 */
function applyStageFiltering(categorizedActions, stage) {
    const filtered = { ...categorizedActions };
    
    // Stage 1: Clothed - only external actions
    if (stage === INTIMACY_STAGES.CLOTHED) {
        // Remove penetration and continue actions (now categorized by body area)
        // These will be in Pussy, Cock, Anus, Mouth & Lips categories
        delete filtered.Penetration;
        
        // Remove pussy, cock, and anus actions that require nudity
        if (filtered.Pussy) {
            filtered.Pussy = filtered.Pussy.filter(a => a.reqCloth === CLOTHING_REQUIREMENTS.ANY);
        }
        if (filtered.Cock) {
            filtered.Cock = filtered.Cock.filter(a => a.reqCloth === CLOTHING_REQUIREMENTS.ANY);
        }
        if (filtered.Anal) {
            filtered.Anal = filtered.Anal.filter(a => a.reqCloth === CLOTHING_REQUIREMENTS.ANY);
        }
        if (filtered["Mouth & Lips"]) {
            filtered["Mouth & Lips"] = filtered["Mouth & Lips"].filter(a => a.reqCloth === CLOTHING_REQUIREMENTS.ANY);
        }
    }
    
    // Stage 2: Partial - allow clothing removal and some exposure
    if (stage === INTIMACY_STAGES.PARTIAL) {
        // Still hide full penetration until nude
        delete filtered.Penetration;
    }
    
    return filtered;
}

/**
 * Check if a tool can access a target in current position and clothing state
 */
function checkToolTargetAccessibility(tool, target, positionId, clothingState, isPlayerAction) {
    const position = getPosition(positionId);
    if (!position) return false;
    
    // Check if tool is valid for this position
    if (!position.validTools.includes(tool)) return false;
    
    // Check if target is accessible in this position
    // The target belongs to the RECEIVER (person being acted upon)
    const receiverKey = isPlayerAction ? "npc" : "player";
    const accessibleTargets = position.accessibleTargets[receiverKey] || [];
    if (!accessibleTargets.includes(target)) return false;
    
    // Check clothing - target must be exposed
    // The target belongs to the RECEIVER (person being acted upon), not the actor
    const receiverKey = isPlayerAction ? "npc" : "player";
    const receiverClothing = clothingState[receiverKey];
    
    // If no clothing state for receiver, allow the action
    if (!receiverClothing) return true;
    
    const targetCovers = getTargetCoveredParts(target);
    
    for (const part of targetCovers) {
        const partClothing = getClothingForBodyPart(part);
        for (const item of partClothing) {
            if (receiverClothing[item] === true) {
                // Target is covered by clothing
                return false;
            }
        }
    }
    
    return true;
}

/**
 * Get clothing items that cover a body part
 */
function getClothingForBodyPart(part) {
    const covering = [];
    for (const [item, info] of Object.entries(INTIMACY_CLOTHING_ITEMS)) {
        if (info.covers.includes(part)) {
            covering.push(item);
        }
    }
    return covering;
}

/**
 * Get body parts covered by a target
 */
function getTargetCoveredParts(target) {
    // Map targets to the body parts they represent
    const targetToParts = {
        face: ["face"],
        mouth: ["mouth"],
        lips: ["mouth"],
        neck: ["neck"],
        hair: ["hair"],
        chest: ["chest"],
        nipples: ["nipples"],
        shoulders: ["shoulders"],
        stomach: ["stomach"],
        back: ["back"],
        hips: ["hips"],
        groin: ["groin"],
        buttocks: ["buttocks"],
        anus: ["anus"],
        vagina: ["vagina"],
        clitoris: ["clitoris"],
        penis: ["penis"],
        testicles: ["testicles"],
        thighs: ["thighs"],
        legs: ["legs"],
        feet: ["feet"],
        hand: ["hand"],
        arm: ["arm"]
    };
    return targetToParts[target] || [target];
}

// ============================================================================
// ACTION EXECUTION
// ============================================================================

/**
 * Execute an intimacy action
 */
async function executeIntimacyAction(npc, player, actId, positionId = null) {
    if (!npc || !player || !hasAct(actId)) return null;
    
    const act = getAct(actId);
    const intimacy = npc.intimacy || initializeIntimacyState(npc);
    const clothingState = intimacy.clothing;
    const currentPosition = positionId || intimacy.position.player;
    
    // Validate action
    if (!isActionValid(actId, npc, player, currentPosition, clothingState)) {
        console.warn(`[Intimacy] Action ${actId} is not valid in current state`);
        return null;
    }
    
    // Check cooldown for male characters (penetration and ejaculation actions)
    // Note: Oral penetration (mouth/lips) can continue even during cooldown
    const isOralTarget = act.target === "mouth" || act.target === "lips";
    const shouldCheckCooldown = (act.type === ACT_TYPES.PENETRATE || act.type === ACT_TYPES.CONTINUE || act.triggersClimax) && !isOralTarget;
    
    if (shouldCheckCooldown) {
        if (!checkCooldownForAction(npc, player, act)) {
            console.warn(`[Intimacy] Action ${actId} blocked: actor is on cooldown`);
            return null;
        }
    }
    
    // Update last activity
    updateLastActivity(npc);
    
    // Store last action for continuity
    intimacy.lastAction = { actId, timestamp: Date.now() };
    
    // Add to history (keep last 20 actions for prior action checking)
    intimacy.actionHistory.push({ actId, timestamp: Date.now() });
    if (intimacy.actionHistory.length > 20) {
        intimacy.actionHistory.shift();
    }
    
    // Handle clothing actions
    if (act.type === ACT_TYPES.CLOTHING) {
        const result = handleClothingAction(npc, player, act, clothingState);
        // Save the updated clothing state back to the NPC
        if (result && result.clothingState) {
            intimacy.clothing = result.clothingState;
        }
        return result;
    }
    
    // Handle end actions
    if (act.type === ACT_TYPES.END) {
        if (actId === "stop") {
            endIntimacyEncounter(npc);
        }
        return generateEndResponse(npc, player, act);
    }
    
    // Handle penetration actions
    if (act.type === ACT_TYPES.PENETRATE || act.type === ACT_TYPES.CONTINUE || act.type === ACT_TYPES.END) {
        handlePenetrationAction(npc, player, act, intimacy, actId);
        
        // Check for accidental peeing during anal (only once per encounter, after first penetration)
        if (act.target === "anus" || act.target === "ass" || actId.includes("anus") || actId.includes("anal")) {
            const penetrationDepth = intimacy.penetration ? intimacy.penetration.depth : 0;
            const hasPeeAlready = intimacy.encounterFlags && intimacy.encounterFlags.hasAnalPee;
            const shouldAccidentalPee = penetrationDepth > 0 && !hasPeeAlready && Math.random() < 0.12;
            
            if (shouldAccidentalPee) {
                // Set the flag so it only happens once per encounter
                if (!intimacy.encounterFlags) intimacy.encounterFlags = {};
                intimacy.encounterFlags.hasAnalPee = true;
                
                // Store pee event to be added to response
                if (!intimacy.pendingEvents) intimacy.pendingEvents = [];
                intimacy.pendingEvents.push({ type: "analPee", actId });
            }
        }
    }
    
    // Handle virginity loss
    if (act.takesVirginity) {
        handleVirginityLoss(npc, act.takesVirginity);
    }
    
    // Handle lube mechanics: certain actions add lube to specific body parts
    handleLubeFromAction(npc, act);
    
    // Update arousal
    const arousalResult = updateArousal(npc, player, act.arousal);
    
    // Check for climax triggers (either from act or from arousal threshold)
    let climaxResult = null;
    if (act.triggersClimax || arousalResult.playerClimax || arousalResult.npcClimax) {
        climaxResult = handleClimax(npc, player, act, intimacy);
    }
    
    // Handle fluid/consequence from act
    if (act.consequence) {
        handleFluidConsequence(npc, player, act.consequence, intimacy);
    }
    
    // Generate response
    const response = await generateActionResponse(npc, player, act, intimacy, currentPosition);
    
    // Add climax info to response if applicable
    if (climaxResult) {
        response.climax = climaxResult;
        
        // Integrate NPC climax reaction into response text
        if (climaxResult.npcReaction && !response.responseText.includes(climaxResult.npcReaction)) {
            // Append NPC reaction to the response
            const separator = response.responseText && !response.responseText.endsWith('.') ? '. ' : ' ';
            response.responseText = (response.responseText || '') + separator + climaxResult.npcReaction;
        }
        
        // Add player climax notification if applicable
        if (climaxResult.playerClimax) {
            const playerGender = (player.stats && player.stats.gender) ? player.stats.gender.toLowerCase() : "male";
            if (playerGender === "male" || playerGender.includes("male")) {
                if (!response.responseText.includes("You climax") && !response.responseText.includes("you climax")) {
                    response.responseText = (response.responseText || '') + " You climax intensely.";
                }
            } else {
                if (!response.responseText.includes("You climax") && !response.responseText.includes("you climax")) {
                    response.responseText = (response.responseText || '') + " You reach a powerful orgasm.";
                }
            }
        }
    }
    
    return response;
}

/**
 * Handle clothing removal/adjustment actions
 */
function handleClothingAction(npc, player, act, clothingState) {
    if (!act.clothingItem && !act.clothingAction) {
        // Bulk undress
        if (act.target === "player") {
            clothingState.player = { top: false, bottom: false, undergarments: false };
        } else if (act.target === "npc") {
            clothingState.npc = { top: false, bottom: false, undergarments: false };
        }
    } else {
        // Specific item action
        const targetClothing = act.target === "player" ? clothingState.player : clothingState.npc;
        
        if (act.clothingAction === "move_aside" || act.clothingAction === "lift" || act.clothingAction === "pull_down") {
            // These are adjustment actions - clothing stays on but is moved
            // For now, we'll treat them as removing the item
            targetClothing[act.clothingItem] = false;
        } else {
            // Remove action
            targetClothing[act.clothingItem] = false;
        }
    }
    
    return {
        action: act.id,
        type: "clothing",
        clothingState: { ...clothingState },
        text: `You ${act.desc.charAt(0).toLowerCase() + act.desc.slice(1)}.`
    };
}

/**
 * Handle penetration state changes
 */
function handlePenetrationAction(npc, player, act, intimacy, actId) {
    if (act.type === ACT_TYPES.PENETRATE) {
        // Start penetration
        // playerIsBottom indicates if player is receiving penetration
        const playerIsBottom = act.playerIsBottom || false;
        
        // Check if already penetrating a different orifice - if so, need to pull out first
        // (This should be caught by checkActionValidity, but add safety check here)
        if (intimacy.penetration.active) {
            const currentTarget = intimacy.penetration.target;
            const newTarget = act.target;
            
            // Allow compatible targets (vagina/pussy, anus/ass, etc.)
            const compatibleTargets = {
                vagina: ["pussy", "clitoris", "clit"],
                pussy: ["vagina", "clitoris", "clit"],
                anus: ["ass", "butthole"],
                ass: ["anus", "butthole"],
                mouth: ["lips"],
                lips: ["mouth"]
            };
            
            const isCompatible = currentTarget && newTarget && 
                (currentTarget === newTarget || 
                 (compatibleTargets[currentTarget] && compatibleTargets[currentTarget].includes(newTarget)));
            
            // If switching to an incompatible orifice, log warning but allow (validation should have caught this)
            if (!isCompatible) {
                console.warn(`[Intimacy] Attempted to switch penetration from ${currentTarget} to ${newTarget} without pulling out first`);
                // Still allow it but with a pull-out
                endPenetrationWithNarration(npc, intimacy, "forced switch");
            }
        }
        
        intimacy.penetration = {
            active: true,
            tool: act.tool,
            target: act.target,
            depth: 1,
            startedAt: Date.now(),
            playerIsBottom: playerIsBottom,
            actId: actId
        };
        
        // Consume lube when penetration starts
        consumeLubeForPenetration(npc, act);
    } else if (act.type === ACT_TYPES.CONTINUE) {
        // Continue penetration
        if (intimacy.penetration.active) {
            intimacy.penetration.depth = Math.min(intimacy.penetration.depth + 1, 5);
            
            // Consume lube for continued penetration
            consumeLubeForPenetration(npc, act);
        }
    }
}

/**
 * Handle virginity loss
 */
function handleVirginityLoss(npc, virginityTypes) {
    if (!npc.intimacy) return;
    
    for (const type of virginityTypes) {
        if (type === VIRGINITY_TYPES.VAGINAL) {
            npc.intimacy.virginity.vaginal = false;
        } else if (type === VIRGINITY_TYPES.ANAL) {
            npc.intimacy.virginity.anal = false;
        }
    }
    
    console.log(`[Intimacy] ${npc.name || 'NPC'} lost virginity: ${virginityTypes.join(', ')}`);
}

/**
 * Handle lube addition from specific actions
 * Licking/rimming and ejaculating on body parts adds lubrication
 */
function handleLubeFromAction(npc, act) {
    if (!npc || !act) return;
    
    // Actions that add lube to vagina
    const vaginaLubeActions = [
        "lick_pussy", "eat_pussy", "tongue_pussy", "suck_clit",
        "lick_player_pussy", "eat_player_pussy"
    ];
    
    // Actions that add lube to anus
    const anusLubeActions = [
        "lick_anus", "suck_anus", "rim_anus", "tongue_anus",
        "lick_player_anus", "rim_player_anus"
    ];
    
    // Actions that add lube to mouth
    const mouthLubeActions = [
        "lick_penis", "suck_penis", "deepthroat_penis",
        "lick_balls", "suck_balls", "accept_penis_mouth"
    ];
    
    // Ejaculation actions - add lube to the target body part
    const ejaculationActions = {
        "ejaculate_on_face": "general",
        "ejaculate_on_chest": "general",
        "ejaculate_on_stomach": "general",
        "ejaculate_on_butt": "anus",
        "ejaculate_on_back": "general",
        "ejaculate_on_legs": "general",
        "ejaculate_on_feet": "general",
        "ejaculate_in_vagina": "vagina",
        "ejaculate_in_anus": "anus",
        "ejaculate_in_mouth": "mouth",
        "fuck_mouth": "mouth"
    };
    
    // Check for vagina lube actions
    if (vaginaLubeActions.includes(act.id)) {
        addLube(npc, "vagina", 50);
    }
    
    // Check for anus lube actions
    if (anusLubeActions.includes(act.id)) {
        addLube(npc, "anus", 50);
    }
    
    // Check for mouth lube actions
    if (mouthLubeActions.includes(act.id)) {
        addLube(npc, "mouth", 50);
    }
    
    // Check for ejaculation actions
    if (ejaculationActions[act.id]) {
        const targetPart = ejaculationActions[act.id];
        addLube(npc, targetPart, 80);
    }
}

/**
 * Consume lube for penetration actions
 * Determines which body part needs lube based on the penetration target
 */
function consumeLubeForPenetration(npc, act) {
    if (!npc || !npc.intimacy || !npc.intimacy.lube) return;
    
    const target = act.target || "";
    const tool = act.tool || "";
    const actIdLower = (act.id || "").toLowerCase();
    
    // Determine which body part's lube to consume
    let lubePart = "general";
    
    // For penetration, the target is what's being penetrated
    if (target === "vagina" || target === "pussy" || target === "clitoris" ||
        actIdLower.includes("pussy") || actIdLower.includes("vagina") || actIdLower.includes("clitoris") ||
        actIdLower.includes("clit") || actIdLower.includes("fold")) {
        lubePart = "vagina";
    } else if (target === "anus" || target === "buttocks" || target === "butt" || target === "ass" ||
               actIdLower.includes("anal") || actIdLower.includes("anus") || actIdLower.includes("butt") || actIdLower.includes("ass")) {
        lubePart = "anus";
    } else if (target === "mouth" || target === "lips" || target === "face" ||
               actIdLower.includes("mouth") || actIdLower.includes("oral") || actIdLower.includes("kiss")) {
        lubePart = "mouth";
    }
    
    // Consume lube from the appropriate body part
    useLube(npc, lubePart, 5);
    
    console.log(`[Intimacy] Consumed lube from ${lubePart} for penetration`);
}

/**
 * Handle climax/organism for player and/or NPC
 * Returns info about what happened
 */
function handleClimax(npc, player, act, intimacy) {
    if (!npc.intimacy) return null;
    
    const result = {
        playerClimax: false,
        npcClimax: false,
        cooldownApplied: false,
        pregnancyRisk: false,
        pregnancyRolled: false,
        pregnant: false
    };
    
    // Determine gender
    const playerGender = (player.stats && player.stats.gender) ? player.stats.gender.toLowerCase() : "male";
    const npcGender = (npc.gender || "female").toLowerCase();
    
    // Check if player climaxed
    if (intimacy.arousal.player >= AROUSAL_CONFIG.ORGASM_THRESHOLD) {
        result.playerClimax = true;
        intimacy.arousal.player = Math.max(0, intimacy.arousal.player - (AROUSAL_CONFIG.ORGASM_THRESHOLD * 0.7));
        intimacy.climax.playerOrgasms++;
        intimacy.climax.lastPlayerClimax = Date.now();
        
        // Apply cooldown for males
        if (playerGender === "male") {
            const cooldownDuration = determineMaleCooldown(intimacy.climax.playerOrgasms);
            intimacy.climax.playerCooldownUntil = Date.now() + cooldownDuration;
            result.cooldownApplied = true;
            result.playerCooldownUntil = intimacy.climax.playerCooldownUntil;
        }
    }
    
    // Check if NPC climaxed
    if (intimacy.arousal.npc >= AROUSAL_CONFIG.ORGASM_THRESHOLD) {
        result.npcClimax = true;
        intimacy.arousal.npc = Math.max(0, intimacy.arousal.npc - (AROUSAL_CONFIG.ORGASM_THRESHOLD * 0.7));
        intimacy.climax.npcOrgasms++;
        intimacy.climax.lastNPCClimax = Date.now();
        
        // Apply cooldown for male NPCs
        if (npcGender === "male") {
            const cooldownDuration = determineMaleCooldown(intimacy.climax.npcOrgasms);
            intimacy.climax.npcCooldownUntil = Date.now() + cooldownDuration;
            result.cooldownApplied = true;
        }
    }
    
    // Check for pregnancy risk if internal ejaculation occurred
    if (act.consequence === CLIMAX_CONFIG.CONSEQUENCE_TYPES.INTERNAL_SEMEN) {
        if (npcGender === "female" && playerGender === "male") {
            result.pregnancyRisk = checkPregnancyRisk(npc);
            if (result.pregnancyRisk) {
                result.pregnancyRolled = true;
                result.pregnant = attemptPregnancy(npc);
            }
        }
        // Track internal ejaculation target for semen drip narratives
        // Extract target from action ID (e.g., "ejaculate_in_vagina" -> "vagina")
        const ejaculationTarget = act.id ? act.id.replace("ejaculate_in_", "").replace("ejaculate_on_", "") : null;
        if (ejaculationTarget && (ejaculationTarget === "vagina" || ejaculationTarget === "anus")) {
            intimacy.climax.lastInternalEjaculation = ejaculationTarget;
            intimacy.climax.hasInternalEjaculation = true;
            result.internalEjaculation = ejaculationTarget;
        }
    }
    
    // Generate NPC climax reaction
    if (result.npcClimax) {
        result.npcReaction = generateNPCClimaxReaction(npc, npcGender, intimacy);
    }
    
    console.log(`[Intimacy] Climax: Player=${result.playerClimax}, NPC=${result.npcClimax}, Cooldown=${result.cooldownApplied}, PregnancyCheck=${result.pregnancyRolled}`);
    
    return result;
}

/**
 * Determine male cooldown duration based on orgasm count
 */
function determineMaleCooldown(orgasmCount) {
    if (orgasmCount >= 5) return CLIMAX_CONFIG.MALE_COOLDOWN_EXHAUSTED;
    if (orgasmCount >= 3) return CLIMAX_CONFIG.MALE_COOLDOWN_LONG;
    if (orgasmCount >= 2) return CLIMAX_CONFIG.MALE_COOLDOWN_NORMAL;
    return CLIMAX_CONFIG.MALE_COOLDOWN_SHORT;
}

/**
 * Handle fluid/consequence from climax actions
 */
function handleFluidConsequence(npc, player, consequenceType, intimacy) {
    if (!npc.intimacy || !CLIMAX_CONFIG.CONSEQUENCE_TYPES[consequenceType]) return;
    
    // Track what happened in this encounter
    switch (consequenceType) {
        case CLIMAX_CONFIG.CONSEQUENCE_TYPES.INTERNAL_SEMEN:
            intimacy.fluids.internalSemen = true;
            break;
        case CLIMAX_CONFIG.CONSEQUENCE_TYPES.ORAL_SEMEN:
            intimacy.fluids.oralSemen = true;
            break;
        case CLIMAX_CONFIG.CONSEQUENCE_TYPES.EXTERNAL_SEMEN:
            intimacy.fluids.externalSemen = true;
            break;
        case CLIMAX_CONFIG.CONSEQUENCE_TYPES.FEMALE_EJACULATE:
            intimacy.fluids.femaleEjaculate = true;
            break;
    }
    
    console.log(`[Intimacy] Fluid consequence: ${consequenceType}`);
}

/**
 * Check if actor is on cooldown for a specific action
 * Only applies to male characters
 */
function checkCooldownForAction(npc, player, act) {
    const playerGender = (player.stats && player.stats.gender) ? player.stats.gender.toLowerCase() : "male";
    const npcGender = (npc.gender || "female").toLowerCase();
    
    // Only males have cooldown
    if (playerGender !== "male" && npcGender !== "male") return true;
    
    const isPlayerActor = !act.playerIsBottom;
    
    if (isPlayerActor && playerGender === "male") {
        // Player is male actor - check player cooldown
        if (npc.intimacy && npc.intimacy.climax && npc.intimacy.climax.playerCooldownUntil) {
            if (Date.now() < npc.intimacy.climax.playerCooldownUntil) {
                return false;
            }
        }
    } else if (!isPlayerActor && npcGender === "male") {
        // NPC is male actor - check NPC cooldown
        if (npc.intimacy && npc.intimacy.climax && npc.intimacy.climax.npcCooldownUntil) {
            if (Date.now() < npc.intimacy.climax.npcCooldownUntil) {
                return false;
            }
        }
    }
    
    return true;
}

/**
 * Check if a specific character (player or NPC) is on cooldown
 */
function isOnCooldown(npc, player, isPlayer = true) {
    if (!npc || !npc.intimacy || !npc.intimacy.climax) return false;
    
    const cooldownUntil = isPlayer ? 
        npc.intimacy.climax.playerCooldownUntil : 
        npc.intimacy.climax.npcCooldownUntil;
    
    if (!cooldownUntil) return false;
    return Date.now() < cooldownUntil;
}

/**
 * Get remaining cooldown time in milliseconds
 */
function getRemainingCooldown(npc, player, isPlayer = true) {
    if (!npc || !npc.intimacy || !npc.intimacy.climax) return 0;
    
    const cooldownUntil = isPlayer ? 
        npc.intimacy.climax.playerCooldownUntil : 
        npc.intimacy.climax.npcCooldownUntil;
    
    if (!cooldownUntil) return 0;
    return Math.max(0, cooldownUntil - Date.now());
}

/**
 * Format cooldown time as readable string
 */
function formatCooldownTime(ms) {
    if (ms <= 0) return "Ready";
    
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
}

/**
 * Check if pregnancy is possible (NPC is female, fertile, not already pregnant)
 */
function checkPregnancyRisk(npc) {
    if (!npc.intimacy || !npc.intimacy.fertility) return false;
    
    const fertility = npc.intimacy.fertility;
    
    // Already pregnant
    if (fertility.isPregnant) return false;
    
    // Not female
    if (fertility.isFertile === null) return false;
    
    // Not currently fertile
    if (!fertility.isFertile) return false;
    
    return true;
}

/**
 * Attempt pregnancy with random chance
 * Returns true if pregnancy occurred
 */
function attemptPregnancy(npc) {
    if (!npc.intimacy || !npc.intimacy.fertility) return false;
    
    const fertility = npc.intimacy.fertility;
    const isFertile = fertility.isFertile || false;
    
    // Determine chance based on fertility
    const chance = isFertile ? CLIMAX_CONFIG.PREGNANCY_CHANCE_FERTILE : CLIMAX_CONFIG.PREGNANCY_CHANCE_BASE;
    
    // Roll the dice
    const rolled = Math.random() < chance;
    
    if (rolled) {
        fertility.isPregnant = true;
        fertility.pregnancyWeek = 1;
        fertility.pregnancyStartDate = Date.now();
        fertility.isFertile = false;
        fertility.fertileUntil = null;
        
        console.log(`[Intimacy] ${npc.name || 'NPC'} is now PREGNANT! (Week 1)`);
    }
    
    return rolled;
}

/**
 * Update arousal levels
 * Returns info about whether climax was triggered
 */
function updateArousal(npc, player, arousalChange) {
    if (!npc.intimacy) return { playerClimax: false, npcClimax: false };
    
    const p = arousalChange.p || 0;
    const n = arousalChange.n || 0;
    
    const oldPlayerArousal = npc.intimacy.arousal.player;
    const oldNpcArousal = npc.intimacy.arousal.npc;
    
    npc.intimacy.arousal.player = Math.max(0, Math.min(AROUSAL_CONFIG.ORGASM_THRESHOLD, npc.intimacy.arousal.player + p));
    npc.intimacy.arousal.npc = Math.max(0, Math.min(AROUSAL_CONFIG.ORGASM_THRESHOLD, npc.intimacy.arousal.npc + n));
    
    // Check if threshold was crossed
    const playerClimax = oldPlayerArousal < AROUSAL_CONFIG.ORGASM_THRESHOLD && 
                         npc.intimacy.arousal.player >= AROUSAL_CONFIG.ORGASM_THRESHOLD;
    const npcClimax = oldNpcArousal < AROUSAL_CONFIG.ORGASM_THRESHOLD && 
                     npc.intimacy.arousal.npc >= AROUSAL_CONFIG.ORGASM_THRESHOLD;
    
    return { playerClimax, npcClimax };
}

/**
 * Generate response for an action
 * Uses CoT-style template system for rich, context-aware responses
 */
async function generateActionResponse(npc, player, act, intimacy, positionId) {
    // Build context for AI
    const context = buildActionContext(npc, player, act, intimacy, positionId);
    
    // First, try to build a rich response using our template system
    // This gives consistent, anatomy-aware, context-aware responses
    const templateResponse = buildIntimacyResponse(npc, player, act, intimacy);
    
    // Check for LLM enhancement (for sexual acts only)
    let finalResponse = templateResponse;
    const currentPosition = (intimacy && intimacy.position && intimacy.position.player) || positionId || "Unknown";
    
    if (isSexualAct(act) && intimacy) {
        // Ensure LLM enhancement is initialized (handles legacy saved games)
        initializeLLMEnhancement(intimacy);
        
        // Try to get cached enhancement
        const cachedEnhancement = getCachedLLMEnhancement(intimacy, act.id, currentPosition);
        if (cachedEnhancement) {
            finalResponse = cachedEnhancement;
        } else {
            // Fire off non-blocking enhancement request for future use
            // This will cache the result when it completes
            requestLLMEnhancement(npc, act, intimacy, templateResponse).catch(e => {
                console.warn(`[Intimacy LLM] Enhancement request failed:`, e);
            });
        }
    }
    
    // If we have the AI system available, use it for additional variety
    // but blend with our template system
    if (typeof ai === 'function') {
        try {
            // Generate the prompt
            const prompt = buildIntimacyPrompt(context);
            
            const result = await ai({
                instruction: prompt,
                startWith: "",
                endButtons: "none",
                generatorName: "cyoaftw-engine-core"
            });
            
            const responseText = result && (result.text || result);
            
            // If AI gives us a good response, use it. Otherwise fall back to finalResponse
            // Also, we can blend: use template for structure, AI for flavor
            if (responseText && responseText.trim() && responseText.includes("<")) {
                // AI provided a formatted response with angle brackets
                return {
                    action: act.id,
                    type: act.type,
                    responseText: responseText,
                    context: context
                };
            } else {
                // AI response wasn't good, use our best response (LLM-enhanced or template)
                return {
                    action: act.id,
                    type: act.type,
                    responseText: finalResponse,
                    context: context
                };
            }
        } catch (error) {
            console.error(`[Intimacy] AI generation failed: ${error}`);
            // Fall back to best response (LLM-enhanced or template)
            return {
                action: act.id,
                type: act.type,
                responseText: finalResponse,
                context: context
            };
        }
    } else {
        // No AI available, use our best response (LLM-enhanced or template)
        return {
            action: act.id,
            type: act.type,
            responseText: finalResponse,
            context: context
        };
    }
}

/**
 * Build context object for AI generation
 */
function buildActionContext(npc, player, act, intimacy, positionId) {
    const position = getPosition(positionId);
    const clothingState = intimacy.clothing;
    
    // Get NPC personality info
    const personality = npc.personalityProfile || {};
    const traits = npc.personalityTraits || [];
    const temperament = npc.temperament || "neutral";
    
    // Get player gender for pronoun handling
    const playerGender = (player.stats && player.stats.gender) ? player.stats.gender.toLowerCase() : "male";
    
    // Build clothing description
    const clothingDesc = buildClothingDescription(clothingState, act.playerIsBottom ? "npc" : "player");
    
    return {
        npc: {
            name: npc.name || "NPC",
            species: npc.species || "Human",
            gender: npc.gender || "female",
            temperament: temperament,
            traits: traits,
            personality: personality,
            arousal: intimacy.arousal.npc,
            virginity: { ...intimacy.virginity }
        },
        player: {
            gender: playerGender,
            arousal: intimacy.arousal.player
        },
        action: {
            actId: act.id,
            type: act.type,
            tool: act.tool,
            target: act.target,
            verb: act.verb,
            label: act.label,
            description: act.desc,
            playerIsBottom: act.playerIsBottom || false
        },
        position: {
            id: positionId,
            label: position ? position.label : positionId,
            description: position ? position.description : ""
        },
        clothing: clothingState,
        clothingDesc: clothingDesc,
        history: intimacy.actionHistory.slice(-3).map(a => getAct(a.actId)),
        stage: getIntimacyStage(clothingState),
        isPenetrating: intimacy.penetration.active,
        hasLube: intimacy.hasLube,
        lubeLevel: intimacy.lubeLevel
    };
}

/**
 * Build clothing state description
 */
function buildClothingDescription(clothingState, actor) {
    const target = actor === "npc" ? "npc" : "player";
    const cs = clothingState[target];
    
    const parts = [];
    if (cs.top) parts.push("top");
    if (cs.bottom) parts.push("bottom");
    if (cs.undergarments) parts.push("underwear");
    
    if (parts.length === 0) {
        return `${actor === "npc" ? "They are" : "You are"} completely nude.`;
    } else if (parts.length === 3) {
        return `${actor === "npc" ? "They are" : "You are"} fully clothed.`;
    } else {
        return `${actor === "npc" ? "They have" : "You have"} ${parts.join(" and ")} on.`;
    }
}

/**
 * Build AI prompt for intimacy action response
 */
function buildIntimacyPrompt(context) {
    const { npc, player, action, position, clothing, clothingDesc, history, stage, isPenetrating, hasLube } = context;
    
    // Determine who is acting
    const actorIsPlayer = !action.playerIsBottom;
    const actor = actorIsPlayer ? "You" : (npc.name || "They");
    const receiver = actorIsPlayer ? (npc.name || "them") : "You";
    
    // Build the action description
    let actionDesc = action.label;
    if (actorIsPlayer) {
        actionDesc = `You ${action.verb} ${action.target} with your ${action.tool}`;
    } else {
        actionDesc = `${npc.name || "They"} ${action.verb}s your ${action.target} with their ${action.tool}`;
    }
    
    // Build continuity context
    const continuity = buildContinuityContext(history, action);
    
    // Build position context
    const positionContext = `Position: ${position.label}.`;
    
    // Build clothing context
    const clothingContext = `Clothing: ${clothingDesc}`;
    
    // Build arousal context
    const arousalContext = `Arousal: ${describeArousalLevel(npc.arousal)} (NPC), ${describeArousalLevel(player.arousal)} (Player).`;
    
    // Build personality context
    const personalityContext = buildPersonalityContext(npc);
    
    // Build lube context
    const lubeContext = hasLube ? "There is lubrication available." : "There is no lubrication.";
    
    // Build penetration context
    const penetrationContext = isPenetrating ? `Currently penetrating: ${context.penetration.tool} in ${context.penetration.target}.` : "Not currently penetrating.";
    
    // Construct the full prompt
    const prompt = `
INSTRUCTIONS:
- Respond as ${npc.name || "the NPC"} reacting to the following intimate action.
- Write in second person ("you") from ${npc.name || "their"} perspective.
- Include both the NPC's verbal response AND their physical reaction.
- Wrap ALL direct speech in <angle brackets>. Example: <Yes, that feels good.>
- Third-person actions (She sighs, He leans) go OUTSIDE the angle brackets.
- Be vivid, sensual, and in-character based on the personality traits below.
- If this is a continuation of a previous action, maintain flow and build on it.
- Do NOT include the player's action in your response - only the NPC's reaction.

CONTEXT:
- Action: ${actionDesc}
- ${continuity}
- ${positionContext}
- ${clothingContext}
- ${arousalContext}
- ${penetrationContext}
- ${lubeContext}
${personalityContext}

RESPOND:
`;
    
    return prompt;
}

/**
 * Build continuity context from action history
 */
function buildContinuityContext(history, currentAction) {
    if (!history || history.length === 0) {
        return "This is the first action in this encounter.";
    }
    
    const prevAction = history[history.length - 1];
    
    // Check if same type of action
    if (prevAction.tool === currentAction.tool && prevAction.target === currentAction.target) {
        return `PREVIOUS ACTION: You ${prevAction.verb}ed their ${prevAction.target} with your ${prevAction.tool}. Continue the motion naturally.`;
    }
    
    return `PREVIOUS ACTION: You ${prevAction.verb}ed their ${prevAction.target} with your ${prevAction.tool}.`;
}

/**
 * Build personality context
 */
function buildPersonalityContext(npc) {
    const traits = npc.traits || [];
    const temperament = npc.temperament || "neutral";
    const personality = npc.personality || {};
    
    let context = `\nPERSONALITY:`;
    context += `\n- Temperament: ${temperament}`;
    context += `\n- Traits: ${traits.join(", ") || "none"}`;
    
    if (personality.archetype) {
        context += `\n- Archetype: ${personality.archetype}`;
    }
    
    return context;
}

/**
 * Describe arousal level
 */
function describeArousalLevel(level) {
    if (level < AROUSAL_CONFIG.MINOR_AROUSAL) return "slightly aroused";
    if (level < AROUSAL_CONFIG.MODERATE_AROUSAL) return "aroused";
    if (level < AROUSAL_CONFIG.HIGH_AROUSAL) return "very aroused";
    if (level >= AROUSAL_CONFIG.ORGASM_THRESHOLD) return "at climax";
    return "extremely aroused";
}

/**
 * Build fallback response if AI fails
 * Now uses the CoT-style template system for rich responses
 */
function buildFallbackResponse(npc, player, act, intimacy) {
    // If we have intimacy state, use the full template system
    if (intimacy) {
        return buildIntimacyResponse(npc, player, act, intimacy);
    }
    
    // Simple fallback without intimacy context
    const npcName = npc.name || "They";
    const subjectPronoun = getSubjectPronoun(npc) || "They";
    const possessivePronoun = getPossessivePronoun(npc) || "their";
    const objectPronoun = getObjectPronoun(npc) || "them";
    
    const responses = {
        tease: [
            `<lets out a soft moan.>`,
            `<sighs with pleasure.>`,
            `<responds enthusiastically.>`,
            `<enjoys the attention.>`
        ],
        penetrate: [
            `<gasps.>`,
            `<moans loudly with pleasure.>`,
            `<welcomes you inside.>`,
            `<arches ${possessivePronoun} back.>`
        ],
        continue: [
            `<moans with each thrust.>`,
            `<grips you tightly.>`,
            `<matches your rhythm.>`,
            `<encourages you to continue.>`
        ],
        impact: [
            `<yelps in surprise and pleasure.>`,
            `<gasps at the sensation.>`,
            `<reacts to the sudden contact.>`,
            `<enjoys the firm touch.>`
        ],
        clothing: [
            `<watches as you undress.>`,
            `<helps you with your clothing.>`,
            `<smiles as the clothing comes off.>`,
            `<anticipates what comes next.>`
        ],
        end: [
            `<nods in acknowledgment.>`,
            `<takes a deep breath.>`,
            `<smiles contentedly.>`,
            `<looks at you expectantly.>`
        ]
    };
    
    const category = act.type || "tease";
    const options = responses[category] || responses.tease;
    return options[Math.floor(Math.random() * options.length)];
}

// ============================================================================
// COT-STYLE NARRATIVE RESPONSE SYSTEM
// ============================================================================

/**
 * Arousal level descriptors for context-aware responses
 */
var INTIMACY_AROUSAL_DESCRIPTORS = {
    low: { desc: "slightly aroused", threshold: 0, max: 20 },
    mild: { desc: "warming up", threshold: 21, max: 40 },
    moderate: { desc: "aroused", threshold: 41, max: 60 },
    high: { desc: "very aroused", threshold: 61, max: 80 },
    extreme: { desc: "extremely aroused", threshold: 81, max: 100 },
    climax: { desc: "at the edge of climax", threshold: 95, max: 100 }
};

/**
 * Get arousal descriptor based on level
 */
function getArousalDescriptor(level) {
    if (!level) return INTIMACY_AROUSAL_DESCRIPTORS.low.desc;
    
    for (const key in INTIMACY_AROUSAL_DESCRIPTORS) {
        const desc = INTIMACY_AROUSAL_DESCRIPTORS[key];
        if (level >= desc.threshold && level <= desc.max) {
            return desc.desc;
        }
    }
    return INTIMACY_AROUSAL_DESCRIPTORS.extreme.desc;
}

/**
 * Get body part reaction intensity based on arousal
 */
function getReactionIntensity(arousalLevel) {
    if (arousalLevel < 20) return "softly";
    if (arousalLevel < 40) return "with interest";
    if (arousalLevel < 60) return "with pleasure";
    if (arousalLevel < 80) return "enthusiastically";
    return "passionately";
}

/**
 * Get random reaction from a set, weighted by arousal
 */
function getWeightedReaction(reactions, arousalLevel) {
    if (!reactions || reactions.length === 0) {
        return "responds";
    }
    
    // For high arousal, prefer more intense reactions
    if (arousalLevel > 80 && reactions.intense) {
        return pickRandom(reactions.intense);
    } else if (arousalLevel > 60 && reactions.high) {
        return pickRandom(reactions.high || reactions.intense || reactions.moderate || reactions);
    } else if (arousalLevel > 40 && reactions.moderate) {
        return pickRandom(reactions.moderate || reactions);
    } else if (arousalLevel > 20 && reactions.mild) {
        return pickRandom(reactions.mild || reactions);
    }
    
    // Default to random from all
    return pickRandom(reactions);
}

/**
 * Pick a random element from array
 */
function pickRandom(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return "";
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Body part-specific reaction templates
 * Organized by target body part for context-aware responses
 */
var BODY_PART_REACTIONS = {
    // Hair
    hair: {
        mild: ["tilts her head", "closes her eyes briefly", "smiles softly", "sighs contentedly"],
        moderate: ["lets out a soft moan", "nuzzles into your touch", "murmurs", "arches slightly"],
        high: ["gasps softly", "presses her head against your hand", "whispers your name", "shivers"],
        intense: ["moans with delight", "grinds her head against you", "begs for more", "trembles"]
    },
    
    // Breasts/Nipples
    breasts: {
        mild: ["breathes a little faster", "lets out a soft sigh", "glances at you shyly", "bits her lip"],
        moderate: ["lets out a soft moan", "arches her back slightly", "presses into your touch", "gasps softly"],
        high: ["moans", "grinds against your hand", "whispers encouragement", "shivers"],
        intense: ["gasps and moans loudly", "pushes her chest into your face", "begs you not to stop", "trembles"]
    },
    nipples: {
        mild: ["lets out a tiny gasp", "shivers slightly", "bits her lip", "tenses slightly"],
        moderate: ["lets out a soft moan", "arches her back", "gasps", "presses into your touch"],
        high: ["moans loudly", "twitches", "whispers your name", "grinds against you"],
        intense: ["screams with pleasure", "begs for more", "trembles uncontrollably", "digs her nails into you"]
    },
    
    // Vagina/Pussy
    vagina: {
        mild: ["lets out a soft sigh", "shifts slightly", "glances at you", "smiles warmly"],
        moderate: ["lets out a soft moan", "spreads her legs slightly", "gasps", "presses against your hand"],
        high: ["moans loudly", "grinds against your hand", "whispers encouragement", "shivers"],
        intense: ["gasps and moans", "bucks her hips", "begs for more", "drips with arousal"]
    },
    pussy: {
        mild: ["lets out a soft sigh", "shifts slightly", "glances at you", "smiles warmly"],
        moderate: ["lets out a soft moan", "spreads her legs slightly", "gasps", "presses against your hand"],
        high: ["moans loudly", "grinds against your hand", "whispers encouragement", "shivers"],
        intense: ["gasps and moans", "bucks her hips", "begs for more", "drips with arousal"]
    },
    clitoris: {
        mild: ["lets out a tiny gasp", "shivers", "bits her lip", "tenses"],
        moderate: ["lets out a soft moan", "presses against your fingers", "gasps sharply", "arches her back"],
        high: ["moans loudly", "grinds against you", "whispers please don't stop", "trembles with pleasure"],
        intense: ["screams with pleasure", "bucks wildly", "begs desperately", "nearly climaxing"]
    },
    
    // Buttocks/Anus
    buttocks: {
        mild: ["lets out a soft sigh", "shifts her weight", "glances back at you", "smiles"],
        moderate: ["lets out a soft moan", "presses back against you", "gasps with pleasure", "arches slightly"],
        high: ["moans loudly", "grinds back against you", "whispers encouragement", "shivers with arousal"],
        intense: ["gasps and moans", "pushes back", "begs for more", "trembles with need"]
    },
    anus: {
        mild: ["tenses slightly", "lets out a soft sigh", "shifts nervously", "glances back"],
        moderate: ["lets out a soft moan", "presses back against your touch", "gasps at the sensation", "relaxes slightly"],
        high: ["moans with pleasure", "pushes back against you", "whispers yes", "shivers with arousal"],
        intense: ["gasps and moans loudly", "pushes back eagerly", "begs to be filled", "trembles with need"]
    },
    
    // Penis
    penis: {
        mild: ["lets out a soft sigh", "shifts slightly", "glances at you", "tenses"],
        moderate: ["lets out a soft moan", "hardens further", "gasps with pleasure", "presses into your touch"],
        high: ["moans loudly", "thrusts into your hand", "whispers your name", "shivers with arousal"],
        intense: ["gasps and moans", "bucks his hips", "begs for more", "nearly climaxing"]
    },
    cock: {
        mild: ["lets out a soft sigh", "shifts slightly", "glances at you", "tenses"],
        moderate: ["lets out a soft moan", "hardens further", "gasps with pleasure", "presses into your touch"],
        high: ["moans loudly", "thrusts into your hand", "whispers your name", "shivers with arousal"],
        intense: ["gasps and moans", "bucks his hips", "begs for more", "nearly climaxing"]
    },
    testicles: {
        mild: ["lets out a soft sigh", "shifts slightly", "glances at you", "tenses"],
        moderate: ["lets out a soft moan", "gasps at your touch", "presses into your hand", "shivers slightly"],
        high: ["moans with pleasure", "whispers your name", "shivers with arousal", "tenses with pleasure"],
        intense: ["gasps loudly", "trembles with pleasure", "begs for more", "nearly climaxing"]
    },
    balls: {
        mild: ["lets out a soft sigh", "shifts slightly", "glances at you", "tenses"],
        moderate: ["lets out a soft moan", "gasps at your touch", "presses into your hand", "shivers slightly"],
        high: ["moans with pleasure", "whispers your name", "shivers with arousal", "tenses with pleasure"],
        intense: ["gasps loudly", "trembles with pleasure", "begs for more", "nearly climaxing"]
    },
    
    // General
    general: {
        mild: ["responds", "reacts", "acknowledges", "sighs softly"],
        moderate: ["lets out a soft moan", "sighs with pleasure", "responds enthusiastically", "enjoys the attention"],
        high: ["moans with pleasure", "responds passionately", "whispers encouragement", "shivers with arousal"],
        intense: ["gasps and moans", "responds with desperate need", "begs for more", "trembles with pleasure"]
    }
};

/**
 * Build a CoT-style narrative response for an intimacy action
 * Incorporates:
 * - NPC anatomy and traits
 * - Current arousal level
 * - Action type and target
 * - Dialogue tags from action definition
 * - Personality context
 */
function buildIntimacyResponse(npc, player, act, intimacy) {
    if (!npc || !act) {
        return pickRandom(BODY_PART_REACTIONS.general.moderate);
    }
    
    const npcName = npc.name || "They";
    const isProperName = !/^(a |an |the )/i.test(npcName);
    const subjectPronoun = getSubjectPronoun(npc) || "They";
    const possessivePronoun = getPossessivePronoun(npc) || "their";
    const objectPronoun = getObjectPronoun(npc) || "them";
    
    // Get context
    const arousalLevel = intimacy ? intimacy.arousal.npc : 0;
    const arousalDesc = getArousalDescriptor(arousalLevel);
    const intensity = getReactionIntensity(arousalLevel);
    const target = act.target || "general";
    const tool = act.tool || "hand";
    const verb = act.verb || "touch";
    
    // Check cooldown state for player
    const playerGender = (player.stats && player.stats.gender) ? player.stats.gender.toLowerCase() : "male";
    const isPlayerOnCooldown = playerGender === "male" && intimacy && intimacy.climax && intimacy.climax.playerCooldownUntil && Date.now() < intimacy.climax.playerCooldownUntil;
    const isNPConCooldown = npc.gender && (npc.gender.toLowerCase() === "male" || npc.gender.toLowerCase().includes("male")) && intimacy && intimacy.climax && intimacy.climax.npcCooldownUntil && Date.now() < intimacy.climax.npcCooldownUntil;
    
    // Get body part-specific reactions
    const bodyReactions = BODY_PART_REACTIONS[target] || BODY_PART_REACTIONS.general;
    const reaction = getWeightedReaction(bodyReactions, arousalLevel);
    
    // Get anatomy descriptions
    let anatomyDesc = "";
    let bodyPartDesc = target;
    
    // Try to get actual anatomy description
    if (typeof getNPCTrait === "function") {
        anatomyDesc = getNPCTrait(npc, target) || "";
        if (anatomyDesc && anatomyDesc !== target) {
            bodyPartDesc = anatomyDesc;
        }
    }
    
    // Get dialogue tags from action (CoT-style)
    // Priority: objectDialogueTags (object perspective) > dialogueTags > tags
    const dialogueTags = act.objectDialogueTags || act.dialogueTags || act.tags || [];
    
    // Build response based on action type
    switch (act.type) {
        case ACT_TYPES.TEASE:
            return buildTeaseResponse(npc, player, act, intimacy, subjectPronoun, possessivePronoun, objectPronoun, arousalLevel, bodyPartDesc, reaction, dialogueTags);
            
        case ACT_TYPES.PENETRATE:
            return buildPenetrationResponse(npc, player, act, intimacy, subjectPronoun, possessivePronoun, objectPronoun, arousalLevel, bodyPartDesc, reaction, "enter", dialogueTags);
            
        case ACT_TYPES.CONTINUE:
            return buildPenetrationResponse(npc, player, act, intimacy, subjectPronoun, possessivePronoun, objectPronoun, arousalLevel, bodyPartDesc, reaction, "continue", dialogueTags);
            
        case ACT_TYPES.IMPACT:
            return buildImpactResponse(npc, player, act, intimacy, subjectPronoun, possessivePronoun, objectPronoun, arousalLevel, bodyPartDesc, reaction, dialogueTags);
            
        case ACT_TYPES.END:
            return pickRandom([
                `nods contentedly.`,
                `takes a deep breath and relaxes.`,
                `smiles warmly at you.`,
                `looks at you with warm eyes.`
            ]);
            
        default:
            return buildGenericResponse(npc, subjectPronoun, possessivePronoun, objectPronoun, arousalLevel, reaction, dialogueTags);
    }
}

/**
 * Build response for tease actions
 * Note: Don't include subject pronoun - it's added by formatIntimacyNPCResponse
 * Note: Don't repeat the action - just describe the NPC's reaction
 * Now uses CoT-style dialogue tags for verbal responses
 */
function buildTeaseResponse(npc, player, act, intimacy, subjectPronoun, possessivePronoun, objectPronoun, arousalLevel, bodyPartDesc, reaction, dialogueTags = []) {
    const verb = act.verb || "touch";
    const tool = act.tool || "hand";
    const target = act.target || "body";
    
    // Get descriptors based on arousal
    const tempDesc = getTemperatureDescriptor(arousalLevel);
    const intensity = getReactionIntensity(arousalLevel);
    const vocalization = getVocalization(arousalLevel);
    const pleasureIntensity = getPleasureIntensity(arousalLevel);
    
    // Get dialogue from tags (CoT-style) - 35% chance of verbal response
    let dialogueLine = null;
    if (Math.random() < 0.35 && dialogueTags && dialogueTags.length > 0) {
        dialogueLine = getDialogueFromTags(dialogueTags, arousalLevel, npc);
    }
    
    // Select a response template - just the reaction, no action repetition
    // These will be processed by formatIntimacyNPCResponse which adds subject pronoun
    // Fixed: Removed duplicate combinations like "trembles with pleasure with pleasure"
    // Fixed: Removed "softly" suffix that creates contradictions with reactions that already have adverbs
    // Fixed: Removed templates that create awkward phrasing with pleasureIntensity
    const templates = [
        `${reaction} at your touch.`,
        `${reaction}, ${tempDesc}.`,
        `${reaction} at the sensation.`,
        `lets out a ${vocalization}.`,
        `lets out a ${vocalization} of pleasure.`,
        `shivers ${intensity}.`,
        `${reaction} with obvious pleasure.`,
        `${reaction}, ${tempDesc}.`,
        `${reaction}, breathing ${intensity}.`,
        `${reaction} and bites ${possessivePronoun} lip.`,
        `${reaction} and arches ${possessivePronoun} back.`
    ];
    
    let response = pickRandom(templates);
    
    // Add verbal dialog from tags (CoT-style)
    if (dialogueLine) {
        if (dialogueLine.isNonVerbal) {
            // For non-verbal NPCs, add the sound without quotes as part of the physical reaction
            if (Math.random() < 0.5) {
                response = `${response} ${dialogueLine.text}`;
            }
        } else if (dialogueLine.isVerbal) {
            // For verbal NPCs, add quoted speech
            // 60% chance to replace with dialogue, 40% to append
            if (Math.random() < 0.6) {
                response = `says "${dialogueLine.text}"`;
            } else {
                response = `${response} "${dialogueLine.text}"`;
            }
        }
    }
    
    return response;
}

/**
 * Build response for penetration actions
 * Now uses CoT-style dialogue tags for verbal responses
 */
function buildPenetrationResponse(npc, player, act, intimacy, subjectPronoun, possessivePronoun, objectPronoun, arousalLevel, bodyPartDesc, reaction, phase, dialogueTags = []) {
    const verb = act.verb || "enter";
    let tool = act.tool || "penis";
    const target = (act.target || "vagina").toLowerCase();
    
    // Get more descriptive vocabulary based on arousal
    const vocalization = getVocalization(arousalLevel);
    const pleasureIntensity = getPleasureIntensity(arousalLevel);

    // Check cooldown state for player
    const playerGender = (player.stats && player.stats.gender) ? player.stats.gender.toLowerCase() : "male";
    const isPlayerOnCooldown = playerGender === "male" && intimacy && intimacy.climax && intimacy.climax.playerCooldownUntil && Date.now() < intimacy.climax.playerCooldownUntil;
    
    // Get penis state descriptor based on cooldown
    const toolState = isPlayerOnCooldown ? pickRandom(['limp', 'flaccid', 'soft', 'spent']) : pickRandom(['hard', 'rigid', 'throbbing', 'engorged']);
    
    // Apply state descriptor to penis/cock tool
    if (tool === 'penis' || tool === 'cock') {
        tool = `${toolState} ${tool}`;
    }

    // Check if this is anal penetration with an uncivilized NPC
    const isAnalPenetration = target === "anus" || target === "ass";
    const isVaginalPenetration = target === "vagina" || target === "pussy";
    const isOralPenetration = target === "mouth" || target === "lips";
    const isUncivilized = npc && npc.species && !isCivilizedSpecies(npc.species);
    // For continue phase with anal penetration, replace "closed" descriptors with more appropriate ones
    // Since the anus is already penetrated, it shouldn't be described as "closed" or "resistant"
    if (phase === "continue" && isAnalPenetration) {
        // Replace problematic descriptors
        bodyPartDesc = bodyPartDesc
            .replace(/firmly closed/i, "tightly clenching")
            .replace(/resistant/i, "clenching")
            .replace(/shyly guarded/i, "gripping")
            .replace(/tense and shut/i, "tight")
            .replace(/tightly squeezed/i, "clenching");
    }
    
    // Get anatomy details for specialized responses
    const anatomy = (npc.nsfwTraits && npc.nsfwTraits.anatomy) || (npc.anatomy || {});
    const anusAnatomy = anatomy.anus || {};
    const anusSize = anusAnatomy.size || "snug";
    const hasLube = intimacy && intimacy.lube && intimacy.lube.anus && intimacy.lube.anus.hasLube;
    const lubeLevel = intimacy && intimacy.lube && intimacy.lube.anus ? intimacy.lube.anus.level : 0;
    
    // Get penetration depth for anal-specific narratives
    const penetrationDepth = intimacy && intimacy.penetration ? intimacy.penetration.depth : 0;
    const isDeepPenetration = penetrationDepth >= 3;
    
    // Tight anal sizes that may cause pulling away
    const isTightAnal = anusSize === "tight" || anusSize === "snug" || anusSize === "firm";
    
    // Check if last action was also anal (no pause = continuing same action)
    const lastActionId = intimacy && intimacy.lastAction ? intimacy.lastAction.actId : null;
    const lastWasAnal = lastActionId && (lastActionId.toLowerCase().includes('anus') || lastActionId.toLowerCase().includes('ass'));
    
    // Check for internal ejaculation - semen drip narratives
    const hasInternalEjaculation = intimacy && intimacy.climax && intimacy.climax.hasInternalEjaculation;
    const ejaculationTarget = intimacy && intimacy.climax ? intimacy.climax.lastInternalEjaculation : null;
    const matchingEjaculation = ejaculationTarget && ((isVaginalPenetration && ejaculationTarget === "vagina") || (isAnalPenetration && ejaculationTarget === "anus"));
    const shouldSemenDrip = matchingEjaculation && Math.random() < 0.30;
    
    // Arousal level for climax approach narratives
    const npcArousal = intimacy ? intimacy.arousal.npc : 0;
    const playerArousal = intimacy ? intimacy.arousal.player : 0;
    const maxArousal = Math.max(npcArousal, playerArousal);
    
    // Climax is inevitable when arousal is very high
    const isNearClimax = maxArousal >= AROUSAL_CONFIG.HIGH_AROUSAL && maxArousal < AROUSAL_CONFIG.ORGASM_THRESHOLD;
    const isAtClimaxThreshold = maxArousal >= AROUSAL_CONFIG.ORGASM_THRESHOLD;
    
    // Get arousal descriptors
    const npcArousalDesc = describeArousalLevel(npcArousal);
    const playerArousalDesc = describeArousalLevel(playerArousal);
    
    // Chance for receiver to pull away (higher if tight and no lube)
    const shouldPullAway = isAnalPenetration && Math.random() < 0.15 && isTightAnal;
    
    // Chance for trapped air/fart (only after several rounds without changing action)
    const shouldFart = isAnalPenetration && isDeepPenetration && lastWasAnal && Math.random() < 0.20;
    
    // Anal pee - check if pending from executeIntimacyAction
    const hasPendingPee = intimacy && intimacy.pendingEvents && 
        intimacy.pendingEvents.some(e => e.type === "analPee");
    
    // Clean up pending event after checking
    if (hasPendingPee && intimacy.pendingEvents) {
        intimacy.pendingEvents = intimacy.pendingEvents.filter(e => e.type !== "analPee");
    }
    
    // For uncivilized species doing anal - they're confused/surprised but consenting
    if (isAnalPenetration && isUncivilized) {
        // Different responses for first-time (enter) vs continuing
        if (phase === "continue") {
            const confusedContinueResponses = [
                `still seems unsure. "This is... unusual."`,
                `shifts uncomfortably. "I'm not used to this..."`,
                `grunts. "This feels different... but not bad."`,
                `mumbles. "Strange, but I'll go with it."`,
                `adjusts ${possessivePronoun} position. "This takes some getting used to."`,
                `gives you a side glance. "You humans are odd."`,
                `takes a deep breath. "Alright, keep going I guess."`,
                `seems to be warming up to it. "Hmm... interesting."`
            ];
            return pickRandom(confusedContinueResponses);
        } else {
            // First penetration - more surprised
            const confusedEnterResponses = [
                `blinks in confusion. "What are you doing back there?"`,
                `tilts ${possessivePronoun} head. "That's... that's the wrong place, isn't it?"`,
                `looks surprised. "That's not how we conceive... but, okay?"`,
                `frowns slightly. "Are you sure about this?"`,
                `hesitates, then shrugs. "If you insist..."`,
                `gives you a puzzled look. "That feels... strange."`,
                `mumbles. "I've never... but I'll try."`,
                `seems uncertain. "This isn't normal where I come from."`,
                `narrows ${possessivePronoun} eyes. "Is this some kind of joke?"`,
                `tenses up. "Wait, that goes where?"`
            ];
            return pickRandom(confusedEnterResponses);
        }
    }
    
    // Get dialogue from tags (CoT-style) - 50% chance for penetration
    let dialogueLine = null;
    if (Math.random() < 0.50 && dialogueTags && dialogueTags.length > 0) {
        dialogueLine = getDialogueFromTags(dialogueTags, arousalLevel, npc);
    }
    
    // Type-specific penetration templates
    const vaginalTemplates = {
        enter: [
            isNearClimax ? `gasps as you enter ${possessivePronoun} vagina, ${subjectPronoun.toLowerCase()} teetering on the edge of climax.` : 
            (shouldSemenDrip ? `gasps as you enter ${possessivePronoun} vagina, your previous load squirting out around your ${tool}.` : 
            `gasps as you fill ${possessivePronoun} vagina.`),
            isNearClimax ? `${subjectPronoun} trembles with impending release as you sink into ${possessivePronoun} warm, wet depths, clenching around your ${tool}.` : 
            (shouldSemenDrip ? `${possessivePronoun} warm, wet depths clench around your ${tool} as you enter, your semen dripping out.` : 
            `sighs as you slide into ${possessivePronoun} warmth, ${possessivePronoun} depths clenching around your ${tool}.`),
            isNearClimax ? `moans softly as you sink into ${possessivePronoun} tight heat, ${subjectPronoun.toLowerCase()} is so close to the peak ${subjectPronoun.toLowerCase()} can barely contain it.` : 
            (shouldSemenDrip ? `moans softly as you sink into ${possessivePronoun} tight heat, your earlier release leaking out with each movement.` : 
            `moans softly as you sink into ${possessivePronoun} tight heat.`),
            isNearClimax ? `arches ${possessivePronoun} back, ${possessivePronoun} body enveloping you in liquid warmth, ${subjectPronoun.toLowerCase()} is nearly there.` : 
            `arches ${possessivePronoun} back, ${possessivePronoun} body enveloping you in liquid warmth.`,
            isNearClimax ? `takes you in deeply, ${possessivePronoun} slick folds greedy for more, ${subjectPronoun.toLowerCase()} is right on the brink.` : 
            (shouldSemenDrip ? `takes you in deeply, your semen seeping out as ${possessivePronoun} slick folds greedy for more.` : 
            `takes you in deeply, ${possessivePronoun} slick folds greedy for more.`),
            `${subjectPronoun} gasps as you ${verb} into ${objectPronoun}, ${possessivePronoun} hips rising to meet you.`,
            `clutches at you as you enter ${possessivePronoun}, ${possessivePronoun} inner walls pulsing around your ${tool}.`
        ],
        continue: [
            isNearClimax ? `moans with each thrust into ${possessivePronoun}, ${possessivePronoun} vagina gripping you in wet heat, ${subjectPronoun.toLowerCase()} is so close to climax ${subjectPronoun.toLowerCase()} can't last much longer.` : 
            (shouldSemenDrip ? `moans with each thrust into ${possessivePronoun}, ${possessivePronoun} vagina gripping you in wet heat, your semen dripping out with every movement.` : 
            `moans with each thrust into ${possessivePronoun}, ${possessivePronoun} vagina gripping you in wet heat.`),
            isNearClimax ? `matches your rhythm, ${possessivePronoun} slick channel clenching desperately around your ${tool}, ${subjectPronoun.toLowerCase()} is right on the edge.` : 
            (shouldSemenDrip ? `matches your rhythm, ${possessivePronoun} slick channel clenching around your ${tool}, your earlier ejaculation leaking out.` : 
            `matches your rhythm, ${possessivePronoun} slick channel clenching and releasing around your ${tool}.`),
            isNearClimax ? `grinds back against you, ${possessivePronoun} wet warmth taking you deeper, ${subjectPronoun.toLowerCase()} is trembling with the need to climax.` : 
            `grinds back against you, ${possessivePronoun} wet warmth taking you deeper.`,
            isNearClimax ? `whispers encouragement mixed with desperation as you continue, ${subjectPronoun.toLowerCase()} is at the peak of arousal.` : 
            `whispers encouragement as you continue, ${possessivePronoun} desire evident in every movement.`,
            isNearClimax ? `${possessivePronoun} inner walls pulse and ripple frantically around your shaft with each thrust, ${subjectPronoun.toLowerCase()} is so close to release.` : 
            (shouldSemenDrip ? `${possessivePronoun} inner walls pulse and ripple around your shaft with each thrust, pushing out traces of your semen.` : 
            `${possessivePronoun} inner walls pulse and ripple around your shaft with each thrust.`),
            `raises ${possessivePronoun} hips to meet your thrusts, drawing you in deeper.`
        ]
    };
    
    
    // Random chance for gag reflex in oral
    const hasGagReflex = Math.random() < 0.25;
    
    // Anal penetration templates
    const analTemplates = {
        enter: [
            isNearClimax ? `grits ${possessivePronoun} teeth briefly as you enter ${possessivePronoun} anus, ${subjectPronoun.toLowerCase()} is so close to the peak ${subjectPronoun.toLowerCase()} can barely contain it.` : 
            (shouldSemenDrip ? `grits ${possessivePronoun} teeth briefly as you enter ${possessivePronoun} anus, your previous load squirting out around your ${tool}.` : 
            `grits ${possessivePronoun} teeth briefly as you enter ${possessivePronoun} anus.`),
            isNearClimax ? `trembles as you breach ${possessivePronoun} tight entrance, ${subjectPronoun.toLowerCase()} is nearly there.` : 
            (shouldSemenDrip ? `trembles as you breach ${possessivePronoun} tight entrance, your semen dripping out as you push in.` : 
            `trembles as you breach ${possessivePronoun} tight entrance, the resistance giving way.`),
            isNearClimax ? `pushes back against you as you enter, ${possessivePronoun} tight channel clenching around your ${tool}, ${subjectPronoun.toLowerCase()} is right on the brink.` : 
            `pushes back against you as you enter, ${possessivePronoun} tight channel clenching around your ${tool}.`,
            `${subjectPronoun} gasps as you ${verb} into ${objectPronoun}, ${possessivePronoun} hot vice pressure intense.`,
            `clenches around you as you enter ${possessivePronoun}, ${possessivePronoun} anus adjusting to your intrusion.`
        ],
        continue: [
            isNearClimax ? `clenches desperately around your shaft, ${subjectPronoun.toLowerCase()} is so close to climax ${subjectPronoun.toLowerCase()} can't hold back much longer, ${possessivePronoun} hot cavity gripping your ${tool}.` : 
            (shouldSemenDrip ? `clenches around your shaft, ${possessivePronoun} hot cavity gripping your ${tool}, your semen seeping out with each thrust.` : 
            `clenches around your shaft, ${possessivePronoun} hot cavity gripping your ${tool}.`),
            isNearClimax ? `matches your rhythm, ${possessivePronoun} tight channel clenching desperately around your ${tool}, ${subjectPronoun.toLowerCase()} is right on the edge.` : 
            (shouldSemenDrip ? `matches your rhythm, ${possessivePronoun} tight channel clenching around your ${tool}, your earlier ejaculation leaking out.` : 
            `matches your rhythm, ${possessivePronoun} tight channel clenching and releasing around your ${tool}.`),
            isNearClimax ? `grunts with each thrust, ${subjectPronoun.toLowerCase()} is so close to climax ${subjectPronoun.toLowerCase()} can't last much longer, your ${tool} in ${possessivePronoun} hot cavity.` : 
            `grunts with each thrust, ${possessivePronoun} hot cavity taking you in.`,
            isNearClimax ? `${possessivePronoun} hot cavity pulses around your shaft with each movement, ${subjectPronoun.toLowerCase()} is so close to release.` : 
            (shouldSemenDrip ? `${possessivePronoun} hot cavity pulses around your shaft with each movement, pushing out traces of your semen.` : 
            `${possessivePronoun} hot cavity pulses around your shaft with each movement.`)
        ]
    };
    
    const oralTemplates = {
        enter: [
            // Explicit oral sex descriptions with physical reactions
            isNearClimax ? `parts ${possessivePronoun} lips eagerly, ${subjectPronoun} desperate to please you as ${subjectPronoun} nears bringing you to climax, saliva dripping from ${possessivePronoun} lips.` : 
            (hasGagReflex ? `opens ${possessivePronoun} mouth wide, gagging slightly as you press past ${possessivePronoun} throat, a string of saliva connecting ${possessivePronoun} lips to your shaft.` : 
            `opens ${possessivePronoun} mouth wide to take your cock, ${possessivePronoun} cheeks hollowing in anticipation.`),
            isNearClimax ? `wraps ${possessivePronoun} lips around your ${tool} with eager hunger, ${subjectPronoun} trembling with the effort to bring you to release, ${possessivePronoun} teeth gently brushing your shaft.` : 
            (hasGagReflex ? `tries to take you deep but gags, ${possessivePronoun} eyes watering briefly, drool escaping ${possessivePronoun} lips as ${subjectPronoun} recovers and adjusts.` : 
            `wraps ${possessivePronoun} lips around your ${tool}, ${possessivePronoun} tongue already swirling, saliva glistening at the corners of ${possessivePronoun} mouth.`),
            isNearClimax ? `takes your cock between ${possessivePronoun} lips, ${possessivePronoun} warm mouth working frantically as ${subjectPronoun} works to bring you to the peak, ${possessivePronoun} cheeks flushed with the effort.` : 
            (hasGagReflex ? `chokes as you enter ${possessivePronoun} throat, ${possessivePronoun} reflexes kicking in, ${subjectPronoun} breathing heavily through ${possessivePronoun} nose.` : 
            `takes you between ${possessivePronoun} lips, ${possessivePronoun} warm mouth enveloping your cockhead, saliva beginning to drip.`),
            isNearClimax ? `takes your cock with eager enthusiasm, the vibration of ${possessivePronoun} mumbled sounds adding to the stimulation as ${subjectPronoun.toLowerCase()} is hovering at the peak, barely able to contain ${possessivePronoun} excitement.` : 
            (hasGagReflex ? `gags as you hit the back of ${possessivePronoun} throat, but ${subjectPronoun} quickly adjusts, a thin line of drool escaping and continues taking you in.` : 
            `parts ${possessivePronoun} lips and accepts your cock, ${possessivePronoun} mouth hot and wet around your shaft, saliva already pooling.`),
            isNearClimax ? `takes you in deeply, ${possessivePronoun} tongue pressing urgently against the underside of your cock, ${subjectPronoun.toLowerCase()} is right on the edge, drool dripping down ${possessivePronoun} chin.` : 
            (hasGagReflex ? `struggles briefly with ${possessivePronoun} gag reflex as you enter, then relaxes ${possessivePronoun} throat, ${possessivePronoun} lips stretched taut around your girth.` : 
            `takes you in, ${possessivePronoun} tongue pressing against the underside, saliva beginning to spill.`)
        ],
        continue: [
            // Continue with oral - show NPC is actively giving oral and aroused by performing
            isNearClimax ? `works you desperately with ${possessivePronoun} mouth, ${subjectPronoun} determined to bring you to climax, ${possessivePronoun} lips gliding frantically along your shaft, drool slick on ${possessivePronoun} chin.` : 
            (hasGagReflex && Math.random() < 0.5 ? `works you with ${possessivePronoun} mouth, ${possessivePronoun} throat twitching as ${subjectPronoun} suppresses another gag, strings of saliva connecting ${possessivePronoun} lips to your cock.` : 
            `works you with ${possessivePronoun} mouth, ${possessivePronoun} lips gliding along your shaft, saliva dripping steadily.`),
            isNearClimax ? `bobs ${possessivePronoun} head urgently, taking you deeper with each frantic pass, ${subjectPronoun} working eagerly to bring you to the peak, ${possessivePronoun} cheeks hollowing with each movement.` : 
            (hasGagReflex && Math.random() < 0.5 ? `bobs ${possessivePronoun} head carefully, fighting back ${possessivePronoun} gag reflex as you go deeper, ${possessivePronoun} eyes watering but ${subjectPronoun} persists.` : 
            `bobs ${possessivePronoun} head, taking you deeper with each pass, ${possessivePronoun} throat working your cock, saliva dripping from ${possessivePronoun} lips.`),
            isNearClimax ? `uses ${possessivePronoun} tongue with desperate skill as ${subjectPronoun} nears bringing you to climax, moving urgently along your ${tool}, ${possessivePronoun} mumbled sounds vibrating against your shaft.` : 
            (hasGagReflex ? `uses ${possessivePronoun} tongue skillfully despite the occasional gag as ${subjectPronoun} moves along your ${tool}, drool glistening on ${possessivePronoun} chin.` : 
            `uses ${possessivePronoun} tongue skillfully as ${subjectPronoun} moves along your ${tool}, saliva pooling in ${possessivePronoun} mouth.`),
            isNearClimax ? `maintains a frantic rhythm, ${subjectPronoun} eager to bring you to release, ${possessivePronoun} lips tight around your shaft as ${subjectPronoun} works toward your climax, ${possessivePronoun} cheeks flushed with arousal from the act.` : 
            (hasGagReflex && Math.random() < 0.5 ? `maintains a steady rhythm despite ${possessivePronoun} gagging, ${possessivePronoun} lips tight around your shaft, drool dripping freely.` : 
            `maintains a steady rhythm, ${possessivePronoun} mouth warm and tight around your shaft, saliva beginning to drip down ${possessivePronoun} chin.`),
            isNearClimax ? `hollows ${possessivePronoun} cheeks urgently, creating intense suction as ${subjectPronoun} continues working you toward climax, ${possessivePronoun} mumbled sounds encouraging you on.` : 
            `hollows ${possessivePronoun} cheeks, creating delicious suction as ${subjectPronoun} continues, saliva dripping from the corners of ${possessivePronoun} mouth.`
        ]
    };
    
    // Select templates based on penetration type
    let templates;
    if (isVaginalPenetration) {
        templates = vaginalTemplates;
    } else if (isAnalPenetration) {
        templates = analTemplates;
    } else if (isOralPenetration) {
        templates = oralTemplates;
    } else {
        // Fallback to generic templates
        templates = {
            enter: [
                `gasps as ${possessivePronoun} ${bodyPartDesc} accepts you.`,
                `${subjectPronoun} gasps as you enter ${possessivePronoun} ${bodyPartDesc}, ${possessivePronoun} depths clenching around your ${tool}.`,
                `moans softly as you fill ${possessivePronoun} ${bodyPartDesc}.`
            ],
            continue: [
                `moans with each thrust, ${possessivePronoun} ${bodyPartDesc} gripping you tightly.`,
                `matches your rhythm, ${possessivePronoun} ${bodyPartDesc} clenching around your ${tool}.`,
                `grinds back against you, taking you deeper.`
            ]
        };
    }
    
    let response = pickRandom(templates[phase] || templates.enter);
    
    // Scent descriptors are now added in the player narrative builder functions
    // to avoid double insertion, so we skip adding them here
    
    // Add verbal dialog from tags (CoT-style)
    if (dialogueLine) {
        // Only add if not already a verbal response
        if (!response.includes('"')) {
            if (dialogueLine.isNonVerbal) {
                // For non-verbal NPCs, add the sound without quotes
                if (Math.random() < 0.5) {
                    response = `${response} ${dialogueLine.text}`;
                }
            } else if (dialogueLine.isVerbal) {
                // For verbal NPCs, add quoted speech
                if (Math.random() < 0.5) {
                    response = `${response} "${dialogueLine.text}"`;
                }
            }
        }
    }
    
    return response;
}

/**
 * Generate NPC climax reaction
 * Creates appropriate response based on NPC gender and personality
 */
function generateNPCClimaxReaction(npc, npcGender, intimacy) {
    if (!npc) return null;
    
    const subjectPronoun = getSubjectPronoun(npc) || "She";
    const possessivePronoun = getPossessivePronoun(npc) || "her";
    const objectPronoun = getObjectPronoun(npc) || "them";
    const vocalization = getVocalization(100); // Max arousal vocalization
    
    // Get personality-based intensity
    const personality = npc.temperament || npc.personality || "neutral";
    const isShy = personality.includes("shy");
    const isBold = personality.includes("bold");
    const isSubmissive = personality.includes("submissive");
    const isDominant = personality.includes("dominant");
    
    // Gender-specific climax reactions
    // Use anatomy-aware descriptions based on what the NPC actually has
    const anatomy = (npc.anatomy || {});
    const nsfwAnatomy = (npc.nsfwTraits && npc.nsfwTraits.anatomy) || {};
    const mergedAnatomy = { ...anatomy, ...nsfwAnatomy };
    const hasPenis = mergedAnatomy.penis || mergedAnatomy.cock || mergedAnatomy.dick;
    const hasVagina = mergedAnatomy.vagina || mergedAnatomy.pussy;
    
    const maleClimaxTemplates = [
        `${subjectPronoun} groans deeply, ${possessivePronoun} body tensing as ${subjectPronoun} reaches ${possessivePronoun} peak.`,
        `${subjectPronoun} lets out a guttural cry, ${possessivePronoun} hips bucking involuntarily with release.`,
        hasPenis ? `${subjectPronoun} shudders violently, ${possessivePronoun} ${hasPenis.description || 'cock'} pulsing as ${subjectPronoun} climaxes.` : 
                   `${subjectPronoun} shudders violently, ${possessivePronoun} body convulsing as ${subjectPronoun} climaxes.`,
        `${subjectPronoun} throws ${possessivePronoun} head back with a groan, ${possessivePronoun} orgasm crashing over ${objectPronoun}.`,
        `${subjectPronoun} grunts rhythmically, ${possessivePronoun} body rigid with the intensity of ${possessivePronoun} release.`
    ];
    
    const femaleClimaxTemplates = [
        `${subjectPronoun} cries out, ${possessivePronoun} body arching as waves of pleasure crash over ${objectPronoun}.`,
        hasVagina ? `${subjectPronoun} whimpers and trembles, ${possessivePronoun} inner walls pulsing with ${possessivePronoun} orgasm.` : 
                   `${subjectPronoun} whimpers and trembles, ${possessivePronoun} body shaking with ${possessivePronoun} orgasm.`,
        `${subjectPronoun} gasps and clutches at you, ${possessivePronoun} climax overwhelming ${objectPronoun}.`,
        `${subjectPronoun} moans loudly, ${possessivePronoun} hips gyrating uncontrollably as ${subjectPronoun} comes.`,
        `${subjectPronoun} bites ${possessivePronoun} lip and shudders, ${possessivePronoun} body consumed by pleasure.`
    ];
    
    // Gender-neutral/climax templates (for non-binary, androgynous, etc.)
    const neutralClimaxTemplates = [
        `${subjectPronoun} cries out, ${possessivePronoun} body trembling with the force of ${possessivePronoun} climax.`,
        `${subjectPronoun} shudders violently, overwhelmed by waves of pleasure.`,
        `${subjectPronoun} lets out a loud ${vocalization}, ${possessivePronoun} entire body tensing with release.`,
        `${subjectPronoun} clings to you desperately, ${possessivePronoun} climax crashing over ${objectPronoun}.`
    ];
    
    // Select templates based on gender and anatomy
    let templates;
    if ((npcGender === "male" || npcGender.includes("male")) && hasPenis) {
        templates = maleClimaxTemplates;
    } else if ((npcGender === "female" || npcGender.includes("female")) && hasVagina) {
        templates = femaleClimaxTemplates;
    } else {
        // Fallback to neutral or based on anatomy
        if (hasPenis) {
            templates = maleClimaxTemplates;
        } else if (hasVagina) {
            templates = femaleClimaxTemplates;
        } else {
            templates = neutralClimaxTemplates;
        }
    }
    
    return pickRandom(templates);
}

/**
 * Build response for impact actions
 * Now uses CoT-style dialogue tags for verbal responses
 */
function buildImpactResponse(npc, player, act, intimacy, subjectPronoun, possessivePronoun, objectPronoun, arousalLevel, bodyPartDesc, reaction, dialogueTags = []) {
    const verb = act.verb || "touch";
    const vocalization = getVocalization(arousalLevel);
    
    // Get dialogue from tags (CoT-style) - 25% chance for impact
    let dialogueLine = null;
    if (Math.random() < 0.25 && dialogueTags && dialogueTags.length > 0) {
        dialogueLine = getDialogueFromTags(dialogueTags, arousalLevel, npc);
    }
    
    const templates = [
        `yelps at the sudden contact.`,
        `gasps in surprise.`,
        `reacts with a soft cry.`,
        `${reaction} at the impact.`,
        `tenses then relaxes into the sensation.`,
        `lets out a sharp ${vocalization}.`,
        `jumps slightly at the contact.`
    ];
    
    let response = pickRandom(templates);
    
    // Add verbal dialog from tags (CoT-style)
    if (dialogueLine && !response.includes('"')) {
        if (dialogueLine.isNonVerbal) {
            // For non-verbal NPCs, add the sound without quotes
            if (Math.random() < 0.5) {
                response = `${response} ${dialogueLine.text}`;
            }
        } else if (dialogueLine.isVerbal) {
            // For verbal NPCs, add quoted speech
            if (Math.random() < 0.5) {
                response = `${response} "${dialogueLine.text}"`;
            }
        }
    }
    
    return response;
}

/**
 * Build generic response
 * Now uses CoT-style dialogue tags for verbal responses
 */
function buildGenericResponse(npc, subjectPronoun, possessivePronoun, objectPronoun, arousalLevel, reaction, dialogueTags = []) {
    const vocalization = getVocalization(arousalLevel);
    const tempDesc = getTemperatureDescriptor(arousalLevel);
    
    // Get dialogue from tags (CoT-style) - 20% chance
    let dialogueLine = null;
    if (Math.random() < 0.20 && dialogueTags && dialogueTags.length > 0) {
        dialogueLine = getDialogueFromTags(dialogueTags, arousalLevel, npc);
    }
    
    const templates = [
        `${reaction}.`,
        `${reaction} with pleasure.`,
        `${reaction} enthusiastically.`,
        `${reaction}, ${tempDesc}.`,
        `lets out a ${vocalization}.`
    ];
    
    let response = pickRandom(templates);
    
    // Add verbal dialog from tags (CoT-style)
    if (dialogueLine) {
        if (dialogueLine.isNonVerbal) {
            // For non-verbal NPCs, add the sound without quotes as part of the physical reaction
            if (Math.random() < 0.5) {
                response = `${response} ${dialogueLine.text}`;
            }
        } else if (dialogueLine.isVerbal) {
            // For verbal NPCs, add quoted speech
            if (Math.random() < 0.5) {
                response = `says "${dialogueLine.text}"`;
            } else {
                response = `${response} "${dialogueLine.text}"`;
            }
        }
    }
    
    return response;
}

/**
 * Verbal dialog lines for CoT-style responses
 * These are occasional spoken interjections based on arousal and personality
 */
var VERBAL_DIALOG = {
    low: [
        "That feels nice",
        "Mmm, that's good",
        "You're gentle",
        "Keep going",
        "Don't stop"
    ],
    mild: [
        "Yes, just like that",
        "That feels amazing",
        "You're so good at this",
        "More, please",
        "I love that",
        "Right there"
    ],
    moderate: [
        "Oh yes, that's perfect",
        "I need more",
        "Please don't stop",
        "You're making me feel so good",
        "Harder, yes",
        "Just like that"
    ],
    high: [
        "Yes! Yes! Just like that!",
        "I'm so close",
        "Please, I need more",
        "You're incredible",
        "Fuck, that's good",
        "I can't take much more"
    ],
    intense: [
        "YES! FUCK YES!",
        "I'm going to cum!",
        "Please, make me cum",
        "Fuck me harder!",
        "Don't you dare stop!",
        "I'm yours, all yours"
    ]
};

/**
 * Get verbal dialog based on arousal level
 */
function getVerbalDialog(arousalLevel) {
    if (arousalLevel < 20) return pickRandom(VERBAL_DIALOG.low);
    if (arousalLevel < 40) return pickRandom(VERBAL_DIALOG.mild);
    if (arousalLevel < 60) return pickRandom(VERBAL_DIALOG.moderate);
    if (arousalLevel < 80) return pickRandom(VERBAL_DIALOG.high);
    return pickRandom(VERBAL_DIALOG.intense);
}

/**
 * Get vocalization based on arousal level
 * Fixed grammar issues (e.g., "a loud moans" -> "a loud moan")
 */
function getVocalization(arousalLevel) {
    if (arousalLevel < 20) return pickRandom(["sigh", "soft sound", "murmur"]);
    if (arousalLevel < 40) return pickRandom(["soft moan", "sigh of pleasure", "murmur"]);
    if (arousalLevel < 60) return pickRandom(["moan", "gasps", "sigh of pleasure"]);
    if (arousalLevel < 80) return pickRandom(["loud moan", "gasps of pleasure", "whimpers"]);
    return pickRandom(["loud moan", "cries of pleasure", "passionate gasps", "desperate whimpers"]);
}

/**
 * Get pleasure intensity descriptor
 */
function getPleasureIntensity(arousalLevel) {
    if (arousalLevel < 20) return pickRandom(["mild interest", "slight pleasure", "contentment"]);
    if (arousalLevel < 40) return pickRandom(["growing pleasure", "enjoyment", "warmth"]);
    if (arousalLevel < 60) return pickRandom(["obvious pleasure", "growing arousal", "delight"]);
    if (arousalLevel < 80) return pickRandom(["intense pleasure", "strong arousal", "passion"]);
    return pickRandom(["extreme pleasure", "overwhelming arousal", "desperate need", "climax-building tension"]);
}

/**
 * Get temperature descriptor
 */
function getTemperatureDescriptor(arousalLevel) {
    if (arousalLevel < 20) return pickRandom(["warm", "slightly flushed"]);
    if (arousalLevel < 40) return pickRandom(["warm and flushed", "heated", "slightly hot"]);
    if (arousalLevel < 60) return pickRandom(["hot", "flushed with arousal", "heated with desire"]);
    if (arousalLevel < 80) return pickRandom(["very hot", "burning with desire", "dripping with arousal"]);
    return pickRandom(["scalding hot", "feverish with need", "on fire with passion"]);
}

// ============================================================================
// COT-STYLE DIALOGUE TAG SYSTEM
// ============================================================================

/**
 * Dialogue database organized by OBJECT-PERSPECTIVE tags (like CoT)
 * These are what the NPC (receiver/object) would say
 * Each tag has dialogue lines at different arousal levels
 * Structure: { tag: { low: [...], mild: [...], moderate: [...], high: [...], intense: [...] } }
 */
// Simplified dialogue for uncivilized species (limited vocabulary)
var UNCIVILIZED_DIALOGUE = {
    low: ["Good", "Nice", "Mmm", "Yes"],
    mild: ["More", "Yes, good", "Like that", "Keep going"],
    moderate: ["Yes! More!", "That good", "Don't stop", "Harder"],
    high: ["YES! MORE!", "Need more", "Good, good!", "Please, continue"],
    intense: ["YES! YES! YES!", "MORE! HARDER!", "DON'T STOP!", "ALMOST THERE!"]
};

// Non-verbal sounds only (grunts, moans, etc.)
var NONVERBAL_REACTIONS = {
    low: ["Mmm", "Hmm", "Unh", "Ahh"],
    mild: ["Mmmph", "Nnngh", "Uhn", "Ahhh"],
    moderate: ["Mmmm!", "Uhn!", "Ahh!", "Nnngh!"],
    high: ["UNH! UNH!", "MMMPH! MMMPH!", "AH! AH!", "NNNGH! NNNGH!"],
    intense: ["UNHHH! UNHHH!", "FUCK! FUCK!", "MMMPHHH!", "AAAAH! AAAAH!"]
};

var DIALOGUE_DATABASE = {
    // ==== KISSING (NPC being kissed) ====
    "being kissed": {
        low: ["That feels nice", "Mmm", "Nice"],
        mild: ["That's nice", "I like that", "Kiss me more"],
        moderate: ["Yes, just like that", "Kiss me deeper", "Don't stop"],
        high: ["Fuck, that's good", "I need more of that", "Please don't stop"],
        intense: ["YES! More!", "I need you so much", "Please, kiss me harder"]
    },
    
    // ==== FACE/HAIR (NPC being touched) ====
    "being caressed": {
        low: ["That feels nice", "Mmm", "Gentle"],
        mild: ["That's nice", "I like that", "Touch me more"],
        moderate: ["Yes, just like that", "Caress me", "Don't stop"],
        high: ["Fuck, that's good", "I need more", "Please, continue"],
        intense: ["YES! More!", "I need that", "Don't stop"]
    },
    "hair stroked": {
        low: ["That feels nice", "Mmm", "Nice"],
        mild: ["That's relaxing", "I like that", "More, please"],
        moderate: ["Yes, just like that", "Stroke my hair", "Don't stop"],
        high: ["Fuck, that's good", "I need more", "Yes, please"],
        intense: ["YES! More!", "That feels amazing", "Don't stop"]
    },
    
    // ==== BREASTS (NPC's breasts being touched) ====
    "breasts groped": {
        low: ["That feels good", "Mmm", "Gentle"],
        mild: ["Yes, like that", "Squeeze them", "More pressure"],
        moderate: ["Harder, please", "I love that", "Don't stop touching me there"],
        high: ["Fuck yes!", "Pinch them harder", "I need more"],
        intense: ["YES! Play with them!", "Harder! Please!", "I'm so close"]
    },
    "breasts touched": {
        low: ["That feels nice", "Mmm", "Gentle touch"],
        mild: ["Yes, that's good", "I like that", "More, please"],
        moderate: ["Oh yes, just like that", "Squeeze them harder", "Don't stop"],
        high: ["Fuck, that's incredible", "I need more", "Yes, yes, yes!"],
        intense: ["YES! More! Fuck yes!", "I'm going to cum if you keep doing that", "Don't you dare stop"]
    },
    
    // ==== PUSSY/VAGINA (NPC's pussy being stimulated) ====
    "pussy kissed": {
        low: ["That feels nice", "Mmm", "Gentle"],
        mild: ["That's the spot", "Yes, right there", "More, please"],
        moderate: ["Oh yes, just like that", "Touch me there", "Don't stop"],
        high: ["Fuck, that's good", "I need more", "Please, keep going"],
        intense: ["YES! Right there!", "I'm going to cum", "Fuck me, please!"]
    },
    "pussy licked": {
        low: ["That feels nice", "Mmm", "Gentle"],
        mild: ["That's amazing", "Yes, right there", "More, please"],
        moderate: ["Oh yes, lick me there", "Don't stop", "That's perfect"],
        high: ["Fuck, that's incredible", "I need more", "Yes, just like that"],
        intense: ["YES! LICK ME HARDER!", "I'm going to cum", "Don't stop, please!"]
    },
    "pussy fingered": {
        low: ["That feels nice", "Mmm", "Gentle"],
        mild: ["Yes, just like that", "Deeper, please", "More fingers"],
        moderate: ["Oh yes, fuck me with your fingers", "Harder", "Don't stop"],
        high: ["Fuck yes! Deeper!", "I need more", "Fuck me with your hand"],
        intense: ["YES! FUCK ME!", "I'm cumming!", "Don't stop, I'm so close"]
    },
    "pussy rubbed": {
        low: ["That feels nice", "Mmm", "Gentle"],
        mild: ["Yes, right there", "Grind harder", "More pressure"],
        moderate: ["Oh yes, just like that", "Rub me there", "Don't stop"],
        high: ["Fuck, that's good", "I need more", "Yes, please"],
        intense: ["YES! RIGHT THERE!", "I'm going to cum", "Harder, please!"]
    },
    "pussy penetrated": {
        low: ["You're inside me", "Mmm", "Yes"],
        mild: ["That feels amazing", "Yes, just like that", "More, please"],
        moderate: ["Oh yes! Fuck me", "Deeper, please", "Harder"],
        high: ["FUCK YES! Fuck me harder", "I need more", "Don't stop"],
        intense: ["YES! FUCK ME HARDER!", "I'm cumming! FUCK YES!", "Please, fuck me, don't stop"]
    },
    
    // ==== COCK/PENIS (NPC's cock being stimulated) ====
    "cock in pussy": {
        low: ["That feels nice", "Mmm", "Gentle"],
        mild: ["Yes, just like that", "Hump me", "More, please"],
        moderate: ["Oh yes, right there", "Take my cock", "Don't stop"],
        high: ["Fuck yes! Take it all", "I need more", "Yes, just like that"],
        intense: ["YES! FUCK ME!", "I'm going to cum", "Don't stop, please!"]
    },
    
    // ==== MOUTH (NPC's mouth being used) ====
    // Note: NPC cannot speak clearly with a cock in their mouth
    // They can only garble words or make muffled sounds
    // Arousal comes from PERFORMING the act (giving oral), not receiving
    "cock in mouth": {
        low: ["Mmm", "Mmph", "Uhn", "Nnngh", "Mmmph"],
        mild: ["Mmph yeah", "Nnngh mmm", "Mmm-hmm", "Mm-fine", "Ph-mm good", "Mph-yep"],
        moderate: ["Mmph! G-g-good", "Nnngh! M-more", "Mmmph! L-l-like th-that", "Mmm! K-keep g-goin'", "Mmph! D-don't s-stop", "Nnngh! Th-that's g-good", "Mmph! F-feels n-nice", "Mmph! L-love d-doing th-this", "Nnngh! W-want m-more"] ,
        high: ["MMMPH! Y-YES!" , "NNNGH! N-NEED M-MORE", "MMPH! D-DON'T ST-STOP", "MMM-GOOD! K-KEEP G-GOING", "MPHHH! C-CAN'T S-STOP", "MMMPH! L-Like th-that!" , "NNNGH! H-Harder!" , "MMPH! T-Take it d-deep", "MMMPH! L-Love s-sucking y-you", "NNNGH! M-Make m-me c-cum"],
        intense: ["MMMPHHH! Y-YES! Y-YES!" , "NNNNGH! I-I'M C-CUMMING!" , "MMMPHHH! D-DON'T S-STOP! P-PLEASE!" , "MMMMMMPH! T-TOO M-MUCH! N-NOT G-GONNA L-LAST", "NNGHHH! F-FUCK! K-KEEP G-GOING!", "MMMPHHH! G-GONNA C-CUM!" , "NNNNGH! I-I C-CAN'T! S-STOP!" , "MMMMMPH! F-FILL M-ME!" , "NNGHHH! T-TAKE IT ALL!", "MMMPH! I-I'M C-CUMM-PH-PHIN'!" , "NNNGH! C-CAN'T B-BREATHE!" , "MPHHH! M-MAKE M-ME!" , "MMMPH! S-STOP! N-NO! K-KEEP G-GOING!"]
    },
    
    // ==== GENERIC ====
    "general": {
        low: ["That feels nice", "Mmm", "Good"],
        mild: ["Yes, just like that", "I like that", "More, please"],
        moderate: ["Oh yes, that's perfect", "Don't stop", "Right there"],
        high: ["Fuck, that's good", "I need more", "Please, continue"],
        intense: ["YES! More!", "Don't stop", "I'm so close"]
    }
};

/**
 * Get dialogue line based on tags and arousal level
 * Mimics CoT's system: action has dialogue tags -> lookup in database -> select based on arousal
 * Respects NPC speech capabilities (non-verbal, uncivilized, civilized)
 * Returns an object with: { text: string, isVerbal: boolean, isNonVerbal: boolean }
 */
function getDialogueFromTags(tags, arousalLevel, npc) {
    if (!tags || tags.length === 0) return null;
    
    // Get NPC dialogue style
    const dialogueStyle = getNPCDialogueStyle(npc);
    
    // Non-verbal NPCs can only make sounds - return special marker
    if (dialogueStyle === 'nonverbal') {
        const sound = getArousalBasedReaction(NONVERBAL_REACTIONS, arousalLevel);
        return { text: sound, isVerbal: false, isNonVerbal: true };
    }
    
    // Uncivilized NPCs have limited vocabulary - return as verbal but simplified
    if (dialogueStyle === 'uncivilized') {
        const text = getArousalBasedReaction(UNCIVILIZED_DIALOGUE, arousalLevel);
        return { text: text, isVerbal: true, isNonVerbal: false };
    }
    
    // Civilized NPCs use full dialogue database
    // Try each tag in order, pick first one that exists in database
    for (const tag of tags) {
        const tagDialogue = DIALOGUE_DATABASE[tag];
        if (tagDialogue) {
            // Get arousal-based lines
            let text;
            if (arousalLevel < 20 && tagDialogue.low) {
                text = pickRandom(tagDialogue.low);
            } else if (arousalLevel < 40 && tagDialogue.mild) {
                text = pickRandom(tagDialogue.mild);
            } else if (arousalLevel < 60 && tagDialogue.moderate) {
                text = pickRandom(tagDialogue.moderate);
            } else if (arousalLevel < 80 && tagDialogue.high) {
                text = pickRandom(tagDialogue.high);
            } else if (tagDialogue.intense) {
                text = pickRandom(tagDialogue.intense);
            } else {
                // Fallback to any available
                text = pickRandom(Object.values(tagDialogue).flat());
            }
            // Special case: cock in mouth is always non-verbal
            const isNonVerbalTag = tag === "cock in mouth";
            return { text: text, isVerbal: !isNonVerbalTag, isNonVerbal: isNonVerbalTag };
        }
    }
    
    // Fallback to general dialogue
    return getDialogueFromTags(["general"], arousalLevel, npc);
}

/**
 * Get a reaction based on arousal level from a simple reactions object
 */
function getArousalBasedReaction(reactions, arousalLevel) {
    if (arousalLevel < 20 && reactions.low) {
        return pickRandom(reactions.low);
    } else if (arousalLevel < 40 && reactions.mild) {
        return pickRandom(reactions.mild);
    } else if (arousalLevel < 60 && reactions.moderate) {
        return pickRandom(reactions.moderate);
    } else if (arousalLevel < 80 && reactions.high) {
        return pickRandom(reactions.high);
    } else if (reactions.intense) {
        return pickRandom(reactions.intense);
    }
    // Fallback to any available
    return pickRandom(Object.values(reactions).flat());
}

/**
 * Get pronoun for object
 */
function getObjectPronoun(npc) {
    if (!npc) return "them";
    const gender = (npc.gender || "female").toLowerCase();
    // Check female first, then male, with prefix matching for race+gender combinations
    if (gender === "female" || gender === "f" || 
        gender.includes(" woman") || gender.includes(" girl") ||
        gender.includes("female ") || gender.startsWith("female")) return "her";
    if (gender === "male" || gender === "m" || 
        gender.includes(" man") || gender.includes(" boy") ||
        gender.includes("male ") || gender.startsWith("male")) return "him";
    return "them";
}

/**
 * Generate end response
 */
function generateEndResponse(npc, player, act) {
    const subjectPronoun = getSubjectPronoun(npc) || "They";
    const possessivePronoun = getPossessivePronoun(npc) || "their";
    const objectPronoun = getObjectPronoun(npc) || "them";
    const npcName = npc.name || "They";
    
    // Check if player has ejaculated internally
    const intimacy = npc.intimacy || {};
    const hasInternalEjaculation = intimacy.climax && intimacy.climax.hasInternalEjaculation;
    const lastEjaculationTarget = intimacy.climax ? intimacy.climax.lastInternalEjaculation : null;
    const ejaculationInVagina = lastEjaculationTarget === "vagina" || lastEjaculationTarget === "pussy";
    const ejaculationInAnus = lastEjaculationTarget === "anus" || lastEjaculationTarget === "ass";
    const ejaculationInMouth = lastEjaculationTarget === "mouth";
    
    // Check NPC species for civilized/uncivilized behavior
    const isUncivilized = npc && npc.species && !isCivilizedSpecies(npc.species);
    
    // Get player gender
    const playerGender = (player && player.stats && player.stats.gender) ? player.stats.gender.toLowerCase() : "male";
    const playerHasPenis = playerGender === "male" || playerGender.includes("male");
    
    // Handle pull-out actions
    if (act.id === "pull_out") {
        // Determine if this is vaginal or anal pull-out based on last penetration target
        const lastPenetrationTarget = intimacy.penetration ? intimacy.penetration.target : null;
        const isAnalPullOut = lastPenetrationTarget === "anus" || lastPenetrationTarget === "ass";
        
        // Set flag that pull-out just occurred and track what was penetrated
        if (!intimacy.encounterFlags) intimacy.encounterFlags = {};
        intimacy.encounterFlags.justPulledOut = true;
        intimacy.encounterFlags.lastPullOutTarget = isAnalPullOut ? "anus" : "vagina";
        
        if (isAnalPullOut) {
            // Pulling out of anus
            if (ejaculationInAnus) {
                // With ejaculation - anal-specific mechanics
                const anusSize = (npc.anatomy && npc.anatomy.anus && npc.anatomy.anus.size) || "snug";
                const isTight = ["tight", "snug", "firm"].includes(anusSize);
                const isLoose = ["loose", "gaping", "stretchy", "experienced"].includes(anusSize);
                
                let ejaculationDesc = "";
                if (isTight) {
                    // Tight anus - semen squirts or farts out
                    const hasFart = Math.random() < 0.4;
                    if (hasFart) {
                        ejaculationDesc = pickRandom([
                            "your seed trapped in the tight passage suddenly squirting out with a wet fart",
                            "a wet fart escaping as your semen is forced out by the clamping ring",
                            "your cum squirting out with a lewd noise as the tight muscle releases"
                        ]);
                    } else {
                        ejaculationDesc = pickRandom([
                            "your seed squeezed out by the tight ring",
                            "your cum oozing out slowly from the well-used hole",
                            "thick semen dripping from the stretched opening"
                        ]);
                    }
                } else if (isLoose) {
                    // Loose anus - semen drops out
                    ejaculationDesc = pickRandom([
                        "your seed dripping out freely from the loose passage",
                        "your cum leaking out with a messy squelch",
                        "semen drooling from the gaping hole"
                    ]);
                } else {
                    // Medium/unknown - generic
                    ejaculationDesc = pickRandom([
                        "your seed dripping from the well-used opening",
                        "your cum leaking out as you pull away"
                    ]);
                }
                
                // Pungent scent for anal
                const scentDesc = pickRandom([
                    "a pungent, musky scent",
                    "the raw, animalistic aroma",
                    "a strong, intimate fragrance",
                    "the thick scent of mating"
                ]);
                
                return {
                    action: "pull_out",
                    type: "end",
                    responseText: `${subjectPronoun} clenches as you pull out, ${ejaculationDesc}, ${scentDesc} filling the air.`,
                    penetrationEnded: true
                };
            } else {
                // Anal pull-out without ejaculation
                return {
                    action: "pull_out",
                    type: "end",
                    responseText: `${subjectPronoun} tightens as you pull out from ${possessivePronoun} well-used passage, the muscular ring resisting your withdrawal.`,
                    penetrationEnded: true
                };
            }
        } else {
            // Pulling out of vagina
            if (ejaculationInVagina) {
                // With ejaculation - describe dripping semen and scents
                const scentDesc = isUncivilized && Math.random() < 0.5 
                    ? pickRandom(["a pungent musk", "a strong, animalistic scent", "the raw smell of mating", "a primal aroma"])
                    : pickRandom(["the scent of sex", "a warm, intimate fragrance", "the musky perfume of lovemaking", "the scent of passion"]);
                
                const urineDesc = isUncivilized && Math.random() < 0.3 
                    ? ", a warm trickle of urine escaping as ${subjectPronoun.toLowerCase()} loses control"
                    : "";
                
                return {
                    action: "pull_out",
                    type: "end",
                    responseText: `${subjectPronoun} gasps as you pull out, thick semen dripping from ${possessivePronoun} well-used vagina${urineDesc}, ${scentDesc} filling the air.`,
                    penetrationEnded: true
                };
            } else {
                // Without ejaculation
                return {
                    action: "pull_out",
                    type: "end",
                    responseText: `${subjectPronoun} sighs as you pull out from ${possessivePronoun} slick depths, ${possessivePronoun} inner walls clenching at the loss.`,
                    penetrationEnded: true
                };
            }
        }
    }
    
    if (act.id === "pull_off") {
        // Female player pulling off penis
        // Set flag that pull-out just occurred
        if (!intimacy.encounterFlags) intimacy.encounterFlags = {};
        intimacy.encounterFlags.justPulledOut = true;
        intimacy.encounterFlags.lastPullOutTarget = "vagina";
        
        if (ejaculationInVagina) {
            const scentDesc = isUncivilized && Math.random() < 0.5 
                ? pickRandom(["a pungent musk", "a strong, animalistic scent"])
                : pickRandom(["the scent of sex", "a warm, intimate fragrance"]);
            
            const urineDesc = isUncivilized && Math.random() < 0.3 
                ? ", a warm trickle escaping as you lose control"
                : "";
            
            return {
                action: "pull_off",
                type: "end",
                responseText: `${subjectPronoun} gasps as you pull away, semen dripping from your well-used vagina${urineDesc}, ${scentDesc} filling the air.`,
                penetrationEnded: true
            };
        } else {
            return {
                action: "pull_off",
                type: "end",
                responseText: `${subjectPronoun} sighs as you pull away, your inner walls clenching at the separation.`,
                penetrationEnded: true
            };
        }
    }
    
    if (act.id === "pull_out_of_mouth") {
        // Pulling out of mouth - recipient can swallow
        // Set flag that pull-out just occurred
        if (!intimacy.encounterFlags) intimacy.encounterFlags = {};
        intimacy.encounterFlags.justPulledOut = true;
        intimacy.encounterFlags.lastPullOutTarget = "mouth";
        
        if (ejaculationInMouth) {
            // Check if NPC swallows (50% chance if they're verbal)
            const swallows = Math.random() < 0.5 && npc && !npc.verbalDisabled;
            
            if (swallows) {
                return {
                    action: "pull_out_of_mouth",
                    type: "end",
                    responseText: `${subjectPronoun} swallows your release with a satisfied expression, licking ${possessivePronoun} lips clean as you pull out.`,
                    penetrationEnded: true
                };
            } else {
                return {
                    action: "pull_out_of_mouth",
                    type: "end",
                    responseText: `${subjectPronoun} lets your seed drip from ${possessivePronoun} lips as you pull out, a thick string connecting your cock to ${possessivePronoun} mouth for a moment.`,
                    penetrationEnded: true
                };
            }
        } else {
            return {
                action: "pull_out_of_mouth",
                type: "end",
                responseText: `${subjectPronoun} releases your cock with a wet pop as you pull out, strings of saliva connecting your shaft to ${possessivePronoun} lips.`,
                penetrationEnded: true
            };
        }
    }
    
    if (act.id === "stop_fingering" || act.id === "pull_off_of_finger") {
        // Pulling fingers out of vagina
        if (ejaculationInVagina) {
            const scentDesc = pickRandom(["the scent of arousal", "a warm, intimate fragrance"]);
            return {
                action: act.id,
                type: "end",
                responseText: `${subjectPronoun} shivers as you withdraw your fingers, semen dripping from ${possessivePronoun} slick folds, ${scentDesc} in the air.`,
                penetrationEnded: true
            };
        } else {
            return {
                action: act.id,
                type: "end",
                responseText: `${subjectPronoun} sighs as you slowly withdraw your fingers from ${possessivePronoun} warmth.`,
                penetrationEnded: true
            };
        }
    }
    
    if (act.id === "release_cock") {
        // Releasing cock from hand
        return {
            action: "release_cock",
            type: "end",
            responseText: `${subjectPronoun} cock springs free from your grip, glistening with ${possessivePronoun} arousal.`,
            penetrationEnded: false
        };
    }
    
    if (act.id === "stop") {
        return {
            action: "stop",
            type: "end",
            responseText: `${npcName} <nods.> The intimate moment ends.`,
            encounterEnded: true
        };
    }
    
    if (act.id === "pause") {
        return {
            action: "pause",
            type: "end",
            responseText: `${npcName} <takes a deep breath and pauses.>`
        };
    }
    
    // Default end response
    return {
        action: act.id || "end",
        type: "end",
        responseText: `${npcName} <pauses, the moment ending.>`
    };
}

// ============================================================================
// MENU ORGANIZATION
// ============================================================================

/**
 * Organize actions into menu categories
 */
function organizeActionsForMenu(validActions) {
    const categorized = {};
    
    for (const action of validActions) {
        const category = getActionCategory(action.actId);
        if (!categorized[category]) {
            categorized[category] = [];
        }
        categorized[category].push(action);
    }
    
    // Debug: log categories and counts
    if (window.DEBUG_INTIMACY) {
        console.log("[DEBUG] organizeActionsForMenu categories:", Object.keys(categorized).map(k => `${k}:${categorized[k].length}`).join(", "));
    }
    
    return categorized;
}

/**
 * Get menu-ready action list with phase-based filtering
 * Now includes disabled actions with hints for better UX
 * @param {Object} npc - The NPC
 * @param {Object} player - The player
 * @param {Object} room - Current room (for context detection)
 * @param {string} positionId - Current position
 */
function getMenuActions(npc, player, room = null, positionId = null) {
    // Determine current intimacy phase based on context
    const phase = room ? getCurrentIntimacyPhase(room, npc, npc) : INTIMACY_PHASES.SOCIAL;
    
    // Generate all valid actions for current state
    let validActions = generateValidActions(npc, player, positionId);
    
    // Debug: log valid action count
    if (npc && npc.name) {
        const clothingActions = validActions.filter(a => a.type === ACT_TYPES.CLOTHING);
        console.log(`[DEBUG] Generated ${validActions.length} valid actions for ${npc.name}, ${clothingActions.length} clothing actions`);
    }
    
    // Filter by phase (removes actions not appropriate for current context)
    validActions = filterActionsByPhase(validActions, phase);
    
    // Debug: log after phase filtering
    if (npc && npc.name) {
        const clothingActions = validActions.filter(a => a.type === ACT_TYPES.CLOTHING);
        console.log(`[DEBUG] After phase filter: ${validActions.length} actions for ${npc.name}, ${clothingActions.length} clothing actions, phase=${phase}`);
    }
    
    const categorized = organizeActionsForMenu(validActions);
    
    // Also get disabled actions with their reasons for showing hints
    const allActionsWithStatus = generateAllActionsWithStatus(npc, player, positionId);
    
    // Filter disabled actions by phase as well
    const filteredDisabledActions = allActionsWithStatus.invalid.filter(action => {
        // Create a mock action object for phase filtering
        const mockAction = { ...action, actId: action.actId };
        return filterActionsByPhase([mockAction], phase).length > 0;
    });
    
    const categorizedDisabled = organizeActionsForMenu(filteredDisabledActions);
    
    // Convert to menu format with natural labels
    const menu = [];
    const addedCategories = new Set();
    
    // Define phase groups with their categories (now grouped by body area)
    const phaseGroups = {
        social: ["Mouth & Lips", "Hair", "Body", "Breasts"],
        private: ["Clothing", "Breasts", "Lower Body", "Pussy", "Cock", "Anus", "Impact"],
        intimate: ["Pussy", "Cock", "Anus", "Mouth & Lips", "Climax", "End", "Receive"]
    };
    
    // Process each phase group in order
    const phaseOrder = ["social", "private", "intimate"];
    let addedSeparator = false;
    
    for (const phaseGroup of phaseOrder) {
        const categories = phaseGroups[phaseGroup];
        let phaseHasActions = false;
        
        for (const category of categories) {
            // Skip if we've already added this category
            if (addedCategories.has(category)) continue;
            
            const validActions = categorized[category] || [];
            const disabledActions = categorizedDisabled[category] || [];
            const hasActions = validActions.length > 0 || disabledActions.length > 0;
            
            if (hasActions) {
                // Add separator before this phase if we've already added content from previous phase
                if (menu.length > 0 && !addedSeparator) {
                    menu.push({ type: "separator" });
                    addedSeparator = true;
                }
                
                // Merge valid and disabled actions
                const allActions = [
                    ...validActions.map(a => ({
                        id: a.actId,
                        label: getNaturalLabel(a.actId, npc, player),
                        description: a.desc,
                        type: a.type,
                        phaseRequired: getMinimumPhaseForAction(a.actId),
                        disabled: false
                    })),
                    ...disabledActions.map(a => ({
                        id: a.actId,
                        label: getNaturalLabel(a.actId, npc, player) + (a.disabledHint ? ` (${a.disabledHint})` : ""),
                        description: a.desc,
                        type: a.type,
                        phaseRequired: getMinimumPhaseForAction(a.actId),
                        disabled: true,
                        disabledHint: a.disabledHint
                    }))
                ];
                
                menu.push({
                    type: "category",
                    label: category,
                    actions: allActions
                });
                
                addedCategories.add(category);
                phaseHasActions = true;
            }
        }
        
        // Reset separator flag after each phase group
        if (phaseHasActions) {
            addedSeparator = false;
        }
    }
    
    // Add any remaining categories not in phase groups
    for (const [category, actions] of Object.entries(categorized)) {
        if (!Object.values(phaseGroups).flat().includes(category) && actions.length > 0 && !addedCategories.has(category)) {
            const disabledActions = categorizedDisabled[category] || [];
            const allActions = [
                ...actions.map(a => ({
                    id: a.actId,
                    label: getNaturalLabel(a.actId, npc, player),
                    description: a.desc,
                    type: a.type,
                    phaseRequired: getMinimumPhaseForAction(a.actId),
                    disabled: false
                })),
                ...disabledActions.map(a => ({
                    id: a.actId,
                    label: getNaturalLabel(a.actId, npc, player) + (a.disabledHint ? ` (${a.disabledHint})` : ""),
                    description: a.desc,
                    type: a.type,
                    phaseRequired: getMinimumPhaseForAction(a.actId),
                    disabled: true,
                    disabledHint: a.disabledHint
                }))
            ];
            
            menu.push({
                type: "category",
                label: category,
                actions: allActions
            });
            addedCategories.add(category);
        }
    }
    
    // Add Continue and Pull out/Pull Away buttons if there's a last action
    const lastAction = npc && npc.intimacy && npc.intimacy.lastAction;
    const intimacy = npc.intimacy || {};
    const encounterFlags = intimacy.encounterFlags || {};
    
    // Check if we just pulled out and player is near climax - replace Continue with ejaculation options
    const justPulledOut = encounterFlags.justPulledOut;
    const lastPullOutTarget = encounterFlags.lastPullOutTarget;
    const playerArousal = intimacy.arousal && intimacy.arousal.player ? intimacy.arousal.player : 0;
    const isNearClimax = playerArousal > 70;
    const playerHasPenis = player && player.anatomy && (player.anatomy.penis || player.anatomy.cock);
    
    if (lastAction && lastAction.actId) {
        // Find the action details for the last action
        const allValidActions = generateValidActions(npc, player, positionId);
        const lastActionDetails = allValidActions.find(a => a.actId === lastAction.actId);
        
        if (lastActionDetails) {
            // Check if the last action is still valid for current phase
            const filteredLastAction = filterActionsByPhase([lastActionDetails], phase);
            if (filteredLastAction.length > 0) {
                // Check if we should show ejaculation options instead of Continue
                if (justPulledOut && isNearClimax && playerHasPenis) {
                    // Determine which ejaculation options to show based on what was penetrated
                    const ejaculationOptions = [];
                    
                    // Get all valid actions to check if ejaculation actions are available
                    const allValidActionsMap = {};
                    allValidActions.forEach(a => {
                        allValidActionsMap[a.actId] = a;
                    });
                    
                    // Get ejaculation actions for current position
                    const candidateActions = [];
                    if (lastPullOutTarget === "mouth") {
                        // For oral: face, chest, breasts
                        candidateActions.push("ejaculate_on_face", "ejaculate_on_chest");
                        if (npc.anatomy && npc.anatomy.breasts) {
                            candidateActions.push("ejaculate_on_breasts");
                        }
                    } else if (lastPullOutTarget === "anus") {
                        // For anal: ass, pussy (vulva area), stomach
                        candidateActions.push("ejaculate_on_butt", "ejaculate_on_stomach");
                        if (npc.gender && (npc.gender.toLowerCase() === "female" || npc.gender.toLowerCase() === "f")) {
                            candidateActions.push("ejaculate_on_pussy");
                        }
                    } else {
                        // For vaginal or unknown: ass, stomach, pussy
                        candidateActions.push("ejaculate_on_butt", "ejaculate_on_stomach");
                        if (npc.gender && (npc.gender.toLowerCase() === "female" || npc.gender.toLowerCase() === "f")) {
                            candidateActions.push("ejaculate_on_pussy");
                        }
                    }
                    
                    // Check which candidate actions are valid for current position
                    // Use positionId from function parameter, or fall back to intimacy position
                    const checkPosition = positionId || (intimacy.position ? intimacy.position.player : null);
                    
                    candidateActions.forEach(actId => {
                        const act = allValidActionsMap[actId];
                        if (act) {
                            // If the action is already in validActions, it passed position/clothing checks
                            // We just need to verify it's still valid
                            const actDetails = getAct(actId);
                            if (actDetails) {
                                ejaculationOptions.push({
                                    actionId: actId,
                                    label: getNaturalLabel(actId, npc, player),
                                    desc: actDetails.desc || "Release on body"
                                });
                            }
                        }
                    });
                    
                    // If we have valid ejaculation options, show them instead of Continue
                    if (ejaculationOptions.length > 0) {
                        // Add ejaculation options at the beginning of the menu
                        ejaculationOptions.forEach(opt => {
                            menu.unshift({
                                type: "continue",
                                label: opt.label,
                                actionId: opt.actionId,
                                description: opt.desc
                            });
                        });
                    } else {
                        // Fall back to Continue button if no ejaculation options are valid
                        menu.unshift({
                            type: "continue",
                            label: `Continue (${getNaturalLabel(lastAction.actId, npc, player)})`,
                            actionId: lastAction.actId,
                            description: `Continue ${lastActionDetails.desc || 'the previous action'}`
                        });
                    }
                    
                    // Clear the justPulledOut flag after processing (only once per pull-out)
                    if (encounterFlags.justPulledOut) {
                        delete encounterFlags.justPulledOut;
                        delete encounterFlags.lastPullOutTarget;
                    }
                } else {
                    // Add Continue button at the beginning of the menu
                    menu.unshift({
                        type: "continue",
                        label: `Continue (${getNaturalLabel(lastAction.actId, npc, player)})`,
                        actionId: lastAction.actId,
                        description: `Continue ${lastActionDetails.desc || 'the previous action'}`
                    });
                }
                
                // Add Pull out/Pull Away button based on whether it was penetration
                const intimacy = npc.intimacy;
                const wasPenetrating = intimacy.penetration && intimacy.penetration.active;
                
                // Check if last action was a penetration type
                const penetrationActTypes = [ACT_TYPES.PENETRATE, ACT_TYPES.CONTINUE];
                const isPenetrationAction = penetrationActTypes.includes(lastActionDetails.type);
                
                // Also check if it's a known penetration action
                const penetrationActionIds = [
                    "enter_pussy", "thrust_pussy", "fuck_pussy", "enter_anus", "thrust_anus", 
                    "fuck_anus", "enter_pussy_finger", "finger_pussy", "finger_pussy_fast",
                    "enter_anus_finger", "finger_anus", "finger_anus_fast",
                    "deepthroat_penis", "suck_penis", "fuck_mouth", "accept_penis_mouth"
                ];
                const isPenetrationAct = penetrationActionIds.includes(lastAction.actId) || 
                    lastAction.actId.toLowerCase().includes("enter_") ||
                    lastAction.actId.toLowerCase().includes("thrust_") ||
                    lastAction.actId.toLowerCase().includes("fuck_") ||
                    lastAction.actId.toLowerCase().includes("deepthroat_") ||
                    lastAction.actId.toLowerCase().includes("suck_");
                
                if (isPenetrationAction || isPenetrationAct || wasPenetrating) {
                    // Add Pull Away button - use existing pull_out action
                    // Try to determine the best pull-out action based on context
                    let pullOutActionId = "pull_out";
                    
                    // Check if we can determine a more specific pull-out action
                    if (lastAction.actId) {
                        if (lastAction.actId.toLowerCase().includes("anus") || 
                            lastAction.actId.toLowerCase().includes("anal")) {
                            pullOutActionId = "pull_out"; // Generic pull_out works for anus too
                        } else if (lastAction.actId.toLowerCase().includes("mouth") || 
                                   lastAction.actId.toLowerCase().includes("oral") ||
                                   lastAction.actId.toLowerCase().includes("suck") ||
                                   lastAction.actId.toLowerCase().includes("deepthroat")) {
                            pullOutActionId = "pull_out_of_mouth";
                        } else if (lastAction.actId.toLowerCase().includes("finger") || 
                                   lastAction.actId.toLowerCase().includes("pussy") ||
                                   lastAction.actId.toLowerCase().includes("vagina")) {
                            // Check if player is male (uses pull_out) or female (uses pull_off)
                            const playerGender = (player && player.stats && player.stats.gender) ? player.stats.gender.toLowerCase() : "male";
                            pullOutActionId = (playerGender === "male" || playerGender.includes("male")) ? "pull_out" : "pull_off";
                        }
                    }
                    
                    menu.unshift({
                        type: "end",
                        label: "Pull Away",
                        actionId: pullOutActionId,
                        description: "Withdraw from current penetration"
                    });
                } else {
                    // Add Pull Away button for non-penetration actions
                    // Use the generic stop action but label it as Pull Away
                    menu.unshift({
                        type: "end",
                        label: "Pull Away",
                        actionId: "stop",
                        description: "Stop current action and pull away"
                    });
                }
            }
        }
    }

    // Add phase information to menu for UI display
    return {
        menu: menu,
        phase: phase,
        phaseName: getPhaseName(phase),
        isPrivate: room ? isPrivateLocation(room) : false,
        isAlone: room ? isAloneWithTarget(room, npc) : false,
        hasContinue: !!lastAction
    };
}

/**
 * Get hint text for disabled actions
 */
function getDisabledHintText(reason) {
    if (!reason) return "";
    
    const reasonMappings = {
        "unknown action": "(unknown)",
        "no position": "(no position)",
        "clothed": "(clothed)",
        "already nude": "(already nude)",
        "not worn": "(not worn)",
        "wrong gender": "(wrong gender)",
        "prior required": "(requires prior action)",
        "no lube": "(no lube)",
        "": ""
    };
    
    return reasonMappings[reason] || `(${reason})`;
}

/**
 * Get the minimum phase required for an action
 */
function getMinimumPhaseForAction(actId) {
    const act = getAct(actId);
    if (!act) return INTIMACY_PHASES.SOCIAL;
    
    // Climax actions require intimate phase
    if (act.triggersClimax) return INTIMACY_PHASES.INTIMATE;
    
    // Penetration requires private phase minimum
    if (act.type === ACT_TYPES.PENETRATE || act.type === ACT_TYPES.CONTINUE) {
        return INTIMACY_PHASES.PRIVATE;
    }
    
    // Clothing removal requires private phase
    if (act.type === ACT_TYPES.CLOTHING) return INTIMACY_PHASES.PRIVATE;
    
    // Tease actions require private phase
    if (act.type === ACT_TYPES.TEASE) return INTIMACY_PHASES.PRIVATE;
    
    // Default to social
    return INTIMACY_PHASES.SOCIAL;
}

/**
 * Get readable phase name
 */
function getPhaseName(phase) {
    const names = {
        [INTIMACY_PHASES.SOCIAL]: "Social",
        [INTIMACY_PHASES.PRIVATE]: "Private",
        [INTIMACY_PHASES.INTIMATE]: "Intimate"
    };
    return names[phase] || "Unknown";
}

// ============================================================================
// LUBE SYSTEM
// ============================================================================

/**
 * Add lube to a specific body part
 * @param {Object} npc - The NPC
 * @param {string} bodyPart - The body part (vagina, anus, mouth, general)
 * @param {number} amount - Amount of lube to add (default: 100)
 */
function addLube(npc, bodyPart = "general", amount = 100) {
    if (!npc || !npc.intimacy) return false;
    
    // Initialize lube tracking if not present
    if (!npc.intimacy.lube) {
        npc.intimacy.lube = {
            vagina: { hasLube: false, level: 0 },
            anus: { hasLube: false, level: 0 },
            mouth: { hasLube: false, level: 0 },
            general: { hasLube: false, level: 0 }
        };
    }
    
    const part = npc.intimacy.lube[bodyPart];
    if (!part) return false;
    
    part.hasLube = true;
    part.level = Math.min(100, part.level + amount);
    
    // Update legacy global lube for backwards compatibility
    npc.intimacy.hasLube = true;
    npc.intimacy.lubeLevel = Math.min(100, npc.intimacy.lubeLevel + amount);
    
    console.log(`[Intimacy] Added lube to ${bodyPart}. Level: ${part.level}`);
    return true;
}

/**
 * Use lube from a specific body part (consume some)
 * @param {Object} npc - The NPC
 * @param {string} bodyPart - The body part (vagina, anus, mouth, general)
 * @param {number} amount - Amount of lube to use (default: 10)
 */
function useLube(npc, bodyPart = "general", amount = 10) {
    if (!npc || !npc.intimacy || !npc.intimacy.lube) return false;
    
    const part = npc.intimacy.lube[bodyPart];
    if (!part || !part.hasLube) return false;
    
    part.level = Math.max(0, part.level - amount);
    
    if (part.level <= 0) {
        part.hasLube = false;
    }
    
    // Update legacy global lube
    npc.intimacy.lubeLevel = Math.max(0, npc.intimacy.lubeLevel - amount);
    if (npc.intimacy.lubeLevel <= 0) {
        npc.intimacy.hasLube = false;
    }
    
    console.log(`[Intimacy] Used lube from ${bodyPart}. Level: ${part.level}`);
    return true;
}

/**
 * Check if lube is available for a specific body part
 * @param {Object} npc - The NPC
 * @param {string} bodyPart - The body part (vagina, anus, mouth, general, or any)
 */
function hasLube(npc, bodyPart = "any") {
    if (!npc || !npc.intimacy) return false;
    
    // Check specific body part
    if (bodyPart !== "any" && bodyPart !== "general") {
        const part = npc.intimacy.lube && npc.intimacy.lube[bodyPart];
        if (part) {
            return part.hasLube && part.level > 0;
        }
        return false;
    }
    
    // Legacy global check
    if (npc.intimacy.hasLube && npc.intimacy.lubeLevel > 0) {
        return true;
    }
    
    // Check any part has lube
    if (npc.intimacy.lube) {
        for (const partName in npc.intimacy.lube) {
            const part = npc.intimacy.lube[partName];
            if (part.hasLube && part.level > 0) {
                return true;
            }
        }
    }
    
    return false;
}

// ============================================================================
// POSITION CHANGE
// ============================================================================

/**
 * Change position
 */
function changePosition(npc, player, newPositionId, options = {}) {
    if (!npc || !npc.intimacy) return { success: false, error: "No intimacy state" };
    if (!hasPosition(newPositionId)) return { success: false, error: "Invalid position" };
    
    const oldPosition = npc.intimacy.position.player;
    const oldPositionObj = getPosition(oldPosition);
    const newPositionObj = getPosition(newPositionId);
    
    // Store old position for narration
    const positionChangeInfo = {
        oldPosition: oldPosition,
        oldPositionLabel: oldPositionObj ? oldPositionObj.label || oldPosition : oldPosition,
        newPosition: newPositionId,
        newPositionLabel: newPositionObj ? newPositionObj.label || newPositionId : newPositionId
    };
    
    // Check if penetration is active - if so, need to pull out before changing position
    const wasPenetrating = npc.intimacy.penetration && npc.intimacy.penetration.active;
    
    if (wasPenetrating) {
        // End current penetration with pull-out narration
        const pullOutNarrative = endPenetrationWithNarration(npc, npc.intimacy, "position change");
        if (pullOutNarrative) {
            positionChangeInfo.pullOutNarrative = pullOutNarrative;
            positionChangeInfo.penetrationEnded = true;
            console.log(`[Intimacy] Auto-pulled out before position change`);
        }
    }

    npc.intimacy.position.player = newPositionId;
    npc.intimacy.position.npc = newPositionId;
    
    // Clear LLM enhancement cache on position change
    clearLLMEnhancementCache(npc.intimacy);
    
    console.log(`[Intimacy] Position changed from ${oldPosition} to ${newPositionId}`);
    
    // Check if new position supports the current tool (for edge cases where penetration wasn't cleared)
    const position = getPosition(newPositionId);
    if (position && npc.intimacy.penetration && npc.intimacy.penetration.actId) {
        const act = getAct(npc.intimacy.penetration.actId);
        if (act && !position.validTools.includes(act.tool)) {
            // Position doesn't support the tool - ensure penetration is inactive
            npc.intimacy.penetration.active = false;
            positionChangeInfo.penetrationEnded = true;
            console.log(`[Intimacy] Penetration not supported in new position`);
        }
    }
    
    return { success: true, ...positionChangeInfo };
}

/**
 * End penetration with proper pull-out narration
 * Called when switching positions or orifices
 */
function endPenetrationWithNarration(npc, intimacy, reason = "transition") {
    if (!intimacy || !intimacy.penetration || !intimacy.penetration.active) {
        return null;
    }
    
    const penetration = intimacy.penetration;
    const tool = penetration.tool || "unknown";
    const target = penetration.target || "unknown";
    const playerIsBottom = penetration.playerIsBottom || false;
    
    // Clear penetration state
    intimacy.penetration.active = false;
    
    // Generate pull-out narration based on what was being penetrated
    const posPronoun = typeof getPossessivePronoun === 'function' ? getPossessivePronoun(npc) : "their";
    
    let pullOutNarrative = null;
    
    if (target === "vagina" || target === "pussy") {
        pullOutNarrative = `You pull out from ${posPronoun} vagina`;
    } else if (target === "anus" || target === "ass") {
        pullOutNarrative = `You pull out from ${posPronoun} anus`;
    } else if (target === "mouth" || target === "lips") {
        pullOutNarrative = `You pull out from ${posPronoun} mouth`;
    } else if (playerIsBottom) {
        // Player was receiving penetration
        pullOutNarrative = `${posPronoun} ${tool} pulls out from you`;
    }
    
    // Clear the act tracking
    if (intimacy.lastAction && intimacy.lastAction.actId) {
        delete intimacy.lastAction.actId;
    }
    
    return pullOutNarrative;
}

/**
 * Check if trying to start a new penetration that conflicts with current state
 * Returns true if the action requires pulling out first
 */
function requiresPullOutFirst(npc, act, intimacy) {
    if (!npc || !act || !intimacy) return false;
    
    const currentPenetration = intimacy.penetration;
    
    // If no active penetration, no need to pull out
    if (!currentPenetration || !currentPenetration.active) return false;
    
    // Check if new action is also a penetration action
    const newIsPenetration = act.type === ACT_TYPES.PENETRATE || act.type === ACT_TYPES.CONTINUE;
    
    // If not a penetration action, no conflict
    if (!newIsPenetration) return false;
    
    // If penetrating the same target, no need to pull out (can continue)
    if (currentPenetration.target === act.target) return false;
    
    // Different penetration targets - need to pull out first
    return true;
}

/**
 * Build position change narration for player
 */
function buildPositionChangeNarration(npc, positionChangeInfo) {
    if (!positionChangeInfo) return null;
    
    const { oldPositionLabel, newPositionLabel, pullOutNarrative } = positionChangeInfo;
    
    // If there was a pull-out, include it in the narration
    if (pullOutNarrative) {
        return `${pullOutNarrative}, then reposition from ${oldPositionLabel} to ${newPositionLabel}.`;
    }
    
    // Generate player action narration
    const playerNarrative = `You reposition from ${oldPositionLabel} to ${newPositionLabel}.`;
    
    return playerNarrative;
}

/**
 * Build NPC response for position change (CoT-style)
 */
function buildPositionChangeNPCResponse(npc, positionChangeInfo) {
    if (!npc || !positionChangeInfo) return null;
    
    const { newPosition, newPositionLabel, penetrationEnded } = positionChangeInfo;
    const subjectPronoun = typeof getSubjectPronoun === 'function' ? getSubjectPronoun(npc) : "They";
    const possessivePronoun = typeof getPossessivePronoun === 'function' ? getPossessivePronoun(npc) : "their";
    
    const position = getPosition(newPosition);
    const positionDesc = position ? position.description || newPositionLabel : newPositionLabel;
    
    // Check for internal ejaculation that would cause messy drips when standing
    const intimacy = npc.intimacy || {};
    const hasInternalEjaculation = intimacy.climax && intimacy.climax.hasInternalEjaculation;
    const lastEjaculationTarget = intimacy.climax ? intimacy.climax.lastInternalEjaculation : null;
    
    // Check if moving to a standing position after internal ejaculation
    const isStandingPosition = newPositionLabel && /standing/i.test(newPositionLabel);
    const hasSemenToDrip = hasInternalEjaculation && lastEjaculationTarget && (lastEjaculationTarget === "anus" || lastEjaculationTarget === "vagina");
    
    // Generate semen drip narrative if applicable
    let semenDripNarrative = "";
    if (hasSemenToDrip && isStandingPosition) {
        const target = lastEjaculationTarget;
        if (target === "anus") {
            semenDripNarrative = pickRandom([
                `, your semen immediately beginning to drip from ${possessivePronoun} well-used ${target}, running down ${possessivePronoun} thighs in thick streaks`,
                `, the change in position causing your cum to sluice out of ${possessivePronoun} stretched ${target}, making a messy trail down ${possessivePronoun} legs`,
                `, your release gushing out of ${possessivePronoun} gaping ${target} as gravity takes hold, the warm fluid pooling at ${possessivePronoun} feet`,
                `, a thick glob of semen sliding out from ${possessivePronoun} relaxed ${target}, splattering against ${possessivePronoun} inner thighs`
            ]);
        } else if (target === "vagina") {
            semenDripNarrative = pickRandom([
                `, your cum immediately beginning to leak from ${possessivePronoun} soaked ${target}, trickling down ${possessivePronoun} thighs`,
                `, the change in angle causing your seed to drip from ${possessivePronoun} well-fucked ${target}, warm fluid running down ${possessivePronoun} legs`,
                `, a thick drizzle of semen escaping ${possessivePronoun} ${target}, pooling between ${possessivePronoun} thighs as ${subjectPronoun} stands`,
                `, your release seeping out of ${possessivePronoun} used ${target}, the slick trail evidence of your coupling`
            ]);
        }
    }
    
    // Determine reaction based on position and NPC personality
    const arousalLevel = npc.intimacy ? (npc.intimacy.arousal || 0) : 0;
    const arousalAdjective = arousalLevel > 70 ? pickRandom(["eagerly", "hungrily", "with anticipation"]) :
                            arousalLevel > 40 ? pickRandom(["willingly", "with interest"]) :
                            pickRandom(["patiently", "calmly", "with a nod"]);
    
    // Build appropriate reaction based on position type
    const positionType = position ? position.playerRole || newPosition : newPosition;
    
    let reaction;
    if (penetrationEnded) {
        reaction = pickRandom([
            `${subjectPronoun} lets out a soft sound as you shift positions.`,
            `${subjectPronoun} adjusts ${possessivePronoun} stance, following your lead.`,
            `${subjectPronoun} watches you with interest as the position changes.`
        ]);
    } else if (positionType.includes("standing") || positionType.includes("against") || positionType.includes("pinned")) {
        reaction = pickRandom([
            `${subjectPronoun} stands ${arousalAdjective}, ready for the new angle.`,
            `${subjectPronoun} positions ${possessivePronoun}self ${arousalAdjective} against you.`,
            `${subjectPronoun} shifts to match your stance, ${arousalAdjective}.`
        ]);
    } else if (positionType.includes("lap") || positionType.includes("seated") || positionType.includes("astride")) {
        reaction = pickRandom([
            `${subjectPronoun} settles onto your lap ${arousalAdjective}.`,
            `${subjectPronoun} straddles you ${arousalAdjective}, finding a comfortable position.`,
            `${subjectPronoun} perches on your lap, ${arousalAdjective}.`
        ]);
    } else if (positionType.includes("missionary") || positionType.includes("lying") || positionType.includes("reclining")) {
        reaction = pickRandom([
            `${subjectPronoun} lies back ${arousalAdjective}, welcoming you.`,
            `${subjectPronoun} reclines ${arousalAdjective}, ready for you.`,
            `${subjectPronoun} stretches out beneath you ${arousalAdjective}.`
        ]);
    } else if (positionType.includes("behind") || positionType.includes("doggy") || positionType.includes("bent")) {
        reaction = pickRandom([
            `${subjectPronoun} presents ${possessivePronoun}self to you ${arousalAdjective}.`,
            `${subjectPronoun} turns away from you ${arousalAdjective}, ready for access.`,
            `${subjectPronoun} gets into position ${arousalAdjective}.`
        ]);
    } else {
        reaction = pickRandom([
            `${subjectPronoun} adjusts to the new position ${arousalAdjective}.`,
            `${subjectPronoun} shifts comfortably ${arousalAdjective}.`,
            `${subjectPronoun} follows your lead ${arousalAdjective}.`
        ]);
    }
    
    // Append semen drip narrative if applicable
    if (semenDripNarrative) {
        reaction = reaction + semenDripNarrative;
    }
    
    return reaction;
}

// ============================================================================
// ANATOMY DESCRIBER HELPER
// Rich, varied descriptions for intimate body parts using NPC traits
// ============================================================================

/**
 * Master anatomy describer - generates rich, varied descriptions for body parts
 * @param {Object} npc - The NPC being described
 * @param {string} target - The body part to describe (vagina, penis, breasts, etc.)
 * @param {Object} options - Additional context (action, arousalLevel, isAroused, etc.)
 * @returns {string} - A rich description of the anatomy
 */
function describeAnatomy(npc, target, options = {}) {
    if (!npc || !target) return target;
    
    const { action, arousalLevel = 0, isAroused = false, isWet = false, isErect = false, possessivePronoun = null, isOnCooldown = false } = options;
    
    // Get the anatomy object - check nsfwTraits first (sexual anatomy), then fallback to regular anatomy
    const nsfwAnatomy = (npc.nsfwTraits && npc.nsfwTraits.anatomy) || {};
    const regularAnatomy = npc.anatomy || {};
    const anatomy = { ...regularAnatomy, ...nsfwAnatomy };
    
    const gender = (npc.gender || "").toLowerCase();
    const isFemale = gender === "female" || gender.includes("female");
    const isMale = gender === "male" || gender.includes("male");
    
    const posPronoun = possessivePronoun || (typeof getPossessivePronoun === 'function' ? getPossessivePronoun(npc) : "their");
    
    // Get arousal descriptors
    const arousalDescriptors = getArousalDescriptors(arousalLevel, isAroused, isWet, isErect, isOnCooldown);
    
    switch (target.toLowerCase()) {
        case "vagina":
        case "pussy":
            return describeVagina(npc, anatomy, posPronoun, arousalDescriptors);
        
        case "penis":
        case "cock":
        case "dick":
            return describePenis(npc, anatomy, posPronoun, arousalDescriptors);
        
        case "testicles":
        case "balls":
            return describeTesticles(npc, anatomy, posPronoun, arousalDescriptors);
        
        case "breasts":
        case "boobs":
        case "tits":
            return describeBreasts(npc, anatomy, posPronoun, arousalDescriptors);
        
        case "nipples":
        case "nipple":
            return describeNipples(npc, anatomy, posPronoun, arousalDescriptors);
        
        case "anus":
            return describeAnus(npc, anatomy, posPronoun, arousalDescriptors);
        
        case "ass":
        case "butt":
        case "buttocks":
            return describeButtocks(npc, anatomy, posPronoun, arousalDescriptors);
        
        case "mouth":
        case "lips":
            return describeMouth(npc, anatomy, posPronoun, arousalDescriptors);
        
        case "thighs":
        case "thigh":
            return describeThighs(npc, anatomy, posPronoun, arousalDescriptors);
        
        default:
            return target;
    }
}

/**
 * Get arousal state descriptors
 */
function getArousalDescriptors(arousalLevel, isAroused, isWet, isErect, isOnCooldown = false) {
    const highArousal = arousalLevel > 70;
    const mediumArousal = arousalLevel > 40;
    
    // For cooldown state, override with limp/flaccid descriptors
    if (isOnCooldown) {
        return {
            wetness: null,
            engorgement: pickRandom(["limp", "flaccid", "soft", "spent"]),
            state: pickRandom(["spent", "recovering", "resting", "subsided"]),
            coloration: null
        };
    }
    
    return {
        wetness: isWet ? pickRandom(["slick", "dripping", "glistening", "soaked", "sodden"]) : 
                 highArousal ? pickRandom(["damp", "moist", "dewy", "slightly wet"]) : null,
        
        engorgement: isErect ? pickRandom(["fully engorged", "throbbing", "rigid", "stiff", "hard"]) :
                      highArousal ? pickRandom(["semi-engorged", "swollen", "plump", "firm"]) :
                      mediumArousal ? pickRandom(["slightly swollen", "turgid", "full"]) : null,
        
        state: isAroused || highArousal ? pickRandom(["aroused", "needy", "pulsing", "aching", "throbbing"]) :
               mediumArousal ? pickRandom(["stirred", "warm", "tingling"]) : null,
        
        coloration: isAroused || highArousal ? pickRandom(["deepened in color", "flushed dark", "rosy and swollen", "darkened with desire"]) :
                    mediumArousal ? pickRandom(["slightly pink", "warm-toned", "faintly flushed"]) : null
    };
}

/**
 * Describe vagina/pussy with rich detail
 */
function describeVagina(npc, anatomy, posPronoun, arousalDescriptors) {
    const pubicHair = anatomy.pubicHair || {};
    const genitals = anatomy.genitals || {};
    const genitalSize = anatomy.genitalSize || {};
    const size = genitalSize.sizeCategory || "medium";
    const hairColor = pubicHair.color || "dark";
    const hairStyle = pubicHair.style || "natural";
    const genitalDesc = genitals.description || "vagina";
    const pigmentation = genitals.pigmentation || "natural";
    
    const descriptions = [];
    
    // Pubic hair description
    if (hairStyle !== "smooth" && hairStyle !== "none") {
        const hairAdjectives = {
            dark: ["dark", "ebony", "raven", "jet black", "deep brown"],
            brown: ["chestnut", "auburn", "caramel", "cinnamon"],
            black: ["inky", "obsidian", "coal-black", "midnight"],
            blonde: ["golden", "honey", "sun-kissed", "pale"],
            auburn: ["fiery", "copper", "russet", "burnished"],
            grey: ["silver", "steel", "pepper-and-salt", "frosted"]
        };
        const hairAdj = hairAdjectives[hairColor] ? pickRandom(hairAdjectives[hairColor]) : hairColor;
        
        const styleDescriptions = {
            "neatly trimmed": ["neatly trimmed", "closely cropped", "manicured"],
            "natural": ["a natural bush of", "a thick patch of", "a wild tangle of"],
            "thick": ["a thick thatch of", "a dense forest of", "a lush growth of"],
            "a messy natural": ["a wild growth of", "an unkempt thicket of", "a tangled bush of"],
            "a unkept and thick": ["a wild, unkempt thicket of", "a dense, untamed growth of"],
            "smooth": ["smooth and bare", "shaven clean", "hairless"],
            "long thick and wild": ["a wild mane of", "an untamed thicket of", "a luxuriant growth of"]
        };
        const styleDesc = styleDescriptions[hairStyle] ? pickRandom(styleDescriptions[hairStyle]) : hairStyle;
        
        descriptions.push(`${styleDesc} ${hairAdj} pubic hair`);
    } else {
        descriptions.push(pickRandom(["smooth and bare skin", "shaven clean flesh", "hairless mound"]));
    }
    
    // Labia/vulva description
    const labiaDescriptors = {
        small: ["tight", "delicate", "petite", "dainty"],
        medium: ["plump", "well-formed", "soft", "firm"],
        large: ["meaty", "full", "ample", "thick", "voluptuous"]
    };
    const labiaAdj = labiaDescriptors[size] ? pickRandom(labiaDescriptors[size]) : pickRandom(["soft", "warm"]);
    
    const vulvaTerms = pickRandom(["labia", "lips", "folds", "petals", "velvet folds"]);
    
    // Add arousal state - use at most one wetness/engorgement descriptor to avoid overloading
    const wetDesc = arousalDescriptors.wetness ? `${arousalDescriptors.wetness} ` : "";
    const engorgedDesc = arousalDescriptors.engorgement ? `${arousalDescriptors.engorgement} ` : "";
    const arousalDesc = wetDesc || engorgedDesc; // Use at most one
    
    // Build the description - avoid chaining multiple descriptors
    const baseDesc = arousalDesc ? pickRandom([
        `${posPronoun} ${arousalDesc}${genitalDesc}`,
        `${posPronoun} ${arousalDesc}${labiaAdj} ${vulvaTerms}`
    ]) : pickRandom([
        `${posPronoun} ${genitalDesc}`,
        `${posPronoun} ${labiaAdj} ${vulvaTerms}`,
        `${posPronoun} ${labiaAdj} ${genitalDesc}`
    ]);
    
    return pickRandom([
        `${posPronoun} ${descriptions[0]}, parting to reveal ${baseDesc}`,
        `through ${posPronoun} ${descriptions[0]} to ${baseDesc}`,
        `${baseDesc}, framed by ${posPronoun} ${descriptions[0]}`,
        `${posPronoun} ${labiaAdj} ${vulvaTerms}`
    ]);
}

/**
 * Describe penis/cock with rich detail
 */
function describePenis(npc, anatomy, posPronoun, arousalDescriptors) {
    const genitals = anatomy.genitals || {};
    const genitalSize = anatomy.genitalSize || {};
    const size = genitalSize.sizeCategory || "medium";
    const genitalDesc = genitals.description || "cock";
    const pigmentation = genitals.pigmentation || "natural";
    
    const sizeDescriptors = {
        small: ["modest", "petite", "compact", "trim"],
        medium: ["respectable", "well-proportioned", "solid", "sturdy"],
        large: ["impressive", "thick", "girthy", "heavy", "substantial"]
    };
    const sizeAdj = sizeDescriptors[size] ? pickRandom(sizeDescriptors[size]) : "";
    
    const stateDesc = arousalDescriptors.engorgement ? arousalDescriptors.engorgement : 
                     arousalDescriptors.state ? arousalDescriptors.state : "";
    
    const descriptions = [
        `${posPronoun} ${sizeAdj} ${genitalDesc}`,
        `${posPronoun} ${sizeAdj} ${genitalDesc}`,
        `${posPronoun} ${stateDesc} ${sizeAdj} ${genitalDesc}`
    ];
    
    return pickRandom(descriptions);
}

/**
 * Describe testicles/balls with rich detail
 */
function describeTesticles(npc, anatomy, posPronoun, arousalDescriptors) {
    const genitalSize = anatomy.genitalSize || {};
    const size = genitalSize.sizeCategory || "medium";
    
    const sizeDescriptors = {
        small: ["tight", "compact", "neat"],
        medium: ["full", "heavy", "well-hung"],
        large: ["weighty", "swinging", "substantial", "pendulous"]
    };
    const sizeAdj = sizeDescriptors[size] ? pickRandom(sizeDescriptors[size]) : "";
    
    const stateDesc = arousalDescriptors.engorgement ? arousalDescriptors.engorgement : 
                     arousalDescriptors.state ? arousalDescriptors.state : "";
    
    return pickRandom([
        `${posPronoun} ${sizeAdj} balls`,
        `${posPronoun} ${stateDesc} ${sizeAdj} testicles`,
        `${posPronoun} ${sizeAdj} ${pickRandom(["sack", "scrotum"])}`,
        `${posPronoun} ${pickRandom(["heavy", "full"])} ${sizeAdj} balls`
    ]);
}

/**
 * Describe breasts with rich detail
 */
function describeBreasts(npc, anatomy, posPronoun, arousalDescriptors) {
    const breasts = anatomy.breasts || {};
    const size = breasts.sizeCategory || (npc.gender === "female" ? "medium" : "flat");
    const breastDesc = breasts.description || "chest";
    const nipples = breasts.nipples || {};
    const areolas = breasts.areolas || {};
    
    const sizeDescriptors = {
        flat: ["small", "modest", "petite", "boyish"],
        medium: ["perky", "round", "firm", "shapely"],
        large: ["full", "ample", "generous", "heavy", "voluptuous"]
    };
    const sizeAdj = sizeDescriptors[size] ? pickRandom(sizeDescriptors[size]) : "";
    
    const nippleDescriptors = {
        small: ["delicate", "tiny", "dainty", "pert"],
        average: ["perky", "prominent", "defined"],
        prominent: ["thick", "puffy", "distended", "protruding"]
    };
    const nippleAdj = nippleDescriptors[nipples.size] ? pickRandom(nippleDescriptors[nipples.size]) : "";
    const nippleTexture = nipples.texture || "smooth";
    
    const areolaSize = areolas.size || "average";
    const areolaPigment = areolas.pigmentation || "softly tinted";
    
    const stateDesc = arousalDescriptors.engorgement ? arousalDescriptors.engorgement : 
                     arousalDescriptors.state ? arousalDescriptors.state : "";
    
    const baseDescs = [
        `${posPronoun} ${sizeAdj} ${breastDesc}`,
        `the ${sizeAdj} swell of ${posPronoun} ${breastDesc}`,
        `${posPronoun} ${stateDesc} ${sizeAdj} breasts`
    ];
    
    const detailedDescs = [
        `${posPronoun} ${sizeAdj} ${breastDesc}, topped with ${nippleAdj} ${nippleTexture} ${pickRandom(["nipples", "teats", "buds"])}`,
        `the ${sizeAdj} mounds of ${posPronoun} ${breastDesc}, crowned with ${areolaPigment} ${areolaSize} areolas`,
        `${posPronoun} ${stateDesc} ${sizeAdj} breasts, the ${nippleAdj} nipples standing proudly`
    ];
    
    return pickRandom([...baseDescs, ...detailedDescs]);
}

/**
 * Describe nipples with rich detail
 */
function describeNipples(npc, anatomy, posPronoun, arousalDescriptors) {
    const breasts = anatomy.breasts || {};
    const nipples = breasts.nipples || {};
    const areolas = breasts.areolas || {};
    
    const nippleDescriptors = {
        small: ["delicate", "tiny", "dainty", "pert"],
        average: ["perky", "prominent", "defined", "firm"],
        prominent: ["thick", "puffy", "distended", "protruding", "erect"]
    };
    const nippleAdj = nippleDescriptors[nipples.size] ? pickRandom(nippleDescriptors[nipples.size]) : "";
    const nippleTexture = nipples.texture || "smooth";
    const areolaPigment = areolas.pigmentation || "softly tinted";
    const areolaSize = areolas.size || "average";
    
    const stateDesc = arousalDescriptors.engorgement ? arousalDescriptors.engorgement : 
                     arousalDescriptors.state ? arousalDescriptors.state : "";
    
    return pickRandom([
        `${posPronoun} ${nippleAdj} ${pickRandom(["nipples", "teats", "buds", "peaks"])}`,
        `${posPronoun} ${nippleAdj} ${nippleTexture} ${pickRandom(["nipples", "nubs"])}`,
        `${posPronoun} ${stateDesc} ${nippleAdj} nipples, surrounded by ${areolaPigment} ${areolaSize} areolas`,
        `${posPronoun} ${nippleAdj} points of ${posPronoun} breasts`
    ]);
}

/**
 * Describe anus with rich detail
 * Uses anatomical terms: star, rosebud, pucker, ring, etc.
 */
function describeAnus(npc, anatomy, posPronoun, arousalDescriptors) {
    const anus = anatomy.anus || {};
    const size = anus.size || "snug";
    const sphincter = anus.sphincter || "tight";
    const desc = anus.description || "anus";
    const pigmentation = anus.pigmentation || null;
    
    const { state, engorgement } = arousalDescriptors;
    
    // More anatomical and sensual terms for anus
    const anusTerms = pickRandom([
        "rosebud", "star", "pucker", "sphincter", "orifice", "opening", 
        "entry", "entrance", "hole"
    ]);
    
    const sizeDescriptors = {
        tight: ["tight", "clenching", "constricted", "narrow", "virgin", "resistant"],
        snug: ["snug", "firm", "shapely", "tightly clenched", "resilient"],
        firm: ["firm", "resilient", "muscular", "controlled", "toned"],
        supple: ["supple", "yielding", "soft", "pliant", "flexible"],
        loose: ["loose", "relaxed", "experienced", "used", "accommodating"],
        gaping: ["gaping", "stretched", "wide", "welcoming", "open"],
        stretchy: ["stretchy", "accommodating", "flexible", "elastic", "pliable"]
    };
    const sizeAdj = sizeDescriptors[size] ? pickRandom(sizeDescriptors[size]) : size;
    
    // Sphincters are wrinkly/puckered by nature - never "neat" or "ringed" in the tidy sense
    // Note: For penetration in progress, use descriptors from the penetration context, not these
    const sphincterDescriptors = {
        tight: ["clenched", "resistant", "shyly guarded", "tense and shut", "tightly squeezed"],
        snug: ["puckered", "wrinkled", "firm", "tight", "squeezed"],
        firm: ["controlled", "clenched", "toned", "puckered", "muscular"],
        supple: ["yielding", "pulsing", "receptive", "soft", "wrinkled"],
        loose: ["open", "parted", "experienced", "stretched", "gaping"]
    };
    const sphincterDesc = sphincterDescriptors[sphincter] ? pickRandom(sphincterDescriptors[sphincter]) : sphincter;
    
    // Add pigmentation if available and not generic
    const pigmentDesc = pigmentation && pigmentation !== "natural" && pigmentation !== "natural toned" 
        ? `${pigmentation} ` 
        : "";
    
    // Build descriptions with more sensual, anatomical language
    // Always use possessive pronoun for consistency in action narratives
    // Use at most one size descriptor to avoid chaining (e.g., "tight-lipped")
    const singleDesc = pickRandom([sizeAdj, sphincterDesc, pigmentDesc.replace(/ $/, ''), engorgement, state].filter(Boolean)) || sizeAdj;
    return `${posPronoun} ${singleDesc} ${anusTerms}`.replace(/  /g, ' ').trim();
}

/**
 * Describe buttocks with rich detail
 * Uses terms like: cheeks, globes, mounds, rounded, firm, plump, etc.
 */
function describeButtocks(npc, anatomy, posPronoun, arousalDescriptors) {
    const buttocks = anatomy.buttocks || {};
    const size = buttocks.sizeCategory || "medium";
    const desc = buttocks.description || "buttocks";
    const hips = anatomy.hips || {};
    const hipSize = hips.sizeCategory || "average";
    
    const sizeDescriptors = {
        small: ["small", "petite", "compact", "tight"],
        medium: ["rounded", "shapely", "firm", "well-formed"],
        large: ["full", "ample", "generous", "plump", "voluptuous"]
    };
    const sizeAdj = sizeDescriptors[size] ? pickRandom(sizeDescriptors[size]) : "shapely";
    
    const hipDescriptors = {
        narrow: ["narrow", "slender"],
        average: ["curved", "graceful"],
        wide: ["wide", "generous"]
    };
    const hipAdj = hipDescriptors[hipSize] ? pickRandom(hipDescriptors[hipSize]) : "curved";
    
    // Add arousal-based descriptors
    const { wetness, engorgement, state } = arousalDescriptors;
    const arousedDesc = state ? pickRandom(["flushed", "warm", "tingling", "needy"]) : "";
    
    // Various ways to describe buttocks
    const cheekTerms = pickRandom(["cheeks", "globes", "mounds", "orbs", "spheres"]);
    const buttTerms = pickRandom(["butt", "rear", "backside", "posterior"]);
    
    // Use at most one descriptor to avoid chaining (e.g., "needy shapely buttocks")
    const singleDesc = pickRandom([sizeAdj, arousedDesc, hipAdj].filter(Boolean)) || sizeAdj;
    
    return pickRandom([
        `${posPronoun} ${singleDesc} ${cheekTerms}`,
        `${posPronoun} ${singleDesc} ${buttTerms}`,
        `${posPronoun} ${singleDesc} ${cheekTerms}, ${hipAdj} hips`,
        `${posPronoun} ${singleDesc} buttocks`,
        `${posPronoun} ${singleDesc} backside`
    ]);
}

/**
 * Describe mouth/lips with rich detail
 */
function describeMouth(npc, anatomy, posPronoun, arousalDescriptors) {
    const body = anatomy.body || {};
    const surfaceType = body.surfaceType || "skin";
    
    return pickRandom([
        `${posPronoun} ${pickRandom(["soft", "warm", "inviting", "parted", "pouty"])} lips`,
        `${posPronoun} ${pickRandom(["sweet", "warm", "soft", "moist"])} mouth`,
        `${posPronoun} ${pickRandom(["full", "plump", "sensual", "kissable"])} lips`,
        `${posPronoun} ${surfaceType}-soft lips`
    ]);
}

/**
 * Describe thighs with rich detail
 */
function describeThighs(npc, anatomy, posPronoun, arousalDescriptors) {
    const buttocks = anatomy.buttocks || {};
    const size = buttocks.sizeCategory || "medium";
    
    const descriptors = {
        small: ["slender", "lean", "delicate"],
        medium: ["shapely", "firm", "well-formed"],
        large: ["thick", "ample", "generous", "full"]
    };
    const sizeAdj = descriptors[size] ? pickRandom(descriptors[size]) : "soft";
    
    return pickRandom([
        `${posPronoun} ${sizeAdj} thighs`,
        `${posPronoun} ${sizeAdj} inner thighs`,
        `${posPronoun} ${pickRandom(["smooth", "soft", "warm"])} ${sizeAdj} thighs`,
        `${posPronoun} ${sizeAdj} thighs`
    ]);
}

/**
 * Get possessive pronoun helper for the describer
 */
function getPossessiveForDescriber(npc) {
    return typeof getPossessivePronoun === 'function' ? getPossessivePronoun(npc) : "their";
}

/**
 * Enhance action label with rich anatomy descriptions
 * Replaces generic body part references with detailed, sensual descriptions
 * @param {Object} npc - The NPC
 * @param {string} label - The action label (e.g., "Lick vagina", "Touch breasts")
 * @param {Object} context - Additional context (arousalLevel, action type, etc.)
 * @returns {string} - Enhanced label with rich anatomy descriptions
 */
function enhanceActionLabel(npc, label, context = {}) {
    if (!npc || !label) return label;
    
    const { arousalLevel = 0, actionType, actId } = context;
    // Check nsfwTraits first (sexual anatomy), then fallback to regular anatomy
    const nsfwAnatomy = (npc.nsfwTraits && npc.nsfwTraits.anatomy) || {};
    const regularAnatomy = npc.anatomy || {};
    const anatomy = { ...regularAnatomy, ...nsfwAnatomy };
    const gender = (npc.gender || "").toLowerCase();
    const isFemale = gender === "female" || gender.includes("female");
    
    // Body parts that can be enhanced
    const bodyPartPatterns = [
        // Vagina/pussy
        { patterns: [/\bpussy\b/i, /\bvagina\b/i, /\bclitoris\b/i, /\bclit\b/i, /\blabia\b/i], target: "vagina" },
        // Penis
        { patterns: [/\bpenis\b/i, /\bcock\b/i, /\bdick\b/i, /\bshaft\b/i], target: "penis" },
        // Testicles
        { patterns: [/\bballs\b/i, /\btesticles\b/i, /\btestes\b/i, /\bsac\b/i], target: "testicles" },
        // Breasts
        { patterns: [/\bbreasts\b/i, /\bboobs\b/i, /\btits\b/i, /\bbust\b/i, /\bchest\b/i], target: "breasts" },
        // Nipples
        { patterns: [/\bnipples\b/i, /\bnipple\b/i, /\bteats\b/i, /\bpeaks\b/i], target: "nipples" },
        // Anus/Butt
        { patterns: [/\banus\b/i, /\bass\b/i, /\bbuttocks\b/i, /\bbutt\b/i, /\brear\b/i], target: "anus" },
        // Mouth/Lips
        { patterns: [/\blips\b/i, /\bmouth\b/i], target: "mouth" },
        // Thighs
        { patterns: [/\bthighs\b/i, /\bthigh\b/i], target: "thighs" }
    ];
    
    let enhancedLabel = label;
    const posPronoun = typeof getPossessivePronoun === 'function' ? getPossessivePronoun(npc) : "their";
    
    // Check if this is a "receive" action (player is bottom)
    const act = typeof getAct === 'function' ? getAct(actId || label) : null;
    const isPlayerBottom = act && act.playerIsBottom === true;
    
    // Determine arousal state based on context
    const isAroused = arousalLevel > 50;
    const isWet = arousalLevel > 60 || (isFemale && arousalLevel > 40);
    const isErect = (isFemale && arousalLevel > 50) || (!isFemale && arousalLevel > 30);
    
    for (const { patterns, target } of bodyPartPatterns) {
        for (const pattern of patterns) {
            if (pattern.test(enhancedLabel)) {
                // Only enhance if the body part is not already described in a rich way
                // Skip if it's part of a longer descriptive phrase
                const match = enhancedLabel.match(pattern);
                if (match) {
                    const described = describeAnatomy(npc, target, {
                        arousalLevel,
                        isAroused,
                        isWet,
                        isErect,
                        possessivePronoun: posPronoun
                    });
                    
                    // Replace the match with the rich description
                    // But only if it's a standalone reference, not part of a larger word
                    enhancedLabel = enhancedLabel.replace(pattern, described);
                }
            }
        }
    }
    
    return enhancedLabel;
}

/**
 * Get suggested positions for current state
 */
function getSuggestedPositions(npc) {
    if (!npc || !npc.intimacy) return [];
    
    const currentPosition = npc.intimacy.position.player;
    const allPositions = getAllPositionIds();
    
    // Filter out current position
    const otherPositions = allPositions.filter(p => p !== currentPosition);
    
    // Limit to 3-5 suggestions
    return otherPositions.slice(0, 5);
}

// ============================================================================
// EXPORT
// ============================================================================

// Export all functions and data
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        // From data files
        ...(typeof INTIMACY_POSITIONS !== 'undefined' ? { INTIMACY_POSITIONS } : {}),
        ...(typeof DEFAULT_POSITION !== 'undefined' ? { DEFAULT_POSITION } : {}),
        ...(typeof getPosition !== 'undefined' ? { getPosition } : {}),
        ...(typeof INTIMACY_MATRIX !== 'undefined' ? { INTIMACY_MATRIX } : {}),
        ...(typeof ACT_TYPES !== 'undefined' ? { ACT_TYPES } : {}),
        ...(typeof CLOTHING_REQUIREMENTS !== 'undefined' ? { CLOTHING_REQUIREMENTS } : {}),
        ...(typeof VIRGINITY_TYPES !== 'undefined' ? { VIRGINITY_TYPES } : {}),
        ...(typeof SEX_ACTS !== 'undefined' ? { SEX_ACTS } : {}),
        ...(typeof AROUSAL_CONFIG !== 'undefined' ? { AROUSAL_CONFIG } : {}),
        ...(typeof INTIMACY_STAGES !== 'undefined' ? { INTIMACY_STAGES } : {}),
        ...(typeof CLIMAX_CONFIG !== 'undefined' ? { CLIMAX_CONFIG } : {}),
        
        // State management
        initializeIntimacyState,
        resetIntimacyState,
        startIntimacyEncounter,
        endIntimacyEncounter,
        updateLastActivity,
        
        // Action generation
        generateValidActions,
        applyStageFiltering,
        checkToolTargetAccessibility,
        getClothingForBodyPart,
        getTargetCoveredParts,
        isActionValid,
        checkActionValidity,
        generateAllActionsWithStatus,
        applyStageFilteringToSingleAction,
        getDisabledHintText,
        
        // Action execution
        executeIntimacyAction,
        handleClothingAction,
        handlePenetrationAction,
        handleVirginityLoss,
        updateArousal,
        generateActionResponse,
        buildActionContext,
        buildClothingDescription,
        buildIntimacyPrompt,
        buildContinuityContext,
        buildPersonalityContext,
        describeArousalLevel,
        buildFallbackResponse,
        generateEndResponse,
        
        // Climax and consequences
        handleClimax,
        determineMaleCooldown,
        handleFluidConsequence,
        checkPregnancyRisk,
        attemptPregnancy,
        checkCooldownForAction,
        isOnCooldown,
        getRemainingCooldown,
        formatCooldownTime,
        
        // Menu
        organizeActionsForMenu,
        getMenuActions,
        getActionCategory,
        getMinimumPhaseForAction,
        getPhaseName,
        
        // Lube
        addLube,
        useLube,
        hasLube,
        handleLubeFromAction,
        consumeLubeForPenetration,
        
        // Position
        changePosition,
        getSuggestedPositions,
        buildPositionChangeNarration,
        buildPositionChangeNPCResponse,
        getClothingStateForCharacter,
        
        // Narrative
        buildIntimacyResponse,
        getPossessivePronoun,
        getSubjectPronoun,
        getObjectPronoun,
        
        // Anatomy Describer
        describeAnatomy,
        getArousalDescriptors,
        enhanceActionLabel,
        describeVagina,
        describePenis,
        describeTesticles,
        describeBreasts,
        describeNipples,
        describeAnus,
        describeButtocks,
        describeMouth,
        describeThighs,
        
        // Narrative Generator
        generateIntimacyNarrative,
        buildActionNarratives,
        verbConjugation,
        buildVaginaNarratives,
        buildPenisNarratives,
        buildTesticlesNarratives,
        buildBreastNarratives,
        buildAnusNarratives,
        buildButtockNarratives,
        buildMouthNarratives,
        buildThighNarratives,
        getPubicDescription,
        getSkinDescription,
        getVaginalInteriorColor,
        getAnalInteriorColor,
        isAnalEntryEasy,
        isCivilizedSpecies,
        canNPCSpeak,
        getNPCDialogueStyle,
        getMergedAnatomy
    };
}

// Assign to window for browser use
if (typeof window !== 'undefined') {
    window.initializeIntimacyState = initializeIntimacyState;
    window.resetIntimacyState = resetIntimacyState;
    window.startIntimacyEncounter = startIntimacyEncounter;
    window.endIntimacyEncounter = endIntimacyEncounter;
    window.executeIntimacyAction = executeIntimacyAction;
    window.getMenuActions = getMenuActions;
    window.CLIMAX_CONFIG = CLIMAX_CONFIG;
    window.checkActionValidity = checkActionValidity;
    window.generateAllActionsWithStatus = generateAllActionsWithStatus;
    window.applyStageFilteringToSingleAction = applyStageFilteringToSingleAction;
    window.getDisabledHintText = getDisabledHintText;
    window.buildIntimacyResponse = buildIntimacyResponse;
    window.getPossessivePronoun = getPossessivePronoun;
    window.getSubjectPronoun = getSubjectPronoun;
    window.getObjectPronoun = getObjectPronoun;
    window.changePosition = changePosition;
    window.buildPositionChangeNarration = buildPositionChangeNarration;
    window.buildPositionChangeNPCResponse = buildPositionChangeNPCResponse;
    window.describeAnatomy = describeAnatomy;
    window.getArousalDescriptors = getArousalDescriptors;
    window.enhanceActionLabel = enhanceActionLabel;
    window.generateIntimacyNarrative = generateIntimacyNarrative;
    window.getSkinDescription = getSkinDescription;
    window.getVaginalInteriorColor = getVaginalInteriorColor;
    window.getAnalInteriorColor = getAnalInteriorColor;
    window.getScentDescriptor = getScentDescriptor;
    window.isAnalEntryEasy = isAnalEntryEasy;
    window.isCivilizedSpecies = isCivilizedSpecies;
    window.canNPCSpeak = canNPCSpeak;
    window.getNPCDialogueStyle = getNPCDialogueStyle;
    window.UNCIVILIZED_DIALOGUE = UNCIVILIZED_DIALOGUE;
    window.NONVERBAL_REACTIONS = NONVERBAL_REACTIONS;
    window.LLM_ENHANCEMENT_CONFIG = LLM_ENHANCEMENT_CONFIG;
    window.isSexualAct = isSexualAct;
    window.clearLLMEnhancementCache = clearLLMEnhancementCache;
}

// ============================================================================
// NARRATIVE GENERATOR
// Creates flowing, sensual action narratives with rich anatomy descriptions
// ============================================================================

/**
 * Generate a rich narrative for an intimacy action
 * Creates flowing sentences like: "You part her brown pubs and expose her meaty vagina, sliding your tongue between her engorged labia..."
 * @param {Object} npc - The NPC
 * @param {string} actionId - The action ID (e.g., "lick_pussy", "touch_breasts")
 * @param {Object} context - Additional context (arousalLevel, player, etc.)
 * @returns {string} - A rich narrative sentence
 */
function generateIntimacyNarrative(npc, actionId, context = {}) {
    if (!npc || !actionId) return null;
    
    const { player, arousalLevel = 0, isAroused = false, isWet = false, isErect = false, isOnCooldown = false, isContinueAction = false, intimacy = null } = context;
    const act = typeof getAct === 'function' ? getAct(actionId) : null;
    if (!act) return null;
    
    const { verb, target, tool, label } = act;
    const posPronoun = typeof getPossessivePronoun === 'function' ? getPossessivePronoun(npc) : "their";
    const subjectPronoun = typeof getSubjectPronoun === 'function' ? getSubjectPronoun(npc) : "They";
    const objPronoun = typeof getObjectPronoun === 'function' ? getObjectPronoun(npc) : "them";
    
    // Build transition narrative if switching from a different action or for first action
    let transitionNarrative = "";
    if (intimacy && !isContinueAction) {
        const lastActId = intimacy.lastAction ? intimacy.lastAction.actId : null;
        
        // If there's a last action and it's different from current
        if (lastActId && lastActId !== actionId) {
            const lastAct = typeof getAct === 'function' ? getAct(lastActId) : null;
            if (lastAct) {
                transitionNarrative = buildTransitionNarration(npc, lastAct, act, { posPronoun, objPronoun }, player);
            }
        } else if (!lastActId) {
            // First action in encounter - add initial contact description
            transitionNarrative = buildInitialContactNarration(npc, act, { posPronoun }, player);
        }
    }
    
    // Determine action category and generate appropriate narrative
    const narratives = buildActionNarratives(npc, actionId, act, { ...context, isContinueAction });
    
    // Pick a narrative based on context
    let finalNarrative = pickRandom(narratives);
    
    // Prepend transition narrative if we have one
    if (transitionNarrative && finalNarrative) {
        finalNarrative = transitionNarrative + " " + finalNarrative;
    } else if (transitionNarrative) {
        finalNarrative = transitionNarrative;
    }
    
    // For continue actions, try to use LLM-enhanced version if cached
    if (isContinueAction && intimacy && typeof initializeLLMEnhancement === 'function') {
        // Ensure LLM enhancement system is initialized
        initializeLLMEnhancement(intimacy);
        
        const currentPosition = (intimacy.position && intimacy.position.player) || "Unknown";
        const cachedEnhancement = getCachedLLMEnhancement(intimacy, actionId, currentPosition);
        if (cachedEnhancement) {
            return cachedEnhancement;
        }
        
        // If no cache, fire off LLM enhancement request for future use
        // and return our generated narrative for now
        if (typeof requestLLMEnhancement === 'function') {
            requestLLMEnhancement(npc, act, intimacy, finalNarrative).catch(e => {
                console.warn(`[Intimacy LLM] Enhancement request failed:`, e);
            });
        }
    }
    
    return finalNarrative;
}

/**
 * Build initial contact narration for the first action in an encounter
 */
function buildInitialContactNarration(npc, act, pronouns = {}, player = null) {
    const { posPronoun = "their" } = pronouns;
    const { target, tool, verb } = act;
    
    // Normalize for comparison
    const normalize = (str) => (str || "").toLowerCase().trim();
    const targetNorm = normalize(target);
    const toolNorm = normalize(tool);
    const verbNorm = normalize(verb);
    
    // Helper to get natural label
    const getLabel = (actId) => {
        return typeof getNaturalLabel === 'function' ? getNaturalLabel(actId, npc, player) : (act.label || actId);
    };
    
    const isKissing = ['kiss', 'lick'].includes(verbNorm);
    const isTouching = ['touch', 'caress', 'stroke', 'rub', 'grope', 'squeeze', 'massage'].includes(verbNorm);
    const isPenetrating = ['fuck', 'thrust', 'pound', 'enter', 'penetrate', 'bury', 'slide', 'grind'].includes(verbNorm);
    const isOral = (t) => ['mouth', 'lips', 'tongue'].includes(normalize(t));
    const isGenital = (t) => ['vagina', 'pussy', 'clitoris', 'clit'].includes(normalize(t));
    const isAnal = (t) => ['anus', 'butt', 'butthole', 'ass'].includes(normalize(t));
    const isBreast = (t) => ['breast', 'breasts', 'chest', 'nipple', 'nipples'].includes(normalize(t));
    
    // Kissing
    if (isKissing) {
        if (targetNorm === 'lips' || targetNorm === 'mouth') {
            return `You lean in, parting your lips as you press them to ${posPronoun} ${getLabel(act.id)}`;
        }
        return `You lean in and bring your lips to ${posPronoun} ${getLabel(act.id)}`;
    }
    
    // Touching face/lips
    if (isTouching && (isOral(targetNorm) || targetNorm === 'face' || targetNorm === 'cheek')) {
        return `You reach out, your ${toolNorm} gently ${verbNorm} ${posPronoun} ${getLabel(act.id)}`;
    }
    
    // Touching genitals
    if (isTouching && (isGenital(targetNorm) || isAnal(targetNorm))) {
        if (targetNorm === 'vagina' || targetNorm === 'pussy') {
            return `You reach down, your ${toolNorm} finding ${posPronoun} ${getLabel(act.id)}`;
        }
        if (isAnal(targetNorm)) {
            return `You reach around, your ${toolNorm} tracing ${posPronoun} ${getLabel(act.id)}`;
        }
        return `You reach out, your ${toolNorm} making contact with ${posPronoun} ${getLabel(act.id)}`;
    }
    
    // Penetration
    if (isPenetrating) {
        if (targetNorm === 'vagina' || targetNorm === 'pussy') {
            return `You position yourself, guiding your ${toolNorm} to ${posPronoun} ${getLabel(act.id)}`;
        }
        if (isAnal(targetNorm)) {
            return `You guide your ${toolNorm} into position at ${posPronoun} ${getLabel(act.id)}`;
        }
        if (isOral(targetNorm)) {
            return `You bring your ${toolNorm} to ${posPronoun} ${getLabel(act.id)}`;
        }
    }
    
    // Default initial contact
    return `You make contact, your ${toolNorm} ${verbNorm} ${posPronoun} ${getLabel(act.id)}`;
}

/**
 * Build transition narration when switching between different actions
 */
function buildTransitionNarration(npc, lastAct, currentAct, pronouns = {}, player = null) {
    const { posPronoun = "their", objPronoun = "them" } = pronouns;
    const { target: lastTarget, tool: lastTool, verb: lastVerb } = lastAct;
    const { target, tool, verb } = currentAct;
    
    // Normalize for comparison
    const normalize = (str) => (str || "").toLowerCase().trim();
    const lastTargetNorm = normalize(lastTarget);
    const currentTargetNorm = normalize(target);
    const lastToolNorm = normalize(lastTool);
    const currentToolNorm = normalize(tool);
    
    // If tool and target are the same, no significant transition needed
    if (lastToolNorm === currentToolNorm && lastTargetNorm === currentTargetNorm) {
        return "";
    }
    
    // Determine categories for smarter transitions
    const isTouching = (v) => ['touch', 'caress', 'stroke', 'rub', 'grope', 'squeeze', 'massage'].includes(normalize(v));
    const isKissing = (v) => ['kiss', 'lick'].includes(normalize(v));
    const isPenetrating = (v) => ['fuck', 'thrust', 'pound', 'enter', 'penetrate', 'bury', 'slide', 'grind'].includes(normalize(v));
    const isOral = (t) => ['mouth', 'lips', 'tongue'].includes(normalize(t));
    const isGenital = (t) => ['vagina', 'pussy', 'penis', 'cock', 'clitoris', 'clit'].includes(normalize(t));
    const isAnal = (t) => ['anus', 'butt', 'butthole', 'ass'].includes(normalize(t));
    const isBreast = (t) => ['breast', 'breasts', 'chest', 'nipple', 'nipples'].includes(normalize(t));
    const isFinger = (t) => ['finger', 'fingers', 'hand'].includes(normalize(t));
    
    const lastVerbNorm = normalize(lastVerb);
    const currentVerbNorm = normalize(verb);
    
    // Get gender-specific pronouns for NPC
    const npcGender = (npc.gender || "").toLowerCase();
    const heShe = npcGender.includes("male") ? "he" : npcGender.includes("female") ? "she" : "they";
    const himHer = npcGender.includes("male") ? "him" : npcGender.includes("female") ? "her" : "them";
    const hisHer = npcGender.includes("male") ? "his" : npcGender.includes("female") ? "her" : "their";
    
    // Helper to get natural label
    const getLabel = (actId) => {
        return typeof getNaturalLabel === 'function' ? getNaturalLabel(actId, npc, player) : (currentAct.label || actId);
    };
    
    // Case 1: Transition to kissing from non-kissing
    if (isKissing(currentVerbNorm) && !isKissing(lastVerbNorm) && !isOral(lastTargetNorm)) {
        if (currentTargetNorm === 'lips' || currentTargetNorm === 'mouth') {
            return `You lean in and press your lips to ${posPronoun} ${getLabel(currentAct.id)}`;
        }
        return `You lean in and kiss ${posPronoun} ${getLabel(currentAct.id)}`;
    }
    
    // Case 2: Moving from kissing to something else
    if (isKissing(lastVerbNorm) && !isKissing(currentVerbNorm)) {
        if (isTouching(currentVerbNorm)) {
            return `You pull back from the kiss and reach out, ${currentVerbNorm} ${posPronoun} ${getLabel(currentAct.id)}`;
        }
        if (isPenetrating(currentVerbNorm) && currentTargetNorm === 'vagina') {
            return `You break from the kiss and position yourself, pressing your ${currentToolNorm} against ${posPronoun} ${getLabel(currentAct.id)}`;
        }
        if (currentTargetNorm === 'anus' || currentTargetNorm === 'butt') {
            return `You pull away from the kiss and guide ${objPronoun} into position, pressing against ${posPronoun} ${getLabel(currentAct.id)}`;
        }
    }
    
    // Case 3: Moving from touching to penetration
    if (isTouching(lastVerbNorm) && isPenetrating(currentVerbNorm)) {
        if (currentTargetNorm === 'vagina' || currentTargetNorm === 'pussy') {
            return `You move from teasing to penetration, pressing your ${currentToolNorm} against ${posPronoun} ${getLabel(currentAct.id)}`;
        }
        if (currentTargetNorm === 'anus' || currentTargetNorm === 'butt') {
            return `You shift your approach, positioning your ${currentToolNorm} at ${posPronoun} ${getLabel(currentAct.id)}`;
        }
        if (isOral(currentTargetNorm)) {
            return `You move your ${currentToolNorm} to ${posPronoun} ${getLabel(currentAct.id)}`;
        }
    }
    
    // Case 4: Moving from one body part to another
    if (lastTargetNorm !== currentTargetNorm && !isPenetrating(currentVerbNorm)) {
        // From face/breast to genital
        if ((isOral(lastTargetNorm) || isBreast(lastTargetNorm)) && (isGenital(currentTargetNorm) || isAnal(currentTargetNorm))) {
            return `You move your attention downward, bringing your ${currentToolNorm} to ${posPronoun} ${getLabel(currentAct.id)}`;
        }
        // From genital to face/breast
        if ((isGenital(lastTargetNorm) || isAnal(lastTargetNorm)) && (isOral(currentTargetNorm) || isBreast(currentTargetNorm))) {
            return `You pull back and move upward, ${currentVerbNorm} ${posPronoun} ${getLabel(currentAct.id)}`;
        }
        // From breast to genital
        if (isBreast(lastTargetNorm) && (isGenital(currentTargetNorm) || isAnal(currentTargetNorm))) {
            return `Your hands slide lower, your ${currentToolNorm} finding ${posPronoun} ${getLabel(currentAct.id)}`;
        }
        // From genital to breast
        if ((isGenital(lastTargetNorm) || isAnal(lastTargetNorm)) && isBreast(currentTargetNorm)) {
            return `You move upward, your ${currentToolNorm} exploring ${posPronoun} ${getLabel(currentAct.id)}`;
        }
    }
    
    // Case 5: Tool change (e.g., fingers to penis)
    if (lastToolNorm !== currentToolNorm && lastToolNorm && currentToolNorm) {
        if ((lastToolNorm === 'finger' || lastToolNorm === 'fingers') && (currentToolNorm === 'penis' || currentToolNorm === 'cock')) {
            return `You withdraw your fingers and position your ${currentToolNorm}, pressing against ${posPronoun} ${getLabel(currentAct.id)}`;
        }
        if ((currentToolNorm === 'finger' || currentToolNorm === 'fingers') && (lastToolNorm === 'penis' || lastToolNorm === 'cock')) {
            return `You pull back and use your fingers instead, ${currentVerbNorm} ${posPronoun} ${getLabel(currentAct.id)}`;
        }
        if (isOral(currentTargetNorm) && (currentToolNorm === 'penis' || currentToolNorm === 'cock')) {
            return `You guide your ${currentToolNorm} to ${posPronoun} ${getLabel(currentAct.id)}`;
        }
    }
    
    // Case 6: Starting penetration
    if (isPenetrating(currentVerbNorm) && !isPenetrating(lastVerbNorm)) {
        if (currentTargetNorm === 'vagina' || currentTargetNorm === 'pussy') {
            return `You position yourself and press your ${currentToolNorm} against ${posPronoun} ${getLabel(currentAct.id)}`;
        }
        if (currentTargetNorm === 'anus' || currentTargetNorm === 'butt') {
            return `You guide ${objPronoun} into position and press your ${currentToolNorm} against ${posPronoun} ${getLabel(currentAct.id)}`;
        }
        if (isOral(currentTargetNorm)) {
            return `You move your ${currentToolNorm} to ${posPronoun} ${getLabel(currentAct.id)}`;
        }
    }
    
    // Case 7: Moving to face/head with cock
    if ((currentTargetNorm === 'face' || currentTargetNorm === 'cheek' || currentTargetNorm === 'lips') && (currentToolNorm === 'penis' || currentToolNorm === 'cock')) {
        return `You pull back and rub your ${currentToolNorm} against ${posPronoun} ${getLabel(currentAct.id)}`;
    }
    
    // Default transition
    if (lastTargetNorm !== currentTargetNorm) {
        return `You move to ${posPronoun} ${getLabel(currentAct.id)}`;
    }
    
    if (lastToolNorm !== currentToolNorm) {
        return `You switch to using your ${currentToolNorm} on ${posPronoun} ${getLabel(currentAct.id)}`;
    }
    
    return "";
}

/**
 * Build multiple narrative options for an action
 */
function buildActionNarratives(npc, actionId, act, context) {
    const { verb, target, tool, playerIsBottom } = act;
    const { arousalLevel = 0, isAroused = false, isWet = false, isErect = false, isOnCooldown = false, intimacy = null, player = null, isContinueAction = false } = context;
    const anatomy = npc.anatomy || {};
    const gender = (npc.gender || "").toLowerCase();
    const isFemale = gender === "female" || gender.includes("female");
    
    const posPronoun = (typeof getPossessivePronoun === 'function' ? getPossessivePronoun(npc) : "their") || "her";
    const subjectPronoun = (typeof getSubjectPronoun === 'function' ? getSubjectPronoun(npc) : "They") || "she";
    // For penetration verbs, use penis as tool unless explicitly using fingers
    let actualTool = tool;
    const verbBase = verb || actionId.split("_")[0] || "touch";
    const isFingerAction = verbBase === 'finger' || actionId.toLowerCase().includes('finger');
    const isPenetrationVerb = ['fuck', 'thrust', 'pound', 'penetrate', 'enter', 'bury', 'slide', 'grind', 'pump', 'bottom out'].includes(verbBase);
    if (isPenetrationVerb && !isFingerAction && context.player) {
        const playerGender = (context.player.gender || "male").toLowerCase();
        if (playerGender === "male" || playerGender.includes("male")) {
            actualTool = "penis";
        } else if (playerGender === "female" || playerGender.includes("female")) {
            actualTool = "strap-on";
        }
    }
    
    const narratives = [];
    
    // Get rich anatomy description
    let anatomyDesc = describeAnatomy(npc, target, { arousalLevel, isAroused, isWet, isErect, possessivePronoun: posPronoun, isOnCooldown }) || target || "";
    
    // For continue actions with anal penetration, replace "closed" descriptors with more appropriate ones
    // Since the anus is already penetrated, it shouldn't be described as "closed" or "shut"
    if (isContinueAction && (target === "anus" || target === "ass")) {
        anatomyDesc = anatomyDesc
            .replace(/firmly closed/i, "tightly clenching")
            .replace(/resistant/i, "clenching")
            .replace(/shyly guarded/i, "gripping")
            .replace(/tense and shut/i, "tight")
            .replace(/tightly squeezed/i, "clenching")
            .replace(/shut/i, "tight");
    }
    
    // Create modified act with corrected tool for penetration actions
    const modifiedAct = isPenetrationVerb && !isFingerAction && actualTool !== tool ? { ...act, tool: actualTool } : act;
    // Verb tense adjustments
    const verbPresent = verbConjugation(verbBase, 'present');
    const verbIng = verbConjugation(verbBase, 'ing');
    
    // For continue actions, modify the verb to indicate continuity
    const continueVerbPresent = isContinueAction ? `continue to ${verbPresent}` : verbPresent;
    
    // Generate narratives based on action type and target
    switch (target.toLowerCase()) {
        case "vagina":
        case "pussy":
        case "clitoris":
        case "clit":
            narratives.push(...buildVaginaNarratives(npc, verbBase, continueVerbPresent, verbIng, anatomyDesc, posPronoun, subjectPronoun, context, modifiedAct));
            break;
            
        case "penis":
        case "cock":
        case "dick":
            narratives.push(...buildPenisNarratives(npc, verbBase, continueVerbPresent, verbIng, anatomyDesc, posPronoun, subjectPronoun, context, modifiedAct));
            break;
            
        case "testicles":
        case "balls":
            narratives.push(...buildTesticlesNarratives(npc, verbBase, continueVerbPresent, verbIng, anatomyDesc, posPronoun, subjectPronoun, context, modifiedAct));
            break;
            
        case "breasts":
        case "nipples":
            narratives.push(...buildBreastNarratives(npc, verbBase, continueVerbPresent, verbIng, anatomyDesc, posPronoun, subjectPronoun, context, modifiedAct));
            break;
            
        case "anus":
            narratives.push(...buildAnusNarratives(npc, verbBase, continueVerbPresent, verbIng, anatomyDesc, posPronoun, subjectPronoun, context, modifiedAct));
            break;
            
        case "butt":
        case "buttocks":
        case "ass":
            narratives.push(...buildButtockNarratives(npc, verbBase, continueVerbPresent, verbIng, anatomyDesc, posPronoun, subjectPronoun, context, modifiedAct));
            break;
            
        case "mouth":
        case "lips":
            narratives.push(...buildMouthNarratives(npc, verbBase, continueVerbPresent, verbIng, anatomyDesc, posPronoun, subjectPronoun, context, modifiedAct));
            break;
            
        case "thighs":
        case "thigh":
            narratives.push(...buildThighNarratives(npc, verbBase, continueVerbPresent, verbIng, anatomyDesc, posPronoun, subjectPronoun, context, modifiedAct));
            break;
            
        default:
            // Generic narrative for other targets
            const genericTool = tool || "hand";
            const genericToolVerb = getVerbForTool(verbBase, genericTool);
            
            // Helper function to ensure possessive pronoun is added to anatomy description
            const ensurePossessive = (desc) => {
                if (!desc) return posPronoun || "her";
                const trimmedDesc = String(desc).trim();
                const trimmedPronoun = posPronoun ? posPronoun.trim() : "her";
                // Check if description already starts with possessive pronoun
                if (trimmedPronoun && (trimmedDesc.startsWith(trimmedPronoun + ' ') || trimmedDesc === trimmedPronoun)) {
                    return trimmedDesc;
                }
                // Remove leading articles if present
                const withoutArticle = trimmedDesc.replace(/^(a |an |the )/i, '').trim();
                return trimmedPronoun ? `${trimmedPronoun} ${withoutArticle}` : withoutArticle;
            };
            
            // Handle ejaculation on body parts
            if (verbBase === 'ejaculate' || verbBase === 'ejaculate on') {
                // For external ejaculation, use "on" preposition
                // Ensure possessive pronoun is included in anatomy description
                const fullTarget = ensurePossessive(anatomyDesc);
                
                // Get penis state descriptor based on cooldown
                const penisState = isOnCooldown ? pickRandom(['limp', 'flaccid', 'soft', 'spent']) : pickRandom(['hard', 'rigid', 'throbbing', 'engorged']);
                
                narratives.push(
                    `You ejaculate on ${fullTarget}, coating it with your hot cum.`,
                    `You release on ${fullTarget}, your thick seed splattering across the surface.`,
                    `Your ${penisState} penis ejaculates on ${fullTarget}, jets of cum landing on the warm skin.`,
                    `You climax on ${fullTarget}, your cum painting it with sticky warmth.`
                );
            } else {
                // For generic body parts (face, neck, cheek, etc.), ensure possessive pronoun is included
                const fullAnatomyDesc = ensurePossessive(anatomyDesc);
                narratives.push(
                    `You ${continueVerbPresent} ${fullAnatomyDesc}.`,
                    `Your ${genericTool} ${genericToolVerb} ${fullAnatomyDesc}.`,
                    `You reach out and ${continueVerbPresent} ${fullAnatomyDesc}.`
                );
            }
    }
    
    return narratives;
}

/**
 * Get the correct verb form based on tool (singular vs plural)
 * @param {string} verb - The base verb
 * @param {string} tool - The tool being used
 * @returns {string} - The properly conjugated verb
 */
function getVerbForTool(verb, tool) {
    // Special case: "finger" verb with fingers tool sounds awkward
    // Use "enter" or keep as is based on context
    if (verb === 'finger' && tool === 'fingers') {
        return verbConjugation('enter', 'present'); // "enter" for plural fingers
    }
    
    // Plural tools use base verb form
    const pluralTools = new Set(['fingers', 'hands', 'palms', 'testicles', 'balls', 'lips']);
    
    if (pluralTools.has(tool)) {
        return verbConjugation(verb, 'present'); // Base form for plural
    } else {
        return verbConjugation(verb, 'third'); // Third person singular for singular tools
    }
}

/**
 * Conjugate verbs for narrative
 */
function verbConjugation(verb, form) {
    if (!verb) return form === 'ing' ? 'doing' : form === 'present' ? 'do' : 'does';
    const irregulars = {
        touch: { present: "touch", ing: "touching", third: "touches" },
        kiss: { present: "kiss", ing: "kissing", third: "kisses" },
        lick: { present: "lick", ing: "licking", third: "licks" },
        suck: { present: "suck", ing: "sucking", third: "sucks" },
        stroke: { present: "stroke", ing: "stroking", third: "strokes" },
        rub: { present: "rub", ing: "rubbing", third: "rubs" },
        squeeze: { present: "squeeze", ing: "squeezing", third: "squeezes" },
        tease: { present: "tease", ing: "teasing", third: "teases" },
        grope: { present: "grope", ing: "groping", third: "gropes" },
        finger: { present: "finger", ing: "fingering", third: "fingers" },
        fuck: { present: "fuck", ing: "fucking", third: "fucks" },
        thrust: { present: "thrust", ing: "thrusting", third: "thrusts" },
        enter: { present: "enter", ing: "entering", third: "enters" },
        penetrate: { present: "penetrate", ing: "penetrating", third: "penetrates" },
        caress: { present: "caress", ing: "caressing", third: "caresses" },
        massage: { present: "massage", ing: "massaging", third: "massages" },
        pinch: { present: "pinch", ing: "pinching", third: "pinches" },
        spread: { present: "spread", ing: "spreading", third: "spreads" },
        press: { present: "press", ing: "pressing", third: "presses" },
        grind: { present: "grind", ing: "grinding", third: "grinds" },
        bite: { present: "bite", ing: "biting", third: "bites" },
        nibble: { present: "nibble", ing: "nibbling", third: "nibbles" },
        flick: { present: "flick", ing: "flicking", third: "flicks" },
        slap: { present: "slap", ing: "slapping", third: "slaps" },
        rim: { present: "rim", ing: "rimming", third: "rims" },
        circle: { present: "circle", ing: "circling", third: "circles" }
    };
    
    const conjugated = irregulars[verb.toLowerCase()];
    if (conjugated && conjugated[form]) {
        return conjugated[form];
    }
    
    // Default conjugation
    if (form === 'ing') {
        if (verb.endsWith('e')) return verb.slice(0, -1) + 'ing';
        if (verb.endsWith('ie')) return verb.slice(0, -2) + 'ying';
        if (verb.match(/[^aeiou]e$/)) return verb + 'ing';
        return verb + 'ing';
    }
    if (form === 'third') {
        // Third person singular: add 's' or 'es' as appropriate
        if (verb.endsWith('s') || verb.endsWith('sh') || verb.endsWith('ch') || verb.endsWith('x') || verb.endsWith('z') || verb.endsWith('o')) {
            return verb + 'es';
        }
        if (verb.endsWith('y') && !['a', 'e', 'i', 'o', 'u'].includes(verb.charAt(verb.length - 2))) {
            return verb.slice(0, -1) + 'ies';
        }
        return verb + 's';
    }
    return verb;
}

/**
 * Build vagina/pussy action narratives
 */
function buildVaginaNarratives(npc, verbBase, verbPresent, verbIng, anatomyDesc, posPronoun, subjectPronoun, context, act = {}) {
    const { arousalLevel = 0, player = null, isOnCooldown = false, isContinueAction = false } = context;
    const { tool = null } = act;
    const highArousal = arousalLevel > 70;
    const mediumArousal = arousalLevel > 40;
    
    // Get player gender for tool-specific narratives
    const playerGender = player ? (player.gender || "").toLowerCase() : "male";
    const playerHasPenis = player && player.anatomy && (player.anatomy.penis || player.anatomy.cock);
    const playerHasVagina = player && player.anatomy && (player.anatomy.vagina || player.anatomy.pussy);
    
    // Get skin tone for occasional references
    const skinDesc = npc ? getSkinDescription(npc) : "";
    const includeSkin = skinDesc && Math.random() < 0.3; // 30% chance to mention skin
    
    // Get scent descriptor (handled by getScentDescriptor function)
    const scentDesc = getScentDescriptor(npc, 'vagina', false);
    
    // Check if vagina is well-used for lewd sound descriptors
    const vaginaAnatomy = (npc.anatomy && npc.anatomy.vagina) || {};
    const vaginaSize = vaginaAnatomy.size || "snug";
    const isVaginaOpen = vaginaSize === "loose" || vaginaSize === "gaping" || vaginaSize === "stretchy";
    
    // Check for lube/cum to make sounds more likely
    const intimacy = context.intimacy || {};
    const hasLube = intimacy.lube && intimacy.lube.vagina && intimacy.lube.vagina.hasLube;
    const hasInternalEjaculation = intimacy.climax && intimacy.climax.hasInternalEjaculation && intimacy.climax.lastInternalEjaculation === "vagina";
    const isSlick = hasLube || hasInternalEjaculation;
    
    // Lewd sound descriptor for well-used, slick vaginas during intercourse
    const getVaginalSound = () => {
        if (!isVaginaOpen || !isSlick) return "";
        return pickRandom([
            " with wet squelching sounds",
            " the slick sloshing filling the air",
            " the messy, wet sounds echoing between you",
            " with obscene squelching noises"
        ]);
    };
    
    // Helper to extract just the vagina part (without pubic hair prefix)
    // This handles various formats from describeVagina:
    // - "through a wild tangle of jet black pubic hair to her glistening plump vagina" → "her glistening plump vagina"
    // - "a wild tangle of jet black pubic hair, parting to reveal her glistening plump vagina" → "her glistening plump vagina"
    // - "her glistening plump vagina, framed by a wild tangle of jet black pubic hair" → "her glistening plump vagina"
    // - "the plump labia of her vagina" → "the plump labia of her vagina"
    const getVaginaOnlyDesc = () => {
        // Try to extract what comes after "reveal" (for "X, parting to reveal Y" format)
        // Check this first because "to reveal" could match the /to/ pattern
        const revealMatch = anatomyDesc.match(/reveal\s+([^,.]+)/i);
        if (revealMatch) return revealMatch[1];
        
        // Try to extract what comes before "framed by" (for "X, framed by Y" format)
        const framedMatch = anatomyDesc.match(/^([^,]+),\s*framed by/i);
        if (framedMatch) return framedMatch[1];
        
        // Try to extract what comes after "to" (for "through X to Y" format)
        // Only match if "to" is not followed by "reveal"
        const toMatch = anatomyDesc.match(/to\s+([^,]+)/i);
        if (toMatch && !anatomyDesc.includes('reveal')) return toMatch[1];
        
        // If it starts with possessive pronoun, use as is
        if (anatomyDesc.startsWith(posPronoun)) return anatomyDesc;
        
        // Otherwise use the full description
        return anatomyDesc;
    };
    
    // Get clean anatomy description (removes pubic hair prefix for general use)
    const cleanAnatomyDesc = getVaginaOnlyDesc();
    
    // Get penis state descriptor based on cooldown
    const penisState = isOnCooldown ? pickRandom(['limp', 'flaccid', 'soft', 'spent']) : pickRandom(['hard', 'rigid', 'throbbing', 'engorged']);
    const cockState = isOnCooldown ? pickRandom(['limp', 'flaccid', 'soft', 'spent']) : pickRandom(['hard', 'rigid', 'throbbing', 'engorged']);
    const shaftState = isOnCooldown ? pickRandom(['soft', 'limp', 'flaccid']) : pickRandom(['hard', 'rigid', 'throbbing']);
    
    const narratives = [];
    const pubicDesc = getPubicDescription(npc);
    
    // Gentle touching - occasionally include skin tone
    // Use actual tool from act, or default to fingers for backward compatibility
    const actualTool = tool || 'fingers';
    const toolVerb = getVerbForTool(verbBase, actualTool);
    
    // For penetration verbs, use "into" preposition and specify tool
    const penetrationVerbs = ['fuck', 'thrust', 'pound', 'penetrate', 'enter', 'bury', 'slide', 'grind', 'pump', 'bottom out'];
    const isPenetrationVerb = penetrationVerbs.includes(verbBase);
    
    narratives.push(
        // For penetration, use "with your [tool]" pattern for clarity
        isPenetrationVerb && actualTool ? `You ${verbPresent} ${cleanAnatomyDesc} with your ${actualTool}.` : `You ${verbPresent} ${cleanAnatomyDesc}.`,
        // Also include the "Your [tool] [verb] into..." variant
        isPenetrationVerb && actualTool ? `Your ${actualTool} ${toolVerb} into ${cleanAnatomyDesc}.` : `Your ${actualTool} ${toolVerb} ${cleanAnatomyDesc}.`
    );
    
    // Spreading/parting - improved to avoid awkward phrasing
    // When parting labia, include skin tone and interior color for richness
    const interiorColor = npc ? getVaginalInteriorColor(npc) : "";
    const skinPhrase = includeSkin ? `${skinDesc} ` : "";
    
    if (verbBase === 'part' || verbBase === 'spread') {
        narratives.push(
            `You part ${posPronoun} ${pubicDesc} and ${verbPresent} ${cleanAnatomyDesc}.`,
            `You part ${posPronoun} ${pubicDesc}, ${verbPresent} ${cleanAnatomyDesc}.`,
            // Enhanced with skin tone
            `You part ${posPronoun} ${skinPhrase}${pubicDesc}, revealing the ${interiorColor} folds within.`,
            `Spreading ${posPronoun} legs, you part ${posPronoun} ${skinPhrase}${pubicDesc} to expose ${interiorColor} labia.`
        );
    } else {
        narratives.push(
            `You part ${posPronoun} ${pubicDesc} and ${verbPresent} ${cleanAnatomyDesc}.`,
            `You part ${posPronoun} ${pubicDesc}, ${verbPresent} ${cleanAnatomyDesc}.`
        );
    }
    
    // Licking specific
    if (verbBase === 'lick') {
        narratives.push(
            `Your tongue ${verbIng} ${cleanAnatomyDesc}, tasting ${posPronoun} ${highArousal ? 'sweet nectar' : 'warm essence'}.`,
            `You trace your tongue along ${cleanAnatomyDesc}, savoring every ${highArousal ? 'dripping' : 'moist'} inch.`
        );
    }
    
    // Finger penetration
    if (verbBase === 'finger' || verbBase === 'penetrate') {
        narratives.push(
            `You ${verbPresent} ${posPronoun} ${cleanAnatomyDesc}, sliding deep into ${posPronoun} ${highArousal ? 'slick, welcoming' : 'warm, tight'} channel.`
        );
    }
    
    // Teasing
    if (verbBase === 'tease') {
        narratives.push(
            `You ${verbPresent} ${cleanAnatomyDesc}, drawing ${highArousal ? 'soft moans' : 'gentle gasps'} from ${posPronoun} lips.`
        );
    }
    
    // Rubbing
    if (verbBase === 'rub') {
        narratives.push(
            `You ${verbPresent} ${cleanAnatomyDesc}, creating delicious friction against ${posPronoun} ${highArousal ? 'soaked' : 'dampening'} folds.`
        );
    }
    
    // Penetration/enter - explicit initial insertion descriptions
    if (verbBase === 'enter' || verbBase === 'penetrate') {
        narratives.push(
            `You ${verbPresent} ${cleanAnatomyDesc}, your ${cockState} cock sinking into ${posPronoun} ${highArousal ? 'slick, clenching channel as the warm folds envelop your shaft' : 'tight passage, the resistance giving way to your persistence'}${getVaginalSound()}${scentDesc ? ', ' + scentDesc : ''}.`
        );
    }
    
    // Intercourse actions - already inside, describe the feeling
    if (verbBase === 'fuck' || verbBase === 'thrust' || verbBase === 'pound' || verbBase === 'grind' || verbBase === 'slide') {
        narratives.push(
            `You ${verbPresent} ${cleanAnatomyDesc}, ${posPronoun} slick channel ${highArousal ? 'clenching your shaft desperately' : 'gripping your shaft tightly'}${getVaginalSound()}${scentDesc ? ', ' + scentDesc : ''}.`
        );
    }
    
    // Press verb - gender and tool aware
    if (verbBase === 'press') {
        if (tool === 'penis' || tool === 'cock') {
            // Player pressing their penis/cock against the NPC's vagina
            const cockPart = pickRandom(['cockhead', 'cock', 'shaft', 'tip']);
            narratives.push(
                `You press your ${cockState} ${cockPart} against ${cleanAnatomyDesc}.`,
                `You press your ${cockState} ${cockPart} to ${cleanAnatomyDesc}, feeling the ${highArousal ? 'hot, wet' : 'warm, welcoming'} flesh.`,
                `Positioning yourself, you press your ${cockState} ${cockPart} against ${cleanAnatomyDesc}.`,
                `You guide your ${cockState} ${cockPart} to ${cleanAnatomyDesc}, both of you ${highArousal ? 'aching with need' : 'eager for more'}.`
            );
        } else {
            // Hand/fingers pressing
            const handPart = pickRandom(['fingers', 'hand', 'palm', 'touch']);
            if (handPart === 'touch') {
                narratives.push(`You press your ${handPart} to ${cleanAnatomyDesc}.`);
            } else {
                narratives.push(
                    `You press your ${handPart} against ${cleanAnatomyDesc}.`,
                    `You press your ${handPart} to ${cleanAnatomyDesc}, feeling the ${highArousal ? 'dripping wet' : 'warm'} heat.`,
                    `You apply gentle pressure with your ${handPart} to ${cleanAnatomyDesc}.`
                );
            }
        }
    }
    
    // Check if this is ejaculation - needs special handling with prepositions
    const isEjaculation = verbBase === 'ejaculate' || verbBase === 'ejaculate on';
    
    // For ejaculation, use proper prepositions and enhanced descriptors
    if (isEjaculation) {
        // Get player gender for tool-specific narratives
        const playerGender = player ? (player.gender || "").toLowerCase() : "male";
        const playerHasPenis = player && player.anatomy && (player.anatomy.penis || player.anatomy.cock);
        
        // Check if there has been internal ejaculation before (for semen drip narratives)
        const intimacy = context.intimacy || {};
        const hasInternalEjaculation = intimacy.climax && intimacy.climax.hasInternalEjaculation;
        const lastEjaculationTarget = intimacy.climax ? intimacy.climax.lastInternalEjaculation : null;
        const isMultipleEjaculation = lastEjaculationTarget === "vagina";
        
        // For multiple ejaculations, always include sloshing/sound descriptors
        const sloshingSound = isMultipleEjaculation ? pickRandom([
            'with wet squelching sounds',
            'the slick sloshing filling the air',
            'lewd noises escaping with each movement',
            'the messy, wet sounds of your release'
        ]) : '';
        
        // Check vagina state - if it's been well-used, describe it as such
        const vaginaAnatomy = (npc.anatomy && npc.anatomy.vagina) || {};
        const vaginaSize = vaginaAnatomy.size || "snug";
        const isVaginaOpen = vaginaSize === "loose" || vaginaSize === "gaping" || vaginaSize === "stretchy";
        
        // Adjust channel description based on state
        const channelDesc = isVaginaOpen ? pickRandom(['well-used channel', 'stretched passage', 'yielding sheath', 'soaked depths']) : pickRandom(['tight channel', 'clenching sheath', 'snug passage', 'gripping depths']);
        
        narratives.push(
            `You ejaculate into ${cleanAnatomyDesc}, filling ${posPronoun} ${channelDesc} with ${isMultipleEjaculation ? 'another thick deposit, mixing with the slick pool already there' : 'your hot cum, the warm fluid spreading deep within'} ${isMultipleEjaculation ? sloshingSound : ''}${scentDesc ? ', ' + scentDesc : ''}.`,
            `You release deep inside ${cleanAnatomyDesc}, ${isMultipleEjaculation ? 'adding more to the growing pool of semen' : 'pumping your seed into '}${posPronoun} warm, welcoming ${channelDesc} with a wet sound${scentDesc ? ', ' + scentDesc : ''}.`,
            `You climax inside ${cleanAnatomyDesc}, your ejaculation ${isMultipleEjaculation ? 'joining the previous load with a lewd squelch, her depths struggling to contain it all' : 'filling '}${posPronoun} ${channelDesc}, the slick walls clenching around your release${scentDesc ? ', ' + scentDesc : ''}.`,
            `Your ${penisState} penis ejaculates into ${cleanAnatomyDesc}, ${isMultipleEjaculation ? 'more semen joining the existing pool, dripping out around your shaft with each pulse' : 'thick spurts of cum coating '}${posPronoun} inner walls as they clench greedily${scentDesc ? ', ' + scentDesc : ''}.`,
            `You fill ${cleanAnatomyDesc} with your seed, ${isVaginaOpen ? 'the relaxed folds accepting' : 'the slick folds greedily drawing in'} your ${isMultipleEjaculation ? 'additional' : 'hot'} release, the warmth spreading through her core${scentDesc ? ', ' + scentDesc : ''}.`,
            `Your ${cockState} cock pulses into ${cleanAnatomyDesc}, ${isMultipleEjaculation ? 'another load of cum adding to the mess, some squirting out with each thrust' : 'hot jets of semen flooding '}${posPronoun} ${channelDesc}${scentDesc ? ', ' + scentDesc : ''}.`
        );
    }
    
    return narratives.filter(Boolean);
}

/**
 * Build penis/cock action narratives
 */
function buildPenisNarratives(npc, verbBase, verbPresent, verbIng, anatomyDesc, posPronoun, subjectPronoun, context, act = {}) {
    const { arousalLevel = 0, intimacy = null, isContinueAction = false } = context;
    const highArousal = arousalLevel > 70;
    const actualTool = act.tool || pickRandom(['hand', 'fingers', 'palm']);
    const toolVerb = getVerbForTool(verbBase, actualTool);
    
    // Check if NPC is male and on cooldown
    const npcGender = (npc.gender || "").toLowerCase();
    const isNPConCooldown = (npcGender === "male" || npcGender.includes("male")) && intimacy && intimacy.climax && intimacy.climax.npcCooldownUntil && Date.now() < intimacy.climax.npcCooldownUntil;
    
    return [
        `You ${verbPresent} ${anatomyDesc}.`,
        `Your ${actualTool} ${toolVerb} ${anatomyDesc}.`,
        verbBase === 'stroke' ? `You ${verbPresent} the length of ${anatomyDesc}, feeling the ${highArousal ? 'pulsing heat' : 'warm weight'} in your palm.` : null,
        verbBase === 'suck' || verbBase === 'lick' ? `Your ${actualTool === 'mouth' ? 'mouth' : 'tongue'} ${verbIng} ${anatomyDesc}, ${highArousal ? 'taking the full length' : 'exploring the shaft'}.` : null,
        verbBase === 'squeeze' ? `You ${verbPresent} ${anatomyDesc}, massaging the ${highArousal ? 'throbbing' : 'firm'} shaft.` : null,
        `You ${verbPresent} ${anatomyDesc}, ${highArousal ? 'feeling the throbbing heat' : 'savoring the firm weight'}.`
    ].filter(Boolean);
}

/**
 * Build testicles action narratives
 */
function buildTesticlesNarratives(npc, verbBase, verbPresent, verbIng, anatomyDesc, posPronoun, subjectPronoun, context, act = {}) {
    const { arousalLevel = 0, isContinueAction = false } = context;
    const highArousal = arousalLevel > 70;
    const actualTool = act.tool || 'fingers';
    const toolVerb = getVerbForTool(verbBase, actualTool);
    
    return [
        `You ${verbPresent} ${anatomyDesc}.`,
        `Your ${actualTool} ${toolVerb} ${anatomyDesc}.`,
        verbBase === 'squeeze' ? `You gently ${verbPresent} ${anatomyDesc}, feeling ${posPronoun} ${highArousal ? 'tight draw' : 'warm weight'}.` : null,
        verbBase === 'cupp' || verbBase === 'cup' ? `You cup ${anatomyDesc} in your palm, massaging the heavy orbs.` : null,
        verbBase === 'fondle' ? `You fondle ${anatomyDesc}, rolling them gently in your ${pickRandom(['hand', 'palm', 'fingers'])}.` : null,
        `You ${verbPresent} ${anatomyDesc}, ${highArousal ? 'feeling them shift in your hand' : 'enjoying the texture'}.`
    ].filter(Boolean);
}

/**
 * Build breast/nipple action narratives
 */
function buildBreastNarratives(npc, verbBase, verbPresent, verbIng, anatomyDesc, posPronoun, subjectPronoun, context, act = {}) {
    const { arousalLevel = 0, isContinueAction = false } = context;
    const highArousal = arousalLevel > 70;
    const actualTool = act.tool || pickRandom(['hands', 'palms', 'fingers']);
    const toolVerb = getVerbForTool(verbBase, actualTool);
    
    return [
        `You ${verbPresent} ${anatomyDesc}.`,
        `Your ${actualTool} ${toolVerb} ${anatomyDesc}.`,
        verbBase === 'squeeze' ? `You ${verbPresent} ${anatomyDesc}, feeling the ${highArousal ? 'firm, needy' : 'soft, warm'} flesh yield under your touch.` : null,
        verbBase === 'kiss' || verbBase === 'lick' ? `Your ${actualTool === 'lips' ? 'lips' : 'tongue'} ${verbIng} ${anatomyDesc}, ${highArousal ? 'tracing the soft curves' : 'exploring the warm surface'}` : null,
        verbBase === 'pinch' || verbBase === 'flick' ? `You ${verbPresent} ${anatomyDesc}, ${highArousal ? 'teasing the sensitive peaks' : 'playing with the firm nubs'}` : null,
        verbBase === 'tease' ? `You ${verbPresent} ${anatomyDesc}, circling but never quite touching the ${highArousal ? 'hard, aching' : 'perky'} tips.` : null,
        `You ${verbPresent} ${anatomyDesc}, ${highArousal ? 'feeling the warm flesh giving way' : 'enjoying the soft texture'}.`
    ].filter(Boolean);
}

/**
 * Build anus action narratives
 */
function buildAnusNarratives(npc, verbBase, verbPresent, verbIng, anatomyDesc, posPronoun, subjectPronoun, context, act = {}) {
    const { arousalLevel = 0, player = null, isOnCooldown = false, isContinueAction = false } = context;
    const highArousal = arousalLevel > 70;
    const verbThird = verbConjugation(verbBase, 'third');
    
    // Get scent descriptor for anal acts (handled by getScentDescriptor function)
    const scentDesc = getScentDescriptor(npc, 'anus', true);

    // Check if anal entry should be easy (based on prior use or size advantage)
    const analEasy = isAnalEntryEasy(npc, player);
    
    // Check if anus is well-used for lewd sound descriptors
    const intimacy = context.intimacy || {};
    const anusAnatomy = (npc.anatomy && npc.anatomy.anus) || {};
    const anusSize = anusAnatomy.size || "snug";
    const isAnusOpen = anusSize === "loose" || anusSize === "gaping" || anusSize === "stretchy";
    const hasLube = intimacy.lube && intimacy.lube.anus && intimacy.lube.anus.hasLube;
    const hasInternalEjaculation = intimacy.climax && intimacy.climax.hasInternalEjaculation && intimacy.climax.lastInternalEjaculation === "anus";
    const isSlick = hasLube || hasInternalEjaculation;
    
    // Lewd sound descriptor for well-used, slick anus during intercourse
    const getAnalSound = () => {
        if (!isAnusOpen || !isSlick) return "";
        return pickRandom([
            " with wet squelching sounds",
            " the cavity sloshing obscenely with each movement",
            " lewd squelching noises escaping from within",
            " with messy, slick sounds filling the air",
            " the wet sloshing echoing with each thrust"
        ]);
    };
    
    // Get the actual tool from the act, default to hand for backward compatibility
    const actualTool = act.tool || "hand";
    const toolVerb = getVerbForTool(verbBase, actualTool);
    
    // Check if this is ejaculation - needs special handling with prepositions
    const isEjaculation = verbBase === 'ejaculate' || verbBase === 'ejaculate on';
    
    // For ejaculation, use proper prepositions and enhanced descriptors
    if (isEjaculation) {
        // Get player gender for tool-specific narratives
        const playerGender = player ? (player.gender || "").toLowerCase() : "male";
        const playerHasPenis = player && player.anatomy && (player.anatomy.penis || player.anatomy.cock);
        
        // Get penis state descriptor based on cooldown
        const penisState = isOnCooldown ? pickRandom(['limp', 'flaccid', 'soft', 'spent']) : pickRandom(['hard', 'rigid', 'throbbing', 'engorged']);
        
        // Check if there has been internal ejaculation before (for semen drip narratives)
        const intimacy = context.intimacy || {};
        const hasInternalEjaculation = intimacy.climax && intimacy.climax.hasInternalEjaculation;
        const lastEjaculationTarget = intimacy.climax ? intimacy.climax.lastInternalEjaculation : null;
        const isMultipleEjaculation = lastEjaculationTarget === "anus";
        
        // Check anus state - if it's been stretched open, it's no longer "closed"
        const anusAnatomy = (npc.anatomy && npc.anatomy.anus) || {};
        const anusSize = anusAnatomy.size || "snug";
        const isAnusOpen = anusSize === "loose" || anusSize === "gaping" || anusSize === "stretchy";
        
        // For multiple ejaculations, always include sloshing/sound descriptors
        const sloshingSound = isMultipleEjaculation ? pickRandom([
            'with obscene squelching sounds',
            'the cavity sloshing wetly with each movement',
            'lewd sloshing noises escaping from within',
            'the slick, wet sounds filling the air'
        ]) : '';
        
        // Adjust cavity description based on whether it's been opened
        const cavityDesc = isAnusOpen ? pickRandom(['well-used passage', 'stretched channel', 'yielding cavity', 'open bowels']) : pickRandom(['tight channel', 'clenching cavity', 'resistant passage', 'tight bowels']);
        
        return [
            `You ejaculate into ${anatomyDesc}, filling ${posPronoun} ${cavityDesc} with ${isMultipleEjaculation ? 'another thick deposit, the cavity already swollen and heavy with semen' : 'your hot seed, the viscous fluid filling the unseen depths'} ${isMultipleEjaculation ? sloshingSound : ''}${scentDesc ? ', ' + scentDesc : ''}.`,
            `You release into ${anatomyDesc}, ${isMultipleEjaculation ? 'adding to the growing pool of semen already sloshing in ' : 'pumping your thick cum into '}${posPronoun} ${cavityDesc} with a wet squelch${scentDesc ? ', ' + scentDesc : ''}.`,
            `You climax inside ${anatomyDesc}, your ejaculation ${isMultipleEjaculation ? 'joining the previous deposits with a lewd gurgle, her bowels struggling to contain the growing volume' : 'filling '}${posPronoun} ${cavityDesc}, the slick sounds of release echoing from within${scentDesc ? ', ' + scentDesc : ''}.`,
            `Your ${penisState} penis ejaculates into ${anatomyDesc}, ${isMultipleEjaculation ? 'more semen forcing its way into the already-full cavity, a wet squelch escaping with each pulse' : 'releasing deep into '}${posPronoun} hot, clenching ${cavityDesc}${scentDesc ? ', ' + scentDesc : ''}.`,
            `You fill ${anatomyDesc} with your seed, ${isAnusOpen ? 'the relaxed ring accepting' : 'the tight ring milking'} your ${isMultipleEjaculation ? 'remaining' : 'thick'} cum into ${posPronoun} depths as the cavity makes wet, obscene sounds${scentDesc ? ', ' + scentDesc : ''}.`,
            `Your ${penisState} cock pumps into ${anatomyDesc}, ${isMultipleEjaculation ? 'another load of semen adding to the slick, sloshing mess inside, her bowels gurgling with the overflow' : 'hot spurt after spurt coating '}${posPronoun} ${cavityDesc} with glistening warmth${scentDesc ? ', ' + scentDesc : ''}.`
        ];
    }
    
    // Get penis state descriptor based on cooldown
    const penisState = isOnCooldown ? pickRandom(['limp', 'flaccid', 'soft', 'spent']) : pickRandom(['hard', 'rigid', 'throbbing', 'engorged']);
    const cockState = isOnCooldown ? pickRandom(['limp', 'flaccid', 'soft', 'spent']) : pickRandom(['hard', 'rigid', 'throbbing', 'engorged']);
    const shaftState = isOnCooldown ? pickRandom(['soft', 'limp', 'flaccid']) : pickRandom(['hard', 'rigid', 'throbbing']);
    
    // Determine preposition based on verb
    const getPreposition = () => {
        if (['fuck', 'thrust', 'pound', 'penetrate', 'enter', 'bury', 'slide', 'grind'].includes(verbBase)) {
            return 'into';
        }
        if (['press', 'rub', 'stroke', 'tease', 'kiss', 'lick', 'suck', 'rim', 'circle', 'spread'].includes(verbBase)) {
            return actualTool === 'mouth' || actualTool === 'tongue' ? 'on' : 'against';
        }
        return '';
    };
    
    const preposition = getPreposition();
    const prepositionText = preposition ? ` ${preposition} ` : ' ';

    return [
        `You ${verbPresent}${prepositionText}${anatomyDesc}.`,
        `Your ${actualTool} ${toolVerb}${prepositionText}${anatomyDesc}.`,
        // Penetration/fingering - sphincters are normally tight and resistant
        // For penis/cock tool, explicitly mention the anatomy for clarity
        verbBase === 'penetrate' || verbBase === 'finger' || verbBase === 'enter' ? 
            actualTool === 'penis' || actualTool === 'cock' ?
                `You press your cockhead against ${anatomyDesc}${scentDesc ? ', ' + scentDesc : ''}, ${analEasy ? 'sliding your length into the well-lubricated passage' + getAnalSound() : highArousal ? `your ${cockState} cock breaching the reluctant sphincter as it stretches around your ${shaftState} shaft` + getAnalSound() : 'gently pressing past the tight entrance, the resistance giving way to your persistence' + getAnalSound()}.` :
                `You ${verbPresent} ${anatomyDesc}${scentDesc ? ', ' + scentDesc : ''}, ${analEasy ? 'sliding your length into the well-lubricated passage' + getAnalSound() : highArousal ? 'your finger breaching the reluctant sphincter as it stretches around your digit' + getAnalSound() : 'gently pressing past the tight entrance, the resistance giving way to your persistence' + getAnalSound()}.` : null,
        verbBase === 'tease' || verbBase === 'circle' ? 
            `You ${verbPresent} ${anatomyDesc}, tracing the ${highArousal ? 'slightly yielding' : 'tight, wrinkled'} rim${scentDesc ? ', ' + scentDesc : ''}.` : null,
        verbBase === 'spread' ? 
            `You ${verbPresent} ${anatomyDesc}, exposing the ${highArousal ? 'glistening' : 'tightly closed'} entrance${scentDesc ? ', ' + scentDesc : ''}.` : null,
        verbBase === 'lick' ? 
            `Your tongue ${verbPresent} ${anatomyDesc}, ${highArousal ? 'preparing the way' : 'tracing the sensitive, wrinkled flesh'}.` : null,
        // Intercourse actions - already inside, describe the feeling
        verbBase === 'fuck' || verbBase === 'thrust' || verbBase === 'pound' || verbBase === 'grind' || verbBase === 'slide' ?
            `You ${verbPresent} into ${anatomyDesc}, ${posPronoun} passage ${highArousal ? 'clenching your shaft like a vice' : 'gripping your shaft tightly'}${getAnalSound()}${scentDesc ? ', ' + scentDesc : ''}.` : null,
        verbBase === 'ejaculate' || verbBase === 'ejaculate on' ?
            `You ${verbPresent} into ${anatomyDesc}, ${posPronoun} bowels ${highArousal ? 'milking your release with desperate pulses' : 'accepting your seed deeply'}${scentDesc ? ', ' + scentDesc : ''}.` : null,
        // Generic fallback for other verbs
        (verbBase !== 'penetrate' && verbBase !== 'finger' && verbBase !== 'tease' && verbBase !== 'circle' && verbBase !== 'spread' && verbBase !== 'lick' && verbBase !== 'fuck' && verbBase !== 'thrust' && verbBase !== 'pound' && verbBase !== 'grind' && verbBase !== 'slide' && verbBase !== 'ejaculate' && verbBase !== 'ejaculate on') ?
            `You ${verbPresent} ${anatomyDesc}, ${highArousal ? 'feeling the hot flesh stretching around you' : 'feeling the tight, wrinkled flesh'}.` : null
    ].filter(Boolean);
}

/**
 * Build buttocks action narratives
 * For actions like spread, squeeze, grope, slap targeting buttocks/cheeks/ass
 */
function buildButtockNarratives(npc, verbBase, verbPresent, verbIng, anatomyDesc, posPronoun, subjectPronoun, context, act = {}) {
    const { arousalLevel = 0, isOnCooldown = false, isContinueAction = false } = context;
    const highArousal = arousalLevel > 70;
    
    // Get penis state descriptor based on cooldown
    const shaftState = isOnCooldown ? pickRandom(['soft', 'limp', 'flaccid']) : pickRandom(['hard', 'rigid', 'throbbing']);
    const actualTool = act.tool || pickRandom(['hand', 'hands', 'palm', 'palms', 'fingers']);
    const toolVerb = getVerbForTool(verbBase, actualTool);
    
    // Get additional descriptions for spread actions
    const skinDesc = npc ? getSkinDescription(npc) : "";
    const includeSkin = skinDesc && Math.random() < 0.3;
    const anusDesc = npc ? describeAnatomy(npc, 'anus', {}) : "tight entrance";
    const analInterior = npc ? getAnalInteriorColor(npc) : "";
    const pubicDesc = npc ? getPubicDescription(npc) : "";
    
    return [
        // Generic
        `You ${verbPresent} ${anatomyDesc}.`,
        `Your ${actualTool} ${toolVerb} ${anatomyDesc}.`,
        
        // Spread - enhanced with anus and hair visibility
        verbBase === 'spread' ? `You ${verbPresent} ${anatomyDesc}, revealing the ${highArousal ? 'glistening' : 'tight'} cleft between ${posPronoun} cheeks.` : null,
        verbBase === 'spread' ? `You part ${anatomyDesc}, exposing the ${highArousal ? 'moist' : 'hidden'} valley.` : null,
        // Enhanced spread with anus visibility
        verbBase === 'spread' ? `You spread ${posPronoun} ${pubicDesc} cheeks apart, revealing ${includeSkin ? skinDesc + ' ' : ''}${anusDesc} with its ${analInterior} interior.` : null,
        verbBase === 'spread' ? `Parting ${posPronoun} buttocks, you expose the ${analInterior} pucker nestled between ${posPronoun} cheeks.` : null,
        
        // Squeeze
        verbBase === 'squeeze' ? `You ${verbPresent} ${anatomyDesc}, feeling the ${highArousal ? 'warm, yielding' : 'firm, resistant'} flesh.` : null,
        verbBase === 'squeeze' ? `You grip ${anatomyDesc}, massaging the ${highArousal ? 'pliant' : 'resilient'} globes.` : null,
        
        // Grope
        verbBase === 'grope' ? `You ${verbPresent} ${anatomyDesc}, ${highArousal ? 'kneading the soft flesh' : 'exploring the curves'}.` : null,
        verbBase === 'grope' ? `Your ${actualTool} ${verbIng} ${anatomyDesc}, ${highArousal ? 'gripping the soft flesh' : 'exploring the firm curves'}` : null,
        
        // Slap
        verbBase === 'slap' ? `You ${verbPresent} ${anatomyDesc}, the ${highArousal ? 'flesh jiggling' : 'impact echoing'}.` : null,
        verbBase === 'slap' ? `Your ${actualTool === 'hand' ? 'hand' : actualTool === 'palm' ? 'palm' : 'hand'} ${toolVerb} ${anatomyDesc}, leaving a ${highArousal ? 'rosy handprint' : 'tingling mark'}.` : null,
        
        // Kiss
        verbBase === 'kiss' ? `You ${verbPresent} ${anatomyDesc}, ${highArousal ? 'trailing your lips across the soft skin' : 'pressing a gentle kiss'}.` : null,
        
        // Generic
        `You ${verbPresent} ${anatomyDesc}, ${highArousal ? 'feeling the warm flesh' : 'enjoying the firm texture'}.`
    ].filter(Boolean);
}

/**
 * Build mouth/lips action narratives
 */
function buildMouthNarratives(npc, verbBase, verbPresent, verbIng, anatomyDesc, posPronoun, subjectPronoun, context, act = {}) {
    const { arousalLevel = 0, isOnCooldown = false, isContinueAction = false } = context;
    const highArousal = arousalLevel > 70;
    const actualTool = act.tool || pickRandom(['lips', 'mouth']);
    const toolVerb = getVerbForTool(verbBase, actualTool);
    
    // Get penis state descriptor based on cooldown
    const penisState = isOnCooldown ? pickRandom(['limp', 'flaccid', 'soft', 'spent']) : pickRandom(['hard', 'rigid', 'throbbing', 'engorged']);
    const cockState = isOnCooldown ? pickRandom(['limp', 'flaccid', 'soft', 'spent']) : pickRandom(['hard', 'rigid', 'throbbing', 'engorged']);
    
    // Get scent descriptor (handled by getScentDescriptor function)
    const scentDesc = getScentDescriptor(npc, 'mouth', false);
    
    // Check for lube/saliva for oral sound descriptors
    const intimacy = context.intimacy || {};
    const hasLube = intimacy.lube && intimacy.lube.mouth && intimacy.lube.mouth.hasLube;
    const hasInternalEjaculation = intimacy.climax && intimacy.climax.hasInternalEjaculation && intimacy.climax.lastInternalEjaculation === "mouth";
    const isSlick = hasLube || hasInternalEjaculation || highArousal; // High arousal = more saliva
    
    // Lewd sound descriptor for slick oral sex
    const getMouthSound = () => {
        if (!isSlick) return "";
        return pickRandom([
            " with wet, sloppy sounds",
            " the obscene slurping noises filling the air",
            " with messy, drooling sounds",
            " the slick, wet sounds of oral pleasure between you",
            " your movements punctuated by lewd suction noises"
        ]);
    };
    
    // Check if this is ejaculation - needs special handling with prepositions
    const isEjaculation = verbBase === 'ejaculate' || verbBase === 'ejaculate on';
    
    // For ejaculation, use proper prepositions and enhanced descriptors
    if (isEjaculation) {
        // Get player gender for tool-specific narratives
        const player = context.player || {};
        const playerGender = player ? (player.gender || "").toLowerCase() : "male";
        
        // Check if there has been internal ejaculation before
        const intimacy = context.intimacy || {};
        const hasInternalEjaculation = intimacy.climax && intimacy.climax.hasInternalEjaculation;
        const lastEjaculationTarget = intimacy.climax ? intimacy.climax.lastInternalEjaculation : null;
        const isMultipleEjaculation = lastEjaculationTarget === "mouth";
        
        return [
            `You ejaculate into ${anatomyDesc}, filling ${posPronoun} mouth with ${isMultipleEjaculation ? 'another thick load, the warm fluid overflowing past ' + posPronoun + ' lips' : 'your hot cum, the salty fluid coating ' + posPronoun + ' tongue'}${scentDesc ? ', ' + scentDesc : ''}.`,
            `You release into ${anatomyDesc}, ${isMultipleEjaculation ? 'adding more to what is already there, some dripping from the corners of ' + posPronoun + ' mouth' : 'pumping your seed into ' + posPronoun + ' waiting mouth'} with wet, sloppy sounds${scentDesc ? ', ' + scentDesc : ''}.`,
            `You climax in ${anatomyDesc}, your ejaculation ${isMultipleEjaculation ? 'joining what is already there, the thick mixture pooling on ' + posPronoun + ' tongue' : 'coating ' + posPronoun + ' tongue and throat'}, the taste of your release filling ${posPronoun} mouth${scentDesc ? ', ' + scentDesc : ''}.`,
            `Your ${penisState} penis ejaculates into ${anatomyDesc}, ${isMultipleEjaculation ? 'more semen mixing with the existing pool, ' + posPronoun + ' throat working to swallow it all down' : 'thick spurts of cum filling ' + posPronoun + ' oral cavity'}, the warm fluid slick on ${posPronoun} palate${scentDesc ? ', ' + scentDesc : ''}.`,
            `You fill ${anatomyDesc} with your seed, ${posPronoun} ${isMultipleEjaculation ? 'struggling to contain the growing volume, some spilling past ' + posPronoun + ' lips' : 'gulping down your release, ' + posPronoun + ' throat bobbing with each swallow'}.`,
            `Your ${cockState} cock pulses into ${anatomyDesc}, ${isMultipleEjaculation ? 'another hot load for ' + posPronoun + ' already-filled mouth, the excess dripping down ' + posPronoun + ' chin' : 'hot jets of semen shooting into ' + posPronoun + ' eager mouth'}.`
        ];
    }
    
    return [
        `You ${verbPresent} ${anatomyDesc}.`,
        `Your ${actualTool} ${toolVerb} ${anatomyDesc}.`,
        verbBase === 'kiss' ? `You ${verbPresent} ${anatomyDesc}, ${highArousal ? 'pressing firmly against the warm lips' : 'gently touching the soft surface'}.` : null,
        verbBase === 'suck' ? `You ${verbPresent} ${anatomyDesc}, ${highArousal ? 'drawing deeply' : 'gently pulling'}${getMouthSound()}.` : null,
        verbBase === 'bite' || verbBase === 'nibble' ? `You ${verbPresent} ${anatomyDesc}, ${highArousal ? 'with eager pressure' : 'playfully'}.` : null,
        verbBase === 'lick' ? `Your ${actualTool === 'tongue' ? actualTool : 'tongue'} ${verbIng} ${anatomyDesc}, ${highArousal ? 'hungrily' : 'exploratively'}${getMouthSound()}.` : null,
        `You ${verbPresent} ${anatomyDesc}, ${highArousal ? 'savoring the intimate contact' : 'enjoying the soft warmth'}${getMouthSound()}.`
    ].filter(Boolean);
}

/**
 * Build thighs action narratives
 */
function buildThighNarratives(npc, verbBase, verbPresent, verbIng, anatomyDesc, posPronoun, subjectPronoun, context, act = {}) {
    const { arousalLevel = 0, isContinueAction = false } = context;
    const highArousal = arousalLevel > 70;
    const actualTool = act.tool || pickRandom(['hands', 'palms']);
    const toolVerb = getVerbForTool(verbBase, actualTool);
    
    return [
        `You ${verbPresent} ${anatomyDesc}.`,
        `Your ${actualTool} ${toolVerb} ${anatomyDesc}.`,
        verbBase === 'stroke' || verbBase === 'caress' ? `You ${verbPresent} ${anatomyDesc}, feeling the ${highArousal ? 'damp heat' : 'soft skin'} beneath your touch.` : null,
        verbBase === 'spread' || verbBase === 'part' ? `You ${verbPresent} ${anatomyDesc}, ${highArousal ? 'exposing the slick center' : 'revealing what lies between'}.` : null,
        verbBase === 'squeeze' ? `You ${verbPresent} ${anatomyDesc}, ${highArousal ? 'gripping the soft flesh' : 'feeling the firm resistance'}` : null,
        verbBase === 'kiss' ? `You ${verbPresent} ${anatomyDesc}, ${highArousal ? 'breathing in the musk of arousal' : 'enjoying the warm skin'}.` : null,
        `You ${verbPresent} ${anatomyDesc}, ${highArousal ? 'feeling the warm skin' : 'enjoying the smooth texture'}.`
    ].filter(Boolean);
}

/**
 * Get skin tone description for NPC
 * Returns descriptive phrases about the NPC's skin color
 */
function getSkinDescription(npc) {
    if (!npc) return "";
    
    const skinTone = (npc.skinTone || "").toLowerCase();
    if (!skinTone) return "";
    
    const skinDescriptors = {
        // Human-like skin tones
        'pale': ["pale", "ivory", "fair", "alabaster"],
        'fair': ["fair", "light", "cream-colored", "peaches-and-cream"],
        'tan': ["tan", "golden", "sun-kissed", "bronzed"],
        'olive': ["olive", "warm olive", "mediterranean", "dusky"],
        'brown': ["brown", "deep brown", "caramel", "mahogany"],
        'dark brown': ["dark brown", "rich chocolate", "espresso", "deep umber"],
        'black': ["dark", "ebony", "midnight", " obsidian"],
        
        // Fantasy skin tones
        'warm ivory': ["warm ivory", "creamy", "pearl-like", "soft ivory"],
        'copper': ["copper", "bronze", "russet", "burnished"],
        'moonlit brown': ["moonlit brown", "silvery-brown", "lunar", "shimmering brown"],
        'ruddy': ["ruddy", "rosy", "flushed", "reddish"],
        'deep brown': ["deep brown", "chocolate", "umber", "dark bronze"],
        'umber': ["umber", "earthy", "soil-toned", "muted brown"],
        'stone-pale': ["stone-pale", "pale gray", "chalky", "mineral"],
        'moss green': ["moss green", "verdigris", "forest-green", "emerald-flecked"],
        'yellow-green': ["yellow-green", "chartreuse", "lime-tinged", "citrine"],
        'ash gray': ["ash gray", "smoke-gray", "charcoal", "dusty gray"],
        'mud brown': ["mud brown", "earth-brown", "clay-colored", "swampy"],
        'sallow ochre': ["sallow ochre", "ochre", "mustard", "golden-brown"],
        'gray-green': ["gray-green", "sage", "mossy", "sea-foam"],
        'dark umber': ["dark umber", "shadowed brown", "night-brown", "blackened brown"],
        'yellowed': ["yellowed", "aged", "parchment", "waxen"],
        'smoke-stained': ["smoke-stained", "soot-dusted", "ashen", "charred"],
        'old brown': ["old brown", "weathered", "leathery", "worn"],
        'green': ["green", "emerald", "jade", "verdant"],
        'dark green': ["dark green", "forest", "deep emerald", "mossy green"],
        'gray': ["gray", "silver-gray", "steel", "pewter"],
        'mottled': ["mottled", "patchwork", "speckled", "dappled"],
        'pale': ["pale", "wan", "ghostly", "milky"]
    };
    
    const descriptors = skinDescriptors[skinTone] || [skinTone];
    return pickRandom(descriptors);
}

/**
 * Check if anal penetration should be easy or difficult
 * Sphincters are normally tight and closed. They only open easily if:
 * - Already been penetrated in this encounter
 * - NPC is significantly larger than player (size advantage)
 * @param {Object} npc - The NPC
 * @param {Object} player - The player
 * @returns {boolean} - True if anal penetration should be easy
 */
function isAnalEntryEasy(npc, player) {
    if (!npc) return false;
    
    // Check if anus has already been penetrated in this encounter
    const penetration = npc.intimacy && npc.intimacy.penetration;
    if (penetration && penetration.target === 'anus' && penetration.active) {
        return true; // Already penetrated - easier to continue
    }
    
    // Check size comparison - if NPC is larger, it's easier
    // This is a simplification; in reality, larger NPC might have larger opening
    if (player && player.anatomy && npc.anatomy) {
        const playerSize = (player.anatomy.size || player.anatomy.bodySize || "").toLowerCase();
        const npcSize = (npc.anatomy.size || npc.anatomy.bodySize || "").toLowerCase();
        
        const sizeOrder = ['petite', 'small', 'average', 'medium', 'large', 'huge', 'gigantic'];
        const playerSizeIndex = sizeOrder.indexOf(playerSize);
        const npcSizeIndex = sizeOrder.indexOf(npcSize);
        
        // If NPC is larger than player by at least one size category
        if (npcSizeIndex > playerSizeIndex + 0) {
            return true;
        }
    }
    
    return false; // Default: sphincters are tight and resistant
}

/**
 * Check if a species is civilized
 * Used to determine if NPC understands certain intimate acts
 */
function isCivilizedSpecies(species) {
    if (!species) return false;
    const civilizedSpecies = ["human", "elf", "dwarf", "halfling"];
    return civilizedSpecies.includes(species.toLowerCase());
}

/**
 * Check if an NPC can speak
 * Non-verbal NPCs will only make sounds, not speak
 */
function canNPCSpeak(npc) {
    if (!npc) return true;
    // Check for explicit non-verbal flag
    if (npc.nonVerbal === true || npc.verbal === false) return false;
    // Some species might be naturally non-verbal
    const nonVerbalSpecies = ["animal", "beast", "monster", "creature"];
    const species = (npc.species || "").toLowerCase();
    if (nonVerbalSpecies.some(s => species.includes(s))) return false;
    return true;
}

/**
 * Get dialogue style for an NPC
 * Returns: 'civilized', 'uncivilized', or 'nonverbal'
 */
function getNPCDialogueStyle(npc) {
    if (!npc) return 'civilized';
    
    // Non-verbal NPCs can't speak
    if (!canNPCSpeak(npc)) return 'nonverbal';
    
    // Check if species is civilized
    const species = npc.species || "";
    if (isCivilizedSpecies(species)) return 'civilized';
    
    // Uncivilized species have limited vocabulary
    return 'uncivilized';
}

/**
 * Get internal vagina color description
 * Returns descriptive phrases for the color of vaginal interiors/labia
 */
function getVaginalInteriorColor(npc) {
    if (!npc) return "";
    
    const anatomy = (npc.nsfwTraits && npc.nsfwTraits.anatomy) || (npc.anatomy || {});
    const genitals = anatomy.genitals || {};
    const pigmentation = (genitals.pigmentation || "natural").toLowerCase();
    
    // Map pigmentation to interior color descriptions
    const interiorColors = {
        'natural': ["soft pink", "warm pink", "rosy", "peachy", "blush-colored"],
        'pale': ["pale pink", "delicate pink", "light rose", "ivory-pink", "cream"],
        'light': ["light pink", "soft rose", "peach", "apricot", "corals"],
        'fair': ["fair pink", "warm blush", "dusky rose", "sunset hues"],
        'medium': ["deep pink", "rose", "ruby", "carmine", "coral"],
        'dark': ["dark rose", "deep ruby", "wine-colored", "burgundy", "mahogany"],
        'dark brown': ["chocolate brown", "deep umber", "espresso", "mocha"],
        'brown': ["warm brown", "tawny", "caramel", "honey-golden"],
        'black': ["darkest rose", "ebony-tinged", "shadowed crimson", "midnight wine"],
        'tan': ["tan-rose", "sun-kissed pink", "golden blush", "amber"],
        'olive': ["olive-pink", "muted rose", "earth-toned", "dusky blush"],
        // Fantasy colors
        'green': ["emeraldean", "jade-flecked", "verданt pink", "moss-tinged"],
        'blue': ["azure-blushed", "sapphire-kissed", "cerulean pink", "sky-tinted"],
        'purple': ["amethyst pink", "violet-blushed", "lilac", "orchid"],
        'gray': ["pearl-gray", "smoke-pink", "silver-blushed", "ash-rose"]
    };
    
    const colors = interiorColors[pigmentation] || interiorColors['natural'];
    return pickRandom(colors);
}

/**
 * Get anus interior color description
 * Returns descriptive phrases for the color of anal interiors
 */
function getAnalInteriorColor(npc) {
    if (!npc) return "";
    
    const anatomy = (npc.nsfwTraits && npc.nsfwTraits.anatomy) || (npc.anatomy || {});
    const anus = anatomy.anus || {};
    const pigmentation = (anus.pigmentation || "natural").toLowerCase();
    
    // Anal interior colors - typically darker than surrounding skin
    const interiorColors = {
        'natural': ["soft pink", "warm rose", "dusky", "peach", "flesh-toned"],
        'pale': ["pale rose", "light pink", "ivory", "cream"],
        'light': ["light rose", "peach", "blush", "sun-kissed"],
        'medium': ["rose", "ruby", "carmine", "deep pink"],
        'dark': ["deep rose", "wine-colored", "burgundy", "mahogany", "ebony"],
        'dark brown': ["chocolate", "deep umber", "espresso", "mocha-brown"],
        'brown': ["warm brown", "tawny", "caramel", "honey"],
        'black': ["darkest rose", "ebony", "shadowed", "midnight"],
        // Fantasy colors
        'green': ["emerald-tinged", "jade", "verdanт", "mossy"],
        'blue': ["azure-tinged", "sapphire", "cerulean", "sky-blue"],
        'gray': ["pearl-gray", "smoke-gray", "silver", "ash"]
    };
    
    const colors = interiorColors[pigmentation] || interiorColors['natural'];
    return pickRandom(colors);
}

/**
 * Get pubic hair description
 */
function getPubicDescription(npc) {
    // Check nsfwTraits first (sexual anatomy), then fallback to regular anatomy
    const nsfwAnatomy = (npc.nsfwTraits && npc.nsfwTraits.anatomy) || {};
    const regularAnatomy = npc.anatomy || {};
    const anatomy = { ...regularAnatomy, ...nsfwAnatomy };
    const pubicHair = anatomy.pubicHair || {};
    const hairColor = pubicHair.color || "dark";
    const hairStyle = pubicHair.style || "natural";
    
    const hairAdjectives = {
        dark: ["brown", "dark"],
        brown: ["chestnut", "auburn"],
        black: ["black", "dark"],
        blonde: ["golden", "blonde"],
        auburn: ["copper", "auburn"],
        grey: ["silver", "grey"]
    };
    const hairAdj = hairAdjectives[hairColor] ? pickRandom(hairAdjectives[hairColor]) : hairColor;
    
    if (hairStyle === "smooth" || hairStyle === "none") {
        return pickRandom(["smooth mound", "bare skin", "shaven flesh"]);
    }
    
    const styleDescriptions = {
        "neatly trimmed": "trimmed",
        "natural": "bush",
        "thick": "thatch",
        "a messy natural": "wild growth",
        "a unkept and thick": "thick growth",
        "long thick and wild": "wild thicket"
    };
    const styleDesc = styleDescriptions[hairStyle] || hairStyle;
    
    return `${hairAdj} ${styleDesc}`;
}

/**
 * Get scent descriptor for intimate scenes
 * Civilized species get subtle/pleasant scents, uncivilized get stronger/muskier scents
 * Anal acts always include pungent smell references
 */
function getScentDescriptor(npc, target, isAnalAct = false) {
    if (!npc) return "";
    
    const species = (npc.species || "").toLowerCase();
    const isUncivilized = species && !isCivilizedSpecies(species);
    
    // For anal acts, 80% chance for pungent smell descriptors
    if (isAnalAct && Math.random() < 0.8) {
        if (isUncivilized) {
            return pickRandom([
                "and the pungent, animalistic musk fills the air",
                "and a strong, primal scent rises between you",
                "and the unmistakable musk of arousal, earthy and raw, fills the space",
                "and a heady, animal scent hangs heavy in the air",
                "and the thick, pungent aroma of sex surrounds you",
                "and a musky, unrefined smell fills your senses"
            ]);
        } else {
            return pickRandom([
                "and the musky scent of arousal fills the air",
                "and a warm, intimate aroma rises",
                "and the heady smell of passion hangs between you",
                "and a subtle, intoxicating scent fills the space",
                "and the earthy musk of intimacy surrounds you",
                "and a faint, primal aroma drifts by"
            ]);
        }
    }
    
    // For other sex acts - 15% chance for occasional scent descriptors
    if (!isAnalAct && Math.random() < 0.15) {
        if (isUncivilized) {
            return pickRandom([
                "and a strong, animal musk fills the air",
                "and the primal scent of arousal surrounds you",
                "and a raw, earthy aroma rises",
                "and the unrefined smell of desire fills the space",
                "and a thick, pungent musk hangs heavy"
            ]);
        } else {
            return pickRandom([
                "and a warm, intoxicating scent fills the air",
                "and the musk of arousal surrounds you",
                "and a subtle, intimate aroma drifts by",
                "and the heady smell of passion fills the space",
                "and a faint, pleasurable fragrance lingers"
            ]);
        }
    }
    
    return "";
}

/**
 * Helper to get merged anatomy (regular + NSFW traits) for debugging/testing
 */
function getMergedAnatomy(npc) {
    if (!npc) return {};
    const nsfwAnatomy = (npc.nsfwTraits && npc.nsfwTraits.anatomy) || {};
    const regularAnatomy = npc.anatomy || {};
    return { ...regularAnatomy, ...nsfwAnatomy };
}

// ============================================================================
// EXAMPLE USAGE / INTEGRATION
// ============================================================================
// 
// To use the anatomy describer and narrative generator:
//
// 1. Generate full action narratives:
//    const narrative = generateIntimacyNarrative(femaleNPC, "lick_pussy", {
//        arousalLevel: 85,
//        isWet: true
//    });
//    // Example output: "You trace your tongue along through a wild growth of auburn pubic hair to her slick meaty vagina, savoring every dripping inch."
//
// 2. Get a rich description of a body part:
//    const vaginaDesc = describeAnatomy(femaleNPC, "vagina", { 
//        arousalLevel: 85,
//        isAroused: true,
//        isWet: true 
//    });
//    // Example output: "through a wild growth of fiery pubic hair to her slick meaty vagina"
//
// 3. Enhance an action label:
//    const enhanced = enhanceActionLabel(femaleNPC, "Lick pussy", {
//        arousalLevel: 85,
//        actId: "lick_pussy"
//    });
//    // Example output: "Lick through a natural bush of dark pubic hair to her plump labia"
//
// 4. Build custom flowing narrative:
//    const posPronoun = getPossessivePronoun(npc);
//    const pubicDesc = getPubicDescription(npc);  // e.g., "brown pubs"
//    const vaginaDesc = describeAnatomy(npc, "vagina", { arousalLevel: 85, isWet: true });
//    const narrative = `You part ${posPronoun} ${pubicDesc} and expose ${vaginaDesc}. You slide your tongue between the engorged folds, parting them as you...`;
//    // Output: "You part her brown pubs and expose through a thick patch of chestnut pubic hair to her glistening meaty vagina. You slide your tongue between the engorged folds, parting them as you..."
//
// 5. For position change narration:
//    const posChange = changePosition(npc, player, "Doggy");
//    const narration = buildPositionChangeNarration(npc, posChange);
//    const npcResponse = buildPositionChangeNPCResponse(npc, posChange);
//
// ============================================================================


