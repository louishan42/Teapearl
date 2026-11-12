/* Edit the shop here: names, prices, tasting notes, and brew times. */
const CATALOG = [
  {
    id: "jasmine",
    name: "Jasmine Pearl",
    line: "Green tea, scented at night",
    note: "Tight green pearls rested with jasmine blossom. The cup is floral, sweet, and clear.",
    tags: ["Floral", "Sweet", "Clear"],
    prices: { 50: 28, 100: 48 },
    cups: { 50: "About 16 cups", 100: "About 32 cups" },
    brew: { temp: "80°C", pearls: "3 pearls", time: "2 min" },
    method:
      "Warm the cup. Add three pearls and water at 80°C. Steep two minutes, then a little longer the next round. The pearls open as they go.",
  },
  {
    id: "white",
    name: "White Dragon Pearl",
    line: "Silver buds, rolled pale",
    note: "Young white tea buds rolled into soft pearls. Honey, hay, and a clean finish.",
    tags: ["Honey", "Hay", "Soft"],
    prices: { 50: 34, 100: 58 },
    cups: { 50: "About 16 cups", 100: "About 32 cups" },
    brew: { temp: "85°C", pearls: "3 pearls", time: "3 min" },
    method:
      "Keep the water gentle, about 85°C. Three pearls, three minutes. A second steep is quieter and a little sweeter.",
  },
  {
    id: "osmanthus",
    name: "Osmanthus Pearl",
    line: "Oolong with apricot blossom",
    note: "Rolled oolong and dried osmanthus. Apricot, orchid, and a warm round finish.",
    tags: ["Apricot", "Orchid", "Warm"],
    prices: { 50: 32, 100: 54 },
    cups: { 50: "About 16 cups", 100: "About 32 cups" },
    brew: { temp: "90°C", pearls: "3 pearls", time: "2½ min" },
    method:
      "Water just under a boil, near 90°C. Three pearls for two and a half minutes. The blossom shows up on the second steep.",
  },
];

const STORAGE_KEY = "teapearl.order.v1";

const state = {
  tea: "jasmine",
  size: 50,
  qty: 1,
  view: "form",
  receipt: null,
};

const $ = (sel) => document.querySelector(sel);
const money = (n) => `$${n}`;

function teaById(id) {
  return CATALOG.find((tea) => tea.id === id) || CATALOG[0];
}

function total() {
  return teaById(state.tea).prices[state.size] * state.qty;
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved) return;
    if (CATALOG.some((tea) => tea.id === saved.tea)) state.tea = saved.tea;
    if (saved.size === 50 || saved.size === 100) state.size = saved.size;
    if (saved.qty >= 1 && saved.qty <= 6) state.qty = saved.qty;
    if (saved.receipt && saved.receipt.ref) state.receipt = saved.receipt;
    if (saved.draft) {
      const form = $("#order-form");
      for (const key of ["name", "email", "place", "note"]) {
        if (saved.draft[key] && form.elements[key]) {
          form.elements[key].value = saved.draft[key];
        }
      }
    }
  } catch {
    /* ignore a broken saved order */
  }
}

function save() {
  try {
    const form = $("#order-form");
    const draft = {
      name: form.elements.name.value,
      email: form.elements.email.value,
      place: form.elements.place.value,
      note: form.elements.note.value,
    };
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        tea: state.tea,
        size: state.size,
        qty: state.qty,
        receipt: state.receipt,
        draft,
      })
    );
  } catch {
    /* keep the counter working if storage is blocked */
  }
}

function renderChoices() {
  $("#tea-list").innerHTML = CATALOG.map((tea) => {
    const selected = tea.id === state.tea;
    return `
      <li>
        <button type="button" class="tea-card${selected ? " is-selected" : ""}" data-pick="${tea.id}" aria-pressed="${selected}">
          <span class="tea-card-top">
            <span class="tea-name">${tea.name}</span>
            <span class="tea-price">$${tea.prices[50]} <small>/ 50g</small></span>
          </span>
          <span class="tea-line">${tea.line}</span>
          <span class="tea-note">${tea.note}</span>
          <span class="tea-meta">
            <span>${tea.tags.join(" · ")}</span>
            <span class="tea-pick">${selected ? "Selected" : "Choose"}</span>
          </span>
        </button>
      </li>`;
  }).join("");

  $("#tea-options").innerHTML = CATALOG.map((tea) => {
    const selected = tea.id === state.tea;
    return `
      <button type="button" class="option${selected ? " is-selected" : ""}" data-pick="${tea.id}" aria-pressed="${selected}">
        <span>
          <span class="option-name">${tea.name}</span>
          <small>${tea.line}</small>
        </span>
        <span>${money(tea.prices[state.size])}</span>
      </button>`;
  }).join("");
}

