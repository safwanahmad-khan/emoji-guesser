/* EMOJI FOUNDERS — motion system.
   Every effect has an instant path (reduced motion OR GSAP failed to load),
   so the game is fully playable in all conditions. GSAP owns transform;
   CSS owns color. Callbacks are the only sequencing mechanism. */
window.EF = window.EF || {};

(function () {
  'use strict';

  var HAS_GSAP = typeof window.gsap !== 'undefined';
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var INSTANT = !HAS_GSAP || REDUCED;

  function rand(min, max) { return min + Math.random() * (max - min); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function setFinal(targets, props) {
    var list = targets instanceof Element ? [targets] : Array.from(targets);
    list.forEach(function (el) {
      if (!el || !el.style) return;
      if ('opacity' in props) el.style.opacity = props.opacity;
      if (props.clearTransform) el.style.transform = 'none';
      if ('scaleX' in props) el.style.transform = 'scaleX(' + props.scaleX + ')';
    });
  }

  var M = {
    instant: INSTANT,
    fine: FINE,

    init: function () {
      if (!HAS_GSAP) return;
      gsap.defaults({ ease: 'expo.out', duration: 0.7, overwrite: 'auto' });
      if (!INSTANT) {
        document.querySelectorAll('.glow').forEach(function (g, i) {
          gsap.to(g, { x: 'random(-90, 90)', y: 'random(-70, 70)', duration: 22 + i * 6,
            ease: 'sine.inOut', repeat: -1, yoyo: true, repeatRefresh: true });
        });
        if (FINE) this._cursor();
        var self = this;
        document.querySelectorAll('[data-magnetic]').forEach(function (b) { self._magnetic(b); });
        this._press();
      }
      document.addEventListener('visibilitychange', function () {
        gsap.globalTimeline.paused(document.hidden);
      });
    },

    delay: function (sec, fn) {
      if (INSTANT) { fn(); return null; }
      return gsap.delayedCall(sec, fn);
    },

    killTree: function (root) {
      if (HAS_GSAP) gsap.killTweensOf([root].concat(Array.from(root.querySelectorAll('*'))));
      root.innerHTML = '';
    },

    intro: function (parts) {
      if (INSTANT) return;
      gsap.set(parts.kicker, { opacity: 0, y: 8 });
      gsap.set(parts.lines, { yPercent: 110 });
      gsap.set(parts.rest, { opacity: 0, y: 16 });
      gsap.timeline()
        .to(parts.kicker, { opacity: 1, y: 0, duration: 0.6 })
        .to(parts.lines, { yPercent: 0, duration: 1, stagger: 0.09 }, '-=0.35')
        .to(parts.rest, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08 }, '-=0.65');
    },

    out: function (targets, done) {
      var list = Array.from(targets).filter(Boolean);
      if (INSTANT || !list.length) { setFinal(list, { opacity: 0 }); if (done) done(); return; }
      gsap.to(list, { opacity: 0, y: -14, duration: 0.26, stagger: 0.03,
        ease: 'power2.in', onComplete: function () { if (done) done(); } });
    },

    in: function (targets, done) {
      var list = Array.from(targets).filter(Boolean);
      if (INSTANT || !list.length) { setFinal(list, { opacity: 1, clearTransform: true }); if (done) done(); return; }
      gsap.fromTo(list, { opacity: 0, y: 26 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.06, onComplete: function () { if (done) done(); } });
    },

    viewSwap: function (from, to, opts) {
      opts = opts || {};
      var self = this;
      var finish = function () {
        var heading = to.querySelector('[tabindex="-1"]');
        if (heading) heading.focus({ preventScroll: true });
        if (opts.done) opts.done();
      };
      this.out(from.querySelectorAll('[data-animate]'), function () {
        from.classList.remove('is-active');
        from.setAttribute('aria-hidden', 'true');
        to.classList.add('is-active');
        to.removeAttribute('aria-hidden');
        if (opts.mutate) opts.mutate();
        if (opts.onShown) opts.onShown(finish);
        else self.in(to.querySelectorAll('[data-animate]'), finish);
      });
    },

    /* Entrance on .emoji (outer); idle floats start AFTER it, on .emoji-inner. */
    enterQuestion: function (p, done) {
      if (INSTANT) {
        setFinal([p.ghost].concat(p.outers, p.options), { opacity: 1, clearTransform: true });
        if (done) done();
        return;
      }
      gsap.timeline({
        onComplete: function () {
          p.inners.forEach(function (inner) {
            gsap.to(inner, { y: rand(-4, 4), rotation: rand(-2, 2), duration: rand(2.2, 3.2),
              delay: rand(0, 0.6), repeat: -1, yoyo: true, ease: 'sine.inOut' });
          });
          if (done) done();
        }
      })
        .fromTo(p.ghost, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.8 }, 0)
        .fromTo(p.outers, { opacity: 0, scale: 0.6, y: 18 },
          { opacity: 1, scale: 1, y: 0, duration: 0.75, stagger: 0.08, ease: 'back.out(1.6)' }, 0.05)
        .fromTo(p.options, { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.05 }, 0.25);
    },

    react: function (outers, ok) {
      if (INSTANT) return;
      if (ok) gsap.to(outers, { y: -10, duration: 0.18, stagger: 0.06, yoyo: true, repeat: 1, ease: 'power2.out' });
      else gsap.to(outers, { y: 3, scale: 0.98, duration: 0.22, yoyo: true, repeat: 1, ease: 'power2.inOut' });
    },

    shake: function (btn) {
      if (INSTANT) return;
      gsap.to(btn, { keyframes: [{ x: -7 }, { x: 5 }, { x: -3 }, { x: 1 }, { x: 0 }], duration: 0.45, ease: 'power1.inOut' });
    },

    dim: function (btns) {
      if (INSTANT) { setFinal(btns, { opacity: 0.45 }); return; }
      gsap.to(btns, { opacity: 0.45, duration: 0.3 });
    },

    drawCheck: function (path) {
      if (INSTANT) { path.style.strokeDashoffset = 0; return; }
      gsap.to(path, { strokeDashoffset: 0, duration: 0.4, ease: 'power2.out', delay: 0.05 });
    },

    roll: function (el, to, opts) {
      opts = opts || {};
      var duration = opts.duration || 0.5;
      var pad = opts.pad || 0;
      var write = function (v) { el.textContent = pad ? String(v).padStart(pad, '0') : String(v); };
      if (INSTANT) { write(to); return; }
      if (el.__roll) el.__roll.kill();
      var proxy = { v: parseInt(el.textContent, 10) || 0 };
      el.__roll = gsap.to(proxy, { v: to, duration: duration, ease: 'power3.out', snap: { v: 1 },
        onUpdate: function () { write(Math.round(proxy.v)); } });
    },

    pop: function (el) {
      if (INSTANT) return;
      gsap.fromTo(el, { scale: 1 }, { scale: 1.18, duration: 0.14, yoyo: true, repeat: 1, ease: 'power2.out' });
    },

    tap: function (btn) {
      if (INSTANT) return;
      gsap.fromTo(btn, { scale: 0.97 }, { scale: 1, duration: 0.3 });
    },

    progress: function (bar, v) {
      if (INSTANT) { bar.style.transform = 'scaleX(' + v + ')'; return; }
      gsap.killTweensOf(bar);
      gsap.to(bar, { scaleX: v, duration: 0.6, ease: 'power3.inOut' });
    },

    chip: function (parent, x, y, text) {
      if (INSTANT) return;
      var el = document.createElement('span');
      el.className = 'chip';
      el.textContent = text;
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      parent.appendChild(el);
      gsap.fromTo(el, { opacity: 1, y: 0 },
        { opacity: 0, y: -26, duration: 0.9, ease: 'power2.out', onComplete: function () { el.remove(); } });
    },

    showNext: function (btn, done) {
      btn.style.pointerEvents = 'auto';
      if (INSTANT) { setFinal(btn, { opacity: 1, clearTransform: true }); if (done) done(); return; }
      gsap.killTweensOf(btn);
      gsap.fromTo(btn, { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.4, onComplete: function () { if (done) done(); } });
    },

    hideNext: function (btn, quick) {
      btn.style.pointerEvents = 'none';
      if (INSTANT) { setFinal(btn, { opacity: 0 }); return; }
      gsap.killTweensOf(btn);
      if (quick) gsap.to(btn, { opacity: 0, y: 8, duration: 0.15, ease: 'power2.in' });
      else gsap.set(btn, { opacity: 0, y: 12 });
    },

    reveal: function (container) {
      var rule = container.querySelector('.reveal-rule');
      var head = container.querySelector('.reveal-head');
      var fact = container.querySelector('.reveal-fact');
      if (INSTANT) {
        rule.style.transform = 'scaleX(1)';
        setFinal([head, fact], { opacity: 1, clearTransform: true });
        return;
      }
      gsap.set([head, fact], { opacity: 0 });
      gsap.timeline()
        .fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.5 }, 0)
        .fromTo(head, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.55 }, 0.12)
        .fromTo(fact, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5 }, 0.24);
    },

    /* Odometer: strips hold 0-9 twice; index 10+d = one full spin before landing. */
    odometer: function (container, score, done) {
      container.setAttribute('aria-label', 'Final score: ' + score + ' out of 100');
      if (INSTANT) { container.textContent = score; if (done) done(); return; }
      container.innerHTML = '';
      var strips = String(score).split('').map(function (d) {
        var col = document.createElement('span');
        col.className = 'odo-col';
        col.setAttribute('aria-hidden', 'true');
        var strip = document.createElement('span');
        strip.className = 'odo-strip';
        for (var i = 0; i < 20; i++) {
          var cell = document.createElement('span');
          cell.textContent = i % 10;
          strip.appendChild(cell);
        }
        col.appendChild(strip);
        container.appendChild(col);
        return { strip: strip, digit: Number(d) };
      });
      gsap.to(strips.map(function (s) { return s.strip; }), {
        yPercent: function (i) { return -(10 + strips[i].digit) * 5; },
        duration: 1.2, stagger: 0.1, delay: 0.15,
        onComplete: function () { if (done) done(); }
      });
    },

    confetti: function () {
      if (INSTANT) return;
      var layer = document.createElement('div');
      layer.className = 'confetti-layer';
      layer.setAttribute('aria-hidden', 'true');
      document.body.appendChild(layer);
      var colors = ['#4D7CFE', '#3DDC97', '#F4F2ED'];
      var W = window.innerWidth, H = window.innerHeight;
      for (var i = 0; i < 40; i++) {
        var p = document.createElement('span');
        p.className = 'confetti';
        p.style.width = rand(5, 10) + 'px';
        p.style.height = rand(3, 6) + 'px';
        p.style.background = colors[i % colors.length];
        layer.appendChild(p);
        var dur = rand(1.5, 2.3), delay = rand(0, 0.35), rot0 = rand(0, 180);
        gsap.set(p, { x: rand(0, W), y: -30, rotation: rot0 });
        gsap.to(p, { y: H + 60, rotation: rot0 + rand(-260, 260), duration: dur, delay: delay, ease: 'power1.in' });
        gsap.to(p, { x: '+=' + rand(-60, 60), duration: 0.5, delay: delay, yoyo: true, repeat: 3, ease: 'sine.inOut' });
        gsap.to(p, { opacity: 0, duration: 0.3, delay: delay + dur - 0.3 });
      }
      gsap.delayedCall(2.8, function () { layer.remove(); });
    },

    toast: function (el, msg) {
      el.textContent = msg;
      if (el.__ttl && el.__ttl.kill) el.__ttl.kill();
      if (INSTANT) {
        el.style.opacity = 1;
        var t = setTimeout(function () { el.style.opacity = 0; }, 1800);
        el.__ttl = { kill: function () { clearTimeout(t); } };
        return;
      }
      gsap.killTweensOf(el);
      gsap.fromTo(el, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35 });
      el.__ttl = gsap.delayedCall(1.8, function () {
        gsap.to(el, { opacity: 0, y: 8, duration: 0.3, ease: 'power2.in' });
      });
    },

    lift: function (btn, on) {
      if (INSTANT || btn.disabled) return;
      gsap.to(btn, { y: on ? -2 : 0, duration: 0.18 });
    },

    _magnetic: function (btn) {
      var xTo = gsap.quickTo(btn, 'x', { duration: 0.35, ease: 'power3.out' });
      var yTo = gsap.quickTo(btn, 'y', { duration: 0.35, ease: 'power3.out' });
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        xTo(clamp((e.clientX - r.left - r.width / 2) * 0.25, -7, 7));
        yTo(clamp((e.clientY - r.top - r.height / 2) * 0.25, -7, 7));
      });
      btn.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
    },

    _press: function () {
      var pressed = null;
      document.addEventListener('pointerdown', function (e) {
        var btn = e.target.closest ? e.target.closest('.btn, .option-btn') : null;
        if (!btn || btn.disabled) return;
        pressed = btn;
        gsap.to(btn, { scale: 0.97, duration: 0.12, ease: 'power2.out' });
      });
      var release = function () {
        if (!pressed) return;
        gsap.to(pressed, { scale: 1, duration: 0.25 });
        pressed = null;
      };
      document.addEventListener('pointerup', release);
      document.addEventListener('pointercancel', release);
    },

    _cursor: function () {
      var ring = document.getElementById('cursor');
      var xTo = gsap.quickTo(ring, 'x', { duration: 0.4, ease: 'expo.out' });
      var yTo = gsap.quickTo(ring, 'y', { duration: 0.4, ease: 'expo.out' });
      var shown = false;
      window.addEventListener('pointermove', function (e) {
        if (!shown) { shown = true; gsap.to(ring, { opacity: 1, duration: 0.3 }); }
        xTo(e.clientX); yTo(e.clientY);
      });
      document.addEventListener('pointerover', function (e) {
        var hot = e.target.closest ? e.target.closest('button, a, [data-magnetic]') : null;
        gsap.to(ring, { scale: hot ? 1.6 : 1, duration: 0.3 });
      });
      document.documentElement.addEventListener('pointerleave', function () {
        shown = false;
        gsap.to(ring, { opacity: 0, duration: 0.2 });
      });
    }
  };

  EF.motion = M;
})();