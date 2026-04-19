import { Router } from 'express';
import { scanObject } from '../controllers/scan.controller.js';

const router = Router();
router.post('/', scanObject);
export default router;
