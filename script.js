async function fetchSuggestions(query) {
    if (!query) return [];
    const response = await fetch(`https://api.datamuse.com/words?sp=${query}*&max=5`);
    const data = await response.json();
    return data.map(wordObj => wordObj.word);
}

// Function to fetch word suggestions from an external API with caching
const cache = new Map();

async function fetchSuggestions(query) {
    if (!query) return [];

    // Check if suggestions for this query are already cached
    if (cache.has(query)) {
        return cache.get(query);
    }

    const apiUrl = `https://api.datamuse.com/words?sp=${query}*&max=5`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    const suggestions = data.map(item => item.word);

    // Store in cache to prevent redundant API calls
    cache.set(query, suggestions);

    return suggestions;
}

// Get references to the input box and suggestions container
const searchBox = document.getElementById("searchBox");
const suggestionsBox = document.getElementById("suggestionsBox");

// Track selected suggestion index for keyboard navigation
let selectedIndex = -1;

// Event listener for user input
searchBox.addEventListener("input", async () => {
    const inputText = searchBox.value.trim(); // Remove extra spaces
    const wordsArray = inputText.split(" "); // Split input into words
    const lastWord = wordsArray[wordsArray.length - 1]; // Get last word

    suggestionsBox.innerHTML = ""; // Clear previous suggestions
    if (!lastWord) return; // Stop if there's no last word

    const suggestions = await fetchSuggestions(lastWord); // Fetch suggestions
    selectedIndex = -1; // Reset selection index

    // Generate suggestion elements and add to the DOM with fade-in animation
    suggestions.forEach((suggestion, index) => {
        const suggestionElement = document.createElement("div");
        suggestionElement.className = "suggestion";
        suggestionElement.innerHTML = highlightMatch(suggestion, lastWord);

        // When a suggestion is clicked, update the input box
        suggestionElement.onclick = () => selectSuggestion(suggestion, wordsArray);

        suggestionsBox.appendChild(suggestionElement);

        // Apply fade-in animation
        setTimeout(() => {
            suggestionElement.style.opacity = "1";
            suggestionElement.style.transform = "translateY(0)";
        }, 50 * index);
    });
});

// Event listener for keyboard navigation
searchBox.addEventListener("keydown", (event) => {
    const suggestions = document.querySelectorAll(".suggestion");
    if (suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
        event.preventDefault();
        selectedIndex = (selectedIndex + 1) % suggestions.length;
    } else if (event.key === "ArrowUp") {
        event.preventDefault();
        selectedIndex = (selectedIndex - 1 + suggestions.length) % suggestions.length;
    } else if (event.key === "Enter" && selectedIndex !== -1) {
        event.preventDefault();
        suggestions[selectedIndex].click();
    }

    // Highlight selected suggestion
    suggestions.forEach((s, i) => {
        s.style.backgroundColor = i === selectedIndex ? "#ff4757" : "#662d40";
    });
});

// Function to update input box with selected suggestion
function selectSuggestion(suggestion, wordsArray) {
    wordsArray[wordsArray.length - 1] = suggestion;
    searchBox.value = wordsArray.join(" ") + " ";

    // Apply fade-out animation before clearing suggestions
    document.querySelectorAll(".suggestion").forEach((s, i) => {
        s.style.opacity = "0";
        s.style.transform = "translateY(-10px)";
        setTimeout(() => { s.remove(); }, 200);
    });
}

// Function to highlight matched part in suggestions
function highlightMatch(suggestion, query) {
    const regex = new RegExp(`(${query})`, "gi");
    return suggestion.replace(regex, '<span style="color: yellow; font-weight: bold;">$1</span>');
}
