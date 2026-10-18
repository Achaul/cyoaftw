// Shared semantic combat actions. The menu and command adapters consume these
// definitions directly; the command parser never clicks or scrapes UI buttons.
function combatActionDescriptor(label, run, options = {}) {
    const name = String(label).replace(/\s*\([^)]*\)\s*$/, "").trim();
    return {
        id: options.id || name.toLowerCase(), primary: options.primary || name.toLowerCase(), name: name, label: label, run: run,
        disabled: options.disabled === true, title: options.title || "",
        className: options.className || "", targets: options.targets || null, aliases: options.aliases || []
    };
}

function createCombatActionButton(action) {
    return createCombatButton(action.label, action.run, { disabled: action.disabled, title: action.title, className: action.className });
}

function getCombatHealTargetActions(power, npc) {
    return [G.player].concat(getHealableAllies()).map(function (entity) {
        const self = entity === G.player;
        const hurt = entityNeedsHealing(entity);
        const label = self ? "Yourself" : entity.name || "Ally";
        return combatActionDescriptor(label + (hurt ? " (" + entity.hp + "/" + entity.hpMax + ")" : " (unhurt)"), function () { useDeityPower(power.id, npc, self ? null : entity); }, {
            id: self ? "self" : encEntityKey(entity), disabled: !hurt && !power.heal.fullStamina, title: hurt ? power.summary : "No need."
        });
    });
}
