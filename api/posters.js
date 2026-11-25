const METRICS_BLOB_PATH = 'sw/metrics.json';

function parseBody(req) {
  return new Promise(function (resolve, reject) {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    if (typeof req.body === 'string') {
      try { return resolve(req.body ? JSON.parse(req.body) : {}); } catch (e) { return reject(e); }
    }
    const chunks = [];
    req.on('data', function (c) { chunks.push(c); });
    req.on('end', function () {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

async function readBlobMetrics() {
  const { list } = require('@vercel/blob');
  const res = await list({ prefix: METRICS_BLOB_PATH, limit: 5 });
  const hit = (res.blobs || []).find(function (b) { return b.pathname === METRICS_BLOB_PATH; });
  if (!hit || !hit.url) return {};
  const resp = await fetch(hit.url + '?t=' + Date.now(), { cache: 'no-store' });
  if (!resp.ok) return {};
  const data = await resp.json();
  return (data && typeof data === 'object' && !Array.isArray(data)) ? data : {};
}

async function writeBlobMetrics(map) {
  const { put } = require('@vercel/blob');
  await put(METRICS_BLOB_PATH, JSON.stringify(map), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
    contentType: 'application/json'
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const hasBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

  try {
    if (req.method === 'GET') {
      const stats = hasBlob ? await readBlobMetrics() : {};
      return res.status(200).json({ ok: true, mode: hasBlob ? 'vercel-blob' : 'local', stats: stats });
    }

    if (req.method === 'POST') {
      const body = await parseBody(req);
      const campaignId = String((body && body.campaignId) || '').trim();
      const event = String((body && body.event) || 'poster').trim();
      if (!campaignId || !/^[A-Za-z0-9_-]{2,40}$/.test(campaignId)) {
        return res.status(400).json({ ok: false, error: 'Valid campaignId required.' });
      }
      if (!/^(click|poster|download)$/.test(event)) {
        return res.status(400).json({ ok: false, error: 'Invalid event type.' });
      }
      if (!hasBlob) {
        return res.status(200).json({ ok: true, mode: 'local', campaignId: campaignId });
      }
      const map = await readBlobMetrics();
      const entry = Object.assign({ clicks: 0, posters: 0, downloads: 0 }, map[campaignId] || {});
      if (event === 'click') entry.clicks += 1;
      else if (event === 'download') entry.downloads += 1;
      else entry.posters += 1;
      map[campaignId] = entry;
      await writeBlobMetrics(map);
      return res.status(200).json({ ok: true, mode: 'vercel-blob', campaignId: campaignId, metrics: entry });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: (err && err.message) || 'Server error' });
  }
};
