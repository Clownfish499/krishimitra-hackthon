const axios = require('axios');

// Read keys dynamically instead of at module load time, 
// to ensure dotenv has fully populated the environment.

async function callAI(messages, useJSON = false) {
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    // Try OpenRouter first
    if (OPENROUTER_API_KEY) {
        // Try a list of potential models in case one is unavailable
        const models = [
            'google/gemini-2.0-flash-001',
            'google/gemini-flash-1.5',
            'google/gemini-2.0-flash-exp:free', // Keeping as fallback
            'openai/gpt-3.5-turbo'
        ];

        for (const model of models) {
            try {
                const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                    model,
                    messages,
                    temperature: 0.4,
                    response_format: useJSON ? { type: 'json_object' } : undefined
                }, {
                    headers: {
                        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'http://localhost:5173',
                        'X-Title': 'KrishiMitra AI'
                    },
                    timeout: 20000
                });
                return response.data.choices[0].message.content;
            } catch (err) {
                console.warn(`OpenRouter model ${model} failed:`, err.response?.data?.error?.message || err.message);
                // Continue to next model
            }
        }
    }

    // Try OpenAI
    if (OPENAI_API_KEY) {
        try {
            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-3.5-turbo',
                messages,
                temperature: 0.4,
                response_format: useJSON ? { type: 'json_object' } : undefined
            }, {
                headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' }
            });
            return response.data.choices[0].message.content;
        } catch (err) {
            console.error('OpenAI API request failed:', err.response?.data || err.message);
        }
    }

    throw new Error('All configured AI API providers failed to respond successfully. Please check your API keys and quotas.');
}

async function chat(systemPrompt, userMessage, history = []) {
    const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-10),
        { role: 'user', content: userMessage }
    ];
    return await callAI(messages);
}

