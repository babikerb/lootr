import express from 'express';
import { generateGame } from '../controllers/game.controller.js';

const router = express.Router();

// POST /api/v1/game/generate
router.post('/generate', generateGame);

export default router;