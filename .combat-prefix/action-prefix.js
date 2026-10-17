// Attach attribution at the action's source, never by guessing from prose.
// These stay plain text so names use the same safe typewriter as narration.
function getCombatActionLabel(entity) {
    if (entity && entity === G.player) return "Player";
    const label = typeof entity === "string" ? entity
        : entity && (entity.name || entity.displayName || entity.type);
    return String(label || "Unknown").replace(/\s+/g, " ").trim();
}

function formatCombatActionLine(actor, target, text) {
    const line = String(text || "");
    if (!line.trim() || /^\[[^\]]+\]/.test(line.trim())) return line;
    const prefix = `(${getCombatActionLabel(actor)}) → (${getCombatActionLabel(target)}) `;
    return line.startsWith(prefix) ? line : prefix + line;
}

function formatCombatStrikeLine(context, text) {
    return formatCombatActionLine(
        context.attackerIsPlayer ? "Player" : context.attackerName,
        context.defenderIsPlayer ? "Player" : context.defenderName,
        text
    );
}

