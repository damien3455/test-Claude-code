const uploadZone = document.getElementById('uploadZone');
const cameraInput = document.getElementById('cameraInput');
const fileInput = document.getElementById('fileInput');
const previewContainer = document.getElementById('previewContainer');
const imagePreview = document.getElementById('imagePreview');
const analyzeBtn = document.getElementById('analyzeBtn');
const changeBtn = document.getElementById('changeBtn');
const loader = document.getElementById('loader');
const results = document.getElementById('results');
const errorBox = document.getElementById('errorBox');
const retryBtn = document.getElementById('retryBtn');
const newAnalysisBtn = document.getElementById('newAnalysisBtn');

let currentFile = null;

function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  currentFile = file;
  const url = URL.createObjectURL(file);
  imagePreview.src = url;
  uploadZone.hidden = true;
  previewContainer.hidden = false;
  hideAll();
}

cameraInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

// Drag & drop
uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('dragover');
});

uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));

uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  handleFile(e.dataTransfer.files[0]);
});

changeBtn.addEventListener('click', reset);
newAnalysisBtn.addEventListener('click', reset);
retryBtn.addEventListener('click', () => {
  errorBox.hidden = true;
  if (currentFile) analyze();
});

function reset() {
  currentFile = null;
  cameraInput.value = '';
  fileInput.value = '';
  imagePreview.src = '';
  uploadZone.hidden = false;
  previewContainer.hidden = true;
  hideAll();
}

function hideAll() {
  loader.hidden = true;
  results.hidden = true;
  errorBox.hidden = true;
}

analyzeBtn.addEventListener('click', analyze);

async function analyze() {
  if (!currentFile) return;

  previewContainer.hidden = true;
  loader.hidden = false;
  results.hidden = true;
  errorBox.hidden = true;

  const formData = new FormData();
  formData.append('image', currentFile);

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur serveur');
    }

    displayResults(data);
  } catch (err) {
    loader.hidden = true;
    errorBox.hidden = false;
    document.getElementById('errorText').textContent = err.message || "Une erreur s'est produite. Veuillez réessayer.";
  }
}

function displayResults(data) {
  loader.hidden = true;

  // Totaux
  document.getElementById('totalCalories').textContent = data.total_calories ?? 0;
  document.getElementById('totalProtein').textContent = data.total_proteines ?? 0;

  // Liste des aliments
  const foodItemsEl = document.getElementById('foodItems');
  foodItemsEl.innerHTML = '';

  if (data.aliments && data.aliments.length > 0) {
    data.aliments.forEach((item) => {
      const el = document.createElement('div');
      el.className = 'food-item';
      el.innerHTML = `
        <div>
          <div class="food-name">${escapeHtml(item.nom)}</div>
          <div class="food-quantity">${escapeHtml(item.quantite)}</div>
        </div>
        <div class="food-macros">
          <span class="macro-calories">${item.calories} kcal</span>
          <span class="macro-protein">${item.proteines}g protéines</span>
        </div>
      `;
      foodItemsEl.appendChild(el);
    });
  }

  // Remarques
  const remarksContainer = document.getElementById('remarksContainer');
  const remarksText = document.getElementById('remarksText');
  if (data.remarques) {
    remarksText.textContent = data.remarques;
    remarksContainer.hidden = false;
  } else {
    remarksContainer.hidden = true;
  }

  results.hidden = false;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
