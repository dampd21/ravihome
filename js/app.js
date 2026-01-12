/**
 * ============================================
 * LA VIE EN HAIR AI - Main Application
 * ============================================
 * 
 * 📌 이 파일(app.js)의 역할:
 * 
 * 1. 상태 관리 (State Management)
 *    - 사용자가 업로드한 사진
 *    - 선택한 스타일
 *    - 스타일 데이터 (카테고리, 이미지 등)
 * 
 * 2. 이벤트 처리 (Event Handling)
 *    - 버튼 클릭
 *    - 파일 업로드
 *    - 드래그 앤 드롭
 * 
 * 3. UI 업데이트 (UI Updates)
 *    - 이미지 미리보기 표시
 *    - 스타일 그리드 렌더링
 *    - 로딩 상태 표시
 * 
 * 4. API 통신 (API Communication)
 *    - Gemini AI API 호출
 *    - 이미지 변환 요청
 * 
 * 5. 데이터 저장 (Data Persistence)
 *    - localStorage에 스타일 데이터 저장/불러오기
 * 
 * ============================================
 */

// ===== 기본 스타일 데이터 =====
const DEFAULT_DATA = {
    male: {
        categories: [
            { id: 'male-cut', name: '컷', styles: [] },
            { id: 'male-perm', name: '펌', styles: [] }
        ]
    },
    female: {
        categories: [
            { id: 'female-cut', name: '컷', styles: [] },
            { id: 'female-perm', name: '펌', styles: [] },
            { id: 'female-color', name: '염색', styles: [] }
        ]
    }
};

// ===== 애플리케이션 상태 =====
const state = {
    // 사용자 사진
    myPhoto: null,
    
    // 선택된 스타일
    selectedStyle: null,
    
    // 변환 결과
    resultImage: null,
    
    // 처리 중 여부
    isProcessing: false,
    
    // 스타일 데이터 (성별 → 카테고리 → 스타일)
    data: loadData(),
    
    // 현재 선택된 성별/카테고리
    currentGender: 'male',
    currentCategoryId: null,
    
    // 관리자 모달용 임시 데이터
    adminData: null,
    adminGender: 'male',
    adminCategoryId: null
};

