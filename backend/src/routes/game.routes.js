import express from 'express';
import { generateGame, getGames } from '../controllers/game.controller.js';

const router = express.Router();

// POST /api/v1/game/generate
router.post('/generate', generateGame);
router.get('/', getGames);

export default router;