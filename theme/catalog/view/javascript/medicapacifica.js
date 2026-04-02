/**
 * Medica Pacifica - OpenCart Theme JavaScript
 * Healthcare B2B ecommerce theme for Medica Pacifica PTE Limited
 *
 * Brand Colors:
 *   Navy:        #0A2240
 *   Pacific Teal: #0891B2
 *   Coral Orange: #E86C47
 *
 * @version 1.0.0
 * @author  WebRedesigns
 */
var MedicaPacifica = (function () {
  'use strict';

  /* ---------------------------------------------------------------
   * Shared Utilities
   * ------------------------------------------------------------- */
  var Utils = {
    qs: function (sel, ctx) { return (ctx || document).querySelector(sel); },
    qsa: function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); },
    on: function (el, evt, fn, opts) { if (el) el.addEventListener(evt, fn, opts || false); },
    off: function (el, evt, fn, opts) { if (el) el.removeEventListener(evt, fn, opts || false); },
    addClass: function (el, c) { if (el) el.classList.add(c); },
    removeClass: function (el, c) { if (el) el.classList.remove(c); },
    toggleClass: function (el, c) { if (el) el.classList.toggle(c); },
    hasClass: function (el, c) { return el ? el.classList.contains(c) : false; },

    prefersReducedMotion: function () {
      return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    throttle: function (fn, wait) {
      var last = 0;
      return function () {
        var now = Date.now();
        if (now - last >= wait) {
          last = now;
          fn.apply(this, arguments);
        }
      };
    },

    debounce: function (fn, delay) {
      var timer;
      return function () {
        var ctx = this, args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
      };
    }
  };

  /* ---------------------------------------------------------------
   * 1. Mobile Navigation
   * ------------------------------------------------------------- */
  var MobileNav = {
    _els: {},

    init: function () {
      this._els.toggle = Utils.qs('[data-testid="mobile-nav-toggle"]');
      this._els.drawer = Utils.qs('[data-testid="mobile-nav-drawer"]');
      this._els.overlay = Utils.qs('[data-testid="mobile-nav-overlay"]');
      if (!this._els.toggle || !this._els.drawer) return;

      this._handleToggle = this.toggle.bind(this);
      this._handleClose = this.close.bind(this);
      this._handleKey = this._onKey.bind(this);

      Utils.on(this._els.toggle, 'click', this._handleToggle);
      if (this._els.overlay) Utils.on(this._els.overlay, 'click', this._handleClose);
      Utils.on(document, 'keydown', this._handleKey);
    },

    toggle: function () {
      var open = Utils.hasClass(this._els.drawer, 'is-open');
      open ? this.close() : this.open();
    },

    open: function () {
      Utils.addClass(this._els.drawer, 'is-open');
      if (this._els.overlay) Utils.addClass(this._els.overlay, 'is-visible');
      Utils.addClass(document.body, 'nav-open');
      this._els.toggle.setAttribute('aria-expanded', 'true');
    },

    close: function () {
      Utils.removeClass(this._els.drawer, 'is-open');
      if (this._els.overlay) Utils.removeClass(this._els.overlay, 'is-visible');
      Utils.removeClass(document.body, 'nav-open');
      this._els.toggle.setAttribute('aria-expanded', 'false');
    },

    _onKey: function (e) {
      if (e.key === 'Escape' && Utils.hasClass(this._els.drawer, 'is-open')) {
        this.close();
      }
    },

    destroy: function () {
      Utils.off(this._els.toggle, 'click', this._handleToggle);
      if (this._els.overlay) Utils.off(this._els.overlay, 'click', this._handleClose);
      Utils.off(document, 'keydown', this._handleKey);
    }
  };

  /* ---------------------------------------------------------------
   * 2. Mega Menu (Desktop)
   * ------------------------------------------------------------- */
  var MegaMenu = {
    _closeTimer: null,

    init: function () {
      var self = this;
      this._items = Utils.qsa('[data-mega-menu]');
      if (!this._items.length) return;

      this._items.forEach(function (item) {
        var panel = Utils.qs('.mega-menu__panel', item);
        if (!panel) return;

        Utils.on(item, 'mouseenter', function () {
          clearTimeout(self._closeTimer);
          self._closeAll();
          Utils.addClass(panel, 'is-visible');
          item.setAttribute('aria-expanded', 'true');
        });

        Utils.on(item, 'mouseleave', function () {
          self._closeTimer = setTimeout(function () {
            Utils.removeClass(panel, 'is-visible');
            item.setAttribute('aria-expanded', 'false');
          }, 200);
        });

        Utils.on(item, 'keydown', function (e) {
          self._handleKeyboard(e, item, panel);
        });
      });
    },

    _closeAll: function () {
      this._items.forEach(function (item) {
        var panel = Utils.qs('.mega-menu__panel', item);
        if (panel) {
          Utils.removeClass(panel, 'is-visible');
          item.setAttribute('aria-expanded', 'false');
        }
      });
    },

    _handleKeyboard: function (e, item, panel) {
      var links = Utils.qsa('a', panel);
      var idx = links.indexOf(document.activeElement);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (!Utils.hasClass(panel, 'is-visible')) {
            Utils.addClass(panel, 'is-visible');
            item.setAttribute('aria-expanded', 'true');
          }
          if (idx < links.length - 1) links[idx + 1].focus();
          else if (links.length) links[0].focus();
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (idx > 0) links[idx - 1].focus();
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (idx < links.length - 1) links[idx + 1].focus();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (idx > 0) links[idx - 1].focus();
          break;
        case 'Escape':
          Utils.removeClass(panel, 'is-visible');
          item.setAttribute('aria-expanded', 'false');
          Utils.qs('a', item).focus();
          break;
      }
    }
  };

  /* ---------------------------------------------------------------
   * 3. Sticky Header
   * ------------------------------------------------------------- */
  var StickyHeader = {
    _lastScroll: 0,
    _threshold: 100,

    init: function () {
      this._header = Utils.qs('[data-testid="site-header"]');
      if (!this._header) return;

      this._onScroll = Utils.throttle(this._update.bind(this), 16);
      Utils.on(window, 'scroll', this._onScroll, { passive: true });
    },

    _update: function () {
      var scrollY = window.pageYOffset || document.documentElement.scrollTop;

      if (scrollY > this._threshold) {
        Utils.addClass(this._header, 'header-sticky');
        if (scrollY > this._lastScroll) {
          Utils.addClass(this._header, 'header-hidden');
        } else {
          Utils.removeClass(this._header, 'header-hidden');
        }
      } else {
        Utils.removeClass(this._header, 'header-sticky');
        Utils.removeClass(this._header, 'header-hidden');
      }

      this._lastScroll = scrollY;
    },

    destroy: function () {
      Utils.off(window, 'scroll', this._onScroll);
    }
  };

  /* ---------------------------------------------------------------
   * 4. Search Enhancement
   * ------------------------------------------------------------- */
  var SearchEnhance = {
    init: function () {
      this._wrapper = Utils.qs('[data-testid="search-wrapper"]');
      this._toggle = Utils.qs('[data-testid="search-toggle"]');
      this._input = Utils.qs('[data-testid="search-input"]');
      if (!this._wrapper || !this._toggle || !this._input) return;

      this._handleToggle = this._expand.bind(this);
      this._handleKey = this._onKey.bind(this);
      this._handleOutside = this._onClickOutside.bind(this);

      Utils.on(this._toggle, 'click', this._handleToggle);
      Utils.on(this._input, 'keydown', this._handleKey);
      Utils.on(document, 'click', this._handleOutside);
    },

    _expand: function (e) {
      e.preventDefault();
      Utils.toggleClass(this._wrapper, 'search-expanded');
      if (Utils.hasClass(this._wrapper, 'search-expanded')) {
        this._input.focus();
      }
    },

    _onKey: function (e) {
      if (e.key === 'Escape') {
        Utils.removeClass(this._wrapper, 'search-expanded');
        this._toggle.focus();
      }
    },

    _onClickOutside: function (e) {
      if (!this._wrapper.contains(e.target)) {
        Utils.removeClass(this._wrapper, 'search-expanded');
      }
    },

    destroy: function () {
      Utils.off(this._toggle, 'click', this._handleToggle);
      Utils.off(this._input, 'keydown', this._handleKey);
      Utils.off(document, 'click', this._handleOutside);
    }
  };

  /* ---------------------------------------------------------------
   * 5. Product Grid / List Toggle
   * ------------------------------------------------------------- */
  var ViewToggle = {
    _storageKey: 'mp_view_pref',

    init: function () {
      this._container = Utils.qs('[data-testid="product-listing"]');
      this._btnGrid = Utils.qs('[data-testid="view-grid"]');
      this._btnList = Utils.qs('[data-testid="view-list"]');
      if (!this._container || !this._btnGrid || !this._btnList) return;

      var saved = localStorage.getItem(this._storageKey);
      if (saved) this._apply(saved);

      Utils.on(this._btnGrid, 'click', this._setView.bind(this, 'grid'));
      Utils.on(this._btnList, 'click', this._setView.bind(this, 'list'));
    },

    _setView: function (mode) {
      localStorage.setItem(this._storageKey, mode);
      this._apply(mode);
    },

    _apply: function (mode) {
      Utils.addClass(this._container, 'view-transitioning');
      var self = this;
      requestAnimationFrame(function () {
        self._container.setAttribute('data-view', mode);
        Utils.toggleClass(self._btnGrid, 'is-active');
        Utils.toggleClass(self._btnList, 'is-active');
        if (mode === 'grid') {
          Utils.addClass(self._btnGrid, 'is-active');
          Utils.removeClass(self._btnList, 'is-active');
        } else {
          Utils.addClass(self._btnList, 'is-active');
          Utils.removeClass(self._btnGrid, 'is-active');
        }
        setTimeout(function () {
          Utils.removeClass(self._container, 'view-transitioning');
        }, 300);
      });
    }
  };

  /* ---------------------------------------------------------------
   * 6. Product Image Gallery
   * ------------------------------------------------------------- */
  var Gallery = {
    _current: 0,
    _images: [],

    init: function () {
      this._main = Utils.qs('[data-testid="gallery-main"]');
      this._thumbs = Utils.qsa('[data-testid="gallery-thumb"]');
      if (!this._main || !this._thumbs.length) return;

      this._images = this._thumbs.map(function (t) { return t.getAttribute('data-full'); });
      this._zoomWrap = Utils.qs('[data-testid="gallery-zoom"]');

      var self = this;
      this._thumbs.forEach(function (thumb, i) {
        Utils.on(thumb, 'click', function () { self._swapImage(i); });
      });

      Utils.on(this._main, 'click', function () { self._openLightbox(self._current); });

      if (this._zoomWrap) {
        Utils.on(this._main, 'mousemove', this._handleZoom.bind(this));
        Utils.on(this._main, 'mouseleave', this._resetZoom.bind(this));
      }
    },

    _swapImage: function (idx) {
      this._current = idx;
      Utils.addClass(this._main, 'gallery-fade');
      var self = this;
      setTimeout(function () {
        self._main.src = self._images[idx];
        Utils.removeClass(self._main, 'gallery-fade');
      }, 200);
      this._thumbs.forEach(function (t, i) {
        t.classList.toggle('is-active', i === idx);
      });
    },

    _handleZoom: function (e) {
      if (!this._zoomWrap) return;
      var rect = this._main.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width) * 100;
      var y = ((e.clientY - rect.top) / rect.height) * 100;
      this._zoomWrap.style.backgroundPosition = x + '% ' + y + '%';
      this._zoomWrap.style.backgroundImage = 'url(' + this._images[this._current] + ')';
      Utils.addClass(this._zoomWrap, 'is-zooming');
    },

    _resetZoom: function () {
      if (this._zoomWrap) Utils.removeClass(this._zoomWrap, 'is-zooming');
    },

    /* Lightbox */
    _openLightbox: function (idx) {
      this._current = idx;
      var overlay = document.createElement('div');
      overlay.className = 'lightbox';
      overlay.setAttribute('data-testid', 'lightbox');
      overlay.innerHTML =
        '<div class="lightbox__inner">' +
          '<button class="lightbox__close" data-testid="lightbox-close" aria-label="Close">&times;</button>' +
          '<button class="lightbox__prev" data-testid="lightbox-prev" aria-label="Previous">&lsaquo;</button>' +
          '<img class="lightbox__img" src="' + this._images[idx] + '" alt="">' +
          '<button class="lightbox__next" data-testid="lightbox-next" aria-label="Next">&rsaquo;</button>' +
        '</div>';

      document.body.appendChild(overlay);
      Utils.addClass(document.body, 'lightbox-open');

      var self = this;
      this._lbOverlay = overlay;
      this._lbImg = Utils.qs('.lightbox__img', overlay);

      Utils.on(Utils.qs('.lightbox__close', overlay), 'click', function () { self._closeLightbox(); });
      Utils.on(Utils.qs('.lightbox__prev', overlay), 'click', function () { self._lbNav(-1); });
      Utils.on(Utils.qs('.lightbox__next', overlay), 'click', function () { self._lbNav(1); });
      Utils.on(overlay, 'click', function (e) {
        if (e.target === overlay) self._closeLightbox();
      });

      this._lbKeyHandler = function (e) {
        if (e.key === 'Escape') self._closeLightbox();
        if (e.key === 'ArrowLeft') self._lbNav(-1);
        if (e.key === 'ArrowRight') self._lbNav(1);
      };
      Utils.on(document, 'keydown', this._lbKeyHandler);

      /* Touch swipe */
      var startX = 0;
      Utils.on(overlay, 'touchstart', function (e) {
        startX = e.changedTouches[0].clientX;
      }, { passive: true });
      Utils.on(overlay, 'touchend', function (e) {
        var diff = e.changedTouches[0].clientX - startX;
        if (Math.abs(diff) > 50) {
          self._lbNav(diff < 0 ? 1 : -1);
        }
      }, { passive: true });
    },

    _lbNav: function (dir) {
      this._current = (this._current + dir + this._images.length) % this._images.length;
      if (this._lbImg) this._lbImg.src = this._images[this._current];
    },

    _closeLightbox: function () {
      if (this._lbOverlay) {
        document.body.removeChild(this._lbOverlay);
        this._lbOverlay = null;
      }
      Utils.removeClass(document.body, 'lightbox-open');
      Utils.off(document, 'keydown', this._lbKeyHandler);
    }
  };

  /* ---------------------------------------------------------------
   * 7. Quantity Selector
   * ------------------------------------------------------------- */
  var QuantitySelector = {
    init: function () {
      var self = this;
      Utils.qsa('[data-testid="qty-wrapper"]').forEach(function (wrap) {
        var input = Utils.qs('input', wrap);
        var btnMinus = Utils.qs('[data-qty="minus"]', wrap);
        var btnPlus = Utils.qs('[data-qty="plus"]', wrap);
        if (!input) return;

        var min = parseInt(input.getAttribute('min'), 10) || 1;
        var max = parseInt(input.getAttribute('max'), 10) || 9999;

        Utils.on(btnMinus, 'click', function () { self._step(input, -1, min, max); });
        Utils.on(btnPlus, 'click', function () { self._step(input, 1, min, max); });
        Utils.on(input, 'change', function () { self._clamp(input, min, max); });
      });
    },

    _step: function (input, dir, min, max) {
      var val = parseInt(input.value, 10) || min;
      val = Math.min(Math.max(val + dir, min), max);
      input.value = val;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      this._ajaxUpdateCart(input);
    },

    _clamp: function (input, min, max) {
      var val = parseInt(input.value, 10);
      if (isNaN(val) || val < min) input.value = min;
      else if (val > max) input.value = max;
    },

    _ajaxUpdateCart: function (input) {
      if (!document.body.classList.contains('page-cart')) return;
      var key = input.getAttribute('data-cart-key');
      if (!key) return;

      var formData = new FormData();
      formData.append('quantity', input.value);

      fetch('index.php?route=checkout/cart.edit&key=' + encodeURIComponent(key), {
        method: 'POST',
        body: formData
      }).then(function (res) { return res.json(); })
        .then(function () {
          /* Refresh mini-cart totals */
          CartDropdown.refresh();
        })
        .catch(function () {
          Toast.show('Could not update cart. Please try again.', 'error');
        });
    }
  };

  /* ---------------------------------------------------------------
   * 8. Product Tabs
   * ------------------------------------------------------------- */
  var ProductTabs = {
    init: function () {
      this._wrapper = Utils.qs('[data-testid="product-tabs"]');
      if (!this._wrapper) return;

      this._tabs = Utils.qsa('[data-tab]', this._wrapper);
      this._panels = Utils.qsa('[data-tab-panel]', this._wrapper);

      var self = this;
      this._tabs.forEach(function (tab) {
        Utils.on(tab, 'click', function (e) {
          e.preventDefault();
          self._activate(tab.getAttribute('data-tab'));
        });
      });

      /* Deep link from hash */
      var hash = window.location.hash.replace('#', '');
      if (hash) this._activate(hash);
    },

    _activate: function (id) {
      this._tabs.forEach(function (t) {
        t.classList.toggle('is-active', t.getAttribute('data-tab') === id);
        t.setAttribute('aria-selected', t.getAttribute('data-tab') === id ? 'true' : 'false');
      });
      this._panels.forEach(function (p) {
        var match = p.getAttribute('data-tab-panel') === id;
        p.classList.toggle('is-active', match);
        if (match) {
          Utils.addClass(p, 'tab-enter');
          setTimeout(function () { Utils.removeClass(p, 'tab-enter'); }, 300);
        }
      });
      if (history.replaceState) {
        history.replaceState(null, '', '#' + id);
      }
    }
  };

  /* ---------------------------------------------------------------
   * 9. Scroll Reveal Animations
   * ------------------------------------------------------------- */
  var ScrollReveal = {
    init: function () {
      if (Utils.prefersReducedMotion()) return;
      if (!('IntersectionObserver' in window)) return;

      this._elements = Utils.qsa('[data-reveal]');
      if (!this._elements.length) return;

      this._observer = new IntersectionObserver(this._onIntersect.bind(this), {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px'
      });

      var self = this;
      this._elements.forEach(function (el) {
        Utils.addClass(el, 'reveal-hidden');
        self._observer.observe(el);
      });
    },

    _onIntersect: function (entries) {
      var self = this;
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          Utils.addClass(entry.target, 'reveal-visible');
          Utils.removeClass(entry.target, 'reveal-hidden');
          self._observer.unobserve(entry.target);
        }
      });
    },

    destroy: function () {
      if (this._observer) this._observer.disconnect();
    }
  };

  /* ---------------------------------------------------------------
   * 10. Back to Top Button
   * ------------------------------------------------------------- */
  var BackToTop = {
    _threshold: 500,

    init: function () {
      this._btn = Utils.qs('[data-testid="back-to-top"]');
      if (!this._btn) return;

      this._onScroll = Utils.throttle(this._toggle.bind(this), 100);
      Utils.on(window, 'scroll', this._onScroll, { passive: true });
      Utils.on(this._btn, 'click', this._scrollTop.bind(this));
    },

    _toggle: function () {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      this._btn.classList.toggle('is-visible', y > this._threshold);
    },

    _scrollTop: function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    destroy: function () {
      Utils.off(window, 'scroll', this._onScroll);
    }
  };

  /* ---------------------------------------------------------------
   * 11. Newsletter Form (AJAX)
   * ------------------------------------------------------------- */
  var Newsletter = {
    init: function () {
      this._form = Utils.qs('[data-testid="newsletter-form"]');
      if (!this._form) return;

      this._handleSubmit = this._submit.bind(this);
      Utils.on(this._form, 'submit', this._handleSubmit);
    },

    _submit: function (e) {
      e.preventDefault();
      var form = this._form;
      var emailInput = Utils.qs('input[type="email"]', form);
      var btn = Utils.qs('button[type="submit"]', form);
      if (!emailInput || !emailInput.value) return;

      Utils.addClass(btn, 'is-loading');
      btn.disabled = true;

      var formData = new FormData();
      formData.append('email', emailInput.value);

      fetch('index.php?route=mail/newsletter.subscribe', {
        method: 'POST',
        body: formData
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data.error) {
            Toast.show(data.error, 'error');
          } else {
            Toast.show('Thank you for subscribing!', 'success');
            emailInput.value = '';
          }
        })
        .catch(function () {
          Toast.show('Subscription failed. Please try again.', 'error');
        })
        .finally(function () {
          Utils.removeClass(btn, 'is-loading');
          btn.disabled = false;
        });
    },

    destroy: function () {
      Utils.off(this._form, 'submit', this._handleSubmit);
    }
  };

  /* ---------------------------------------------------------------
   * 12. Currency Selector
   * ------------------------------------------------------------- */
  var CurrencySelector = {
    init: function () {
      this._wrapper = Utils.qs('[data-testid="currency-selector"]');
      if (!this._wrapper) return;

      var self = this;
      Utils.qsa('[data-currency]', this._wrapper).forEach(function (item) {
        Utils.on(item, 'click', function (e) {
          e.preventDefault();
          self._switch(item.getAttribute('data-currency'));
        });
      });
    },

    _switch: function (code) {
      var formData = new FormData();
      formData.append('code', code);

      fetch('index.php?route=localisation/currency.save', {
        method: 'POST',
        body: formData
      })
        .then(function () { window.location.reload(); })
        .catch(function () {
          Toast.show('Currency change failed. Please try again.', 'error');
        });
    }
  };

  /* ---------------------------------------------------------------
   * 13. Cart Dropdown (Mini-Cart)
   * ------------------------------------------------------------- */
  var CartDropdown = {
    _open: false,

    init: function () {
      this._trigger = Utils.qs('[data-testid="cart-trigger"]');
      this._dropdown = Utils.qs('[data-testid="cart-dropdown"]');
      if (!this._trigger || !this._dropdown) return;

      var self = this;
      var isMobile = window.matchMedia('(max-width: 767px)').matches;

      if (isMobile) {
        Utils.on(this._trigger, 'click', function (e) {
          e.preventDefault();
          self._toggle();
        });
      } else {
        Utils.on(this._trigger, 'mouseenter', function () { self._show(); });
        Utils.on(this._trigger.parentElement, 'mouseleave', function () { self._hide(); });
        Utils.on(this._trigger, 'click', function (e) {
          e.preventDefault();
          self._toggle();
        });
      }

      Utils.on(document, 'click', function (e) {
        if (self._open && !self._trigger.parentElement.contains(e.target)) {
          self._hide();
        }
      });
    },

    _toggle: function () { this._open ? this._hide() : this._show(); },

    _show: function () {
      Utils.addClass(this._dropdown, 'is-visible');
      this._open = true;
      this.refresh();
    },

    _hide: function () {
      Utils.removeClass(this._dropdown, 'is-visible');
      this._open = false;
    },

    refresh: function () {
      var self = this;
      fetch('index.php?route=common/cart.info')
        .then(function (res) { return res.text(); })
        .then(function (html) {
          var content = Utils.qs('.cart-dropdown__content', self._dropdown);
          if (content) content.innerHTML = html;
        })
        .catch(function () { /* silent fail for mini-cart refresh */ });
    }
  };

  /* ---------------------------------------------------------------
   * 14. Toast Notifications
   * ------------------------------------------------------------- */
  var Toast = {
    _container: null,
    _queue: [],
    _maxVisible: 5,

    init: function () {
      this._container = document.createElement('div');
      this._container.className = 'toast-container';
      this._container.setAttribute('data-testid', 'toast-container');
      this._container.setAttribute('aria-live', 'polite');
      document.body.appendChild(this._container);
    },

    /**
     * @param {string} message
     * @param {'success'|'error'|'info'} type
     */
    show: function (message, type) {
      type = type || 'info';
      if (!this._container) this.init();

      var toast = document.createElement('div');
      toast.className = 'toast toast--' + type;
      toast.setAttribute('role', 'status');
      toast.textContent = message;

      Utils.on(toast, 'click', function () { this._dismiss(toast); }.bind(this));
      this._container.appendChild(toast);

      /* Trigger reflow for animation */
      toast.offsetHeight; // eslint-disable-line no-unused-expressions
      Utils.addClass(toast, 'toast--visible');

      var self = this;
      var timer = setTimeout(function () { self._dismiss(toast); }, 4000);
      toast._timer = timer;

      /* Trim queue */
      var visible = Utils.qsa('.toast', this._container);
      if (visible.length > this._maxVisible) {
        this._dismiss(visible[0]);
      }
    },

    _dismiss: function (toast) {
      if (!toast || !toast.parentNode) return;
      clearTimeout(toast._timer);
      Utils.addClass(toast, 'toast--exiting');
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    },

    destroy: function () {
      if (this._container && this._container.parentNode) {
        this._container.parentNode.removeChild(this._container);
      }
    }
  };

  /* ---------------------------------------------------------------
   * 15. Lazy Loading Images
   * ------------------------------------------------------------- */
  var LazyLoad = {
    init: function () {
      if (!('IntersectionObserver' in window)) {
        this._fallback();
        return;
      }

      this._images = Utils.qsa('img[data-src]');
      if (!this._images.length) return;

      this._observer = new IntersectionObserver(this._onIntersect.bind(this), {
        rootMargin: '200px 0px'
      });

      var self = this;
      this._images.forEach(function (img) { self._observer.observe(img); });
    },

    _onIntersect: function (entries) {
      var self = this;
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var img = entry.target;
          img.src = img.getAttribute('data-src');
          var srcset = img.getAttribute('data-srcset');
          if (srcset) img.srcset = srcset;
          img.removeAttribute('data-src');
          img.removeAttribute('data-srcset');
          self._observer.unobserve(img);
        }
      });
    },

    _fallback: function () {
      Utils.qsa('img[data-src]').forEach(function (img) {
        img.src = img.getAttribute('data-src');
        img.removeAttribute('data-src');
      });
    },

    destroy: function () {
      if (this._observer) this._observer.disconnect();
    }
  };

  /* ---------------------------------------------------------------
   * 16. Smooth Scroll for Anchor Links
   * ------------------------------------------------------------- */
  var SmoothScroll = {
    init: function () {
      Utils.on(document, 'click', function (e) {
        var link = e.target.closest('a[href^="#"]');
        if (!link) return;
        var hash = link.getAttribute('href');
        if (hash.length <= 1) return;

        var target = Utils.qs(hash);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          if (history.pushState) history.pushState(null, '', hash);
        }
      });
    }
  };

  /* ---------------------------------------------------------------
   * 17. Form Validation Enhancement
   * ------------------------------------------------------------- */
  var FormValidation = {
    init: function () {
      var forms = Utils.qsa('form[data-validate]');
      forms.forEach(function (form) {
        var inputs = Utils.qsa('input, textarea, select', form);
        inputs.forEach(function (input) {
          Utils.on(input, 'input', FormValidation._check);
          Utils.on(input, 'blur', FormValidation._check);
        });
      });
    },

    _check: function () {
      var el = this; // `this` is the input element
      if (el.validity.valid) {
        Utils.removeClass(el, 'is-invalid');
        Utils.addClass(el, 'is-valid');
      } else {
        Utils.removeClass(el, 'is-valid');
        Utils.addClass(el, 'is-invalid');
      }

      /* Update adjacent message element if present */
      var msg = el.parentElement && el.parentElement.querySelector('.field-message');
      if (msg) {
        msg.textContent = el.validationMessage || '';
      }
    }
  };

  /* ---------------------------------------------------------------
   * 18. Cookie Consent Banner
   * ------------------------------------------------------------- */
  var CookieConsent = {
    _storageKey: 'mp_cookie_consent',

    init: function () {
      if (localStorage.getItem(this._storageKey)) return;

      this._banner = Utils.qs('[data-testid="cookie-banner"]');
      if (!this._banner) return;

      Utils.addClass(this._banner, 'is-visible');

      var acceptBtn = Utils.qs('[data-testid="cookie-accept"]', this._banner);
      if (acceptBtn) {
        Utils.on(acceptBtn, 'click', this._accept.bind(this));
      }
    },

    _accept: function () {
      localStorage.setItem(this._storageKey, '1');
      Utils.removeClass(this._banner, 'is-visible');
    }
  };

  /* ---------------------------------------------------------------
   * 19. Print Support
   * ------------------------------------------------------------- */
  var PrintPage = {
    init: function () {
      var btn = Utils.qs('[data-testid="print-product"]');
      if (!btn) return;
      Utils.on(btn, 'click', function (e) {
        e.preventDefault();
        window.print();
      });
    }
  };

  /* ---------------------------------------------------------------
   * Public API & Initialization
   * ------------------------------------------------------------- */
  function init() {
    MobileNav.init();
    MegaMenu.init();
    StickyHeader.init();
    SearchEnhance.init();
    ViewToggle.init();
    Gallery.init();
    QuantitySelector.init();
    ProductTabs.init();
    ScrollReveal.init();
    BackToTop.init();
    Newsletter.init();
    CurrencySelector.init();
    CartDropdown.init();
    Toast.init();
    LazyLoad.init();
    SmoothScroll.init();
    FormValidation.init();
    CookieConsent.init();
    PrintPage.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Expose public interface */
  return {
    Toast: Toast,
    CartDropdown: CartDropdown,
    Gallery: Gallery,
    init: init
  };

})();
