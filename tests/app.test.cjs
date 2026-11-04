// Run with node --test tests/app.test.cjs. No browser or npm install required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'web/index.html'), 'utf8');
const script = page.match(/<script>\n([\s\S]*?)<\/script>/)[1];

function app() {
  const elements = new Map();
  const get = id => {
    if (!elements.has(id)) elements.set(id, {
      value: '', innerHTML: '', textContent: '', hidden: true, offsetHeight: 60,
      setAttribute(key, value) { this[key] = value; },
      addEventListener() {}, focus() {},
    });
    return elements.get(id);
  };
  class Audio {
    constructor() { this.currentTime = 0; this.events = {}; }
    pause() {}
    play() { return Promise.resolve(); }
    addEventListener(name, fn) { this.events[name] = fn; }
    removeAttribute(name) { delete this[name]; }
  }
  const saved = new Map();
  const context = vm.createContext({
    Audio, URL, AbortController, setTimeout, clearTimeout,
    localStorage: { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) },
    location: { hash: '', pathname: '/shine/web/', search: '' },
    history: { replaceState() {} },
    document: {
      getElementById: get,
      querySelector: selector => selector === '.nav-links' ? get('nav-links') : null,
      querySelectorAll: () => [],
      addEventListener() {},
      documentElement: { style: { setProperty() {} } },
    },
    window: { addEventListener() {} },
    matchMedia: () => ({ matches: true }),
    fetch: async () => ({ ok: false }), // Match locally, including the offline fallback.
  });
  vm.runInContext(script, context);
  return { get, run: code => vm.runInContext(code, context) };
}

test('home, collections, search, saved items, and reader still render', () => {
  const a = app();
  assert.match(a.get('view').innerHTML, /What’s on your mind/);
  a.run("go('focus-restless-mind')");
  assert.match(a.get('view').innerHTML, /How to Cultivate Concentration/);
  a.get('q').value = 'How to Cultivate Concentration';
  a.run("go('home')");
  assert.match(a.get('view').innerHTML, /1 teaching/);
  a.get('q').value = '';
  a.run("store.set('shine-saved',['LH001']);go('saved');openReader('LH001',false)");
  assert.equal(a.get('reader').hidden, false);
  assert.equal(a.get('r-title').textContent, 'How to Cultivate Concentration');
  assert.match(a.get('r-cite').innerHTML, /CC BY-NC 4.0/);
  assert.match(a.get('view').innerHTML, /How to Cultivate Concentration/);
});

test('saved narration resumes, seeks English paragraphs, and stops with music', () => {
  const a = app();
  a.run("loadTrack('LH001');play();narration.currentTime=10;updateProg();pause()");
  assert.equal(a.run('narration.currentTime'), 10);
  assert.equal(a.run('player.playing'), false);
  a.run('play();jump(1)');
  assert(a.run('narration.currentTime') > 10);
  assert.equal(a.run('player.i'), a.run('AUDIO.LH001.paragraph_indices[paragraphAt(narration.currentTime,AUDIO.LH001.paragraphs)]'));
  a.run('narration.events.ended()');
  assert.equal(a.run('narration.currentTime'), 0);
  assert.equal(a.run('player.playing'), false);
  a.run("document.getElementById('music-toggle').onclick()");
  assert.equal(a.run('music.enabled'), false);
});

test('keyword recommendations work offline and crisis patterns are retained', async () => {
  const a = app();
  const result = await a.run("localMatch('concentration focus distracted restless mind')");
  assert(result.picks.length >= 1 && result.picks.length <= 3);
  assert.equal(a.run(`byId('${result.picks[0].id}').playlist`), 'focus-restless-mind');
  assert.equal(a.run("CRISIS_RE.test('I want to die')"), true);
  assert.equal(a.run("CRISIS_RE.test('I miss my family')"), false);
});
