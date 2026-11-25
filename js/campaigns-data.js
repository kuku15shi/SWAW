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
    const existing = getCustomCampaigns().filter(function (c) { return c.id !== campaign.id; });
    existing.unshift(campaign);
    localStorage.setItem(STORAGE_CAMPAIGNS_KEY, JSON.stringify(existing));
  }

  function deleteCustomCampaign(id) {
    const existing = getCustomCampaigns().filter(function (c) { return c.id !== id; });
    localStorage.setItem(STORAGE_CAMPAIGNS_KEY, JSON.stringify(existing));
  }

  function isCustomCampaign(id) {
    return getCustomCampaigns().some(function (c) { return c.id === id; });
  }

  function getAllCampaigns() {
    return getCustomCampaigns().concat(DEFAULT_CAMPAIGNS);
  }

  function getCampaignById(id) {
    const list = getAllCampaigns();
    return list.find(function (c) { return c.id === id; }) || list[0];
  }

  function getPosterStats() {
    try {
      const raw = localStorage.getItem(STORAGE_STATS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function incrementPosterStat(campaignId) {
    const stats = getPosterStats();
    stats[campaignId] = (stats[campaignId] || 0) + 1;
    try {
      localStorage.setItem(STORAGE_STATS_KEY, JSON.stringify(stats));
    } catch (e) {
      // ignore storage errors
    }
    return stats[campaignId];
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
    getAllCampaigns: getAllCampaigns,
    getCampaignById: getCampaignById,
    saveCustomCampaign: saveCustomCampaign,
    deleteCustomCampaign: deleteCustomCampaign,
    isCustomCampaign: isCustomCampaign,
    getPosterStats: getPosterStats,
    incrementPosterStat: incrementPosterStat,
    renderFrameDataUrl: renderFrameDataUrl,
    drawRoundedRectPath: drawRoundedRectPath,
    drawPosterComposite: drawPosterComposite
  };
})(window);
