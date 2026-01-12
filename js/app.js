// ===== LA VIE ENR HAIR AI - Main Application =====

// Default data structure
const DEFAULT_DATA = {
    genders: ['남자', '여자'],
    styles: {
        '남자': {
            categories: ['컷', '펌', '염색'],
            items: {
                '컷': [],
                '펌': [],
                '염색': []
            }
        },
        '여자': {
            categories: ['컷', '펌', '염색', '업스타일'],
            items: {
                '컷': [],
                '펌': [],
                '염색': [],
                '업스타일': []
            }
        }
    }
};

// State
let appData = null;
let selectedGender = null;
let selectedCategory = null;
let selectedStyle = null;
let myPhotoData = null;

// ===== DOM Elements =====
const elements = {
    // My Photo
    myPhotoArea: document.getElementById('myPhotoArea'),
    myPhotoInput: document.getElementById('myPhotoInput'),
    myPhotoPlaceholder: document.getElementById('myPhotoPlaceholder'),
    myPhotoPreview: document.getElementById('myPhotoPreview'),
    removeMyPhoto: document.getElementById('removeMyPhoto'),
    
    // Selected Style
    selectedStyleArea: document.getElementById('selectedStyleArea'),
    selectedStylePlaceholder: document.getElementById('selectedStylePlaceholder'),
    selectedStylePreview: document.getElementById('selectedStylePreview'),
    selectedStyleName: document.getElementById('selectedStyleName'),
    
    // Transform
    transformBtn: document.getElementById('transformBtn'),
    
    // Stylebook
    genderTabs: document.getElementById('genderTabs'),
    categoryTabs: document.getElementById('categoryTabs'),
    styleGrid: document.getElementById('styleGrid'),
    emptyState: document.getElementById('emptyState'),
    
    // Result
    resultSection: document.getElementById('resultSection'),
    comparisonSlider: document.getElementById('comparisonSlider'),
    beforeImage: document.getElementById('beforeImage'),
    afterImage: document.getElementById('afterImage'),
    sliderHandle: document.getElementById('sliderHandle'),
    downloadBtn: document.getElementById('downloadBtn'),
    shareBtn: document.getElementById('shareBtn'),
    retryBtn: document.getElementById('retryBtn'),
    
    // Loading
    loadingOverlay: document.getElementById('loadingOverlay'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    
    // Settings Modal
    settingsBtn: document.getElementById('settingsBtn'),
    settingsModal: document.getElementById('settingsModal'),
    closeSettings: document.getElementById('closeSettings'),
    genderList: document.getElementById('genderList'),
    newGenderInput: document.getElementById('newGenderInput'),
    addGenderBtn: document.getElementById('addGenderBtn'),
    categoryGenderSelect: document.getElementById('categoryGenderSelect'),
    categoryList: document.getElementById('categoryList'),
    newCategoryInput: document.getElementById('newCategoryInput'),
    addCategoryBtn: document.getElementById('addCategoryBtn'),
    styleGenderSelect: document.getElementById('styleGenderSelect'),
    styleCategorySelect: document.getElementById('styleCategorySelect'),
    styleUploadArea: document.getElementById('styleUploadArea'),
    styleUploadInput: document.getElementById('styleUploadInput'),
    stylePreviewGrid: document.getElementById('stylePreviewGrid'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    
    // Toast
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage')
};

// ===== Initialize =====
function init() {
    loadData();
    setupEventListeners();
    renderGenderTabs();
    lucide.createIcons();
}

// ===== Data Management =====
function loadData() {
    const saved = localStorage.getItem('laVieEnrHairAI');
    if (saved) {
        try {
            appData = JSON.parse(saved);
        } catch (e) {
            appData = JSON.parse(JSON.stringify(DEFAULT_DATA));
        }
    } else {
        appData = JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
    
    // Set default selections
    if (appData.genders.length > 0) {
        selectedGender = appData.genders[0];
        const genderData = appData.styles[selectedGender];
        if (genderData && genderData.categories.length > 0) {
            selectedCategory = genderData.categories[0];
        }
    }
}

function saveData() {
    localStorage.setItem('laVieEnrHairAI', JSON.stringify(appData));
}

// ===== Event Listeners =====
function setupEventListeners() {
    // My Photo Upload
    elements.myPhotoArea.addEventListener('click', () => {
        if (!myPhotoData) {
            elements.myPhotoInput.click();
        }
    });
    
    elements.myPhotoInput.addEventListener('change', handleMyPhotoUpload);
    elements.removeMyPhoto.addEventListener('click', (e) => {
        e.stopPropagation();
        removeMyPhoto();
    });
    
    // Transform Button
    elements.transformBtn.addEventListener('click', handleTransform);
    
    // Result Actions
    elements.downloadBtn.addEventListener('click', handleDownload);
    elements.shareBtn.addEventListener('click', handleShare);
    elements.retryBtn.addEventListener('click', handleRetry);
    
    // Comparison Slider
    setupComparisonSlider();
    
    // Settings Modal
    elements.settingsBtn.addEventListener('click', openSettings);
    elements.closeSettings.addEventListener('click', closeSettings);
    elements.settingsModal.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) closeSettings();
    });
    
    // Settings - Gender
    elements.addGenderBtn.addEventListener('click', addGender);
    elements.newGenderInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addGender();
    });
    
    // Settings - Category
    elements.categoryGenderSelect.addEventListener('change', renderCategoryList);
    elements.addCategoryBtn.addEventListener('click', addCategory);
    elements.newCategoryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addCategory();
    });
    
    // Settings - Style Upload
    elements.styleGenderSelect.addEventListener('change', () => {
        updateStyleCategorySelect();
        renderStylePreviewGrid();
    });
    elements.styleCategorySelect.addEventListener('change', renderStylePreviewGrid);
    elements.styleUploadArea.addEventListener('click', () => {
        elements.styleUploadInput.click();
    });
    elements.styleUploadInput.addEventListener('change', handleStyleUpload);
    
    // Save Settings
    elements.saveSettingsBtn.addEventListener('click', saveSettings);
}

