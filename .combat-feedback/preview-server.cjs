const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const files = {
    '/cyoaftw-engine-CORE.js': path.join(root, 'cyoaftw-engine-CORE.js'),
    ...Object.fromEntries(['cyoaftw-world-data.js','cyoaftw-npc-data.js','cyoaftw-context-builder.js'].map(name=>['/'+name,'C:/Git/CYOADEV/'+name]))
};
http.createServer((req,res)=>{
    const route = new URL(req.url,'http://127.0.0.1').pathname;
    if (route === '/' || route === '/baseline') {
        const file = route === '/baseline' ? 'C:/Git/CYOADEV/cyoaftw-engine-CORE.html' : path.join(root,'cyoaftw-engine-CORE.html');
        const html=fs.readFileSync(file,'utf8').replace(/<script src="nsfw\/[^"]+"><\/script>/g,'');
        res.setHeader('Content-Type','text/html; charset=utf-8');
        res.end(html+'<script src="/cyoaftw-engine-CORE.js"></script>');
    } else if(route==='/damage-proof') {
        const html=fs.readFileSync(path.join(root,'cyoaftw-engine-CORE.html'),'utf8');
        const core=fs.readFileSync(path.join(root,'cyoaftw-engine-CORE.js'),'utf8');
        const renderer=core.slice(core.indexOf('function buildCombatNarrationParts('),core.indexOf('function setCombatNarrationRowText('));
        const css=html.match(/<style>([\s\S]*?)<\/style>/)[1];
        res.setHeader('Content-Type','text/html; charset=utf-8');
        res.end('<title>Combat narration preview</title><style>'+css+'</style><main style="max-width:700px;margin:24px auto;padding:20px"><h2 style="margin-bottom:16px">Combat narration preview</h2><p style="color:#aaa;margin-bottom:16px">Example starts at 16 / 16 HP.</p><div id="narrationEl" style="font-size:16px;max-height:none"></div><p style="margin-top:18px">Final HP: <strong>6 / 18</strong></p></main><script>'+renderer+`\n[
            'A Goblin hits your torso with a warhammer (12 damage; HP 16 → 4; 1 absorbed by gear).',
            'Your Endurance increases, restoring 2 HP and adding 2 max HP (HP 4 → 6).'
        ].forEach(text=>{const row=document.createElement('p');row.style.cssText='padding:10px 0;line-height:1.6';document.getElementById('narrationEl').appendChild(row);buildCombatNarrationParts(row,text,false).forEach(part=>{part.el.textContent=part.text;});});</script>`);
    } else if(files[route]) {
        res.setHeader('Content-Type','text/javascript; charset=utf-8');res.end(fs.readFileSync(files[route]));
    } else { res.writeHead(404);res.end('Not found'); }
}).listen(8127,'127.0.0.1',()=>console.log('Combat feedback preview: http://127.0.0.1:8127'));
