const SAMPLE = {
  name: "Alex Rivera",
  pic: "",
  email: "alex@example.com",
  phone: "+63 912 345 6789",
  address: "Cebu City, Philippines",
  about:
    "Product-minded developer who enjoys turning complex problems into simple, well-crafted interfaces.",
  edu: "BS Information Technology | 2020 – 2024\nSenior High School, STEM | 2018 – 2020",
  skills: "JavaScript, React, UI Design, Node.js, SQL",
  proj: "Task Tracker | A minimalist to-do app used by 200+ students\nWeather Hub | Real-time forecasts with clean charts",
  exp: "Frontend Intern, Acme Studio | 2023\nFreelance Web Developer | 2021 – Present",
  links: "GitHub | https://github.com\nLinkedIn | https://linkedin.com",
};
const mem = {};
const S = {
  get(k) {
    try {
      return JSON.parse(localStorage.getItem(k));
    } catch (e) {
      return mem[k] ?? null;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) {
      mem[k] = v;
    }
    hook(k, 0);
  },
  del(k) {
    try {
      localStorage.removeItem(k);
    } catch (e) {
      delete mem[k];
    }
    hook(k, 1);
  },
};
/* ===== Supabase (online database) =====
   Fill in config.js with your project URL and anon key. If it is empty the site falls back to browser storage. */
const CFG = window.SUPABASE_CONFIG || {};
const sb =
  window.supabase && CFG.url && !CFG.url.startsWith("YOUR")
    ? window.supabase.createClient(CFG.url, CFG.anonKey)
    : null;
let saveTimer = null;
const toRow = (p, t) => ({
  full_name: p.name,
  email: p.email,
  phone: p.phone,
  address: p.address,
  about: p.about,
  education: p.edu,
  skills: p.skills,
  projects: p.proj,
  experience: p.exp,
  links: p.links,
  photo: p.pic,
  template: t,
});
const fromRow = (r) => ({
  name: r.full_name,
  email: r.email,
  phone: r.phone,
  address: r.address,
  about: r.about,
  edu: r.education,
  skills: r.skills,
  proj: r.projects,
  exp: r.experience,
  links: r.links,
  pic: r.photo,
});
const sbHeaders = { "Content-Type": "application/json" };

async function userId() {
  let stored = S.get("folio_uid");
  if (stored) return stored;
  let {
    data: { session },
  } = await sb.auth.getSession();
  if (!session) {
    const r = await sb.auth.signInAnonymously();
    if (r.error) throw r.error;
    session = r.data.session;
  }
  S.set("folio_uid", session.user.id);
  return session.user.id;
}

async function cloudInit() {
  try {
    const uid = await userId();
    const r = await fetch("api/get.php?uid=" + encodeURIComponent(uid));
    const rows = await r.json();
    if (Array.isArray(rows) && rows[0]) {
      P = fromRow(rows[0]);
      tpl = rows[0].template || 1;
    } else {
      P = null;
      tpl = 1;
    }
  } catch (e) {
    console.error(e);
    toast("Could not reach the database");
  }
}

async function cloudSave() {
  if (!P) return;
  try {
    const uid = await userId();
    const r = await fetch("api/save.php", {
      method: "POST",
      headers: sbHeaders,
      body: JSON.stringify({ uid, data: P, tpl }),
    });
    if (!r.ok) throw new Error(await r.text());
  } catch (e) {
    console.error(e);
    toast("Save failed: " + (e.message || "database error"));
  }
}

async function cloudDelete() {
  try {
    const uid = await userId();
    const r = await fetch("api/delete.php", {
      method: "POST",
      headers: sbHeaders,
      body: JSON.stringify({ uid }),
    });
    if (!r.ok) throw new Error(await r.text());
  } catch (e) {
    console.error(e);
    toast("Delete failed");
  }
}

function hook(k, del) {
  if (!k || (k !== "folio_p" && k !== "folio_t")) return;
  if (del) {
    if (k === "folio_p") cloudDelete();
    return;
  }
  clearTimeout(saveTimer);
  saveTimer = setTimeout(cloudSave, 300);
}

