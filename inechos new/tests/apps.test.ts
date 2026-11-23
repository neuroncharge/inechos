import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  resolveActivePage,
  shouldTransitionLink,
  shouldHideMobileRail
} = require('../public/apps.js');

test('resolveActivePage resolves root and index routes to index.html', () => {
  assert.equal(resolveActivePage('/'), 'index.html');
  assert.equal(resolveActivePage(''), 'index.html');
  assert.equal(resolveActivePage('/index.html'), 'index.html');
  assert.equal(resolveActivePage('/bakery/index.html'), 'index.html');
  assert.equal(resolveActivePage('/?utm_source=ig'), 'index.html');
});

test('resolveActivePage resolves ethos and process routes accurately', () => {
  assert.equal(resolveActivePage('/ethos.html'), 'ethos.html');
  assert.equal(resolveActivePage('/ethos'), 'ethos.html');
  assert.equal(resolveActivePage('/ethos/'), 'ethos.html');
  assert.equal(resolveActivePage('/inechos/ethos.html#story'), 'ethos.html');

  assert.equal(resolveActivePage('/process.html'), 'process.html');
  assert.equal(resolveActivePage('/process'), 'process.html');
  assert.equal(resolveActivePage('/inechos/process.html?view=1'), 'process.html');

  assert.equal(resolveActivePage('/echo.html'), 'echo.html');
  assert.equal(resolveActivePage('/echo'), 'echo.html');
});

test('shouldTransitionLink allows internal HTML links and ignores external/modified clicks', () => {
  assert.equal(shouldTransitionLink({ href: 'ethos.html' }), true);
  assert.equal(shouldTransitionLink({ href: 'process.html' }), true);
  assert.equal(shouldTransitionLink({ href: 'index.html' }), true);

  assert.equal(shouldTransitionLink({ href: 'https://wa.me/c/971500000000', target: '_blank' }), false);
  assert.equal(shouldTransitionLink({ href: 'https://wa.me/c/971500000000' }), false);
  assert.equal(shouldTransitionLink({ href: '#main-content' }), false);
  assert.equal(shouldTransitionLink({ href: 'ethos.html', metaKey: true }), false);
  assert.equal(shouldTransitionLink({ href: 'ethos.html', ctrlKey: true }), false);
  assert.equal(shouldTransitionLink({ href: 'ethos.html', target: '_blank' }), false);
});

test('shouldHideMobileRail hides on scroll or touch-hold on mobile only', () => {
  assert.equal(shouldHideMobileRail({ isMobileViewport: true, isScrolling: true, isTouchHolding: false }), true);
  assert.equal(shouldHideMobileRail({ isMobileViewport: true, isScrolling: false, isTouchHolding: true }), true);
  assert.equal(shouldHideMobileRail({ isMobileViewport: true, isScrolling: true, isTouchHolding: true }), true);
  assert.equal(shouldHideMobileRail({ isMobileViewport: true, isScrolling: false, isTouchHolding: false }), false);
  assert.equal(shouldHideMobileRail({ isMobileViewport: false, isScrolling: true, isTouchHolding: true }), false);
});
