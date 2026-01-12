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
        model: "gemini-2.0-flash-exp",
        generationConfig: {
            responseModalities: ["image", "text"],
        
