const auth = require('./_auth');
const CAMPAIGNS_BLOB_PATH = 'sw/campaigns.json';
const RESERVED_IDS = new Set([
  'api', 'all-campaigns', 'campaign', 'studio', 'login', 'dashboard', 'terms', 'policy', 'css', 'js', 'frames', 'assets', '404'
]);

function parseBody(req) {
  return new Promise(function (resolve, reject) {
    if (req.body && typeof req.body === 'object') {
      resolve(req.body);
      return;
    }
    if (typeof req.body === 'string') {
      try {
        resolve(req.body ? JSON.parse(req.body) : {});
      } catch (e) {
        reject(e);
      }
      return;
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

function getStorageMode() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return 'vercel-blob';
  if (process.env.GITHUB_TOKEN) return 'github-env';
  return 'none';
}

function getGitHubEnvConfig() {
  return {
    owner: process.env.GITHUB_OWNER || process.env.VERCEL_GIT_REPO_OWNER || 'kuku15shi',
    repo: process.env.GITHUB_REPO || process.env.VERCEL_GIT_REPO_SLUG || 'SWAW',
    branch: process.env.GITHUB_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || 'main',
    token: process.env.GITHUB_TOKEN || ''
  };
}

async function blobReadCampaigns() {
  const { list } = require('@vercel/blob');
  const res = await list({ prefix: CAMPAIGNS_BLOB_PATH, limit: 10 });
  const hit = (res.blobs || []).find(function (b) { return b.pathname === CAMPAIGNS_BLOB_PATH; });
  if (!hit || !hit.url) return [];
  const resp = await fetch(hit.url + '?t=' + Date.now(), { cache: 'no-store' });
  if (!resp.ok) return [];
  const data = await resp.json();
  return Array.isArray(data) ? data : [];
}

async function blobWriteCampaigns(items) {
  const { put } = require('@vercel/blob');
  await put(CAMPAIGNS_BLOB_PATH, JSON.stringify(items, null, 2) + '\n', {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
    contentType: 'application/json'
  });
}

async function blobSaveCampaign(campaign) {
  const { put } = require('@vercel/blob');
  const clean = Object.assign({}, campaign, { _updatedAt: Date.now() });

  if (clean.customFrameDataUrl) {
    const m = String(clean.customFrameDataUrl).match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (m) {
      let ext = m[1].toLowerCase().replace('jpeg', 'jpg').replace('+xml', '');
      if (!/^(png|webp|jpg|gif)$/.test(ext)) ext = 'png';
      const contentType = 'image/' + (ext === 'jpg' ? 'jpeg' : ext);
      const buf = Buffer.from(m[2], 'base64');
      const blob = await put('sw/frames/' + clean.id + '.' + ext, buf, {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        cacheControlMaxAge: 60,
        contentType: contentType
      });
      clean.customFrameUrl = blob.url;
      delete clean.customFrameFallbackUrl;
      delete clean.customFrameDataUrl;
      delete clean.shareFrameDataUrl;
    }
  }

  const list = await blobReadCampaigns();
  const next = list.filter(function (c) { return c && c.id !== clean.id; });
  next.unshift(clean);
  await blobWriteCampaigns(next);
  return clean;
}

async function ghApi(path, cfg, opts) {
  const options = opts || {};
  const url = 'https://api.github.com/repos/' + encodeURIComponent(cfg.owner) + '/' + encodeURIComponent(cfg.repo) + path;
  const headers = {
    'Accept': 'application/vnd.github+json',
    'Authorization': 'Bearer ' + cfg.token,
    'X-GitHub-Api-Version': '2022-11-28'
  };
  if (options.body) headers['Content-Type'] = 'application/json';
  const resp = await fetch(url, {
    method: options.method || 'GET',
    headers: headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const txt = await resp.text();
  let json = null;
  try { json = txt ? JSON.parse(txt) : null; } catch (e) { json = null; }
  if (!resp.ok) {
    const err = new Error((json && json.message) || ('GitHub HTTP ' + resp.status));
    err.status = resp.status;
    throw err;
  }
  return json;
}

async function ghReadCampaigns(cfg) {
  try {
    const file = await ghApi('/contents/campaigns.json?ref=' + encodeURIComponent(cfg.branch), cfg);
    if (!file || !file.content) return { sha: file && file.sha, list: [] };
    const decoded = Buffer.from(String(file.content).replace(/\s+/g, ''), 'base64').toString('utf8');
    const parsed = JSON.parse(decoded);
    return { sha: file.sha, list: Array.isArray(parsed) ? parsed : [] };
  } catch (e) {
    if (e && e.status === 404) return { sha: null, list: [] };
    throw e;
  }
}

async function ghSaveCampaign(campaign, cfg) {
  const clean = Object.assign({}, campaign, { _updatedAt: Date.now() });
  if (clean.customFrameDataUrl) {
    const m = String(clean.customFrameDataUrl).match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (m) {
      let ext = m[1].toLowerCase().replace('jpeg', 'jpg').replace('+xml', '');
      if (!/^(png|webp|jpg|gif)$/.test(ext)) ext = 'png';
      const framePath = 'frames/' + clean.id + '.' + ext;
      let sha = null;
      try {
        const cur = await ghApi('/contents/' + framePath + '?ref=' + encodeURIComponent(cfg.branch), cfg);
        sha = cur && cur.sha;
      } catch (e) {
        if (!e || e.status !== 404) throw e;
      }
      const body = { message: 'Upload frame ' + framePath, content: m[2], branch: cfg.branch };
      if (sha) body.sha = sha;
      await ghApi('/contents/' + framePath, cfg, { method: 'PUT', body: body });
      clean.customFrameUrl = framePath;
      clean.customFrameFallbackUrl =
        'https://raw.githubusercontent.com/' + encodeURIComponent(cfg.owner) + '/' +
        encodeURIComponent(cfg.repo) + '/' + encodeURIComponent(cfg.branch) + '/' + framePath;
      delete clean.customFrameDataUrl;
      delete clean.shareFrameDataUrl;
    }
  }

  const current = await ghReadCampaigns(cfg);
  const next = current.list.filter(function (c) { return c && c.id !== clean.id; });
  next.unshift(clean);
  const body = {
    message: 'Save campaign ' + clean.id,
    content: Buffer.from(JSON.stringify(next, null, 2) + '\n', 'utf8').toString('base64'),
    branch: cfg.branch
  };
  if (current.sha) body.sha = current.sha;
  await ghApi('/contents/campaigns.json', cfg, { method: 'PUT', body: body });
  return clean;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const mode = getStorageMode();

  try {
    if (req.method === 'GET') {
      if (mode === 'vercel-blob') {
        const campaigns = await blobReadCampaigns();
        return res.status(200).json({ ok: true, configured: true, mode: mode, campaigns: campaigns });
      }
      if (mode === 'github-env') {
        const resGh = await ghReadCampaigns(getGitHubEnvConfig());
        return res.status(200).json({ ok: true, configured: true, mode: mode, campaigns: resGh.list });
      }
      return res.status(200).json({ ok: true, configured: false, mode: 'none', campaigns: [] });
    }

    if (req.method === 'POST') {
      const session = auth.verifyAdminRequest(req);
      if (!session.authenticated) {
        return res.status(401).json({ ok: false, error: 'Admin login required.' });
      }
      if (mode === 'none') {
        return res.status(503).json({
          ok: false,
          configured: false,
          error: 'No server storage configured on Vercel yet. Go to Vercel Project -> Storage -> Create Blob Store (or add GITHUB_TOKEN in Environment Variables).'
        });
      }
      const body = await parseBody(req);
      const campaign = body && body.campaign ? body.campaign : body;
      if (!campaign || !campaign.id || !campaign.title) {
        return res.status(400).json({ ok: false, error: 'Invalid campaign payload (id and title required).' });
      }
      if (!/^[A-Za-z0-9_-]{2,40}$/.test(String(campaign.id)) || RESERVED_IDS.has(String(campaign.id).toLowerCase())) {
        return res.status(400).json({ ok: false, error: 'Campaign Short Code must be 2-40 URL-safe characters and not a reserved page name.' });
      }
      if (campaign.customFrameDataUrl && String(campaign.customFrameDataUrl).length > 3500000) {
        return res.status(413).json({ ok: false, error: 'Uploaded frame image is too large (max ~2.5 MB).' });
      }
      const saved = mode === 'vercel-blob'
        ? await blobSaveCampaign(campaign)
        : await ghSaveCampaign(campaign, getGitHubEnvConfig());
      return res.status(200).json({ ok: true, configured: true, mode: mode, campaign: saved });
    }

    if (req.method === 'DELETE') {
      const session = auth.verifyAdminRequest(req);
      if (!session.authenticated) {
        return res.status(401).json({ ok: false, error: 'Admin login required.' });
      }
      const urlObj = new URL(req.url, 'http://localhost');
      const id = urlObj.searchParams.get('id');
      if (!id || !/^[A-Za-z0-9_-]{2,40}$/.test(id)) {
        return res.status(400).json({ ok: false, error: 'Invalid campaign id.' });
      }
      if (mode === 'vercel-blob') {
        const list = await blobReadCampaigns();
        const next = list.filter(function (c) { return c && c.id !== id; });
        await blobWriteCampaigns(next);
        return res.status(200).json({ ok: true, mode: mode });
      }
      if (mode === 'github-env') {
        const cfg = getGitHubEnvConfig();
        const current = await ghReadCampaigns(cfg);
        const next = current.list.filter(function (c) { return c && c.id !== id; });
        if (next.length !== current.list.length && current.sha) {
          await ghApi('/contents/campaigns.json', cfg, {
            method: 'PUT',
            body: {
              message: 'Delete campaign ' + id,
              content: Buffer.from(JSON.stringify(next, null, 2) + '\n', 'utf8').toString('base64'),
              branch: cfg.branch,
              sha: current.sha
            }
          });
        }
        return res.status(200).json({ ok: true, mode: mode });
      }
      return res.status(200).json({ ok: true, configured: false, mode: 'none' });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: (err && err.message) || 'Server error' });
  }
};
