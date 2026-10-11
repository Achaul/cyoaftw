const fs = require('fs');
const P = 'nsfw/intimacy-system.js';
let s = fs.readFileSync(P, 'utf8');

// The new combined detail-block line for buildNoSystemScenePrompt's prompt
// template. Uses nested template literals so ${_pos} (the NPC's possessive
// pronoun) interpolates, and splits the penetration block into
// giver-perspective (player penetrating) vs receiver-perspective (NPC
// penetrating the player) wording.
const NEW_LINE = '`${_isPenetrationBeat ? (playerIsBottom ? `\\nPENETRATION DETAIL - the NPC\'s cock is entering YOU; describe the act itself, slowly and vividly, not just the reaction:\\n- Describe it from the receiving side: the head of their cock pressing against your opening, the slow push past your resistant ring, the stretch as you take it inch by inch.\\n- Describe what your body does: your opening yielding, clenching around the shaft, gripping it, the fullness deepening with every inch they sink in.\\n- Describe depth and contact: how deep it sits, their hips meeting your flesh, their weight pressing flush against you.\\n- Slow the motion down on entry and withdrawal - describe each stage, not just the end state.` : `\\nPENETRATION DETAIL - this beat is penetration; describe the ACT ITSELF, slowly and vividly, not just the reaction:\\n- Describe the mechanics of entry and withdrawal: your cock pressing against the opening, the slow slide in, the stretched ring gripping the shaft, the wrinkled skin dragging along it on the pull-back.\\n- Name the cock with its size and color words from the STATE.\\n- Describe depth and body contact: how deep it goes, your hips meeting the soft warm flesh of ${_pos} buttocks, pressing flush against ${_pos}.\\n- Slow the motion down on entry and withdrawal - describe what you see and feel at each stage, not just the end state.`) : ""}${_isInsertiveTease ? `\\nINSERTION DETAIL - this beat slides something of yours into them; describe the insertion itself, slowly and vividly, not just the reaction:\\n- Describe the mechanics: your fingers or tongue pressing against the opening, the slow push past the resistant ring, the warm grip closing around you as you slide deeper.\\n- Describe what the opening does: stretching, yielding, clinging, the wrinkled skin smoothing out as it is filled.\\n- Describe depth and contact: how far in you go, ${_pos} flesh dimpling or spreading under the pressure, ${_pos} body opening around you.\\n- Slow the motion down - describe what you see and feel at each stage, not just the end state.` : ""}`';

// The string above contains literal backticks/escapes for the target file;
// unescape them for this patch script's own source.
const targetLine = NEW_LINE.replace(/\\`/g, '`');

const lines = s.split('\r\n');

// 1) Replace the detail-block template line
const idx = lines.findIndex(l => l.indexOf('PENETRATION DETAIL') !== -1);
if (idx < 0) throw new Error('detail block line not found');
lines[idx] = targetLine;

// 2) Declare _pos (NPC possessive pronoun) right after the insertive-tease flag
const j = lines.findIndex(l => l.indexOf('String(action.verb || "").toLowerCase() === "penetrate")));') !== -1);
if (j < 0) throw new Error('tease flag line not found');
lines.splice(j + 1, 0,
    '    var _pos = (typeof getPossessivePronoun === "function" && npc) ? getPossessivePronoun(npc) : "their";');

s = lines.join('\r\n');
fs.writeFileSync(P, s);
console.log('patched: detail blocks gender-aware');
