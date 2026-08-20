(function (root, factory) {
  "use strict";

  var Keybrew = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = Keybrew;
  }

  if (root) {
    root.Keybrew = Keybrew;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var VERSION = "1.0.0";
  var instanceCount = 0;

  var KEYS = Object.freeze({
    BACKSPACE: "{backspace}",
    CLOSE: "{close}",
    HEBREW: "{hebrew}",
    NIQQUD: "{niqqud}",
    NUMBERS: "{numbers}",
    SPACE: "{space}",
    SYMBOLS: "{symbols}"
  });

  var HEBREW_ROWS = Object.freeze([
    Object.freeze(["ק", "ר", "א", "ט", "ו", "ן", "ם", "פ", "'"]),
    Object.freeze(["ש", "ד", "ג", "כ", "ע", "י", "ח", "ל", "ך", "ף", "\""]),
    Object.freeze(["ז", "ס", "ב", "ה", "נ", "מ", "צ", "ת", "ץ"])
  ]);

  var NIQQUD_ROWS = Object.freeze([
    Object.freeze(["\u05b0", "\u05b1", "\u05b2", "\u05b3", "\u05b4", "\u05b5", "\u05b6"]),
    Object.freeze(["\u05b7", "\u05b8", "\u05b9", "\u05bb", "\u05bc", "\u05c1", "\u05c2"])
  ]);

  var NUMBER_ROWS = Object.freeze([
    Object.freeze(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]),
    Object.freeze(["-", "/", ":", ";", "(", ")", "$", "&", "@", "."])
  ]);

  var SYMBOL_ROWS = Object.freeze([
    Object.freeze(["[", "]", "{", "}", "#", "%", "^", "*", "+", "="]),
    Object.freeze(["_", "\\", "|", "~", "<", ">", "€", "₪", "!", "?"]),
    Object.freeze([",", ".", "…", "–", "—", "׳", "״"])
  ]);

  var HEBREW_KEY_NAMES = Object.freeze({
    "א": "Alef, א",
    "ב": "Bet, ב",
    "ג": "Gimel, ג",
    "ד": "Dalet, ד",
    "ה": "He, ה",
    "ו": "Vav, ו",
    "ז": "Zayin, ז",
    "ח": "Het, ח",
    "ט": "Tet, ט",
    "י": "Yod, י",
    "כ": "Kaf, כ",
    "ך": "Final Kaf, ך",
    "ל": "Lamed, ל",
    "מ": "Mem, מ",
    "ם": "Final Mem, ם",
    "נ": "Nun, נ",
    "ן": "Final Nun, ן",
    "ס": "Samekh, ס",
    "ע": "Ayin, ע",
    "פ": "Pe, פ",
    "ף": "Final Pe, ף",
    "צ": "Tsadi, צ",
    "ץ": "Final Tsadi, ץ",
    "ק": "Qof, ק",
    "ר": "Resh, ר",
    "ש": "Shin, ש",
    "ת": "Tav, ת"
  });

  var NIQQUD_KEY_NAMES = Object.freeze({
    "\u05b0": "Sheva",
    "\u05b1": "Hataf Segol",
    "\u05b2": "Hataf Patah",
    "\u05b3": "Hataf Qamats",
    "\u05b4": "Hiriq",
    "\u05b5": "Tsere",
    "\u05b6": "Segol",
    "\u05b7": "Patah",
    "\u05b8": "Qamats",
    "\u05b9": "Holam",
    "\u05bb": "Qubuts",
    "\u05bc": "Dagesh or Mapiq",
    "\u05c1": "Shin dot",
    "\u05c2": "Sin dot"
  });

  var DEFAULT_LABELS = Object.freeze({
    keyboard: "Hebrew keyboard",
    title: "עברית",
    close: "Close Hebrew keyboard",
    backspace: "Backspace",
    space: "Space",
    hebrew: "Hebrew letters",
    niqqud: "Niqqud",
    numbers: "Numbers",
    symbols: "Symbols",
    opened: "Hebrew keyboard opened",
    closed: "Hebrew keyboard closed"
  });

  var DEFAULTS = Object.freeze({
    enabledOn: "both",
    suppressNativeKeyboard: true,
    openOn: "focus",
    position: "floating",
    placement: "auto",
    align: "center",
    gap: 8,
    viewportPadding: 8,
    minWidth: 300,
    maxWidth: 440,
    scrollIntoView: true,
    scrollBehavior: "smooth",
    setDirection: true,
    includeNiqqud: false,
    includeNumbers: false,
    includeSymbols: false,
    observe: false,
    inlineContainer: null,
    deviceMatcher: null,
    labels: DEFAULT_LABELS,
    keyLabels: null,
    onOpen: null,
    onClose: null,
    onInput: null,
    onKeyPress: null,
    onLayoutChange: null
  });

  function own(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  function mergeOptions(current, next) {
    var merged = Object.assign({}, current || DEFAULTS, next || {});
    merged.labels = Object.assign({}, (current && current.labels) || DEFAULT_LABELS, (next && next.labels) || {});
    merged.keyLabels = Object.assign({}, (current && current.keyLabels) || {}, (next && next.keyLabels) || {});
    return merged;
  }

  function assertOption(value, allowed, name) {
    if (allowed.indexOf(value) === -1) {
      throw new TypeError("Keybrew: " + name + " must be one of: " + allowed.join(", ") + ".");
    }
  }

  function isTextControl(element) {
    if (!element || !element.tagName) return false;
    var tag = element.tagName.toLowerCase();
    if (tag === "textarea") return true;
    if (tag !== "input") return false;
    var type = (element.getAttribute("type") || "text").toLowerCase();
    return ["text", "search", "tel", "url", "email", "password"].indexOf(type) !== -1;
  }

  function toArray(targets, doc) {
    if (!targets) return [];
    if (typeof targets === "string") return Array.prototype.slice.call(doc.querySelectorAll(targets));
    if (isTextControl(targets)) return [targets];
    if (typeof targets.length === "number") return Array.prototype.slice.call(targets);
    if (typeof targets[Symbol.iterator] === "function") return Array.from(targets);
    return [];
  }

  function rememberAttribute(element, name) {
    return {
      present: element.hasAttribute(name),
      value: element.getAttribute(name)
    };
  }

  function restoreAttribute(element, name, saved) {
    if (saved.present) element.setAttribute(name, saved.value);
    else element.removeAttribute(name);
  }

  function previousCodePointIndex(value, index) {
    if (index <= 0) return 0;
    var previous = value.charCodeAt(index - 1);
    if (previous >= 0xdc00 && previous <= 0xdfff && index > 1) {
      var lead = value.charCodeAt(index - 2);
      if (lead >= 0xd800 && lead <= 0xdbff) return index - 2;
    }
    return index - 1;
  }

  function setNativeValue(element, value, win) {
    var prototype = element.tagName.toLowerCase() === "textarea"
      ? win.HTMLTextAreaElement && win.HTMLTextAreaElement.prototype
      : win.HTMLInputElement && win.HTMLInputElement.prototype;
    var descriptor = prototype && Object.getOwnPropertyDescriptor(prototype, "value");

    if (descriptor && descriptor.set) descriptor.set.call(element, value);
    else element.value = value;
  }

  function createInputEvent(win, type, detail, cancelable) {
    try {
      return new win.InputEvent(type, {
        bubbles: true,
        cancelable: Boolean(cancelable),
        composed: true,
        data: detail.data,
        inputType: detail.inputType
      });
    } catch (error) {
      var event = new win.Event(type, {
        bubbles: true,
        cancelable: Boolean(cancelable),
        composed: true
      });
      return event;
    }
  }

  function clamp(value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), maximum);
  }

  function isTouchFirst(win) {
    if (!win) return false;
    var coarse = Boolean(win.matchMedia && win.matchMedia("(pointer: coarse)").matches);
    var touchPoints = win.navigator && Number(win.navigator.maxTouchPoints || 0);
    var compactTouch = touchPoints > 0 && (!win.matchMedia || win.matchMedia("(max-width: 1024px)").matches);
    return coarse || compactTouch;
  }

  function modeRows(mode) {
    if (mode === "niqqud") return NIQQUD_ROWS;
    if (mode === "numbers") return NUMBER_ROWS;
    if (mode === "symbols") return SYMBOL_ROWS;
    return HEBREW_ROWS;
  }

  function Keybrew(targets, options) {
    if (!(this instanceof Keybrew)) return new Keybrew(targets, options);

    this.options = mergeOptions(DEFAULTS, options);
    this._validateOptions();
    this.document = (options && options.document) || (typeof document !== "undefined" ? document : null);

    if (!this.document) {
      throw new Error("Keybrew: a browser document is required to create a keyboard.");
    }

    this.window = this.document.defaultView || (typeof window !== "undefined" ? window : null);
    this.id = "keybrew-" + (++instanceCount);
    this.inputs = new Set();
    this._inputMeta = new Map();
    this._selector = typeof targets === "string" ? targets : null;
    this._activeInput = null;
    this._mode = "hebrew";
    this._isOpen = false;
    this._destroyed = false;
    this._pendingInputDetail = null;
    this._positionFrame = null;
    this._didAutoScroll = false;
    this._suppressFocusInput = null;
    this._returnFocus = null;
    this._observer = null;
    this._resizeObserver = null;

    this._build();
    this._bindGlobalEvents();
    this.attach(targets);
    this._configureObserver();
  }

  Keybrew.prototype._validateOptions = function () {
    assertOption(this.options.enabledOn, ["mobile", "desktop", "both"], "enabledOn");
    assertOption(this.options.openOn, ["focus", "manual"], "openOn");
    assertOption(this.options.position, ["floating", "inline"], "position");
    assertOption(this.options.placement, ["auto", "below", "above"], "placement");
    assertOption(this.options.align, ["left", "center", "right"], "align");
    assertOption(this.options.scrollBehavior, ["auto", "smooth"], "scrollBehavior");
    if (typeof this.options.suppressNativeKeyboard !== "boolean" && this.options.suppressNativeKeyboard !== "while-open") {
      throw new TypeError('Keybrew: suppressNativeKeyboard must be true, false, or "while-open".');
    }
  };

  Keybrew.prototype._build = function () {
    var doc = this.document;
    var root = doc.createElement("div");
    root.id = this.id;
    root.className = "keybrew";
    root.hidden = true;
    root.dir = "rtl";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-label", this.options.labels.keyboard);
    root.setAttribute("data-keybrew-root", "");

    var header = doc.createElement("div");
    header.className = "keybrew__header";

    var title = doc.createElement("span");
    title.className = "keybrew__title";
    title.lang = "he";
    title.textContent = this.options.labels.title;

    var close = doc.createElement("button");
    close.type = "button";
    close.className = "keybrew__close";
    close.setAttribute("data-key", KEYS.CLOSE);
    close.setAttribute("aria-label", this.options.labels.close);
    close.textContent = "×";

    var grid = doc.createElement("div");
    grid.className = "keybrew__grid";
    grid.setAttribute("role", "group");
    grid.setAttribute("aria-label", this.options.labels.keyboard);

    var live = doc.createElement("span");
    live.className = "keybrew__sr-only";
    live.setAttribute("aria-live", "polite");
    live.setAttribute("aria-atomic", "true");

    header.appendChild(title);
    header.appendChild(close);
    root.appendChild(header);
    root.appendChild(grid);
    root.appendChild(live);

    this.root = root;
    this._title = title;
    this._closeButton = close;
    this._grid = grid;
    this._live = live;

    (doc.body || doc.documentElement).appendChild(root);
    this._render();
  };

  Keybrew.prototype._bindGlobalEvents = function () {
    var self = this;

    this._onRootPointerDown = function (event) {
      var button = event.target.closest && event.target.closest("button[data-key]");
      if (button && self.root.contains(button)) event.preventDefault();
    };

    this._onRootClick = function (event) {
      var button = event.target.closest && event.target.closest("button[data-key]");
      if (!button || !self.root.contains(button)) return;
      self._activateKey(button.getAttribute("data-key"), event, button);
    };

    this._onRootKeyDown = function (event) {
      if (event.key === "Escape") {
        event.preventDefault();
        self.close("escape", true);
        return;
      }
      self._moveKeyFocus(event);
    };

    this._onDocumentPointerDown = function (event) {
      if (!self._isOpen) return;
      if (self.root.contains(event.target)) return;
      if (self.inputs.has(event.target)) return;
      self.close("outside", false);
    };

    this._onDocumentKeyDown = function (event) {
      if (self._isOpen && event.key === "Escape" && !self.root.contains(event.target)) {
        event.preventDefault();
        self.close("escape", true);
      }
    };

    this._onViewportChange = function () {
      self._syncInputAttributes();
      self._schedulePosition();
    };

    this.root.addEventListener("pointerdown", this._onRootPointerDown);
    this.root.addEventListener("click", this._onRootClick);
    this.root.addEventListener("keydown", this._onRootKeyDown);
    this.document.addEventListener("pointerdown", this._onDocumentPointerDown, true);
    this.document.addEventListener("keydown", this._onDocumentKeyDown);

    if (this.window) {
      this.window.addEventListener("resize", this._onViewportChange);
      this.window.addEventListener("scroll", this._onViewportChange, true);
      if (this.window.visualViewport) {
        this.window.visualViewport.addEventListener("resize", this._onViewportChange);
        this.window.visualViewport.addEventListener("scroll", this._onViewportChange);
      }
      if (this.window.ResizeObserver) {
        this._resizeObserver = new this.window.ResizeObserver(function () {
          self._schedulePosition();
        });
      }
    }
  };

  Keybrew.prototype.attach = function (targets) {
    var self = this;
    toArray(targets, this.document).forEach(function (input) {
      if (!isTextControl(input) || self.inputs.has(input)) return;

      var meta = {
        attributes: {
          inputmode: rememberAttribute(input, "inputmode"),
          dir: rememberAttribute(input, "dir"),
          controls: rememberAttribute(input, "aria-controls"),
          expanded: rememberAttribute(input, "aria-expanded"),
          popup: rememberAttribute(input, "aria-haspopup")
        }
      };

      meta.onFocus = function () {
        if (self._suppressFocusInput === input) {
          self._suppressFocusInput = null;
          return;
        }
        if (self.options.openOn === "focus") self.open(input);
      };
      meta.onClick = function () {
        if (self.options.openOn === "focus") self.open(input);
      };
      meta.onInput = function (event) { self._handleNativeInput(input, event); };

      input.addEventListener("focus", meta.onFocus);
      input.addEventListener("click", meta.onClick);
      input.addEventListener("input", meta.onInput);
      input.setAttribute("aria-controls", self.id);
      input.setAttribute("aria-expanded", "false");
      input.setAttribute("aria-haspopup", "dialog");
      if (self.options.setDirection && !input.hasAttribute("dir")) input.setAttribute("dir", "rtl");

      self.inputs.add(input);
      self._inputMeta.set(input, meta);
      self._syncOneInput(input);
    });

    return this;
  };

  Keybrew.prototype.detach = function (targets) {
    var self = this;
    var list = targets ? toArray(targets, this.document) : Array.from(this.inputs);

    list.forEach(function (input) {
      var meta = self._inputMeta.get(input);
      if (!meta) return;
      if (self._activeInput === input) self.close("detach", false);

      input.removeEventListener("focus", meta.onFocus);
      input.removeEventListener("click", meta.onClick);
      input.removeEventListener("input", meta.onInput);
      restoreAttribute(input, "inputmode", meta.attributes.inputmode);
      restoreAttribute(input, "dir", meta.attributes.dir);
      restoreAttribute(input, "aria-controls", meta.attributes.controls);
      restoreAttribute(input, "aria-expanded", meta.attributes.expanded);
      restoreAttribute(input, "aria-haspopup", meta.attributes.popup);
      self.inputs.delete(input);
      self._inputMeta.delete(input);
    });

    return this;
  };

  Keybrew.prototype._configureObserver = function () {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
    if (!this.options.observe || !this._selector || !this.window || !this.window.MutationObserver) return;

    var self = this;
    this._observer = new this.window.MutationObserver(function (records) {
      records.forEach(function (record) {
        Array.prototype.forEach.call(record.addedNodes || [], function (node) {
          if (!node || node.nodeType !== 1) return;
          if (node.matches && node.matches(self._selector)) self.attach(node);
          if (node.querySelectorAll) self.attach(node.querySelectorAll(self._selector));
        });
        Array.prototype.forEach.call(record.removedNodes || [], function (node) {
          if (!node || node.nodeType !== 1) return;
          if (self.inputs.has(node)) self.detach(node);
          if (node.querySelectorAll) self.detach(node.querySelectorAll(self._selector));
        });
      });
    });
    this._observer.observe(this.document.body || this.document.documentElement, { childList: true, subtree: true });
  };

  Keybrew.prototype._shouldEnable = function () {
    var mobile = typeof this.options.deviceMatcher === "function"
      ? Boolean(this.options.deviceMatcher(this.window))
      : isTouchFirst(this.window);
    if (this.options.enabledOn === "mobile") return mobile;
    if (this.options.enabledOn === "desktop") return !mobile;
    return true;
  };

  Keybrew.prototype._syncOneInput = function (input) {
    var meta = this._inputMeta.get(input);
    if (!meta) return;
    var enabled = this._shouldEnable();
    var suppress = this.options.suppressNativeKeyboard === true || (
      this.options.suppressNativeKeyboard === "while-open" &&
      this._isOpen &&
      this._activeInput === input
    );
    if (suppress && enabled) input.setAttribute("inputmode", "none");
    else restoreAttribute(input, "inputmode", meta.attributes.inputmode);

    if (this.options.setDirection && !meta.attributes.dir.present) input.setAttribute("dir", "rtl");
    else restoreAttribute(input, "dir", meta.attributes.dir);

    if (enabled) {
      input.setAttribute("aria-controls", this.id);
      input.setAttribute("aria-expanded", input === this._activeInput && this._isOpen ? "true" : "false");
      input.setAttribute("aria-haspopup", "dialog");
    } else {
      restoreAttribute(input, "aria-controls", meta.attributes.controls);
      restoreAttribute(input, "aria-expanded", meta.attributes.expanded);
      restoreAttribute(input, "aria-haspopup", meta.attributes.popup);
    }
  };

  Keybrew.prototype._syncInputAttributes = function () {
    if (this._isOpen && !this._shouldEnable()) this.close("device-change", false);
    var self = this;
    this.inputs.forEach(function (input) { self._syncOneInput(input); });
  };

  Keybrew.prototype.open = function (input) {
    if (this._destroyed) return false;
    if (typeof input === "string") input = this.document.querySelector(input);
    input = input || this._activeInput;
    if (!isTextControl(input) || input.disabled || input.readOnly || !this._shouldEnable()) return false;
    if (!this.inputs.has(input)) this.attach(input);

    if (this._isOpen && this._activeInput === input) {
      this._schedulePosition();
      return true;
    }
    if (this._isOpen) this.close("switch", false);

    var currentFocus = this.document.activeElement;
    this._returnFocus = this.options.openOn === "manual" &&
      currentFocus &&
      currentFocus !== input &&
      currentFocus !== this.document.body &&
      currentFocus !== this.document.documentElement
      ? currentFocus
      : input;
    this._activeInput = input;
    this._mode = "hebrew";
    this._isOpen = true;
    this._didAutoScroll = false;
    this._syncOneInput(input);
    this.root.hidden = false;
    this.root.setAttribute("data-open", "");
    this._mount(input);
    this._render();
    this._observeOpenElements();
    this._schedulePosition();
    this._announce(this.options.labels.opened);

    this._call("onOpen", input, { input: input, instance: this });
    this._dispatchCustom(input, "keybrew:open", { input: input, instance: this });
    return true;
  };

  Keybrew.prototype.close = function (reason, restoreFocus) {
    if (!this._isOpen) return false;
    var input = this._activeInput;
    var returnFocus = this._returnFocus;
    var why = reason || "api";

    this._isOpen = false;
    this.root.hidden = true;
    this.root.removeAttribute("data-open");
    this.root.removeAttribute("data-placement");
    if (input) input.setAttribute("aria-expanded", "false");
    if (this._resizeObserver) this._resizeObserver.disconnect();
    this._announce(this.options.labels.closed);

    this._activeInput = null;
    this._returnFocus = null;

    var focusTarget = restoreFocus && returnFocus && this.document.contains(returnFocus)
      ? returnFocus
      : restoreFocus && input && this.document.contains(input)
        ? input
        : null;
    var restoreAfterFocus = Boolean(
      focusTarget === input &&
      this.options.suppressNativeKeyboard === "while-open" &&
      input &&
      input.getAttribute("inputmode") === "none"
    );
    if (input && !restoreAfterFocus) this._syncOneInput(input);

    this._call("onClose", input, { input: input, reason: why, instance: this });
    if (input) this._dispatchCustom(input, "keybrew:close", { input: input, reason: why, instance: this });

    if (focusTarget && this.document.activeElement !== focusTarget) {
      var self = this;
      if (focusTarget === input) this._suppressFocusInput = input;
      try { focusTarget.focus({ preventScroll: true }); } catch (error) { focusTarget.focus(); }
      setTimeout(function () {
        if (self._suppressFocusInput === input) self._suppressFocusInput = null;
      }, 0);
    }
    if (input && restoreAfterFocus) this._syncOneInput(input);
    return true;
  };

  Keybrew.prototype.toggle = function (input) {
    if (this._isOpen && (!input || input === this._activeInput)) return this.close("toggle", true);
    return this.open(input);
  };

  Keybrew.prototype.isOpen = function () {
    return this._isOpen;
  };

  Keybrew.prototype.getActiveInput = function () {
    return this._activeInput;
  };

  Keybrew.prototype.setOptions = function (options) {
    this.options = mergeOptions(this.options, options);
    this._validateOptions();
    this.root.setAttribute("aria-label", this.options.labels.keyboard);
    this._grid.setAttribute("aria-label", this.options.labels.keyboard);
    this._title.textContent = this.options.labels.title;
    this._closeButton.setAttribute("aria-label", this.options.labels.close);
    this._syncInputAttributes();
    this._configureObserver();
    if (this._isOpen) {
      if (!this._modeEnabled(this._mode)) this._mode = "hebrew";
      this._mount(this._activeInput);
      this._render();
      this._schedulePosition();
    }
    return this;
  };

  Keybrew.prototype._mount = function (input) {
    this.root.classList.toggle("keybrew--inline", this.options.position === "inline");
    this.root.classList.toggle("keybrew--floating", this.options.position === "floating");

    if (this.options.position === "floating") {
      (this.document.body || this.document.documentElement).appendChild(this.root);
      return;
    }

    var container = this.options.inlineContainer;
    if (typeof container === "function") container = container(input);
    else if (typeof container === "string") container = this.document.querySelector(container);

    if (container && container.appendChild) container.appendChild(this.root);
    else if (input.insertAdjacentElement) input.insertAdjacentElement("afterend", this.root);
    else if (input.parentNode) input.parentNode.appendChild(this.root);
  };

  Keybrew.prototype._modeEnabled = function (mode) {
    if (mode === "niqqud") return this.options.includeNiqqud;
    if (mode === "numbers") return this.options.includeNumbers;
    if (mode === "symbols") return this.options.includeSymbols;
    return true;
  };

  Keybrew.prototype._controlKeys = function () {
    var controls = [];
    var hasPanels = this.options.includeNiqqud || this.options.includeNumbers || this.options.includeSymbols;
    if (hasPanels) controls.push(KEYS.HEBREW);
    if (this.options.includeNiqqud) controls.push(KEYS.NIQQUD);
    if (this.options.includeNumbers) controls.push(KEYS.NUMBERS);
    if (this.options.includeSymbols) controls.push(KEYS.SYMBOLS);
    controls.push(KEYS.SPACE, KEYS.BACKSPACE);
    return controls;
  };

  Keybrew.prototype._render = function () {
    var self = this;
    var rows = modeRows(this._mode).map(function (row) { return row.slice(); });
    rows.push(this._controlKeys());
    this._grid.textContent = "";

    rows.forEach(function (keys, rowIndex) {
      var row = self.document.createElement("div");
      row.className = "keybrew__row";
      row.setAttribute("role", "group");
      row.setAttribute("aria-label", rowIndex === rows.length - 1 ? "Keyboard controls" : self._modeLabel(self._mode));

      keys.forEach(function (key, columnIndex) {
        var button = self.document.createElement("button");
        var isAction = key.charAt(0) === "{";
        button.type = "button";
        button.className = "keybrew__key";
        button.setAttribute("data-key", key);
        button.setAttribute("data-row", String(rowIndex));
        button.setAttribute("data-column", String(columnIndex));
        button.setAttribute("aria-label", self._keyAriaLabel(key));
        button.textContent = self._keyDisplay(key);

        if (!isAction && (HEBREW_KEY_NAMES[key] || NIQQUD_KEY_NAMES[key])) button.lang = "he";
        if (key === KEYS.SPACE) button.classList.add("keybrew__key--space");
        if (key === KEYS.BACKSPACE) button.classList.add("keybrew__key--backspace");
        if ([KEYS.HEBREW, KEYS.NIQQUD, KEYS.NUMBERS, KEYS.SYMBOLS].indexOf(key) !== -1) {
          button.classList.add("keybrew__key--mode");
          button.setAttribute("aria-pressed", String(key === "{" + self._mode + "}"));
        }
        row.appendChild(button);
      });
      self._grid.appendChild(row);
    });
  };

  Keybrew.prototype._keyDisplay = function (key) {
    if (key === KEYS.BACKSPACE) return "⌦";
    if (key === KEYS.SPACE) return "רווח";
    if (key === KEYS.HEBREW) return "אבג";
    if (key === KEYS.NIQQUD) return "נִקּוּד";
    if (key === KEYS.NUMBERS) return "123";
    if (key === KEYS.SYMBOLS) return "#+=";
    if (key === KEYS.CLOSE) return "×";
    if (NIQQUD_KEY_NAMES[key]) return "◌" + key;
    return key;
  };

  Keybrew.prototype._keyAriaLabel = function (key) {
    if (own(this.options.keyLabels, key)) return this.options.keyLabels[key];
    if (HEBREW_KEY_NAMES[key]) return HEBREW_KEY_NAMES[key];
    if (NIQQUD_KEY_NAMES[key]) return NIQQUD_KEY_NAMES[key];
    if (key === KEYS.BACKSPACE) return this.options.labels.backspace;
    if (key === KEYS.SPACE) return this.options.labels.space;
    if (key === KEYS.HEBREW) return this.options.labels.hebrew;
    if (key === KEYS.NIQQUD) return this.options.labels.niqqud;
    if (key === KEYS.NUMBERS) return this.options.labels.numbers;
    if (key === KEYS.SYMBOLS) return this.options.labels.symbols;
    if (key === KEYS.CLOSE) return this.options.labels.close;
    return key;
  };

  Keybrew.prototype._modeLabel = function (mode) {
    return this.options.labels[mode] || mode;
  };

  Keybrew.prototype._activateKey = function (key, event, button) {
    var input = this._activeInput;
    if (!input) return;
    var wasKeyboardFocused = this.document.activeElement === button;

    if (key === KEYS.CLOSE) {
      this._emitKeyPress(key, event, input);
      this.close("button", true);
      return;
    }

    var nextMode = null;
    if (key === KEYS.HEBREW) nextMode = "hebrew";
    else if (key === KEYS.NIQQUD) nextMode = "niqqud";
    else if (key === KEYS.NUMBERS) nextMode = "numbers";
    else if (key === KEYS.SYMBOLS) nextMode = "symbols";

    if (nextMode) {
      this._mode = nextMode;
      this._render();
      this._announce(this._modeLabel(nextMode));
      this._call("onLayoutChange", nextMode, { input: input, layout: nextMode, instance: this });
      this._dispatchCustom(input, "keybrew:layoutchange", { input: input, layout: nextMode, instance: this });
      this._emitKeyPress(key, event, input);
      this._schedulePosition();
      if (wasKeyboardFocused) {
        var first = this._grid.querySelector("button[data-key]");
        if (first) first.focus();
      }
      return;
    }

    if (key === KEYS.BACKSPACE) this._edit("", "deleteContentBackward");
    else if (key === KEYS.SPACE) this._edit(" ", "insertText");
    else this._edit(key, "insertText");
    this._emitKeyPress(key, event, input);
  };

  Keybrew.prototype._edit = function (text, inputType) {
    var input = this._activeInput;
    if (!input || input.disabled || input.readOnly) return false;

    var value = input.value || "";
    var start = typeof input.selectionStart === "number" ? input.selectionStart : value.length;
    var end = typeof input.selectionEnd === "number" ? input.selectionEnd : value.length;

    if (inputType === "deleteContentBackward" && start === end) {
      if (start === 0) return false;
      start = previousCodePointIndex(value, start);
    }

    if (inputType === "insertText") {
      var maximum = Number(input.maxLength);
      if (Number.isFinite(maximum) && maximum >= 0) {
        var available = maximum - (value.length - (end - start));
        if (available <= 0) return false;
        if (text.length > available) text = text.slice(0, available);
      }
    }

    var detail = { data: inputType === "insertText" ? text : null, inputType: inputType };
    var beforeInput = createInputEvent(this.window, "beforeinput", detail, true);
    if (!input.dispatchEvent(beforeInput)) return false;

    var replacement = inputType === "deleteContentBackward" ? "" : text;
    var updated = value.slice(0, start) + replacement + value.slice(end);
    var caret = start + replacement.length;
    setNativeValue(input, updated, this.window);
    if (input.setSelectionRange) {
      try { input.setSelectionRange(caret, caret); } catch (error) { /* Some input types reject selection APIs. */ }
    }

    this._pendingInputDetail = detail;
    input.dispatchEvent(createInputEvent(this.window, "input", detail, false));
    this._pendingInputDetail = null;
    return true;
  };

  Keybrew.prototype._handleNativeInput = function (input, event) {
    var detail = this._pendingInputDetail || {
      data: "data" in event ? event.data : null,
      inputType: event.inputType || null
    };
    var payload = {
      input: input,
      value: input.value,
      data: detail.data,
      inputType: detail.inputType,
      originalEvent: event,
      instance: this
    };
    this._call("onInput", input.value, payload);
    this._dispatchCustom(input, "keybrew:input", payload);
  };

  Keybrew.prototype._emitKeyPress = function (key, event, input) {
    var payload = { key: key, input: input, originalEvent: event, instance: this };
    this._call("onKeyPress", key, payload);
    this._dispatchCustom(input, "keybrew:keypress", payload);
  };

  Keybrew.prototype._call = function (name, value, detail) {
    if (typeof this.options[name] === "function") this.options[name](value, detail);
  };

  Keybrew.prototype._dispatchCustom = function (target, name, detail) {
    if (!target || !this.window || !this.window.CustomEvent) return;
    target.dispatchEvent(new this.window.CustomEvent(name, { bubbles: true, detail: detail }));
  };

  Keybrew.prototype._announce = function (message) {
    this._live.textContent = "";
    var self = this;
    var schedule = this.window && this.window.requestAnimationFrame
      ? this.window.requestAnimationFrame.bind(this.window)
      : function (callback) { return setTimeout(callback, 0); };
    schedule(function () { self._live.textContent = message || ""; });
  };

  Keybrew.prototype._moveKeyFocus = function (event) {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].indexOf(event.key) === -1) return;
    var current = event.target.closest && event.target.closest(".keybrew__key[data-row]");
    if (!current || !this._grid.contains(current)) return;

    var rowIndex = Number(current.getAttribute("data-row"));
    var columnIndex = Number(current.getAttribute("data-column"));
    var target = null;
    var row;

    if (event.key === "Home" || event.key === "End") {
      row = this._grid.querySelectorAll(".keybrew__row")[rowIndex];
      var rowButtons = row && row.querySelectorAll(".keybrew__key");
      target = rowButtons && rowButtons[event.key === "Home" ? 0 : rowButtons.length - 1];
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      row = this._grid.querySelectorAll(".keybrew__row")[rowIndex];
      var buttons = row && row.querySelectorAll(".keybrew__key");
      var offset = event.key === "ArrowRight" ? 1 : -1;
      target = buttons && buttons[(columnIndex + offset + buttons.length) % buttons.length];
    } else {
      var rows = this._grid.querySelectorAll(".keybrew__row");
      var targetRowIndex = clamp(rowIndex + (event.key === "ArrowDown" ? 1 : -1), 0, rows.length - 1);
      var targetButtons = rows[targetRowIndex].querySelectorAll(".keybrew__key");
      target = targetButtons[Math.min(columnIndex, targetButtons.length - 1)];
    }

    if (target) {
      event.preventDefault();
      target.focus();
    }
  };

  Keybrew.prototype._observeOpenElements = function () {
    if (!this._resizeObserver || !this._activeInput) return;
    this._resizeObserver.disconnect();
    this._resizeObserver.observe(this._activeInput);
    this._resizeObserver.observe(this.root);
  };

  Keybrew.prototype._schedulePosition = function () {
    if (!this._isOpen || this.options.position !== "floating" || !this.window) return;
    if (this._positionFrame) this.window.cancelAnimationFrame(this._positionFrame);
    var self = this;
    this._positionFrame = this.window.requestAnimationFrame(function () {
      self._positionFrame = null;
      self._position();
    });
  };

  Keybrew.prototype._position = function () {
    if (!this._isOpen || !this._activeInput || this.options.position !== "floating") return;
    var inputRect = this._activeInput.getBoundingClientRect();
    var viewport = this.window.visualViewport;
    var viewLeft = viewport ? viewport.offsetLeft : 0;
    var viewTop = viewport ? viewport.offsetTop : 0;
    var viewWidth = viewport ? viewport.width : this.window.innerWidth;
    var viewHeight = viewport ? viewport.height : this.window.innerHeight;
    var padding = Math.max(0, Number(this.options.viewportPadding) || 0);
    var gap = Math.max(0, Number(this.options.gap) || 0);
    var availableWidth = Math.max(0, viewWidth - padding * 2);
    var width = clamp(
      Math.max(inputRect.width, Number(this.options.minWidth) || 0),
      0,
      Math.min(Number(this.options.maxWidth) || availableWidth, availableWidth)
    );

    this.root.style.visibility = "hidden";
    this.root.style.width = width + "px";
    this.root.style.maxHeight = Math.max(120, viewHeight - padding * 2) + "px";

    var keyboardHeight = this.root.offsetHeight;
    var roomBelow = viewTop + viewHeight - padding - inputRect.bottom - gap;
    var roomAbove = inputRect.top - viewTop - padding - gap;
    var placement = this.options.placement;

    if (placement === "auto") {
      if (roomBelow >= keyboardHeight) placement = "below";
      else if (roomAbove >= keyboardHeight) placement = "above";
      else placement = "below";
    }

    if (this.options.scrollIntoView && !this._didAutoScroll) {
      var shortfall = placement === "below" ? keyboardHeight - roomBelow : keyboardHeight - roomAbove;
      if (shortfall > 0) {
        var reducedMotion = this.window.matchMedia && this.window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        var delta = placement === "below" ? shortfall + padding : -(shortfall + padding);
        this._didAutoScroll = true;
        this.window.scrollBy({
          top: delta,
          left: 0,
          behavior: reducedMotion ? "auto" : this.options.scrollBehavior
        });
      }
    }

    var left;
    if (this.options.align === "center") left = inputRect.left + (inputRect.width - width) / 2;
    else if (this.options.align === "right") left = inputRect.right - width;
    else left = inputRect.left;
    left = clamp(left, viewLeft + padding, viewLeft + viewWidth - padding - width);

    var top = placement === "above"
      ? inputRect.top - gap - keyboardHeight
      : inputRect.bottom + gap;
    top = clamp(top, viewTop + padding, viewTop + viewHeight - padding - keyboardHeight);

    this.root.style.left = Math.round(left) + "px";
    this.root.style.top = Math.round(top) + "px";
    this.root.style.visibility = "visible";
    this.root.setAttribute("data-placement", placement);
  };

  Keybrew.prototype.destroy = function () {
    if (this._destroyed) return;
    this.close("destroy", false);
    this.detach();
    if (this._observer) this._observer.disconnect();
    if (this._resizeObserver) this._resizeObserver.disconnect();
    if (this._positionFrame && this.window) this.window.cancelAnimationFrame(this._positionFrame);

    this.root.removeEventListener("pointerdown", this._onRootPointerDown);
    this.root.removeEventListener("click", this._onRootClick);
    this.root.removeEventListener("keydown", this._onRootKeyDown);
    this.document.removeEventListener("pointerdown", this._onDocumentPointerDown, true);
    this.document.removeEventListener("keydown", this._onDocumentKeyDown);

    if (this.window) {
      this.window.removeEventListener("resize", this._onViewportChange);
      this.window.removeEventListener("scroll", this._onViewportChange, true);
      if (this.window.visualViewport) {
        this.window.visualViewport.removeEventListener("resize", this._onViewportChange);
        this.window.visualViewport.removeEventListener("scroll", this._onViewportChange);
      }
    }

    if (this.root.parentNode) this.root.parentNode.removeChild(this.root);
    this._destroyed = true;
  };

  Keybrew.auto = function (options) {
    return new Keybrew("[data-keybrew]", options || {});
  };

  Keybrew.isTouchFirst = isTouchFirst;
  Keybrew.version = VERSION;
  Keybrew.keys = KEYS;
  Keybrew.layouts = Object.freeze({
    hebrew: HEBREW_ROWS,
    niqqud: NIQQUD_ROWS,
    numbers: NUMBER_ROWS,
    symbols: SYMBOL_ROWS
  });

  return Keybrew;
});
