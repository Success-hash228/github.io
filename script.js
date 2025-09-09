// script.js
// Save this file as plain .js (no <script> wrapper). If VS Code still reports parsing errors,
// add "// @ts-nocheck" at the top temporarily while you fix your ts/jsconfig settings.

(() => {
  'use strict';

  const DEBUG = false;
  const log = (...args) => { if (DEBUG) console.log(...args); };

  // Utility
  const clamp = (n, a = 0, b = 100) => Math.min(b, Math.max(a, Number(n) || 0));

  // DOM Ready (safe even if you include script in <head> without defer)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    try {
      initThemeToggle();
      initTyping();
      initParallax();
      initGauges();
      initContactForm();
      initYear();
      initRevealSections();
      initSmoothAnchors();
      log('All inits completed');
    } catch (err) {
      console.error('Init error', err);
    }
  }

  /* =========================
     THEME TOGGLE
  ========================== */
  function initThemeToggle() {
    const root = document.documentElement;
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'light') root.classList.add('light');

    const setThemeIcon = () => {
      if (!themeToggle) return;
      themeToggle.innerHTML = root.classList.contains('light')
        ? '<i class="fa-solid fa-sun"></i>'
        : '<i class="fa-solid fa-moon"></i>';
    };
    setThemeIcon();

    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        root.classList.toggle('light');
        localStorage.setItem(
          'theme',
          root.classList.contains('light') ? 'light' : 'dark'
        );
        setThemeIcon();
      });
    }
  }

  /* =========================
     TYPING EFFECT
     Expected: an element with id="typed"
  ========================== */
  function initTyping() {
    const roles = [
      'Web Developer',
      'Designer',
      'Full Stack Engineer',
      'UI/UX Enthusiast' ,
      'Beta Reader' 
    ];
    const typedEl = document.getElementById('typed');
    if (!typedEl) return;

    let r = 0, i = 0, deleting = false;

    function tick() {
      const current = String(roles[r % roles.length] || '');
      // ensure i bounds
      i = clamp(i, 0, current.length);

      typedEl.textContent = current.slice(0, i);

      if (!deleting && i < current.length) {
        i++;
      } else if (deleting && i > 0) {
        i--;
      }

      if (i === current.length && !deleting) {
        // pause briefly at end before deleting
        deleting = true;
        setTimeout(tick, 700);
        return;
      } else if (i === 0 && deleting) {
        deleting = false;
        r++;
      }

      const speed = deleting ? 40 : 90;
      setTimeout(tick, speed + Math.random() * 80);
    }

    tick();
  }

  /* =========================
     PARALLAX
     Any element with class .parallax
  ========================== */
  function initParallax() {
    const parallaxEls = document.querySelectorAll('.parallax');
    if (!parallaxEls || parallaxEls.length === 0) return;

    let ticking = false;
    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY || window.pageYOffset || 0;
          parallaxEls.forEach(el => {
            // small defensive: only set if element still exists
            try { el.style.transform = `translateY(${y * -0.05}px)`; } catch (e) { /* noop */ }
          });
          ticking = false;
        });
        ticking = true;
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* =========================
     CIRCULAR GAUGES
     HTML expectations:
     <div class="gauge" data-value="78">
       <svg ...><circle class="bg" r="52" ... /><circle class="meter" r="52" ... /></svg>
       <div class="gauge-label">JavaScript</div>
     </div>
  ========================== */
  function initGauges() {
    const gauges = Array.from(document.querySelectorAll('.gauge'));
    if (!gauges.length) return;

    gauges.forEach(g => {
      const meter = g.querySelector('.meter');
      if (!meter) return;
      const r = parseFloat(meter.getAttribute('r')) || 52;
      const C = 2 * Math.PI * r;
      // use strings to avoid weird serialization warnings in some linters
      meter.style.strokeDasharray = String(C);
      meter.style.strokeDashoffset = String(C);
      meter.dataset.circumference = String(C);

      // ARIA
      const value = clamp(g.dataset.value ?? g.dataset.percent ?? g.getAttribute('data-value') ?? 0);
      g.setAttribute('role', 'progressbar');
      g.setAttribute('aria-valuemin', '0');
      g.setAttribute('aria-valuemax', '100');
      g.setAttribute('aria-valuenow', String(value));
    });

    const animate = (g) => {
      const meter = g.querySelector('.meter');
      if (!meter) return;
      const C = parseFloat(meter.dataset.circumference) || 0;
      const rawVal = g.dataset.value ?? g.dataset.percent ?? g.getAttribute('data-value') ?? '0';
      const val = clamp(rawVal);
      const offset = C * (1 - val / 100);

      // transition smoothing
      meter.style.transition = 'stroke-dashoffset 1.0s cubic-bezier(.2,.9,.2,1)';
      // trigger in next frame
      requestAnimationFrame(() => { meter.style.strokeDashoffset = String(offset); });
    };

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach(en => {
          if (en.isIntersecting) {
            animate(en.target);
            obs.unobserve(en.target);
          }
        });
      }, { threshold: 0.35 });
      gauges.forEach(g => io.observe(g));
    } else {
      // fallback: animate all immediately
      gauges.forEach(animate);
    }
  }

  /* =========================
     CONTACT FORM
     Expected: form#contactForm with inputs named name,email,message
     fallback button id: fallbackEmail
     status container id: formStatus
  ========================== */
  function initContactForm() {
    const form = document.getElementById('contactForm');
    const statusEl = document.getElementById('formStatus');
    const fallbackBtn = document.getElementById('fallbackEmail');

    if (fallbackBtn) {
      fallbackBtn.addEventListener('click', () => {
        const name = form && form.elements && form.elements['name'] ? form.elements['name'].value : '';
        const email = form && form.elements && form.elements['email'] ? form.elements['email'].value : '';
        const message = form && form.elements && form.elements['message'] ? form.elements['message'].value : '';
        const subject = encodeURIComponent('Project Inquiry from Portfolio');
        const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
        window.location.href = `mailto:webscientist.success@gmail.com?subject=${subject}&body=${body}`;
      });
    }

    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (statusEl) statusEl.textContent = 'Sending...';

      const data = new FormData(form);
      const actionURL = (form.action || '').trim();
      const isFormspree = actionURL && !actionURL.endsWith('/your-form-id');

      if (isFormspree) {
        try {
          const res = await fetch(actionURL, { method: 'POST', body: data });
          if (res && res.ok) {
            if (statusEl) statusEl.textContent = 'Thanks! Your message has been sent.';
            form.reset();
            return;
          } else {
            log('Form post returned not-ok', res && res.status);
          }
        } catch (err) {
          console.warn('Form submit failed:', err);
        }
      }

      // fallback to mailto
      const name = form.elements['name'] ? form.elements['name'].value : '';
      const email = form.elements['email'] ? form.elements['email'].value : '';
      const message = form.elements['message'] ? form.elements['message'].value : '';
      const subject = encodeURIComponent('Project Inquiry from Portfolio');
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
      if (statusEl) statusEl.textContent = 'Opening your mail app...';
      window.location.href = `mailto:webscientist.success@gmail.com?subject=${subject}&body=${body}`;
    });
  }

  /* =========================
     DYNAMIC YEAR
  ========================== */
  function initYear() {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  /* =========================
     REVEAL SECTIONS (IntersectionObserver)
     Elements with class .section will gain .visible when in view
  ========================== */
  function initRevealSections() {
    const sections = Array.from(document.querySelectorAll('.section'));
    if (!sections.length) return;
    const revealClass = 'visible';

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.classList.add(revealClass);
        });
      }, { rootMargin: '0px 0px -80px 0px' });

      sections.forEach(s => io.observe(s));
    } else {
      sections.forEach(s => s.classList.add(revealClass));
    }
  }

  /* =========================
     Smooth anchors for in-page links
  ========================== */
  function initSmoothAnchors() {
    Array.from(document.querySelectorAll('a[href^="#"]')).forEach(a => {
      a.addEventListener('click', function (ev) {
        const href = this.getAttribute('href');
        if (!href || href === '#') return;
        const target = document.querySelector(href);
        if (target) {
          ev.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

})();
