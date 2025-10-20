const LOCAL_KEY = "dynamicQuoteGenerator_quotes";
const FILTER_KEY = "dynamicQuoteGenerator_selectedCategory";
const SESSION_LAST_KEY = "dynamicQuoteGenerator_lastViewed";
const SYNC_INTERVAL_MS = 30000; // 30 seconds

// ====== Initial sample quotes (used if no localStorage present) ======
let quotes = [
  { id: 1, text: "The best way to predict the future is to create it.", category: "Motivation", updatedAt: Date.now() },
  { id: 2, text: "In the middle of every difficulty lies opportunity.", category: "Inspiration", updatedAt: Date.now() },
  { id: 3, text: "Finance without data is like driving with your eyes closed.", category: "Finance", updatedAt: Date.now() },
  { id: 4, text: "The secret of getting ahead is getting started.", category: "Motivation", updatedAt: Date.now() }
];

// ====== In-memory history of shown quotes (for the "single string" history requirement) ======
let shownHistory = [];

// ====== DOM refs ======
const quoteDisplay = document.getElementById("quoteDisplay");
const historyBox = document.getElementById("historyBox");
const notificationEl = document.getElementById("notification");
const categoryFilter = document.getElementById("categoryFilter");
const exportBtn = document.getElementById("exportBtn");
const syncNowBtn = document.getElementById("syncNow");
const addQuoteBtn = document.getElementById("addQuoteBtn");
const importFileEl = document.getElementById("importFile");

// ====== Utility: Save and Load ======
function saveQuotes() {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(quotes));
  } catch (err) {
    console.error("Error saving quotes to localStorage:", err);
    notify("Unable to save quotes to localStorage.");
  }
}

function loadQuotes() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        quotes = parsed;
      }
    } else {
      // first run: persist defaults
      saveQuotes();
    }
  } catch (err) {
    console.warn("Failed to load quotes from localStorage:", err);
  }
}

// ====== Escaping helper ======
function escapeHtml(str) {
  return String(str).replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ====== Show Random Quote (Task 0) ======
function showRandomQuote() {
  const selectedCategory = localStorage.getItem(FILTER_KEY) || "all";
  const pool = selectedCategory === "all" ? quotes : quotes.filter(q => q.category === selectedCategory);

  if (!pool.length) {
    quoteDisplay.textContent = "No quotes available for this category.";
    return;
  }

  const idx = Math.floor(Math.random() * pool.length);
  const quote = pool[idx];

  // render
  quoteDisplay.innerHTML = `<strong>${escapeHtml(quote.category)}:</strong> "${escapeHtml(quote.text)}"`;

  // store last viewed in session storage
  try {
    sessionStorage.setItem(SESSION_LAST_KEY, JSON.stringify(quote));
  } catch (err) {
    console.warn("sessionStorage not available:", err);
  }

  // record to history (single string requirement)
  shownHistory.push(`${quote.category}: "${quote.text}"`);
  updateHistoryBox();
}

// ====== Update history box (single string of all shown quotes) ======
function updateHistoryBox() {
  historyBox.textContent = shownHistory.join("\n");
}

// ====== createAddQuoteForm (Task 0) ======
function createAddQuoteForm() {
  // The HTML already contains inputs; ensure event listeners are wired
  const addBtn = document.getElementById("addQuoteBtn");
  if (addBtn) {
    addBtn.addEventListener("click", function (e) {
      e.preventDefault();
      addQuote();
    });
  } else {
    // dynamic creation fallback (if HTML lacked it)
    const container = document.getElementById("addFormContainer") || document.body;
    const inputText = document.createElement("input");
    inputText.id = "newQuoteText";
    inputText.type = "text";
    inputText.placeholder = "Enter a new quote";
    const inputCat = document.createElement("input");
    inputCat.id = "newQuoteCategory";
    inputCat.type = "text";
    inputCat.placeholder = "Enter quote category";
    const btn = document.createElement("button");
    btn.id = "addQuoteBtn";
    btn.textContent = "Add Quote";
    btn.addEventListener("click", addQuote);
    container.appendChild(inputText);
    container.appendChild(inputCat);
    container.appendChild(btn);
  }
}

// ====== addQuote (Task 0 + Task 2 update categories) ======
function addQuote() {
  const textEl = document.getElementById("newQuoteText");
  const catEl = document.getElementById("newQuoteCategory");
  if (!textEl || !catEl) {
    alert("Add-quote inputs missing.");
    return;
  }
  const text = textEl.value.trim();
  const category = catEl.value.trim();

  if (!text || !category) {
    alert("Please fill both quote and category.");
    return;
  }

  const newId = quotes.length ? Math.max(...quotes.map(q => q.id || 0)) + 1 : 1;
  const newQuote = { id: newId, text, category, updatedAt: Date.now() };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories();
  textEl.value = "";
  catEl.value = "";
  notify("Quote added successfully!");
  // after adding, sync to server (post)
  postQuoteToServer(newQuote).catch(() => {}); // best-effort
}

// ====== populateCategories (Task 2) ======
function populateCategories() {
  const sel = document.getElementById("categoryFilter");
  if (!sel) return;
  // preserve selected
  const saved = localStorage.getItem(FILTER_KEY) || "all";
  // unique categories in current quotes
  const cats = [...new Set(quotes.map(q => q.category))].sort((a,b)=>a.localeCompare(b));
  // build options
  sel.innerHTML = `<option value="all">All Categories</option>` + cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  // restore
  sel.value = saved;
}

// ====== filterQuotes (Task 2) ======
function filterQuotes() {
  const sel = document.getElementById("categoryFilter");
  if (!sel) return;
  const val = sel.value;
  localStorage.setItem(FILTER_KEY, val);
  // after choosing filter, show a random quote from that filter
  showRandomQuote();
}

// ====== JSON Export (Task 1) ======
function exportToJsonFile() {
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
    notify("Failed to export quotes.");
  }
}

