const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
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
        async function load(startGame = false) {
            await page.goto('http://127.0.0.1:' + server.address().port);
            for (const file of ['cyoaftw-world-data.js', 'cyoaftw-npc-data.js', 'cyoaftw-context-builder.js']) await page.addScriptTag({ content: fs.readFileSync('C:/Git/CYOADEV/' + file, 'utf8') });
            await page.addScriptTag({ content: fs.readFileSync(path.join(__dirname, 'cyoaftw-engine-CORE.js'), 'utf8') });
            if (startGame) {
                await page.evaluate(async () => { window.__useAI = false; await quickStartAdventure(); });
                if (await page.locator('#openingBeginBtn').isVisible()) await page.locator('#openingBeginBtn').click();
            }
        }
        await load(true);
        const toggle = page.locator('#textModeToggleBtn'), box = page.locator('#showTextModeToggleInput');
        assert.equal(await toggle.isVisible(), false, 'beta hidden by default');
        assert.equal(await box.isChecked(), false);
        const directions = () => page.locator('#exit-E').boundingBox();
        const before = await directions();
        await page.evaluate(() => openPreferences());
        await box.check();
        assert.equal(await page.evaluate(() => localStorage.getItem('cyoaftwShowTextMode')), 'on');
        await page.locator('#preferencesCloseBtn').click();
        assert.equal(await toggle.isVisible(), true);
        assert.deepEqual(await directions(), before, 'compass direction cells do not shift');
        await toggle.click();
        assert.equal(await page.locator('#textModeInputEl').evaluate(el => el === document.activeElement), true);
        await page.locator('#textModeInputEl').fill('show');
        await page.locator('#textModeInputEl').press('Enter');
        assert.match(await page.locator('#textModeLogEl').innerText(), /Available|Actions|look/i);
        await page.evaluate(() => {
            textModeState.queue = [parseTextCommand('look')]; textModeState.paused = true;
            openPreferences();
        });
        await box.uncheck();
        assert.deepEqual(await page.evaluate(() => ({ enabled: textModeState.enabled, pending: textModeState.queue.length, paused: textModeState.paused })), { enabled: false, pending: 0, paused: false });
        assert.equal(await page.locator('#textModeEl').isVisible(), false);
        await page.locator('#preferencesCloseBtn').click();
        assert.equal(await toggle.isVisible(), false);
        await load(true);
        assert.equal(await toggle.isVisible(), false, 'off persists after reload');
        await page.evaluate(() => openPreferences()); await box.check();
        await page.locator('#preferencesCloseBtn').click();
        await load(true);
        assert.equal(await toggle.isVisible(), true, 'on persists after reload');
        assert.equal(await box.isChecked(), true);
        await page.setViewportSize({ width: 390, height: 844 });
        assert.equal(await toggle.isVisible(), true);
        await page.evaluate(() => openPreferences());
        await box.uncheck(); await box.check();
        await page.screenshot({ path: path.join(__dirname, 'preferences-mobile.png') });
        await page.locator('#preferencesCloseBtn').click();
        await toggle.click();
        assert.equal(await page.locator('#textModeInputEl').evaluate(el => el === document.activeElement), true);
        await page.evaluate(() => setTextMode(false));
        await page.setViewportSize({ width: 1440, height: 1000 });
        await page.evaluate(() => openPreferences());
        await page.screenshot({ path: path.join(__dirname, 'preferences-desktop.png') });
        // A dynamically created combat entry must follow the same switch immediately.
        await page.evaluate(() => {
            closePreferences();
            const button = createCombatButton('Text mode', () => setTextMode(true), { className: 'combat-text-toggle' });
            button.id = 'testCombatTextModeBtn'; document.getElementById('chatOptionsEl').appendChild(button);
        });
        assert.equal(await page.locator('#testCombatTextModeBtn').isVisible(), true);
        await page.evaluate(() => setShowTextMode(false));
        assert.equal(await page.locator('#testCombatTextModeBtn').isVisible(), false);
        await page.evaluate(() => setShowTextMode(true));
        assert.equal(await page.locator('#testCombatTextModeBtn').isVisible(), true);
        await page.evaluate(() => localStorage.setItem('cyoaftwShowTextMode', 'invalid'));
        await load(true);
        assert.equal(await toggle.isVisible(), false, 'unknown stored values do not opt in');
        await page.evaluate(() => localStorage.setItem('cyoaftwShowTextMode', 'on'));
        await page.addInitScript(() => { Storage.prototype.getItem = () => { throw new Error('Storage blocked'); }; Storage.prototype.setItem = () => { throw new Error('Storage blocked'); }; });
        await load(true);
        assert.equal(await toggle.isVisible(), false, 'blocked storage defaults off');
        await page.evaluate(() => openPreferences()); await box.check();
        await page.locator('#preferencesCloseBtn').click();
        assert.equal(await toggle.isVisible(), true, 'toggle still works when storage is unavailable');
        assert.deepEqual(errors, []);
        console.log('PASS preferences: default off, persisted on/off, stable compass, focus/Enter, cancellation, combat visibility, mobile, invalid/blocked storage; no page errors.');
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
