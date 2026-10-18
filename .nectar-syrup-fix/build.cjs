const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const input = process.argv[2] || 'C:/Git/CYOADEV/cyoaftw-engine-CORE.js';
const bytes = fs.readFileSync(input);
let core = bytes.toString('utf8');
function once(before, after) {
    if (core.split(before).length !== 2) throw new Error('Expected one match: ' + before);
    core = core.replace(before, after);
}
once('item.liquidContent === "moonbloom-nectar" ||', '(item.liquidContent === "moonbloom-nectar" || item.liquidContent === "nectar-syrup") ||');
once('/^moonbloom-nectar(?:-|$)/.test(String(item.id || ""))', '/^(?:moonbloom-nectar|nectar-syrup)(?:-|$)/.test(String(item.id || ""))');
once('/^moonbloom-nectar(?:-|$)/.test(String(item.stackKey || ""))', '/^(?:moonbloom-nectar|nectar-syrup)(?:-|$)/.test(String(item.stackKey || ""))');
once(')?moonbloom nectar$/i', ')?(?:moonbloom nectar|nectar syrup)$/i');
// Syrup and old nectar vials have different values/container returns. Keep
// their inventory entries separate, including partially used stacks.
once('return "nectar:" + getNectarCapacityDrops(item)', 'return "nectar:" + getItemName(item).toLowerCase() + ":" + getNectarCapacityDrops(item)');
once('"No moonbloom nectar"', '"No nectar"');
once('"Choose a container of moonbloom nectar."', '"Choose a container of nectar."');
once('" of moonbloom nectar onto "', '" of nectar onto "');
once('"You have no moonbloom nectar to offer."', '"You have no nectar to offer."');
fs.writeFileSync(path.join(__dirname, 'before.js'), bytes);
fs.writeFileSync(path.join(__dirname, 'cyoaftw-engine-CORE.js'), core);
fs.writeFileSync(path.join(__dirname, 'baseline.sha256'), crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase() + '\n');
console.log('Built nectar syrup compatibility fix from current development engine.');