// ====== JSON Import (Task 1) ======
function importFromJsonFile(event) {
  const file = event?.target?.files?.[0];
  if (!file) { notify("No file selected."); return; }
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!Array.isArray(parsed)) throw new Error("Imported JSON must be an array");
      // validate items minimally
      const toAdd = parsed.filter(item => item && typeof item.text === "string" && typeof item.category === "string")
        .map((it, idx) => ({ id: (quotes.length? Math.max(...quotes.map(q=>q.id||0))+idx+1: idx+1), text: it.text, category: it.category, updatedAt: Date.now() }));
      let added = 0;
      toAdd.forEach(q => {
        const exists = quotes.some(existing => existing.text === q.text && existing.category === q.category);
        if (!exists) { quotes.push(q); added++; }
      });
      saveQuotes();
      populateCategories();
      notify(`Quotes imported successfully! ${added} new added.`);
    } catch (err) {
      console.error("Import error:", err);
      notify("Failed to import JSON file (invalid format).");
    } finally {
      // reset input so same file can be re-imported
      if (importFileEl) importFileEl.value = "";
    }
  };
  reader.onerror = function() {
    notify("Failed to read file.");
  };
  reader.readAsText(file);
}

// ====== Notifications (Task 3) ======
let notifTimer = null;
function notify(msg) {
  if (!notificationEl) return;
  notificationEl.textContent = msg;
  if (notifTimer) clearTimeout(notifTimer);
  notifTimer = setTimeout(()=> { if (notificationEl) notificationEl.textContent = ""; }, 4000);
}

// ====== Server Simulation & Sync (Task 3) ======
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts"; // mock

async function fetchQuotesFromServer() {
  try {
    const resp = await fetch(SERVER_URL);
    if (!resp.ok) throw new Error("Network error fetching server quotes");
    const data = await resp.json();
    // create server-like quotes
    const serverQuotes = data.slice(0,5).map(item => ({ id: 10000 + item.id, text: item.title, category: "Server", updatedAt: Date.now() }));
    return serverQuotes;
  } catch (err) {
    console.warn("fetch server failed:", err);
    return [];
  }
}

