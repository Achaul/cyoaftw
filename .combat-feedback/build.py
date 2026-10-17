from pathlib import Path
import re

root = Path(__file__).parent
live = Path('C:/Git/CYOADEV')
core = (live / 'cyoaftw-engine-CORE.js').read_text(encoding='utf-8')
html = (live / 'cyoaftw-engine-CORE.html').read_text(encoding='utf-8')
def once(source, old, new):
    assert source.count(old) == 1, f'Expected unique source: {old[:90]}'
    return source.replace(old, new, 1)

core = core.replace('2026-10-17-007', '2026-10-17-008', 2)
core = once(core, '// Latest: Standalone save confirmation popup over the save manager.', '// Latest: Strike damage figures reflect HP removed; Endurance level-up debug shows restored HP.')
core = once(core, 'shattered: false, combo: null, warded: true', 'shattered: false, combo: null, warded: true, hpLost: 0, hpBefore: entity.hp, hpAfter: entity.hp')
core = once(core,
    '    entity.hp = Math.max(0, (typeof entity.hp === "number" ? entity.hp : entity.hpMax || 1) - damage);\n    wearPlayerGearFromHit(entity, damage, damageType);',
    '    const hpBeforeHit = typeof entity.hp === "number" ? entity.hp : entity.hpMax || 1;\n    entity.hp = Math.max(0, hpBeforeHit - damage);\n    // Keep wound/impact damage intact; narration separately reports HP removed.\n    const hpLost = Math.max(0, hpBeforeHit - entity.hp);\n    wearPlayerGearFromHit(entity, damage, damageType);')
core = once(core, 'return { severed, limbKey, newlyDisabledLimb, bled, damage, notes, shattered, combo:', 'return { severed, limbKey, newlyDisabledLimb, bled, damage, hpLost, hpBefore: hpBeforeHit, hpAfter: Math.max(0, hpBeforeHit - damage), notes, shattered, combo:')
core = once(core, '    const numberText = `(${c.damage} damage', '    const hpDamage = Number.isFinite(c.hpLost) ? c.hpLost : c.damage;\n    const hpChange = c.defenderIsPlayer && Number.isFinite(c.hpBefore) && Number.isFinite(c.hpAfter)\n        ? `; HP ${c.hpBefore} → ${c.hpAfter}` : "";\n    const numberText = `(${hpDamage} damage${hpChange}')
core = once(core, 'targetKey: targetKey, damage: damageResult.damage, blocked: blocked,', 'targetKey: targetKey, damage: damageResult.damage, hpLost: damageResult.hpLost, blocked: blocked,')
core = once(core, 'targetKey: npcPlan.target, damage: counterDamage, blocked: blocked,', 'targetKey: npcPlan.target, damage: damageResult.damage ?? counterDamage, hpLost: damageResult.hpLost,\n            hpBefore: damageResult.hpBefore, hpAfter: damageResult.hpAfter, blocked: blocked,')
core = once(core, 'targetKey: "torso", damage: riposteResult.damage, blocked: riposteBlocked,', 'targetKey: "torso", damage: riposteResult.damage, hpLost: riposteResult.hpLost, blocked: riposteBlocked,')
core = once(core,
    '        const playerHitGain = trackCombatSkillGain(player, { statKey: "endurance" });',
    '        const playerHitGain = trackCombatSkillGain(player, { statKey: "endurance" });\n        if (playerHitGain && playerHitGain.leveledUp && playerHitGain.leveledUp.hpGained > 0) {\n            const restored = playerHitGain.leveledUp.hpGained;\n            lines.push(`Your Endurance increases, restoring ${restored} HP and adding ${restored} max HP (HP ${player.hp - restored} → ${player.hp}).`);\n        }')
# Endurance growth can heal in the same round; keep that separate from the hit.
start = core.index('function maybeLevelUpStat(')
end = core.index('function trackCombatSkillGain(', start)
section = core[start:end]
section = once(section, '    let leveled = null;', '    let leveled = null;\n    const hpBeforeLevels = entity.hp;')
section = once(section, '    return leveled;', '    if (leveled && statKey === "endurance") leveled.hpGained = Math.max(0, entity.hp - hpBeforeLevels);\n    return leveled;')
core = core[:start] + section + core[end:]
core = once(core,
    'line += ` -- LEVEL UP: ${gain.leveledUp.statKey} ${gain.leveledUp.from} -> ${gain.leveledUp.to}`;',
    'line += ` -- LEVEL UP: ${gain.leveledUp.statKey} ${gain.leveledUp.from} -> ${gain.leveledUp.to}`;\n        if (gain.leveledUp.hpGained > 0) line += ` (+${gain.leveledUp.hpGained} HP and max HP)`;')
html = html.replace('2026-10-17-009', '2026-10-17-010', 2)
html = once(html, 'Latest: Consistent dark panels and controls, thicker status bars and themed scrollbars.', 'Latest: Slightly shorter buttons; damage icons and amounts stay together.')
start = html.index('/* ── SHARED DARK UI FINISH')
end = html.index('/* ── END SHARED DARK UI FINISH', start)
end = html.index('*/', end) + 2
html = html[:start] + (root.parent / '.ui-cleanup/ui-cleanup.css').read_text(encoding='utf-8').rstrip() + html[end:]
html = once(html, '    content: "\\1F4A5 ";', '    content: "\\1F4A5\\00a0";')
html = once(html, '#narrationEl .combat-damage {\n', '#narrationEl .combat-damage {\n    display: inline-block;\n    white-space: nowrap;\n')
scripts = lambda value: re.findall(r'<script src="[^"]+"></script>', value)
assert scripts(html) == scripts((live / 'cyoaftw-engine-CORE.html').read_text(encoding='utf-8'))
for name, content in [('cyoaftw-engine-CORE.js', core), ('cyoaftw-engine-CORE.html', html)]:
    (root / name).write_text(content, encoding='utf-8', newline='\r\n')
print('Built compact controls and combat damage reporting updates.')
