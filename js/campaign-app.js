(function () {
  'use strict';

  function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function resolveCampaignId() {
    const fromQuery = getQueryParam('id');
    if (fromQuery) return fromQuery;
    const parts = window.location.pathname.split('/').filter(Boolean);
    const last = parts.length ? decodeURIComponent(parts[parts.length - 1]) : '';
    if (last && !/^(campaign(\.html)?|index(\.html)?|404(\.html)?)$/i.test(last)) {
      return last;
    }
    return '4SzGA';
  }

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

  function loadFirstValidImage(candidates) {
    const urls = (candidates || []).filter(Boolean);
    function attempt(idx) {
      if (idx >= urls.length) return Promise.reject(new Error('No valid frame image source'));
      return loadImage(urls[idx]).catch(function () {
        return attempt(idx + 1);
      });
    }
    return attempt(0);
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!window.SocialWavesData || !window.SimpleCropper) return;
    const readyPromise = typeof window.SocialWavesData.ready === 'function'
      ? window.SocialWavesData.ready()
      : Promise.resolve();
    readyPromise.then(startCampaignApp);
  });

  function startCampaignApp() {
    const id = resolveCampaignId();
    const campaign = window.SocialWavesData.getActiveCampaignFromUrl(id);
    document.title = campaign.title + ', Create Personalised poster to show support';

    const bannerPreview = document.getElementById('campaign-banner-img');
    const loaderBanner = document.getElementById('loader-banner-img');
    const titleEl = document.getElementById('campaign-title');
    const subtitleEl = document.getElementById('campaign-subtitle');
    const badgePill = document.getElementById('campaign-badge-pill');
    const ratioPill = document.getElementById('campaign-ratio-pill');
    const resultSplitWrap = document.getElementById('result-split-wrap');
    const formEl = document.getElementById('main_form');
    const formFieldsWrap = document.getElementById('dynamic-fields');
    const frameIdInput = document.getElementById('frame_id_input');

    const modal = document.getElementById('modal');
    const modalCloseBtns = document.querySelectorAll('[data-dismiss="modal"]');
    const fileInput = document.getElementById('file-input');
    const fileLabel = document.getElementById('file-label-text');
    const stageWrap = document.getElementById('cropper-stage-wrap');
    const cropCanvas = document.getElementById('cropper-canvas');
    const zoomSlider = document.getElementById('cropper-zoom');
    const rotateSlider = document.getElementById('cropper-rotate');
    const rotateValue = document.getElementById('cropper-rotate-val');
    const zoomValue = document.getElementById('cropper-zoom-val');
    const btnRotateLeft = document.getElementById('cropper-rot-left');
    const btnRotateRight = document.getElementById('cropper-rot-right');
    const btnFlipX = document.getElementById('cropper-flip-x');
    const btnResetPos = document.getElementById('cropper-reset');
    const nudgeBtns = document.querySelectorAll('[data-nudge]');
    const cropButtons = document.querySelectorAll('.crop-button');

    const loaderScreen = document.getElementById('loader-screen');
    const formContainer = document.getElementById('ad_show_hidden');
    const progressBar = document.getElementById('progress-bar');
    const repImage = document.getElementById('rep_image_ret');
    const fnlOut = document.getElementById('fnl_out');
    const finalPosterImg = document.getElementById('final-poster-img');
    const dwBtn = document.getElementById('dw_btn');
    const fbShare = document.getElementById('fb_share');
    const wtShare = document.getElementById('wt_share');
    const newPosterBtn = document.getElementById('new-poster-btn');
    const campaignTopbar = document.getElementById('campaign-topbar');
    const campaignNavToggle = document.getElementById('campaign-nav-toggle');

    if (campaignTopbar && campaignNavToggle) {
      campaignNavToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        const isOpen = campaignTopbar.classList.toggle('menu-open');
        campaignNavToggle.setAttribute('aria-expanded', String(isOpen));
        campaignNavToggle.innerHTML = isOpen ? '&times;' : '&#9776;';
      });
      document.addEventListener('click', function (e) {
        if (!campaignTopbar.contains(e.target) && campaignTopbar.classList.contains('menu-open')) {
          campaignTopbar.classList.remove('menu-open');
          campaignNavToggle.setAttribute('aria-expanded', 'false');
          campaignNavToggle.innerHTML = '&#9776;';
        }
      });
    }

    let selectedFrame = (campaign.frames && campaign.frames[0]) || null;
    let cropperInstance = null;

    const tcStatusBadge = document.getElementById('tc-status-badge');
    const tcPresetBtns = document.querySelectorAll('[data-tc-preset]');
    const tcYPct = document.getElementById('tc-y-pct');
    const tcYVal = document.getElementById('tc-y-val');
    const tcXPct = document.getElementById('tc-x-pct');
    const tcXVal = document.getElementById('tc-x-val');
    const tcFontSize = document.getElementById('tc-font-size');
    const tcSizeVal = document.getElementById('tc-size-val');
    const tcColorEnable = document.getElementById('tc-color-enable');
    const tcColor = document.getElementById('tc-color');
    const tcAlign = document.getElementById('tc-align');
    const tcCase = document.getElementById('tc-case');
    const tcPillEnable = document.getElementById('tc-pill-enable');
    const tcPillColor = document.getElementById('tc-pill-color');
    const tcResetBtn = document.getElementById('tc-reset-btn');

    const PRESET_Y_PCT = { top: 8, upper: 24, center: 50, bottom: 84 };
    const tcState = {
      preset: 'default',
      yPct: null,
      xPct: null,
      fontSize: null,
      colorEnabled: false,
      color: '#ffffff',
      align: '',
      textTransform: '',
      pillEnabled: false,
      pillColor: '#047857'
    };

    function tcIsActive() {
      return tcState.preset !== 'default' ||
        tcState.yPct !== null ||
        tcState.xPct !== null ||
        tcState.fontSize !== null ||
        tcState.colorEnabled ||
        Boolean(tcState.align) ||
        Boolean(tcState.textTransform) ||
        tcState.pillEnabled;
    }

    function parseSlotFont(ts) {
      if (ts.fontSize || ts.fontFamily || ts.fontWeight) {
        return {
          weight: ts.fontWeight || '700',
          size: Number(ts.fontSize) || 36,
          family: ts.fontFamily || 'Montserrat, sans-serif'
        };
      }
      const m = String(ts.font || '').match(/^\s*(\d+|bold|normal)?\s*(\d+)px\s+(.+)$/i);
      if (m) {
        return {
          weight: m[1] || '700',
          size: Number(m[2]) || 36,
          family: m[3] || 'Montserrat, sans-serif'
        };
      }
      return { weight: '700', size: 36, family: 'Montserrat, sans-serif' };
    }

    function applyTextOverrides(baseCampaign, W, H) {
      const clonedSlots = (baseCampaign.textSlots || []).map(function (s) {
        return Object.assign({}, s);
      });
      if (!tcIsActive() || !clonedSlots.length) {
        return Object.assign({}, baseCampaign, { textSlots: clonedSlots });
      }

      const hasFieldSlots = clonedSlots.some(function (s) { return Boolean(s.field); });
      const targetSlots = hasFieldSlots
        ? clonedSlots.filter(function (s) { return Boolean(s.field); })
        : clonedSlots;

      const minOrigY = targetSlots.reduce(function (acc, s) {
        return Math.min(acc, Number(s.y) || 0);
      }, Infinity);
      const primaryOrigSize = parseSlotFont(targetSlots[0]).size || 36;

      targetSlots.forEach(function (ts) {
        const parsed = parseSlotFont(ts);

        if (tcState.fontSize !== null) {
          const ratio = Math.min(1, Math.max(0.55, parsed.size / primaryOrigSize));
          const nextSize = Math.max(14, Math.round(tcState.fontSize * ratio));
          ts.fontSize = nextSize;
          ts.fontWeight = parsed.weight;
          ts.fontFamily = parsed.family;
          ts.font = '';
        }

        const effectiveSize = Number(ts.fontSize) || parsed.size;
        if (tcState.yPct !== null) {
          const anchorY = (tcState.yPct / 100) * H;
          const offsetFromTop = (Number(ts.y) || minOrigY) - minOrigY;
          const margin = Math.max(18, Math.round(effectiveSize * 0.7));
          ts.y = Math.max(margin, Math.min(H - margin, Math.round(anchorY + offsetFromTop)));
        }

        if (tcState.xPct !== null) {
          ts.x = Math.round((tcState.xPct / 100) * W);
        } else if (tcState.align === 'left') {
          ts.x = Math.round(W * 0.08);
        } else if (tcState.align === 'right') {
          ts.x = Math.round(W * 0.92);
        }

        if (tcState.align) ts.align = tcState.align;
        if (tcState.colorEnabled) ts.color = tcState.color;
        if (tcState.textTransform) ts.textTransform = tcState.textTransform;
        if (tcState.pillEnabled) {
          ts.bgEnabled = true;
          ts.bgColor = tcState.pillColor || '#047857';
        }
      });

      return Object.assign({}, baseCampaign, { textSlots: clonedSlots });
    }

    function buildPreviewFormValues() {
      const vals = {};
      if (formEl) {
        const fd = new FormData(formEl);
        fd.forEach(function (v, k) { vals[k] = String(v).trim(); });
      }
      (campaign.fields || []).forEach(function (f) {
        if (!vals[f.name]) {
          vals[f.name] = f.label || f.name;
        }
      });
      return vals;
    }

    function updateTcStatusBadge() {
      if (!tcStatusBadge) return;
      if (!tcIsActive()) {
        tcStatusBadge.textContent = 'Default';
      } else if (tcState.preset !== 'default') {
        tcStatusBadge.textContent = tcState.preset.charAt(0).toUpperCase() + tcState.preset.slice(1);
      } else {
        tcStatusBadge.textContent = 'Custom';
      }
    }

    function updateFramePreviews() {
      const generatedUrl = window.SocialWavesData.renderFrameDataUrl(campaign, { showPlaceholder: true, frame: selectedFrame });
      const candidates = [campaign.customFrameDataUrl, campaign.customFrameUrl, campaign.customFrameFallbackUrl, generatedUrl].filter(Boolean);
      const previewUrl = candidates[0] || generatedUrl;

      function attachFallback(imgEl) {
        if (!imgEl) return;
        let idx = 0;
        imgEl.onerror = function () {
          idx += 1;
          if (idx < candidates.length) {
            imgEl.src = candidates[idx];
          }
        };
        imgEl.src = previewUrl;
      }

      attachFallback(loaderBanner);
      if (!bannerPreview) return;

      if (!tcIsActive()) {
        attachFallback(bannerPreview);
        return;
      }

      loadFirstValidImage(candidates).then(function (overlayImg) {
        const W = campaign.frameWidth || overlayImg.naturalWidth || 800;
        const H = campaign.frameHeight || overlayImg.naturalHeight || 1000;
        const out = document.createElement('canvas');
        out.width = W;
        out.height = H;
        const ctx = out.getContext('2d');
        const overridden = applyTextOverrides(campaign, W, H);
        window.SocialWavesData.drawPosterComposite(ctx, W, H, overridden, null, overlayImg, buildPreviewFormValues());
        bannerPreview.src = out.toDataURL('image/png');
      }).catch(function () {
        attachFallback(bannerPreview);
      });
    }

    function syncPresetButtons(activePreset) {
      tcPresetBtns.forEach(function (btn) {
        btn.classList.toggle('active', btn.dataset.tcPreset === activePreset);
      });
    }

    tcPresetBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const preset = btn.dataset.tcPreset || 'default';
        tcState.preset = preset;
        if (preset === 'default') {
          tcState.yPct = null;
          if (tcYVal) tcYVal.textContent = 'Auto';
        } else {
          const pct = PRESET_Y_PCT[preset] || 84;
          tcState.yPct = pct;
          if (tcYPct) tcYPct.value = String(pct);
          if (tcYVal) tcYVal.textContent = pct + '%';
        }
        syncPresetButtons(preset);
        updateTcStatusBadge();
        updateFramePreviews();
      });
    });

    if (tcYPct) {
      tcYPct.addEventListener('input', function () {
        const val = Number(tcYPct.value);
        tcState.yPct = val;
        tcState.preset = 'custom';
        syncPresetButtons('');
        if (tcYVal) tcYVal.textContent = val + '%';
        updateTcStatusBadge();
        updateFramePreviews();
      });
    }

    if (tcXPct) {
      tcXPct.addEventListener('input', function () {
        const val = Number(tcXPct.value);
        tcState.xPct = val;
        if (tcXVal) tcXVal.textContent = val + '%';
        updateTcStatusBadge();
        updateFramePreviews();
      });
    }

    if (tcFontSize) {
      tcFontSize.addEventListener('input', function () {
        const val = Number(tcFontSize.value);
        tcState.fontSize = val;
        if (tcSizeVal) tcSizeVal.textContent = val + 'px';
        updateTcStatusBadge();
        updateFramePreviews();
      });
    }

    if (tcColorEnable && tcColor) {
      tcColorEnable.addEventListener('change', function () {
        tcState.colorEnabled = tcColorEnable.checked;
        tcState.color = tcColor.value;
        updateTcStatusBadge();
        updateFramePreviews();
      });
      tcColor.addEventListener('input', function () {
        tcColorEnable.checked = true;
        tcState.colorEnabled = true;
        tcState.color = tcColor.value;
        updateTcStatusBadge();
        updateFramePreviews();
      });
    }

    if (tcAlign) {
      tcAlign.addEventListener('change', function () {
        tcState.align = tcAlign.value;
        updateTcStatusBadge();
        updateFramePreviews();
      });
    }

    if (tcCase) {
      tcCase.addEventListener('change', function () {
        tcState.textTransform = tcCase.value;
        updateTcStatusBadge();
        updateFramePreviews();
      });
    }

    if (tcPillEnable && tcPillColor) {
      tcPillEnable.addEventListener('change', function () {
        tcState.pillEnabled = tcPillEnable.checked;
        tcState.pillColor = tcPillColor.value;
        updateTcStatusBadge();
        updateFramePreviews();
      });
      tcPillColor.addEventListener('input', function () {
        tcPillEnable.checked = true;
        tcState.pillEnabled = true;
        tcState.pillColor = tcPillColor.value;
        updateTcStatusBadge();
        updateFramePreviews();
      });
    }

    if (tcResetBtn) {
      tcResetBtn.addEventListener('click', function () {
        tcState.preset = 'default';
        tcState.yPct = null;
        tcState.xPct = null;
        tcState.fontSize = null;
        tcState.colorEnabled = false;
        tcState.align = '';
        tcState.textTransform = '';
        tcState.pillEnabled = false;
        syncPresetButtons('default');
        if (tcYPct) tcYPct.value = '84';
        if (tcYVal) tcYVal.textContent = 'Auto';
        if (tcXPct) tcXPct.value = '50';
        if (tcXVal) tcXVal.textContent = '50%';
        if (tcFontSize) tcFontSize.value = '36';
        if (tcSizeVal) tcSizeVal.textContent = 'Auto';
        if (tcColorEnable) tcColorEnable.checked = false;
        if (tcColor) tcColor.value = '#ffffff';
        if (tcAlign) tcAlign.value = '';
        if (tcCase) tcCase.value = '';
        if (tcPillEnable) tcPillEnable.checked = false;
        if (tcPillColor) tcPillColor.value = '#047857';
        updateTcStatusBadge();
        updateFramePreviews();
      });
    }

    if (formEl) {
      formEl.addEventListener('input', function () {
        if (tcIsActive()) updateFramePreviews();
      });
      formEl.addEventListener('change', function () {
        if (tcIsActive()) updateFramePreviews();
      });
    }

    titleEl.textContent = campaign.title;
    subtitleEl.textContent = campaign.subtitle || 'Create and download poster with your own image';
    if (badgePill) badgePill.textContent = campaign.badge || 'Campaign';
    if (ratioPill) ratioPill.textContent = (campaign.cropWidth || 243) + ' × ' + (campaign.cropHeight || 292) + ' px';
    if (frameIdInput) {
      frameIdInput.value = (selectedFrame && selectedFrame.id) || campaign.frameId || '5203';
    }
    updateFramePreviews();

    // Render dynamic form fields matching SocialWaves' .form-label-group rules
    formFieldsWrap.innerHTML = '';

    if (campaign.frames && campaign.frames.length > 1) {
      const frameGroup = document.createElement('div');
      frameGroup.className = 'form-label-group';
      const sel = document.createElement('select');
      sel.name = 'frame_selector';
      campaign.frames.forEach(function (f) {
        const opt = document.createElement('option');
        opt.value = f.id;
        opt.textContent = f.label;
        sel.appendChild(opt);
      });
      sel.addEventListener('change', function () {
        frameIdInput.value = sel.value;
        selectedFrame = campaign.frames.find(function (f) { return f.id === sel.value; }) || selectedFrame;
        updateFramePreviews();
      });
      frameGroup.appendChild(sel);
      formFieldsWrap.appendChild(frameGroup);
    }

    (campaign.fields || []).forEach(function (field) {
      const group = document.createElement('div');
      group.className = 'form-label-group';

      if (field.type === 'select') {
        const select = document.createElement('select');
        select.name = field.name;
        if (field.required) select.required = true;
        const blank = document.createElement('option');
        blank.value = '';
        blank.textContent = field.label;
        select.appendChild(blank);
        (field.options || []).forEach(function (optVal) {
          const opt = document.createElement('option');
          opt.value = optVal;
          opt.textContent = optVal;
          select.appendChild(opt);
        });
        group.appendChild(select);
      } else {
        const inputId = 'field_' + field.name;
        const input = document.createElement('input');
        input.type = field.type || 'text';
        input.id = inputId;
        input.name = field.name;
        input.placeholder = ' ';
        if (field.required) input.required = true;
        const label = document.createElement('label');
        label.setAttribute('for', inputId);
        label.textContent = field.label;
        group.appendChild(input);
        group.appendChild(label);
      }
      formFieldsWrap.appendChild(group);
    });

    function openModal() {
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
    }

    function closeModal() {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      if (cropperInstance) {
        cropperInstance.destroy();
        cropperInstance = null;
      }
      fileInput.value = '';
      fileLabel.textContent = 'Select file...';
      stageWrap.classList.remove('active');
      cropButtons.forEach(function (b) { b.style.display = 'none'; });
    }

    formEl.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!formEl.checkValidity()) {
        formEl.reportValidity();
        return;
      }
      openModal();
    });

    modalCloseBtns.forEach(function (btn) {
      btn.addEventListener('click', closeModal);
    });

    fileInput.addEventListener('change', function (e) {
      const files = e.target.files;
      if (!files || !files.length) return;
      const file = files[0];
      fileLabel.textContent = file.name;

      const reader = new FileReader();
      reader.onload = function (ev) {
        loadImage(ev.target.result).then(function (img) {
          if (cropperInstance) cropperInstance.destroy();
          stageWrap.classList.add('active');
          zoomSlider.value = '1';
          if (zoomValue) zoomValue.textContent = '1.00x';
          if (rotateSlider) rotateSlider.value = '0';
          if (rotateValue) rotateValue.textContent = '0°';
          cropperInstance = new window.SimpleCropper(cropCanvas, img, {
            aspectRatio: campaign.aspectRatio || (campaign.cropWidth / campaign.cropHeight),
            onZoomChange: function (z) {
              zoomSlider.value = String(z.toFixed(2));
              if (zoomValue) zoomValue.textContent = z.toFixed(2) + 'x';
            }
          });
          cropButtons.forEach(function (b) { b.style.display = 'inline-block'; });
        });
      };
      reader.readAsDataURL(file);
    });

    zoomSlider.addEventListener('input', function () {
      if (cropperInstance) {
        const z = parseFloat(zoomSlider.value);
        cropperInstance.setZoom(z);
        if (zoomValue) zoomValue.textContent = z.toFixed(2) + 'x';
      }
    });

    if (rotateSlider) {
      rotateSlider.addEventListener('input', function () {
        if (cropperInstance) {
          const deg = parseFloat(rotateSlider.value);
          cropperInstance.setRotation(deg);
          if (rotateValue) rotateValue.textContent = deg + '°';
        }
      });
    }

    if (btnRotateLeft) {
      btnRotateLeft.addEventListener('click', function () {
        if (!cropperInstance) return;
        cropperInstance.rotateBy(-90);
        if (rotateValue) rotateValue.textContent = cropperInstance.rotationDeg + '°';
      });
    }

    if (btnRotateRight) {
      btnRotateRight.addEventListener('click', function () {
        if (!cropperInstance) return;
        cropperInstance.rotateBy(90);
        if (rotateValue) rotateValue.textContent = cropperInstance.rotationDeg + '°';
      });
    }

    if (btnFlipX) {
      btnFlipX.addEventListener('click', function () {
        if (cropperInstance) cropperInstance.toggleFlipX();
      });
    }

    if (btnResetPos) {
      btnResetPos.addEventListener('click', function () {
        if (!cropperInstance) return;
        cropperInstance.reset();
        zoomSlider.value = '1';
        if (zoomValue) zoomValue.textContent = '1.00x';
        if (rotateSlider) rotateSlider.value = '0';
        if (rotateValue) rotateValue.textContent = '0°';
      });
    }

    nudgeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!cropperInstance) return;
        const parts = (btn.dataset.nudge || '0,0').split(',');
        cropperInstance.nudge(Number(parts[0]) || 0, Number(parts[1]) || 0);
      });
    });

    async function compositePoster(croppedCanvas, formValues) {
      const fallbackGenUrl = window.SocialWavesData.renderFrameDataUrl(campaign, { showPlaceholder: false, frame: selectedFrame });
      const overlayImg = await loadFirstValidImage([
        campaign.customFrameDataUrl,
        campaign.customFrameUrl,
        campaign.customFrameFallbackUrl,
        fallbackGenUrl
      ]);

      const W = campaign.frameWidth || overlayImg.naturalWidth || 800;
      const H = campaign.frameHeight || overlayImg.naturalHeight || 1000;
      const out = document.createElement('canvas');
      out.width = W;
      out.height = H;
      const ctx = out.getContext('2d');

      const overriddenCampaign = applyTextOverrides(campaign, W, H);
      window.SocialWavesData.drawPosterComposite(ctx, W, H, overriddenCampaign, croppedCanvas, overlayImg, formValues);
      return out.toDataURL('image/png', 1.0);
    }

    cropButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!cropperInstance) return;
        const cropped = cropperInstance.getCroppedCanvas({
          width: campaign.cropWidth || 243,
          height: campaign.cropHeight || 292
        });

        const formData = new FormData(formEl);
        const formValues = {};
        formData.forEach(function (v, k) {
          formValues[k] = String(v);
        });

        closeModal();
        formContainer.style.display = 'none';
        loaderScreen.classList.add('active');
        repImage.src = cropped.toDataURL('image/png');

        // Progress simulation matching SocialWaves' upload progress UX
        let pct = 15;
        progressBar.style.width = pct + '%';
        progressBar.textContent = pct + '%';

        const timer = setInterval(function () {
          pct = Math.min(95, pct + 20);
          progressBar.style.width = pct + '%';
          progressBar.textContent = pct + '%';
        }, 110);

        compositePoster(cropped, formValues).then(function (finalDataUrl) {
          setTimeout(function () {
            clearInterval(timer);
            progressBar.style.width = '100%';
            progressBar.textContent = '100%';

            document.querySelectorAll('.complete-hide').forEach(function (el) {
              el.style.display = 'none';
            });

            window.SocialWavesData.incrementPosterStat(campaign.id);

            if (resultSplitWrap) resultSplitWrap.style.display = 'grid';
            fnlOut.textContent = 'POSTER CREATION SUCCESS';
            fnlOut.style.display = 'block';
            finalPosterImg.src = finalDataUrl;
            finalPosterImg.style.display = 'block';

            const safeName = (formValues.name || 'poster').replace(/[^a-z0-9_-]+/gi, '_');
            dwBtn.href = finalDataUrl;
            dwBtn.download = safeName + '-' + campaign.id + '.png';

            const shareUrl = window.location.href;
            fbShare.href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(shareUrl);
            wtShare.href = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(campaign.title + ' - Create your poster: ' + shareUrl);

            document.getElementById('success-actions').style.display = 'block';
          }, 520);
        });
      });
    });

    if (newPosterBtn) {
      newPosterBtn.addEventListener('click', function () {
        window.location.reload();
      });
    }
  }
})();
