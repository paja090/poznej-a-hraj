const STORAGE_KEY = "poznej-hraj-state-v2";
const POLL_VOTE_KEY = "poznej-hraj-poll-vote";
const ADMIN_PASSWORD = "akce1234";

const deepClone = (value) => {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
};

const DEFAULT_STATE = {
  events: [
    {
      id: "event-neon-quest",
      title: "Neon Quest: Escape & Games",
      date: new Date().setDate(new Date().getDate() + 7),
      location: "PlayZone Karlín, Praha",
      summary:
        "Večer plný kooperativních úkolů, VR arény a deskových bitev. Ideální pro první setkání i zkušené hráče.",
      capacity: 28,
      spots: 12,
      price: 390,
      photos: [
        "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80"
      ],
      archived: false
    },
    {
      id: "event-beer-quiz",
      title: "Beer & Quiz Challenge",
      date: new Date().setDate(new Date().getDate() + 18),
      location: "Loft Market Brno",
      summary:
        "Týmový pub kvíz s ochutnávkou craft piv, improvizovanými úkoly a networkingem podle herních preferencí.",
      capacity: 36,
      spots: 20,
      price: 350,
      photos: [
        "https://images.unsplash.com/photo-1458642849426-cfb724f15ef7?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80"
      ],
      archived: false
    },
    {
      id: "event-mask-party",
      title: "Masky & Kvízy Night",
      date: new Date().setDate(new Date().getDate() + 32),
      location: "Studio Vnitroblok, Praha",
      summary:
        "Tematický večer s kostýmy, improvizovanými scénkami a rychlými seznamovacími koly. Připrav se na přestrojení!",
      capacity: 40,
      spots: 31,
      price: 420,
      photos: [
        "https://images.unsplash.com/photo-1519677100203-a0e668c92439?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80"
      ],
      archived: false
    },
    {
      id: "event-retro-night",
      title: "Retro Night 90's",
      date: new Date().setDate(new Date().getDate() - 24),
      location: "Kasárna Karlín",
      summary:
        "Tetris battle, karaoke, taneční výzvy i fotokoutek s rekvizitami. Večer skončil velkým společným finále.",
      capacity: 32,
      spots: 0,
      price: 320,
      photos: [
        "https://images.unsplash.com/photo-1512149177596-f817c7ef5d42?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1464375117522-1311d6a5b81c?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80"
      ],
      archived: true
    },
    {
      id: "event-chill-shisha",
      title: "Vodní dýmky & Chill",
      date: new Date().setDate(new Date().getDate() - 58),
      location: "Roof Top bar Letná",
      summary:
        "Relax večer s čajovými blendy, slow games zónou a facilitovanými konverzačními kartami.",
      capacity: 24,
      spots: 0,
      price: 290,
      photos: [
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=900&q=80"
      ],
      archived: true
    }
  ],
  gallery: {
    items: [
      {
        id: "gallery-party-1",
        type: "photo",
        url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80",
        alt: "Účastníci na neon párty",
        featured: true
      },
      {
        id: "gallery-party-2",
        type: "photo",
        url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80",
        alt: "Herní duel ve VR",
        featured: false
      },
      {
        id: "gallery-party-3",
        type: "photo",
        url: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80",
        alt: "Karaoke na pódiu",
        featured: true
      },
      {
        id: "gallery-party-4",
        type: "slogan",
        text: "Každá hra je šance poznat někoho nového.",
        featured: true
      },
      {
        id: "gallery-party-5",
        type: "slogan",
        text: "Zábava, přátelství, zážitky – bez bariér.",
        featured: true
      }
    ]
  },
  poll: {
    question: "Jaké téma chceš zažít příště?",
    options: [
      { id: "retro", label: "Retro Night", votes: 18 },
      { id: "beer", label: "Beer & Quiz", votes: 11 },
      { id: "shisha", label: "Vodní dýmky & Chill", votes: 7 }
    ],
    active: true
  },
  reviews: {
    published: [
      {
        id: "review-lenka",
        name: "Lenka",
        rating: 5,
        message: "Skvělá energie a program, díky moderátorům jsme se seznámili úplně bez stresu!",
        status: "approved"
      },
      {
        id: "review-milan",
        name: "Milan",
        rating: 4,
        message: "Pub kvíz byl super, jen bych příště přidal víc chill koutků. Jinak paráda!",
        status: "approved"
      }
    ],
    pending: [
      {
        id: "review-nova",
        name: "Dana",
        rating: 5,
        message: "Masky & Kvízy byl nejlepší večer! Prosím opakovat.",
        status: "pending"
      }
    ]
  },
  reservations: []
};

let state = loadState();
autoArchiveEvents();
saveState();

