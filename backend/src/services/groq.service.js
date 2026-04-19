import Groq from 'groq-sdk';
import { generateSystemPrompt } from '../utils/prompts.js';
import { GameConfigSchema, FALLBACK_CONFIG } from '../utils/validation.js';

export async function identifyObject(base64Image) {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const response = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64Image}` },
            },
            {
              type: 'text',
              text: 'Identify the single most prominent physical object in this image. Reply with ONLY the object name, 1-3 words, no punctuation, no explanation. Examples: "water bottle", "basketball", "coffee mug".',
            },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 20,
    });
    const label = response.choices[0]?.message?.content?.trim() || 'unknown object';
    return label;
  } catch (error) {
    console.error('[SCAN] Vision model error:', error.message);
    console.error('[SCAN] Full error:', JSON.stringify(error, null, 2));
    return 'unknown object';
  }
}

export async function generateGameConfig(objectLabel) {
  try {

    console.log("[DEBUG] API Key Check:", process.env.GROQ_API_KEY ? "Key Found!" : "KEY MISSING");

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: generateSystemPrompt() }, 
        { role: 'user', content: `<input>${objectLabel}</input>` }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const rawContent = chatCompletion.choices[0]?.message?.content;
    const parsedJson = JSON.parse(rawContent);
    
    // Validate with Zod
    return GameConfigSchema.parse(parsedJson);

  } catch (error) {
    console.error("CRITICAL LLM/VALIDATION ERROR");
    console.error("LLM Error:", error.message);
    // Return the imported fallback
    return FALLBACK_CONFIG;
  }
}