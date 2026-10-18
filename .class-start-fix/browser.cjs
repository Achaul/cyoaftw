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
        for (const cls of ['Fighter', 'Rogue', 'Cleric', 'Wizard']) {
            const page = await browser.newPage();
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:') ? route.continue() : route.abort());
            await page.goto('http://127.0.0.1:' + server.address().port);
            for (const file of ['cyoaftw-world-data.js', 'cyoaftw-npc-data.js', 'cyoaftw-context-builder.js']) await page.addScriptTag({ content: fs.readFileSync('C:/Git/CYOADEV/' + file, 'utf8') });
            await page.addScriptTag({ content: fs.readFileSync(path.join(__dirname, 'cyoaftw-engine-CORE.js'), 'utf8') });
            const result = await page.evaluate(async cls => {
                window.__useAI = false;
                for (let step = 1; step <= 5; step++) setupRandomizePage(step);
                document.getElementById('charClassEl').value = cls;
                await beginAdventure();
                const p = G.player;
                const initial = { cls: p.class, hp: p.hpMax, weapon: p.weapon, coins: getCoinValue(p), mana: p.manaMax || 0,
                    techniques: getPlayerTechniqueIds(p, cls.toLowerCase()), castable: getCastableSpellIds(p),
                    books: getPlayerSpellbooks(p).map(b => ({ spells: b.spells })), inventory: p.inventory.map(i => i.name) };
                if (cls === 'Wizard') {
                    const npc = createNPC('human', G.activeRoom, getZoneTemplate(G.activeRoom.zone), { gender: 'male' });
                    npc.hostility = 0; G.activeRoom.creatures.push(npc);
                    G.activeNPC = npc; G.activeNPCMode = 'combat';
                    initial.spells = getCombatActionGroups(npc).find(g => g.name === 'Spells').actions.map(a => ({ name: a.name, disabled: a.disabled }));
                    initial.typedSpells = textCombatActions().map(a => a.name);
                    initial.spellNames = initial.castable.map(id => WIZARD_SPELLS[id].name);
                }
                if (cls === 'Cleric') {
                    learnDeity('healer'); choosePatronDeity('healer');
                    initial.afterPatron = getPlayerTechniqueIds(p, 'cleric');
                }
                return initial;
            }, cls);
            assert.equal(result.cls, cls);
            if (cls === 'Wizard') {
                assert.equal(result.books.length, 1); assert.equal(result.castable.length, 1);
                assert.ok(['firebolt', 'frostShard', 'lightningArc'].includes(result.castable[0]));
                assert.ok(result.spells.some(s => s.name === result.spellNames[0] && !s.disabled), 'Starter spell is immediately enabled in the real combat menu');
                assert.ok(result.typedSpells.includes(result.spellNames[0]), 'The shared text action list includes the same starter spell');
            } else if (cls === 'Cleric') {
                assert.equal(result.techniques.length, 0); assert.ok(result.afterPatron.includes('mendingTouch'));
            } else assert.ok(result.techniques.length > 0);
            assert.deepEqual(errors, []);
            console.log('PASS actual new ' + cls + ': ' + JSON.stringify(result));
            await page.close();
        }
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
