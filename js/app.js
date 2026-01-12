/**
 * =========================================
 * LA VIE ENR HAIR AI - Main Application
 * =========================================
 * 
 * app.js의 역할:
 * 1. 사용자 상호작용 처리 (클릭, 업로드 등)
 * 2. 상태(state) 관리 (업로드된 사진, 선택한 스타일 등)
 * 3. 화면(DOM) 업데이트
 * 4. API 통신 (Gemini AI)
 * 5. 데이터 저장 (localStorage)
 */

// ===== 유틸리티 함수 =====
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ===== 기본 데이터 구조 =====
const DEFAULT_DATA = {
    genders: ['남자', '여자'],
    categories: {
        '남자': ['컷', '펌', '염색'],
        '여자': ['컷', '펌', '염색']
    },
    styles: {
        // '남자-컷': [{ id, name, image, prompt }, ...]
    }
};

// ===== 애플리케이션 상태 =====
const state = {
    // 현재 선택/업로드된 항목
    myPhoto: null,           // Base64 이미지
    selectedStyle: null,     // { id, name, image, prompt, gender, category }
    resultImage: null,       // 변환 결과 이미지
    
    // 스타일북 데이터
    data: loadData(),
    
    // UI 상태
    currentGender: null,
    currentCategory: null,
    isProcessing: false,
    
    // 관리자 모달용 임시 데이터
    pendingData: null
};

// ===== 데이터 저장/불러오기 =====
function loadData() {
    try {
        const saved = localStorage.getItem('laVieEnrHairData');
        if (saved) {
            const parsed = JSON.parse(saved);
            // 기본 구조 확인
            if (parsed.genders && parsed.categories && parsed.styles) {
                return parsed;
            }
        }
    } catch (e) {
        console.error('데이터 로드 실패:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function saveData() {
    try {
        localStorage.setItem('laVieEnrHairData', JSON.stringify(state.data));
        console.log('데이터 저장 완료');
    } catch (e) {
        console.error('데이터 저장 실패:', e);
        alert('저장 공간이 부족합니다. 일부 스타일을 삭제해주세요.');
    }
}

// ===== 스타일 키 생성 (성별-카테고리) =====
function getStyleKey(gender, category) {
    return `${gender}-${category}`;
}

// ===== 스타일 번호 생성 =====
function getNextStyleNumber(gender, category) {
    const key = getStyleKey(gender, category);
    const styles = state.data.styles[key] || [];
    return styles.length + 1;
}

// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    console.log('LA VIE ENR HAIR AI 초기화');
    
    // 기본 성별/카테고리 설정
    if (state.data.genders.length > 0) {
        state.currentGender = state.data.genders[0];
        const categories = state.data.categories[state.currentGender] || [];
        if (categories.length > 0) {
            state.currentCategory = categories[0];
        }
    }
    
    // UI 렌더링
    renderGenderTabs();
    renderCategoryTabs();
    renderStylesGrid();
    
    // 이벤트 리스너 설정
    setupEventListeners();
    setupDragAndDrop();
    setupComparisonSlider();
    
    // 버튼 상태 업데이트
    updateTransformButton();
}

// ===== 이벤트 리스너 =====
function setupEventListeners() {
    // 내 사진 업로드
    $('#my-photo-upload')?.addEventListener('click', () => $('#my-photo-input')?.click());
    $('#my-photo-input')?.addEventListener('change', handleMyPhotoUpload);
    $('#remove-my-photo')?.addEventListener('click', (e) => { e.stopPropagation(); removeMyPhoto(); });
    
    // 선택한 스타일 제거
    $('#remove-style')?.addEventListener('click', (e) => { e.stopPropagation(); removeSelectedStyle(); });
    
    // 커스텀 스타일 업로드
    $('#custom-upload-btn')?.addEventListener('click', () => $('#custom-style-input')?.click());
    $('#custom-style-input')?.addEventListener('change', handleCustomStyleUpload);
    
    // 변환 버튼
    $('#transform-btn')?.addEventListener('click', handleTransform);
    
    // 결과 액션
    $('#download-result-btn')?.addEventListener('click', downloadResult);
    $('#share-result-btn')?.addEventListener('click', shareResult);
    $('#retry-btn')?.addEventListener('click', retryTransform);
    
    // 관리자 모달
    $('#admin-btn')?.addEventListener('click', openAdminModal);
    $('#admin-modal-close')?.addEventListener('click', closeAdminModal);
    $('#admin-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'admin-modal') closeAdminModal();
    });
    
    // 관리자 메인 탭
    $$('.admin-main-tab').forEach(tab => {
        tab.addEventListener('click', () => handleAdminMainTab(tab));
    });
    
    // 성별 추가
    $('#add-gender-btn')?.addEventListener('click', addGender);
    
    // 카테고리 추가
    $('#add-category-btn')?.addEventListener('click', addCategory);
    $('#category-gender-select')?.addEventListener('change', renderCategoryList);
    
    // 스타일 관리
    $('#style-gender-select')?.addEventListener('change', () => {
        updateStyleCategorySelect();
        renderAdminStylesGrid();
    });
    $('#style-category-select')?.addEventListener('change', renderAdminStylesGrid);
    $('#admin-upload-btn')?.addEventListener('click', () => $('#admin-style-input')?.click());
    $('#admin-style-input')?.addEventListener('change', handleAdminStyleUpload);
    
    // 저장
    $('#admin-save-btn')?.addEventListener('click', saveAdminChanges);
    
    // 스무스 스크롤
    $$('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            $(link.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
        });
    });
}