// ===== My Photo Handling =====
function handleMyPhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
        showToast('파일 크기는 10MB 이하여야 합니다', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
        myPhotoData = event.target.result;
        elements.myPhotoPreview.src = myPhotoData;
        elements.myPhotoPlaceholder.classList.add('hidden');
        elements.myPhotoPreview.classList.remove('hidden');
        elements.removeMyPhoto.classList.remove('hidden');
        updateTransformButton();
    };
    reader.readAsDataURL(file);
}

function removeMyPhoto() {
    myPhotoData = null;
    elements.myPhotoInput.value = '';
    elements.myPhotoPreview.src = '';
    elements.myPhotoPlaceholder.classList.remove('hidden');
    elements.myPhotoPreview.classList.add('hidden');
    elements.removeMyPhoto.classList.add('hidden');
    updateTransformButton();
}

// ===== Stylebook Rendering =====
function renderGenderTabs() {
    elements.genderTabs.innerHTML = appData.genders.map(gender => `
        <button class="gender-tab ${gender === selectedGender ? 'active' : ''}" 
                data-gender="${gender}">
            ${gender}
        </button>
    `).join('');
    
    // Add click listeners
    elements.genderTabs.querySelectorAll('.gender-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            selectedGender = tab.dataset.gender;
            const genderData = appData.styles[selectedGender];
            selectedCategory = genderData?.categories[0] || null;
            selectedStyle = null;
            updateSelectedStyleDisplay();
            renderGenderTabs();
            renderCategoryTabs();
            renderStyleGrid();
        });
    });
    
    renderCategoryTabs();
}

function renderCategoryTabs() {
    if (!selectedGender || !appData.styles[selectedGender]) {
        elements.categoryTabs.innerHTML = '';
        return;
    }
    
    const categories = appData.styles[selectedGender].categories;
    
    elements.categoryTabs.innerHTML = categories.map(category => `
        <button class="category-tab ${category === selectedCategory ? 'active' : ''}"
                data-category="${category}">
            ${category}
        </button>
    `).join('');
    
    // Add click listeners
    elements.categoryTabs.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            selectedCategory = tab.dataset.category;
            renderCategoryTabs();
            renderStyleGrid();
        });
    });
    
    renderStyleGrid();
}

