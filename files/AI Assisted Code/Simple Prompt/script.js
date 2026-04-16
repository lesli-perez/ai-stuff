const tilesContainer = document.getElementById('tiles-container');
const resetBtn = document.getElementById('reset-btn');

const categories = {
    "Fruits": ["Apple", "Banana", "Orange", "Grape"],
    "Colors": ["Red", "Blue", "Green", "Yellow"],
    "Animals": ["Dog", "Cat", "Lion", "Tiger"],
    "Sports": ["Soccer", "Tennis", "Baseball", "Basketball"]
};

let tiles = [];
let selectedTiles = [];

function initGame() {
    tilesContainer.innerHTML = "";
    tiles = [];

    // Flatten the categories into a single array
    for (let cat in categories) {
        categories[cat].forEach(item => {
            tiles.push({name: item, category: cat});
        });
    }

    // Shuffle tiles
    tiles = shuffleArray(tiles);

    // Create tile elements
    tiles.forEach((tile, index) => {
        const div = document.createElement('div');
        div.classList.add('tile');
        div.textContent = tile.name;
        div.dataset.category = tile.category;
        div.addEventListener('click', () => selectTile(div));
        tilesContainer.appendChild(div);
    });
}

function selectTile(tileDiv) {
    if (tileDiv.classList.contains('matched') || tileDiv.classList.contains('selected')) return;

    tileDiv.classList.add('selected');
    selectedTiles.push(tileDiv);

    if (selectedTiles.length === 4) {
        checkMatch();
    }
}

function checkMatch() {
    const category = selectedTiles[0].dataset.category;
    const allMatch = selectedTiles.every(tile => tile.dataset.category === category);

    if (allMatch) {
        selectedTiles.forEach(tile => tile.classList.add('matched'));
    }

    setTimeout(() => {
        selectedTiles.forEach(tile => tile.classList.remove('selected'));
        selectedTiles = [];
    }, 500);
}

// Fisher-Yates Shuffle
function shuffleArray(array) {
    let arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

resetBtn.addEventListener('click', initGame);

initGame();