function parseTextCraftCommand(raw) {
    if(textModeInCombat()&&textCombatActions().some(function(action){return textCombatActionMatches(action,raw);}))return null;
    let m=/^(?:alchemy|crafting|craft)(?:\s+(.+))?$/i.exec(raw);
    if(m){const target=textCommandUnquote(m[1]||"");return {verb:"craft",args:{action:target&&!/^(?:at\s+)?(?:the\s+)?alchemy table$/i.test(target)?"brew":"menu",target:target}};}
    if(/^poisons?(?:\s+bench)?$/i.test(raw))return {verb:"craft",args:{action:"poisons"}};
    m=/^brew(?:\s+(.+))?$/i.exec(raw);if(m)return {verb:"craft",args:{action:"brew",target:textCommandUnquote(m[1]||"")}};
    m=/^(prepare|prep|cut|mince|mash)(?:\s+(.+))?$/i.exec(raw);
    if(m&&!/^troph(?:y|ies)\b/i.test(m[2]||""))return {verb:"craft",args:{action:/^(prep|prepare)$/i.test(m[1])?"prepare":m[1].toLowerCase(),target:textCommandUnquote(m[2]||"")}};
    if(/^(?:mix|mix something new|experiment)$/i.test(raw))return {verb:"craft",args:{action:"mix"}};
    if(/^(?:experiment with poisons?|mix poison|poison mix)$/i.test(raw))return {verb:"craft",args:{action:"poisonmix"}};
    m=/^add\s+(.+)$/i.exec(raw);if(m)return {verb:"craft",args:{action:"add",target:textCommandUnquote(m[1])}};
    if(/^(boil|stir|simmer|extract)$/i.test(raw))return {verb:"craft",args:{action:raw.toLowerCase()}};
    m=/^(start|undo|clear)(?:\s+(?:mix|process))$/i.exec(raw);if(m)return {verb:"craft",args:{action:m[1].toLowerCase()}};
    m=/^(?:bottle|collect|taste|dab|drink|sip|discard|pour out)\s+(?:the\s+)?(?:mixture|bowl|brew)(?:\s+(?:on\s+)?skin)?$/i.exec(raw);
    if(m){const verb=raw.split(/\s+/)[0].toLowerCase();return {verb:"craft",args:{action:/^(collect|bottle)$/.test(verb)?"bottle":/^sip$/.test(verb)?"drink":/^(discard|pour)$/.test(verb)?"discard":verb}};}
    m=/^dip\s+(.+?)(?:\s+in\s+(?:the\s+)?(?:mixture|bowl))?$/i.exec(raw);if(m)return {verb:"craft",args:{action:"dip",target:textCommandUnquote(m[1])}};
    m=/^coat(?:\s+weapon)?\s+with\s+(.+)$/i.exec(raw);if(m)return {verb:"craft",args:{action:"coat",target:textCommandUnquote(m[1])}};
    m=/^name\s+mixture(?:\s+(.+))?$/i.exec(raw);if(m)return {verb:"craft",args:{action:"name",target:textCommandUnquote(m[1]||"")}};
    return null;
}
function textCraftShow(topic) {
    if(!/^(craft|crafting|alchemy|recipes|ingredients|mix|process|bowl|poisons)$/.test(topic))return null;
    const a=ensureAlchemyState(G.player),table=craftTable(),known=ensurePoisonKnowledge(G.player);
    if(topic==="ingredients"){
        const rows=getAlchemyOwnedEntries();return textModeResult("completed","Visible carried ingredients:\n"+(rows.length?rows.map(function(r,i){return (i+1)+". "+r.label+" ×"+r.count;}).join("\n"):"None.")+"\nUse prepare <plant>, mix, then add <ingredient>.",{craft:{view:"ingredients",items:rows.map(function(r){return {name:r.label,quantity:r.count};})}});
    }
    if(/^(mix|process)$/.test(topic))return textModeResult("completed","Queued process: "+describeAlchemyQueue(craftDraftScene&&craftDraftScene.player===G.player&&craftDraftScene.room===G.activeRoom&&craftDraftScene.table===table&&craftDraftScene.list===G.activeRoom.structural?alchemyQueue:[])+". Use mix to edit; start mix to review its costs.");
    if(topic==="bowl")return textModeResult("completed",table?describeAlchemyBowl(table)+". Use bottle mixture, taste mixture, dab mixture, drink mixture, dip <item>, or discard bowl.":"There is no visible alchemy table here.",{craft:{view:"bowl",description:table?describeAlchemyBowl(table):"No bowl."}});
    const recipes=Object.keys(ALCHEMY_RECIPES).filter(function(id){return a.known[id];}).map(function(id){const r=ALCHEMY_RECIPES[id];return {name:r.name,ingredients:r.ingredients.map(function(k){return getAlchemyIngredientDef(k).name;}),blockedReason:getAlchemyBlockReason()||getAlchemyIngredientBlock(r.ingredients,true)};});
    const poisons=Object.keys(POISON_RECIPES).filter(function(id){return known[id];}).map(function(id){const r=POISON_RECIPES[id];return {name:r.name,ingredients:r.ingredients.map(function(k){return POISON_INGREDIENTS[k].name;}),blockedReason:getPoisonBrewBlockReason(r)};});
    return textModeResult("completed","Known recipes:\n"+recipes.concat(poisons).map(function(r){return r.name+": "+r.ingredients.join(" + ")+(r.blockedReason?" — unavailable: "+r.blockedReason:"");}).join("\n")+"\nUse alchemy or poisons for numbered actions. Brew <recipe> reviews ingredients, stamina and turns before confirmation. Experiment outcomes remain unknown until tested.",{craft:{view:"recipes",recipes:recipes,poisons:poisons}});
}
function craftMatches(menu,action,target) {
    let options=menu.options.filter(function(c){return c.meta.action===action;});
    if(target)options=textLootMatch(target,options,function(c){return c.meta.name||c.meta.key;});return options;
}
async function chooseCraftIntent(menu,action,target,foreground) {
    const choices=craftMatches(menu,action,target);
    if(choices.length!==1)return textModeResult("needs_input","Choose the exact action from options. No crafting resources have been spent.");
    return foreground?textRunSharedChoice(menu,choices[0]):runSharedChoice(menu,choices[0]);
}
async function routeCraftIntent(action,foreground) {
    const args=action.args||{},verb=args.action||"menu",target=args.target||"";
    let menu=sharedChoiceState.menu;
    if(verb==="menu"&&menu&&/^craft-/.test(menu.kind))return showSharedChoiceMenu(menu);
    if(menu&&menu.kind==="craft-name"&&verb==="name")return menu.submitName(target);
    if(menu&&menu.kind==="craft-confirm")return textModeResult("needs_input","Review the costs and use choose <number> to confirm, or back/cancel. A command plan cannot supply confirmation.");
    if(verb==="name"&&menu&&menu.kind==="craft-alchemy")return chooseCraftIntent(menu,"name",target,foreground);
    if(verb==="poisons"){openPoisonMenu();return {status:"needs_input"};}
    if(verb==="poisonmix"){if(getRogueRank(G.player)<ROGUE_POISON_MIN_RANK)return textModeResult("blocked","You need poison training to experiment at this bench.");openPoisonMixMenu(null);return {status:"needs_input"};}
    if(verb==="mix"){openAlchemyQueueMenu();return {status:"needs_input"};}
    if(verb==="brew"){
        if(!menu||!/^craft-(alchemy|poisons)$/.test(menu.kind))openAlchemyMenu();
        menu=sharedChoiceState.menu;
        if(!target)return showSharedChoiceMenu(menu);
        if(!craftMatches(menu,"brew",target).length){
            const known=ensurePoisonKnowledge(G.player),names=Object.keys(POISON_RECIPES).filter(function(id){return known[id];}).map(function(id){return {name:POISON_RECIPES[id].name};});names.push({name:"antitoxin"});
            if(textLootMatch(target,names,function(r){return r.name;}).length)openPoisonMenu();
        }
        return chooseCraftIntent(sharedChoiceState.menu,"brew",target,foreground);
    }
    if(verb==="prepare"||/^(cut|mince|mash)$/.test(verb)){
        if(menu&&menu.kind==="craft-prep"&&craftMatches(menu,verb,target).length)return chooseCraftIntent(menu,verb,target,foreground);
        openAlchemyPrepMenu(null);menu=sharedChoiceState.menu;
        if(!target)return {status:"needs_input"};
        const plants=craftMatches(menu,"plant",target);
        if(plants.length!==1)return textModeResult("needs_input","Choose one plant by number from the menu.");
        const selected=await runSharedChoice(menu,plants[0]);if(selected.status!=="completed")return selected;
        return verb==="prepare"?{status:"needs_input"}:chooseCraftIntent(sharedChoiceState.menu,verb,"",foreground);
    }
    if(verb==="add"){
        if(menu&&menu.kind==="craft-poison-mix")return chooseCraftIntent(menu,"add",target,foreground);
        if(!menu||!/^craft-(queue|ingredients|actions)$/.test(menu.kind))openAlchemyQueueMenu();
        openAlchemyIngredientPicker();return chooseCraftIntent(sharedChoiceState.menu,"add",target,foreground);
    }
    if(/^(boil|stir|simmer|extract)$/.test(verb)){
        if(!menu||!/^craft-(queue|ingredients|actions)$/.test(menu.kind))openAlchemyQueueMenu();
        openAlchemyActionPicker();return chooseCraftIntent(sharedChoiceState.menu,verb,"",foreground);
    }
    if(/^(start|undo|clear)$/.test(verb)){
        if(menu&&menu.kind==="craft-poison-mix"&&verb==="start")return chooseCraftIntent(menu,"start","",foreground);
        openAlchemyQueueMenu();return chooseCraftIntent(sharedChoiceState.menu,verb,"",foreground);
    }
    if(verb==="dip"){
        openCraftDipMenu(craftTable());return target?chooseCraftIntent(sharedChoiceState.menu,"dip",target,foreground):{status:"needs_input"};
    }
    if(verb==="coat"){openPoisonMenu();return chooseCraftIntent(sharedChoiceState.menu,"coat",target,foreground);}
    if(/^(bottle|taste|dab|drink|discard)$/.test(verb)){
        openAlchemyMenu();return chooseCraftIntent(sharedChoiceState.menu,verb,"",foreground);
    }
    if(verb==="menu"){openAlchemyMenu();return {status:"needs_input"};}
    return textModeResult("blocked","That crafting action is unavailable. Type how craft or options.");
}
async function textCraftMenuInput(menu,action) {
    if(action.verb==="leave"){clearSharedChoiceMenu(menu);alchemyQueue=[];craftDraftScene=null;closeInteractMenu();return {status:"completed"};}
    if(!menu.valid())return textModeResult("blocked","The crafting scene, ingredients or draft changed. Type options to refresh.");
    // Hold the foreground lock across multi-step selectors as well as the final callback.
    textModeState.busy=true;textModeState.paused=true;textModeState.capture=[];
    try{
        const result=await routeCraftIntent(action,false);
        for(let i=0;i<textModeState.capture.length;i++)await textModeState.capture[i];return result;
    }finally{textModeState.capture=null;textModeState.busy=false;renderTextModeStatus();focusTextModeInput();}
}
async function executeTextCraftCommand(action) {
    releaseStaleCraftWork();const reason=craftSceneBlock();if(reason)return textModeResult("blocked",reason);
    if(!craftTable()&&!/^(poisons|coat)$/.test(action.args.action||""))return textModeResult("blocked","You need a visible alchemy table here.");
    const result=await routeCraftIntent(action,false);
    return result.status==="completed"&&sharedChoiceState.menu?{status:"needs_input"}:result;
}
