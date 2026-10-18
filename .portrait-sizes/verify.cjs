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
    const html = fs.readFileSync(path.join(__dirname, 'cyoaftw-engine-CORE.html'), 'utf8').replace(/<!--[\s\S]*?-->/g, '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(html + files.map(f => '<script src="/' + f + '"></script>').join(''));
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    try {
        const page = await browser.newPage(); const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto('http://127.0.0.1:' + server.address().port);
        await page.evaluate(() => {
            localStorage.removeItem('cyoaftwPortraitSize'); localStorage.removeItem('cyoaftwLeftPanelCollapsed');
            for (const el of document.body.children) if (el.id !== 'gameWrapper') el.style.display = 'none';
            document.getElementById('gameWrapper').classList.add('active');
            document.getElementById('playerPortraitEl').classList.add('active');
            document.getElementById('playerPortraitEl').textContent = 'Player portrait';
            document.getElementById('playerPortraitEl').style.background = '#344c56';
            document.getElementById('playerNameEl').textContent = 'Edric';
            document.getElementById('roomNameEl').textContent = 'NPC portrait sizes';
            setNPCPortraitVisible(true);
            document.getElementById('roomNpcPortraitEl').textContent = 'NPC portrait';
            document.getElementById('roomNpcPortraitEl').style.background = '#344c56';
            document.getElementById('chatOptionsEl').innerHTML = '<button class="chat-option-btn">Who are you?</button>';
            installPortraitSpacingObserver();
        });
        const measure = () => page.evaluate(() => {
            const rect = id => document.getElementById(id).getBoundingClientRect();
            const npc = rect('roomNpcPortraitEl'), player = rect('playerPortraitEl'), room = rect('roomImageWrapEl'), opts = rect('chatOptionsEl');
            return { npc: npc.width, npcHeight: npc.height, player: player.width, left: opts.left - room.left, right: opts.right - room.right };
        });
        for (const width of [1821, 1200, 900, 390, 320]) {
            await page.setViewportSize({ width, height: 845 });
            await page.evaluate(() => applyPortraitSize('medium'));
            const medium = await measure();
            if (width > 900) assert(Math.abs(medium.npc - medium.player) < 1, JSON.stringify(medium));
            await page.evaluate(() => applyPortraitSize('small')); const small = await measure();
            await page.evaluate(() => applyPortraitSize('large')); const large = await measure();
            assert(small.npc < medium.npc && medium.npc < large.npc, `${width}: ${small.npc}/${medium.npc}/${large.npc}`);
            for (const size of [small, medium, large]) {
                assert(Math.abs(size.left) < 1 && Math.abs(size.right) < 1, 'Options must stay flush');
                assert(Math.abs(size.npc - size.npcHeight) < 1, 'Portrait must stay square');
            }
            console.log(`${width}px: small ${small.npc}, medium ${medium.npc}, large ${large.npc}`);
        }
        await page.setViewportSize({ width: 1440, height: 845 });
        await page.evaluate(() => {
            const tall = document.createElement('div'); tall.style.height = '2000px'; document.getElementById('leftPanel').appendChild(tall);
            applyPortraitSize('medium');
        });
        let measured = await measure();
        assert(Math.abs(measured.npc - measured.player) < 1, 'Match even when sidebar scrolls');
        await page.evaluate(() => document.getElementById('gameWrapper').classList.add('left-collapsed'));
        assert(Math.abs((await measure()).npc - measured.npc) < 1, 'Collapse retains size');
        await page.evaluate(() => { document.getElementById('gameWrapper').classList.remove('left-collapsed'); document.getElementById('leftPanel').lastElementChild.remove(); applyPortraitSize('medium'); });
        for (const size of ['large', 'small', 'medium']) {
            await page.locator('#roomNpcPortraitEl').click();
            assert.equal(await page.evaluate(() => getPortraitSize()), size);
        }
        measured = await measure(); assert(Math.abs(measured.npc - measured.player) < 1);
        await page.screenshot({ path: path.join(__dirname, 'portrait-medium.png') });
        assert.deepEqual(errors, []);
        console.log('Verified desktop match, all three responsive sizes, click cycle, sidebar collapse, and flush chat options.');
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
