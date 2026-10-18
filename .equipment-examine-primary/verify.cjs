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
            useAIEnabled = () => false;
            G.player = { name: 'QA', class: 'Rogue', gender: 'male', species: 'human', hp: 16, hpMax: 16, stamina: 20, staminaMax: 20, staminaMaxExact: 20, armor: 10, attackBonus: 2, weapon: 'Axe', coins: 20, inventory: [], equipped: {}, coords: '0,0', stats: { physicalProwess: 3, flexibility: 3, willpower: 3, endurance: 3, charisma: 3 }, traits: {}, appearance: {}, preferences: { likes: [], dislikes: [] }, _baselineClothingSeeded: true };
            G.player.rucksack = cloneLootTemplate({ name: 'Rucksack', type: ['misc', 'pack'], unitSize: 8, container: { bag: true, maxUnitCapacity: 18, straps: 2, wearable: 'back' } });
            G.player.equipped.weapon = cloneLootTemplate({ name: 'Axe', type: ['weapon'], damage: 4 });
            G.player.inventory = [cloneLootTemplate({ name: 'Dagger', type: ['weapon'], damage: 4 }), cloneLootTemplate({ name: 'Bloodmoss', type: ['misc'], quantity: 4 }), cloneLootTemplate({ name: 'Lockpick', type: ['misc'] })];
            G.story = createStoryDirectorState(); G.activeRoom = { coords: '0,0', name: 'Market', type: 'Market', zone: 'Town', creatures: [], items: [], structural: [], exits: {} };
            G.roomMap = { '0,0': G.activeRoom }; G.activeNPC = null;
            for (const el of document.body.children) if (el.id === 'setupWrapper') el.style.display = 'none';
            document.getElementById('gameWrapper').classList.add('active');
            ensurePlayerEquipmentState(G.player); toggleEquipment();
        });
        for (const view of ['compact', 'expanded']) {
            await page.locator('#inventoryViewSelect').selectOption(view);
            const row = page.locator('#equipmentInventory .equipment-row').filter({ has: page.locator('.equipment-row-title', { hasText: /^Dagger/ }) }).first();
            await row.getByRole('button', { name: 'Examine', exact: true }).click();
            assert(await page.locator('#itemModal').evaluate(el => el.classList.contains('active')));
            await page.evaluate(() => closeEquipmentExamine());
            const currentRow = page.locator('#equipmentInventory .equipment-row').filter({ has: page.locator('.equipment-row-title', { hasText: /^Dagger/ }) }).first();
            assert(!(await currentRow.getByRole('button', { name: 'Equip', exact: true }).isVisible()));
            await currentRow.locator('.equipment-more-toggle').click();
            assert(await currentRow.getByRole('button', { name: 'Equip', exact: true }).isVisible());
            await currentRow.getByRole('button', { name: 'Equip', exact: true }).click();
            assert.equal(await page.evaluate(() => G.player.equipped.weapon.name), 'Dagger');
            await page.evaluate(() => {
                const axe = G.player.inventory.find(item => item.name === 'Axe');
                equipInventoryEntry(getInventoryEntryKey(axe)); renderEquipment();
            });
        }
        await page.locator('#inventoryViewSelect').selectOption('compact');
        for (const width of [1440, 390]) {
            await page.setViewportSize({ width, height: 900 });
            const row = page.locator('#equipmentInventory .equipment-row').filter({ has: page.locator('.equipment-row-title', { hasText: /^Dagger/ }) }).first();
            assert(await row.getByRole('button', { name: 'Examine', exact: true }).isVisible());
            assert(await row.getByRole('button', { name: 'Drop', exact: true }).isVisible());
            assert(await page.locator('#equipmentManager').evaluate(el => el.scrollWidth <= el.clientWidth + 1));
            await page.screenshot({ path: path.join(__dirname, 'equipment-' + width + '.png') });
        }
        assert.deepEqual(errors, []);
        console.log('Browser verified: direct Examine and ellipsis Equip both work in Compact/Expanded views; desktop/mobile layout has no horizontal overflow.');
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
