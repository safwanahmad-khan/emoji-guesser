/* EMOJI FOUNDERS — game engine.
   view = start | game | end ; phase = idle | entering | awaiting | answered | exiting
   busy guards view swaps; phase guards question flow. All input paths share
   the same guards. Pending delayed calls are tracked and killed on navigation
   so a stale reveal can never land on a fresh question. */
(function () {
  'use strict';

  var M = EF.motion;
  var QUESTIONS = EF.QUESTIONS;
  var PTS = EF.POINTS_PER_QUESTION;
  var MAX = QUESTIONS.length * PTS;

  function $(id) { return document.getElementById(id); }
  var dom = {
    views: { start: $('view-start'), game: $('view-game'), end: $('view-end') },
    start: { btn: $('btn-start') },
    game: {
      current: $('hud-current'), total: $('hud-total'), score: $('hud-score'),
      progress: $('progress-fill'), ghost: $('ghost'),
      emojis: $('emoji-row'), options: $('options'),
      reveal: $('reveal'), next: $('btn-next')
    },
    end: { odometer: $('odometer'), meta: $('end-meta'), verdict: $('verdict'),
      restart: $('btn-restart'), share: $('btn-share') },
    toast: $('toast'), stage: $('stage')
  };

  var state = {
    view: 'start', phase: 'idle', busy: false,
    order: [], index: 0, score: 0, correct: 0, streak: 0, bestStreak: 0,
    timers: []
  };

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function pad2(n) { return String(n).padStart(2, '0'); }
  function currentQ() { return state.order[state.index]; }
  function isLast() { return state.index === state.order.length - 1; }

  function later(sec, fn) {
    var call = M.delay(sec, fn);
    if (call) state.timers.push(call);
  }
  function clearTimers() {
    state.timers.forEach(function (t) { if (t && t.kill) t.kill(); });
    state.timers = [];
  }

  function buzz(pattern) {
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* unsupported */ }
  }

  function buildQuestion() {
    var q = currentQ();
    var g = dom.game;

    M.killTree(g.emojis);
    M.killTree(g.options);
    M.killTree(g.reveal);

    g.ghost.textContent = pad2(state.index + 1);
    M.roll(g.current, state.index + 1, { pad: 2 });

    var outers = [], inners = [];
    q.emojis.forEach(function (emoji) {
      var outer = document.createElement('span');
      outer.className = 'emoji';
      var inner = document.createElement('span');
      inner.className = 'emoji-inner';
      inner.textContent = emoji;
      outer.appendChild(inner);
      g.emojis.appendChild(outer);
      outers.push(outer); inners.push(inner);
    });

    var options = shuffle(q.options).map(function (opt, i) {
      var btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.dataset.value = opt;
      btn.innerHTML =
        '<span class="option-label"></span>' +
        '<span class="option-tail"><span class="keycap">' + (i + 1) + '</span></span>';
      btn.querySelector('.option-label').textContent = opt;
      btn.addEventListener('click', function () { answer(btn); });
      btn.addEventListener('pointerenter', function () { M.lift(btn, true); });
      btn.addEventListener('pointerleave', function () { M.lift(btn, false); });
      g.options.appendChild(btn);
      return btn;
    });

    g.next.innerHTML = (isLast() ? 'See results' : 'Next') +
      ' <span class="arrow" aria-hidden="true">&#8594;</span>';
    M.hideNext(g.next, false);

    return { outers: outers, inners: inners, options: options };
  }

  function enterQuestion(parts, done) {
    state.phase = 'entering';
    M.enterQuestion(
      { ghost: dom.game.ghost, outers: parts.outers, inners: parts.inners, options: parts.options },
      function () { state.phase = 'awaiting'; if (done) done(); }
    );
  }

  function start(fromView) {
    if (state.busy) return;
    state.busy = true;
    clearTimers();

    state.order = shuffle(QUESTIONS);
    state.index = 0; state.score = 0; state.correct = 0;
    state.streak = 0; state.bestStreak = 0;

    dom.game.score.textContent = '0';
    dom.game.current.textContent = '01';
    dom.game.total.textContent = pad2(QUESTIONS.length);
    M.progress(dom.game.progress, 0);

    M.viewSwap(fromView, dom.views.game, {
      mutate: function () {
        state.view = 'game';
        var containers = dom.views.game.querySelectorAll('[data-animate]');
        if (!M.instant) gsap.set(containers, { opacity: 1, y: 0 });
        else containers.forEach(function (el) { el.style.opacity = 1; el.style.transform = 'none'; });
        M.killTree(dom.end.odometer);
      },
      onShown: function (finish) {
        var parts = buildQuestion();
        enterQuestion(parts, finish);
      },
      done: function () { state.busy = false; }
    });
  }

  function answer(btn) {
    if (state.phase !== 'awaiting' || state.busy || btn.disabled) return;
    state.phase = 'answered';

    var q = currentQ();
    var ok = btn.dataset.value === q.answer;
    var all = Array.from(dom.game.options.children);
    all.forEach(function (b) { b.disabled = true; M.lift(b, false); });

    function markCorrect(b) {
      b.classList.add('correct');
      b.querySelector('.option-tail').innerHTML =
        '<svg class="check" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 13l4 4L19 7"/></svg>';
      M.drawCheck(b.querySelector('.check path'));
    }

    if (ok) {
      markCorrect(btn);
      state.score += PTS; state.correct += 1;
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      M.roll(dom.game.score, state.score);
      M.pop(dom.game.score);

      var r = btn.getBoundingClientRect();
      var s = dom.stage.getBoundingClientRect();
      M.chip(dom.stage, r.left - s.left + r.width / 2 - 14, r.top - s.top - 8, '+' + PTS);

      M.dim(all.filter(function (b) { return b !== btn; }));
      M.react(Array.from(dom.game.emojis.children), true);
      buzz(12);
    } else {
      btn.classList.add('wrong');
      M.shake(btn);
      state.streak = 0;
      all.forEach(function (b) { if (b.dataset.value === q.answer) markCorrect(b); });
      M.dim(all.filter(function (b) { return b !== btn && b.dataset.value !== q.answer; }));
      M.react(Array.from(dom.game.emojis.children), false);
      buzz([10, 40, 10]);
    }

    M.progress(dom.game.progress, (state.index + 1) / state.order.length);

    later(0.25, function () {
      dom.game.reveal.innerHTML =
        '<span class="sr-only">' + (ok ? 'Correct. ' : 'Not quite. ') + '</span>' +
        '<div class="reveal-rule"></div>' +
        '<div class="reveal-head"><span class="reveal-name"></span><span class="reveal-year"></span></div>' +
        '<p class="reveal-fact"></p>';
      dom.game.reveal.querySelector('.reveal-name').textContent = q.answer;
      dom.game.reveal.querySelector('.reveal-year').textContent = 'EST. ' + q.year;
      dom.game.reveal.querySelector('.reveal-fact').textContent = q.fact;
      M.reveal(dom.game.reveal);
      later(0.2, function () {
        M.showNext(dom.game.next, function () {
          dom.game.next.focus({ preventScroll: true });
        });
      });
    });
  }

  function next() {
    if (state.phase !== 'answered' || state.busy) return;
    clearTimers();
    M.hideNext(dom.game.next, true);
    state.index += 1;

    if (state.index < state.order.length) {
      state.phase = 'exiting';
      var outs = Array.from(dom.game.emojis.children)
        .concat(Array.from(dom.game.options.children))
        .concat(Array.from(dom.game.reveal.children))
        .concat([dom.game.ghost]);
      M.out(outs, function () {
        var parts = buildQuestion();
        enterQuestion(parts);
      });
    } else {
      finish();
    }
  }

  function finish() {
    state.phase = 'exiting';
    state.busy = true;
    clearTimers();

    var verdict =
      state.score <= 30 ? 'Intern energy. Run it back.' :
      state.score <= 60 ? 'Analyst at the fund.' :
      state.score <= 80 ? 'Partner track.' : 'Founder material.';

    M.viewSwap(dom.views.game, dom.views.end, {
      mutate: function () {
        state.view = 'end';
        dom.end.verdict.textContent = verdict;
        dom.end.meta.textContent =
          state.correct + ' of ' + state.order.length + ' correct \u00B7 best streak ' + state.bestStreak;
        M.killTree(dom.game.emojis);
        M.killTree(dom.game.options);
        M.killTree(dom.game.reveal);
      },
      done: function () {
        state.busy = false;
        state.phase = 'idle';
        M.odometer(dom.end.odometer, state.score, function () {
          if (state.score >= 70) M.confetti();
        });
      }
    });
  }

  function share() {
    var base = 'I scored ' + state.score + '/' + MAX +
      ' on Emoji Founders \u2014 E-Cell Plaksha (' + state.correct + '/' + state.order.length + ' correct).';
    var url = location.protocol.indexOf('http') === 0
      ? '\n' + location.origin + location.pathname : '';
    var payload = base + url;

    function copied() { M.toast(dom.toast, 'Copied to clipboard'); }
    function fallbackCopy() {
      var ta = document.createElement('textarea');
      ta.value = payload;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); copied(); }
      catch (e) { M.toast(dom.toast, 'Copy failed'); }
      ta.remove();
    }

    if (navigator.share) {
      navigator.share({ title: 'Emoji Founders', text: payload })
        .catch(function (err) { if (err && err.name !== 'AbortError') fallbackCopy(); });
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(payload).then(copied).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }
  }

  window.addEventListener('keydown', function (e) {
    if (e.repeat) return;
    var tag = e.target.tagName;
    if ((tag === 'BUTTON' || tag === 'A') && (e.key === 'Enter' || e.key === ' ')) return;

    if (state.view === 'start' && e.key === 'Enter') {
      e.preventDefault();
      start(dom.views.start);
    } else if (state.view === 'game') {
      if (['1', '2', '3', '4'].indexOf(e.key) !== -1 && state.phase === 'awaiting') {
        var btn = dom.game.options.children[Number(e.key) - 1];
        if (btn && !btn.disabled) { M.tap(btn); btn.click(); }
      } else if ((e.key === 'Enter' || e.key === 'ArrowRight') && state.phase === 'answered') {
        e.preventDefault();
        next();
      }
    } else if (state.view === 'end' && (e.key === 'Enter' || e.key.toLowerCase() === 'r')) {
      e.preventDefault();
      start(dom.views.end);
    }
  });

  dom.start.btn.addEventListener('click', function () { start(dom.views.start); });
  dom.game.next.addEventListener('click', next);
  dom.end.restart.addEventListener('click', function () { start(dom.views.end); });
  dom.end.share.addEventListener('click', share);

  M.init();
  dom.game.total.textContent = pad2(QUESTIONS.length);
  M.intro({
    kicker: dom.views.start.querySelector('.kicker'),
    lines: dom.views.start.querySelectorAll('.line-inner'),
    rest: dom.views.start.querySelectorAll('.subtitle, .meta, .cta-row')
  });
})();