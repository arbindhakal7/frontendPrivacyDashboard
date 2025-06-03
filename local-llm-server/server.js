const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Placeholder for LLM model integration
// Replace this with actual Gemma 4B or other local LLM model inference code
async function classifySensitivity(fieldName) {
  // Simulate classification with dummy logic
  const lower = fieldName.toLowerCase();
  if (/(password|pwd|pass)/i.test(lower)) return 100;
  if (/(ssn|social|security)/i.test(lower)) return 100;
  if (/(credit|card|cvv|ccv|cc)/i.test(lower)) return 100;
  if (/(email|e-mail|mail)/i.test(lower)) return 80;
  if (/(phone|mobile|tel|tele)/i.test(lower)) return 80;
  if (/(address|location|city|country|zip|postal)/i.test(lower)) return 70;
  if (/(birth|dob|birthday)/i.test(lower)) return 70;
  if (/(account|bank|routing|swift|iban)/i.test(lower)) return 90;
  if (/(health|medical|diagnosis|prescription)/i.test(lower)) return 90;
  if (/(name|fullname|firstname|lastname)/i.test(lower)) return 40;
  return 10; // low sensitivity
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
