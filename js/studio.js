(function () {
  'use strict';

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      const img = new Image();
      if (/^https?:\/\//i.test(src || '')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = src;
    });
  }

  function buildShareFrameDataUrl(img, currentDataUrl) {
    if (currentDataUrl && currentDataUrl.length <= 44000) {
      return currentDataUrl;
    }
    try {
      const srcW = img.naturalWidth || 800;
      const srcH = img.naturalHeight || 1000;
      const maxSides = [640, 520, 420, 340];
      const qualities = [0.76, 0.58, 0.42];
      let smallest = currentDataUrl || '';

      for (let i = 0; i < maxSides.length; i++) {
        const scale = Math.min(1, maxSides[i] / Math.max(srcW, srcH));
        const w = Math.max(80, Math.round(srcW * scale));
        const h = Math.max(80, Math.round(srcH * scale));
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const cx = c.getContext('2d');
        cx.drawImage(img, 0, 0, w, h);
        for (let q = 0; q < qualities.length; q++) {
          const url = c.toDataURL('image/webp', qualities[q]);
          if (url && url.indexOf('data:image/webp') === 0) {
            if (!smallest || url.length < smallest.length) smallest = url;
            if (url.length <= 44000) return url;
          }
        }
      }
      return smallest;
    } catch (e) {
      return currentDataUrl || '';
    }
  }

  function optimizeUploadedFrame(img, origDataUrl) {
    try {
      const srcW = img.naturalWidth || 800;
      const srcH = img.naturalHeight || 1000;
      const maxDim = 1080;
      const scale = Math.min(1, maxDim / Math.max(srcW, srcH));
      const targetW = Math.max(100, Math.round(srcW * scale));
      const targetH = Math.max(100, Math.round(srcH * scale));
      if (scale === 1 && origDataUrl && origDataUrl.length <= 180000) {
        return {
          dataUrl: origDataUrl,
          shareDataUrl: buildShareFrameDataUrl(img, origDataUrl),
          width: srcW,
          height: srcH
        };
      }
      const c = document.createElement('canvas');
      c.width = targetW;
      c.height = targetH;
      const cx = c.getContext('2d');
      cx.drawImage(img, 0, 0, targetW, targetH);
      const webpUrl = c.toDataURL('image/webp', 0.85);
      if (webpUrl && webpUrl.indexOf('data:image/webp') === 0 && (!origDataUrl || webpUrl.length < origDataUrl.length)) {
        return {
          dataUrl: webpUrl,
          shareDataUrl: buildShareFrameDataUrl(img, webpUrl),
          width: targetW,
          height: targetH
        };
      }
      const pngUrl = c.toDataURL('image/png');
      if (pngUrl && (!origDataUrl || pngUrl.length < origDataUrl.length)) {
        return {
          dataUrl: pngUrl,
          shareDataUrl: buildShareFrameDataUrl(img, pngUrl),
          width: targetW,
          height: targetH
        };
      }
    } catch (e) {
      // fall back to original if canvas optimization fails
    }
    return {
      dataUrl: origDataUrl,
      shareDataUrl: buildShareFrameDataUrl(img, origDataUrl),
      width: img.naturalWidth || 800,
      height: img.naturalHeight || 1000
    };
  }

  function makeSamplePortraitCanvas() {
    const c = document.createElement('canvas');
    c.width = 400;
    c.height = 480;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 400, 480);
    g.addColorStop(0, '#d1fae5');
    g.addColorStop(1, '#a7f3d0');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 400, 480);
    ctx.fillStyle = '#047857';
    ctx.beginPath();
    ctx.arc(200, 165, 72, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(200, 430, 150, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#064e3b';
    ctx.font = '700 22px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SAMPLE PHOTO', 200, 452);
    return c;
  }

  function slugify(str) {
    return String(str || '')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 20) || ('Camp-' + String(Date.now()).slice(-4));
  }

  function createTextFieldConfig(overrides) {
    return Object.assign({
      key: 'field_' + Math.random().toString(36).slice(2, 7),
      label: 'Name',
      type: 'text', // 'text' | 'select' | 'static'
      required: false,
      optionsText: 'Option 1, Option 2',
      sample: 'Sample Text',
      prefix: '',
      x: 400,
      y: 830,
      fontSize: 36,
      fontFamily: 'Montserrat, sans-serif',
      fontWeight: '700',
      textTransform: 'none',
      color: '#ffffff',
      align: 'center',
      maxWidth: 680,
      rotation: 0,
      shadow: true,
      bgEnabled: false,
      bgColor: '#047857'
    }, overrides || {});
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!window.SocialWavesData) return;

    function initStudioLogout() {
      function doLogout(e) {
        e.preventDefault();
        if (window.SocialWavesAdminAuth) {
          window.SocialWavesAdminAuth.logout().then(function () {
            window.location.href = 'login';
          });
        } else {
          sessionStorage.removeItem('sw_admin_logged_in');
          window.location.href = 'login';
        }
      }
      const btn = document.getElementById('studio-logout-btn');
      const mBtn = document.getElementById('studio-mobile-logout-btn');
      if (btn) btn.addEventListener('click', doLogout);
      if (mBtn) mBtn.addEventListener('click', doLogout);
    }

    const authGate = window.SocialWavesAdminAuth
      ? window.SocialWavesAdminAuth.requireAdmin('studio')
      : Promise.resolve({ authenticated: true });

    authGate.then(function (sessionInfo) {
      if (!sessionInfo) return;
      document.body.classList.remove('admin-locked');
      initStudioLogout();
      bootStudioApp();
    });
  });

  function bootStudioApp() {

    const canvas = document.getElementById('studio-canvas');
    const ctx = canvas.getContext('2d');
    const samplePhoto = makeSamplePortraitCanvas();

    const state = {
      id: '',
      title: 'My Custom Campaign',
      subtitle: 'Create your personalised poster to show support',
      badge: 'Custom Campaign',
      headerTag: 'SOCIALWAVES CAMPAIGN',
      footerText: 'Create your personalised poster',
      frameMode: 'generated',
      customFrameDataUrl: null,
      shareFrameDataUrl: null,
      customFrameUrl: '',
      uploadedFrameImg: null,
      generatedOverlayImg: null,
      frameWidth: 800,
      frameHeight: 1000,
      palette: { bg1: '#047857', bg2: '#10b981', accent: '#d1fae5', dark: '#17211f' },
      slot: { x: 260, y: 245, w: 280, h: 336, radius: 28, rotation: 0, layer: 'behind' },
      showSamplePhoto: true,
      showGuides: true,
      lockAspect: false,
      lockedRatio: 280 / 336,
      textFields: [
        createTextFieldConfig({
          key: 'name',
          label: 'Name',
          type: 'text',
          required: true,
          sample: 'Alex Johnson',
          x: 400,
          y: 830,
          fontSize: 38,
          color: '#ffffff'
        }),
        createTextFieldConfig({
          key: 'extra',
          label: 'Role / Group',
          type: 'text',
          required: false,
          sample: 'Campaign Supporter',
          x: 400,
          y: 886,
          fontSize: 24,
          fontWeight: '600',
          color: '#d1fae5'
        })
      ]
    };

    const els = {
      title: document.getElementById('st-title'),
      subtitle: document.getElementById('st-subtitle'),
      id: document.getElementById('st-id'),
      badge: document.getElementById('st-badge'),
      headerTag: document.getElementById('st-header-tag'),
      footerText: document.getElementById('st-footer-text'),
      modeRadios: document.querySelectorAll('input[name="frame-mode"]'),
      generatedBox: document.getElementById('generated-frame-controls'),
      uploadedBox: document.getElementById('uploaded-frame-controls'),
      bg1: document.getElementById('st-bg1'),
      bg2: document.getElementById('st-bg2'),
      accent: document.getElementById('st-accent'),
      dark: document.getElementById('st-dark'),
      frameFile: document.getElementById('st-frame-file'),
      frameUrl: document.getElementById('st-frame-url'),
      autoDetectBtn: document.getElementById('st-auto-detect'),
      frameDims: document.getElementById('st-frame-dims'),

      slotX: document.getElementById('slot-x'),
      slotXNum: document.getElementById('slot-x-num'),
      slotY: document.getElementById('slot-y'),
      slotYNum: document.getElementById('slot-y-num'),
      slotW: document.getElementById('slot-w'),
      slotWNum: document.getElementById('slot-w-num'),
      slotH: document.getElementById('slot-h'),
      slotHNum: document.getElementById('slot-h-num'),
      slotRadius: document.getElementById('slot-radius'),
      slotRadiusNum: document.getElementById('slot-radius-num'),
      slotRot: document.getElementById('slot-rot'),
      slotRotNum: document.getElementById('slot-rot-num'),
      slotLayer: document.getElementById('slot-layer'),
      lockAspect: document.getElementById('slot-lock-aspect'),
      showSample: document.getElementById('st-show-sample'),
      showGuides: document.getElementById('st-show-guides'),
      hudReadout: document.getElementById('hud-readout'),

      textFieldsList: document.getElementById('text-fields-list'),
      addTopTextBtn: document.getElementById('st-add-top-text'),
      addTextBtn: document.getElementById('st-add-text'),

      publishBtn: document.getElementById('st-publish-btn'),
      publishStatus: document.getElementById('st-publish-status'),
      savedList: document.getElementById('st-saved-list'),

      ghSyncBox: document.getElementById('gh-sync-box'),
      ghOwner: document.getElementById('gh-owner'),
      ghRepo: document.getElementById('gh-repo'),
      ghBranch: document.getElementById('gh-branch'),
      ghToken: document.getElementById('gh-token'),
      ghSaveTestBtn: document.getElementById('gh-save-test-btn'),
      ghDisconnectBtn: document.getElementById('gh-disconnect-btn'),
      ghStatusPill: document.getElementById('gh-status-pill'),
      ghTestMsg: document.getElementById('gh-test-msg')
    };

    const RESERVED_SLUGS = new Set([
      'all-campaigns', 'studio', 'login', 'dashboard', 'terms', 'policy', 'index', 'campaign', 'css', 'js', 'assets'
    ]);

    function buildCampaignPayload() {
      let id = (els.id.value.trim() || slugify(els.title.value)).replace(/[^a-zA-Z0-9_-]/g, '-');
      if (RESERVED_SLUGS.has(id.toLowerCase())) {
        id = id + '-' + String(Date.now()).slice(-4);
      }

      const fields = [];
      const textSlots = [];

      state.textFields.forEach(function (tf, idx) {
        const fieldName = tf.key || ('field_' + idx);
        if (tf.type !== 'static') {
          const fObj = {
            name: fieldName,
            label: tf.label || ('Field ' + (idx + 1)),
            type: tf.type || 'text',
            required: Boolean(tf.required || idx === 0)
          };
          if (fObj.type === 'select') {
            fObj.options = String(tf.optionsText || '')
              .split(',')
              .map(function (s) { return s.trim(); })
              .filter(Boolean);
          }
          fields.push(fObj);
        }

        textSlots.push({
          field: fieldName,
          staticValue: tf.type === 'static' ? tf.sample : null,
          prefix: tf.prefix || '',
          x: Math.round(tf.x),
          y: Math.round(tf.y),
          fontSize: Number(tf.fontSize) || 32,
          fontFamily: tf.fontFamily || 'Montserrat, sans-serif',
          fontWeight: tf.fontWeight || '700',
          font: (tf.fontWeight || '700') + ' ' + (Number(tf.fontSize) || 32) + 'px ' + (tf.fontFamily || 'Montserrat, sans-serif'),
          textTransform: tf.textTransform || 'none',
          color: tf.color || '#ffffff',
          align: tf.align || 'center',
          maxWidth: Number(tf.maxWidth) || Math.round(state.frameWidth * 0.85),
          rotation: Number(tf.rotation) || 0,
          shadow: tf.shadow !== false,
          bgEnabled: Boolean(tf.bgEnabled),
          bgColor: tf.bgColor || '#047857'
        });
      });

      const w = Math.max(40, Math.round(state.slot.w));
      const h = Math.max(40, Math.round(state.slot.h));
      return {
        id: id,
        title: state.title || 'Custom Campaign',
        subtitle: state.subtitle || '',
        badge: state.badge || 'Custom Campaign',
        headerTag: state.headerTag,
        footerText: state.footerText,
        frameId: 'custom-' + id,
        frameWidth: state.frameWidth,
        frameHeight: state.frameHeight,
        customFrameDataUrl: state.frameMode === 'uploaded' ? state.customFrameDataUrl : null,
        shareFrameDataUrl: state.frameMode === 'uploaded' ? state.shareFrameDataUrl : null,
        customFrameUrl: state.frameMode === 'uploaded' ? (state.customFrameUrl || '') : '',
        cropWidth: w,
        cropHeight: h,
        aspectRatio: w / h,
        slot: {
          x: Math.round(state.slot.x),
          y: Math.round(state.slot.y),
          w: w,
          h: h,
          radius: Math.round(state.slot.radius),
          rotation: Math.round(state.slot.rotation),
          layer: state.slot.layer
        },
        palette: Object.assign({}, state.palette),
        fields: fields,
        textSlots: textSlots
      };
    }

    function syncControlBounds() {
      const W = state.frameWidth;
      const H = state.frameHeight;
      canvas.width = W;
      canvas.height = H;
      els.slotX.max = String(W);
      els.slotXNum.max = String(W);
      els.slotY.max = String(H);
      els.slotYNum.max = String(H);
      els.slotW.max = String(W);
      els.slotWNum.max = String(W);
      els.slotH.max = String(H);
      els.slotHNum.max = String(H);
      if (els.frameDims) els.frameDims.textContent = W + ' × ' + H + ' px';
    }

    function syncInputsFromState() {
      els.title.value = state.title;
      els.subtitle.value = state.subtitle;
      if (state.id) els.id.value = state.id;
      els.badge.value = state.badge;
      els.headerTag.value = state.headerTag;
      els.footerText.value = state.footerText;
      els.bg1.value = state.palette.bg1;
      els.bg2.value = state.palette.bg2;
      els.accent.value = state.palette.accent;
      els.dark.value = state.palette.dark;

      els.slotX.value = els.slotXNum.value = Math.round(state.slot.x);
      els.slotY.value = els.slotYNum.value = Math.round(state.slot.y);
      els.slotW.value = els.slotWNum.value = Math.round(state.slot.w);
      els.slotH.value = els.slotHNum.value = Math.round(state.slot.h);
      els.slotRadius.value = els.slotRadiusNum.value = Math.round(state.slot.radius);
      els.slotRot.value = els.slotRotNum.value = Math.round(state.slot.rotation);
      els.slotLayer.value = state.slot.layer;
      els.lockAspect.checked = state.lockAspect;

      const ratio = (state.slot.w / Math.max(1, state.slot.h)).toFixed(3);
      els.hudReadout.textContent =
        'Slot: X=' + Math.round(state.slot.x) + ' Y=' + Math.round(state.slot.y) +
        ' • W=' + Math.round(state.slot.w) + ' H=' + Math.round(state.slot.h) +
        ' • Ratio=' + ratio + ' • Rot=' + Math.round(state.slot.rotation) + '°';
    }

    function renderTextFieldEditors() {
      if (!els.textFieldsList) return;
      els.textFieldsList.innerHTML = '';

      state.textFields.forEach(function (tf, idx) {
        const card = document.createElement('div');
        card.className = 'text-field-card';
        card.dataset.tfIndex = String(idx);

        card.innerHTML =
          '<div class="text-field-head">' +
            '<span class="text-field-title">Field #' + (idx + 1) + ': ' + window.escapeHtml(tf.label || 'Text') + '</span>' +
            '<div class="text-field-actions">' +
              '<button type="button" class="ctrl-mini-btn" data-tf-preset="top">Top</button>' +
              '<button type="button" class="ctrl-mini-btn" data-tf-preset="middle">Middle</button>' +
              '<button type="button" class="ctrl-mini-btn" data-tf-preset="bottom">Bottom</button>' +
              '<button type="button" class="ctrl-mini-btn" data-tf-preset="centerx">Center X</button>' +
              (state.textFields.length > 1 ? '<button type="button" class="ctrl-mini-btn" data-tf-remove style="color:#dc2626;">Remove</button>' : '') +
            '</div>' +
          '</div>' +

          '<div class="grid-3">' +
            '<div class="st-field"><label>Field Label</label><input type="text" data-tf="label" value="' + window.escapeHtml(tf.label) + '"></div>' +
            '<div class="st-field"><label>Field Type</label><select data-tf="type">' +
              '<option value="text"' + (tf.type === 'text' ? ' selected' : '') + '>Text Input</option>' +
              '<option value="select"' + (tf.type === 'select' ? ' selected' : '') + '>Dropdown Select</option>' +
              '<option value="static"' + (tf.type === 'static' ? ' selected' : '') + '>Fixed Banner Text</option>' +
            '</select></div>' +
            '<div class="st-field"><label>Sample / Text</label><input type="text" data-tf="sample" value="' + window.escapeHtml(tf.sample) + '"></div>' +
          '</div>' +

          '<div class="grid-2">' +
            '<div class="st-field"><label>Prefix (optional)</label><input type="text" data-tf="prefix" placeholder="e.g. Blood: " value="' + window.escapeHtml(tf.prefix || '') + '"></div>' +
            '<div class="st-field" style="display:' + (tf.type === 'select' ? 'block' : 'none') + ';" data-tf-options-wrap>' +
              '<label>Dropdown Options (comma-separated)</label>' +
              '<input type="text" data-tf="optionsText" value="' + window.escapeHtml(tf.optionsText || '') + '">' +
            '</div>' +
          '</div>' +

          '<div class="pos-control-row">' +
            '<label>Text X</label>' +
            '<input type="range" data-tf="x" min="0" max="' + state.frameWidth + '" value="' + Math.round(tf.x) + '">' +
            '<input type="number" data-tf-num="x" min="0" max="' + state.frameWidth + '" value="' + Math.round(tf.x) + '">' +
          '</div>' +
          '<div class="pos-control-row">' +
            '<label>Text Y</label>' +
            '<input type="range" data-tf="y" min="0" max="' + state.frameHeight + '" value="' + Math.round(tf.y) + '">' +
            '<input type="number" data-tf-num="y" min="0" max="' + state.frameHeight + '" value="' + Math.round(tf.y) + '">' +
          '</div>' +

          '<div class="grid-4">' +
            '<div class="st-field"><label>Font Family</label><select data-tf="fontFamily">' +
              '<option value="Plus Jakarta Sans, sans-serif"' + (tf.fontFamily.indexOf('Jakarta') !== -1 ? ' selected' : '') + '>Jakarta Sans</option>' +
              '<option value="Montserrat, sans-serif"' + (tf.fontFamily.indexOf('Montserrat') !== -1 ? ' selected' : '') + '>Montserrat</option>' +
              '<option value="Inter, sans-serif"' + (tf.fontFamily.indexOf('Inter') !== -1 ? ' selected' : '') + '>Inter</option>' +
              '<option value="Poppins, sans-serif"' + (tf.fontFamily.indexOf('Poppins') !== -1 ? ' selected' : '') + '>Poppins</option>' +
              '<option value="Georgia, serif"' + (tf.fontFamily.indexOf('Georgia') !== -1 ? ' selected' : '') + '>Georgia Serif</option>' +
            '</select></div>' +
            '<div class="st-field"><label>Weight</label><select data-tf="fontWeight">' +
              '<option value="400"' + (tf.fontWeight === '400' ? ' selected' : '') + '>Regular</option>' +
              '<option value="600"' + (tf.fontWeight === '600' ? ' selected' : '') + '>SemiBold</option>' +
              '<option value="700"' + (tf.fontWeight === '700' ? ' selected' : '') + '>Bold</option>' +
              '<option value="800"' + (tf.fontWeight === '800' ? ' selected' : '') + '>ExtraBold</option>' +
            '</select></div>' +
            '<div class="st-field"><label>Size (px)</label><input type="number" data-tf="fontSize" min="12" max="110" value="' + Number(tf.fontSize) + '"></div>' +
            '<div class="st-field"><label>Case</label><select data-tf="textTransform">' +
              '<option value="none"' + (tf.textTransform === 'none' ? ' selected' : '') + '>Normal</option>' +
              '<option value="uppercase"' + (tf.textTransform === 'uppercase' ? ' selected' : '') + '>UPPERCASE</option>' +
              '<option value="capitalize"' + (tf.textTransform === 'capitalize' ? ' selected' : '') + '>Title Case</option>' +
            '</select></div>' +
          '</div>' +

          '<div class="grid-4">' +
            '<div class="st-field"><label>Text Color</label><input type="color" data-tf="color" value="' + tf.color + '"></div>' +
            '<div class="st-field"><label>Align</label><select data-tf="align">' +
              '<option value="center"' + (tf.align === 'center' ? ' selected' : '') + '>Center</option>' +
              '<option value="left"' + (tf.align === 'left' ? ' selected' : '') + '>Left</option>' +
              '<option value="right"' + (tf.align === 'right' ? ' selected' : '') + '>Right</option>' +
            '</select></div>' +
            '<div class="st-field"><label>Max Width</label><input type="number" data-tf="maxWidth" min="80" max="' + state.frameWidth + '" value="' + Number(tf.maxWidth) + '"></div>' +
            '<div class="st-field"><label>Rotate (&deg;)</label><input type="number" data-tf="rotation" min="-45" max="45" value="' + Number(tf.rotation || 0) + '"></div>' +
          '</div>' +

          '<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;font-size:12px;font-weight:600;margin-top:4px;">' +
            '<label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;"><input type="checkbox" data-tf-check="shadow"' + (tf.shadow !== false ? ' checked' : '') + '> Text Shadow</label>' +
            '<label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;"><input type="checkbox" data-tf-check="bgEnabled"' + (tf.bgEnabled ? ' checked' : '') + '> Pill Badge Background</label>' +
            '<label style="display:inline-flex;align-items:center;gap:6px;">Badge Color <input type="color" data-tf="bgColor" value="' + (tf.bgColor || '#047857') + '" style="width:40px;height:26px;padding:1px;border-radius:6px;border:1px solid #cbd5e1;"></label>' +
          '</div>';

        // Wire presets
        card.querySelectorAll('[data-tf-preset]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            const p = btn.dataset.tfPreset;
            if (p === 'top') tf.y = Math.round(state.frameHeight * 0.09);
            else if (p === 'middle') tf.y = Math.round(state.frameHeight * 0.50);
            else if (p === 'bottom') tf.y = Math.round(state.frameHeight * 0.85);
            else if (p === 'centerx') tf.x = Math.round(state.frameWidth * 0.50);
            renderTextFieldEditors();
            drawStudioCanvas();
          });
        });

        const removeBtn = card.querySelector('[data-tf-remove]');
        if (removeBtn) {
          removeBtn.addEventListener('click', function () {
            state.textFields.splice(idx, 1);
            renderTextFieldEditors();
            drawStudioCanvas();
          });
        }

        // Wire inputs
        card.querySelectorAll('[data-tf]').forEach(function (inp) {
          const prop = inp.dataset.tf;
          inp.addEventListener('input', function () {
            if (prop === 'x' || prop === 'y' || prop === 'fontSize' || prop === 'maxWidth' || prop === 'rotation') {
              tf[prop] = Number(inp.value) || 0;
              const numPeer = card.querySelector('[data-tf-num="' + prop + '"]');
              if (numPeer) numPeer.value = Math.round(tf[prop]);
            } else {
              tf[prop] = inp.value;
            }
            if (prop === 'label') {
              const titleEl = card.querySelector('.text-field-title');
              if (titleEl) titleEl.textContent = 'Field #' + (idx + 1) + ': ' + (tf.label || 'Text');
            }
            if (prop === 'type') {
              const optWrap = card.querySelector('[data-tf-options-wrap]');
              if (optWrap) optWrap.style.display = tf.type === 'select' ? 'block' : 'none';
            }
            drawStudioCanvas();
          });
        });

        card.querySelectorAll('[data-tf-num]').forEach(function (numInp) {
          const prop = numInp.dataset.tfNum;
          numInp.addEventListener('input', function () {
            tf[prop] = Number(numInp.value) || 0;
            const rangePeer = card.querySelector('[data-tf="' + prop + '"]');
            if (rangePeer) rangePeer.value = Math.round(tf[prop]);
            drawStudioCanvas();
          });
        });

        card.querySelectorAll('[data-tf-check]').forEach(function (chk) {
          const prop = chk.dataset.tfCheck;
          chk.addEventListener('change', function () {
            tf[prop] = chk.checked;
            drawStudioCanvas();
          });
        });

        els.textFieldsList.appendChild(card);
      });
    }

    function syncTextCoordinateInputs() {
      state.textFields.forEach(function (tf, idx) {
        const card = els.textFieldsList.querySelector('[data-tf-index="' + idx + '"]');
        if (!card) return;
        const rx = card.querySelector('[data-tf="x"]');
        const nx = card.querySelector('[data-tf-num="x"]');
        const ry = card.querySelector('[data-tf="y"]');
        const ny = card.querySelector('[data-tf-num="y"]');
        if (rx) rx.value = Math.round(tf.x);
        if (nx) nx.value = Math.round(tf.x);
        if (ry) ry.value = Math.round(tf.y);
        if (ny) ny.value = Math.round(tf.y);
      });
    }

    let overlayRenderToken = 0;
    function refreshGeneratedOverlayAndDraw() {
      if (state.frameMode === 'uploaded' && state.uploadedFrameImg) {
        drawStudioCanvas();
        return;
      }
      const token = ++overlayRenderToken;
      const camp = buildCampaignPayload();
      camp.customFrameDataUrl = null;
      const url = window.SocialWavesData.renderFrameDataUrl(camp, { showPlaceholder: false });
      loadImage(url).then(function (img) {
        if (token !== overlayRenderToken) return;
        state.generatedOverlayImg = img;
        drawStudioCanvas();
      });
    }

    function drawStudioCanvas() {
      const camp = buildCampaignPayload();
      const overlay = (state.frameMode === 'uploaded' && state.uploadedFrameImg)
        ? state.uploadedFrameImg
        : state.generatedOverlayImg;

      const photo = state.showSamplePhoto ? samplePhoto : null;
      const sampleValues = {};
      state.textFields.forEach(function (tf, idx) {
        sampleValues[tf.key || ('field_' + idx)] = tf.sample;
      });

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cell = 24;
      for (let y = 0; y < canvas.height; y += cell) {
        for (let x = 0; x < canvas.width; x += cell) {
          ctx.fillStyle = ((x / cell + y / cell) % 2 === 0) ? '#f1f5f9' : '#e2e8f0';
          ctx.fillRect(x, y, cell, cell);
        }
      }

      const tmp = document.createElement('canvas');
      tmp.width = canvas.width;
      tmp.height = canvas.height;
      const tctx = tmp.getContext('2d');
      window.SocialWavesData.drawPosterComposite(tctx, canvas.width, canvas.height, camp, photo, overlay, sampleValues);
      ctx.drawImage(tmp, 0, 0);

      if (state.showGuides) {
        const s = state.slot;
        const cx = s.x + s.w / 2;
        const cy = s.y + s.h / 2;
        const rad = (s.rotation * Math.PI) / 180;

        ctx.save();
        ctx.translate(cx, cy);
        if (rad) ctx.rotate(rad);
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 6]);
        ctx.strokeRect(-s.w / 2, -s.h / 2, s.w, s.h);
        ctx.setLineDash([]);

        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(s.w / 2 - 12, s.h / 2 - 12, 24, 24);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(s.w / 2 - 12, s.h / 2 - 12, 24, 24);
        ctx.restore();

        state.textFields.forEach(function (tf, idx) {
          drawTextMarker(tf.x, tf.y, tf.label || ('Text ' + (idx + 1)));
        });
      }
    }

    function drawTextMarker(x, y, label) {
      ctx.save();
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      const shortLabel = String(label).slice(0, 14);
      ctx.font = '700 12px Inter, sans-serif';
      const w = Math.max(48, ctx.measureText(shortLabel).width + 14);
      ctx.fillStyle = 'rgba(23,33,31,0.85)';
      ctx.fillRect(x + 12, y - 11, w, 22);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(shortLabel, x + 18, y);
      ctx.restore();
    }

    function bindRangeAndNumber(rangeEl, numEl, setter, rebuildFrame) {
      function update(val) {
        setter(Number(val));
        syncInputsFromState();
        if (rebuildFrame) refreshGeneratedOverlayAndDraw();
        else drawStudioCanvas();
      }
      rangeEl.addEventListener('input', function () { update(rangeEl.value); });
      numEl.addEventListener('input', function () { update(numEl.value); });
    }

    bindRangeAndNumber(els.slotX, els.slotXNum, function (v) { state.slot.x = Math.max(0, Math.min(state.frameWidth - 20, v)); }, true);
    bindRangeAndNumber(els.slotY, els.slotYNum, function (v) { state.slot.y = Math.max(0, Math.min(state.frameHeight - 20, v)); }, true);
    bindRangeAndNumber(els.slotW, els.slotWNum, function (v) {
      const w = Math.max(40, Math.min(state.frameWidth, v));
      state.slot.w = w;
      if (state.lockAspect) {
        state.slot.h = Math.max(40, Math.min(state.frameHeight, Math.round(w / state.lockedRatio)));
      }
    }, true);
    bindRangeAndNumber(els.slotH, els.slotHNum, function (v) {
      const h = Math.max(40, Math.min(state.frameHeight, v));
      state.slot.h = h;
      if (state.lockAspect) {
        state.slot.w = Math.max(40, Math.min(state.frameWidth, Math.round(h * state.lockedRatio)));
      }
    }, true);
    bindRangeAndNumber(els.slotRadius, els.slotRadiusNum, function (v) { state.slot.radius = Math.max(0, Math.min(400, v)); }, true);
    bindRangeAndNumber(els.slotRot, els.slotRotNum, function (v) { state.slot.rotation = Math.max(-45, Math.min(45, v)); }, false);

    els.slotLayer.addEventListener('change', function () {
      state.slot.layer = els.slotLayer.value;
      drawStudioCanvas();
    });
    els.lockAspect.addEventListener('change', function () {
      state.lockAspect = els.lockAspect.checked;
      state.lockedRatio = state.slot.w / Math.max(1, state.slot.h);
    });
    els.showSample.addEventListener('change', function () {
      state.showSamplePhoto = els.showSample.checked;
      drawStudioCanvas();
    });
    els.showGuides.addEventListener('change', function () {
      state.showGuides = els.showGuides.checked;
      drawStudioCanvas();
    });

    document.querySelectorAll('[data-slot-action]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const act = btn.dataset.slotAction;
        if (act === 'center-x') {
          state.slot.x = Math.round((state.frameWidth - state.slot.w) / 2);
        } else if (act === 'center-y') {
          state.slot.y = Math.round((state.frameHeight - state.slot.h) / 2);
        } else if (act === 'square') {
          const size = Math.min(state.slot.w, state.slot.h);
          state.slot.w = size;
          state.slot.h = size;
          state.lockedRatio = 1;
        } else if (act === 'circle') {
          const size = Math.min(state.slot.w, state.slot.h);
          state.slot.w = size;
          state.slot.h = size;
          state.slot.radius = Math.round(size / 2);
          state.lockedRatio = 1;
        } else if (act === 'portrait') {
          state.slot.w = Math.round(state.frameWidth * 0.35);
          state.slot.h = Math.round(state.slot.w * 1.25);
          state.slot.radius = 28;
          state.lockedRatio = state.slot.w / state.slot.h;
        } else if (act === 'reset') {
          state.slot = {
            x: Math.round(state.frameWidth * 0.325),
            y: Math.round(state.frameHeight * 0.245),
            w: Math.round(state.frameWidth * 0.35),
            h: Math.round(state.frameHeight * 0.336),
            radius: 28,
            rotation: 0,
            layer: state.slot.layer
          };
        }
        syncInputsFromState();
        refreshGeneratedOverlayAndDraw();
      });
    });

    [
      [els.title, function (v) { state.title = v; }],
      [els.subtitle, function (v) { state.subtitle = v; }],
      [els.id, function (v) { state.id = v; }],
      [els.badge, function (v) { state.badge = v; }],
      [els.headerTag, function (v) { state.headerTag = v; }],
      [els.footerText, function (v) { state.footerText = v; }],
      [els.bg1, function (v) { state.palette.bg1 = v; }],
      [els.bg2, function (v) { state.palette.bg2 = v; }],
      [els.accent, function (v) { state.palette.accent = v; }],
      [els.dark, function (v) { state.palette.dark = v; }]
    ].forEach(function (pair) {
      pair[0].addEventListener('input', function () {
        pair[1](pair[0].value);
        refreshGeneratedOverlayAndDraw();
      });
    });

    els.modeRadios.forEach(function (r) {
      r.addEventListener('change', function () {
        state.frameMode = r.value;
        els.generatedBox.style.display = state.frameMode === 'generated' ? 'block' : 'none';
        els.uploadedBox.style.display = state.frameMode === 'uploaded' ? 'block' : 'none';
        if (state.frameMode === 'generated') {
          state.frameWidth = 800;
          state.frameHeight = 1000;
          syncControlBounds();
        } else if (state.uploadedFrameImg) {
          state.frameWidth = state.uploadedFrameImg.naturalWidth;
          state.frameHeight = state.uploadedFrameImg.naturalHeight;
          syncControlBounds();
        }
        syncInputsFromState();
        renderTextFieldEditors();
        refreshGeneratedOverlayAndDraw();
      });
    });

    els.frameFile.addEventListener('change', function (e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (ev) {
        loadImage(ev.target.result).then(function (rawImg) {
          const optimized = optimizeUploadedFrame(rawImg, ev.target.result);
          return loadImage(optimized.dataUrl).then(function (img) {
            state.frameMode = 'uploaded';
            document.querySelector('input[name="frame-mode"][value="uploaded"]').checked = true;
            els.generatedBox.style.display = 'none';
            els.uploadedBox.style.display = 'block';
            state.customFrameDataUrl = optimized.dataUrl;
            state.shareFrameDataUrl = optimized.shareDataUrl || null;
            state.customFrameUrl = '';
            if (els.frameUrl) els.frameUrl.value = '';
            state.uploadedFrameImg = img;
            state.frameWidth = img.naturalWidth || optimized.width || 800;
            state.frameHeight = img.naturalHeight || optimized.height || 1000;
            syncControlBounds();
            autoDetectTransparentSlot(img);
            syncInputsFromState();
            renderTextFieldEditors();
            drawStudioCanvas();
          });
        });
      };
      reader.readAsDataURL(file);
    });

    if (els.frameUrl) {
      els.frameUrl.addEventListener('change', function () {
        const val = els.frameUrl.value.trim();
        state.customFrameUrl = val;
        if (!val) return;
        loadImage(val).then(function (img) {
          state.frameMode = 'uploaded';
          document.querySelector('input[name="frame-mode"][value="uploaded"]').checked = true;
          els.generatedBox.style.display = 'none';
          els.uploadedBox.style.display = 'block';
          state.customFrameDataUrl = null;
          state.uploadedFrameImg = img;
          state.frameWidth = img.naturalWidth || 800;
          state.frameHeight = img.naturalHeight || 1000;
          syncControlBounds();
          syncInputsFromState();
          renderTextFieldEditors();
          drawStudioCanvas();
        }).catch(function () {
          // keep URL string even if cross-origin blocked preview
          drawStudioCanvas();
        });
      });
    }

    function autoDetectTransparentSlot(img) {
      const W = img.naturalWidth;
      const H = img.naturalHeight;
      if (!W || !H) return;
      const probe = document.createElement('canvas');
      probe.width = W;
      probe.height = H;
      const pctx = probe.getContext('2d');
      pctx.drawImage(img, 0, 0);
      const data = pctx.getImageData(0, 0, W, H).data;

      let minX = W, minY = H, maxX = -1, maxY = -1;
      for (let y = 0; y < H; y += 2) {
        for (let x = 0; x < W; x += 2) {
          const alpha = data[(y * W + x) * 4 + 3];
          if (alpha < 120) {
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (maxX > minX + 20 && maxY > minY + 20) {
        state.slot.x = minX;
        state.slot.y = minY;
        state.slot.w = maxX - minX;
        state.slot.h = maxY - minY;
        state.slot.layer = 'behind';
        state.lockedRatio = state.slot.w / state.slot.h;
      } else {
        state.slot.w = Math.round(W * 0.35);
        state.slot.h = Math.round(W * 0.42);
        state.slot.x = Math.round((W - state.slot.w) / 2);
        state.slot.y = Math.round((H - state.slot.h) / 2);
        state.slot.layer = 'above';
      }
    }

    if (els.autoDetectBtn) {
      els.autoDetectBtn.addEventListener('click', function () {
        if (!state.uploadedFrameImg) return;
        autoDetectTransparentSlot(state.uploadedFrameImg);
        syncInputsFromState();
        drawStudioCanvas();
      });
    }

    if (els.addTopTextBtn) {
      els.addTopTextBtn.addEventListener('click', function () {
        state.textFields.push(createTextFieldConfig({
          label: 'Top Headline',
          type: 'text',
          sample: 'TOP EVENT TITLE',
          x: Math.round(state.frameWidth / 2),
          y: Math.round(state.frameHeight * 0.09),
          fontSize: 30,
          textTransform: 'uppercase',
          bgEnabled: true,
          bgColor: '#047857',
          color: '#ffffff'
        }));
        renderTextFieldEditors();
        drawStudioCanvas();
      });
    }

    if (els.addTextBtn) {
      els.addTextBtn.addEventListener('click', function () {
        state.textFields.push(createTextFieldConfig({
          label: 'Custom Text ' + (state.textFields.length + 1),
          type: 'text',
          sample: 'Custom Label',
          x: Math.round(state.frameWidth / 2),
          y: Math.round(state.frameHeight * 0.78),
          fontSize: 26,
          color: '#ffffff'
        }));
        renderTextFieldEditors();
        drawStudioCanvas();
      });
    }

    // Interactive Drag & Resize directly on the Studio Canvas
    let dragMode = null; // 'move-slot' | 'resize-slot' | 'move-text'
    let dragTextIndex = -1;
    let dragStart = { x: 0, y: 0, origX: 0, origY: 0, origW: 0, origH: 0 };

    function getCanvasCoords(e) {
      const pt = e.touches ? e.touches[0] : e;
      const rect = canvas.getBoundingClientRect();
      return {
        x: (pt.clientX - rect.left) * (canvas.width / (rect.width || canvas.width)),
        y: (pt.clientY - rect.top) * (canvas.height / (rect.height || canvas.height))
      };
    }

    canvas.addEventListener('mousedown', startCanvasDrag);
    canvas.addEventListener('touchstart', startCanvasDrag, { passive: false });

    function startCanvasDrag(e) {
      const pt = getCanvasCoords(e);
      const s = state.slot;

      if (Math.abs(pt.x - (s.x + s.w)) <= 24 && Math.abs(pt.y - (s.y + s.h)) <= 24) {
        dragMode = 'resize-slot';
        dragStart = { x: pt.x, y: pt.y, origW: s.w, origH: s.h };
      } else {
        let hitIdx = -1;
        for (let i = state.textFields.length - 1; i >= 0; i--) {
          if (Math.hypot(pt.x - state.textFields[i].x, pt.y - state.textFields[i].y) <= 24) {
            hitIdx = i;
            break;
          }
        }
        if (hitIdx !== -1) {
          dragMode = 'move-text';
          dragTextIndex = hitIdx;
          dragStart = { x: pt.x, y: pt.y, origX: state.textFields[hitIdx].x, origY: state.textFields[hitIdx].y };
        } else if (pt.x >= s.x && pt.x <= s.x + s.w && pt.y >= s.y && pt.y <= s.y + s.h) {
          dragMode = 'move-slot';
          dragStart = { x: pt.x, y: pt.y, origX: s.x, origY: s.y };
        } else {
          return;
        }
      }
      if (e.cancelable) e.preventDefault();
    }

    window.addEventListener('mousemove', moveCanvasDrag);
    window.addEventListener('touchmove', moveCanvasDrag, { passive: false });

    function moveCanvasDrag(e) {
      if (!dragMode) return;
      if (e.cancelable) e.preventDefault();
      const pt = getCanvasCoords(e);
      const dx = pt.x - dragStart.x;
      const dy = pt.y - dragStart.y;

      if (dragMode === 'move-slot') {
        state.slot.x = Math.max(0, Math.min(state.frameWidth - state.slot.w, Math.round(dragStart.origX + dx)));
        state.slot.y = Math.max(0, Math.min(state.frameHeight - state.slot.h, Math.round(dragStart.origY + dy)));
        syncInputsFromState();
        refreshGeneratedOverlayAndDraw();
      } else if (dragMode === 'resize-slot') {
        let newW = Math.max(60, Math.min(state.frameWidth - state.slot.x, Math.round(dragStart.origW + dx)));
        let newH = Math.max(60, Math.min(state.frameHeight - state.slot.y, Math.round(dragStart.origH + dy)));
        if (state.lockAspect) {
          newH = Math.max(60, Math.round(newW / state.lockedRatio));
        }
        state.slot.w = newW;
        state.slot.h = newH;
        syncInputsFromState();
        refreshGeneratedOverlayAndDraw();
      } else if (dragMode === 'move-text' && dragTextIndex >= 0 && state.textFields[dragTextIndex]) {
        const tf = state.textFields[dragTextIndex];
        tf.x = Math.max(0, Math.min(state.frameWidth, Math.round(dragStart.origX + dx)));
        tf.y = Math.max(0, Math.min(state.frameHeight, Math.round(dragStart.origY + dy)));
        syncTextCoordinateInputs();
        drawStudioCanvas();
      }
    }

    window.addEventListener('mouseup', function () { dragMode = null; dragTextIndex = -1; });
    window.addEventListener('touchend', function () { dragMode = null; dragTextIndex = -1; });

    function renderSavedCustomList() {
      const list = window.SocialWavesData.getAllCampaigns().filter(function (c) {
        return window.SocialWavesData.isCustomCampaign(c.id);
      });
      if (!list.length) {
        els.savedList.innerHTML = '<p style="color:#64748b;font-size:13px;margin:0;">No custom campaigns published yet. Design one above and click Publish!</p>';
        return;
      }
      els.savedList.innerHTML = '';
      list.forEach(function (c) {
        const launchUrl = window.SocialWavesData.getCampaignLaunchUrl(c);
        const shortRel = typeof window.SocialWavesData.getShortShareUrl === 'function'
          ? window.SocialWavesData.getShortShareUrl(c)
          : launchUrl;
        const absUrl = new URL(shortRel, window.location.href).href;
        const row = document.createElement('div');
        row.className = 'saved-item-row';
        row.innerHTML =
          '<div><strong>' + window.escapeHtml(c.title) + '</strong> <code style="margin-left:6px;">' + window.escapeHtml(c.id) + '</code>' +
          '<div style="font-size:12px;color:#64748b;">Slot: ' + c.slot.x + ',' + c.slot.y + ' (' + c.slot.w + '&times;' + c.slot.h + ')</div></div>' +
          '<div class="saved-item-actions">' +
          '<a class="ctrl-mini-btn" href="' + launchUrl + '">Open</a>' +
          '<button type="button" class="ctrl-mini-btn" data-copy-url="' + window.escapeHtml(absUrl) + '">Copy Link</button>' +
          '<a class="ctrl-mini-btn" href="studio?edit=' + encodeURIComponent(c.id) + '">Edit</a>' +
          '<button type="button" class="ctrl-mini-btn" data-delete-id="' + window.escapeHtml(c.id) + '" style="color:#dc2626;">Delete</button>' +
          '</div>';
        els.savedList.appendChild(row);
      });

      els.savedList.querySelectorAll('[data-copy-url]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const url = btn.dataset.copyUrl;
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(function () {
              btn.textContent = 'Copied!';
              setTimeout(function () { btn.textContent = 'Copy Link'; }, 1600);
            });
          } else {
            window.prompt('Copy hosted campaign link:', url);
          }
        });
      });

      els.savedList.querySelectorAll('[data-delete-id]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const delId = btn.dataset.deleteId;
          window.SocialWavesData.deleteCustomCampaign(delId);
          const srv = typeof window.SocialWavesData.getServerStatus === 'function'
            ? window.SocialWavesData.getServerStatus()
            : { configured: false };
          if (srv.configured && typeof window.SocialWavesData.deleteCampaignOnServer === 'function') {
            window.SocialWavesData.deleteCampaignOnServer(delId).catch(function () {});
          } else if (window.SocialWavesGitHub && window.SocialWavesGitHub.isConfigured()) {
            window.SocialWavesGitHub.deleteCampaignFromGitHub(delId).catch(function () {});
          }
          renderSavedCustomList();
        });
      });
    }

    function updateGitHubUi() {
      const srv = typeof window.SocialWavesData.getServerStatus === 'function'
        ? window.SocialWavesData.getServerStatus()
        : { available: false, configured: false, mode: 'static' };
      const cfg = window.SocialWavesGitHub ? window.SocialWavesGitHub.getConfig() : {};
      if (window.SocialWavesGitHub) {
        if (els.ghOwner) els.ghOwner.value = cfg.owner || '';
        if (els.ghRepo) els.ghRepo.value = cfg.repo || '';
        if (els.ghBranch) els.ghBranch.value = cfg.branch || 'main';
        if (els.ghToken) els.ghToken.value = cfg.token || '';
      }
      const ghConnected = Boolean(window.SocialWavesGitHub && window.SocialWavesGitHub.isConfigured());
      if (els.ghStatusPill) {
        if (srv.configured) {
          els.ghStatusPill.textContent = srv.mode === 'php-mysql'
            ? 'PHP + MySQL Connected (Short URL)'
            : 'Vercel Cloud Ready (No Token)';
          els.ghStatusPill.style.background = '#d1fae5';
          els.ghStatusPill.style.color = '#047857';
        } else if (srv.available) {
          els.ghStatusPill.textContent = srv.mode === 'mysql-error'
            ? 'MySQL Error (Check XAMPP)'
            : 'Vercel (Attach Blob Store)';
          els.ghStatusPill.style.background = '#fef3c7';
          els.ghStatusPill.style.color = '#92400e';
        } else if (ghConnected) {
          els.ghStatusPill.textContent = 'GitHub Sync: ' + cfg.owner + '/' + cfg.repo;
          els.ghStatusPill.style.background = '#d1fae5';
          els.ghStatusPill.style.color = '#047857';
        } else {
          els.ghStatusPill.textContent = 'Standalone Mode';
          els.ghStatusPill.style.background = '#e2e8f0';
          els.ghStatusPill.style.color = '#475569';
        }
      }
      if (els.publishBtn) {
        if (srv.configured) {
          els.publishBtn.textContent = srv.mode === 'php-mysql'
            ? 'Publish Live to MySQL (Short URL)'
            : 'Publish Live (Short URL)';
        } else if (ghConnected) {
          els.publishBtn.textContent = 'Publish & Upload to GitHub';
        } else {
          els.publishBtn.textContent = 'Publish Custom Campaign';
        }
      }
    }

    if (window.SocialWavesGitHub) {
      updateGitHubUi();

      if (els.ghSaveTestBtn) {
        els.ghSaveTestBtn.addEventListener('click', function () {
          const cfg = {
            owner: els.ghOwner ? els.ghOwner.value : '',
            repo: els.ghRepo ? els.ghRepo.value : '',
            branch: els.ghBranch ? els.ghBranch.value : 'main',
            token: els.ghToken ? els.ghToken.value : ''
          };
          if (els.ghTestMsg) {
            els.ghTestMsg.style.color = '#64748b';
            els.ghTestMsg.textContent = 'Checking GitHub repo...';
          }
          window.SocialWavesGitHub.testConnection(cfg).then(function (repoInfo) {
            updateGitHubUi();
            if (els.ghTestMsg) {
              els.ghTestMsg.style.color = '#047857';
              els.ghTestMsg.textContent = 'Connected to ' + (repoInfo.full_name || (cfg.owner + '/' + cfg.repo)) + '!';
            }
          }).catch(function (err) {
            updateGitHubUi();
            if (els.ghTestMsg) {
              els.ghTestMsg.style.color = '#dc2626';
              els.ghTestMsg.textContent = err.message || 'Connection failed.';
            }
          });
        });
      }

      if (els.ghDisconnectBtn) {
        els.ghDisconnectBtn.addEventListener('click', function () {
          const cfg = window.SocialWavesGitHub.getConfig();
          cfg.token = '';
          window.SocialWavesGitHub.saveConfig(cfg);
          updateGitHubUi();
          if (els.ghTestMsg) {
            els.ghTestMsg.style.color = '#64748b';
            els.ghTestMsg.textContent = 'Token cleared.';
          }
        });
      }
    }

    function wirePublishActionButtons(fullShareUrl, payload) {
      const copyLinkBtn = document.getElementById('copy-hosted-link-btn');
      if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', function () {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(fullShareUrl).then(function () {
              copyLinkBtn.textContent = 'Hosted Link Copied!';
              setTimeout(function () { copyLinkBtn.textContent = 'Copy Hosted Share Link'; }, 1800);
            });
          } else {
            window.prompt('Copy hosted campaign link:', fullShareUrl);
          }
        });
      }

      const copyJsonBtn = document.getElementById('copy-campaign-json-btn');
      if (copyJsonBtn) {
        copyJsonBtn.addEventListener('click', function () {
          const jsonText = JSON.stringify(payload, null, 2);
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(jsonText).then(function () {
              copyJsonBtn.textContent = 'JSON Copied!';
              setTimeout(function () { copyJsonBtn.textContent = 'Copy JSON for GitHub'; }, 1800);
            });
          } else {
            window.prompt('Copy campaign JSON for DEFAULT_CAMPAIGNS:', jsonText);
          }
        });
      }
    }

    els.publishBtn.addEventListener('click', function () {
      const payload = buildCampaignPayload();
      payload._updatedAt = Date.now();
      els.id.value = payload.id;

      const saveResult = window.SocialWavesData.saveCustomCampaign(payload);
      if (saveResult && saveResult.ok === false) {
        els.publishStatus.innerHTML =
          '<span style="color:#dc2626;font-weight:700;">Save failed: ' +
          window.escapeHtml(saveResult.error || 'Could not save campaign.') +
          '</span>';
        return;
      }

      const srv = typeof window.SocialWavesData.getServerStatus === 'function'
        ? window.SocialWavesData.getServerStatus()
        : { configured: false };
      if (srv.configured && typeof window.SocialWavesData.saveCampaignToServer === 'function') {
        els.publishBtn.disabled = true;
        els.publishStatus.innerHTML = '<span style="color:#047857;font-weight:600;">Saving campaign &amp; image to cloud (no token)...</span>';

        window.SocialWavesData.saveCampaignToServer(payload).then(function (res) {
          els.publishBtn.disabled = false;
          const synced = res.campaign || payload;
          window.SocialWavesData.saveCustomCampaign(synced);
          const shortUrl = new URL(encodeURIComponent(synced.id), window.location.href).href;

          els.publishStatus.innerHTML =
            '<div style="color:#047857;font-weight:700;">Live! Short URL &amp; image saved (no token needed).</div>' +
            '<div style="margin-top:6px;"><a href="' + shortUrl + '" target="_blank" rel="noopener" style="font-weight:700;text-decoration:underline;">' + window.escapeHtml(shortUrl) + '</a></div>' +
            '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:10px;">' +
            '<button type="button" class="ctrl-mini-btn" id="copy-hosted-link-btn">Copy Short Link</button>' +
            '<button type="button" class="ctrl-mini-btn" id="copy-campaign-json-btn">Copy JSON</button>' +
            '</div>';
          wirePublishActionButtons(shortUrl, synced);
          renderSavedCustomList();
        }).catch(function (err) {
          els.publishBtn.disabled = false;
          const launchUrl = window.SocialWavesData.getCampaignLaunchUrl(payload);
          const fullShareUrl = new URL(launchUrl, window.location.href).href;
          els.publishStatus.innerHTML =
            '<div style="color:#dc2626;font-weight:700;">Cloud save failed: ' + window.escapeHtml(err.message || 'Server error') + '</div>' +
            '<div style="margin-top:4px;font-size:13px;">Saved locally. <a href="' + launchUrl + '" style="font-weight:700;text-decoration:underline;">Open Local Preview &rarr;</a></div>' +
            '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:10px;">' +
            '<button type="button" class="ctrl-mini-btn" id="copy-hosted-link-btn">Copy Share Link</button>' +
            '<button type="button" class="ctrl-mini-btn" id="copy-campaign-json-btn">Copy JSON</button>' +
            '</div>';
          wirePublishActionButtons(fullShareUrl, payload);
          renderSavedCustomList();
        });
        return;
      }

      const canAutoGitHub = Boolean(window.SocialWavesGitHub && window.SocialWavesGitHub.isConfigured());
      if (canAutoGitHub) {
        els.publishBtn.disabled = true;
        els.publishStatus.innerHTML = '<span style="color:#047857;font-weight:600;">Uploading to GitHub...</span>';

        window.SocialWavesGitHub.publishCampaignToGitHub(payload, function (stepMsg) {
          els.publishStatus.innerHTML = '<span style="color:#047857;font-weight:600;">' + window.escapeHtml(stepMsg) + '</span>';
        }).then(function (res) {
          els.publishBtn.disabled = false;
          const synced = res.campaign;
          window.SocialWavesData.saveCustomCampaign(synced);
          const curAll = window.SocialWavesData.getAllCampaigns().filter(function (c) { return c.id !== synced.id; });
          curAll.unshift(synced);
          window.SocialWavesData.setRemoteCampaigns(curAll);
          const launchUrl = 'campaign?id=' + encodeURIComponent(synced.id);
          const shortUrl = res.pagesBase + encodeURIComponent(synced.id);

          els.publishStatus.innerHTML =
            '<div style="color:#047857;font-weight:700;">Live on GitHub! Short URL ready.</div>' +
            '<div style="margin-top:6px;"><a href="' + shortUrl + '" target="_blank" rel="noopener" style="font-weight:700;text-decoration:underline;">' + window.escapeHtml(shortUrl) + '</a></div>' +
            '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:10px;">' +
            '<button type="button" class="ctrl-mini-btn" id="copy-hosted-link-btn">Copy Short Link</button>' +
            '<button type="button" class="ctrl-mini-btn" id="copy-campaign-json-btn">Copy JSON for GitHub</button>' +
            '</div>';
          wirePublishActionButtons(shortUrl, synced);
          renderSavedCustomList();
        }).catch(function (err) {
          els.publishBtn.disabled = false;
          const launchUrl = window.SocialWavesData.getCampaignLaunchUrl(payload);
          const fullShareUrl = new URL(launchUrl, window.location.href).href;
          els.publishStatus.innerHTML =
            '<div style="color:#dc2626;font-weight:700;">GitHub auto-upload failed: ' + window.escapeHtml(err.message || 'Unknown error') + '</div>' +
            '<div style="margin-top:4px;font-size:13px;">Saved locally. <a href="' + launchUrl + '" style="font-weight:700;text-decoration:underline;">Open Local Preview &rarr;</a></div>' +
            '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:10px;">' +
            '<button type="button" class="ctrl-mini-btn" id="copy-hosted-link-btn">Copy Hosted Share Link</button>' +
            '<button type="button" class="ctrl-mini-btn" id="copy-campaign-json-btn">Copy JSON for GitHub</button>' +
            '</div>';
          wirePublishActionButtons(fullShareUrl, payload);
          renderSavedCustomList();
        });
        return;
      }

      const launchUrl = window.SocialWavesData.getCampaignLaunchUrl(payload);
      const fullShareUrl = new URL(launchUrl, window.location.href).href;
      const embeddedFrame = payload.shareFrameDataUrl || payload.customFrameDataUrl || '';
      const hasOversizedLocalPng = Boolean(embeddedFrame && embeddedFrame.length > 48000 && !payload.customFrameUrl);
      const srvStatus = typeof window.SocialWavesData.getServerStatus === 'function'
        ? window.SocialWavesData.getServerStatus()
        : { available: false, configured: false };

      let html =
        '<div style="color:#b45309;font-weight:700;">Saved in THIS browser only (not synced to server yet).</div>' +
        '<div style="margin-top:6px;"><a href="' + launchUrl +
        '" style="font-weight:700;text-decoration:underline;">Preview "' + window.escapeHtml(payload.title) + '" &rarr;</a></div>' +
        '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:10px;">' +
        '<button type="button" class="ctrl-mini-btn" id="copy-hosted-link-btn">Copy Share Link (with #c data)</button>' +
        '<button type="button" class="ctrl-mini-btn" id="copy-campaign-json-btn">Copy JSON</button>' +
        '</div>';

      if (srvStatus.available && !srvStatus.configured) {
        html += '<div style="margin-top:8px;font-size:12px;color:#b45309;line-height:1.45;">So EVERY user sees <code>/' + window.escapeHtml(payload.id) + '</code>: in Vercel Dashboard click <strong>Storage &rarr; Create Blob Store</strong> and Redeploy.</div>';
      } else if (hasOversizedLocalPng) {
        html += '<div style="margin-top:8px;font-size:12px;color:#b45309;line-height:1.45;">Large frame image cannot fit in URL; connect Vercel Blob or GitHub Auto-Upload so everyone sees it.</div>';
      } else {
        html += '<div style="margin-top:6px;font-size:12px;color:#64748b;">For public short links (<code>/' + window.escapeHtml(payload.id) + '</code>) visible to everyone on Home &amp; All Campaigns, connect Vercel Blob or GitHub Auto-Upload.</div>';
      }
      els.publishStatus.innerHTML = html;
      wirePublishActionButtons(fullShareUrl, payload);
      renderSavedCustomList();
    });

    function loadExistingCampaignForEdit() {
      const editId = new URLSearchParams(window.location.search).get('edit');
      if (!editId) return;
      const existing = window.SocialWavesData.getCampaignById(editId);
      if (!existing) return;
      state.id = existing.id;
      state.title = existing.title;
      state.subtitle = existing.subtitle || '';
      state.badge = existing.badge || 'Custom Campaign';
      state.headerTag = existing.headerTag || existing.title.toUpperCase();
      state.footerText = existing.footerText || '';
      state.frameWidth = existing.frameWidth || 800;
      state.frameHeight = existing.frameHeight || 1000;
      if (existing.palette) state.palette = Object.assign({}, existing.palette);
      if (existing.slot) state.slot = Object.assign({ rotation: 0, layer: 'behind' }, existing.slot);
      state.lockedRatio = state.slot.w / Math.max(1, state.slot.h);

      if (existing.textSlots && existing.textSlots.length) {
        state.textFields = existing.textSlots.map(function (ts, idx) {
          const matchedField = (existing.fields || []).find(function (f) { return f.name === ts.field; });
          return createTextFieldConfig({
            key: ts.field || ('field_' + idx),
            label: matchedField ? matchedField.label : (ts.staticValue ? 'Banner Text' : ('Field ' + (idx + 1))),
            type: ts.staticValue ? 'static' : ((matchedField && matchedField.type) || 'text'),
            required: matchedField ? Boolean(matchedField.required) : false,
            optionsText: matchedField && matchedField.options ? matchedField.options.join(', ') : '',
            sample: ts.staticValue || (matchedField ? matchedField.label : 'Sample'),
            prefix: ts.prefix || '',
            x: ts.x,
            y: ts.y,
            fontSize: ts.fontSize || 34,
            fontFamily: ts.fontFamily || 'Montserrat, sans-serif',
            fontWeight: ts.fontWeight || '700',
            textTransform: ts.textTransform || 'none',
            color: ts.color || '#ffffff',
            align: ts.align || 'center',
            maxWidth: ts.maxWidth || 680,
            rotation: ts.rotation || 0,
            shadow: ts.shadow !== false,
            bgEnabled: Boolean(ts.bgEnabled),
            bgColor: ts.bgColor || '#047857'
          });
        });
      }

      const existingFrameSrc = existing.customFrameDataUrl || existing.customFrameUrl || existing.customFrameFallbackUrl;
      if (existingFrameSrc) {
        state.frameMode = 'uploaded';
        state.customFrameDataUrl = existing.customFrameDataUrl || null;
        state.shareFrameDataUrl = existing.shareFrameDataUrl || null;
        state.customFrameUrl = existing.customFrameUrl || '';
        if (els.frameUrl) els.frameUrl.value = state.customFrameUrl;
        document.querySelector('input[name="frame-mode"][value="uploaded"]').checked = true;
        els.generatedBox.style.display = 'none';
        els.uploadedBox.style.display = 'block';
        loadImage(existingFrameSrc).then(function (img) {
          state.uploadedFrameImg = img;
          syncControlBounds();
          syncInputsFromState();
          renderTextFieldEditors();
          drawStudioCanvas();
        }).catch(function () {
          if (existing.customFrameFallbackUrl && existing.customFrameFallbackUrl !== existingFrameSrc) {
            loadImage(existing.customFrameFallbackUrl).then(function (img) {
              state.uploadedFrameImg = img;
              syncControlBounds();
              syncInputsFromState();
              renderTextFieldEditors();
              drawStudioCanvas();
            });
          }
        });
      }
    }

    const initReady = typeof window.SocialWavesData.ready === 'function'
      ? window.SocialWavesData.ready()
      : Promise.resolve();
    initReady.then(function () {
      updateGitHubUi();
      loadExistingCampaignForEdit();
      syncControlBounds();
      syncInputsFromState();
      renderTextFieldEditors();
      refreshGeneratedOverlayAndDraw();
      renderSavedCustomList();
    });
  }
})();
