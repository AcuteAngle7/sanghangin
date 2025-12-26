const MD_PATH = "./Sanghangin.md";

function slugifyHeading(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

async function loadMarkdown() {
  const res = await fetch(MD_PATH, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${MD_PATH}: ${res.status}`);
  return await res.text();
}

function extractHeadings(md) {
  // Capture ## and ### headings for a usable nav
  const lines = md.split("\n");
  const headings = [];
  for (const line of lines) {
    const m = /^(#{2,3})\s+(.*)$/.exec(line);
    if (!m) continue;
    const level = m[1].length; // 2 or 3
    const text = m[2].trim();
    headings.push({ level, text, id: slugifyHeading(text) });
  }
  return headings;
}

function renderTOC(headings) {
  const toc = document.getElementById("toc");
  toc.innerHTML = "";

  for (const h of headings) {
    const div = document.createElement("div");
    div.className = "item";
    div.style.paddingLeft = h.level === 3 ? "16px" : "4px";

    const a = document.createElement("a");
    a.href = `#${h.id}`;
    a.textContent = h.text;

    div.appendChild(a);
    toc.appendChild(div);
  }
}

function wireSearch(headings) {
  const input = document.getElementById("q");
  input.addEventListener("input", () => {
    const q = input.value.toLowerCase().trim();
    const filtered = q
      ? headings.filter(h => h.text.toLowerCase().includes(q))
      : headings;
    renderTOC(filtered);
  });
}

function installHeadingIds() {
  // Ensure rendered headings get stable ids matching our slugify
  const headings = document.querySelectorAll("h2, h3");
  for (const h of headings) {
    const id = slugifyHeading(h.textContent || "");
    h.id = id;
  }
}

async function main() {
  const status = document.getElementById("status");
  status.textContent = " (loading…)";

  const md = await loadMarkdown();

  // Render markdown to HTML
  const html = marked.parse(md);
  const content = document.getElementById("content");
  content.innerHTML = html;

  installHeadingIds();

  const headings = extractHeadings(md);
  renderTOC(headings);
  wireSearch(headings);

  status.textContent = " (ready)";
}

main().catch(err => {
  const status = document.getElementById("status");
  status.textContent = " (error)";
  document.getElementById("content").textContent = String(err);
});
