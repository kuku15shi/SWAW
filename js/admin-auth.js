(function (global) {
  'use strict';

  const SESSION_KEY = 'sw_admin_logged_in';
  const SESSION_META_KEY = 'sw_admin_session_meta_v1';
  const IDLE_TIMEOUT_MS = 8 * 60 * 60 * 1000;

  // SHA-256 of default standalone demo passphrase for static/XAMPP-only mode
  const DEFAULT_USER = 'admin';
  const DEFAULT_PASS_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';

  async function sha256Hex(text) {
    if (global.crypto && global.crypto.subtle && typeof TextEncoder === 'function') {
      const buf = await global.crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(text || '')));
      return Array.from(new Uint8Array(buf)).map(function (b) {
        return b.toString(16).padStart(2, '0');
      }).join('');
    }
    return '';
  }

  function setLocalSession(username) {
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
      sessionStorage.setItem(SESSION_META_KEY, JSON.stringify({
        username: username || DEFAULT_USER,
        ts: Date.now()
      }));
    } catch (e) {
      // ignore
    }
  }

  function clearLocalSession() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_META_KEY);
    } catch (e) {
      // ignore
    }
  }

  function hasValidLocalSession() {
    try {
      if (sessionStorage.getItem(SESSION_KEY) !== '1') return false;
      const raw = sessionStorage.getItem(SESSION_META_KEY);
      if (!raw) return true;
      const meta = JSON.parse(raw);
      if (meta && meta.ts && Date.now() - Number(meta.ts) > IDLE_TIMEOUT_MS) {
        clearLocalSession();
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  async function checkSession() {
    try {
      const resp = await fetch('api/auth?t=' + Date.now(), { cache: 'no-store', credentials: 'same-origin' });
      const ct = (resp.headers && resp.headers.get && resp.headers.get('content-type')) || '';
      if (resp.ok && ct.indexOf('application/json') !== -1) {
        const data = await resp.json();
        if (data && data.ok) {
          if (data.authenticated) {
            setLocalSession(data.username);
          } else {
            clearLocalSession();
          }
          return {
            serverBacked: true,
            engine: data.engine || null,
            authenticated: Boolean(data.authenticated),
            username: data.username || null,
            usingDefaultPassword: Boolean(data.usingDefaultPassword)
          };
        }
      }
    } catch (e) {
      // fall through to local static check
    }

    const localOk = hasValidLocalSession();
    return {
      serverBacked: false,
      authenticated: localOk,
      username: localOk ? DEFAULT_USER : null,
      usingDefaultPassword: true
    };
  }

  async function login(username, password) {
    const u = String(username || '').trim();
    const p = String(password || '');

    try {
      const resp = await fetch('api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ action: 'login', username: u, password: p })
      });
      const ct = (resp.headers && resp.headers.get && resp.headers.get('content-type')) || '';
      if (ct.indexOf('application/json') !== -1) {
        const data = await resp.json();
        if (!resp.ok || !data || !data.authenticated) {
          throw new Error((data && data.error) || 'Invalid username or password.');
        }
        setLocalSession(data.username || u);
        return {
          ok: true,
          serverBacked: true,
          engine: data.engine || null,
          username: data.username || u,
          usingDefaultPassword: Boolean(data.usingDefaultPassword)
        };
      }
    } catch (err) {
      if (err && err.message && /invalid|attempts|json|denied/i.test(err.message)) {
        throw err;
      }
      // non-API static environment fallback
    }

    const digest = await sha256Hex(p);
    const matchLocal = u === DEFAULT_USER && (digest ? digest === DEFAULT_PASS_HASH : p === 'admin123');
    if (!matchLocal) {
      throw new Error('Invalid username or password.');
    }
    setLocalSession(u);
    return { ok: true, serverBacked: false, username: u, usingDefaultPassword: true };
  }

  async function logout() {
    clearLocalSession();
    try {
      await fetch('api/auth', {
        method: 'DELETE',
        credentials: 'same-origin'
      });
    } catch (e) {
      // ignore
    }
  }

  async function requireAdmin(redirectTarget) {
    const st = await checkSession();
    if (!st.authenticated) {
      const page = redirectTarget || (global.location.pathname.split('/').pop() || 'dashboard');
      global.location.replace('login?next=' + encodeURIComponent(page));
      return null;
    }
    return st;
  }

  async function changePassword(currentPassword, newPassword) {
    const resp = await fetch('api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        action: 'change_password',
        currentPassword: String(currentPassword || ''),
        newPassword: String(newPassword || '')
      })
    });
    const data = await resp.json();
    if (!resp.ok || !data || !data.ok) {
      throw new Error((data && data.error) || 'Failed to update password.');
    }
    return data;
  }

  global.SocialWavesAdminAuth = {
    checkSession: checkSession,
    login: login,
    logout: logout,
    changePassword: changePassword,
    requireAdmin: requireAdmin
  };
})(window);
