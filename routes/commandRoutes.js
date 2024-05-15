import express from 'express';
import { handleCommand } from '../controllers/commandController.js';

const router = express.Router();

// Route for handling commands
router.post('/commands', handleCommand);

export default router;
