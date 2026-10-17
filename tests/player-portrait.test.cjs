const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const corePath = process.argv[2] || 'C:/Git/CYOADEV/cyoaftw-engine-CORE.js';
const core = fs.readFileSync(corePath, 'utf8').replace(/\r\n/g, '\n');
const data = fs.readFileSync(process.argv[3] || 'C:/Git/CYOADEV/cyoaftw-npc-data.js', 'utf8');
function extract(source, start, end) {
    const first = source.indexOf(start), last = source.indexOf(end, first);
    assert.ok(first >= 0 && last > first, 'Missing source section: ' + start);
    return source.slice(first, last);
}
function element() {
    const classes = new Set();
    let text = '';
    return {
        children: [], checked: false, value: '', disabled: false, attributes: {},
        setAttribute(name, value) { this.attributes[name] = value; },
        focus() { this.focused = true; },
        get textContent() { return text; },
        set textContent(value) { text = value; this.children = []; },
        classList: {
            add: name => classes.add(name), remove: name => classes.delete(name),
            contains: name => classes.has(name),
            toggle(name, on) { if (on) classes.add(name); else classes.delete(name); }
        },
        replaceChildren() { this.children = []; this.textContent = ''; },
        appendChild(child) { this.children.push(child); }
    };
}
function player(name = 'Mira') {
    return { name, gender: 'female', appearance: { species: 'elf', skinTone: 'brown', build: 'slender', hairColor: 'black', hairStyle: 'braided', eyeColor: 'green', feature: 'freckles' }, equipped: { upper: { name: 'chain shirt' } } };
}
function harness(saved = new Map()) {
    const elements = Object.fromEntries(['playerPortraitEl', 'playerPortraitToggleInput', 'playerPortraitPromptEditor', 'playerPortraitPromptInput', 'playerPortraitPromptBtn', 'playerPortraitRegenBtn', 'playerPortraitPromptStatus'].map(id => [id, element()]));
    elements.playerPortraitPromptEditor.hidden = true;
    const calls = [];
    const c = {
        window: {}, G: { player: player(), story: { turnCounter: 0 } }, console: { warn() {} }, saveCount: 0,
        getCurrentStoryTurn() { return c.G.story.turnCounter; },
        saveGameState() { c.saveCount++; c.lastSave = JSON.stringify(c.G.player); },
        localStorage: { getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value) },
        document: { getElementById: id => elements[id], createElement: () => element() },
        setTimeout, clearTimeout,
        PORTRAIT_PROMPT_VERSION: 12, PORTRAIT_STYLE_SUFFIX: 'fantasy realism', PORTRAIT_STYLE_NEGATIVES: 'text, watermark',
        getSpeciesTemplate: species => species === 'elf' ? { portraitProfile: { face: 'long pointed ears', negatives: 'round ears' }, anatomyProfile: { surfaceType: 'skin' } } : {},
        getNPCLookItemName: item => item && item.name || '',
        getPortraitImageFn: () => c.imageFn,
        shrinkPortraitDataUrl: async src => 'small:' + src
    };
    c.imageFn = (prompt, options) => new Promise((resolve, reject) => calls.push({ prompt, options, resolve, reject }));
    vm.createContext(c);
    for (const [source, start, end] of [
        [core, 'function npcPortraitHash(', '// Downscale'],
        [core, 'function portraitResultToSrc(', '// ── ENGAGED-NPC HEADER'],
        [core, 'function clarifyPortraitGearName(', '// Bump when'],
        [data, 'function isSlimeNPC(', 'function buildNPCPhysicalSummary('],
        [core, '// ── PLAYER PORTRAIT', '// ── FULL-LENGTH PORTRAIT']
    ]) vm.runInContext(extract(source, start, end), c);
    return { c, calls, elements, saved };
}
async function settle() { for (let i = 0; i < 20; i++) await Promise.resolve(); }
async function checkPromptEditor() {
    const { c, calls, elements } = harness();
    const editor = elements.playerPortraitPromptEditor;
    const input = elements.playerPortraitPromptInput;
    const regen = elements.playerPortraitRegenBtn;
    const status = elements.playerPortraitPromptStatus;
    const el = elements.playerPortraitEl;
    c.G.player = null;
    c.togglePlayerPortraitPromptEditor();
    assert.equal(regen.disabled, true);
    assert.equal(editor.hidden, true);
    assert.equal(elements.playerPortraitPromptBtn.disabled, true);
    c.G.player = player();
    c.renderPlayerPortrait();
    c.togglePlayerPortraitPromptEditor();
    assert.equal(regen.disabled, false);
    assert.equal(elements.playerPortraitPromptBtn.attributes['aria-expanded'], 'true');
    assert.match(input.value, /long pointed ears/);
    assert.equal(calls.length, 0, 'opening editor does not generate');
    input.value = 'A watercolor portrait with silver hair';
    const first = c.regeneratePlayerPortrait();
    assert.equal(c.playerPortraitEnabled(), true, 'Regen enables the portrait');
    assert.equal(input.disabled, true);
    assert.equal(regen.disabled, true);
    assert.equal(calls[0].prompt, 'A watercolor portrait with silver hair');
    await c.regeneratePlayerPortrait();
    assert.equal(calls.length, 1, 'double clicks share one regeneration');
    calls[0].resolve('custom-one');
    await first;
    await settle();
    assert.equal(el.children[0].src, 'custom-one');
    assert.equal(c.G.player.portraitPrompt, calls[0].prompt);
    assert.equal(c.saveCount, 1);
    assert.equal(JSON.parse(c.lastSave).portrait, 'custom-one');
    assert.equal(regen.disabled, false);
    assert.equal(status.textContent, 'Portrait updated.');
    c.G.player = JSON.parse(c.lastSave);
    c.renderPlayerPortrait();
    assert.equal(input.value, calls[0].prompt, 'custom prompt restored with character');
    assert.equal(calls.length, 1, 'saved custom image reuses cache');
    const second = c.regeneratePlayerPortrait();
    assert.equal(calls.length, 2, 'unchanged prompt generates a fresh image');
    assert.notEqual(calls[0].options.seed, calls[1].options.seed);
    assert.equal(el.children[0].src, 'custom-one', 'old portrait stays visible while generating');
    calls[1].reject(new Error('offline'));
    await second;
    await settle();
    assert.equal(el.children[0].src, 'custom-one', 'failed generation preserves old portrait');
    assert.match(status.textContent, /Click Regen to try again/);
    assert.equal(regen.disabled, false);
    c.renderPlayerPortrait();
    assert.equal(calls.length, 2, 'failure does not cause automatic retries');
    input.value = '   ';
    const third = c.regeneratePlayerPortrait();
    assert.match(calls[2].prompt, /long pointed ears/);
    assert.equal(c.G.player.portraitPrompt, '', 'blank prompt restores default');
    calls[2].resolve('default-again');
    await third;
    await settle();
    c.imageFn = null;
    await c.regeneratePlayerPortrait();
    assert.match(status.textContent, /unavailable/);
    assert.equal(c.G.player.portrait, 'default-again');
    c.togglePlayerPortraitPromptEditor();
    assert.equal(editor.hidden, true);
    assert.equal(elements.playerPortraitPromptBtn.attributes['aria-expanded'], 'false');

    const queued = harness();
    queued.c.setPlayerPortraitEnabled(true);
    queued.c.togglePlayerPortraitPromptEditor();
    queued.elements.playerPortraitPromptInput.value = 'Custom queued prompt';
    const pending = queued.c.regeneratePlayerPortrait();
    assert.equal(queued.calls.length, 1, 'regen waits for current image request');
    queued.calls[0].resolve('obsolete');
    await settle();
    assert.equal(queued.calls.length, 2);
    assert.equal(queued.calls[1].prompt, 'Custom queued prompt');
    assert.notEqual(queued.c.G.player.portrait, 'obsolete');
    queued.c.G.player = player('Someone else');
    queued.c.renderPlayerPortrait();
    queued.calls[1].resolve('old-character-custom');
    await pending;
    await settle();
    assert.equal(queued.elements.playerPortraitEl.children.length, 0, 'old regeneration cannot overwrite another character');
    assert.equal(queued.elements.playerPortraitPromptInput.disabled, false);
    assert.notEqual(queued.elements.playerPortraitPromptInput.value, 'Custom queued prompt');
    assert.equal(queued.c.saveCount, 0, 'old regeneration does not save another character');
    queued.calls[2].resolve('new-character');
    await settle();
}
async function checkPromptTurnLimit() {
    const { c, calls, elements } = harness();
    const editor = elements.playerPortraitPromptEditor;
    const input = elements.playerPortraitPromptInput;
    const edit = elements.playerPortraitPromptBtn;
    const regen = elements.playerPortraitRegenBtn;
    c.G.story.turnCounter = 99;
    c.renderPlayerPortrait();
    assert.equal(edit.disabled, false, 'editing allowed before 100 turns have elapsed');
    c.togglePlayerPortraitPromptEditor();
    input.value = 'Last early-game portrait';
    const pending = c.regeneratePlayerPortrait();
    assert.equal(calls.length, 1, 'regeneration allowed on turn 99');
    c.G.story.turnCounter = 100;
    c.syncPlayerPortraitPromptEditor();
    assert.equal(edit.disabled, true);
    assert.equal(editor.hidden, true, 'open editor closes when 100 turns elapse');
    assert.equal(edit.attributes['aria-expanded'], 'false');
    assert.equal(input.disabled, true);
    assert.equal(regen.disabled, true);
    const snapshot = JSON.stringify(c.G.player);
    input.value = 'Too late';
    c.togglePlayerPortraitPromptEditor();
    await c.regeneratePlayerPortrait();
    assert.equal(editor.hidden, true, 'direct open calls respect the limit');
    assert.equal(JSON.stringify(c.G.player), snapshot, 'blocked regen cannot change prompt or seed');
    assert.equal(calls.length, 1, 'blocked regen makes no image request');
    calls[0].resolve('early-request');
    await pending;
    await settle();
    assert.equal(c.G.player.portrait, 'early-request', 'request accepted before cutoff may finish');
    assert.equal(regen.disabled, true, 'late completion cannot unlock controls');
    assert.equal(input.disabled, true);
    c.G.story = JSON.parse(JSON.stringify({ turnCounter: 101 }));
    c.G.player = JSON.parse(JSON.stringify(c.G.player));
    c.renderPlayerPortrait();
    assert.equal(edit.disabled, true, 'later saved game stays locked');
    assert.equal(elements.playerPortraitEl.children[0].src, 'early-request');
    c.setPlayerPortraitEnabled(false);
    c.setPlayerPortraitEnabled(true);
    assert.equal(calls.length, 1, 'visibility toggle remains usable without regeneration');
    await c.regeneratePlayerPortrait();
    assert.equal(calls.length, 1);
    c.G.story.turnCounter = 0;
    c.G.player = player('New game');
    c.setPlayerPortraitEnabled(false);
    assert.equal(edit.disabled, false, 'new game restores editing');
    c.togglePlayerPortraitPromptEditor();
    assert.equal(editor.hidden, false);
    assert.equal(input.disabled, false);
}
async function run() {
    const { c, calls, elements, saved } = harness();
    const el = elements.playerPortraitEl;
    c.renderPlayerPortrait();
    assert.equal(calls.length, 0, 'default is opt-in');
    saved.set('cyoaftwPortraits', 'off');
    c.setPlayerPortraitEnabled(true);
    assert.equal(calls.length, 1, 'player preference is independent from NPC portraits');
    assert.equal(elements.playerPortraitToggleInput.checked, true);
    assert.equal(calls[0].options.resolution, '512x512');
    for (const fact of ['female', 'elf', 'long pointed ears', 'slender build', 'brown skin', 'braided black hair', 'green eyes', 'freckles', 'chainmail shirt']) assert.ok(calls[0].prompt.includes(fact), fact);
    assert.match(calls[0].options.negativePrompt, /round ears/);
    c.renderPlayerPortrait();
    assert.equal(calls.length, 1, 'stat refreshes deduplicate generation');
    calls[0].resolve({ dataUrl: 'data:image/jpeg;base64,test' });
    await settle();
    assert.equal(c.G.player.portrait, 'small:data:image/jpeg;base64,test');
    assert.equal(el.children[0].src, c.G.player.portrait);
    assert.equal(el.classList.contains('active'), true);
    c.setPlayerPortraitEnabled(false);
    assert.equal(el.children.length, 0);
    assert.equal(el.classList.contains('active'), false);
    c.setPlayerPortraitEnabled(true);
    assert.equal(calls.length, 1, 'toggle on reuses cached image');
    const restored = JSON.parse(JSON.stringify(c.G.player));
    c.G.player = restored;
    c.renderPlayerPortrait();
    assert.equal(calls.length, 1, 'save/load reuses cached image');
    assert.equal(harness(saved).elements.playerPortraitToggleInput.checked, true, 'preference restored on startup');

    restored.appearance.hairColor = 'red';
    c.renderPlayerPortrait();
    assert.equal(calls.length, 2);
    restored.equipped.upper.name = 'Linen shirt';
    c.renderPlayerPortrait();
    assert.equal(calls.length, 2, 'appearance changes wait for the running request');
    calls[1].resolve('old-look');
    await settle();
    assert.equal(calls.length, 3, 'new look generated after old request finishes');
    assert.notEqual(restored.portrait, 'old-look', 'stale result cannot enter cache');
    assert.match(calls[2].prompt, /red hair.*Linen shirt/);
    c.setPlayerPortraitEnabled(false);
    calls[2].resolve('new-look');
    await settle();
    assert.equal(el.classList.contains('active'), false, 'late result cannot unhide disabled portrait');
    c.setPlayerPortraitEnabled(true);
    assert.equal(el.children[0].src, 'new-look');
    assert.equal(calls.length, 3);

    restored.appearance.species = 'human';
    c.renderPlayerPortrait();
    c.G.player = player('Other');
    c.renderPlayerPortrait();
    calls[3].resolve('previous-player');
    await settle();
    assert.equal(el.children.length, 0, 'late result cannot replace new character loading state');
    calls[4].reject(new Error('offline'));
    await settle();
    assert.equal(el.classList.contains('active'), false);
    c.renderPlayerPortrait();
    assert.equal(calls.length, 5, 'failed request does not retry on every stat refresh');
    c.setPlayerPortraitEnabled(true);
    calls[5].resolve(null);
    await settle();
    assert.equal(el.classList.contains('active'), false);
    assert.doesNotThrow(() => JSON.stringify(c.G.player), 'promises stay outside saves');
    c.G.player = restored;
    c.imageFn = null;
    c.renderPlayerPortrait();
    assert.equal(el.classList.contains('active'), true, 'cached image displays without image plugin');
    c.G.player = player('No plugin');
    c.renderPlayerPortrait();
    assert.equal(el.classList.contains('active'), false, 'missing plugin hides empty portrait');
    c.G.player = null;
    c.renderPlayerPortrait();
    assert.equal(el.children.length, 0);
    const html = fs.readFileSync(corePath.replace(/\.js$/, '.html'), 'utf8');
    assert.match(html, /id="playerNameEl"><\/div>\s*<div id="playerPortraitEl"/);
    assert.match(html, /id="playerPortraitToggleInput" onchange="setPlayerPortraitEnabled\(this.checked\)"/);
    assert.match(html, /aria-label="Modify player portrait image prompt"/);
    assert.match(html, /id="playerPortraitRegenBtn" onclick="regeneratePlayerPortrait\(\)"/);
    assert.match(core, /getElementById\("playerNameEl"\).textContent = p.name;\s*renderPlayerPortrait\(\)/);
    await checkPromptEditor();
    await checkPromptTurnLimit();
    console.log('Player portrait checks passed (cache, prompts, regeneration, saves, turn limit and async races).');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