function renderStyleGrid() {
    if (!selectedGender || !selectedCategory) {
        elements.styleGrid.innerHTML = '';
        elements.emptyState.classList.remove('hidden');
        return;
    }
    
    const items = appData.styles[selectedGender]?.items[selectedCategory] || [];
    
    if (items.length === 0) {
        elements.styleGrid.innerHTML = '';
        elements.emptyState.classList.remove('hidden');
        return;
    }
    
    elements.emptyState.classList.add('hidden');
    
    elements.styleGrid.innerHTML = items.map(item => `
        <div class="style-card ${selectedStyle?.id === item.id ? 'selected' : ''}"
             data-id="${item.id}">
            <div class="style-card-image">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="style-card-info">
                <span>${item.name}</span>
            </div>
        </div>
    `).join('');
    
    // Add click listeners
    elements.styleGrid.querySelectorAll('.style-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.id;
            const item = items.find(i => i.id === id);
            if (item) {
                selectStyle(item);
                renderStyleGrid();
            }
        });
    });
    
    lucide.createIcons();
}

function selectStyle(item) {
    selectedStyle = item;
    updateSelectedStyleDisplay();
    updateTransformButton();
}

function updateSelectedStyleDisplay() {
    if (selectedStyle) {
        elements.selectedStylePreview.src = selectedStyle.image;
        elements.selectedStyleName.textContent = selectedStyle.name;
        elements.selectedStylePlaceholder.classList.add('hidden');
        elements.selectedStylePreview.classList.remove('hidden');
        elements.selectedStyleName.classList.remove('hidden');
    } else {
        elements.selectedStylePlaceholder.classList.remove('hidden');
        elements.selectedStylePreview.classList.add('hidden');
        elements.selectedStyleName.classList.add('hidden');
    }
}

function updateTransformButton() {
    const canTransform = myPhotoData && selectedStyle;
    elements.transformBtn.disabled = !canTransform;
}

// ===== Transform Handling =====
async function handleTransform() {
    if (!myPhotoData || !selectedStyle) return;
    
    showLoading();
    
    try {
        const response = await fetch('/.netlify/functions/transform', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userPhoto: myPhotoData,
                stylePhoto: selectedStyle.image,
                styleName: selectedStyle.name
            })
        });
        
        if (!response.ok) {
            throw new Error('Transform failed');
        }
        
        const result = await response.json();
        
        if (result.success && result.image) {
            showResult(result.image);
        } else {
            throw new Error(result.error || 'Transform failed');
        }
    } catch (error) {
        console.error('Transform error:', error);
        showToast('변환 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
    } finally {
        hideLoading();
    }
}

function showLoading() {
    elements.loadingOverlay.classList.remove('hidden');
    simulateProgress();
}

function hideLoading() {
    elements.loadingOverlay.classList.add('hidden');
    elements.progressFill.style.width = '0%';
    elements.progressText.textContent = '0%';
}

function simulateProgress() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 90) {
            progress = 90;
            clearInterval(interval);
        }
        elements.progressFill.style.width = `${progress}%`;
        elements.progressText.textContent = `${Math.round(progress)}%`;
    }, 500);
}

function showResult(resultImage) {
    elements.beforeImage.src = myPhotoData;
    elements.afterImage.src = resultImage;
    elements.resultSection.classList.remove('hidden');
    elements.resultSection.scrollIntoView({ behavior: 'smooth' });
    
    // Complete progress
    elements.progressFill.style.width = '100%';
    elements.progressText.textContent = '100%';
    
    lucide.createIcons();
}

