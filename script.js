const defaultOptions = [
  { id: "speed-networking", label: "Speed networking s deskovkami" },
  { id: "crew-challenge", label: "Crew challenge: kooperativní výzva" },
  { id: "mixology", label: "Mixology & games pairing" },
  { id: "prototype-lab", label: "Laboratoř prototypů s Eliškou" }
];

const defaultEvents = [
  {
    id: "event-1",
    day: 7,
    month: "srpna",
    title: "Večer her & speed-fun",
    status: "Rezervováno 17 / 24 míst",
    meta: "18:30 · Bistro U dvou vikingských přátel",
    badgeText: "Posledních 7 míst",
    badgeVariant: "green"
  },
  {
    id: "event-2",
    day: 23,
    month: "srpna",
    title: "Seznamovací herní večer",
    status: "Rezervováno 25 / 30 míst",
    meta: "19:00 · Herní klub Skandinávie",
    badgeText: "Rozšířená kapacita",
    badgeVariant: "amber"
  },
  {
    id: "event-3",
    day: 5,
    month: "září",
    title: "Turnaj o krále večera",
    status: "Rezervováno 12 / 20 míst",
    meta: "18:00 · Kavárna Na lodi",
    badgeText: "Včetně mini mastery",
    badgeVariant: "violet"
  }
];

const defaultInfos = [
  {
    id: "info-1",
    text: "Check-in startuje v 18:00, welcome drink je připraven už od 17:45."
  },
  { id: "info-2", text: "Dresscode: smart casual s výrazným barevným akcentem." },
  { id: "info-3", text: "Přihlas hosty do čtvrtka, abychom stihli sestavit herní stoly." }
];

const defaultGalleryTiles = [
  { id: "tile-1", label: "Friends" },
  { id: "tile-2", label: "Cheers 07" },
  { id: "tile-3", label: "Dancefloor" },
  { id: "tile-4", label: "Story cards" },
  { id: "tile-5", label: "Board zone" },
  { id: "tile-6", label: "Chillout" },
  { id: "tile-7", label: "Tasting" },
  { id: "tile-8", label: "Aftertalk" }
];

const pollOptionsContainer = document.getElementById("poll-options");
const pollResultsList = document.getElementById("poll-results");
const pollForm = document.querySelector(".poll__form");
const customOptionInput = document.getElementById("custom-option");
const currentYear = document.getElementById("current-year");
const heroForm = document.getElementById("hero-form");
const heroFormHint = document.getElementById("hero-form-hint");
const editToggle = document.getElementById("edit-toggle");
const editReset = document.getElementById("edit-reset");
const adminToggle = document.getElementById("admin-toggle");
const adminPanel = document.getElementById("admin-panel");
const adminOverlay = document.getElementById("admin-overlay");
const adminClose = document.getElementById("admin-close");
const scheduleList = document.getElementById("schedule-list");
const infoList = document.getElementById("info-list");
const galleryGrid = document.getElementById("gallery-grid");
const adminEventForm = document.getElementById("admin-event-form");
const adminEventsList = document.getElementById("admin-events-list");
const adminInfoForm = document.getElementById("admin-info-form");
const adminInfoList = document.getElementById("admin-info-list");
const adminGalleryForm = document.getElementById("admin-gallery-form");
const adminGalleryList = document.getElementById("admin-gallery-list");
const adminResetData = document.getElementById("admin-reset-data");

const EDIT_STORAGE_PREFIX = "poznej-a-hraj-edit:";

const STORAGE_KEY = "poznej-a-hraj-poll";

const COLLECTION_STORAGE = {
  events: "poznej-a-hraj:events",
  infos: "poznej-a-hraj:infos",
  gallery: "poznej-a-hraj:gallery"
};

let eventsData = [];
let infosData = [];
let galleryData = [];

function cloneCollection(collection) {
  return collection.map((item) => ({ ...item }));
}

function loadCollection(key, fallback) {
  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) {
      return cloneCollection(fallback);
    }
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.error("Chyba při načítání kolekce", key, error);
  }
  return cloneCollection(fallback);
}

