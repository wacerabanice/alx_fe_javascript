const LOCAL_KEY = "dynamicQuoteGenerator_quotes";
const SESSION_KEY_LAST = "dynamicQuoteGenerator_lastQuote";


const defaultQuotes = [
  { text: "The best way to predict the future is to create it.", category: "Motivation" },
  { text: "In the middle of every difficulty lies opportunity.", category: "Inspiration" },
  { text: "Finance without data is like driving with your eyes closed.", category: "Finance" },
  { text: "The secret of getting ahead is getting started.", category: "Motivation" }
];


let quotes = [];


function saveQuotes() {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(quotes));
  } catch (err) {
    console.error("Failed to save quotes to localStorage:", err);
    alert("Unable to save quotes in localStorage (quota? private mode?).");
  }
}


function loadQuotes() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) {
      quotes = defaultQuotes.slice(); 
      saveQuotes();
      return;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("Saved quotes are not an array");
    const valid = parsed.every(q => q && typeof q.text === "string" && typeof q.category === "string");
    if (!valid) throw new Error("Saved quotes have invalid shape");
    quotes = parsed;
  } catch (err) {
    console.warn("Could not load quotes from localStorage, using defaults. Error:", err);
    quotes = defaultQuotes.slice();
    saveQuotes();
  }
}


function showRandomQuote() {
  const quoteDisplay = document.getElementById("quoteDisplay");
  if (!quoteDisplay) return;

  if (!Array.isArray(quotes) || quotes.length === 0) {
    quoteDisplay.textContent = "No quotes available.";
    sessionStorage.removeItem(SESSION_KEY_LAST);
    return;
  }

  const randomIndex = Math.floor(Math.random() * quotes.length);
  const randomQuote = quotes[randomIndex];


  quoteDisplay.innerHTML = `<p><strong>${escapeHtml(randomQuote.category)}:</strong> "${escapeHtml(randomQuote.text)}"</p>`;

 
  try {
    sessionStorage.setItem(SESSION_KEY_LAST, JSON.stringify({ index: randomIndex, quote: randomQuote }));
  } catch (err) {
    console.warn("Could not save last quote to sessionStorage:", err);
  }
}


function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function addQuote() {
  const textEl = document.getElementById("newQuoteText");
  const catEl = document.getElementById("newQuoteCategory");

  if (!textEl || !catEl) {
    alert("Add-quote inputs are missing from the page.");
    return;
  }

  const newText = textEl.value.trim();
  const newCategory = catEl.value.trim();

  if (!newText || !newCategory) {
    alert("Please fill in both the quote text and its category.");
    return;
  }


  quotes.push({ text: newText, category: newCategory });
  saveQuotes();

  
  textEl.value = "";
  catEl.value = "";

  alert("Quote added and saved!");
}


function exportQuotesToJson() {
  try {
    const dataStr = JSON.stringify(quotes, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "quotes.json";
    document.body.appendChild(a);
    a.click();
    a.remove();

   
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.error("Export failed:", err);
    alert("Could not export quotes.");
  }
}


function importFromJsonFile(event) {
  const file = event?.target?.files?.[0];
  if (!file) {
    alert("No file selected.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const parsed = JSON.parse(e.target.result);

      if (!Array.isArray(parsed)) {
        throw new Error("Imported JSON must be an array of quote objects.");
      }

     
      const toAdd = [];
      parsed.forEach((item, idx) => {
        if (!item || typeof item.text !== "string" || typeof item.category !== "string") {
          throw new Error(`Imported item at index ${idx} is invalid. Each item must have 'text' and 'category' strings.`);
        }
        toAdd.push({ text: item.text, category: item.category });
      });

      
      let added = 0;
      toAdd.forEach(q => {
        const exists = quotes.some(existing => existing.text === q.text && existing.category === q.category);
        if (!exists) {
          quotes.push(q);
          added++;
        }
      });

      saveQuotes();
      alert(`Import successful. ${added} new quotes added (${toAdd.length - added} duplicates skipped).`);
    } catch (err) {
      console.error("Import error:", err);
      alert("Failed to import JSON file: " + (err.message || err));
    } finally {
      event.target.value = "";
    }
  };

  reader.onerror = function (err) {
    console.error("File read error:", err);
    alert("Failed to read the file.");
  };

  reader.readAsText(file);
}


function createImportExportUI() {
  const container = document.createElement("div");
  container.style.marginTop = "1rem";


  const exportBtn = document.createElement("button");
  exportBtn.type = "button";
  exportBtn.textContent = "Export Quotes (JSON)";
  exportBtn.id = "exportQuotesBtn";
  exportBtn.addEventListener("click", exportQuotesToJson);

 
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".json,application/json";
  fileInput.id = "importFile";
  fileInput.style.marginLeft = "0.5rem";
  fileInput.addEventListener("change", importFromJsonFile);

  container.appendChild(exportBtn);
  container.appendChild(fileInput);


  const newQuoteBtn = document.getElementById("newQuote");
  if (newQuoteBtn && newQuoteBtn.parentNode) {
    newQuoteBtn.parentNode.insertBefore(container, newQuoteBtn.nextSibling);
  } else {
    document.body.appendChild(container);
  }
}


function restoreLastViewedIfAny() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY_LAST);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.quote && typeof parsed.quote.text === "string") {
      const quoteDisplay = document.getElementById("quoteDisplay");
      if (quoteDisplay) {
        quoteDisplay.innerHTML = `<p><strong>${escapeHtml(parsed.quote.category)}:</strong> "${escapeHtml(parsed.quote.text)}"</p>`;
      }
    }
  } catch (err) {
    console.warn("Could not restore last viewed quote:", err);
  }
}


function attachShowNewQuoteListener() {
  const btn = document.getElementById("newQuote");
  if (btn) {
       btn.addEventListener("click", showRandomQuote);
  } else {
    console.warn('Button with id "newQuote" not found — cannot attach listener.');
  }
}


function init() {
  loadQuotes();
  attachShowNewQuoteListener();
  createImportExportUI();

  const last = sessionStorage.getItem(SESSION_KEY_LAST);
  if (last) restoreLastViewedIfAny();
  else showRandomQuote();
}


init();

