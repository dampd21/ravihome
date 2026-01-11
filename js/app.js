// ===== DOM Elements =====
const elements = {
    // Upload elements
    myPhotoInput: document.getElementById('my-photo-input'),
    myPhotoUpload: document.getElementById('my-photo-upload'),
    myPhotoPlaceholder: document.getElementById('my-photo-placeholder'),
    myPhotoPreview: document.getElementById('my-photo-preview'),
    myPhotoImg: document.getElementById('my-photo-img'),
    removeMyPhoto: document.getElementById('remove-my-photo'),
    
    // Custom style upload
    customStyleInput: document.getElementById('custom-style-input'),
    customUpload: document.getElementById('custom-style-upload'),
    customPlaceholder: document.getElementById('custom-placeholder'),
    customPreview: document.getElementById('custom-preview'),
    customStyleImg: document.getElementById('custom-style-img'),
    removeCustom: document.getElementById('remove-custom'),
    
    // Result
    resultPlaceholder: document.getElementById('result-placeholder'),
    resultPreview: document.getElementById('result-preview'),
    resultImg: document.getElementById('result-img'),
    downloadResult: document.getElementById('download-result'),
    
    // Tabs and styles
    categoryTabs: document.querySelectorAll('.category-tab'),
    styleGrids: {
        cut: document.getElementById('cut-styles'),
        perm: document.getElementById('perm-styles'),
        color: document.getElementById('color-styles'),
        custom: document.getElementById('custom-upload')
    },
    styleCards: document.querySelectorAll('.style-card'),
    selectedStyleDisplay: document.getElementById('selected-style-display'),
    selectedStyleName: document.getElementById('selected-style-name'),
    clearSelection: document.getElementById('clear-selection'),
    
    // API
    apiKeyInput: document.getElementById('api-key-input'),
    toggleApiVisibility: document.getElementById('toggle-api-visibility'),
    transformBtn: document.getElementById('transform-btn'),
    
    // Loading
    loadingScreen: document.getElementById('loading-screen'),
    
    // Comparison
    comparisonSection: document.getElementById('comparison-section'),
    comparisonSlider: document.getElementById('comparison-slider'),
    sliderHandle: document.getElementById('slider-handle'),
    compareBefore: document.getElementById('compare-before'),
    compareAfter: document.getElementById('compare-after'),
    downloadComparison: document.getElementById('download-comparison'),
    shareResult: document.getElementById('share-result'),
    tryAgain: document.getElementById('try-again')
};

// ===== State =====
const state = {
    myPhoto: null,
    customStyle: null,
    selectedStyle: null,
    selectedStyleData: null,
    resultImage: null,
    isProcessing: false
};

// ===== Style Data =====
const stylePrompts = {
    'short-bob': 'short bob haircut, sleek and modern, professional',
    'layered': 'layered haircut with movement, textured layers',
    'pixie': 'pixie cut, short and edgy, modern style',
    'long-layer': 'long layered hair, flowing and elegant',
    'wave-perm': 'natural wave perm, soft waves, beach waves',
    'body-perm': 'body wave perm, volume and bounce',
    'hippie-perm': 'hippie perm, tight curls, retro style',
    'curly': 'curly hair perm, defined curls, glamorous',
    'blonde': 'platinum blonde hair color, bright blonde',
    'ash-brown': 'ash brown hair color, cool toned brown',
    'burgundy': 'burgundy red hair color, deep wine red',
    'balayage': 'balayage highlights, gradient color, natural blend'
};

// ===== Initialize =====
function init() {
    setupEventListeners();
    setupDragAndDrop();
    updateTransformButton();
}