function saveCollection(key, data) {
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Chyba při ukládání kolekce", key, error);
  }
}

function loadVotes() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    return JSON.parse(stored);
  } catch (error) {
    console.error("Chyba při načítání hlasů", error);
    return {};
  }
}

function saveVotes(votes) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(votes));
  } catch (error) {
    console.error("Chyba při ukládání hlasů", error);
  }
}

function editableStorageKey(element) {
  return `${EDIT_STORAGE_PREFIX}${element.dataset.editable}`;
}

function loadEditableContent(element) {
  try {
    const stored = window.localStorage.getItem(editableStorageKey(element));
    if (stored) {
      element.textContent = stored;
      return true;
    }
  } catch (error) {
    console.error("Chyba při načítání obsahu", error);
  }
  return false;
}

function saveEditableContent(element) {
  try {
    window.localStorage.setItem(editableStorageKey(element), element.textContent.trim());
  } catch (error) {
    console.error("Chyba při ukládání obsahu", error);
  }
}

function resetEditableContent(elements) {
  elements.forEach((element) => {
    try {
      window.localStorage.removeItem(editableStorageKey(element));
      if (typeof element.dataset.originalContent !== "undefined") {
        element.textContent = element.dataset.originalContent;
      }
    } catch (error) {
      console.error("Chyba při resetování obsahu", error);
    }
  });
}

function ensureOptionExists(votes, optionId, label) {
  if (!votes[optionId]) {
    votes[optionId] = { label, count: 0 };
  }
}

function renderOptions(options, votes) {
  if (!pollOptionsContainer) return;
  const fragment = document.createDocumentFragment();

  options.forEach((option) => {
    ensureOptionExists(votes, option.id, option.label);

    const label = document.createElement("label");
    label.className = "poll__option";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "poll-option";
    input.value = option.id;

    const span = document.createElement("span");
    span.textContent = option.label;

    label.appendChild(span);
    label.appendChild(input);
    fragment.appendChild(label);
  });

  pollOptionsContainer.innerHTML = "";
  pollOptionsContainer.appendChild(fragment);
}

function renderResults(votes) {
  if (!pollResultsList) return;
  const entries = Object.entries(votes);
  const totalVotes = entries.reduce((sum, [, data]) => sum + data.count, 0) || 0;

  const fragment = document.createDocumentFragment();

  entries
    .sort(([, a], [, b]) => b.count - a.count)
    .forEach(([id, data]) => {
      const listItem = document.createElement("li");
      listItem.dataset.optionId = id;

      const label = document.createElement("span");
      label.textContent = data.label;
      listItem.appendChild(label);

      const bar = document.createElement("div");
      bar.className = "poll-results__bar";
      const barFill = document.createElement("span");
      barFill.className = "poll-results__fill";
      const percentage = totalVotes ? Math.round((data.count / totalVotes) * 100) : 0;
      barFill.style.width = `${percentage}%`;
      bar.appendChild(barFill);
      listItem.appendChild(bar);

      const meta = document.createElement("div");
      meta.className = "poll-results__meta";
      const votesSpan = document.createElement("span");
      votesSpan.textContent = `${data.count} hlas${declineCzechVotes(data.count)}`;
      const percentageSpan = document.createElement("span");
      percentageSpan.textContent = `${percentage}%`;
      meta.appendChild(votesSpan);
      meta.appendChild(percentageSpan);
      listItem.appendChild(meta);

      fragment.appendChild(listItem);
    });

  pollResultsList.innerHTML = "";
  pollResultsList.appendChild(fragment);
}

function declineCzechVotes(count) {
  if (count === 1) return "";
  if (count >= 2 && count <= 4) return "y";
  return "ů";
}

function handlePollSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const selectedOption = formData.get("poll-option");
  const customOption = customOptionInput.value.trim();

  if (!selectedOption && !customOption) {
    return;
  }

  const votes = loadVotes();

  if (customOption) {
    const customId = `custom-${customOption.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}`;
    ensureOptionExists(votes, customId, customOption);
    votes[customId].count += 1;
  } else if (selectedOption) {
    ensureOptionExists(votes, selectedOption, findOptionLabel(selectedOption));
    votes[selectedOption].count += 1;
  }

  saveVotes(votes);
  renderResults(votes);
  pollForm.reset();
}

