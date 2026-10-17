const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const files = {
    '/core.js': path.join(root, 'cyoaftw-engine-CORE.js'),
    '/world.js': 'C:/Git/CYOADEV/cyoaftw-world-data.js',
    '/npc.js': 'C:/Git/CYOADEV/cyoaftw-npc-data.js',
    '/context.js': 'C:/Git/CYOADEV/cyoaftw-context-builder.js'
};
http.createServer((req, res) => {
    const route = new URL(req.url, 'http://127.0.0.1').pathname;
    if (route === '/mobile') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.end('<body style="margin:0;background:#353535;display:flex;justify-content:center"><iframe title="Mobile inventory preview" src="/" style="width:390px;height:840px;border:0"></iframe></body>');
    }
    if (route === '/') {
        let html = fs.readFileSync(path.join(root, 'cyoaftw-engine-CORE.html'), 'utf8');
        // Preview only: serve the SFW local modules, with no external scripts.
        html = html.replace(/<script\b[^>]*\bsrc=["'][^"']+["'][^>]*>\s*<\/script>/gi, '');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.end('<script src="/world.js"></script><script src="/npc.js"></script><script src="/context.js"></script>' + html + '<script src="/core.js"></script>');
    }
    if (files[route]) {
        res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
        return res.end(fs.readFileSync(files[route]));
    }
    res.writeHead(404); res.end('Not found');
}).listen(8131, '127.0.0.1', () => console.log('Inventory preview: http://127.0.0.1:8131'));
