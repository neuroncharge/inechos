/* ==========================================================================
   INECHOS — Shared Editorial Behavior & Navigation State (Vanilla JS)
   Zero dependencies · Progressive enhancement · Node-testable pure helpers
   ========================================================================== */

/* global module */
(function (root) {
  'use strict';

  /**
   * Resolves a URL pathname into one of the three canonical internal pages.
   * Supports root '/', clean URLs ('/ethos'), and '.html' filenames.
   *
   * @param {string} pathname
   * @returns {'index.html' | 'ethos.html' | 'process.html'}
   */
  function resolveActivePage(pathname) {
    if (!pathname || typeof pathname !== 'string') {
      return 'index.html';
    }

    var normalized = pathname.split('?')[0].split('#')[0].toLowerCase().replace(/\/+$/, '');
    if (normalized === '' || normalized === '/') {
      return 'index.html';
    }

    var segments = normalized.split('/');
    var lastSegment = segments[segments.length - 1] || '';

    if (lastSegment === 'ethos' || lastSegment === 'ethos.html') {
      return 'ethos.html';
    }

    if (lastSegment === 'process' || lastSegment === 'process.html') {
      return 'process.html';
    }

    if (lastSegment === 'echo' || lastSegment === 'echo.html') {
      return 'echo.html';
    }

    return 'index.html';
  }

  /**
   * Determines whether an anchor click should trigger a smooth internal transition.
   *
   * @param {{ href?: string | null, target?: string | null, metaKey?: boolean, ctrlKey?: boolean, shiftKey?: boolean, altKey?: boolean }} options
   * @returns {boolean}
   */
  function shouldTransitionLink(options) {
    if (!options || !options.href) {
      return false;
    }

    if (options.metaKey || options.ctrlKey || options.shiftKey || options.altKey) {
      return false;
    }

    if (options.target && options.target.toLowerCase() === '_blank') {
      return false;
    }

    var href = String(options.href).trim();
    if (
      href === '' ||
      href.charAt(0) === '#' ||
      href.indexOf('http://') === 0 ||
      href.indexOf('https://') === 0 ||
      href.indexOf('mailto:') === 0 ||
      href.indexOf('tel:') === 0
    ) {
      return false;
    }

    return true;
  }

  /**
   * Synchronizes the active state classes and aria-current attributes on nav links.
   *
   * @param {Document} doc
   * @param {string} pathname
   */
  function syncActiveNavigation(doc, pathname) {
    var activePage = resolveActivePage(pathname);
    var links = doc.querySelectorAll('.rail-link[data-page]');

    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      var targetPage = link.getAttribute('data-page');
      var isMatch = targetPage === activePage;

      if (isMatch) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('is-active');
        link.removeAttribute('aria-current');
      }
    }

    return activePage;
  }

  /**
   * Determines whether the fixed mobile side rail should be hidden.
   * Hides only on mobile viewports while scrolling or actively holding touch.
   *
   * @param {{ isMobileViewport: boolean, isScrolling: boolean, isTouchHolding: boolean }} state
   * @returns {boolean}
   */
  function shouldHideMobileRail(state) {
    if (!state || !state.isMobileViewport) {
      return false;
    }
    return Boolean(state.isScrolling || state.isTouchHolding);
  }

  /**
   * Attaches smooth page entry/exit transitions and mobile touch feedback.
   */
  function initBrowserBehavior() {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    var prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    syncActiveNavigation(document, window.location.pathname);

    // Ensure bfcache back/forward navigation always reveals the page cleanly
    window.addEventListener('pageshow', function () {
      document.body.classList.remove('is-leaving');
      document.body.classList.remove('is-entering');
    });

    // Subtle settle-in on initial paint
    if (!prefersReducedMotion) {
      document.body.classList.remove('is-entering');
    }

    // Smooth page transition on internal navigation links
    var internalLinks = document.querySelectorAll('a[href]');
    for (var i = 0; i < internalLinks.length; i++) {
      (function (anchor) {
        anchor.addEventListener('click', function (event) {
          var href = anchor.getAttribute('href');
          var target = anchor.getAttribute('target');

          if (
            !shouldTransitionLink({
              href: href,
              target: target,
              metaKey: event.metaKey,
              ctrlKey: event.ctrlKey,
              shiftKey: event.shiftKey,
              altKey: event.altKey
            })
          ) {
            return;
          }

          var currentPage = resolveActivePage(window.location.pathname);
          var destinationPage = resolveActivePage(href);
          if (currentPage === destinationPage) {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
            return;
          }

          if (prefersReducedMotion) {
            return;
          }

          event.preventDefault();
          document.body.classList.add('is-leaving');
          window.setTimeout(function () {
            window.location.href = href;
          }, 160);
        });
      })(internalLinks[i]);
    }

    // Mobile UX: tactile tap feedback on fixed right-hand rail links
    var railLinks = document.querySelectorAll('.rail-link');
    for (var j = 0; j < railLinks.length; j++) {
      (function (railLink) {
        railLink.addEventListener('pointerdown', function () {
          railLink.classList.add('is-tapped');
        });
        railLink.addEventListener('pointerup', function () {
          railLink.classList.remove('is-tapped');
        });
        railLink.addEventListener('pointercancel', function () {
          railLink.classList.remove('is-tapped');
        });
        railLink.addEventListener('pointerleave', function () {
          railLink.classList.remove('is-tapped');
        });
      })(railLinks[j]);
    }

    // Mobile UX: hide side rail while scrolling or holding touch, pop back when screen stills
    var sideRail = document.querySelector('.side-rail-nav');
    if (sideRail) {
      var mobileMedia =
        typeof window.matchMedia === 'function'
          ? window.matchMedia('(max-width: 767px)')
          : null;
      var isScrolling = false;
      var isTouchHolding = false;
      var scrollSettleTimer = null;
      var touchSettleTimer = null;

      var updateRailVisibility = function () {
        var isMobile = mobileMedia ? mobileMedia.matches : window.innerWidth <= 767;
        var hide = shouldHideMobileRail({
          isMobileViewport: isMobile,
          isScrolling: isScrolling,
          isTouchHolding: isTouchHolding
        });
        if (hide) {
          sideRail.classList.add('is-hidden-rail');
        } else {
          sideRail.classList.remove('is-hidden-rail');
        }
      };

      window.addEventListener(
        'scroll',
        function () {
          var isMobile = mobileMedia ? mobileMedia.matches : window.innerWidth <= 767;
          if (!isMobile) {
            return;
          }
          isScrolling = true;
          updateRailVisibility();
          if (scrollSettleTimer !== null) {
            window.clearTimeout(scrollSettleTimer);
          }
          scrollSettleTimer = window.setTimeout(function () {
            isScrolling = false;
            scrollSettleTimer = null;
            updateRailVisibility();
          }, 260);
        },
        { passive: true }
      );

      document.addEventListener(
        'touchstart',
        function (event) {
          var isMobile = mobileMedia ? mobileMedia.matches : window.innerWidth <= 767;
          if (!isMobile) {
            return;
          }
          if (event.target && typeof event.target.closest === 'function' && event.target.closest('.side-rail-nav')) {
            return;
          }
          if (touchSettleTimer !== null) {
            window.clearTimeout(touchSettleTimer);
            touchSettleTimer = null;
          }
          isTouchHolding = true;
          updateRailVisibility();
        },
        { passive: true }
      );

      var releaseTouchHold = function () {
        if (!isTouchHolding) {
          return;
        }
        if (touchSettleTimer !== null) {
          window.clearTimeout(touchSettleTimer);
        }
        touchSettleTimer = window.setTimeout(function () {
          isTouchHolding = false;
          touchSettleTimer = null;
          updateRailVisibility();
        }, 160);
      };

      document.addEventListener('touchend', releaseTouchHold, { passive: true });
      document.addEventListener('touchcancel', releaseTouchHold, { passive: true });
      window.addEventListener('resize', updateRailVisibility, { passive: true });
    }

    // Resilient image fallback: reveal clean typographic placeholder if an asset fails
    var mediaImages = document.querySelectorAll('.media-frame img');
    for (var k = 0; k < mediaImages.length; k++) {
      (function (img) {
        img.addEventListener('error', function () {
          if (img.parentElement) {
            img.parentElement.classList.add('is-fallback');
          }
        });
        if (img.complete && img.naturalWidth === 0) {
          if (img.parentElement) {
            img.parentElement.classList.add('is-fallback');
          }
        }
      })(mediaImages[k]);
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initBrowserBehavior);
    } else {
      initBrowserBehavior();
    }
  }

  // Export pure helpers for Node unit tests when running outside the browser
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      resolveActivePage: resolveActivePage,
      shouldTransitionLink: shouldTransitionLink,
      syncActiveNavigation: syncActiveNavigation,
      shouldHideMobileRail: shouldHideMobileRail
    };
  } else {
    root.InechosApp = {
      resolveActivePage: resolveActivePage,
      shouldTransitionLink: shouldTransitionLink,
      shouldHideMobileRail: shouldHideMobileRail
    };
  }
})(typeof window !== 'undefined' ? window : globalThis);
