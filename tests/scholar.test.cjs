const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync('assets/js/scholar.js', 'utf8');
async function run(responses, options = {}) {
  const total = { textContent: '—' };
  const status = { textContent: '', appendChild() {} };
  const paper = { hidden: true, dataset: {}, getAttribute() {}, closest() { return { querySelector() { return { textContent: 'Test paper' }; } }; } };
  const calls = [];
  const document = {
    currentScript: { dataset: { repository: 'owner/repo', scholarId: 'testID', useCdn: 'true' } },
    getElementById(id) { return id === 'total_cit' ? (options.noTotal ? null : total) : status; },
    querySelector() { return paper; }, querySelectorAll() { return [paper]; },
    createElement() { return {}; }, createTextNode(text) { return text; }
  };
  vm.runInNewContext(source, { document, AbortController, setTimeout, clearTimeout, fetch: async url => {
    calls.push(url);
    const response = responses.shift();
    if (response instanceof Error) throw response;
    return { ok: true, json: async () => response };
  } });
  await new Promise(resolve => setImmediate(resolve));
  return { total, status, paper, calls };
}
const data = { scholar_id: 'testID', citedby: 0, publications: { p: { bib: { title: 'Test paper' }, num_citations: 0 } } };
test('renders zero citations and matches publication titles', async () => {
  const r = await run([data]);
  assert.equal(r.total.textContent, '0'); assert.equal(r.paper.textContent, 'Citations: 0'); assert.equal(r.paper.hidden, false);
});
test('falls back when the CDN fails', async () => {
  const r = await run([new Error('offline'), data]);
  assert.equal(r.calls.length, 2); assert.match(r.calls[1], /raw.githubusercontent.com/); assert.equal(r.total.textContent, '0');
});
test('rejects wrong profile and malformed data without displaying zero', async () => {
  const r = await run([{ ...data, scholar_id: 'someoneElse' }, { citedby: '100' }]);
  assert.equal(r.total.textContent, '—'); assert.match(r.status.textContent, /unavailable/); assert.equal(r.paper.hidden, true);
});
test('missing total element and missing publication do not crash', async () => {
  const r = await run([{ ...data, publications: {} }], { noTotal: true });
  assert.equal(r.paper.hidden, true); assert.equal(r.calls.length, 1);
});