// ===== 드래그 앤 드롭 =====
function setupDragAndDrop() {
    const uploadBox = $('#my-photo-upload');
    if (!uploadBox) return;
    
    uploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadBox.style.borderColor = 'var(--gold-400)';
    });
    
    uploadBox.addEventListener('dragleave', () => {
        uploadBox.style.borderColor = '';
    });
    
    uploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadBox.style.borderColor = '';
        const file = e.dataTransfer.files[0];
        if (file?.type.startsWith('image/')) {
            processMyPhoto(file);
        }
    });
}

// ===== 내 사진 처리 =====
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

function removeMyPhoto() {
    state.myPhoto = null;
    $('#my-photo-input').value = '';
    $('#my-photo-placeholder')?.classList.remove('hidden');
    $('#my-photo-preview')?.classList.add('hidden');
    updateTransformButton();
}

// ===== 스타일 선택 =====
function selectStyle(styleData) {
    state.selectedStyle = styleData;
    
    // UI 업데이트
    $$('.style-card').forEach(card => card.classList.remove('selected'));
    const selectedCard = $(`.style-card[data-id="${styleData.id}"]`);
    selectedCard?.classList.add('selected');
    
    // 오른쪽 패널 업데이트
    $('#selected-style-img').src = styleData.image;
    $('#style-name-tag').textContent = styleData.name;
    $('#style-placeholder')?.classList.add('hidden');
    $('#style-preview')?.classList.remove('hidden');
    
    updateTransformButton();
}

function removeSelectedStyle() {
    state.selectedStyle = null;
    
    $$('.style-card').forEach(card => card.classList.remove('selected'));
    
    $('#style-placeholder')?.classList.remove('hidden');
    $('#style-preview')?.classList.add('hidden');
    
    updateTransformButton();
}

// ===== 커스텀 스타일 업로드 =====
function handleCustomStyleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
        const customStyle = {
            id: 'custom-' + Date.now(),
            name: '커스텀 스타일',
            image: ev.target.result,
            prompt: 'apply the exact hairstyle from the reference image',
            gender: 'custom',
            category: 'custom'
        };
        
        selectStyle(customStyle);
    };
    reader.readAsDataURL(file);
    
    e.target.value = '';
}

