const express = require('express');
const router = express.Router();
const multer = require('multer');
const diseaseDetectionService = require('../services/diseaseDetectionService');
const aiService = require('../services/aiService');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/disease/identify (image upload)
router.post('/identify', upload.single('image'), async (req, res) => {
    try {
        if (!req.file && !req.body.imageBase64) {
            return res.status(400).json({ success: false, message: 'No image provided' });
        }

        let base64Image;
        if (req.file) {
            base64Image = req.file.buffer.toString('base64');
        } else {
            base64Image = req.body.imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
        }

        const result = await diseaseDetectionService.analyzePlantImage(base64Image);
        res.json({ success: true, ...result });
    } catch (err) {
        console.error('Disease detection error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/disease/analyze-symptoms
router.post('/analyze-symptoms', async (req, res) => {
    try {
        const { crop, symptoms, affectedPart } = req.body;

        const prompt = `You are an expert plant pathologist. Analyze these symptoms and diagnose the disease.

Crop: ${crop}
Symptoms: ${Array.isArray(symptoms) ? symptoms.join(', ') : symptoms}
Affected Part: ${affectedPart}

Respond ONLY with valid JSON:
{
  "disease": "Disease Name",
  "confidence": 85,
  "type": "Fungal/Bacterial/Viral/Pest",
  "severity": "low/medium/high",
  "causes": "cause description",
  "treatment": ["treatment 1", "treatment 2", "treatment 3"],
  "prevention": ["prevention 1", "prevention 2"],
  "alternatives": ["Alternative disease 1", "Alternative disease 2"]
}`;

        try {
            const diagnosis = await aiService.generateJSON(prompt);
            return res.json({ success: true, ...diagnosis });
        } catch (aiErr) {
            console.error('AI Symptom Analysis failed, trying DB search:', aiErr.message);

            // Search MongoDB for matching crop and symptoms
            const Diseases = require('../models/Disease');
            const possibleDiseases = await Diseases.find({ crop: new RegExp(crop, 'i') });

            if (possibleDiseases.length > 0) {
                // Find best match based on symptom and part overlap
                const scores = possibleDiseases.map(d => {
                    let score = 0;
                    // Symptom matching (each match +2)
                    symptoms.forEach(s => {
                        if (d.symptoms.some(ds => ds.toLowerCase().includes(s.toLowerCase()))) score += 2;
                    });
                    // Part matching (match +1)
                    if (affectedPart && d.affects && d.affects.some(p => p.toLowerCase() === affectedPart.toLowerCase())) {
                        score += 1;
                    }
                    return { disease: d, score };
                });

                scores.sort((a, b) => b.score - a.score);
                const bestMatch = scores[0].disease;

                if (scores[0].score > 0) {
                    return res.json({
                        success: true,
                        disease: bestMatch.disease,
                        confidence: 70 + (scores[0].score * 5), // Estimated confidence
                        type: bestMatch.type,
                        severity: bestMatch.severity,
                        causes: bestMatch.causes,
                        treatment: bestMatch.treatment,
                        prevention: bestMatch.prevention,
                        voiceSuggestion: `Based on your observations, this looks like ${bestMatch.disease}. It is a common issue for ${crop}.`,
                        dbMatch: true
                    });
                }
            }

            res.status(503).json({ success: false, message: 'AI and Database diagnostic services currently unavailable.' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
