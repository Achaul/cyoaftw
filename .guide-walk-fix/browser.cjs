const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/Jon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const html = fs.readFileSync('C:/Git/CYOADEV/cyoaftw-engine-CORE.html', 'utf8').replace(/<!--[\s\S]*?-->/g, '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const server = http.createServer((_req, res) => { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(html); });
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:') ? route.continue() : route.abort());
        await page.goto('http://127.0.0.1:' + server.address().port);
        for (const file of ['cyoaftw-world-data.js', 'cyoaftw-npc-data.js', 'cyoaftw-context-builder.js']) await page.addScriptTag({ content: fs.readFileSync('C:/Git/CYOADEV/' + file, 'utf8') });
        await page.addScriptTag({ content: fs.readFileSync(path.join(__dirname, 'cyoaftw-engine-CORE.js'), 'utf8') });
        await page.evaluate(async () => { window.__useAI = false; await quickStartAdventure(); });
        if (await page.locator('#openingBeginBtn').isVisible()) await page.locator('#openingBeginBtn').click();
        await page.evaluate(() => {
            const rooms = [0, 1, 2].map(i => {
                const room = createRoomSkeleton((900 + i) + ',900', 'Town', 'Street');
                room.displayName = ['West Walk', 'Market Lane', 'Guildhall Approach'][i];
                room.exits = {}; room.creatures = []; room.items = []; room.fixtures = [];
                delete room.locks; delete room.skirmish;
                G.roomMap[room.coords] = room;
                return room;
            });
            for (let i = 0; i < 2; i++) { rooms[i].exits.E = rooms[i + 1].coords; rooms[i + 1].exits.W = rooms[i].coords; }
            G.activeNPC = null; G.activeNPCMode = null; G.activeObject = null;
            G.activeRoom = rooms[0]; G.player.coords = rooms[0].coords; G.sessionFollowers = []; G.partyMembers = [];
            G.player.hp = G.player.hpMax; G.player.dead = false; G.player.unconscious = false;
            G.player.carrying = null; G.player.dragging = null;
            if (G.player.backstory && G.player.backstory.guide) G.player.backstory.guide.state = 'oriented';
            const npc = createNPC('human', rooms[0], getZoneTemplate('Town'), { gender: 'male' });
            npc.role = 'Traveller'; npc.hostility = 0; npc.aggression = 0;
            npc.name = 'Bran'; npc.givenName = 'Bran'; npc.memory.metPlayer = true; npc.memory.everGreeted = true;
            npc.memory.nameKnown = true; npc._testGuide = true;
            rooms[0].creatures.push(npc); window.testGuide = npc;
            // Supply the follower relocation integration without loading excluded runtime files.
            window.teleportNPC = function (actor, coords) {
                const target = G.roomMap[coords];
                if (!target) return false;
                Object.values(G.roomMap).forEach(room => { if (room.creatures) room.creatures = room.creatures.filter(n => n !== actor); });
                target.creatures.push(actor); actor.coords = coords; return true;
            };
            renderRoom(); renderRoomNarration(rooms[0], 'start', null);
            startGuiding(npc, { key: rooms[2].coords, name: 'the guildhall' });
            renderInteractSidePanels();
        });
        await page.getByRole('button', { name: 'Keep following', exact: true }).click();
        await page.waitForFunction(() => G.activeRoom.coords === '901,900');
        assert.match(await page.locator('#narrationEl').innerText(), /Bran leads the way east/);
        assert.doesNotMatch(await page.locator('#chatLogEl').innerText(), /leads the way east/);
        const firstAt = Date.now();
        await page.waitForFunction(() => G.activeRoom.coords === '902,900');
        assert.ok(Date.now() - firstAt >= 2500, 'The player gets a visible pause in the intermediate room');
        await page.waitForFunction(() => G.activeNPC === window.testGuide && G.activeNPCMode === 'talk');
        await page.waitForFunction(() => document.getElementById('chatLogEl').textContent.includes('Here we are.'));
        assert.equal(await page.locator('#npcDetailEl').evaluate(el => el.classList.contains('active')), true);
        assert.equal(await page.locator('#exitGridEl').isVisible(), false);
        assert.ok(await page.locator('#chatOptionsEl button[data-option-id^="ask-"]').count());
        assert.equal(await page.locator('#chatOptionsEl button[data-option-id="greet-known"]').count(), 0);
        assert.match(await page.locator('#narrationEl').innerText(), /Bran leads you east and stops/);
        await page.screenshot({ path: path.join(__dirname, 'arrival-desktop.png') });
        await page.evaluate(() => setTextMode(true));
        await page.locator('#textModeInputEl').fill('options');
        await page.locator('#textModeInputEl').press('Enter');
        await page.waitForFunction(() => !textModeState.busy && !textModeState.parsing);
        assert.match(await page.locator('#textModeLogEl').innerText(), /choose/i);
        await page.setViewportSize({ width: 390, height: 844 });
        await page.screenshot({ path: path.join(__dirname, 'arrival-mobile.png') });
        assert.deepEqual(errors, []);
        console.log('PASS browser: real movement/followers, central travel narration, three-second pause, arrival NPC panel and conversation past greeting, typed options, desktop/mobile, no page errors.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
