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
    window.INTIMACY_SYSTEM_VERSION = "2026-08-16-004";
    console.log("[Intimacy System] Loaded v2026-08-16-004 - Fixed gender filters for NPC targeting");
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
const CLIMAX_CONFIG = {
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
        // Lube state
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
            depth: 0
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
        hasLube: false,
        lubeLevel: 0,
        virginity: { vaginal: true, anal: true },
        lastAction: null,
        actionHistory: [],
        penetration: { active: false, tool: null, target: null, depth: 0 },
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
        // Remove clothing removal actions if we want them always available
        // Remove penetration and continue actions
        delete filtered.Penetration;
        
        // Remove genital and anal actions that require nudity
        if (filtered.Genital) {
            filtered.Genital = filtered.Genital.filter(a => a.reqCloth === CLOTHING_REQUIREMENTS.ANY);
        }
        if (filtered.Anal) {
            filtered.Anal = filtered.Anal.filter(a => a.reqCloth === CLOTHING_REQUIREMENTS.ANY);
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
    if (act.type === ACT_TYPES.PENETRATE || act.type === ACT_TYPES.CONTINUE) {
        handlePenetrationAction(npc, player, act, intimacy);
    }
    
    // Handle virginity loss
    if (act.takesVirginity) {
        handleVirginityLoss(npc, act.takesVirginity);
    }
    
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
function handlePenetrationAction(npc, player, act, intimacy) {
    if (act.type === ACT_TYPES.PENETRATE) {
        // Start penetration
        intimacy.penetration = {
            active: true,
            tool: act.tool,
            target: act.target,
            depth: 1,
            startedAt: Date.now()
        };
    } else if (act.type === ACT_TYPES.CONTINUE) {
        // Continue penetration
        if (intimacy.penetration.active) {
            intimacy.penetration.depth = Math.min(intimacy.penetration.depth + 1, 5);
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
 * Generate AI response for an action
 */
async function generateActionResponse(npc, player, act, intimacy, positionId) {
    // Build context for AI
    const context = buildActionContext(npc, player, act, intimacy, positionId);
    
    // Generate the prompt
    const prompt = buildIntimacyPrompt(context);
    
    // Use the AI system (ai function from your codebase)
    if (typeof ai === 'function') {
        try {
            const result = await ai({
                instruction: prompt,
                startWith: "",
                endButtons: "none",
                generatorName: "cyoaftw-engine-core"
            });
            
            const responseText = result && (result.text || result);
            
            return {
                action: act.id,
                type: act.type,
                responseText: responseText || buildFallbackResponse(npc, player, act),
                context: context
            };
        } catch (error) {
            console.error(`[Intimacy] AI generation failed: ${error}`);
            return {
                action: act.id,
                type: act.type,
                responseText: buildFallbackResponse(npc, player, act),
                context: context
            };
        }
    } else {
        // Fallback if ai function not available
        return {
            action: act.id,
            type: act.type,
            responseText: buildFallbackResponse(npc, player, act),
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
 */
function buildFallbackResponse(npc, player, act) {
    const npcName = npc.name || "They";
    const responses = {
        tease: [
            `${npcName} <lets out a soft moan.>`,
            `${npcName} <sighs with pleasure.>`,
            `${npcName} <responds enthusiastically.>`,
            `${npcName} <enjoys the attention.>`
        ],
        penetrate: [
            `${npcName} <gasps as you enter them.>`,
            `${npcName} <moans loudly with pleasure.>`,
            `${npcName} <welcomes you inside.>`,
            `${npcName} <arches their back in response.>`
        ],
        continue: [
            `${npcName} <moans with each thrust.>`,
            `${npcName} <grips you tightly.>`,
            `${npcName} <matches your rhythm.>`,
            `${npcName} <encourages you to continue.>`
        ],
        impact: [
            `${npcName} <yelps in surprise and pleasure.>`,
            `${npcName} <gasps at the sensation.>`,
            `${npcName} <reacts to the sudden contact.>`,
            `${npcName} <enjoys the firm touch.>`
        ],
        clothing: [
            `${npcName} <watches as you undress.>`,
            `${npcName} <helps you with your clothing.>`,
            `${npcName} <smiles as the clothing comes off.>`,
            `${npcName} <anticipates what comes next.>`
        ],
        end: [
            `${npcName} <nods in acknowledgment.>`,
            `${npcName} <takes a deep breath.>`,
            `${npcName} <smiles contentedly.>`,
            `${npcName} <looks at you expectantly.>`
        ]
    };
    
    const category = act.type || "tease";
    const options = responses[category] || responses.tease;
    return options[Math.floor(Math.random() * options.length)];
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
    
    // Convert to menu format with natural labels
    const menu = [];
    
    // Define phase groups with their categories
    const phaseGroups = {
        social: ["Kissing", "Body"],
        private: ["Clothing", "Breasts", "Lower Body", "Genital", "Anal", "Impact"],
        intimate: ["Penetration", "Climax", "End"]
    };
    
    // Process each phase group in order
    const phaseOrder = ["social", "private", "intimate"];
    let addedSeparator = false;
    
    for (const phaseGroup of phaseOrder) {
        const categories = phaseGroups[phaseGroup];
        let phaseHasActions = false;
        
        for (const category of categories) {
            if (categorized[category] && categorized[category].length > 0) {
                // Add separator before this phase if we've already added content from previous phase
                if (menu.length > 0 && !addedSeparator) {
                    menu.push({ type: "separator" });
                    addedSeparator = true;
                }
                menu.push({
                    type: "category",
                    label: category,
                    actions: categorized[category].map(a => ({
                        id: a.actId,
                        label: getNaturalLabel(a.actId, npc, player),
                        description: a.desc,
                        type: a.type,
                        phaseRequired: getMinimumPhaseForAction(a.actId)
                    }))
                });
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
        if (!Object.values(phaseGroups).flat().includes(category) && actions.length > 0) {
            menu.push({
                type: "category",
                label: category,
                actions: actions.map(a => ({
                    id: a.actId,
                    label: getNaturalLabel(a.actId, npc, player),
                    description: a.desc,
                    type: a.type,
                    phaseRequired: getMinimumPhaseForAction(a.actId)
                }))
            });
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
 * Add lube to intimacy state
 */
function addLube(npc, amount = 100) {
    if (!npc || !npc.intimacy) return false;
    
    npc.intimacy.hasLube = true;
    npc.intimacy.lubeLevel = Math.min(100, npc.intimacy.lubeLevel + amount);
    
    console.log(`[Intimacy] Added lube. Level: ${npc.intimacy.lubeLevel}`);
    return true;
}

/**
 * Use lube (consume some)
 */
function useLube(npc, amount = 10) {
    if (!npc || !npc.intimacy || !npc.intimacy.hasLube) return false;
    
    npc.intimacy.lubeLevel = Math.max(0, npc.intimacy.lubeLevel - amount);
    
    if (npc.intimacy.lubeLevel <= 0) {
        npc.intimacy.hasLube = false;
    }
    
    console.log(`[Intimacy] Used lube. Level: ${npc.intimacy.lubeLevel}`);
    return true;
}

/**
 * Check if lube is available
 */
function hasLube(npc) {
    return npc && npc.intimacy && npc.intimacy.hasLube && npc.intimacy.lubeLevel > 0;
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
        
        // Position
        changePosition,
        getSuggestedPositions
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
}