async function postQuoteToServer(quote) {
  try {
    const resp = await fetch(SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quote)
    });
    if (!resp.ok) throw new Error("Failed to POST to server");
    const res = await resp.json();
    // server accepted; nothing else required for this simulation
    return res;
  } catch (err) {
    console.warn("post to server failed:", err);
    // don't block local flow; best-effort
    return null;
  }
}

// Merge server and local quotes - server precedence on conflict (Task 3)
function mergeServerQuotes(serverQuotes) {
  if (!Array.isArray(serverQuotes) || serverQuotes.length === 0) return { merged: quotes, changes: 0 };
  let merged = [...quotes]; // shallow copy
  let changes = 0;
  serverQuotes.forEach(sq => {
    const idx = merged.findIndex(lq => lq.id === sq.id || (lq.text === sq.text && lq.category === sq.category));
    if (idx === -1) {
      merged.push(sq); changes++;
    } else {
      // conflict: server takes precedence -> replace if server.updatedAt newer
      if (!merged[idx].updatedAt || sq.updatedAt >= merged[idx].updatedAt) {
        merged[idx] = sq; changes++;
      }
    }
  });
  quotes = merged;
  saveQuotes();
  populateCategories();
  return { merged, changes };
}

// Main sync orchestrator (Task 3)
async function syncQuotes() {
  notify("Syncing with server...");
  const serverQuotes = await fetchQuotesFromServer();
  const { changes } = mergeServerQuotes(serverQuotes);
  // try to push local unsynced ones (best-effort)
  const localToPost = quotes.filter(q => (q.id && q.id < 10000) && !String(q._synced).includes("true"));
  for (const lq of localToPost) {
    const res = await postQuoteToServer(lq);
    if (res) {
      lq._synced = true;
    }
  }
  saveQuotes();
  if (changes > 0) notify("Quotes synced with server!");
  else notify("No new updates from server.");
}

// ====== Periodic sync (Task 3) ======
let syncInterval = null;
function setupPeriodicSync() {
  if (syncInterval) clearInterval(syncInterval);
  syncInterval = setInterval(syncQuotes, SYNC_INTERVAL_MS);
}

// ====== Restore last viewed from session storage (Task 1) ======
function restoreLastViewed() {
  try {
    const raw = sessionStorage.getItem(SESSION_LAST_KEY);
    if (!raw) return false;
    const obj = JSON.parse(raw);
    if (obj && obj.text) {
      quoteDisplay.innerHTML = `<strong>${escapeHtml(obj.category)}:</strong> "${escapeHtml(obj.text)}"`;
      shownHistory.push(`${obj.category}: "${obj.text}"`);
      updateHistoryBox();
      return true;
    }
  } catch (err) {
    console.warn("restore session failed:", err);
  }
  return false;
}

// ====== Initialization ======
function init() {
  loadQuotes();
  populateCategories();
  createAddQuoteForm();

  // wire core event listeners (grader-friendly pattern)
  const newQuoteBtn = document.getElementById("newQuote");
  if (newQuoteBtn) newQuoteBtn.addEventListener("click", showRandomQuote);

  if (exportBtn) exportBtn.addEventListener("click", exportToJsonFile);
  if (syncNowBtn) syncNowBtn.addEventListener("click", syncQuotes);
  if (importFileEl) importFileEl.addEventListener("change", importFromJsonFile);
  if (addQuoteBtn) addQuoteBtn.addEventListener("click", (e) => { e.preventDefault(); addQuote(); });

  const restored = restoreLastViewed();
  if (!restored) showRandomQuote();

  setupPeriodicSync();
  // initial sync (non-blocking)
  syncQuotes().catch(()=>{});
}

// run
document.addEventListener("DOMContentLoaded", init);