let P = S.get("folio_p"),
  tpl = S.get("folio_t") || 1;
const $ = (s) => document.querySelector(s),
  esc = (s) =>
    String(s ?? "").replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );
const toast = (t) => {
  const m = $("#msg");
  m.textContent = t;
  m.style.display = "block";
  setTimeout(() => (m.style.display = "none"), 2200);
};
const lines = (s) =>
  (s || "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((l) => {
      const [a, ...b] = l.split("|");
      return { t: a.trim(), d: b.join("|").trim() };
    });
const NAMES = ["Classic", "Modern", "Professional"],
  DESC = [
    "Traditional one-column resume",
    "Sidebar resume with photo",
    "Header banner with side column",
  ];
function render(p, t) {
  const h = render0(p, t),
    a = S.get("folio_a");
  return a
    ? h.replace('<div class="t', '<div style="--pa:' + a + '" class="t')
    : h;
}
function render0(p, t) {
  const ed = lines(p.edu),
    pr = lines(p.proj),
    ex = lines(p.exp),
    lk = lines(p.links),
    sk = (p.skills || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  const L = (a) =>
    a
      .map(
        (x) =>
          `<div class="it"><b>${esc(x.t)}</b>${x.d ? `<span>${esc(x.d)}</span>` : ""}</div>`,
      )
      .join("") || "<span>—</span>";
  const K = lk
    .map(
      (x) =>
        `<a href="${/^https?:/.test(x.d) ? esc(x.d) : "#"}" target="_blank" rel="noopener">${esc(x.t)}</a>`,
    )
    .join(" &nbsp;/&nbsp; ");
  const img = p.pic ? `<img src="${esc(p.pic)}" alt="">` : "";
  const ct = [p.email, p.phone, p.address]
    .filter(Boolean)
    .map(esc)
    .join(" &nbsp;·&nbsp; ");
  const ini = esc((p.name || "A").trim()[0] || "A").toUpperCase(),
    av = img || `<div class="mono">${ini}</div>`;
  const side = `${esc(p.email)}<br>${esc(p.phone)}<br>${esc(p.address)}`;
  if (t == 1)
    return `<div class="t1"><header><div><h1>${esc(p.name)}</h1><div class="ct">${ct}</div></div>${av}</header><h2>Summary</h2><p style="margin:0">${esc(p.about)}</p><h2>Experience</h2>${L(ex)}<h2>Education</h2>${L(ed)}<h2>Projects</h2>${L(pr)}<h2>Skills</h2><p style="margin:0">${esc(sk.join(", "))}</p><h2>Links</h2><p style="margin:0">${K}</p></div>`;
  if (t == 2)
    return `<div class="t2"><aside>${av}<h3>Contact</h3><div class="ct">${side}</div><h3>Skills</h3><div class="ct">${sk.map(esc).join("<br>")}</div><h3>Links</h3><div class="ct">${K}</div></aside><section><h1>${esc(p.name)}</h1><h2>Profile</h2><p style="margin:0">${esc(p.about)}</p><h2>Experience</h2>${L(ex)}<h2>Education</h2>${L(ed)}<h2>Projects</h2>${L(pr)}</section></div>`;
  return `<div class="t3"><header>${av}<div style="flex:1"><h1>${esc(p.name)}</h1></div><div class="ct">${side}</div></header><div class="body"><div class="main"><h2>Profile</h2><p style="margin:0">${esc(p.about)}</p><h2>Experience</h2>${L(ex)}<h2>Projects</h2>${L(pr)}</div><div class="side"><h2>Education</h2>${L(ed)}<h2>Skills</h2><p style="margin:0">${sk.map(esc).join("<br>")}</p><h2>Links</h2><p style="margin:0">${K}</p></div></div></div>`;
}
function route() {
  const h = (location.hash || "#home").slice(1);
  document
    .querySelectorAll("nav a")
    .forEach((a) => a.classList.toggle("on", a.hash === "#" + h));
  (({ home, form, templates, preview, manage, feedback, design })[h] || home)();
  const m = { form: 1, templates: 2, preview: 3 }[h];
  if (m)
    $("#app").insertAdjacentHTML(
      "afterbegin",
      `<div class="stp" data-el="Unity · Line">${["Information", "Template", "Preview"].map((x, i) => `<div class="${i < m ? "dn" : ""} ${i == m - 1 ? "cur" : ""}"><i>${i < m - 1 ? "✓" : i + 1}</i>${x}</div>`).join("<hr>")}</div>`,
    );
  scrollTo(0, 0);
  moveInd();
}
function moveInd() {
  const a = document.querySelector("nav a.on"),
    i = $("#ind");
  if (!a) return (i.style.opacity = 0);
  i.style.left = a.offsetLeft + "px";
  const nl = a.parentNode;
  nl.scrollTo({
    left: Math.max(0, a.offsetLeft - nl.clientWidth / 2 + a.offsetWidth / 2),
    behavior: "smooth",
  });
  i.style.width = a.offsetWidth + "px";
  i.style.opacity = 1;
}
addEventListener("resize", moveInd);
addEventListener("load", moveInd);
document.addEventListener("click", (e) => {
  const b = e.target.closest("button,.btn");
  if (!b || b.closest(".stars")) return;
  const r = b.getBoundingClientRect(),
    d = document.createElement("span");
  d.className = "rp";
  d.style.left = e.clientX - r.left + "px";
  d.style.top = e.clientY - r.top + "px";
  b.appendChild(d);
  setTimeout(() => d.remove(), 650);
});
$("nav b").onclick = () => (location.hash = "#home");
addEventListener("hashchange", route);
const need = () => {
  $("#app").innerHTML =
    '<div class="card">Nothing saved yet. <a href="#form">Enter your information</a> first.</div>';
};
function home() {
  const F = [
    [
      "◧",
      "Three distinct templates",
      "Classic, Modern and Professional — each with its own layout and personality.",
    ],
    [
      "◉",
      "Live previews",
      "See every design with your own details before you commit.",
    ],
    [
      "✎",
      "Edit anytime",
      "Update, switch templates, or delete with a single click.",
    ],
    ["◐", "Accent colors", "Tune any template to your style with one tap."],
    ["▢", "Fully responsive", "Looks sharp on phones, tablets and desktops."],
    [
      "🔒",
      "Private by default",
      "Your data stays in your browser during testing.",
    ],
  ];
  $("#app").innerHTML =
    `<section class="hero2"><div class="shp"><i></i><i></i><i></i></div><div class="hero"><h1 data-el="Hierarchy · Scale">Your portfolio,<br>beautifully simple.</h1><p>Enter your details once, pick a design, and get a polished portfolio in minutes — no code required.</p><div data-el="Contrast · Dominance"><a class="btn" href="#form">Create Portfolio →</a> ${P ? '<a class="btn sec" href="#manage">Manage mine</a>' : '<a class="btn sec" href="#templates">Browse templates</a>'}</div><div class="stats"><div><b>3</b>Templates</div><div><b>6</b>Accent colors</div><div><b>&lt; 2 min</b>To publish</div></div></div><div class="mock" data-el="Volume · Shape"><span class="badge">● Live preview</span><div class="mq"><div class="mt">${[1, 2, 3, 1, 2, 3].map((i) => `<div class="mc"><span class="ml">${NAMES[i - 1]}</span><div>${render(P || SAMPLE, i)}</div></div>`).join("")}</div></div></div></section>
<section class="sec2"><h2>Everything you need, nothing you don't</h2><p>A focused toolkit for building a portfolio that feels professional.</p><div class="feat" data-el="Similarity · Gestalt">${F.map((f) => `<div class="card"><i>${f[0]}</i><b>${f[1]}</b><span>${f[2]}</span></div>`).join("")}</div></section>
<section class="sec2"><h2>How it works</h2><p>From blank page to portfolio in four steps.</p><div class="steps" style="margin:0"><div><b>1 · Enter</b>Your details</div><div><b>2 · Choose</b>One of 3 designs</div><div><b>3 · Customize</b>Pick an accent</div><div><b>4 · Refine</b>Edit or share feedback</div></div></section>
<section class="band" data-el="Value · Colour · Texture"><h2>Ready to stand out?</h2><p>Build your portfolio now — it's free and takes minutes.</p><a class="btn" href="#form">Get started</a></section>`;
  fit();
}
function design() {
  const D = {
    line: '<svg viewBox="0 0 120 50" width="100%" height="50"><path d="M5 42H115" stroke="currentColor"/><path d="M5 27H115" stroke="currentColor" stroke-width="4"/><path d="M5 12C35 -6 60 30 115 8" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    shape:
      '<div class="dm"><i style="border-radius:50%"></i><i></i><i style="clip-path:polygon(50% 0,100% 100%,0 100%)"></i></div>',
    neg: '<div class="ng"><i></i></div>',
    vol: '<div class="vl"><i></i><i></i><i></i></div>',
    val:
      '<div class="vs">' +
      ["#f4f4f5", "#d4d4d8", "#a1a1aa", "#52525b", "#18181b"]
        .map((c) => `<i style="background:${c}"></i>`)
        .join("") +
      "</div>",
    col:
      '<div class="vs">' +
      ["#e4572e", "#14110f", "#fafaf9", "#10b981"]
        .map(
          (c) => `<i style="background:${c};border:1px solid var(--bd)"></i>`,
        )
        .join("") +
      "</div>",
    tex: '<div class="tx"></div>',
  };
  const E = [
    [
      "Line",
      "line",
      "Thin hairlines, dividers and the underline on menu hover guide the eye and separate sections.",
    ],
    [
      "Shape",
      "shape",
      "One shape language: rounded rectangles for cards and inputs, pills for tags, circles for avatars.",
    ],
    [
      "Negative space",
      "neg",
      "Generous margins around the hero, forms and cards give every element room to breathe.",
    ],
    [
      "Volume",
      "vol",
      "Soft shadows and stacked cards create depth on a flat screen, such as the floating template previews.",
    ],
    [
      "Value",
      "val",
      "Light page against dark text gives clarity; mid-greys keep secondary text subtle.",
    ],
    [
      "Colour",
      "col",
      "A calm neutral palette with one orange-red accent (RGB 228, 87, 46) for actions and highlights.",
    ],
    [
      "Texture",
      "tex",
      "A subtle dot grid and diagonal lines add an implied texture to the hero and call-to-action band.",
    ],
  ];
  const Pr = [
    ["Unity", "Same fonts, colours, spacing and shapes on every page."],
    [
      "Gestalt",
      "Related items are grouped, like the feature cards and form sections.",
    ],
    [
      "Hierarchy",
      "Large headlines first, then body text, then small captions.",
    ],
    ["Balance", "Text on the left is balanced by the preview on the right."],
    ["Contrast", "The orange button stands out against the paper-toned page."],
    ["Scale", "Big headings and small hints show what matters most."],
    ["Dominance", "One primary action per screen: Create, Save or Generate."],
    [
      "Similarity",
      "Every card, input and button follows one consistent style.",
    ],
  ];
  $("#app").innerHTML =
    `<h1 class="pg" data-el="Hierarchy · Scale">Design guide</h1><p class="sub">How Folio applies the elements and principles of visual design.</p><div class="row" style="margin:0 0 24px"><button id="ga">See it on the site →</button></div>
<h2 class="h2">Elements of visual design</h2><div class="feat" data-el="Similarity · Gestalt">${E.map((e) => `<div class="card"><div class="dem">${D[e[1]]}</div><b>${e[0]}</b><span>${e[2]}</span></div>`).join("")}</div>
<h2 class="h2" style="margin-top:48px">Principles of design</h2><div class="feat" data-el="Unity · Hierarchy">${Pr.map((x, i) => `<div class="card"><small style="color:var(--brand)">0${i + 1}</small><b>${x[0]}</b><span>${x[1]}</span></div>`).join("")}</div>`;
  $("#ga").onclick = () => {
    document.body.classList.add("ann");
    $("#an").classList.add("on");
    location.hash = "#home";
  };
}
function form() {
  const p = P || {};
  const f = (k, l, t = "text") =>
    `<div><label>${l}</label><input type="${t}" id="f_${k}" value="${esc(p[k])}"></div>`;
  $("#app").innerHTML =
    `<h1 class="pg" data-el="Hierarchy · Scale">Your information</h1><p class="sub">Fill in what you like — everything can be edited later.</p><div class="banner">${sb ? "Connected: your portfolio is saved in the online database (Supabase)." : "Test mode: data is saved in this browser only (no online database)."}</div><div class="fl"><div class="card" data-el="Negative space · Similarity"><div class="pbar"><div id="pb"></div></div><div id="pt" style="margin-bottom:8px"></div><label style="margin-top:0">Profile picture</label><input type="file" id="pic" accept="image/*"><img id="pv" src="${esc(p.pic || "")}" style="width:72px;height:72px;border-radius:50%;object-fit:cover;margin-top:10px;display:${p.pic ? "block" : "none"}">
<div class="two">${f("name", "Full name")}${f("email", "Email", "email")}${f("phone", "Contact number")}${f("address", "Address")}</div>
<label>About me</label><textarea id="f_about">${esc(p.about)}</textarea>
<label>Education <small>— add as many as you like</small></label><div class="il" data-l="edu"></div><textarea id="f_edu" hidden>${esc(p.edu)}</textarea>
<label>Skills <small>— comma separated</small></label><input type="text" id="f_skills" value="${esc(p.skills)}">
<label>Projects <small>— add as many as you like</small></label><div class="il" data-l="proj"></div><textarea id="f_proj" hidden>${esc(p.proj)}</textarea>
<label>Work experience <small>— add as many as you like</small></label><div class="il" data-l="exp"></div><textarea id="f_exp" hidden>${esc(p.exp)}</textarea>
<label>Social / website links <small>— add as many as you like</small></label><div class="il" data-l="links"></div><textarea id="f_links" hidden>${esc(p.links)}</textarea>
<div class="row"><button id="sv">Save &amp; continue</button><button class="sec" id="fill">Fill with sample</button></div></div><aside class="card exp" id="exp" data-el="Gestalt · Proximity"></aside></div>`;
  let pic = p.pic || "";
  const prog = () => {
    const n =
        [
          "name",
          "email",
          "phone",
          "address",
          "about",
          "edu",
          "skills",
          "proj",
          "exp",
          "links",
        ].filter((x) => $("#f_" + x).value.trim()).length + (pic ? 1 : 0),
      c = Math.round((n / 11) * 100);
    $("#pb").style.width = c + "%";
    $("#pt").textContent = c + "% complete";
  };
  $("#app").oninput = prog;
  prog();
  const EX = {
    name: "Alex Rivera",
    email: "alex@example.com",
    phone: "+63 912 345 6789",
    address: "Cebu City, Philippines",
    about: SAMPLE.about,
    edu: SAMPLE.edu,
    skills: SAMPLE.skills,
    proj: SAMPLE.proj,
    exp: SAMPLE.exp,
    links: SAMPLE.links,
  };
  const LS = {
      edu: ["Degree or school", "Years"],
      proj: ["Project title", "Short description"],
      exp: ["Role, Company", "Years"],
      links: ["Label, e.g. GitHub", "https://…"],
    },
    AD = {
      edu: "education",
      proj: "project",
      exp: "experience",
      links: "link",
    };
  const sync = (k) => {
    const r = [...document.querySelectorAll(`.il[data-l=${k}] .ir`)]
      .map((w) => {
        const [a, b] = [...w.querySelectorAll("input")].map((i) =>
          i.value.replace(/\|/g, "/").trim(),
        );
        return a ? a + (b ? " | " + b : "") : "";
      })
      .filter(Boolean);
    $("#f_" + k).value = r.join("\n");
    prog();
  };
  const build = (k, more) => {
    const box = document.querySelector(`.il[data-l=${k}]`),
      it = lines($("#f_" + k).value);
    if (!it.length || more) it.push({ t: "", d: "" });
    box.innerHTML =
      it
        .map(
          (x) =>
            `<div class="ir"><input type="text" data-k="${k}" placeholder="${LS[k][0]}" value="${esc(x.t)}"><input type="text" data-k="${k}" placeholder="${LS[k][1]}" value="${esc(x.d)}"><button type="button" class="sec rm" title="Remove">✕</button></div>`,
        )
        .join("") +
      `<button type="button" class="sec add">+ Add ${AD[k]}</button>`;
    box.querySelectorAll("input").forEach((i) => (i.oninput = () => sync(k)));
    box.querySelectorAll(".rm").forEach(
      (b) =>
        (b.onclick = () => {
          b.parentNode.remove();
          sync(k);
          if (!box.querySelector(".ir")) build(k);
        }),
    );
    box.querySelector(".add").onclick = () => build(k, true);
  };
  const LB = {
      name: "Full name",
      email: "Email",
      phone: "Contact number",
      address: "Address",
      about: "About me",
      edu: "Education",
      skills: "Skills",
      proj: "Projects",
      exp: "Work experience",
      links: "Links",
    },
    HT = {
      name: "Your first and last name as you want it shown.",
      email: "An address people can contact you on.",
      phone: "Include your country code.",
      address:
        "City and country is enough — no need for a full street address.",
      about: "2–3 sentences: who you are and what you do.",
      edu: "Add each school or degree separately, with its years.",
      skills: "Separate each skill with a comma.",
      proj: "Add each project with a title and a one-line description.",
      exp: "Add each job with your role, the company and the years.",
      links: "Use a short label and the full link starting with https://",
    };
  const showEx = (k) => {
    $("#exp").innerHTML =
      `<small>EXAMPLE</small><b style="display:block;margin:2px 0 8px">${LB[k]}</b><code>${esc(EX[k])}</code><p>${HT[k]}</p><button class="sec" id="ue">Use this example</button>`;
    $("#ue").onclick = () => {
      $("#f_" + k).value = EX[k];
      if (LS[k]) build(k);
      prog();
    };
  };
  Object.keys(EX).forEach((k) => ($("#f_" + k).placeholder = EX[k]));
  Object.keys(LS).forEach((k) => build(k));
  showEx("name");
  window._sx = (k) => {
    if (EX[k]) showEx(k);
  };
  $("#pic").onchange = (e) => {
    const fl = e.target.files[0];
    if (!fl) return;
    const r = new FileReader();
    r.onload = () => {
      const i = new Image();
      i.onload = () => {
        const c = document.createElement("canvas"),
          s = Math.min(1, 320 / Math.max(i.width, i.height));
        c.width = i.width * s;
        c.height = i.height * s;
        c.getContext("2d").drawImage(i, 0, 0, c.width, c.height);
        pic = c.toDataURL("image/jpeg", 0.82);
        $("#pv").src = pic;
        $("#pv").style.display = "block";
        prog();
      };
      i.src = r.result;
    };
    r.readAsDataURL(fl);
  };
  $("#fill").onclick = () => {
    P = { ...SAMPLE, pic };
    form();
  };
  $("#sv").onclick = () => {
    const g = (k) => $("#f_" + k).value.trim();
    if (!g("name")) return toast("Please enter your full name");
    P = {
      pic,
      name: g("name"),
      email: g("email"),
      phone: g("phone"),
      address: g("address"),
      about: g("about"),
      edu: g("edu"),
      skills: g("skills"),
      proj: g("proj"),
      exp: g("exp"),
      links: g("links"),
    };
    S.set("folio_p", P);
    toast("Saved");
    location.hash = "#templates";
  };
}
function fit() {
  document.querySelectorAll(".vw").forEach((v) => {
    const c = v.firstElementChild,
      s = v.clientWidth / 800;
    c.style.transform = `scale(${s})`;
    v.style.height =
      Math.round(Math.min(+v.dataset.cap || 300, c.offsetHeight * s)) + "px";
  });
}
function templates() {
  const d = P || SAMPLE;
  $("#app").innerHTML =
    `<h1 class="pg" data-el="Hierarchy · Scale">Choose a template</h1><p class="sub">${P ? "Previews use your information." : 'Previews use sample data — <a href="#form">add your own</a>.'}</p><div class="tgrid" data-el="Similarity · Shape">${[1, 2, 3].map((i) => `<div class="tpl ${tpl == i ? "sel" : ""}" data-i="${i}"><div class="vw"><div>${render(d, i)}</div></div><h3>${i}. ${NAMES[i - 1]}</h3><p>${DESC[i - 1]}</p></div>`).join("")}</div><div class="row" data-el="Contrast · Dominance"><button id="go">Generate portfolio</button></div>`;
  fit();
  document.querySelectorAll(".tpl").forEach(
    (e) =>
      (e.onclick = () => {
        tpl = +e.dataset.i;
        S.set("folio_t", tpl);
        document
          .querySelectorAll(".tpl")
          .forEach((x) => x.classList.toggle("sel", x == e));
      }),
  );
  $("#go").onclick = () => {
    if (!P)
      return (toast("Add your information first"), (location.hash = "#form"));
    S.set("folio_t", tpl);
    location.hash = "#preview";
  };
}
addEventListener("resize", () => document.querySelector(".vw") && fit());
function preview() {
  if (!P) return need();
  $("#app").innerHTML =
    `<div class="row" data-el="Proximity · Contrast" style="margin:0 0 16px;justify-content:space-between"><div style="display:flex;gap:8px;flex-wrap:wrap">${[1, 2, 3].map((i) => `<button class="${tpl == i ? "" : "sec"}" data-i="${i}">${NAMES[i - 1]}</button>`).join("")}</div><div style="display:flex;gap:8px"><a class="btn sec" href="#form">Edit</a><a class="btn" href="#feedback">Finish &amp; give feedback</a></div></div>${`<div class="sw2" data-el="Colour">Accent ${["#2563eb", "#e11d48", "#059669", "#d97706", "#7c3aed", "#0891b2"].map((c) => `<button class="dot" data-c="${c}" style="background:${c}"></button>`).join("")}<button class="dot reset" data-c="">↺</button></div>`}<div class="frame" data-el="Volume · Balance">${render(P, tpl)}</div>`;
  document.querySelectorAll("[data-c]").forEach(
    (b) =>
      (b.onclick = () => {
        b.dataset.c ? S.set("folio_a", b.dataset.c) : S.del("folio_a");
        preview();
      }),
  );
  document.querySelectorAll("[data-i]").forEach(
    (b) =>
      (b.onclick = () => {
        tpl = +b.dataset.i;
        S.set("folio_t", tpl);
        preview();
      }),
  );
}
function manage() {
  if (!P) return need();
  $("#app").innerHTML =
    `<h1 class="pg" data-el="Hierarchy · Scale">Manage portfolio</h1><p class="sub">View, edit, or delete what you've created.</p><div class="card" data-el="Gestalt · Similarity"><b>${esc(P.name)}</b><div style="color:var(--mu)">${esc(P.email)} · Template: ${NAMES[tpl - 1]}</div><div class="row" data-el="Contrast · Dominance"><a class="btn" href="#preview">View</a><a class="btn sec" href="#form">Edit</a><button class="del" id="dl">Delete</button></div></div>`;
  $("#dl").onclick = () => {
    if (!confirm("Delete your portfolio permanently?")) return;
    P = null;
    tpl = 1;
    S.del("folio_p");
    S.del("folio_t");
    toast("Deleted");
    location.hash = "#home";
  };
}
function feedback() {
  const old = S.get("folio_f") || {};
  const FE = [
    "Export to PDF",
    "More templates",
    "Custom colors & fonts",
    "Reorder sections",
    "Photo cropping",
    "Shareable public link",
  ];
  if (old.done) {
    $("#app").innerHTML =
      `<h1 class="pg" data-el="Hierarchy · Scale">Thanks for your feedback</h1><p class="sub">Saved in this browser (test mode).</p><div class="card"><pre style="white-space:pre-wrap;margin:0;font:inherit">${esc(old.text)}</pre><div class="row"><button id="cp">Copy summary</button><button class="sec" id="rs">Submit new feedback</button></div></div>`;
    $("#cp").onclick = () => {
      navigator.clipboard?.writeText(old.text).then(
        () => toast("Copied"),
        () => toast("Copy not available"),
      );
    };
    $("#rs").onclick = () => {
      S.del("folio_f");
      feedback();
    };
    return;
  }
  let rate = 0;
  $("#app").innerHTML =
    `<h1 class="pg" data-el="Hierarchy · Scale">Feedback</h1><p class="sub">Help us decide what to improve next.</p><div class="card" data-el="Negative space · Hierarchy"><label style="margin-top:0">Overall experience</label><div class="stars">${[1, 2, 3, 4, 5].map((i) => `<button data-r="${i}">★</button>`).join("")}</div>
<label>Which template needs the most improvement?</label>${NAMES.map((n, i) => `<label class="opt"><input type="radio" name="tp" value="${n}"> ${i + 1}. ${n}</label>`).join("")}<label class="opt"><input type="radio" name="tp" value="None"> None — all good</label>
<label>Which features should we add?</label>${FE.map((f) => `<label class="opt"><input type="checkbox" name="ft" value="${f}"> ${f}</label>`).join("")}
<label>Comments</label><textarea id="cm" placeholder="What would make this better?"></textarea><div class="row"><button id="sb">Submit feedback</button></div></div>`;
  document.querySelectorAll(".stars button").forEach(
    (b) =>
      (b.onclick = () => {
        rate = +b.dataset.r;
        document
          .querySelectorAll(".stars button")
          .forEach((x) => x.classList.toggle("on", +x.dataset.r <= rate));
      }),
  );
  $("#sb").onclick = () => {
    const tp =
        document.querySelector("[name=tp]:checked")?.value || "Not specified",
      ft = [...document.querySelectorAll("[name=ft]:checked")].map(
        (x) => x.value,
      );
    const text = `Rating: ${rate || "—"}/5\nTemplate to improve: ${tp}\nFeatures requested: ${ft.join(", ") || "None"}\nComments: ${$("#cm").value.trim() || "—"}`;
    S.set("folio_f", { done: 1, text });
    toast("Thank you!");
    feedback();
  };
}
{
  const t = S.get("folio_th");
  if (t) document.documentElement.dataset.theme = t;
}
$("#th").onclick = () => {
  const d = document.documentElement,
    n =
      (d.dataset.theme ||
        (matchMedia("(prefers-color-scheme:dark)").matches
          ? "dark"
          : "light")) == "dark"
        ? "light"
        : "dark";
  d.dataset.theme = n;
  S.set("folio_th", n);
};
document.addEventListener("focusin", (e) => {
  const id = e.target.id || "",
    k =
      (e.target.dataset && e.target.dataset.k) ||
      (id.startsWith("f_") ? id.slice(2) : "");
  if (window._sx && k) window._sx(k);
});
$("#an").onclick = () => {
  document.body.classList.toggle("ann");
  $("#an").classList.toggle("on");
};
route();
cloudInit().then(() => route());
