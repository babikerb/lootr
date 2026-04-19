import express from 'express';
import { generateGame, getGames, getNearbyGames } from '../controllers/game.controller.js';

const router = express.Router();

// POST /api/v1/game/generate
router.post('/generate', generateGame);
router.get('/', getGames);
router.get('/nearby', getNearbyGames);

export default router;