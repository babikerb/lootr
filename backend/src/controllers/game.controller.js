import { generateGameConfig } from '../services/groq.service.js';
import { saveGameToDB } from '../services/db.service.js';

export const generateGame = async (req, res) => {
  try {
    const { objectLabel } = req.body;
    console.log(`[SERVER] Received request to generate game for: "${objectLabel}"`);
    
    if (!objectLabel) {
      return res.status(400).json({ error: "Missing objectLabel in request body" });
    }

    // Call LLM service
    const gameConfig = await generateGameConfig(objectLabel);
    console.log(`[SERVER] AI generated: ${gameConfig.title}`);

    // Save to database
    const savedGame = await saveGameToDB(objectLabel, gameConfig);
    console.log(`[SERVER] 💾 Game successfully saved to database with ID: ${savedGame.id}`);

    // Send full saved game back to client
    res.status(200).json(savedGame);

  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};