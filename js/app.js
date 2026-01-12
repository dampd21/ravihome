/**
 * LA VIE ENR HAIR AI - Main Application
 * 
 * app.js의 역할:
 * 1. 상태 관리 (state) - 선택된 사진, 스타일, 결과 등
 * 2. 이벤트 처리 - 클릭, 드래그, 업로드 등
 * 3. DOM 조작 - 화면 업데이트
 * 4. API 통신 - Gemini AI 호출
 * 5. 데이터 저장 - localStorage
 */

// ===== 초기 데이터 구조 =====
const DEFAULT_DATA = {
    male: {
        categories: ['컷', '펌', '염색'],
        styles: {
            '컷': [],
            '펌': [],
            '염색': []
        }
    },
    female: {
        categories: ['컷', '펌', '염색'],
        styles: {
            '컷': [],
            '펌': [],
            '염색': []
        }
    }
};

// ===== 애플리케이션 상태 =====
const state = {
    // 메인 데이터
    data: null,
    
    // 현재 선택 상태
    currentGender: 'male',
    currentCategory: null,
    
    // 사진 상태
    myPhoto: null,
    selectedStyle: null,
    resultImage: null,
    
    // 관리자 모드 상태
    adminGender: 'male',
    adminCategory: null,
    pendingData: null,
    
    // 처리 상태
    isProcessing: false
};

// ===== 유틸리티 함수 =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const delay = (ms) => new Promise(r => setTimeout(r, ms));

// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
    loadData();
    renderCategoryTabs();
    renderStyles();
    setupEventListeners();
    setupDragAndDrop();
    updateTransformButton();
    console.log('LA VIE ENR HAIR AI initialized');
}

// ===== 데이터 관리 =====
function loadData() {
    const saved = localStorage.getItem('laVieEnrHairData');
    if (saved) {
        try {
            state.data = JSON.parse(saved);
        } catch (e) {
            console.error('데이터 로드 실패:', e);
            state.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
        }
    } else {
        state.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
    
    // 첫 번째 카테고리 선택
    const categories = state.data[state.currentGender]?.categories || [];
    state.currentCategory = categories[0] || null;
}

function saveData() {
    localStorage.setItem('laVieEnrHairData', JSON.stringify(state.data));
}

// ===== 이벤트 리스너 설정 =====
function setupEventListeners() {
    // 내 사진 업로드
    $('#my-photo-upload')?.addEventListener('click', () => $('#my-photo-input')?.click());
    $('#my-photo-input')?.addEventListener('change', handleMyPhotoUpload);
    $('#remove-my-photo')?.addEventListener('click', handleRemoveMyPhoto);

    // 커스텀 스타일 업로드
    $('#custom-upload-btn')?.addEventListener('click', () => $('#custom-style-input')?.click());
    $('#custom-style-input')?.addEventListener('change', handleCustomStyleUpload);
    $('#remove-style')?.addEventListener('click', handleRemoveStyle);

    // 성별 탭
    $$('.gender-tab').forEach(tab => {
        tab.addEventListener('click', () => handleGenderChange(tab.dataset.gender));
    });

    // 변환 버튼
    $('#transform-btn')?.addEventListener('click', handleTransform);

    // 결과 액션
    $('#download-result-btn')?.addEventListener('click', handleDownload);
    $('#share-result-btn')?.addEventListener('click', handleShare);
    $('#retry-btn')?.addEventListener('click', handleRetry);

    // 비교 슬라이더
    setupComparisonSlider();

    // 관리자 모달
    $('#admin-btn')?.addEventListener('click', openAdminModal);
    $('#admin-modal-close')?.addEventListener('click', closeAdminModal);
    $('#admin-modal-overlay')?.addEventListener('click', closeAdminModal);

    // 관리자 성별 탭
    $$('.admin-gender-tab').forEach(tab => {
        tab.addEventListener('click', () => handleAdminGenderChange(tab.dataset.gender));
    });

    // 카테고리 추가
    $('#add-category-btn')?.addEventListener('click', openCategoryModal);
    $('#category-modal-close')?.addEventListener('click', closeCategoryModal);
    $('#category-modal-overlay')?.addEventListener('click', closeCategoryModal);
    $('#category-cancel-btn')?.addEventListener('click', closeCategoryModal);
    $('#category-confirm-btn')?.addEventListener('click', handleAddCategory);

    // 스타일 추가
    $('#add-style-btn')?.addEventListener('click', () => $('#admin-style-input')?.click());
    $('#admin-style-input')?.addEventListener('change', handleAdminStyleUpload);

    // 저장
    $('#admin-save-btn')?.addEventListener('click', handleAdminSave);

    // 부드러운 스크롤
    $$('a[href^="#"]').forEach(a => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            $(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
        });
    });
}

