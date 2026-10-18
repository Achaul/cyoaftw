const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(process.argv[2]||'C:/Git/CYOAFTW/.crafting-text/cyoaftw-engine-CORE.js','utf8').replace(/\r\n/g,'\n');
function section(a,b){const start=source.indexOf(a),end=source.indexOf(b,start);assert(start>=0&&end>start,a);return source.slice(start,end);}
const code=section('// Text commands are a presentation/input layer.','// END TEXT COMMANDS')+'\n'+section('const POISON_INGREDIENTS =','function seedNPCPoisonStock(')+'\n'+section('function ensurePoisonKnowledge(', 'const POISON_PLAYER_PASSIVE_FLOOR')+'\n'+section('const ALCHEMY_STAMINA =','// ── FORAGING:');
const plain=x=>JSON.parse(JSON.stringify(x));let seq=0;
function item(name,extra={}){return {id:name.toLowerCase(),name,type:['misc'],quantity:1,unitSize:1,...extra};}
function element(){return {children:[],style:{},appendChild(c){this.children.push(c);},set innerHTML(v){assert.equal(v,'');this.children=[];},addEventListener(){}};}
function harness(){
    const player={hp:20,hpMax:20,stamina:30,staminaMax:30,inventory:[],equipped:{},classSkills:{rogue:{rank:4,xp:0}},classBranches:{}};
    const table={id:'alchemy-table',name:'alchemy table',tags:['alchemy']},room={coords:'0,0',structural:[table],creatures:[],items:[]},el=element();
    const c={console,setTimeout,clearTimeout,player,table,room,el,turn:100,events:[],calls:[],
        G:{player,activeRoom:room,activeNPC:null,activeNPCMode:null,activeObject:null,activeItemModal:null,partyMembers:[],sessionFollowers:[]},
        window:{},CustomEvent:function(_name,options){this.detail=options.detail;},document:{getElementById:id=>id==='chatOptionsEl'?el:null,createElement:element},
        getItemName:i=>i.name,getItemQuantity:i=>i.quantity||1,isLootItemVisible:i=>!!i&&!i.hidden&&!i.isHidden&&!i.concealed&&i.visible!==false,
        getEntityName:e=>e.name,isVisibleEntity:e=>!e.hidden,getVisibleRoomFixtures:r=>(r.structural||[]).filter(f=>c.isLootItemVisible(f)),getFixtureTags:f=>f.tags||[],
        getRogueRank:p=>p.classSkills.rogue.rank,ensureEntityStamina(){},isEntityExhausted:p=>p.stamina<=0,
        hasPendingPartyLoot:()=>false,roomHasActiveHostile:()=>!!c.hostile,isRoomCollapsed:()=>false,isPlayerJailed:()=>false,
        getCurrentStoryTurn:()=>c.turn,advanceStoryTurn(n){c.turn+=n;if(c.onAdvance)c.onAdvance();},spendEntityStamina(p,n){p.stamina-=n;},
        consumeOneFromInventory(i){if(i.quantity>1)i.quantity--;else player.inventory.splice(player.inventory.indexOf(i),1);},
        isHerbItem:i=>!!i.herbKey,getHerbKey:i=>i&&i.herbKey||'',getItemLiquid:()=>null,
        HEALING_HERBS:Object.fromEntries(['greenwort','bloodmoss','sunpetal','silverroot','moonbloom'].map(key=>[key,{name:key,hint:'a plant',value:1}])),
        createHerbItem:key=>item(key,{herbKey:key,type:['herb']}),cloneLootTemplate:tpl=>({...tpl,_uid:++seq}),
        ALCHEMY_RANK_NAMES:['Untrained','Novice','Journeyman','Expert'],ALCHEMY_XP_NEXT:[20,40,80],ALCHEMY_RANK_BREW_BONUS:[0,1,2,3],
        ROGUE_POISON_MIN_RANK:2,ALCHEMY_DICE_SIDES:[4,6,8],ALCHEMY_MOD_MIN:-2,ALCHEMY_MOD_MAX:2,ALCHEMY_HIDDEN_KEYS:['none'],
        createCombatButton:(label,onClick,opts={})=>({label,onClick,...opts}),appendCombatGroup:(target,title,buttons)=>target.children.push({title,buttons}),
        setNarration:text=>c.publishTextModeOutput('narration',text,{},false),renderStats(){},saveGameState(){},
        renderCombatNarrationLines:lines=>c.publishTextModeOutput('combat',lines.join(' '),{},false),
        closeInteractMenu(){el.innerHTML='';c.G.activeNPCMode=null;},returnToRoomView(){el.innerHTML='';c.G.activeNPCMode=null;},
        getClassRankName:n=>'rank '+n,gainClassSkillXP:(key,n)=>player.classSkills[key].xp+=n,playerHasTechnique:()=>false,
        rollStatCheck:()=>c.roll||{success:true,critSuccess:false},formatRollLine:()=>'[debug]',
        getDippableEntries:()=>[],buildPlayerInventoryEntries:()=>[],isBladedWeapon:()=>false,
        POTION_STAT_TEMPLATES:[],getCoinValue:()=>0,INTERACT_MENU_ACTIONS:[],getChatOptions:()=>[],aiAvailable:()=>false,
        capitaliseFirst:s=>s[0].toUpperCase()+s.slice(1),getEquipmentSlotMeta:key=>({label:key}),sanitizeMixtureText:s=>s.slice(0,40)
    };
    c.window.G=c.G;c.window.dispatchEvent=e=>c.events.push(e.detail);vm.createContext(c);vm.runInContext(code,c);
    c.state=vm.runInContext('textModeState',c);c.menus=vm.runInContext('sharedChoiceState',c);c.state.enabled=true;c.state.sessionPlayer=player;
    c.getAlchemyBrewRoll=()=>c.roll||{success:true,critSuccess:false,quality:0};c.send=s=>c.submitTextModeCommand(s);
    c.add=(key,n,extra={})=>{const it=c.createHerbItem(key);Object.assign(it,{quantity:n},extra);player.inventory.push(it);return it;};
    c.confirm=async()=>{const menu=c.menus.menu;assert.equal(menu.kind,'craft-confirm');return c.runSharedChoice(menu,menu.options[0]);};
    return c;
}
test('craft vocabulary keeps shared intents, quoted names and inventory/combat commands distinct',()=>{
    const c=harness();for(const [input,action,target] of [['alchemy','menu',''],['craft healing salve','brew','healing salve'],['brew healing salve','brew','healing salve'],['mash greenwort','mash','greenwort'],['add "Wine from Smoke and Fire"','add','Wine from Smoke and Fire'],['start mix','start',undefined],['bottle mixture','bottle',undefined],['coat weapon with nightshade draught','coat','nightshade draught']]){
        const parsed=c.parseTextCommand(input);assert.equal(parsed.verb,'craft');assert.equal(parsed.args.action,action);assert.equal(parsed.args.target,target);
    }
    assert.equal(c.parseTextCommand('cut trophy from body').verb,'trophy');assert.equal(c.parseTextCommand('drink health potion').verb,'drink');assert.equal(c.parseTextCommand('take sword from chest').verb,'take');
    assert.equal(c.validateTextAIPlan({actions:[{verb:'craft',args:{action:'brew',target:'healing salve',yield:'999'}}]}),null);
});
test('known recipe quote is free and confirmation spends native raw/prepared costs exactly once',async()=>{
    for(const prepared of [false,true]){const c=harness();c.add('greenwort',5);if(prepared)c.player.inventory.push(c.createPreparedHerb('greenwort','mash'));
        await c.send('brew healing salve');assert.equal(c.turn,100);assert.equal(c.player.stamina,30);const menu=c.menus.menu;
        assert.equal(menu.valid(),true);const before=c.countAlchemyRaw('greenwort');await c.confirm();
        assert.equal(c.turn,prepared?104:105);assert.equal(c.player.stamina,28);assert.equal(c.countAlchemyRaw('greenwort'),before-(prepared?1:2));
        assert.equal(c.player.inventory.filter(i=>i.herbKey==='healing-salve').length,2);
        assert.equal((await c.runSharedChoice(menu,menu.options[0])).status,'blocked');assert.equal(c.player.stamina,28);
    }
});
test('shortages, unknown recipes and exhausted work cannot spend resources',async()=>{
    const c=harness();c.add('greenwort',1);await c.send('brew healing salve');assert.equal(c.turn,100);assert.equal(c.player.stamina,30);
    c.add('greenwort',5);await c.send('brew regrowth tonic');assert.equal(c.turn,100);assert.equal(c.ensureAlchemyState(c.player).known['regrowth-tonic'],undefined);
    c.player.stamina=1;await c.send('leave');await c.send('brew healing salve');assert.equal(c.turn,100);assert.equal(c.player.stamina,1);
});
test('failed and critical-failure batches retain native ingredient loss and fumes damage',async()=>{
    for(const critFail of [false,true]){const c=harness();c.add('greenwort',5);c.roll={success:false,critFail,quality:-1};await c.send('brew healing salve');await c.confirm();
        assert.equal(c.countAlchemyRaw('greenwort'),3);assert.equal(c.player.stamina,28);assert.equal(c.player.hp,critFail?18:20);assert.equal(c.player.inventory.filter(i=>i.herbKey==='healing-salve').length,0);
    }
});
test('hidden ingredients and replaced table/inventory or changed turn invalidate quotes',async()=>{
    for(const mutate of [c=>{c.table.hidden=true;},c=>{c.room.structural=[{...c.table}];},c=>{c.player.inventory=c.player.inventory.map(i=>({...i}));},c=>{c.turn++;}]){
        const c=harness();c.add('greenwort',50,{hidden:true});assert.equal(c.countAlchemyRaw('greenwort'),0);c.add('greenwort',5);await c.send('brew healing salve');const menu=c.menus.menu;mutate(c);
        assert.equal((await c.runSharedChoice(menu,menu.options[0])).status,'blocked');assert.equal(c.player.stamina,30);assert.equal(c.countAlchemyRaw('greenwort'),5);
    }
});
test('a moved scene during a native batch keeps costs but grants no remote product',async()=>{
    const c=harness();c.add('greenwort',5);c.onAdvance=()=>{c.G.activeRoom={coords:'1,1',structural:[],items:[],creatures:[]};};
    const result=await c.attemptAlchemyRecipe('healing-salve');assert.equal(result.status,'interrupted');assert.equal(c.countAlchemyRaw('greenwort'),3);assert.equal(c.player.stamina,28);assert.equal(c.turn,105);assert.equal(c.player.inventory.filter(i=>i.herbKey==='healing-salve').length,0);
    const d=harness();d.table.bowl={doses:1,madeTurn:d.turn};
    d.onAdvance=()=>{d.G.activeRoom={coords:'2,2',structural:[],items:[],creatures:[]};};
    assert.equal(d.runCraftBowlAction(d.table,()=>d.pourOutAlchemyBowl(d.table)).status,'interrupted');
    assert.equal(d.table.bowl,null);assert.equal(d.turn,101);assert.equal(d.menus.menu,null);
});
test('process editing is free, bounded, scene-owned, and refuses an occupied bowl',async()=>{
    const c=harness();c.add('sunpetal',20);await c.send('mix');await c.send('add sunpetal');await c.send('stir');assert.equal(c.turn,100);
    assert.equal(vm.runInContext('alchemyQueue.length',c),2);await c.send('undo mix');assert.equal(vm.runInContext('alchemyQueue.length',c),1);
    c.table.bowl={doses:1,madeTurn:c.turn};await c.send('options');await c.send('start mix');assert.notEqual(c.menus.menu.kind,'craft-confirm');assert.equal(c.turn,100);
    c.table.bowl=null;c.G.activeRoom={coords:'2,2',structural:[{...c.table}],items:[],creatures:[]};c.G.activeNPCMode=null;
    c.clearSharedChoiceMenu(c.menus.menu);await c.send('mix');assert.equal(vm.runInContext('alchemyQueue.length',c),0);
});
test('a queued plan cannot auto-confirm and resolving a choice leaves later commands paused',async()=>{
    const c=harness();c.add('greenwort',5);await c.send('brew healing salve then choose 1');assert.equal(c.state.queue.length,1);assert.equal(c.turn,100);
    await c.send('continue');assert.equal(c.turn,100);assert.equal(c.state.queue.length,1);
    await c.send('choose 1');assert.equal(c.turn,105);assert.equal(c.state.queue.length,1);await c.send('leave');await c.send('continue');assert.equal(c.state.queue.length,0);
});
test('read-only lists preserve decisions and never expose unknown recipes or hidden ingredient names',async()=>{
    const c=harness();c.add('greenwort',5);c.add('bloodmoss',10,{hidden:true,name:'Secret plant'});await c.send('brew healing salve');const menu=c.menus.menu;
    await c.send('show recipes');assert(!c.events.at(-1).text.includes('Regrowth tonic'));await c.send('show ingredients');assert(!c.events.at(-1).text.includes('Secret plant'));
    assert.equal(c.menus.menu,menu);assert.equal(c.turn,100);await c.send('cancel');assert.equal(c.player.stamina,30);
});
test('name and confirmation grammar cannot bypass the currently validated game decision',async()=>{
    const c=harness();c.add('greenwort',5);await c.send('brew healing salve');await c.send('craft confirm');assert.equal(c.turn,100);assert.equal(c.menus.menu.kind,'craft-confirm');
    await c.send('back');await c.send('name mixture forged tonic');assert.equal(Object.keys(c.ensureAlchemyState(c.player).mixLog).length,0);
});
test('a late design cannot cache or place a bowl after the active player changes',async()=>{
    const c=harness();c.add('sunpetal',5);let resolve;
    c.requestProcessDesign=()=>new Promise(r=>{resolve=r;});
    const steps=[{t:'add',key:'sunpetal',label:'sunpetal'},{t:'act',a:'simmer'}];
    const pending=c.startAlchemyProcess(steps,false);assert.equal(typeof resolve,'function');assert.equal(c.player.stamina,28);
    const old=c.player.alchemy,newPlayer={...c.player,inventory:[],alchemy:{seed:1,known:{},mixLog:{},skill:{rank:0,xp:0},familiarity:{}}};c.G.player=newPlayer;c.G.activeNPCMode=null;
    resolve({kind:'heal',name:'Secret cure',vial:'red',smell:'roses',doses:3,steps});
    const result=await pending;assert.equal(result.status,'interrupted');assert.equal(c.table.bowl,undefined);assert.equal(Object.keys(old.mixLog).length,0);assert.equal(Object.keys(newPlayer.alchemy.mixLog).length,0);assert.equal(vm.runInContext('alchemyPending',c),false);
});
test('poison and antitoxin use native yields/costs and cannot consume hidden ingredients',()=>{
    const c=harness(),night=c.createPoisonIngredient('nightshade');night.quantity=5;c.player.inventory.push(night);c.add('greenwort',5);
    const hidden=c.createPoisonIngredient('nightshade');hidden.quantity=50;hidden.hidden=true;c.player.inventory.unshift(hidden);
    c.attemptPoisonBrew(['nightshade']);assert.equal(night.quantity,4);assert.equal(hidden.quantity,50);assert.equal(c.getPlayerPoisonVials(c.player).length,2);assert.equal(c.player.stamina,28);assert.equal(c.turn,102);
    c.attemptAntitoxinBrew();assert.equal(c.countAlchemyRaw('greenwort'),4);assert.equal(night.quantity,3);assert.equal(c.player.stamina,26);assert.equal(c.turn,104);assert.equal(c.player.inventory.filter(i=>i.herbKey==='antitoxin').length,1);
});
test('process maximum and canonical lookup validate the requested ingredient multiplicity',()=>{
    const c=harness();c.add('sunpetal',1);
    const steps=Array.from({length:11},()=>({t:'act',a:'stir'}));steps[0]={t:'add',key:'sunpetal'};
    assert.match(c.getAlchemyStartBlockReason(steps,false),/too many/);
    assert.match(c.getAlchemyStartBlockReason([{t:'add',key:'sunpetal'},{t:'add',key:'sunpetal'}],false),/need/);
});
