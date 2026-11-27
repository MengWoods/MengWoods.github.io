(function () {
  var root = document.documentElement;

  // Dark mode toggle (initial theme is set inline in <head> to avoid a flash).
  var toggle = document.getElementById("theme-toggle");
  if (toggle) toggle.addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
    var giscus = document.querySelector("iframe.giscus-frame");
    if (giscus) giscus.contentWindow.postMessage({ giscus: { setConfig: { theme: next } } }, "https://giscus.app");
  });

  // "/" focuses search.
  document.addEventListener("keydown", function (e) {
    if (e.key !== "/" || /input|textarea/i.test(document.activeElement.tagName)) return;
    e.preventDefault();
    var box = document.getElementById("search-input") || document.getElementById("side-q");
    if (box) box.focus(); else location.href = "/search/";
  });

  // Menu glider: a glowing pill that slides to the hovered item and rests on the current one.
  var nav = document.querySelector(".nav");
  var glider = nav && nav.querySelector(".nav-glider");
  if (glider) {
    var current = nav.querySelector('a[aria-current="page"]');
    var moveTo = function (a) {
      if (!a) { glider.style.opacity = "0"; return; }
      glider.style.left = a.offsetLeft + "px";
      glider.style.width = a.offsetWidth + "px";
      glider.style.setProperty("--g", getComputedStyle(a).getPropertyValue("--c"));
      glider.style.opacity = "1";
    };
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("mouseenter", function () { moveTo(a); });
      a.addEventListener("focus", function () { moveTo(a); });
    });
    nav.addEventListener("mouseleave", function () { moveTo(current); });
    addEventListener("resize", function () { moveTo(current); });
    glider.style.transition = "none";      // place it on the current item without animating on load
    moveTo(current);
    requestAnimationFrame(function () { requestAnimationFrame(function () { glider.style.transition = ""; }); });
  }

  // Cursor spotlight on cards, topic tiles and sidebar panels.
  document.querySelectorAll(".card, .topic, .panel").forEach(function (el) {
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", (e.clientX - r.left) + "px");
      el.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  // Fade/slide items in as they scroll into view (staggered per batch).
  if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var items = document.querySelectorAll(".card, .topic, .panel, .post-row, .tl-year, .pager a");
    var io = new IntersectionObserver(function (entries) {
      var batch = 0;
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.style.setProperty("--d", Math.min(batch++, 8) * 55 + "ms");
        el.classList.add("in");
        io.unobserve(el);
        // drop the helper classes afterwards so hover transitions work normally
        setTimeout(function () { el.classList.remove("reveal", "in"); el.style.removeProperty("--d"); }, 1200);
      });
    }, { rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) { el.classList.add("reveal"); io.observe(el); });
  }

  // Category timeline beside a post: scroll the current post into view (inside the sidebar only).
  var series = document.querySelector(".series-side");
  var cur = series && series.querySelector(".series-item.current");
  if (cur) series.scrollTop += cur.getBoundingClientRect().top - series.getBoundingClientRect().top - series.clientHeight / 3;

  // View transitions: the clicked post title morphs into the next page's <h1>.
  // Only one element per page may carry the name, so clear it from the current <h1> first.
  if ("onpageswap" in window) {
    document.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var link = e.target.closest("a");
      if (!link) return;
      var title = link.closest(".card h3") || (link.matches(".post-row-title") ? link : null) || link.querySelector(".series-title");
      if (!title) return;
      document.querySelectorAll("[style*=view-transition-name]").forEach(function (el) { el.style.viewTransitionName = ""; });
      var h1 = document.querySelector(".post-header h1");
      if (h1 && h1 !== title) h1.style.viewTransitionName = "none";
      title.style.viewTransitionName = "post-title";
    });
    // coming back via the back button (bfcache): reset the names
    addEventListener("pageshow", function (e) {
      if (!e.persisted) return;
      document.querySelectorAll("[style*=view-transition-name]").forEach(function (el) { el.style.viewTransitionName = ""; });
    });
  }

  // Reading progress bar on posts.
  var bar = document.querySelector(".progress");
  if (bar) {
    var update = function () {
      var max = document.documentElement.scrollHeight - innerHeight;
      bar.style.width = (max > 0 ? Math.min(100, scrollY / max * 100) : 0) + "%";
    };
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    update();
  }

  // Keep the summary in view when collapsing a long code preview.
  document.querySelectorAll(".code-preview-toggle summary").forEach(function (summary) {
    var details = summary.parentElement;
    summary.addEventListener("click", function (e) {
      if (e.defaultPrevented || !details.open) return;
      e.preventDefault();
      var stickyTop = parseFloat(getComputedStyle(details).top);
      var top = Math.max(stickyTop, summary.getBoundingClientRect().top);
      details.open = false;
      window.scrollBy({ top: summary.getBoundingClientRect().top - top, behavior: "instant" });
    });
  });

  // Copy buttons on code blocks.
  document.querySelectorAll(".code").forEach(function (block) {
    var btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.type = "button";
    btn.textContent = "Copy";
    btn.addEventListener("click", function () {
      var text = block.querySelector("code").innerText;
      navigator.clipboard.writeText(text).then(function () {
        btn.textContent = "Copied";
        setTimeout(function () { btn.textContent = "Copy"; }, 1500);
      });
    });
    block.appendChild(btn);
  });

  // Math (KaTeX is only loaded on pages that contain math).
  function renderMath() {
    if (!window.katex) return;
    document.querySelectorAll(".math").forEach(function (el) {
      try {
        katex.render(el.textContent, el, { displayMode: el.classList.contains("display"), throwOnError: false });
      } catch (e) {}
    });
  }
  if (document.querySelector(".math")) {
    if (window.katex) renderMath(); else window.addEventListener("load", renderMath);
  }

  // Click an image to zoom.
  document.querySelectorAll(".prose img").forEach(function (img) {
    if (img.closest("a")) return;
    img.addEventListener("click", function () {
      var overlay = document.createElement("div");
      overlay.className = "zoom";
      var big = document.createElement("img");
      big.src = img.currentSrc || img.src;
      big.alt = img.alt;
      overlay.appendChild(big);
      overlay.addEventListener("click", function () { overlay.remove(); });
      document.addEventListener("keydown", function esc(e) {
        if (e.key === "Escape") { overlay.remove(); document.removeEventListener("keydown", esc); }
      });
      document.body.appendChild(overlay);
    });
  });

  // Highlight the current section in the side table of contents.
  var links = document.querySelectorAll(".toc-side a");
  if (links.length && "IntersectionObserver" in window) {
    var map = {};
    links.forEach(function (a) { map[decodeURIComponent(a.hash.slice(1))] = a; });
    var visible = {};
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
      var heads = document.querySelectorAll(".prose h2[id], .prose h3[id]");
      var current = null;
      for (var i = 0; i < heads.length; i++) {
        if (heads[i].getBoundingClientRect().top < 120) current = heads[i].id;
      }
      links.forEach(function (a) { a.classList.remove("active"); });
      if (current && map[current]) map[current].classList.add("active");
    }, { rootMargin: "0px 0px -70% 0px" });
    document.querySelectorAll(".prose h2[id], .prose h3[id]").forEach(function (h) { obs.observe(h); });
  }
})();