// ===== 드래그 앤 드롭 =====
function setupDragAndDrop() {
    const setupZone = (el, handler) => {
        if (!el) return;
        
        el.addEventListener('dragover', (e) => {
            e.preventDefault();
            el.style.borderColor = 'var(--gold-400)';
            el.style.background = 'rgba(212, 175, 55, 0.05)';
        });
        
        el.addEventListener('dragleave', () => {
            el.style.borderColor = '';
            el.style.background = '';
        });
        
        el.addEventListener('drop', (e) => {
            e.preventDefault();
            el.style.borderColor = '';
            el.style.background = '';
            const file = e.dataTransfer.files[0];
            if (file?.type.startsWith('image/')) handler(file);
        });
    };
    
    setupZone($('#my-photo-upload'), processMyPhoto);
}

// ===== 내 사진 관리 =====
function handleMyPhotoUpload(e) {
    const file = e.target.files[0];
    if (file) processMyPhoto(file);
}

function processMyPhoto(file) {
    if (file.size > 10 * 1024 * 1024) {
        alert('파일 크기는 10MB 이하여야 합니다.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        state.myPhoto = e.target.result;
        
        $('#my-photo-img').src = state.myPhoto;
        $('#my-photo-placeholder')?.classList.add('hidden');
        $('#my-photo-preview')?.classList.remove('hidden');
        
        updateTransformButton();
    };
    reader.readAsDataURL(file);
}

function handleRemoveMyPhoto(e) {
    e.stopPropagation();
    
    state.myPhoto = null;
    $('#my-photo-input').value = '';
    $('#my-photo-placeholder')?.classList.remove('hidden');
    $('#my-photo-preview')?.classList.add('hidden');
    
    updateTransformButton();
}

// ===== 스타일 선택 관리 =====
function handleCustomStyleUpload(e) {
    const file = e.target.files[0];
    if (file) processCustomStyle(file);
}

function processCustomStyle(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        state.selectedStyle = {
            id: 'custom',
            name: '커스텀 스타일',
            category: '직접 업로드',
            image: e.target.result,
            prompt: 'apply this exact hairstyle from the reference image'
        };
        
        displaySelectedStyle();
        updateTransformButton();
    };
    reader.readAsDataURL(file);
}

function selectStyle(styleData) {
    state.selectedStyle = styleData;
    
    // 카드 선택 표시
    $$('.style-card').forEach(card => card.classList.remove('selected'));
    const selectedCard = $(`.style-card[data-id="${styleData.id}"]`);
    selectedCard?.classList.add('selected');
    
    displaySelectedStyle();
    updateTransformButton();
}

function displaySelectedStyle() {
    if (!state.selectedStyle) return;
    
    $('#style-display-img').src = state.selectedStyle.image;
    $('#style-category-label').textContent = state.selectedStyle.category;
    $('#style-name-label').textContent = state.selectedStyle.name;
    
    $('#style-placeholder')?.classList.add('hidden');
    $('#style-preview')?.classList.remove('hidden');
}

function handleRemoveStyle(e) {
    e.stopPropagation();
    
    state.selectedStyle = null;
    $('#custom-style-input').value = '';
    
    $$('.style-card').forEach(card => card.classList.remove('selected'));
    
    $('#style-placeholder')?.classList.remove('hidden');
    $('#style-preview')?.classList.add('hidden');
    
    updateTransformButton();
}

// ===== 성별/카테고리 탭 =====
function handleGenderChange(gender) {
    state.currentGender = gender;
    
    $$('.gender-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.gender === gender);
    });
    
    // 첫 번째 카테고리 선택
    const categories = state.data[gender]?.categories || [];
    state.currentCategory = categories[0] || null;
    
    renderCategoryTabs();
    renderStyles();
}

function handleCategoryChange(category) {
    state.currentCategory = category;
    
    $$('.category-tab').forEach(tab => {
        tab.classList.toggle('active', tab.textContent === category);
    });
    
    renderStyles();
}

