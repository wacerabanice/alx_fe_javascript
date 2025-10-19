let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { id: 1, text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { id: 2, text: "Life is what happens when you’re busy making other plans.", category: "Life" },
  { id: 3, text: "The purpose of our lives is to be happy.", category: "Happiness" }
];


const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";


const notificationDiv = document.getElementById("notification");


function showRandomQuote() {
  const categoryFilter = localStorage.getItem("selectedCategory") || "all";
  const filteredQuotes = categoryFilter === "all"
    ? quotes
    : quotes.filter(q => q.category === categoryFilter);

  if (filteredQuotes.length === 0) {
    document.getElementById("quoteDisplay").textContent = "No quotes available.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const randomQuote = filteredQuotes[randomIndex];

  document.getElementById("quoteDisplay").innerHTML = `
    <p><strong>${randomQuote.category}:</strong> "${randomQuote.text}"</p>
  `;

  sessionStorage.setItem("lastViewedQuote", JSON.stringify(randomQuote));
}

// ====== Add New Quote ======
function addQuote() {
  const newText = document.getElementById("newQuoteText").value.trim();
  const newCategory = document.getElementById("newQuoteCategory").value.trim();

  if (!newText || !newCategory) {
    alert("Please enter both quote and category.");
    return;
  }

  const newQuote = {
    id: Date.now(),
    text: newText,
    category: newCategory
  };

  quotes.push(newQuote);
  saveQuotes();
  populateCategories();

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";

  alert("Quote added successfully!");
}

// ====== Save Quotes to Local Storage ======
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// ====== Populate Category Filter ======
function populateCategories() {
  const categorySelect = document.getElementById("categoryFilter");
  categorySelect.innerHTML = `<option value="all">All Categories</option>`;

  const categories = [...new Set(quotes.map(q => q.category))];
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });

  const savedFilter = localStorage.getItem("selectedCategory");
  if (savedFilter) categorySelect.value = savedFilter;
}

// ====== Filter Quotes ======
function filterQuotes() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  localStorage.setItem("selectedCategory", selectedCategory);
  showRandomQuote();
}

// ====== Export / Import ======
function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (!Array.isArray(importedQuotes)) {
        alert("Invalid JSON format.");
        return;
      }
      quotes.push(...importedQuotes);
      saveQuotes();
      populateCategories();
      alert("Quotes imported successfully!");
    } catch {
      alert("Error reading JSON file.");
    }
  };
  reader.readAsText(event.target.files[0]);
}

// ====== Simulate Server Sync ======
async function syncWithServer() {
  try {
    // Simulate fetching quotes from server
    const response = await fetch(SERVER_URL);
    const serverData = await response.json();

    // Convert server data into mock quotes
    const serverQuotes = serverData.slice(0, 5).map(item => ({
      id: item.id,
      text: item.title,
      category: "Server"
    }));

    // ===== Conflict Resolution Strategy =====
    const mergedQuotes = resolveConflicts(quotes, serverQuotes);
    quotes = mergedQuotes;
    saveQuotes();
    populateCategories();

    showNotification("✅ Synced successfully. Server data merged.");
  } catch (error) {
    showNotification("❌ Sync failed. Please check your connection.");
  }
}

// ====== Conflict Resolution Function ======
function resolveConflicts(localQuotes, serverQuotes) {
  const merged = [...localQuotes];

  serverQuotes.forEach(serverQuote => {
    const existing = merged.find(q => q.id === serverQuote.id);
    if (existing) {
      // Conflict: prefer server version
      Object.assign(existing, serverQuote);
      showNotification("⚠️ Conflict detected. Server data applied.");
    } else {
      merged.push(serverQuote);
    }
  });

  return merged;
}

// ====== Notifications ======
function showNotification(message) {
  notificationDiv.textContent = message;
  setTimeout(() => {
    notificationDiv.textContent = "";
  }, 4000);
}

// ====== Periodic Sync Every 60 Seconds ======
setInterval(syncWithServer, 60000);

// ====== On Page Load ======
window.onload = function () {
  populateCategories();

  const lastViewed = sessionStorage.getItem("lastViewedQuote");
  if (lastViewed) {
    const quote = JSON.parse(lastViewed);
    document.getElementById("quoteDisplay").innerHTML = `
      <p><strong>${quote.category}:</strong> "${quote.text}"</p>
    `;
  } else {
    showRandomQuote();
  }
};

// ====== Event Listener for “Show New Quote” ======
document.getElementById("newQuote").addEventListener("click", showRandomQuote);
