(function (global) {
  'use strict';

  const STORAGE_CAMPAIGNS_KEY = 'sw_custom_campaigns_v1';
  const STORAGE_STATS_KEY = 'sw_poster_stats_v1';

  const DEFAULT_CAMPAIGNS = [
    {
      id: '4SzGA',
      title: 'Blood Donation Camp',
      subtitle: 'Donate Blood, Save Lives • Today\'s Hero',
      badge: 'Health & Community',
      frameId: '5203',
      cropWidth: 243,
      cropHeight: 292,
      aspectRatio: 243 / 292, // 0.83219178082192 verified in 4SzGA
      slot: { x: 175, y: 245, w: 295, h: 354, radius: 42 },
      palette: { bg1: '#dc2626', bg2: '#f97316', accent: '#fef08a', dark: '#7f1d1d' },
      headerTag: 'DONOR • TODAY\'S HERO',
      footerText: 'Give Blood • Share Hope • Save a Life',
      fields: [
        { name: 'name', label: 'Name', type: 'text', required: true },
        {
          name: 'blood',
          label: 'SELECT BLOOD GROUP',
          type: 'select',
          required: true,
          options: ['A+ve', 'A-ve', 'B+ve', 'B-ve', 'O+ve', 'O-ve', 'AB+ve', 'AB-ve']
        }
      ],
      textSlots: [
        { field: 'name', x: 400, y: 845, font: '700 40px Montserrat, sans-serif', color: '#ffffff', align: 'center', maxWidth: 660 },
        { field: 'blood', prefix: 'Blood Group: ', x: 400, y: 902, font: '700 28px Poppins, sans-serif', color: '#fef08a', align: 'center', maxWidth: 600 }
      ],
      frames: [
        { id: '5203', label: 'Classic Red & Gold Frame', palette: { bg1: '#dc2626', bg2: '#f97316', accent: '#fef08a', dark: '#7f1d1d' } },
        { id: '5204', label: 'Royal Blue Hero Frame', palette: { bg1: '#1d4ed8', bg2: '#0ea5e9', accent: '#fde047', dark: '#1e3a8a' } }
      ]
    },
    {
      id: 'zpwQq',
      title: 'Thanal Thakkaram',
      subtitle: 'Community Charity & Care Drive',
      badge: 'Charity Campaign',
      frameId: '5202',
      cropWidth: 239,
      cropHeight: 300,
      aspectRatio: 239 / 300, // 0.79666666666667 verified in zpwQq
      slot: { x: 445, y: 215, w: 270, h: 339, radius: 34 },
      palette: { bg1: '#be123c', bg2: '#fb923c', accent: '#fde68a', dark: '#881337' },
      headerTag: 'COMMUNITY CARE INITIATIVE',
      footerText: 'Stand Together • Support Thanal Thakkaram',
      fields: [
        { name: 'name', label: 'Name', type: 'text', required: true }
      ],
      textSlots: [
        { field: 'name', x: 580, y: 605, font: '700 34px Montserrat, sans-serif', color: '#ffffff', align: 'center', maxWidth: 320 }
      ],
      frames: [
        { id: '5202', label: 'Crimson Sunset Frame', palette: { bg1: '#be123c', bg2: '#fb923c', accent: '#fde68a', dark: '#881337' } }
      ]
    },
    {
      id: 'BXm4L',
      title: 'Izathul islam, albirr',
      subtitle: 'Arts Fest 2K26 • Winners & Supporters',
      badge: 'Education & Arts',
      frameId: '5205',
      cropWidth: 260,
      cropHeight: 260,
      aspectRatio: 1,
      slot: { x: 245, y: 265, w: 310, h: 310, radius: 155 },
      palette: { bg1: '#1d4ed8', bg2: '#06b6d4', accent: '#facc15', dark: '#172554' },
      headerTag: 'ARTS FEST 2K26',
      footerText: 'Celebrating Talent, Creativity & Excellence',
      fields: [
        { name: 'name', label: 'Participant Name', type: 'text', required: true },
        { name: 'category', label: 'Category / Item', type: 'text', required: false }
      ],
      textSlots: [
        { field: 'name', x: 400, y: 830, font: '700 38px Montserrat, sans-serif', color: '#ffffff', align: 'center', maxWidth: 660 },
        { field: 'category', x: 400, y: 882, font: '600 24px Poppins, sans-serif', color: '#facc15', align: 'center', maxWidth: 620 }
      ]
    },
    {
      id: '9KXuV',
      title: 'Crescent - Golden jubilee',
      subtitle: '50 Years of Excellence & Legacy',
      badge: 'Jubilee Celebration',
      frameId: '5206',
      cropWidth: 280,
      cropHeight: 280,
      aspectRatio: 1,
      slot: { x: 260, y: 260, w: 280, h: 280, radius: 140 },
      palette: { bg1: '#84cc16', bg2: '#15803d', accent: '#fef08a', dark: '#14532d' },
      headerTag: 'GOLDEN JUBILEE • 50 YEARS',
      footerText: 'Honoring Our Past • Inspiring The Future',
      fields: [
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'batch', label: 'Batch / Role', type: 'text', required: false }
      ],
      textSlots: [
        { field: 'name', x: 400, y: 830, font: '700 38px Montserrat, sans-serif', color: '#ffffff', align: 'center', maxWidth: 660 },
        { field: 'batch', x: 400, y: 882, font: '600 24px Poppins, sans-serif', color: '#fef08a', align: 'center', maxWidth: 600 }
      ]
    },
    {
      id: 'WNveF',
      title: 'Class Topper',
      subtitle: 'Academic Excellence Congratulations Poster',
      badge: 'Achievement',
      frameId: '5207',
      cropWidth: 250,
      cropHeight: 300,
      aspectRatio: 250 / 300,
      slot: { x: 265, y: 245, w: 270, h: 324, radius: 28 },
      palette: { bg1: '#4338ca', bg2: '#7c3aed', accent: '#fde047', dark: '#312e81' },
      headerTag: 'CONGRATULATIONS • TOPPER',
      footerText: 'Proud Moment of Dedication & Success',
      fields: [
        { name: 'name', label: 'Student Name', type: 'text', required: true },
        { name: 'grade', label: 'Class / Rank', type: 'text', required: false }
      ],
      textSlots: [
        { field: 'name', x: 400, y: 830, font: '700 38px Montserrat, sans-serif', color: '#ffffff', align: 'center', maxWidth: 660 },
        { field: 'grade', x: 400, y: 882, font: '600 24px Poppins, sans-serif', color: '#fde047', align: 'center', maxWidth: 600 }
      ]
    },
    {
      id: 'q3AMy',
      title: 'Kasaragod District Musabaqa',
      subtitle: 'Best Wishes & Support Campaign',
      badge: 'Festival & Event',
      frameId: '5208',
      cropWidth: 250,
      cropHeight: 300,
      aspectRatio: 250 / 300,
      slot: { x: 265, y: 245, w: 270, h: 324, radius: 28 },
      palette: { bg1: '#0f766e', bg2: '#10b981', accent: '#fef9c3', dark: '#134e4a' },
      headerTag: 'DISTRICT MUSABAQA',
      footerText: 'Warm Wishes & Participation Pride',
      fields: [
        { name: 'name', label: 'Name', type: 'text', required: true }
      ],
      textSlots: [
        { field: 'name', x: 400, y: 850, font: '700 38px Montserrat, sans-serif', color: '#ffffff', align: 'center', maxWidth: 660 }
      ]
    },
    {
      id: '8jUUY',
      title: 'PATTAMBI Sub Dist Kalolsavam',
      subtitle: 'Arts & Cultural Festival Frame',
      badge: 'Kalolsavam',
      frameId: '5209',
      cropWidth: 260,
      cropHeight: 310,
      aspectRatio: 260 / 310,
      slot: { x: 260, y: 240, w: 280, h: 334, radius: 30 },
      palette: { bg1: '#b45309', bg2: '#eab308', accent: '#ffffff', dark: '#78350f' },
      headerTag: 'SUB DISTRICT KALOLSAVAM',
      footerText: 'Stage of Art, Rhythm & Tradition',
      fields: [
        { name: 'name', label: 'Name', type: 'text', required: true }
      ],
      textSlots: [
        { field: 'name', x: 400, y: 850, font: '700 38px Montserrat, sans-serif', color: '#ffffff', align: 'center', maxWidth: 660 }
      ]
    },
    {
      id: 'qicOC',
      title: 'Shasthrolsavam With Prize',
      subtitle: 'Science Fair Winner & Participant Poster',
      badge: 'Science Fair',
      frameId: '5210',
      cropWidth: 260,
      cropHeight: 300,
      aspectRatio: 260 / 300,
      slot: { x: 260, y: 245, w: 280, h: 323, radius: 24 },
      palette: { bg1: '#0284c7', bg2: '#38bdf8', accent: '#fef08a', dark: '#0c4a6e' },
      headerTag: 'SHASTHROLSAVAM',
      footerText: 'Celebrating Innovation & Young Minds',
      fields: [
        { name: 'name', label: 'Name', type: 'text', required: true },
        {
          name: 'prize',
          label: 'SELECT PRIZE / GRADE',
          type: 'select',
          required: false,
          options: ['First Prize', 'Second Prize', 'Third Prize', 'A Grade', 'Participant']
        }
      ],
      textSlots: [
        { field: 'name', x: 400, y: 835, font: '700 38px Montserrat, sans-serif', color: '#ffffff', align: 'center', maxWidth: 660 },
        { field: 'prize', x: 400, y: 888, font: '700 26px Poppins, sans-serif', color: '#fef08a', align: 'center', maxWidth: 600 }
      ]
    },
    {
      id: 'y4S0D',
      title: 'School Shasthrolsavam',
      subtitle: 'School Science Festival Campaign',
      badge: 'Science Fair',
      frameId: '5211',
      cropWidth: 260,
      cropHeight: 300,
      aspectRatio: 260 / 300,
      slot: { x: 260, y: 245, w: 280, h: 323, radius: 24 },
      palette: { bg1: '#0369a1', bg2: '#14b8a6', accent: '#fde047', dark: '#164e63' },
      headerTag: 'SCHOOL SHASTHROLSAVAM',
      footerText: 'Explore • Experiment • Excel',
      fields: [
        { name: 'name', label: 'Name', type: 'text', required: true }
      ],
      textSlots: [
        { field: 'name', x: 400, y: 850, font: '700 38px Montserrat, sans-serif', color: '#ffffff', align: 'center', maxWidth: 660 }
      ]
    },
    {
      id: 'z9qG7',
      title: 'South India Footwear Expo',
      subtitle: 'Trade Fair & Visitor Badge Poster',
      badge: 'Business Expo',
      frameId: '5212',
      cropWidth: 280,
      cropHeight: 280,
      aspectRatio: 1,
      slot: { x: 260, y: 255, w: 280, h: 280, radius: 24 },
      palette: { bg1: '#1e293b', bg2: '#334155', accent: '#1acc8d', dark: '#0f172a' },
      headerTag: 'TRADE EXPO 2026',
      footerText: 'I Will Be There • Connect & Grow',
      fields: [
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'company', label: 'Company / Brand', type: 'text', required: false }
      ],
      textSlots: [
        { field: 'name', x: 400, y: 830, font: '700 38px Montserrat, sans-serif', color: '#ffffff', align: 'center', maxWidth: 660 },
        { field: 'company', x: 400, y: 882, font: '600 24px Poppins, sans-serif', color: '#1acc8d', align: 'center', maxWidth: 600 }
      ]
    }
  ];

  function getCustomCampaigns() {
    try {
      const raw = localStorage.getItem(STORAGE_CAMPAIGNS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCustomCampaign(campaign) {
    try {
      const existing = getCustomCampaigns().filter(function (c) { return c.id !== campaign.id; });
      existing.unshift(campaign);
      localStorage.setItem(STORAGE_CAMPAIGNS_KEY, JSON.stringify(existing));
      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        error: (e && e.name === 'QuotaExceededError')
          ? 'Browser storage limit exceeded. Try a smaller image or delete old custom campaigns.'
          : ((e && e.message) || 'Could not save campaign to localStorage.')
      };
    }
  }

  function deleteCustomCampaign(id) {
    try {
      const existing = getCustomCampaigns().filter(function (c) { return c.id !== id; });
      localStorage.setItem(STORAGE_CAMPAIGNS_KEY, JSON.stringify(existing));
    } catch (e) {
      // ignore storage errors
    }
  }

  let REMOTE_CAMPAIGNS = [];
  let REMOTE_STATS = {};
  let SERVER_STATUS = { available: false, configured: false, mode: 'static' };
  let readyPromise = null;

  function fetchWithTimeout(url, opts, ms) {
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(function () { ctrl.abort(); }, ms || 3000) : null;
    const finalOpts = Object.assign({ cache: 'no-store', signal: ctrl ? ctrl.signal : undefined }, opts || {});
    return fetch(url, finalOpts).finally(function () {
      if (timer) clearTimeout(timer);
    });
  }

  function loadRemoteCampaigns() {
    if (typeof fetch !== 'function') return Promise.resolve([]);

    const tryStaticJson = function () {
      const urls = ['campaigns.json?t=' + Date.now()];
      try {
        const loc = global.location;
        if (loc && /\.github\.io$/i.test(loc.hostname || '')) {
          const owner = loc.hostname.split('.')[0];
          const segs = (loc.pathname || '').split('/').filter(Boolean);
          const repo = segs.length ? segs[0] : '';
          if (owner && repo) {
            urls.unshift(
              'https://raw.githubusercontent.com/' + encodeURIComponent(owner) + '/' +
              encodeURIComponent(repo) + '/main/campaigns.json?t=' + Date.now()
            );
          }
        }
      } catch (e) {
        // ignore
      }

      function tryUrl(idx) {
        if (idx >= urls.length) return Promise.resolve([]);
        return fetchWithTimeout(urls[idx], null, 2500)
          .then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
          })
          .then(function (data) {
            if (Array.isArray(data)) {
              REMOTE_CAMPAIGNS = data;
              return REMOTE_CAMPAIGNS;
            }
            return [];
          })
          .catch(function () {
            return tryUrl(idx + 1);
          });
      }
      return tryUrl(0);
    };

    return fetchWithTimeout('api/campaigns?t=' + Date.now(), null, 3000)
      .then(function (r) {
        const ct = (r.headers && r.headers.get && r.headers.get('content-type')) || '';
        if (!r.ok || ct.indexOf('application/json') === -1) {
          throw new Error('No API route');
        }
        return r.json();
      })
      .then(function (data) {
        if (data && data.ok) {
          SERVER_STATUS = {
            available: true,
            configured: Boolean(data.configured),
            mode: data.mode || 'none'
          };
          if (data.stats && typeof data.stats === 'object') {
            REMOTE_STATS = data.stats;
          }
          if (data.configured && Array.isArray(data.campaigns)) {
            REMOTE_CAMPAIGNS = data.campaigns;
            return REMOTE_CAMPAIGNS;
          }
        }
        return tryStaticJson();
      })
      .catch(function () {
        SERVER_STATUS = { available: false, configured: false, mode: 'static' };
        return tryStaticJson();
      });
  }

  function getServerStatus() {
    return Object.assign({}, SERVER_STATUS);
  }

  function saveCampaignToServer(campaign) {
    return fetch('api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ campaign: campaign })
    }).then(function (r) {
      return r.json().then(function (data) {
        if (!r.ok || !data || !data.ok) {
          throw new Error((data && data.error) || ('Server HTTP ' + r.status));
        }
        if (data.campaign) {
          const next = REMOTE_CAMPAIGNS.filter(function (c) { return c && c.id !== data.campaign.id; });
          next.unshift(data.campaign);
          REMOTE_CAMPAIGNS = next;
        }
        return data;
      });
    });
  }

  function deleteCampaignOnServer(id) {
    return fetch('api/campaigns?id=' + encodeURIComponent(id), {
      method: 'DELETE',
      credentials: 'same-origin'
    }).then(function (r) {
      REMOTE_CAMPAIGNS = REMOTE_CAMPAIGNS.filter(function (c) { return c && c.id !== id; });
      return r.ok;
    });
  }

  function ready() {
    if (!readyPromise) {
      readyPromise = loadRemoteCampaigns();
    }
    return readyPromise;
  }

  function setRemoteCampaigns(list) {
    REMOTE_CAMPAIGNS = Array.isArray(list) ? list : [];
  }

  function isCustomCampaign(id) {
    return getCustomCampaigns().some(function (c) { return c.id === id; }) ||
      REMOTE_CAMPAIGNS.some(function (c) { return c && c.id === id; });
  }

  function getAllCampaigns() {
    const byId = {};
    const order = [];
    const localList = getCustomCampaigns();
    const allSources = localList.concat(REMOTE_CAMPAIGNS).concat(DEFAULT_CAMPAIGNS);

    allSources.forEach(function (c) {
      if (!c || !c.id) return;
      const existing = byId[c.id];
      if (!existing) {
        byId[c.id] = c;
        order.push(c.id);
      } else if ((Number(c._updatedAt) || 0) > (Number(existing._updatedAt) || 0)) {
        byId[c.id] = c;
      }
    });

    return order.map(function (id) { return byId[id]; });
  }

  function encodeBase64Url(str) {
    try {
      const bytes = new TextEncoder().encode(str);
      let bin = '';
      for (let i = 0; i < bytes.length; i++) {
        bin += String.fromCharCode(bytes[i]);
      }
      return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch (e) {
      return '';
    }
  }

  function decodeBase64Url(token) {
    try {
      const padLen = (4 - (token.length % 4)) % 4;
      const b64 = token.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padLen);
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) {
        bytes[i] = bin.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    } catch (e) {
      return '';
    }
  }

  function isSyncedRemotely(campaign) {
    if (!campaign || !campaign.id) return false;
    if (DEFAULT_CAMPAIGNS.some(function (d) { return d.id === campaign.id; }) && !campaign._updatedAt) {
      return true;
    }
    const remote = REMOTE_CAMPAIGNS.find(function (r) { return r && r.id === campaign.id; });
    if (!remote) return false;
    return (Number(remote._updatedAt) || 0) >= (Number(campaign._updatedAt) || 0);
  }

  function encodeCampaignToken(campaign, options) {
    if (!campaign || !campaign.id) return '';
    const opts = options || {};
    const maxDataUrlLen = opts.maxDataUrlLen || 48000;
    const compact = {
      v: 2,
      i: campaign.id,
      t: campaign.title
    };
    if (campaign.subtitle) compact.s = campaign.subtitle;
    if (campaign.badge && campaign.badge !== 'Custom Campaign') compact.b = campaign.badge;
    if (campaign.frameWidth && campaign.frameWidth !== 800) compact.w = campaign.frameWidth;
    if (campaign.frameHeight && campaign.frameHeight !== 1000) compact.h = campaign.frameHeight;
    if (campaign.cropWidth && campaign.cropWidth !== 260) compact.cw = campaign.cropWidth;
    if (campaign.cropHeight && campaign.cropHeight !== 300) compact.ch = campaign.cropHeight;
    if (campaign.slot) {
      const sl = campaign.slot;
      compact.sl = [sl.x, sl.y, sl.w, sl.h, sl.radius || 0, sl.rotation || 0, sl.layer === 'above' ? 1 : 0];
    }
    if (campaign.palette) {
      const p = campaign.palette;
      compact.pl = [p.bg1, p.bg2, p.accent, p.dark];
    }
    if (campaign.headerTag) compact.ht = campaign.headerTag;
    if (campaign.footerText) compact.ft = campaign.footerText;
    if (campaign.fields && campaign.fields.length) {
      compact.f = campaign.fields.map(function (f) {
        const row = [f.name, f.label, f.type === 'select' ? 's' : 't', f.required ? 1 : 0];
        if (f.type === 'select' && f.options) row.push(f.options);
        return row;
      });
    }
    if (campaign.textSlots && campaign.textSlots.length) {
      compact.ts = campaign.textSlots.map(function (ts) {
        const obj = { f: ts.field, x: ts.x, y: ts.y };
        if (ts.staticValue) obj.sv = ts.staticValue;
        if (ts.prefix) obj.px = ts.prefix;
        if (ts.fontSize && ts.fontSize !== 36) obj.fs = ts.fontSize;
        if (ts.fontFamily && ts.fontFamily !== 'Montserrat, sans-serif') obj.ff = ts.fontFamily;
        if (ts.fontWeight && ts.fontWeight !== '700') obj.fw = ts.fontWeight;
        if (ts.textTransform && ts.textTransform !== 'none') obj.tt = ts.textTransform;
        if (ts.color && ts.color !== '#ffffff') obj.c = ts.color;
        if (ts.align && ts.align !== 'center') obj.a = ts.align;
        if (ts.maxWidth && ts.maxWidth !== 680) obj.mw = ts.maxWidth;
        if (ts.rotation) obj.r = ts.rotation;
        if (ts.shadow === false) obj.sh = 0;
        if (ts.bgEnabled) {
          obj.bg = 1;
          obj.bgc = ts.bgColor || '#047857';
        }
        return obj;
      });
    }
    if (campaign.customFrameUrl) compact.u = campaign.customFrameUrl;
    if (campaign.customFrameFallbackUrl) compact.fu = campaign.customFrameFallbackUrl;
    if (campaign.startDate) compact.sd = campaign.startDate;
    if (campaign.endDate) compact.ed = campaign.endDate;
    if (campaign.validityDays) compact.vd = Number(campaign.validityDays) || 0;
    if (campaign.customFrameDataUrl && campaign.customFrameDataUrl.length <= maxDataUrlLen) {
      compact.d = campaign.customFrameDataUrl;
    } else if (campaign.shareFrameDataUrl && campaign.shareFrameDataUrl.length <= maxDataUrlLen) {
      compact.d = campaign.shareFrameDataUrl;
    }
    return encodeBase64Url(JSON.stringify(compact));
  }

  function decodeCampaignToken(token) {
    if (!token) return null;
    try {
      const jsonStr = decodeBase64Url(String(token).trim());
      if (!jsonStr) return null;
      const p = JSON.parse(jsonStr);
      if (!p || typeof p !== 'object') return null;

      if (p.v === 2 && p.i && p.t) {
        const cw = Number(p.cw) || 260;
        const ch = Number(p.ch) || 300;
        const sl = Array.isArray(p.sl) ? p.sl : [260, 245, 280, 336, 28, 0, 0];
        const pl = Array.isArray(p.pl) ? p.pl : ['#047857', '#10b981', '#d1fae5', '#17211f'];
        return {
          id: p.i,
          title: p.t,
          subtitle: p.s || '',
          badge: p.b || 'Custom Campaign',
          frameId: 'custom-' + p.i,
          frameWidth: Number(p.w) || 800,
          frameHeight: Number(p.h) || 1000,
          cropWidth: cw,
          cropHeight: ch,
          aspectRatio: cw / ch,
          slot: { x: sl[0], y: sl[1], w: sl[2], h: sl[3], radius: sl[4] || 0, rotation: sl[5] || 0, layer: sl[6] ? 'above' : 'behind' },
          palette: { bg1: pl[0], bg2: pl[1], accent: pl[2], dark: pl[3] },
          headerTag: p.ht || '',
          footerText: p.ft || '',
          fields: (p.f || []).map(function (row) {
            const fObj = { name: row[0], label: row[1], type: row[2] === 's' ? 'select' : 'text', required: Boolean(row[3]) };
            if (fObj.type === 'select' && Array.isArray(row[4])) fObj.options = row[4];
            return fObj;
          }),
          textSlots: (p.ts || []).map(function (ts) {
            return {
              field: ts.f,
              staticValue: ts.sv || null,
              prefix: ts.px || '',
              x: ts.x,
              y: ts.y,
              fontSize: ts.fs || 36,
              fontFamily: ts.ff || 'Montserrat, sans-serif',
              fontWeight: ts.fw || '700',
              textTransform: ts.tt || 'none',
              color: ts.c || '#ffffff',
              align: ts.a || 'center',
              maxWidth: ts.mw || 680,
              rotation: ts.r || 0,
              shadow: ts.sh !== 0,
              bgEnabled: Boolean(ts.bg),
              bgColor: ts.bgc || '#047857'
            };
          }),
          customFrameUrl: p.u || '',
          customFrameFallbackUrl: p.fu || '',
          startDate: p.sd || '',
          endDate: p.ed || '',
          validityDays: Number(p.vd) || 0,
          customFrameDataUrl: p.d || null
        };
      }

      if (!p.id || !p.title) return null;
      return p;
    } catch (e) {
      return null;
    }
  }

  function resolveCampaignFromLocation(loc) {
    const targetLoc = loc || (typeof window !== 'undefined' ? window.location : null);
    if (!targetLoc) return null;
    let token = '';
    if (targetLoc.hash && targetLoc.hash.indexOf('c=') !== -1) {
      const hashParams = new URLSearchParams(targetLoc.hash.replace(/^#/, ''));
      token = hashParams.get('c') || '';
    }
    if (!token && targetLoc.search) {
      const searchParams = new URLSearchParams(targetLoc.search);
      token = searchParams.get('c') || '';
    }
    return token ? decodeCampaignToken(token) : null;
  }

  function getCampaignLaunchUrl(campaign) {
    if (!campaign || !campaign.id) return './';
    if ((isSyncedRemotely(campaign) || !isCustomCampaign(campaign.id)) && !campaign._forceShareToken) {
      return encodeURIComponent(campaign.id);
    }
    const base = 'campaign?id=' + encodeURIComponent(campaign.id);
    const token = encodeCampaignToken(campaign);
    if (!token || token.length > 60000) {
      return encodeURIComponent(campaign.id);
    }
    return base + '#c=' + token;
  }

  function getShortShareUrl(campaign) {
    if (!campaign || !campaign.id) return './';
    if ((isSyncedRemotely(campaign) || !isCustomCampaign(campaign.id)) && !campaign._forceShareToken) {
      return encodeURIComponent(campaign.id);
    }
    return getCampaignLaunchUrl(campaign);
  }

  function getCampaignById(id) {
    const list = getAllCampaigns();
    return list.find(function (c) { return c.id === id; }) || list[0];
  }

  function getActiveCampaignFromUrl(fallbackId) {
    const fromUrl = resolveCampaignFromLocation();
    if (fromUrl) {
      // Cache shared custom campaign locally if not already built-in
      if (!DEFAULT_CAMPAIGNS.some(function (d) { return d.id === fromUrl.id; })) {
        saveCustomCampaign(fromUrl);
      }
      return fromUrl;
    }
    return getCampaignById(fallbackId);
  }

  const STORAGE_METRICS_KEY = 'sw_campaign_metrics_v1';

  function parseYmdLocal(ymd) {
    const m = String(ymd || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  function formatYmdLocal(dateObj) {
    const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function getCampaignScheduleInfo(campaign, nowRef) {
    const now = nowRef ? new Date(nowRef) : new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const MS_DAY = 86400000;

    let start = parseYmdLocal(campaign && campaign.startDate);
    if (!start && campaign && (campaign.createdAt || campaign._updatedAt)) {
      const d = new Date(Number(campaign.createdAt || campaign._updatedAt));
      if (!isNaN(d.getTime())) start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
    const validityDays = Math.max(0, Number(campaign && campaign.validityDays) || 0);
    let end = parseYmdLocal(campaign && campaign.endDate);
    if (!end && validityDays > 0) {
      const baseStart = start || today;
      end = new Date(baseStart.getTime() + (validityDays - 1) * MS_DAY);
    }

    const startStr = start ? formatYmdLocal(start) : '';
    const endStr = end ? formatYmdLocal(end) : '';

    if (!end) {
      const daysRunning = start ? Math.max(1, Math.floor((today - start) / MS_DAY) + 1) : 0;
      return {
        status: 'unlimited',
        label: 'Unlimited',
        runLabel: daysRunning > 0 ? ('Running ' + daysRunning + 'd') : 'Always Active',
        daysLeft: Infinity,
        daysRunning: daysRunning,
        startDate: startStr,
        endDate: '',
        validityDays: 0
      };
    }

    if (start && today < start) {
      const startsIn = Math.ceil((start - today) / MS_DAY);
      return {
        status: 'scheduled',
        label: 'Starts in ' + startsIn + 'd',
        runLabel: startStr + ' -> ' + endStr,
        daysLeft: Math.round((end - start) / MS_DAY) + 1,
        daysRunning: 0,
        startDate: startStr,
        endDate: endStr,
        validityDays: validityDays
      };
    }

    const daysLeft = Math.round((end - today) / MS_DAY);
    const effectiveEnd = today < end ? today : end;
    const daysRunning = start ? Math.max(1, Math.round((effectiveEnd - start) / MS_DAY) + 1) : 0;

    if (daysLeft < 0) {
      const ago = Math.abs(daysLeft);
      return {
        status: 'expired',
        label: ago === 1 ? 'Expired 1d ago' : ('Expired ' + ago + 'd ago'),
        runLabel: daysRunning > 0 ? ('Ran ' + daysRunning + 'd') : ('Ended ' + endStr),
        daysLeft: daysLeft,
        daysRunning: daysRunning,
        startDate: startStr,
        endDate: endStr,
        validityDays: validityDays
      };
    }

    if (daysLeft <= 7) {
      return {
        status: 'expiring',
        label: daysLeft === 0 ? 'Ends Today' : (daysLeft + 'd left'),
        runLabel: daysRunning > 0 ? ('Day ' + daysRunning + (validityDays ? '/' + validityDays : '')) : ('Ends ' + endStr),
        daysLeft: daysLeft,
        daysRunning: daysRunning,
        startDate: startStr,
        endDate: endStr,
        validityDays: validityDays
      };
    }

    return {
      status: 'active',
      label: daysLeft + 'd left',
      runLabel: daysRunning > 0 ? ('Day ' + daysRunning + (validityDays ? '/' + validityDays : '')) : ('Ends ' + endStr),
      daysLeft: daysLeft,
      daysRunning: daysRunning,
      startDate: startStr,
      endDate: endStr,
      validityDays: validityDays
    };
  }

  function normalizeMetricEntry(val) {
    if (typeof val === 'number') {
      return { clicks: 0, posters: Math.max(0, val), downloads: 0 };
    }
    if (val && typeof val === 'object') {
      return {
        clicks: Math.max(0, Number(val.clicks) || 0),
        posters: Math.max(0, Number(val.posters) || 0),
        downloads: Math.max(0, Number(val.downloads) || 0)
      };
    }
    return { clicks: 0, posters: 0, downloads: 0 };
  }

  function getAllMetrics() {
    let localMetrics = {};
    let legacyStats = {};
    try {
      const rawM = localStorage.getItem(STORAGE_METRICS_KEY);
      localMetrics = rawM ? JSON.parse(rawM) : {};
    } catch (e) {
      localMetrics = {};
    }
    try {
      const rawL = localStorage.getItem(STORAGE_STATS_KEY);
      legacyStats = rawL ? JSON.parse(rawL) : {};
    } catch (e) {
      legacyStats = {};
    }

    const out = {};
    const allKeys = new Set([].concat(
      Object.keys(legacyStats || {}),
      Object.keys(localMetrics || {}),
      Object.keys(REMOTE_STATS || {})
    ));
    allKeys.forEach(function (id) {
      const leg = normalizeMetricEntry(legacyStats[id]);
      const loc = normalizeMetricEntry(localMetrics[id]);
      const rem = normalizeMetricEntry(REMOTE_STATS[id]);
      out[id] = {
        clicks: Math.max(leg.clicks, loc.clicks, rem.clicks),
        posters: Math.max(leg.posters, loc.posters, rem.posters),
        downloads: Math.max(leg.downloads, loc.downloads, rem.downloads)
      };
    });
    return out;
  }

  function getPosterStats() {
    const all = getAllMetrics();
    const out = {};
    Object.keys(all).forEach(function (k) {
      out[k] = all[k].posters;
    });
    return out;
  }

  function recordMetric(campaignId, eventType, formValues) {
    if (!campaignId) return { clicks: 0, posters: 0, downloads: 0 };
    const ev = (eventType === 'click' || eventType === 'download') ? eventType : 'poster';
    const all = getAllMetrics();
    const cur = all[campaignId] ? Object.assign({}, all[campaignId]) : { clicks: 0, posters: 0, downloads: 0 };
    if (ev === 'click') cur.clicks += 1;
    else if (ev === 'download') cur.downloads += 1;
    else cur.posters += 1;

    try {
      const rawM = localStorage.getItem(STORAGE_METRICS_KEY);
      const saved = rawM ? JSON.parse(rawM) : {};
      saved[campaignId] = cur;
      localStorage.setItem(STORAGE_METRICS_KEY, JSON.stringify(saved));
      if (ev === 'poster') {
        const rawL = localStorage.getItem(STORAGE_STATS_KEY);
        const leg = rawL ? JSON.parse(rawL) : {};
        leg[campaignId] = cur.posters;
        localStorage.setItem(STORAGE_STATS_KEY, JSON.stringify(leg));
      }
    } catch (e) {
      // ignore storage errors
    }

    if (SERVER_STATUS && SERVER_STATUS.available && typeof fetch === 'function') {
      fetch('api/posters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({ campaignId: campaignId, event: ev, formValues: formValues || {} })
      }).then(function (r) { return r.json(); }).then(function (d) {
        if (d && d.ok && d.metrics) {
          REMOTE_STATS[campaignId] = normalizeMetricEntry(d.metrics);
        } else if (d && d.ok && typeof d.count === 'number') {
          const prev = normalizeMetricEntry(REMOTE_STATS[campaignId]);
          prev.posters = d.count;
          REMOTE_STATS[campaignId] = prev;
        }
      }).catch(function () {});
    }

    return cur;
  }

  function incrementPosterStat(campaignId, formValues) {
    return recordMetric(campaignId, 'poster', formValues).posters;
  }

  function drawRoundedRectPath(ctx, x, y, w, h, r) {
    const radius = Math.min(r || 0, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  /**
   * Generates a crisp 800x1000 PNG data URL representing the campaign frame overlay
   * with a genuine transparent cutout window at `campaign.slot` (unless `showPlaceholder` is true).
   */
  function renderFrameDataUrl(campaign, options) {
    const opts = options || {};
    const showPlaceholder = Boolean(opts.showPlaceholder);
    const frameOverride = opts.frame || null;
    const palette = (frameOverride && frameOverride.palette) || campaign.palette || {
      bg1: '#010483', bg2: '#0062e6', accent: '#1acc8d', dark: '#010246'
    };

    const W = 800;
    const H = 1000;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, palette.bg1);
    grad.addColorStop(1, palette.bg2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Subtle geometric accents
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.arc(690, 120, 170, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(100, 880, 190, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Bottom dark banner strip for name & details
    ctx.fillStyle = palette.dark;
    ctx.fillRect(0, 745, W, 255);

    // Accent divider wave/bar
    ctx.fillStyle = palette.accent;
    ctx.fillRect(0, 738, W, 10);

    // Top badge pill
    const tag = (campaign.headerTag || 'SOCIALWAVES CAMPAIGN').toUpperCase();
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.24)';
    drawRoundedRectPath(ctx, 180, 44, 440, 44, 22);
    ctx.fill();
    ctx.fillStyle = palette.accent;
    ctx.font = '700 18px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tag, W / 2, 66);
    ctx.restore();

    // Campaign Title at top
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 40px Montserrat, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(campaign.title, W / 2, 148, 720);
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.font = '500 20px Open Sans, sans-serif';
    ctx.fillText(campaign.subtitle || '', W / 2, 184, 700);
    ctx.restore();

    // Footer brand strip
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    ctx.font = '600 17px Open Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(campaign.footerText || 'Create your personalised poster', W / 2, 956, 700);
    ctx.restore();

    // Cut out the photo slot window cleanly
    const slot = campaign.slot || { x: 260, y: 245, w: 280, h: 336, radius: 28 };

    // Outer glow / border around slot
    ctx.save();
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 10;
    drawRoundedRectPath(ctx, slot.x - 5, slot.y - 5, slot.w + 10, slot.h + 10, (slot.radius || 24) + 4);
    ctx.stroke();
    ctx.restore();

    if (showPlaceholder) {
      ctx.save();
      ctx.fillStyle = '#ffffff';
      drawRoundedRectPath(ctx, slot.x, slot.y, slot.w, slot.h, slot.radius || 24);
      ctx.fill();
      ctx.fillStyle = '#9ca3af';
      ctx.font = '600 20px Poppins, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('YOUR PHOTO', slot.x + slot.w / 2, slot.y + slot.h / 2 - 8);
      ctx.font = '500 14px Open Sans, sans-serif';
      ctx.fillText(campaign.cropWidth + '×' + campaign.cropHeight + ' ratio', slot.x + slot.w / 2, slot.y + slot.h / 2 + 18);
      ctx.restore();
    } else {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000000';
      drawRoundedRectPath(ctx, slot.x, slot.y, slot.w, slot.h, slot.radius || 24);
      ctx.fill();
      ctx.restore();
    }

    return canvas.toDataURL('image/png');
  }

  /**
   * Shared compositor used by both campaign.html and studio.html so positioning,
   * corner radius, rotation, layer order, and text placement behave identically.
   */
  function drawPosterComposite(ctx, width, height, campaign, photoDrawable, overlayImg, formValues) {
    const slot = campaign.slot || { x: 260, y: 245, w: 280, h: 336, radius: 28, rotation: 0, layer: 'behind' };
    const layer = slot.layer || 'behind';

    function drawPhotoInSlot() {
      if (!photoDrawable) return;
      const cx = slot.x + slot.w / 2;
      const cy = slot.y + slot.h / 2;
      const rad = ((slot.rotation || 0) * Math.PI) / 180;
      ctx.save();
      ctx.translate(cx, cy);
      if (rad) ctx.rotate(rad);
      drawRoundedRectPath(ctx, -slot.w / 2, -slot.h / 2, slot.w, slot.h, slot.radius || 0);
      ctx.clip();
      ctx.drawImage(photoDrawable, -slot.w / 2, -slot.h / 2, slot.w, slot.h);
      ctx.restore();
    }

    ctx.clearRect(0, 0, width, height);
    if (layer === 'behind') {
      drawPhotoInSlot();
      if (overlayImg) ctx.drawImage(overlayImg, 0, 0, width, height);
    } else {
      if (overlayImg) ctx.drawImage(overlayImg, 0, 0, width, height);
      drawPhotoInSlot();
    }

    (campaign.textSlots || []).forEach(function (ts) {
      const hasStatic = ts.staticValue != null && String(ts.staticValue).trim() !== '';
      const rawVal = hasStatic ? String(ts.staticValue).trim() : ((formValues && formValues[ts.field]) || '').trim();
      if (!rawVal) return;
      let text = (ts.prefix || '') + rawVal;
      if (ts.textTransform === 'uppercase') text = text.toUpperCase();
      else if (ts.textTransform === 'lowercase') text = text.toLowerCase();
      else if (ts.textTransform === 'capitalize') {
        text = text.replace(/\b\w/g, function (ch) { return ch.toUpperCase(); });
      }

      const fontWeight = ts.fontWeight || '700';
      const fontSize = Number(ts.fontSize) || 36;
      const fontFamily = ts.fontFamily || 'Montserrat, sans-serif';
      const fontSpec = ts.font || (fontWeight + ' ' + fontSize + 'px ' + fontFamily);
      const maxWidth = Number(ts.maxWidth) || 680;
      const align = ts.align || 'center';
      const rotRad = ((Number(ts.rotation) || 0) * Math.PI) / 180;

      ctx.save();
      ctx.translate(ts.x, ts.y);
      if (rotRad) ctx.rotate(rotRad);
      ctx.font = fontSpec;
      ctx.textAlign = align;
      ctx.textBaseline = 'middle';

      if (ts.bgEnabled && ts.bgColor) {
        const metrics = ctx.measureText(text);
        const textW = Math.min(maxWidth, metrics.width);
        const padX = Math.max(16, Math.round(fontSize * 0.65));
        const padY = Math.max(10, Math.round(fontSize * 0.4));
        const boxW = textW + padX * 2;
        const boxH = fontSize + padY * 2;
        let boxX = -boxW / 2;
        if (align === 'left') boxX = -padX;
        else if (align === 'right') boxX = -textW - padX;
        ctx.fillStyle = ts.bgColor;
        drawRoundedRectPath(ctx, boxX, -boxH / 2, boxW, boxH, Math.round(boxH / 2));
        ctx.fill();
      }

      if (ts.shadow !== false) {
        ctx.shadowColor = 'rgba(0,0,0,0.38)';
        ctx.shadowBlur = 6;
      }
      ctx.fillStyle = ts.color || '#ffffff';
      ctx.fillText(text, 0, 0, maxWidth);
      ctx.restore();
    });
  }

  global.SocialWavesData = {
    DEFAULT_CAMPAIGNS: DEFAULT_CAMPAIGNS,
    ready: ready,
    loadRemoteCampaigns: loadRemoteCampaigns,
    setRemoteCampaigns: setRemoteCampaigns,
    getServerStatus: getServerStatus,
    saveCampaignToServer: saveCampaignToServer,
    deleteCampaignOnServer: deleteCampaignOnServer,
    getAllCampaigns: getAllCampaigns,
    getCampaignById: getCampaignById,
    getActiveCampaignFromUrl: getActiveCampaignFromUrl,
    encodeCampaignToken: encodeCampaignToken,
    decodeCampaignToken: decodeCampaignToken,
    resolveCampaignFromLocation: resolveCampaignFromLocation,
    getCampaignLaunchUrl: getCampaignLaunchUrl,
    getShortShareUrl: getShortShareUrl,
    isSyncedRemotely: isSyncedRemotely,
    saveCustomCampaign: saveCustomCampaign,
    deleteCustomCampaign: deleteCustomCampaign,
    isCustomCampaign: isCustomCampaign,
    getCampaignScheduleInfo: getCampaignScheduleInfo,
    getAllMetrics: getAllMetrics,
    recordMetric: recordMetric,
    getPosterStats: getPosterStats,
    incrementPosterStat: incrementPosterStat,
    renderFrameDataUrl: renderFrameDataUrl,
    drawRoundedRectPath: drawRoundedRectPath,
    drawPosterComposite: drawPosterComposite
  };
})(window);
