const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/Jon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const html = fs.readFileSync(path.join(__dirname, 'cyoaftw-engine-CORE.html'), 'utf8').replace(/<!--[\s\S]*?-->/g, '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const server = http.createServer((_req, res) => { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(html); });
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
        const errors = []; page.on('pageerror', e => errors.push(e.message));
        await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:') ? route.continue() : route.abort());
        await page.goto('http://127.0.0.1:' + server.address().port);
        for (const file of ['cyoaftw-world-data.js', 'cyoaftw-npc-data.js', 'cyoaftw-context-builder.js']) await page.addScriptTag({ content: fs.readFileSync('C:/Git/CYOADEV/' + file, 'utf8') });
        await page.addScriptTag({ content: fs.readFileSync(path.join(__dirname, 'cyoaftw-engine-CORE.js'), 'utf8') });
        await page.evaluate(async () => { window.__useAI = false; await quickStartAdventure(); });
        if (await page.locator('#openingBeginBtn').isVisible()) await page.locator('#openingBeginBtn').click();
        await page.evaluate(() => {
            const room = createRoomSkeleton('960,960', 'Town', 'Street'); room.exits = {}; room.items = []; room.creatures = []; room.structural = [];
            G.activeNPC = null; G.activeNPCMode = null; G.activeObject = null; G.activeItemModal = null; G.activeRoom = room; G.player.coords = room.coords; G.roomMap[room.coords] = room;
            G.partyMembers = []; G.sessionFollowers = []; G._partyLootPending = []; G._partyLootObjection = null;
            G.player.hp = G.player.hpMax; G.player.stamina = G.player.staminaMax = 100; G.player.dead = false; G.player.unconscious = false;
            G.player.inventory = []; G.player.equipped = {}; G.player.rucksack = createRucksackItem(100);
            G.player.class = 'Fighter'; ensureClassSkillState(G.player);
            runNPCAutonomyTick = () => {}; window.readingTest = {};
            const note = assignLootUID({ name: 'Folded note', type: ['lore'], description: 'Folded directions.', generatedContent: 'Follow the north road to the old well.' });
            const hidden = assignLootUID({ name: 'Secret note', type: ['lore'], hidden: true, generatedContent: 'Never disclose this.' });
            G.player.inventory.push(note, hidden); readingTest.note = note;
            renderRoom(); setTextMode(true);
        });
        const send = async input => {
            await page.locator('#textModeInputEl').fill(input); await page.locator('#textModeInputEl').press('Enter');
            await page.waitForFunction(() => { if (activeCombatNarration) skipActiveCombatNarration(); return !textModeState.busy && !textModeState.parsing; });
        };
        const log = () => page.locator('#textModeLogEl').innerText();
        await send('show readable items'); assert(!(await log()).includes('Secret note'));
        const turn = await page.evaluate(() => getCurrentStoryTurn());
        await send('look at note'); assert((await log()).includes('Reading actions:'));
        assert.equal(await page.evaluate(() => G.player.inventory.includes(readingTest.note)), true);
        assert.equal(await page.evaluate(() => getCurrentStoryTurn()), turn);
        await send('read note then status'); assert((await log()).includes('Follow the north road'));
        assert.equal(await page.evaluate(() => textModeState.queue.length), 0);
        assert.equal(await page.evaluate(() => G.player.inventory.includes(readingTest.note)), true);
        // Duplicate titles ask for actual item references; a replaced source is refused.
        await page.evaluate(() => { const next = assignLootUID({ name: 'Folded note', type: ['lore'], generatedContent: 'A different passage.' }); next.stackKey = 'separate-note'; G.player.inventory.push(next); });
        await send('read note'); assert.equal(await page.evaluate(() => textModeState.pending.kind), 'item');
        await page.evaluate(() => { readingTest.refused = textModeState.pending.options[1].item; G.player.inventory = G.player.inventory.filter(i => i !== readingTest.refused); });
        await send('2'); assert(!(await log()).includes('A different passage.'));
        await send('stop');
        // Delayed lore generation waits, caches once, and cannot grant faith to a new scene/player.
        await page.evaluate(() => {
            const note = assignLootUID({ name: 'Sealed letter', type: ['lore'] }); G.player.inventory.push(note); readingTest.letter = note;
            readingTest.ai = aiAvailable; readingTest.call = callAI; readingTest.rand = rand;
            aiAvailable = () => true; rand = list => list.includes('deity') ? 'deity' : list[0];
            callAI = () => new Promise(resolve => { readingTest.finish = resolve; });
        });
        await page.locator('#textModeInputEl').fill('read letter then status'); await page.locator('#textModeInputEl').press('Enter');
        await page.waitForFunction(() => !!readingTest.finish);
        assert.equal(await page.evaluate(() => textModeState.busy && textModeState.queue.length === 1), true);
        await page.evaluate(() => { readingTest.oldKnown = (G.player.knownDeities || []).slice(); readingTest.letter.hidden = true; readingTest.finish({ text: JSON.stringify({ content: 'A delayed divine secret.' }) }); });
        await page.waitForFunction(() => !textModeState.busy);
        assert.equal(await page.evaluate(() => readingTest.letter.generatedContent), undefined);
        assert.deepEqual(await page.evaluate(() => G.player.knownDeities || []), await page.evaluate(() => readingTest.oldKnown));
        assert(!(await log()).includes('A delayed divine secret.'));
        await page.evaluate(() => { aiAvailable = readingTest.ai; callAI = readingTest.call; rand = readingTest.rand; }); await send('stop');
        await page.evaluate(() => { readingTest.letter.hidden = false; });
        await send('read letter');
        assert.equal(await page.evaluate(() => typeof readingTest.letter.generatedContent === 'string' && readingTest.letter.generatedContent.length > 0), true);
        const cached = await page.evaluate(() => readingTest.letter.generatedContent);
        await page.evaluate(() => { aiAvailable = () => true; callAI = () => { throw new Error('Cached lore must not call AI'); }; });
        await send('read letter'); assert.equal(await page.evaluate(() => readingTest.letter.generatedContent), cached);
        await page.evaluate(() => { aiAvailable = readingTest.ai; callAI = readingTest.call; });
        // The deity tome is consumed only by Read, not Look.
        await page.evaluate(() => { const tome = assignLootUID({ ...DEITY_TOME_ITEMS[0] }); G.player.inventory.push(tome); readingTest.tome = tome; });
        await send('look at tome'); assert.equal(await page.evaluate(() => G.player.inventory.includes(readingTest.tome)), true);
        await send('read tome'); assert.equal(await page.evaluate(() => G.player.inventory.includes(readingTest.tome)), false);
        assert.equal(await page.evaluate(() => G.player.knownDeities.includes(readingTest.tome.deityId)), true);
        // Primers retain their native consumed-book cost and class training.
        await page.evaluate(() => { G.player.classSkills.cleric.rank = 0; G.player.classSkills.cleric.xp = 0; const primer = createClassPrimerItem('cleric'); G.player.inventory.push(primer); readingTest.primer = primer; readingTest.turn = getCurrentStoryTurn(); });
        await send('study book');
        assert.equal(await page.evaluate(() => G.player.inventory.includes(readingTest.primer)), false, JSON.stringify(await page.evaluate(() => textModeState.events.slice(-4))));
        assert.equal(await page.evaluate(() => getClassSkillRank(G.player, 'cleric')), 1);
        assert.equal(await page.evaluate(() => getCurrentStoryTurn() - readingTest.turn), await page.evaluate(() => CLASS_PRIMER_TURNS));
        // Basic practice uses existing cooldowns without consuming arcane text.
        await page.evaluate(() => { G.player.classSkills.wizard.rank = 0; G.player.classSkills.wizard.xp = 0; const scroll = createSpellScrollItem('frostShard'); G.player.inventory.push(scroll); readingTest.scroll = scroll; readingTest.turn = getCurrentStoryTurn(); });
        await send('look at scroll'); await send('study scroll');
        assert.equal(await page.evaluate(() => G.player.inventory.includes(readingTest.scroll)), true);
        assert.equal(await page.evaluate(() => getCurrentStoryTurn() - readingTest.turn), await page.evaluate(() => CLASS_STUDY_TURNS));
        const afterStudy = await page.evaluate(() => getCurrentStoryTurn()); await send('study scroll'); assert.equal(await page.evaluate(() => getCurrentStoryTurn()), afterStudy);
        // A trained wizard copies the exact scroll into their carried book.
        await page.evaluate(() => {
            G.player.classSkills.wizard.rank = 5; G.player.classSkills.wizard.xp = 0; G.player.classBranches = {};
            const book = createSpellbookItem([]); G.player.inventory.push(book); readingTest.book = book;
            readingTest.scroll.copyProgress = 75; readingTest.roll = rollStatCheck; rollStatCheck = () => ({ success: true, critSuccess: true, roll: 20, bonus: 0, total: 20 }); readingTest.turn = getCurrentStoryTurn();
        });
        await send('copy scroll to spellbook');
        assert.equal(await page.evaluate(() => G.player.inventory.includes(readingTest.scroll)), false);
        assert.equal(await page.evaluate(() => readingTest.book.spells.includes('frostShard')), true);
        assert.equal(await page.evaluate(() => getCurrentStoryTurn() - readingTest.turn), await page.evaluate(() => SPELL_COPY_TURNS_PER_SITTING));
        await page.evaluate(() => { rollStatCheck = readingTest.roll; readingTest.book.spells.push('firebolt', 'lightningArc'); readingTest.turn = getCurrentStoryTurn(); });
        await send('read book'); assert((await log()).includes('Frost Shard'));
        await send('study book then status'); assert.equal(await page.evaluate(() => sharedChoiceState.menu.kind), 'reading');
        assert.equal(await page.evaluate(() => textModeState.queue.length), 1);
        await send('how to learn firebolt'); await send('options');
        await send('learn firebolt'); assert.equal(await page.evaluate(() => isSpellLearned(G.player, 'firebolt')), true);
        assert.equal(await page.evaluate(() => textModeState.queue.length), 1);
        await send('continue'); assert.equal(await page.evaluate(() => textModeState.queue.length), 0);
        // Normal inventory buttons invoke the same reading action and preserve their modal.
        await page.evaluate(() => { setTextMode(false); toggleEquipment(); });
        await page.getByRole('button', { name: 'More actions for Folded note', exact: true }).click();
        await page.locator('.equipment-row').filter({ hasText: 'Folded note' }).getByRole('button', { name: 'Read', exact: true }).click();
        assert.equal(await page.locator('#itemModal').evaluate(el => el.classList.contains('active')), true);
        await page.locator('#itemModalDesc').click(); assert.match(await page.locator('#itemModalDesc').innerText(), /Follow the north road/);
        await page.evaluate(() => { closeItemModal(); closeEquipmentManager(); setTextMode(true); });
        await send('show readable items');
        await page.screenshot({ path: path.join(__dirname, 'reading-desktop.png') });
        await page.setViewportSize({ width: 390, height: 844 }); await page.locator('#textModeLogEl').evaluate(el => { el.scrollTop = el.scrollHeight; });
        await page.screenshot({ path: path.join(__dirname, 'reading-mobile.png') });
        assert.equal(await page.evaluate(() => document.activeElement.id), 'textModeInputEl');
        assert.deepEqual(errors, []);
        console.log('PASS reading browser: look aliases/public actions, lore/cache and delayed stale refusal, exact clarification, consumable deity/primer rules, basic study/cooldown, scroll copy/consumption, spell choices/learning/queue, native inventory reading, desktop/mobile, no page errors.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