function findOptionLabel(optionId) {
  const option = defaultOptions.find((opt) => opt.id === optionId);
  return option ? option.label : "Vaše aktivita";
}

function handleHeroFormSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const email = formData.get("email");
  if (!email || !heroFormHint) return;

  const original = heroFormHint.dataset.defaultText || heroFormHint.textContent;
  heroFormHint.dataset.defaultText = original;
  heroFormHint.textContent = `Díky, ${email}! Ozveme se s dalším termínem.`;
  heroFormHint.classList.add("form-hint--success");

  setTimeout(() => {
    heroFormHint.textContent = original;
    heroFormHint.classList.remove("form-hint--success");
  }, 5000);

  event.currentTarget.reset();
}

function setupEditing() {
  const editableElements = Array.from(document.querySelectorAll("[data-editable]"));
  if (!editableElements.length || !editToggle) {
    return;
  }

  editableElements.forEach((element) => {
    const original = element.textContent.trim();
    if (typeof element.dataset.originalContent === "undefined") {
      element.dataset.originalContent = original;
    }
    const hasCustomContent = loadEditableContent(element);
    if (!hasCustomContent) {
      element.textContent = original;
    }
  });

  let isEditMode = false;

  function setEditMode(enabled) {
    isEditMode = enabled;
    document.body.dataset.editMode = enabled ? "true" : "false";
    editToggle.setAttribute("aria-pressed", String(enabled));
    editToggle.classList.toggle("btn--edit-active", enabled);
    if (editReset) {
      editReset.hidden = !enabled;
    }

    editableElements.forEach((element) => {
      element.toggleAttribute("contenteditable", enabled);
      if (!enabled) {
        element.blur();
      }
    });
  }

  editToggle.addEventListener("click", () => {
    setEditMode(!isEditMode);
  });

  editableElements.forEach((element) => {
    element.addEventListener("input", () => {
      if (!isEditMode) return;
      saveEditableContent(element);
    });
    element.addEventListener("blur", () => {
      if (!isEditMode) return;
      saveEditableContent(element);
    });
  });

  editReset?.addEventListener("click", () => {
    const shouldReset = window.confirm("Opravdu chceš obnovit původní texty?");
    if (!shouldReset) {
      return;
    }
    resetEditableContent(editableElements);
  });
}