const selectors = {
  upcomingList: document.querySelector("[data-upcoming-list]"),
  upcomingEmpty: document.querySelector("[data-upcoming-empty]"),
  pastList: document.querySelector("[data-past-list]"),
  pastEmpty: document.querySelector("[data-past-empty]"),
  galleryGrid: document.querySelector("[data-gallery-grid]"),
  pollContainer: document.querySelector("[data-poll]")
};

const templates = {
  eventCard: document.getElementById("event-card-template"),
  pastCard: document.getElementById("past-card-template"),
  galleryItem: document.getElementById("gallery-item-template"),
  reviewCard: document.getElementById("review-card-template")
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = normalizeState(deepClone(DEFAULT_STATE));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    return normalizeState({ ...deepClone(DEFAULT_STATE), ...parsed });
  } catch (error) {
    console.error("Chyba při načítání state", error);
    const fallback = normalizeState(deepClone(DEFAULT_STATE));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
    } catch (e) {
      console.warn("Nelze uložit fallback state", e);
    }
    return fallback;
  }
}

function normalizeState(current) {
  current.events = Array.isArray(current.events) ? current.events.map(ensureEventShape) : [];
  current.gallery = current.gallery || { items: [] };
  current.gallery.items = Array.isArray(current.gallery.items)
    ? current.gallery.items.map((item) => ({
        id: item.id || crypto.randomUUID?.() || `gallery-${Math.random().toString(16).slice(2)}`,
        type: item.type === "slogan" ? "slogan" : "photo",
        url: item.url,
        text: item.text,
        alt: item.alt || "",
        featured: Boolean(item.featured)
      }))
    : [];
  current.poll = current.poll || deepClone(DEFAULT_STATE.poll);
  current.poll.options = Array.isArray(current.poll.options)
    ? current.poll.options.map((opt) => ({
        id: opt.id || crypto.randomUUID?.() || `poll-${Math.random().toString(16).slice(2)}`,
        label: opt.label,
        votes: Number(opt.votes) || 0
      }))
    : deepClone(DEFAULT_STATE.poll.options);
  current.reviews = current.reviews || deepClone(DEFAULT_STATE.reviews);
  current.reviews.published = Array.isArray(current.reviews.published)
    ? current.reviews.published.map(ensureReviewShape)
    : [];
  current.reviews.pending = Array.isArray(current.reviews.pending)
    ? current.reviews.pending.map(ensureReviewShape)
    : [];
  current.reservations = Array.isArray(current.reservations) ? current.reservations : [];
  return current;
}

function ensureEventShape(event) {
  const normalized = {
    id: event.id || crypto.randomUUID?.() || `event-${Math.random().toString(16).slice(2)}`,
    title: event.title || "Bez názvu",
    date: typeof event.date === "string" || typeof event.date === "number" ? new Date(event.date).toISOString() : new Date().toISOString(),
    location: event.location || "",
    summary: event.summary || "",
    capacity: Number(event.capacity) || 0,
    spots: Number(event.spots ?? event.capacity) || 0,
    price: event.price !== undefined && event.price !== null && event.price !== "" ? Number(event.price) : null,
    photos: Array.isArray(event.photos) ? event.photos.slice(0, 5) : [],
    archived: Boolean(event.archived)
  };
  return normalized;
}

function ensureReviewShape(review) {
  return {
    id: review.id || crypto.randomUUID?.() || `review-${Math.random().toString(16).slice(2)}`,
    name: review.name || "Anonym",
    rating: Math.min(5, Math.max(1, Number(review.rating) || 5)),
    message: review.message || "",
    status: review.status === "pending" ? "pending" : "approved"
  };
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Nepodařilo se uložit state", error);
  }
}

function autoArchiveEvents() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  state.events = state.events.map((event) => {
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);
    return { ...event, archived: eventDate < today ? true : event.archived };
  });
}

function formatDate(dateValue) {
  const date = new Date(dateValue);
  return new Intl.DateTimeFormat("cs-CZ", { dateStyle: "medium" }).format(date);
}

