let vocabulary = [];
let currentIndex = 0;
let isFlipped = false;
let currentTab = 'all'; // 'all' hoặc 'favorite'
let favorites = JSON.parse(localStorage.getItem('hskFavorites')) || [];

const card = document.getElementById('flashcard');
const cardInner = document.getElementById('cardInner');
const hanziSimplifiedEl = document.getElementById('hanziSimplified');
const hanziTraditionalEl = document.getElementById('hanziTraditional');
const pinyinEl = document.getElementById('pinyin');
const meaningEl = document.getElementById('meaning');
const progressEl = document.getElementById('progress');
const speakBtn = document.getElementById('speakBtn');
const hskSelect = document.getElementById('hskLevel');
const favoriteBtn = document.getElementById('favoriteBtn');
const favCountEl = document.getElementById('fav-count');

let currentList = []; // Danh sách đang hiển thị (tất cả hoặc favorite)

// Load dữ liệu
async function loadVocabulary(level) {
    try {
        const response = await fetch(`${level}.json`);
        vocabulary = await response.json();
        currentIndex = 0;
        updateCurrentList();
        updateCard();
        updateFavCount();
    } catch (error) {
        console.error("Lỗi khi load file JSON:", error);
        alert("Không thể tải dữ liệu HSK!");
    }
}

// Cập nhật danh sách hiện tại (tất cả hoặc favorite)
function updateCurrentList() {
    if (currentTab === 'favorite') {
        currentList = vocabulary.filter(v => 
            favorites.some(f => f.gian_the === v.gian_the)
        );
    } else {
        currentList = [...vocabulary];
    }
    
    if (currentList.length === 0 && currentTab === 'favorite') {
        currentTab = 'all';
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('.tab-btn[data-tab="all"]').classList.add('active');
        currentList = [...vocabulary];
    }
    
    currentIndex = Math.min(currentIndex, Math.max(0, currentList.length - 1));
}

// Kiểm tra từ hiện tại có trong favorite không
function isFavorite(vocab) {
    return favorites.some(f => f.gian_the === vocab.gian_the);
}

// Cập nhật nút sao
function updateFavoriteButton() {
    if (currentList.length === 0) return;
    const currentVocab = currentList[currentIndex];
    const isFav = isFavorite(currentVocab);
    
    favoriteBtn.textContent = isFav ? '★ Đã đánh dấu' : '☆ Đánh dấu khó nhớ';
    favoriteBtn.classList.toggle('active', isFav);
}

// Cập nhật card
function updateCard() {
    if (currentList.length === 0) {
        hanziSimplifiedEl.textContent = "Không có từ nào";
        hanziTraditionalEl.textContent = "";
        pinyinEl.textContent = "";
        meaningEl.textContent = "";
        progressEl.textContent = "0 / 0";
        return;
    }

    const vocab = currentList[currentIndex];

    // Show simplified (gian_the) and traditional (phon_the) on the front
    hanziSimplifiedEl.textContent = vocab.gian_the || vocab.hanzi || "";
    hanziTraditionalEl.textContent = vocab.phon_the || "";

    // Back: pinyin + meaning
    pinyinEl.textContent = vocab.pinyin || "";
    meaningEl.textContent = vocab.tieng_viet || vocab.meaning || "";

    progressEl.textContent = `${currentIndex + 1} / ${currentList.length}`;

    if (isFlipped) {
        card.classList.remove('flipped');
        isFlipped = false;
    }

    updateFavoriteButton();
}

function flipCard() {
    isFlipped = !isFlipped;
    card.classList.toggle('flipped', isFlipped);
}

function nextCard() {
    if (currentList.length === 0) return;
    currentIndex = (currentIndex + 1) % currentList.length;
    updateCard();
}

function prevCard() {
    if (currentList.length === 0) return;
    currentIndex = (currentIndex - 1 + currentList.length) % currentList.length;
    updateCard();
}

function randomCard() {
    if (currentList.length <= 1) return;
    let newIndex = currentIndex;
    while (newIndex === currentIndex) {
        newIndex = Math.floor(Math.random() * currentList.length);
    }
    currentIndex = newIndex;
    updateCard();
}

function speak() {
    if (currentList.length === 0) return;
    const vocab = currentList[currentIndex];
    const utterance = new SpeechSynthesisUtterance(vocab.gian_the || vocab.hanzi || "");
    utterance.lang = 'zh-CN';
    utterance.rate = 0.95;
    speechSynthesis.speak(utterance);
}

// Thêm / Xóa favorite
function toggleFavorite() {
    if (currentList.length === 0) return;
    
    const currentVocab = currentList[currentIndex];
    
    const index = favorites.findIndex(f => f.gian_the === currentVocab.gian_the);
    
    if (index === -1) {
        // Thêm vào favorite
        favorites.push(currentVocab);
    } else {
        // Xóa khỏi favorite
        favorites.splice(index, 1);
    }
    
    localStorage.setItem('hskFavorites', JSON.stringify(favorites));
    updateFavoriteButton();
    updateFavCount();
    
    // Nếu đang ở tab Favorite và vừa xóa thì refresh list
    if (currentTab === 'favorite') {
        updateCurrentList();
        if (currentList.length === 0) {
            switchTab('all');
        } else {
            updateCard();
        }
    }
}

function updateFavCount() {
    favCountEl.textContent = favorites.length;
}

// Chuyển tab
function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    updateCurrentList();
    currentIndex = 0;
    updateCard();
}

// Event Listeners
card.addEventListener('click', flipCard);
document.getElementById('flipBtn').addEventListener('click', flipCard);
document.getElementById('nextBtn').addEventListener('click', nextCard);
document.getElementById('prevBtn').addEventListener('click', prevCard);
document.getElementById('randomBtn').addEventListener('click', randomCard);
favoriteBtn.addEventListener('click', toggleFavorite);
speakBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    speak();
});

hskSelect.addEventListener('change', (e) => {
    loadVocabulary(e.target.value);
});

// Tab buttons
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        switchTab(btn.dataset.tab);
    });
});

// Khởi tạo
loadVocabulary('hsk_tocfl');
loadVocabulary('hsk_tocfl2');
updateFavCount();