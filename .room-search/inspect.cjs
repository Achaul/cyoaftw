const fs = require('node:fs');
const http = require('node:http');
const { chromium } = require('C:/Users/Jon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = 'C:/Git/CYOADEV/';
const corePath = process.argv[2] || root + 'cyoaftw-engine-CORE.js';
const roomType = process.argv[3] || 'Chamber';
const files = ['cyoaftw-world-data.js', 'cyoaftw-npc-data.js', 'cyoaftw-context-builder.js', 'cyoaftw-engine-CORE.js'];
const server = http.createServer((req, res) => {
    const route = new URL(req.url, 'http://localhost').pathname.slice(1);
    if (files.includes(route)) { res.setHeader('Content-Type', 'text/javascript'); return res.end(fs.readFileSync(route === 'cyoaftw-engine-CORE.js' ? corePath : root + route)); }
    let html = fs.readFileSync(root + 'cyoaftw-engine-CORE.html', 'utf8').replace(/<!--[\s\S]*?-->/g, '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(html + files.map(file => '<script src="/' + file + '"></script>').join(''));
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
        page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
        await page.goto('http://127.0.0.1:' + server.address().port);
        await page.evaluate(roomType => {
            useAIEnabled = () => false;
            G.player = { name: 'QA', class: 'Rogue', gender: 'male', species: 'human', hp: 16, hpMax: 16, stamina: 20, staminaMax: 20, staminaMaxExact: 20, armor: 10, attackBonus: 2, weapon: 'Dagger', coins: 20, inventory: [], equipped: {}, coords: '0,0', stats: { physicalProwess: 3, flexibility: 3, willpower: 3, endurance: 3, charisma: 3 }, traits: {}, appearance: {}, preferences: { likes: [], dislikes: [] } };
            G.activeRoom = { coords: '0,0', name: 'Test Chamber', displayName: 'Test Chamber', type: 'Chamber', zone: 'Dungeon', baseDescription: 'A test chamber.', creatures: [], items: [], exits: {}, structural: [{ id: 'chest', name: 'chest', tags: ['storage'] }, { id: 'inscriptions', name: 'inscriptions', tags: ['information'] }] };
            if (roomType !== 'Chamber') {
                const template = getRoomTemplate(roomType);
                Object.assign(G.activeRoom, { type: roomType, zone: 'Town', name: roomType, displayName: roomType, baseDescription: template.baseDescription, structural: JSON.parse(JSON.stringify(template.structural)) });
            }
            G.roomMap = { '0,0': G.activeRoom }; G.story = createStoryDirectorState();
            G.activeNPC = null; G.activeObject = null;
            for (const el of document.body.children) if (el.id !== 'gameWrapper') el.style.display = 'none';
            document.getElementById('gameWrapper').classList.add('active');
            renderRoom(); renderNarrationWithRoomObservations(G.activeRoom, 'A test chamber.');
        }, roomType);
        console.log('BEFORE:', await page.locator('#narrationEl').innerText());
        await page.locator('#interactLeftEl button').filter({ hasText: /^Search$/ }).click();
        console.log('MENU:', await page.locator('#chatOptionsEl').innerText());
        await page.evaluate(() => { rollD20 = () => 14; getEntityStatCombatBonus = () => 2; });
        await page.getByRole('button', { name: /Search carefully/ }).click();
        console.log('AFTER CAREFUL:', await page.locator('#narrationEl').innerText());
        console.log('STATE:', await page.evaluate(() => ({ stamina: G.player.stamina, turn: G.story.turnCounter, fixtures: G.activeRoom.structural.map(f => ({id:f.id, revealed:f.revealed, stat:f.revealStat})) })));
        await page.locator('#interactLeftEl button').filter({ hasText: /^Search$/ }).click();
        await page.getByRole('button', { name: /Search tight spaces/ }).click();
        console.log('AFTER TIGHT:', await page.locator('#narrationEl').innerText());
        await page.screenshot({ path: __dirname + '/search-result-' + roomType.replace(/ /g, '-') + '.png' });
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