function renderUpcomingEvents() {
  if (!selectors.upcomingList) return;
  selectors.upcomingList.innerHTML = "";
  const upcomingEvents = state.events
    .filter((event) => !event.archived)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (!upcomingEvents.length) {
    selectors.upcomingEmpty?.removeAttribute("hidden");
    return;
  }
  selectors.upcomingEmpty?.setAttribute("hidden", "");

  upcomingEvents.forEach((event) => {
    const clone = templates.eventCard.content.cloneNode(true);
    const card = clone.querySelector(".event-card");
    card.dataset.eventId = event.id;
    clone.querySelector("[data-event-date]").textContent = formatDate(event.date);
    clone.querySelector("[data-event-title]").textContent = event.title;
    clone.querySelector("[data-event-location]").textContent = event.location;
    clone.querySelector("[data-event-summary]").textContent = event.summary;
    clone.querySelector("[data-event-capacity]").textContent = `Kapacita: ${event.capacity} osob`;
    const priceText = event.price ? `${event.price.toLocaleString("cs-CZ")} Kč / osoba` : "Cena: bude upřesněno";
    clone.querySelector("[data-event-price]").textContent = priceText;
    const spotsInfo = `${event.spots} / ${event.capacity} volných míst`;
    clone.querySelector("[data-event-spots]").textContent = spotsInfo;
    const progress = clone.querySelector("[data-event-progress]");
    const ratio = event.capacity ? Math.max(0.05, (event.capacity - event.spots) / event.capacity) : 0;
    progress.style.width = `${Math.min(1, ratio) * 100}%`;
    const reserveBtn = clone.querySelector("[data-reserve]");
    reserveBtn.addEventListener("click", () => openReservation(event.id));
    if (event.spots <= 0) {
      reserveBtn.disabled = true;
      reserveBtn.textContent = "Kapacita plná";
      clone.querySelector("[data-event-spots]").textContent = "Vyprodáno";
    }
    selectors.upcomingList.appendChild(clone);
  });
}

function renderPastEvents() {
  if (!selectors.pastList) return;
  selectors.pastList.innerHTML = "";
  const pastEvents = state.events
    .filter((event) => event.archived)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  if (!pastEvents.length) {
    selectors.pastEmpty?.removeAttribute("hidden");
    return;
  }
  selectors.pastEmpty?.setAttribute("hidden", "");
  pastEvents.forEach((event) => {
    const clone = templates.pastCard.content.cloneNode(true);
    const card = clone.querySelector(".past-card");
    card.dataset.eventId = event.id;
    clone.querySelector("[data-event-date]").textContent = formatDate(event.date);
    clone.querySelector("[data-event-title]").textContent = event.title;
    clone.querySelector("[data-event-summary]").textContent = event.summary;
    const miniGallery = clone.querySelector("[data-gallery]");
    if (event.photos?.length) {
      event.photos.slice(0, 6).forEach((url) => {
        const img = document.createElement("img");
        img.src = url;
        img.alt = `${event.title} – momentka`;
        miniGallery.appendChild(img);
      });
    } else {
      miniGallery.innerHTML = '<p class="muted">Fotogalerie se připravuje.</p>';
    }
    const button = clone.querySelector("[data-open-gallery]");
    button.addEventListener("click", () => openLightbox(event.photos || []));
    selectors.pastList.appendChild(clone);
  });
}

function renderGallery() {
  if (!selectors.galleryGrid) return;
  selectors.galleryGrid.innerHTML = "";
  const items = state.gallery.items;
  if (!items.length) {
    const placeholder = document.createElement("p");
    placeholder.className = "muted";
    placeholder.textContent = "Galerie se připravuje. Přidej fotky v admin sekci.";
    selectors.galleryGrid.appendChild(placeholder);
    return;
  }

  items.forEach((item) => {
    if (item.type === "slogan") {
      const slogan = document.createElement("figure");
      slogan.className = "gallery-item";
      slogan.style.display = "grid";
      slogan.style.placeItems = "center";
      slogan.style.padding = "1.5rem";
      slogan.style.background = "var(--accent-soft)";
      slogan.innerHTML = `<figcaption style="text-align:center;font-weight:600;line-height:1.4;">${item.text}</figcaption>`;
      selectors.galleryGrid.appendChild(slogan);
    } else {
      const clone = templates.galleryItem.content.cloneNode(true);
      const img = clone.querySelector("[data-gallery-image]");
      img.src = item.url;
      img.alt = item.alt || "Momentka z akce Poznej & Hraj";
      selectors.galleryGrid.appendChild(clone);
    }
  });
}

function renderMarquee() {
  const marquee = document.querySelector("[data-marquee]");
  if (!marquee) return;
  marquee.innerHTML = "";
  const items = state.gallery.items.filter((item) => item.featured);
  const slogans = [
    "Poznej & Hraj",
    "Spojujeme lidi skrze zábavu",
    "Komunita hráčů & přátel",
    "Rezervuj si místo ještě dnes"
  ];
  const dataset = [...items, ...slogans.map((text) => ({ type: "slogan", text }))];
  const repeated = [...dataset, ...dataset];
  repeated.forEach((item) => {
    const wrapper = document.createElement("span");
    wrapper.className = "marquee-item";
    if (item.type === "photo" && item.url) {
      wrapper.innerHTML = `<span aria-hidden="true">📸</span> Fotky z akcí`;
    } else {
      wrapper.textContent = item.text || "Poznej & Hraj";
    }
    marquee.appendChild(wrapper);
  });
}

