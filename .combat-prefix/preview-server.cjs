const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const core = fs.readFileSync(path.join(__dirname,'cyoaftw-engine-CORE.js'),'utf8');
const shell = fs.readFileSync('C:/Git/CYOADEV/cyoaftw-engine-CORE.html','utf8');
const css = shell.match(/<style>([\s\S]*?)<\/style>/)[1];
const strike = core.slice(core.indexOf('const STRIKE_VERBS_BY_WEAPON ='),core.indexOf('function getEntityWeaponProfile('));
const renderer = core.slice(core.indexOf('function buildCombatNarrationParts('),core.indexOf('function setCombatNarrationRowText('));
const proof = `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Combat prefix preview</title>
<style>${css}
html,body{display:block;min-width:0;height:auto;overflow:auto;background:#141414}
main{max-width:740px;margin:24px auto;padding:20px;box-sizing:border-box}
#narrationEl{font-size:16px;max-height:none;padding:20px;border:1px solid #3a3a3a;border-radius:8px;background:#191919}
.narration-line{opacity:1;margin:0 0 14px;line-height:1.6;overflow-wrap:anywhere}
.narration-line:last-child{margin-bottom:0}.narration-line-debug{font-size:13px;color:#999}
</style><main><h2>Combat narration preview</h2><div id="narrationEl"></div></main>
<script>
const G={player:{name:'Aldric'}}; const rand=arr=>arr[0]; const withIndefiniteArticle=text=>'a '+text;
${strike}
${renderer}
const ctx={attackerName:'Aldric',attackerIsPlayer:true,defenderName:'Goblin',defenderIsPlayer:false,
weapon:{name:'warhammer',type:'hammer'},damageType:'blunt',targetKey:'torso',damage:5,hpLost:5,hpMax:20};
[
formatCombatActionLine(G.player,{name:'Goblin'},'You aim for the Goblin’s torso.'),
'[Roll] Attack: d20(12) + 2 = 14 vs 10 → Hit',
buildStrikeHitLine(ctx),
buildStrikeHitLine({...ctx,attackerName:'Goblin',attackerIsPlayer:false,defenderName:'Aldric',defenderIsPlayer:true,damage:11,hpLost:11,hpBefore:16,hpAfter:5,blocked:1}),
'You feel poison creeping through your veins.',
formatCombatActionLine(G.player,G.player,'You pull a bandage tight over your wounds. The bleeding stops.')
].forEach(text=>{const row=document.createElement('div');row.className='narration-line'+(text.startsWith('[')?' narration-line-debug':'');document.getElementById('narrationEl').appendChild(row);buildCombatNarrationParts(row,text,text.startsWith('[')).forEach(part=>{part.el.textContent=part.text;});});
</script>`;
http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(proof);})
.listen(8127,'127.0.0.1',()=>console.log('Prefix preview: http://127.0.0.1:8127'));
