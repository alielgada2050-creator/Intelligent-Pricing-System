const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'utils', 'auth.js'), 'utf8');

function createAuth(initialSession = null) {
  const values = new Map(initialSession ? [['sec.auth.session.v1', JSON.stringify(initialSession)]] : []);
  const messages = [];
  const localStorage = {
    getItem: key => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key)
  };
  const document = {
    addEventListener() {},
    getElementById() { return null; },
    body: { insertAdjacentHTML() {} }
  };
  const window = { toast: message => messages.push(message) };
  vm.runInNewContext(source, { window, document, localStorage });
  return { auth: window.Auth, messages, values };
}

test('does not expose demo login or treat an unverified browser session as authenticated', () => {
  const { auth } = createAuth({ name: 'Demo', provider: 'demo', role: 'Admin' });
  assert.equal(auth.demoLogin, undefined);
  assert.equal(auth.current(), null);
});

test('Google credential preview cannot create a local authenticated session', () => {
  const { auth, messages, values } = createAuth();
  auth.handleGoogleCredential({ credential: 'unverified-token' });
  assert.equal(auth.current(), null);
  assert.equal(values.has('sec.auth.session.v1'), false);
  assert.match(messages[0], /خادم/);
});