function renderPoll() {
  if (!selectors.pollContainer) return;
  const container = selectors.pollContainer;
  container.innerHTML = "";
  const poll = state.poll;
  const title = document.createElement("h3");
  title.textContent = poll.question;
  container.appendChild(title);

  const optionsWrapper = document.createElement("div");
  optionsWrapper.className = "poll-options";
  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0) || 1;
  const userVote = localStorage.getItem(POLL_VOTE_KEY);

  poll.options.forEach((option) => {
    const optionEl = document.createElement("div");
    optionEl.className = "poll-option";
    const header = document.createElement("div");
    header.className = "poll-option-header";
    const label = document.createElement("span");
    label.textContent = option.label;
    const percent = Math.round((option.votes / totalVotes) * 100);
    const value = document.createElement("strong");
    value.textContent = `${percent}%`;
    header.append(label, value);
    const progress = document.createElement("div");
    progress.className = "poll-progress";
    const progressBar = document.createElement("div");
    progressBar.className = "poll-progress-bar";
    progressBar.style.width = `${percent}%`;
    progress.appendChild(progressBar);
    optionEl.append(header, progress);
    if (poll.active && !userVote) {
      optionEl.tabIndex = 0;
      optionEl.role = "button";
      optionEl.addEventListener("click", () => handleVote(option.id));
      optionEl.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
          handleVote(option.id);
        }
      });
    } else if (userVote === option.id) {
      optionEl.classList.add("is-selected");
    }
    optionsWrapper.appendChild(optionEl);
  });

  container.appendChild(optionsWrapper);
  const status = document.createElement("p");
  status.className = "muted";
  status.textContent = poll.active
    ? userVote
      ? "Díky za hlas!"
      : "Vyber možnost a ovlivni další téma."
    : "Hlasování je aktuálně pozastaveno.";
  container.appendChild(status);
}

function handleVote(optionId) {
  const poll = state.poll;
  if (!poll.active) return;
  const option = poll.options.find((opt) => opt.id === optionId);
  if (!option) return;
  option.votes += 1;
  localStorage.setItem(POLL_VOTE_KEY, optionId);
  saveState();
  renderPoll();
}

function populateReservationSelect() {
  const select = document.getElementById("reservation-event");
  if (!select) return;
  select.innerHTML = "";
  const upcoming = state.events.filter((event) => !event.archived && event.spots > 0);
  if (!upcoming.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Momentálně nejsou dostupné akce";
    select.appendChild(option);
    select.disabled = true;
    return;
  }
  select.disabled = false;
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Vyber akci";
  placeholder.disabled = true;
  placeholder.selected = true;
  select.appendChild(placeholder);
  upcoming.forEach((event) => {
    const option = document.createElement("option");
    option.value = event.id;
    const priceText = event.price ? ` • ${event.price.toLocaleString("cs-CZ")} Kč` : "";
    option.textContent = `${event.title} (${formatDate(event.date)})${priceText}`;
    select.appendChild(option);
  });
}

function openReservation(eventId) {
  const select = document.getElementById("reservation-event");
  if (!select) return;
  if (eventId) {
    select.value = eventId;
    updatePriceInfo(eventId);
  }
  document.getElementById("reservation")?.scrollIntoView({ behavior: "smooth" });
}

function updatePriceInfo(eventId) {
  const priceEl = document.querySelector("[data-price]");
  const info = document.querySelector("[data-payment-info]");
  if (!priceEl || !info) return;
  const event = state.events.find((evt) => evt.id === eventId);
  if (!event) {
    info.hidden = true;
    return;
  }
  info.hidden = false;
  priceEl.textContent = event.price ? `${event.price.toLocaleString("cs-CZ")} Kč` : "Bude upřesněno";
}

