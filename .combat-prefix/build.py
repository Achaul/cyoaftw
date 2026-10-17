from pathlib import Path

root = Path(__file__).parent
source = Path('C:/Git/CYOADEV/cyoaftw-engine-CORE.js').read_text(encoding='utf-8')
def once(text, old, new):
    assert text.count(old) == 1, f'Expected unique source: {old[:100]}'
    return text.replace(old, new, 1)
def edit_function(text, start, end, replacements):
    first, last = text.index(start), text.index(end, text.index(start))
    section = text[first:last]
    for old, new in replacements:
        assert old in section, f'Missing in {start}: {old[:80]}'
        section = section.replace(old, new)
    return text[:first] + section + text[last:]

source = source.replace('2026-10-17-008', '2026-10-17-009', 2)
source = once(source, '// Latest: Strike damage figures reflect HP removed; Endurance level-up debug shows restored HP.', '// Latest: Actor-to-target prefixes on combat action lines, preserving unprefixed status and debug lines.')
source = once(source, 'function buildStrikeHitLine(c) {', (root / 'action-prefix.js').read_text(encoding='utf-8') + 'function buildStrikeHitLine(c) {')
for start, end in [('function buildStrikeHitLine(', 'function buildStrikeMissLine('), ('function buildWatchedStrikeHitLine(', 'function buildWatchedStrikeMissLine(')]:
    source = edit_function(source, start, end, [('    return line;', '    return formatCombatStrikeLine(c, line);')])
for start, end in [('function buildStrikeMissLine(', '// Only edge weapons sever'), ('function buildWatchedStrikeMissLine(', '// What a natural attack looks like')]:
    source = edit_function(source, start, end, [('return fillStrikeTemplate(rand(pool), vars);', 'return formatCombatStrikeLine(c, fillStrikeTemplate(rand(pool), vars));')])
source = once(source, 'return fillStrikeTemplate(rand(c.naturalMode.miss), vars);', 'return formatCombatStrikeLine(c, fillStrikeTemplate(rand(c.naturalMode.miss), vars));')
for old, new in [
    ('lines.push(`${style.text} You aim for ${npcName}\'s ${target.label.toLowerCase()}.`);', 'lines.push(formatCombatActionLine(player, npc, `${style.text} You aim for ${npcName}\'s ${target.label.toLowerCase()}.`));'),
    ('lines.push(maneuver.text);', 'lines.push(formatCombatActionLine(player, npc, maneuver.text));'),
    ('lines.push(sneak.line.replace("{name}", npcName));', 'lines.push(formatCombatActionLine(player, npc, sneak.line.replace("{name}", npcName)));'),
    ('const lines = [stanceText];', 'const lines = [formatCombatActionLine(G.player, npc, stanceText)];'),
    ('const lines = [potionLine];', 'const lines = [formatCombatActionLine(G.player, G.player, potionLine)];'),
    ('const lines = ["You pull a bandage tight over your wounds. The bleeding stops."];', 'const lines = [formatCombatActionLine(G.player, G.player, "You pull a bandage tight over your wounds. The bleeding stops.")];'),
    ('lines.push(`You break away from ${npcName}.`);', 'lines.push(formatCombatActionLine(player, npc, `You break away from ${npcName}.`));'),
    ('lines.push(`${npcName} cuts off your escape.`);', 'lines.push(formatCombatActionLine(npc, player, `${npcName} cuts off your escape.`));'),
    ('lines.push(elemAtk && elemAtk.line ? elemAtk.line : (naturalMode ? buildNaturalPlanLine(npcName, npcPlan.styleKey, naturalMode) : npcPlan.line));', 'lines.push(formatCombatActionLine(npc, player, elemAtk && elemAtk.line ? elemAtk.line : (naturalMode ? buildNaturalPlanLine(npcName, npcPlan.styleKey, naturalMode) : npcPlan.line)));'),
    ('lines.push(`${npcName}\'s chilling touch passes through your guard and saps your stamina.`);', 'lines.push(formatCombatActionLine(npc, player, `${npcName}\'s chilling touch passes through your guard and saps your stamina.`));'),
    ('lines.push("You turn the attack aside and counter.");', 'lines.push(formatCombatActionLine(player, npc, "You turn the attack aside and counter."));'),
]: source = once(source, old, new)

