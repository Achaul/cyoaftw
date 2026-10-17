const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const corePath = process.argv[2] || 'C:/Git/CYOADEV/cyoaftw-engine-CORE.js';
const publishedData = fs.readdirSync(root).filter(name => /^cyoaftw-npc-data_[a-f0-9]+\.js$/.test(name));
if (!process.argv[3] && publishedData.length !== 1) throw new Error('Expected one published NPC data file; pass its path as the third argument.');
const dataPath = process.argv[3] || path.join(root, publishedData[0]);

function harness() {
    const elements = new Map();
    const c = {
        window: {}, console: { log() {}, warn() {} },
        G: { player: { preferences: { likes: [], dislikes: [] } }, prefetchQueue: [] },
        getSpeciesTemplate() { return {}; },
        getItemName(item) { return typeof item === 'string' ? item : item.name; },
        withIndefiniteArticle(name) { return /^(a |an |the )|boots|gloves|trousers/i.test(name) ? name : (/^[aeiou]/i.test(name) ? 'an ' : 'a ') + name; },
        isZoneBoss() { return false; },
        aiAvailable() { return true; },
        enqueuePrefetchTask(task) { c.G.prefetchQueue.push(task); },
        callAI: async () => '',
        document: { getElementById(id) {
            if (!elements.has(id)) elements.set(id, { style: {}, classList: { contains: () => true }, textContent: '' });
            return elements.get(id);
        } },
        renderNPCPortrait() {}, getNPCDispositionSummary() { return ''; }
    };
    vm.createContext(c);
    vm.runInContext(fs.readFileSync(dataPath, 'utf8'), c);
    const core = fs.readFileSync(corePath, 'utf8').replace(/\r\n/g, '\n');
    vm.runInContext(core.slice(core.indexOf('const NPC_LOOK_WORN_SLOTS'), core.indexOf('// NPC portrait (top-right')), c);
    vm.runInContext(core.slice(core.indexOf('function refreshNPCDetailPanel('), core.indexOf('/**\n * Update NPC detail panel for intimacy mode')), c);
    return c;
}

function npc(overrides = {}) {
    return Object.assign({
        id: 'one', name: 'Mira', species: 'Human', gender: 'female', age: 28, isHumanoid: true,
        heightCm: 175, somatotype: 'mesomorph',
        anatomy: { build: 'toned', body: { color: 'light brown', surfaceType: 'skin' }, features: ['curly eyelashes'] },
        eyeColor: 'blue', hairColor: 'dark brown', hairLength: 'mid-back length', hairStyle: 'swept to the side',
        nsfwTraits: { anatomy: { breasts: { sizeCategory: 'medium', description: 'a modest bust' }, buttocks: { sizeCategory: 'large' } } },
        stats: { charisma: 3 }, equipped: { upper: { name: 'Linen shirt +2' }, lower: { name: 'Wool trousers' }, weapon: { name: 'Sword' } },
        piercings: ['a slender stainless steel ring through her left eyebrow'], fashionStyle: 'grunge',
        enrichment: { currentMotive: 'steal a crown', mannerisms: ['secret mannerism'] },
        currentMotive: 'steal a crown', physicalTraits: 'STALE APPEARANCE'
    }, overrides);
}