function init() {
  eventsData = loadCollection(COLLECTION_STORAGE.events, defaultEvents);
  infosData = loadCollection(COLLECTION_STORAGE.infos, defaultInfos);
  galleryData = loadCollection(COLLECTION_STORAGE.gallery, defaultGalleryTiles);

  renderSchedule(eventsData);
  renderInfos(infosData);
  renderGallery(galleryData);
  renderAdminEvents(eventsData);
  renderAdminInfos(infosData);
  renderAdminGallery(galleryData);

  const votes = loadVotes();
  renderOptions(defaultOptions, votes);
  renderResults(votes);

  if (pollForm) {
    pollForm.addEventListener("submit", handlePollSubmit);
  }

  pollOptionsContainer?.addEventListener("change", () => {
    if (customOptionInput.value) {
      customOptionInput.value = "";
    }
  });

  customOptionInput?.addEventListener("input", () => {
    if (!pollOptionsContainer) return;
    const checked = pollOptionsContainer.querySelector('input[type="radio"]:checked');
    if (checked) {
      checked.checked = false;
    }
  });

  if (heroForm) {
    heroForm.addEventListener("submit", handleHeroFormSubmit);
  }

  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

  setupEditing();

  adminToggle?.addEventListener("click", () => {
    openAdminPanel();
  });

  adminClose?.addEventListener("click", () => {
    closeAdminPanel();
  });

  adminOverlay?.addEventListener("click", () => {
    closeAdminPanel();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && adminPanel?.getAttribute("aria-hidden") === "false") {
      closeAdminPanel();
    }
  });

  adminEventForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const day = Number.parseInt(formData.get("day"), 10);
    const month = String(formData.get("month") || "").trim();
    const title = String(formData.get("title") || "").trim();
    const status = String(formData.get("status") || "").trim();
    const meta = String(formData.get("meta") || "").trim();
    const badgeText = String(formData.get("badgeText") || "").trim();
    const badgeVariant = String(formData.get("badgeVariant") || "green").trim() || "green";

    if (!day || !month || !title || !status || !meta) {
      return;
    }

    const newEvent = {
      id: `event-${Date.now()}`,
      day,
      month,
      title,
      status,
      meta,
      badgeText,
      badgeVariant
    };

    eventsData = [...eventsData, newEvent];
    saveCollection(COLLECTION_STORAGE.events, eventsData);
    renderSchedule(eventsData);
    renderAdminEvents(eventsData);
    event.currentTarget.reset();
  });

  adminInfoForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const text = String(formData.get("info") || "").trim();
    if (!text) {
      return;
    }
    const newInfo = { id: `info-${Date.now()}`, text };
    infosData = [...infosData, newInfo];
    saveCollection(COLLECTION_STORAGE.infos, infosData);
    renderInfos(infosData);
    renderAdminInfos(infosData);
    event.currentTarget.reset();
  });

  adminGalleryForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const label = String(formData.get("label") || "").trim();
    if (!label) {
      return;
    }
    const newTile = { id: `tile-${Date.now()}`, label };
    galleryData = [...galleryData, newTile];
    saveCollection(COLLECTION_STORAGE.gallery, galleryData);
    renderGallery(galleryData);
    renderAdminGallery(galleryData);
    event.currentTarget.reset();
  });

  adminResetData?.addEventListener("click", () => {
    const confirmed = window.confirm(
      "Opravdu chceš obnovit výchozí data? Přijdeš o všechny vlastní události, informace i galerii."
    );
    if (!confirmed) {
      return;
    }
    eventsData = cloneCollection(defaultEvents);
    infosData = cloneCollection(defaultInfos);
    galleryData = cloneCollection(defaultGalleryTiles);

    try {
      window.localStorage.removeItem(COLLECTION_STORAGE.events);
      window.localStorage.removeItem(COLLECTION_STORAGE.infos);
      window.localStorage.removeItem(COLLECTION_STORAGE.gallery);
    } catch (error) {
      console.error("Chyba při resetování kolekcí", error);
    }

    renderSchedule(eventsData);
    renderInfos(infosData);
    renderGallery(galleryData);
    renderAdminEvents(eventsData);
    renderAdminInfos(infosData);
    renderAdminGallery(galleryData);
  });
}