// ===== 렌더링 =====
function renderCategoryTabs() {
    const container = $('#category-tabs');
    if (!container) return;
    
    const categories = state.data[state.currentGender]?.categories || [];
    
    container.innerHTML = categories.map(cat => `
        <button class="category-tab ${cat === state.currentCategory ? 'active' : ''}" 
                data-category="${cat}">
            ${cat}
        </button>
    `).join('');
    
    // 이벤트 다시 바인딩
    container.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', () => handleCategoryChange(tab.dataset.category));
    });
}

function renderStyles() {
    const grid = $('#styles-grid');
    const emptyMessage = $('#empty-styles');
    if (!grid) return;
    
    const styles = state.data[state.currentGender]?.styles?.[state.currentCategory] || [];
    
    if (styles.length === 0) {
        grid.classList.add('hidden');
        emptyMessage?.classList.remove('hidden');
        return;
    }
    
    grid.classList.remove('hidden');
    emptyMessage?.classList.add('hidden');
    
    grid.innerHTML = styles.map(style => `
        <div class="style-card ${state.selectedStyle?.id === style.id ? 'selected' : ''}" 
             data-id="${style.id}">
            <div class="style-card-image">
                <img src="${style.image}" alt="${style.name}" 
                     onerror="this.src='https://placehold.co/180x240/1a1a1a/d4af37?text=${encodeURIComponent(style.name)}'">
            </div>
            <div class="style-card-info">
                <h4>${style.name}</h4>
            </div>
        </div>
    `).join('');
    
    // 클릭 이벤트
    grid.querySelectorAll('.style-card').forEach(card => {
        card.addEventListener('click', () => {
            const style = styles.find(s => s.id === card.dataset.id);
            if (style) selectStyle(style);
        });
    });
}

// ===== 변환 버튼 상태 =====
function updateTransformButton() {
    const btn = $('#transform-btn');
    const status = $('#transform-status');
    
    const hasPhoto = state.myPhoto !== null;
    const hasStyle = state.selectedStyle !== null;
    
    btn.disabled = !(hasPhoto && hasStyle);
    
    if (!hasPhoto && !hasStyle) {
        status.textContent = '사진과 스타일을 선택하세요';
    } else if (!hasPhoto) {
        status.textContent = '내 사진을 업로드하세요';
    } else if (!hasStyle) {
        status.textContent = '스타일을 선택하세요';
    } else {
        status.textContent = '✨ 변환 준비 완료!';
    }
}

// ===== 변환 처리 =====
async function handleTransform() {
    if (state.isProcessing || !state.myPhoto || !state.selectedStyle) return;
    
    state.isProcessing = true;
    showLoading(true, '시작하는 중...');
    
    try {
        const result = await callTransformAPI();
        
        if (result) {
            state.resultImage = result;
            showResult();
        }
    } catch (error) {
        console.error('변환 오류:', error);
        alert(`변환 실패: ${error.message}`);
    } finally {
        state.isProcessing = false;
        showLoading(false);
    }
}

async function callTransformAPI() {
    updateLoadingStatus('Gemini AI 연결 중...', 10);
    
    try {
        const response = await fetch('/.netlify/functions/transform', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sourceImage: state.myPhoto,
                styleImage: state.selectedStyle.image,
                styleName: state.selectedStyle.name,
                stylePrompt: state.selectedStyle.prompt || `${state.selectedStyle.name} hairstyle`
            })
        });
        
        updateLoadingStatus('헤어스타일 분석 중...', 40);
        
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'API 오류');
        }
        
        updateLoadingStatus('AI 이미지 생성 중...', 70);
        
        const data = await response.json();
        
        if (data.success && data.result) {
            updateLoadingStatus('완료!', 100);
            await delay(500);
            return data.result;
        }
        
        throw new Error(data.error || '결과 없음');
        
    } catch (error) {
        // 로컬 개발 모드
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            console.warn('로컬 모드: 데모 결과 사용');
            updateLoadingStatus('데모 모드...', 80);
            await delay(2000);
            updateLoadingStatus('완료!', 100);
            return state.myPhoto; // 데모용
        }
        throw error;
    }
}

// ===== 로딩 표시 =====
function showLoading(show, message = '') {
    $('#loading-overlay')?.classList.toggle('hidden', !show);
    if (show && message) {
        $('#loading-status').textContent = message;
        $('#loading-bar').style.width = '0%';
    }
}

function updateLoadingStatus(message, progress) {
    $('#loading-status').textContent = message;
    $('#loading-bar').style.width = `${progress}%`;
}