// ===== 성별/카테고리 탭 렌더링 =====
function renderGenderTabs() {
    const container = $('#gender-tabs');
    if (!container) return;
    
    container.innerHTML = state.data.genders.map(gender => `
        <button class="gender-tab ${gender === state.currentGender ? 'active' : ''}" 
                data-gender="${gender}">
            ${gender}
        </button>
    `).join('');
    
    // 이벤트 리스너
    container.querySelectorAll('.gender-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            state.currentGender = tab.dataset.gender;
            
            // 해당 성별의 첫 카테고리 선택
            const categories = state.data.categories[state.currentGender] || [];
            state.currentCategory = categories[0] || null;
            
            renderGenderTabs();
            renderCategoryTabs();
            renderStylesGrid();
        });
    });
}

function renderCategoryTabs() {
    const container = $('#category-tabs');
    if (!container || !state.currentGender) return;
    
    const categories = state.data.categories[state.currentGender] || [];
    
    container.innerHTML = categories.map(category => `
        <button class="category-tab ${category === state.currentCategory ? 'active' : ''}" 
                data-category="${category}">
            ${category}
        </button>
    `).join('');
    
    // 이벤트 리스너
    container.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            state.currentCategory = tab.dataset.category;
            renderCategoryTabs();
            renderStylesGrid();
        });
    });
}

// ===== 스타일 그리드 렌더링 =====
function renderStylesGrid() {
    const grid = $('#styles-grid');
    const emptyMsg = $('#empty-styles');
    if (!grid) return;
    
    if (!state.currentGender || !state.currentCategory) {
        grid.innerHTML = '';
        emptyMsg?.classList.remove('hidden');
        return;
    }
    
    const key = getStyleKey(state.currentGender, state.currentCategory);
    const styles = state.data.styles[key] || [];
    
    if (styles.length === 0) {
        grid.innerHTML = '';
        emptyMsg?.classList.remove('hidden');
        return;
    }
    
    emptyMsg?.classList.add('hidden');
    
    grid.innerHTML = styles.map(style => `
        <div class="style-card ${state.selectedStyle?.id === style.id ? 'selected' : ''}" 
             data-id="${style.id}">
            <div class="style-card-image">
                <img src="${style.image}" alt="${style.name}" 
                     onerror="this.src='https://placehold.co/300x400/1a1a1a/d4af37?text=Error'">
            </div>
            <div class="style-card-info">
                <h4>${style.name}</h4>
            </div>
        </div>
    `).join('');
    
    // 이벤트 리스너
    grid.querySelectorAll('.style-card').forEach(card => {
        card.addEventListener('click', () => {
            const styleId = card.dataset.id;
            const style = styles.find(s => s.id === styleId);
            if (style) {
                selectStyle({
                    ...style,
                    gender: state.currentGender,
                    category: state.currentCategory
                });
            }
        });
    });
}

// ===== 변환 버튼 상태 =====
function updateTransformButton() {
    const btn = $('#transform-btn');
    const status = $('#transform-status');
    
    const hasPhoto = !!state.myPhoto;
    const hasStyle = !!state.selectedStyle;
    
    btn.disabled = !(hasPhoto && hasStyle);
    
    if (!hasPhoto && !hasStyle) {
        status.textContent = '사진과 스타일을 선택하세요';
    } else if (!hasPhoto) {
        status.textContent = '사진을 업로드하세요';
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
        alert('변환 중 오류가 발생했습니다.\n\n' + error.message);
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
        
        updateLoadingStatus('스타일 분석 중...', 30);
        
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'API 오류');
        }
        
        updateLoadingStatus('이미지 생성 중...', 60);
        
        const data = await response.json();
        
        if (data.success && data.result) {
            updateLoadingStatus('완료!', 100);
            await delay(500);
            return data.result;
        }
        
        throw new Error(data.error || '결과를 받지 못했습니다');
        
    } catch (error) {
        // 로컬 테스트용
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            console.warn('로컬 모드: 데모 결과 사용');
            updateLoadingStatus('데모 모드...', 80);
            await delay(2000);
            return state.myPhoto;
        }
        throw error;
    }
}

