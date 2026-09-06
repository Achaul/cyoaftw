// Test script for pull-out ejaculation feature
// This tests the logic for showing ejaculation options after pulling out near climax

const path = require('path');

// Mock window object for Node.js
global.window = {
    stats: { gender: 'male' }
};

// Load the intimacy system modules
const intimacySystemPath = path.join(__dirname, 'intimacy-system.js');
const intimacyActsPath = path.join(__dirname, 'intimacy-data-acts.js');
const intimacyContextPath = path.join(__dirname, 'intimacy-data-context.js');
const intimacyMatrixPath = path.join(__dirname, 'intimacy-data-matrix.js');

// Load files in order
require(intimacyActsPath);
require(intimacyContextPath);
require(intimacyMatrixPath);
require(intimacySystemPath);

console.log('Testing pull-out ejaculation feature...\n');

// Test 1: Check that ejaculate_on actions exist
console.log('Test 1: Checking ejaculate_on actions exist');
const ejaculateActions = [
    'ejaculate_on_face',
    'ejaculate_on_chest',
    'ejaculate_on_breasts',
    'ejaculate_on_stomach',
    'ejaculate_on_butt',
    'ejaculate_on_pussy'
];

let allActionsExist = true;
ejaculateActions.forEach(actId => {
    const act = typeof getAct === 'function' ? getAct(actId) : null;
    if (!act) {
        console.log(`  ❌ Action ${actId} NOT FOUND`);
        allActionsExist = false;
    } else {
        console.log(`  ✓ Action ${actId} exists`);
    }
});

if (allActionsExist) {
    console.log('✅ All ejaculate_on actions exist\n');
} else {
    console.log('❌ Some ejaculate_on actions are missing\n');
}

// Test 2: Check that matrix includes ejaculate on for new targets
console.log('Test 2: Checking matrix includes ejaculate on verb for new targets');
if (typeof INTIMACY_MATRIX !== 'undefined' && INTIMACY_MATRIX.penis) {
    const penisMatrix = INTIMACY_MATRIX.penis;
    const hasBreastsEjaculate = penisMatrix.breasts && penisMatrix.breasts.includes('ejaculate on');
    const hasVaginaEjaculate = penisMatrix.vagina && penisMatrix.vagina.includes('ejaculate on');
    
    console.log(`  ${hasBreastsEjaculate ? '✓' : '❌'} penis -> breasts -> ejaculate on`);
    console.log(`  ${hasVaginaEjaculate ? '✓' : '❌'} penis -> vagina -> ejaculate on`);
    
    if (hasBreastsEjaculate && hasVaginaEjaculate) {
        console.log('✅ Matrix includes new ejaculate on verbs\n');
    } else {
        console.log('❌ Matrix missing some ejaculate on verbs\n');
    }
} else {
    console.log('❌ Matrix not loaded\n');
}

// Test 3: Check natural labels
console.log('Test 3: Checking natural labels for new actions');
if (typeof NATURAL_LABELS !== 'undefined') {
    const hasBreastsLabel = NATURAL_LABELS['ejaculate_on_breasts'];
    const hasPussyLabel = NATURAL_LABELS['ejaculate_on_pussy'];
    
    console.log(`  ${hasBreastsLabel ? '✓' : '❌'} ejaculate_on_breasts natural label`);
    console.log(`  ${hasPussyLabel ? '✓' : '❌'} ejaculate_on_pussy natural label`);
    
    if (hasBreastsLabel && hasPussyLabel) {
        console.log('✅ Natural labels exist\n');
    } else {
        console.log('❌ Some natural labels are missing\n');
    }
} else {
    console.log('❌ NATURAL_LABELS not loaded\n');
}

console.log('Test completed!');
