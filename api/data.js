let hasKV = false;
let kvStore = null;
try {
  kvStore = await import('@vercel/kv');
  if (kvStore && kvStore.kv) { hasKV = true; }
} catch (e) {
  hasKV = false;
}

let memoryStore = null;

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    if (hasKV) {
      try {
        const data = await kvStore.kv.get('arrow_data');
        return res.status(200).json(data ? { ok: true, data } : { ok: false, data: null });
      } catch (e) {
        console.error('KV GET error:', e.message);
      }
    }
    return res.status(200).json(memoryStore ? { ok: true, data: memoryStore } : { ok: false, data: null });
  }

  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const payload = {
      rows: body.rows || [],
      rowsOps: body.rowsOps || [],
      rowsDealer: body.rowsDealer || [],
      fileName: body.fileName || '',
      dataDate: body.dataDate || '',
      uploadedAt: new Date().toISOString(),
      region: body.region || '北区'
    };
    memoryStore = payload;
    if (hasKV) {
      try {
        await kvStore.kv.set('arrow_data', payload);
      } catch (e) {
        console.error('KV SET error:', e.message);
      }
    }
    return res.status(200).json({ ok: true, count: (body.rows || []).length });
  }

  if (req.method === 'DELETE') {
    memoryStore = null;
    if (hasKV) {
      try { await kvStore.kv.del('arrow_data'); } catch (e) {}
    }
    return res.status(200).json({ ok: true, msg: 'data cleared' });
  }

  return res.status(405).json({ ok: false, msg: 'method not allowed' });
}
