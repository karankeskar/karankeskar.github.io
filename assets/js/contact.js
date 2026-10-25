/* Contact section: live Sydney clock, click-to-copy email, and the
   "message.ts" editor form (status bar, validation, AJAX send to Formspree). */
(function () {
  "use strict";

  /* ---------------- Local time ---------------- */
  document.querySelectorAll(".contact-clock-time").forEach(function (el) {
    var formatter;
    try {
      formatter = new Intl.DateTimeFormat("en-AU", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: el.getAttribute("data-timezone") || "Australia/Sydney",
      });
    } catch (e) {
      el.closest(".contact-clock").hidden = true;
      return;
    }
    var tick = function () {
      el.textContent = formatter.format(new Date()).toLowerCase();
    };
    tick();
    setInterval(tick, 15000);
  });

  /* ---------------- Click to copy ---------------- */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var field = document.createElement("textarea");
      field.value = text;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      try {
        document.execCommand("copy") ? resolve() : reject();
      } catch (e) {
        reject(e);
      }
      document.body.removeChild(field);
    });
  }

  document.querySelectorAll("[data-copy]").forEach(function (row) {
    var label = row.querySelector(".contact-row-action");
    var timer = null;
    row.addEventListener("click", function () {
      copyText(row.getAttribute("data-copy")).then(function () {
        row.classList.add("is-copied");
        if (label) label.textContent = label.getAttribute("data-done");
        clearTimeout(timer);
        timer = setTimeout(function () {
          row.classList.remove("is-copied");
          if (label) label.textContent = label.getAttribute("data-default");
        }, 2000);
      }, function () {
        window.location.href = "mailto:" + row.getAttribute("data-copy");
      });
    });
  });

  /* ---------------- message.ts editor ---------------- */
  var form = document.querySelector(".msg-editor");
  if (!form) return;

  var fields = form.querySelectorAll("input, textarea");
  var stateEl = form.querySelector(".msg-state");
  var posEl = form.querySelector(".msg-cursor-pos");
  var output = form.querySelector(".msg-output");
  var sendBtn = form.querySelector(".msg-send");
  var textarea = form.querySelector("textarea");

  function setState(text, cls) {
    stateEl.textContent = text;
    stateEl.className = "msg-state" + (cls ? " " + cls : "");
  }

  // Status bar: "Ln x, Col y" follows the caret like an editor. The line is
  // the gutter number; email inputs don't expose the caret, so use the end.
  function updateCursor(field) {
    var line = field.closest("[data-line]").getAttribute("data-line");
    var caret = typeof field.selectionStart === "number" ? field.selectionStart : field.value.length;
    var before = field.value.slice(0, caret);
    var col = caret - (before.lastIndexOf("\n") + 1) + 1;
    posEl.textContent = "Ln " + line + ", Col " + col;
  }

  // Size each input to its text so the closing quote sits right after it
  var measure = document.createElement("span");
  measure.setAttribute("aria-hidden", "true");
  measure.style.cssText = "position:absolute;visibility:hidden;white-space:pre;left:-9999px;top:0";
  form.appendChild(measure);
  function sizeInput(input) {
    measure.style.font = getComputedStyle(input).font;
    measure.textContent = input.value || input.placeholder || " ";
    input.style.width = Math.ceil(measure.getBoundingClientRect().width) + 2 + "px";
  }
  var inputs = form.querySelectorAll(".msg-string input");
  inputs.forEach(function (input) {
    sizeInput(input);
    input.addEventListener("input", function () {
      sizeInput(input);
    });
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      inputs.forEach(sizeInput);
    });
  }

  function autosize() {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  }

  fields.forEach(function (field) {
    ["focus", "click", "keyup", "input"].forEach(function (evt) {
      field.addEventListener(evt, function () {
        updateCursor(field);
      });
    });
    field.addEventListener("focus", function () {
      field.closest(".msg-line").classList.add("is-focused");
    });
    field.addEventListener("blur", function () {
      field.closest(".msg-line").classList.remove("is-focused");
    });
    field.addEventListener("input", function () {
      field.closest(".msg-line").classList.remove("is-invalid");
      var hasContent = Array.prototype.some.call(fields, function (f) {
        return f.value.trim();
      });
      setState(hasContent ? "● unsaved" : "○ empty", hasContent ? "is-dirty" : "");
    });
  });
  textarea.addEventListener("input", autosize);
  setState("○ empty");

  function printOutput(lines) {
    output.hidden = false;
    output.innerHTML = lines
      .map(function (l) {
        return '<div class="msg-out-line ' + (l.cls || "") + '">' + l.html + "</div>";
      })
      .join("");
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // Validation, reported like a compiler error
    var invalid = Array.prototype.filter.call(fields, function (f) {
      var bad = !f.value.trim() || !f.checkValidity();
      f.closest(".msg-line").classList.toggle("is-invalid", bad);
      return bad;
    });
    if (invalid.length) {
      var first = invalid[0];
      var key = first.closest(".msg-line").querySelector(".msg-key").textContent;
      var reason = first.type === "email" && first.value.trim() ? "must be a valid email address" : "is required";
      printOutput([
        { html: '<span class="msg-prompt">$</span> tsc message.ts' },
        { cls: "is-error", html: "✗ error TS2322: '" + escapeHtml(key) + "' " + reason + " (Ln " + first.closest("[data-line]").getAttribute("data-line") + ")" },
      ]);
      first.focus();
      return;
    }

    var name = form.querySelector('[name="name"]').value.trim().split(" ")[0];
    sendBtn.disabled = true;
    setState("◌ sending…", "is-dirty");
    printOutput([
      { html: '<span class="msg-prompt">$</span> node send.ts' },
      { cls: "is-muted", html: "… sending message" },
    ]);

    fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" },
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        printOutput([
          { html: '<span class="msg-prompt">$</span> node send.ts' },
          { cls: "is-success", html: "✓ Message sent. Thanks, " + escapeHtml(name) + "! I'll get back to you soon." },
        ]);
        setState("✓ sent", "is-sent");
        form.reset();
        autosize();
        inputs.forEach(sizeInput);
      })
      .catch(function () {
        var email = (document.querySelector("[data-copy]") || {}).getAttribute
          ? document.querySelector("[data-copy]").getAttribute("data-copy")
          : "";
        printOutput([
          { html: '<span class="msg-prompt">$</span> node send.ts' },
          { cls: "is-error", html: "✗ Couldn't send right now." + (email ? ' Email me at <a href="mailto:' + escapeHtml(email) + '">' + escapeHtml(email) + "</a>" : "") },
        ]);
        setState("● unsaved", "is-dirty");
      })
      .then(function () {
        sendBtn.disabled = false;
      });
  });
})();
