const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');

const LM_STUDIO_API_URL = 'http://localhost:8080/api/v1/generate'; // Example LM Studio API endpoint, adjust as needed
const MODEL_NAME = 'google/gemma-3-12b';

async function classifySensitivity(fieldName) {
  try {
    // Prepare prompt for classification
    const prompt = `Classify the sensitivity of the following form field label on a scale of 0 to 100, where 0 is not sensitive and 100 is highly sensitive. Return only the number.\nField label: "${fieldName}"\nSensitivity score:`;

    // Call LM Studio model API
    const response = await axios.post(LM_STUDIO_API_URL, {
      model: MODEL_NAME,
      prompt: prompt,
      max_tokens: 5,
      temperature: 0,
      top_p: 1,
      n: 1,
      stop: ['\n']
    });

    if (response.data && response.data.generations && response.data.generations.length > 0) {
      const text = response.data.generations[0].text.trim();
      const score = parseInt(text, 10);
      if (!isNaN(score) && score >= 0 && score <= 100) {
        return score;
      }
    }
    // Fallback if parsing fails
    return 10;
  } catch (error) {
    console.error('Error calling LM Studio model:', error);
    // Fallback sensitivity score on error
    return 10;
  }
}

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/classify', async (req, res) => {
  const { fieldName } = req.body;
  if (!fieldName) {
    return res.status(400).json({ error: 'fieldName is required' });
  }
  try {
    const sensitivity = await classifySensitivity(fieldName);
    res.json({ sensitivity });
  } catch (error) {
    console.error('Error classifying sensitivity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Local LLM classification server running on port ${PORT}`);
});
