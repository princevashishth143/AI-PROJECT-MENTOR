const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use(express.static(path.join(__dirname)));

const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.post('/api/chat', async (req, res) => {
  try {
    const { message, mode, projectName, image } = req.body;
    
    if (!message && !image) {
      return res.status(400).json({ error: 'Message or image is required' });
    }

    if (!GROQ_API_KEY) {
      return res.status(500).json({ error: 'GROQ_API_KEY is missing in environment variables on Render.' });
    }

    let userContent = message || "Analyze this image.";
    
    let messagesList = [
      {
        role: "system",
        content: `You are a strict and concise AI Project Mentor for "${projectName || 'Software Project'}". Give extremely short, direct, and crisp answers in the language the user speaks. Avoid long paragraphs, extra details, or stories.`
      }
    ];

    if (image) {
      messagesList.push({
        role: "user",
        content: [
          { type: "text", text: userContent },
          { type: "image_url", image_url: { url: image } }
        ]
      });
    } else {
      messagesList.push({
        role: "user",
        content: userContent
      });
    }

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: messagesList,
        stream: false
      })
    });

    const data = await groqResponse.json();

    if (!groqResponse.ok) {
      throw new Error(data.error?.message || 'Failed to communicate with Groq API');
    }

    const reply = data.choices[0].message.content;
    res.json({ reply });

  } catch (err) {
    console.error('Groq API Error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});