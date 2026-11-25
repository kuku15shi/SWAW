(function (global) {
  'use strict';

  const STORAGE_GH_KEY = 'sw_github_sync_cfg_v1';

  function detectDefaultRepo() {
    let owner = 'kuku15shi';
    let repo = 'SWAW';
    try {
      const loc = global.location;
      if (loc && /\.github\.io$/i.test(loc.hostname || '')) {
        const hostOwner = loc.hostname.split('.')[0];
        const segs = (loc.pathname || '').split('/').filter(Boolean);
        if (hostOwner) owner = hostOwner;
        if (segs.length && !/\.html$/i.test(segs[0])) {
          repo = segs[0];
        }
      }
    } catch (e) {
      // ignore
    }
    return { owner: owner, repo: repo, branch: 'main', token: '' };
  }

  function getConfig() {
    const def = detectDefaultRepo();
    try {
      const raw = localStorage.getItem(STORAGE_GH_KEY);
      if (!raw) return def;
      const parsed = JSON.parse(raw);
      return Object.assign({}, def, parsed || {});
    } catch (e) {
      return def;
    }
  }

  function saveConfig(cfg) {
    const clean = Object.assign({}, detectDefaultRepo(), cfg || {});
    clean.owner = String(clean.owner || '').trim();
    clean.repo = String(clean.repo || '').trim();
    clean.branch = String(clean.branch || 'main').trim() || 'main';
    clean.token = String(clean.token || '').trim();
    localStorage.setItem(STORAGE_GH_KEY, JSON.stringify(clean));
    return clean;
  }

  function isConfigured() {
    const c = getConfig();
    return Boolean(c.owner && c.repo && c.token);
  }

  function encodeUtf8Base64(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) {
      bin += String.fromCharCode(bytes[i]);
    }
    return btoa(bin);
  }

  function decodeUtf8Base64(b64) {
    const clean = String(b64 || '').replace(/\s+/g, '');
    if (!clean) return '';
    const bin = atob(clean);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }

  async function ghRequest(path, cfg, options) {
    const opts = options || {};
    const url = 'https://api.github.com/repos/' + encodeURIComponent(cfg.owner) + '/' + encodeURIComponent(cfg.repo) + path;
    const headers = Object.assign({
      'Accept': 'application/vnd.github+json',
      'Authorization': 'Bearer ' + cfg.token,
      'X-GitHub-Api-Version': '2022-11-28'
    }, opts.headers || {});
    if (opts.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    const resp = await fetch(url, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    const text = await resp.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch (e) { json = null; }
    if (!resp.ok) {
      const msg = (json && json.message) ? json.message : ('GitHub HTTP ' + resp.status);
      const err = new Error(msg);
      err.status = resp.status;
      throw err;
    }
    return json;
  }

  async function getFileMeta(repoPath, cfg) {
    try {
      return await ghRequest('/contents/' + repoPath + '?ref=' + encodeURIComponent(cfg.branch), cfg);
    } catch (e) {
      if (e && e.status === 404) return null;
      throw e;
    }
  }

  async function putFile(repoPath, base64Content, message, cfg) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const existing = await getFileMeta(repoPath, cfg);
      const body = {
        message: message,
        content: base64Content,
        branch: cfg.branch
      };
      if (existing && existing.sha) {
        body.sha = existing.sha;
      }
      try {
        return await ghRequest('/contents/' + repoPath, cfg, { method: 'PUT', body: body });
      } catch (e) {
        if (e && e.status === 409 && attempt === 0) {
          continue;
        }
        throw e;
      }
    }
  }

  async function testConnection(overrideCfg) {
    const cfg = overrideCfg ? saveConfig(overrideCfg) : getConfig();
    if (!cfg.owner || !cfg.repo || !cfg.token) {
      throw new Error('Enter GitHub Owner, Repo, and Personal Access Token first.');
    }
    const repoInfo = await ghRequest('', cfg);
    if (repoInfo && repoInfo.permissions && repoInfo.permissions.push === false) {
      throw new Error('Token does not have write/push permission on ' + cfg.owner + '/' + cfg.repo);
    }
    return repoInfo;
  }

  async function publishCampaignToGitHub(campaignPayload, onProgress) {
    const cfg = getConfig();
    if (!cfg.owner || !cfg.repo || !cfg.token) {
      throw new Error('GitHub Auto-Upload is not connected yet. Add your GitHub Token first.');
    }

    const progress = typeof onProgress === 'function' ? onProgress : function () {};
    const clean = Object.assign({}, campaignPayload, { _updatedAt: Date.now() });

    if (clean.customFrameDataUrl) {
      const m = String(clean.customFrameDataUrl).match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (m) {
        let ext = m[1].toLowerCase().replace('jpeg', 'jpg').replace('+xml', '');
        if (!/^(png|webp|jpg|gif)$/.test(ext)) ext = 'png';
        const framePath = 'frames/' + clean.id + '.' + ext;
        progress('Uploading frame image (' + framePath + ') to GitHub...');
        await putFile(framePath, m[2], 'Upload campaign frame ' + framePath, cfg);
        clean.customFrameUrl = framePath;
        clean.customFrameFallbackUrl =
          'https://raw.githubusercontent.com/' + encodeURIComponent(cfg.owner) + '/' +
          encodeURIComponent(cfg.repo) + '/' + encodeURIComponent(cfg.branch) + '/' + framePath;
        delete clean.customFrameDataUrl;
      }
    }

    progress('Updating campaigns.json on GitHub...');
    for (let attempt = 0; attempt < 2; attempt++) {
      const existingFile = await getFileMeta('campaigns.json', cfg);
      let list = [];
      if (existingFile && existingFile.content) {
        try {
          const decoded = decodeUtf8Base64(existingFile.content);
          const parsed = JSON.parse(decoded);
          if (Array.isArray(parsed)) list = parsed;
        } catch (e) {
          list = [];
        }
      }
      const filtered = list.filter(function (item) { return item && item.id !== clean.id; });
      filtered.unshift(clean);

      const nextB64 = encodeUtf8Base64(JSON.stringify(filtered, null, 2) + '\n');
      const body = {
        message: 'Publish campaign ' + clean.id,
        content: nextB64,
        branch: cfg.branch
      };
      if (existingFile && existingFile.sha) {
        body.sha = existingFile.sha;
      }
      try {
        await ghRequest('/contents/campaigns.json', cfg, { method: 'PUT', body: body });
        break;
      } catch (e) {
        if (e && e.status === 409 && attempt === 0) continue;
        throw e;
      }
    }

    return {
      ok: true,
      campaign: clean,
      pagesBase: 'https://' + cfg.owner + '.github.io/' + cfg.repo + '/'
    };
  }

  async function deleteCampaignFromGitHub(id) {
    const cfg = getConfig();
    if (!cfg.owner || !cfg.repo || !cfg.token || !id) return false;
    const existingFile = await getFileMeta('campaigns.json', cfg);
    if (!existingFile || !existingFile.content) return false;
    let list = [];
    try {
      const parsed = JSON.parse(decodeUtf8Base64(existingFile.content));
      if (Array.isArray(parsed)) list = parsed;
    } catch (e) {
      return false;
    }
    const next = list.filter(function (c) { return c && c.id !== id; });
    if (next.length === list.length) return false;
    await ghRequest('/contents/campaigns.json', cfg, {
      method: 'PUT',
      body: {
        message: 'Remove campaign ' + id,
        content: encodeUtf8Base64(JSON.stringify(next, null, 2) + '\n'),
        branch: cfg.branch,
        sha: existingFile.sha
      }
    });
    return true;
  }

  global.SocialWavesGitHub = {
    getConfig: getConfig,
    saveConfig: saveConfig,
    isConfigured: isConfigured,
    testConnection: testConnection,
    publishCampaignToGitHub: publishCampaignToGitHub,
    deleteCampaignFromGitHub: deleteCampaignFromGitHub
  };
})(window);
