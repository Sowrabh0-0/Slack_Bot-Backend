import express from 'express';
import { handleInteractivity } from '../controllers/interactivityController.js';

const router = express.Router();

// Route for handling interactivity
router.post('/interactivity', handleInteractivity);

export default router;
