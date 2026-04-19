import pool from '../utils/db.js';

export const saveGameToDB = async (objectLabel, gameConfig) => {
  try {
    const query = `
      INSERT INTO games (object_label, game_type, title, rules, parameters)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    
    // $1, $2 syntax prevents SQL injection attacks
    const values = [
      objectLabel,
      gameConfig.gameType,
      gameConfig.title,
      JSON.stringify(gameConfig.rules),
      JSON.stringify(gameConfig.parameters)
    ];

    const result = await pool.query(query, values);
    return result.rows[0]; // Returns the newly saved game 
    
  } catch (error) {
    console.error("[DB] Error saving game to database:", error);
    throw error;
  }
};