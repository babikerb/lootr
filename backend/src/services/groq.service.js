import Groq from 'groq-sdk';
import { getIconForObject } from '../utils/iconMapping.js';
import { generateSystemPrompt } from '../utils/prompts.js';
import { FALLBACK_CONFIG, GameConfigSchema } from '../utils/validation.js';

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
    let parsedJson = JSON.parse(rawContent);
    
    // Validate with Zod
    const validated = GameConfigSchema.parse(parsedJson);

    // Apply icon override: if the LLM returned an icon, validate it
    // If it looks wrong, use our intelligent fallback based on the object label
    if (validated.icon && validated.icon.name) {
      // Check if icon is in our verified mapping (basic sanity check)
      // For now, trust the LLM but log warnings for invalid-looking icons
      const mappedIcon = getIconForObject(objectLabel);
      console.log(`[DEBUG] LLM icon: ${validated.icon.library}:${validated.icon.name}`);
      console.log(`[DEBUG] Mapped icon: ${mappedIcon.library}:${mappedIcon.name}`);
      
      // Force mci library always
      validated.icon.library = 'mci';
      // If LLM icon seems generic/fallback, replace with our mapping
      if (validated.icon.name === 'cube-outline' || validated.icon.name === 'cube' || validated.icon.name === 'help') {
        console.log(`[DEBUG] Replacing generic icon with mapped icon`);
        validated.icon = mappedIcon;
      }
    }

    return validated;

  } catch (error) {
    console.error("CRITICAL LLM/VALIDATION ERROR");
    console.error("LLM Error:", error.message);
    
    // Return a smarter fallback: use the icon mapping
    const smartFallback = {
      ...FALLBACK_CONFIG,
      icon: getIconForObject(objectLabel)
    };
    
    return smartFallback;
  }
}