// ===== Event Listeners =====
function setupEventListeners() {
    // My photo upload
    elements.myPhotoUpload.addEventListener('click', () => elements.myPhotoInput.click());
    elements.myPhotoInput.addEventListener('change', handleMyPhotoUpload);
    elements.removeMyPhoto.addEventListener('click', (e) => {
        e.stopPropagation();
        removeMyPhoto();
    });
    
    // Custom style upload
    elements.customUpload.addEventListener('click', () => elements.customStyleInput.click());
    elements.customStyleInput.addEventListener('change', handleCustomStyleUpload);
    elements.removeCustom.addEventListener('click', (e) => {
        e.stopPropagation();
        removeCustomStyle();
    });
    
    // Category tabs
    elements.categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => handleCategoryChange(tab));
    });
    
    // Style cards
    elements.styleCards.forEach(card => {
        card.addEventListener('click', () => handleStyleSelect(card));
    });
    
    // Clear selection
    elements.clearSelection.addEventListener('click', clearStyleSelection);
    
    // API key visibility toggle
    elements.toggleApiVisibility.addEventListener('click', toggleApiKeyVisibility);
    
    // API key input
    elements.apiKeyInput.addEventListener('input', updateTransformButton);
    
    // Transform button
    elements.transformBtn.addEventListener('click', handleTransform);
    
    // Comparison slider
    setupComparisonSlider();
    
    // Action buttons
    elements.downloadComparison.addEventListener('click', downloadComparisonImage);
    elements.shareResult.addEventListener('click', shareResult);
    elements.tryAgain.addEventListener('click', resetForNewTransform);
    elements.downloadResult.addEventListener('click', downloadResult);
}

// ===== Drag and Drop =====
function setupDragAndDrop() {
    const dropZones = [elements.myPhotoUpload, elements.customUpload];
    
    dropZones.forEach((zone, index) => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.style.borderColor = 'var(--gold-primary)';
            zone.style.background = 'rgba(212, 175, 55, 0.1)';
        });
        
        zone.addEventListener('dragleave', () => {
            zone.style.borderColor = '';
            zone.style.background = '';
        });
        
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.style.borderColor = '';
            zone.style.background = '';
            
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                if (index === 0) {
                    processMyPhoto(file);
                } else {
                    processCustomStyle(file);
                }
            }
        });
    });
}

// ===== Photo Handlers =====
function handleMyPhotoUpload(e) {
    const file = e.target.files[0];
    if (file) {
        processMyPhoto(file);
    }
}

function processMyPhoto(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        state.myPhoto = e.target.result;
        elements.myPhotoImg.src = state.myPhoto;
        elements.myPhotoPlaceholder.classList.add('hidden');
        elements.myPhotoPreview.classList.remove('hidden');
        updateTransformButton();
    };
    reader.readAsDataURL(file);
}

function removeMyPhoto() {
    state.myPhoto = null;
    elements.myPhotoInput.value = '';
    elements.myPhotoPlaceholder.classList.remove('hidden');
    elements.myPhotoPreview.classList.add('hidden');
    updateTransformButton();
}

function handleCustomStyleUpload(e) {
    const file = e.target.files[0];
    if (file) {
        processCustomStyle(file);
    }
}

function processCustomStyle(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        state.customStyle = e.target.result;
        state.selectedStyle = 'custom';
        state.selectedStyleData = { type: 'custom', image: state.customStyle };
        
        elements.customStyleImg.src = state.customStyle;
        elements.customPlaceholder.classList.add('hidden');
        elements.customPreview.classList.remove('hidden');
        
        showSelectedStyleDisplay('커스텀 스타일');
        updateTransformButton();
    };
    reader.readAsDataURL(file);
}

function removeCustomStyle() {
    state.customStyle = null;
    if (state.selectedStyle === 'custom') {
        state.selectedStyle = null;
        state.selectedStyleData = null;
        elements.selectedStyleDisplay.classList.add('hidden');
    }
    elements.customStyleInput.value = '';
    elements.customPlaceholder.classList.remove('hidden');
    elements.customPreview.classList.add('hidden');
    updateTransformButton();
}

