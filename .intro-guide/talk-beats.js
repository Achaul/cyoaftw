// The engine owns the next beat, facts, options, and pacing. Delivery choices
// are complete approved bubbles; the AI can return only their numeric index.
function _buildGuideTalkBeat(beatId, backstory, ctx) {
    const c = ctx || {};
    const map = getBackstoryFillMap(backstory);
    if (c.relation) map.relation = c.relation;
    const f = function (t) { return _spFill(t, map); };
    const copy = function (list) { return list.map(function (r) { return Object.assign({}, r); }); };
    const ready = function () { return copy(GUIDE_CARE_READY_REPLIES); };
    const care = function (key, replies, concern) {
        const voice = GUIDE_CARE_VOICE[_guideOwnSpeciesKey()] || {};
        const deliveries = (voice[key] || []).concat(GUIDE_CARE_LINES[key] || []).map(f);
        const actions = { space: "gives you room and waits quietly", shaken: "gives you their full attention", hurt: "puts the plans aside to listen" };
        return { lines: [_guideTalkPick(deliveries)], deliveries: deliveries, replies: replies, concern: concern || "", action: actions[concern] || "" };
    };
    const firstReplies = function () {
        return copy(GUIDE_TALK_FIRST_REPLIES).concat([copy([GUIDE_CARE_READY_REPLIES[2]])[0]]);
    };
    const answer = function (line) {
        const replies = [];
        if (!c.inParty && !c.partyOffered && typeof getGuidePartyOffer === "function" && getGuidePartyOffer(backstory)) {
            replies.push({ label: "Could you come with me?", say: "Could you come with me?", stance: "friendly", guideTalk: "offer" });
        }
        replies.push({ label: "Ask about something else", say: "There is something else I need to work out.", stance: "guarded", guideTalk: "first-choice" });
        return { lines: [line], replies: replies, plan: true, concern: "ready" };
    };

    if (beatId === "checkin") {
        const replies = copy(GUIDE_TALK_CHECKIN_REPLIES);
        replies[0].say = "I'm alright.";
        replies.splice(2, 0, { label: "I'm hurt", say: "I'm hurt.", stance: "guarded", guideTalk: "checkin-hurt" });
        return care(typeof c.hpFrac === "number" && c.hpFrac < 0.7 ? "checkinHurt" : "checkin", replies);
    }
    if (beatId === "checkin-fine") {
        if (typeof c.hpFrac === "number" && c.hpFrac < 0.7) {
            return care("fineHurt", [copy([GUIDE_CARE_REST_REPLY])[0]].concat(ready()), "ready");
        }
        return care("fine", firstReplies(), "ready");
    }
    if (beatId === "checkin-rattled") return care("rattled", ready(), "shaken");
    if (beatId === "checkin-hurt") return care("hurt", [copy([GUIDE_CARE_REST_REPLY])[0]].concat(ready()), "hurt");
    if (beatId === "checkin-who") return care("who", ready());
    if (beatId === "pause") {
        const replies = ready().slice(0, 2);
        replies[0].label = "I'm ready. Help me decide";
        replies[0].say = "I'm ready now. Help me decide what to do first.";
        return care("pause", replies, "space");
    }
    if (beatId === "care-rest") {
        return { lines: [getGuideTopicAnswer("rest", backstory)], replies: ready(), concern: "hurt" };
    }
    if (beatId === "first-choice") return care("first", firstReplies(), "ready");
    if (beatId === "hook") {
        const spec = backstory ? getGuideSpec(backstory.archetype, _guideOwnSpeciesKey()) : null;
        const replies = spec && Array.isArray(spec.replies) ? copy(spec.replies) : ready();
        if (spec && Array.isArray(spec.replies)) replies.forEach(function (r) { r.guideTalk = "hook-react"; });
        const plan = getGuidePlanText(backstory);
        if (!plan) return care("first", firstReplies());
        return { lines: ['"' + plan + '"'], replies: replies, plan: true };
    }
    if (beatId === "hook-react") {
        const set = GUIDE_HOOK_LISTENING[backstory && backstory.archetype] || {};
        const stance = c.stance || "guarded";
        const line = set[stance] || '"You choose what happens next. What would help?"';
        // A request for time or distance must actually stop the briefing.
        const space = stance === "hostile" || (stance === "guarded" && backstory && backstory.archetype === "coming-of-age");
        return { lines: [f(line)], replies: space ? ready().slice(0, 2) : firstReplies(), concern: space ? "space" : "" };
    }
    if (beatId === "first-strong") return answer(f(_guideTalkPick(GUIDE_TALK_STRONG)));
    if (beatId === "first-coin") return answer(f(_guideTalkPick(GUIDE_TALK_COIN)));
    if (beatId === "first-lead") {
        const plan = getGuidePlanText(backstory);
        return answer(plan ? '"' + f(plan) + '"' : f(GUIDE_TALK_STRONG[0]));
    }
    if (beatId === "first-suggest") {
        const text = getGuideTopicAnswer("next", backstory);
        return answer(text || f(GUIDE_TALK_STRONG[0]));
    }
    if (beatId === "offer") {
        if (c.inParty || c.partyOffered) return care("first", firstReplies());
        const offer = typeof getGuidePartyOffer === "function" ? getGuidePartyOffer(backstory) : null;
        if (!offer) return null;
        return { lines: [offer.line], replies: offer.replies, offered: true };
    }
    if (beatId === "parting" || beatId === "parting-shout") {
        if (c.blessed) return { lines: [f(_guideTalkPick(_guideTalkVoicePool("plain", GUIDE_TALK_PARTING_PLAIN)))], replies: null, advice: false };
        // Keep every blessing fact together, including the one-use limit.
        const pool = beatId === "parting-shout" ? GUIDE_TALK_PARTING_SHOUT : GUIDE_TALK_PARTING;
        return { lines: [f(_guideTalkPick(pool))], replies: null, advice: true };
    }
    return null;
}

function getGuideTalkBeat(beatId, backstory, ctx) {
    return _buildGuideTalkBeat(beatId, backstory, ctx);
}
