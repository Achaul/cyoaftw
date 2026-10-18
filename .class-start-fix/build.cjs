const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const baseline = fs.readFileSync(process.argv[2] || 'C:/Git/CYOADEV/cyoaftw-engine-CORE.js');
let core = baseline.toString('utf8').replace(/\r\n/g, '\n');
function once(before, after) {
    if (core.split(before).length !== 2) throw new Error('Expected one match: ' + before);
    core = core.replace(before, after);
}
once('A frail scholar with the deepest mana pool. Copies spells from scrolls into a spellbook and casts fire, frost and lightning.', 'A frail scholar with the deepest mana pool. Starts with a spellbook and one learned basic attack spell; copies more spells from scrolls.');
once(`    // Wizards: a random few start with a spellbook holding one spell. The
    // rest carry a single scroll and must buy or find a spellbook to copy it
    // into (see seedNPCSpellStock and the container finds).
    if (def.perks && def.perks.spellbook) {
        const spellIds = Object.keys(WIZARD_SPELLS);
        if (Math.random() < WIZARD_START_BOOK_CHANCE) {
            items.push(createSpellbookItem([rand(spellIds)]));
        } else {
            items.push(createSpellScrollItem(rand(spellIds)));
        }
    }`, `    // Every Wizard starts able to cast. New-character branch initialization
    // learns the book's spell through the same shared technique rules.
    if (def.perks && def.perks.spellbook) {
        items.push(createSpellbookItem([rand(WIZARD_START_SPELL_IDS)]));
    }`);
once('const WIZARD_START_BOOK_CHANCE = 0.5;     // chance a new Wizard begins with a spellbook (1 spell)', 'const WIZARD_START_SPELL_IDS = Object.freeze(["firebolt", "frostShard", "lightningArc"]); // one basic attack spell, never an advanced/master spell');
fs.writeFileSync(path.join(__dirname, 'before.js'), baseline);
fs.writeFileSync(path.join(__dirname, 'baseline.sha256'), crypto.createHash('sha256').update(baseline).digest('hex').toUpperCase() + '\n');
fs.writeFileSync(path.join(__dirname, 'cyoaftw-engine-CORE.js'), core.replace(/\n/g, '\r\n'));
console.log('Built guaranteed Wizard spellbook and basic starting spell from current development engine.');
