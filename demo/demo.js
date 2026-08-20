(function () {
  "use strict";

  var log = document.getElementById("event-log");
  var options = {
    includeNiqqud: true,
    includeNumbers: true,
    includeSymbols: true,
    onInput: function (value) {
      log.textContent = "Input: " + (value || "(empty)");
    }
  };

  var manualInput = document.getElementById("hebrew-name");
  var manualTrigger = document.getElementById("hebrew-keyboard-trigger");
  var manual = new Keybrew(manualInput, Object.assign({}, options, {
    openOn: "manual",
    suppressNativeKeyboard: "while-open",
    onOpen: function () {
      manualTrigger.setAttribute("aria-expanded", "true");
    },
    onClose: function () {
      manualTrigger.setAttribute("aria-expanded", "false");
    }
  }));
  manualTrigger.setAttribute("aria-controls", manual.id);
  manualTrigger.addEventListener("click", function () {
    manual.toggle(manualInput);
  });

  var floating = new Keybrew("#hebrew-note", options);
  var inline = new Keybrew("#inline-hebrew", {
    position: "inline",
    inlineContainer: "#inline-keyboard",
    includeNiqqud: true,
    onInput: options.onInput
  });

  ["niqqud", "numbers", "symbols"].forEach(function (panel) {
    document.getElementById("with-" + panel).addEventListener("change", function (event) {
      var update = {};
      update["include" + panel.charAt(0).toUpperCase() + panel.slice(1)] = event.target.checked;
      manual.setOptions(update);
      floating.setOptions(update);
    });
  });

  window.demoKeyboards = { manual: manual, floating: floating, inline: inline };

  if (new URLSearchParams(window.location.search).has("preview")) {
    manualTrigger.focus();
    manualTrigger.click();
  }
})();
