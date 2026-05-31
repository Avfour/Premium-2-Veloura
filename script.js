(function () {
  'use strict';

  // ---------- LOADER ----------
  const loader = document.getElementById('loader');
  window.addEventListener('load', () => {
    setTimeout(() => loader.classList.add('hide'), 900);
  });

  // ---------- OPEN INVITATION ----------
  const openBtn = document.getElementById('openBtn');
  const cover = document.getElementById('cover');
  const main = document.getElementById('main');
  const bgm = document.getElementById('bgm');
  const musicBtn = document.getElementById('musicBtn');
  const iconOn = document.getElementById('musicIconOn');
  const iconOff = document.getElementById('musicIconOff');

  function setMusicUI(playing) {
    if (playing) {
      musicBtn.classList.add('playing');
      iconOn.style.display = '';
      iconOff.style.display = 'none';
    } else {
      musicBtn.classList.remove('playing');
      iconOn.style.display = 'none';
      iconOff.style.display = '';
    }
  }

  openBtn.addEventListener('click', () => {
    cover.classList.add('hide');
    main.classList.remove('hidden');
    document.body.classList.remove('locked');
    // play music
    bgm.volume = 0.6;
    const p = bgm.play();
    if (p && p.then) {
      p.then(() => setMusicUI(true)).catch(() => setMusicUI(false));
    } else {
      setMusicUI(true);
    }
    // initial scroll
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    // trigger reveals after a tick
    setTimeout(runReveal, 200);
  });

  // ---------- MUSIC TOGGLE ----------
  musicBtn.addEventListener('click', () => {
    if (bgm.paused) {
      bgm.play().then(() => setMusicUI(true)).catch(() => {});
    } else {
      bgm.pause();
      setMusicUI(false);
    }
  });

  // ---------- REVEAL ON SCROLL ----------
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  function runReveal() {
    revealEls.forEach((el) => io.observe(el));
  }
  runReveal();

  // ---------- COUNTDOWN ----------
  const target = new Date('2026-12-12T08:00:00+07:00').getTime();
  const elD = document.getElementById('cd-days');
  const elH = document.getElementById('cd-hours');
  const elM = document.getElementById('cd-mins');
  const elS = document.getElementById('cd-secs');

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function tickCountdown() {
    const now = Date.now();
    let diff = target - now;
    if (diff < 0) diff = 0;
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    elD.textContent = pad(d);
    elH.textContent = pad(h);
    elM.textContent = pad(m);
    elS.textContent = pad(s);
  }
  tickCountdown();
  setInterval(tickCountdown, 1000);

  // ---------- COPY ----------
  const toast = document.getElementById('toast');
  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
  }
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-target');
      const txt = document.getElementById(id).textContent.trim();
      const fallback = () => {
        const ta = document.createElement('textarea');
        ta.value = txt;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(txt).then(
          () => showToast('Nomor rekening disalin'),
          () => { fallback(); showToast('Nomor rekening disalin'); }
        );
      } else {
        fallback();
        showToast('Nomor rekening disalin');
      }
    });
  });

  // ---------- GALLERY: infinite carousel + drag ----------
  const track = document.getElementById('galleryTrack');
  if (track) {
    // duplicate slides for infinite illusion
    const originals = Array.from(track.children);
    originals.forEach((s) => track.appendChild(s.cloneNode(true)));
    originals.forEach((s) => track.appendChild(s.cloneNode(true)));

    let offset = 0;
    let speed = 0.4; // px per frame
    let dragging = false;
    let startX = 0;
    let startOffset = 0;
    let lastX = 0;
    let velocity = 0;
    let paused = false;
    let resumeTimer;
    let momentumRAF;

    function getLoopWidth() {
      // total content width / 3 (because we tripled)
      return track.scrollWidth / 3;
    }

    function apply() {
      const loop = getLoopWidth();
      // keep offset bounded
      if (offset <= -loop * 2) offset += loop;
      if (offset >= 0) offset -= loop;
      track.style.transform = `translate3d(${offset}px,0,0)`;
      updateActive();
    }

    function updateActive() {
      const rect = track.parentElement.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      Array.from(track.children).forEach((slide) => {
        const r = slide.getBoundingClientRect();
        const sc = r.left + r.width / 2;
        const dist = Math.abs(center - sc);
        if (dist < r.width / 2) slide.classList.add('active');
        else slide.classList.remove('active');
      });
    }

    function loop() {
      if (!paused && !dragging) {
        offset -= speed;
        apply();
      }
      requestAnimationFrame(loop);
    }

    // initialize position to middle copy
    requestAnimationFrame(() => {
      offset = -getLoopWidth();
      apply();
      loop();
    });

    function pauseAutoplay() {
      paused = true;
      clearTimeout(resumeTimer);
    }
    function scheduleResume() {
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => { paused = false; }, 1400);
    }

    // Pointer events (covers touch + mouse)
    const onDown = (e) => {
      dragging = true;
      pauseAutoplay();
      cancelAnimationFrame(momentumRAF);
      track.classList.add('dragging');
      startX = (e.touches ? e.touches[0].clientX : e.clientX);
      lastX = startX;
      startOffset = offset;
      velocity = 0;
    };
    const onMove = (e) => {
      if (!dragging) return;
      const x = (e.touches ? e.touches[0].clientX : e.clientX);
      const dx = x - startX;
      velocity = x - lastX;
      lastX = x;
      offset = startOffset + dx;
      apply();
      if (e.cancelable) e.preventDefault();
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      track.classList.remove('dragging');
      // momentum
      const friction = 0.94;
      const step = () => {
        if (Math.abs(velocity) < 0.3) {
          scheduleResume();
          return;
        }
        offset += velocity;
        velocity *= friction;
        apply();
        momentumRAF = requestAnimationFrame(step);
      };
      momentumRAF = requestAnimationFrame(step);
    };

    track.addEventListener('touchstart', onDown, { passive: true });
    track.addEventListener('touchmove', onMove, { passive: false });
    track.addEventListener('touchend', onUp);
    track.addEventListener('touchcancel', onUp);
    track.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    // pause on hover (desktop)
    track.addEventListener('mouseenter', pauseAutoplay);
    track.addEventListener('mouseleave', scheduleResume);

    // recompute on resize
    window.addEventListener('resize', () => {
      offset = -getLoopWidth();
      apply();
    });
  }

  // ---------- LIGHT PARALLAX ----------
  const coverBg = document.querySelector('.cover-bg');
  const closingBg = document.querySelector('.closing-bg');
  function parallax() {
    const y = window.scrollY;
    if (closingBg) {
      const rect = closingBg.parentElement.getBoundingClientRect();
      const offsetY = (rect.top * 0.15);
      closingBg.style.transform = `translateY(${offsetY}px) scale(1.05)`;
    }
    requestAnimationFrame(parallax);
  }
  requestAnimationFrame(parallax);

  // resume music if user navigates away then back
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !bgm.paused) {
      setMusicUI(true);
    }
  });

})();
