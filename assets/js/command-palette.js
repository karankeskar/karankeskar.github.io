/* Command palette: press ⌘K / Ctrl+K (or "/") to jump around the site,
   download the résumé, copy the email address, open socials or projects.
   Data comes from window.CMDK_DATA (rendered in _includes/footer.html). */
(function () {
  "use strict";

  var data = window.CMDK_DATA || {};
  var base = data.baseurl || "";
  var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  var isHome = !!document.querySelector(".hero-area");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Commands ---------------- */

  function goToSection(id) {
    return function () {
      var target = id === "top" ? document.body : document.getElementById(id);
      if (isHome && target) {
        var top = id === "top" ? 0 : target.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top: top, behavior: reduceMotion ? "auto" : "smooth" });
      } else {
        window.location.href = base + "/" + (id === "top" ? "" : "#" + id);
      }
    };
  }

  function goTo(url) {
    return function () {
      window.location.href = url;
    };
  }

  function openExternal(url) {
    return function () {
      if (/^mailto:/.test(url)) {
        window.location.href = url;
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    };
  }

  function copyEmail() {
    var done = function () {
      toast("Email copied to clipboard");
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(data.email).then(done, fallback);
    } else {
      fallback();
    }
    function fallback() {
      var field = document.createElement("textarea");
      field.value = data.email;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      try {
        document.execCommand("copy");
        done();
      } catch (e) {
        toast(data.email);
      }
      document.body.removeChild(field);
    }
  }

  function downloadResume() {
    var link = document.createElement("a");
    link.href = data.resume;
    link.download = "";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function openProject(index) {
    return function () {
      if (typeof window.openProjectDetail === "function") {
        window.openProjectDetail(index);
      } else {
        window.location.href = base + "/portfolio#project-" + index;
      }
    };
  }

  var commands = [
    { group: "Navigate", title: "Home", icon: "ti-home", run: goToSection("top"), keywords: "top hero start" },
    { group: "Navigate", title: "About me", icon: "ti-user", run: goToSection("about"), keywords: "bio who" },
    { group: "Navigate", title: "Experience", icon: "ti-briefcase", run: goToSection("experience"), keywords: "work jobs career" },
    { group: "Navigate", title: "Education", icon: "ti-medall", run: goToSection("education"), keywords: "university degree study" },
    { group: "Navigate", title: "Featured work", icon: "ti-layout-grid2", run: goToSection("portfolio"), keywords: "projects portfolio" },
    { group: "Navigate", title: "Skills & technologies", icon: "ti-bolt", run: goToSection("skills"), keywords: "stack tech" },
    { group: "Navigate", title: "Contact", icon: "ti-comment", run: goToSection("contact"), keywords: "message get in touch hire" },
    { group: "Pages", title: "All projects", icon: "ti-folder", run: goTo(base + "/portfolio"), keywords: "portfolio page" },
    { group: "Pages", title: "Blog", icon: "ti-pencil-alt", run: goTo(base + "/blog"), keywords: "posts writing articles" },
    { group: "Actions", title: "Download résumé", icon: "ti-download", run: downloadResume, keywords: "resume cv pdf" },
  ];

  if (data.email) {
    commands.push(
      { group: "Actions", title: "Copy email address", icon: "ti-clipboard", run: copyEmail, keywords: "mail contact " + data.email },
      { group: "Actions", title: "Send an email", icon: "ti-email", run: openExternal("mailto:" + data.email), keywords: "mail contact" }
    );
  }

  (data.social || []).forEach(function (s) {
    if (/github/i.test(s.icon + s.link)) {
      commands.push({ group: "Links", title: "GitHub", icon: "ti-github", run: openExternal(s.link), keywords: "code repos" });
    } else if (/linkedin/i.test(s.icon + s.link)) {
      commands.push({ group: "Links", title: "LinkedIn", icon: "ti-linkedin", run: openExternal(s.link), keywords: "profile network" });
    }
  });

  (data.projects || []).forEach(function (title, i) {
    commands.push({ group: "Projects", title: title, icon: "ti-arrow-top-right", run: openProject(i), keywords: "project" });
  });

  /* ---------------- Fuzzy matching ---------------- */

  // Returns a score (higher is better) and the matched character positions,
  // or null if the query isn't a subsequence of the text.
  function fuzzy(query, text) {
    var q = query.toLowerCase();
    var t = text.toLowerCase();
    var positions = [];
    var score = 0;
    var last = -1;
    for (var i = 0; i < q.length; i++) {
      var found = t.indexOf(q[i], last + 1);
      if (found === -1) return null;
      score += found === last + 1 ? 3 : 1; // reward consecutive matches
      if (found === 0 || t[found - 1] === " ") score += 2; // reward word starts
      positions.push(found);
      last = found;
    }
    return { score: score - t.length * 0.01, positions: positions };
  }

  function search(query) {
    if (!query) {
      return commands.map(function (c) {
        return { command: c, positions: [] };
      });
    }
    var results = [];
    commands.forEach(function (c) {
      var inTitle = fuzzy(query, c.title);
      var inKeywords = !inTitle && fuzzy(query, c.keywords || "");
      if (inTitle) {
        results.push({ command: c, positions: inTitle.positions, score: inTitle.score + 5 });
      } else if (inKeywords) {
        results.push({ command: c, positions: [], score: inKeywords.score });
      }
    });
    return results.sort(function (a, b) {
      return b.score - a.score;
    });
  }

  /* ---------------- UI ---------------- */

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function highlight(text, positions) {
    if (!positions.length) return escapeHtml(text);
    var out = "";
    for (var i = 0; i < text.length; i++) {
      var ch = escapeHtml(text[i]);
      out += positions.indexOf(i) !== -1 ? "<mark>" + ch + "</mark>" : ch;
    }
    return out;
  }

  var root = document.createElement("div");
  root.className = "cmdk";
  root.hidden = true;
  root.innerHTML =
    '<div class="cmdk-backdrop" data-cmdk-close></div>' +
    '<div class="cmdk-panel" role="dialog" aria-modal="true" aria-label="Command palette">' +
    '  <div class="cmdk-search">' +
    '    <i class="ti-search" aria-hidden="true"></i>' +
    '    <input type="text" class="cmdk-input" placeholder="Type a command or search…" autocomplete="off" spellcheck="false"' +
    '      role="combobox" aria-expanded="true" aria-controls="cmdk-list" aria-autocomplete="list">' +
    '    <kbd class="cmdk-esc">esc</kbd>' +
    "  </div>" +
    '  <ul class="cmdk-list" id="cmdk-list" role="listbox"></ul>' +
    '  <div class="cmdk-footer">' +
    "    <span><kbd>&uarr;</kbd><kbd>&darr;</kbd> navigate</span>" +
    "    <span><kbd>&crarr;</kbd> select</span>" +
    "    <span><kbd>esc</kbd> close</span>" +
    "  </div>" +
    "</div>";
  document.body.appendChild(root);

  var toastEl = document.createElement("div");
  toastEl.className = "cmdk-toast";
  toastEl.setAttribute("role", "status");
  toastEl.setAttribute("aria-live", "polite");
  document.body.appendChild(toastEl);

  var input = root.querySelector(".cmdk-input");
  var list = root.querySelector(".cmdk-list");
  var results = [];
  var selected = 0;
  var lastFocus = null;
  var toastTimer = null;

  function toast(message) {
    toastEl.innerHTML = '<i class="ti-check" aria-hidden="true"></i> ' + escapeHtml(message);
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("is-visible");
    }, 2200);
  }

  function render() {
    results = search(input.value.trim());
    if (!results.length) {
      list.innerHTML = '<li class="cmdk-empty">No results for “' + escapeHtml(input.value.trim()) + "”</li>";
      input.removeAttribute("aria-activedescendant");
      return;
    }
    selected = Math.min(selected, results.length - 1);

    var html = "";
    var lastGroup = null;
    results.forEach(function (r, i) {
      // Group headings only when browsing; search results are ranked instead
      if (!input.value.trim() && r.command.group !== lastGroup) {
        lastGroup = r.command.group;
        html += '<li class="cmdk-group" role="presentation">' + escapeHtml(lastGroup) + "</li>";
      }
      html +=
        '<li class="cmdk-item' + (i === selected ? " is-selected" : "") + '" id="cmdk-item-' + i +
        '" role="option" aria-selected="' + (i === selected) + '" data-index="' + i + '">' +
        '<i class="' + r.command.icon + '" aria-hidden="true"></i>' +
        '<span class="cmdk-item-title">' + highlight(r.command.title, r.positions) + "</span>" +
        '<span class="cmdk-item-group">' + escapeHtml(r.command.group) + "</span>" +
        "</li>";
    });
    list.innerHTML = html;
    input.setAttribute("aria-activedescendant", "cmdk-item-" + selected);
  }

  function select(index) {
    if (!results.length) return;
    selected = (index + results.length) % results.length;
    list.querySelectorAll(".cmdk-item").forEach(function (el) {
      var on = +el.getAttribute("data-index") === selected;
      el.classList.toggle("is-selected", on);
      el.setAttribute("aria-selected", on);
      if (on) el.scrollIntoView({ block: "nearest" });
    });
    input.setAttribute("aria-activedescendant", "cmdk-item-" + selected);
  }

  function run(index) {
    var r = results[index];
    if (!r) return;
    close(true);
    r.command.run();
  }

  function open() {
    if (!root.hidden) return;
    lastFocus = document.activeElement;
    root.hidden = false;
    document.documentElement.classList.add("cmdk-open");
    input.value = "";
    selected = 0;
    render();
    // Next frame so the open transition plays
    requestAnimationFrame(function () {
      root.classList.add("is-open");
      input.focus();
    });
  }

  function close(skipFocusRestore) {
    if (root.hidden) return;
    root.classList.remove("is-open");
    document.documentElement.classList.remove("cmdk-open");
    setTimeout(function () {
      root.hidden = true;
    }, reduceMotion ? 0 : 150);
    if (!skipFocusRestore && lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---------------- Events ---------------- */

  input.addEventListener("input", function () {
    selected = 0;
    render();
  });

  input.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey)) {
      e.preventDefault();
      select(selected + 1);
    } else if (e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey)) {
      e.preventDefault();
      select(selected - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(selected);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  });

  list.addEventListener("mousemove", function (e) {
    var item = e.target.closest(".cmdk-item");
    if (item && +item.getAttribute("data-index") !== selected) select(+item.getAttribute("data-index"));
  });

  list.addEventListener("click", function (e) {
    var item = e.target.closest(".cmdk-item");
    if (item) run(+item.getAttribute("data-index"));
  });

  root.addEventListener("click", function (e) {
    if (e.target.hasAttribute("data-cmdk-close")) close();
  });

  document.addEventListener("keydown", function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      root.hidden ? open() : close();
    } else if (e.key === "/" && !typing && root.hidden) {
      e.preventDefault();
      open();
    }
  });

  document.querySelectorAll("[data-cmdk-open]").forEach(function (btn) {
    btn.addEventListener("click", open);
  });

  // Show the right shortcut for the platform
  if (!isMac) {
    document.querySelectorAll(".cmdk-trigger-key").forEach(function (kbd) {
      kbd.textContent = "Ctrl K";
    });
  }
})();
