import { identifyObject, generateGameConfig } from '../services/groq.service.js';

export async function scanObject(req, res) {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'image is required' });

    console.log(`[SCAN] Image received — base64 length: ${image.length} (~${Math.round(image.length * 0.75 / 1024)}KB)`);
    console.log('[SCAN] Identifying object...');
    const objectLabel = await identifyObject(image);
    console.log(`[SCAN] Object identified: "${objectLabel}"`);

    const gameConfig = await generateGameConfig(objectLabel);
    console.log('[SCAN] Game config generated:');
    console.log(JSON.stringify(gameConfig, null, 2));

    res.json({ objectLabel, gameConfig });
  } catch (error) {
    console.error('[SCAN] Unhandled error:', error.message);
    res.status(500).json({ error: 'Scan failed' });
  }
}