// ===== 로딩 UI =====
function showLoading(show, message = '') {
    const overlay = $('#loading-overlay');
    overlay?.classList.toggle('hidden', !show);
    
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
    // Before/After 이미지 설정
    $('#result-before-img').src = state.myPhoto;
    $('#result-after-img').src = state.resultImage;
    
    // 슬라이더 리셋
    $('#slider-handle').style.left = '50%';
    $('.comparison-after').style.clipPath = 'inset(0 50% 0 0)';
    
    // 결과 섹션 표시
    $('#result-section')?.classList.remove('hidden');
    
    // 스크롤
    $('#result-section')?.scrollIntoView({ behavior: 'smooth' });
}

// ===== 비교 슬라이더 =====
function setupComparisonSlider() {
    const slider = $('#comparison-slider');
    if (!slider) return;
    
    let isDragging = false;
    
    const updatePosition = (clientX) => {
        const rect = slider.getBoundingClientRect();
        let pos = ((clientX - rect.left) / rect.width) * 100;
        pos = Math.max(0, Math.min(100, pos));
        
        $('#slider-handle').style.left = `${pos}%`;
        $('.comparison-after').style.clipPath = `inset(0 ${100 - pos}% 0 0)`;
    };
    
    slider.addEventListener('mousedown', (e) => { isDragging = true; updatePosition(e.clientX); });
    document.addEventListener('mousemove', (e) => { if (isDragging) updatePosition(e.clientX); });
    document.addEventListener('mouseup', () => isDragging = false);
    
    slider.addEventListener('touchstart', (e) => { isDragging = true; updatePosition(e.touches[0].clientX); });
    document.addEventListener('touchmove', (e) => { if (isDragging) updatePosition(e.touches[0].clientX); });
    document.addEventListener('touchend', () => isDragging = false);
}

// ===== 결과 액션 =====
function downloadResult() {
    if (!state.resultImage) return;
    
    const link = document.createElement('a');
    link.download = `la-vie-enr-hair-${Date.now()}.png`;
    link.href = state.resultImage;
    link.click();
}

async function shareResult() {
    if (!navigator.share || !state.resultImage) {
        alert('공유 기능을 사용할 수 없습니다.');
        return;
    }
    
    try {
        await navigator.share({
            title: 'LA VIE ENR HAIR AI',
            text: '나의 새로운 헤어스타일을 확인해보세요!',
        });
    } catch (e) {
        console.log('공유 취소');
    }
}

function retryTransform() {
    $('#result-section')?.classList.add('hidden');
    $('#transform')?.scrollIntoView({ behavior: 'smooth' });
}

