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
    window.INTIMACY_SYSTEM_VERSION = "2026-08-16-010";
    console.log("[Intimacy System] Loaded v2026-08-16-010 - Lube mechanics + context-aware climax + CoT-style narrative");
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
// PRONOUN HELPERS
// ============================================================================

/**
 * Get possessive pronoun for an NPC based on gender
 * Returns: her, his, their
 */
function getPossessivePronoun(npc) {
    if (!npc) return "their";
    
    const gender = (npc.gender || "").toLowerCase();
    if (gender === "female" || gender === "f" || gender.includes("woman") || gender.includes("girl")) {
        return "her";
    }
    if (gender === "male" || gender === "m" || gender.includes("man") || gender.includes("boy")) {
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
    if (gender === "female" || gender === "f" || gender.includes("woman") || gender.includes("girl")) {
        return "She";
    }
    if (gender === "male" || gender === "m" || gender.includes("man") || gender.includes("boy")) {
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
    if (gender === "female" || gender.includes("woman") || gender.includes("girl")) return "her";
    if (gender === "male" || gender.includes("man") || gender.includes("boy")) return "him";
    return "them";
}

// ============================================================================
// INTIMACY STATE MANAGEMENT
// ============================================================================

/**
 * Initialize intimacy state for an NPC
 */
function initializeIntimacyState(npc) {
    if (!npc) return;
    
    // Determine gender for tracking
    const npcGender = (npc.gender || "female").toLowerCase();
    
    npc.intimacy = {
        // Clothing state
        clothing: {
            player: { top: true, bottom: true, undergarments: true },
            npc: { top: true, bottom: true, undergarments: true }
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
            npcCooldownUntil: npcGender === "male" ? null : null
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
            npcCooldownUntil: npcGender === "male" ? null : null
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
            // Include invalid action with reason
            invalidActions.push({ ...act, actId, disabled: true, disabledReason: checkResult.reason });
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
    const actorKey = isPlayerAction ? "player" : "npc";
    const accessibleTargets = position.accessibleTargets[actorKey] || [];
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
    if (act.type === ACT_TYPES.PENETRATE || act.type === ACT_TYPES.CONTINUE || act.triggersClimax) {
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
        return handleClothingAction(npc, player, act, clothingState);
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
        
        intimacy.penetration = {
            active: true,
            tool: act.tool,
            target: act.target,
            depth: 1,
            startedAt: Date.now(),
            playerIsBottom: playerIsBottom
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
            
            // If AI gives us a good response, use it. Otherwise fall back to template
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
                // AI response wasn't good, use our template
                return {
                    action: act.id,
                    type: act.type,
                    responseText: templateResponse,
                    context: context
                };
            }
        } catch (error) {
            console.error(`[Intimacy] AI generation failed: ${error}`);
            // Fall back to template system
            return {
                action: act.id,
                type: act.type,
                responseText: templateResponse,
                context: context
            };
        }
    } else {
        // No AI available, use our template system
        return {
            action: act.id,
            type: act.type,
            responseText: templateResponse,
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
        intense: ["gasps and moans", "pushes back hard", "begs for more", "trembles with need"]
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
    
    // Build response based on action type
    switch (act.type) {
        case ACT_TYPES.TEASE:
            return buildTeaseResponse(npc, player, act, intimacy, subjectPronoun, possessivePronoun, objectPronoun, arousalLevel, bodyPartDesc, reaction);
            
        case ACT_TYPES.PENETRATE:
            return buildPenetrationResponse(npc, player, act, intimacy, subjectPronoun, possessivePronoun, objectPronoun, arousalLevel, bodyPartDesc, reaction, "enter");
            
        case ACT_TYPES.CONTINUE:
            return buildPenetrationResponse(npc, player, act, intimacy, subjectPronoun, possessivePronoun, objectPronoun, arousalLevel, bodyPartDesc, reaction, "continue");
            
        case ACT_TYPES.IMPACT:
            return buildImpactResponse(npc, player, act, intimacy, subjectPronoun, possessivePronoun, objectPronoun, arousalLevel, bodyPartDesc, reaction);
            
        case ACT_TYPES.END:
            return pickRandom([
                `nods contentedly.`,
                `takes a deep breath and relaxes.`,
                `smiles warmly at you.`,
                `looks at you with warm eyes.`
            ]);
            
        default:
            return buildGenericResponse(npc, subjectPronoun, possessivePronoun, objectPronoun, arousalLevel, reaction);
    }
}

/**
 * Build response for tease actions
 * Note: Don't include subject pronoun - it's added by formatIntimacyNPCResponse
 * Note: Don't repeat the action - just describe the NPC's reaction
 */
function buildTeaseResponse(npc, player, act, intimacy, subjectPronoun, possessivePronoun, objectPronoun, arousalLevel, bodyPartDesc, reaction) {
    const verb = act.verb || "touch";
    const tool = act.tool || "hand";
    const target = act.target || "body";
    
    // Get descriptors based on arousal
    const tempDesc = getTemperatureDescriptor(arousalLevel);
    const intensity = getReactionIntensity(arousalLevel);
    const vocalization = getVocalization(arousalLevel);
    const pleasureIntensity = getPleasureIntensity(arousalLevel);
    
    // Select a response template - just the reaction, no action repetition
    // These will be processed by formatIntimacyNPCResponse which adds subject pronoun
    const templates = [
        `${reaction} at your touch.`,
        `${reaction}, ${tempDesc}.`,
        `${reaction} at the sensation.`,
        `lets out a ${vocalization}.`,
        `shivers ${intensity}.`,
        `${reaction} ${pleasureIntensity}.`,
        `${reaction} softly.`,
        `${reaction} with pleasure.`,
        `${reaction}.`,
        `${reaction}, breathing ${intensity}.`,
        `${reaction}, ${pleasureIntensity}.`
    ];
    
    return pickRandom(templates);
}

/**
 * Build response for penetration actions
 */
function buildPenetrationResponse(npc, player, act, intimacy, subjectPronoun, possessivePronoun, objectPronoun, arousalLevel, bodyPartDesc, reaction, phase) {
    const verb = act.verb || "enter";
    const tool = act.tool || "penis";
    const target = act.target || "vagina";
    
    // Get more descriptive vocabulary based on arousal
    const vocalization = getVocalization(arousalLevel);
    const pleasureIntensity = getPleasureIntensity(arousalLevel);
    
    const templates = {
        enter: [
            `gasps as ${possessivePronoun} ${bodyPartDesc} accepts you.`,
            `welcomes you inside with a ${vocalization}, ${possessivePronoun} ${bodyPartDesc} clenching around your ${tool}.`,
            `moans softly as you fill ${possessivePronoun} ${bodyPartDesc}.`,
            `arches ${possessivePronoun} back, ${possessivePronoun} ${bodyPartDesc} enveloping you.`,
            `takes you in deeply, ${possessivePronoun} ${bodyPartDesc} greedy for more.`,
            `whispers your name as you ${verb} ${objectPronoun}.`,
            `clutches at you as you sink into ${possessivePronoun} ${bodyPartDesc}.`
        ],
        continue: [
            `moans with each thrust, ${possessivePronoun} ${bodyPartDesc} gripping you tightly.`,
            `matches your rhythm, ${possessivePronoun} ${bodyPartDesc} clenching around your ${tool}.`,
            `grinds back against you, taking you deeper.`,
            `whispers encouragement as you continue.`,
            `${possessivePronoun} ${bodyPartDesc} pulses around you with each movement.`,
            `raises ${possessivePronoun} hips to meet your thrusts.`
        ]
    };
    
    return pickRandom(templates[phase] || templates.enter);
}

/**
 * Build response for impact actions
 */
function buildImpactResponse(npc, player, act, intimacy, subjectPronoun, possessivePronoun, objectPronoun, arousalLevel, bodyPartDesc, reaction) {
    const verb = act.verb || "touch";
    
    const templates = [
        `yelps at the sudden contact.`,
        `gasps.`,
        `reacts with a soft cry.`,
        `${reaction} at the impact.`,
        `tenses then relaxes into the sensation.`
    ];
    
    return pickRandom(templates);
}

/**
 * Build generic response
 */
function buildGenericResponse(npc, subjectPronoun, possessivePronoun, objectPronoun, arousalLevel, reaction) {
    const templates = [
        `${reaction}.`,
        `${reaction} with pleasure.`,
        `${reaction} enthusiastically.`
    ];
    
    return pickRandom(templates);
}

/**
 * Get vocalization based on arousal level
 */
function getVocalization(arousalLevel) {
    if (arousalLevel < 20) return pickRandom(["sigh", "soft sound", "murmur"]);
    if (arousalLevel < 40) return pickRandom(["soft moan", "sigh of pleasure", "murmur"]);
    if (arousalLevel < 60) return pickRandom(["moan", "gasps", "sighs with pleasure"]);
    if (arousalLevel < 80) return pickRandom(["loud moan", "gasps of pleasure", "whimpers"]);
    return pickRandom(["loud moans", "cries of pleasure", "passionate gasps", "desperate whimpers"]);
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

/**
 * Get pronoun for object
 */
function getObjectPronoun(npc) {
    if (!npc) return "them";
    const gender = (npc.gender || "female").toLowerCase();
    if (gender === "female" || gender.includes("woman") || gender.includes("girl")) return "her";
    if (gender === "male" || gender.includes("man") || gender.includes("boy")) return "him";
    return "them";
}

/**
 * Generate end response
 */
function generateEndResponse(npc, player, act) {
    if (act.id === "stop") {
        return {
            action: "stop",
            type: "end",
            responseText: `${npc.name || "They"} <nods.> The intimate moment ends.`,
            encounterEnded: true
        };
    }
    
    return {
        action: "pause",
        type: "end",
        responseText: `${npc.name || "They"} <takes a deep breath and pauses.>`
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
    
    // Add phase information to menu for UI display
    return {
        menu: menu,
        phase: phase,
        phaseName: getPhaseName(phase),
        isPrivate: room ? isPrivateLocation(room) : false,
        isAlone: room ? isAloneWithTarget(room, npc) : false
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
function changePosition(npc, player, newPositionId) {
    if (!npc || !npc.intimacy) return false;
    if (!hasPosition(newPositionId)) return false;
    
    const oldPosition = npc.intimacy.position.player;
    npc.intimacy.position.player = newPositionId;
    npc.intimacy.position.npc = newPositionId;
    
    console.log(`[Intimacy] Position changed from ${oldPosition} to ${newPositionId}`);
    
    // If penetration was active, it might be interrupted by position change
    if (npc.intimacy.penetration.active) {
        // Check if new position supports the current penetration
        const position = getPosition(newPositionId);
        const act = getAct(npc.intimacy.penetration.actId);
        
        if (act && position) {
            // If the position doesn't support the tool, end penetration
            if (!position.validTools.includes(act.tool)) {
                npc.intimacy.penetration.active = false;
                console.log(`[Intimacy] Penetration ended due to position change`);
            }
        }
    }
    
    return true;
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
        
        // Narrative
        buildIntimacyResponse,
        getPossessivePronoun,
        getSubjectPronoun,
        getObjectPronoun
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
}
