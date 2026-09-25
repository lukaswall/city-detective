/* City Detective - case engine v2.
   Renders any case object with the shape used by case-thailand.js.
   Screens: hero / city map / location (hotspots) / suspects / case board / accusation.
   Solo progress in localStorage; co-op via CaseSync (live WebRTC or progress links). */
(function () {
  'use strict';

  var app = document.getElementById('app');
  var registry = window.CASE_REGISTRY || [];
  var CASE = registry.length ? registry[0].loader() : null;
  if (!CASE) {
    app.innerHTML = '<div class="sheet"><h2>No cases installed</h2><p>Add a case file and register it in cases.js.</p></div>';
    return;
  }

  var SYNC = window.CaseSync;
  var SAVE_KEY = 'city-detective:v2:' + CASE.id;

  var state = load();
  var conn = null;            // live co-op connection
  var myName = null;
  var partnerName = null;
  var currentScreen = 'start';
  var currentLoc = null;

  /* ---------- persistence ---------- */

  function load() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (raw) return SYNC.normalizeState(JSON.parse(raw));
    } catch (e) {}
    // migrate a v1 save if one exists
    try {
      var old = localStorage.getItem('city-detective:' + CASE.id);
      if (old) {
        var o = JSON.parse(old);
        var s = SYNC.emptyState();
        if (o.visited) for (var k in o.visited) s.visited[k] = true;
        if (o.found) for (var k2 in o.found) if (o.found[k2]) { s.found[k2] = true; if (s.clues.indexOf(k2) < 0) s.clues.push(k2); }
        if (o.answered) for (var k3 in o.answered) s.answered[k3] = true;
        if (o.solved) s.solved = true;
        return s;
      }
    } catch (e) {}
    return SYNC.emptyState();
  }
  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  /* ---------- actions: everything goes through here ---------- */

  function act(a, silent) {
    var changed = SYNC.applyAction(state, a);
    if (changed) {
      save();
      if (conn && conn.open) conn.sendAction(a);
      if (!silent) rerender();
    }
    return changed;
  }

  function onRemoteAction(a) {
    var changed = SYNC.applyAction(state, a);
    if (!changed) return;
    save();
    toast(describeAction(a));
    if (a.k === 'solve') { renderEnding(true); return; }
    if (a.k === 'reset') { renderStart(); return; }
    rerender();
  }

  function describeAction(a) {
    var who = partnerName || 'Your partner';
    if (a.k === 'find') {
      var c = clueInfo(a.id);
      return who + ' filed evidence: ' + (c ? c.title : 'a clue');
    }
    if (a.k === 'visit') {
      var l = locationById(a.id);
      return who + ' went to ' + (l ? l.name : 'a location');
    }
    if (a.k === 'answer') return who + ' got someone talking';
    if (a.k === 'solve') return who + ' closed the case';
    if (a.k === 'reset') return who + ' reopened the case from scratch';
    return who + ' made a move';
  }

  /* ---------- case lookups ---------- */

  function suspectById(id) {
    for (var i = 0; i < CASE.suspects.length; i++) if (CASE.suspects[i].id === id) return CASE.suspects[i];
    return null;
  }
  function locationById(id) {
    for (var i = 0; i < CASE.locations.length; i++) if (CASE.locations[i].id === id) return CASE.locations[i];
    return null;
  }
  // Every piece of evidence: scene searches + testimony, in case order.
  function allEvidence() {
    var out = [];
    CASE.locations.forEach(function (loc) {
      loc.searches.forEach(function (s) {
        out.push({ id: s.id, title: s.title, text: s.text, where: loc.name, kind: 'Scene' });
      });
      if (loc.person) {
        var s2 = suspectById(loc.person.suspectId);
        loc.person.questions.forEach(function (q) {
          if (q.clueId) out.push({ id: q.clueId, title: 'Testimony - ' + (s2 ? s2.name : ''), text: q.a, where: loc.name, kind: 'Testimony' });
        });
      }
    });
    return out;
  }
  var EVIDENCE = allEvidence();
  function clueInfo(id) {
    for (var i = 0; i < EVIDENCE.length; i++) if (EVIDENCE[i].id === id) return EVIDENCE[i];
    return null;
  }
  function totalClues() { return EVIDENCE.length; }
  function allVisited() {
    return CASE.locations.every(function (l) { return state.visited[l.id]; });
  }
  function started() {
    return Object.keys(state.visited).length > 0 || state.clues.length > 0 || state.solved;
  }

  /* ---------- dom helpers ---------- */

  function el(html) {
    var d = document.createElement('div');
    d.innerHTML = html;
    return d.firstElementChild;
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function rerender() {
    if (currentScreen === 'map') renderMap();
    else if (currentScreen === 'location') renderLocation(currentLoc);
    else if (currentScreen === 'suspects') renderSuspects();
    else if (currentScreen === 'board') renderBoard();
    else if (currentScreen === 'start') renderStart();
    // accusation + endings are left alone mid-flow
    updatePresence();
  }

  /* ---------- toasts ---------- */

  var toastWrap = null;
  function toast(text) {
    if (!toastWrap) {
      toastWrap = el('<div class="toasts" aria-live="polite"></div>');
      document.body.appendChild(toastWrap);
    }
    var t = el('<div class="toast"><span class="toast-dot"></span>' + esc(text) + '</div>');
    toastWrap.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () {
      t.classList.remove('show');
      setTimeout(function () { t.remove(); }, 500);
    }, 4200);
  }

  /* ---------- shell ---------- */

  function updatePresence() {
    var p = document.getElementById('presence');
    if (!p) return;
    if (conn && conn.open) {
      p.innerHTML = '<span class="live-dot"></span> 2 detectives live';
      p.classList.add('live');
    } else {
      p.innerHTML = 'Solo case';
      p.classList.remove('live');
    }
  }

  function shell(active) {
    var bar = el(
      '<header class="shell">' +
        '<button class="wordmark" data-nav="start">City <em>Detective</em></button>' +
        '<nav class="shell-nav">' +
          '<button data-nav="map"' + (active === 'map' ? ' class="on"' : '') + '>The city</button>' +
          '<button data-nav="suspects"' + (active === 'suspects' ? ' class="on"' : '') + '>Suspects</button>' +
          '<button data-nav="board"' + (active === 'board' ? ' class="on"' : '') + '>Case board <span class="nav-count">' + state.clues.length + '</span></button>' +
        '</nav>' +
        '<div class="shell-right">' +
          '<button class="presence" id="presence" data-nav="sync">Solo case</button>' +
          '<button class="btn-accuse" data-nav="accuse"' + (allVisited() && !state.solved ? '' : ' disabled') + '>Accuse</button>' +
        '</div>' +
      '</header>'
    );
    bar.querySelectorAll('[data-nav]').forEach(function (b) {
      b.onclick = function () {
        var t = b.getAttribute('data-nav');
        if (t === 'start') renderStart();
        else if (t === 'map') renderMap();
        else if (t === 'suspects') renderSuspects();
        else if (t === 'board') renderBoard();
        else if (t === 'sync') renderSyncModal();
        else if (t === 'accuse' && allVisited() && !state.solved) renderAccuse();
      };
    });
    return bar;
  }

  function mount(active, node) {
    app.innerHTML = '';
    app.appendChild(shell(active));
    var main = el('<main class="page"></main>');
    main.appendChild(node);
    app.appendChild(main);
    updatePresence();
    window.scrollTo(0, 0);
  }

  /* ---------- hero / start ---------- */

  function renderStart() {
    currentScreen = 'start';
    var hasProgress = started() && !state.solved;
    var node = el(
      '<div>' +
        '<section class="hero">' +
          '<div class="hero-art"><img src="' + CASE.cover + '" alt="Bangkok at night, a detective overlooking the river"></div>' +
          '<div class="hero-scrim"></div>' +
          '<div class="hero-inner">' +
            '<div class="hero-stamp">' + esc(CASE.caseNo) + ' &middot; one night, one thief</div>' +
            '<h1 class="hero-title"><span>The</span><span class="t-big">Emerald</span><span class="t-big t-indent">Deva</span></h1>' +
            '<p class="hero-sub">A City Detective case &middot; ' + esc(CASE.city) + '</p>' +
            '<div class="hero-cta">' +
              '<button class="btn-primary" id="startBtn">' + (state.solved ? 'Reopen the case' : hasProgress ? 'Continue the investigation' : 'Begin the investigation') + '</button>' +
              (hasProgress ? '<button class="btn-quiet" id="resetBtn">Start over</button>' : '') +
            '</div>' +
          '</div>' +
          '<div class="hero-scroll" aria-hidden="true"><span></span></div>' +
        '</section>' +
        '<section class="brief wrap">' +
          '<div class="brief-grid">' +
            '<div class="brief-copy">' +
              '<h2 class="sec-title">The brief</h2>' +
              '<p class="lede">' + esc(CASE.intro) + '</p>' +
              '<div class="brief-facts">' +
                fact('Stolen', 'The Emerald Deva, gold and jade') +
                fact('Window', '21:40 - 21:55, exhibition night') +
                fact('Insured', '40 million baht') +
                fact('Suspects', String(CASE.suspects.length) + ' with motive and means') +
              '</div>' +
            '</div>' +
            '<figure class="amulet-fig">' +
              '<div class="amulet-stage" id="amuletStage">' +
                '<img id="amuletImg" src="amulet.png" alt="The Emerald Deva - a gold pendant set with a green stone">' +
              '</div>' +
              '<figcaption>The missing piece. Handled by two people in the days before it vanished.</figcaption>' +
            '</figure>' +
          '</div>' +
        '</section>' +
        '<section class="how wrap">' +
          '<h2 class="sec-title">How a detective works</h2>' +
          '<div class="how-steps">' +
            step('Work the scenes', 'Evidence sits inside the photographs themselves. Sweep each scene, open every gold marker.') +
            step('Question everyone', 'People lie, deflect and confess. The right question at the right counter can be worth more than a fingerprint.') +
            step('Build the board', 'Everything lands on your case board. Related evidence ties itself together - read the strings.') +
            step('Prove it', 'One accusation. Name the thief, answer for the method, and present the two pieces of evidence that convict.') +
          '</div>' +
        '</section>' +
        '<section class="together wrap">' +
          '<div class="together-card">' +
            '<div>' +
              '<h2 class="sec-title">Two detectives, one case</h2>' +
              '<p>Open a live channel and every clue either of you finds lands on both screens - same board, same night. No accounts, no server: the two browsers talk directly. Or send a progress link and merge notebooks whenever you like.</p>' +
            '</div>' +
            '<div class="together-actions">' +
              '<button class="btn-primary" id="syncBtn">Play together</button>' +
              '<button class="btn-quiet" id="shareBtn">Copy progress link</button>' +
            '</div>' +
          '</div>' +
        '</section>' +
        '<footer class="foot wrap">' +
          '<p>City Detective &middot; ' + esc(CASE.country) + ' &middot; all artwork and characters original and fictional</p>' +
        '</footer>' +
      '</div>'
    );
    mount('start', node);

    document.getElementById('startBtn').onclick = function () {
      if (state.solved) { act({ k: 'reset' }); }
      renderMap();
    };
    var rb = document.getElementById('resetBtn');
    if (rb) rb.onclick = function () { act({ k: 'reset' }); renderStart(); };
    document.getElementById('syncBtn').onclick = renderSyncModal;
    document.getElementById('shareBtn').onclick = copyProgressLink;

    initAmulet();
  }

  function fact(k, v) {
    return '<div class="fact"><span class="fact-k">' + esc(k) + '</span><span class="fact-v">' + esc(v) + '</span></div>';
  }
  function step(t, d) {
    return '<div class="how-step"><h3>' + esc(t) + '</h3><p>' + esc(d) + '</p></div>';
  }

  /* ---------- amulet: 3D when possible, image with tilt otherwise ---------- */

  function initAmulet() {
    var stage = document.getElementById('amuletStage');
    if (!stage) return;
    var ok = window.Amulet3D && window.Amulet3D.mount(stage);
    if (!ok) {
      // pointer-tilt fallback on the still image
      var img = document.getElementById('amuletImg');
      if (!img) return;
      stage.classList.add('tiltable');
      stage.addEventListener('pointermove', function (e) {
        var r = stage.getBoundingClientRect();
        var dx = (e.clientX - r.left) / r.width - 0.5;
        var dy = (e.clientY - r.top) / r.height - 0.5;
        img.style.transform = 'rotateY(' + (dx * 16) + 'deg) rotateX(' + (-dy * 12) + 'deg) scale(1.03)';
      });
      stage.addEventListener('pointerleave', function () {
        img.style.transform = 'rotateY(0deg) rotateX(0deg) scale(1)';
      });
    }
  }

  /* ---------- city map ---------- */

  function renderMap() {
    currentScreen = 'map';
    var foundTotal = state.clues.length;
    var node = el(
      '<div class="wrap">' +
        '<div class="page-head">' +
          '<p class="kicker">' + esc(CASE.city) + ' &middot; the night of the theft</p>' +
          '<h2 class="page-title">The city</h2>' +
          '<p class="page-sub">' +
            (allVisited()
              ? 'Every corner covered. When the board tells one story, make the accusation.'
              : 'Six places hold the truth of one night. Visit them all before you accuse.') +
          '</p>' +
          '<div class="progress"><div class="progress-fill" style="width:' + Math.round(100 * foundTotal / totalClues()) + '%"></div></div>' +
          '<p class="progress-label">Evidence filed: ' + foundTotal + ' of ' + totalClues() + '</p>' +
        '</div>' +
        '<div class="map-frame" id="mapFrame"></div>' +
      '</div>'
    );
    mount('map', node);
    buildMap(document.getElementById('mapFrame'));
  }

  function buildMap(frame) {
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 100 78');
    svg.setAttribute('class', 'citymap');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Map of Bangkok riverside with case locations');

    // water: the Chao Phraya, one slow curve across the frame
    var river = document.createElementNS(NS, 'path');
    river.setAttribute('d', 'M -2 40 C 18 34, 30 46, 46 42 C 62 38, 66 26, 84 30 C 94 32, 99 36, 102 36 L 102 52 C 88 50, 76 44, 62 50 C 48 56, 34 50, 20 54 C 8 57, 0 56, -2 55 Z');
    river.setAttribute('class', 'map-river');
    svg.appendChild(river);
    // temple mark on the far bank
    var temple = document.createElementNS(NS, 'path');
    temple.setAttribute('d', 'M 70 36 l 1.4 -3.2 l 1.4 3.2 l -0.5 0 l 0 2 l -1.8 0 l 0 -2 Z');
    temple.setAttribute('class', 'map-temple');
    svg.appendChild(temple);

    // route between locations in story order
    var pts = CASE.locations.map(function (l) { return l.map; });
    for (var i = 0; i < pts.length - 1; i++) {
      var seg = document.createElementNS(NS, 'line');
      seg.setAttribute('x1', pts[i].x); seg.setAttribute('y1', pts[i].y);
      seg.setAttribute('x2', pts[i + 1].x); seg.setAttribute('y2', pts[i + 1].y);
      seg.setAttribute('class', 'map-route');
      svg.appendChild(seg);
    }

    CASE.locations.forEach(function (loc, idx) {
      var foundHere = loc.searches.filter(function (s) { return state.found[s.id]; }).length;
      var allHere = loc.searches.length;
      var g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'map-pin' + (state.visited[loc.id] ? ' seen' : '') + (foundHere === allHere ? ' cleared' : ''));
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', loc.name);

      var halo = document.createElementNS(NS, 'circle');
      halo.setAttribute('cx', loc.map.x); halo.setAttribute('cy', loc.map.y); halo.setAttribute('r', 3.2);
      halo.setAttribute('class', 'pin-halo');
      g.appendChild(halo);

      var dot = document.createElementNS(NS, 'circle');
      dot.setAttribute('cx', loc.map.x); dot.setAttribute('cy', loc.map.y); dot.setAttribute('r', 1.5);
      dot.setAttribute('class', 'pin-dot');
      g.appendChild(dot);

      var label = document.createElementNS(NS, 'text');
      label.setAttribute('x', loc.map.x); label.setAttribute('y', loc.map.y - 3.4);
      label.setAttribute('class', 'pin-label');
      label.textContent = loc.time + '  ' + loc.name;
      g.appendChild(label);

      var sub = document.createElementNS(NS, 'text');
      sub.setAttribute('x', loc.map.x); sub.setAttribute('y', loc.map.y + 4.6);
      sub.setAttribute('class', 'pin-sub');
      sub.textContent = state.visited[loc.id]
        ? (foundHere === allHere ? 'searched clean' : foundHere + '/' + allHere + ' evidence')
        : 'unvisited';
      g.appendChild(sub);

      function go() { renderLocation(loc.id); }
      g.addEventListener('click', go);
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
      svg.appendChild(g);
    });

    frame.appendChild(svg);
  }

  /* ---------- location: scene + hotspots + questioning ---------- */

  function renderLocation(id) {
    var loc = locationById(id);
    if (!loc) return renderMap();
    currentScreen = 'location';
    currentLoc = id;
    act({ k: 'visit', id: id }, true); // silent; we render below anyway

    var left = loc.searches.filter(function (s) { return !state.found[s.id]; }).length;
    var flavorLeft = (loc.flavor || []).filter(function (f) { return !state.flavor[f.id]; }).length;

    var node = el(
      '<div>' +
        '<div class="loc-head wrap">' +
          '<button class="crumb" id="backMap">&larr; The city</button>' +
          '<p class="kicker">' + esc(loc.time) + ' &middot; ' + esc(CASE.city) + '</p>' +
          '<h2 class="page-title">' + esc(loc.name) + '</h2>' +
          '<p class="page-sub">' + esc(loc.description) + '</p>' +
        '</div>' +
        '<div class="scene-wrap">' +
          '<div class="scene" id="scene">' +
            '<img src="' + loc.image + '" alt="' + esc(loc.name) + ' - search the scene for evidence" id="sceneImg">' +
            '<div class="scene-vignette"></div>' +
          '</div>' +
          '<p class="scene-hint">' +
            (left + flavorLeft > 0
              ? 'Sweep the scene - gold markers hold evidence, dim ones hold detail. ' + left + ' evidence left here.'
              : 'This scene is clean. Everything it had is in your notebook.') +
          '</p>' +
        '</div>' +
        '<div class="wrap" id="locBelow"></div>' +
      '</div>'
    );
    mount('map', node);

    var scene = document.getElementById('scene');

    // evidence hotspots
    loc.searches.forEach(function (s, i) {
      var found = !!state.found[s.id];
      var m = el(
        '<button class="hotspot' + (found ? ' found' : '') + '" style="left:' + s.x + '%;top:' + s.y + '%" aria-label="' + (found ? 'Evidence filed: ' : 'Search: ') + esc(s.title) + '">' +
          '<span class="hs-ring"></span><span class="hs-core"></span>' +
          '<span class="hs-tag">' + (found ? 'Filed' : 'Evidence') + '</span>' +
        '</button>'
      );
      m.onclick = function () {
        if (state.found[s.id]) { showEvidence(s, loc, false); return; }
        flash();
        act({ k: 'find', id: s.id }, true);
        showEvidence(s, loc, true);
      };
      scene.appendChild(m);
    });

    // flavor markers
    (loc.flavor || []).forEach(function (f) {
      var seen = !!state.flavor[f.id];
      var m = el(
        '<button class="hotspot minor' + (seen ? ' found' : '') + '" style="left:' + f.x + '%;top:' + f.y + '%" aria-label="Detail: ' + esc(f.title) + '">' +
          '<span class="hs-core"></span>' +
        '</button>'
      );
      m.onclick = function () {
        act({ k: 'flavor', id: f.id }, true);
        showFlavor(f, loc);
      };
      scene.appendChild(m);
    });

    // pointer parallax on the scene
    var img = document.getElementById('sceneImg');
    scene.addEventListener('pointermove', function (e) {
      var r = scene.getBoundingClientRect();
      var dx = (e.clientX - r.left) / r.width - 0.5;
      var dy = (e.clientY - r.top) / r.height - 0.5;
      img.style.transform = 'scale(1.06) translate(' + (-dx * 1.6) + '%,' + (-dy * 1.2) + '%)';
    });
    scene.addEventListener('pointerleave', function () {
      img.style.transform = 'scale(1.03) translate(0,0)';
    });

    document.getElementById('backMap').onclick = renderMap;

    // questioning
    if (loc.person) {
      var s = suspectById(loc.person.suspectId);
      var asked = loc.person.questions.filter(function (q, qi) { return state.answered[id + ':' + qi]; }).length;
      var p = el(
        '<section class="interrogate">' +
          '<div class="int-head">' +
            '<img class="int-face" src="' + s.image + '" alt="Portrait of ' + esc(s.name) + '">' +
            '<div>' +
              '<p class="kicker">Questioning</p>' +
              '<h3 class="int-name">' + esc(s.name) + '</h3>' +
              '<p class="int-role">' + esc(s.role) + '</p>' +
            '</div>' +
          '</div>' +
          '<p class="int-intro">' + esc(loc.person.intro) + '</p>' +
          '<div class="int-thread" id="thread"></div>' +
          '<div class="int-asks" id="asks"></div>' +
        '</section>'
      );
      document.getElementById('locBelow').appendChild(p);

      var thread = p.querySelector('#thread');
      var asks = p.querySelector('#asks');
      loc.person.questions.forEach(function (q, qi) {
        var key = id + ':' + qi;
        if (state.answered[key]) {
          thread.appendChild(el(
            '<div class="exchange">' +
              '<p class="ex-q">' + esc(q.q) + '</p>' +
              '<p class="ex-a">' + esc(q.a) + '</p>' +
              (q.clueId ? '<p class="ex-note">Key testimony &middot; filed to the case board</p>' : '') +
            '</div>'
          ));
        } else {
          var qb = el('<button class="ask">' + esc(q.q) + '</button>');
          qb.onclick = function () {
            act({ k: 'answer', id: key, clueId: q.clueId || null }, true);
            renderLocation(id);
          };
          asks.appendChild(qb);
        }
      });
      if (!asks.children.length) {
        asks.appendChild(el('<p class="int-done">' + esc(s.name) + ' has told you everything there is.</p>'));
      }
    }
  }

  function flash() {
    var f = el('<div class="flash"></div>');
    document.body.appendChild(f);
    requestAnimationFrame(function () { f.classList.add('on'); });
    setTimeout(function () { f.remove(); }, 420);
  }

  function evidenceNumber(id) {
    return state.clues.indexOf(id) + 1;
  }

  function showEvidence(s, loc, isNew) {
    var n = evidenceNumber(s.id);
    var sheet = el(
      '<div class="overlay" role="dialog" aria-modal="true">' +
        '<div class="ev-card">' +
          '<p class="ev-stamp">' + (isNew ? 'Evidence filed' : 'Evidence') + (n > 0 ? ' &middot; no. ' + n : '') + '</p>' +
          '<h3 class="ev-title">' + esc(s.title) + '</h3>' +
          '<p class="ev-where">' + esc(loc.name) + ' &middot; ' + esc(loc.time) + '</p>' +
          '<p class="ev-text">' + esc(s.text) + '</p>' +
          '<div class="ev-actions">' +
            '<button class="btn-primary" id="evOk">' + (isNew ? 'File it' : 'Back to the scene') + '</button>' +
            '<button class="btn-quiet" id="evBoard">Open case board</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
    document.body.appendChild(sheet);
    requestAnimationFrame(function () { sheet.classList.add('on'); });
    sheet.querySelector('#evOk').onclick = function () { sheet.remove(); rerender(); };
    sheet.querySelector('#evBoard').onclick = function () { sheet.remove(); renderBoard(); };
  }

  function showFlavor(f, loc) {
    var sheet = el(
      '<div class="overlay" role="dialog" aria-modal="true">' +
        '<div class="ev-card minor-card">' +
          '<p class="ev-stamp">Detail &middot; ' + esc(loc.name) + '</p>' +
          '<h3 class="ev-title">' + esc(f.title) + '</h3>' +
          '<p class="ev-text">' + esc(f.text) + '</p>' +
          '<div class="ev-actions"><button class="btn-primary" id="evOk">Back to the scene</button></div>' +
        '</div>' +
      '</div>'
    );
    document.body.appendChild(sheet);
    requestAnimationFrame(function () { sheet.classList.add('on'); });
    sheet.querySelector('#evOk').onclick = function () { sheet.remove(); rerender(); };
  }

  /* ---------- suspects ---------- */

  function renderSuspects() {
    currentScreen = 'suspects';
    var node = el(
      '<div class="wrap">' +
        '<div class="page-head">' +
          '<p class="kicker">Four people, one thief</p>' +
          '<h2 class="page-title">The suspects</h2>' +
          '<p class="page-sub">Everyone here had a reason. Two of them had the code. Only one of them has the Deva.</p>' +
        '</div>' +
        '<div class="suspect-row" id="susRow"></div>' +
      '</div>'
    );
    mount('suspects', node);
    var row = document.getElementById('susRow');
    CASE.suspects.forEach(function (s) {
      var card = el(
        '<article class="suspect" tabindex="0">' +
          '<div class="suspect-imgwrap"><img src="' + s.image + '" alt="Portrait of ' + esc(s.name) + '"></div>' +
          '<div class="suspect-body">' +
            '<h3>' + esc(s.name) + '</h3>' +
            '<p class="suspect-role">' + esc(s.role) + '</p>' +
            '<p class="suspect-bio">' + esc(s.bio) + '</p>' +
          '</div>' +
        '</article>'
      );
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var dx = (e.clientX - r.left) / r.width - 0.5;
        var dy = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'perspective(900px) rotateY(' + (dx * 7) + 'deg) rotateX(' + (-dy * 5) + 'deg) translateY(-4px)';
      });
      card.addEventListener('pointerleave', function () { card.style.transform = ''; });
      row.appendChild(card);
    });
  }

  /* ---------- case board (notebook) ---------- */

  function renderBoard() {
    currentScreen = 'board';
    var node = el(
      '<div class="wrap">' +
        '<div class="page-head">' +
          '<p class="kicker">Evidence and testimony</p>' +
          '<h2 class="page-title">The case board</h2>' +
          '<p class="page-sub">' +
            (state.clues.length
              ? state.clues.length + ' of ' + totalClues() + ' pieces filed. Strings tie evidence that proves each other - the truth sits where they knot.'
              : 'Empty. Go walk the city.') +
          '</p>' +
        '</div>' +
        '<div class="board" id="board"></div>' +
      '</div>'
    );
    mount('board', node);
    var board = document.getElementById('board');

    var found = state.clues.map(clueInfo).filter(Boolean);
    if (found.length) {
      var inner = el('<div class="board-inner" id="boardInner"></div>');
      board.appendChild(inner);
      found.forEach(function (c, i) {
        var rot = ((i * 37) % 7) - 3; // deterministic slight tilt, not random
        var card = el(
          '<article class="pin-card" data-id="' + esc(c.id) + '" style="--rot:' + rot + 'deg">' +
            '<span class="pin" aria-hidden="true"></span>' +
            '<p class="pc-kind">' + esc(c.kind) + ' &middot; ' + esc(c.where) + '</p>' +
            '<h3 class="pc-title">' + esc(c.title) + '</h3>' +
            '<p class="pc-text">' + esc(c.text) + '</p>' +
          '</article>'
        );
        inner.appendChild(card);
      });
      // strings between related, both-found clues
      requestAnimationFrame(function () { drawStrings(board, inner); });
    }

    // what is still out there
    var missing = EVIDENCE.filter(function (c) { return !state.found[c.id]; });
    if (missing.length) {
      var ml = el(
        '<div class="missing">' +
          '<h3>Still out there</h3>' +
          '<p>' + missing.length + ' piece' + (missing.length === 1 ? '' : 's') + ' of evidence unfound. The scenes keep their secrets until you look.</p>' +
        '</div>'
      );
      board.appendChild(ml);
    }
  }

  function drawStrings(board, inner) {
    var old = board.querySelector('svg.strings');
    if (old) old.remove();
    var ids = {};
    inner.querySelectorAll('.pin-card').forEach(function (c) {
      var r = c.getBoundingClientRect();
      var br = inner.getBoundingClientRect();
      ids[c.getAttribute('data-id')] = {
        x: r.left - br.left + r.width / 2,
        y: r.top - br.top + 8
      };
    });
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'strings');
    var br = inner.getBoundingClientRect();
    svg.setAttribute('width', br.width);
    svg.setAttribute('height', br.height);
    svg.setAttribute('viewBox', '0 0 ' + br.width + ' ' + br.height);
    CASE.links.forEach(function (pair) {
      var a = ids[pair[0]], b = ids[pair[1]];
      if (!a || !b) return;
      var midX = (a.x + b.x) / 2, midY = (a.y + b.y) / 2 + 18;
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('d', 'M ' + a.x + ' ' + a.y + ' Q ' + midX + ' ' + midY + ' ' + b.x + ' ' + b.y);
      svg.appendChild(p);
    });
    inner.appendChild(svg);
  }

  /* ---------- accusation ---------- */

  var picked = null;
  var dedIndex = 0;
  var strikes = 0;
  var evidencePicks = {};

  function renderAccuse() {
    if (state.solved) return renderEnding(true, true);
    picked = null; dedIndex = 0; strikes = 0; evidencePicks = {};
    currentScreen = 'accuse';
    var node = el(
      '<div class="wrap">' +
        '<div class="page-head center">' +
          '<p class="kicker">One shot</p>' +
          '<h2 class="page-title">Name the thief</h2>' +
          '<p class="page-sub">Choose the person your evidence actually convicts. Then answer for how it was done - and present the proof.</p>' +
        '</div>' +
        '<div class="lineup" id="lineup"></div>' +
        '<div class="center-row"><button class="btn-primary" id="confirmAccuse" disabled>Make the accusation</button></div>' +
      '</div>'
    );
    mount('accuse', node);
    var lineup = document.getElementById('lineup');
    CASE.suspects.forEach(function (s) {
      var card = el(
        '<button class="lineup-card">' +
          '<img src="' + s.image + '" alt="' + esc(s.name) + '">' +
          '<span class="lineup-name">' + esc(s.name) + '</span>' +
          '<span class="lineup-role">' + esc(s.role) + '</span>' +
        '</button>'
      );
      card.onclick = function () {
        picked = s.id;
        lineup.querySelectorAll('.lineup-card').forEach(function (c) { c.classList.remove('picked'); });
        card.classList.add('picked');
        document.getElementById('confirmAccuse').disabled = false;
      };
      lineup.appendChild(card);
    });
    document.getElementById('confirmAccuse').onclick = function () {
      if (picked === CASE.culprit) renderDeduction();
      else renderEnding(false);
    };
  }

  function renderDeduction() {
    currentScreen = 'accuse';
    var d = CASE.deduction[dedIndex];
    var node = el(
      '<div class="wrap narrow">' +
        '<div class="page-head center">' +
          '<p class="kicker">Answer for it &middot; ' + (dedIndex + 1) + ' of ' + CASE.deduction.length + '</p>' +
          '<h2 class="page-title sm">' + esc(d.question) + '</h2>' +
          '<p class="page-sub">Three mistakes and the case falls apart.</p>' +
        '</div>' +
        '<div class="answers" id="answers"></div>' +
        '<div class="strike-row" id="strikes">' + strikeRow() + '</div>' +
        '<div id="dedNext" class="center-row"></div>' +
      '</div>'
    );
    mount('accuse', node);
    var list = document.getElementById('answers');
    d.options.forEach(function (opt, oi) {
      var b = el('<button class="answer">' + esc(opt) + '</button>');
      b.onclick = function () {
        if (oi === d.correct) {
          b.classList.add('right');
          list.querySelectorAll('button').forEach(function (x) { x.disabled = true; });
          var next = el('<p class="explain">' + esc(d.explain) + '</p>');
          document.getElementById('dedNext').appendChild(next);
          dedIndex++;
          var nb = el('<button class="btn-primary">' + (dedIndex < CASE.deduction.length ? 'Next question' : 'Present the evidence') + '</button>');
          document.getElementById('dedNext').appendChild(nb);
          nb.onclick = function () {
            if (dedIndex < CASE.deduction.length) renderDeduction();
            else renderEvidence();
          };
        } else {
          b.classList.add('wrong');
          b.disabled = true;
          strikes++;
          document.getElementById('strikes').innerHTML = strikeRow();
          if (strikes >= 3) renderEnding(false);
        }
      };
      list.appendChild(b);
    });
  }

  function strikeRow() {
    var out = '';
    for (var i = 0; i < 3; i++) out += '<span class="strike' + (i < strikes ? ' spent' : '') + '"></span>';
    return '<span class="strike-label">Credibility</span>' + out;
  }

  function renderEvidence() {
    currentScreen = 'accuse';
    evidencePicks = {};
    var found = state.clues.map(clueInfo).filter(Boolean);
    var node = el(
      '<div class="wrap">' +
        '<div class="page-head center">' +
          '<p class="kicker">The proof</p>' +
          '<h2 class="page-title sm">Present the two pieces that convict</h2>' +
          '<p class="page-sub">From everything on your board, pick the evidence a jury could not argue with. Both, or it does not hold.</p>' +
        '</div>' +
        '<div class="ev-pick-grid" id="evGrid"></div>' +
        '<div class="strike-row" id="strikes">' + strikeRow() + '</div>' +
        '<p class="hint-line" id="evHint"></p>' +
        '<div class="center-row"><button class="btn-primary" id="evSubmit" disabled>Present the evidence</button></div>' +
      '</div>'
    );
    mount('accuse', node);
    var grid = document.getElementById('evGrid');
    if (!found.length) {
      grid.appendChild(el('<p class="page-sub">Your notebook is empty. Nothing to present.</p>'));
    }
    found.forEach(function (c) {
      var b = el(
        '<button class="ev-pick" data-id="' + esc(c.id) + '">' +
          '<span class="pc-kind">' + esc(c.kind) + ' &middot; ' + esc(c.where) + '</span>' +
          '<span class="pc-title">' + esc(c.title) + '</span>' +
        '</button>'
      );
      b.onclick = function () {
        var cid = b.getAttribute('data-id');
        if (evidencePicks[cid]) { delete evidencePicks[cid]; b.classList.remove('picked'); }
        else if (Object.keys(evidencePicks).length < 2) { evidencePicks[cid] = true; b.classList.add('picked'); }
        document.getElementById('evSubmit').disabled = Object.keys(evidencePicks).length !== 2;
      };
      grid.appendChild(b);
    });
    document.getElementById('evSubmit').onclick = function () {
      var need = CASE.evidenceAnswer;
      var have = Object.keys(evidencePicks);
      var good = have.length === 2 && need.every(function (n) { return have.indexOf(n) >= 0; });
      if (good) {
        act({ k: 'solve' }, true);
        renderEnding(true);
      } else {
        strikes++;
        document.getElementById('strikes').innerHTML = strikeRow();
        if (strikes >= 3) { renderEnding(false); return; }
        document.getElementById('evHint').textContent = CASE.evidenceHint;
        document.getElementById('evSubmit').disabled = true;
        evidencePicks = {};
        grid.querySelectorAll('.ev-pick').forEach(function (x) { x.classList.remove('picked'); });
      }
    };
  }

  function renderEnding(win, replay) {
    currentScreen = 'ending';
    var foundTotal = state.clues.length;
    var node = el(
      '<div class="wrap narrow">' +
        '<div class="ending ' + (win ? 'won' : 'lost') + '">' +
          '<p class="kicker">' + (win ? 'Case file 01 &middot; closed' : 'The accusation fails') + '</p>' +
          '<h2 class="page-title">' + (win ? 'Case closed' : 'Wrong call') + '</h2>' +
          '<p class="ending-text">' + esc(win ? CASE.winText : CASE.loseText) + '</p>' +
          (win ? '<p class="ending-stats">Evidence filed: ' + foundTotal + ' of ' + totalClues() + (conn && conn.open ? ' &middot; solved together' : '') + '</p>' : '') +
          '<div class="center-row">' +
            (win
              ? '<button class="btn-primary" id="againBtn">Reopen the case</button><button class="btn-quiet" id="mapBtn">Walk the city</button>'
              : '<button class="btn-primary" id="mapBtn">Back to the city</button>') +
          '</div>' +
        '</div>' +
      '</div>'
    );
    mount('ending', node);
    var again = document.getElementById('againBtn');
    if (again) again.onclick = function () { act({ k: 'reset' }); renderStart(); };
    document.getElementById('mapBtn').onclick = renderMap;
  }

  /* ---------- co-op: sync modal, links, wiring ---------- */

  function copyProgressLink() {
    var url = location.origin + location.pathname + '#s=' + SYNC.encodeState(state);
    copyText(url, 'Progress link copied - send it to your partner');
  }

  function copyText(text, doneMsg) {
    function ok() { toast(doneMsg); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(ok, function () { legacy(); });
    } else legacy();
    function legacy() {
      var ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); ok(); } catch (e) { toast('Copy failed - select the code manually'); }
      ta.remove();
    }
  }

  function renderSyncModal() {
    var old = document.querySelector('.overlay.sync-modal');
    if (old) old.remove();
    var connected = conn && conn.open;
    var m = el(
      '<div class="overlay sync-modal" role="dialog" aria-modal="true">' +
        '<div class="ev-card sync-card">' +
          '<p class="ev-stamp">Play together</p>' +
          '<h3 class="ev-title">Two detectives, one case</h3>' +
          (connected
            ? '<p class="ev-text">Live with ' + esc(partnerName || 'your partner') + '. Every find lands on both screens.</p>' +
              '<div class="ev-actions"><button class="btn-quiet" id="syncClose">Close</button><button class="btn-quiet danger" id="syncDrop">Disconnect</button></div>'
            : '<p class="ev-text">Open a direct channel between two browsers - no server, no account. One of you hosts, the other joins; trade the codes over any chat app.</p>' +
              '<div class="sync-grid">' +
                '<div class="sync-col"><h4>Host the night</h4>' +
                  '<input class="sync-name" id="hostName" maxlength="24" placeholder="Your detective name">' +
                  '<button class="btn-primary" id="hostBtn">Create invite code</button>' +
                  '<textarea class="sync-code" id="hostCode" readonly placeholder="Your invite code appears here - send it over"></textarea>' +
                  '<textarea class="sync-code" id="answerIn" placeholder="Paste your partner&#39;s answer code here"></textarea>' +
                  '<button class="btn-quiet" id="acceptBtn">Connect</button>' +
                '</div>' +
                '<div class="sync-col"><h4>Join a night</h4>' +
                  '<input class="sync-name" id="guestName" maxlength="24" placeholder="Your detective name">' +
                  '<textarea class="sync-code" id="inviteIn" placeholder="Paste the invite code here"></textarea>' +
                  '<button class="btn-primary" id="joinBtn">Join and get answer code</button>' +
                  '<textarea class="sync-code" id="answerOut" readonly placeholder="Your answer code appears here - send it back"></textarea>' +
                '</div>' +
              '</div>' +
              '<p class="sync-note">Or skip the ceremony: <button class="linklike" id="linkBtn">copy a progress link</button> and your partner merges your notebook on open.</p>' +
              '<div class="ev-actions"><button class="btn-quiet" id="syncClose">Close</button></div>') +
        '</div>' +
      '</div>'
    );
    document.body.appendChild(m);
    requestAnimationFrame(function () { m.classList.add('on'); });
    m.querySelector('#syncClose').onclick = function () { m.remove(); };
    var drop = m.querySelector('#syncDrop');
    if (drop) drop.onclick = function () { if (conn) conn.close(); conn = null; partnerName = null; m.remove(); updatePresence(); toast('Channel closed - solo again'); };
    if (connected) return;

    if (!SYNC.available) {
      m.querySelector('.sync-grid').innerHTML = '<p class="ev-text">This browser does not support direct connections. Use a progress link instead.</p>';
    }

    var linkBtn = m.querySelector('#linkBtn');
    if (linkBtn) linkBtn.onclick = copyProgressLink;

    var hostBtn = m.querySelector('#hostBtn');
    if (hostBtn) hostBtn.onclick = function () {
      if (conn) conn.close();
      conn = new SYNC.Connection(connHooks());
      myName = (m.querySelector('#hostName').value || 'Detective 1').trim();
      hostBtn.disabled = true;
      hostBtn.textContent = 'Working...';
      conn.host().then(function (code) {
        m.querySelector('#hostCode').value = code;
        copyText(code, 'Invite code copied - send it to your partner');
        hostBtn.textContent = 'Invite code ready';
      }).catch(function () {
        hostBtn.disabled = false;
        hostBtn.textContent = 'Create invite code';
        toast('Could not open a channel in this browser');
      });
    };
    var acceptBtn = m.querySelector('#acceptBtn');
    if (acceptBtn) acceptBtn.onclick = function () {
      var code = m.querySelector('#answerIn').value.trim();
      if (!code || !conn) { toast('Create an invite first, then paste the answer code'); return; }
      conn.acceptAnswer(code).catch(function () { toast('That answer code did not take - check it and try again'); });
    };
    var joinBtn = m.querySelector('#joinBtn');
    if (joinBtn) joinBtn.onclick = function () {
      var code = m.querySelector('#inviteIn').value.trim();
      if (!code) { toast('Paste the invite code first'); return; }
      if (conn) conn.close();
      conn = new SYNC.Connection(connHooks());
      myName = (m.querySelector('#guestName').value || 'Detective 2').trim();
      joinBtn.disabled = true;
      joinBtn.textContent = 'Working...';
      conn.join(code).then(function (answer) {
        m.querySelector('#answerOut').value = answer;
        copyText(answer, 'Answer code copied - send it back');
        joinBtn.textContent = 'Answer code ready';
      }).catch(function () {
        joinBtn.disabled = false;
        joinBtn.textContent = 'Join and get answer code';
        toast('That invite code did not take - check it and try again');
      });
    };
  }

  function connHooks() {
    return {
      onOpen: function () {
        conn.sayHello(myName || 'Partner');
        // swap full states both ways, then merge
        conn.sendFullState(state);
        conn.requestState();
        updatePresence();
        toast('Channel open - you are on the case together');
        var m = document.querySelector('.overlay.sync-modal');
        if (m) m.remove();
      },
      onHello: function (name) {
        partnerName = name || 'Partner';
        toast(partnerName + ' joined the case');
      },
      onAction: onRemoteAction,
      onFullState: function (remote) {
        state = SYNC.mergeState(state, remote);
        save();
        rerender();
      },
      onStateRequest: function () { conn.sendFullState(state); },
      onClose: function () {
        toast('Channel closed - solo again');
        partnerName = null;
        updatePresence();
      }
    };
  }

  /* ---------- progress link in the URL ---------- */

  function checkHashState() {
    var h = location.hash || '';
    if (h.indexOf('#s=') !== 0) return;
    var incoming = SYNC.decodeState(h.slice(3));
    history.replaceState(null, '', location.pathname);
    if (!incoming) return;
    var hasIncoming = incoming.clues.length || Object.keys(incoming.visited).length;
    if (!hasIncoming) return;
    var m = el(
      '<div class="overlay" role="dialog" aria-modal="true">' +
        '<div class="ev-card">' +
          '<p class="ev-stamp">Progress link</p>' +
          '<h3 class="ev-title">A partner&#39;s notebook is in this link</h3>' +
          '<p class="ev-text">' + incoming.clues.length + ' pieces of evidence, ' + Object.keys(incoming.visited).length + ' locations visited. Merge it with your own case, or take it as your starting point.</p>' +
          '<div class="ev-actions">' +
            '<button class="btn-primary" id="hashMerge">Merge with mine</button>' +
            '<button class="btn-quiet" id="hashReplace">Start from theirs</button>' +
            '<button class="btn-quiet" id="hashIgnore">Ignore</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
    document.body.appendChild(m);
    requestAnimationFrame(function () { m.classList.add('on'); });
    m.querySelector('#hashMerge').onclick = function () {
      state = SYNC.mergeState(state, incoming);
      save(); m.remove(); renderStart();
      toast('Notebooks merged');
    };
    m.querySelector('#hashReplace').onclick = function () {
      state = incoming;
      save(); m.remove(); renderStart();
      toast('Case loaded from the link');
    };
    m.querySelector('#hashIgnore').onclick = function () { m.remove(); };
  }

  checkHashState();
  renderStart();
})();
