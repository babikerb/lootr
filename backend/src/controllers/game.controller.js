import { generateGameConfig } from '../services/groq.service.js';
import { saveGameToDB, getAllGamesFromDB } from '../services/db.service.js';
import { addGameToArcGIS } from '../services/arcgis.service.js';

export const generateGame = async (req, res) => {
  try {
    // Grab latitude and longitude from the incoming request
    const { objectLabel, latitude, longitude } = req.body;
    console.log(`[SERVER] 🔍 Received request for: "${objectLabel}" at [${latitude}, ${longitude}]`);
    
    if (!objectLabel) {
      return res.status(400).json({ error: "Missing objectLabel in request body" });
    }

    // Call LLM service
    const gameConfig = await generateGameConfig(objectLabel);
    console.log(`[SERVER] AI generated: ${gameConfig.title}`);

    // Save to database
    const savedGame = await saveGameToDB(objectLabel, gameConfig, latitude, longitude);
    console.log(`[SERVER] 💾 Game successfully saved to database with ID: ${savedGame.id}`);

    addGameToArcGIS(savedGame);

    // Send full saved game back to client
    res.status(200).json(savedGame);

  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getGames = async (req, res) => {
  try {
    console.log(`[SERVER] Fetching all games from database...`);
    const games = await getAllGamesFromDB();
    res.status(200).json(games);
  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};