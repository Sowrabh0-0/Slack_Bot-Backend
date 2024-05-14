import express from 'express';
import { handleInteractivity } from '../controllers/interactivityController.js';

const router = express.Router();

router.post('/interactivity', handleInteractivity);

export default router;
