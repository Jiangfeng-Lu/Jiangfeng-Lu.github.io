const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

const source = fs.readFileSync('assets/js/scholar.js', 'utf8');

async function run(responses, options = {}) {
  const total = { textContent: '114' };
  const status = { textContent: '', children: [], appendChild(node) { this.children.push(node); } };
  const paper = {
    hidden: true,
    dataset: {},
    getAttribute() { return null; },
    closest() { return { querySelector() { return { textContent: 'Test paper' }; } }; }
  };
  const calls = [];
  const document = {
    currentScript: {
      dataset: {
        repository: 'owner/repo',
        scholarId: 'testID',
        fallbackCount: '114',
        fallbackUpdated: '2026-10-30',
        useCdn: 'true'
      }
    },
    getElementById(id) { return id === 'total_cit' ? (options.noTotal ? null : total) : status; },
    querySelector() { return paper; },
    querySelectorAll() { return [paper]; },
    createElement() { return {}; },
    createTextNode(text) { return { textContent: text }; }
  };

  vm.runInNewContext(source, {
    document,
    AbortController,
    setTimeout,
    clearTimeout,
    fetch: async url => {
      calls.push(url);
      const response = responses.shift();
      if (response instanceof Error) throw response;
      return { ok: true, json: async () => response };
    }
  });

  await new Promise(resolve => setImmediate(resolve));
  return { total, status, paper, calls };
}

const data = {
  scholar_id: 'testID',
  citedby: 120,
  updated: '2026-11-01',
  publications: { p: { bib: { title: 'Test paper' }, num_citations: 7 } }
};

test('renders live citations and matches publication titles', async () => {
  const result = await run([data]);
  assert.equal(result.total.textContent, '120');
  assert.equal(result.paper.textContent, 'Citations: 7');
  assert.equal(result.paper.hidden, false);
});

test('never replaces the manual snapshot with an older lower count', async () => {
  const result = await run([{ ...data, citedby: 100, updated: '2026-10-01' }]);
  assert.equal(result.total.textContent, '114');
});

test('falls back to the alternate host', async () => {
  const result = await run([new Error('offline'), data]);
  assert.equal(result.calls.length, 2);
  assert.match(result.calls[1], /raw\.githubusercontent\.com/);
});

test('keeps the manual snapshot when both hosts return invalid data', async () => {
  const result = await run([{ ...data, scholar_id: 'someoneElse' }, { citedby: '120' }]);
  assert.equal(result.total.textContent, '114');
  assert.match(result.status.textContent, /Updated/);
  assert.equal(result.paper.hidden, true);
});

test('a missing total element and publication match do not crash', async () => {
  const result = await run([{ ...data, publications: {} }], { noTotal: true });
  assert.equal(result.paper.hidden, true);
  assert.equal(result.calls.length, 1);
});
