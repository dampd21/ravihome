// Hugging Face API (완전 무료) 사용
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;

exports.handler = async (event, context) => {
    // CORS 헤더
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // OPTIONS 요청 처리
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
        const { sourceImage, styleImage, stylePrompt, provider } = JSON.parse(event.body);

        let result;
        
        if (provider === 'huggingface') {
            result = await transformWithHuggingFace(sourceImage, styleImage, stylePrompt);
        } else if (provider === 'replicate') {
            result = await transformWithReplicate(sourceImage, styleImage, stylePrompt);
        } else {
            // 기본: Hugging Face (무료)
            result = await transformWithHuggingFace(sourceImage, styleImage, stylePrompt);
        }

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
            body: JSON.stringify({ error: error.message })
        };
    }
};

// Hugging Face - 완전 무료!
async function transformWithHuggingFace(sourceImage, styleImage, stylePrompt) {
    // IP-Adapter 또는 InstantID 모델 사용
    const response = await fetch(
        "https://api-inference.huggingface.co/models/InstantX/InstantID",
        {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                inputs: {
                    image: sourceImage,
                    prompt: `person with ${stylePrompt}, same face, professional hair salon photo, high quality, detailed`,
                    negative_prompt: "blurry, bad quality, distorted face"
                }
            })
        }
    );

    if (!response.ok) {
        // 폴백: img2img 모델
        return await fallbackTransform(sourceImage, stylePrompt);
    }

    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:image/png;base64,${base64}`;
}

// 폴백 - Stable Diffusion img2img
async function fallbackTransform(sourceImage, stylePrompt) {
    const response = await fetch(
        "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-refiner-1.0",
        {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                inputs: `portrait photo, ${stylePrompt}, professional photography, high quality`,
                parameters: {
                    negative_prompt: "blurry, bad quality, cartoon",
                    num_inference_steps: 30
                }
            })
        }
    );

    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:image/png;base64,${base64}`;
}

// Replicate - 고품질 (유료, $5 무료 크레딧)
async function transformWithReplicate(sourceImage, styleImage, stylePrompt) {
    // 1. 예측 생성
    const createResponse = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
            "Authorization": `Token ${REPLICATE_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            // InstantID 모델
            version: "c4c8e65c9c4b9d6ab9c56a5e0f0e5c0f0e5c0f0e5", // 실제 버전으로 교체 필요
            input: {
                image: sourceImage,
                prompt: `person with ${stylePrompt}, same face identity, professional hair salon result`,
                negative_prompt: "blurry, bad quality, different person",
                ip_adapter_scale: 0.8,
                controlnet_conditioning_scale: 0.8
            }
        })
    });

    const prediction = await createResponse.json();
    
    // 2. 결과 폴링
    let result = await pollReplicate(prediction.urls.get);
    return result;
}

async function pollReplicate(url) {
    for (let i = 0; i < 60; i++) {
        const response = await fetch(url, {
            headers: { "Authorization": `Token ${REPLICATE_API_KEY}` }
        });
        const result = await response.json();
        
        if (result.status === 'succeeded') {
            return result.output[0] || result.output;
        } else if (result.status === 'failed') {
            throw new Error('Transform failed');
        }
        
        await new Promise(r => setTimeout(r, 1000));
    }
    throw new Error('Timeout');
}
