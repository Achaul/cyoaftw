const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const files = {
    '/cyoaftw-engine-CORE.js': path.join(root, 'cyoaftw-engine-CORE.js'),
    '/cyoaftw-world-data.js': 'C:/Git/CYOADEV/cyoaftw-world-data.js',
    '/cyoaftw-npc-data.js': 'C:/Git/CYOADEV/cyoaftw-npc-data.js',
    '/cyoaftw-context-builder.js': 'C:/Git/CYOADEV/cyoaftw-context-builder.js'
};
http.createServer((req, res) => {
    const route = new URL(req.url, 'http://127.0.0.1').pathname;
    if (route === '/mobile') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end('<body style="margin:0;background:#353535;display:flex;justify-content:center"><iframe title="Mobile save menu preview" src="/" style="width:390px;height:820px;border:0"></iframe></body>');
    } else if (route === '/') {
        let html = fs.readFileSync(path.join(root, 'cyoaftw-engine-CORE.html'), 'utf8');
        // Local SFW verification only; the deliverable shell retains every script.
        html = html.replace(/<script src="nsfw\/[^"]+"><\/script>/g, '');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(html + '<script src="/cyoaftw-engine-CORE.js"></script>');
    } else if (files[route]) {
        res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
        res.end(fs.readFileSync(files[route]));
    } else { res.writeHead(404); res.end('Not found'); }
}).listen(8127, '127.0.0.1', () => console.log('Save manager verification: http://127.0.0.1:8127'));
