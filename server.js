const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return { ok: false, data: null };
  }
}

function writeData(payload) {
  const store = {
    ok: true,
    data: {
      rows: payload.rows || [],
      rowsOps: payload.rowsOps || [],
      rowsDealer: payload.rowsDealer || [],
      fileName: payload.fileName || '',
      dataDate: payload.dataDate || '',
      uploadedAt: new Date().toISOString(),
      region: payload.region || '北区'
    }
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(store));
  return { ok: true, count: (payload.rows || []).length };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/') {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Server error');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  if (url.pathname === '/api/data') {
    if (req.method === 'GET') {
      const store = readData();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(store.ok ? store : { ok: false, data: null }));
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body);
          const result = writeData(payload);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(result));
        } catch (e) {
          res.writeHead(400);
          res.end(JSON.stringify({ ok: false, msg: e.message }));
        }
      });
      return;
    }

    if (req.method === 'DELETE') {
      try {
        fs.unlinkSync(DATA_FILE);
      } catch {}
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, msg: 'data cleared' }));
      return;
    }
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`数据宝(北部战区) 服务已启动: http://localhost:${PORT}`);
});
