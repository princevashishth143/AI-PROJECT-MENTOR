const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname)));

// यहाँ हम OpenAI की API Key लेंगे
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post('/api/chat', async (req, res) => {
  try {
    const { message, mode, projectName } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY is missing in environment variables on Render.' });
    }

    // OpenAI API को डायरेक्ट फेच (fetch) से कॉल करना (GPT-4o-mini या GPT-3.5-turbo का इस्तेमाल)
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // सबसे तेज, किफायती और बढ़िया मॉडल
        messages: [
          {
            role: "system",
            content: `You are an expert AI Project Mentor for the project "${projectName || 'Software Project'}". Provide thorough, detailed, and complete answers to help the user with coding, logic, architecture, and debugging in the language the user speaks.`
          },
          {
            role: "user",
            content: message
          }
        ],
        stream: false
      })
    });

    const data = await openaiResponse.json();

    if (!openaiResponse.ok) {
      throw new Error(data.error?.message || 'Failed to communicate with OpenAI API');
    }

    const reply = data.choices[0].message.content;
    res.json({ reply });

  } catch (err) {
    console.error('OpenAI API Error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});