function setupReservationForm() {
  const form = document.getElementById("reservation-form");
  if (!form) return;
  const select = document.getElementById("reservation-event");
  select?.addEventListener("change", (event) => updatePriceInfo(event.target.value));
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const eventId = formData.get("event");
    if (!eventId) {
      showFeedback(form, "Vyber prosím akci.", "error");
      return;
    }
    const selectedEvent = state.events.find((evt) => evt.id === eventId);
    if (!selectedEvent) {
      showFeedback(form, "Vybraná akce nebyla nalezena.", "error");
      return;
    }
    const reservation = {
      id: crypto.randomUUID?.() || `res-${Date.now()}`,
      eventId,
      eventTitle: selectedEvent.title,
      name: formData.get("name"),
      email: formData.get("email"),
      count: Number(formData.get("count")) || 1,
      note: formData.get("note")?.toString() || "",
      pricePerSeat: selectedEvent.price,
      createdAt: new Date().toISOString()
    };

    try {
      await submitReservationToFormspree(formData);
      showFeedback(form, "Díky! Rezervace byla odeslána a uložená lokálně.", "success");
    } catch (error) {
      console.warn("Formspree request failed", error);
      showFeedback(
        form,
        "Rezervaci jsme uložili lokálně. Ověř prosím připojení, případně nám napiš na ahoj@poznejahraj.cz.",
        "error"
      );
    }

    state.reservations.unshift(reservation);
    if (selectedEvent.spots > 0) {
      selectedEvent.spots = Math.max(0, selectedEvent.spots - reservation.count);
    }
    saveState();
    renderUpcomingEvents();
    populateReservationSelect();
    form.reset();
    updatePriceInfo(null);
    renderAdminReservations();
  });
}

async function submitReservationToFormspree(formData) {
  const payload = new FormData();
  formData.forEach((value, key) => payload.append(key, value));
  const response = await fetch("https://formspree.io/f/xovyawqv", {
    method: "POST",
    headers: { Accept: "application/json" },
    body: payload
  });
  if (!response.ok) {
    throw new Error("Formspree error");
  }
}

function showFeedback(form, message, type) {
  const feedback = form.querySelector(".form-feedback");
  if (!feedback) return;
  feedback.textContent = message;
  feedback.classList.remove("success", "error");
  if (type) {
    feedback.classList.add(type);
  }
}

function setupReviewForm() {
  const form = document.getElementById("review-form");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const review = {
      id: crypto.randomUUID?.() || `rev-${Date.now()}`,
      name: formData.get("name"),
      rating: Number(formData.get("rating")),
      message: formData.get("message"),
      status: "pending"
    };
    state.reviews.pending.unshift(review);
    saveState();
    form.reset();
    showFeedback(form, "Díky! Recenze čeká na schválení.", "success");
    renderAdminReviews();
  });
}

function renderReviews() {
  const container = document.querySelector("[data-review-list]");
  if (!container) return;
  container.innerHTML = "";
  if (!state.reviews.published.length) {
    const note = document.createElement("p");
    note.className = "muted";
    note.textContent = "Zatím žádné schválené recenze. Napiš nám svou zkušenost!";
    container.appendChild(note);
    return;
  }
  state.reviews.published.forEach((review) => {
    const clone = templates.reviewCard.content.cloneNode(true);
    clone.querySelector("[data-review-stars]").textContent = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
    clone.querySelector("[data-review-message]").textContent = review.message;
    clone.querySelector("[data-review-name]").textContent = review.name;
    clone.querySelector("[data-review-status]").textContent = review.status === "approved" ? "Ověřená recenze" : "";
    container.appendChild(clone);
  });
}

function setupNav() {
  const toggle = document.querySelector(".nav-toggle");
  const navLinks = document.getElementById("primary-navigation");
  if (!toggle || !navLinks) return;
  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    navLinks.dataset.open = String(!expanded);
  });
  navLinks.querySelectorAll("a").forEach((link) =>
    link.addEventListener("click", () => {
      toggle.setAttribute("aria-expanded", "false");
      navLinks.dataset.open = "false";
    })
  );
}

function setupSmoothScroll() {
  document.querySelectorAll("[data-scroll]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.querySelector(btn.dataset.scroll);
      target?.scrollIntoView({ behavior: "smooth" });
    });
  });
}

function setupAdminPanel() {
  const trigger = document.querySelector("[data-admin-trigger]");
  const overlay = document.querySelector(".admin-overlay");
  const closeBtn = document.querySelector("[data-admin-close]");
  if (!trigger || !overlay || !closeBtn) return;
  trigger.addEventListener("click", () => {
    overlay.hidden = false;
    overlay.querySelector("input")?.focus();
  });
  closeBtn.addEventListener("click", () => {
    overlay.hidden = true;
  });
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      overlay.hidden = true;
    }
  });
  setupAdminLogin();
  setupAdminTabs();
  setupAdminForms();
}

function setupAdminLogin() {
  const loginSection = document.querySelector("[data-admin-login]");
  const content = document.querySelector("[data-admin-content]");
  const form = document.getElementById("admin-login-form");
  const logoutBtn = document.querySelector("[data-admin-logout]");
  if (!form || !loginSection || !content || !logoutBtn) return;
  const loggedIn = sessionStorage.getItem("poznej-hraj-admin") === "true";
  if (loggedIn) {
    loginSection.hidden = true;
    content.hidden = false;
    renderAdminViews();
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const password = new FormData(form).get("password");
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("poznej-hraj-admin", "true");
      loginSection.hidden = true;
      content.hidden = false;
      renderAdminViews();
      showFeedback(form, "Vítej zpět!", "success");
    } else {
      showFeedback(form, "Nesprávné heslo.", "error");
    }
    form.reset();
  });
  logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem("poznej-hraj-admin");
    content.hidden = true;
    loginSection.hidden = false;
  });
}