// ===== 관리자 모달 =====
function openAdminModal() {
    // 현재 데이터 복사
    state.pendingData = JSON.parse(JSON.stringify(state.data));
    
    // UI 초기화
    renderAdminGenderList();
    updateCategoryGenderSelect();
    renderCategoryList();
    updateStyleGenderSelect();
    updateStyleCategorySelect();
    renderAdminStylesGrid();
    
    $('#admin-modal')?.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeAdminModal() {
    $('#admin-modal')?.classList.add('hidden');
    document.body.style.overflow = '';
    state.pendingData = null;
}

function handleAdminMainTab(tab) {
    const tabId = tab.dataset.tab;
    
    $$('.admin-main-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    $$('.admin-tab-content').forEach(c => c.classList.remove('active'));
    $(`#${tabId}-content`)?.classList.add('active');
}

// ===== 성별 관리 =====
function renderAdminGenderList() {
    const list = $('#gender-list');
    if (!list) return;
    
    list.innerHTML = state.pendingData.genders.map(gender => `
        <div class="admin-list-item" data-gender="${gender}">
            <span>${gender}</span>
            <button class="delete-btn" title="삭제">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('') || '<div class="admin-empty-msg">성별을 추가해주세요</div>';
    
    // 삭제 버튼
    list.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.admin-list-item');
            const gender = item.dataset.gender;
            deleteGender(gender);
        });
    });
}

function addGender() {
    const name = prompt('새 성별 이름을 입력하세요:');
    if (!name || !name.trim()) return;
    
    const trimmed = name.trim();
    
    if (state.pendingData.genders.includes(trimmed)) {
        alert('이미 존재하는 성별입니다.');
        return;
    }
    
    state.pendingData.genders.push(trimmed);
    state.pendingData.categories[trimmed] = [];
    
    renderAdminGenderList();
    updateCategoryGenderSelect();
    updateStyleGenderSelect();
}

function deleteGender(gender) {
    if (!confirm(`"${gender}" 성별과 모든 관련 스타일을 삭제하시겠습니까?`)) return;
    
    // 성별 제거
    state.pendingData.genders = state.pendingData.genders.filter(g => g !== gender);
    
    // 카테고리 제거
    delete state.pendingData.categories[gender];
    
    // 관련 스타일 제거
    Object.keys(state.pendingData.styles).forEach(key => {
        if (key.startsWith(`${gender}-`)) {
            delete state.pendingData.styles[key];
        }
    });
    
    renderAdminGenderList();
    updateCategoryGenderSelect();
    renderCategoryList();
    updateStyleGenderSelect();
    updateStyleCategorySelect();
    renderAdminStylesGrid();
}

// ===== 카테고리 관리 =====
function updateCategoryGenderSelect() {
    const select = $('#category-gender-select');
    if (!select) return;
    
    select.innerHTML = state.pendingData.genders.map(gender => 
        `<option value="${gender}">${gender}</option>`
    ).join('') || '<option value="">성별 없음</option>';
}

function renderCategoryList() {
    const select = $('#category-gender-select');
    const list = $('#category-list');
    if (!select || !list) return;
    
    const gender = select.value;
    const categories = state.pendingData.categories[gender] || [];
    
    list.innerHTML = categories.map(category => `
        <div class="admin-list-item" data-category="${category}">
            <span>${category}</span>
            <button class="delete-btn" title="삭제">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('') || '<div class="admin-empty-msg">카테고리를 추가해주세요</div>';
    
    // 삭제 버튼
    list.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.admin-list-item');
            const category = item.dataset.category;
            deleteCategory(gender, category);
        });
    });
}

function addCategory() {
    const genderSelect = $('#category-gender-select');
    const input = $('#new-category-input');
    if (!genderSelect || !input) return;
    
    const gender = genderSelect.value;
    const category = input.value.trim();
    
    if (!gender) {
        alert('성별을 먼저 선택해주세요.');
        return;
    }
    
    if (!category) {
        alert('카테고리 이름을 입력해주세요.');
        return;
    }
    
    if (!state.pendingData.categories[gender]) {
        state.pendingData.categories[gender] = [];
    }
    
    if (state.pendingData.categories[gender].includes(category)) {
        alert('이미 존재하는 카테고리입니다.');
        return;
    }
    
    state.pendingData.categories[gender].push(category);
    input.value = '';
    
    renderCategoryList();
    updateStyleCategorySelect();
}

function deleteCategory(gender, category) {
    if (!confirm(`"${category}" 카테고리와 모든 스타일을 삭제하시겠습니까?`)) return;
    
    state.pendingData.categories[gender] = 
        state.pendingData.categories[gender].filter(c => c !== category);
    
    // 관련 스타일 삭제
    const key = getStyleKey(gender, category);
    delete state.pendingData.styles[key];
    
    renderCategoryList();
    updateStyleCategorySelect();
    renderAdminStylesGrid();
}

// ===== 스타일 관리 =====
function updateStyleGenderSelect() {
    const select = $('#style-gender-select');
    if (!select) return;
    
    select.innerHTML = state.pendingData.genders.map(gender => 
        `<option value="${gender}">${gender}</option>`
    ).join('') || '<option value="">성별 없음</option>';
}

