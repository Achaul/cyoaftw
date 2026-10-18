const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(process.argv[2] || 'C:/Git/CYOADEV/cyoaftw-engine-CORE.js', 'utf8');
const context = vm.createContext({});
const start = source.indexOf('function buildChatTextParts(');
const end = source.indexOf('function shouldAnimateChatMessage(', start);
assert(start >= 0 && end > start);
vm.runInContext(source.slice(start, end), context);
const parts = (side, text, options) => JSON.parse(JSON.stringify(context.getChatTextRenderParts(side, text, options)));

test('player bubbles drop canned speech prefixes and style the actual words as speech', () => {
    for (const prefix of ['You say, ', 'You ask, ', ' You say: ', 'you say ']) {
        for (const mode of ['narration', 'auto', 'spoken']) {
            assert.deepEqual(parts('player', prefix + '"Who are you?"', { mode }), [
                { text: '"Who are you?"', className: 'player-speech' }
            ]);
        }
    }
    for (const text of ['You say, “What do you know about my lead?”', 'You say, <What do you know about my lead?>']) {
        assert.deepEqual(parts('player', text, { mode: 'narration' }), [
            { text: '"What do you know about my lead?"', className: 'player-speech' }
        ]);
    }
});

test('action narration, NPC lines, and words inside dialogue remain intact', () => {
    for (const text of ['You wave.', 'You say goodbye and step away.', 'You say you would like to talk again.', 'You ask what you should do next.']) {
        assert.deepEqual(parts('player', text, { mode: 'narration' }), [{ text, className: 'player-voice' }]);
    }
    const npc = 'You say, "Fine."';
    assert.deepEqual(parts('left', npc, { mode: 'narration' }), [{ text: npc, className: 'npc-voice' }]);
    assert.deepEqual(parts('player', '"You say that every time."'), [{ text: '"You say that every time."', className: 'player-speech' }]);
    assert.deepEqual(parts('player', 'You say, "Hello." You wave.'), [
        { text: '"Hello."', className: 'player-speech' }, { text: 'You wave.', className: 'player-voice' }
    ]);
    assert.deepEqual(parts('player', ''), []);
});
