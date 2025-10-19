
// Sample initial quotes
let quotes = JSON.parse(localStorage.getItem('quotes')) || [
  { text: "Success is not final; failure is not fatal.", author: "Winston Churchill", category: "Motivation", updatedAt: Date.now() },
  { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein", category: "Inspiration", updatedAt: Date.now() },
  { text: "The best way to get started is to quit talking and begin doing.", author: "Walt Disney", category: "Action", updatedAt: Date.now() }
];

const quoteDisplay = document.getElementById('quoteDisplay');
const addQuoteForm = document.getElementById('addQuoteForm');
const categoryFilter = document.getElementById('categoryFilter');
const notificationBox = document.getElementById('notificationBox');

// === Initialize App ===
document.addEventListener('DOMContentLoaded', () => {
  populateCategories();
  displayQuotes();
  restoreFilter();
  setupPeriodicSync();
});

// === Display Quotes ===
function displayQuotes() {
  const selectedCategory = localStorage.getItem('selectedCategory') || 'all';
  const filteredQuotes = selectedCategory === 'all'
    ? quotes
    : quotes.filter(q => q.category === selectedCategory);

  quoteDisplay.innerHTML = filteredQuotes.map(q =>
    `<div class="quote-card">
      <p>"${q.text}"</p>
      <span>- ${q.author}</span>
      <small>(${q.category})</small>
    </div>`
  ).join('') || '<p>No quotes available in this category.</p>';
}

// === Populate Categories Dynamically ===
function populateCategories() {
  const uniqueCategories = [...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = `<option value="all">All Categories</option>` +
    uniqueCategories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

// === Filter Quotes ===
function filterQuotes() {
  const selected = categoryFilter.value;
  localStorage.setItem('selectedCategory', selected);
  displayQuotes();
}

// === Restore Saved Filter ===
function restoreFilter() {
  const savedCategory = localStorage.getItem('selectedCategory');
  if (savedCategory) {
    categoryFilter.value = savedCategory;
  }
  displayQuotes();
}

// === Add New Quote ===
function addQuote(event) {
  event.preventDefault();
  const text = document.getElementById('quoteText').value.trim();
  const author = document.getElementById('quoteAuthor').value.trim();
  const category = document.getElementById('quoteCategory').value.trim();

  if (!text || !author || !category) return alert("Please fill in all fields!");

  const newQuote = { text, author, category, updatedAt: Date.now() };
  quotes.push(newQuote);
  localStorage.setItem('quotes', JSON.stringify(quotes));

  populateCategories();
  displayQuotes();
  addQuoteForm.reset();

  notifyUser("✅ Quote added successfully!");
}

// === Notifications ===
function notifyUser(message) {
  notificationBox.textContent = message;
  notificationBox.style.display = 'block';
  setTimeout(() => notificationBox.style.display = 'none', 4000);
}

// === Fetch Quotes from Server (Simulated) ===
async function fetchQuotesFromServer() {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts');
    const data = await response.json();

    // Simulate quote-like structure
    return data.slice(0, 5).map(item => ({
      text: item.title,
      author: "Server Author",
      category: "Server Data",
      updatedAt: Date.now()
    }));
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return [];
  }
}

// === Sync Quotes with Server ===
async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();

  // Conflict resolution (Server takes precedence)
  const combined = [...quotes];
  serverQuotes
