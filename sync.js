/* City Detective - serverless co-op sync.
   Two ways to play together with no backend:
   1. Live co-op: WebRTC DataChannel, signaled by copy-pasting invite/answer
      codes through any chat app. Once connected, every action one detective
      takes (finding a clue, pinning evidence, accusing) lands on the other
      screen in under a second.
   2. Progress links: the whole case state packs into a URL hash - send it,
      and your partner merges your notebook into theirs.
   State merges as a union, so two players can never lose each other's work. */
(function () {
  'use strict';

  /* ---------- pure state ops (shared by engine + tests) ---------- */

  function emptyState() {
    return { v: 2, visited: {}, found: {}, flavor: {}, answered: {}, clues: [], pinned: {}, solved: false };
  }

  function normalizeState(s) {
    var e = emptyState();
    if (!s || typeof s !== 'object') return e;
    ['visited', 'found', 'flavor', 'answered', 'pinned'].forEach(function (k) {
      if (s[k] && typeof s[k] === 'object') for (var key in s[k]) if (s[k][key]) e[k][key] = true;
    });
    if (Array.isArray(s.clues)) s.clues.forEach(function (c) { if (typeof c === 'string' && e.clues.indexOf(c) < 0) e.clues.push(c); });
    e.solved = !!s.solved;
    return e;
  }

  // Union merge: anything either detective did counts. Never destructive.
  function mergeState(a, b) {
    a = normalizeState(a); b = normalizeState(b);
    var out = normalizeState(a);
    ['visited', 'found', 'flavor', 'answered', 'pinned'].forEach(function (k) {
      for (var key in b[k]) out[k][key] = true;
    });
    b.clues.forEach(function (c) { if (out.clues.indexOf(c) < 0) out.clues.push(c); });
    out.solved = a.solved || b.solved;
    return out;
  }

  // One game action, applied to a state. Returns true if it changed anything.
  // Actions are the wire format for live co-op - small, idempotent, order-safe.
  function applyAction(state, a) {
    if (!a || !a.k) return false;
    switch (a.k) {
      case 'visit':
        if (state.visited[a.id]) return false;
        state.visited[a.id] = true; return true;
      case 'find':
        if (state.found[a.id]) return false;
        state.found[a.id] = true;
        if (state.clues.indexOf(a.id) < 0) state.clues.push(a.id);
        return true;
      case 'flavor':
        if (state.flavor[a.id]) return false;
        state.flavor[a.id] = true; return true;
      case 'answer':
        if (state.answered[a.id]) return false;
        state.answered[a.id] = true;
        if (a.clueId && !state.found[a.clueId]) {
          state.found[a.clueId] = true;
          if (state.clues.indexOf(a.clueId) < 0) state.clues.push(a.clueId);
        }
        return true;
      case 'pin':
        if (!!state.pinned[a.id] === !!a.on) return false;
        if (a.on) state.pinned[a.id] = true; else delete state.pinned[a.id];
        return true;
      case 'solve':
        if (state.solved) return false;
        state.solved = true; return true;
      case 'reset':
        var e = emptyState();
        for (var k in state) delete state[k];
        for (var k2 in e) state[k2] = e[k2];
        return true;
      default:
        return false;
    }
  }

  /* ---------- progress links ---------- */

  function encodeState(state) {
    var json = JSON.stringify(normalizeState(state));
    var b64 = (typeof btoa !== 'undefined')
      ? btoa(unescape(encodeURIComponent(json)))
      : Buffer.from(json, 'utf8').toString('base64');
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function decodeState(code) {
    try {
      var b64 = String(code).replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      var json = (typeof atob !== 'undefined')
        ? decodeURIComponent(escape(atob(b64)))
        : Buffer.from(b64, 'base64').toString('utf8');
      return normalizeState(JSON.parse(json));
    } catch (e) { return null; }
  }

  /* ---------- live co-op over WebRTC ---------- */

  var RTC_CFG = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

  function waitIce(pc) {
    return new Promise(function (resolve) {
      if (pc.iceGatheringState === 'complete') return resolve();
      pc.addEventListener('icegatheringstatechange', function check() {
        if (pc.iceGatheringState === 'complete') {
          pc.removeEventListener('icegatheringstatechange', check);
          resolve();
        }
      });
    });
  }

  function pack(desc) {
    return btoa(JSON.stringify(desc));
  }
  function unpack(code) {
    return JSON.parse(atob(String(code).trim()));
  }

  // Connection wraps one RTCPeerConnection and its data channel.
  // onAction(action) fires for every remote action; send(action) ships one.
  function Connection(hooks) {
    this.hooks = hooks || {};
    this.pc = null;
    this.dc = null;
    this.open = false;
  }

  Connection.prototype._wire = function (dc) {
    var self = this;
    this.dc = dc;
    dc.onopen = function () {
      self.open = true;
      if (self.hooks.onOpen) self.hooks.onOpen();
    };
    dc.onclose = function () {
      self.open = false;
      if (self.hooks.onClose) self.hooks.onClose();
    };
    dc.onmessage = function (ev) {
      var msg;
      try { msg = JSON.parse(ev.data); } catch (e) { return; }
      if (msg && msg.t === 'act' && self.hooks.onAction) self.hooks.onAction(msg.a);
      else if (msg && msg.t === 'full' && self.hooks.onFullState) self.hooks.onFullState(msg.state);
      else if (msg && msg.t === 'req' && self.hooks.onStateRequest) self.hooks.onStateRequest();
      else if (msg && msg.t === 'hi' && self.hooks.onHello) self.hooks.onHello(msg.name);
    };
  };

  // Host: create the invite code to send to your partner.
  Connection.prototype.host = function () {
    var self = this;
    this.pc = new RTCPeerConnection(RTC_CFG);
    this._wire(this.pc.createDataChannel('case'));
    return this.pc.createOffer()
      .then(function (o) { return self.pc.setLocalDescription(o); })
      .then(function () { return waitIce(self.pc); })
      .then(function () { return pack(self.pc.localDescription); });
  };

  // Host: paste the partner's answer code to open the channel.
  Connection.prototype.acceptAnswer = function (code) {
    var desc = unpack(code);
    return this.pc.setRemoteDescription(new RTCSessionDescription(desc));
  };

  // Guest: paste the invite code, get back the answer code to send over.
  Connection.prototype.join = function (inviteCode) {
    var self = this;
    this.pc = new RTCPeerConnection(RTC_CFG);
    this.pc.ondatachannel = function (ev) { self._wire(ev.channel); };
    var offer = unpack(inviteCode);
    return this.pc.setRemoteDescription(new RTCSessionDescription(offer))
      .then(function () { return self.pc.createAnswer(); })
      .then(function (a) { return self.pc.setLocalDescription(a); })
      .then(function () { return waitIce(self.pc); })
      .then(function () { return pack(self.pc.localDescription); });
  };

  Connection.prototype.sendAction = function (a) {
    if (this.open && this.dc) this.dc.send(JSON.stringify({ t: 'act', a: a }));
  };
  Connection.prototype.sendFullState = function (state) {
    if (this.open && this.dc) this.dc.send(JSON.stringify({ t: 'full', state: normalizeState(state) }));
  };
  Connection.prototype.requestState = function () {
    if (this.open && this.dc) this.dc.send(JSON.stringify({ t: 'req' }));
  };
  Connection.prototype.sayHello = function (name) {
    if (this.open && this.dc) this.dc.send(JSON.stringify({ t: 'hi', name: name }));
  };
  Connection.prototype.close = function () {
    try { if (this.dc) this.dc.close(); } catch (e) {}
    try { if (this.pc) this.pc.close(); } catch (e) {}
    this.open = false;
  };

  var api = {
    emptyState: emptyState,
    normalizeState: normalizeState,
    mergeState: mergeState,
    applyAction: applyAction,
    encodeState: encodeState,
    decodeState: decodeState,
    Connection: Connection,
    available: typeof RTCPeerConnection !== 'undefined'
  };

  if (typeof window !== 'undefined') window.CaseSync = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
