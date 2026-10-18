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
            const room = createRoomSkeleton('950,950', 'Town', 'Street'); room.exits = {}; room.creatures = []; room.items = [];
            G.activeNPC = null; G.activeNPCMode = null; G.activeRoom = room; G.activeObject = null; G.player.coords = room.coords; G.roomMap[room.coords] = room;
            G.partyMembers = []; G.sessionFollowers = []; G._partyLootPending = []; G._partyLootObjection = null;
            G.player.hp = G.player.hpMax; G.player.stamina = G.player.staminaMax = 100; G.player.dead = false; G.player.unconscious = false;
            G.player.inventory = []; G.player.equipped = {}; G.player.coins = 200; G.player.rucksack = createRucksackItem(36);
            const npc = createNPC('dwarf', room, getZoneTemplate('Town'), { gender: 'female' });
            npc.role = 'Clothier'; npc.name = 'Mara'; npc.descriptorName = 'Mara'; npc.hostility = 0; npc.aggression = 0; npc.coins = 200;
            npc.memory.favorability = 20; npc.inventory = seedNPCClothierStock(npc); npc.equipped = {};
            delete npc._schedule; delete npc._postCoords; delete npc._homeCoords;
            room.creatures.push(npc);
            window.goodsTest = { room, npc };
            // The production clock still invokes the goods cycle; isolate unrelated
            // ambient travel/pressure while testing exact inventory effects.
            runNPCAutonomyTick = () => {}; tickNPCScheduleActiveRoom = () => {}; tickBackstoryPressure = () => {}; tickNPCOpportunism = () => {};
            G.story.turnCounter = 10;
            goodsTest.shirt = cloneLootTemplate({ name: 'Test linen shirt', type: ['clothes', 'upper'], slot: 'upper', value: 16, material: 'cloth', composition: [{ material: 'linen', units: 3 }], quantity: 2 });
            G.player.inventory.push(goodsTest.shirt); restowPlayerPack(G.player); renderRoom();
            selectNPC(npc); tradeWithNPC(npc);
        });
        assert.equal(await page.evaluate(() => G.activeNPCMode), 'trade');
        await page.locator('#chatOptionsEl button').filter({ hasText: 'Clothier services' }).click();
        await page.locator('#chatOptionsEl button').filter({ hasText: 'Dismantle clothing' }).click();
        await page.locator('#chatOptionsEl button').filter({ hasText: 'Test linen shirt' }).click();
        assert.match(await page.locator('#chatOptionsEl').innerText(), /Destroy one Test linen shirt/);
        await page.locator('#chatOptionsEl button').filter({ hasText: 'Confirm dismantling' }).click();
        await page.waitForFunction(() => G.activeNPCMode === 'trade');
        assert.equal(await page.evaluate(() => getItemQuantity(goodsTest.shirt)), 1);
        assert.equal(await page.evaluate(() => G.player.inventory.filter(i => i.tailoringMaterial === 'linen').reduce((n, i) => n + getItemQuantity(i), 0)), 2);
        const send = async text => {
            await page.locator('#textModeInputEl').fill(text); await page.locator('#textModeInputEl').press('Enter');
            await page.waitForFunction(() => !textModeState.busy && !textModeState.parsing);
        };
        await page.evaluate(() => setTextMode(true));
        await send('dismantle test linen shirt then status');
        assert.equal(await page.evaluate(() => sharedChoiceState.menu.kind), 'goods-dismantle-quote');
        await send('choose 1'); assert.equal(await page.evaluate(() => textModeState.queue.length), 1);
        await send('continue'); assert.equal(await page.evaluate(() => textModeState.queue.length), 0);
        assert.equal(await page.evaluate(() => G.player.inventory.includes(goodsTest.shirt)), false);
        await send('show market'); assert.match(await page.locator('#textModeLogEl').innerText(), /supplier deliveries/);
        // Actual player sale -> receipt grace -> subsequent stock rotation.
        await page.evaluate(() => {
            goodsTest.junk = cloneLootTemplate({ name: 'Bent cheap buckle', value: 4, type: ['misc', 'junk'], junk: true, quantity: 5 });
            G.player.inventory.push(goodsTest.junk); restowPlayerPack(G.player);
            goodsTest.salePrice = getTradeSellPrice(goodsTest.npc, goodsTest.junk);
        });
        await send('sell all bent cheap buckle');
        assert.equal(await page.evaluate(() => goodsTest.npc.inventory.filter(i => i.name === 'Bent cheap buckle').reduce((n, i) => n + getItemQuantity(i), 0)), 5);
        await send('leave');
        const report = await page.evaluate(() => {
            G.story.turnCounter += DAY_TURNS * 2; tickGoodsCycle();
            const first = { summary: goodsTest.npc.goodsCycle.summary, coins: getCoinValue(goodsTest.npc), rows: goodsTest.npc.inventory.length, rounds: goodsTest.npc.goodsCycle.rounds };
            tickGoodsCycle();
            return { first, repeated: { coins: getCoinValue(goodsTest.npc), rows: goodsTest.npc.inventory.length, rounds: goodsTest.npc.goodsCycle.rounds }, junk: goodsTest.npc.inventory.some(i => i.name === 'Bent cheap buckle') };
        });
        assert.equal(report.junk, false); assert.equal(report.first.summary.junk >= 5, true);
        assert.deepEqual(report.repeated, { coins: report.first.coins, rows: report.first.rows, rounds: report.first.rounds });
        // A stale condition quote must not destroy the garment or charge a fee.
        await page.evaluate(() => {
            G.story.turnCounter = 172; selectNPC(goodsTest.npc); tradeWithNPC(goodsTest.npc);
            goodsTest.stale = cloneLootTemplate({ name: 'Test wool tunic', type: ['clothes', 'upper'], slot: 'upper', value: 16, material: 'cloth', composition: [{ material: 'wool', units: 3 }] });
            G.player.inventory.push(goodsTest.stale); restowPlayerPack(G.player);
        });
        await send('dismantle test wool tunic');
        await page.evaluate(() => { goodsTest.beforeCoins = getCoinValue(G.player); goodsTest.stale.durability = { hp: 10, max: 100 }; });
        await send('choose 1');
        assert.equal(await page.evaluate(() => G.player.inventory.includes(goodsTest.stale)), true);
        assert.equal(await page.evaluate(() => getCoinValue(G.player) === goodsTest.beforeCoins), true);
        await send('options'); await send('cancel');
        await page.setViewportSize({ width: 390, height: 844 });
        await send('dismantle');
        assert.equal(await page.locator('#textModeInputEl').isVisible(), true);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), true);
        await page.screenshot({ path: path.join(__dirname, 'browser-mobile.png'), fullPage: true });
        assert.deepEqual(errors, []);
        console.log('PASS real-engine goods cycle: native/text dismantling, sales/grace/catch-up, stale quotes, queue, public output and mobile layout.');
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