// ===== 결과 표시 =====
function showResult() {
    // 이미지 설정
    $('#compare-before-img').src = state.myPhoto;
    $('#compare-after-img').src = state.resultImage;
    
    // 섹션 표시
    $('#result')?.classList.remove('hidden');
    
    // 슬라이더 초기화
    $('#slider-handle').style.left = '50%';
    $('.comparison-image.after').style.clipPath = 'inset(0 50% 0 0)';
    
    // 스크롤
    $('#result')?.scrollIntoView({ behavior: 'smooth' });
}

// ===== 비교 슬라이더 =====
function setupComparisonSlider() {
    const slider = $('#comparison-slider');
    if (!slider) return;
    
    let isDragging = false;
    
    const updateSlider = (clientX) => {
        const rect = slider.getBoundingClientRect();
        let pos = ((clientX - rect.left) / rect.width) * 100;
        pos = Math.max(0, Math.min(100, pos));
        
        $('#slider-handle').style.left = `${pos}%`;
        $('.comparison-image.after').style.clipPath = `inset(0 ${100 - pos}% 0 0)`;
    };
    
    slider.addEventListener('mousedown', (e) => { isDragging = true; updateSlider(e.clientX); });
    document.addEventListener('mousemove', (e) => { if (isDragging) updateSlider(e.clientX); });
    document.addEventListener('mouseup', () => isDragging = false);
    
    slider.addEventListener('touchstart', (e) => { isDragging = true; updateSlider(e.touches[0].clientX); });
    document.addEventListener('touchmove', (e) => { if (isDragging) updateSlider(e.touches[0].clientX); });
    document.addEventListener('touchend', () => isDragging = false);
}

// ===== 결과 액션 =====
function handleDownload() {
    if (!state.resultImage) return;
    
    const link = document.createElement('a');
    link.download = `la-vie-enr-hair-${Date.now()}.png`;
    link.href = state.resultImage;
    link.click();
}

async function handleShare() {
    if (!navigator.share || !state.resultImage) {
        alert('공유하기가 지원되지 않는 환경입니다.');
        return;
    }
    
    try {
        const response = await fetch(state.resultImage);
        const blob = await response.blob();
        const file = new File([blob], 'hair-style.png', { type: 'image/png' });
        
        await navigator.share({
            title: 'LA VIE ENR HAIR AI',
            text: 'AI로 만든 나의 새로운 헤어스타일!',
            files: [file]
        });
    } catch (e) {
        console.log('공유 취소 또는 실패:', e);
    }
}

function handleRetry() {
    $('#result')?.classList.add('hidden');
    $('#transform')?.scrollIntoView({ behavior: 'smooth' });
}

// ===== 관리자 모달 =====
function openAdminModal() {
    // 현재 데이터 복사
    state.pendingData = JSON.parse(JSON.stringify(state.data));
    state.adminGender = 'male';
    state.adminCategory = state.pendingData.male.categories[0] || null;
    
    renderAdminCategories();
    renderAdminStyles();
    
    $('#admin-modal')?.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeAdminModal() {
    $('#admin-modal')?.classList.add('hidden');
    document.body.style.overflow = '';
}

function handleAdminGenderChange(gender) {
    state.adminGender = gender;
    
    $$('.admin-gender-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.gender === gender);
    });
    
    state.adminCategory = state.pendingData[gender].categories[0] || null;
    
    renderAdminCategories();
    renderAdminStyles();
}

