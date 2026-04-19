import pool from '../utils/db.js';

let launchLocationsTableReadyPromise;

const ensureLaunchLocationsTable = async () => {
  if (!launchLocationsTableReadyPromise) {
    launchLocationsTableReadyPromise = pool.query(`
      CREATE TABLE IF NOT EXISTS launch_locations (
        id SERIAL PRIMARY KEY,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  }

  await launchLocationsTableReadyPromise;
};

export const saveGameToDB = async (objectLabel, gameConfig, latitude, longitude) => {
  try {
    const query = `
      INSERT INTO games (object_label, game_type, title, rules, parameters, latitude, longitude)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    
    const values = [
      objectLabel,
      gameConfig.gameType,
      gameConfig.title,
      JSON.stringify(gameConfig.rules),
      JSON.stringify(gameConfig.parameters),
      latitude || null,   // Accept null if the user hasn't granted location permissions yet
      longitude || null
    ];

    const result = await pool.query(query, values);
    return result.rows[0]; // Returns the newly saved game 
    
  } catch (error) {
    console.error("[DB] Error saving game to database:", error);
    throw error;
  }
};

export const getAllGamesFromDB = async () => {
  try {
    // Fetch all games, ordering by the newest first
    const result = await pool.query('SELECT * FROM games ORDER BY created_at DESC');
    return result.rows;
  } catch (error) {
    console.error("[DB] Error fetching games:", error);
    throw error;
  }
};

export const saveLaunchLocationToDB = async (latitude, longitude) => {
  try {
    await ensureLaunchLocationsTable();

    const result = await pool.query(
      `
        INSERT INTO launch_locations (latitude, longitude)
        VALUES ($1, $2)
        RETURNING *;
      `,
      [latitude, longitude]
    );

    return result.rows[0];
  } catch (error) {
    console.error('[DB] Error saving launch location:', error);
    throw error;
  }
};
