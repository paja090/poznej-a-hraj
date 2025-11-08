const defaultOptions = [
  { id: "speed-networking", label: "Speed networking s deskovkami" },
  { id: "crew-challenge", label: "Crew challenge: kooperativní výzva" },
  { id: "mixology", label: "Mixology & games pairing" },
  { id: "prototype-lab", label: "Laboratoř prototypů s Eliškou" }
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

const EDIT_STORAGE_PREFIX = "poznej-a-hraj-edit:";

const STORAGE_KEY = "poznej-a-hraj-poll";

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
}

init();