async function generateJSON(prompt) {
    const messages = [
        { role: 'system', content: 'You are an expert AI assistant. Always respond with valid JSON only. No markdown, no explanation, just JSON.' },
        { role: 'user', content: prompt }
    ];

    try {
        const raw = await callAI(messages, true);
        const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleaned);
    } catch (err) {
        console.warn('AI API failed, using fallback mock response:', err.message);

        // Fallback: If it's a crop recommendation prompt, extract the DB crops from the prompt itself
        if (prompt.includes('Available Crops in Database')) {
            const cropsSection = prompt.split('Available Crops in Database')[1];
            const lines = cropsSection.split('\n');
            const cropLines = lines.filter(l => l.trim().startsWith('- '));

            // Parse crops into objects with profitability score
            const parsedCrops = cropLines.map(line => {
                // Example line: "- Rice (Hi: चावल, Kn: ಅಕ್ಕಿ) | Yield: 15-25 qtl/acre | Price: ₹1800-2500/qtl | Duration: 120 days"
                const parts = line.split('|');

                // Name extraction
                let nameEn = 'Unknown';
                let nameHi = '';
                let nameKn = '';
                const namePart = parts[0] || '';
                const parenMatch = namePart.match(/\(Hi:\s*([^,]+),\s*Kn:\s*([^)]+)\)/);
                if (parenMatch) {
                    nameHi = parenMatch[1].trim();
                    nameKn = parenMatch[2].trim();
                    nameEn = namePart.replace(parenMatch[0], '').replace('- ', '').trim();
                } else {
                    nameEn = namePart.replace('- ', '').trim();
                }

                // Profitability calculation (Yield * Price)
                const yieldPart = parts[1] || '';
                const pricePart = parts[2] || '';

                const yieldMatch = yieldPart.match(/\d+/g);
                const yieldAvg = yieldMatch ? (parseInt(yieldMatch[0]) + parseInt(yieldMatch[1] || yieldMatch[0])) / 2 : 0;

                const priceMatch = pricePart.match(/\d+/g);
                const priceAvg = priceMatch ? (parseInt(priceMatch[0]) + parseInt(priceMatch[1] || priceMatch[0])) / 2 : 0;

                const profitScore = yieldAvg * priceAvg;

                return {
                    name: nameEn,
                    nameHi: nameHi,
                    nameKn: nameKn,
                    suitabilityScore: 0, // Will be set after sorting
                    profitability: profitScore,
                    estimatedYield: yieldPart.replace('Yield:', '').trim() || 'N/A',
                    estimatedProfit: pricePart.replace('Price:', '').trim() || 'N/A',
                    growthDuration: (parts[3] || '').replace('Duration:', '').trim() || 'N/A',
                    waterRequirement: "Medium",
                    bestSowingMonth: "Based on season",
                    riskLevel: profitScore > 100000 ? "Medium" : "Low", // Higher profit = slightly higher risk
                    tips: ["Ensure proper irrigation", "Monitor for pests regularly", "Use recommended fertilizer dose"]
                };
            });

            // Sort by highest profitability first, then assign descending suitability scores
            parsedCrops.sort((a, b) => b.profitability - a.profitability);

            return parsedCrops.slice(0, 5).map((crop, index) => {
                // Top crop gets 95-99%, next gets 90-95%, etc.
                const baseScore = 95 - (index * 6);
                crop.suitabilityScore = baseScore + Math.floor(Math.random() * 4);
                delete crop.profitability; // remove temporary field before sending
                return crop;
            });
        }

        // Generic fallback for other JSON requests

        // Fallback for Fertilizer Recommendations
        if (prompt.toLowerCase().includes('recommend fertilizers for')) {
            return {
                npkRecommendation: {
                    n: Math.floor(Math.random() * 50) + 100,
                    p: Math.floor(Math.random() * 30) + 40,
                    k: Math.floor(Math.random() * 20) + 30
                },
                fertilizers: [
                    { name: 'Urea', quantity: '45 kg/acre', timing: 'Split into two doses: Basal and 30 days', cost: '₹266/bag' },
                    { name: 'DAP (Diammonium Phosphate)', quantity: '50 kg/acre', timing: 'At the time of sowing', cost: '₹1350/bag' },
                    { name: 'MOP (Muriate of Potash)', quantity: '20 kg/acre', timing: 'Basal dose', cost: '₹1700/bag' }
                ],
                organicAlternatives: [
                    { name: 'Vermicompost', quantity: '2-3 tons/acre', benefit: 'Improves soil health and water retention' },
                    { name: 'Neem Cake', quantity: '100 kg/acre', benefit: 'Acts as organic fertilizer and pest repellent' }
                ],
                applicationSchedule: [
                    'Base: Apply 100% of DAP, 100% MOP, and 50% Urea at sowing.',
                    'Top Dressing 1: Apply 25% Urea after 30 days.',
                    'Top Dressing 2: Apply remaining 25% Urea after 45-60 days based on crop stage.'
                ],
                tips: [
                    'Mix fertilizers slightly deep into the soil for better absorption.',
                    'Do not apply urea when leaves are wet to prevent scorching.',
                    'Test your soil every 2 years to apply the exact required nutrients.'
                ]
            };
        }

        return { fallback: true, message: "AI API unavailable due to quota limits." };
    }
}

async function analyzeImageWithAI(base64Image, systemPrompt, userPrompt) {
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENROUTER_API_KEY && !OPENAI_API_KEY) {
        throw new Error('No AI API key configured');
    }

    const messages = [
        { role: 'system', content: systemPrompt },
        {
            role: 'user',
            content: [
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
                { type: 'text', text: userPrompt }
            ]
        }
    ];

    const visionModels = ['google/gemini-2.0-flash-001', 'google/gemini-2.5-flash-preview'];

    if (OPENROUTER_API_KEY) {
        for (const model of visionModels) {
            try {
                console.log(`Trying vision model: ${model}`);
                const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                    model,
                    messages,
                    temperature: 0.1,
                    response_format: { type: 'json_object' }
                }, {
                    headers: {
                        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'http://localhost:5173',
                        'X-Title': 'KrishiMitra AI'
                    },
                    timeout: 30000
                });
                return response.data.choices[0].message.content;
            } catch (e) {
                console.error(`Vision model ${model} failed:`, e.response?.data?.error?.message || e.message);
                continue;
            }
        }
    }

    if (OPENAI_API_KEY) {
        try {
            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-4o',
                messages,
                max_tokens: 1000,
                temperature: 0.3
            }, {
                headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' }
            });
            return response.data.choices[0].message.content;
        } catch (e) {
            console.error('OpenAI Vision failed:', e.response?.data?.error?.message || e.message);
        }
    }

    throw new Error('All AI Vision providers failed or quotas exceeded.');
}

module.exports = { chat, generateJSON, analyzeImageWithAI };
