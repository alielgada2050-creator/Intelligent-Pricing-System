const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'voice-assistant.js'), 'utf8');

function createVoiceAssistant(savedLanguage) {
  const values = new Map(savedLanguage ? [['va_lang', savedLanguage]] : []);
  const spoken = [];
  class Utterance {
    constructor(text) { this.text = text; }
  }
  const window = {
    SpeechSynthesisUtterance: Utterance,
    speechSynthesis: {
      cancel() {},
      speak(utterance) { spoken.push(utterance); }
    }
  };
  const localStorage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); }
  };
  const item = { code: '101000001', arDesc: 'حفر خندق', enDesc: 'Trench excavation', uom: 'm', newPrice: 77 };
  const app = { lang: 'ar', state: { boq: { items: [] } }, _renderBOQTable() {}, runDepsCheck() {} };
  vm.runInNewContext(source, {
    window, localStorage, App: app, toast() {},
    normalizeArabic: value => value,
    getItemByCode: code => code === item.code ? item : null,
    searchItems: query => /cable|كابل/i.test(query) ? [item] : []
  });
  return { api: window.VoiceAssistant, values, spoken, app, item };
}

test('offers generic Arabic and English without regional Arabic dialect choices', () => {
  const { api } = createVoiceAssistant('ar-EG');
  assert.deepEqual(Object.keys(api.LANGS), ['ar', 'en-US']);
  assert.equal(api.getLang(), 'ar');
});

test('speaks bilingual local price-list answers without modifying the BOQ', () => {
  const { api, app, spoken, item } = createVoiceAssistant();
  const status = { textContent: '' };
  api._handle(`ما هو البند ${item.code}`, 'boq', status, null);
  assert.match(status.textContent, /حفر خندق/);
  assert.match(status.textContent, /(?:77|٧٧)/);
  assert.equal(app.state.boq.items.length, 0);
  assert.equal(spoken.length, 1);
  assert.equal(spoken[0].lang, 'ar');
});

test('voice search reads local matches and does not add BOQ items', () => {
  const { api, app, spoken } = createVoiceAssistant('en-US');
  const status = { textContent: '' };
  api._handle('find cable', 'search', status, null);
  assert.match(status.textContent, /Trench excavation/);
  assert.equal(app.state.boq.items.length, 0);
  assert.equal(spoken.length, 1);
  assert.equal(spoken[0].lang, 'en-US');
});

test('spoken item codes still add BOQ items with the dictated quantity', () => {
  const { api, app } = createVoiceAssistant();
  api._handle('101000001 quantity 4', 'boq', { textContent: '' }, null);
  assert.deepEqual(JSON.parse(JSON.stringify(app.state.boq.items)), [
    { code: '101000001', qty: 4, customPrice: null, note: '🎙️ مساعد صوتي' }
  ]);
});
