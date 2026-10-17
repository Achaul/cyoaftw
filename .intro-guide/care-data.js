// Intro delivery is authored. AI may select a delivery, never extend it.
const GUIDE_CARE_LINES = {
    checkin: [
        '"There you are, {player}. How are you holding up?"',
        '"{player}. I am glad I found you. How are you doing?"'
    ],
    checkinHurt: [
        '"{player}, you are hurt. Do you want to see to that before we talk?"',
        '"There you are. You are hurt, {player}. What do you need first?"'
    ],
    fine: [
        '"I am glad. What would help you most right now?"',
        '"Good to hear. What do you want to tackle first?"'
    ],
    fineHurt: [
        '"Alright. If that changes, say so. Do you want to hear about resting, or get on with things?"',
        '"I hear you. You are still hurt, though. Shall we talk about resting, or would you rather carry on?"'
    ],
    rattled: [
        '"We can leave the plans for a moment. Would you rather have some quiet, or talk about what to do?"',
        '"You do not have to explain. Do you want a moment, or would something practical help?"'
    ],
    hurt: [
        '"Then let us put the plans aside. Do you want to know how to tend your wounds?"',
        '"Your wounds come first. Shall we talk about how to mend?"'
    ],
    who: [
        '"I am {relation}. You need not take my advice. What would help right now?"'
    ],
    pause: [
        '"Take your time. I will be here when you want to talk."',
        '"Alright. We can talk when you are ready."'
    ],
    first: [
        '"What do you need first: training, coin, or a place to start looking?"',
        '"What would help most: getting stronger, finding work, or following your lead?"'
    ]
};

// These short variants carry the same intent; no invented observations,
// metaphors, consolation speeches, or claims to have helped off screen.
const GUIDE_CARE_VOICE = {
    elf: {
        checkin: ['"{player}. It is good to see you. How are you holding up?"'],
        rattled: ['"There is time. Would you prefer quiet, or shall we think through the next step?"']
    },
    dwarf: {
        checkin: ['"There you are, {player}. How are you doing? Tell me plain."'],
        rattled: ['"We can wait. Do you want quiet, or something useful to get on with?"']
    },
    halfling: {
        checkin: ['"{player}, there you are. How are you, really?"'],
        rattled: ['"Oh, {player}. We can put the plans aside. Quiet, or a little help deciding?"']
    },
    orc: {
        checkin: ['"{player}. Good to see you. What do you need?"'],
        rattled: ['"We wait, then. Unless you want something to do. Your choice."']
    },
    dragonborn: {
        checkin: ['"{player}. I am glad to find you. How do you fare?"'],
        rattled: ['"Then the plans can wait. Would you prefer a moment, or a next step?"']
    },
    goblin: {
        checkin: ['"{player}! Found you. How are you doing?"'],
        rattled: ['"No rush, no rush. Want quiet? Or shall we work out what comes next?"']
    }
};

const GUIDE_CARE_READY_REPLIES = [
    { label: "Help me decide", say: "Help me work out what to do first.", stance: "friendly", guideTalk: "first-choice" },
    { label: "What do you know about my lead?", say: "What do you know about my lead?", stance: "guarded", guideTalk: "hook" },
    { label: "I need a moment", say: "I need a moment.", stance: "guarded", guideTalk: "pause" }
];
const GUIDE_CARE_REST_REPLY = { label: "How can I heal?", say: "How can I tend my wounds?", stance: "friendly", guideTalk: "care-rest" };

// Each reaction answers the actual archetype reply, rather than treating all
// guarded/hostile replies as interchangeable attitude.
const GUIDE_HOOK_LISTENING = {
    "coming-of-age": {
        friendly: '"Let us pick a first step, then. What would help most?"',
        guarded: '"Of course. We can leave it there until you are ready."',
        hostile: '"You decide what you do. I will give advice when you ask for it."'
    },
    revenge: {
        friendly: '"We can start with the lead. Or is there something you need first?"',
        guarded: '"I cannot promise what we will find. You can ask for yourself before deciding to go further."',
        hostile: '"Your way, then. I will not come with you unless you ask."'
    },
    redemption: {
        friendly: '"You are still trying. What would help you begin?"',
        guarded: '"You do not have to settle that with me. We can start with something you choose to do."',
        hostile: '"I hear you. I will leave the choice to you."'
    },
    "missing-kin": {
        friendly: '"Then we can start asking. Is there anything you need before that?"',
        guarded: '"I cannot promise what the answer will be. We can ask one question at a time, if you want."',
        hostile: '"Alright. I will not follow you unless you ask."'
    },
    fortune: {
        friendly: '"Honest work first. Shall we look at what you need to begin?"',
        guarded: '"You have reason to question me. Check the work for yourself before you agree to it."',
        hostile: '"You choose where to go. I will wait until you ask me along."'
    },
    exile: {
        friendly: '"Then we keep it quiet. What do you need first?"',
        guarded: '"You do not have to trust me on my word. Decide for yourself how much to tell anyone."',
        hostile: '"Alright. I will not come with you unless you ask."'
    },
    calling: {
        friendly: '"Then we can start there. Do you need anything before you go?"',
        guarded: '"You do not have to decide what it means yet. We can take one step and see."',
        hostile: '"It is your choice. I will not press you."'
    }
};

// Only plain, unambiguous self-reports use the authored intro route. Questions
// and longer accounts remain available to normal conversation.
function matchGuideCheckinReply(text) {
    const t = String(text || "").toLowerCase().replace(/[.!?]+$/g, "").replace(/[’]/g, "'").trim();
    if (/^(?:i |i'm |i am )?(?:need a moment|need some space|need a minute|give me a moment|give me a minute|leave me alone)$/.test(t)) return "pause";
    if (/^(?:i'm|i am|i feel) (?:a bit |really |still )?(?:shaken|rattled|scared|afraid|overwhelmed|not (?:fine|okay|ok|alright))$/.test(t)) return "checkin-rattled";
    if (/^(?:i'm|i am) (?:hurt|wounded|injured|bleeding)$/.test(t)) return "checkin-hurt";
    if (/^(?:i'm|i am|i feel) (?:fine|okay|ok|alright|not hurt)(?:,? (?:thanks|thank you))?$/.test(t)) return "checkin-fine";
    if (/^(?:who are you|remind me who you are)$/.test(t)) return "checkin-who";
    return "";
}