function updateStyleCategorySelect() {
    const genderSelect = $('#style-gender-select');
    const categorySelect = $('#style-category-select');
    if (!genderSelect || !categorySelect) return;
    
    const gender = genderSelect.value;
    const categories = state.pendingData.categories[gender] || [];
    
    categorySelect.innerHTML = categories.map(category => 
        `<option value="${category}">${category}</option>`
    ).join('') || '<option value="">카테고리 없음</option>';
}

function renderAdminStylesGrid() {
    const genderSelect = $('#style-gender-select');
    const categorySelect = $('#style-category-select');
    const grid = $('#admin-styles-grid');
    
    if (!grid) return;
    
    const gender = genderSelect?.value;
    const category = categorySelect?.value;
    
    if (!gender || !category) {
        grid.innerHTML = '<div class="admin-empty-msg">성별과 카테고리를 선택해주세요</div>';
        return;
    }
    
    const key = getStyleKey(gender, category);
    const styles = state.pendingData.styles[key] || [];
    
    if (styles.length === 0) {
        grid.innerHTML = '<div class="admin-empty-msg">등록된 스타일이 없습니다</div>';
        return;
    }
    
    grid.innerHTML = styles.map((style, index) => `
        <div class="admin-style-item" data-index="${index}">
            <img src="${style.image}" alt="${style.name}">
            <span class="style-item-name">${style.name}</span>
            <button class="style-item-delete">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
    
    // 삭제 버튼
    grid.querySelectorAll('.style-item-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.admin-style-item');
            const index = parseInt(item.dataset.index);
            deleteAdminStyle(gender, category, index);
        });
    });
}

function handleAdminStyleUpload(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    const genderSelect = $('#style-gender-select');
    const categorySelect = $('#style-category-select');
    
    const gender = genderSelect?.value;
    const category = categorySelect?.value;
    
    if (!gender || !category) {
        alert('성별과 카테고리를 먼저 선택해주세요.');
        e.target.value = '';
        return;
    }
    
    const key = getStyleKey(gender, category);
    
    if (!state.pendingData.styles[key]) {
        state.pendingData.styles[key] = [];
    }
    
    // 현재 스타일 개수
    let currentCount = state.pendingData.styles[key].length;
    
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            currentCount++;
            
            // 자동 이름 생성: "남자 컷 1", "여자 펌 2" 등
            const styleName = `${gender} ${category} ${currentCount}`;
            
            const newStyle = {
                id: `style-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                name: styleName,
                image: ev.target.result,
                prompt: `${styleName} hairstyle, ${category} style`
            };
            
            state.pendingData.styles[key].push(newStyle);
            renderAdminStylesGrid();
        };
        reader.readAsDataURL(file);
    });
    
    e.target.value = '';
}

function deleteAdminStyle(gender, category, index) {
    const key = getStyleKey(gender, category);
    const styles = state.pendingData.styles[key];
    
    if (!styles || !styles[index]) return;
    
    styles.splice(index, 1);
    
    // 이름 번호 재정렬
    styles.forEach((style, i) => {
        style.name = `${gender} ${category} ${i + 1}`;
    });
    
    renderAdminStylesGrid();
}

// ===== 관리자 변경사항 저장 =====
function saveAdminChanges() {
    state.data = state.pendingData;
    saveData();
    
    // 현재 선택 초기화
    if (state.data.genders.length > 0) {
        state.currentGender = state.data.genders[0];
        const categories = state.data.categories[state.currentGender] || [];
        state.currentCategory = categories[0] || null;
    } else {
        state.currentGender = null;
        state.currentCategory = null;
    }
    
    // UI 업데이트
    renderGenderTabs();
    renderCategoryTabs();
    renderStylesGrid();
    
    closeAdminModal();
    alert('✨ 저장되었습니다!');
}
