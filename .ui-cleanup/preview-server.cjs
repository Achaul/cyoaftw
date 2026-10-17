const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const files = Object.fromEntries(['cyoaftw-engine-CORE.js','cyoaftw-world-data.js','cyoaftw-npc-data.js','cyoaftw-context-builder.js'].map(name => ['/' + name, 'C:/Git/CYOADEV/' + name]));
http.createServer((req, res) => {
    const route = new URL(req.url, 'http://127.0.0.1').pathname;
    if (['/', '/baseline', '/standalone'].includes(route)) {
        const file = route === '/baseline' ? 'C:/Git/CYOADEV/cyoaftw-engine-CORE.html' : path.join(__dirname, 'cyoaftw-engine-CORE.html');
        let html = fs.readFileSync(file, 'utf8').replace(/<script src="nsfw\/[^"]+"><\/script>/g, '');
        if (route === '/standalone') html = '<style>' + fs.readFileSync('C:/Git/CYOADEV/cyoaftw-standalone.css', 'utf8') + '</style>' + html;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(html + '<script src="/cyoaftw-engine-CORE.js"></script>');
    } else if (files[route]) {
        res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
        res.end(fs.readFileSync(files[route]));
    } else { res.writeHead(404); res.end('Not found'); }
}).listen(8127, '127.0.0.1', () => console.log('UI verification: http://127.0.0.1:8127'));