function sync() {
  const tea = teaById(state.tea);
  document.querySelectorAll("[data-pick]").forEach((button) => {
    const on = button.dataset.pick === state.tea;
    button.classList.toggle("is-selected", on);
    button.setAttribute("aria-pressed", String(on));
    const pick = button.querySelector(".tea-pick");
    if (pick) pick.textContent = on ? "Selected" : "Choose";
    if (button.classList.contains("option")) {
      const price = button.querySelector("span:last-child");
      if (price) price.textContent = money(teaById(button.dataset.pick).prices[state.size]);
    }
  });

  document.querySelectorAll("[data-size]").forEach((button) => {
    button.setAttribute("aria-pressed", String(Number(button.dataset.size) === state.size));
  });

  $("#qty-val").textContent = String(state.qty);
  $("#cup-note").textContent = `${tea.cups[state.size]}.`;
  $("#now-name").textContent = tea.name;
  $("#now-note").textContent = tea.note;
  $("#line-item").textContent = `${tea.name} · ${state.size}g × ${state.qty}`;
  $("#total").textContent = money(total());
  $("#brew-temp").textContent = tea.brew.temp;
  $("#brew-pearls").textContent = tea.brew.pearls;
  $("#brew-time").textContent = tea.brew.time;
  $("#brew-method").textContent = tea.method;

  const formView = $("#form-view");
  const receipt = $("#receipt");
  const showingReceipt = state.view === "receipt" && state.receipt;
  formView.hidden = showingReceipt;
  receipt.hidden = !showingReceipt;

  const reopen = $("#reopen");
  if (state.receipt && !showingReceipt) {
    reopen.hidden = false;
    reopen.textContent = `See saved request ${state.receipt.ref}`;
  } else {
    reopen.hidden = true;
  }

  if (showingReceipt) {
    const order = state.receipt;
    $("#receipt-ref").textContent = order.ref;
    $("#receipt-when").textContent = order.when;
    $("#receipt-tea").textContent = order.teaName;
    $("#receipt-tin").textContent = `${order.size}g × ${order.qty}`;
    $("#receipt-who").textContent = order.name;
    $("#receipt-email").textContent = order.email;
    $("#receipt-place").textContent = order.place;
    $("#receipt-total").textContent = money(order.total);
    const note = $("#receipt-note");
    note.hidden = !order.note;
    note.textContent = order.note ? `Note: ${order.note}` : "";
    $("#dock-line").textContent = `Requested · ${order.ref}`;
    $("#dock-price").textContent = money(order.total);
    $("#dock-action").textContent = "View request";
  } else {
    $("#dock-line").textContent = `${tea.name} · ${state.size}g × ${state.qty}`;
    $("#dock-price").textContent = money(total());
    $("#dock-action").textContent = "Review tin";
  }

  save();
}

function clearErrors() {
  document.querySelectorAll(".field").forEach((field) => field.classList.remove("is-invalid"));
  document.querySelectorAll(".err").forEach((err) => {
    err.textContent = "";
  });
}

function setError(name, message) {
  const input = $("#order-form").elements[name];
  const field = input.closest(".field");
  field.classList.add("is-invalid");
  field.querySelector(".err").textContent = message;
}

function validate(form) {
  clearErrors();
  const name = form.elements.name.value.trim();
  const email = form.elements.email.value.trim();
  const place = form.elements.place.value.trim();
  let first = null;

  if (name.length < 2) {
    setError("name", "Add the name for this tin.");
    first = first || form.elements.name;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setError("email", "Add an email so we can confirm.");
    first = first || form.elements.email;
  }
  if (place.length < 2) {
    setError("place", "Add a city or town.");
    first = first || form.elements.place;
  }
  if (first) {
    first.focus();
    return null;
  }
  return {
    name,
    email,
    place,
    note: form.elements.note.value.trim(),
  };
}

function choose(id) {
  if (!CATALOG.some((tea) => tea.id === id)) return;
  state.tea = id;
  state.view = "form";
  sync();
}

document.querySelector("[data-nav]").addEventListener("click", (event) => {
  const toggle = event.target.closest(".nav-toggle");
  const links = $("#site-nav");
  if (toggle) {
    const open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    links.classList.toggle("is-open", !open);
    toggle.textContent = open ? "Menu" : "Close";
    return;
  }
  if (event.target.closest(".nav-links a")) {
    links.classList.remove("is-open");
    const toggleButton = document.querySelector(".nav-toggle");
    toggleButton.setAttribute("aria-expanded", "false");
    toggleButton.textContent = "Menu";
  }
});

$("#tea-list").addEventListener("click", (event) => {
  const button = event.target.closest("[data-pick]");
  if (!button) return;
  choose(button.dataset.pick);
});

$("#tea-options").addEventListener("click", (event) => {
  const button = event.target.closest("[data-pick]");
  if (!button) return;
  choose(button.dataset.pick);
});

document.querySelectorAll("[data-size]").forEach((button) => {
  button.addEventListener("click", () => {
    state.size = Number(button.dataset.size);
    state.view = "form";
    sync();
  });
});

$("#qty-dec").addEventListener("click", () => {
  state.qty = Math.max(1, state.qty - 1);
  state.view = "form";
  sync();
});

$("#qty-inc").addEventListener("click", () => {
  state.qty = Math.min(6, state.qty + 1);
  state.view = "form";
  sync();
});

$("#order-form").addEventListener("input", (event) => {
  const field = event.target.closest(".field");
  if (field) {
    field.classList.remove("is-invalid");
    const err = field.querySelector(".err");
    if (err) err.textContent = "";
  }
  save();
});

$("#order-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const details = validate(event.currentTarget);
  if (!details) {
    $("#status").textContent = "Add the missing details before requesting the tin.";
    return;
  }
  const tea = teaById(state.tea);
  const ref = `TP-${Math.floor(1000 + Math.random() * 9000)}`;
  state.receipt = {
    ref,
    tea: tea.id,
    teaName: tea.name,
    size: state.size,
    qty: state.qty,
    total: total(),
    when: new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    ...details,
  };
  state.view = "receipt";
  sync();
  $("#receipt").scrollIntoView({ behavior: "smooth", block: "center" });
  $("#status").textContent = `Request ${ref} saved for ${tea.name}.`;
});

$("#edit-request").addEventListener("click", () => {
  state.view = "form";
  sync();
  $("#order-form").elements.name.focus();
});

$("#reopen").addEventListener("click", () => {
  state.view = "receipt";
  sync();
  $("#receipt").scrollIntoView({ behavior: "smooth", block: "center" });
});

window.addEventListener("scroll", () => {
  document.querySelector("[data-nav]").classList.toggle("is-scrolled", window.scrollY > 8);
}, { passive: true });

load();
renderChoices();
sync();
