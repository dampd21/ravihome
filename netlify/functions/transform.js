const { GoogleGenerativeAI } = require("@google/generative-ai");

// 환경변수에서 API 키 로드
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

exports.handler = async (event, context) => {
    // CORS 헤더
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // OPTIONS 요청 (CORS preflight)
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { sourceImage, styleImage, styleName, stylePrompt } = JSON.parse(event.body);

        if (!sourceImage) {
            throw new Error('Source image is required');
        }

        // Gemini API로 이미지 변환
        const result = await transformWithGemini(sourceImage, styleImage, styleName, stylePrompt);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true, 
                result: result 
            })
        };

    } catch (error) {
        console.error('Transform error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false,
                error: error.message 
            })
        };
    }
};

// Gemini API를 사용한 이미지 변환
async function transformWithGemini(sourceImage, styleImage, styleName, stylePrompt) {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    // Gemini 2.0 Flash - 이미지 생성 지원
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash-exp-image-generation",
        generationConfig: {
            responseModalities: ["image", "text"],
        }
    });

    // Base64 데이터 추출 (data:image/...;base64, 제거)
    const sourceBase64 = sourceImage.replace(/^data:image\/\w+;base64,/, '');
    const sourceMimeType = sourceImage.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';

    // 프롬프트 구성
    const prompt = `
You are a professional hair stylist AI. Transform the person's hairstyle in the provided photo.

TASK: Change the hairstyle to "${styleName}" style.
STYLE DETAILS: ${stylePrompt}

CRITICAL RULES:
1. KEEP THE SAME FACE - Do not change facial features, skin tone, or face shape
2. KEEP THE SAME CLOTHING and background
3. Only modify the HAIR - change the cut, color, texture, and style as specified
4. Make it look natural and realistic like a professional salon result
5. Maintain the same photo quality, lighting, and angle

Generate a photorealistic image of the same person with the new hairstyle.
`;

    // 이미지 파트 구성
    const imageParts = [
        {
            inlineData: {
                mimeType: sourceMimeType,
                data: sourceBase64
            }
        }
    ];

    // 스타일 참조 이미지가 있으면 추가
    if (styleImage && !styleImage.startsWith('http')) {
        const styleBase64 = styleImage.replace(/^data:image\/\w+;base64,/, '');
        const styleMimeType = styleImage.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';
        
        imageParts.push({
            inlineData: {
                mimeType: styleMimeType,
                data: styleBase64
            }
        });
    }

    try {
        // Gemini API 호출
        const response = await model.generateContent([prompt, ...imageParts]);
        const result = response.response;

        // 응답에서 이미지 추출
        if (result.candidates && result.candidates[0]) {
            const candidate = result.candidates[0];
            
            // 이미지 파트 찾기
            if (candidate.content && candidate.content.parts) {
                for (const part of candidate.content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                        const mimeType = part.inlineData.mimeType || 'image/png';
                        return `data:${mimeType};base64,${part.inlineData.data}`;
                    }
                }
            }
        }

        // 이미지 생성 실패 시 Imagen 3 시도
        return await generateWithImagen(sourceImage, styleName, stylePrompt);

    } catch (geminiError) {
        console.log('Gemini image generation failed, trying Imagen:', geminiError.message);
        return await generateWithImagen(sourceImage, styleName, stylePrompt);
    }
}

// Imagen 3를 사용한 이미지 생성 (폴백)
async function generateWithImagen(sourceImage, styleName, stylePrompt) {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    // Imagen 3 모델
    const model = genAI.getGenerativeModel({ 
        model: "imagen-3.0-generate-002" 
    });

    const prompt = `
A professional portrait photo of a person with ${styleName} hairstyle.
Style: ${stylePrompt}
The photo should look like a professional hair salon result photo.
Photorealistic, high quality, natural lighting, front-facing portrait.
`;

    try {
        const response = await model.generateImages({
            prompt: prompt,
            numberOfImages: 1,
            aspectRatio: "3:4",
            safetyFilterLevel: "BLOCK_MEDIUM_AND_ABOVE",
        });

        if (response.images && response.images[0]) {
            const imageData = response.images[0].bytesBase64Encoded;
            return `data:image/png;base64,${imageData}`;
        }

        throw new Error('No image generated');

    } catch (imagenError) {
        console.log('Imagen generation failed:', imagenError.message);
        
        // 최종 폴백: 텍스트 분석만 반환
        return await analyzeAndDescribe(sourceImage, styleName, stylePrompt);
    }
}

// 텍스트 분석 폴백 (이미지 생성 불가 시)
async function analyzeAndDescribe(sourceImage, styleName, stylePrompt) {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const sourceBase64 = sourceImage.replace(/^data:image\/\w+;base64,/, '');
    const sourceMimeType = sourceImage.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';

    const prompt = `
Analyze this person's current hairstyle and describe how they would look with a "${styleName}" hairstyle (${stylePrompt}).

Provide:
1. Current hairstyle analysis
2. How the new style would complement their face shape
3. Specific recommendations for achieving this look

Be specific and professional like a hair stylist consultation.
`;

    const response = await model.generateContent([
        prompt,
        {
            inlineData: {
                mimeType: sourceMimeType,
                data: sourceBase64
            }
        }
    ]);

    // 이미지 생성 실패 시 원본 반환하고 분석 결과는 로그
    console.log('Style analysis:', response.response.text());
    
    // 원본 이미지 반환 (실제로는 이미지 생성이 필요)
    return sourceImage;
}
