<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SocialWaves | PHP &amp; MySQL Setup Wizard</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet">
  <link href="css/style.css" rel="stylesheet">
  <style>
    body.setup-dark {
      background: radial-gradient(circle at 15% 12%, rgba(34, 211, 238, 0.14), transparent 38%),
                  radial-gradient(circle at 86% 14%, rgba(34, 197, 94, 0.12), transparent 36%),
                  #0b1026;
      color: #f8fafc;
      min-height: 100vh;
      margin: 0;
      padding: 36px 16px;
      font-family: "Inter", sans-serif;
    }
    .setup-shell {
      max-width: 680px;
      margin: 0 auto;
      background: #12183a;
      border: 1px solid rgba(148, 163, 184, 0.18);
      border-radius: 18px;
      padding: 28px;
      box-shadow: 0 24px 60px rgba(3, 6, 23, 0.6);
    }
    .setup-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 18px; border-bottom: 1px solid rgba(148, 163, 184, 0.14); padding-bottom: 14px; }
    .setup-head h1 { margin: 0; font-size: 22px; color: #ffffff; font-family: "Plus Jakarta Sans", sans-serif; }
    .setup-pill { padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; background: rgba(34, 211, 238, 0.14); color: #22d3ee; border: 1px solid rgba(34, 211, 238, 0.35); }
    .setup-sec { background: #171e46; border: 1px solid rgba(148, 163, 184, 0.14); border-radius: 12px; padding: 18px; margin-bottom: 16px; }
    .setup-sec h2 { margin: 0 0 12px; font-size: 15px; color: #22d3ee; font-weight: 700; }
    .setup-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .setup-field { margin-bottom: 12px; }
    .setup-field label { display: block; font-size: 12.5px; font-weight: 600; color: #cbd5e1; margin-bottom: 6px; }
    .setup-field input {
      width: 100%; min-height: 42px; padding: 9px 12px; border-radius: 10px;
      border: 1px solid rgba(148, 163, 184, 0.24); background: #0f1535; color: #ffffff;
      font-size: 14px; font-family: inherit; box-sizing: border-box;
    }
    .setup-field input:focus { outline: none; border-color: #22d3ee; box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.2); }
    .setup-actions { display: flex; gap: 10px; flex-wrap: wrap; }
    .btn-primary-setup {
      flex: 1; min-height: 44px; border: 0; border-radius: 999px; cursor: pointer;
      background: linear-gradient(135deg, #06b6d4, #22c55e); color: #071026;
      font-weight: 800; font-size: 14px; padding: 10px 20px;
    }
    .btn-secondary-setup {
      min-height: 44px; border-radius: 999px; cursor: pointer; padding: 10px 18px;
      background: #1c2452; color: #e2e8f0; border: 1px solid rgba(148, 163, 184, 0.26); font-weight: 700; font-size: 13.5px;
      text-decoration: none; display: inline-flex; align-items: center; justify-content: center;
    }
    .setup-status { margin-top: 12px; font-size: 13px; min-height: 20px; }
    @media (max-width: 620px) { .setup-grid-2 { grid-template-columns: 1fr; } }
  </style>
</head>
<body class="setup-dark">
  <div class="setup-shell">
    <div class="setup-head">
      <div>
        <h1>PHP &amp; MySQL Setup Wizard</h1>
        <p style="margin:4px 0 0;font-size:13px;color:#94a3b8;">Configure database connection and initialize your Super Admin password system.</p>
      </div>
      <span class="setup-pill" id="setup-state-pill">Checking server...</span>
    </div>

    <div id="setup-locked-box" class="setup-sec" style="display:none;text-align:center;">
      <h2 style="color:#4ade80;">System Already Configured</h2>
      <p style="font-size:13.5px;color:#cbd5e1;margin:0 0 16px;">A Super Admin account already exists in MySQL. Sign in as Super Admin to view or update database settings.</p>
      <div class="setup-actions" style="justify-content:center;">
        <a href="login?next=dashboard" class="btn-primary-setup" style="flex:0 1 220px;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;">Admin Sign In &rarr;</a>
        <a href="./" class="btn-secondary-setup">Home</a>
      </div>
    </div>

    <form id="setup-form" style="display:none;">
      <div class="setup-sec">
        <h2>1. MySQL Database Connection</h2>
        <div class="setup-grid-2">
          <div class="setup-field">
            <label for="s-host">MySQL Host</label>
            <input id="s-host" value="127.0.0.1" required>
          </div>
          <div class="setup-field">
            <label for="s-port">Port</label>
            <input id="s-port" value="3306" required>
          </div>
        </div>
        <div class="setup-grid-2">
          <div class="setup-field">
            <label for="s-db">Database Name</label>
            <input id="s-db" value="socialwaves_db" required>
          </div>
          <div class="setup-field">
            <label for="s-user">MySQL Username</label>
            <input id="s-user" value="root" required>
          </div>
        </div>
        <div class="setup-field" style="margin-bottom:0;">
          <label for="s-dbpass">MySQL Password (leave blank for default XAMPP)</label>
          <input id="s-dbpass" type="password" placeholder="MySQL password (optional)">
        </div>
      </div>

      <div class="setup-sec" id="setup-admin-box">
        <h2>2. Initial Super Admin Account &amp; Password</h2>
        <div class="setup-field">
          <label for="s-admin-user">Super Admin Username</label>
          <input id="s-admin-user" required minlength="3" maxlength="40" pattern="[A-Za-z0-9_.-]{3,40}" placeholder="e.g. admin">
        </div>
        <div class="setup-grid-2">
          <div class="setup-field" style="margin-bottom:0;">
            <label for="s-admin-pass">Password (min 6 chars)</label>
            <input id="s-admin-pass" type="password" required minlength="6" autocomplete="new-password">
          </div>
          <div class="setup-field" style="margin-bottom:0;">
            <label for="s-admin-pass2">Confirm Password</label>
            <input id="s-admin-pass2" type="password" required minlength="6" autocomplete="new-password">
          </div>
        </div>
      </div>

      <div class="setup-actions">
        <button type="button" id="test-db-btn" class="btn-secondary-setup">Test MySQL</button>
        <button type="submit" id="save-setup-btn" class="btn-primary-setup">Save Setup &amp; Initialize Database</button>
      </div>
      <div class="setup-status" id="setup-status"></div>
    </form>

    <div style="margin-top:16px;text-align:center;font-size:12.5px;color:#94a3b8;">
      <a href="./" style="color:#22d3ee;text-decoration:none;font-weight:600;">&larr; Back to SocialWaves</a>
      &nbsp;&bull;&nbsp;
      <a href="login" style="color:#cbd5e1;text-decoration:none;">Admin Login</a>
    </div>
  </div>

  <script>
    (function () {
      const form = document.getElementById('setup-form');
      const lockedBox = document.getElementById('setup-locked-box');
      const adminBox = document.getElementById('setup-admin-box');
      const pill = document.getElementById('setup-state-pill');
      const statusEl = document.getElementById('setup-status');
      const testBtn = document.getElementById('test-db-btn');

      function setMsg(text, color) {
        statusEl.style.color = color || '#cbd5e1';
        statusEl.textContent = text;
      }

      fetch('api/setup?t=' + Date.now(), { cache: 'no-store', credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.config) {
            document.getElementById('s-host').value = data.config.db_host || '127.0.0.1';
            document.getElementById('s-port').value = data.config.db_port || '3306';
            document.getElementById('s-db').value = data.config.db_name || 'socialwaves_db';
            document.getElementById('s-user').value = data.config.db_user || 'root';
          }
          if (data.locked) {
            pill.textContent = 'Locked (Configured)';
            lockedBox.style.display = 'block';
            return;
          }
          form.style.display = 'block';
          if (data.needsSetup) {
            pill.textContent = data.connected ? 'Ready for Admin Creation' : 'Database Setup Needed';
            adminBox.style.display = 'block';
          } else {
            pill.textContent = 'Super Admin Config Mode';
            adminBox.style.display = 'none';
            document.getElementById('s-admin-user').required = false;
            document.getElementById('s-admin-pass').required = false;
            document.getElementById('s-admin-pass2').required = false;
          }
        })
        .catch(function () {
          pill.textContent = 'PHP Server Required';
          form.style.display = 'block';
          setMsg('Run this site through XAMPP Apache + PHP to execute MySQL setup.', '#fbbf24');
        });

      function payload(action) {
        return {
          action: action,
          dbHost: document.getElementById('s-host').value.trim(),
          dbPort: document.getElementById('s-port').value.trim(),
          dbName: document.getElementById('s-db').value.trim(),
          dbUser: document.getElementById('s-user').value.trim(),
          dbPass: document.getElementById('s-dbpass').value,
          adminUsername: document.getElementById('s-admin-user').value.trim(),
          adminPassword: document.getElementById('s-admin-pass').value
        };
      }

      testBtn.addEventListener('click', function () {
        setMsg('Testing MySQL connection...', '#94a3b8');
        fetch('api/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(payload('test'))
        }).then(function (r) { return r.json(); }).then(function (res) {
          setMsg(res.ok ? res.message : (res.error || 'Connection failed'), res.ok ? '#4ade80' : '#f87171');
        }).catch(function () {
          setMsg('Could not reach PHP setup API.', '#f87171');
        });
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (adminBox.style.display !== 'none') {
          const p1 = document.getElementById('s-admin-pass').value;
          const p2 = document.getElementById('s-admin-pass2').value;
          if (p1 !== p2) {
            setMsg('Passwords do not match.', '#f87171');
            return;
          }
        }
        setMsg('Saving config & initializing database...', '#94a3b8');
        fetch('api/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(payload('save'))
        }).then(function (r) { return r.json(); }).then(function (res) {
          if (!res.ok) {
            setMsg(res.error || 'Setup failed.', '#f87171');
            return;
          }
          setMsg(res.message + ' Redirecting to Dashboard...', '#4ade80');
          setTimeout(function () { window.location.href = 'dashboard'; }, 1000);
        }).catch(function () {
          setMsg('Could not reach PHP setup API.', '#f87171');
        });
      });
    })();
  </script>
</body>
</html>
