

let quotes = JSON.parse(localStorage.getItem('quotes')) || [
  { text: "Believe you can and you're halfway there.", category: "Motivation" },
  { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Inspiration" },
  { text: "Do what you can, with what you have, where you are.", category: "Action" }
];


let lastViewedQuote = sessionStorage.getItem('lastViewedQuote');


document.addEventListener('DOMContentLoaded', () => {
  populateCategories();
  displayQuote(lastViewedQuote ? JSON.parse(lastViewedQuote) : getRandomQuote());
  document.getElementById('categoryFilter').addEventListener('change', filterQuotes);
  document.getElementById('newQuote').addEventListener('click', showNewQuote);
  fetchQuotesFromServer();
});


function getRandomQuote() {
  return quotes[Math.floor(Math.random() * quotes.length)];
}

function displayQuote(quoteObj) {
  const quoteDisplay = document.getElementById('quoteDisplay');
  quoteDisplay.textContent = `"${quoteObj.text}"`;
  document.getElementById('categoryDisplay').textContent = `Category: ${quoteObj.category}`;
  sessionStorage.setItem('lastViewedQuote', JSON.stringify(quoteObj));
}

function showNewQuote() {
  const newQuote = getRandomQuote();
  displayQuote(newQuote);
}


function addQuote(text, category) {
  quotes.push({ text, category });
  saveQuotes();
  populateCategories();
}

// Save quotes to localStorage
function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}


function populateCategories() {
  const filter = document.getElementById('categoryFilter');
  if (!filter) return;

  const uniqueCategories = [...new Set(quotes.map(q => q.category))];
  filter.innerHTML = `<option value="all">All Categories</option>`;
  uniqueCategories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    filter.appendChild(option);
  });

  // Restore last selected filter
  const savedFilter = localStorage.getItem('selectedCategory');
  if (savedFilter) {
    filter.value = savedFilter;
    filterQuotes();
  }
}

function filterQuotes() {
  const selectedCategory = document.getElementById('categoryFilter').value;
  localStorage.setItem('selectedCategory', selectedCategory);

  let filtered = quotes;
  if (selectedCategory !== 'all') {
    filtered = quotes.filter(q => q.category === selectedCategory);
  }

  const quoteDisplay = document.getElementById('quoteDisplay');
  if (filtered.length === 0) {
    quoteDisplay.textContent = "No quotes found in this category.";
    document.getElementById('categoryDisplay').textContent = "";
  } else {
    const randomFiltered = filtered[Math.floor(Math.random() * filtered.length)];
    displayQuote(randomFiltered);
  }
}



function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'quotes.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(event) {
    try {
      const importedQuotes = JSON.parse(event.target.result);
      quotes.push(...importedQuotes);
      saveQuotes();
      populateCategories();
      alert('Quotes imported successfully!');
    } catch (error) {
      alert('Invalid JSON file format.');
    }
  };
  fileReader.readAsText(event.target.files[0]);
}


async function fetchQuotesFromServer() {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts');
    const serverData = await response.json();

    // Simulate server quotes
    const serverQuotes = serverData.slice(0, 5).map(post => ({
      text: post.title,
      category: 'Server Quotes'
    }));

    mergeServerQuotes(serverQuotes);
  } catch (error) {
    console.error("Error fetching quotes from server:", error);
  }
}

function mergeServerQuotes(serverQuotes) {
  const localQuotes = JSON.parse(localStorage.getItem('quotes')) || [];
  let mergedQuotes = [...localQuotes];

  // Add only new quotes from server
  serverQuotes.forEach(sq => {
    const exists = localQuotes.some(lq => lq.text === sq.text);
    if (!exists) mergedQuotes.push(sq);
  });

  localStorage.setItem('quotes', JSON.stringify(mergedQuotes));
  quotes = mergedQuotes;
  populateCategories();
  notifyUser("Quotes synced with server!");
}

// Simulate periodic syncing every 30 seconds
setInterval(fetchQuotesFromServer, 30000);


function notifyUser(message) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.className = 'notification';
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}
