/* City Detective - generic case engine.
   Renders any case object with the shape used by case-thailand.js.
   Progress is stored per-case in localStorage. */
(function () {
  'use strict';

  var app = document.getElementById('app');
  var registry = window.CASE_REGISTRY || [];
  var CASE = registry.length ? registry[0].loader() : null;
  if (!CASE) {
    app.innerHTML = '<div class="panel"><h2>No cases installed</h2><p>Add a case file and register it in cases.js.</p></div>';
    return;
  }

  var SAVE_KEY = 'city-detective:' + CASE.id;

  var state = load();

  function load() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { visited: {}, found: {}, answered: {}, clues: [], solved: false };
  }
  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {}
  }
  function reset() {
    state = { visited: {}, found: {}, answered: {}, clues: [], solved: false };
    save();
  }

  function el(html) {
    var d = document.createElement('div');
    d.innerHTML = html;
    return d.firstElementChild;
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function suspectById(id) {
    for (var i = 0; i < CASE.suspects.length; i++) if (CASE.suspects[i].id === id) return CASE.suspects[i];
    return null;
  }
  function locationById(id) {
    for (var i = 0; i < CASE.locations.length; i++) if (CASE.locations[i].id === id) return CASE.locations[i];
    return null;
  }
  function totalClues() {
    var n = 0;
    CASE.locations.forEach(function (l) { n += l.searches.length; });
    return n;
  }
  function allVisited() {
    return CASE.locations.every(function (l) { return state.visited[l.id]; });
  }

  /* ---------- screens ---------- */

  function renderStart() {
    app.innerHTML = '';
    var caseList = registry.map(function (r) {
      var c = r.loader();
      return '<span class="badge new">' + esc(c.country) + ': ' + esc(c.title) + '</span>';
    }).join(' ');
    var started = Object.keys(state.visited).length > 0 || state.clues.length > 0;
    app.appendChild(el(
      '<div>' +
        '<div class="cover"><img src="' + CASE.cover + '" alt="Case cover">' +
          '<div class="title-overlay"><h1>CITY DETECTIVE</h1>' +
          '<div class="subtitle">' + esc(CASE.city) + ' - ' + esc(CASE.title) + '</div></div>' +
        '</div>' +
        '<p class="intro">' + esc(CASE.intro) + '</p>' +
        '<div class="panel" style="display:flex;gap:16px;align-items:center">' +
          '<img src="amulet.png" alt="The Emerald Deva" style="width:110px;height:110px;object-fit:cover;border-radius:8px">' +
          '<p><strong>The Emerald Deva.</strong> Golden, old, insured for 40 million baht - and gone from a sealed case in front of two hundred guests.</p>' +
        '</div>' +
        '<div class="panel"><h3>How to play</h3><p>' + esc(CASE.howTo) + '</p></div>' +
        '<p>' + caseList + '</p>' +
        '<div class="back-row" style="margin-top:22px">' +
          '<button class="btn" id="startBtn">' + (started ? 'Continue investigation' : 'Begin investigation') + '</button> ' +
          (started ? '<button class="btn-ghost" id="resetBtn">Start over</button>' : '') +
        '</div>' +
      '</div>'
    ));
    document.getElementById('startBtn').onclick = renderMap;
    var rb = document.getElementById('resetBtn');
    if (rb) rb.onclick = function () { reset(); renderStart(); };
  }

  function topbar(active) {
    var bar = el(
      '<div class="topbar">' +
        '<div class="case-title">' + esc(CASE.city) + ' - ' + esc(CASE.title) + '</div>' +
        '<div class="actions">' +
          '<button class="btn-ghost" data-nav="map">City</button>' +
          '<button class="btn-ghost" data-nav="suspects">Suspects</button>' +
          '<button class="btn-ghost" data-nav="notebook">Notebook (' + state.clues.length + ')</button>' +
          '<button class="btn" data-nav="accuse"' + (allVisited() ? '' : ' disabled') + '>Make accusation</button>' +
        '</div>' +
      '</div>'
    );
    bar.querySelectorAll('[data-nav]').forEach(function (b) {
      b.onclick = function () {
        var t = b.getAttribute('data-nav');
        if (t === 'map') renderMap();
        else if (t === 'suspects') renderSuspects();
        else if (t === 'notebook') renderNotebook();
        else if (t === 'accuse' && allVisited()) renderAccuse();
      };
    });
    return bar;
  }

  function renderMap() {
    app.innerHTML = '';
    app.appendChild(topbar('map'));
    if (!allVisited()) {
      app.appendChild(el('<p class="hint">Visit every location to unlock your accusation. Clues found: ' +
        state.clues.length + ' of ' + totalClues() + '.</p>'));
    } else {
      app.appendChild(el('<p class="hint">You have covered the city. When your story holds together, make the accusation.</p>'));
    }
    var grid = el('<div class="grid" style="margin-top:14px"></div>');
    CASE.locations.forEach(function (loc) {
      var foundHere = loc.searches.filter(function (s) { return state.found[s.id]; }).length;
      var badge = state.visited[loc.id]
        ? '<span class="badge done">Visited - clues ' + foundHere + '/' + loc.searches.length + '</span>'
        : '<span class="badge new">Unvisited</span>';
      var card = el(
        '<div class="card">' +
          '<img src="' + loc.image + '" alt="' + esc(loc.name) + '">' +
          '<div class="card-body"><div class="card-name">' + esc(loc.name) + '</div>' +
          '<div class="card-blurb">' + esc(loc.blurb) + '</div>' + badge + '</div>' +
        '</div>'
      );
      card.onclick = function () { renderLocation(loc.id); };
      grid.appendChild(card);
    });
    app.appendChild(grid);
    app.appendChild(el('<div class="footer-note">Progress saves automatically in this browser.</div>'));
  }

  function renderLocation(id) {
    var loc = locationById(id);
    if (!loc) return renderMap();
    state.visited[id] = true;
    save();
    app.innerHTML = '';
    app.appendChild(topbar());
    app.appendChild(el('<h2>' + esc(loc.name) + '</h2>'));
    app.appendChild(el('<div class="scene"><img src="' + loc.image + '" alt="' + esc(loc.name) + '"></div>'));
    app.appendChild(el('<p class="intro">' + esc(loc.description) + '</p>'));

    // searches
    var searchPanel = el('<div class="panel"><h3>Search the scene</h3></div>');
    var next = loc.searches.filter(function (s) { return !state.found[s.id]; })[0];
    var list = el('<div></div>');
    loc.searches.forEach(function (s) {
      if (state.found[s.id]) {
        list.appendChild(el(
          '<div class="search-item"><div class="si-title">' + esc(s.title) + '</div>' +
          '<p>' + esc(s.text) + '</p><span class="found-tag">In your notebook</span></div>'
        ));
      }
    });
    searchPanel.appendChild(list);
    if (next) {
      var left = loc.searches.filter(function (s) { return !state.found[s.id]; }).length;
      var btn = el('<button class="btn">Search for clues (' + left + ' left)</button>');
      btn.onclick = function () {
        state.found[next.id] = true;
        if (state.clues.indexOf(next.id) < 0) state.clues.push(next.id);
        save();
        renderLocation(id);
      };
      searchPanel.appendChild(btn);
    } else {
      searchPanel.appendChild(el('<p class="hint">You have searched everything here.</p>'));
    }
    app.appendChild(searchPanel);

    // person to question
    if (loc.person) {
      var s = suspectById(loc.person.suspectId);
      var p = el(
        '<div class="panel"><h3>Question ' + esc(s.name) + '</h3>' +
          '<div class="person-head"><img src="' + s.image + '" alt="' + esc(s.name) + '">' +
          '<div><strong>' + esc(s.name) + '</strong><br><span class="subtitle">' + esc(s.role) + '</span></div></div>' +
          '<p>' + esc(loc.person.intro) + '</p></div>'
      );
      var qList = el('<div></div>');
      loc.person.questions.forEach(function (q, qi) {
        var key = id + ':' + qi;
        if (state.answered[key]) {
          qList.appendChild(el(
            '<div class="qa"><div class="q">' + esc(q.q) + '</div><div class="a">' + esc(q.a) +
            (q.clue ? '<br><span class="found-tag">Key testimony - noted</span>' : '') + '</div></div>'
          ));
        }
      });
      p.appendChild(qList);
      var pending = -1;
      for (var i = 0; i < loc.person.questions.length; i++) {
        if (!state.answered[id + ':' + i]) { pending = i; break; }
      }
      if (pending >= 0) {
        var qb = el('<button class="btn-ghost">Ask: ' + esc(loc.person.questions[pending].q) + '</button>');
        qb.onclick = function () {
          state.answered[id + ':' + pending] = true;
          var q = loc.person.questions[pending];
          if (q.clue) {
            var cid = id + '-testimony-' + pending;
            if (state.clues.indexOf(cid) < 0) {
              state.clues.push(cid);
              state.found[cid] = true;
              q.clueId = cid;
            }
          }
          save();
          renderLocation(id);
        };
        p.appendChild(el('<div style="margin-top:12px"></div>')).appendChild(qb);
      } else {
        p.appendChild(el('<p class="hint">' + esc(s.name) + ' has told you everything.</p>'));
      }
      app.appendChild(p);
    }
  }

  function renderSuspects() {
    app.innerHTML = '';
    app.appendChild(topbar());
    app.appendChild(el('<h2>The four suspects</h2>'));
    var grid = el('<div class="suspect-grid" style="margin-top:14px"></div>');
    CASE.suspects.forEach(function (s) {
      grid.appendChild(el(
        '<div class="card suspect-card"><img src="' + s.image + '" alt="' + esc(s.name) + '">' +
        '<div class="card-body"><div class="card-name">' + esc(s.name) + '</div>' +
        '<div class="role">' + esc(s.role) + '</div>' +
        '<p class="card-blurb" style="margin-top:8px">' + esc(s.bio) + '</p></div></div>'
      ));
    });
    app.appendChild(grid);
  }

  function clueLabel(cid) {
    for (var i = 0; i < CASE.locations.length; i++) {
      var loc = CASE.locations[i];
      for (var j = 0; j < loc.searches.length; j++) {
        if (loc.searches[j].id === cid) return { title: loc.searches[j].title, text: loc.searches[j].text, where: loc.name };
      }
      if (loc.person) {
        for (var k = 0; k < loc.person.questions.length; k++) {
          if (loc.person.questions[k].clueId === cid) {
            return { title: 'Testimony', text: loc.person.questions[k].a, where: loc.name };
          }
        }
      }
    }
    return null;
  }

  function renderNotebook() {
    app.innerHTML = '';
    app.appendChild(topbar());
    app.appendChild(el('<h2>Notebook</h2>'));
    if (!state.clues.length) {
      app.appendChild(el('<p class="hint">Nothing yet. Visit a location and start searching.</p>'));
      return;
    }
    var p = el('<div class="panel"></div>');
    state.clues.forEach(function (cid) {
      var c = clueLabel(cid);
      if (c) {
        p.appendChild(el(
          '<div class="clue"><div class="clue-where">' + esc(c.where) + '</div>' +
          '<strong>' + esc(c.title) + '</strong><p>' + esc(c.text) + '</p></div>'
        ));
      }
    });
    app.appendChild(p);
  }

  /* ---------- accusation ---------- */

  var picked = null;
  var dedIndex = 0;
  var dedMistakes = 0;

  function renderAccuse() {
    if (state.solved) return renderEnding(true, true);
    picked = null; dedIndex = 0; dedMistakes = 0;
    app.innerHTML = '';
    app.appendChild(topbar());
    app.appendChild(el('<h2>Name the thief</h2>'));
    app.appendChild(el('<p class="intro">One accusation. Choose the person your evidence actually convicts - then prove you know how it was done.</p>'));
    var grid = el('<div class="suspect-grid" style="margin-top:14px"></div>');
    CASE.suspects.forEach(function (s) {
      var card = el(
        '<div class="card suspect-card selectable"><img src="' + s.image + '" alt="' + esc(s.name) + '">' +
        '<div class="card-body"><div class="card-name">' + esc(s.name) + '</div>' +
        '<div class="role">' + esc(s.role) + '</div></div></div>'
      );
      card.onclick = function () {
        picked = s.id;
        grid.querySelectorAll('.suspect-card').forEach(function (c) { c.classList.remove('picked'); });
        card.classList.add('picked');
        document.getElementById('confirmAccuse').disabled = false;
      };
      grid.appendChild(card);
    });
    app.appendChild(grid);
    var row = el('<div class="back-row" style="margin-top:22px"><button class="btn" id="confirmAccuse" disabled>Accuse</button></div>');
    app.appendChild(row);
    document.getElementById('confirmAccuse').onclick = function () {
      if (picked === CASE.culprit) renderDeduction();
      else renderEnding(false);
    };
  }

  function renderDeduction() {
    app.innerHTML = '';
    var d = CASE.deduction[dedIndex];
    app.appendChild(el('<h2>Prove it</h2>'));
    app.appendChild(el('<p class="intro">' + esc(d.question) + '</p>'));
    var list = el('<div class="option-list"></div>');
    d.options.forEach(function (opt, oi) {
      var b = el('<button>' + esc(opt) + '</button>');
      b.onclick = function () {
        if (oi === d.correct) {
          b.classList.add('correct');
          app.appendChild(el('<div class="panel"><p><strong>Right.</strong> ' + esc(d.explain) + '</p></div>'));
          dedIndex++;
          if (dedIndex < CASE.deduction.length) {
            var nb = el('<div class="back-row"><button class="btn">Next</button></div>');
            app.appendChild(nb);
            nb.firstChild.onclick = renderDeduction;
          } else {
            var wb = el('<div class="back-row"><button class="btn">Close the case</button></div>');
            app.appendChild(wb);
            wb.firstChild.onclick = function () { state.solved = true; save(); renderEnding(true); };
          }
          list.querySelectorAll('button').forEach(function (x) { x.disabled = true; });
        } else {
          b.classList.add('wrong');
          b.disabled = true;
          dedMistakes++;
          if (dedMistakes >= 3) renderEnding(false);
        }
      };
      list.appendChild(b);
    });
    app.appendChild(list);
  }

  function renderEnding(win, replay) {
    app.innerHTML = '';
    var cls = win ? 'ending-win' : 'ending-lose';
    var txt = win ? CASE.winText : CASE.loseText;
    var head = win ? '<div class="big win-text">Case closed</div>' : '<div class="big lose-text">Wrong call</div>';
    app.appendChild(el(
      '<div class="panel ' + cls + '" style="margin-top:24px">' + head + '<p>' + esc(txt) + '</p></div>'
    ));
    var row = el('<div class="back-row" style="margin-top:20px"></div>');
    if (win) {
      var again = el('<button class="btn">Play again</button>');
      again.onclick = function () { reset(); renderStart(); };
      row.appendChild(again);
    } else {
      var back = el('<button class="btn">Back to the city</button>');
      back.onclick = renderMap;
      row.appendChild(back);
    }
    app.appendChild(row);
  }

  renderStart();
})();
