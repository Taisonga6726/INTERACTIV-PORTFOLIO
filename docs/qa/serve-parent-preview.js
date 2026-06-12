const http = require('http');
const fs = require('fs');
const path = require('path');

const PARENT = path.resolve(__dirname, '../../..');
const PORT = 8767;

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const filePath = path.join(PARENT, urlPath.replace(/^\//, ''));
  if (!filePath.startsWith(PARENT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4' };
  res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`Preview: http://127.0.0.1:${PORT}/INTERACTIV%20PORTFOLIO/portfolio.html`);
});