function renderAdminCategories() {
    const container = $('#admin-category-list');
    if (!container) return;
    
    const categories = state.pendingData[state.adminGender]?.categories || [];
    
    container.innerHTML = categories.map(cat => `
        <div class="category-item ${cat === state.adminCategory ? 'active' : ''}" data-category="${cat}">
            <span>${cat}</span>
            <button class="delete-category" data-category="${cat}">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
    
    // 카테고리 선택
    container.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.delete-category')) {
                state.adminCategory = item.dataset.category;
                renderAdminCategories();
                renderAdminStyles();
            }
        });
    });
    
    // 카테고리 삭제
    container.querySelectorAll('.delete-category').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleDeleteCategory(btn.dataset.category);
        });
    });
    
    // 현재 카테고리 이름 표시
    $('#current-category-name').textContent = state.adminCategory ? `- ${state.adminCategory}` : '';
}

function renderAdminStyles() {
    const grid = $('#admin-styles-grid');
    const emptyMsg = $('#admin-empty-message');
    
    if (!state.adminCategory) {
        grid?.classList.add('hidden');
        emptyMsg?.classList.remove('hidden');
        return;
    }
    
    grid?.classList.remove('hidden');
    emptyMsg?.classList.add('hidden');
    
    const styles = state.pendingData[state.adminGender]?.styles?.[state.adminCategory] || [];
    
    grid.innerHTML = styles.length > 0 ? styles.map((style, index) => `
        <div class="admin-style-item" data-id="${style.id}">
            <img src="${style.image}" alt="${style.name}"
                 onerror="this.src='https://placehold.co/100x133/1a1a1a/d4af37?text=Error'">
            <button class="delete-style" data-id="${style.id}">
                <i class="fas fa-times"></i>
            </button>
            <div class="style-number">${style.name}</div>
        </div>
    `).join('') : '<div class="admin-empty-message"><p>스타일을 추가하세요</p></div>';
    
    // 삭제 버튼
    grid.querySelectorAll('.delete-style').forEach(btn => {
        btn.addEventListener('click', () => handleDeleteStyle(btn.dataset.id));
    });
}

// ===== 카테고리 관리 =====
function openCategoryModal() {
    $('#new-category-name').value = '';
    $('#category-modal')?.classList.remove('hidden');
}

function closeCategoryModal() {
    $('#category-modal')?.classList.add('hidden');
}

function handleAddCategory() {
    const name = $('#new-category-name').value.trim();
    
    if (!name) {
        alert('카테고리 이름을 입력하세요.');
        return;
    }
    
    const categories = state.pendingData[state.adminGender].categories;
    
    if (categories.includes(name)) {
        alert('이미 존재하는 카테고리입니다.');
        return;
    }
    
    categories.push(name);
    state.pendingData[state.adminGender].styles[name] = [];
    state.adminCategory = name;
    
    closeCategoryModal();
    renderAdminCategories();
    renderAdminStyles();
}

function handleDeleteCategory(category) {
    if (!confirm(`"${category}" 카테고리를 삭제하시겠습니까?\n포함된 모든 스타일도 삭제됩니다.`)) {
        return;
    }
    
    const data = state.pendingData[state.adminGender];
    const index = data.categories.indexOf(category);
    
    if (index > -1) {
        data.categories.splice(index, 1);
        delete data.styles[category];
        
        // 다른 카테고리 선택
        state.adminCategory = data.categories[0] || null;
        
        renderAdminCategories();
        renderAdminStyles();
    }
}

// ===== 스타일 관리 =====
function handleAdminStyleUpload(e) {
    if (!state.adminCategory) {
        alert('먼저 카테고리를 선택하세요.');
        return;
    }
    
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const styles = state.pendingData[state.adminGender].styles[state.adminCategory];
            const genderLabel = state.adminGender === 'male' ? '남자' : '여자';
            const count = styles.length + 1;
            
            // 자동 이름 생성: "남자 컷 1", "여자 펌 2" 등
            const styleName = `${genderLabel} ${state.adminCategory} ${count}`;
            
            const newStyle = {
                id: `${state.adminGender}-${state.adminCategory}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                name: styleName,
                category: state.adminCategory,
                gender: state.adminGender,
                image: ev.target.result,
                prompt: `${styleName} hairstyle, professional salon result`
            };
            
            styles.push(newStyle);
            renderAdminStyles();
        };
        reader.readAsDataURL(file);
    });
    
    e.target.value = '';
}

function handleDeleteStyle(styleId) {
    const styles = state.pendingData[state.adminGender].styles[state.adminCategory];
    const index = styles.findIndex(s => s.id === styleId);
    
    if (index > -1) {
        styles.splice(index, 1);
        
        // 이름 재정렬
        const genderLabel = state.adminGender === 'male' ? '남자' : '여자';
        styles.forEach((style, i) => {
            style.name = `${genderLabel} ${state.adminCategory} ${i + 1}`;
        });
        
        renderAdminStyles();
    }
}

// ===== 저장 =====
function handleAdminSave() {
    state.data = state.pendingData;
    saveData();
    
    // 현재 뷰 업데이트
    const categories = state.data[state.currentGender]?.categories || [];
    if (!categories.includes(state.currentCategory)) {
        state.currentCategory = categories[0] || null;
    }
    
    renderCategoryTabs();
    renderStyles();
    closeAdminModal();
    
    alert('✨ 저장되었습니다!');
}
