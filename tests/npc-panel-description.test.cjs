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
        stature: 'average-height', somatotype: 'mesomorph',
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
    assert.match(description, /average-height stature/);
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
    c.callAI = async () => ({ text: 'She wears a leather coat.\n\nYou find her mildly unattractive.' });
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
    finish('She wears a leather coat.');
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
