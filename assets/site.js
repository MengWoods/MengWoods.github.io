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
    var box = document.getElementById("search-input");
    if (box) box.focus(); else location.href = "/search/";
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
