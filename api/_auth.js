const crypto = require('crypto');

const COOKIE_NAME = 'sw_admin_session';
const SESSION_TTL_SEC = 60 * 60 * 8; // 8 hours

function getExpectedCredentials() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const usingDefaultPassword = !process.env.ADMIN_PASSWORD;
  return { username: username, password: password, usingDefaultPassword: usingDefaultPassword };
}

function getSigningSecret() {
  const raw = process.env.AUTH_SECRET || process.env.BLOB_READ_WRITE_TOKEN || process.env.GITHUB_TOKEN || 'sw-fallback-dev-secret-set-AUTH_SECRET';
  return crypto.createHash('sha256').update(String(raw)).digest();
}

function safeEqualText(a, b) {
  const da = crypto.createHash('sha256').update(String(a || '')).digest();
  const db = crypto.createHash('sha256').update(String(b || '')).digest();
  return crypto.timingSafeEqual(da, db);
}

function parseCookies(req) {
  const raw = (req && req.headers && req.headers.cookie) || '';
  const map = {};
  raw.split(';').forEach(function (part) {
    const eq = part.indexOf('=');
    if (eq === -1) return;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k) {
      try {
        map[k] = decodeURIComponent(v);
      } catch (e) {
        map[k] = v;
      }
    }
  });
  return map;
}

function signSession(username) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SEC;
  const payload = Buffer.from(JSON.stringify({ u: username, exp: exp }), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', getSigningSecret()).update(payload).digest('base64url');
  return payload + '.' + sig;
}

function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return { authenticated: false };
  const dot = token.indexOf('.');
  if (dot <= 0) return { authenticated: false };
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expectedSig = crypto.createHmac('sha256', getSigningSecret()).update(payload).digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { authenticated: false };
  }
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data || !data.u || !data.exp || Number(data.exp) < Math.floor(Date.now() / 1000)) {
      return { authenticated: false };
    }
    return { authenticated: true, username: String(data.u), exp: Number(data.exp) };
  } catch (e) {
    return { authenticated: false };
  }
}

function verifyAdminRequest(req) {
  const cookies = parseCookies(req);
  return verifySessionToken(cookies[COOKIE_NAME]);
}

function buildSessionCookie(req, token, clear) {
  const isHttps = Boolean(
    (req && req.headers && String(req.headers['x-forwarded-proto'] || '').indexOf('https') !== -1) ||
    process.env.VERCEL === '1'
  );
  const parts = [
    COOKIE_NAME + '=' + (clear ? '' : encodeURIComponent(token)),
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    clear ? 'Max-Age=0' : ('Max-Age=' + SESSION_TTL_SEC)
  ];
  if (isHttps) parts.push('Secure');
  return parts.join('; ');
}

module.exports = {
  COOKIE_NAME: COOKIE_NAME,
  getExpectedCredentials: getExpectedCredentials,
  safeEqualText: safeEqualText,
  signSession: signSession,
  verifySessionToken: verifySessionToken,
  verifyAdminRequest: verifyAdminRequest,
  buildSessionCookie: buildSessionCookie
};
