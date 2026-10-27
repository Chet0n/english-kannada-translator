const form = document.getElementById("translate-form");
const input = document.getElementById("english-input");
const translateButton = document.getElementById("translate-button");
const resultText = document.getElementById("result-text");
const resultMessage = document.getElementById("result-message");
const copyButton = document.getElementById("copy-button");
const errorMessage = document.getElementById("error-message");
const charCount = document.getElementById("char-count");
const historyList = document.getElementById("history-list");
const clearHistoryButton = document.getElementById("clear-history");
const toast = document.getElementById("toast");

const HISTORY_KEY = "kannadaTranslatorHistory";
let currentTranslation = "";
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function getHistory() {
  try {
    const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveHistory(items) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 8)));
}

function renderHistory() {
  const items = getHistory();
  historyList.replaceChildren();

  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-history";
    const icon = document.createElement("span");
    icon.className = "empty-history-icon";
    icon.textContent = "↻";
    const text = document.createElement("span");
    text.textContent = "Your recent translations will show up here.";
    empty.append(icon, text);
    historyList.append(empty);
    return;
  }

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "history-item";

    const words = document.createElement("div");
    words.className = "history-words";
    const english = document.createElement("div");
    english.className = "history-english";
    english.textContent = item.english;
    const kannada = document.createElement("div");
    kannada.className = "history-kannada";
    kannada.textContent = item.kannada;
    words.append(english, kannada);

    const copy = document.createElement("button");
    copy.className = "history-copy";
    copy.type = "button";
    copy.textContent = "Copy";
    copy.addEventListener("click", () => copyText(item.kannada));

    row.append(words, copy);
    historyList.append(row);
  });
}

function addToHistory(english, kannada) {
  const items = getHistory().filter(
    (item) => item.english.toLowerCase() !== english.toLowerCase()
  );
  items.unshift({ english, kannada });
  saveHistory(items);
  renderHistory();
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("Kannada translation copied!");
  } catch {
    // Fallback for browsers that do not allow Clipboard API access.
    const temporary = document.createElement("textarea");
    temporary.value = text;
    temporary.style.position = "fixed";
    temporary.style.opacity = "0";
    document.body.append(temporary);
    temporary.select();
    const copied = document.execCommand("copy");
    temporary.remove();
    showToast(copied ? "Kannada translation copied!" : "Copy failed. Please select the text.");
  }
}

input.addEventListener("input", () => {
  charCount.textContent = `${input.value.length} / 160`;
  errorMessage.textContent = "";
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorMessage.textContent = "";
  const text = input.value.trim();

  if (!text) {
    errorMessage.textContent = "Please enter an English word or phrase.";
    input.focus();
    return;
  }

  translateButton.disabled = true;
  translateButton.querySelector("span").textContent = "Translating…";
  copyButton.disabled = true;
  currentTranslation = "";

  try {
    const response = await fetch("/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to translate right now.");
    }

    if (data.found) {
      currentTranslation = data.kannada;
      resultText.textContent = data.kannada;
      resultText.classList.remove("placeholder-result");
      resultMessage.textContent = `English: ${data.english}`;
      copyButton.disabled = false;
      addToHistory(data.english, data.kannada);
    } else {
      resultText.textContent = "Translation not found";
      resultText.classList.add("placeholder-result");
      resultMessage.textContent = data.message;
    }
  } catch (error) {
    errorMessage.textContent = error.message || "Could not connect to the server. Is Flask running?";
  } finally {
    translateButton.disabled = false;
    translateButton.querySelector("span").textContent = "Translate";
  }
});

copyButton.addEventListener("click", () => {
  if (currentTranslation) copyText(currentTranslation);
});

document.querySelectorAll(".phrase-chip").forEach((button) => {
  button.addEventListener("click", () => {
    input.value = button.dataset.phrase;
    charCount.textContent = `${input.value.length} / 160`;
    errorMessage.textContent = "";
    input.focus();
  });
});

clearHistoryButton.addEventListener("click", () => {
  saveHistory([]);
  renderHistory();
  showToast("Translation history cleared.");
});

renderHistory();
