const searchBox = document.getElementById("searchBox");
const suggestionsBox = document.getElementById("suggestionsBox");
const cache = new Map();
let selectedIndex = -1;
let trigramModel = {};
let modelReady = false;

// Load trigram model
fetch('trigramMap.json')
    .then(res => res.json())
    .then(data => {
        trigramModel = data;
        modelReady = true;
        console.log("Trigram model loaded.");
    })
    .catch(err => console.error("Failed to load trigram model:", err));

// Fetch suggestions from API with caching
async function fetchSuggestions(query) {
    if (!query) return [];
    if (cache.has(query)) return cache.get(query);

    const apiUrl = `https://api.datamuse.com/words?sp=${query}*&max=5`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    const suggestions = data.map(item => item.word);
    cache.set(query, suggestions);
    return suggestions;
}

// Main input listener
searchBox.addEventListener("input", async () => {
    if (!modelReady) return; // Wait for trigram model

    const inputText = searchBox.value.trim();
    const wordsArray = inputText.split(" ");
    const lastWord = wordsArray[wordsArray.length - 1];
    const context = wordsArray.slice(-2).join(" ").toLowerCase();

    suggestionsBox.innerHTML = "";
    if (!lastWord) return;

    let suggestions = [];

    if (trigramModel[context]) {
        suggestions = Object.entries(trigramModel[context])
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0])
            .slice(0, 5);
    } else {
        suggestions = await fetchSuggestions(lastWord); // Fallback to API
    }

    selectedIndex = -1;

    suggestions.forEach((suggestion, index) => {
        const suggestionElement = document.createElement("div");
        suggestionElement.className = "suggestion";
        suggestionElement.innerHTML = highlightMatch(suggestion, lastWord);
        suggestionElement.onclick = () => selectSuggestion(suggestion, wordsArray);
        suggestionsBox.appendChild(suggestionElement);

        setTimeout(() => {
            suggestionElement.style.opacity = "1";
            suggestionElement.style.transform = "translateY(0)";
        }, 50 * index);
    });
});

// Keyboard navigation
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

    suggestions.forEach((s, i) => {
        s.style.backgroundColor = i === selectedIndex ? "#ff4757" : "#662d40";
    });
});

// Suggestion selection
function selectSuggestion(suggestion, wordsArray) {
    wordsArray[wordsArray.length - 1] = suggestion;
    searchBox.value = wordsArray.join(" ") + " ";

    document.querySelectorAll(".suggestion").forEach((s, i) => {
        s.style.opacity = "0";
        s.style.transform = "translateY(-10px)";
        setTimeout(() => { s.remove(); }, 200);
    });
}

// Highlight matching part
function highlightMatch(suggestion, query) {
    const regex = new RegExp(`(${query})`, "gi");
    return suggestion.replace(regex, '<span style="color: yellow; font-weight: bold;">$1</span>');
}
