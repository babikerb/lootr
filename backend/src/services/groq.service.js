import Groq from 'groq-sdk';
import { generateSystemPrompt } from '../utils/prompts.js'; 
import { GameConfigSchema, FALLBACK_CONFIG } from '../utils/validation.js';

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