(function () {
  'use strict';

  function initHeaderAndNav() {
    const header = document.getElementById('header');
    const backToTop = document.querySelector('.back-to-top');
    const mobileToggle = document.querySelector('.mobile-nav-toggle');
    const mobileOverlay = document.querySelector('.mobile-nav-overlay');
    const mobileLinks = document.querySelectorAll('.mobile-nav a');

    function onScroll() {
      const y = window.scrollY || window.pageYOffset;
      if (header && header.dataset.transparent === 'true') {
        header.classList.toggle('header-scrolled', y > 100);
      }
      if (backToTop) {
        backToTop.classList.toggle('visible', y > 100);
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    function closeMobileNav() {
      document.body.classList.remove('mobile-nav-active');
      if (mobileToggle) mobileToggle.innerHTML = '&#9776;';
    }

    if (mobileToggle) {
      mobileToggle.addEventListener('click', function () {
        const isOpen = document.body.classList.toggle('mobile-nav-active');
        mobileToggle.innerHTML = isOpen ? '&times;' : '&#9776;';
      });
    }
    if (mobileOverlay) {
      mobileOverlay.addEventListener('click', closeMobileNav);
    }
    mobileLinks.forEach(function (link) {
      link.addEventListener('click', closeMobileNav);
    });
  }

  function initActiveCampaignsCarousel() {
    const track = document.getElementById('campaigns-track');
    if (!track || !window.SocialWavesData) return;

    const campaigns = window.SocialWavesData.getAllCampaigns().slice(0, 10);
    track.innerHTML = '';

    campaigns.forEach(function (c) {
      const slide = document.createElement('div');
      slide.className = 'campaign-slide';
      const previewUrl = c.customFrameDataUrl || c.customFrameUrl || window.SocialWavesData.renderFrameDataUrl(c, { showPlaceholder: true });
      const launchUrl = window.SocialWavesData.getCampaignLaunchUrl(c);

      const card = document.createElement('div');
      card.className = 'member';
      card.setAttribute('role', 'link');
      card.setAttribute('tabindex', '0');
      card.addEventListener('click', function () {
        window.location.href = launchUrl;
      });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          window.location.href = launchUrl;
        }
      });

      card.innerHTML =
        '<div class="pic"><img src="' + previewUrl + '" alt="' + escapeHtml(c.title) + '"></div>' +
        '<div class="member-info"><h4>' + escapeHtml(c.title) + '</h4><span>' + escapeHtml(c.badge || '') + '</span></div>';

      slide.appendChild(card);
      track.appendChild(slide);
    });

    const dotsWrap = document.getElementById('campaigns-dots');
    const prevBtn = document.getElementById('campaigns-prev');
    const nextBtn = document.getElementById('campaigns-next');
    let currentIndex = 0;

    function visibleCount() {
      if (window.innerWidth <= 640) return 1;
      if (window.innerWidth <= 999) return 3;
      return 4;
    }

    function maxIndex() {
      return Math.max(0, campaigns.length - visibleCount());
    }

    function renderDots() {
      if (!dotsWrap) return;
      const pages = maxIndex() + 1;
      dotsWrap.innerHTML = '';
      for (let i = 0; i < pages; i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carousel-dot' + (i === currentIndex ? ' active' : '');
        dot.setAttribute('aria-label', 'Slide ' + (i + 1));
        dot.addEventListener('click', function () {
          goTo(i);
        });
        dotsWrap.appendChild(dot);
      }
    }

    function goTo(idx) {
      const m = maxIndex();
      currentIndex = idx < 0 ? m : idx > m ? 0 : idx;
      const firstSlide = track.querySelector('.campaign-slide');
      const stepPx = firstSlide ? firstSlide.getBoundingClientRect().width + 24 : 0;
      track.style.transform = 'translateX(-' + (currentIndex * stepPx) + 'px)';
      renderDots();
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(currentIndex - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(currentIndex + 1); });
    window.addEventListener('resize', function () { goTo(Math.min(currentIndex, maxIndex())); });

    renderDots();
    setInterval(function () {
      goTo(currentIndex + 1);
    }, 4500);
  }

  function initTestimonialsCarousel() {
    const track = document.getElementById('testimonials-track');
    if (!track) return;
    const slides = track.querySelectorAll('.testimonial-item');
    const dotsWrap = document.getElementById('testimonials-dots');
    const prevBtn = document.getElementById('testimonials-prev');
    const nextBtn = document.getElementById('testimonials-next');
    let idx = 0;

    function update() {
      track.style.transform = 'translateX(-' + (idx * 100) + '%)';
      if (dotsWrap) {
        dotsWrap.querySelectorAll('.carousel-dot').forEach(function (d, i) {
          d.classList.toggle('active', i === idx);
        });
      }
    }

    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      slides.forEach(function (_, i) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Testimonial ' + (i + 1));
        dot.addEventListener('click', function () {
          idx = i;
          update();
        });
        dotsWrap.appendChild(dot);
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        idx = (idx - 1 + slides.length) % slides.length;
        update();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        idx = (idx + 1) % slides.length;
        update();
      });
    }

    setInterval(function () {
      idx = (idx + 1) % slides.length;
      update();
    }, 5500);
  }

  function initPricingTabs() {
    const tabBtns = document.querySelectorAll('.pricing-tab-btn');
    const panes = document.querySelectorAll('.tab-pane');
    if (!tabBtns.length) return;

    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const targetId = btn.dataset.tabTarget;
        tabBtns.forEach(function (b) { b.classList.remove('active'); });
        panes.forEach(function (p) { p.classList.remove('active'); });
        btn.classList.add('active');
        const targetPane = document.getElementById(targetId);
        if (targetPane) targetPane.classList.add('active');
      });
    });
  }

  function initFaqAccordion() {
    const triggers = document.querySelectorAll('.faq-trigger');
    triggers.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const targetId = btn.dataset.faqTarget;
        const body = document.getElementById(targetId);
        if (!body) return;
        const isOpen = body.classList.contains('show');
        document.querySelectorAll('.faq-body').forEach(function (b) { b.classList.remove('show'); });
        document.querySelectorAll('.faq-trigger').forEach(function (t) { t.classList.add('collapsed'); });
        if (!isOpen) {
          body.classList.add('show');
          btn.classList.remove('collapsed');
        }
      });
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  window.escapeHtml = escapeHtml;

  function initScrollReveal() {
    const sections = document.querySelectorAll('main section');
    if (!sections.length) return;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) return;

    sections.forEach(function (sec) {
      if (sec.getBoundingClientRect().top > window.innerHeight * 0.92) {
        sec.classList.add('reveal-section');
      }
    });

    const obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    sections.forEach(function (sec) {
      if (sec.classList.contains('reveal-section')) {
        obs.observe(sec);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initHeaderAndNav();
    initActiveCampaignsCarousel();
    initTestimonialsCarousel();
    initPricingTabs();
    initFaqAccordion();
    initScrollReveal();
  });
})();
