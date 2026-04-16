// --- Game Data ---
const categories = [
    { name: "Fruits", color: "#FF6F61", words: ["Apple", "Banana", "Orange", "Grape"] },
    { name: "Animals", color: "#6B5B95", words: ["Lion", "Tiger", "Elephant", "Zebra"] },
    { name: "Colors", color: "#88B04B", words: ["Red", "Blue", "Green", "Yellow"] },
    { name: "Countries", color: "#FFA500", words: ["USA", "Canada", "Brazil", "Japan"] }
];

let tiles = [];
let selectedTiles = [];
let attempts = 0;
const maxAttempts = 4;

// --- Initialize Game ---
function initGame() {
    attempts = 0;
    selectedTiles = [];
    document.getElementById("message").textContent = "";
    const grid = document.getElementById("grid");
    grid.innerHTML = "";

    // Flatten all words and shuffle
    tiles = categories.flatMap(cat => cat.words.map(word => ({ word, category: cat.name })));
    tiles = shuffleArray(tiles);

    // Create tile elements
    tiles.forEach((tile, index) => {
        const tileEl = document.createElement("div");
        tileEl.classList.add("tile");
        tileEl.textContent = tile.word;
        tileEl.dataset.index = index;
        tileEl.addEventListener("click", () => toggleSelect(tileEl));
        grid.appendChild(tileEl);
    });
}

// --- Shuffle Array Helper ---
function shuffleArray(array) {
    let arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// --- Select/Deselect Tiles ---
function toggleSelect(tileEl) {
    const index = parseInt(tileEl.dataset.index);
    if (tileEl.classList.contains("correct")) return; // cannot select correct tiles

    if (selectedTiles.includes(index)) {
        tileEl.classList.remove("selected");
        selectedTiles = selectedTiles.filter(i => i !== index);
    } else if (selectedTiles.length < 4) {
        tileEl.classList.add("selected");
        selectedTiles.push(index);
    }
}

// --- Check Group ---
function submitGroup() {
    if (selectedTiles.length !== 4) {
        alert("Select exactly 4 tiles before submitting!");
        return;
    }

    attempts++;
    const selectedCategories = selectedTiles.map(i => tiles[i].category);
    const firstCat = selectedCategories[0];
    const correctGroup = selectedCategories.every(cat => cat === firstCat);

    if (correctGroup) {
        const catColor = categories.find(c => c.name === firstCat).color;
        selectedTiles.forEach(i => {
            const tileEl = document.querySelector(`.tile[data-index='${i}']`);
            tileEl.classList.remove("selected");
            tileEl.classList.add("correct");
            tileEl.style.backgroundColor = catColor;
        });
        mergeGroup(firstCat, catColor);
        selectedTiles = [];
        checkWin();
    } else {
        // Incorrect group feedback
        selectedTiles.forEach(i => {
            const tileEl = document.querySelector(`.tile[data-index='${i}']`);
            tileEl.classList.add("incorrect");
            setTimeout(() => tileEl.classList.remove("incorrect", "selected"), 500);
        });
        selectedTiles = [];
        if (attempts >= maxAttempts) {
            document.getElementById("message").textContent = "Game Over! Maximum attempts reached.";
        }
    }
}

// --- Merge Group ---
function mergeGroup(categoryName, color) {
    const grid = document.getElementById("grid");
    const groupTiles = Array.from(grid.children).filter(tile => tile.classList.contains("correct") && tile.textContent !== categoryName);
    const categoryTiles = categories.find(c => c.name === categoryName).words;
    const tileIndices = groupTiles.map(t => t.dataset.index);

    // Only merge if all 4 tiles are correct
    if (tileIndices.length === 4) {
        // Remove individual tiles
        groupTiles.forEach(t => grid.removeChild(t));

        // Create merged tile
        const mergedTile = document.createElement("div");
        mergedTile.classList.add("tile", "correct");
        mergedTile.textContent = categoryName;
        mergedTile.style.backgroundColor = color;
        mergedTile.style.gridColumn = "span 4";
        grid.appendChild(mergedTile);
    }
}

// --- Check Win ---
function checkWin() {
    const allCorrect = document.querySelectorAll(".tile.correct").length === 16 - (categories.length * 4 - categories.length);
    if (allCorrect) {
        document.getElementById("message").textContent = "🎉 Congratulations! You grouped all tiles!";
    }
}

// --- Reset Game ---
document.getElementById("reset-btn").addEventListener("click", initGame);
document.getElementById("submit-btn").addEventListener("click", submitGroup);

// --- Start Game ---
initGame();