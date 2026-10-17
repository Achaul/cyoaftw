module.exports = function (world, core) {
    const edits = {
        'coming-of-age': {
            blurb: 'You have left home to learn a trade or earn a place. A family friend has offered to help you begin.',
            build: `return "You " + c.craft + ". You left " + s.home + " because " + s.reason + ". " +
                "An old friend of your family has promised to help you get started here.";`,
            persona: "An old friend of the player's family who wants them to build a life of their own. Patient, with dry humour. Asks what they need before advising; takes hesitation seriously and accepts a refusal."
        },
        revenge: {
            blurb: 'Someone wronged you. Their trail leads here, and an old comrade is following it too.',
            build: `return "You " + c.craft + ". Someone " + s.wrong + ", and the trail of " + s.quarry + " has brought you here. " +
                "An old comrade who shares your grudge has come to help you follow it.";`,
            persona: "An old comrade tracking the same trail as the player. Quiet and direct. Separates a lead from proof, checks what the player is ready to do, and never promises revenge will put things right."
        },
        redemption: {
            blurb: 'You cannot undo what you did. You have come here to begin making amends.',
            build: `return "You " + c.craft + ". You " + s.sin + ". Now " + s.penance + ". " +
                "Someone who knew you before has offered to help you begin making amends.";`,
            persona: "A plainspoken priest who knew the player before their wrongdoing and has offered help. Gives practical suggestions without judging their worth or promising forgiveness. Listens to doubt without turning it into a sermon."
        },
        'missing-kin': {
            blurb: 'Someone you care about is missing. The last trail you could find points to this town.',
            build: `return "You " + c.craft + ". " + s.who.charAt(0).toUpperCase() + s.who.slice(1) + " " + s.lastSeen + ". " +
                "Their trail leads here. A friend of theirs is helping you search.";`,
            persona: "A friend of the missing person who is helping the player search. Observant and practical. Cares about the person as well as the search, admits uncertainty, and lets the player set the pace when an answer frightens them."
        },
        fortune: {
            blurb: 'You need coin and a chance to build something. A partner from earlier schemes has come to help.',
            build: `return "You " + c.craft + ". When " + s.need + ", you came here to " + s.dream + ". " +
                "A partner from your earlier schemes has come to help you find work.";`,
            persona: "A quick-talking partner from the player's earlier schemes. Uses a little dry humour when it is welcome. Takes their money worries seriously, gives straight answers about known work, and lets the player check a proposition before agreeing."
        },
        exile: {
            blurb: 'You cannot go home. A friend who vouched for you is helping you find somewhere to start again.',
            build: `const hunters = String(s.hunters || "");
            const pursuit = /^nobody\\b/i.test(hunters)
                ? "You hope to stay unnoticed here. "
                : (hunters ? hunters.charAt(0).toUpperCase() + hunters.slice(1) + " may come looking. " : "");
            return "You " + c.craft + ". You " + s.cause + ", and you cannot go home. " + pursuit +
                "A friend who vouched for you has come to help you start again.";`,
            persona: "A friend who vouched for the player when others would not. Soft-spoken and protective. Offers discreet, practical help, admits they cannot guarantee safety, and does not demand trust or choose how the player faces their past."
        },
        calling: {
            blurb: 'A dream, voice or other sign brought you here. A pilgrim has offered to help you investigate it.',
            build: `return "You " + c.craft + ". Then came " + s.sign + ". You are " + s.feeling + ". " +
                "You followed the sign here. A pilgrim who recognises such signs has offered to help you investigate.";`,
            persona: "An older pilgrim who recognises the kind of sign the player followed. Quiet and curious. Answers questions directly, admits what remains unknown, and never treats a sign as an obligation or declares the player chosen."
        }
    };
    for (const [id, edit] of Object.entries(edits)) {
        const start = world.indexOf('    "' + id + '": {', world.indexOf('const PLAYER_ARCHETYPES ='));
        const end = world.indexOf('\n    },', start) + 7;
        if (start < 0 || end <= start) throw Error('Missing origin ' + id);
        let chunk = world.slice(start, end);
        chunk = chunk.replace(/        blurb: "[^\n]+/, '        blurb: ' + JSON.stringify(edit.blurb) + ',');
        chunk = chunk.replace(/        build: function \(s, c\) \{[\s\S]*?\n        \},/, '        build: function (s, c) {\n            ' + edit.build + '\n        },');
        chunk = chunk.replace(/            persona: "[^\n]+/, '            persona: ' + JSON.stringify(edit.persona) + ',');
        world = world.slice(0, start) + chunk + world.slice(end);
    }
    const replace = (source, before, after) => {
        if (source.split(before).length !== 2) throw Error('Missing origin text: ' + before);
        return source.replace(before, after);
    };
    world = replace(world, 'you wanted to see the world before the world settled you', 'you wanted to see more of the world before settling down');
    // The hometown can be a trade rather than a location; "left" works for both.
    world = replace(world, 'prove everyone wrong with more than they think you deserve', 'earn enough to prove the people who doubted you wrong');
    world = replace(world, 'a fellow chancer who got you into this', 'a partner from your earlier schemes');
    world = replace(world, 'Last time you said that I nearly lost a hand.', 'How do I know I can trust this plan?');
    world = replace(world, 'Before long, " + ctx.guideRelation + " will find you.', 'An acquaintance is expected.'); // replaced below: no foretold arrival
    world = replace(world, '    if (ctx.guideRelation) now += " An acquaintance is expected.";\n', '');
    // Keep useful setting details; remove stock maxims and absolute player traits.
    const prose = [
        ['Chimney smoke drifts over the roofs, and the town hums with people trying to live ordinary lives in a country the Long War has left scarred. Beyond its edge, the broken skyline of old Aldermere stands black against the sky.', 'Chimney smoke hangs over the roofs. Beyond the town, the ruins of Aldermere mark what the Long War left behind.'],
        ['Far below the open sky, {hub} is a lamplit district of stone and iron that carries on as if the war overhead were only weather.', 'Lamps light the stone passages of {hub}, far below the war above.'],
        ['{hub} smells of smoke, old bone and wet stone, and the noise of a warband at rest echoes down every passage.', 'Smoke and the noise of a resting warband fill the wet stone passages of {hub}.'],
        ['{hub} stands on rotting stilts above black water, and the mist keeps its secrets as well as any wall.', 'Mist drifts between the stilts of {hub}. Black water laps against the wood below.'],
        ['Every eye weighs you the moment you arrive, and the weighing is not kind.', 'Few people here look willing to help a stranger.'],
        ['You have never been able to leave a closed door alone, or a question unasked.', 'Unanswered questions tend to hold your attention.'],
        ['You have never been able to walk past someone in trouble.', 'You tend to notice when someone needs help.'],
        ['You have never waited for an invitation into trouble.', 'You are usually willing to make the first move.'],
        ['People notice " + a.feature', 'Your appearance is marked by " + a.feature']
    ];
    for (const [before, after] of prose) world = replace(world, before, after);
    world = replace(world, '// scripted version; the engine may then ask the AI to polish it (see\n// polishOpeningScene) and falls back to this text if that fails.', '// authored version from the selected origin and current start facts.');
    world = replaceSection(world, 'const GUIDE_TALK_PARTING = [', 'const GUIDE_TALK_PARTING_PLAIN = [', `const GUIDE_TALK_PARTING = [
    '\\"Before you go, {player}: ask for a newcomer\'s blessing at the shrine in {chapelPlace}. It is free, binds you to no god, and can save your life once. After that, you would need a patron you have served, strong enough to bring you back.\\"',
    '\\"Please stop at the shrine in {chapelPlace}, {player}. A newcomer\'s blessing is free, binds you to no god, and saves you once. I would like you to have that protection before you take a risk.\\"'
];
const GUIDE_TALK_PARTING_SHOUT = [
    '\\"One thing, {player}: ask for a newcomer\'s blessing at the shrine in {chapelPlace}. Free, binds you to no god, saves your life once.\\"'
];`.replace(/\\"/g, '"').replace(/newcomer's/g, "newcomer\\'s"));
    world = replaceSection(world, 'const GUIDE_PARTY_OFFERS = {', 'const GUIDE_PARTY_REPLIES = [', `const GUIDE_PARTY_OFFERS = {
    "coming-of-age": "I can come with you, {player}. Would that help?",
    "revenge": "I can, {player}. We can follow the trail together if you want.",
    "redemption": "I can come with you, {player}. We can take this at your pace.",
    "missing-kin": "I can, {player}. We can ask together, and stop when you need to.",
    "fortune": "I can come with you, {player}. We can look at the work together before you agree to it.",
    "exile": "I can, {player}. You decide where we go and what we tell people.",
    "calling": "I can come with you, {player}. We can investigate without deciding yet what it means."
};`);
    // Player-authored origins stay verbatim. Authored origins are already concise;
    // a second model rewrite would change canon and reintroduce padding.
    function replaceSection(source, from, to, content) {
        const start = source.indexOf(from), end = source.indexOf(to, start);
        if (start < 0 || end <= start) throw Error(from);
        return source.slice(0, start) + content + '\n\n' + source.slice(end);
    }
    core = replaceSection(core, '// Optional AI pass: turns the template backstory', '// ── OPENING SCENE (intro card)', `// Selected origins are canonical prose. Keep this async entry point for setup
// callers, including player-authored origins, without a second prose rewrite.
async function polishPlayerBackstory(backstory) {
    return backstory;
}`);
    core = replaceSection(core, 'async function polishOpeningScene(', 'async function buildOpeningScene(', `// The opening is assembled from the selected origin and current start facts.
// It needs no model expansion; null makes the caller use the authored template.
async function polishOpeningScene(ctx, template) {
    return null;
}`);
    core = replace(core, '    // The guide follows the first-step answer with the party offer.\n    if (choice && choice.guideBeat === "plan" && typeof maybeOfferGuideParty === "function") maybeOfferGuideParty(npc);', '    // The guide offers company only on a separate player-requested turn.');
    core = replace(core, '// then the AI gives it a unique polish. If the AI is off, slow or returns\n// something odd, the scripted text is used as-is. Nothing here is gameplay:', '// and kept as concise authored prose. Nothing here is gameplay:');
    return { world, core };
};
