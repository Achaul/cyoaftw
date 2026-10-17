const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function load(filename) {
    const c = { console: { log() {} }, getPlayerSpeciesKey: () => 'human' };
    c.window = c;
    vm.createContext(c);
    vm.runInContext(fs.readFileSync(filename, 'utf8'), c);
    c.origins = vm.runInContext('PLAYER_ARCHETYPES', c);
    c.crafts = vm.runInContext('CLASS_CRAFT_QUESTIONS', c);
    c.findTownBuilding = type => ({ name: 'the ' + type.toLowerCase(), type });
    return c;
}
const before = load(path.join(__dirname, 'before/cyoaftw-world-data.js'));
const after = load(path.join(__dirname, 'cyoaftw-world-data.js'));
const out = ['INTRO GUIDE AND ORIGIN REVIEW', '', 'Behavior',
    '- The guide asks how you are, gives one response, and waits.',
    '- Injury, feeling shaken, and needing space change the response and options.',
    '- Asking for space starts no timer for another briefing.',
    '- Known-topic answers and party offers no longer arrive back to back.',
    '- Greetings and facts are authored. Optional AI can select an approved delivery by number only.',
    '- Origins and opening scenes keep the selected facts, with no AI word-count expansion.',
    '', 'GUIDE EXAMPLE', '', 'Before (rattled):',
    '"No shame in it. Take a breath. Rattled is only what alive feels like."',
    'The same turn then includes the backstory briefing.', '', 'After:',
    'Player: "A bit rattled, if I\'m honest."',
    'Guide: "We can leave the plans for a moment. Would you rather have some quiet, or talk about what to do?"',
    'Player: "I need a moment."',
    'Guide: "Take your time. I will be here when you want to talk."',
    '[The guide waits. No automatic next line.]', '', 'ORIGINS (same selections before and after)', ''];
for (const id of Object.keys(after.origins)) {
    const cls = after.origins[id].classFit[0];
    function build(c) {
        const o = c.origins[id];
        const first = id === 'coming-of-age' ? 1 : 0;
        const second = id === 'exile' ? 3 : 0;
        const slots = Object.assign({}, c.crafts[cls].options[0].slot, o.questions[0].options[first].slot, o.questions[1].options[second].slot);
        return c.buildPlayerBackstory({ archetype: id, cls, playerName: 'Ari', slots });
    }
    const old = build(before), now = build(after);
    out.push(after.origins[id].label.toUpperCase(), 'Before: ' + old.text, 'After: ' + now.text, '');
}
out.push('OPENING SAMPLE', '', after.buildOpeningSceneTemplate({ speciesLabel: 'Human', appearance: { build: 'lean', hairColor: 'black', eyeColor: 'green' },
    trait: 'curiosity', backstoryText: after.buildPlayerBackstory({ archetype: 'missing-kin', cls: 'Rogue', playerName: 'Ari',
        slots: { craft: 'learned to pick locks', who: 'your oldest friend', lastSeen: 'left for this town to find work and never wrote again' } }).text,
    zone: 'Town', roomName: 'the tavern', tier: 'Normal', kin: true, goal: 'Find out what happened to your oldest friend.' }));
fs.writeFileSync(path.join(__dirname, 'review.txt'), out.join('\n'));
console.log(out.join('\n'));