// ===== Comparison Slider =====
function setupComparisonSlider() {
    let isDragging = false;
    
    const updateSlider = (x) => {
        const rect = elements.comparisonSlider.getBoundingClientRect();
        let percentage = ((x - rect.left) / rect.width) * 100;
        percentage = Math.max(0, Math.min(100, percentage));
        
        elements.sliderHandle.style.left = `${percentage}%`;
        elements.comparisonSlider.querySelector('.after').style.clipPath = 
            `inset(0 0 0 ${percentage}%)`;
    };
    
    elements.comparisonSlider.addEventListener('mousedown', (e) => {
        isDragging = true;
        updateSlider(e.clientX);
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            updateSlider(e.clientX);
        }
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    // Touch support
    elements.comparisonSlider.addEventListener('touchstart', (e) => {
        isDragging = true;
        updateSlider(e.touches[0].clientX);
    });
    
    document.addEventListener('touchmove', (e) => {
        if (isDragging) {
            updateSlider(e.touches[0].clientX);
        }
    });
    
    document.addEventListener('touchend', () => {
        isDragging = false;
    });
}

// ===== Result Actions =====
function handleDownload() {
    const afterSrc = elements.afterImage.src;
    if (!afterSrc) return;
    
    const link = document.createElement('a');
    link.href = afterSrc;
    link.download = `la-vie-enr-hair-ai-${Date.now()}.png`;
    link.click();
    
    showToast('이미지가 다운로드되었습니다');
}

async function handleShare() {
    const afterSrc = elements.afterImage.src;
    if (!afterSrc) return;
    
    if (navigator.share) {
        try {
            const blob = await fetch(afterSrc).then(r => r.blob());
            const file = new File([blob], 'hairstyle.png', { type: 'image/png' });
            
            await navigator.share({
                files: [file],
                title: 'LA VIE ENR HAIR AI',
                text: 'AI가 만든 나만의 헤어스타일을 확인해보세요!'
            });
        } catch (e) {
            // Fallback: copy to clipboard
            try {
                await navigator.clipboard.writeText(window.location.href);
                showToast('링크가 복사되었습니다');
            } catch (e) {
                showToast('공유하기가 지원되지 않습니다', 'error');
            }
        }
    } else {
        try {
            await navigator.clipboard.writeText(window.location.href);
            showToast('링크가 복사되었습니다');
        } catch (e) {
            showToast('공유하기가 지원되지 않습니다', 'error');
        }
    }
}

function handleRetry() {
    elements.resultSection.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== Settings Modal =====
function openSettings() {
    elements.settingsModal.classList.remove('hidden');
    renderSettingsContent();
    lucide.createIcons();
}

function closeSettings() {
    elements.settingsModal.classList.add('hidden');
}

function renderSettingsContent() {
    renderGenderList();
    updateCategoryGenderSelect();
    updateStyleGenderSelect();
}

// Gender Management
function renderGenderList() {
    elements.genderList.innerHTML = appData.genders.map(gender => `
        <div class="tag">
            <span>${gender}</span>
            <button class="tag-delete" data-gender="${gender}">
                <i data-lucide="x"></i>
            </button>
        </div>
    `).join('');
    
    elements.genderList.querySelectorAll('.tag-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            deleteGender(btn.dataset.gender);
        });
    });
    
    lucide.createIcons();
}

function addGender() {
    const name = elements.newGenderInput.value.trim();
    if (!name) return;
    
    if (appData.genders.includes(name)) {
        showToast('이미 존재하는 성별입니다', 'error');
        return;
    }
    
    appData.genders.push(name);
    appData.styles[name] = {
        categories: [],
        items: {}
    };
    
    elements.newGenderInput.value = '';
    renderGenderList();
    updateCategoryGenderSelect();
    updateStyleGenderSelect();
}

function deleteGender(name) {
    if (appData.genders.length <= 1) {
        showToast('최소 1개의 성별이 필요합니다', 'error');
        return;
    }
    
    appData.genders = appData.genders.filter(g => g !== name);
    delete appData.styles[name];
    
    renderGenderList();
    updateCategoryGenderSelect();
    updateStyleGenderSelect();
}

// Category Management
function updateCategoryGenderSelect() {
    elements.categoryGenderSelect.innerHTML = appData.genders.map(g => 
        `<option value="${g}">${g}</option>`
    ).join('');
    
    renderCategoryList();
}

function renderCategoryList() {
    const gender = elements.categoryGenderSelect.value;
    if (!gender || !appData.styles[gender]) return;
    
    const categories = appData.styles[gender].categories;
    
    elements.categoryList.innerHTML = categories.map(cat => `
        <div class="tag">
            <span>${cat}</span>
            <button class="tag-delete" data-category="${cat}">
                <i data-lucide="x"></i>
            </button>
        </div>
    `).join('');
    
    elements.categoryList.querySelectorAll('.tag-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            deleteCategory(gender, btn.dataset.category);
        });
    });
    
    lucide.createIcons();
}

function addCategory() {
    const gender = elements.categoryGenderSelect.value;
    const name = elements.newCategoryInput.value.trim();
    
    if (!gender || !name) return;
    
    if (appData.styles[gender].categories.includes(name)) {
        showToast('이미 존재하는 카테고리입니다', 'error');
        return;
    }
    
    appData.styles[gender].categories.push(name);
    appData.styles[gender].items[name] = [];
    
    elements.newCategoryInput.value = '';
    renderCategoryList();
    updateStyleCategorySelect();
}

function deleteCategory(gender, category) {
    appData.styles[gender].categories = 
        appData.styles[gender].categories.filter(c => c !== category);
    delete appData.styles[gender].items[category];
    
    renderCategoryList();
    updateStyleCategorySelect();
}

