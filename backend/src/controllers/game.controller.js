import { generateGameConfig } from '../services/groq.service.js';

export const generateGame = async (req, res) => {
  try {
    const { objectLabel } = req.body;
    
    if (!objectLabel) {
      return res.status(400).json({ error: "Missing objectLabel in request body" });
    }

    // Call LLM service
    const gameConfig = await generateGameConfig(objectLabel);
    
    // Return the generated JSON 
    res.status(200).json(gameConfig);
  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};