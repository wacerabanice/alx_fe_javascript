let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Life is what happens when you’re busy making other plans.", category: "Life" },
  { text: "The purpose of our lives is to be happy.", category: "Happiness" }
];


function showRandomQuote() {
  const categoryFilter = localStorage.getItem("selectedCategory") || "all";
  const filteredQuotes = categoryFilter === "all"
    ? quotes
    : quotes.filter(q => q.category === categoryFilter);

  if (filteredQuotes.length === 0) {
    document.getElementById("quoteDisplay").textContent = "No quotes available for this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const randomQuote = filteredQuotes[randomIndex];

  document.getElementById("quoteDisplay").innerHTML = `
    <p><strong>${randomQuote.category}:</strong> "${randomQuote.text}"</p>
  `;

 
  sessionStorage.setItem("lastViewedQuote", JSON.stringify(randomQuote));
}


function addQuote() {
  const newText = document.getElementById("newQuoteText").value.trim();
  const newCategory = document.getElementById("newQuoteCategory").value.trim();

  if (newText === "" || newCategory === "") {
    alert("Please enter both a quote and a category.");
    return;
  }

  const newQuote = { text: newText, category: newCategory };
  quotes.push(newQuote);
  saveQuotes();


  populateCategories();

  
  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";

  alert("Quote added successfully!");
}

function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}


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
  const fileReader = new FileReader();
  fileReader.onload = function (e) {
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
    } catch (error) {
      alert("Error importing file. Please check the JSON format.");
    }
  };
  fileReader.readAsText(event.target.files[0]);
}


function populateCategories() {
  const categorySelect = document.getElementById("categoryFilter");
  const selectedValue = localStorage.getItem("selectedCategory") || "all";


  categorySelect.innerHTML = `<option value="all">All Categories</option>`;

 
  const categories = [...new Set(quotes.map(q => q.category))];

  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    if (category === selectedValue) option.selected = true;
    categorySelect.appendChild(option);
  });
}


function filterQuotes() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  localStorage.setItem("selectedCategory", selectedCategory);
  showRandomQuote();
}


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

  const savedFilter = localStorage.getItem("selectedCategory");
  if (savedFilter) {
    document.getElementById("categoryFilter").value = savedFilter;
  }
};


document.getElementById("newQuote").addEventListener("click", showRandomQuote);
