let quotes = [
  { text: "The best way to predict the future is to create it.", category: "Motivation" },
  { text: "In the middle of every difficulty lies opportunity.", category: "Inspiration" },
  { text: "Finance without data is like driving with your eyes closed.", category: "Finance" },
  { text: "The secret of getting ahead is getting started.", category: "Motivation" }
];


function showRandomQuote() {
  if (quotes.length === 0) {
    document.getElementById("quoteDisplay").textContent = "No quotes available.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * quotes.length);
  const randomQuote = quotes[randomIndex];

  document.getElementById("quoteDisplay").innerHTML = `
    <p><strong>${randomQuote.category}:</strong> "${randomQuote.text}"</p>
  `;
}



function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");

  const newText = textInput.value.trim();
  const newCategory = categoryInput.value.trim();

  if (!newText || !newCategory) {
    alert("Please fill in both the quote and category.");
    return;
  }


  quotes.push({ text: newText, category: newCategory });


  textInput.value = "";
  categoryInput.value = "";

  alert("New quote added successfully!");
}


document.getElementById("newQuote").addEventListener("click", showRandomQuote);
showRandomQuote();
