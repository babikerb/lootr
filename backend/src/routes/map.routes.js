import express from 'express';
import { getMapGames, placeGameOnMap } from '../controllers/map.controller.js';

const router = express.Router();

// GET /api/v1/map
router.get('/', getMapGames);

// POST /api/v1/map/place
router.post('/place', placeGameOnMap);

export default router;
