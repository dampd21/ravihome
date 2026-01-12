// ===== 스타일 데이터 (localStorage 또는 직접 관리) =====
const DEFAULT_STYLES = {
    cut: [
        { id: 'cut-1', name: '숏 보브컷', image: 'images/styles/cut/short-bob.jpg', prompt: 'short bob haircut, sleek modern style' },
        { id: 'cut-2', name: '레이어드컷', image: 'images/styles/cut/layered.jpg', prompt: 'layered haircut, textured flowing layers' },
        { id: 'cut-3', name: '픽시컷', image: 'images/styles/cut/pixie.jpg', prompt: 'pixie cut, short edgy modern' },
        { id: 'cut-4', name: '롱 레이어', image: 'images/styles/cut/long-layer.jpg', prompt: 'long layered hair, elegant flowing' }
    ],
    perm: [
        { id: 'perm-1', name: '내추럴 웨이브', image: 'images/styles/perm/wave.jpg', prompt: 'natural wave perm, soft beach waves' },
        { id: 'perm-2', name: '볼륨 바디펌', image: 'images/styles/perm/body.jpg', prompt: 'body wave perm, volume and bounce' },
        { id: 'perm-3', name: '히피펌', image: 'images/styles/perm/hippie.jpg', prompt: 'hippie perm, tight curls retro style' },
        { id: 'perm-4', name: '컬리펌', image: 'images/styles/perm/curly.jpg', prompt: 'curly hair perm, defined glamorous curls' }
    ],
    color: [
        { id: 'color-1', name: '플래티넘 블론드', image: 'images/styles/color/blonde.jpg', prompt: 'platinum blonde hair color' },
        { id: 'color-2', name: '애쉬 브라운', image: 'images/styles/color/brown.jpg', prompt: 'ash brown hair color, cool toned' },
        { id: 'color-3', name: '버건디 레드', image: 'images/styles/color/burgundy.jpg', prompt: 'burgundy red hair color, deep wine' },
        { id: 'color-4', name: '발레야주', image: 'images/styles/color/balayage.jpg', prompt: 'balayage highlights, natural gradient' }
    ]
};

// ===== State =====
const state = {
    myPhoto: null,
    selectedStyle: null,
    customStyleImage: null,
    resultImage: null,
    isProcessing: false,
    styles: loadStyles()
};

// ===== DOM Elements =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    loadStyles();
    renderStyles();
    setupEventListeners();
    setupDragAndDrop();
}

// ===== Local Storage =====
function loadStyles() {
    const saved = localStorage.getItem('hairStyles');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Failed to parse saved styles:', e);
        }
    }
    return { ...DEFAULT_STYLES };
}

function saveStyles() {
    localStorage.setItem('hairStyles', JSON.stringify(state.styles));
}

// ===== Render Styles =====
function renderStyles() {
    ['cut', 'perm', 'color'].forEach(category => {
        const grid = $(`#${category}-grid`);
        if (!grid) return;
        
        grid.innerHTML = state.styles[category].map(style => `
            <div class="style-card" data-id="${style.id}" data-category="${category}">
                <div class="style-card-image">
                    <img src="${style.image}" alt="${style.name}" onerror="this.src='https://via.placeholder.com/300x400/1a1a1a/d4af37?text=${encodeURIComponent(style.name)}'">
                    <div class="style-card-overlay">
                        <button class="select-style-btn">선택</button>
                    </div>
                </div>
                <div class="style-card-info">
                    <h4>${style.name}</h4>
                    <span class="style-tag">${getCategoryLabel(category)}</span>
                </div>
            </div>
        `).join('');
        
        // Re-attach event listeners
        grid.querySelectorAll('.style-card').forEach(card => {
            card.addEventListener('click', () => selectStyle(card));
        });
    });
}

function getCategoryLabel(category) {
    const labels = { cut: '컷', perm: '펌', color: '염색' };
    return labels[category] || category;
}

