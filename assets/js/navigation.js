/* One scrolling mechanism: native anchors + CSS smooth scrolling. */
(function () {
  'use strict';
  var header = document.querySelector('.masthead');
  var navigation = document.getElementById('site-nav');
  var content = document.querySelector('.page__content');
  if (!header || !content) return;
  var tail = document.createElement('div');
  tail.setAttribute('aria-hidden', 'true');
  tail.className = 'anchor-scroll-space';
  document.body.appendChild(tail);

  function updateOffsets() {
    var offset = Math.ceil(header.getBoundingClientRect().height) + 24;
    document.documentElement.style.setProperty('--anchor-offset', offset + 'px');
    var headings = content.querySelectorAll('.section-title[id]');
    var last = headings[headings.length - 1];
    if (!last) return;
    // The final heading needs enough document space below it to reach the header.
    // Subtract existing space, avoiding cumulative growth on resize.
    var end = tail.getBoundingClientRect().top + window.scrollY;
    var target = last.getBoundingClientRect().top + window.scrollY;
    tail.style.height = Math.max(0, Math.ceil(window.innerHeight - offset - (end - target))) + 'px';
  }

  updateOffsets();
  window.addEventListener('resize', updateOffsets);
  window.addEventListener('load', updateOffsets);
  if ('ResizeObserver' in window) {
    var observer = new ResizeObserver(updateOffsets);
    observer.observe(header);
    observer.observe(content);
  }
  if (navigation) navigation.addEventListener('click', function (event) {
    var link = event.target.closest('a[href]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    var destination = new URL(link.href, window.location.href);
    if (destination.origin !== location.origin || destination.pathname !== location.pathname || !destination.hash) return;
    // Let the browser update the URL, focus and history; just close the mobile menu.
    var menu = navigation.querySelector('.hidden-links');
    var button = navigation.querySelector('button');
    if (menu) menu.classList.add('hidden');
    if (button) button.classList.remove('close');
    updateOffsets();
  });
})();