function renderSchedule(events) {
  if (!scheduleList) return;
  scheduleList.innerHTML = "";

  if (!events.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Zatím tu není žádný termín. Přidej první akci v administraci.";
    scheduleList.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();

  events.forEach((event) => {
    const article = document.createElement("article");
    article.className = "schedule-item";

    const date = document.createElement("div");
    date.className = "schedule-item__date";
    const day = document.createElement("span");
    day.className = "schedule-item__day";
    day.textContent = event.day;
    const month = document.createElement("span");
    month.textContent = event.month;
    date.appendChild(day);
    date.appendChild(month);

    const content = document.createElement("div");
    content.className = "schedule-item__content";
    const title = document.createElement("h3");
    title.textContent = event.title;
    const status = document.createElement("p");
    status.textContent = event.status;
    content.appendChild(title);
    content.appendChild(status);

    const meta = document.createElement("div");
    meta.className = "schedule-item__meta";
    if (event.badgeText) {
      const badge = document.createElement("span");
      const variant = event.badgeVariant || "green";
      badge.className = `pill pill--${variant}`;
      badge.textContent = event.badgeText;
      meta.appendChild(badge);
    }
    const metaText = document.createElement("span");
    metaText.textContent = event.meta;
    meta.appendChild(metaText);

    const button = document.createElement("button");
    button.className = "btn btn--ghost";
    button.type = "button";
    button.textContent = "Zobrazit detaily";

    article.appendChild(date);
    article.appendChild(content);
    article.appendChild(meta);
    article.appendChild(button);

    fragment.appendChild(article);
  });

  scheduleList.appendChild(fragment);
}

function renderInfos(infos) {
  if (!infoList) return;
  infoList.innerHTML = "";

  if (!infos.length) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "Žádné informace k zobrazení. Přidej první poznámku.";
    infoList.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  infos.forEach((info) => {
    const item = document.createElement("li");
    item.textContent = info.text;
    fragment.appendChild(item);
  });

  infoList.appendChild(fragment);
}

function renderGallery(tiles) {
  if (!galleryGrid) return;
  galleryGrid.innerHTML = "";

  if (!tiles.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Galerie je prázdná. Přidej nové dlaždice v administraci.";
    galleryGrid.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  tiles.forEach((tile) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "gallery__tile";
    button.textContent = tile.label;
    fragment.appendChild(button);
  });

  galleryGrid.appendChild(fragment);
}

function renderAdminEvents(events) {
  if (!adminEventsList) return;
  adminEventsList.innerHTML = "";

  if (!events.length) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "Žádné události. Přidej první termín.";
    adminEventsList.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  events.forEach((event) => {
    const item = document.createElement("li");

    const meta = document.createElement("div");
    meta.className = "admin-list__meta";
    const title = document.createElement("strong");
    title.textContent = `${event.day}. ${event.month} · ${event.title}`;
    const details = document.createElement("span");
    details.textContent = `${event.status} · ${event.meta}`;
    meta.appendChild(title);
    meta.appendChild(details);

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "btn btn--ghost btn--small";
    removeButton.textContent = "Smazat";
    removeButton.addEventListener("click", () => {
      eventsData = eventsData.filter((item) => item.id !== event.id);
      saveCollection(COLLECTION_STORAGE.events, eventsData);
      renderSchedule(eventsData);
      renderAdminEvents(eventsData);
    });

    item.appendChild(meta);
    item.appendChild(removeButton);
    fragment.appendChild(item);
  });

  adminEventsList.appendChild(fragment);
}

function renderAdminInfos(infos) {
  if (!adminInfoList) return;
  adminInfoList.innerHTML = "";

  if (!infos.length) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "Žádné informace.";
    adminInfoList.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  infos.forEach((info) => {
    const item = document.createElement("li");

    const text = document.createElement("span");
    text.textContent = info.text;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "btn btn--ghost btn--small";
    removeButton.textContent = "Smazat";
    removeButton.addEventListener("click", () => {
      infosData = infosData.filter((item) => item.id !== info.id);
      saveCollection(COLLECTION_STORAGE.infos, infosData);
      renderInfos(infosData);
      renderAdminInfos(infosData);
    });

    item.appendChild(text);
    item.appendChild(removeButton);
    fragment.appendChild(item);
  });

  adminInfoList.appendChild(fragment);
}

function renderAdminGallery(tiles) {
  if (!adminGalleryList) return;
  adminGalleryList.innerHTML = "";

  if (!tiles.length) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "Galerie je prázdná.";
    adminGalleryList.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  tiles.forEach((tile) => {
    const item = document.createElement("li");

    const text = document.createElement("span");
    text.textContent = tile.label;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "btn btn--ghost btn--small";
    removeButton.textContent = "Smazat";
    removeButton.addEventListener("click", () => {
      galleryData = galleryData.filter((item) => item.id !== tile.id);
      saveCollection(COLLECTION_STORAGE.gallery, galleryData);
      renderGallery(galleryData);
      renderAdminGallery(galleryData);
    });

    item.appendChild(text);
    item.appendChild(removeButton);
    fragment.appendChild(item);
  });

  adminGalleryList.appendChild(fragment);
}

function openAdminPanel() {
  if (!adminPanel) return;
  adminPanel.setAttribute("aria-hidden", "false");
  document.body.dataset.adminOpen = "true";
}

function closeAdminPanel() {
  if (!adminPanel) return;
  adminPanel.setAttribute("aria-hidden", "true");
  delete document.body.dataset.adminOpen;
}

init();
