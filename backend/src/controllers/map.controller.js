import { addGameToArcGIS } from '../services/arcgis.service.js';
import { getMapGamesFromDB, updateGameLocationInDB } from '../services/db.service.js';

export const getMapGames = async (_req, res) => {
  try {
    const games = await getMapGamesFromDB();
    res.status(200).json(games);
  } catch (error) {
    console.error('[SERVER] Failed to fetch map games:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const placeGameOnMap = async (req, res) => {
  try {
    const { gameId, latitude, longitude } = req.body;

    if (!Number.isInteger(gameId)) {
      return res.status(400).json({ error: 'gameId is required and must be an integer' });
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ error: 'latitude and longitude are required numbers' });
    }

    const updatedGame = await updateGameLocationInDB(gameId, latitude, longitude);

    if (!updatedGame) {
      return res.status(404).json({ error: 'Game not found' });
    }

    await addGameToArcGIS(updatedGame);

    console.log(
      `[SERVER] Placed game ${updatedGame.id} at [${updatedGame.latitude}, ${updatedGame.longitude}]`
    );

    res.status(200).json(updatedGame);
  } catch (error) {
    console.error('[SERVER] Failed to place game on map:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
