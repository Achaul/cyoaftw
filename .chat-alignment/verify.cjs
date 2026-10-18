const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/Jon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    try {
        const page = await browser.newPage();
        const html = fs.readFileSync(path.join(__dirname, 'cyoaftw-engine-CORE.html'), 'utf8').replace(/<!--[\s\S]*?-->/g, '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
        await page.setContent(html);
        await page.evaluate(() => {
            for (const el of document.body.children) if (el.id !== 'gameWrapper') el.style.display = 'none';
            document.getElementById('gameWrapper').classList.add('active');
            document.getElementById('playerNameEl').textContent = 'Edric';
            document.getElementById('roomNameEl').textContent = 'A male Human';
            document.getElementById('roomDescEl').textContent = 'Tobias Holloway has found you.';
            document.getElementById('roomNpcPortraitEl').classList.add('active');
            document.getElementById('roomNpcPortraitEl').textContent = 'NPC portrait';
            document.getElementById('roomNpcPortraitEl').style.background = '#344c56';
            document.getElementById('chatLogEl').innerHTML = '<div class="chat-message left"><span class="chat-avatar">Tobias Holloway</span><div class="chat-bubble">Edric. I am glad I found you. How are you doing?</div></div>';
            const options = document.getElementById('chatOptionsEl');
            for (const [group, labels] of Object.entries({ Reply: ["I'm fine", 'A bit rattled', "I'm hurt", 'Who are you?', 'Respond…'], Topics: ['Ask about the inn', 'Ask about moonbloom nectar', 'Ask for a rumor', 'Ask about the old gods'], Manner: ['Compliment them', 'Tease playfully'], Actions: ['What should I do next?', 'Ask a question', 'Offer to buy a drink', 'Ask Tobias to follow you', 'Ask where to learn magic', 'Leave'] })) {
                const title = document.createElement('div'); title.textContent = group; title.style.cssText = 'width:100%;font-size:10px;color:#999;text-align:center'; options.append(title);
                for (const label of labels) { const btn = document.createElement('button'); btn.className = 'chat-option-btn'; btn.textContent = label; options.append(btn); }
            }
        });
        assert.equal(await page.locator('#gameWrapper').evaluate(el => getComputedStyle(el).display), 'grid', 'Preview stylesheet must be active');
        for (const width of [1821, 1200, 900, 390]) {
            await page.setViewportSize({ width, height: 845 });
            for (const mode of ['', 'has-portrait-column', 'has-portrait-column portrait-large', 'has-npc-full', 'has-npc-full full-large']) {
                for (const collapsed of [false, true]) {
                    await page.evaluate(({ mode, collapsed }) => {
                        document.getElementById('roomImageWrapEl').className = mode;
                        document.getElementById('gameWrapper').classList.toggle('left-collapsed', collapsed);
                        document.getElementById('roomPortraitColumnEl').classList.toggle('active', mode.includes('has-portrait-column'));
                        document.getElementById('roomNpcFullEl').classList.toggle('active', mode.includes('has-npc-full'));
                    }, { mode, collapsed });
                    const result = await page.evaluate(() => {
                        const rect = id => document.getElementById(id).getBoundingClientRect();
                        const room = rect('roomImageWrapEl'), opts = rect('chatOptionsEl'), log = rect('chatLogEl');
                        const button = document.querySelector('#chatOptionsEl button'); const b = button.getBoundingClientRect();
                        return { left: opts.left - room.left, right: opts.right - room.right, logOffset: log.left - room.left, inset: parseFloat(getComputedStyle(document.getElementById('roomImageWrapEl')).paddingLeft), hit: document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2) === button };
                    });
                    const label = `${width}px ${mode || 'no portrait'} collapsed=${collapsed}`;
                    assert(Math.abs(result.left) < 1, label + ' left: ' + result.left);
                    assert(Math.abs(result.right) < 1, label + ' right: ' + result.right);
                    assert(Math.abs(result.logOffset - result.inset) < 1, label + ' dialogue inset');
                    assert(result.hit, label + ' button blocked by portrait');
                }
            }
        }
        await page.setViewportSize({ width: 1821, height: 845 });
        await page.evaluate(() => {
            document.getElementById('roomImageWrapEl').className = 'has-portrait-column';
            document.getElementById('gameWrapper').classList.remove('left-collapsed');
            document.getElementById('roomPortraitColumnEl').classList.add('active');
            document.getElementById('roomNpcFullEl').classList.remove('active');
        });
        await page.screenshot({ path: path.join(__dirname, 'chat-options-desktop.png') });
        console.log('40 layouts verified: flush on both edges, dialogue inset preserved, buttons clickable across portrait sizes and sidebar states.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