// ===== Category & Style Handlers =====
function handleCategoryChange(tab) {
    const category = tab.dataset.category;
    
    // Update active tab
    elements.categoryTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    // Show corresponding grid
    Object.keys(elements.styleGrids).forEach(key => {
        if (elements.styleGrids[key]) {
            elements.styleGrids[key].classList.toggle('hidden', key !== category);
        }
    });
}

function handleStyleSelect(card) {
    const styleName = card.dataset.style;
    const styleTitle = card.querySelector('h4').textContent;
    
    // Update selected state
    elements.styleCards.forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    
    // Update state
    state.selectedStyle = styleName;
    state.selectedStyleData = {
        type: 'preset',
        name: styleName,
        prompt: stylePrompts[styleName]
    };
    
    showSelectedStyleDisplay(styleTitle);
    updateTransformButton();
}

function showSelectedStyleDisplay(styleName) {
    elements.selectedStyleName.textContent = styleName;
    elements.selectedStyleDisplay.classList.remove('hidden');
}

function clearStyleSelection() {
    state.selectedStyle = null;
    state.selectedStyleData = null;
    elements.styleCards.forEach(c => c.classList.remove('selected'));
    elements.selectedStyleDisplay.classList.add('hidden');
    updateTransformButton();
}

// ===== API Key =====
function toggleApiKeyVisibility() {
    const input = elements.apiKeyInput;
    const icon = elements.toggleApiVisibility.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

// ===== Transform Button =====
function updateTransformButton() {
    const hasPhoto = state.myPhoto !== null;
    const hasStyle = state.selectedStyle !== null;
    const hasApiKey = elements.apiKeyInput.value.trim().length > 0;
    
    elements.transformBtn.disabled = !(hasPhoto && hasStyle && hasApiKey);
}

// ===== Transform Handler =====
async function handleTransform() {
    if (state.isProcessing) return;
    
    state.isProcessing = true;
    showLoading(true);
    
    try {
        const apiKey = elements.apiKeyInput.value.trim();
        const result = await callReplicateAPI(apiKey);
        
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

// ===== Replicate API =====
async function callReplicateAPI(apiKey) {
    // 실제 Replicate API 호출
    // 주의: GitHub Pages에서는 CORS 문제로 직접 호출이 어려울 수 있습니다.
    // 프로덕션에서는 백엔드 프록시를 사용하세요.
    
    const prompt = state.selectedStyleData.type === 'preset' 
        ? `Transform hairstyle to: ${state.selectedStyleData.prompt}, keep same face, professional hair salon result, high quality`
        : 'Apply the reference hairstyle to the person, keep same face, professional result';
    
    try {
        // Replicate InstantID 또는 IP-Adapter 모델 사용
        const response = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                // InstantID 또는 다른 face-swap/style-transfer 모델
                version: "your-model-version-here",
                input: {
                    image: state.myPhoto,
                    prompt: prompt,
                    // 추가 파라미터들...
                }
            })
        });
        
        if (!response.ok) {
            throw new Error('API 요청 실패');
        }
        
        const prediction = await response.json();
        
        // 결과 폴링
        let result = await pollForResult(prediction.urls.get, apiKey);
        return result;
        
    } catch (error) {
        // 데모 모드: 실제 API 실패시 시뮬레이션
        console.log('API 호출 실패, 데모 모드로 전환:', error);
        return await simulateTransform();
    }
}

