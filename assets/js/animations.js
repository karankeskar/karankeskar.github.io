(function () {
  "use strict";

  if (typeof gsap === "undefined") return;

  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
  }

  if (reduceMotion) {
    // Respect the user's preference: just make sure nothing stays hidden.
    gsap.set("body", { clearProps: "all" });
    return;
  }

  var EASE = "power3.out";

  function revealBatch(selector, vars, staggerAmount) {
    var els = document.querySelectorAll(selector);
    if (!els.length || typeof ScrollTrigger === "undefined") return;

    els.forEach(function (el) {
      gsap.set(el, Object.assign({ autoAlpha: 0 }, vars.from));
    });

    ScrollTrigger.batch(els, {
      start: "top 88%",
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, {
          autoAlpha: 1,
          duration: 0.9,
          ease: EASE,
          stagger: staggerAmount || 0.12,
          x: 0,
          y: 0,
          scale: 1,
          ...vars.to,
        });
      },
    });
  }

  /* Types out the hero code window character by character, then pops in
     the terminal card. Without JS (or with reduced motion) the full code
     is already in the HTML, so nothing is lost. */
  function typeCode(container, timeline) {
    var code = container.querySelector(".cw-code");
    var cursor = container.querySelector(".cw-cursor");
    var terminal = container.querySelector(".cw-terminal");
    if (!code || !cursor) return;

    var walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) {
      // Array.from keeps emoji (surrogate pairs) in one piece
      nodes.push({ node: walker.currentNode, text: Array.from(walker.currentNode.textContent) });
    }
    nodes.forEach(function (n) {
      n.node.textContent = "";
    });
    if (terminal) gsap.set(terminal, { autoAlpha: 0, y: 16 });

    var i = 0;
    var c = 0;
    function step() {
      if (i >= nodes.length) {
        code.lastElementChild.appendChild(cursor);
        if (terminal) {
          gsap.to(terminal, { autoAlpha: 1, y: 0, duration: 0.6, ease: "back.out(1.7)", delay: 0.3 });
        }
        return;
      }
      var n = nodes[i];
      n.node.parentNode.insertBefore(cursor, n.node.nextSibling);
      n.node.textContent = n.text.slice(0, ++c).join("");
      if (c >= n.text.length) {
        // Pause a little longer at the end of each line
        var endOfLine = !nodes[i + 1] ||
          nodes[i + 1].node.parentNode.closest(".cw-line") !== n.node.parentNode.closest(".cw-line");
        i++;
        c = 0;
        setTimeout(step, endOfLine ? 140 : 22);
      } else {
        setTimeout(step, 22);
      }
    }

    timeline.call(step, null, 0.9);
  }

  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* Wraps each <br>-separated line in a mask so it can slide up into view. */
  function splitLines(el) {
    var parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts
      .map(function (part) {
        return '<span class="line-mask"><span class="line-inner">' + part.trim() + "</span></span>";
      })
      .join("");
    return el.querySelectorAll(".line-inner");
  }

  /* Section titles: each word slides up from behind a mask. */
  function revealWords(selector) {
    if (typeof ScrollTrigger === "undefined") return;
    document.querySelectorAll(selector).forEach(function (heading) {
      var words = heading.textContent.trim().split(/\s+/);
      heading.innerHTML = words
        .map(function (w) {
          return '<span class="word-mask"><span class="word-inner">' + escapeHtml(w) + "</span></span>";
        })
        .join(" ");
      var inner = heading.querySelectorAll(".word-inner");
      gsap.set(inner, { yPercent: 110 });
      ScrollTrigger.create({
        trigger: heading,
        start: "top 88%",
        once: true,
        onEnter: function () {
          gsap.to(inner, { yPercent: 0, duration: 1, ease: "power4.out", stagger: 0.08 });
        },
      });
    });
  }

  /* "Decoding" text effect: characters scramble before settling on the new text. */
  var GLYPHS = "abcdefghijklmnopqrstuvwxyz<>/{}[]=+*#";
  function scrambleText(el, to) {
    var from = el.textContent;
    var length = Math.max(from.length, to.length);
    var queue = [];
    for (var k = 0; k < length; k++) {
      var start = Math.floor(Math.random() * 8);
      queue.push({ from: from[k] || "", to: to[k] || "", start: start, end: start + 6 + Math.floor(Math.random() * 10) });
    }
    var frame = 0;
    (function update() {
      var out = "";
      var done = 0;
      queue.forEach(function (q) {
        if (frame >= q.end) {
          done++;
          out += q.to;
        } else if (frame >= q.start) {
          out += q.to === " " ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        } else {
          out += q.from;
        }
      });
      el.textContent = out;
      frame++;
      if (done < queue.length) requestAnimationFrame(update);
    })();
  }

  /* Cycles the last line of the hero title through hero.roles in settings.yml. */
  function startRoleRotation(title) {
    var roles;
    try {
      roles = JSON.parse(title.getAttribute("data-roles") || "[]");
    } catch (e) {
      roles = [];
    }
    var lines = title.querySelectorAll(".line-inner");
    var target = lines[lines.length - 1];
    if (!target || roles.length < 2) return;
    target.classList.add("hero-role");
    var index = 0;
    setInterval(function () {
      // Don't animate while the tab is hidden or the hero is scrolled away
      if (document.hidden || window.scrollY > window.innerHeight) return;
      index = (index + 1) % roles.length;
      scrambleText(target, roles[index]);
    }, 2000);
  }

  /* ---------------- Navigation entrance ---------------- */
  var nav = document.querySelector(".navigation");
  if (nav) {
    gsap.from(nav, { y: -40, autoAlpha: 0, duration: 0.7, ease: EASE });
  }

  /* ---------------- Hero entrance timeline ---------------- */
  var heroTitle = document.querySelector(".hero-title");
  var heroDesc = document.querySelector(".hero-description");
  var heroSocial = document.querySelectorAll(".hero-social-icons li");
  var heroIllustration = document.querySelector(".code-window-illustration");

  var heroTl = gsap.timeline({ defaults: { ease: EASE } });

  if (heroTitle) {
    var heroLines = splitLines(heroTitle);
    heroTl.from(heroLines, { yPercent: 110, duration: 1.1, ease: "power4.out", stagger: 0.12 }, 0.1);
    heroTl.call(startRoleRotation, [heroTitle], "+=0.4");
  }
  if (heroDesc) {
    heroTl.from(heroDesc, { y: 30, autoAlpha: 0, duration: 0.8 }, 0.3);
  }
  if (heroSocial.length) {
    heroTl.from(
      heroSocial,
      { y: 20, autoAlpha: 0, duration: 0.6, stagger: 0.08 },
      0.5
    );
  }
  if (heroIllustration) {
    heroTl.from(
      heroIllustration,
      { scale: 0.85, autoAlpha: 0, duration: 1, ease: "back.out(1.6)" },
      0.25
    );

    typeCode(heroIllustration, heroTl);
  }

  /* ---------------- Generic section header reveals ---------------- */
  revealBatch(
    ".section-eyebrow",
    { from: { y: 16 }, to: {} },
    0.1
  );
  revealBatch(
    ".section-heading:not(.section-title)",
    { from: { y: 24 }, to: {} },
    0.1
  );
  revealWords("h2.section-title");
  revealBatch(
    ".section-divider",
    { from: { scaleX: 0, transformOrigin: "center" }, to: { scaleX: 1 } },
    0.1
  );

  /* ---------------- About ---------------- */
  revealBatch(".about-photo-wrap", { from: { y: 30, scale: 0.94 }, to: {} });
  revealBatch(".about-headline, .about-intro", { from: { y: 24 }, to: {} }, 0.1);
  revealBatch(".about-fact", { from: { x: -20 }, to: { x: 0 } }, 0.1);
  revealBatch(".about-actions", { from: { y: 20 }, to: {} });

  /* ---------------- Skills ---------------- */
  document.querySelectorAll(".skills-category-header").forEach(function (header, i) {
    if (typeof ScrollTrigger === "undefined") return;
    gsap.set(header, { autoAlpha: 0, x: -20 });
    ScrollTrigger.create({
      trigger: header,
      start: "top 90%",
      once: true,
      onEnter: function () {
        gsap.to(header, { autoAlpha: 1, x: 0, duration: 0.6, ease: EASE });
      },
    });
  });
  revealBatch(".skill-chip", { from: { y: 14, scale: 0.9 }, to: {} }, 0.04);

  /* ---------------- Portfolio ---------------- */
  revealBatch(
    ".portfolio-card-link",
    { from: { y: 40 }, to: {} },
    0.15
  );

  /* Inner pages: header title slides up, project cards reveal */
  var pageHeroTitle = document.querySelector(".page-hero-title");
  if (pageHeroTitle) {
    var pageHeroLines = splitLines(pageHeroTitle);
    gsap.from(pageHeroLines, { yPercent: 110, duration: 1.1, ease: "power4.out", delay: 0.15 });
    gsap.from(".page-hero-prompt, .page-hero-subtitle", { autoAlpha: 0, y: 16, duration: 0.8, stagger: 0.1, ease: EASE, delay: 0.3 });
  }
  revealBatch(".project-summary-card", { from: { y: 40 }, to: {} }, 0.1);
  revealBatch(".project-filters, .gh-window", { from: { y: 24 }, to: {} });

  /* ---------------- Experience ---------------- */
  document.querySelectorAll(".experience-item").forEach(function (item, i) {
    if (typeof ScrollTrigger === "undefined") return;
    var logo = item.querySelector(".experience-logo");
    var details = item.querySelectorAll(
      ".experience-name, .experience-org, .experience-description, .experience-tech-label, .badge"
    );

    gsap.set(item, { autoAlpha: 0, y: 30 });
    if (logo) gsap.set(logo, { autoAlpha: 0, scale: 0.6 });

    ScrollTrigger.create({
      trigger: item,
      start: "top 85%",
      once: true,
      onEnter: function () {
        var tl = gsap.timeline({ defaults: { ease: EASE } });
        tl.to(item, { autoAlpha: 1, y: 0, duration: 0.7 });
        if (logo) {
          tl.to(
            logo,
            { autoAlpha: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)" },
            "-=0.5"
          );
        }
        if (details.length) {
          tl.from(
            details,
            { autoAlpha: 0, y: 14, duration: 0.5, stagger: 0.05 },
            "-=0.4"
          );
        }
      },
    });
  });

  /* ---------------- Education ---------------- */
  revealBatch(".education-card", { from: { y: 30 }, to: {} }, 0.2);

  /* ---------------- Contact ---------------- */
  revealBatch(".contact-info-col", { from: { x: -40 }, to: { x: 0 } });
  revealBatch(".contact-form-col", { from: { x: 40 }, to: { x: 0 } });
  revealBatch(".icon-btn", { from: { y: 14, scale: 0.7 }, to: {} }, 0.06);

  /* ---------------- Footer ---------------- */
  revealBatch(".footer-section .col-md-4", { from: { y: 24 }, to: {} }, 0.1);

  /* ================= Creative motion ================= */

  /* Scroll progress bar */
  if (typeof ScrollTrigger !== "undefined") {
    var progress = document.createElement("div");
    progress.className = "scroll-progress";
    document.body.appendChild(progress);
    gsap.to(progress, {
      scaleX: 1,
      ease: "none",
      scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
    });
  }

  /* Hero: layers drift apart as you scroll away */
  var hero = document.querySelector(".hero-area");
  if (hero && typeof ScrollTrigger !== "undefined") {
    var heroScroll = { trigger: hero, start: "top top", end: "bottom top", scrub: true };
    if (heroTitle) {
      gsap.to(heroTitle, { y: -140, opacity: 0, ease: "none", scrollTrigger: heroScroll });
    }
    if (heroIllustration) {
      gsap.to(heroIllustration, { y: -60, ease: "none", scrollTrigger: heroScroll });
    }
  }

  /* Hero: code window tilts toward the cursor and the glow follows it */
  if (hero && heroIllustration && finePointer) {
    var glow = heroIllustration.querySelector(".cw-glow");
    gsap.set(heroIllustration, { transformPerspective: 1000 });
    var tiltX = gsap.quickTo(heroIllustration, "rotationX", { duration: 0.8, ease: "power3" });
    var tiltY = gsap.quickTo(heroIllustration, "rotationY", { duration: 0.8, ease: "power3" });
    var glowX = glow && gsap.quickTo(glow, "x", { duration: 1.2, ease: "power3" });
    var glowY = glow && gsap.quickTo(glow, "y", { duration: 1.2, ease: "power3" });

    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      tiltY(px * 14);
      tiltX(-py * 10);
      if (glow) {
        glowX(px * 120);
        glowY(py * 120);
      }
    });
    hero.addEventListener("mouseleave", function () {
      tiltX(0);
      tiltY(0);
      if (glow) {
        glowX(0);
        glowY(0);
      }
    });
  }

  /* Git commit graph: a branch line in the left margin that draws itself as
     you scroll the home page. Each section is a commit node; a HEAD tag rides
     the tip of the line. Only shown when the margin is wide enough. */
  function shortHash(text) {
    var h = 2166136261;
    for (var i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return ("0000000" + (h >>> 0).toString(16)).slice(-7);
  }

  var heroSection = document.querySelector(".hero-area");
  var graphSections = [];
  document.querySelectorAll("section").forEach(function (section) {
    var title = section.querySelector("h2.section-title");
    if (title && !section.classList.contains("hero-area")) {
      graphSections.push({ section: section, title: title.textContent.replace(/\s+/g, " ").trim().toLowerCase() });
    }
  });

  if (heroSection && graphSections.length && typeof ScrollTrigger !== "undefined") {
    var graph = document.createElement("div");
    graph.className = "git-graph";
    graph.setAttribute("aria-hidden", "true");
    graph.innerHTML =
      '<div class="git-graph-track"></div><div class="git-graph-fill"></div>' +
      '<div class="git-head"><span class="git-head-tag">HEAD</span></div>';
    document.body.appendChild(graph);

    var fill = graph.querySelector(".git-graph-fill");
    var head = graph.querySelector(".git-head");

    var commits = [{ label: "init", type: "chore" }].concat(
      graphSections.map(function (s) {
        return { label: s.title, type: "feat", section: s.section };
      })
    );
    commits.forEach(function (c) {
      c.el = document.createElement("div");
      c.el.className = "git-node";
      c.el.innerHTML =
        '<span class="git-node-dot"></span><span class="git-node-label">' +
        '<span class="git-node-hash">' + shortHash(c.label) + "</span><span>" +
        escapeHtml(c.type + ": " + c.label) + "</span></span>";
      graph.appendChild(c.el);
    });

    var graphTop = 0;
    var graphHeight = 0;
    // One smoothed value drives the line, HEAD and the nodes so they never drift apart
    var tipState = { tip: 0 };
    gsap.set(head, { autoAlpha: 0, x: -5, yPercent: -50 });

    var layoutGraph = function () {
      var firstSection = graphSections[0].section;
      var lastSection = graphSections[graphSections.length - 1].section;
      var container = firstSection.querySelector(".container");
      var containerLeft = container ? container.getBoundingClientRect().left : 0;

      // Needs ~130px of margin for the labels; otherwise hide it
      graph.classList.toggle("is-hidden", containerLeft < 130);

      // Start a little below the hero so the first node sits clear of its edge
      graphTop = heroSection.offsetTop + heroSection.offsetHeight + 48;
      var bottom = lastSection.offsetTop + lastSection.offsetHeight - 120;
      graphHeight = Math.max(bottom - graphTop, 0);
      graph.style.top = graphTop + "px";
      graph.style.height = graphHeight + "px";
      graph.style.left = Math.max(containerLeft - 120, 24) + "px";

      commits.forEach(function (c) {
        c.y = c.section
          ? c.section.querySelector("h2.section-title").getBoundingClientRect().top + window.scrollY - graphTop
          : 0;
        c.el.style.top = c.y + "px";
      });
    };

    var renderGraph = function () {
      var tip = tipState.tip;
      gsap.set(fill, { scaleY: graphHeight ? tip / graphHeight : 0 });
      gsap.set(head, { y: tip });
      commits.forEach(function (c) {
        c.el.classList.toggle("is-active", tip > 0 && c.y <= tip);
      });
    };

    var headVisible = false;
    var updateGraph = function (immediate) {
      // The tip of the line follows the middle of the viewport. While the hero is
      // still on screen the tip is above the graph, so HEAD stays hidden instead
      // of sitting parked at the top.
      var raw = window.scrollY + window.innerHeight * 0.55 - graphTop;
      var tip = Math.min(Math.max(raw, 0), graphHeight);

      var show = raw > 0;
      if (show !== headVisible) {
        headVisible = show;
        gsap.to(head, { autoAlpha: show ? 1 : 0, duration: 0.3, overwrite: "auto" });
      }

      if (immediate === true) {
        gsap.killTweensOf(tipState);
        tipState.tip = tip;
        renderGraph();
      } else {
        gsap.to(tipState, { tip: tip, duration: 0.45, ease: "power3.out", overwrite: true, onUpdate: renderGraph });
      }
    };

    layoutGraph();
    updateGraph(true);
    ScrollTrigger.create({ start: 0, end: "max", onUpdate: function () { updateGraph(); } });
    ScrollTrigger.addEventListener("refresh", function () {
      layoutGraph();
      updateGraph(true);
    });
    window.addEventListener("load", function () {
      ScrollTrigger.refresh();
    });
  }

  /* About photo: gentle parallax inside its frame */
  var aboutPhoto = document.querySelector(".about-photo");
  if (aboutPhoto && typeof ScrollTrigger !== "undefined") {
    gsap.fromTo(
      aboutPhoto,
      { y: 24 },
      {
        y: -24,
        ease: "none",
        scrollTrigger: { trigger: ".about-photo-wrap", start: "top bottom", end: "bottom top", scrub: true },
      }
    );
  }

  if (finePointer) {
    /* Magnetic buttons: pulled slightly toward the cursor */
    document
      .querySelectorAll(".btn-accent, .btn-outline-accent, .icon-btn, .hero-social-icons a")
      .forEach(function (el) {
        el.classList.add("is-magnetic");
        var xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3" });
        var yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3" });
        el.addEventListener("mousemove", function (e) {
          var r = el.getBoundingClientRect();
          xTo((e.clientX - r.left - r.width / 2) * 0.3);
          yTo((e.clientY - r.top - r.height / 2) * 0.4);
        });
        el.addEventListener("mouseleave", function () {
          xTo(0);
          yTo(0);
        });
      });

    /* Cards: 3D tilt + lift, with a spotlight that follows the cursor */
    document.querySelectorAll(".portfolio-card, .edu-card, .project-summary-card").forEach(function (card) {
      card.classList.add("has-tilt");
      gsap.set(card, { transformPerspective: 900 });
      var rotX = gsap.quickTo(card, "rotationX", { duration: 0.5, ease: "power3" });
      var rotY = gsap.quickTo(card, "rotationY", { duration: 0.5, ease: "power3" });
      var lift = gsap.quickTo(card, "y", { duration: 0.5, ease: "power3" });

      card.addEventListener("mouseenter", function () {
        lift(-8);
      });
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        rotY((px - 0.5) * 8);
        rotX(-(py - 0.5) * 8);
        card.style.setProperty("--mx", px * 100 + "%");
        card.style.setProperty("--my", py * 100 + "%");
      });
      card.addEventListener("mouseleave", function () {
        rotX(0);
        rotY(0);
        lift(0);
      });
    });
  }
})();
