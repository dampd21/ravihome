const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const { sourceImage, styleImage, styleName, stylePrompt } = JSON.parse(event.body);

        if (!sourceImage) {
            throw new Error('Source image is required');
        }

        const result = await transformWithGemini(sourceImage, styleImage, styleName, stylePrompt);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, result })
        };

    } catch (error) {
        console.error('Transform error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, error: error.message })
        };
    }
};

async function transformWithGemini(sourceImage, styleImage, styleName, stylePrompt) {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash-exp-image-generation",
        generationConfig: {
            responseModalities: ["image", "text"],
        }
    });

    const sourceBase64 = sourceImage.replace(/^data:image\/\w+;base64,/, '');
    const sourceMime = sourceImage.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';

    const prompt = `Transform this person's hairstyle to "${styleName}".

Style details: ${stylePrompt}

IMPORTANT RULES:
1. Keep the EXACT SAME FACE - do not change facial features
2. Keep the same skin tone and complexion
3. Keep the same clothing and background
4. Only change the HAIR - style, cut, color as specified
5. Make it look natural and professional like a salon photo
6. Maintain photo quality and lighting

Generate a photorealistic result.`;

    const imageParts = [{
        inlineData: { mimeType: sourceMime, data: sourceBase64 }
    }];

    if (styleImage && styleImage.startsWith('data:')) {
        const styleBase64 = styleImage.replace(/^data:image\/\w+;base64,/, '');
        const styleMime = styleImage.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';
        
        imageParts.push({
            inlineData: { mimeType: styleMime, data: styleBase64 }
        });
    }

    try {
        const response = await model.generateContent([prompt, ...imageParts]);
        const result = response.response;

        if (result.candidates?.[0]?.content?.parts) {
            for (const part of result.candidates[0].content.parts) {
                if (part.inlineData?.data) {
                    const mimeType = part.inlineData.mimeType || 'image/png';
                    return `data:${mimeType};base64,${part.inlineData.data}`;
                }
            }
        }

        // 이미지 생성 실패 시 원본 반환 (폴백)
        console.log('No image generated, returning source');
        return sourceImage;

    } catch (error) {
        console.error('Gemini error:', error);
        return sourceImage;
    }
}
