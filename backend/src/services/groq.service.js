import Groq from 'groq-sdk';
import { generateSystemPrompt } from '../utils/prompts.js'; 
import { GameConfigSchema, FALLBACK_CONFIG } from '../utils/validation.js';

export async function generateGameConfig(objectLabel) {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: generateSystemPrompt() }, 
        { role: 'user', content: `<input>${objectLabel}</input>` }
      ],
      model: 'llama3-8b-8192',
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const rawContent = chatCompletion.choices[0]?.message?.content;
    const parsedJson = JSON.parse(rawContent);
    
    // Validate with Zod
    return GameConfigSchema.parse(parsedJson);

  } catch (error) {
    console.error("LLM Error:", error.message);
    // Return the imported fallback
    return FALLBACK_CONFIG;
  }
}