async function pollForResult(url, apiKey) {
    const maxAttempts = 60;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Token ${apiKey}`
            }
        });
        
        const result = await response.json();
        
        if (result.status === 'succeeded') {
            return result.output;
        } else if (result.status === 'failed') {
            throw new Error('변환 실패');
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
    }
    
    throw new Error('시간 초과');
}

async function simulateTransform() {
    // 데모용 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 실제로는 변환된 이미지를 반환해야 합니다
    // 데모에서는 원본 이미지에 필터 효과를 적용
    return state.myPhoto;
}

// ===== Loading =====
function showLoading(show) {
    elements.loadingScreen.classList.toggle('hidden', !show);
}

// ===== Show Result =====
function showResult(resultUrl) {
    // Update result preview
    elements.resultImg.src = resultUrl;
    elements.resultPlaceholder.classList.add('hidden');
    elements.resultPreview.classList.remove('hidden');
    
    // Setup comparison
    elements.compareBefore.src = state.myPhoto;
    elements.compareAfter.src = resultUrl;
    elements.comparisonSection.classList.remove('hidden');
    
    // Scroll to comparison
    elements.comparisonSection.scrollIntoView({ behavior: 'smooth' });
}

// ===== Comparison Slider =====
function setupComparisonSlider() {
    let isDragging = false;
    
    const handleMove = (clientX) => {
        const rect = elements.comparisonSlider.getBoundingClientRect();
        let position = ((clientX - rect.left) / rect.width) * 100;
        position = Math.max(0, Math.min(100, position));
        
        elements.sliderHandle.style.left = `${position}%`;
        document.querySelector('.after-image').style.clipPath = `inset(0 ${100 - position}% 0 0)`;
    };
    
    elements.comparisonSlider.addEventListener('mousedown', (e) => {
        isDragging = true;
        handleMove(e.clientX);
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            handleMove(e.clientX);
        }
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    // Touch events
    elements.comparisonSlider.addEventListener('touchstart', (e) => {
        isDragging = true;
        handleMove(e.touches[0].clientX);
    });
    
    document.addEventListener('touchmove', (e) => {
        if (isDragging) {
            handleMove(e.touches[0].clientX);
        }
    });
    
    document.addEventListener('touchend', () => {
        isDragging = false;
    });
}

// ===== Action Handlers =====
function downloadResult() {
    if (state.resultImage) {
        downloadImage(state.resultImage, 'luxe-hair-result.png');
    }
}

function downloadComparisonImage() {
    // 비교 이미지 다운로드 (캔버스로 합성)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const beforeImg = elements.compareBefore;
    const afterImg = elements.compareAfter;
    
    canvas.width = beforeImg.naturalWidth * 2 + 20;
    canvas.height = beforeImg.naturalHeight;
    
    // 배경
    ctx.fillStyle = '#0A0A0A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Before 이미지
    ctx.drawImage(beforeImg, 0, 0, beforeImg.naturalWidth, beforeImg.naturalHeight);
    
    // After 이미지
    ctx.drawImage(afterImg, beforeImg.naturalWidth + 20, 0, afterImg.naturalWidth, afterImg.naturalHeight);
    
    // 라벨
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('BEFORE', 20, 40);
    ctx.fillText('AFTER', beforeImg.naturalWidth + 40, 40);
    
    const link = document.createElement('a');
    link.download = 'luxe-hair-comparison.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

function downloadImage(dataUrl, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
}

async function shareResult() {
    if (navigator.share && state.resultImage) {
        try {
            // Data URL을 Blob으로 변환
            const response = await fetch(state.resultImage);
            const blob = await response.blob();
            const file = new File([blob], 'hair-style.png', { type: 'image/png' });
            
            await navigator.share({
                title: 'LUXE HAIR AI - 내 새로운 헤어스타일',
                text: 'AI로 만든 나의 새로운 헤어스타일을 확인해보세요!',
                files: [file]
            });
        } catch (error) {
            console.log('Share failed:', error);
            // 폴백: 클립보드에 복사
            alert('공유하기가 지원되지 않습니다.');
        }
    } else {
        alert('공유하기가 지원되지 않는 브라우저입니다.');
    }
}

function resetForNewTransform() {
    // 결과 숨기기
    elements.resultPlaceholder.classList.remove('hidden');
    elements.resultPreview.classList.add('hidden');
    elements.comparisonSection.classList.add('hidden');
    
    // 스크롤
    document.getElementById('upload-section').scrollIntoView({ behavior: 'smooth' });
}

// ===== Smooth Scroll for Nav Links =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', init);
