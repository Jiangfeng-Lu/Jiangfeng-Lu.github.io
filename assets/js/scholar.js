(function () {
  'use strict';
  var script = document.currentScript;
  var repository = script.dataset.repository;
  var expectedId = script.dataset.scholarId;
  var status = document.getElementById('scholar-status');
  var total = document.getElementById('total_cit');
  if (!total && !document.querySelector('.show_paper_citations')) return;
  var raw = 'https://raw.githubusercontent.com/' + repository + '/google-scholar-stats/gs_data.json';
  var cdn = 'https://cdn.jsdelivr.net/gh/' + repository + '@google-scholar-stats/gs_data.json';
  var urls = script.dataset.useCdn === 'true' ? [cdn, raw] : [raw, cdn];
  function normalize(title) { return (title || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
  function count(value) { return typeof value === 'number' && Number.isInteger(value) && value >= 0; }
  async function getData(url) {
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 8000);
    try {
      var response = await fetch(url, { signal: controller.signal, cache: 'no-cache' });
      if (!response.ok) throw new Error('Citation data unavailable');
      var data = await response.json();
      if (!count(data.citedby) || !data.scholar_id || (expectedId && data.scholar_id !== expectedId)) throw new Error('Invalid Scholar data');
      return data;
    } finally { clearTimeout(timeout); }
  }
  function render(data) {
    if (total) total.textContent = data.citedby.toLocaleString('en-US');
    var publications = Object.values(data.publications || {});
    document.querySelectorAll('.show_paper_citations').forEach(function (element) {
      var id = element.getAttribute('data') || element.dataset.paperId;
      var card = element.closest('.paper-box');
      var title = card && card.querySelector('.paper-box-text p:first-child a');
      var paper = id ? (data.publications || {})[id] : publications.find(function (item) {
        return title && normalize(item.bib && item.bib.title) === normalize(title.textContent);
      });
      if (paper && count(paper.num_citations)) {
        element.textContent = 'Citations: ' + paper.num_citations.toLocaleString('en-US');
        element.hidden = false;
      }
    });
    if (status) {
      status.textContent = '';
      var link = document.createElement('a');
      link.href = 'https://scholar.google.com/citations?user=' + encodeURIComponent(data.scholar_id);
      link.textContent = 'View Google Scholar';
      status.appendChild(link);
      var updated = new Date(data.updated);
      if (!isNaN(updated.getTime())) status.appendChild(document.createTextNode(' · Updated ' + updated.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })));
    }
  }
  (async function () {
    if (status) status.textContent = 'Loading citation data…';
    for (var i = 0; i < urls.length; i++) {
      try { render(await getData(urls[i])); return; } catch (error) { /* Try the alternate host. */ }
    }
    if (status) status.textContent = 'Citation data is temporarily unavailable.';
  })();
})();