// ===== 유틸리티 함수 =====
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ===== 데이터 저장/불러오기 =====
function loadData() {
    try {
        const saved = localStorage.getItem('laVieEnHairData');
        if (saved) {
            const parsed = JSON.parse(saved);
            // 데이터 구조 검증
            if (parsed.male && parsed.female) {
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
        localStorage.setItem('laVieEnHairData', JSON.stringify(state.data));
        console.log('✅ 데이터 저장 완료');
    } catch (e) {
        console.error('데이터 저장 실패:', e);
    }
}

// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    console.log('🎨 LA VIE EN HAIR AI 초기화 중...');
    
    // 초기 카테고리 설정
    const firstCategory = state.data[state.currentGender]?.categories[0];
    if (firstCategory) {
        state.currentCategoryId = firstCategory.id;
    }
    
    // UI 렌더링
    renderCategoryTabs();
    renderStylesGrid();
    
    // 이벤트 리스너 설정
    setupEventListeners();
    setupDragAndDrop();
    setupComparisonSlider();
    
    // 상태 업데이트
    updateTransformButton();
    
    console.log('✅ 초기화 완료');
}

// ===== 이벤트 리스너 설정 =====
function setupEventListeners() {
    // 내 사진 업로드
    $('#my-photo-upload')?.addEventListener('click', () => {
        $('#my-photo-input')?.click();
    });
    $('#my-photo-input')?.addEventListener('change', handleMyPhotoUpload);
    $('#remove-my-photo')?.addEventListener('click', (e) => {
        e.stopPropagation();
        removeMyPhoto();
    });
    
    // 스타일 선택 해제
    $('#clear-style-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        clearSelectedStyle();
    });
    
    // 커스텀 스타일 업로드
    $('#custom-style-upload')?.addEventListener('click', () => {
        $('#custom-style-input')?.click();
    });
    $('#custom-style-input')?.addEventListener('change', handleCustomStyleUpload);
    
    // 성별 탭
    $$('.gender-tab').forEach(tab => {
        tab.addEventListener('click', () => handleGenderTab(tab));
    });
    
    // 변환 버튼
    $('#transform-btn')?.addEventListener('click', handleTransform);
    
    // 결과 액션
    $('#download-result-btn')?.addEventListener('click', downloadResult);
    $('#share-result-btn')?.addEventListener('click', shareResult);
    $('#retry-btn')?.addEventListener('click', retryTransform);
    
    // 관리자 모달
    $('#admin-btn')?.addEventListener('click', openAdminModal);
    $('#admin-modal-close')?.addEventListener('click', closeAdminModal);
    $('#admin-modal-overlay')?.addEventListener('click', closeAdminModal);
    
    // 관리자 성별 선택
    $$('.admin-gender-btn').forEach(btn => {
        btn.addEventListener('click', () => handleAdminGender(btn));
    });
    
    // 카테고리 추가
    $('#add-category-btn')?.addEventListener('click', openCategoryModal);
    $('#category-modal-close')?.addEventListener('click', closeCategoryModal);
    $('#category-modal-overlay')?.addEventListener('click', closeCategoryModal);
    $('#category-cancel-btn')?.addEventListener('click', closeCategoryModal);
    $('#category-confirm-btn')?.addEventListener('click', addCategory);
    
    // 스타일 추가
    $('#add-style-btn')?.addEventListener('click', () => {
        $('#admin-style-input')?.click();
    });
    $('#admin-style-input')?.addEventListener('change', handleAdminStyleUpload);
    
    // 저장
    $('#admin-save-btn')?.addEventListener('click', saveAdminChanges);
    
    // 스무스 스크롤
    $$('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = $(anchor.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// ===== 드래그 앤 드롭 =====
function setupDragAndDrop() {
    const dropZone = $('#my-photo-upload');
    if (!dropZone) return;
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--gold-400)';
        dropZone.style.background = 'rgba(212, 175, 55, 0.05)';
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = '';
        dropZone.style.background = '';
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '';
        dropZone.style.background = '';
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            processMyPhoto(file);
        }
    });
}

// ===== 내 사진 처리 =====
function handleMyPhotoUpload(e) {
    const file = e.target.files[0];
    if (file) {
        processMyPhoto(file);
    }
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

// ===== 커스텀 스타일 업로드 =====
function handleCustomStyleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
        state.selectedStyle = {
            id: 'custom-' + Date.now(),
            name: '커스텀 스타일',
            image: ev.target.result,
            prompt: 'apply this exact hairstyle from the reference image'
        };
        
        updateStyleDisplay();
        updateTransformButton();
    };
    reader.readAsDataURL(file);
    
    e.target.value = '';
}

// ===== 성별 탭 처리 =====
function handleGenderTab(tab) {
    const gender = tab.dataset.gender;
    state.currentGender = gender;
    
    // 탭 UI 업데이트
    $$('.gender-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    // 첫 번째 카테고리 선택
    const firstCategory = state.data[gender]?.categories[0];
    state.currentCategoryId = firstCategory?.id || null;
    
    // 다시 렌더링
    renderCategoryTabs();
    renderStylesGrid();
}

// ===== 카테고리 탭 렌더링 =====
function renderCategoryTabs() {
    const container = $('#category-tabs');
    if (!container) return;
    
    const categories = state.data[state.currentGender]?.categories || [];
    
    container.innerHTML = categories.map(cat => `
        <button class="category-tab ${cat.id === state.currentCategoryId ? 'active' : ''}" 
                data-id="${cat.id}">
            ${cat.name}
        </button>
    `).join('');
    
    // 이벤트 리스너
    container.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            state.currentCategoryId = tab.dataset.id;
            renderCategoryTabs();
            renderStylesGrid();
        });
    });
}

