(function () {
  var input = document.getElementById("search-input");
  var list = document.getElementById("search-results");
  var status = document.getElementById("search-status");
  var posts = null;

  function esc(s) {
    return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }
  function mark(text, terms) {
    var out = esc(text);
    terms.forEach(function (t) {
      out = out.replace(new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi"), "<mark>$1</mark>");
    });
    return out;
  }
  function snippet(p, terms) {
    var lower = p.x.toLowerCase();
    var i = lower.indexOf(terms[0]);
    if (i < 0) return p.s;
    var start = Math.max(0, i - 80);
    return (start > 0 ? "…" : "") + p.x.slice(start, i + 160) + "…";
  }

  function run() {
    var q = input.value.trim().toLowerCase();
    var url = new URL(location.href);
    if (q) url.searchParams.set("q", input.value.trim()); else url.searchParams.delete("q");
    history.replaceState(null, "", url);
    list.innerHTML = "";
    if (!q) { status.textContent = posts.length + " posts. Type to search titles, tags and full text."; return; }
    var terms = q.split(/\s+/).filter(Boolean);
    var hits = [];
    posts.forEach(function (p) {
      var title = p.t.toLowerCase(), tags = p.g.join(" ").toLowerCase(), body = p.x.toLowerCase();
      var score = 0;
      for (var i = 0; i < terms.length; i++) {
        var t = terms[i], s = 0;
        if (title.indexOf(t) >= 0) s += 10;
        if (tags.indexOf(t) >= 0 || p.c.toLowerCase().indexOf(t) >= 0) s += 5;
        if (body.indexOf(t) >= 0) s += 1;
        if (!s) return;          // every term must match somewhere
        score += s;
      }
      hits.push({ p: p, score: score });
    });
    hits.sort(function (a, b) { return b.score - a.score || (a.p.d < b.p.d ? 1 : -1); });
    status.textContent = hits.length + " result" + (hits.length === 1 ? "" : "s");
    list.innerHTML = hits.slice(0, 50).map(function (h) {
      var p = h.p;
      return '<li><a href="' + p.u + '">' + mark(p.t, terms) + "</a>" +
        '<p class="meta">' + esc(p.c) + " · " + p.d + "</p>" +
        "<p>" + mark(snippet(p, terms), terms) + "</p></li>";
    }).join("");
  }

  fetch("/search.json").then(function (r) { return r.json(); }).then(function (data) {
    posts = data;
    var q = new URL(location.href).searchParams.get("q");
    if (q) input.value = q;
    input.addEventListener("input", run);
    run();
  });
})();
