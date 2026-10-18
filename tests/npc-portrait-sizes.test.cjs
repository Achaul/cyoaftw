const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(process.argv[2] || 'C:/Git/CYOADEV/cyoaftw-engine-CORE.js', 'utf8');
function harness(savedSize, storageFails = false) {
    function element() {
        const classes = new Set(), props = {};
        return { width: 171, style: { props, setProperty: (key, value) => { props[key] = value; } },
            getBoundingClientRect() { return { width: this.width }; },
            classList: { contains: key => classes.has(key), toggle(key, on) { on ? classes.add(key) : classes.delete(key); } }
        };
    }
    const elements = Object.fromEntries(['roomImageWrapEl', 'roomPortraitColumnEl', 'roomNpcPortraitEl', 'chatPanelEl', 'playerPortraitEl'].map(id => [id, element()]));
    const saved = new Map(savedSize === undefined ? [] : [['cyoaftwPortraitSize', savedSize]]);
    const c = { window: {}, document: { getElementById: id => elements[id] || null },
        localStorage: { getItem(key) { if (storageFails) throw Error('Unavailable'); return saved.get(key); },
            setItem(key, value) { if (storageFails) throw Error('Unavailable'); saved.set(key, value); } },
        applyLeftPanelState() {}
    };
    vm.createContext(c);
    const start = source.indexOf('function applyPortraitColumnState(');
    const end = source.indexOf('function installPortraitSpacingObserver(', start);
    assert(start >= 0 && end > start);
    vm.runInContext(source.slice(start, end), c);
    return { c, elements, saved };
}
function activeSize(elements) {
    const classes = elements.roomImageWrapEl.classList;
    return classes.contains('portrait-large') ? 'large' : classes.contains('portrait-small') ? 'small' : 'medium';
}

test('new and invalid preferences default to medium', () => {
    for (const saved of [undefined, 'invalid']) {
        const { c, elements } = harness(saved);
        assert.equal(c.getPortraitSize(), 'medium');
        c.setNPCPortraitVisible(true);
        assert.equal(activeSize(elements), 'medium');
        assert.equal(elements.roomImageWrapEl.style.props['--player-portrait-size'], '171px');
    }
});

test('clicking cycles medium to large to small and back, persisting each choice', () => {
    const { c, elements, saved } = harness(); c.setNPCPortraitVisible(true);
    for (const size of ['large', 'small', 'medium', 'large']) {
        c.togglePortraitSize();
        assert.equal(activeSize(elements), size);
        assert.equal(saved.get('cyoaftwPortraitSize'), size);
    }
});

test('existing small and large choices and the new medium survive reopening portraits', () => {
    for (const size of ['small', 'medium', 'large']) {
        const { c, elements } = harness(size);
        c.setNPCPortraitVisible(true);
        assert.equal(activeSize(elements), size);
        assert.equal(c.portraitSizeIsLarge(), size === 'large');
        c.setNPCPortraitVisible(false); c.setNPCPortraitVisible(true);
        assert.equal(activeSize(elements), size);
    }
});

test('clicking still cycles when local storage is unavailable', () => {
    const { c, elements } = harness(undefined, true);
    c.setNPCPortraitVisible(true);
    for (const size of ['large', 'small', 'medium']) {
        c.togglePortraitSize(); assert.equal(activeSize(elements), size);
    }
});

test('medium tracks player width changes and retains its size while the sidebar is hidden', () => {
    const { c, elements } = harness();
    elements.playerPortraitEl.width = 162;
    c.syncPortraitHeaderSpacing();
    assert.equal(elements.roomImageWrapEl.style.props['--player-portrait-size'], '162px');
    elements.playerPortraitEl.width = 0;
    c.syncPortraitHeaderSpacing();
    assert.equal(elements.roomImageWrapEl.style.props['--player-portrait-size'], '162px');
    elements.playerPortraitEl.width = 171;
    c.syncPortraitHeaderSpacing();
    assert.equal(elements.roomImageWrapEl.style.props['--player-portrait-size'], '171px');
    assert.equal(elements.chatPanelEl.style.marginTop, '');
});