// ===== 스타일 그리드 렌더링 =====
function renderStylesGrid() {
    const container = $('#styles-grid');
    if (!container) return;
    
    const categories = state.data[state.currentGender]?.categories || [];
    const category = categories.find(c => c.id === state.currentCategoryId);
    const styles = category?.styles || [];
    
    if (styles.length === 0) {
        container.innerHTML = `
            <div class="styles-empty" style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
                <i class="fas fa-image" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;"></i>
                <p>등록된 스타일이 없습니다.</p>
                <p style="font-size: 0.85rem; margin-top: 8px;">
                    관리자 설정(⚙️)에서 스타일을 추가하세요.
                </p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = styles.map(style => `
        <div class="style-card ${state.selectedStyle?.id === style.id ? 'selected' : ''}" 
             data-id="${style.id}">
            <div class="style-card-image">
                <img src="${style.image}" alt="${style.name}" 
                     onerror="this.src='https://placehold.co/200x280/1a1a1a/d4af37?text=Image'">
                <div class="style-card-overlay">
                    <button class="select-style-btn">선택</button>
                </div>
            </div>
            <div class="style-card-name">${style.name}</div>
        </div>
    `).join('');
    
    // 이벤트 리스너
    container.querySelectorAll('.style-card').forEach(card => {
        card.addEventListener('click', () => selectStyle(card.dataset.id));
    });
}

// ===== 스타일 선택 =====
function selectStyle(styleId) {
    const categories = state.data[state.currentGender]?.categories || [];
    const category = categories.find(c => c.id === state.currentCategoryId);
    const style = category?.styles.find(s => s.id === styleId);
    
    if (!style) return;
    
    state.selectedStyle = style;
    
    // UI 업데이트
    $$('.style-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.id === styleId);
    });
    
    updateStyleDisplay();
    updateTransformButton();
}

function updateStyleDisplay() {
    if (state.selectedStyle) {
        $('#style-display-img').src = state.selectedStyle.image;
        $('#style-display-name').textContent = state.selectedStyle.name;
        $('#style-display-placeholder')?.classList.add('hidden');
        $('#style-display-preview')?.classList.remove('hidden');
    } else {
        $('#style-display-placeholder')?.classList.remove('hidden');
        $('#style-display-preview')?.classList.add('hidden');
    }
}

function clearSelectedStyle() {
    state.selectedStyle = null;
    $$('.style-card').forEach(c => c.classList.remove('selected'));
    updateStyleDisplay();
    updateTransformButton();
}

// ===== 변환 버튼 상태 =====
function updateTransformButton() {
    const btn = $('#transform-btn');
    const status = $('#transform-status');
    
    const hasPhoto = state.myPhoto !== null;
    const hasStyle = state.selectedStyle !== null;
    const ready = hasPhoto && hasStyle;
    
    btn.disabled = !ready;
    
    if (!hasPhoto && !hasStyle) {
        status.textContent = '사진과 스타일을 선택하세요';
    } else if (!hasPhoto) {
        status.textContent = '내 사진을 업로드하세요';
    } else if (!hasStyle) {
        status.textContent = '원하는 스타일을 선택하세요';
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
                stylePrompt: state.selectedStyle.prompt || state.selectedStyle.name + ' hairstyle'
            })
        });
        
        updateLoadingStatus('헤어스타일 분석 중...', 40);
        
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'API 오류');
        }
        
        updateLoadingStatus('이미지 생성 중...', 70);
        
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
            updateLoadingStatus('데모 모드 처리 중...', 80);
            await delay(2000);
            updateLoadingStatus('완료!', 100);
            await delay(300);
            return state.myPhoto; // 데모용 원본 반환
        }
        throw error;
    }
}

// ===== 로딩 =====
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
    $('#compare-before-img').src = state.myPhoto;
    $('#compare-after-img').src = state.resultImage;
    
    // 슬라이더 초기화
    $('#slider-handle').style.left = '50%';
    $('.comparison-after').style.clipPath = 'inset(0 50% 0 0)';
    
    // 결과 섹션 표시
    $('#result')?.classList.remove('hidden');
    
    // 스크롤
    $('#result')?.scrollIntoView({ behavior: 'smooth' });
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
    
    slider.addEventListener('mousedown', (e) => {
        isDragging = true;
        updatePosition(e.clientX);
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging) updatePosition(e.clientX);
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    // 터치 이벤트
    slider.addEventListener('touchstart', (e) => {
        isDragging = true;
        updatePosition(e.touches[0].clientX);
    });
    
    document.addEventListener('touchmove', (e) => {
        if (isDragging) updatePosition(e.touches[0].clientX);
    });
    
    document.addEventListener('touchend', () => {
        isDragging = false;
    });
}

// ===== 결과 액션 =====
function downloadResult() {
    if (!state.resultImage) return;
    
    const link = document.createElement('a');
    link.download = `la-vie-en-hair-${Date.now()}.png`;
    link.href = state.resultImage;
    link.click();
}

async function shareResult() {
    if (!state.resultImage) return;
    
    if (navigator.share) {
        try {
            const response = await fetch(state.resultImage);
            const blob = await response.blob();
            const file = new File([blob], 'hairstyle.png', { type: 'image/png' });
            
            await navigator.share({
                title: 'LA VIE EN HAIR AI',
                text: 'AI로 만든 나의 새로운 헤어스타일!',
                files: [file]
            });
        } catch (error) {
            console.log('공유 실패:', error);
        }
    } else {
        alert('이 브라우저에서는 공유 기능을 지원하지 않습니다.');
    }
}

function retryTransform() {
    $('#result')?.classList.add('hidden');
    $('#transform')?.scrollIntoView({ behavior: 'smooth' });
}

// ===== 관리자 모달 =====
function openAdminModal() {
    // 데이터 복사
    state.adminData = JSON.parse(JSON.stringify(state.data));
    state.adminGender = 'male';
    
    // 첫 번째 카테고리 선택
    const firstCat = state.adminData[state.adminGender]?.categories[0];
    state.adminCategoryId = firstCat?.id || null;
    
    // UI 업데이트
    $$('.admin-gender-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.gender === state.adminGender);
    });
    
    renderAdminCategories();
    renderAdminStyles();
    
    $('#admin-modal')?.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeAdminModal() {
    $('#admin-modal')?.classList.add('hidden');
    document.body.style.overflow = '';
    state.adminData = null;
}

function handleAdminGender(btn) {
    state.adminGender = btn.dataset.gender;
    
    $$('.admin-gender-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.gender === state.adminGender);
    });
    
    const firstCat = state.adminData[state.adminGender]?.categories[0];
    state.adminCategoryId = firstCat?.id || null;
    
    renderAdminCategories();
    renderAdminStyles();
}

// ===== 관리자 카테고리 =====
function renderAdminCategories() {
    const container = $('#admin-categories');
    if (!container) return;
    
    const categories = state.adminData[state.adminGender]?.categories || [];
    
    container.innerHTML = categories.map(cat => `
        <div class="admin-category-item ${cat.id === state.adminCategoryId ? 'active' : ''}" 
             data-id="${cat.id}">
            <span>${cat.name}</span>
            <button class="delete-cat-btn" data-id="${cat.id}" title="삭제">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
    
    // 카테고리명 표시
    const current = categories.find(c => c.id === state.adminCategoryId);
    $('#current-category-name').textContent = current ? `- ${current.name}` : '';
    
    // 이벤트 리스너
    container.querySelectorAll('.admin-category-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.closest('.delete-cat-btn')) return;
            state.adminCategoryId = item.dataset.id;
            renderAdminCategories();
            renderAdminStyles();
        });
    });
    
    container.querySelectorAll('.delete-cat-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteCategory(btn.dataset.id);
        });
    });
}