// Style Management
function updateStyleGenderSelect() {
    elements.styleGenderSelect.innerHTML = appData.genders.map(g => 
        `<option value="${g}">${g}</option>`
    ).join('');
    
    updateStyleCategorySelect();
}

function updateStyleCategorySelect() {
    const gender = elements.styleGenderSelect.value;
    if (!gender || !appData.styles[gender]) {
        elements.styleCategorySelect.innerHTML = '';
        return;
    }
    
    elements.styleCategorySelect.innerHTML = 
        appData.styles[gender].categories.map(c => 
            `<option value="${c}">${c}</option>`
        ).join('');
    
    renderStylePreviewGrid();
}

function renderStylePreviewGrid() {
    const gender = elements.styleGenderSelect.value;
    const category = elements.styleCategorySelect.value;
    
    if (!gender || !category || !appData.styles[gender]?.items[category]) {
        elements.stylePreviewGrid.innerHTML = '';
        return;
    }
    
    const items = appData.styles[gender].items[category];
    
    elements.stylePreviewGrid.innerHTML = items.map(item => `
        <div class="style-preview-item">
            <img src="${item.image}" alt="${item.name}">
            <button class="delete-btn" data-id="${item.id}">
                <i data-lucide="x"></i>
            </button>
            <span class="item-name">${item.name}</span>
        </div>
    `).join('');
    
    elements.stylePreviewGrid.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            deleteStyleItem(gender, category, btn.dataset.id);
        });
    });
    
    lucide.createIcons();
}

function handleStyleUpload(e) {
    const files = e.target.files;
    if (!files.length) return;
    
    const gender = elements.styleGenderSelect.value;
    const category = elements.styleCategorySelect.value;
    
    if (!gender || !category) {
        showToast('성별과 카테고리를 선택해주세요', 'error');
        return;
    }
    
    let processedCount = 0;
    
    Array.from(files).forEach((file, index) => {
        if (file.size > 10 * 1024 * 1024) {
            showToast(`${file.name}: 파일 크기 초과`, 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const items = appData.styles[gender].items[category];
            const nextNum = items.length + 1;
            const id = `${gender}-${category}-${Date.now()}-${index}`;
            const name = `${gender} ${category} ${nextNum}`;
            
            items.push({
                id,
                name,
                image: event.target.result
            });
            
            processedCount++;
            if (processedCount === files.length) {
                renderStylePreviewGrid();
                showToast(`${files.length}개의 스타일이 추가되었습니다`);
            }
        };
        reader.readAsDataURL(file);
    });
    
    elements.styleUploadInput.value = '';
}

function deleteStyleItem(gender, category, id) {
    appData.styles[gender].items[category] = 
        appData.styles[gender].items[category].filter(item => item.id !== id);
    
    renderStylePreviewGrid();
}

function saveSettings() {
    saveData();
    
    // Update selections if needed
    if (!appData.genders.includes(selectedGender)) {
        selectedGender = appData.genders[0] || null;
    }
    
    if (selectedGender && appData.styles[selectedGender]) {
        if (!appData.styles[selectedGender].categories.includes(selectedCategory)) {
            selectedCategory = appData.styles[selectedGender].categories[0] || null;
        }
    }
    
    // Check if selected style still exists
    if (selectedStyle) {
        let styleExists = false;
        for (const gender of appData.genders) {
            for (const category of appData.styles[gender].categories) {
                if (appData.styles[gender].items[category].find(i => i.id === selectedStyle.id)) {
                    styleExists = true;
                    break;
                }
            }
            if (styleExists) break;
        }
        if (!styleExists) {
            selectedStyle = null;
            updateSelectedStyleDisplay();
            updateTransformButton();
        }
    }
    
    renderGenderTabs();
    closeSettings();
    showToast('저장되었습니다');
}

// ===== Toast =====
function showToast(message, type = 'success') {
    elements.toastMessage.textContent = message;
    
    const icon = elements.toast.querySelector('svg');
    if (type === 'error') {
        icon.setAttribute('data-lucide', 'alert-circle');
        icon.style.color = 'var(--error)';
    } else {
        icon.setAttribute('data-lucide', 'check-circle');
        icon.style.color = 'var(--success)';
    }
    
    lucide.createIcons();
    
    elements.toast.classList.add('show');
    elements.toast.classList.remove('hidden');
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
        setTimeout(() => {
            elements.toast.classList.add('hidden');
        }, 300);
    }, 3000);
}

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', init);
