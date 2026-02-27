const mongoose = require('mongoose');

const diseaseSchema = new mongoose.Schema({
    disease: { type: String, required: true },
    crop: { type: String, required: true },
    confidence: { type: Number, default: 85 },
    severity: { type: String, enum: ['low', 'medium', 'high', 'none'] },
    type: { type: String, enum: ['Fungal', 'Bacterial', 'Viral', 'Pest', 'Deficiency', 'Abiotic', 'Nutritional', 'Algal', 'None'] },
    symptoms: [String],
    causes: String,
    affects: [String],
    treatment: [String],
    prevention: [String]
});

module.exports = mongoose.model('Disease', diseaseSchema);
