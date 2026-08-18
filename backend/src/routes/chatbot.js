const express = require('express');

const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyB29Wzln-1xkDBe4-mE2689AP7PvL4bbGI";

// Call Gemini REST API directly
async function queryGemini(prompt, language = 'English') {
  const systemInstruction = `You are Swasthi AI, a friendly, human-like medical assistant for migrant workers in Kerala.
Respond naturally in the user's requested language (${language}).
RULES FOR RESPONSE FORMATTING:
1. Do NOT use markdown headers (like ## or ###).
2. Do NOT use asterisks for bolding or bullet points (avoid *, **, ***).
3. Do NOT use markdown symbols or markdown formatting.
4. Speak in clean, plain conversational text with natural emojis like a real WhatsApp/chat bot.
5. Keep paragraphs short and friendly.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${systemInstruction}\n\nUser Question: ${prompt}` }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      let text = data.candidates[0].content.parts[0].text;
      // Clean up any stray markdown headers (#) or asterisks (*)
      text = text.replace(/#+\s*/g, '')
                 .replace(/\*+/g, '')
                 .replace(/_+/g, '');
      return text.trim();
    }
  } catch (err) {
    console.error('Gemini API call failed:', err);
  }
  return null;
}

// POST /api/chatbot/message
router.post('/message', async (req, res) => {
  try {
    const { message, language = 'English' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Try Gemini AI response first
    let aiResponse = await queryGemini(message, language);

    // Fallback if AI call fails or key limit reached
    if (!aiResponse) {
      const langFallback = {
        'Tamil': 'வணக்கம்! நான் Swasthi உதவியாளர். உங்களுக்கு எப்படி உதவ வேண்டும்?',
        'Malayalam': 'നമസ്കാരം! ഞാൻ Swasthi Assistant ആണ്. നിങ്ങൾക്ക് എങ്ങനെ സഹായിക്കണം?',
        'Hindi': 'नमस्ते! मैं Swasthi Assistant हूं। मैं आपकी क्या मदद कर सकता हूं?'
      };
      aiResponse = langFallback[language] || `Hello! I am Swasthi Assistant. How can I help you with your health today?`;
    }

    res.json({
      intent: 'AI_CHAT',
      message: aiResponse,
      suggestions: ['Find nearby hospital', 'Show my health record', 'Set medicine reminder'],
      language,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Chatbot error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
