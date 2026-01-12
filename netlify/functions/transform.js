exports.handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    // Check API Key
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        console.error('GEMINI_API_KEY is not set');
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false,
                error: 'API key not configured' 
            })
        };
    }

    try {
        const { userPhoto, stylePhoto, styleName } = JSON.parse(event.body);

        if (!userPhoto || !stylePhoto) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ success: false, error: 'Missing required images' })
            };
        }

        // Extract base64 data
        const userImageData = userPhoto.replace(/^data:image\/\w+;base64,/, '');
        const styleImageData = stylePhoto.replace(/^data:image\/\w+;base64,/, '');

        console.log('Starting transformation...');

        const prompt = `You are an expert hairstyle transformation AI. 

Look at these two images:
1. First image: A person's photo (keep this face exactly)
2. Second image: A hairstyle reference (copy this hairstyle)

Generate a new photorealistic image where:
- The person's face, skin, expression stay EXACTLY the same
- ONLY change the hair to match the reference hairstyle
- Match the hair color, length, texture, and style from the reference
- Keep original photo's background and lighting
- Make it look completely natural and realistic

Output a single transformed image.`;

        // Request body for Gemini 2.0 Flash with image generation
        const requestBody = {
            contents: [
                {
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: "image/jpeg",
                                data: userImageData
                            }
                        },
                        {
                            inlineData: {
                                mimeType: "image/jpeg",
                                data: styleImageData
                            }
                        }
                    ]
                }
            ],
            generationConfig: {
                responseModalities: ["image", "text"],
                temperature: 0.4
            }
        };

        console.log('Calling Gemini API...');

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            }
        );

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API error:', errorText);
            
            // Fallback: return style image as preview
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    image: stylePhoto,
                    demo: true,
                    message: 'Preview mode - showing selected style'
                })
            };
        }

        const data = await response.json();
        console.log('Response received, parsing...');

        // Extract generated image
        let generatedImage = null;

        if (data.candidates && data.candidates[0]?.content?.parts) {
            for (const part of data.candidates[0].content.parts) {
                if (part.inlineData?.data) {
                    const mimeType = part.inlineData.mimeType || 'image/png';
                    generatedImage = `data:${mimeType};base64,${part.inlineData.data}`;
                    console.log('Image generated successfully!');
                    break;
                }
            }
        }

        if (!generatedImage) {
            console.log('No image in response');
            
            // Check for text response or blocked content
            if (data.candidates?.[0]?.finishReason === 'SAFETY') {
                console.log('Content blocked by safety filters');
            }
            
            // Return style image as fallback
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    image: stylePhoto,
                    demo: true,
                    message: 'Showing style preview'
                })
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                image: generatedImage
            })
        };

    } catch (error) {
        console.error('Error:', error.message);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Transform failed: ' + error.message
            })
        };
    }
};