// ===== Event Listeners =====
function setupEventListeners() {
    // My photo upload
    $('#my-photo-upload').addEventListener('click', () => $('#my-photo-input').click());
    $('#my-photo-input').addEventListener('change', handleMyPhotoUpload);
    $('#remove-my-photo').addEventListener('click', (e) => {
        e.stopPropagation();
        removeMyPhoto();
    });
    
    // Custom style upload
    $('#style-upload-box').addEventListener('click', () => $('#style-photo-input').click());
    $('#style-photo-input').addEventListener('change', handleStylePhotoUpload);
    $('#remove-style-photo')?.addEventListener('click', (e) => {
        e.stopPropagation();
        removeStylePhoto();
    });
    
    // Category tabs
    $$('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => handleCategoryTab(btn));
    });
    
    // Clear style selection
    $('#clear-style')?.addEventListener('click', clearStyleSelection);
    
    // Transform button
    $('#transform-btn').addEventListener('click', handleTransform);
    
    // Result actions
    $('#download-btn')?.addEventListener('click', downloadResult);
    $('#compare-btn')?.addEventListener('click', openCompareModal);
    
    // Modals
    $('#modal-close')?.addEventListener('click', closeCompareModal);
    $('#compare-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'compare-modal') closeCompareModal();
    });
    
    // Admin
    $('#admin-btn')?.addEventListener('click', openAdminModal);
    $('#admin-modal-close')?.addEventListener('click', closeAdminModal);
    $('#admin-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'admin-modal') closeAdminModal();
    });
    
    // Admin tabs
    $$('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => handleAdminTab(tab));
    });
    
    // Admin upload
    $('#admin-upload-btn')?.addEventListener('click', () => $('#admin-style-input').click());
    $('#admin-style-input')?.addEventListener('change', handleAdminStyleUpload);
    $('#admin-save-btn')?.addEventListener('click', saveAdminStyles);
    
    // Comparison slider
    setupComparisonSlider();
}

// ===== Drag and Drop =====
function setupDragAndDrop() {
    const setupDropZone = (element, handler) => {
        if (!element) return;
        
        element.addEventListener('dragover', (e) => {
            e.preventDefault();
            element.style.borderColor = 'var(--gold-400)';
            element.style.background = 'rgba(212, 175, 55, 0.05)';
        });
        
        element.addEventListener('dragleave', () => {
            element.style.borderColor = '';
            element.style.background = '';
        });
        
        element.addEventListener('drop', (e) => {
            e.preventDefault();
            element.style.borderColor = '';
            element.style.background = '';
            
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                handler(file);
            }
        });
    };
    
    setupDropZone($('#my-photo-upload'), processMyPhoto);
    setupDropZone($('#style-upload-box'), processStylePhoto);
}

// ===== Photo Handlers =====
function handleMyPhotoUpload(e) {
    const file = e.target.files[0];
    if (file) processMyPhoto(file);
}

function processMyPhoto(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        state.myPhoto = e.target.result;
        $('#my-photo-img').src = state.myPhoto;
        $('#my-photo-placeholder').classList.add('hidden');
        $('#my-photo-preview').classList.remove('hidden');
        updateTransformButton();
    };
    reader.readAsDataURL(file);
}

function removeMyPhoto() {
    state.myPhoto = null;
    $('#my-photo-input').value = '';
    $('#my-photo-placeholder').classList.remove('hidden');
    $('#my-photo-preview').classList.add('hidden');
    updateTransformButton();
}

function handleStylePhotoUpload(e) {
    const file = e.target.files[0];
    if (file) processStylePhoto(file);
}

function processStylePhoto(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        state.customStyleImage = e.target.result;
        state.selectedStyle = {
            id: 'custom',
            name: '커스텀 스타일',
            image: state.customStyleImage,
            prompt: 'apply the hairstyle from reference image'
        };
        
        $('#style-photo-img').src = state.customStyleImage;
        $('#style-placeholder').classList.add('hidden');
        $('#style-preview').classList.remove('hidden');
        
        showSelectedStyle();
        updateTransformButton();
    };
    reader.readAsDataURL(file);
}

function removeStylePhoto() {
    state.customStyleImage = null;
    if (state.selectedStyle?.id === 'custom') {
        state.selectedStyle = null;
    }
    $('#style-photo-input').value = '';
    $('#style-placeholder').classList.remove('hidden');
    $('#style-preview').classList.add('hidden');
    hideSelectedStyle();
    updateTransformButton();
}

