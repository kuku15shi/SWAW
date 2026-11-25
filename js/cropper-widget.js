(function (global) {
  'use strict';

  /**
   * Interactive HTML5 Canvas cropper & image position controller implementing
   * aspectRatio + zoom + rotation + flip + nudge + getCroppedCanvas({ width, height }).
   */
  function SimpleCropper(canvasEl, imageEl, options) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.image = imageEl;
    this.aspectRatio = (options && options.aspectRatio) || 1;
    this.zoom = 1;
    this.minZoom = 0.5;
    this.maxZoom = 4;
    this.rotationDeg = 0;
    this.flipX = false;
    this.offsetX = 0;
    this.offsetY = 0;
    this.dragging = false;
    this.lastX = 0;
    this.lastY = 0;
    this.onZoomChange = (options && options.onZoomChange) || null;

    this._bindEvents();
    this.reset();
  }

  SimpleCropper.prototype._getCropBox = function () {
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const pad = 24;
    const availW = cw - pad * 2;
    const availH = ch - pad * 2;
    let boxW = availW;
    let boxH = boxW / this.aspectRatio;
    if (boxH > availH) {
      boxH = availH;
      boxW = boxH * this.aspectRatio;
    }
    return {
      x: (cw - boxW) / 2,
      y: (ch - boxH) / 2,
      w: boxW,
      h: boxH
    };
  };

  SimpleCropper.prototype.reset = function () {
    const box = this._getCropBox();
    const iw = this.image.naturalWidth || this.image.width || 1;
    const ih = this.image.naturalHeight || this.image.height || 1;
    const scaleX = box.w / iw;
    const scaleY = box.h / ih;
    this.baseScale = Math.max(scaleX, scaleY);
    this.zoom = 1;
    this.rotationDeg = 0;
    this.flipX = false;
    this.offsetX = 0;
    this.offsetY = 0;
    this.render();
  };

  SimpleCropper.prototype.setZoom = function (z) {
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, Number(z) || 1));
    this.render();
  };

  SimpleCropper.prototype.setRotation = function (deg) {
    this.rotationDeg = Number(deg) || 0;
    this.render();
  };

  SimpleCropper.prototype.rotateBy = function (deltaDeg) {
    this.rotationDeg = (this.rotationDeg + deltaDeg) % 360;
    this.render();
  };

  SimpleCropper.prototype.toggleFlipX = function () {
    this.flipX = !this.flipX;
    this.render();
  };

  SimpleCropper.prototype.nudge = function (dx, dy) {
    this.offsetX += dx;
    this.offsetY += dy;
    this.render();
  };

  SimpleCropper.prototype._drawTransformedImage = function (ctx, cx, cy, scale) {
    const iw = this.image.naturalWidth || this.image.width;
    const ih = this.image.naturalHeight || this.image.height;
    const drawW = iw * scale;
    const drawH = ih * scale;
    ctx.save();
    ctx.translate(cx, cy);
    if (this.rotationDeg) {
      ctx.rotate((this.rotationDeg * Math.PI) / 180);
    }
    if (this.flipX) {
      ctx.scale(-1, 1);
    }
    ctx.drawImage(this.image, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  };

  SimpleCropper.prototype.render = function () {
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const ctx = this.ctx;
    const box = this._getCropBox();
    const scale = this.baseScale * this.zoom;

    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, cw, ch);

    this._drawTransformedImage(ctx, cw / 2 + this.offsetX, ch / 2 + this.offsetY, scale);

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.56)';
    ctx.beginPath();
    ctx.rect(0, 0, cw, ch);
    ctx.rect(box.x, box.y, box.w, box.h);
    ctx.fill('evenodd');
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(box.x, box.y, box.w, box.h);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 2; i++) {
      const gx = box.x + (box.w / 3) * i;
      const gy = box.y + (box.h / 3) * i;
      ctx.beginPath();
      ctx.moveTo(gx, box.y);
      ctx.lineTo(gx, box.y + box.h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(box.x, gy);
      ctx.lineTo(box.x + box.w, gy);
      ctx.stroke();
    }
    ctx.restore();
  };

  SimpleCropper.prototype.getCroppedCanvas = function (opts) {
    const targetW = (opts && opts.width) || 243;
    const targetH = (opts && opts.height) || 292;
    const out = document.createElement('canvas');
    out.width = targetW;
    out.height = targetH;
    const octx = out.getContext('2d');

    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const box = this._getCropBox();
    const scale = this.baseScale * this.zoom;
    const ratioOut = targetW / box.w;

    const imgCenterXInBox = (cw / 2 + this.offsetX) - box.x;
    const imgCenterYInBox = (ch / 2 + this.offsetY) - box.y;

    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = 'high';
    octx.fillStyle = '#ffffff';
    octx.fillRect(0, 0, targetW, targetH);

    this._drawTransformedImage(
      octx,
      imgCenterXInBox * ratioOut,
      imgCenterYInBox * ratioOut,
      scale * ratioOut
    );
    return out;
  };

  SimpleCropper.prototype._bindEvents = function () {
    const self = this;
    this._onDown = function (e) {
      self.dragging = true;
      const pt = e.touches ? e.touches[0] : e;
      self.lastX = pt.clientX;
      self.lastY = pt.clientY;
    };
    this._onMove = function (e) {
      if (!self.dragging) return;
      if (e.cancelable) e.preventDefault();
      const pt = e.touches ? e.touches[0] : e;
      const rect = self.canvas.getBoundingClientRect();
      const ratioX = self.canvas.width / (rect.width || self.canvas.width);
      const ratioY = self.canvas.height / (rect.height || self.canvas.height);
      self.offsetX += (pt.clientX - self.lastX) * ratioX;
      self.offsetY += (pt.clientY - self.lastY) * ratioY;
      self.lastX = pt.clientX;
      self.lastY = pt.clientY;
      self.render();
    };
    this._onUp = function () {
      self.dragging = false;
    };
    this._onWheel = function (e) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.12 : -0.12;
      self.setZoom(self.zoom + delta);
      if (self.onZoomChange) self.onZoomChange(self.zoom);
    };

    this.canvas.addEventListener('mousedown', this._onDown);
    this.canvas.addEventListener('touchstart', this._onDown, { passive: true });
    window.addEventListener('mousemove', this._onMove);
    window.addEventListener('touchmove', this._onMove, { passive: false });
    window.addEventListener('mouseup', this._onUp);
    window.addEventListener('touchend', this._onUp);
    this.canvas.addEventListener('wheel', this._onWheel, { passive: false });
  };

  SimpleCropper.prototype.destroy = function () {
    this.canvas.removeEventListener('mousedown', this._onDown);
    this.canvas.removeEventListener('touchstart', this._onDown);
    window.removeEventListener('mousemove', this._onMove);
    window.removeEventListener('touchmove', this._onMove);
    window.removeEventListener('mouseup', this._onUp);
    window.removeEventListener('touchend', this._onUp);
    this.canvas.removeEventListener('wheel', this._onWheel);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  };

  global.SimpleCropper = SimpleCropper;
})(window);
