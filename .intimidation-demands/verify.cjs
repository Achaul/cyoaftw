const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/Jon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = 'C:/Git/CYOADEV/';
const files = ['cyoaftw-world-data.js', 'cyoaftw-npc-data.js', 'cyoaftw-context-builder.js', 'cyoaftw-engine-CORE.js'];
const server = http.createServer((req, res) => {
    const file = new URL(req.url, 'http://localhost').pathname.slice(1);
    if (files.includes(file)) {
        res.setHeader('Content-Type', 'text/javascript');
        return res.end(fs.readFileSync(file === 'cyoaftw-engine-CORE.js' ? path.join(__dirname, file) : root + file));
    }
    const html = fs.readFileSync(root + 'cyoaftw-engine-CORE.html', 'utf8').replace(/<!--[\s\S]*?-->/g, '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(html + files.map(f => '<script src="/' + f + '"></script>').join(''));
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
        const errors = []; page.on('pageerror', e => errors.push(e.message));
        await page.goto('http://127.0.0.1:' + server.address().port);
        await page.evaluate(() => {
            useAIEnabled = () => false; setChatTextSpeed('instant');
            G.player = { name: 'QA', class: 'Rogue', gender: 'male', species: 'human', hp: 16, hpMax: 16, stamina: 20, staminaMax: 20, staminaMaxExact: 20, armor: 10, attackBonus: 2, weapon: 'Dagger', coins: 20, inventory: [], equipped: {}, coords: '0,0', stats: { physicalProwess: 3, flexibility: 3, willpower: 3, endurance: 3, charisma: 3 }, traits: {}, appearance: {}, preferences: { likes: [], dislikes: [] } };
            G.story = createStoryDirectorState();
            const room = { coords: '0,0', name: 'Market', type: 'Market', displayName: 'Market', zone: 'Town', creatures: [], items: [], structural: [], exits: { E: '1,0' } };
            const next = { coords: '1,0', name: 'Street', type: 'Street', zone: 'Town', creatures: [], items: [], structural: [], exits: { W: '0,0' } };
            G.roomMap = { '0,0': room, '1,0': next }; G.activeRoom = room;
            const npc = createNPC('Human', room, getZoneTemplate('Town'), { forceRole: 'Clothier', forceAgeCategory: 'adult' });
            npc.name = 'Mara'; npc.temperament = 'neutral'; npc.hostility = 0;
            npc.memory.favorability = 0;
            npc.inventory = [{ id: 'cloth', name: 'Cloth', value: 100, type: ['misc'] }];
            room.creatures.push(npc); window.testNPC = npc;
            G.activeNPC = npc; G.activeNPCMode = 'talk';
            for (const el of document.body.children) if (el.id !== 'gameWrapper') el.style.display = 'none';
            document.getElementById('gameWrapper').classList.add('active');
            renderRoom(); showIntimidateMenu(npc); rollD20 = () => 20;
        });
        assert(await page.getByRole('button', { name: 'Make them leave the room', exact: true }).isEnabled());
        assert(await page.getByRole('button', { name: 'Make them lower prices', exact: true }).isEnabled());
        await page.screenshot({ path: path.join(__dirname, 'intimidation-menu.png') });
        await page.getByRole('button', { name: 'Make them lower prices', exact: true }).click();
        const price = await page.evaluate(() => ({ price: getTradeBuyPrice(testNPC, testNPC.inventory[0]), favor: testNPC.memory.favorability, hostility: testNPC.hostility, discount: getIntimidationPriceMult(testNPC) }));
        assert.equal(price.price, 60); assert.equal(price.discount, 0.6);
        assert(price.favor < 0 && price.hostility > 0);
        await page.evaluate(() => showIntimidateMenu(testNPC));
        await page.getByRole('button', { name: 'Make them leave the room', exact: true }).click();
        const departure = await page.evaluate(() => ({ active: G.activeNPC, here: G.activeRoom.creatures.includes(testNPC), next: G.roomMap['1,0'].creatures.includes(testNPC), favor: testNPC.memory.favorability, hostility: testNPC.hostility, narration: document.getElementById('narrationEl').textContent }));
        assert.equal(departure.active, null); assert.equal(departure.here, false); assert.equal(departure.next, true);
        assert(departure.favor < price.favor && departure.hostility > price.hostility);
        assert.match(departure.narration, /leaves the room/);
        await page.screenshot({ path: path.join(__dirname, 'intimidation-departure.png') });
        assert.deepEqual(errors, []);
        console.log('Full browser flow passed: both menu buttons, real discounted quote, favor/hostility changes and NPC relocation to the adjacent room.');
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