function setupAdminTabs() {
  const tabs = document.querySelectorAll(".admin-tabs [role='tab']");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;
      tabs.forEach((button) => button.setAttribute("aria-selected", String(button === tab)));
      document.querySelectorAll(".admin-panel").forEach((panel) => {
        panel.hidden = panel.dataset.panel !== target;
      });
    });
  });
}

function setupAdminForms() {
  setupAdminEventForm();
  setupAdminPollForm();
  setupAdminGalleryForm();
  setupExportButton();
}

function setupAdminEventForm() {
  const form = document.getElementById("event-form");
  if (!form) return;
  const resetBtn = form.querySelector("[data-reset-form]");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const id = formData.get("id") || crypto.randomUUID?.() || `event-${Date.now()}`;
    const photosRaw = (formData.get("photos") || "").toString().split(",").map((item) => item.trim()).filter(Boolean);
    const eventObject = {
      id,
      title: formData.get("title"),
      date: new Date(formData.get("date")).toISOString(),
      location: formData.get("location"),
      price: formData.get("price") ? Number(formData.get("price")) : null,
      capacity: Number(formData.get("capacity")) || 0,
      spots: Number(formData.get("spots")) || 0,
      summary: formData.get("summary"),
      photos: photosRaw.slice(0, 5),
      archived: new Date(formData.get("date")) < new Date()
    };
    const existingIndex = state.events.findIndex((evt) => evt.id === id);
    if (existingIndex >= 0) {
      state.events[existingIndex] = eventObject;
      showFeedback(form, "Akce byla aktualizována.", "success");
    } else {
      state.events.push(eventObject);
      showFeedback(form, "Nová akce byla přidána.", "success");
    }
    saveState();
    renderUpcomingEvents();
    renderPastEvents();
    populateReservationSelect();
    renderAdminEvents();
    form.reset();
  });
  resetBtn?.addEventListener("click", () => form.reset());
}

function setupAdminPollForm() {
  const form = document.getElementById("poll-form");
  if (!form) return;
  const { poll } = state;
  form.querySelector("#poll-question").value = poll.question;
  form.querySelector("#poll-options").value = poll.options.map((opt) => opt.label).join("\n");
  form.querySelector("#poll-active").value = poll.active ? "true" : "false";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    state.poll.question = formData.get("question")?.toString() || state.poll.question;
    const options = formData
      .get("options")
      .toString()
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    state.poll.options = options.map((label, index) => ({
      id: state.poll.options[index]?.id || crypto.randomUUID?.() || `poll-${Date.now()}-${index}`,
      label,
      votes: formData.get("reset") === "true" ? 0 : state.poll.options[index]?.votes || 0
    }));
    state.poll.active = formData.get("active") === "true";
    if (formData.get("reset") === "true") {
      localStorage.removeItem(POLL_VOTE_KEY);
    }
    saveState();
    showFeedback(form, "Anketa byla aktualizována.", "success");
    renderPoll();
  });
}

function setupAdminGalleryForm() {
  const form = document.getElementById("gallery-form");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const item = {
      id: crypto.randomUUID?.() || `gallery-${Date.now()}`,
      type: "photo",
      url: formData.get("url"),
      alt: "Momentka nahraná adminem",
      featured: formData.get("featured") === "on"
    };
    state.gallery.items.push(item);
    saveState();
    renderGallery();
    renderMarquee();
    renderAdminGallery();
    form.reset();
    showFeedback(form, "Fotka byla přidána.", "success");
  });
}