// ===== Category Tabs =====
function handleCategoryTab(btn) {
    const category = btn.dataset.category;
    
    $$('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    $$('.styles-grid').forEach(grid => grid.classList.remove('active'));
    $(`#${category}-grid`).classList.add('active');
}

// ===== Style Selection =====
function selectStyle(card) {
    const id = card.dataset.id;
    const category = card.dataset.category;
    const style = state.styles[category].find(s => s.id === id);
    
    if (!style) return;
    
    // Update UI
    $$('.style-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    
    // Update state
    state.selectedStyle = style;
    state.customStyleImage = null;
    
    showSelectedStyle();
    updateTransformButton();
}

function showSelectedStyle() {
    const display = $('#selected-style');
    if (!display || !state.selectedStyle) return;
    
    $('#selected-style-img').src = state.selectedStyle.image;
    $('#selected-style-name').textContent = state.selectedStyle.name;
    display.classList.remove('hidden');
}

function hideSelectedStyle() {
    $('#selected-style')?.classList.add('hidden');
}

function clearStyleSelection() {
    state.selectedStyle = null;
    $$('.style-card').forEach(c => c.classList.remove('selected'));
    hideSelectedStyle();
    updateTransformButton();
}

// ===== Transform Button =====
function updateTransformButton() {
    const btn = $('#transform-btn');
    const status = $('#transform-status');
    
    const hasPhoto = state.myPhoto !== null;
    const hasStyle = state.selectedStyle !== null;
    
    btn.disabled = !(hasPhoto && hasStyle);
    
    if (!hasPhoto && !hasStyle) {
        status.textContent = '사진과 스타일을 선택하세요';
    } else if (!hasPhoto) {
        status.textContent = '사진을 업로드하세요';
    } else if (!hasStyle) {
        status.textContent = '스타일을 선택하세요';
    } else {
        status.textContent = '변환 준비 완료!';
    }
}

// ===== Transform =====
async function handleTransform() {
    if (state.isProcessing || !state.myPhoto || !state.selectedStyle) return;
    
    state.isProcessing = true;
    showLoading(true, '이미지 분석 중...');
    
    try {
        const result = await callTransformAPI();
        
        if (result) {
            state.resultImage = result;
            showResult(result);
        }
    } catch (error) {
        console.error('Transform error:', error);
        alert('변환 중 오류가 발생했습니다: ' + error.message);
    } finally {
        state.isProcessing = false;
        showLoading(false);
    }
}

async function callTransformAPI() {
    updateLoadingStatus('AI 모델 로딩 중...', 20);
    
    try {
        // Netlify Function 호출
        const response = await fetch('/.netlify/functions/transform', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sourceImage: state.myPhoto,
                styleImage: state.selectedStyle.image,
                stylePrompt: state.selectedStyle.prompt,
                provider: 'huggingface' // 무료 옵션
            })
        });
        
        updateLoadingStatus('스타일 변환 중...', 50);
        
        if (!response.ok) {
            throw new Error('API 요청 실패');
        }
        
        const data = await response.json();
        
        if (data.success) {
            updateLoadingStatus('완료!', 100);
            return data.result;
        } else {
            throw new Error(data.error || '변환 실패');
        }
        
    } catch (error) {
        console.log('API 호출 실패, 데모 모드:', error);
        // 데모 모드: 원본 이미지 반환 (실제로는 API가 처리)
        updateLoadingStatus('데모 모드로 처리 중...', 80);
        await new Promise(r => setTimeout(r, 2000));
        updateLoadingStatus('완료!', 100);
        return state.myPhoto;
    }
}

// ===== Loading =====
function showLoading(show, message = '') {
    const overlay = $('#loading-overlay');
    overlay.classList.toggle('hidden', !show);
    
    if (show && message) {
        $('#loading-status').textContent = message;
        $('#loading-bar').style.width = '0%';
    }
}

