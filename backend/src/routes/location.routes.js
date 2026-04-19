import express from 'express';
import { saveLaunchLocation } from '../controllers/location.controller.js';

const router = express.Router();

router.post('/', saveLaunchLocation);

export default router;
