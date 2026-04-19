import { identifyObject, generateGameConfig } from '../services/groq.service.js';
import { saveGameToDB } from '../services/db.service.js';
import { addGameToArcGIS } from '../services/arcgis.service.js';

export async function scanObject(req, res) {
  try {
    const { image, latitude, longitude } = req.body;
    if (!image) return res.status(400).json({ error: 'image is required' });

    console.log(`[SCAN] Image received — base64 length: ${image.length} (~${Math.round(image.length * 0.75 / 1024)}KB)`);
    console.log('[SCAN] Identifying object...');
    const objectLabel = await identifyObject(image);
    console.log(`[SCAN] Object identified: "${objectLabel}"`);

    const gameConfig = await generateGameConfig(objectLabel);
    console.log('[SCAN] Game config generated:');
    console.log(JSON.stringify(gameConfig, null, 2));

    const savedGame = await saveGameToDB(objectLabel, gameConfig, latitude, longitude);
    console.log(`[SCAN] Game saved to database with ID: ${savedGame.id}`);

    addGameToArcGIS(savedGame);

    res.json({ objectLabel, gameConfig, savedGame });
  } catch (error) {
    console.error('[SCAN] Unhandled error:', error.message);
    res.status(500).json({ error: 'Scan failed' });
  }
}
