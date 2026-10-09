const fs = require('fs');
const P = 'nsfw/intimacy-system.js';
let s = fs.readFileSync(P, 'utf8');
const NL = String.fromCharCode(13, 10);
const APOS = String.fromCharCode(39);
const Q = String.fromCharCode(34);
const BS = String.fromCharCode(92);
const BSNL = BS + 'n';
function rep(anchor, replacement, label) {
    const n = s.split(anchor).length - 1;
    if (n !== 1) throw new Error('anchor not unique (' + n + '): ' + label);
    s = s.split(anchor).join(replacement);
}
function L(arr) { return arr.join(NL); }

// ── 1) Replace the phrase-bank detail blocks with goal-oriented ones ──
// Computed as a var before the template (anchor: the _actLine declaration).
rep('    var _actLine = action && action.tool',
L([
'    var _detailBlock = "";',
'    if (_isPenetrationBeat) {',
'        _detailBlock = playerIsBottom',
'            ? "' + BSNL + 'PENETRATION DETAIL - the NPC' + APOS + 's cock is entering YOU; spend most of the beat on the act itself:' + BSNL + '- Show the mechanics physically and concretely: the entry, the stretch, the grip, the drag on each withdrawal - what both bodies are actually doing.' + BSNL + '- Vary the camera between beats: your body' + APOS + 's response, the depth and rhythm, the sound and feel of it.' + BSNL + '- NEVER name raw stats in prose - no size or color labels like ' + Q + 'medium' + Q + ' or ' + Q + 'deep brown' + Q + '. If size or color matter, convey them naturally (' + Q + 'thick' + Q + ', ' + Q + 'dark skin' + Q + ') or not at all.' + BSNL + '- Do NOT reuse any phrase from these instructions or from the sample. Every beat is worded fresh."',
'            : "' + BSNL + 'PENETRATION DETAIL - spend most of the beat on the act itself:' + BSNL + '- Show the mechanics physically and concretely: depth on each stroke, speed, grip, drag, friction, flesh against flesh - what both bodies are actually doing.' + BSNL + '- Vary the camera between beats: sometimes your cock and their grip, sometimes their body' + APOS + 's response, sometimes the rhythm or the sound of it.' + BSNL + '- NEVER name raw stats in prose - no size or color labels like ' + Q + 'medium' + Q + ' or ' + Q + 'deep brown' + Q + '. If size or color matter, convey them naturally (' + Q + 'thick' + Q + ', ' + Q + 'dark skin' + Q + ') or not at all.' + BSNL + '- Do NOT reuse any phrase from these instructions or from the sample. Every beat is worded fresh.";',
'    } else if (_isInsertiveTease) {',
'        _detailBlock = "' + BSNL + 'INSERTION DETAIL - spend most of the beat on the insertion itself:' + BSNL + '- Show it physically and concretely: the push past the resistance, the grip closing around your fingers or tongue, how their flesh yields and spreads.' + BSNL + '- Vary the camera between beats - the opening, their reaction, your view of it.' + BSNL + '- Do NOT reuse any phrase from these instructions or from the sample. Every beat is worded fresh.";',
'    }',
'    var _lengthRule = (_isPenetrationBeat || _isInsertiveTease)',
'        ? "- Four to eight complete, grammatical sentences. Spend most of the beat describing the act itself in physical, concrete detail. Up to 140 words."',
'        : "- Three to six complete, grammatical sentences. Under 90 words.";',
'    var _actLine = action && action.tool'
]),
'no-system detail block vars');

// Replace the old combined detail template line with the computed vars.
const lines = s.split(NL);
const di = lines.findIndex(l => l.indexOf('PENETRATION DETAIL') !== -1 && l.indexOf('${') === 0);
if (di < 0) throw new Error('detail template line not found');
lines[di] = '${_lengthRule}${_detailBlock}';
s = lines.join(NL);

// ── 2) Upgrade the style section with a quality bar ──
rep('- Literal, direct language ("press", "grip", "slide", "clench", "yield"). No metaphors, no purple prose, no fragments.',
L([
'- Literal, physical language: concrete anatomy (' + Q + 'sphincter' + Q + ', ' + Q + 'pucker' + Q + ', ' + Q + 'cheeks' + Q + ', ' + Q + 'the root' + Q + '), never abstractions like ' + Q + 'clenching heat' + Q + ' or ' + Q + 'her warmth' + Q + '.',
'- NEVER write stat words in prose: no ' + Q + 'medium' + Q + ', no size labels as adjectives, no color-word stacks (' + Q + 'deep brown cock' + Q + '). Convey size or color naturally (' + Q + 'thick' + Q + ', ' + Q + 'dark skin' + Q + ') or leave it out.',
'- No adverb pairs or mechanic-speak (' + Q + 'frantic, rougher speed' + Q + '). Pick the vivid concrete detail over the generic one every time.',
'- Vary sentence openings and rhythm between beats - never start two beats the same way.',
'- QUALITY BAR - match this register:',
'  RIGHT: "You bottom out on every stroke and hold there for a beat, the vise-like heat gripping your full length, ${_pos} puffy sphincter dragging at your root."',
'  RIGHT: "You hammer ${_pos} ass in full strokes, your thighs slapping ${_pos} cheeks with each drive, the ring pinching tight behind your crown on every withdrawal."',
'  WRONG: "You drive your medium deep brown cock into ${_pos} clenching heat with a frantic, rougher speed."',
'  Wrong means: stacked adjectives, stat words, adverb pairs, abstract nouns where anatomy belongs.'
]),
'style line');

// ── 3) Strengthen the sample framing: rewrite for quality, not summary ──
rep('but write the whole beat fresh, as clean prose in a published novel.',
'but write the whole beat fresh, as clean prose in a published novel. This is a rewrite for QUALITY, not a summary: the output must read better than the input - more concrete, more physical, better rhythm - while keeping exactly the same facts.',
'sample framing line');

fs.writeFileSync(P, s);
console.log('no-system prompt quality patches applied');
