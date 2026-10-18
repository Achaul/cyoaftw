const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/Jon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = __dirname;
const html = fs.readFileSync(path.join(root, 'cyoaftw-engine-CORE.html'), 'utf8').replace(/<!--[\s\S]*?-->/g, '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
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
        await page.addScriptTag({ content: fs.readFileSync(path.join(root, 'cyoaftw-engine-CORE.js'), 'utf8') });
        if (errors.length) throw new Error('Engine boot: ' + errors.join('\n'));
        await page.evaluate(async () => { window.__useAI = false; await quickStartAdventure(); });
        if (await page.locator('#openingBeginBtn').isVisible()) await page.locator('#openingBeginBtn').click();
        await page.evaluate(() => {
            // A deterministic peaceful test room, with real engine-created NPCs.
            const room = createRoomSkeleton('900,900', 'Town', 'Street');
            room.exits = {}; room.creatures = [];
            G.activeNPC = null; G.activeNPCMode = null; G.activeRoom = room; G.player.coords = room.coords; G.roomMap[room.coords] = room;
            G.player.hp = G.player.hpMax; G.player.dead = false; G.player.unconscious = false;
            for (const gender of ['male', 'female']) {
                const npc = createNPC('dwarf', room, getZoneTemplate('Town'), { gender });
                npc.gender = gender; npc.hostility = 0; npc.aggression = 0;
                npc.name = 'a ' + gender + ' dwarf'; npc.descriptorName = npc.name;
                room.creatures.push(npc);
            }
            renderRoom(); renderRoomNarration(room, 'start', null);
        });
        const send = async (text, enter = true) => {
            await page.locator('#textModeInputEl').fill(text);
            if (enter) await page.locator('#textModeInputEl').press('Enter');
            else await page.locator('#textModeFormEl button[type=submit]').click();
            await page.waitForFunction(() => !textModeState.busy && !textModeState.parsing);
        };
        await page.locator('#textModeToggleBtn').click();
        assert.equal(await page.locator('#textModeInputEl').evaluate(el => document.activeElement === el), true);
        assert.equal(await page.locator('#interactBarEl').isVisible(), false);
        await send('how do I talk', false);
        assert((await page.locator('#textModeLogEl').innerText()).includes('second dwarf'));
        await send('talk to dwarf');
        assert(await page.evaluate(() => !!textModeState.pending));
        await send('2');
        assert.equal(await page.evaluate(() => G.activeNPC.gender), 'female');
        assert.equal(await page.locator('#textModeEl').isVisible(), true);
        await send('say "Hello, where is the inn?"');
        await page.waitForFunction(() => document.getElementById('chatLogEl').textContent.includes('Hello, where is the inn?'));
        assert((await page.locator('#chatLogEl').innerText()).includes('Hello, where is the inn?'));
        await send('options');
        assert((await page.locator('#textModeLogEl').innerText()).includes('choose'));
        await send('leave then look');
        assert.equal(await page.evaluate(() => G.activeNPC), null);
        await page.evaluate(() => {
            const room = G.activeRoom;
            const coords = getAdjacentCoords(room.coords, 'N');
            const ahead = createRoomSkeleton(coords, 'Town', 'Street');
            ahead.creatures = [];
            room.exits.N = coords;
            G.roomMap[coords] = ahead;
            delete room.locks;
        });
        await send('glance north');
        assert.equal(await page.locator('#chatOptionsEl').innerText(), '');
        assert.equal(await page.locator('#textModeEl').isVisible(), true);
        await send('north then look');
        assert.equal(await page.evaluate(() => G.activeNPC), null);
        await page.screenshot({ path: path.join(root, 'desktop.png') });
        await page.setViewportSize({ width: 390, height: 844 });
        await page.locator('#textModeLogEl').evaluate(el => { el.scrollTop = el.scrollHeight; });
        await page.screenshot({ path: path.join(root, 'mobile.png') });
        const layout = await page.locator('#textModeEl').evaluate(el => ({ left: el.getBoundingClientRect().left, right: el.getBoundingClientRect().right, width: window.innerWidth }));
        assert(layout.left >= 0 && layout.right <= layout.width + 1, JSON.stringify(layout));
        await page.locator('#textModeEl button[aria-label="Return to previous view"]').click();
        assert.equal(await page.locator('#interactBarEl').isVisible(), true);
        assert.equal(await page.locator('#textModeEl').isVisible(), false);
        assert.deepEqual(errors, []);
        console.log('PASS browser: full SFW engine startup, real NPC targeting/reply, Enter/button submission, persistent dock, return controls, desktop/mobile layout, no page errors.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