function updateLoadingStatus(message, progress) {
    $('#loading-status').textContent = message;
    $('#loading-bar').style.width = `${progress}%`;
}

// ===== Result =====
function showResult(imageUrl) {
    $('#result-img').src = imageUrl;
    $('#result-placeholder').classList.add('hidden');
    $('#result-preview').classList.remove('hidden');
}

function downloadResult() {
    if (!state.resultImage) return;
    
    const link = document.createElement('a');
    link.download = 'luxe-hair-result.png';
    link.href = state.resultImage;
    link.click();
}

// ===== Compare Modal =====
function openCompareModal() {
    if (!state.myPhoto || !state.resultImage) return;
    
    $('#compare-before-img').src = state.myPhoto;
    $('#compare-after-img').src = state.resultImage;
    $('#compare-modal').classList.remove('hidden');
    
    // Reset slider position
    $('#slider-handle').style.left = '50%';
    $('.comparison-after').style.clipPath = 'inset(0 50% 0 0)';
}

function closeCompareModal() {
    $('#compare-modal').classList.add('hidden');
}

function setupComparisonSlider() {
    const slider = $('#comparison-slider');
    if (!slider) return;
    
    let isDragging = false;
    
    const updateSlider = (clientX) => {
        const rect = slider.getBoundingClientRect();
        let pos = ((clientX - rect.left) / rect.width) * 100;
        pos = Math.max(0, Math.min(100, pos));
        
        $('#slider-handle').style.left = `${pos}%`;
        $('.comparison-after').style.clipPath = `inset(0 ${100 - pos}% 0 0)`;
    };
    
    slider.addEventListener('mousedown', (e) => {
        isDragging = true;
        updateSlider(e.clientX);
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging) updateSlider(e.clientX);
    });
    
    document.addEventListener('mouseup', () => isDragging = false);
    
    // Touch
    slider.addEventListener('touchstart', (e) => {
        isDragging = true;
        updateSlider(e.touches[0].clientX);
    });
    
    document.addEventListener('touchmove', (e) => {
        if (isDragging) updateSlider(e.touches[0].clientX);
    });
    
    document.addEventListener('touchend', () => isDragging = false);
}

// ===== Admin Modal =====
let currentAdminCategory = 'cut';
let pendingStyles = {};

function openAdminModal() {
    pendingStyles = JSON.parse(JSON.stringify(state.styles));
    renderAdminStyles();
    $('#admin-modal').classList.remove('hidden');
}

function closeAdminModal() {
    $('#admin-modal').classList.add('hidden');
}

function handleAdminTab(tab) {
    currentAdminCategory = tab.dataset.tab;
    
    $$('.admin-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    renderAdminStyles();
}

function renderAdminStyles() {
    const list = $('#admin-styles-list');
    const styles = pendingStyles[currentAdminCategory] || [];
    
    list.innerHTML = styles.map((style, index) => `
        <div class="admin-style-item" data-index="${index}">
            <img src="${style.image}" alt="${style.name}" onerror="this.src='https://via.placeholder.com/150x200/1a1a1a/d4af37?text=Image'">
            <button class="admin-style-remove" onclick="removeAdminStyle(${index})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('') || '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">스타일이 없습니다</p>';
}

function handleAdminStyleUpload(e) {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const newStyle = {
                id: `${currentAdminCategory}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: file.name.replace(/\.[^/.]+$/, ''),
                image: ev.target.result,
                prompt: `${currentAdminCategory} hairstyle`
            };
            
            if (!pendingStyles[currentAdminCategory]) {
                pendingStyles[currentAdminCategory] = [];
            }
            pendingStyles[currentAdminCategory].push(newStyle);
            renderAdminStyles();
        };
        reader.readAsDataURL(file);
    });
    
    e.target.value = '';
}

window.removeAdminStyle = function(index) {
    pendingStyles[currentAdminCategory].splice(index, 1);
    renderAdminStyles();
};

function saveAdminStyles() {
    state.styles = pendingStyles;
    saveStyles();
    renderStyles();
    closeAdminModal();
    alert('스타일이 저장되었습니다!');
}

// ===== Smooth Scroll =====
$$('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = $(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});
