const auth = require('./_auth');

const loginAttempts = new Map();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 5 * 60 * 1000;

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

function getClientIp(req) {
  const fwd = (req && req.headers && req.headers['x-forwarded-for']) || '';
  return String(fwd).split(',')[0].trim() || 'unknown';
}

function isRateLimited(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, windowStart: now });
  } else {
    entry.count += 1;
  }
}

function clearFailures(ip) {
  loginAttempts.delete(ip);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const creds = auth.getExpectedCredentials();

  if (req.method === 'GET') {
    const session = auth.verifyAdminRequest(req);
    return res.status(200).json({
      ok: true,
      authenticated: Boolean(session.authenticated),
      username: session.authenticated ? session.username : null,
      usingDefaultPassword: creds.usingDefaultPassword
    });
  }

  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', auth.buildSessionCookie(req, '', true));
    return res.status(200).json({ ok: true, authenticated: false });
  }

  if (req.method === 'POST') {
    let body = {};
    try {
      body = await parseBody(req);
    } catch (e) {
      return res.status(400).json({ ok: false, error: 'Invalid JSON request.' });
    }

    if (body && body.action === 'logout') {
      res.setHeader('Set-Cookie', auth.buildSessionCookie(req, '', true));
      return res.status(200).json({ ok: true, authenticated: false });
    }

    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
      return res.status(429).json({ ok: false, error: 'Too many login attempts. Please wait a few minutes.' });
    }

    const u = String(body.username || '').trim();
    const p = String(body.password || '');
    const validUser = auth.safeEqualText(u, creds.username);
    const validPass = auth.safeEqualText(p, creds.password);

    if (!validUser || !validPass) {
      recordFailure(ip);
      return res.status(401).json({ ok: false, authenticated: false, error: 'Invalid username or password.' });
    }

    clearFailures(ip);
    const token = auth.signSession(creds.username);
    res.setHeader('Set-Cookie', auth.buildSessionCookie(req, token, false));
    return res.status(200).json({
      ok: true,
      authenticated: true,
      username: creds.username,
      usingDefaultPassword: creds.usingDefaultPassword
    });
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  return res.status(405).json({ ok: false, error: 'Method not allowed' });
};