# Damage and support spell casts use their actual selected target. Effect,
# resistance and status rows remain supporting information without a prefix.
source = once(source, '    lines.push(spell.castLine);\n    if (overcharge)', '    lines.push(formatCombatActionLine(player, npc, spell.castLine));\n    if (overcharge)')
source = once(source, 'lines.push((heavy ? spell.heavyLine : spell.hitLine).replace(/\\{name\\}/g, npcName));', 'lines.push(formatCombatActionLine(player, npc, (heavy ? spell.heavyLine : spell.hitLine).replace(/\\{name\\}/g, npcName)));')
source = once(source, '    lines.push(spell.castLine);\n\n    if (spell.selfStatus)', '    lines.push(formatCombatActionLine(player, spell.selfStatus || spell.overcharge ? player : npc, spell.castLine));\n\n    if (spell.selfStatus)')
source = once(source, 'lines.push((spell.hitLine || "").replace(/\\{name\\}/g, npcName));', 'lines.push(formatCombatActionLine(player, npc, (spell.hitLine || "").replace(/\\{name\\}/g, npcName)));')
source = once(source, '    lines.push(power.castLine);', '''    const powerTarget = power.heal ? (power.heal.party ? "Party" : (healTarget || player))
        : power.partyBuff ? "Party" : (power.buff || power.luck || power.shapeshift || power.shapeshiftRevert || power.regrow) ? player : npc;
    lines.push(inCombat ? formatCombatActionLine(player, powerTarget, power.castLine) : power.castLine);''')
source = once(source, 'if (hl) lines.push(hl.replace(/\\{name\\}/g, npcName));', 'if (hl) lines.push(formatCombatActionLine(player, npc, hl.replace(/\\{name\\}/g, npcName)));')

# Area/chain effects name each affected opponent rather than reusing the
# primary target's label. This also handles allies joining a fight.
source = edit_function(source, 'function applySpellToOthers(', '// Self, utility and debuff spells', [
    ('lines.push(spell.name + " washes over " + cname + " without effect.")', 'lines.push(formatCombatActionLine(G.player, c, spell.name + " washes over " + cname + " without effect."))'),
    ('lines.push(outcome === "corpse" ? spell.name + " cuts down " + cname + "." : spell.name + " drops " + cname + ", senseless.")', 'lines.push(formatCombatActionLine(G.player, c, outcome === "corpse" ? spell.name + " cuts down " + cname + "." : spell.name + " drops " + cname + ", senseless."))'),
    ('lines.push(spell.name + " catches " + cname + " for " + hit.damage + ".")', 'lines.push(formatCombatActionLine(G.player, c, spell.name + " catches " + cname + " for " + hit.damage + "."))'),
])
source = edit_function(source, 'function reinforcementOpeningStrike(', 'function summonPeerReinforcement(', [
    ('lines.push(`${attackerName}\'s attack passes harmlessly through ${defenderName}\'s ghostly form.`);', 'lines.push(formatCombatActionLine(attacker, defender, `${attackerName}\'s attack passes harmlessly through ${defenderName}\'s ghostly form.`));'),
    ('`${attackerName} catches ${defenderName} off guard for ${damage} damage!`', 'formatCombatActionLine(attacker, defender, `${attackerName} catches ${defenderName} off guard for ${damage} damage!`)'),
])
for old, new in [
    ('lines.push(`${npcName} hangs back and tries to recover their guard.`);', 'lines.push(formatCombatActionLine(npc, npc, `${npcName} hangs back and tries to recover their guard.`));'),
    ('lines.push("You blink aside and the blow lands where you stood a heartbeat ago.");', 'lines.push(formatCombatActionLine(player, npc, "You blink aside and the blow lands where you stood a heartbeat ago."));'),
    ('lines.push(`${npc.name || "Your foe"} falls back a step, sucks in a ragged breath and steadies.`);', 'lines.push(formatCombatActionLine(npc, npc, `${npc.name || "Your foe"} falls back a step, sucks in a ragged breath and steadies.`));'),
    ('lines.push(`Your sweep misses ${name}.`);', 'lines.push(formatCombatActionLine(player, c, `Your sweep misses ${name}.`));'),
    ('lines.push(outcome === "corpse" ? `Your sweep cuts ${name} down.` : `Your sweep drops ${name}, senseless.`);', 'lines.push(formatCombatActionLine(player, c, outcome === "corpse" ? `Your sweep cuts ${name} down.` : `Your sweep drops ${name}, senseless.`));'),
    ('lines.push(`Your sweep catches ${name} for ${dmg}.`);', 'lines.push(formatCombatActionLine(player, c, `Your sweep catches ${name} for ${dmg}.`));'),
    ('lines.push(outcome === "corpse" ? `The force cuts ${name} down.` : `The force drops ${name}, senseless.`);', 'lines.push(formatCombatActionLine(G.player, c, outcome === "corpse" ? `The force cuts ${name} down.` : `The force drops ${name}, senseless.`));'),
    ('lines.push(`The force carries on into ${name} for ${dmg}.`);', 'lines.push(formatCombatActionLine(G.player, c, `The force carries on into ${name} for ${dmg}.`));'),
    ('lines.push(`You unleash your own technique: ${label}.`);', 'lines.push(formatCombatActionLine(player, t.primary.kind === "damage" ? npc : player, `You unleash your own technique: ${label}.`));'),
    ('lines.push(damage >= Math.ceil((npc.hpMax || 10) * 0.3) ? `The technique slams into ${npcName}.` : `The technique strikes ${npcName}.`);', 'lines.push(formatCombatActionLine(player, npc, damage >= Math.ceil((npc.hpMax || 10) * 0.3) ? `The technique slams into ${npcName}.` : `The technique strikes ${npcName}.`));'),
]: source = once(source, old, new)