function setupExportButton() {
  const button = document.querySelector("[data-export-csv]");
  if (!button) return;
  button.addEventListener("click", () => {
    if (!state.reservations.length) {
      alert("Zatím nemáme žádné rezervace.");
      return;
    }
    const header = ["ID", "Akce", "Jméno", "E-mail", "Počet osob", "Poznámka", "Cena", "Vytvořeno"];
    const rows = state.reservations.map((res) => [
      res.id,
      res.eventTitle,
      res.name,
      res.email,
      res.count,
      res.note,
      res.pricePerSeat ?? "",
      res.createdAt
    ]);
    const csvContent = [header, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `poznej-a-hraj-rezervace-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
}

function renderAdminViews() {
  renderAdminEvents();
  renderAdminGallery();
  renderAdminReservations();
  renderAdminReviews();
}

function renderAdminEvents() {
  const container = document.querySelector("[data-admin-events]");
  if (!container) return;
  container.innerHTML = "";
  if (!state.events.length) {
    container.innerHTML = '<p class="muted">Žádné akce zatím nejsou.</p>';
    return;
  }
  const upcomingWrapper = document.createElement("div");
  upcomingWrapper.className = "admin-section";
  const upcomingTitle = document.createElement("h4");
  upcomingTitle.textContent = "Nadcházející";
  upcomingWrapper.appendChild(upcomingTitle);
  const upcomingList = document.createElement("div");
  upcomingList.className = "admin-list";
  state.events
    .filter((event) => !event.archived)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .forEach((event) => upcomingList.appendChild(createAdminEventItem(event)));
  upcomingWrapper.appendChild(upcomingList);

  const pastWrapper = document.createElement("div");
  pastWrapper.className = "admin-section";
  const pastTitle = document.createElement("h4");
  pastTitle.textContent = "Archiv";
  pastWrapper.appendChild(pastTitle);
  const pastList = document.createElement("div");
  pastList.className = "admin-list";
  state.events
    .filter((event) => event.archived)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach((event) => pastList.appendChild(createAdminEventItem(event)));
  pastWrapper.appendChild(pastList);

  container.append(upcomingWrapper, pastWrapper);
}

function createAdminEventItem(event) {
  const item = document.createElement("div");
  item.className = "admin-item";
  item.innerHTML = `
    <div>
      <strong>${event.title}</strong>
      <p class="muted">${formatDate(event.date)} • ${event.location}</p>
    </div>
    <div class="admin-item-actions">
      <button class="ghost-btn" type="button" data-action="edit">Upravit</button>
      <button class="ghost-btn" type="button" data-action="toggle">${event.archived ? "Vrátit mezi akce" : "Přesunout do archivu"}</button>
      <button class="ghost-btn" type="button" data-action="delete">Smazat</button>
    </div>
  `;
  item.querySelector("[data-action='edit']").addEventListener("click", () => populateEventForm(event));
  item.querySelector("[data-action='toggle']").addEventListener("click", () => toggleEventArchive(event.id));
  item.querySelector("[data-action='delete']").addEventListener("click", () => deleteEvent(event.id));
  return item;
}

function populateEventForm(event) {
  const form = document.getElementById("event-form");
  if (!form) return;
  form.querySelector("[name='id']").value = event.id;
  form.querySelector("#event-title").value = event.title;
  form.querySelector("#event-date").value = new Date(event.date).toISOString().split("T")[0];
  form.querySelector("#event-location").value = event.location;
  form.querySelector("#event-price").value = event.price ?? "";
  form.querySelector("#event-capacity").value = event.capacity;
  form.querySelector("#event-spots").value = event.spots;
  form.querySelector("#event-summary").value = event.summary;
  form.querySelector("#event-photos").value = (event.photos || []).join(", ");
}

function toggleEventArchive(eventId) {
  const event = state.events.find((evt) => evt.id === eventId);
  if (!event) return;
  event.archived = !event.archived;
  saveState();
  renderUpcomingEvents();
  renderPastEvents();
  populateReservationSelect();
  renderAdminEvents();
}

function deleteEvent(eventId) {
  if (!confirm("Opravdu chceš smazat tuto akci?")) return;
  state.events = state.events.filter((evt) => evt.id !== eventId);
  saveState();
  renderUpcomingEvents();
  renderPastEvents();
  populateReservationSelect();
  renderAdminEvents();
}

function renderAdminGallery() {
  const container = document.querySelector("[data-admin-gallery]");
  if (!container) return;
  container.innerHTML = "";
  if (!state.gallery.items.length) {
    container.innerHTML = '<p class="muted">Galerie je prázdná.</p>';
    return;
  }
  state.gallery.items.forEach((item) => {
    const entry = document.createElement("div");
    entry.className = "admin-item";
    entry.innerHTML = `
      <div>
        <p>${item.type === "photo" ? item.url : item.text}</p>
        <p class="muted">${item.featured ? "Zobrazuje se v pásu" : ""}</p>
      </div>
      <div class="admin-item-actions">
        <button class="ghost-btn" type="button" data-action="toggle">${item.featured ? "Odebrat z pásu" : "Zvýraznit"}</button>
        <button class="ghost-btn" type="button" data-action="delete">Smazat</button>
      </div>
    `;
    entry.querySelector("[data-action='toggle']").addEventListener("click", () => {
      item.featured = !item.featured;
      saveState();
      renderMarquee();
      renderAdminGallery();
    });
    entry.querySelector("[data-action='delete']").addEventListener("click", () => {
      state.gallery.items = state.gallery.items.filter((galleryItem) => galleryItem.id !== item.id);
      saveState();
      renderGallery();
      renderMarquee();
      renderAdminGallery();
    });
    container.appendChild(entry);
  });
}

function renderAdminReservations() {
  const container = document.querySelector("[data-admin-reservations]");
  if (!container) return;
  container.innerHTML = "";
  if (!state.reservations.length) {
    container.innerHTML = '<p class="muted">Žádné rezervace zatím nebyly vytvořeny.</p>';
    return;
  }
  state.reservations.forEach((reservation) => {
    const entry = document.createElement("div");
    entry.className = "admin-item";
    entry.innerHTML = `
      <div>
        <strong>${reservation.eventTitle}</strong>
        <p class="muted">${reservation.name} • ${reservation.email}</p>
        <p class="muted">${reservation.count} osob • ${reservation.note || "Bez poznámky"}</p>
        <p class="muted">Cena za osobu: ${reservation.pricePerSeat ? `${reservation.pricePerSeat} Kč` : "—"}</p>
      </div>
      <p class="muted">${new Date(reservation.createdAt).toLocaleString("cs-CZ")}</p>
    `;
    container.appendChild(entry);
  });
}

function renderAdminReviews() {
  const container = document.querySelector("[data-admin-reviews]");
  if (!container) return;
  container.innerHTML = "";
  if (!state.reviews.pending.length) {
    container.innerHTML = '<p class="muted">Žádné recenze nečekají na schválení.</p>';
    return;
  }
  state.reviews.pending.forEach((review) => {
    const entry = document.createElement("div");
    entry.className = "admin-item";
    entry.innerHTML = `
      <div>
        <strong>${review.name}</strong>
        <p class="muted">${"★".repeat(review.rating)}</p>
        <p>${review.message}</p>
      </div>
      <div class="admin-item-actions">
        <button class="ghost-btn" type="button" data-action="approve">Schválit</button>
        <button class="ghost-btn" type="button" data-action="reject">Smazat</button>
      </div>
    `;
    entry.querySelector("[data-action='approve']").addEventListener("click", () => approveReview(review.id));
    entry.querySelector("[data-action='reject']").addEventListener("click", () => rejectReview(review.id));
    container.appendChild(entry);
  });
}

function approveReview(reviewId) {
  const index = state.reviews.pending.findIndex((review) => review.id === reviewId);
  if (index < 0) return;
  const review = state.reviews.pending.splice(index, 1)[0];
  review.status = "approved";
  state.reviews.published.unshift(review);
  saveState();
  renderReviews();
  renderAdminReviews();
}

function rejectReview(reviewId) {
  state.reviews.pending = state.reviews.pending.filter((review) => review.id !== reviewId);
  saveState();
  renderAdminReviews();
}

function setupLightbox() {
  const openButton = document.querySelector("[data-open-lightbox]");
  const lightbox = document.querySelector("[data-lightbox]");
  const closeButton = document.querySelector("[data-lightbox-close]");
  const track = document.querySelector("[data-lightbox-track]");
  if (!openButton || !lightbox || !closeButton || !track) return;
  openButton.addEventListener("click", () => {
    const photos = state.gallery.items.filter((item) => item.type === "photo");
    openLightbox(photos.map((item) => item.url));
  });
  closeButton.addEventListener("click", () => (lightbox.hidden = true));
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      lightbox.hidden = true;
    }
  });
}

function openLightbox(photos) {
  const lightbox = document.querySelector("[data-lightbox]");
  const track = document.querySelector("[data-lightbox-track]");
  if (!lightbox || !track) return;
  track.innerHTML = "";
  if (!photos.length) {
    const note = document.createElement("p");
    note.className = "muted";
    note.textContent = "Fotogalerie se připravuje.";
    track.appendChild(note);
  }
  photos.forEach((url) => {
    const figure = document.createElement("figure");
    const img = document.createElement("img");
    img.src = url;
    img.alt = "Galerie Poznej & Hraj";
    figure.appendChild(img);
    track.appendChild(figure);
  });
  lightbox.hidden = false;
}

function initFooter() {
  const yearEl = document.querySelector("[data-current-year]");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

function init() {
  renderUpcomingEvents();
  renderPastEvents();
  renderGallery();
  renderMarquee();
  renderPoll();
  renderReviews();
  populateReservationSelect();
  setupReservationForm();
  setupReviewForm();
  setupNav();
  setupSmoothScroll();
  setupAdminPanel();
  setupLightbox();
  initFooter();
  updatePriceInfo(null);
  document.getElementById("reservation-event")?.addEventListener("change", (event) => updatePriceInfo(event.target.value));
}

init();