function openCategoryModal() {
    $('#new-category-input').value = '';
    $('#category-modal')?.classList.remove('hidden');
}

function closeCategoryModal() {
    $('#category-modal')?.classList.add('hidden');
}

function addCategory() {
    const name = $('#new-category-input').value.trim();
    if (!name) {
        alert('카테고리 이름을 입력하세요.');
        return;
    }
    
    const gender = state.adminGender;
    const genderPrefix = gender === 'male' ? '남자' : '여자';
    const id = `${gender}-${name}-${Date.now()}`;
    
    if (!state.adminData[gender]) {
        state.adminData[gender] = { categories: [] };
    }
    
    state.adminData[gender].categories.push({
        id: id,
        name: name,
        styles: []
    });
    
    state.adminCategoryId = id;
    
    closeCategoryModal();
    renderAdminCategories();
    renderAdminStyles();
}

function deleteCategory(categoryId) {
    if (!confirm('이 카테고리를 삭제하시겠습니까?\n포함된 모든 스타일도 삭제됩니다.')) {
        return;
    }
    
    const categories = state.adminData[state.adminGender]?.categories || [];
    const index = categories.findIndex(c => c.id === categoryId);
    
    if (index !== -1) {
        categories.splice(index, 1);
        
        // 다른 카테고리 선택
        if (state.adminCategoryId === categoryId) {
            state.adminCategoryId = categories[0]?.id || null;
        }
        
        renderAdminCategories();
        renderAdminStyles();
    }
}

