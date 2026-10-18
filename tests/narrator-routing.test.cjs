const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(process.argv[2] || 'C:/Git/CYOADEV/cyoaftw-engine-CORE.js', 'utf8');
function section(start, end) {
    const a = source.indexOf(start), b = source.indexOf(end, a);
    assert(a >= 0 && b > a);
    return source.slice(a, b);
}
function harness({ animate = false, chat = true } = {}) {
    function element() {
        return { children: [], dataset: {}, className: '', scrollTop: 0, scrollHeight: 500,
            classList: { add() {} },
            appendChild(child) { this.children.push(child); },
            set textContent(value) { this.children = []; this.text = value; },
            get textContent() { return (this.text || '') + this.children.map(c => c.textContent).join(''); }
        };
    }
    const narration = element(), log = element(), frames = [];
    const c = { narration, log, frames, syncs: 0, options: {},
        document: { getElementById: id => id === 'narrationEl' ? narration : (chat && id === 'chatLogEl' ? log : null), createElement: element },
        syncCombatLayout() { c.syncs++; }, pruneChatLog() {},
        shouldAnimateChatMessage: (_side, _speaker, options) => options.animate === undefined ? animate : options.animate,
        getChatTypingMsPerChar: () => 10, performance: { now: () => 0 },
        requestAnimationFrame(fn) { frames.push(fn); }
    };
    vm.createContext(c);
    vm.runInContext(section('function buildChatTextParts(', 'function shouldAnimateChatMessage('), c);
    vm.runInContext(section('function renderChatBubbleText(', 'function isMerchantLikeNPC('), c);
    vm.runInContext(section('function addNarratorMessage(', "// The player's own line"), c);
    return c;
}

test('Narrator messages from either side append centered narration without bubbles or a chat log', () => {
    const c = harness({ chat: false });
    c.narration.textContent = 'Existing room details.';
    c.addChatMessage('player', 'Narrator', 'You pay for a drink.');
    c.addChatMessage('left', ' narrator ', 'The server sets it down.');
    assert.equal(c.log.children.length, 0);
    assert.equal(c.narration.children.length, 2);
    assert(c.narration.children.every(row => row.className === 'narration-line'));
    assert.equal(c.narration.textContent, 'Existing room details.You pay for a drink.The server sets it down.');
    assert.equal(c.syncs, 2);
});

test('Narrator typing uses the narration scroll area and respects animation options', () => {
    const c = harness({ animate: true });
    const options = { mode: 'spoken', msPerChar: 10 };
    c.addChatMessage('player', 'Narrator', 'You buy a drink.', options);
    assert.equal(c.narration.textContent, '');
    c.frames.shift()(200);
    assert.equal(c.narration.textContent, 'You buy a drink.');
    assert.equal(c.narration.scrollTop, 500);
    assert.equal(c.log.scrollTop, 0);
    assert.equal(options.mode, 'spoken');
    c.addChatMessage('left', 'Narrator', 'You sit.', { animate: false });
    assert.equal(c.narration.children[1].textContent, 'You sit.');
});

test('ordinary NPC and player dialogue still creates bubbles and removes player speech prefixes', () => {
    const c = harness();
    c.addChatMessage('player', 'You', 'You say, "Hello."', { mode: 'narration' });
    c.addChatMessage('left', 'Tobias', '"Welcome."');
    assert.equal(c.narration.children.length, 0);
    assert.equal(c.log.children.length, 2);
    assert.equal(c.log.children[0].className, 'chat-message right');
    assert.equal(c.log.children[0].children[1].textContent, '"Hello."');
    assert.equal(c.log.children[1].className, 'chat-message left');
    assert.equal(c.log.children[1].children[0].textContent, 'Tobias');
});

test('narration uses literal text and skips blank messages', () => {
    const c = harness();
    c.addChatMessage('left', 'Narrator', '<img src=x onerror=alert(1)>', { mode: 'narration' });
    assert.equal(c.narration.children[0].children[0].className, 'chat-fragment npc-voice');
    assert.equal(c.narration.children[0].children[0].children.length, 0);
    c.addChatMessage('left', 'Narrator', '   ');
    assert.equal(c.narration.children.length, 1);
});
