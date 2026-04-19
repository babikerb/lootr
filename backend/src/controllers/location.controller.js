import { saveLaunchLocationToDB } from '../services/db.service.js';

export const saveLaunchLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ error: 'latitude and longitude are required numbers' });
    }

    const savedLocation = await saveLaunchLocationToDB(latitude, longitude);
    console.log(
      `[SERVER] Saved launch location ${savedLocation.id} at [${savedLocation.latitude}, ${savedLocation.longitude}]`
    );

    res.status(201).json(savedLocation);
  } catch (error) {
    console.error('[SERVER] Failed to save launch location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