async function run() {
    const c = harness();
    const n = npc();
    let description = c.getNPCInspectionDetail(n);
    assert.match(description, /She is a young female human/);
    assert.doesNotMatch(description, /look (?:up|down) at|stature|taller than|shorter than/);
    assert.match(description, /light brown skin and blue eyes/);
    assert.match(description, /mid-back length dark brown hair is swept to the side/);
    assert.match(description, /toned medium-sized breasts and a toned large butt/);
    assert.match(description, /curly eyelashes/);
    assert.match(description, /left eyebrow/);
    assert.match(description, /fashion sense is grunge/);
    assert.match(description, /wearing a linen shirt and wool trousers/);
    assert.doesNotMatch(description, /steal|mannerism|STALE|Sword|\+2|attractive/);
    assert.ok(description.includes('\n\n'));
    assert.ok(description.indexOf('wearing') < description.indexOf('breasts'));

    // Slimes from old saves may have a literal "none" eye colour, cached
    // appearance highlights, and human personality gestures. None belongs
    // in their inspection, room observation, or behavior regeneration.
    const slime = npc({
        species: 'Slime', gender: 'none', isHumanoid: false, age: null, hostility: 80,
        anatomy: { build: 'glistening', body: { color: 'swamp green', surfaceType: 'gel' }, eyes: { color: 'none' },
            features: ['faint internal light', 'a dim core inside the gel', 'a trail of sticky slime'], marks: ['a faint herbal smell'] },
        eyeColor: 'none', hairColor: '', equipped: {}, piercings: [], fashionStyle: '',
        behavior: 'Looks ready to attack. Rolls their eyes.', personalityTraits: ['sarcastic'],
        appearanceHighlights: ['swamp green gel', 'none eyes'], enrichment: { mannerisms: ['Raises an eyebrow', 'speaks in a gurgling voice'] }
    });
    const slimeLook = c.buildNPCLookDescription(slime);
    assert.match(slimeLook, /It is a slime\. It has a glistening build\. It is a swamp green gelatinous pile slowly moving across the floor\./);
    assert.match(slimeLook, /faint internal light, a dim core inside the gel, a trail of sticky slime, and a faint herbal smell/);
    assert.match(slimeLook, /It looks ready to attack\.$/);
    assert.doesNotMatch(slimeLook, /eyes?|eyebrow|rolls|speaks|\.\./i);
    assert.doesNotMatch(c.getNPCObservationDetail(slime), /eyes?|swamp green gel(?:\s|,|$)/i);
    assert.match(c.getNPCObservationDetail(slime), /gelatinous pile/);
    assert.doesNotMatch(c.buildNPCPhysicalSummary(slime), /eyes?/i);
    assert.equal(c.generateNPCBehavior(slime), 'Looks ready to attack');
    assert.equal(c.generateNPCBehavior(Object.assign({}, slime, { hostility: 0 })), 'Quivers gently');
    const loadedSlime = JSON.parse(JSON.stringify(slime));
    assert.equal(c.buildNPCLookDescription(loadedSlime), slimeLook);
    assert.doesNotMatch(c.getNPCInspectionDetail(Object.assign({}, slime, { dead: true })), /moving across/);
    assert.doesNotMatch(c.getNPCInspectionDetail(Object.assign({}, slime, { unconscious: true })), /moving across/);
    assert.doesNotMatch(c.getNPCInspectionDetail(Object.assign({}, slime, { currentState: { sleeping: true } })), /moving across/);
    assert.match(c.getNPCInspectionDetail(Object.assign({}, slime, { anatomy: { build: 'pooled' }, surfaceColor: '' })), /It is a gelatinous pile/);
    assert.doesNotMatch(c.getNPCInspectionDetail(npc({ eyeColor: 'none' })), /none eyes/);

    // Empty eye palettes and old slime templates containing ["none"] both
    // generate absent eyes, rather than a body part with a sentinel colour.
    const speciesTemplate = c.getSpeciesTemplate;
    for (const eyeColors of [[], ['none']]) {
        c.getSpeciesTemplate = () => ({ size: 'small', anatomyProfile: { surfaceType: 'gel', skinTones: ['swamp green'], builds: ['glistening'], eyeColors } });
        const newSlime = { id: 'new-slime', species: 'Slime', isHumanoid: false, gender: 'none' };
        c.generateNPCEnrichment(newSlime, {}, {});
        assert.equal(newSlime.eyeColor, '');
        assert.equal(newSlime.anatomy.eyes, null);
    }
    c.getSpeciesTemplate = speciesTemplate;

    // Height is stored once, with shared species ranges. Only the opening
    // shows the player's relative view; matching heights add no height line.
    assert.match(c.getNPCInspectionDetail(npc({ heightCm: 205 })), /^You look up at/);
    assert.match(c.getNPCInspectionDetail(npc({ heightCm: 110 })), /^You look down at/);
    assert.doesNotMatch(c.getNPCInspectionDetail(npc({ heightCm: 180 })), /You look (?:up|down) at/);
    assert.doesNotMatch(c.getNPCInspectionDetail(npc({ heightCm: 205, unconscious: true })), /You look (?:up|down) at/);
    const migrated = npc({ id: 'legacy-height', species: 'Kobold', heightCm: undefined });
    const migratedHeight = c.ensureNPCHeightCm(migrated);
    assert.ok(migratedHeight >= 70 && migratedHeight <= 105);
    assert.equal(c.ensureNPCHeightCm(migrated), migratedHeight);
    assert.equal(c.ensureNPCHeightCm(JSON.parse(JSON.stringify(migrated))), migratedHeight);
    assert.equal(c.ensureNPCHeightCm(npc({ id: 'legacy-height', species: 'Kobold', heightCm: undefined })), migratedHeight);
    assert.equal(c.ensureNPCHeightCm(npc({ heightCm: 212 })), 212);
    assert.equal(c.ensureNPCHeightCm(npc({ species: 'Rat', isHumanoid: false, heightCm: undefined })), null);
    assert.equal(c.getPlayerHeightCm({ appearance: { species: 'halfling' } }), 100);
    assert.equal(c.getPlayerHeightCm({ appearance: { species: 'human', heightCm: 190 } }), 190);
    const playerHeightSnapshot = c.getNPCPanelDescriptionSnapshot(n);
    c.G.player.appearance = { species: 'halfling' };
    assert.match(c.getNPCInspectionDetail(n), /^You look up at/);
    assert.notEqual(c.getNPCPanelDescriptionSnapshot(n), playerHeightSnapshot);
    c.G.player.appearance = { species: 'human' };
    assert.equal(c.npcPanelDimensionsPreserved(n, description), true);
    assert.equal(c.npcPanelDimensionsPreserved(n, description.replace('toned medium-sized breasts', 'a soft silhouette')), false);
    assert.equal(c.npcPanelDimensionsPreserved(n, description.replace('a toned large butt', 'a toned small butt')), false);
    assert.equal(c.npcPanelDimensionsPreserved(n, 'You look down at her. ' + description), false);
    const taller = npc({ heightCm: 205 });
    const tallerDescription = c.getNPCInspectionDetail(taller);
    assert.equal(c.npcPanelDimensionsPreserved(taller, tallerDescription), true);
    assert.equal(c.npcPanelDimensionsPreserved(taller, tallerDescription.replace('You look up at', 'She is')), false);
    assert.equal(c.npcPanelDimensionsPreserved(taller, tallerDescription.replace('You look up at', 'You look down at')), false);

    const watching = npc({ behavior: 'Keeps a close watch. Sighs dramatically.' });
    const observed = c.buildNPCLookDescription(watching);
    assert.match(observed, /She keeps a close watch\. She sighs dramatically\./);
    assert.ok(observed.indexOf('breasts') < observed.indexOf('She keeps a close watch'));
    assert.doesNotMatch(c.buildNPCLookDescription(npc({ memory: { lastMood: 'secretly jealous' } })), /jealous/);
    const beforeGesture = c.getNPCPanelDescriptionSnapshot(watching);
    watching.behavior = 'Smiles.';
    assert.notEqual(c.getNPCPanelDescriptionSnapshot(watching), beforeGesture);

    // Existing saves retain their real feature and expression, but the old
    // feature-pointing placeholder must never enter the panel/polish facts.
    const kobold = npc({ species: 'Kobold', anatomy: { features: ['tiny clawed hands', 'a snout', 'a chipped tooth'] },
        behavior: 'Seems on edge. draws attention to a snout' });
    const koboldLook = c.buildNPCLookDescription(kobold);
    assert.match(koboldLook, /tiny clawed hands, a snout, and a chipped tooth/);
    assert.match(koboldLook, /She seems on edge\./);
    assert.doesNotMatch(koboldLook, /draws? attention/);
    assert.doesNotMatch(c.buildNPCPanelDescriptionInstruction(kobold).split('LOOK FACTS (JSON string):')[1], /draws? attention/);
    assert.equal(c.buildNPCExpressionSentence(npc({ behavior: 'She draws attention to a snout.' })), '');

    // Regenerating behavior from old enrichment records also ignores the
    // placeholder while preserving genuine movement mannerisms.
    const savedEnsure = c.ensureNPCRelationshipState, savedDisposition = c.getCurrentNPCDisposition;
    c.ensureNPCRelationshipState = () => {};
    c.getCurrentNPCDisposition = () => 'wary';
    c.Math = Object.create(Math);
    c.Math.random = () => 0;
    const legacy = npc({ memory: {}, enrichment: { mannerisms: ['draws attention to a snout', 'moves with quiet precision'] } });
    assert.match(c.generateNPCBehavior(legacy), /moves with quiet precision/);
    assert.doesNotMatch(c.generateNPCBehavior(legacy), /draws? attention/);
    legacy.enrichment.mannerisms = ['draws attention to a snout'];
    assert.doesNotMatch(c.generateNPCBehavior(legacy), /draws? attention|undefined/);
    c.ensureNPCRelationshipState = savedEnsure;
    c.getCurrentNPCDisposition = savedDisposition;
    delete c.Math;

    // Actual generated sizes, including NSFW extension records, feed player taste.
    assert.equal(c._npcBodySize(n, 'breasts'), 'medium');
    c.G.player.preferences.likes = [{ axis: 'chest', value: 'medium' }, { axis: 'butt', value: 'large' }];
    assert.match(c.getNPCInspectionDetail(n), /You find her mildly attractive\.$/);
    assert.match(c.buildNPCLookDescription(Object.assign({}, n, { behavior: 'Sighs dramatically.' })), /She sighs dramatically\.\n\nYou find her mildly attractive\.$/);
    const snapshot = c.getNPCPanelDescriptionSnapshot(n);
    c.G.player.preferences = { likes: [], dislikes: [{ axis: 'chest', value: 'medium' }, { axis: 'butt', value: 'large' }] };
    assert.match(c.getNPCInspectionDetail(n), /You find her mildly unattractive\.$/);
    assert.notEqual(c.getNPCPanelDescriptionSnapshot(n), snapshot);
    assert.equal(c.getNPCInspectionDetail(null), '');
    assert.doesNotMatch(c.getNPCInspectionDetail(npc({ nsfwTraits: null })), /breasts|butt/);
    assert.doesNotMatch(c.getNPCInspectionDetail(npc({ age: 16 })), /breasts|butt|You find/);
    assert.match(c.getNPCInspectionDetail(npc({ gender: 'non-binary' })), /They are a young/);
    assert.match(c.getNPCInspectionDetail(npc({ isHumanoid: false, gender: 'none' })), /It is a young/);
    assert.doesNotMatch(c.getNPCInspectionDetail(npc({ equipped: {} })), /wearing/);
    assert.doesNotMatch(c.getNPCInspectionDetail(npc({ intimacy: { encounter: { active: true }, clothing: { npc: { top: false, bottom: true } } } })), /linen shirt/);
    assert.doesNotMatch(c.getNPCInspectionDetail(npc({ stature: null, hairLength: null, piercings: [], fashionStyle: null })), /stature|mid-back|eyebrow|grunge/);

    const facts = c.buildNPCLookDescription(n);
    const prompt = c.buildNPCPanelDescriptionInstruction(n);
    assert.doesNotMatch(prompt, /steal a crown|secret mannerism/);
    assert.match(prompt, /likes and dislikes/);
    assert.equal(c.cleanNPCPanelDescription('She has blue eyes.\n\nYou find her mildly unattractive.', facts), 'She has blue eyes.\n\nYou find her mildly unattractive.');
    assert.equal(c.cleanNPCPanelDescription('She is attractive.', facts), '');
    assert.equal(c.cleanNPCPanelDescription('Here is the description.', facts), '');
    assert.equal(c.cleanNPCPanelDescription('<img src=x>', facts), '');
    assert.equal(c.cleanNPCPanelDescription('She is beautiful.', 'She has blue eyes.'), '');
    assert.equal(c.cleanNPCPanelDescription('She stands with barefoot confidence despite her brown shoes.', 'She wears brown shoes.'), '');
    assert.match(prompt, /plain, literal language/);
    assert.match(prompt, /ONLY the visible behavior already supplied/);

    // Queue deduplication, stale response rejection and preference invalidation.
    c.G.activeNPC = n;
    let finish;
    c.callAI = () => new Promise(resolve => { finish = resolve; });
    c.queueNPCPanelDescription(n);
    c.queueNPCPanelDescription(n);
    assert.equal(c.G.prefetchQueue.length, 1);
    const task = c.G.prefetchQueue.shift();
    const pending = task.run();
    c.queueNPCPanelDescription(n);
    assert.equal(c.G.prefetchQueue.length, 0);
    n.equipped.upper = { name: 'Leather coat' };
    finish('Old outfit.\n\nYou find her mildly unattractive.');
    await pending;
    assert.equal(n._panelDescription, undefined);
    assert.equal(c.G.prefetchQueue.length, 1);
    assert.match(c.document.getElementById('npcDetailBehaviorEl').textContent, /leather coat/);
    c.callAI = async () => ({ text: c.buildNPCLookDescription(n).replace('She is wearing', 'She wears') });
    await c.G.prefetchQueue.shift().run();
    assert.equal(c.npcPanelDescriptionStale(n), false);
    assert.match(n._panelDescription.text, /\n\n/);
    assert.equal(c.document.getElementById('npcDetailBehaviorEl').style.whiteSpace, 'pre-line');
    c.G.player.preferences = { likes: [], dislikes: [] };
    c.refreshNPCDetailPanel(n);
    assert.doesNotMatch(c.document.getElementById('npcDetailBehaviorEl').textContent, /unattractive/);

    // Switching NPCs while generation runs must not overwrite the new panel.
    c.G.prefetchQueue = [];
    delete n._panelDescription;
    c.callAI = () => new Promise(resolve => { finish = resolve; });
    c.queueNPCPanelDescription(n);
    const late = c.G.prefetchQueue.shift().run();
    c.G.activeNPC = npc({ id: 'two' });
    c.document.getElementById('npcDetailBehaviorEl').textContent = 'Another NPC';
    finish(c.buildNPCLookDescription(n).replace('She is wearing', 'She wears'));
    await late;
    assert.equal(c.document.getElementById('npcDetailBehaviorEl').textContent, 'Another NPC');

    // Provider failure leaves readable facts; toggling AI off still shows them.
    delete n._panelDescription;
    c.G.activeNPC = n;
    c.callAI = async () => { throw new Error('offline'); };
    c.queueNPCPanelDescription(n);
    await c.G.prefetchQueue.shift().run();
    assert.equal(n._panelDescription, undefined);
    c.aiAvailable = () => false;
    c.refreshNPCDetailPanel(n);
    assert.match(c.document.getElementById('npcDetailBehaviorEl').textContent, /leather coat/);
    console.log('NPC panel description checks passed (facts, tastes, polish, caching and async races).');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