// ===== 관리자 스타일 =====
function renderAdminStyles() {
    const container = $('#admin-styles');
    if (!container) return;
    
    const categories = state.adminData[state.adminGender]?.categories || [];
    const category = categories.find(c => c.id === state.adminCategoryId);
    const styles = category?.styles || [];
    
    if (styles.length === 0) {
        container.innerHTML = `
            <div class="admin-styles-empty">
                <p>스타일이 없습니다.</p>
                <p>위의 "스타일 추가" 버튼을 클릭하세요.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = styles.map((style, index) => `
        <div class="admin-style-item" data-index="${index}">
            <img src="${style.image}" alt="${style.name}"
                 onerror="this.src='https://placehold.co/100x140/1a1a1a/d4af37?text=Error'">
            <span class="style-name">${style.name}</span>
            <button class="delete-style-btn" data-index="${index}">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
    
    container.querySelectorAll('.delete-style-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            deleteStyle(parseInt(btn.dataset.index));
        });
    });
}

function handleAdminStyleUpload(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    if (!state.adminCategoryId) {
        alert('먼저 카테고리를 선택하거나 추가하세요.');
        return;
    }
    
    const categories = state.adminData[state.adminGender]?.categories || [];
    const category = categories.find(c => c.id === state.adminCategoryId);
    
    if (!category) {
        alert('카테고리를 찾을 수 없습니다.');
        return;
    }
    
    // 성별 + 카테고리 이름으로 스타일 이름 생성
    const genderName = state.adminGender === 'male' ? '남자' : '여자';
    const categoryName = category.name;
    
    files.forEach((file, fileIndex) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            // 현재 스타일 개수 + 1 = 새 번호
            const styleNumber = category.styles.length + 1;
            const styleName = `${genderName} ${categoryName} ${styleNumber}`;
            
            const newStyle = {
                id: `style-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                name: styleName,
                image: ev.target.result,
                prompt: `${styleName} hairstyle, professional salon quality`
            };
            
            category.styles.push(newStyle);
            renderAdminStyles();
        };
        reader.readAsDataURL(file);
    });
    
    e.target.value = '';
}

function deleteStyle(index) {
    const categories = state.adminData[state.adminGender]?.categories || [];
    const category = categories.find(c => c.id === state.adminCategoryId);
    
    if (category && category.styles[index]) {
        category.styles.splice(index, 1);
        
        // 이름 재정렬
        const genderName = state.adminGender === 'male' ? '남자' : '여자';
        const categoryName = category.name;
        
        category.styles.forEach((style, i) => {
            style.name = `${genderName} ${categoryName} ${i + 1}`;
        });
        
        renderAdminStyles();
    }
}

function saveAdminChanges() {
    state.data = state.adminData;
    saveData();
    
    // 현재 선택된 성별/카테고리 업데이트
    const firstCat = state.data[state.currentGender]?.categories[0];
    state.currentCategoryId = firstCat?.id || null;
    
    // UI 다시 렌더링
    renderCategoryTabs();
    renderStylesGrid();
    
    closeAdminModal();
    alert('✅ 저장되었습니다!');
}

// ===== 완료 =====
console.log('📦 app.js 로드 완료');
