// Shared crafting presentation. Native handlers retain the actual game rules.
let activeCraftWork = null, craftDraftScene = null;
function craftSceneBlock() {
    const p=G.player,r=G.activeRoom;
    if(!p||!r||p.hp<=0||p.dead||p.unconscious||p._dying||p._collapsing) return "You cannot work at a table right now.";
    if(G.activeNPC||G.activeObject||G.activeItemModal||G.combatEncounter||G.activeNPCMode==="combat"||hasPendingPartyLoot()) return "Finish the current interaction or decision first.";
    if(roomHasActiveHostile(r)||isRoomCollapsed(r)) return "It is too dangerous to work here.";
    return "";
}
function craftTable() { return G.activeRoom&&Array.isArray(G.activeRoom.structural)&&G.activeRoom.structural.length?findAlchemyTableFixture(G.activeRoom):null; }
function textCraftAvailable() { return !craftSceneBlock() && !!craftTable(); }
function craftItemStamp(item) { return JSON.stringify([choiceItemStamp(item),item.id,item.herbKey,item.prepBase,item.prepMethod,item.poisonKey,item.poisonRecipeKey,item.poison,item.poisonHits,item.mixture,item.liquid,item.statusKey,item.stackKey]); }
function captureCraftState(work) {
    const player=G.player,room=G.activeRoom,mode=G.activeNPCMode,fixture=craftTable(),structural=room.structural;
    const state=ensureAlchemyState(player),known=ensurePoisonKnowledge(player),inventory=choiceEntitySnapshot(player);
    const mixLog=state.mixLog,designs=Object.keys(mixLog).map(function(sig){return {sig:sig,design:mixLog[sig],stamp:JSON.stringify(mixLog[sig])};});
    const items=(player.inventory||[]).map(function(item){return {item:item,stamp:craftItemStamp(item)};});
    const training=JSON.stringify([player.classSkills,player.classBranches,state.skill,state.known,known]);
    const bowl=fixture&&fixture.bowl, bowlStamp=JSON.stringify(bowl||null),rack=fixture&&fixture.vialRack,rackStamp=JSON.stringify(rack||null);
    const turn=getCurrentStoryTurn(),queue=JSON.stringify(alchemyQueue),log=JSON.stringify(state.mixLog);
    return function(){
        if(G.player!==player||G.activeRoom!==room||G.activeNPCMode!==mode||craftSceneBlock()||room.structural!==structural||craftTable()!==fixture||player.alchemy!==state||player.knownPoisons!==known||state.mixLog!==mixLog||!inventory())return false;
        if(designs.some(function(e){return mixLog[e.sig]!==e.design||JSON.stringify(e.design)!==e.stamp;}))return false;
        if(items.some(function(e){return craftItemStamp(e.item)!==e.stamp;})||JSON.stringify([player.classSkills,player.classBranches,state.skill,state.known,known])!==training)return false;
        if(fixture&&(fixture.bowl!==bowl||JSON.stringify(bowl||null)!==bowlStamp))return false;
        return work || (getCurrentStoryTurn()===turn&&JSON.stringify(alchemyQueue)===queue&&JSON.stringify(state.mixLog)===log&&(!fixture||fixture.vialRack===rack)&&JSON.stringify(rack||null)===rackStamp);
    };
}
function beginCraftMenu(kind,title,refresh) {
    const menu=beginSharedChoiceMenu("craft-"+kind,null,title,refresh),valid=menu.valid;
    menu.valid=function(){return valid()&&menu.craftGuard&&menu.craftGuard();};return menu;
}
function publishCraftMenu(menu,el) { menu.craftGuard=captureCraftState(false);publishSharedChoiceMenu(menu,el); }
function craftIntent(fn,action,name,key) { fn.craft={action:action,name:name||"",key:key||""};return fn; }
function createCraftButton(menu,label,run,opts) { return createSharedChoiceButton(menu,label,run,Object.assign({},opts||{},{textChoice:run.craft||{}})); }
function claimCraftDraft() {
    const table=craftTable();
    if(!craftDraftScene||craftDraftScene.player!==G.player||craftDraftScene.room!==G.activeRoom||craftDraftScene.table!==table||craftDraftScene.list!==G.activeRoom.structural) alchemyQueue=[];
    craftDraftScene={player:G.player,room:G.activeRoom,table:table,list:G.activeRoom.structural};
}
function captureCraftWork() {
    const player=G.player,room=G.activeRoom,fixture=craftTable(),mode=G.activeNPCMode;
    let guard=captureCraftState(true);
    const work={player:player,room:room,fixture:fixture,
        sameScene:function(){return G.player===player&&G.activeRoom===room&&G.activeNPCMode===mode;},
        valid:function(){return activeCraftWork===work&&guard()&&(!fixture||!fixture.bowl||!fixture.bowl.doses||getAlchemyBowl(fixture)===fixture.bowl);},
        commitCosts:function(){guard=captureCraftState(true);}
    };
    activeCraftWork=work;return work;
}
function finishCraftWork(work,details) {
    if(activeCraftWork===work){activeCraftWork=null;alchemyPending=false;}
    if(typeof textModeState!=="undefined"&&textModeState.enabled&&G.player===work.player)publishTextModeOutput("craft","Crafting action finished.",{craft:Object.assign({stage:"result"},details)},false);
}
function interruptCraftWork(work) {
    if(activeCraftWork===work){activeCraftWork=null;alchemyPending=false;}
    const message="Crafting was interrupted. Spent time, ingredients and stamina remain spent; any completed effects are preserved. No later brewing effects were granted. Pending commands remain paused.";
    if(work.sameScene()){setNarration(message);saveGameState();}
    return {status:"interrupted",message:message};
}
function releaseStaleCraftWork() {
    if(activeCraftWork&&!activeCraftWork.sameScene()){activeCraftWork=null;alchemyPending=false;alchemyQueue=[];craftDraftScene=null;}
}
function runCraftBowlAction(fixture,fn) {
    const result=fn();if(result&&result.status)return result;
    openAlchemyMenu(__lastAlchemyNarration());return {status:"needs_input"};
}
function getCraftAlchemyTurns(stepCount,prepped) { return Math.max(3,stepCount)+prepped*ALCHEMY_PREP_TURNS; }
function countCraftAutoPrep(keys,autoPrep) {
    const have={};let count=0;
    keys.forEach(function(key){if(have[key]===undefined)have[key]=countAlchemyIngredient(key);if(have[key]>0)have[key]--;else if(autoPrep&&splitAlchemyKey(key).prep)count++;});
    return count;
}
function craftQuoteSpec(kind,data) {
    const block=craftSceneBlock();if(block)return {reason:block};
    if(!craftTable())return {reason:"There is no visible alchemy table here."};
    if(kind==="discard")return {reason:getAlchemyBowl(craftTable())?"":"The bowl is empty.",title:"Discard the extraction bowl",stamina:0,turns:1,ingredients:[]};
    if(kind==="recipe"){
        const r=ALCHEMY_RECIPES[data.id],state=ensureAlchemyState(G.player);
        if(!r||!state.known[data.id])return {reason:"That recipe is not known."};
        return {reason:getAlchemyBlockReason()||getAlchemyIngredientBlock(r.ingredients,true),revision:JSON.stringify(r),title:r.name,stamina:ALCHEMY_STAMINA,turns:getCraftAlchemyTurns(0,countCraftAutoPrep(r.ingredients,true)),ingredients:r.ingredients.map(function(k){return getAlchemyIngredientDef(k).name;})};
    }
    if(kind==="process"){
        const steps=data.steps,info=getAlchemyProcessInfo(steps),keys=info.adds.map(function(s){return s.key;});
        const recipe=info.acts.length&&!autoPrepIsReplay(steps)?findAlchemyRecipeFor(keys):null;
        const canonical=recipe&&keys.every(function(k){return countAlchemyIngredient(k)>0;});
        return {reason:getAlchemyStartBlockReason(steps,!!data.autoPrep),revision:canonical?JSON.stringify(recipe):"",title:"Your queued process: "+describeAlchemyQueue(steps),stamina:ALCHEMY_STAMINA,turns:getCraftAlchemyTurns(canonical?0:steps.length,countCraftAutoPrep(keys,canonical||data.autoPrep)),ingredients:keys.map(function(k){return getAlchemyIngredientDef(k).name;})};
    }
    if(getRogueRank(G.player)<ROGUE_POISON_MIN_RANK)return {reason:"You need poison training to work at this bench."};
    if(kind==="antitoxin")return {reason:getAntitoxinBrewBlockReason(),title:"Antitoxin",stamina:ANTITOXIN_BREW_STAMINA,turns:ANTITOXIN_BREW_TURNS,ingredients:["Greenwort","Nightshade berry"]};
    if(kind==="poison"){
        const ids=data.ids,r=findPoisonRecipeFor(ids),known=ensurePoisonKnowledge(G.player);
        const stamina=r?r.stamina:2;
        return {reason:getAlchemyTableReason()||getPoisonIngredientBlock(ids)||(isEntityExhausted(G.player)||G.player.stamina<stamina?"You are too worn out.":"")||(r&&getRogueRank(G.player)<r.minRank?"That pairing is beyond your current poison training.":""),title:r&&known[r.id]?r.name:"Experiment with "+ids.map(function(id){return POISON_INGREDIENTS[id].name;}).join(" + "),stamina:stamina,turns:r?r.turns:2,ingredients:ids.map(function(id){return POISON_INGREDIENTS[id].name;})};
    }
    return {reason:"That crafting action is unavailable."};
}
function quoteCraft(kind,data) {
    const spec=craftQuoteSpec(kind,data);if(spec.reason)return sharedChoiceResult("blocked",spec.reason);
    const menu=beginCraftMenu("confirm","Confirm "+spec.title+"\nUses: "+(spec.ingredients.join(" + ")||"the bowl contents")+". Cost: "+spec.stamina+" stamina, "+spec.turns+" turns. Failure can waste ingredients.",function(){quoteCraft(kind,data);});
    const original=JSON.stringify(spec),valid=menu.valid;
    menu.valid=function(){return valid()&&JSON.stringify(craftQuoteSpec(kind,data))===original;};
    const el=document.getElementById("chatOptionsEl");el.innerHTML="";
    el.appendChild(createSharedChoiceButton(menu,"Confirm",async function(){
        if(kind==="recipe")return await attemptAlchemyRecipe(data.id);
        if(kind==="process")return await startAlchemyProcess(data.steps,data.autoPrep);
        if(kind==="poison")return attemptPoisonBrew(data.ids);
        if(kind==="antitoxin")return attemptAntitoxinBrew();
        const fixture=craftTable();return runCraftBowlAction(fixture,function(){return pourOutAlchemyBowl(fixture);});
    },{textChoice:{action:"confirm"}}));
    el.appendChild(createSharedChoiceButton(menu,"Back",function(){openAlchemyMenu();},{textChoice:{action:"back"}}));
    publishCraftMenu(menu,el);
    if(textModeState.enabled)publishTextModeOutput("craft","Review the crafting costs and confirm by number.",{craft:{stage:"quote",title:spec.title,ingredients:spec.ingredients,stamina:spec.stamina,turns:spec.turns}},false);
    return {status:"needs_input"};
}
function openCraftDipMenu(fixture,message) {
    if(craftSceneBlock()||fixture!==craftTable())return sharedChoiceResult("blocked","That bowl is unavailable.");
    const menu=beginCraftMenu("dip","Dip an item in the extraction bowl",function(){openCraftDipMenu(fixture);}),el=document.getElementById("chatOptionsEl");el.innerHTML="";
    getDippableEntries().filter(function(e){return isLootItemVisible(e.item);}).forEach(function(entry){el.appendChild(createSharedChoiceButton(menu,getItemName(entry.item),function(){return dipItemInAlchemyBowl(fixture,entry.key);},{disabled:!!getAlchemyBowlBlockReason(fixture),textChoice:{action:"dip",name:getItemName(entry.item)}}));});
    el.appendChild(createSharedChoiceButton(menu,"Back",function(){openAlchemyMenu();},{textChoice:{action:"back"}}));
    if(message)setNarration(message);publishCraftMenu(menu,el);
}
function openCraftNameMenu(sig) {
    const d=ensureAlchemyState(G.player).mixLog[sig];if(!d||!d.tested||craftSceneBlock())return sharedChoiceResult("blocked","Choose a mixture you have actually tested first.");
    const menu=beginCraftMenu("name","Name the "+d.vial+" mixture. Type name mixture <name> (1–40 characters).",function(){openCraftNameMenu(sig);});
    const el=document.getElementById("chatOptionsEl");el.innerHTML="";menu.mixSig=sig;
    menu.submitName=function(raw){
        if(sharedChoiceState.menu!==menu||!menu.valid())return sharedChoiceResult("blocked","That mixture changed. Type options to refresh.");
        const name=String(raw||"").replace(/\s+/g," ").trim();if(!name||name.length>40)return sharedChoiceResult("blocked","Give the mixture a name of 1–40 characters.");
        clearSharedChoiceMenu(menu);nameAlchemyMixture(sig,name);saveGameState();openAlchemyMenu("You label it: "+d.playerName+".");return {status:"needs_input"};
    };
    if(!textModeState.enabled){const input=document.createElement("input");input.className="chat-respond-input";input.maxLength=40;input.placeholder="What do you call it?";input.setAttribute("aria-label","Mixture name");el.appendChild(input);const save=document.createElement("button");save.className="chat-option-btn kind-reply";save.textContent="Name it";save.onclick=function(){menu.submitName(input.value);};el.appendChild(save);input.addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();menu.submitName(input.value);}});input.focus();}
    el.appendChild(createSharedChoiceButton(menu,"Back",function(){openAlchemyMenu();},{textChoice:{action:"back"}}));publishCraftMenu(menu,el);
}