source = edit_function(source, 'function reinforcementOpeningStrike(', 'function summonPeerReinforcement(', [
    (': `${attackerName} lunges at ${defenderName} but misses.`)', ': formatCombatActionLine(attacker, defender, `${attackerName} lunges at ${defenderName} but misses.`))'),
    ('''lines.push(watched
            ? `${attackerName}'s chilling touch saps the strength from ${defenderName}.`
            : `${attackerName}'s chilling touch saps ${defenderName}'s stamina for ${staminaDamage}!`);''', '''lines.push(formatCombatActionLine(attacker, defender, watched
            ? `${attackerName}'s chilling touch saps the strength from ${defenderName}.`
            : `${attackerName}'s chilling touch saps ${defenderName}'s stamina for ${staminaDamage}!`));'''),
])
source = edit_function(source, 'function applyNPCManeuverOnHit(', 'function applyWeaponPoison(', [
    ('lines.push(`${name} wrenches your ${getItemName(weapon).toLowerCase()} from your hand and sends it skidding across the floor. You can pick it up again, if you get the chance.`);', 'lines.push(formatCombatActionLine(npc, p, `${name} wrenches your ${getItemName(weapon).toLowerCase()} from your hand and sends it skidding across the floor. You can pick it up again, if you get the chance.`));'),
    ('lines.push(`${name} goes for your weapon hand, but you keep hold of your ${getItemName(weapon).toLowerCase()}.`);', 'lines.push(formatCombatActionLine(npc, p, `${name} goes for your weapon hand, but you keep hold of your ${getItemName(weapon).toLowerCase()}.`));'),
    ('lines.push(`${name} hammers at your armor, and a strap snaps. It protects you less now (-${amount}).`);', 'lines.push(formatCombatActionLine(npc, p, `${name} hammers at your armor, and a strap snaps. It protects you less now (-${amount}).`));'),
])
source = edit_function(source, 'function dealPowerDamageToOther(', '// ═══', [
    ('lines.push(`${power.name} washes over ${cname} without effect.`)', 'lines.push(formatCombatActionLine(G.player, c, `${power.name} washes over ${cname} without effect.`))'),
    ('lines.push(outcome === "corpse" ? `${power.name} cuts down ${cname}.` : `${power.name} drops ${cname}, senseless.`)', 'lines.push(formatCombatActionLine(G.player, c, outcome === "corpse" ? `${power.name} cuts down ${cname}.` : `${power.name} drops ${cname}, senseless.`))'),
    ('lines.push(`${power.name} catches ${cname} for ${damage}.`)', 'lines.push(formatCombatActionLine(G.player, c, `${power.name} catches ${cname} for ${damage}.`))'),
])
# applySecondWind is also used outside fights; only label its combat invocation.
source = once(source, '    applySecondWind(lines);\n    if (resolveNPCCounter', '    applySecondWind(lines);\n    if (lines.length) lines[0] = formatCombatActionLine(G.player, G.player, lines[0]);\n    if (resolveNPCCounter')

for old, new in [
    ('lines.push(`Your ${playerWeapon.name || "weapon"} passes harmlessly through ${npcName}\'s ghostly form - only a weapon touched by elemental power can harm it.`);', 'lines.push(formatCombatActionLine(player, npc, `Your ${playerWeapon.name || "weapon"} passes harmlessly through ${npcName}\'s ghostly form - only a weapon touched by elemental power can harm it.`));'),
    ('lines.push("The wind carries you through a second strike before they can react!");', 'lines.push(formatCombatActionLine(player, npc, "The wind carries you through a second strike before they can react!"));'),
    ('lines.push(`Your follow-up blow lands on ${name} for ${dmg}.`);', 'lines.push(formatCombatActionLine(player, npc, `Your follow-up blow lands on ${name} for ${dmg}.`));'),
    ('lines.push(s.text);', 'lines.push(formatCombatActionLine(player, key === "setSpear" || key === "holdAtBay" ? npc : player, s.text));'),
    ('lines.push(`You turn ${name}\'s miss into a riposte.`);', 'lines.push(formatCombatActionLine(player, npc, `You turn ${name}\'s miss into a riposte.`));'),
    ('lines.push(`${name} runs onto your set spear.`);', 'lines.push(formatCombatActionLine(player, npc, `${name} runs onto your set spear.`));'),
    ('lines.push(t.text);', 'lines.push(formatCombatActionLine(player, npc, t.text));'),
    ('lines.push("You throw something, slip behind cover, and by the time they look again you are gone.");', 'lines.push(formatCombatActionLine(player, npc, "You throw something, slip behind cover, and by the time they look again you are gone."));'),
    ('lines.push("You try to vanish, but they keep their eyes on you.");', 'lines.push(formatCombatActionLine(player, npc, "You try to vanish, but they keep their eyes on you."));'),
]: source = once(source, old, new)

(root / 'cyoaftw-engine-CORE.js').write_text(source, encoding='utf-8', newline='\r\n')
print('Built explicit combat action prefixes.')
